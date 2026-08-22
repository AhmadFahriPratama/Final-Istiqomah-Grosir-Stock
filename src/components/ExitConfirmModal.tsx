import React from 'react';
import { LogOut } from 'lucide-react';
import { App as CapApp } from '@capacitor/app';
import { soundEffects } from '../utils/audio';

interface ExitConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExitConfirmModal: React.FC<ExitConfirmModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const handleExitApp = async () => {
    soundEffects.playLockSound();
    try {
      await CapApp.exitApp();
    } catch {
      // If web browser where exitApp is not supported, close or show goodbye
      window.close();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/80 modal-backdrop animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-xs w-full p-5 shadow-2xl border border-zinc-200 space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center mx-auto shadow-md">
          <LogOut size={22} />
        </div>

        <div className="text-center space-y-1.5">
          <h4 className="text-sm font-extrabold text-black">
            Keluar dari Aplikasi?
          </h4>
          <p className="text-xs text-zinc-600 leading-relaxed">
            Apakah Anda yakin ingin menutup aplikasi <strong>Istiqomah Grosir Stock</strong>?
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={() => {
              soundEffects.playClickSound();
              onClose();
            }}
            className="py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl text-xs font-bold touch-press"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleExitApp}
            className="py-2.5 bg-black hover:bg-zinc-900 text-white rounded-xl text-xs font-bold touch-press shadow-xs flex items-center justify-center gap-1.5"
          >
            <LogOut size={13} /> Ya, Keluar
          </button>
        </div>
      </div>
    </div>
  );
};
