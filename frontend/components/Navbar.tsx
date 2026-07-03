'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Shield, Globe, LogIn, LogOut, MapPin, Layers, Award, User, AlertTriangle, ChevronDown } from 'lucide-react';
import { Language, t } from '../lib/i18n';

interface NavbarProps {
  lang?: Language;
  onLanguageChange?: (lang: Language) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ lang: initialLang = 'en', onLanguageChange }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [lang, setLang] = useState<Language>(initialLang);
  const [user, setUser] = useState<any | null>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    // Load language from localStorage
    const savedLang = localStorage.getItem('vayu_vigil_lang') as Language;
    if (savedLang && ['en', 'hi', 'mr'].includes(savedLang)) {
      setLang(savedLang);
      if (onLanguageChange) onLanguageChange(savedLang);
    }

    // Load user profile
    const savedUser = localStorage.getItem('vayu_vigil_user') || localStorage.getItem('cleanair_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        setUser(null);
      }
    }

    // Listen for custom lang or user change events
    const handleLangChange = (e: any) => {
      if (e.detail && ['en', 'hi', 'mr'].includes(e.detail)) {
        setLang(e.detail);
      }
    };
    const handleAuthChange = () => {
      const u = localStorage.getItem('vayu_vigil_user') || localStorage.getItem('cleanair_user');
      if (u) {
        try { setUser(JSON.parse(u)); } catch (e) { setUser(null); }
      } else {
        setUser(null);
      }
    };

    window.addEventListener('vayu-vigil-lang-change', handleLangChange);
    window.addEventListener('vayu-vigil-auth-change', handleAuthChange);
    return () => {
      window.removeEventListener('vayu-vigil-lang-change', handleLangChange);
      window.removeEventListener('vayu-vigil-auth-change', handleAuthChange);
    };
  }, [onLanguageChange]);

  const handleSetLang = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem('vayu_vigil_lang', newLang);
    window.dispatchEvent(new CustomEvent('vayu-vigil-lang-change', { detail: newLang }));
    if (onLanguageChange) onLanguageChange(newLang);
  };

  const handleConfirmLogout = () => {
    localStorage.removeItem('vayu_vigil_token');
    localStorage.removeItem('vayu_vigil_user');
    localStorage.removeItem('cleanair_token');
    localStorage.removeItem('cleanair_user');
    setUser(null);
    setShowLogoutModal(false);
    window.dispatchEvent(new Event('vayu-vigil-auth-change'));
    router.push('/');
  };

  // Determine current role/mode
  const isOfficerRoute = pathname?.startsWith('/officer');
  const isCitizenRoute = pathname?.startsWith('/app') || pathname?.startsWith('/onboarding');
  const roleLabel = user?.role === 'officer' 
    ? t(lang, 'roleOfficer') 
    : isCitizenRoute 
      ? t(lang, 'roleCitizen') 
      : t(lang, 'roleGuest');

  return (
    <>
      <header className="bg-gradient-to-r from-[#0f172a] via-[#0d9488] to-[#0f172a] text-white shadow-lg sticky top-0 z-50 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand Logo & Title */}
            <Link href="/" className="flex items-center space-x-3 cursor-pointer group">
              <div className="bg-white/10 p-2 rounded-xl backdrop-blur-md border border-white/20 group-hover:bg-white/20 transition-all flex items-center justify-center">
                <img src="/assets/vayu-vigil-logo.svg" alt="Vayu Vigil Logo" className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-lg sm:text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-teal-100 to-amber-200">
                    {t(lang, 'appTitle')}
                  </span>
                  <span className="bg-amber-500/20 text-amber-300 text-[10px] px-2 py-0.5 rounded-full font-bold border border-amber-500/30 uppercase tracking-wide">
                    {roleLabel}
                  </span>
                </div>
                <p className="text-[11px] text-teal-100/80 hidden md:block font-medium truncate max-w-xs">
                  {t(lang, 'tagline')}
                </p>
              </div>
            </Link>

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center space-x-1 bg-black/30 p-1.5 rounded-xl backdrop-blur-md border border-white/10">
              <Link
                href="/"
                className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  pathname === '/'
                    ? 'bg-teal-500 text-white shadow-md'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                <span>{t(lang, 'navLanding')}</span>
              </Link>
              <Link
                href="/app"
                className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  pathname?.startsWith('/app') || pathname?.startsWith('/onboarding')
                    ? 'bg-teal-500 text-white shadow-md'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                <MapPin className="w-3.5 h-3.5 text-teal-300" />
                <span>{t(lang, 'navCitizen')}</span>
              </Link>
              <Link
                href="/officer/dashboard"
                className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  pathname?.startsWith('/officer')
                    ? 'bg-teal-500 text-white shadow-md'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-amber-300" />
                <span>{t(lang, 'navOfficer')}</span>
                {user?.role === 'officer' && (
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                )}
              </Link>
            </nav>

            {/* Right Controls: Language & Auth Profile */}
            <div className="flex items-center space-x-3">
              {/* Language Switcher */}
              <div className="flex items-center bg-black/30 rounded-lg p-1 border border-white/10 text-xs font-bold shadow-inner">
                <Globe className="w-3.5 h-3.5 ml-1.5 mr-1 text-teal-300" />
                {(['en', 'hi', 'mr'] as Language[]).map((l) => (
                  <button
                    key={l}
                    onClick={() => handleSetLang(l)}
                    className={`px-2 py-1 rounded transition-all uppercase ${
                      lang === l
                        ? 'bg-teal-500 text-white font-extrabold shadow-sm'
                        : 'text-white/70 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>

              {/* User Profile / Auth Actions */}
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-xl border border-white/20 transition-all active:scale-95"
                  >
                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-teal-400 to-amber-400 flex items-center justify-center font-bold text-slate-900 text-xs shadow">
                      {(user.email || user.phone || 'U')[0].toUpperCase()}
                    </div>
                    <div className="text-left hidden lg:block">
                      <div className="text-xs font-bold leading-none truncate max-w-[120px]">{user.email || user.phone}</div>
                      <div className="text-[10px] text-amber-300 uppercase tracking-wider mt-0.5 font-extrabold">
                        {user.role} {user.ward_id ? `• ${user.ward_id.replace('ward-1-', '')}` : ''}
                      </div>
                    </div>
                    <ChevronDown className="w-4 h-4 text-white/70" />
                  </button>

                  {/* Dropdown Menu */}
                  {showMenu && (
                    <div className="absolute right-0 mt-2 w-56 bg-slate-900/95 backdrop-blur-xl rounded-xl border border-white/15 shadow-2xl py-2 z-50 text-slate-200 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="px-4 py-2 border-b border-white/10 mb-1 lg:hidden">
                        <div className="text-xs font-bold text-white truncate">{user.email || user.phone}</div>
                        <div className="text-[10px] text-amber-300 uppercase font-bold mt-0.5">{user.role}</div>
                      </div>
                      <Link
                        href={user.role === 'officer' ? '/officer/dashboard' : '/app'}
                        onClick={() => setShowMenu(false)}
                        className="flex items-center space-x-2 px-4 py-2 text-xs font-semibold hover:bg-teal-500/20 hover:text-teal-300 transition-colors"
                      >
                        <User className="w-4 h-4" />
                        <span>{t(lang, 'userProfileRole')}</span>
                      </Link>
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          setShowLogoutModal(true);
                        }}
                        className="w-full flex items-center space-x-2 px-4 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>{t(lang, 'switchProfileBtn')}</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link
                    href="/officer/login"
                    className="flex items-center space-x-1.5 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 border border-teal-400/30"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{t(lang, 'login')}</span>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Bottom Sub-nav */}
          <div className="flex md:hidden border-t border-white/10 py-1.5 justify-around bg-black/20">
            <Link
              href="/"
              className={`flex items-center space-x-1 text-[11px] font-bold px-3 py-1 rounded-lg ${
                pathname === '/' ? 'bg-teal-500 text-white' : 'text-white/80'
              }`}
            >
              <span>{t(lang, 'navLanding')}</span>
            </Link>
            <Link
              href="/app"
              className={`flex items-center space-x-1 text-[11px] font-bold px-3 py-1 rounded-lg ${
                pathname?.startsWith('/app') ? 'bg-teal-500 text-white' : 'text-white/80'
              }`}
            >
              <MapPin className="w-3 h-3 text-teal-300" />
              <span>{t(lang, 'navCitizen')}</span>
            </Link>
            <Link
              href="/officer/dashboard"
              className={`flex items-center space-x-1 text-[11px] font-bold px-3 py-1 rounded-lg ${
                pathname?.startsWith('/officer') ? 'bg-teal-500 text-white' : 'text-white/80'
              }`}
            >
              <Layers className="w-3 h-3 text-amber-300" />
              <span>{t(lang, 'navOfficer')}</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-white/15 rounded-2xl p-6 max-w-sm w-full shadow-2xl text-white">
            <div className="flex items-center space-x-3 text-amber-400 mb-3">
              <div className="p-2 bg-amber-500/10 rounded-xl border border-amber-500/20">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold">{t(lang, 'confirmLogoutTitle')}</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-6">
              {t(lang, 'confirmLogoutDesc')}
            </p>
            <div className="flex space-x-3 justify-end">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 transition-colors"
              >
                {t(lang, 'cancelBtn')}
              </button>
              <button
                onClick={handleConfirmLogout}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white shadow-lg transition-all"
              >
                {t(lang, 'confirmBtn')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
