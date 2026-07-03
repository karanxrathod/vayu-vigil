'use client';

import React from 'react';
import { Language, t } from '../lib/i18n';

export type DashboardSection = 'map' | 'reports' | 'infra' | 'analytics' | 'officer';

interface SidebarProps {
  lang: Language;
  onLanguageChange: (lang: Language) => void;
  activeSection: DashboardSection;
  onSelectSection: (section: DashboardSection) => void;
  user: any | null;
  onLogout: () => void;
  isOpen: boolean;
  onToggleSidebar: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  lang,
  onLanguageChange,
  activeSection,
  onSelectSection,
  user,
  onLogout,
  isOpen,
  onToggleSidebar
}) => {
  const isOfficer = user && (user.role === 'officer' || user.role === 'admin');

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onToggleSidebar}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-30 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-[#0A1E18] border-r border-white/10 text-white flex flex-col justify-between z-40 transition-transform duration-300 shadow-2xl ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Header */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1F6F5C] to-[#144A3D] flex items-center justify-center text-xl font-black shadow-lg border border-white/20">
                🌱
              </div>
              <div>
                <span className="text-base font-bold tracking-tight block leading-snug">
                  Vayu Vigil Portal
                </span>
                <span className="text-[10px] font-mono text-emerald-400 tracking-wider uppercase bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                  {isOfficer ? 'MUNICIPAL COMMAND' : 'CITIZEN PILOT'}
                </span>
              </div>
            </div>

            {/* Mobile close button */}
            <button
              onClick={onToggleSidebar}
              className="lg:hidden text-slate-400 hover:text-white p-1 rounded-lg bg-white/5"
            >
              ✕
            </button>
          </div>

          {/* Navigation Menu */}
          <div className="space-y-6">
            {/* Section 1: Main */}
            <div>
              <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-2 px-3">
                {t(lang, 'navSectionMain')}
              </p>
              <nav className="space-y-1">
                <button
                  onClick={() => { onSelectSection('map'); if (window.innerWidth < 1024) onToggleSidebar(); }}
                  className={`w-full flex items-center space-x-3 px-3 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                    activeSection === 'map'
                      ? 'bg-[#1F6F5C] text-white shadow-lg shadow-[#1F6F5C]/30 font-bold border border-emerald-400/30'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span className="text-lg">🗺️</span>
                  <span>{t(lang, 'navMap')}</span>
                </button>

                <button
                  onClick={() => { onSelectSection('reports'); if (window.innerWidth < 1024) onToggleSidebar(); }}
                  className={`w-full flex items-center space-x-3 px-3 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                    activeSection === 'reports'
                      ? 'bg-[#1F6F5C] text-white shadow-lg shadow-[#1F6F5C]/30 font-bold border border-emerald-400/30'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span className="text-lg">📋</span>
                  <span>{t(lang, 'navReports')}</span>
                </button>

                <button
                  onClick={() => { onSelectSection('infra'); if (window.innerWidth < 1024) onToggleSidebar(); }}
                  className={`w-full flex items-center space-x-3 px-3 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                    activeSection === 'infra'
                      ? 'bg-[#1F6F5C] text-white shadow-lg shadow-[#1F6F5C]/30 font-bold border border-emerald-400/30'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span className="text-lg">🚀</span>
                  <span>{t(lang, 'navInfra')}</span>
                  <span className="ml-auto text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono">LIVE</span>
                </button>
              </nav>
            </div>

            {/* Section 2: Officer / Analytics */}
            <div>
              <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-2 px-3">
                {t(lang, 'navSectionAnalytics')}
              </p>
              <nav className="space-y-1">
                {isOfficer && (
                  <button
                    onClick={() => { onSelectSection('officer'); if (window.innerWidth < 1024) onToggleSidebar(); }}
                    className={`w-full flex items-center space-x-3 px-3 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                      activeSection === 'officer'
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-bold border border-blue-400/30'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <span className="text-lg">🛡️</span>
                    <span>Officer Command Desk</span>
                    <span className="ml-auto text-[9px] bg-blue-400/20 text-blue-300 px-1.5 py-0.5 rounded font-mono">RBAC</span>
                  </button>
                )}

                <button
                  onClick={() => { onSelectSection('analytics'); if (window.innerWidth < 1024) onToggleSidebar(); }}
                  className={`w-full flex items-center space-x-3 px-3 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                    activeSection === 'analytics'
                      ? 'bg-[#1F6F5C] text-white shadow-lg shadow-[#1F6F5C]/30 font-bold border border-emerald-400/30'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span className="text-lg">📊</span>
                  <span>{t(lang, 'navAnalytics')}</span>
                </button>
              </nav>
            </div>
          </div>
        </div>

        {/* Bottom User Profile Section */}
        <div className="p-4 border-t border-white/10 bg-black/20">
          {/* Language switcher */}
          <div className="flex items-center justify-between mb-4 bg-white/5 rounded-xl p-1.5 border border-white/5">
            <span className="text-xs text-slate-400 font-medium pl-2">Language:</span>
            <div className="flex space-x-1">
              {(['en', 'hi', 'mr'] as Language[]).map((l) => (
                <button
                  key={l}
                  onClick={() => onLanguageChange(l)}
                  className={`px-2 py-0.5 rounded-lg text-xs font-semibold transition-all ${
                    lang === l
                      ? 'bg-[#1F6F5C] text-white shadow'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Active User Card */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3 flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-xl shadow-inner shrink-0">
              {isOfficer ? '🛡️' : '👤'}
            </div>
            <div className="overflow-hidden min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate">
                {user?.name || (isOfficer ? 'Municipal Officer' : 'Community Citizen')}
              </p>
              <p className="text-[10px] text-emerald-400 font-mono truncate">
                {user?.ward_id ? `Ward: ${user.ward_id.replace('ward-', '')}` : 'Verified Public Citizen'}
              </p>
            </div>
          </div>

          {/* Switch Profile / Logout */}
          <button
            onClick={onLogout}
            className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 hover:border-red-500/50 rounded-xl py-2 px-3 text-xs font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            <span>🔄</span>
            <span>{t(lang, 'switchProfileBtn')}</span>
          </button>
        </div>
      </aside>
    </>
  );
};
