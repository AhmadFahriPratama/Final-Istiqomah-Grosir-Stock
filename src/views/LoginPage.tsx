import React, { useState } from 'react';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
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
      setTimeout(() => setShake(false), 400);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5eedc] flex flex-col justify-center px-5 py-8 max-w-sm mx-auto">
      {/* Brand */}
      <div className="mb-10">
        <h1 className="text-2xl font-extrabold text-[#2a1a10] tracking-tight">
          Istiqomah Grosir
        </h1>
        <p className="text-sm text-[#78604d] mt-0.5 font-medium">
          Sistem Manajemen Stok
        </p>
      </div>

      {/* Form */}
      <div className={shake ? 'anim-shake' : ''}>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-xs font-semibold text-stone-600 block mb-1.5">
              Nama
            </label>
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
              className="w-full px-3.5 py-3 text-sm bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900/10 transition-all text-stone-900 placeholder:text-stone-300 font-medium"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-stone-600 block mb-1.5">
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
                className="w-full px-3.5 py-3 pr-11 text-sm bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900/10 transition-all font-mono tracking-wider text-stone-900 placeholder:text-stone-300 placeholder:font-sans placeholder:tracking-normal"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3.5 text-stone-400 hover:text-stone-700 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {errorMsg && (
            <p className="text-xs text-red-600 font-medium px-1">
              {errorMsg}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-stone-900 hover:bg-stone-800 disabled:opacity-40 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 touch-press transition-colors mt-2"
          >
            <span>Masuk</span>
            <ArrowRight size={15} />
          </button>
        </form>
      </div>
    </div>
  );
};
