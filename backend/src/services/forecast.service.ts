import { query, execute } from '../db';
import crypto from 'crypto';

export interface ForecastPoint {
  timestamp: string;
  predicted_score: number;
}

/**
 * 24-Hour Air Quality Spike Forecasting Engine
 * 
 * Computes a forward-looking 24h risk projection using an exponentially-weighted moving average (EWMA)
 * + linear trend extrapolation over the trailing 6 hours of scores.
 * Never outputs negative or NaN values.
 * 
 * // TODO(post-hackathon): replace with Prophet / Vertex AI Temporal Fusion Transformer model — interface unchanged
 * @param grid_cell_id - Target grid cell ID
 * @param ward_id - Ward ID
 * @param city_id - City ID
 * @param currentScore - Current computed risk score
 */
export async function runForecastForGridCell(
  grid_cell_id: string,
  ward_id: string,
  city_id: string,
  currentScore: number
): Promise<ForecastPoint[]> {
  const now = new Date();
  const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString();

  // 1. Fetch trailing 6 hours of score history
  const history = await query(
    `SELECT risk_score, timestamp FROM hotspot_score 
     WHERE grid_cell_id = $1 AND timestamp >= $2
     ORDER BY timestamp ASC`,
    [grid_cell_id, sixHoursAgo]
  );

  let ewma = currentScore;
  let hourlyTrend = 0.0;

  if (history && history.length >= 2) {
    // Calculate EWMA (alpha = 0.4)
    const alpha = 0.4;
    ewma = Number(history[0].risk_score) || currentScore;
    for (let i = 1; i < history.length; i++) {
      const val = Number(history[i].risk_score) || ewma;
      ewma = alpha * val + (1 - alpha) * ewma;
    }

    // Calculate linear trend slope over time window
    const firstScore = Number(history[0].risk_score) || currentScore;
    const lastScore = Number(history[history.length - 1].risk_score) || currentScore;
    const firstTime = new Date(history[0].timestamp).getTime();
    const lastTime = new Date(history[history.length - 1].timestamp).getTime();
    const hoursDiff = Math.max((lastTime - firstTime) / (1000 * 60 * 60), 0.5);
    
    hourlyTrend = (lastScore - firstScore) / hoursDiff;
    // Cap hourly trend so it doesn't explode in 24 hours (-5 to +5 per hour)
    hourlyTrend = Math.max(Math.min(hourlyTrend, 5.0), -5.0);
  } else {
    // If not enough history, derive trend from current score compared to baseline 50
    hourlyTrend = currentScore > 75 ? 1.5 : currentScore > 50 ? 0.5 : -0.5;
  }

  const forecastSeries: ForecastPoint[] = [];
  let projScore = ewma;

  // Generate 24 hourly forecast points
  for (let hour = 1; hour <= 24; hour++) {
    const targetTime = new Date(now.getTime() + hour * 60 * 60 * 1000).toISOString();
    
    // Apply linear extrapolation with damping factor over time (trend dampens by 10% each hour)
    const damping = Math.pow(0.9, hour - 1);
    projScore = projScore + hourlyTrend * damping;

    // Add slight diurnal variation (peaks around 8 AM and 9 PM due to traffic/inversion, dips at 2 PM)
    const targetHourOfDay = new Date(targetTime).getHours();
    let diurnalShift = 0;
    if (targetHourOfDay >= 7 && targetHourOfDay <= 10) diurnalShift = 4; // morning traffic
    else if (targetHourOfDay >= 19 && targetHourOfDay <= 22) diurnalShift = 6; // evening inversion / burning
    else if (targetHourOfDay >= 13 && targetHourOfDay <= 16) diurnalShift = -5; // afternoon dispersion

    let finalScore = projScore + (diurnalShift * Math.min(hour / 6, 1.0));

    // Never output negative, NaN, or > 100 values (strict PRD requirement)
    if (isNaN(finalScore)) finalScore = currentScore;
    finalScore = Math.max(0.0, Math.min(100.0, finalScore));
    finalScore = Math.round(finalScore * 10) / 10;

    forecastSeries.push({
      timestamp: targetTime,
      predicted_score: finalScore
    });
  }

  // Save or update latest forecast series in db
  const existing = await query(
    `SELECT id FROM hotspot_forecast WHERE grid_cell_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [grid_cell_id]
  );

  const forecastJson = JSON.stringify(forecastSeries);
  const timestamp = now.toISOString();

  if (existing && existing.length > 0) {
    await execute(
      `UPDATE hotspot_forecast SET forecast_24h_series = $1, timestamp = $2, created_at = $3 WHERE id = $4`,
      [forecastJson, timestamp, timestamp, existing[0].id]
    );
  } else {
    const id = crypto.randomUUID();
    await execute(
      `INSERT INTO hotspot_forecast (id, grid_cell_id, ward_id, city_id, timestamp, forecast_24h_series, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, grid_cell_id, ward_id, city_id, timestamp, forecastJson, timestamp]
    );
  }

  return forecastSeries;
}
