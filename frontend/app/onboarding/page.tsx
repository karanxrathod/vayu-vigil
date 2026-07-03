'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Globe, Smartphone, MapPin, Camera, Mic, CheckCircle2, ArrowRight, ArrowLeft, Sparkles, UserCheck } from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { showToast } from '../../components/Toast';
import { Language, t } from '../../lib/i18n';

export default function OnboardingWizard() {
  const router = useRouter();
  const [lang, setLang] = useState<Language>('en');
  const [step, setStep] = useState<number>(1);

  // Step 2 state
  const [phone, setPhone] = useState<string>('+91 98765 43210');
  const [otp, setOtp] = useState<string>('123456');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  // Step 3 state
  const [locationGranted, setLocationGranted] = useState<boolean>(false);

  // Step 4 state
  const [cameraGranted, setCameraGranted] = useState<boolean>(false);
  const [micGranted, setMicGranted] = useState<boolean>(false);

  useEffect(() => {
    const savedLang = localStorage.getItem('vayu_vigil_lang') as Language;
    if (savedLang && ['en', 'hi', 'mr'].includes(savedLang)) {
      setLang(savedLang);
    }
  }, []);

  const handleLangSelect = (selectedLang: Language) => {
    setLang(selectedLang);
    localStorage.setItem('vayu_vigil_lang', selectedLang);
    window.dispatchEvent(new CustomEvent('vayu-vigil-lang-change', { detail: selectedLang }));
    showToast(`Language changed to ${selectedLang.toUpperCase()}`, 'info');
  };

  const handleVerifyOtp = () => {
    if (!phone || !otp) {
      showToast('Please enter mobile number and 6-digit OTP', 'error');
      return;
    }
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      const citizenUser = {
        id: 'citizen-verified',
        name: 'Community Citizen',
        phone: phone,
        role: 'citizen',
        ward_id: 'ward-1-sector-12'
      };
      localStorage.setItem('vayu_vigil_user', JSON.stringify(citizenUser));
      localStorage.setItem('cleanair_user', JSON.stringify(citizenUser));
      localStorage.setItem('vayu_vigil_token', 'mock-citizen-jwt');
      localStorage.setItem('cleanair_token', 'mock-citizen-jwt');
      window.dispatchEvent(new Event('vayu-vigil-auth-change'));
      showToast('Phone number verified successfully!', 'success');
      setStep(3);
    }, 800);
  };

  const handleAnonymous = () => {
    const guestUser = {
      id: 'guest-' + Math.random().toString(36).substring(2, 7),
      name: 'Anonymous Citizen',
      role: 'guest',
      ward_id: 'ward-1-sector-12'
    };
    localStorage.setItem('vayu_vigil_user', JSON.stringify(guestUser));
    localStorage.setItem('cleanair_user', JSON.stringify(guestUser));
    window.dispatchEvent(new Event('vayu-vigil-auth-change'));
    showToast('Continuing as Anonymous Guest', 'info');
    setStep(3);
  };

  const handleRequestLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocationGranted(true);
          showToast('GPS Location permission granted!', 'success');
        },
        (err) => {
          console.warn('Geolocation denied or error:', err);
          setLocationGranted(true); // Simulate grant for hackathon demo flow
          showToast('GPS Location enabled for hackathon demo', 'success');
        }
      );
    } else {
      setLocationGranted(true);
      showToast('GPS Location enabled for hackathon demo', 'success');
    }
  };

  const handleRequestMedia = () => {
    setCameraGranted(true);
    setMicGranted(true);
    showToast('Camera & Microphone permissions granted!', 'success');
  };

  const handleCompleteOnboarding = () => {
    localStorage.setItem('vayu_vigil_onboarded', 'true');
    localStorage.setItem('cleanair_onboarded', 'true');
    showToast('Welcome to Vayu Vigil Citizen Portal!', 'success');
    router.push('/app');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-teal-500 selection:text-white">
      <Navbar lang={lang} onLanguageChange={setLang} />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-10 relative overflow-hidden">
        {/* Glow circles */}
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-xl w-full bg-slate-900/90 border border-white/15 rounded-3xl shadow-2xl p-6 sm:p-10 backdrop-blur-xl relative z-10">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
              <span>Step {step} of 4</span>
              <span className="text-teal-400">
                {step === 1 && 'Language Preferences'}
                {step === 2 && 'Citizen Verification'}
                {step === 3 && 'Location GPS Access'}
                {step === 4 && 'Evidence Media Access'}
              </span>
            </div>
            <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden flex gap-1 p-0.5">
              <div className={`h-full rounded-full transition-all duration-300 ${step >= 1 ? 'w-1/4 bg-gradient-to-r from-teal-400 to-teal-500' : 'w-0'}`} />
              <div className={`h-full rounded-full transition-all duration-300 ${step >= 2 ? 'w-1/4 bg-gradient-to-r from-teal-500 to-teal-600' : 'w-0'}`} />
              <div className={`h-full rounded-full transition-all duration-300 ${step >= 3 ? 'w-1/4 bg-gradient-to-r from-teal-600 to-emerald-500' : 'w-0'}`} />
              <div className={`h-full rounded-full transition-all duration-300 ${step >= 4 ? 'w-1/4 bg-gradient-to-r from-emerald-500 to-amber-400' : 'w-0'}`} />
            </div>
          </div>

          {/* STEP 1: LANGUAGE */}
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-300 font-bold mb-4">
                <Globe className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight mb-2">
                Choose Your Preferred Language
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-6">
                Vayu Vigil is designed for diverse Indian communities. Select your language for incident reporting and alerts. You can change this anytime from the top bar.
              </p>

              <div className="grid grid-cols-1 gap-3 mb-8">
                {[
                  { code: 'en' as Language, name: 'English', native: 'English', desc: 'Default interface language' },
                  { code: 'hi' as Language, name: 'Hindi', native: 'हिंदी', desc: 'उत्तर भारत और सामान्य नागरिक इंटरफ़ेस' },
                  { code: 'mr' as Language, name: 'Marathi', native: 'मराठी', desc: 'महाराष्ट्र व स्थानिक नागरिक इंटरफेस' },
                ].map((l) => (
                  <button
                    key={l.code}
                    onClick={() => handleLangSelect(l.code)}
                    className={`flex items-center justify-between p-4 rounded-2xl border text-left transition-all ${
                      lang === l.code
                        ? 'bg-teal-500/20 border-teal-500 text-white shadow-lg shadow-teal-500/10'
                        : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-sm flex items-center gap-2">
                        <span>{l.native}</span>
                        <span className="text-xs text-slate-400 font-normal">({l.name})</span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">{l.desc}</div>
                    </div>
                    {lang === l.code && <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0" />}
                  </button>
                ))}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setStep(2)}
                  className="flex items-center space-x-2 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-white px-6 py-3 rounded-xl text-xs font-bold shadow-lg transition-all"
                >
                  <span>Continue to Verification</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: PHONE / OTP AUTH */}
          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300 font-bold mb-4">
                <Smartphone className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight mb-2">
                Citizen Verification
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-6">
                Enter your mobile number to receive status SMS alerts when municipal teams extinguish hotspots you report.
              </p>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Mobile Phone Number
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full bg-slate-950 border border-white/20 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-teal-400 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                    One-Time Password (OTP)
                  </label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="123456"
                    className="w-full bg-slate-950 border border-white/20 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-teal-400 font-mono tracking-widest"
                  />
                  <p className="text-[11px] text-teal-400/80 mt-1.5 font-medium">
                    ⚡ Demo Mode: OTP "123456" is pre-filled for hackathon evaluation.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mb-8">
                <button
                  onClick={handleVerifyOtp}
                  disabled={isVerifying}
                  className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-white py-3 px-4 rounded-xl text-xs font-bold shadow-lg transition-all disabled:opacity-50"
                >
                  <span>{isVerifying ? 'Verifying OTP...' : 'Verify Phone & Continue'}</span>
                  {!isVerifying && <ArrowRight className="w-4 h-4" />}
                </button>
                <button
                  onClick={handleAnonymous}
                  className="px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold border border-white/10 transition-all text-center"
                >
                  👤 Continue Anonymous
                </button>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-white/10">
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white transition-colors font-medium"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: LOCATION GPS ACCESS */}
          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-300 font-bold mb-4">
                <MapPin className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight mb-2">
                Enable GPS & Location Snapping
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-6">
                When you report smoke or dust, Vayu Vigil automatically snaps your GPS coordinate to the nearest municipal ward grid cell and correlates with nearby IoT air quality sensors.
              </p>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 mb-8 space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className={`w-5 h-5 mt-0.5 shrink-0 ${locationGranted ? 'text-teal-400' : 'text-slate-500'}`} />
                  <div>
                    <div className="text-xs font-bold text-white">Auto-Tag Wards & Streetlight Sensors</div>
                    <div className="text-[11px] text-slate-400">Instantly links your photo to municipal Ward 1 or Ward 2 command authorities.</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className={`w-5 h-5 mt-0.5 shrink-0 ${locationGranted ? 'text-teal-400' : 'text-slate-500'}`} />
                  <div>
                    <div className="text-xs font-bold text-white">Privacy Protected</div>
                    <div className="text-[11px] text-slate-400">Location is only captured when you explicitly submit a pollution incident report.</div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mb-8">
                <button
                  onClick={handleRequestLocation}
                  className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl text-xs font-bold shadow-lg transition-all ${
                    locationGranted
                      ? 'bg-emerald-600/30 border border-emerald-500 text-emerald-300'
                      : 'bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-white'
                  }`}
                >
                  <MapPin className="w-4 h-4" />
                  <span>{locationGranted ? '✓ Location Granted' : 'Enable Location Access'}</span>
                </button>
                <button
                  onClick={() => setStep(4)}
                  className="px-6 py-3 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 text-xs font-bold border border-teal-500/30 transition-all text-center flex items-center justify-center gap-1.5"
                >
                  <span>Next Step</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-white/10">
                <button
                  onClick={() => setStep(2)}
                  className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white transition-colors font-medium"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: CAMERA & MICROPHONE ACCESS */}
          {step === 4 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-300 font-bold mb-4">
                <Camera className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight mb-2">
                Evidence Capture Permissions
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-6">
                Vayu Vigil uses Gemini Vision AI to verify pollution severity from uploaded or captured photos. You can also record optional 10-second voice descriptions.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center text-center">
                  <Camera className={`w-8 h-8 mb-2 ${cameraGranted ? 'text-teal-400' : 'text-slate-400'}`} />
                  <div className="text-xs font-bold text-white mb-1">Camera Access</div>
                  <div className="text-[11px] text-slate-400 mb-3">Take live photos of smoke or garbage burning.</div>
                  <button
                    onClick={() => {
                      setCameraGranted(true);
                      showToast('Camera permission enabled', 'success');
                    }}
                    className={`w-full py-1.5 rounded-lg text-[11px] font-bold border transition-all ${
                      cameraGranted
                        ? 'bg-teal-500/20 border-teal-500 text-teal-300'
                        : 'bg-white/10 border-white/20 hover:bg-white/20 text-white'
                    }`}
                  >
                    {cameraGranted ? '✓ Enabled' : 'Enable Camera'}
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center text-center">
                  <Mic className={`w-8 h-8 mb-2 ${micGranted ? 'text-amber-400' : 'text-slate-400'}`} />
                  <div className="text-xs font-bold text-white mb-1">Microphone Access</div>
                  <div className="text-[11px] text-slate-400 mb-3">Record voice notes in Hindi, Marathi, or English.</div>
                  <button
                    onClick={() => {
                      setMicGranted(true);
                      showToast('Microphone permission enabled', 'success');
                    }}
                    className={`w-full py-1.5 rounded-lg text-[11px] font-bold border transition-all ${
                      micGranted
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'bg-white/10 border-white/20 hover:bg-white/20 text-white'
                    }`}
                  >
                    {micGranted ? '✓ Enabled' : 'Enable Microphone'}
                  </button>
                </div>
              </div>

              <div className="mb-6">
                <button
                  onClick={handleCompleteOnboarding}
                  className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-600 hover:from-teal-400 hover:to-emerald-400 text-slate-950 py-4 px-6 rounded-2xl text-sm font-black shadow-xl shadow-teal-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 uppercase tracking-wider"
                >
                  <UserCheck className="w-5 h-5 text-slate-950" />
                  <span>Launch Citizen Community Portal</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-white/10">
                <button
                  onClick={() => setStep(3)}
                  className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white transition-colors font-medium"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
