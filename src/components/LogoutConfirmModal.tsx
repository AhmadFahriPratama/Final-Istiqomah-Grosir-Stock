import React from 'react';
import { LogOut, X, User } from 'lucide-react';
import { soundEffects } from '../utils/audio';
import { useRegisterModal } from '../utils/modalManager';

interface LogoutConfirmModalProps {
  isOpen: boolean;
  userName: string;
  onClose: () => void;
  onConfirm: () => void;
}

export const LogoutConfirmModal: React.FC<LogoutConfirmModalProps> = ({
  isOpen,
  userName,
  onClose,
  onConfirm,
}) => {
  useRegisterModal('LogoutConfirmModal', isOpen, onClose);

  if (!isOpen) return null;

  const handleConfirm = () => {
    soundEffects.playLockSound();
    onConfirm();
    onClose();
  };

  const handleCancel = () => {
    soundEffects.playClickSound();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop anim-fade-in">
      <div className="bg-[#faf5e8] rounded-2xl max-w-sm w-full p-5 shadow-2xl border-2 border-[#2a1a10] space-y-4 anim-slide-up text-left">
        {/* Header with Close */}
        <div className="flex items-start justify-between">
          <div className="w-11 h-11 rounded-2xl bg-[#f0e7d2] border border-[#ded2b8] text-[#8a4f25] flex items-center justify-center shadow-xs">
            <LogOut size={20} />
          </div>
          <button
            type="button"
            onClick={handleCancel}
            className="w-7 h-7 flex items-center justify-center rounded-full text-[#78604d] hover:text-[#2a1a10] hover:bg-[#f3ebd7] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-1.5">
          <h3 className="text-base font-bold text-[#2a1a10]">
            Keluar dari Akun?
          </h3>
          <p className="text-xs text-[#78604d] leading-relaxed">
            Anda akan keluar dari akun <strong className="text-[#2a1a10] font-semibold flex-inline items-center gap-1"><User size={11} className="inline mr-0.5" />{userName || 'Petugas'}</strong>. Anda yakin ingin melanjutkan?
          </p>
        </div>

        {/* Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <button
            type="button"
            onClick={handleCancel}
            className="py-2.5 px-3 bg-[#f3ebd7] hover:bg-[#ebe0c8] text-[#483526] rounded-xl text-xs font-semibold touch-press transition-colors text-center"
          >
            Batalkan
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="py-2.5 px-3 bg-[#8a4f25] hover:bg-[#633312] text-white rounded-xl text-xs font-bold touch-press shadow-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <LogOut size={13} /> Ya, Keluar
          </button>
        </div>
      </div>
    </div>
  );
};
