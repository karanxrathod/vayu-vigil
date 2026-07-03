import { query, execute } from '../db';
import { runScoringJob } from './scoring.service';
import crypto from 'crypto';

let simulatorTimer: NodeJS.Timeout | null = null;
let activeSpikes: Map<string, { endTime: number; targetPm25: number; targetPm10: number }> = new Map();

/**
 * Sensor Ingestion & Background Simulator Service
 * 
 * Generates realistic synthetic PM2.5/PM10 readings for fixed sensor locations
 * and provides an on-demand "inject a spike" trigger for hackathon live demoing.
 * 
 * // TODO(post-hackathon): replace simulator loop with MQTT / Cloud IoT Core webhook ingestion — interface unchanged
 */
export async function startSensorSimulator(intervalMs: number = 10000): Promise<void> {
  if (simulatorTimer) {
    clearInterval(simulatorTimer);
  }

  console.log(`Starting Background IoT Sensor Simulator (Interval: ${intervalMs}ms)...`);
  
  simulatorTimer = setInterval(async () => {
    try {
      await simulateSensorTick();
    } catch (err) {
      console.error('Error during sensor simulator tick:', err);
    }
  }, intervalMs);

  // Run immediately on start
  await simulateSensorTick();
}

export function stopSensorSimulator(): void {
  if (simulatorTimer) {
    clearInterval(simulatorTimer);
    simulatorTimer = null;
    console.log('Stopped IoT Sensor Simulator.');
  }
}

export async function simulateSensorTick(): Promise<void> {
  const sensors = await query("SELECT * FROM sensor WHERE status = 'active'");
  if (!sensors || sensors.length === 0) return;

  const now = Date.now();
  const timestamp = new Date().toISOString();

  for (const s of sensors) {
    let pm25 = 45.0 + (Math.random() * 20 - 10); // normal range ~35 to 55
    let pm10 = pm25 * 1.6 + (Math.random() * 15 - 5);
    let isSpike = 0;

    // Check if this sensor or its ward has an active injected spike
    const spikeKey = s.id;
    const wardSpikeKey = `ward:${s.ward_id}`;
    const activeSpike = activeSpikes.get(spikeKey) || activeSpikes.get(wardSpikeKey);

    if (activeSpike) {
      if (now < activeSpike.endTime) {
        pm25 = activeSpike.targetPm25 + (Math.random() * 20 - 10);
        pm10 = activeSpike.targetPm10 + (Math.random() * 30 - 10);
        isSpike = 1;
      } else {
        activeSpikes.delete(spikeKey);
        activeSpikes.delete(wardSpikeKey);
      }
    } else if (s.name.toLowerCase().includes('bhalswa') || s.name.toLowerCase().includes('dump')) {
      // Landfill sensors naturally trend higher or moderate in demo baseline
      pm25 = 85.0 + (Math.random() * 25 - 10);
      pm10 = pm25 * 1.7;
    }

    pm25 = Math.round(Math.max(5.0, pm25) * 10) / 10;
    pm10 = Math.round(Math.max(10.0, pm10) * 10) / 10;

    await ingestSensorReading({
      sensor_id: s.id,
      ward_id: s.ward_id,
      city_id: s.city_id,
      lat: s.lat,
      lon: s.lon,
      timestamp,
      pm25,
      pm10,
      no2: Math.round((25 + Math.random() * 10) * 10) / 10,
      co: Math.round((1.2 + Math.random() * 0.5) * 100) / 100,
      temp: Math.round((31 + Math.random() * 3) * 10) / 10,
      humidity: Math.round((55 + Math.random() * 10) * 10) / 10,
      is_spike: isSpike
    });
  }
}

export async function ingestSensorReading(payload: {
  sensor_id: string;
  ward_id?: string;
  city_id?: string;
  lat: number;
  lon: number;
  timestamp?: string;
  pm25: number;
  pm10: number;
  no2?: number;
  co?: number;
  temp?: number;
  humidity?: number;
  is_spike?: number;
}): Promise<void> {
  let { ward_id, city_id } = payload;

  // If ward_id or city_id not provided in raw IoT payload, look up from sensor table
  if (!ward_id || !city_id) {
    const s = await query('SELECT ward_id, city_id FROM sensor WHERE id = $1', [payload.sensor_id]);
    if (s && s.length > 0) {
      ward_id = s[0].ward_id;
      city_id = s[0].city_id;
    } else {
      // Default fallback for unmapped sensor
      ward_id = 'ward-1-sector-12';
      city_id = 'city-1-delhi';
    }
  }

  const id = crypto.randomUUID();
  const ts = payload.timestamp || new Date().toISOString();

  await execute(
    `INSERT INTO sensor_reading (
      id, sensor_id, ward_id, city_id, lat, lon, timestamp, 
      pm25, pm10, no2, co, temp, humidity, is_spike
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
    [
      id, payload.sensor_id, ward_id, city_id, payload.lat, payload.lon, ts,
      payload.pm25, payload.pm10, payload.no2 || 25.0, payload.co || 1.2, payload.temp || 32.0, payload.humidity || 55.0, payload.is_spike || 0
    ]
  );
}

/**
 * Trigger an artificial sensor spike near a location for live judge demoing
 */
export async function triggerDemoSpike(
  targetSensorIdOrWardId?: string,
  targetPm25: number = 320.0,
  durationSeconds: number = 300
): Promise<{ message: string; target: string; targetPm25: number }> {
  let targetKey: string = targetSensorIdOrWardId || '';
  
  if (!targetKey) {
    // Default to Bhalswa Landfill / Sector 12 ward for demo
    const s = await query("SELECT id, ward_id FROM sensor WHERE name LIKE '%Bhalswa%' OR name LIKE '%Landfill%' LIMIT 1");
    if (s && s.length > 0) {
      targetKey = s[0].id;
    } else {
      targetKey = 'ward:ward-1-sector-12';
    }
  }

  const endTime = Date.now() + durationSeconds * 1000;
  activeSpikes.set(targetKey, {
    endTime,
    targetPm25,
    targetPm10: targetPm25 * 1.7
  });

  console.log(`\n=============================================================`);
  console.log(`⚡ DEMO SPIKE INJECTED! Target: ${targetKey} | Target PM2.5: ${targetPm25} µg/m³ ⚡`);
  console.log(`=============================================================\n`);

  // Force an immediate sensor tick and scoring job update
  await simulateSensorTick();
  await runScoringJob();

  return {
    message: 'Demo pollution spike injected successfully. Hotspot scores and alerts updated.',
    target: targetKey,
    targetPm25
  };
}
