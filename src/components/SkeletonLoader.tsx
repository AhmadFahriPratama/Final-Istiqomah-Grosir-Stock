import React from 'react';

export const SkeletonLoader: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <div className="space-y-1.5 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white border border-stone-200 rounded-xl p-3.5 flex items-center justify-between"
        >
          <div className="space-y-2 flex-1 pr-3">
            <div className="h-4 bg-stone-100 rounded w-3/4" />
            <div className="h-3 bg-stone-100 rounded w-1/2" />
          </div>
          <div className="h-7 w-12 bg-stone-100 rounded-lg" />
        </div>
      ))}
    </div>
  );
};

export const MinimalSpinner: React.FC<{ text?: string }> = ({ text = 'Memuat...' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-10 space-y-2.5 text-stone-400">
      <div className="w-5 h-5 border-2 border-stone-200 border-t-stone-600 rounded-full animate-spin" />
      <span className="text-xs text-stone-400">{text}</span>
    </div>
  );
};
