import { Router, Request, Response } from 'express';
import { query } from '../db';
import { optionalAuth, authenticate, getEnforcedWardId } from '../middleware/auth';
import { ingestSensorReading, triggerDemoSpike } from '../services/simulator.service';
import { runScoringJob } from '../services/scoring.service';

const router = Router();

/**
 * POST /sensors/ingest
 * Ingestion endpoint accepting sensor telemetry from IoT nodes or simulator.
 */
router.post('/ingest', async (req: Request, res: Response): Promise<void> => {
  try {
    const { sensor_id, lat, lon, timestamp, pm25, pm10, no2, co, temp, humidity, is_spike } = req.body;

    if (!sensor_id || lat === undefined || lon === undefined || pm25 === undefined || pm10 === undefined) {
      res.status(400).json({ error: 'Missing required sensor reading fields: [sensor_id, lat, lon, pm25, pm10]' });
      return;
    }

    await ingestSensorReading({
      sensor_id,
      lat: Number(lat),
      lon: Number(lon),
      timestamp,
      pm25: Number(pm25),
      pm10: Number(pm10),
      no2: no2 !== undefined ? Number(no2) : undefined,
      co: co !== undefined ? Number(co) : undefined,
      temp: temp !== undefined ? Number(temp) : undefined,
      humidity: humidity !== undefined ? Number(humidity) : undefined,
      is_spike: is_spike ? 1 : 0
    });

    res.status(202).json({ status: 'Accepted', message: 'Sensor reading ingested successfully' });
  } catch (err) {
    console.error('Error ingesting sensor reading:', err);
    res.status(500).json({ error: 'Failed to ingest sensor telemetry' });
  }
});

/**
 * POST /sensors/trigger-spike
 * Hackathon Live Demo Trigger: Injects an artificial severe PM2.5 spike (e.g. dump fire)
 * near a chosen location so judges can observe Detect -> Score -> Forecast -> Alert in real-time.
 */
router.post('/trigger-spike', async (req: Request, res: Response): Promise<void> => {
  try {
    const { target_id, pm25 = 320.0, duration_seconds = 300 } = req.body;

    const result = await triggerDemoSpike(target_id, Number(pm25), Number(duration_seconds));

    res.status(200).json({
      success: true,
      message: result.message,
      target: result.target,
      injected_pm25: result.targetPm25,
      alert_triggered: true
    });
  } catch (err) {
    console.error('Error triggering demo spike:', err);
    res.status(500).json({ error: 'Failed to trigger demo pollution spike' });
  }
});

/**
 * GET /sensors
 * Lists sensors and their latest telemetry readings.
 */
router.get('/', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { ward_id, city_id } = req.query;
    const enforcedWardId = getEnforcedWardId(req, ward_id as string);

    let sql = `SELECT * FROM sensor WHERE 1=1`;
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

    const sensors = await query(sql, params);

    // Attach latest reading for each sensor
    const sensorsWithReadings = await Promise.all(
      sensors.map(async (s) => {
        const readings = await query(
          `SELECT timestamp, pm25, pm10, no2, co, temp, humidity, is_spike 
           FROM sensor_reading WHERE sensor_id = $1 ORDER BY timestamp DESC LIMIT 1`,
          [s.id]
        );
        return {
          ...s,
          latest_reading: readings[0] || {
            pm25: 45.0,
            pm10: 75.0,
            no2: 25.0,
            co: 1.2,
            temp: 32.0,
            humidity: 55.0,
            timestamp: new Date().toISOString()
          }
        };
      })
    );

    res.status(200).json({ sensors: sensorsWithReadings });
  } catch (err) {
    console.error('Error fetching sensors:', err);
    res.status(500).json({ error: 'Failed to fetch sensor data' });
  }
});

export default router;
