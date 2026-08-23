import React, { useState } from 'react';
import { Eye, EyeOff, ArrowRight, User, Lock } from 'lucide-react';
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
    <div className="min-h-[100dvh] bg-[#f5eedc] flex flex-col justify-center items-center px-4 py-8 select-none">
      <div className="w-full max-w-sm">
        {/* Brand Logo & Heading */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#2a1a10] border-2 border-[#8a4f25]/40 shadow-lg mb-3">
            <svg width="28" height="28" viewBox="0 0 100 100" fill="none">
              <path d="M28 34L50 22L72 34L50 46L28 34Z" stroke="#FAF5E8" strokeWidth="6" strokeLinejoin="round" />
              <path d="M28 50L50 62L72 50" stroke="#C56F1F" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M28 66L50 78L72 66" stroke="#8A4F25" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="text-2xl font-black text-[#2a1a10] tracking-tight">
            Istiqomah Stock
          </h1>
          <p className="text-xs text-[#78604d] font-semibold mt-1">
            Sistem Manajemen Stok Multi-Lantai
          </p>
        </div>

        {/* Elevated Form Card */}
        <div className={`bg-[#faf5e8] rounded-3xl p-6 sm:p-7 shadow-xl border-2 border-[#ded2b8] ${shake ? 'anim-shake' : ''}`}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username Input */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-[#2a1a10] mb-1.5">
                <User size={13} className="text-[#8a4f25]" />
                <span>Nama Pengguna / Petugas</span>
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
                placeholder="Nama akun"
                className="w-full px-3.5 py-3 text-sm bg-white border-2 border-[#ded2b8] focus:border-[#2a1a10] rounded-xl focus:outline-none transition-colors text-[#2a1a10] placeholder:text-[#9e8b74] font-medium"
              />
            </div>

            {/* Password Input */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-[#2a1a10] mb-1.5">
                <Lock size={13} className="text-[#8a4f25]" />
                <span>Password</span>
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
                  placeholder="Password"
                  className="w-full px-3.5 py-3 pr-11 text-sm bg-white border-2 border-[#ded2b8] focus:border-[#2a1a10] rounded-xl focus:outline-none transition-colors font-mono text-[#2a1a10] placeholder:text-[#9e8b74] placeholder:font-sans"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-[#78604d] hover:text-[#2a1a10] transition-colors"
                  tabIndex={-1}
                  title={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-[#2a1a10] hover:bg-[#3d2618] active:scale-[0.98] disabled:opacity-50 text-[#faf5e8] rounded-xl text-sm font-bold flex items-center justify-center gap-2 touch-press shadow-md transition-all pt-3.5 mt-2"
            >
              <span>Masuk</span>
              <ArrowRight size={16} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
