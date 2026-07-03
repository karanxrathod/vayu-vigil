import { Router, Request, Response } from 'express';
import { query, execute } from '../db';
import { optionalAuth, authenticate, authorizeRoles, getEnforcedWardId } from '../middleware/auth';
import { runScoringJob } from '../services/scoring.service';

const router = Router();

/**
 * GET /hotspots
 * Returns ranked hotspot list sorted by risk score descending, with forecast trend indicator.
 */
router.get('/', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { city_id, ward_id } = req.query;
    const enforcedWardId = getEnforcedWardId(req, ward_id as string);

    // Get all grid cells
    let sql = `SELECT * FROM grid_cell WHERE 1=1`;
    const params: any[] = [];
    let paramIndex = 1;

    if (enforcedWardId) {
      sql += ` AND ward_id = $${paramIndex++}`;
      params.push(enforcedWardId);
    }
    if (city_id) {
      sql += ` AND city_id = $${paramIndex++}`;
      params.push(city_id);
    }

    const cells = await query(sql, params);

    const hotspots = await Promise.all(
      cells.map(async (cell) => {
        // Get latest score
        const scores = await query(
          `SELECT * FROM hotspot_score WHERE grid_cell_id = $1 ORDER BY timestamp DESC LIMIT 1`,
          [cell.id]
        );
        const score = scores[0] || {
          risk_score: 35.0,
          dominant_category: 'other',
          pm25_component: 20.0,
          complaint_component: 10.0,
          severity_component: 40.0,
          satellite_component: 0.0,
          timestamp: new Date().toISOString()
        };

        // Get forecast series
        const forecasts = await query(
          `SELECT forecast_24h_series FROM hotspot_forecast WHERE grid_cell_id = $1 ORDER BY created_at DESC LIMIT 1`,
          [cell.id]
        );
        let forecastSeries: any[] = [];
        let trendIndicator: '↑' | '→' | '↓' = '→';

        if (forecasts && forecasts.length > 0 && forecasts[0].forecast_24h_series) {
          try {
            forecastSeries = JSON.parse(forecasts[0].forecast_24h_series);
            if (forecastSeries.length >= 6) {
              const current = Number(score.risk_score);
              const future6h = Number(forecastSeries[5].predicted_score);
              if (future6h - current > 3.0) trendIndicator = '↑';
              else if (current - future6h > 3.0) trendIndicator = '↓';
              else trendIndicator = '→';
            }
          } catch (e) {
            // ignore JSON parse error
          }
        }

        // Determine severity level
        const risk = Number(score.risk_score);
        const severity = risk >= 80 ? 'critical' : risk >= 50 ? 'moderate' : 'low';

        // Count linked unresolved reports
        const reportsCount = await query(
          `SELECT COUNT(*) as cnt FROM report WHERE ward_id = $1 AND status != 'resolved'`,
          [cell.ward_id]
        );

        // Get status of linked reports (if any report is inspecting, status is inspecting; if all resolved, resolved; else new)
        const activeReports = await query(
          `SELECT status FROM report WHERE ward_id = $1 ORDER BY updated_at DESC LIMIT 5`,
          [cell.ward_id]
        );
        let status = 'new';
        if (activeReports.some(r => r.status === 'inspecting')) status = 'inspecting';
        else if (activeReports.length > 0 && activeReports.every(r => r.status === 'resolved')) status = 'resolved';

        return {
          id: cell.id,
          name: cell.name,
          ward_id: cell.ward_id,
          city_id: cell.city_id,
          centroid_lat: cell.centroid_lat,
          centroid_lon: cell.centroid_lon,
          risk_score: risk,
          severity,
          trend_indicator: trendIndicator,
          dominant_category: score.dominant_category || 'other',
          active_reports_count: Number(reportsCount[0]?.cnt || 0),
          status,
          last_updated: score.timestamp,
          components: {
            pm25: score.pm25_component,
            complaint: score.complaint_component,
            severity: score.severity_component,
            satellite: score.satellite_component
          }
        };
      })
    );

    // Sort descending by risk score
    hotspots.sort((a, b) => b.risk_score - a.risk_score);

    res.status(200).json({ hotspots });
  } catch (err) {
    console.error('Error fetching hotspots:', err);
    res.status(500).json({ error: 'Failed to fetch hotspot list' });
  }
});

/**
 * GET /hotspots/:id
 * Hotspot detail view: linked reports, sensor trend chart + 24h forecast series, status controls.
 */
