'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in Vayu Vigil component:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#F7F8FA] p-4 text-[#1C1F26]">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-gray-100 text-center space-y-6">
            <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner animate-pulse">
              <AlertTriangle className="w-8 h-8" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-gray-900">Something went temporarily wrong</h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                We encountered an unexpected issue while loading this view. Your data is safe and our telemetry system has logged the event.
              </p>
            </div>

            {this.state.error && (
              <div className="bg-gray-50 rounded-xl p-3 text-left border border-gray-100 overflow-auto max-h-24">
                <code className="text-xs text-red-600 font-mono block">
                  {this.state.error.message || 'Unknown runtime error'}
                </code>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => {
                  this.setState({ hasError: false });
                  window.location.reload();
                }}
                className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary-dark transition shadow-md shadow-primary/20"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Screen
              </button>
              <a
                href="/"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-200 transition"
              >
                <Home className="w-4 h-4" />
                Home
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
