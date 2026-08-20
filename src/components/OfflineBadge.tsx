import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';

export const OfflineBadge: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all border ${
        isOnline
          ? 'bg-zinc-900 text-white border-zinc-900'
          : 'bg-zinc-100 text-zinc-600 border-zinc-300'
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-400'
        }`}
      />
      {isOnline ? (
        <span className="flex items-center gap-1">
          <Wifi size={11} /> Online
        </span>
      ) : (
        <span className="flex items-center gap-1">
          <WifiOff size={11} /> Offline
        </span>
      )}
    </div>
  );
};
