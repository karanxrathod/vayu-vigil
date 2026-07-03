import React, { useState } from 'react';
import { Language, t } from '../lib/i18n';
import { HotspotMap } from './HotspotMap';
import { PlusCircle, Filter, Clock, AlertCircle, CheckCircle2, RefreshCw, ShieldCheck } from 'lucide-react';

interface CitizenViewProps {
  hotspots: any[];
  reports: any[];
  onOpenReportModal: () => void;
  lang: Language;
  categoryFilter: string;
  setCategoryFilter: (cat: string) => void;
  timeWindow: string;
  setTimeWindow: (win: string) => void;
  onRefresh: () => void;
  loading: boolean;
}

export const CitizenView: React.FC<CitizenViewProps> = ({
  hotspots,
  reports,
  onOpenReportModal,
  lang,
  categoryFilter,
  setCategoryFilter,
  timeWindow,
  setTimeWindow,
  onRefresh,
  loading
}) => {
  const [selectedHotspot, setSelectedHotspot] = useState<any | null>(null);

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Hero Banner with Primary Report CTA */}
      <div className="bg-gradient-to-r from-primary-dark via-primary to-primary-light rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-72 h-72 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="max-w-3xl relative z-10 space-y-4">
          <div className="inline-flex items-center space-x-2 bg-emerald-400/20 px-3 py-1 rounded-full text-xs font-bold text-emerald-200 border border-emerald-400/30">
            <ShieldCheck className="w-4 h-4 text-emerald-300" />
            <span>AI-Powered Citizen-Sensor Fusion Engine</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
            {t(lang, 'appTitle')}
          </h1>
          <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed">
            City-level air quality apps miss hyper-local pollution events — a garbage dump fire, an industrial cluster, a smog trap at a busy junction. Join your neighbors and municipal authorities to spot, forecast, and eliminate local pollution hotspots in real-time.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4">
            <button
              onClick={onOpenReportModal}
              className="bg-white hover:bg-emerald-50 text-primary-dark font-extrabold py-3.5 px-6 rounded-2xl shadow-xl transition-all flex items-center space-x-2 text-base transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <PlusCircle className="w-6 h-6 text-primary" />
              <span>{t(lang, 'reportPollution')}</span>
            </button>

            <button
              onClick={onRefresh}
              className="bg-black/20 hover:bg-black/30 text-white font-semibold py-3 px-4 rounded-xl backdrop-blur-md border border-white/20 transition-all flex items-center space-x-2 text-sm"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Map</span>
            </button>
          </div>
        </div>
      </div>

      {/* Map Filter Control Bar */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-card border border-gray-100 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div className="flex items-center space-x-2 font-bold text-gray-800 text-lg">
            <span className="text-xl">🗺️</span>
            <span>{t(lang, 'hotspotMap')}</span>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <Clock className="w-4 h-4 text-gray-500" />
            <span className="font-semibold text-gray-600">{t(lang, 'timeWindow')}:</span>
            {[
              { id: '24h', label: t(lang, 'last24h') },
              { id: '7d', label: t(lang, 'last7d') },
              { id: '30d', label: t(lang, 'last30d') }
            ].map((win) => (
              <button
                key={win.id}
                onClick={() => setTimeWindow(win.id)}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  timeWindow === win.id
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                {win.label}
              </button>
            ))}
          </div>
        </div>

        {/* Category Pill Buttons */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center space-x-1 text-gray-500 mr-1 font-semibold">
            <Filter className="w-3.5 h-3.5" />
            <span>{t(lang, 'filterCategory')}:</span>
          </div>
          {[
            { id: 'all', label: t(lang, 'allCategories'), icon: '🌐' },
            { id: 'smoke', label: t(lang, 'smoke'), icon: '🔥' },
            { id: 'dust', label: t(lang, 'dust'), icon: '🏗️' },
            { id: 'industry', label: t(lang, 'industry'), icon: '🏭' },
            { id: 'traffic', label: t(lang, 'traffic'), icon: '🚌' }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center space-x-1.5 ${
                categoryFilter === cat.id
                  ? 'bg-primary-dark text-white shadow-md scale-105'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Hotspot Map Component */}
      <HotspotMap
        hotspots={hotspots}
        reports={reports}
        onSelectHotspot={(h) => setSelectedHotspot(h)}
        lang={lang}
      />

      {/* Selected Hotspot Quick Card */}
      {selectedHotspot && (
        <div className="bg-gradient-to-r from-white via-emerald-50/30 to-white p-5 rounded-2xl border-2 border-primary shadow-lg animate-fade-in flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl">📍</span>
              <h3 className="font-bold text-lg text-primary-dark">{selectedHotspot.name}</h3>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase text-white ${
                selectedHotspot.severity === 'critical' ? 'bg-critical' : selectedHotspot.severity === 'moderate' ? 'bg-moderate' : 'bg-low'
              }`}>
                {selectedHotspot.severity} ({Math.round(selectedHotspot.risk_score)}/100)
              </span>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Dominant Pollutant: <strong className="uppercase">{selectedHotspot.dominant_category}</strong> | Active Reports: <strong>{selectedHotspot.active_reports_count || 0}</strong> | Status: <strong className="uppercase text-primary">{selectedHotspot.status}</strong>
            </p>
          </div>
          <button
            onClick={() => setSelectedHotspot(null)}
            className="text-xs font-bold text-gray-500 hover:text-gray-800 underline self-end sm:self-center"
          >
            Clear Selection
          </button>
        </div>
      )}

      {/* Recent Citizen Complaints & Status Tracking Stepper */}
      <div className="bg-white p-6 rounded-3xl shadow-card border border-gray-100 space-y-6">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
              <span>📋</span>
              <span>{t(lang, 'recentReports')}</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Live status tracking of complaints submitted across Delhi municipal wards.
            </p>
          </div>
          <span className="bg-gray-100 text-gray-700 font-bold text-xs px-3 py-1 rounded-full">
            Showing {reports.length} Reports
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reports.slice(0, 8).map((r) => {
            const isResolved = r.status === 'resolved';
            const isInspecting = r.status === 'inspecting';
            
            return (
              <div key={r.id} className="p-4 rounded-2xl border border-gray-200 hover:border-primary/40 transition-all bg-gray-50/50 flex flex-col justify-between space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-primary text-sm">#{r.tracking_id}</span>
                      <span className="bg-white border border-gray-200 px-2 py-0.5 rounded text-[10px] font-bold uppercase text-gray-700">
                        {r.category}
                      </span>
                      {r.ai_confidence && (
                        <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
                          ✨ AI {Math.round(r.ai_confidence * 100)}%
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-bold text-gray-800 mt-1">{r.locality_name || 'Delhi Ward Area'}</div>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                    isResolved ? 'bg-green-100 text-green-800 border border-green-300' :
                    isInspecting ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                    'bg-red-100 text-red-800 border border-red-300'
                  }`}>
                    {r.status}
                  </span>
                </div>

                <p className="text-xs text-gray-600 italic bg-white p-2.5 rounded-xl border border-gray-100 line-clamp-2">
                  "{r.description || 'No description provided'}"
                </p>

                {/* Status Stepper Tracker */}
                <div className="pt-2 border-t border-gray-200/60">
                  <div className="flex items-center justify-between text-[10px] font-bold text-gray-500 mb-1">
                    <span className="text-primary-dark font-extrabold">1. Logged</span>
                    <span className={isInspecting || isResolved ? 'text-amber-700 font-extrabold' : ''}>2. Inspecting</span>
                    <span className={isResolved ? 'text-green-700 font-extrabold' : ''}>3. Resolved</span>
                  </div>
                  <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden flex">
                    <div className={`h-full transition-all ${
                      isResolved ? 'w-full bg-green-500' : isInspecting ? 'w-2/3 bg-amber-500' : 'w-1/3 bg-red-500'
                    }`} />
                  </div>
                </div>

                {r.action_taken && (
                  <div className="bg-emerald-50/80 p-2 rounded-lg border border-emerald-200 text-[11px] text-emerald-900 flex items-start space-x-1.5 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span><strong>Action:</strong> {r.action_taken}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
