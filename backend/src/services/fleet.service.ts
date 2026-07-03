import { query, execute } from '../db';
import { runScoringJob } from './scoring.service';
import crypto from 'crypto';

export interface FleetVehicle {
  id: string;
  vehicle_number: string;
  name: string;
  type: 'water_mist_tanker' | 'smog_tower_mobile' | 'sanitation_truck' | 'patrol_van';
  ward_id: string;
  current_lat: number;
  current_lon: number;
  status: 'idle' | 'dispatched_en_route' | 'spraying_active' | 'maintenance';
  assigned_hotspot_id?: string;
  assigned_hotspot_name?: string;
  water_tank_level: number; // 0-100%
  fuel_level: number; // 0-100%
  speed_kmh: number;
  eta_minutes?: number;
  last_dispatch_time?: string;
  routing_polyline?: [number, number][]; // GPS coordinates for path
}

let fleetVehicles: FleetVehicle[] = [
  {
    id: 'fleet-tanker-wm01',
    vehicle_number: 'DL-01-WM-004',
    name: 'Municipal Heavy Water-Mist Cannon Tanker #04',
    type: 'water_mist_tanker',
    ward_id: 'ward-1-sector-12',
    current_lat: 28.7350,
    current_lon: 77.1580,
    status: 'idle',
    water_tank_level: 95,
    fuel_level: 88,
    speed_kmh: 0
  },
  {
    id: 'fleet-smog-st02',
    vehicle_number: 'DL-01-ST-102',
    name: 'Mobile Smog Tower & Air Filtration Unit #02',
    type: 'smog_tower_mobile',
    ward_id: 'ward-1-sector-12',
    current_lat: 28.7400,
    current_lon: 77.1650,
    status: 'idle',
    water_tank_level: 100,
    fuel_level: 92,
    speed_kmh: 0
  },
  {
    id: 'fleet-sanitation-gt08',
    vehicle_number: 'DL-03-GT-881',
    name: 'Municipal Solid Waste Sanitation Dump Truck #08',
    type: 'sanitation_truck',
    ward_id: 'ward-2-sector-9',
    current_lat: 28.7020,
    current_lon: 77.1800,
    status: 'idle',
    water_tank_level: 100,
    fuel_level: 78,
    speed_kmh: 0
  },
  {
    id: 'fleet-tanker-wm05',
    vehicle_number: 'DL-02-WM-019',
    name: 'Anti-Smog Sprinkling Tanker #19 (Sector 9 Hub)',
    type: 'water_mist_tanker',
    ward_id: 'ward-2-sector-9',
    current_lat: 28.7080,
    current_lon: 77.1880,
    status: 'idle',
    water_tank_level: 80,
    fuel_level: 85,
    speed_kmh: 0
  }
];

export class FleetService {
  public static getAllVehicles(wardId?: string): FleetVehicle[] {
    if (wardId && wardId !== 'all') {
      return fleetVehicles.filter(v => v.ward_id === wardId);
    }
    return fleetVehicles;
  }

  public static async autoDispatchForHotspot(
    hotspotId: string,
    hotspotName: string,
    wardId: string,
    dominantCategory: string,
    targetLat: number,
    targetLon: number
  ): Promise<{ dispatched: boolean; vehicle?: FleetVehicle; message: string }> {
    // Check if a vehicle is already assigned to this hotspot
    const existing = fleetVehicles.find(v => v.assigned_hotspot_id === hotspotId && v.status !== 'idle');
    if (existing) {
      return {
        dispatched: false,
        vehicle: existing,
        message: `Vehicle [${existing.vehicle_number}] is already assigned and en route to ${hotspotName}.`
      };
    }

    // Find best matching idle vehicle in the ward (or fallback to any idle tanker)
    let candidate = fleetVehicles.find(v => v.ward_id === wardId && v.status === 'idle');
    if (!candidate) {
      candidate = fleetVehicles.find(v => v.status === 'idle');
    }

    if (!candidate) {
      return {
        dispatched: false,
        message: `No idle municipal fleet vehicles currently available for automatic dispatch to ${hotspotName}. All units deployed.`
      };
    }

    // Perform smart GPS routing assignment
    const now = new Date().toISOString();
    candidate.status = 'dispatched_en_route';
    candidate.assigned_hotspot_id = hotspotId;
    candidate.assigned_hotspot_name = hotspotName;
    candidate.speed_kmh = 35;
    candidate.eta_minutes = Math.floor(6 + Math.random() * 8);
    candidate.last_dispatch_time = now;
    candidate.routing_polyline = [
      [candidate.current_lat, candidate.current_lon],
      [(candidate.current_lat + targetLat) / 2, (candidate.current_lon + targetLon) / 2],
      [targetLat, targetLon]
    ];

    // Update database alert status to in_progress
    await execute(
      `UPDATE alert SET status = $1 WHERE grid_cell_id = $2 AND status != 'resolved'`,
      ['in_progress', hotspotId]
    );

    console.log(`🚒 [SMART ROUTING AUTO-DISPATCH] Vehicle ${candidate.vehicle_number} (${candidate.name}) dispatched to critical hotspot [${hotspotName}]. ETA: ${candidate.eta_minutes} mins.`);

    return {
      dispatched: true,
      vehicle: candidate,
      message: `Automated Smart Routing dispatched ${candidate.name} (${candidate.vehicle_number}) to ${hotspotName}. ETA: ${candidate.eta_minutes} mins.`
    };
  }

