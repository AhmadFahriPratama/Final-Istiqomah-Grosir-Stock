import React, { useState, useEffect } from 'react';
import { User, Eye, EyeOff, X, ArrowRight, AlertCircle } from 'lucide-react';
import type { UserAccount, FloorId } from '../types/stock';
import { FLOOR_DEFINITIONS } from '../types/stock';
import { StockStorageEngine } from '../services/db';
import { soundEffects } from '../utils/audio';

interface LoginModalProps {
  isOpen: boolean;
  preselectedFloorId?: FloorId;
  onClose: () => void;
  onSuccess: (user: UserAccount) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  preselectedFloorId,
  onClose,
  onSuccess,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [shake, setShake] = useState(false);

  const [availableUsers, setAvailableUsers] = useState<UserAccount[]>([]);

  useEffect(() => {
    if (isOpen) {
      const settings = StockStorageEngine.getAdminSettings();
      setAvailableUsers(settings.users || []);
      setErrorMsg('');

      // If preselected floor, default to the staff assigned to that floor
      if (preselectedFloorId) {
        const floorStaff = (settings.users || []).find((u) =>
          u.assignedFloors.includes(preselectedFloorId)
        );
        if (floorStaff) {
          setUsername(floorStaff.username);
        } else {
          setUsername('');
        }
      } else {
        setUsername('');
      }
      setPassword('');
    }
  }, [isOpen, preselectedFloorId]);

  if (!isOpen) return null;

  const handleSelectStaffQuickChip = (u: UserAccount) => {
    soundEffects.playClickSound();
    setUsername(u.username);
    setPassword('');
    setErrorMsg('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMsg('Harap masukkan username dan password.');
      return;
    }

    const authResult = StockStorageEngine.authenticateUser(username, password);

    if (authResult) {
      soundEffects.playUnlockSound();
      StockStorageEngine.setCurrentUser(authResult);

      // Authenticate assigned floors for the current session
      authResult.assignedFloors.forEach((fId) => {
        sessionStorage.setItem(`auth_floor_${fId}`, 'authenticated');
      });

      if (authResult.role === 'ADMIN') {
        sessionStorage.setItem('auth_admin_master', 'authenticated');
      }

      onSuccess(authResult);
      onClose();
    } else {
      soundEffects.playClickSound();
      setErrorMsg('Username atau password tidak sesuai.');
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 modal-backdrop anim-fade-in overflow-y-auto">
      <div
        className={`bg-white rounded-2xl max-w-sm w-full shadow-xl overflow-hidden border border-stone-200 my-auto flex flex-col ${
          shake ? 'animate-bounce' : ''
        }`}
      >
        {/* Header */}
        <div className="p-5 text-center bg-stone-50 border-b border-stone-100 relative">
          <button
            onClick={onClose}
            className="absolute top-3.5 right-3.5 p-1.5 rounded-full text-stone-400 hover:text-stone-900 hover:bg-stone-200 transition-colors"
          >
            <X size={16} />
          </button>
          <div className="w-11 h-11 rounded-2xl bg-stone-900 text-white flex items-center justify-center mx-auto mb-2 shadow-sm">
            <User size={20} />
          </div>
          <h3 className="text-sm font-bold text-stone-900">Login Staf & Penjaga Lantai</h3>
          <p className="text-[11px] text-stone-400 mt-0.5">
            {preselectedFloorId
              ? `Masuk untuk akses ${FLOOR_DEFINITIONS[preselectedFloorId].name} (${FLOOR_DEFINITIONS[preselectedFloorId].subtitle})`
              : 'Gunakan akun tim untuk mulai bekerja'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          {/* Quick Staff Selection Chips */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
              Pilih Profil Cepat:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {availableUsers.map((u) => {
                const isSelected = username.toLowerCase() === u.username.toLowerCase();
                const floorLabel =
                  u.role === 'ADMIN'
                    ? 'Admin'
                    : `Lt ${u.assignedFloors.join(',')}`;

                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleSelectStaffQuickChip(u)}
                    className={`px-2.5 py-1 text-xs font-bold rounded-xl border transition-all touch-press flex items-center gap-1 ${
                      isSelected
                        ? 'bg-stone-900 text-white border-black'
                        : 'bg-stone-50 text-stone-600 border-stone-200 hover:border-black'
                    }`}
                  >
                    <span>{u.name}</span>
                    <span
                      className={`text-[9px] px-1 py-0.2 rounded-md ${
                        isSelected ? 'bg-stone-800 text-white' : 'bg-stone-200 text-stone-500'
                      }`}
                    >
                      {floorLabel}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Username Input */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-stone-600 block">
              Username:
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="Nama atau Username"
                className="w-full px-3 py-2 text-xs font-bold bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-black"
              />
              <User size={14} className="absolute right-3 top-2.5 text-stone-400" />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-stone-600 block">
              Password:
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoFocus={!!username}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="Masukkan password akun..."
                className="w-full px-3 py-2 text-xs font-bold bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-black font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-900"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            {errorMsg && (
              <p className="text-[10px] font-semibold text-stone-900 flex items-center gap-1 mt-1">
                <AlertCircle size={11} /> {errorMsg}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-900 text-xs font-bold rounded-xl"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 touch-press shadow-xs"
            >
              Masuk <ArrowRight size={13} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
