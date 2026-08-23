import React, { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';
import { NetworkService } from '../services/network';
import { soundEffects } from '../utils/audio';

export const OfflineBadge: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(() => NetworkService.isOnline());

  useEffect(() => {
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

  // Only show when offline — reduce visual noise when online
  if (isOnline) return null;

  return (
    <button
      onClick={handleManualCheck}
      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium text-stone-500 bg-stone-100 border border-stone-200 transition-colors touch-press"
      title="Mode Offline (Klik untuk cek)"
    >
      <WifiOff size={10} />
      Offline
    </button>
  );
};
