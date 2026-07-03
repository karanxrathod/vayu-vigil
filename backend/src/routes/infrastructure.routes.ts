import { Router, Request, Response } from 'express';
import { IoTService } from '../services/iot.service';
import { SatelliteService } from '../services/satellite.service';
import { BotService } from '../services/bot.service';
import { FleetService } from '../services/fleet.service';

const router = Router();

// =======================
// 1. IoT Sensor Grid API
// =======================
router.get('/iot/nodes', (req: Request, res: Response) => {
  try {
    const wardId = req.query.ward_id as string;
    const nodes = IoTService.getAllNodes(wardId);
    res.json({ success: true, count: nodes.length, nodes });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/iot/publish', async (req: Request, res: Response) => {
  try {
    const { node_id, pm25, pm10, temperature, humidity } = req.body;
    if (!node_id || pm25 === undefined || pm10 === undefined) {
      return res.status(400).json({ error: 'node_id, pm25, and pm10 are required in MQTT payload.' });
    }
    const result = await IoTService.publishTelemetry(node_id, Number(pm25), Number(pm10), temperature, humidity);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// =======================
// 2. Satellite Earth Engine API
// =======================
router.get('/satellite/anomalies', (req: Request, res: Response) => {
  try {
    const wardId = req.query.ward_id as string;
    const anomalies = SatelliteService.getAnomalies(wardId);
    res.json({ success: true, count: anomalies.length, anomalies });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/satellite/scan', async (req: Request, res: Response) => {
  try {
    const { ward_id } = req.body;
    const result = await SatelliteService.triggerOrbitalScan(ward_id);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// =======================
// 3. WhatsApp & SMS Bot API
// =======================
router.get('/bot/history', (req: Request, res: Response) => {
  try {
    const channel = req.query.channel as string;
    const history = BotService.getHistory(channel);
    res.json({ success: true, count: history.length, history });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/bot/message', async (req: Request, res: Response) => {
  try {
    const { channel, sender_phone, text, media_url, lat, lon } = req.body;
    if (!channel || !sender_phone || !text) {
      return res.status(400).json({ error: 'channel (whatsapp|sms), sender_phone, and text are required.' });
    }
    const result = await BotService.processIncomingMessage(channel, sender_phone, text, media_url, lat, lon);
    res.status(201).json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// =======================
// 4. Municipal Fleet & Routing API
// =======================
router.get('/fleet/vehicles', (req: Request, res: Response) => {
  try {
    const wardId = req.query.ward_id as string;
    const vehicles = FleetService.getAllVehicles(wardId);
    res.json({ success: true, count: vehicles.length, vehicles });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/fleet/manual-dispatch', async (req: Request, res: Response) => {
  try {
    const { vehicle_id, hotspot_id } = req.body;
    if (!vehicle_id || !hotspot_id) {
      return res.status(400).json({ error: 'vehicle_id and hotspot_id are required.' });
    }
    const result = await FleetService.manualDispatch(vehicle_id, hotspot_id);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/fleet/arrived-spraying', async (req: Request, res: Response) => {
  try {
    const { vehicle_id } = req.body;
    if (!vehicle_id) {
      return res.status(400).json({ error: 'vehicle_id is required.' });
    }
    const result = await FleetService.markArrivedAndSpraying(vehicle_id);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/fleet/reset', async (req: Request, res: Response) => {
  try {
    const { vehicle_id } = req.body;
    const vehicle = await FleetService.resetVehicle(vehicle_id);
    res.json({ success: true, vehicle });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
