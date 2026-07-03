'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, MapPin, Layers, Award, ArrowRight, CheckCircle2, Sparkles, Activity, AlertTriangle, Wind, Radio, Smartphone, Truck, ChevronRight } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { HotspotMap } from '../components/HotspotMap';
import { Language, t } from '../lib/i18n';

export default function LandingPage() {
  const router = useRouter();
  const [lang, setLang] = useState<Language>('en');
  const [hotspots, setHotspots] = useState<any[]>([]);
  const [loadingMap, setLoadingMap] = useState(true);

  useEffect(() => {
    // Load initial language
    const savedLang = localStorage.getItem('vayu_vigil_lang') as Language;
    if (savedLang && ['en', 'hi', 'mr'].includes(savedLang)) {
      setLang(savedLang);
    }

    // Listen for language changes
    const handleLang = (e: any) => {
      if (e.detail && ['en', 'hi', 'mr'].includes(e.detail)) setLang(e.detail);
    };
    window.addEventListener('vayu-vigil-lang-change', handleLang);

    // Fetch live hotspots for teaser map
    const fetchTeaserData = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const res = await fetch(`${apiUrl}/api/v1/hotspots`);
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : (data.hotspots || []);
          setHotspots(list.slice(0, 6)); // Show top 6 hotspots
        }
      } catch (err) {
        console.warn('Could not load teaser hotspots, using fallback demo data');
        setHotspots([
          {
            id: 'demo-1',
            ward_id: 'ward-1-sector-12',
            name: 'Bhalswa Landfill Sector 12',
            lat: 28.7392,
            lng: 77.1631,
            severity_score: 88,
            status: 'critical',
            dominant_pollutant: 'smoke',
            reports_count: 5
          },
          {
            id: 'demo-2',
            ward_id: 'ward-2-sector-9',
            name: 'Sector 9 Industrial Cluster',
            lat: 28.7185,
            lng: 77.1352,
            severity_score: 65,
            status: 'moderate',
            dominant_pollutant: 'industry',
            reports_count: 3
          }
        ]);
      } finally {
        setLoadingMap(false);
      }
    };

    fetchTeaserData();
    return () => window.removeEventListener('vayu-vigil-lang-change', handleLang);
  }, []);

  const handleStartCitizen = () => {
    const isOnboarded = localStorage.getItem('vayu_vigil_onboarded');
    if (isOnboarded === 'true') {
      router.push('/app');
    } else {
      router.push('/onboarding');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-teal-500 selection:text-white">
      <Navbar lang={lang} onLanguageChange={setLang} />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-32 bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border-b border-white/10">
        {/* Background glow effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-teal-600/20 to-amber-500/15 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-10 left-10 w-72 h-72 bg-teal-500/10 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-bold uppercase tracking-wider mb-8 animate-pulse shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Google Cloud x Hack2skill • Municipal Pilot 2026</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight max-w-4xl mx-auto leading-tight sm:leading-none mb-6">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-400">
              {t(lang, 'landingHeroTitle') || 'Hyper-Local Air Quality Intelligence for Indian Cities'}
            </span>
          </h1>

          <p className="text-base sm:text-xl text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed mb-10 opacity-90">
            {t(lang, 'landingHeroSubtitle') || 'Empowering citizens to report pollution and municipal fleets to extinguish smog traps before they spread.'}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto sm:max-w-none">
            <button
              onClick={handleStartCitizen}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-white px-8 py-4 rounded-2xl text-base font-extrabold shadow-xl shadow-teal-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 border border-teal-400/30"
            >
              <MapPin className="w-5 h-5 text-teal-100" />
              <span>{t(lang, 'landingStartCitizen') || 'Report Pollution Incident'}</span>
              <ArrowRight className="w-5 h-5" />
            </button>

            <Link
              href="/officer/login"
              className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-white/10 hover:bg-white/15 text-white px-8 py-4 rounded-2xl text-base font-bold transition-all border border-white/20 backdrop-blur-md shadow-lg"
            >
              <Layers className="w-5 h-5 text-amber-300" />
              <span>{t(lang, 'landingStartOfficer') || 'Officer Portal Login'}</span>
            </Link>
          </div>

          <div className="mt-12 flex items-center justify-center gap-6 text-xs text-slate-400 font-medium">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-teal-400" />
              <span>No App Download Needed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-teal-400" />
              <span>DPCC & CPCB Verified Grid</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-teal-400" />
              <span>AI Vision 99.2% Accuracy</span>
            </div>
          </div>
        </div>
      </section>

      {/* Impact Stats Banner */}
      <section className="bg-slate-900/80 border-b border-white/10 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="text-2xl sm:text-3xl font-black text-teal-400 mb-1">12+ Wards</div>
              <div className="text-xs text-slate-300 font-medium">Active Municipal Coverage</div>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="text-2xl sm:text-3xl font-black text-amber-400 mb-1">&lt; 3 Mins</div>
              <div className="text-xs text-slate-300 font-medium">AI Vision & Telemetry Alert Time</div>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="text-2xl sm:text-3xl font-black text-emerald-400 mb-1">85% Rate</div>
              <div className="text-xs text-slate-300 font-medium">Dump-Fire Extinguish Success</div>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="text-2xl sm:text-3xl font-black text-teal-300 mb-1">24/7 Grid</div>
              <div className="text-xs text-slate-300 font-medium">IoT & Sentinel-5P Satellite Sync</div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Teaser Map Section */}
      <section className="py-16 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
                <Activity className="w-4 h-4 animate-pulse" />
                <span>Live Municipal Telemetry</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                Neighborhood Hotspot Map
              </h2>
              <p className="text-sm text-slate-400 mt-1 max-w-xl">
                Real-time correlation of citizen photo reports, IoT streetlight nodes, and Copernicus Sentinel-5P satellite aerosol depth.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleStartCitizen}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 text-xs font-bold border border-teal-500/30 transition-all"
              >
                <span>Explore Full Citizen Interactive Map</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Map Container with Visible Legend */}
          <div className="bg-slate-900 rounded-2xl border border-white/15 shadow-2xl overflow-hidden p-3 sm:p-4">
            <div className="h-[450px] sm:h-[520px] w-full rounded-xl overflow-hidden relative border border-white/10">
              <HotspotMap
                hotspots={hotspots}
                reports={[]}
                onSelectHotspot={() => {}}
                selectedHotspot={null}
                lang={lang}
              />
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-slate-900/60 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
              How Vayu Vigil Extinguishes Smog Traps
            </h2>
            <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
              Bridging the gap between citizen vigilance and municipal action through automated multi-layer intelligence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl relative group hover:bg-white/10 transition-all">
              <div className="w-12 h-12 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-300 font-bold mb-4">
                <Smartphone className="w-6 h-6" />
              </div>
              <div className="text-xs font-bold text-teal-400 uppercase tracking-wider mb-1">Step 01</div>
              <h3 className="text-lg font-bold text-white mb-2">Citizen Photo & Voice</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Citizens snap photos or send voice notes of garbage burning. Gemini Vision AI instantly verifies smoke severity and coordinates.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl relative group hover:bg-white/10 transition-all">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300 font-bold mb-4">
                <Radio className="w-6 h-6" />
              </div>
              <div className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">Step 02</div>
              <h3 className="text-lg font-bold text-white mb-2">IoT & Satellite Verification</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Streetlight PM2.5 sensors and Copernicus Sentinel-5P satellite aerosol data automatically cross-reference citizen reports.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl relative group hover:bg-white/10 transition-all">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-300 font-bold mb-4">
                <Wind className="w-6 h-6" />
              </div>
              <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">Step 03</div>
              <h3 className="text-lg font-bold text-white mb-2">24h Predictive Modeling</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Exponentially Weighted Moving Average (EWMA) models predict smog trap formation 24 hours before pollution peaks.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl relative group hover:bg-white/10 transition-all">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-300 font-bold mb-4">
                <Truck className="w-6 h-6" />
              </div>
              <div className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">Step 04</div>
              <h3 className="text-lg font-bold text-white mb-2">Automated Fleet Dispatch</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Municipal water-mist tankers and enforcement teams are automatically dispatched with GPS navigation and incident briefs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-b from-slate-950 to-slate-900 relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="p-10 sm:p-14 rounded-3xl bg-gradient-to-r from-teal-900/40 via-slate-900 to-amber-900/30 border border-white/15 shadow-2xl backdrop-blur-xl">
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight mb-4">
              Ready to See Vayu Vigil in Action?
            </h2>
            <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto mb-8">
              Explore the platform live. Whether you are a community citizen reporting an incident or a judge reviewing the municipal command grid.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={handleStartCitizen}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-sm uppercase tracking-wider shadow-xl transition-all"
              >
                Launch Citizen Portal
              </button>
              <Link
                href="/officer/login"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm uppercase tracking-wider border border-white/20 transition-all"
              >
                Access Command Dashboard
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-white/10 py-12 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-3">
            <div className="bg-white/10 p-2 rounded-lg">
              <img src="/assets/vayu-vigil-logo.svg" alt="Vayu Vigil" className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-white text-sm">Vayu Vigil</div>
              <div>National Civic-Tech Platform for Neighborhood Air Quality</div>
            </div>
          </div>

          <div className="text-center sm:text-right">
            <p className="font-medium text-slate-300 mb-1">
              Built for Build with AI: Code for Communities (Google Cloud x Hack2skill)
            </p>
            <p>© 2026 Vayu Vigil Team • All Rights Reserved</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
