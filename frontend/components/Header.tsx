import React from 'react';
import { Language, t } from '../lib/i18n';
import { Shield, Globe, LogIn, LogOut, MapPin, Layers, Award } from 'lucide-react';

interface HeaderProps {
  lang: Language;
  setLang: (l: Language) => void;
  activeTab: 'citizen' | 'officer' | 'roadmap';
  setActiveTab: (tab: 'citizen' | 'officer' | 'roadmap') => void;
  user: any | null;
  onLoginClick: () => void;
  onLogoutClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  lang,
  setLang,
  activeTab,
  setActiveTab,
  user,
  onLoginClick,
  onLogoutClick
}) => {
  return (
    <header className="bg-gradient-to-r from-primary-dark via-primary to-primary-light text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('citizen')}>
            <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm border border-white/20">
              <Shield className="w-7 h-7 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg sm:text-xl tracking-tight">{t(lang, 'appTitle')}</span>
                <span className="bg-emerald-400/20 text-emerald-300 text-xs px-2 py-0.5 rounded-full font-medium border border-emerald-400/30">
                  Google Cloud x Hack2skill
                </span>
              </div>
              <p className="text-xs text-emerald-100/80 hidden md:block">{t(lang, 'tagline')}</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1 bg-black/20 p-1 rounded-xl backdrop-blur-md border border-white/10">
            <button
              onClick={() => setActiveTab('citizen')}
              className={`flex items-center space-x-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'citizen'
                  ? 'bg-white text-primary-dark shadow-md font-semibold'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>{t(lang, 'citizenPortal')}</span>
            </button>
            <button
              onClick={() => setActiveTab('officer')}
              className={`flex items-center space-x-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'officer'
                  ? 'bg-white text-primary-dark shadow-md font-semibold'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>{t(lang, 'officerPortal')}</span>
              {user?.role === 'officer' && (
                <span className="w-2 h-2 rounded-full bg-critical animate-pulse" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('roadmap')}
              className={`flex items-center space-x-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'roadmap'
                  ? 'bg-white text-primary-dark shadow-md font-semibold'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <Award className="w-4 h-4 text-amber-300" />
              <span>{t(lang, 'roadmap')}</span>
            </button>
          </nav>

          {/* Language Selector & Auth */}
          <div className="flex items-center space-x-3">
            {/* Language Switcher */}
            <div className="flex items-center bg-black/20 rounded-lg p-1 border border-white/10 text-xs font-semibold">
              <Globe className="w-3.5 h-3.5 ml-1.5 mr-1 text-emerald-300" />
              {(['en', 'hi', 'mr'] as Language[]).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`px-2 py-1 rounded transition-all uppercase ${
                    lang === l
                      ? 'bg-white text-primary-dark font-bold shadow-sm'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>

            {/* Auth Button */}
            {user ? (
              <div className="flex items-center space-x-2 bg-white/10 px-3 py-1.5 rounded-lg border border-white/20">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-semibold leading-none">{user.email || user.phone}</div>
                  <div className="text-[10px] text-emerald-300 uppercase tracking-wider mt-0.5 font-bold">
                    {user.role} {user.ward_id ? `(${user.ward_id.replace('ward-1-', '')})` : ''}
                  </div>
                </div>
                <button
                  onClick={onLogoutClick}
                  title={t(lang, 'logout')}
                  className="p-1 hover:bg-white/20 rounded-md transition-colors text-white"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onLoginClick}
                className="flex items-center space-x-1.5 bg-white text-primary-dark hover:bg-emerald-50 px-3.5 py-1.5 rounded-lg text-sm font-semibold shadow-md transition-all active:scale-95"
              >
                <LogIn className="w-4 h-4" />
                <span>{t(lang, 'login')}</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="flex md:hidden border-t border-white/10 py-2 justify-around">
          <button
            onClick={() => setActiveTab('citizen')}
            className={`flex items-center space-x-1.5 text-xs font-medium px-3 py-1 rounded-md ${
              activeTab === 'citizen' ? 'bg-white text-primary-dark font-bold' : 'text-white/80'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>{t(lang, 'citizenPortal')}</span>
          </button>
          <button
            onClick={() => setActiveTab('officer')}
            className={`flex items-center space-x-1.5 text-xs font-medium px-3 py-1 rounded-md ${
              activeTab === 'officer' ? 'bg-white text-primary-dark font-bold' : 'text-white/80'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{t(lang, 'officerPortal')}</span>
          </button>
          <button
            onClick={() => setActiveTab('roadmap')}
            className={`flex items-center space-x-1.5 text-xs font-medium px-3 py-1 rounded-md ${
              activeTab === 'roadmap' ? 'bg-white text-primary-dark font-bold' : 'text-white/80'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-amber-300" />
            <span>{t(lang, 'roadmap')}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