  public static async manualDispatch(
    vehicleId: string,
    hotspotId: string
  ): Promise<{ success: boolean; vehicle: FleetVehicle; message: string }> {
    const vehicle = fleetVehicles.find(v => v.id === vehicleId);
    if (!vehicle) {
      throw new Error(`Vehicle with ID ${vehicleId} not found.`);
    }

    const rows = await query(`SELECT id, name, centroid_lat, centroid_lon, ward_id FROM grid_cell WHERE id = $1`, [hotspotId]);
    if (rows.length === 0) {
      throw new Error(`Hotspot grid cell ${hotspotId} not found.`);
    }
    const cell = rows[0];

    const now = new Date().toISOString();
    vehicle.status = 'dispatched_en_route';
    vehicle.assigned_hotspot_id = cell.id;
    vehicle.assigned_hotspot_name = cell.name;
    vehicle.speed_kmh = 40;
    vehicle.eta_minutes = 5;
    vehicle.last_dispatch_time = now;
    vehicle.routing_polyline = [
      [vehicle.current_lat, vehicle.current_lon],
      [cell.centroid_lat, cell.centroid_lon]
    ];

    await execute(`UPDATE alert SET status = $1 WHERE grid_cell_id = $2 AND status != 'resolved'`, ['in_progress', cell.id]);

    return {
      success: true,
      vehicle,
      message: `Manually dispatched vehicle ${vehicle.vehicle_number} to ${cell.name}.`
    };
  }

  public static async markArrivedAndSpraying(vehicleId: string): Promise<{ success: boolean; vehicle: FleetVehicle; message: string }> {
    const vehicle = fleetVehicles.find(v => v.id === vehicleId);
    if (!vehicle) {
      throw new Error(`Vehicle ${vehicleId} not found.`);
    }

    const now = new Date().toISOString();
    vehicle.status = 'spraying_active';
    vehicle.speed_kmh = 0;
    vehicle.water_tank_level = Math.max(10, vehicle.water_tank_level - 25);
    vehicle.current_lat = vehicle.routing_polyline ? vehicle.routing_polyline[vehicle.routing_polyline.length - 1][0] : vehicle.current_lat;
    vehicle.current_lon = vehicle.routing_polyline ? vehicle.routing_polyline[vehicle.routing_polyline.length - 1][1] : vehicle.current_lon;
    vehicle.eta_minutes = 0;

    // Immediately reduce sensor PM2.5 readings in the database by 40% to simulate real water mist action!
    if (vehicle.assigned_hotspot_id) {
      await execute(
        `UPDATE sensor SET pm25_current = pm25_current * 0.55, pm10_current = pm10_current * 0.60, last_updated = $1
         WHERE ward_id = $2`,
        [now, vehicle.ward_id]
      );
      
      // Update alert status
      await execute(
        `UPDATE alert SET status = $1 WHERE grid_cell_id = $2 AND status != 'resolved'`,
        ['resolved', vehicle.assigned_hotspot_id]
      );
    }

    await runScoringJob();

    return {
      success: true,
      vehicle,
      message: `Vehicle ${vehicle.vehicle_number} arrived on scene and activated water-mist / smog filtration cannons! PM2.5 dropping rapidly.`
    };
  }

  public static async resetVehicle(vehicleId: string): Promise<FleetVehicle> {
    const vehicle = fleetVehicles.find(v => v.id === vehicleId);
    if (!vehicle) throw new Error(`Vehicle ${vehicleId} not found.`);
    vehicle.status = 'idle';
    vehicle.assigned_hotspot_id = undefined;
    vehicle.assigned_hotspot_name = undefined;
    vehicle.speed_kmh = 0;
    vehicle.eta_minutes = undefined;
    vehicle.water_tank_level = 100;
    vehicle.fuel_level = 100;
    return vehicle;
  }
}
