'use client';

import React from 'react';
import { Inbox, RefreshCw, Sparkles } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  actionText?: string;
  onAction?: () => void;
  isLoading?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No Records Found',
  description = 'There are no active items or pollution reports matching your criteria at this time.',
  icon,
  actionText,
  onAction,
  isLoading = false
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 my-6 bg-white/5 border border-white/10 rounded-2xl text-center backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-teal-500/20 to-amber-500/20 border border-white/10 flex items-center justify-center mb-4 text-teal-300 shadow-inner">
        {icon || <Inbox className="w-8 h-8 opacity-80" />}
      </div>
      <h3 className="text-base sm:text-lg font-bold text-white mb-2 flex items-center justify-center gap-2">
        {title}
        <Sparkles className="w-4 h-4 text-amber-400" />
      </h3>
      <p className="text-xs sm:text-sm text-slate-400 max-w-md leading-relaxed mb-6">
        {description}
      </p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          disabled={isLoading}
          className="flex items-center space-x-2 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg transition-all active:scale-95 border border-teal-400/30"
        >
          {isLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
          <span>{actionText}</span>
        </button>
      )}
    </div>
  );
};
