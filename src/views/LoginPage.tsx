import React, { useState } from 'react';
import { User, Lock, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react';
import type { UserAccount } from '../types/stock';
import { StockStorageEngine } from '../services/db';
import { soundEffects } from '../utils/audio';

interface LoginPageProps {
  onLoginSuccess: (user: UserAccount) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shake, setShake] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUser = username.trim();
    const cleanPass = password.trim();

    if (!cleanUser || !cleanPass) {
      setErrorMsg('Nama dan password wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    const authResult = StockStorageEngine.authenticateUser(cleanUser, cleanPass);

    if (authResult) {
      soundEffects.playUnlockSound();
      StockStorageEngine.setCurrentUser(authResult);

      authResult.assignedFloors.forEach((fId) => {
        sessionStorage.setItem(`auth_floor_${fId}`, 'authenticated');
      });

      if (authResult.role === 'ADMIN') {
        sessionStorage.setItem('auth_admin_master', 'authenticated');
      }

      onLoginSuccess(authResult);
    } else {
      soundEffects.playClickSound();
      setErrorMsg('Nama atau password tidak sesuai.');
      setShake(true);
      setTimeout(() => setShake(false), 450);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col justify-center px-4 py-8 max-w-sm mx-auto selection:bg-zinc-200">
      {/* Brand Header */}
      <div className="text-center space-y-2 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center mx-auto shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" className="w-7 h-7">
            <path d="M28 34L50 22L72 34L50 46L28 34Z" stroke="#FFFFFF" strokeWidth="6" strokeLinejoin="round" />
            <path d="M28 50L50 62L72 50" stroke="#A1A1AA" strokeWidth="6" strokeLinejoin="round" />
            <path d="M28 66L50 78L72 66" stroke="#71717A" strokeWidth="6" strokeLinejoin="round" />
          </svg>
        </div>

        <div>
          <h1 className="text-lg font-extrabold text-black tracking-tight leading-tight">
            Istiqomah Grosir Stock
          </h1>
          <p className="text-xs text-zinc-500 font-medium mt-0.5">
            Sistem Manajemen Stok
          </p>
        </div>
      </div>

      {/* Login Card */}
      <div
        className={`bg-white rounded-2xl p-6 border border-zinc-200 shadow-xs ${
          shake ? 'animate-bounce' : ''
        }`}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-800 block">
              Nama
            </label>
            <div className="relative">
              <input
                type="text"
                required
                autoFocus
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="Masukkan nama"
                className="w-full pl-9 pr-3 py-2.5 text-xs font-semibold bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-black focus:bg-white transition-all text-black placeholder:text-zinc-400"
              />
              <User size={15} className="absolute left-3 top-3 text-zinc-400" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-800 block">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="Masukkan password"
                className="w-full pl-9 pr-10 py-2.5 text-xs font-semibold bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-black focus:bg-white transition-all font-mono tracking-wider text-black placeholder:text-zinc-400"
              />
              <Lock size={15} className="absolute left-3 top-3 text-zinc-400" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-zinc-400 hover:text-black transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-zinc-100 border border-zinc-200 text-xs font-semibold text-black flex items-center gap-2">
              <AlertCircle size={14} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-black hover:bg-zinc-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs touch-press transition-all mt-2"
          >
            <span>Masuk</span>
            <ArrowRight size={14} />
          </button>
        </form>
      </div>
    </div>
  );
};
