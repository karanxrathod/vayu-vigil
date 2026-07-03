import { query, execute } from '../db';
import { runForecastForGridCell } from './forecast.service';
import { FleetService } from './fleet.service';
import crypto from 'crypto';

export interface GridCellScore {
  id: string;
  grid_cell_id: string;
  ward_id: string;
  city_id: string;
  risk_score: number;
  pm25_component: number;
  complaint_component: number;
  severity_component: number;
  satellite_component: number;
  dominant_category: string;
  timestamp: string;
}

/**
 * Hotspot Scoring Engine
 * 
 * Aggregates citizen reports + sensor readings into grid cells and computes risk_score:
 * risk_score = 0.5 * normalized_avg_pm25_last_2h
 *            + 0.3 * normalized_complaint_count_last_6h
 *            + 0.15 * severity_weight(dominant_category)
 *            + 0.05 * satellite_thermal_anomaly_flag
 * 
 * Thresholds: >=80 critical (auto-alert), 50-79 moderate, <50 low.
 */
export async function runScoringJob(): Promise<void> {
  console.log('--- Running Hotspot Scoring Engine Job ---');
  try {
    const gridCells = await query('SELECT * FROM grid_cell');
    if (!gridCells || gridCells.length === 0) {
      console.warn('No grid cells found to score.');
      return;
    }

    for (const cell of gridCells) {
      await scoreGridCell(cell);
    }
    console.log(`--- Completed scoring for ${gridCells.length} grid cells ---`);
  } catch (err) {
    console.error('Error running Hotspot Scoring Job:', err);
  }
}

