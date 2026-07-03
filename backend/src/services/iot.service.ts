import { query, execute } from '../db';
import { runScoringJob } from './scoring.service';
import crypto from 'crypto';

export interface IoTNode {
  id: string;
  name: string;
  type: 'streetlight' | 'bus_shelter' | 'mobile_van' | 'cpcb_station';
  ward_id: string;
  lat: number;
  lon: number;
  mqtt_topic: string;
  status: 'online' | 'offline' | 'calibrating' | 'maintenance';
  battery: number; // percentage 0-100
  rssi_dbm: number; // signal strength e.g. -65
  last_pm25: number;
  last_pm10: number;
  temperature: number;
  humidity: number;
  firmware_version: string;
  last_updated: string;
}

// In-memory store of active municipal IoT hardware nodes
let iotNodes: IoTNode[] = [
  {
    id: 'cpcb-node-bhalswa-sl01',
    name: 'DPCC Streetlight Node #SL-88 (Bhalswa Perimeter)',
    type: 'streetlight',
    ward_id: 'ward-1-sector-12',
    lat: 28.7455,
    lon: 77.1615,
    mqtt_topic: 'dpcc/delhi/ward1/streetlight-88/telemetry',
    status: 'online',
    battery: 98,
    rssi_dbm: -62,
    last_pm25: 145.2,
    last_pm10: 230.0,
    temperature: 31.5,
    humidity: 48,
    firmware_version: 'v2.4.1-ota',
    last_updated: new Date().toISOString()
  },
  {
    id: 'cpcb-node-sec12-bs04',
    name: 'CPCB Bus Shelter Node #BS-12 (Jahangirpuri Metro Crossing)',
    type: 'bus_shelter',
    ward_id: 'ward-1-sector-12',
    lat: 28.7380,
    lon: 77.1680,
    mqtt_topic: 'cpcb/delhi/ward1/busshelter-12/telemetry',
    status: 'online',
    battery: 100, // grid powered
    rssi_dbm: -55,
    last_pm25: 88.4,
    last_pm10: 160.5,
    temperature: 32.0,
    humidity: 45,
    firmware_version: 'v2.4.1-ota',
    last_updated: new Date().toISOString()
  },
  {
    id: 'cpcb-node-sec9-sl19',
    name: 'DPCC Streetlight Node #SL-19 (Sector 9 Market Hub)',
    type: 'streetlight',
    ward_id: 'ward-2-sector-9',
    lat: 28.7060,
    lon: 77.1840,
    mqtt_topic: 'dpcc/delhi/ward2/streetlight-19/telemetry',
    status: 'online',
    battery: 92,
    rssi_dbm: -68,
    last_pm25: 92.0,
    last_pm10: 185.0,
    temperature: 33.1,
    humidity: 42,
    firmware_version: 'v2.4.0-ota',
    last_updated: new Date().toISOString()
  },
  {
    id: 'cpcb-node-mobile-van-03',
    name: 'Municipal Environmental Patrol Van #EV-03',
    type: 'mobile_van',
    ward_id: 'ward-2-sector-9',
    lat: 28.7120,
    lon: 77.1900,
    mqtt_topic: 'municipal/delhi/fleet/van-03/air-quality',
    status: 'online',
    battery: 85,
    rssi_dbm: -58,
    last_pm25: 65.0,
    last_pm10: 120.0,
    temperature: 31.8,
    humidity: 46,
    firmware_version: 'v3.0.0-mobile',
    last_updated: new Date().toISOString()
  }
];

export class IoTService {
  public static getAllNodes(wardId?: string): IoTNode[] {
    if (wardId && wardId !== 'all') {
      return iotNodes.filter(n => n.ward_id === wardId);
    }
    return iotNodes;
  }

  public static async publishTelemetry(
    nodeId: string,
    pm25: number,
    pm10: number,
    temperature?: number,
    humidity?: number
  ): Promise<{ success: boolean; node: IoTNode; message: string }> {
    const nodeIndex = iotNodes.findIndex(n => n.id === nodeId);
    if (nodeIndex === -1) {
      throw new Error(`IoT Node with ID ${nodeId} not found in hardware grid.`);
    }

    const node = iotNodes[nodeIndex];
    node.last_pm25 = pm25;
    node.last_pm10 = pm10;
    if (temperature !== undefined) node.temperature = temperature;
    if (humidity !== undefined) node.humidity = humidity;
    node.last_updated = new Date().toISOString();
    node.battery = Math.max(10, node.battery - Math.floor(Math.random() * 2));

    // Update database sensor table
    const existing = await query(`SELECT id FROM sensor WHERE id = $1`, [node.id]);
    if (existing.length === 0) {
      await execute(
        `INSERT INTO sensor (id, name, type, lat, lon, ward_id, status, pm25_current, pm10_current, last_updated)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [node.id, node.name, node.type, node.lat, node.lon, node.ward_id, 'active', pm25, pm10, node.last_updated]
      );
    } else {
      await execute(
        `UPDATE sensor SET pm25_current = $1, pm10_current = $2, last_updated = $3 WHERE id = $4`,
        [pm25, pm10, node.last_updated, node.id]
      );
    }

    // Also insert historical telemetry point
    const readingId = crypto.randomUUID();
    await execute(
      `INSERT INTO sensor_reading (id, sensor_id, pm25, pm10, temperature, humidity, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [readingId, node.id, pm25, pm10, node.temperature, node.humidity, node.last_updated]
    );

    // Trigger grid scoring recalculation immediately
    await runScoringJob();

    return {
      success: true,
      node,
      message: `MQTT payload received on topic [${node.mqtt_topic}]. PM2.5 updated to ${pm25} µg/m³. Risk grid recalculated.`
    };
  }

  public static toggleNodeStatus(nodeId: string, newStatus: 'online' | 'offline' | 'calibrating' | 'maintenance'): IoTNode {
    const node = iotNodes.find(n => n.id === nodeId);
    if (!node) {
      throw new Error(`IoT Node ${nodeId} not found.`);
    }
    node.status = newStatus;
    node.last_updated = new Date().toISOString();
    return node;
  }
}
