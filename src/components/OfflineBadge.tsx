import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { NetworkService } from '../services/network';
import { soundEffects } from '../utils/audio';

export const OfflineBadge: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(() => NetworkService.isOnline());

  useEffect(() => {
    // Initial active probe
    NetworkService.probeConnectivity().then((online) => {
      setIsOnline(online);
    });

    const handleNetworkChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ isOnline: boolean }>;
      setIsOnline(customEvent.detail?.isOnline ?? NetworkService.isOnline());
    };

    window.addEventListener('istiqomah_network_status', handleNetworkChange);

    return () => {
      window.removeEventListener('istiqomah_network_status', handleNetworkChange);
    };
  }, []);

  const handleManualCheck = async () => {
    soundEffects.playClickSound();
    const result = await NetworkService.checkOnline();
    setIsOnline(result);
  };

  return (
    <button
      onClick={handleManualCheck}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all border touch-press shadow-xs ${
        isOnline
          ? 'bg-zinc-900 text-white border-zinc-800 hover:bg-black'
          : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
      }`}
      title={isOnline ? 'Terhubung ke Internet (Klik untuk cek)' : 'Mode Offline / Tidak Ada Internet (Klik untuk cek)'}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
          isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-500 animate-ping'
        }`}
      />
      {isOnline ? (
        <span className="flex items-center gap-1">
          <Wifi size={11} className="text-emerald-400" /> Online
        </span>
      ) : (
        <span className="flex items-center gap-1 font-extrabold text-amber-900">
          <WifiOff size={11} className="text-amber-700" /> Offline
        </span>
      )}
    </button>
  );
};
