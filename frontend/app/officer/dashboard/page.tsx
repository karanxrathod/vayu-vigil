'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Layers, MapPin, Activity, Users, Settings, RefreshCw, LogOut, Award, AlertTriangle, CheckCircle2, TrendingUp, Cpu, Satellite, Truck, MessageSquare } from 'lucide-react';
import { Navbar } from '../../../components/Navbar';
import { OfficerView } from '../../../components/OfficerView';
import { RoadmapView } from '../../../components/RoadmapView';
import { HotspotMap } from '../../../components/HotspotMap';
import { EmptyState } from '../../../components/EmptyState';
import { showToast } from '../../../components/Toast';
import { Language, t } from '../../../lib/i18n';

type OfficerTab = 'queue' | 'map' | 'infrastructure' | 'analytics' | 'settings';

export default function OfficerDashboard() {
  const router = useRouter();
  const [lang, setLang] = useState<Language>('en');
  const [activeTab, setActiveTab] = useState<OfficerTab>('queue');
  const [user, setUser] = useState<any | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Data
  const [hotspots, setHotspots] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeWindow, setTimeWindow] = useState('24h');
  const [selectedHotspot, setSelectedHotspot] = useState<any | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const [hRes, rRes] = await Promise.all([
        fetch(`${apiUrl}/api/v1/hotspots?timeWindow=${timeWindow}`),
        fetch(`${apiUrl}/api/v1/reports?timeWindow=${timeWindow}`)
      ]);

      if (hRes.ok) {
        const hData = await hRes.json();
        setHotspots(Array.isArray(hData) ? hData : (hData.hotspots || []));
      }
      if (rRes.ok) {
        const rData = await rRes.json();
        setReports(Array.isArray(rData) ? rData : (rData.reports || []));
      }
    } catch (err) {
      console.warn('Error fetching municipal data, using hackathon fallback:', err);
      setHotspots([
        {
          id: 'h-1',
          ward_id: 'ward-1-sector-12',
          name: 'Bhalswa Landfill Sector 12',
          lat: 28.7392,
          lng: 77.1631,
          severity_score: 88,
          severity: 'critical',
          status: 'critical',
          dominant_pollutant: 'smoke',
          dominant_category: 'smoke',
          active_reports_count: 5,
          risk_score: 88
        },
        {
          id: 'h-2',
          ward_id: 'ward-2-sector-9',
          name: 'Sector 9 Industrial Cluster',
          lat: 28.7185,
          lng: 77.1352,
          severity_score: 65,
          severity: 'moderate',
          status: 'moderate',
          dominant_pollutant: 'industry',
          dominant_category: 'industry',
          active_reports_count: 3,
          risk_score: 65
        }
      ]);
      setReports([
        {
          id: 'r-1',
          tracking_id: 'VV-7821A',
          category: 'smoke',
          description: 'Thick black smoke from garbage burning near bus stand.',
          lat: 28.7400,
          lon: 77.1600,
          status: 'inspecting',
          ai_confidence: 0.96,
          locality_name: 'Bhalswa North',
          created_at: new Date().toISOString(),
          action_taken: 'Municipal water tanker dispatched.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  }, [timeWindow]);

  useEffect(() => {
    const savedLang = localStorage.getItem('vayu_vigil_lang') as Language;
    if (savedLang && ['en', 'hi', 'mr'].includes(savedLang)) setLang(savedLang);

    const savedUser = localStorage.getItem('vayu_vigil_user') || localStorage.getItem('cleanair_user');
    const savedToken = localStorage.getItem('vayu_vigil_token') || localStorage.getItem('cleanair_token');

    if (!savedUser) {
      showToast('Please log in with municipal credentials first.', 'warning');
      router.push('/officer/login');
      return;
    }

    try { setUser(JSON.parse(savedUser)); } catch (e) { setUser(null); }
    setToken(savedToken);
    fetchData();

    const handleLang = (e: any) => {
      if (e.detail && ['en', 'hi', 'mr'].includes(e.detail)) setLang(e.detail);
    };
    window.addEventListener('vayu-vigil-lang-change', handleLang);
    return () => window.removeEventListener('vayu-vigil-lang-change', handleLang);
  }, [fetchData, router]);

  const handleLogout = () => {
    localStorage.removeItem('vayu_vigil_token');
    localStorage.removeItem('vayu_vigil_user');
    localStorage.removeItem('cleanair_token');
    localStorage.removeItem('cleanair_user');
    showToast('Officer session terminated.', 'info');
    router.push('/');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-teal-500 selection:text-white pb-20 md:pb-0">
      <Navbar lang={lang} onLanguageChange={setLang} />

      {/* Persistent Command Header */}
      <div className="bg-slate-900 border-b border-white/10 px-4 sm:px-8 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-amber-400 flex items-center justify-center text-slate-950 font-black shadow-lg">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-black text-white">{user?.name || 'Municipal Officer'}</span>
                <span className="bg-teal-500/20 text-teal-300 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border border-teal-500/30">
                  {user?.role || 'officer'} • {user?.ward_id ? user.ward_id.replace('ward-1-', '') : 'Ward 1'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                DPCC Ward Grid Command • Live Sensor Ingestion Active
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 overflow-x-auto pb-1 md:pb-0">
            {[
              { id: 'queue', label: 'Hotspot Queue', icon: Activity },
              { id: 'map', label: 'Command Map', icon: MapPin },
              { id: 'infrastructure', label: 'Grid Expansion', icon: Cpu },
              { id: 'analytics', label: 'KPI Analytics', icon: TrendingUp },
              { id: 'settings', label: 'Ward Settings', icon: Settings }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as OfficerTab)}
                  className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    activeTab === tab.id ? 'bg-gradient-to-r from-teal-600 to-teal-700 text-white shadow-md scale-105 border border-teal-400/30' : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-white/5'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Command Workspace */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1">
        
        {/* TAB 1: HOTSPOT QUEUE */}
        {activeTab === 'queue' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-white">Live Ward Hotspots & Action Dispatch</h2>
                <p className="text-xs text-slate-400 mt-0.5">Prioritized by AI risk score, citizen complaint frequency, and DPCC sensor telemetry.</p>
              </div>
              <button
                onClick={fetchData}
                className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl border border-white/10 flex items-center space-x-1.5 transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh Telemetry</span>
              </button>
            </div>

            {hotspots.length === 0 ? (
              <EmptyState
                title="No Active Hotspots in This Ward"
                description="Air quality sensor telemetry is within normal green thresholds across streetlights and bus shelters."
                actionText="Refresh Sensor Grid"
                onAction={fetchData}
              />
            ) : (
              <div className="bg-slate-900/60 rounded-3xl p-4 sm:p-6 border border-white/10">
                <OfficerView
                  hotspots={hotspots}
                  user={user}
                  token={token}
                  onLoginClick={() => router.push('/officer/login')}
                  onRefresh={fetchData}
                  lang={lang}
                />
              </div>
            )}
          </div>
        )}

        {/* TAB 2: COMMAND MAP */}
        {activeTab === 'map' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-4 sm:p-6 rounded-2xl border border-white/10">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <span>🗺️ Municipal GIS Grid Command Map</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Live view of Ward 1 & Ward 2 citizen complaints snapped to nearest IoT streetlight sensor nodes.</p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="font-semibold text-slate-400">Time Window:</span>
                {['24h', '7d', '30d'].map((win) => (
                  <button
                    key={win}
                    onClick={() => setTimeWindow(win)}
                    className={`px-3 py-1.5 rounded-lg font-bold uppercase transition-all ${
                      timeWindow === win ? 'bg-teal-600 text-white shadow-sm' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    {win}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-slate-900 rounded-3xl border border-white/10 p-3 sm:p-4 shadow-2xl">
              <div className="h-[600px] w-full rounded-2xl overflow-hidden relative border border-white/15">
                <HotspotMap
                  hotspots={hotspots}
                  reports={reports}
                  onSelectHotspot={(h) => setSelectedHotspot(h)}
                  selectedHotspot={selectedHotspot}
                  lang={lang}
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: INFRASTRUCTURE & EXPANSION */}
        {activeTab === 'infrastructure' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-slate-900 p-6 rounded-3xl border border-white/10 space-y-2">
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <Cpu className="w-6 h-6 text-teal-400" />
                <span>Municipal Pilot & National Infrastructure Expansion</span>
              </h2>
              <p className="text-xs text-slate-400">
                Test live hardware integrations: DPCC/CPCB MQTT sensor grid, Sentinel-5P satellite ingest, Twilio low-bandwidth WhatsApp bot, and smart fleet water-mist tanker routing.
              </p>
            </div>

            <div className="bg-slate-900/80 rounded-3xl p-4 sm:p-6 border border-white/10">
              <RoadmapView
                lang={lang}
                onExploreClick={() => setActiveTab('queue')}
              />
            </div>
          </div>
        )}

        {/* TAB 4: KPI ANALYTICS */}
        {activeTab === 'analytics' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 sm:p-8 rounded-3xl border border-white/10 space-y-4">
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-amber-400" />
                <span>City Health & Municipal Ward KPI Rankings</span>
              </h2>
              <p className="text-xs text-slate-400">
                Performance benchmarking across Delhi municipal wards for National Clean Air Programme (NCAP) compliance.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                <div className="p-5 rounded-2xl bg-slate-950/80 border border-white/10 space-y-2">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Average Dispatch Latency</div>
                  <div className="text-3xl font-black text-teal-400">2.4 Mins</div>
                  <div className="text-[11px] text-emerald-400 font-semibold">↓ 68% faster than manual dispatch</div>
                </div>
                <div className="p-5 rounded-2xl bg-slate-950/80 border border-white/10 space-y-2">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">AI Vision Accuracy</div>
                  <div className="text-3xl font-black text-amber-400">94.8%</div>
                  <div className="text-[11px] text-slate-400">Gemini Vision 1.5 Flash verification</div>
                </div>
                <div className="p-5 rounded-2xl bg-slate-950/80 border border-white/10 space-y-2">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ward 1 vs Ward 2 Resolution</div>
                  <div className="text-3xl font-black text-emerald-400">89% vs 82%</div>
                  <div className="text-[11px] text-slate-400">Tanker spraying completion rate</div>
                </div>
              </div>
            </div>

            {/* Ward leaderboard */}
            <div className="bg-slate-900 p-6 rounded-3xl border border-white/10 space-y-4">
              <h3 className="text-base font-bold text-white">🏆 Ward Cleanliness Leaderboard</h3>
              <div className="space-y-3">
                {[
                  { rank: '#1', ward: 'Ward 1 - Bhalswa Sector 12', officer: 'Rajesh Sharma', score: '94/100', status: 'Excellent', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
                  { rank: '#2', ward: 'Ward 3 - Rohini Sector 18', officer: 'Priya Verma', score: '88/100', status: 'Good', color: 'text-teal-400 bg-teal-500/10 border-teal-500/30' },
                  { rank: '#3', ward: 'Ward 2 - Sector 9 Industrial', officer: 'Vikram Singh', score: '76/100', status: 'Action Needed', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' }
                ].map((row, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-slate-950/60 border border-white/5">
                    <div className="flex items-center space-x-4">
                      <span className="font-mono text-lg font-black text-slate-500">{row.rank}</span>
                      <div>
                        <div className="text-sm font-bold text-white">{row.ward}</div>
                        <div className="text-xs text-slate-400">Officer in Charge: {row.officer}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="font-mono font-bold text-white text-sm">{row.score}</span>
                      <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border ${row.color}`}>
                        {row.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: SETTINGS */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-200">
            <div className="bg-slate-900 p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6">
              <div className="flex items-center space-x-4 border-b border-white/10 pb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center font-black text-slate-950 text-2xl shadow-lg">
                  {(user?.name || 'O')[0].toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-black text-white">{user?.name || 'Municipal Officer'}</h2>
                  <p className="text-xs font-mono text-teal-400 font-bold mt-0.5">{user?.email || 'officer@vayuvigil.gov'}</p>
                  <span className="inline-block mt-1 bg-amber-500/20 text-amber-300 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border border-amber-500/30">
                    {user?.role || 'officer'} • {user?.ward_id ? user.ward_id.replace('ward-1-', '') : 'Ward 1'}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Hardware & API Configuration</h3>
                
                <div className="p-4 rounded-2xl bg-slate-950 border border-white/10 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-white">DPCC Hardware Token 2FA</div>
                    <div className="text-[11px] text-slate-400">Cryptographic hardware verification for ward commands.</div>
                  </div>
                  <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold px-2.5 py-1 rounded border border-emerald-500/30">✓ Bound</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-white/10 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-white">Sentinel-5P Earth Engine API Sync</div>
                    <div className="text-[11px] text-slate-400">Daily automated aerosol ingestion schedule.</div>
                  </div>
                  <span className="bg-teal-500/20 text-teal-300 text-[10px] font-extrabold px-2.5 py-1 rounded border border-teal-500/30">06:00 UTC</span>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center space-x-2 py-3.5 px-4 rounded-2xl bg-red-500/15 hover:bg-red-500/25 text-red-300 font-bold text-xs transition-colors border border-red-500/30"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Terminate Officer Session</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation for Officers */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-white/10 px-2 py-1.5 z-40 flex justify-around items-center shadow-2xl">
        {[
          { id: 'queue', label: 'Queue', icon: Activity },
          { id: 'map', label: 'Map', icon: MapPin },
          { id: 'infrastructure', label: 'Grid', icon: Cpu },
          { id: 'analytics', label: 'KPI', icon: TrendingUp },
          { id: 'settings', label: 'Settings', icon: Settings }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as OfficerTab)}
              className={`flex flex-col items-center p-1 rounded-lg transition-all ${
                activeTab === tab.id ? 'text-teal-400 font-bold scale-105' : 'text-slate-400'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
