import React, { useState } from 'react';
import { KeyRound, Eye, EyeOff, X, CheckCircle, AlertCircle } from 'lucide-react';
import type { UserAccount } from '../types/stock';
import { StockStorageEngine } from '../services/db';
import { soundEffects } from '../utils/audio';

interface ChangePasswordModalProps {
  isOpen: boolean;
  currentUser: UserAccount;
  onClose: () => void;
  onSuccess?: (updatedUser: UserAccount) => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  currentUser,
  onClose,
  onSuccess,
}) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!oldPassword.trim() || !newPassword.trim()) {
      setErrorMsg('Semua kolom wajib diisi.');
      return;
    }

    // Verify old password against current stored user
    const currentStored = StockStorageEngine.authenticateUser(
      currentUser.username,
      oldPassword.trim()
    );

    if (!currentStored) {
      soundEffects.playClickSound();
      setErrorMsg('Password lama tidak sesuai.');
      return;
    }

    if (newPassword.trim() !== confirmPassword.trim()) {
      soundEffects.playClickSound();
      setErrorMsg('Konfirmasi password baru tidak cocok.');
      return;
    }

    if (newPassword.trim().length < 3) {
      soundEffects.playClickSound();
      setErrorMsg('Password baru minimal 3 karakter.');
      return;
    }

    // Update password
    const updatedUser: UserAccount = {
      ...currentStored,
      password: newPassword.trim(),
    };

    StockStorageEngine.saveUser(updatedUser);
    StockStorageEngine.setCurrentUser(updatedUser);

    soundEffects.playUnlockSound();
    setSuccessMsg('Password berhasil diperbarui.');

    if (onSuccess) {
      onSuccess(updatedUser);
    }

    setTimeout(() => {
      onClose();
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccessMsg('');
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 modal-backdrop animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-xs w-full shadow-xl overflow-hidden border border-zinc-200 flex flex-col">
        {/* Header */}
        <div className="p-4 bg-zinc-50 border-b border-zinc-100 flex items-center justify-between relative">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center">
              <KeyRound size={15} />
            </div>
            <div>
              <h3 className="text-xs font-bold text-black">Ubah Password</h3>
              <p className="text-[10px] text-zinc-400">Akun: {currentUser.name}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-black hover:bg-zinc-200 transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-zinc-700 block">
              Password Lama:
            </label>
            <div className="relative">
              <input
                type={showOld ? 'text' : 'password'}
                required
                autoFocus
                value={oldPassword}
                onChange={(e) => {
                  setOldPassword(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="Masukkan password saat ini"
                className="w-full pl-3 pr-8 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl font-mono focus:outline-none focus:border-black"
              />
              <button
                type="button"
                onClick={() => setShowOld(!showOld)}
                className="absolute right-2.5 top-2.5 text-zinc-400 hover:text-black"
                tabIndex={-1}
              >
                {showOld ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-zinc-700 block">
              Password Baru:
            </label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="Masukkan password baru"
                className="w-full pl-3 pr-8 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl font-mono focus:outline-none focus:border-black"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-2.5 top-2.5 text-zinc-400 hover:text-black"
                tabIndex={-1}
              >
                {showNew ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-zinc-700 block">
              Ulangi Password Baru:
            </label>
            <input
              type={showNew ? 'text' : 'password'}
              required
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setErrorMsg('');
              }}
              placeholder="Ketik ulang password baru"
              className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl font-mono focus:outline-none focus:border-black"
            />
          </div>

          {errorMsg && (
            <div className="p-2 rounded-lg bg-zinc-100 text-[10px] font-semibold text-black flex items-center gap-1.5">
              <AlertCircle size={12} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-2 rounded-lg bg-zinc-100 text-[10px] font-semibold text-black flex items-center gap-1.5">
              <CheckCircle size={12} className="shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="pt-1 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 bg-zinc-100 hover:bg-zinc-200 text-black text-xs font-semibold rounded-xl"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 py-2 bg-black hover:bg-zinc-800 text-white text-xs font-bold rounded-xl touch-press shadow-xs"
            >
              Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
