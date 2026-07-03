import React, { useState } from 'react';
import { Language, t } from '../lib/i18n';
import { Shield, X, Key, User, Phone, CheckCircle, ArrowRight } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (token: string, user: any) => void;
  lang: Language;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLoginSuccess, lang }) => {
  const [mode, setMode] = useState<'officer' | 'citizen'>('officer');
  const [email, setEmail] = useState('officer.ward1@vayuvigil.gov');
  const [password, setPassword] = useState('admin123');
  const [phone, setPhone] = useState('+919876543210');
  const [otp, setOtp] = useState('123456');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = mode === 'officer' ? '/api/v1/auth/login' : '/api/v1/auth/otp/verify';
      const payload = mode === 'officer' ? { email, password } : { phone, otp };

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
      onClose();
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoFill = (type: 'ward1' | 'ward2' | 'admin' | 'citizen') => {
    setError('');
    if (type === 'ward1') {
      setMode('officer');
      setEmail('officer.ward1@vayuvigil.gov');
      setPassword('admin123');
    } else if (type === 'ward2') {
      setMode('officer');
      setEmail('officer.ward2@vayuvigil.gov');
      setPassword('admin123');
    } else if (type === 'admin') {
      setMode('officer');
      setEmail('admin@vayuvigil.gov');
      setPassword('admin123');
    } else if (type === 'citizen') {
      setMode('citizen');
      setPhone('+919876543210');
      setOtp('123456');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-primary-dark to-primary text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <Shield className="w-6 h-6 text-emerald-300" />
            <h3 className="font-bold text-lg">{t(lang, 'loginModalTitle')}</h3>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Role Mode Tabs */}
          <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => setMode('officer')}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center space-x-2 ${
                mode === 'officer' ? 'bg-white text-primary shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Municipal Officer / Admin</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('citizen')}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center space-x-2 ${
                mode === 'citizen' ? 'bg-white text-primary shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Phone className="w-4 h-4" />
              <span>Citizen OTP</span>
            </button>
          </div>

          {/* Quick Demo Access Buttons for Judges */}
          <div className="mb-6 bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200 text-xs">
            <div className="font-bold text-primary-dark mb-2 flex items-center">
              <CheckCircle className="w-3.5 h-3.5 mr-1 text-primary" />
              <span>⚡ Hackathon Live Demo Quick-Login:</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickDemoFill('ward1')}
                className="bg-white hover:bg-emerald-100/50 text-primary-dark border border-emerald-300 font-semibold py-1.5 px-2 rounded-lg text-left truncate transition-all shadow-sm"
              >
                🛡️ Officer Ward 1 (Bhalswa)
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoFill('ward2')}
                className="bg-white hover:bg-emerald-100/50 text-primary-dark border border-emerald-300 font-semibold py-1.5 px-2 rounded-lg text-left truncate transition-all shadow-sm"
              >
                🛡️ Officer Ward 2 (Sector 9)
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoFill('admin')}
                className="bg-white hover:bg-emerald-100/50 text-primary-dark border border-emerald-300 font-semibold py-1.5 px-2 rounded-lg text-left truncate transition-all shadow-sm"
              >
                👑 Admin (All Wards)
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoFill('citizen')}
                className="bg-white hover:bg-emerald-100/50 text-primary-dark border border-emerald-300 font-semibold py-1.5 px-2 rounded-lg text-left truncate transition-all shadow-sm"
              >
                📱 Citizen Demo Phone
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'officer' ? (
              <>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Official Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                    placeholder="officer@vayuvigil.gov"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                    placeholder="••••••••"
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Mobile Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                    placeholder="+919876543210"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">One-Time Password (OTP)</label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none font-mono tracking-widest text-center text-lg"
                    placeholder="123456"
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2 mt-4 active:scale-98"
            >
              <span>{loading ? 'Authenticating...' : t(lang, 'loginBtn')}</span>
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
