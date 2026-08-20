import React, { useState } from 'react';
import { Lock, Eye, EyeOff, X, ArrowRight, AlertCircle } from 'lucide-react';
import { soundEffects } from '../utils/audio';

interface PasswordPromptModalProps {
  isOpen: boolean;
  title: string;
  subtitle?: string;
  expectedPassword: string;
  onSuccess: () => void;
  onCancel: () => void;
  storageSessionKey?: string;
}

export const PasswordPromptModal: React.FC<PasswordPromptModalProps> = ({
  isOpen,
  title,
  subtitle = 'Masukkan PIN / Password',
  expectedPassword,
  onSuccess,
  onCancel,
  storageSessionKey,
}) => {
  const [inputVal, setInputVal] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [shake, setShake] = useState(false);
  const [rememberSession, setRememberSession] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (inputVal === expectedPassword) {
      soundEffects.playClickSound();
      if (storageSessionKey && rememberSession) {
        sessionStorage.setItem(storageSessionKey, 'authenticated');
      }
      setErrorMsg('');
      setInputVal('');
      onSuccess();
    } else {
      soundEffects.playClickSound();
      setErrorMsg('PIN salah. Silakan coba lagi.');
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 modal-backdrop animate-in fade-in duration-150">
      <div
        className={`bg-white rounded-3xl max-w-xs w-full shadow-2xl overflow-hidden border border-zinc-200 ${
          shake ? 'animate-bounce' : ''
        }`}
      >
        {/* Header */}
        <div className="p-4 text-center bg-zinc-50 border-b border-zinc-100 relative">
          <button
            onClick={onCancel}
            className="absolute top-3 right-3 p-1 rounded-full text-zinc-400 hover:text-black transition-colors"
          >
            <X size={16} />
          </button>
          <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center mx-auto mb-2">
            <Lock size={18} />
          </div>
          <h3 className="text-xs font-bold text-black">{title}</h3>
          <p className="text-[10px] text-zinc-400 mt-0.5">{subtitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <div className="space-y-1">
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                autoFocus
                required
                value={inputVal}
                onChange={(e) => {
                  setInputVal(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="Ketik PIN..."
                className="w-full px-3 py-2 text-center text-sm font-bold bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-black tracking-widest font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-zinc-400 hover:text-black"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            {errorMsg && (
              <p className="text-[10px] font-semibold text-black flex items-center justify-center gap-1 mt-1">
                <AlertCircle size={11} /> {errorMsg}
              </p>
            )}
          </div>

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-1 pt-0.5">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => {
                  soundEffects.playClickSound();
                  if (k === 'C') setInputVal('');
                  else if (k === '⌫') setInputVal((prev) => prev.slice(0, -1));
                  else setInputVal((prev) => prev + k);
                  setErrorMsg('');
                }}
                className="py-2 text-xs font-bold rounded-lg bg-zinc-50 hover:bg-zinc-100 text-black border border-zinc-200 touch-press"
              >
                {k}
              </button>
            ))}
          </div>

          <label className="flex items-center gap-2 cursor-pointer pt-0.5">
            <input
              type="checkbox"
              checked={rememberSession}
              onChange={(e) => setRememberSession(e.target.checked)}
              className="rounded text-black focus:ring-0 w-3.5 h-3.5"
            />
            <span className="text-[10px] text-zinc-500">Ingat sesi di perangkat ini</span>
          </label>

          <div className="pt-1 flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2 bg-zinc-100 hover:bg-zinc-200 text-black text-xs font-bold rounded-xl"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 py-2 bg-black hover:bg-zinc-800 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 touch-press"
            >
              Buka <ArrowRight size={13} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