export async function scoreGridCell(cell: any): Promise<GridCellScore> {
  const now = new Date();
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString();
  const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString();

  // 1. Get average PM2.5 in last 2 hours for sensors within bbox or ward
  const sensorReadings = await query(
    `SELECT AVG(pm25) as avg_pm25 FROM sensor_reading 
     WHERE ward_id = $1 AND timestamp >= $2`,
    [cell.ward_id, twoHoursAgo]
  );
  let avgPm25 = sensorReadings[0]?.avg_pm25 || 0;
  
  // If no readings in last 2 hours, get latest reading for the ward
  if (!avgPm25 || avgPm25 === 0) {
    const latestReading = await query(
      `SELECT pm25 FROM sensor_reading WHERE ward_id = $1 ORDER BY timestamp DESC LIMIT 1`,
      [cell.ward_id]
    );
    avgPm25 = latestReading[0]?.pm25 || 45.0; // default baseline ~45 µg/m³
  }

  // Normalize PM2.5: 250 µg/m³ is considered 100% normalized severe
  const normalized_avg_pm25_last_2h = Math.min((avgPm25 / 250.0) * 100.0, 100.0);

  // 2. Get complaint count in last 6 hours for this ward/grid area
  const complaints = await query(
    `SELECT category, COUNT(*) as cnt FROM report 
     WHERE ward_id = $1 AND created_at >= $2 AND status != 'resolved'
     GROUP BY category`,
    [cell.ward_id, sixHoursAgo]
  );
  
  let totalComplaints = 0;
  let dominantCategory = 'other';
  let maxCnt = -1;

  for (const row of complaints) {
    const cnt = Number(row.cnt) || 0;
    totalComplaints += cnt;
    if (cnt > maxCnt) {
      maxCnt = cnt;
      dominantCategory = row.category || 'other';
    }
  }

  // If no recent complaints, check all active complaints in ward
  if (totalComplaints === 0) {
    const allActive = await query(
      `SELECT category, COUNT(*) as cnt FROM report 
       WHERE ward_id = $1 AND status != 'resolved'
       GROUP BY category`,
      [cell.ward_id]
    );
    for (const row of allActive) {
      const cnt = Number(row.cnt) || 0;
      totalComplaints += cnt;
      if (cnt > maxCnt) {
        maxCnt = cnt;
        dominantCategory = row.category || 'other';
      }
    }
  }

  // Normalize complaints: 5 active complaints in a neighborhood cell = 100% severe
  const normalized_complaint_count_last_6h = Math.min((totalComplaints / 5.0) * 100.0, 100.0);

  // 3. Severity Weight of dominant category
  const severityWeights: Record<string, number> = {
    smoke: 100.0,
    industry: 90.0,
    dust: 75.0,
    traffic: 60.0,
    other: 40.0,
    'non-pollution': 10.0
  };
  const severity_weight_val = severityWeights[dominantCategory] || 50.0;

  // 4. Satellite thermal anomaly flag (default 0, or 100 if cell name mentions landfill/fire or simulated anomaly)
  let satellite_thermal_anomaly_flag = 0.0;
  if (cell.name && (cell.name.toLowerCase().includes('bhalswa') || cell.name.toLowerCase().includes('landfill') || cell.name.toLowerCase().includes('dump'))) {
    // If there is an active smoke complaint or spike, satellite detects anomaly
    if (dominantCategory === 'smoke' || avgPm25 > 150) {
      satellite_thermal_anomaly_flag = 100.0;
    }
  }

  // EXACT FORMULA from PRD Section 4.5:
  const pm25_comp = Math.round(normalized_avg_pm25_last_2h * 10) / 10;
  const complaint_comp = Math.round(normalized_complaint_count_last_6h * 10) / 10;

  const risk_score = 
      0.50 * pm25_comp
    + 0.30 * complaint_comp
    + 0.15 * severity_weight_val
    + 0.05 * satellite_thermal_anomaly_flag;

  const roundedScore = Math.round(risk_score * 10) / 10;
  const timestamp = new Date().toISOString();
  const id = crypto.randomUUID();

  // Insert score record
  await execute(
    `INSERT INTO hotspot_score (
      id, grid_cell_id, ward_id, city_id, risk_score, 
      pm25_component, complaint_component, severity_component, satellite_component, 
      dominant_category, timestamp
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [
      id, cell.id, cell.ward_id, cell.city_id, roundedScore,
      pm25_comp,
      complaint_comp,
      severity_weight_val,
      satellite_thermal_anomaly_flag,
      dominantCategory,
      timestamp
    ]
  );

  const scoreObj: GridCellScore = {
    id,
    grid_cell_id: cell.id,
    ward_id: cell.ward_id,
    city_id: cell.city_id,
    risk_score: roundedScore,
    pm25_component: pm25_comp,
    complaint_component: complaint_comp,
    severity_component: severity_weight_val,
    satellite_component: satellite_thermal_anomaly_flag,
    dominant_category: dominantCategory,
    timestamp
  };

  // Run 24h Forecast
  const forecast = await runForecastForGridCell(cell.id, cell.ward_id, cell.city_id, roundedScore);

  // Check Alert Thresholds (>=80 Critical)
  const isCurrentCritical = roundedScore >= 80.0;
  const isForecastCritical = forecast.some(f => f.predicted_score >= 80.0);

  if (isCurrentCritical || isForecastCritical) {
    await checkAndTriggerAlert(cell, roundedScore, isCurrentCritical ? 'current' : 'forecast');
  }

  return scoreObj;
}

async function checkAndTriggerAlert(cell: any, score: number, thresholdType: string): Promise<void> {
  // Check if an active alert already exists for this grid cell
  const existing = await query(
    `SELECT * FROM alert WHERE grid_cell_id = $1 AND status != 'resolved'`,
    [cell.id]
  );

  if (existing.length === 0) {
    const alertId = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    await execute(
      `INSERT INTO alert (id, grid_cell_id, ward_id, city_id, risk_score, threshold_type, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'active', $7)`,
      [alertId, cell.id, cell.ward_id, cell.city_id, score, thresholdType, timestamp]
    );

    // Trigger Webhook Notification (Stubbed as log per PRD Section 4.7 & 9.7)
    console.log(`\n=============================================================`);
    console.log(`🚨 CRITICAL HOTSPOT ALERT TRIGGERED! 🚨`);
    console.log(`Grid Cell: ${cell.name} (${cell.id})`);
    console.log(`Ward ID: ${cell.ward_id} | City ID: ${cell.city_id}`);
    console.log(`Risk Score: ${score} (Threshold crossed: ${thresholdType.toUpperCase()})`);
    console.log(`Webhook Action: POST https://notify.vayuvigil.gov/webhooks/sms-email`);
    console.log(`Payload: {"alert_id": "${alertId}", "ward_id": "${cell.ward_id}", "score": ${score}, "action": "DISPATCH_CREW_RECOMMENDED"}`);
    console.log(`=============================================================\n`);

    // Trigger Automated Municipal Fleet Smart GPS Dispatch
    try {
      await FleetService.autoDispatchForHotspot(
        cell.id,
        cell.name,
        cell.ward_id,
        cell.dominant_category || 'smoke',
        cell.centroid_lat || 28.7450,
        cell.centroid_lon || 77.1620
      );
    } catch (err) {
      console.error('Error auto-dispatching municipal fleet:', err);
    }
  } else {
    // Update existing alert score
    await execute(
      `UPDATE alert SET risk_score = $1 WHERE id = $2`,
      [score, existing[0].id]
    );
  }
}
