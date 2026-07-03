import React, { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import { Language } from '../lib/i18n';

interface HotspotMapProps {
  hotspots: any[];
  reports: any[];
  onSelectHotspot?: (h: any) => void;
  selectedHotspot?: any | null;
  lang: Language;
}

export const HotspotMap: React.FC<HotspotMapProps> = ({ hotspots, reports, onSelectHotspot, selectedHotspot, lang }) => {
  const mapRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only execute on client side
    if (typeof window === 'undefined' || !containerRef.current) return;

    // Load Leaflet dynamically on client
    import('leaflet').then((L) => {
      // Initialize map if not already initialized
      if (!mapRef.current) {
        mapRef.current = L.map(containerRef.current!).setView([28.710, 77.190], 12); // Delhi North centroid

        // Add OpenStreetMap tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | Vayu Vigil Civic Platform',
          maxZoom: 18,
        }).addTo(mapRef.current);
      }

      const map = mapRef.current;

      // Clear existing markers
      map.eachLayer((layer: any) => {
        if (layer instanceof L.Marker || layer instanceof L.Circle || layer instanceof L.Polygon) {
          map.removeLayer(layer);
        }
      });

      // Add ward boundary outlines for visual context
      const bhalswaPolygon = L.polygon([
        [28.72, 77.13], [28.72, 77.18], [28.78, 77.18], [28.78, 77.13]
      ], { color: '#D64545', weight: 2, fillOpacity: 0.05, dashArray: '5, 5' }).addTo(map);
      bhalswaPolygon.bindTooltip('Ward 1: Sector 12 / Bhalswa Landfill', { sticky: true });

      const sec9Polygon = L.polygon([
        [28.69, 77.17], [28.69, 77.21], [28.72, 77.21], [28.72, 77.17]
      ], { color: '#E8A33D', weight: 2, fillOpacity: 0.05, dashArray: '5, 5' }).addTo(map);
      sec9Polygon.bindTooltip('Ward 2: Sector 9 Market Area', { sticky: true });

      // Add Hotspot Markers with Severity Pill (color + icon + label for WCAG accessibility)
      hotspots.forEach((h) => {
        const isCritical = h.severity === 'critical' || h.risk_score >= 80;
        const isMod = h.severity === 'moderate' || (h.risk_score >= 50 && h.risk_score < 80);
        const bgColor = isCritical ? '#D64545' : isMod ? '#E8A33D' : '#4C8C4A';
        const iconEmoji = h.dominant_category === 'smoke' ? '🔥' : h.dominant_category === 'dust' ? '🏗️' : h.dominant_category === 'industry' ? '🏭' : '🚌';
        const labelText = isCritical ? 'CRITICAL' : isMod ? 'MODERATE' : 'LOW';

        const customIcon = L.divIcon({
          className: 'custom-hotspot-marker',
          html: `
            <div style="background-color: ${bgColor}; color: white; padding: 4px 10px; border-radius: 9999px; font-weight: bold; font-size: 11px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); border: 2px solid white; display: flex; items-center: center; gap: 4px; white-space: nowrap; cursor: pointer; transform: translate(-50%, -50%);">
              <span>${iconEmoji}</span>
              <span>${Math.round(h.risk_score)} ${h.trend_indicator || '→'}</span>
              <span style="font-size: 9px; opacity: 0.9; text-transform: uppercase;">(${labelText})</span>
            </div>
          `,
          iconSize: [110, 30],
          iconAnchor: [55, 15]
        });

        const marker = L.marker([h.centroid_lat || 28.745, h.centroid_lon || 77.162], { icon: customIcon }).addTo(map);

        // Add circle around hotspot centroid
        L.circle([h.centroid_lat || 28.745, h.centroid_lon || 77.162], {
          radius: isCritical ? 900 : 600,
          color: bgColor,
          fillColor: bgColor,
          fillOpacity: 0.15,
          weight: 1
        }).addTo(map);

        const popupHtml = `
          <div style="font-family: sans-serif; min-width: 220px; padding: 4px;">
            <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #eee; padding-bottom: 6px; margin-bottom: 8px;">
              <strong style="font-size: 14px; color: #1F6F5C;">${h.name}</strong>
              <span style="background: ${bgColor}; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold;">${labelText}</span>
            </div>
            <div style="font-size: 12px; line-height: 1.6; color: #333;">
              <div>• <strong>Risk Score:</strong> ${Math.round(h.risk_score)}/100 (${h.trend_indicator || '→'})</div>
              <div>• <strong>Dominant Pollutant:</strong> ${h.dominant_category?.toUpperCase()}</div>
              <div>• <strong>Active Citizen Reports:</strong> ${h.active_reports_count || 0}</div>
              <div>• <strong>Status:</strong> <span style="text-transform: uppercase; font-weight: bold; color: ${h.status === 'resolved' ? '#4C8C4A' : '#E8A33D'}">${h.status}</span></div>
            </div>
          </div>
        `;

        marker.bindPopup(popupHtml);

        if (onSelectHotspot) {
          marker.on('click', () => {
            onSelectHotspot(h);
          });
        }
      });

      // Add Citizen Report Markers (Small dots snapped to grid)
      reports.forEach((r) => {
        const dotColor = r.category === 'smoke' ? '#D64545' : r.category === 'dust' ? '#E8A33D' : r.category === 'industry' ? '#8E44AD' : '#3498DB';
        const dotIcon = L.divIcon({
          className: 'custom-report-dot',
          html: `<div style="width: 12px; height: 12px; background: ${dotColor}; border: 2px solid white; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"></div>`,
          iconSize: [12, 12],
          iconAnchor: [6, 6]
        });

        const rMarker = L.marker([r.lat, r.lon], { icon: dotIcon }).addTo(map);
        rMarker.bindPopup(`
          <div style="font-family: sans-serif; font-size: 12px; min-width: 180px;">
            <div style="font-weight: bold; color: #1F6F5C; margin-bottom: 4px;">[#${r.tracking_id}] ${r.category?.toUpperCase()}</div>
            <div style="color: #666; font-size: 11px; margin-bottom: 6px;">Locality: ${r.locality_name || 'Delhi Ward'}</div>
            <div style="background: #f7f8fa; padding: 6px; border-radius: 4px; font-style: italic; margin-bottom: 6px;">"${r.description || 'Citizen reported incident'}"</div>
            <div style="font-size: 10px; font-weight: bold; color: ${r.status === 'resolved' ? '#4C8C4A' : '#E8A33D'}">Status: ${r.status?.toUpperCase()}</div>
            ${r.action_taken ? `<div style="font-size: 10px; color: #444; margin-top: 4px;"><strong>Action:</strong> ${r.action_taken}</div>` : ''}
          </div>
        `);
      });
    });

    return () => {
      // Don't destroy map on every re-render to preserve view state, just let cleanup happen when component unmounts
    };
  }, [hotspots, reports]);

  return (
    <div className="relative w-full h-[500px] sm:h-[600px] rounded-2xl overflow-hidden shadow-glass border border-gray-200 z-10 bg-gray-100">
      <div ref={containerRef} className="w-full h-full" />
      
      {/* Map Legend (WCAG compliant with color + icon + text) */}
      <div className="absolute bottom-4 left-4 z-20 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl shadow-xl border border-gray-200 text-xs space-y-2 max-w-xs">
        <div className="font-extrabold text-gray-900 border-b border-gray-200 pb-1.5 flex items-center justify-between">
          <span>📍 Hotspot Severity & Icons</span>
          <span className="text-[9px] bg-teal-100 text-teal-800 px-1.5 py-0.5 rounded font-bold">Live Grid</span>
        </div>
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-red-600 inline-block border border-red-800 shadow-sm"></span>
            <span className="font-bold text-gray-800">🔥 Critical (Score ≥ 80)</span>
            <span className="text-[10px] text-red-600 font-bold ml-auto">Tanker Alert</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-amber-500 inline-block border border-amber-800 shadow-sm"></span>
            <span className="font-bold text-gray-800">🏗️ Moderate (Score 50-79)</span>
            <span className="text-[10px] text-amber-700 font-semibold ml-auto">Inspect</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block border border-green-800 shadow-sm"></span>
            <span className="font-bold text-gray-800">🟢 Low / Resolved (&lt;50)</span>
            <span className="text-[10px] text-emerald-700 font-semibold ml-auto">Stable</span>
          </div>
        </div>
        <div className="pt-1.5 border-t border-gray-200/80">
          <div className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider mb-1">Pollutant Icons</div>
          <div className="grid grid-cols-2 gap-1 text-[11px] font-medium text-gray-700">
            <span>🔥 Smoke / Fires</span>
            <span>🏗️ Construction Dust</span>
            <span>🏭 Industrial Plume</span>
            <span>🚌 Traffic Exhaust</span>
          </div>
        </div>
      </div>
    </div>
  );
};
