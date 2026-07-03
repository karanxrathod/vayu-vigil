'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

export const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success') => {
  if (typeof window !== 'undefined') {
    const event = new CustomEvent('vayu-vigil-toast', {
      detail: { id: Math.random().toString(36).substring(2, 9), message, type },
    });
    window.dispatchEvent(event);
  }
};

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const handleToast = (e: any) => {
      const newToast: ToastMessage = e.detail;
      setToasts((prev) => [...prev, newToast]);

      // Auto dismiss after 4 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
      }, 4000);
    };

    window.addEventListener('vayu-vigil-toast', handleToast);
    return () => {
      window.removeEventListener('vayu-vigil-toast', handleToast);
    };
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col space-y-3 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-start space-x-3 p-4 rounded-xl shadow-2xl border backdrop-blur-xl transition-all animate-in slide-in-from-bottom-5 duration-200 ${
            toast.type === 'success'
              ? 'bg-slate-900/95 border-teal-500/50 text-teal-200'
              : toast.type === 'error'
                ? 'bg-slate-900/95 border-red-500/50 text-red-200'
                : 'bg-slate-900/95 border-amber-500/50 text-amber-200'
          }`}
        >
          <div className="mt-0.5 shrink-0">
            {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-teal-400" />}
            {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-red-400" />}
            {toast.type === 'info' && <Info className="w-5 h-5 text-blue-400" />}
            {toast.type === 'warning' && <AlertCircle className="w-5 h-5 text-amber-400" />}
          </div>
          <div className="flex-1 text-xs font-semibold leading-relaxed">{toast.message}</div>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-white/50 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
