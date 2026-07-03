import React, { useState, useEffect } from 'react';
import { Language, t } from '../lib/i18n';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { ShieldAlert, AlertTriangle, CheckCircle, TrendingUp, Download, Zap, RefreshCw, Layers, CheckCircle2, ArrowRight, Activity } from 'lucide-react';

interface OfficerViewProps {
  hotspots: any[];
  user: any | null;
  token: string | null;
  onLoginClick: () => void;
  onRefresh: () => void;
  lang: Language;
}

export const OfficerView: React.FC<OfficerViewProps> = ({
  hotspots,
  user,
  token,
  onLoginClick,
  onRefresh,
  lang
}) => {
  const [selectedHotspotId, setSelectedHotspotId] = useState<string | null>(null);
  const [hotspotDetail, setHotspotDetail] = useState<any | null>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [actionInput, setActionInput] = useState('');
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [demoSpikeLoading, setDemoSpikeLoading] = useState(false);
  const [demoSpikeSuccess, setDemoSpikeSuccess] = useState('');

  // Fetch alerts
  const fetchAlerts = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/v1/alerts', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAlerts(data.alerts || []);
      }
    } catch (err) {
      console.error('Error fetching alerts:', err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchAlerts();
    }
  }, [token]);

  // Fetch hotspot detail when selected
  useEffect(() => {
    if (!selectedHotspotId || !token) return;
    setLoadingDetail(true);
    fetch(`/api/v1/hotspots/${selectedHotspotId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.hotspot) {
          setHotspotDetail(data.hotspot);
          setActionInput('');
        }
      })
      .catch(err => console.error('Error fetching hotspot detail:', err))
      .finally(() => setLoadingDetail(false));
  }, [selectedHotspotId, token]);

  if (!user || !token) {
    return (
      <div className="bg-white p-12 rounded-3xl shadow-xl border border-gray-100 text-center max-w-xl mx-auto my-12 space-y-6">
        <div className="w-20 h-20 bg-emerald-100 text-primary rounded-full flex items-center justify-center mx-auto shadow-inner">
          <ShieldAlert className="w-10 h-10" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Municipal Officer Dashboard Access</h2>
          <p className="text-sm text-gray-600 mt-2">
            This workspace requires official role-based authentication. Please sign in with your municipal credentials to access ward-scoped hotspot queues, telemetry forecasts, and dispatch controls.
          </p>
        </div>
        <button
          onClick={onLoginClick}
          className="bg-primary hover:bg-primary-dark text-white font-bold py-3.5 px-8 rounded-2xl shadow-lg transition-all text-base inline-flex items-center space-x-2"
        >
          <span>Authenticate with Official Email</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    );
  }

  const handleStatusUpdate = async (newStatus: 'new' | 'inspecting' | 'resolved') => {
    if (!selectedHotspotId || !token) return;
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/v1/hotspots/${selectedHotspotId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          status: newStatus,
          action_taken: actionInput || `Status updated to ${newStatus.toUpperCase()} by Municipal Officer`
        })
      });

      if (res.ok) {
        onRefresh();
        // reload detail
        const dRes = await fetch(`/api/v1/hotspots/${selectedHotspotId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const dData = await dRes.json();
        if (dData.hotspot) setHotspotDetail(dData.hotspot);
      }
    } catch (err) {
      console.error('Error updating status:', err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAcknowledgeAlert = async (alertId: string) => {
    if (!token) return;
    try {
      await fetch(`/api/v1/alerts/${alertId}/acknowledge`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'acknowledged' })
      });
      fetchAlerts();
    } catch (err) {
      console.error('Error acknowledging alert:', err);
    }
  };

  const handleTriggerDemoSpike = async () => {
    setDemoSpikeLoading(true);
    setDemoSpikeSuccess('');
    try {
      const res = await fetch('/api/v1/sensors/trigger-spike', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_id: 'sensor-bhalswa-n1',
          pm25: 350.0,
          duration_seconds: 300
        })
      });
      if (res.ok) {
        setDemoSpikeSuccess(t(lang, 'demoTriggerSuccess'));
        onRefresh();
        fetchAlerts();
        setTimeout(() => setDemoSpikeSuccess(''), 6000);
      }
    } catch (err) {
      console.error('Error triggering demo spike:', err);
    } finally {
      setDemoSpikeLoading(false);
    }
  };

  const handleExport = (format: 'csv' | 'txt') => {
    const url = `/api/v1/analytics/export?format=${format}&ward_id=${user.ward_id || ''}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Officer Top Bar & Badges */}
      <div className="bg-white p-6 rounded-3xl shadow-card border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="bg-primary-dark/10 p-3.5 rounded-2xl border border-primary/20">
            <Layers className="w-8 h-8 text-primary-dark" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">{t(lang, 'officerPortal')}</h2>
              <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded-full font-bold uppercase">
                {user.role}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
              {t(lang, 'wardAssigned')}: <strong className="text-primary-dark font-bold">{user.ward_id ? user.ward_id.replace('ward-1-', '') : 'Municipal Aggregation (All Wards)'}</strong>
            </p>
          </div>
        </div>

        {/* Action Controls: Live Demo Spike + Export */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleTriggerDemoSpike}
            disabled={demoSpikeLoading}
            className="bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-700 hover:to-amber-700 text-white font-extrabold py-2.5 px-4 rounded-xl shadow-md transition-all flex items-center space-x-2 text-xs active:scale-95 animate-pulse"
          >
            <Zap className="w-4 h-4" />
            <span>{demoSpikeLoading ? 'Injecting Spike...' : t(lang, 'demoTriggerBtn')}</span>
          </button>

          <button
            onClick={() => handleExport('csv')}
            className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-2.5 px-4 rounded-xl transition-all flex items-center space-x-1.5 text-xs border border-gray-200"
          >
            <Download className="w-4 h-4 text-primary" />
            <span>{t(lang, 'exportCsv')}</span>
          </button>

          <button
            onClick={() => handleExport('txt')}
            className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-2.5 px-4 rounded-xl transition-all flex items-center space-x-1.5 text-xs border border-gray-200"
          >
            <Download className="w-4 h-4 text-primary" />
            <span>{t(lang, 'exportBriefing')}</span>
          </button>
        </div>
      </div>

      {demoSpikeSuccess && (
        <div className="bg-red-50 border-2 border-red-500 text-red-900 p-4 rounded-2xl shadow-lg flex items-center justify-between animate-bounce">
          <div className="flex items-center space-x-3 font-bold">
            <Zap className="w-6 h-6 text-red-600" />
            <span>{demoSpikeSuccess}</span>
          </div>
        </div>
      )}

      {/* Active Critical Alerts Banner */}
      {alerts.length > 0 && (
        <div className="bg-gradient-to-r from-red-50 via-amber-50 to-red-50 border-2 border-red-300 p-5 rounded-3xl shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-red-800 font-extrabold text-base">
              <AlertTriangle className="w-6 h-6 text-red-600 animate-bounce" />
              <span>🚨 {alerts.length} {t(lang, 'activeAlerts')}</span>
            </div>
            <span className="text-xs bg-red-600 text-white font-bold px-3 py-1 rounded-full">
              Immediate Intervention Required
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {alerts.map((a) => (
              <div key={a.id} className="bg-white p-4 rounded-2xl border border-red-200 shadow-sm flex items-center justify-between">
                <div>
                  <div className="font-bold text-gray-900 text-sm">{a.locality_name || `Grid Cell ${a.grid_cell_id}`}</div>
                  <div className="text-xs text-red-600 font-semibold mt-0.5">
                    Risk Score: <strong className="text-base">{Math.round(a.risk_score)}/100</strong> | Action: {a.recommended_action || 'DISPATCH_CREW'}
                  </div>
                  <div className="text-[10px] text-gray-400 mt-1">Triggered at: {new Date(a.created_at).toLocaleTimeString()}</div>
                </div>
                <button
                  onClick={() => handleAcknowledgeAlert(a.id)}
                  className="bg-red-100 hover:bg-red-200 text-red-800 font-extrabold px-3.5 py-2 rounded-xl text-xs transition-all border border-red-300 active:scale-95"
                >
                  {t(lang, 'acknowledge')}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Prioritized Hotspot Intervention Queue */}
      <div className="bg-white p-6 rounded-3xl shadow-card border border-gray-100 space-y-6">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
              <span>🔥</span>
              <span>{t(lang, 'hotspotQueue')}</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Ranked by composite risk formula: <code>0.5*PM2.5 + 0.3*Complaints + 0.15*Severity + 0.05*Satellite</code>
            </p>
          </div>
          <button
            onClick={onRefresh}
            className="text-xs font-bold text-primary hover:text-primary-dark flex items-center space-x-1 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Queue</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-xs font-extrabold text-gray-500 uppercase tracking-wider bg-gray-50/70">
                <th className="py-3 px-4 rounded-l-xl">Hotspot Location</th>
                <th className="py-3 px-4">Ward Scope</th>
                <th className="py-3 px-4">{t(lang, 'riskScore')}</th>
                <th className="py-3 px-4">{t(lang, 'trend')}</th>
                <th className="py-3 px-4">{t(lang, 'dominantPollutant')}</th>
                <th className="py-3 px-4">Active Complaints</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right rounded-r-xl">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {hotspots.map((h) => {
                const isCritical = h.severity === 'critical' || h.risk_score >= 80;
                const isMod = h.severity === 'moderate' || (h.risk_score >= 50 && h.risk_score < 80);
                const isSelected = selectedHotspotId === h.id;

                return (
                  <tr
                    key={h.id}
                    onClick={() => setSelectedHotspotId(h.id)}
                    className={`hover:bg-emerald-50/50 cursor-pointer transition-colors ${
                      isSelected ? 'bg-emerald-50 font-medium' : ''
                    }`}
                  >
                    <td className="py-4 px-4 font-bold text-gray-900">{h.name}</td>
                    <td className="py-4 px-4 text-xs font-semibold text-gray-600">{h.ward_id ? h.ward_id.replace('ward-1-', '') : 'Ward 1'}</td>
                    <td className="py-4 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-extrabold text-white inline-block ${
                        isCritical ? 'bg-critical' : isMod ? 'bg-moderate' : 'bg-low'
                      }`}>
                        {Math.round(h.risk_score)}/100
                      </span>
                    </td>
                    <td className="py-4 px-4 font-extrabold text-base text-gray-700">
                      <span className={h.trend_indicator === '↑' ? 'text-red-600 font-black' : h.trend_indicator === '↓' ? 'text-green-600 font-black' : ''}>
                        {h.trend_indicator || '→'}
                      </span>
                    </td>
                    <td className="py-4 px-4 uppercase font-bold text-xs text-gray-800">
                      {h.dominant_category === 'smoke' ? '🔥 Smoke' : h.dominant_category === 'dust' ? '🏗️ Dust' : h.dominant_category === 'industry' ? '🏭 Industry' : '🚌 Traffic'}
                    </td>
                    <td className="py-4 px-4 font-bold text-gray-700">{h.active_reports_count || 0}</td>
                    <td className="py-4 px-4">
                      <span className={`px-2.5 py-0.5 rounded text-xs font-extrabold uppercase ${
                        h.status === 'resolved' ? 'bg-green-100 text-green-800' : h.status === 'inspecting' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {h.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedHotspotId(h.id); }}
                        className="bg-primary hover:bg-primary-dark text-white text-xs font-bold px-3.5 py-1.5 rounded-lg shadow-sm transition-all inline-flex items-center space-x-1"
                      >
                        <span>Analyze</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Hotspot Detail View & Recharts Forecast Visualization */}
      {selectedHotspotId && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-card border-2 border-primary space-y-8 animate-fade-in">
          {loadingDetail ? (
            <div className="text-center py-12 text-gray-500 font-semibold">Loading hotspot telemetry & forecast model...</div>
          ) : hotspotDetail ? (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">⚡</span>
                    <h3 className="text-xl sm:text-2xl font-extrabold text-gray-900">{hotspotDetail.name}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase text-white ${
                      hotspotDetail.severity === 'critical' ? 'bg-critical' : hotspotDetail.severity === 'moderate' ? 'bg-moderate' : 'bg-low'
                    }`}>
                      {hotspotDetail.severity} ({Math.round(hotspotDetail.risk_score)}/100)
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Grid ID: <strong>{hotspotDetail.id}</strong> | Ward: <strong>{hotspotDetail.ward_id}</strong> | Dominant: <strong className="uppercase">{hotspotDetail.dominant_category}</strong>
                  </p>
                </div>

                {/* Status Update Stepper Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-gray-600 mr-1">Intervention:</span>
                  <button
                    onClick={() => handleStatusUpdate('inspecting')}
                    disabled={updatingStatus || hotspotDetail.status === 'inspecting'}
                    className={`px-3.5 py-2 rounded-xl font-extrabold text-xs transition-all shadow-sm ${
                      hotspotDetail.status === 'inspecting'
                        ? 'bg-amber-600 text-white shadow-md'
                        : 'bg-amber-100 text-amber-900 hover:bg-amber-200 border border-amber-300'
                    }`}
                  >
                    🚧 {t(lang, 'markInspecting')}
                  </button>
                  <button
                    onClick={() => handleStatusUpdate('resolved')}
                    disabled={updatingStatus || hotspotDetail.status === 'resolved'}
                    className={`px-3.5 py-2 rounded-xl font-extrabold text-xs transition-all shadow-sm ${
                      hotspotDetail.status === 'resolved'
                        ? 'bg-green-600 text-white shadow-md'
                        : 'bg-green-100 text-green-900 hover:bg-green-200 border border-green-300'
                    }`}
                  >
                    ✅ {t(lang, 'markResolved')}
                  </button>
                </div>
              </div>

              {/* Formula Component Breakdown Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-emerald-50/60 p-3.5 rounded-2xl border border-emerald-200">
                  <div className="text-gray-500 font-semibold">PM2.5 Index (Weight 50%):</div>
                  <div className="text-lg font-extrabold text-primary-dark mt-0.5">{hotspotDetail.components?.pm25 || 0}/100</div>
                </div>
                <div className="bg-amber-50/60 p-3.5 rounded-2xl border border-amber-200">
                  <div className="text-gray-500 font-semibold">Complaints Index (30%):</div>
                  <div className="text-lg font-extrabold text-amber-900 mt-0.5">{hotspotDetail.components?.complaint || 0}/100</div>
                </div>
                <div className="bg-red-50/60 p-3.5 rounded-2xl border border-red-200">
                  <div className="text-gray-500 font-semibold">AI Severity (Weight 15%):</div>
                  <div className="text-lg font-extrabold text-red-900 mt-0.5">{hotspotDetail.components?.severity || 0}/100</div>
                </div>
                <div className="bg-purple-50/60 p-3.5 rounded-2xl border border-purple-200">
                  <div className="text-gray-500 font-semibold">Satellite Index (Weight 5%):</div>
                  <div className="text-lg font-extrabold text-purple-900 mt-0.5">{hotspotDetail.components?.satellite || 0}/100</div>
                </div>
              </div>

              {/* Recharts Sensor Trend & Forecast Chart (PRD Section 4.6 requirement) */}
              <div className="bg-gray-50/80 p-5 rounded-3xl border border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 font-bold text-gray-800 text-sm">
                    <Activity className="w-5 h-5 text-primary" />
                    <span>{t(lang, 'forecastTitle')}</span>
                  </div>
                  <div className="flex items-center space-x-4 text-xs font-semibold">
                    <span className="flex items-center space-x-1.5">
                      <span className="w-3 h-0.5 bg-primary-dark inline-block"></span>
                      <span>{t(lang, 'sensorHistory')}</span>
                    </span>
                    <span className="flex items-center space-x-1.5">
                      <span className="w-3 h-0.5 bg-red-500 border-t-2 border-dashed border-red-500 inline-block"></span>
                      <span className="text-red-700">{t(lang, 'forecastSeries')}</span>
                    </span>
                  </div>
                </div>

                <div className="w-full h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={hotspotDetail.chart_data || []} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="time" stroke="#6b7280" fontSize={11} />
                      <YAxis stroke="#6b7280" fontSize={11} domain={[0, 100]} label={{ value: 'Risk Score (0-100)', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="historical_score"
                        name="Historical Risk Score"
                        stroke="#1F6F5C"
                        strokeWidth={3}
                        dot={{ r: 4, fill: '#1F6F5C' }}
                        connectNulls
                      />
                      <Line
                        type="monotone"
                        dataKey="forecast_score"
                        name="24h AI Predictive Forecast"
                        stroke="#D64545"
                        strokeWidth={3}
                        strokeDasharray="6 6"
                        dot={{ r: 4, fill: '#D64545' }}
                        connectNulls
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-[11px] text-gray-500 italic text-right">
                  * Dashed red line represents EWMA + trend extrapolation predicting pollution spikes over the next 24 hours.
                </p>
              </div>

              {/* Action Log Input Section */}
              <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200 space-y-3">
                <label className="block text-xs font-bold text-gray-800">{t(lang, 'actionLog')}</label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={actionInput}
                    onChange={(e) => setActionInput(e.target.value)}
                    placeholder="e.g., Water-mist cannon deployed; sanitation crew clearing solid waste..."
                    className="flex-1 p-3 bg-white border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none"
                  />
                  <button
                    onClick={() => handleStatusUpdate(hotspotDetail.status === 'new' ? 'inspecting' : hotspotDetail.status)}
                    disabled={updatingStatus}
                    className="bg-primary hover:bg-primary-dark text-white font-bold px-5 py-3 rounded-xl shadow-md text-sm transition-all"
                  >
                    Log Action
                  </button>
                </div>
              </div>

              {/* Linked Citizen Reports in this Grid Cell */}
              <div className="space-y-4">
                <h4 className="font-bold text-gray-800 text-sm flex items-center space-x-2">
                  <span>💬</span>
                  <span>{t(lang, 'linkedReports')} ({hotspotDetail.linked_reports?.length || 0})</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(hotspotDetail.linked_reports || []).map((r: any) => (
                    <div key={r.id} className="p-4 rounded-xl border border-gray-200 bg-white shadow-sm space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono font-bold text-primary">#{r.tracking_id}</span>
                        <span className="bg-gray-100 px-2 py-0.5 rounded font-bold uppercase text-[10px] text-gray-700">{r.category}</span>
                      </div>
                      <p className="text-xs text-gray-700 italic bg-gray-50 p-2 rounded border border-gray-100">
                        "{r.description || 'No text'}"
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-gray-500">
                        <span>AI Conf: {r.ai_confidence ? `${Math.round(r.ai_confidence * 100)}%` : 'N/A'}</span>
                        <span className="font-bold uppercase text-primary">{r.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
};
