'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, MapPin, Layers, Award, PlusCircle, Filter, Clock, RefreshCw, CheckCircle2, AlertTriangle, User, Home as HomeIcon, List, Settings, Sparkles, Globe, LogOut } from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { HotspotMap } from '../../components/HotspotMap';
import { ReportModal } from '../../components/ReportModal';
import { EmptyState } from '../../components/EmptyState';
import { showToast } from '../../components/Toast';
import { Language, t } from '../../lib/i18n';

type CitizenTab = 'home' | 'map' | 'reports' | 'profile';

export default function CitizenPortal() {
  const router = useRouter();
  const [lang, setLang] = useState<Language>('en');
  const [activeTab, setActiveTab] = useState<CitizenTab>('home');
  const [user, setUser] = useState<any | null>(null);
  const [isOnboarded, setIsOnboarded] = useState<boolean>(false);

  // Data states
  const [hotspots, setHotspots] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [timeWindow, setTimeWindow] = useState<string>('24h');

  // Modal
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [selectedHotspot, setSelectedHotspot] = useState<any | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const [hRes, rRes] = await Promise.all([
        fetch(`${apiUrl}/api/hotspots?timeWindow=${timeWindow}&category=${categoryFilter}`),
        fetch(`${apiUrl}/api/v1/reports?timeWindow=${timeWindow}&category=${categoryFilter}`)
      ]);

      if (hRes.ok) {
        const hData = await hRes.json();
        setHotspots(hData);
      }
      if (rRes.ok) {
        const rData = await rRes.json();
        setReports(rData);
      }
    } catch (err) {
      console.warn('Error fetching citizen data, using fallback data:', err);
      // Fallback data if API not reachable
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
        },
        {
          id: 'r-2',
          tracking_id: 'VV-9104B',
          category: 'dust',
          description: 'Heavy construction dust from road widening project.',
          lat: 28.7100,
          lon: 77.1400,
          status: 'resolved',
          ai_confidence: 0.92,
          locality_name: 'Sector 9 Market',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          action_taken: 'Water sprinkling completed by Ward 2 tanker.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, timeWindow]);

  useEffect(() => {
    const savedLang = localStorage.getItem('vayu_vigil_lang') as Language;
    if (savedLang && ['en', 'hi', 'mr'].includes(savedLang)) {
      setLang(savedLang);
    }

    const onboarded = localStorage.getItem('vayu_vigil_onboarded') === 'true' || localStorage.getItem('cleanair_onboarded') === 'true';
    setIsOnboarded(onboarded);

    const savedUser = localStorage.getItem('vayu_vigil_user') || localStorage.getItem('cleanair_user');
    if (savedUser) {
      try { setUser(JSON.parse(savedUser)); } catch (e) { setUser(null); }
    } else {
      setUser({ name: 'Community Citizen', role: 'citizen', ward_id: 'ward-1-sector-12' });
    }

    fetchData();

    const handleLang = (e: any) => {
      if (e.detail && ['en', 'hi', 'mr'].includes(e.detail)) setLang(e.detail);
    };
    window.addEventListener('vayu-vigil-lang-change', handleLang);
    return () => window.removeEventListener('vayu-vigil-lang-change', handleLang);
  }, [fetchData]);

  const handleLogout = () => {
    localStorage.clear();
    showToast('Logged out successfully', 'info');
    router.push('/');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F8FA] text-[#1C1F26] font-sans pb-20 md:pb-8">
      <Navbar lang={lang} onLanguageChange={setLang} />

      {/* Guest Mode Banner */}
      {!isOnboarded && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 py-2 px-4 text-center text-xs font-bold text-amber-800 flex items-center justify-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>You are exploring in Guest Mode.</span>
          <Link href="/onboarding" className="underline font-extrabold text-teal-800 hover:text-teal-950">
            Complete Citizen Onboarding
          </Link>
          <span>to enable SMS alerts and GPS snapping!</span>
        </div>
      )}

      {/* Main Content Container */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 space-y-6">
        
        {/* TAB 1: HOME */}
        {activeTab === 'home' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Hero Card */}
            <div className="bg-gradient-to-r from-[#0f172a] via-[#0d9488] to-[#0f172a] rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden">
              <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-72 h-72 bg-white/10 rounded-full blur-3xl pointer-events-none" />
              
              <div className="max-w-3xl relative z-10 space-y-4">
                <div className="inline-flex items-center space-x-2 bg-white/10 px-3 py-1 rounded-full text-xs font-bold text-teal-200 border border-white/20 backdrop-blur-md">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Citizen Community Portal • Ward Grid Intelligence</span>
                </div>
                <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
                  Welcome back, {user?.name || 'Citizen Vigilante'}!
                </h1>
                <p className="text-xs sm:text-sm text-teal-100/90 leading-relaxed">
                  You are viewing real-time air quality telemetry and community incident reports for your neighborhood. Report garbage fires, construction dust, or industrial plumes to dispatch municipal tankers instantly.
                </p>

                <div className="pt-2 flex flex-wrap items-center gap-4">
                  <button
                    onClick={() => setIsReportModalOpen(true)}
                    className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black py-3.5 px-6 rounded-2xl shadow-xl transition-all flex items-center space-x-2 text-sm transform hover:-translate-y-0.5 active:translate-y-0 uppercase tracking-wider"
                  >
                    <PlusCircle className="w-5 h-5 text-slate-950" />
                    <span>Report Pollution Incident</span>
                  </button>

                  <button
                    onClick={fetchData}
                    className="bg-white/10 hover:bg-white/20 text-white font-semibold py-3 px-4 rounded-xl backdrop-blur-md border border-white/20 transition-all flex items-center space-x-2 text-xs"
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    <span>Refresh Telemetry</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Hotspots</div>
                <div className="text-2xl sm:text-3xl font-black text-red-600 mt-1">{hotspots.length}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Across municipal wards</div>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Citizen Reports</div>
                <div className="text-2xl sm:text-3xl font-black text-teal-600 mt-1">{reports.length}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Verified by Gemini Vision</div>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Avg Response Time</div>
                <div className="text-2xl sm:text-3xl font-black text-amber-600 mt-1">&lt; 3 Mins</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Automated tanker routing</div>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ward Status</div>
                <div className="text-xl sm:text-2xl font-black text-emerald-600 mt-1 uppercase">Active Grid</div>
                <div className="text-[11px] text-slate-400 mt-0.5">DPCC & Sentinel-5P synced</div>
              </div>
            </div>

            {/* Recent Reports Feed */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                    <span>📋 Recent Community Reports</span>
                  </h3>
                  <p className="text-xs text-slate-500">Live status tracking of incidents in your neighborhood.</p>
                </div>
                <button
                  onClick={() => setActiveTab('reports')}
                  className="text-xs font-bold text-teal-600 hover:text-teal-800 underline"
                >
                  View All Reports
                </button>
              </div>

              {reports.length === 0 ? (
                <EmptyState
                  title="No Pollution Reports Found"
                  description="Be the first to report an air quality incident in your ward!"
                  actionText="Report Incident Now"
                  onAction={() => setIsReportModalOpen(true)}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {reports.slice(0, 4).map((r) => {
                    const isResolved = r.status === 'resolved';
                    const isInspecting = r.status === 'inspecting';
                    return (
                      <div key={r.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-mono font-bold text-teal-700 text-sm">#{r.tracking_id}</span>
                              <span className="bg-white border border-slate-200 px-2 py-0.5 rounded text-[10px] font-bold uppercase text-slate-700">
                                {r.category}
                              </span>
                            </div>
                            <div className="text-xs font-bold text-slate-800 mt-1">{r.locality_name || 'Ward Area'}</div>
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                            isResolved ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                            isInspecting ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                            'bg-red-100 text-red-800 border border-red-300'
                          }`}>
                            {r.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 italic bg-white p-2.5 rounded-xl border border-slate-100 line-clamp-2">
                          "{r.description}"
                        </p>
                        {r.action_taken && (
                          <div className="bg-emerald-50/80 p-2 rounded-lg border border-emerald-200 text-[11px] text-emerald-900 flex items-start space-x-1.5 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span><strong>Action:</strong> {r.action_taken}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: MAP */}
        {activeTab === 'map' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Filter controls */}
            <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="flex items-center space-x-2 font-bold text-slate-800 text-lg">
                  <span>🗺️ Interactive Neighborhood Hotspot Map</span>
                </div>
                <div className="flex items-center space-x-2 text-xs">
                  <Clock className="w-4 h-4 text-slate-500" />
                  <span className="font-semibold text-slate-600">Time Window:</span>
                  {['24h', '7d', '30d'].map((win) => (
                    <button
                      key={win}
                      onClick={() => setTimeWindow(win)}
                      className={`px-3 py-1.5 rounded-lg font-bold transition-all uppercase ${
                        timeWindow === win ? 'bg-teal-600 text-white shadow-sm' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {win}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category buttons */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <div className="flex items-center space-x-1 text-slate-500 mr-1 font-semibold">
                  <Filter className="w-3.5 h-3.5" />
                  <span>Category:</span>
                </div>
                {[
                  { id: 'all', label: 'All Categories', icon: '🌐' },
                  { id: 'smoke', label: 'Smoke & Fires', icon: '🔥' },
                  { id: 'dust', label: 'Construction Dust', icon: '🏗️' },
                  { id: 'industry', label: 'Industrial Plumes', icon: '🏭' },
                  { id: 'traffic', label: 'Traffic Exhaust', icon: '🚌' }
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setCategoryFilter(cat.id)}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center space-x-1.5 ${
                      categoryFilter === cat.id ? 'bg-teal-700 text-white shadow-md scale-105' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Map Box */}
            <div className="bg-slate-900 rounded-2xl border border-slate-200 shadow-lg overflow-hidden p-3 sm:p-4">
              <div className="h-[550px] w-full rounded-xl overflow-hidden relative border border-white/10">
                <HotspotMap
                  hotspots={hotspots}
                  reports={reports}
                  onSelectHotspot={(h) => setSelectedHotspot(h)}
                  selectedHotspot={selectedHotspot}
                  lang={lang}
                />
              </div>
            </div>

            {/* Selected Hotspot Card */}
            {selectedHotspot && (
              <div className="bg-gradient-to-r from-white via-teal-50/30 to-white p-5 rounded-2xl border-2 border-teal-600 shadow-lg animate-in fade-in flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xl">📍</span>
                    <h3 className="font-bold text-lg text-slate-900">{selectedHotspot.name}</h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase text-white ${
                      selectedHotspot.severity === 'critical' || selectedHotspot.status === 'critical' ? 'bg-red-600' :
                      selectedHotspot.severity === 'moderate' || selectedHotspot.status === 'moderate' ? 'bg-amber-500' : 'bg-emerald-600'
                    }`}>
                      {selectedHotspot.severity || selectedHotspot.status} ({Math.round(selectedHotspot.risk_score || selectedHotspot.severity_score || 80)}/100)
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    Dominant Pollutant: <strong className="uppercase">{selectedHotspot.dominant_pollutant || selectedHotspot.dominant_category}</strong> | Active Reports: <strong>{selectedHotspot.active_reports_count || selectedHotspot.reports_count || 0}</strong>
                  </p>
                </div>
                <button
                  onClick={() => setSelectedHotspot(null)}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 underline self-end sm:self-center"
                >
                  Clear Selection
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: MY REPORTS */}
        {activeTab === 'reports' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <List className="w-6 h-6 text-teal-600" />
                  <span>My Submitted Pollution Reports</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Track the live status of reports submitted from your phone or ward community.
                </p>
              </div>
              <button
                onClick={() => setIsReportModalOpen(true)}
                className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md"
              >
                <PlusCircle className="w-4 h-4" />
                <span>New Report</span>
              </button>
            </div>

            {reports.length === 0 ? (
              <EmptyState
                title="You Haven't Submitted Any Reports Yet"
                description="Notice smoke, garbage fires, or heavy construction dust in your neighborhood? Take a photo and let our AI Vision model alert the ward officer!"
                actionText="Submit First Report"
                onAction={() => setIsReportModalOpen(true)}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reports.map((r) => {
                  const isResolved = r.status === 'resolved';
                  const isInspecting = r.status === 'inspecting';
                  return (
                    <div key={r.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 hover:border-teal-400 transition-all">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-mono font-bold text-teal-700 text-sm">#{r.tracking_id}</span>
                            <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-bold uppercase text-slate-700">
                              {r.category}
                            </span>
                            {r.ai_confidence && (
                              <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                ✨ AI {Math.round(r.ai_confidence * 100)}%
                              </span>
                            )}
                          </div>
                          <div className="text-xs font-bold text-slate-800 mt-1">{r.locality_name || 'Ward Area'}</div>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                          isResolved ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                          isInspecting ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                          'bg-red-100 text-red-800 border border-red-300'
                        }`}>
                          {r.status}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 italic bg-slate-50 p-3 rounded-xl border border-slate-100">
                        "{r.description}"
                      </p>

                      {/* Status Stepper */}
                      <div className="pt-2 border-t border-slate-100">
                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 mb-1">
                          <span className="text-teal-700 font-extrabold">1. Logged</span>
                          <span className={isInspecting || isResolved ? 'text-amber-600 font-extrabold' : ''}>2. Inspecting</span>
                          <span className={isResolved ? 'text-emerald-700 font-extrabold' : ''}>3. Resolved</span>
                        </div>
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden flex">
                          <div className={`h-full transition-all ${
                            isResolved ? 'w-full bg-emerald-500' : isInspecting ? 'w-2/3 bg-amber-500' : 'w-1/3 bg-red-500'
                          }`} />
                        </div>
                      </div>

                      {r.action_taken && (
                        <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-xs text-emerald-900 flex items-start space-x-2 font-medium">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <div>
                            <strong className="block text-[11px] uppercase tracking-wider text-emerald-800 mb-0.5">Municipal Action Taken:</strong>
                            <span>{r.action_taken}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: PROFILE & SETTINGS */}
        {activeTab === 'profile' && (
          <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-200">
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center space-x-4 border-b border-slate-100 pb-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-teal-500 to-amber-400 flex items-center justify-center font-black text-slate-950 text-2xl shadow-lg">
                  {(user?.name || user?.phone || 'C')[0].toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900">{user?.name || 'Community Citizen'}</h2>
                  <p className="text-xs font-mono text-teal-700 font-bold mt-0.5">{user?.phone || 'Anonymous Citizen Mode'}</p>
                  <span className="inline-block mt-1 bg-teal-100 text-teal-800 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full">
                    {user?.role || 'citizen'} • {user?.ward_id ? user.ward_id.replace('ward-1-', '') : 'Ward 1'}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Preferences & Settings</h3>
                
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Globe className="w-5 h-5 text-teal-600" />
                    <div>
                      <div className="text-xs font-bold text-slate-800">Interface Language</div>
                      <div className="text-[11px] text-slate-500">Choose between English, Hindi, and Marathi</div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {(['en', 'hi', 'mr'] as Language[]).map((l) => (
                      <button
                        key={l}
                        onClick={() => {
                          setLang(l);
                          localStorage.setItem('vayu_vigil_lang', l);
                          window.dispatchEvent(new CustomEvent('vayu-vigil-lang-change', { detail: l }));
                          showToast(`Language updated to ${l.toUpperCase()}`, 'info');
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase transition-all ${
                          lang === l ? 'bg-teal-600 text-white' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-800">SMS Status Alert Notifications</div>
                    <div className="text-[11px] text-slate-500">Receive instant SMS updates when municipal tankers extinguish your reported fires.</div>
                  </div>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-1 rounded">✓ Active</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center space-x-2 py-3.5 px-4 rounded-2xl bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs transition-colors border border-red-200"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out of Profile</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Mobile Bottom Tab Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-white/10 px-2 py-1.5 z-40 flex justify-around items-center shadow-2xl">
        <button
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center p-1 rounded-lg transition-all ${activeTab === 'home' ? 'text-teal-400 font-bold scale-105' : 'text-slate-400'}`}
        >
          <HomeIcon className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Home</span>
        </button>
        
        <button
          onClick={() => setActiveTab('map')}
          className={`flex flex-col items-center p-1 rounded-lg transition-all ${activeTab === 'map' ? 'text-teal-400 font-bold scale-105' : 'text-slate-400'}`}
        >
          <MapPin className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Map</span>
        </button>

        <button
          onClick={() => setIsReportModalOpen(true)}
          className="flex flex-col items-center justify-center w-12 h-12 -mt-5 bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 rounded-full shadow-lg border-2 border-slate-900 transform active:scale-95"
        >
          <PlusCircle className="w-6 h-6" />
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`flex flex-col items-center p-1 rounded-lg transition-all ${activeTab === 'reports' ? 'text-teal-400 font-bold scale-105' : 'text-slate-400'}`}
        >
          <List className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Reports</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center p-1 rounded-lg transition-all ${activeTab === 'profile' ? 'text-teal-400 font-bold scale-105' : 'text-slate-400'}`}
        >
          <User className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Profile</span>
        </button>
      </nav>

      {/* Report Modal */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onReportSubmitted={() => {
          setIsReportModalOpen(false);
          fetchData();
          setActiveTab('reports');
        }}
        lang={lang}
      />
    </div>
  );
}