router.get('/:id', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const cells = await query('SELECT * FROM grid_cell WHERE id = $1', [id]);
    const cell = cells[0];
    if (!cell) {
      res.status(404).json({ error: 'Hotspot grid cell not found' });
      return;
    }

    // Check ward isolation
    const enforcedWardId = getEnforcedWardId(req);
    if (enforcedWardId && enforcedWardId !== cell.ward_id) {
      res.status(403).json({ error: 'Forbidden: Cannot access hotspot data outside your assigned ward' });
      return;
    }

    // Get latest score
    const scores = await query(
      `SELECT * FROM hotspot_score WHERE grid_cell_id = $1 ORDER BY timestamp DESC LIMIT 1`,
      [cell.id]
    );
    const score = scores[0] || { risk_score: 35.0, dominant_category: 'other' };

    // Get forecast series
    const forecasts = await query(
      `SELECT forecast_24h_series FROM hotspot_forecast WHERE grid_cell_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [cell.id]
    );
    let forecastSeries: any[] = [];
    if (forecasts && forecasts.length > 0 && forecasts[0].forecast_24h_series) {
      try {
        forecastSeries = JSON.parse(forecasts[0].forecast_24h_series);
      } catch (e) {}
    }

    // Get linked reports in this ward
    const reports = await query(
      `SELECT id, tracking_id, category, description, photo_url, lat, lon, ai_confidence, status, action_taken, created_at 
       FROM report WHERE ward_id = $1 ORDER BY created_at DESC LIMIT 20`,
      [cell.ward_id]
    );

    // Get sensor trend chart data (last 12 readings)
    const sensorReadings = await query(
      `SELECT timestamp, pm25, pm10, is_spike FROM sensor_reading 
       WHERE ward_id = $1 ORDER BY timestamp ASC LIMIT 24`,
      [cell.ward_id]
    );

    // Build combined chart data for Recharts (Historical PM2.5/score + Forecast dashed line)
    const chartData: any[] = [];
    for (const r of sensorReadings) {
      chartData.push({
        time: new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timestamp: r.timestamp,
        historical_pm25: Number(r.pm25),
        historical_score: Math.min(Math.round((Number(r.pm25) / 250) * 80 + 15), 100),
        forecast_score: null
      });
    }

    // Add forecast points
    if (forecastSeries.length > 0) {
      // Connect last historical point to first forecast point
      if (chartData.length > 0) {
        const last = chartData[chartData.length - 1];
        last.forecast_score = last.historical_score;
      }
      for (let i = 0; i < Math.min(forecastSeries.length, 12); i += 2) {
        const fp = forecastSeries[i];
        chartData.push({
          time: new Date(fp.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timestamp: fp.timestamp,
          historical_pm25: null,
          historical_score: null,
          forecast_score: Number(fp.predicted_score)
        });
      }
    }

    // Determine status
    let status = 'new';
    if (reports.some(r => r.status === 'inspecting')) status = 'inspecting';
    else if (reports.length > 0 && reports.every(r => r.status === 'resolved')) status = 'resolved';

    res.status(200).json({
      hotspot: {
        id: cell.id,
        name: cell.name,
        ward_id: cell.ward_id,
        city_id: cell.city_id,
        centroid_lat: cell.centroid_lat,
        centroid_lon: cell.centroid_lon,
        risk_score: Number(score.risk_score),
        severity: Number(score.risk_score) >= 80 ? 'critical' : Number(score.risk_score) >= 50 ? 'moderate' : 'low',
        dominant_category: score.dominant_category,
        status,
        components: {
          pm25: score.pm25_component,
          complaint: score.complaint_component,
          severity: score.severity_component,
          satellite: score.satellite_component
        },
        linked_reports: reports,
        chart_data: chartData,
        forecast_series: forecastSeries
      }
    });
  } catch (err) {
    console.error('Error fetching hotspot detail:', err);
    res.status(500).json({ error: 'Failed to fetch hotspot details' });
  }
});

/**
 * PATCH /hotspots/:id/status
 * Officer updates status (New -> Inspecting -> Resolved) and logs intervention action.
 */
router.patch('/:id/status', authenticate, authorizeRoles('officer', 'admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, action_taken, assigned_officer_id } = req.body;

    if (!['new', 'inspecting', 'resolved'].includes(status)) {
      res.status(400).json({ error: "Status must be 'new', 'inspecting', or 'resolved'" });
      return;
    }

    const cells = await query('SELECT * FROM grid_cell WHERE id = $1', [id]);
    const cell = cells[0];
    if (!cell) {
      res.status(404).json({ error: 'Hotspot grid cell not found' });
      return;
    }

    // Enforce ward isolation
    if (req.user?.role === 'officer' && req.user.ward_id !== cell.ward_id) {
      res.status(403).json({ error: 'Forbidden: Cannot update status for a hotspot outside your assigned ward' });
      return;
    }

    const timestamp = new Date().toISOString();
    const officerId = assigned_officer_id || req.user?.id || null;
    const actionLog = action_taken || `Status updated to ${status.toUpperCase()} by Municipal Officer`;

    // Update all linked active reports in this ward
    await execute(
      `UPDATE report SET status = $1, action_taken = $2, assigned_officer_id = $3, updated_at = $4 
       WHERE ward_id = $5 AND status != 'resolved'`,
      [status, actionLog, officerId, timestamp, cell.ward_id]
    );

    // If resolved, update alert status too
    if (status === 'resolved') {
      await execute(
        `UPDATE alert SET status = 'resolved' WHERE grid_cell_id = $1 AND status = 'active'`,
        [cell.id]
      );
    }

    // Re-run scoring job
    await runScoringJob();

    console.log(`[ACTION LOG] Hotspot ${cell.name} (${id}) marked as ${status.toUpperCase()}. Action: "${actionLog}"`);

    res.status(200).json({
      success: true,
      message: `Hotspot status updated to ${status}`,
      status,
      action_taken: actionLog,
      updated_at: timestamp
    });
  } catch (err) {
    console.error('Error updating hotspot status:', err);
    res.status(500).json({ error: 'Failed to update hotspot status' });
  }
});

export default router;
