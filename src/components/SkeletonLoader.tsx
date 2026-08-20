import React from 'react';

export const SkeletonLoader: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <div className="space-y-2.5 p-1 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white/80 border border-slate-200/80 rounded-2xl p-3.5 flex items-center justify-between"
        >
          <div className="space-y-2 flex-1 pr-3">
            <div className="h-4 bg-slate-200 rounded-md w-3/4" />
            <div className="flex items-center gap-2">
              <div className="h-3 bg-slate-200 rounded-md w-16" />
              <div className="h-3 bg-slate-200 rounded-md w-24" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-7 w-12 bg-slate-200 rounded-xl" />
            <div className="h-9 w-9 bg-slate-200 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
};

export const MinimalSpinner: React.FC<{ text?: string }> = ({ text = 'Memuat...' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-10 space-y-2.5 text-slate-400">
      <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" />
      <span className="text-xs font-medium text-slate-500">{text}</span>
    </div>
  );
};
