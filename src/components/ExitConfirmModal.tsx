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
      window.close();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-4 modal-backdrop anim-fade-in">
      <div className="bg-white rounded-2xl max-w-xs w-full p-5 shadow-xl border border-stone-200 space-y-4 anim-slide-up">
        <div className="text-center space-y-1.5">
          <LogOut size={20} className="text-stone-400 mx-auto mb-2" />
          <h4 className="text-sm font-semibold text-stone-900">
            Keluar dari Aplikasi?
          </h4>
          <p className="text-xs text-stone-500 leading-relaxed">
            Tutup aplikasi Istiqomah Grosir Stock?
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={() => {
              soundEffects.playClickSound();
              onClose();
            }}
            className="py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold touch-press"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleExitApp}
            className="py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold touch-press flex items-center justify-center gap-1.5"
          >
            <LogOut size={13} /> Keluar
          </button>
        </div>
      </div>
    </div>
  );
};
