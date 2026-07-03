'use client';

import React from 'react';
import { Language, t } from '../lib/i18n';

interface OnboardingScreenProps {
  lang: Language;
  onLanguageChange: (lang: Language) => void;
  onLaunch: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({
  lang,
  onLanguageChange,
  onLaunch
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-[#0D3128] to-slate-900 text-white flex flex-col justify-between p-6 md:p-12 relative overflow-hidden font-sans">
      {/* Decorative background glow circles */}
      <div className="absolute top-1/4 left-10 w-96 h-96 bg-[#1F6F5C]/20 rounded-full blur-3xl pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#E8A33D]/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top Header with Brand & Language Toggles */}
      <header className="flex justify-between items-center z-10 max-w-7xl w-full mx-auto">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1F6F5C] to-[#144A3D] flex items-center justify-center text-xl font-black shadow-lg border border-white/20">
            🌱
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-[#A3D9CC] bg-clip-text text-transparent">
              CleanAir & Clear Streets
            </span>
            <span className="block text-xs text-emerald-400 font-mono tracking-widest uppercase">
              Google Cloud x Hack2skill Pilot
            </span>
          </div>
        </div>

        {/* Multilingual Selector */}
        <div className="flex items-center bg-white/10 backdrop-blur-md rounded-full p-1 border border-white/15">
          {(['en', 'hi', 'mr'] as Language[]).map((l) => (
            <button
              key={l}
              onClick={() => onLanguageChange(l)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                lang === l
                  ? 'bg-[#1F6F5C] text-white shadow-md shadow-[#1F6F5C]/40 font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              {l === 'en' ? 'EN' : l === 'hi' ? 'हिंदी' : 'मराठी'}
            </button>
          ))}
        </div>
      </header>

      {/* Main Hero Content */}
      <main className="max-w-5xl w-full mx-auto my-auto py-12 z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/30 px-4 py-1.5 rounded-full text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-6">
            <span>⚡ National Civic-Tech Hackathon Winner & Municipal Infrastructure Grid</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight mb-6 drop-shadow-sm">
            {t(lang, 'onboardingTitle')}
          </h1>
          <p className="text-lg md:text-xl text-slate-300 font-light leading-relaxed mb-10">
            {t(lang, 'onboardingSubtitle')}
          </p>

          <button
            onClick={onLaunch}
            className="group relative inline-flex items-center justify-center px-8 py-4 font-bold text-white transition-all duration-300 bg-gradient-to-r from-[#1F6F5C] to-[#25856E] rounded-2xl shadow-xl shadow-[#1F6F5C]/40 hover:shadow-[#1F6F5C]/60 hover:scale-105 active:scale-95 border border-emerald-400/30 text-lg cursor-pointer"
          >
            <span>{t(lang, 'getStartedBtn')}</span>
            <svg
              className="w-5 h-5 ml-3 transition-transform duration-300 group-hover:translate-x-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>

        {/* 3 Key Pillars Glassmorphism Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 group hover:border-emerald-500/40">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
              📸
            </div>
            <h3 className="text-lg font-bold text-white mb-2 flex items-center">
              AI Vision Verification
              <span className="ml-2 text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-mono">GEMINI</span>
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Automated image classification verifying citizen photo reports of smoke, construction dust, industrial plumes, and vehicle exhaust with exact confidence scoring.
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 group hover:border-blue-500/40">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
              🛰️
            </div>
            <h3 className="text-lg font-bold text-white mb-2 flex items-center">
              IoT & Satellite Grid
              <span className="ml-2 text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full font-mono">SENTINEL-5P</span>
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Real-time MQTT telemetry from DPCC/CPCB sensors merged with Copernicus Sentinel-5P orbital NO₂ and Aerosol Optical Depth (AOD) plume tracking.
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 group hover:border-amber-500/40">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
              🚒
            </div>
            <h3 className="text-lg font-bold text-white mb-2 flex items-center">
              Smart Fleet Dispatch
              <span className="ml-2 text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-mono">SMART GPS</span>
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Automated routing of municipal water-mist cannon tankers and mobile smog towers triggered instantly when 4-factor risk scores cross forecast thresholds.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-slate-500 z-10 max-w-7xl w-full mx-auto border-t border-white/10 pt-6">
        <p>© 2026 CleanAir & Clear Streets • Multi-Tenant RBAC Municipal Pilot • Built for Build with AI: Code for Communities</p>
      </footer>
    </div>
  );
};
