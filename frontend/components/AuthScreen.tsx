'use client';

import React, { useState } from 'react';
import { Language, t } from '../lib/i18n';

interface AuthScreenProps {
  lang: Language;
  onLanguageChange: (lang: Language) => void;
  onLoginSuccess: (token: string, user: any) => void;
  onBackToOnboarding: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  lang,
  onLanguageChange,
  onLoginSuccess,
  onBackToOnboarding
}) => {
  const [activeTab, setActiveTab] = useState<'citizen' | 'officer'>('citizen');
  
  // Officer state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Citizen state
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = activeTab === 'officer' 
        ? '/api/v1/auth/login' 
        : '/api/v1/auth/otp/verify';

      const payload = activeTab === 'officer' 
        ? { email, password } 
        : { phone, otp: otp || '123456' };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      onLoginSuccess(data.token, data.user);
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (type: 'ward1' | 'ward2' | 'citizen') => {
    setLoading(true);
    setError('');
    try {
      if (type === 'ward1' || type === 'ward2') {
        const demoEmail = type === 'ward1' ? 'officer.ward1@vayuvigil.gov' : 'officer.ward2@vayuvigil.gov';
        const res = await fetch('/api/v1/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: demoEmail, password: 'admin123' })
        });
        const data = await res.json();
        if (res.ok) {
          onLoginSuccess(data.token, data.user);
          return;
        }
      } else {
        const res = await fetch('/api/v1/auth/otp/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: '+919876543210', otp: '123456' })
        });
        const data = await res.json();
        if (res.ok) {
          onLoginSuccess(data.token, data.user);
          return;
        }
      }
      throw new Error('Demo login failed');
    } catch (err: any) {
      setError(err.message || 'Demo access error');
    } finally {
      setLoading(false);
    }
  };

  const handleAnonymousCitizen = () => {
    onLoginSuccess('', {
      id: 'citizen-anon',
      role: 'citizen',
      name: 'Community Citizen',
      phone: 'Anonymous Access'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-[#0D3128] to-slate-900 text-white flex flex-col justify-between p-6 md:p-12 relative overflow-hidden font-sans">
      {/* Decorative background glow circles */}
      <div className="absolute top-10 left-1/3 w-96 h-96 bg-[#1F6F5C]/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header */}
      <header className="flex justify-between items-center z-10 max-w-6xl w-full mx-auto">
        <button
          onClick={onBackToOnboarding}
          className="flex items-center space-x-2 text-sm text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl transition-all border border-white/10 cursor-pointer"
        >
          <span>←</span>
          <span>Back to Welcome</span>
        </button>

        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-[#1F6F5C] flex items-center justify-center text-lg font-bold">
            🌱
          </div>
          <span className="font-bold tracking-tight text-white hidden sm:inline">
            Vayu Vigil Portal
          </span>
        </div>

        {/* Multilingual Selector */}
        <div className="flex items-center bg-white/10 backdrop-blur-md rounded-full p-1 border border-white/15">
          {(['en', 'hi', 'mr'] as Language[]).map((l) => (
            <button
              key={l}
              onClick={() => onLanguageChange(l)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                lang === l
                  ? 'bg-[#1F6F5C] text-white shadow-md font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              {l === 'en' ? 'EN' : l === 'hi' ? 'हिंदी' : 'मराठी'}
            </button>
          ))}
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl w-full mx-auto my-auto py-8 z-10">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-3">
            {t(lang, 'authPortalTitle')}
          </h1>
          <p className="text-slate-300 max-w-xl mx-auto text-sm md:text-base">
            {t(lang, 'authPortalSubtitle')}
          </p>
        </div>

        {/* Quick Demo Access Bar (Hackathon Special) */}
        <div className="bg-gradient-to-r from-[#1F6F5C]/30 via-emerald-600/20 to-[#1F6F5C]/30 border border-emerald-500/40 rounded-2xl p-6 mb-8 backdrop-blur-md shadow-lg">
          <div className="flex items-center justify-center space-x-2 text-xs font-bold text-emerald-300 uppercase tracking-wider mb-4">
            <span>⚡ 1-Click Demo Quick Access (For Judges & MPs)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => handleQuickDemo('ward1')}
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded-xl text-xs shadow-md transition-all flex flex-col items-center justify-center border border-emerald-400/30 cursor-pointer disabled:opacity-50 hover:scale-102 active:scale-98"
            >
              <span className="text-sm mb-1">🔥 Officer Ward 1</span>
              <span className="text-[10px] text-emerald-100 font-mono">Bhalswa Dump Fire Sector</span>
            </button>

            <button
              onClick={() => handleQuickDemo('ward2')}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-xl text-xs shadow-md transition-all flex flex-col items-center justify-center border border-blue-400/30 cursor-pointer disabled:opacity-50 hover:scale-102 active:scale-98"
            >
              <span className="text-sm mb-1">🏭 Officer Ward 2</span>
              <span className="text-[10px] text-blue-100 font-mono">Sector 9 Industrial Area</span>
            </button>

            <button
              onClick={() => handleQuickDemo('citizen')}
              disabled={loading}
              className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 px-4 rounded-xl text-xs shadow-md transition-all flex flex-col items-center justify-center border border-amber-400/30 cursor-pointer disabled:opacity-50 hover:scale-102 active:scale-98"
            >
              <span className="text-sm mb-1">👤 Verified Citizen</span>
              <span className="text-[10px] text-amber-100 font-mono">+91 98765 43210 (OTP: 123456)</span>
            </button>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-200 text-sm p-4 rounded-xl mb-6 text-center animate-shake">
            ⚠️ {error}
          </div>
        )}

        {/* Login Portal Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Citizen Portal Card */}
          <div className={`bg-white/5 backdrop-blur-xl border rounded-3xl p-6 transition-all ${
            activeTab === 'citizen' ? 'border-emerald-500/60 shadow-xl shadow-emerald-950/50 bg-white/10' : 'border-white/10 hover:border-white/20'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-2xl">👥</span>
              <span className="text-xs font-mono px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300">PUBLIC ACCESS</span>
            </div>
            <h3 className="text-xl font-bold mb-2">{t(lang, 'citizenAccessCard')}</h3>
            <p className="text-xs text-slate-300 mb-6 min-h-[36px]">{t(lang, 'citizenAccessDesc')}</p>

            <form onSubmit={(e) => { setActiveTab('citizen'); handleLogin(e); }} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full bg-slate-900/80 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">OTP Code</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
                  className="w-full bg-slate-900/80 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                onClick={() => setActiveTab('citizen')}
                className="w-full bg-[#1F6F5C] hover:bg-[#25856E] text-white font-bold py-3 rounded-xl shadow-lg transition-all text-sm cursor-pointer disabled:opacity-50"
              >
                {loading && activeTab === 'citizen' ? 'Verifying OTP...' : 'Enter Citizen Portal'}
              </button>
            </form>

            <div className="mt-4 pt-4 border-t border-white/10 text-center">
              <button
                onClick={handleAnonymousCitizen}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold underline underline-offset-4 cursor-pointer"
              >
                {t(lang, 'continueAnonymous')} →
              </button>
            </div>
          </div>

          {/* Officer Command Portal Card */}
          <div className={`bg-white/5 backdrop-blur-xl border rounded-3xl p-6 transition-all ${
            activeTab === 'officer' ? 'border-blue-500/60 shadow-xl shadow-blue-950/50 bg-white/10' : 'border-white/10 hover:border-white/20'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-2xl">🛡️</span>
              <span className="text-xs font-mono px-3 py-1 rounded-full bg-blue-500/20 text-blue-300">RBAC WARD SCOPED</span>
            </div>
            <h3 className="text-xl font-bold mb-2">{t(lang, 'officerAccessCard')}</h3>
            <p className="text-xs text-slate-300 mb-6 min-h-[36px]">{t(lang, 'officerAccessDesc')}</p>

            <form onSubmit={(e) => { setActiveTab('officer'); handleLogin(e); }} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Official Gov Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="officer.ward1@vayuvigil.gov"
                  className="w-full bg-slate-900/80 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-900/80 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                onClick={() => setActiveTab('officer')}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl shadow-lg transition-all text-sm cursor-pointer disabled:opacity-50"
              >
                {loading && activeTab === 'officer' ? 'Authenticating...' : 'Login as Municipal Officer'}
              </button>
            </form>

            <div className="mt-4 pt-4 border-t border-white/10 text-center">
              <span className="text-[11px] text-slate-400">
                Authorized DPCC / CPCB & Municipal Ward Officers Only
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-slate-500 z-10 max-w-6xl w-full mx-auto border-t border-white/10 pt-4">
        <p>🔒 256-bit Cryptographic Ward Boundary Enforcement • No Public PII Exposure</p>
      </footer>
    </div>
  );
};
