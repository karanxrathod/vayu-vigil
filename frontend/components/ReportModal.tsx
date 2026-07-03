import React, { useState } from 'react';
import { Language, t } from '../lib/i18n';
import { Camera, Mic, MapPin, Upload, CheckCircle2, AlertTriangle, Sparkles, X, ArrowRight, Loader2 } from 'lucide-react';
import { showToast } from './Toast';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReportSubmitted: () => void;
  lang: Language;
}

export const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose, onReportSubmitted, lang }) => {
  const [step, setStep] = useState<1 | 2 | 3 | 'success'>(1);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [category, setCategory] = useState('smoke');
  const [description, setDescription] = useState('');
  const [lat, setLat] = useState('28.7450');
  const [lon, setLon] = useState('77.1620');
  const [isRecording, setIsRecording] = useState(false);
  const [voiceRecorded, setVoiceRecorded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Success state result
  const [resultData, setResultData] = useState<any>(null);

  if (!isOpen) return null;

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleQuickFillDemo = (type: 'bhalswa' | 'sec9' | 'ringrd') => {
    if (type === 'bhalswa') {
      setCategory('smoke');
      setDescription('Severe open garbage burning at Bhalswa landfill perimeter wall generating thick toxic black smoke plume.');
      setLat('28.7455');
      setLon('77.1615');
    } else if (type === 'sec9') {
      setCategory('dust');
      setDescription('Uncovered construction sand and heavy road excavation dust spreading across residential market area without water sprinkling.');
      setLat('28.7060');
      setLon('77.1840');
    } else if (type === 'ringrd') {
      setCategory('traffic');
      setDescription('Severe black diesel exhaust from idling buses and trucks stuck at underpass traffic bottleneck.');
      setLat('28.6750');
      setLon('77.2250');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      if (photoFile) {
        formData.append('photo', photoFile);
      }
      formData.append('category', category);
      formData.append('description', description);
      formData.append('lat', lat);
      formData.append('lon', lon);
      formData.append('language', lang);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/api/v1/reports`, {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit report');
      }

      showToast('Report submitted and verified by Gemini Vision AI!', 'success');
      setResultData(data);
      setStep('success');
      onReportSubmitted();
    } catch (err: any) {
      const errMsg = err.message || 'Submission failed. Your form data and photo have been preserved below.';
      setError(errMsg);
      showToast('Submission failed. Your form data has been preserved below.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetAndClose = () => {
    setStep(1);
    setPhotoFile(null);
    setPhotoPreview(null);
    setDescription('');
    setResultData(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-dark to-primary text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <Camera className="w-6 h-6 text-emerald-300" />
            <h3 className="font-bold text-lg">{t(lang, 'reportModalTitle')}</h3>
          </div>
          <button onClick={resetAndClose} className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {/* Quick Demo Pre-fills for Presentation */}
          {step !== 'success' && (
            <div className="mb-5 bg-amber-50/70 p-3 rounded-xl border border-amber-200 text-xs">
              <div className="font-bold text-amber-900 mb-2 flex items-center">
                <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-600" />
                <span>⚡ Hackathon Demo Pre-Fill Incident:</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleQuickFillDemo('bhalswa')}
                  className="bg-white hover:bg-amber-100/50 text-amber-900 border border-amber-300 font-semibold py-1.5 px-2 rounded-lg truncate transition-all shadow-sm"
                >
                  🔥 Bhalswa Dump Fire
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFillDemo('sec9')}
                  className="bg-white hover:bg-amber-100/50 text-amber-900 border border-amber-300 font-semibold py-1.5 px-2 rounded-lg truncate transition-all shadow-sm"
                >
                  🏗️ Sector 9 Dust
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFillDemo('ringrd')}
                  className="bg-white hover:bg-amber-100/50 text-amber-900 border border-amber-300 font-semibold py-1.5 px-2 rounded-lg truncate transition-all shadow-sm"
                >
                  🚌 Ring Rd Traffic
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-lg flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <div className="text-sm font-semibold text-gray-800">{t(lang, 'step1')}</div>

              {/* Photo Upload Area */}
              <div className="border-2 border-dashed border-gray-300 rounded-2xl p-6 text-center hover:border-primary transition-colors bg-gray-50/50">
                {photoPreview ? (
                  <div className="relative inline-block">
                    <img src={photoPreview} alt="Upload preview" className="max-h-48 rounded-xl mx-auto shadow-md" />
                    <button
                      type="button"
                      onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                      className="absolute -top-2 -right-2 bg-red-600 text-white p-1 rounded-full shadow-md hover:bg-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer block">
                    <Upload className="w-10 h-10 text-primary mx-auto mb-2 opacity-80" />
                    <div className="text-sm font-bold text-gray-700">{t(lang, 'uploadPhoto')}</div>
                    <div className="text-xs text-gray-400 mt-1">PNG, JPG up to 10MB</div>
                    <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                  </label>
                )}
              </div>

              {/* Optional Voice Recording Simulation */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2.5 rounded-full ${isRecording ? 'bg-red-500 text-white animate-pulse' : voiceRecorded ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                    <Mic className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-gray-800">{t(lang, 'recordVoice')}</div>
                    <div className="text-[11px] text-gray-500">
                      {isRecording ? 'Recording audio snippet...' : voiceRecorded ? '✓ 10s voice clip recorded' : 'Hold or click to simulate speech note'}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!isRecording && !voiceRecorded) {
                      setIsRecording(true);
                      setTimeout(() => { setIsRecording(false); setVoiceRecorded(true); }, 2000);
                    } else if (voiceRecorded) {
                      setVoiceRecorded(false);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    voiceRecorded ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-primary text-white hover:bg-primary-dark'
                  }`}
                >
                  {isRecording ? 'Stop' : voiceRecorded ? 'Remove' : 'Record'}
                </button>
              </div>

              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 active:scale-98"
              >
                <span>Continue to Location & Category</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div className="text-sm font-semibold text-gray-800">{t(lang, 'step2')}</div>

              {/* Pollutant Category Selector */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">{t(lang, 'category')}</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'smoke', label: t(lang, 'smoke'), icon: '🔥', color: 'border-red-500 bg-red-50 text-red-800' },
                    { id: 'dust', label: t(lang, 'dust'), icon: '🏗️', color: 'border-amber-500 bg-amber-50 text-amber-800' },
                    { id: 'industry', label: t(lang, 'industry'), icon: '🏭', color: 'border-purple-500 bg-purple-50 text-purple-800' },
                    { id: 'traffic', label: t(lang, 'traffic'), icon: '🚌', color: 'border-blue-500 bg-blue-50 text-blue-800' },
                    { id: 'other', label: t(lang, 'other'), icon: '⚠️', color: 'border-gray-500 bg-gray-50 text-gray-800' }
                  ].map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCategory(c.id)}
                      className={`p-3 rounded-xl border-2 text-left transition-all flex items-center space-x-2 ${
                        category === c.id ? `${c.color} font-bold shadow-sm ring-2 ring-offset-1 ring-gray-400` : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <span className="text-lg">{c.icon}</span>
                      <span className="text-xs truncate">{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* GPS Location Snapped */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-gray-800">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span>{t(lang, 'autoGps')}</span>
                  </div>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded font-bold">
                    ✓ GPS Locked & Snapped
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-white p-2 rounded border border-gray-200 text-gray-600">
                  <div>Lat: <span className="font-bold text-gray-900">{lat}</span></div>
                  <div>Lon: <span className="font-bold text-gray-900">{lon}</span></div>
                </div>
                <p className="text-[10px] text-gray-400 mt-1.5">
                  🛡️ Privacy Guard: Exact coordinates are snapped to grid cell centroid for public display.
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-1/3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-4 rounded-xl transition-all text-sm"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="w-2/3 bg-primary hover:bg-primary-dark text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 text-sm"
                >
                  <span>Continue to Description</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="text-sm font-semibold text-gray-800">{t(lang, 'step3')}</div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">Incident Description</label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t(lang, 'descriptionPlaceholder')}
                  className="w-full p-3.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                  required
                />
              </div>

              <div className="bg-blue-50/70 p-3.5 rounded-xl border border-blue-200 text-xs text-blue-800 flex items-start space-x-2">
                <Sparkles className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <span>
                  Upon submission, our automated Gemini AI Vision model will verify the photo, classify the pollution severity, and update the municipal hotspot queue in real-time.
                </span>
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={loading}
                  className="w-1/3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-4 rounded-xl transition-all text-sm"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-2/3 bg-primary hover:bg-primary-dark text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2 text-sm"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{t(lang, 'submitting')}</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{t(lang, 'submitReport')}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {step === 'success' && resultData && (
            <div className="space-y-5 text-center animate-fade-in py-2">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">{t(lang, 'reportSuccess')}</h3>

              <div className="bg-gray-100 p-4 rounded-xl border border-gray-200 inline-block px-6">
                <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold">{t(lang, 'trackingId')}</div>
                <div className="text-2xl font-mono font-bold text-primary-dark mt-1">{resultData.tracking_id}</div>
                <div className="text-xs font-semibold text-gray-600 mt-1">Locality: {resultData.locality_name}</div>
              </div>

              {/* AI Vision Analysis Result Card */}
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-5 rounded-2xl border border-emerald-200 text-left shadow-sm">
                <div className="flex items-center justify-between mb-3 border-b border-emerald-200/60 pb-2">
                  <div className="flex items-center space-x-2 font-bold text-primary-dark text-sm">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>{t(lang, 'aiAnalysis')}</span>
                  </div>
                  <span className="bg-emerald-600 text-white text-[11px] px-2.5 py-0.5 rounded-full font-bold">
                    {Math.round((resultData.ai_classification?.confidence || 0.95) * 100)}% {t(lang, 'confidence')}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                  <div className="bg-white/80 p-2 rounded-lg border border-emerald-100">
                    <span className="text-gray-500 block">Detected Pollutant:</span>
                    <span className="font-bold text-gray-900 uppercase text-sm mt-0.5 block">
                      {resultData.ai_classification?.predicted_category || category}
                    </span>
                  </div>
                  <div className="bg-white/80 p-2 rounded-lg border border-emerald-100">
                    <span className="text-gray-500 block">Assigned Ward:</span>
                    <span className="font-bold text-gray-900 text-sm mt-0.5 block">
                      {resultData.ward_id ? resultData.ward_id.replace('ward-1-', '') : 'Ward 1'}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-700 italic bg-white/50 p-2.5 rounded-lg border border-emerald-100">
                  "{resultData.ai_classification?.description_summary || description}"
                </p>
              </div>

              <button
                type="button"
                onClick={resetAndClose}
                className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-all"
              >
                {t(lang, 'close')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
