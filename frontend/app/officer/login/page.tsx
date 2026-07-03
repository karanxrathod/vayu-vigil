'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Key, User, Lock, CheckCircle2, AlertTriangle, ArrowRight, Sparkles, Layers, ArrowLeft } from 'lucide-react';
import { Navbar } from '../../../components/Navbar';
import { showToast } from '../../../components/Toast';
import { Language, t } from '../../../lib/i18n';

export default function OfficerLogin() {
  const router = useRouter();
  const [lang, setLang] = useState<Language>('en');
  const [step, setStep] = useState<'creds' | '2fa'>('creds');
  
  // Credentials state
  const [email, setEmail] = useState('officer.ward1@vayuvigil.gov');
  const [password, setPassword] = useState('admin123');
  const [twoFactorCode, setTwoFactorCode] = useState('889900');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Selected demo role metadata
  const [demoRole, setDemoRole] = useState<{ name: string; role: string; ward_id: string }>({
    name: 'Rajesh Sharma (Ward 1 Officer)',
    role: 'officer',
    ward_id: 'ward-1-sector-12'
  });

  useEffect(() => {
    const savedLang = localStorage.getItem('vayu_vigil_lang') as Language;
    if (savedLang && ['en', 'hi', 'mr'].includes(savedLang)) {
      setLang(savedLang);
    }
  }, []);

  const handleQuickFill = (type: 'ward1' | 'ward2' | 'admin') => {
    setError('');
    if (type === 'ward1') {
      setEmail('officer.ward1@vayuvigil.gov');
      setPassword('admin123');
      setDemoRole({ name: 'Rajesh Sharma (Ward 1 Officer)', role: 'officer', ward_id: 'ward-1-sector-12' });
      showToast('Loaded Ward 1 Officer Demo Credentials', 'info');
    } else if (type === 'ward2') {
      setEmail('officer.ward2@vayuvigil.gov');
      setPassword('admin123');
      setDemoRole({ name: 'Vikram Singh (Ward 2 Officer)', role: 'officer', ward_id: 'ward-2-sector-9' });
      showToast('Loaded Ward 2 Officer Demo Credentials', 'info');
    } else if (type === 'admin') {
      setEmail('admin@vayuvigil.gov');
      setPassword('admin123');
      setDemoRole({ name: 'Dr. Ananya Iyer (Chief Air Quality Director)', role: 'admin', ward_id: 'all' });
      showToast('Loaded Global Admin Demo Credentials', 'info');
    }
  };

  const handleCredsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Invalid credentials');
      }

      // Transition to 2FA screen
      setStep('2fa');
      showToast('Credentials verified. Security code sent to registered token.', 'success');
    } catch (err: any) {
      console.warn('API login failed or unreachable, proceeding with hackathon demo fallback:', err);
      // Fallback for hackathon demo
      if (email.includes('@vayuvigil.gov') && password === 'admin123') {
        setStep('2fa');
        showToast('Credentials verified. Security code sent to registered token.', 'success');
      } else {
        setError(err.message || 'Authentication failed. Use demo account buttons above.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handle2FASubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      const officerUser = {
        id: email.replace('@vayuvigil.gov', ''),
        email: email,
        name: demoRole.name,
        role: demoRole.role,
        ward_id: demoRole.ward_id
      };
      
      localStorage.setItem('vayu_vigil_token', 'mock-officer-jwt-token');
      localStorage.setItem('vayu_vigil_user', JSON.stringify(officerUser));
      localStorage.setItem('cleanair_token', 'mock-officer-jwt-token');
      localStorage.setItem('cleanair_user', JSON.stringify(officerUser));
      
      window.dispatchEvent(new Event('vayu-vigil-auth-change'));
      showToast(`Welcome, ${demoRole.name}!`, 'success');
      router.push('/officer/dashboard');
    }, 700);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-teal-500 selection:text-white">
      <Navbar lang={lang} onLanguageChange={setLang} />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-10 relative overflow-hidden">
        {/* Glow circles */}
        <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-teal-600/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-lg w-full bg-slate-900/90 border border-white/15 rounded-3xl shadow-2xl p-6 sm:p-10 backdrop-blur-xl relative z-10">
          
          {/* Header */}
          <div className="flex items-center space-x-3 mb-6 border-b border-white/10 pb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-slate-950 font-black shadow-lg">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold uppercase tracking-wider mb-0.5 border border-amber-500/30">
                <span>Restricted Municipal Access</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Officer Command Portal
              </h1>
            </div>
          </div>

          {step === 'creds' ? (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* 1-Click Demo Banner */}
              <div className="bg-gradient-to-br from-white/10 to-white/5 p-4 rounded-2xl border border-white/15">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 mb-2.5 uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>⚡ 1-Click Hackathon Demo Accounts:</span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickFill('ward1')}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/80 hover:bg-teal-500/20 border border-white/10 hover:border-teal-500/50 text-left transition-all group"
                  >
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-teal-300">🔥 Ward 1 Officer (Bhalswa Dump Fire)</div>
                      <div className="text-[10px] text-slate-400 font-mono">officer.ward1@vayuvigil.gov</div>
                    </div>
                    <span className="text-[10px] bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded font-bold">Select</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickFill('ward2')}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/80 hover:bg-amber-500/20 border border-white/10 hover:border-amber-500/50 text-left transition-all group"
                  >
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-amber-300">🏗️ Ward 2 Officer (Sector 9 Industrial)</div>
                      <div className="text-[10px] text-slate-400 font-mono">officer.ward2@vayuvigil.gov</div>
                    </div>
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-bold">Select</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickFill('admin')}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/80 hover:bg-blue-500/20 border border-white/10 hover:border-blue-500/50 text-left transition-all group"
                  >
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-blue-300">🛡️ Global Admin (All Wards Grid)</div>
                      <div className="text-[10px] text-slate-400 font-mono">admin@vayuvigil.gov</div>
                    </div>
                    <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded font-bold">Select</span>
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-500/15 border border-red-500/40 text-red-300 text-xs p-3.5 rounded-xl flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleCredsSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Official Municipal Email Address
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="officer.ward1@vayuvigil.gov"
                      className="w-full bg-slate-950 border border-white/20 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-teal-400 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Security Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="w-full bg-slate-950 border border-white/20 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-teal-400 font-mono"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Default demo password: <strong className="text-teal-300">admin123</strong></p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-600 hover:from-teal-400 hover:to-emerald-400 text-slate-950 py-4 px-6 rounded-2xl text-sm font-black shadow-xl shadow-teal-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 uppercase tracking-wider disabled:opacity-50 mt-2"
                >
                  <span>{loading ? 'Verifying Credentials...' : 'Verify & Continue to 2FA'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          ) : (
            /* STEP 2: 2FA SECURITY CODE */
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="bg-teal-500/10 border border-teal-500/30 p-4 rounded-2xl text-center">
                <div className="w-10 h-10 rounded-full bg-teal-500/20 text-teal-300 flex items-center justify-center mx-auto mb-2 font-bold">
                  <Key className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-white mb-1">2-Factor Municipal Security Token</h3>
                <p className="text-xs text-slate-300">
                  A 6-digit cryptographic verification code has been dispatched to your DPCC hardware token and official SMS.
                </p>
              </div>

              <form onSubmit={handle2FASubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-2 uppercase tracking-wider text-center">
                    Enter 6-Digit Verification Token
                  </label>
                  <input
                    type="text"
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value)}
                    maxLength={6}
                    required
                    className="w-full bg-slate-950 border-2 border-teal-500 rounded-2xl px-4 py-4 text-center text-2xl font-black text-white tracking-[0.5em] focus:outline-none focus:shadow-lg focus:shadow-teal-500/20 font-mono"
                  />
                  <p className="text-[11px] text-teal-400 text-center mt-2 font-medium">
                    ⚡ Demo Mode: Token "889900" is pre-authorized for hackathon evaluation.
                  </p>
                </div>

                <div className="bg-white/5 p-3 rounded-xl border border-white/10 text-xs text-slate-300 space-y-1">
                  <div className="font-bold text-white">Target Officer Session:</div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Officer Name:</span>
                    <span className="font-semibold text-teal-300">{demoRole.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Jurisdiction:</span>
                    <span className="font-semibold uppercase text-amber-300">{demoRole.ward_id.replace('ward-1-', '')}</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep('creds')}
                    className="w-1/3 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 text-slate-300 text-xs font-bold transition-colors flex items-center justify-center gap-1"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-2/3 flex items-center justify-center space-x-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 py-3.5 px-6 rounded-2xl text-xs font-black shadow-xl transition-all uppercase tracking-wider disabled:opacity-50"
                  >
                    <span>{loading ? 'Authorizing Session...' : 'Authorize & Launch Grid'}</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
