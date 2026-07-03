import { query, execute } from '../db';
import { runScoringJob } from './scoring.service';
import crypto from 'crypto';

export interface SatelliteAnomaly {
  id: string;
  satellite: string;
  instrument: string;
  pollutant: 'NO2_Tropospheric_Column' | 'AOD_Aerosol_Optical_Depth' | 'SO2_Volcanic_Industrial' | 'CO_Carbon_Monoxide';
  ward_id: string;
  grid_cell_id: string;
  centroid_lat: number;
  centroid_lon: number;
  max_value_unit: string;
  anomaly_score: number; // 0 to 100
  confidence: number;
  detected_at: string;
  description: string;
}

let satelliteAnomalies: SatelliteAnomaly[] = [
  {
    id: 's5p-plume-bhalswa-2026',
    satellite: 'Copernicus Sentinel-5P',
    instrument: 'TROPOMI (Tropospheric Monitoring Instrument)',
    pollutant: 'AOD_Aerosol_Optical_Depth',
    ward_id: 'ward-1-sector-12',
    grid_cell_id: 'cell-bhalswa-12',
    centroid_lat: 28.7450,
    centroid_lon: 77.1620,
    max_value_unit: '0.88 AOD (Severe Aerosol Plume / Open Combustion)',
    anomaly_score: 85,
    confidence: 0.94,
    detected_at: new Date(Date.now() - 3600000).toISOString(),
    description: 'High-altitude aerosol optical depth plume originating from Bhalswa waste site perimeter, drifting south-east with prevailing winds.'
  },
  {
    id: 's5p-plume-sec9-ind-2026',
    satellite: 'Copernicus Sentinel-5P',
    instrument: 'TROPOMI (Tropospheric Monitoring Instrument)',
    pollutant: 'NO2_Tropospheric_Column',
    ward_id: 'ward-2-sector-9',
    grid_cell_id: 'cell-sec9-01',
    centroid_lat: 28.7060,
    centroid_lon: 77.1840,
    max_value_unit: '195 µmol/m² (Elevated Industrial / Traffic Exhaust)',
    anomaly_score: 64,
    confidence: 0.89,
    detected_at: new Date(Date.now() - 7200000).toISOString(),
    description: 'Elevated tropospheric Nitrogen Dioxide column over Sector 9 transport bottleneck and concrete mixing cluster.'
  }
];

export class SatelliteService {
  public static getAnomalies(wardId?: string): SatelliteAnomaly[] {
    if (wardId && wardId !== 'all') {
      return satelliteAnomalies.filter(a => a.ward_id === wardId);
    }
    return satelliteAnomalies;
  }

  public static async triggerOrbitalScan(targetWardId?: string): Promise<{
    scan_timestamp: string;
    satellite: string;
    rasters_analyzed: number;
    anomalies_detected: SatelliteAnomaly[];
    message: string;
  }> {
    const now = new Date().toISOString();

    // Simulate finding a new high-intensity thermal/NO2 plume during scan
    const newAnomaly: SatelliteAnomaly = {
      id: `s5p-tropomi-${crypto.randomUUID().slice(0, 8)}`,
      satellite: 'Copernicus Sentinel-5P',
      instrument: 'TROPOMI Orbital Raster Scan',
      pollutant: 'NO2_Tropospheric_Column',
      ward_id: targetWardId || 'ward-1-sector-12',
      grid_cell_id: targetWardId === 'ward-2-sector-9' ? 'cell-sec9-01' : 'cell-bhalswa-12',
      centroid_lat: targetWardId === 'ward-2-sector-9' ? 28.7065 : 28.7458,
      centroid_lon: targetWardId === 'ward-2-sector-9' ? 77.1845 : 77.1618,
      max_value_unit: '240 µmol/m² (Acute Orbital Plume Detection)',
      anomaly_score: Math.floor(75 + Math.random() * 20),
      confidence: 0.96,
      detected_at: now,
      description: `Real-time Copernicus Sentinel-5P orbital overpass detected acute tropospheric pollution accumulation over ${targetWardId || 'Ward 1'}.`
    };

    satelliteAnomalies.unshift(newAnomaly);
    if (satelliteAnomalies.length > 15) satelliteAnomalies.pop();

    // Recompute composite risk scores across all hotspots
    await runScoringJob();

    return {
      scan_timestamp: now,
      satellite: 'Copernicus Sentinel-5P / TROPOMI Level-2 Product',
      rasters_analyzed: 4,
      anomalies_detected: satelliteAnomalies.slice(0, 3),
      message: `Orbital scan completed successfully over Delhi NCR bounding box. Satellite index updated for grid [${newAnomaly.grid_cell_id}] to ${newAnomaly.anomaly_score}/100.`
    };
  }
}
