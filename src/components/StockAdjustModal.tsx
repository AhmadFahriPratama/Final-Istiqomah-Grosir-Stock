import React, { useState } from 'react';
import { X, Plus, Minus, Check, ArrowRight } from 'lucide-react';
import type { StockItem } from '../types/stock';
import { soundEffects } from '../utils/audio';

interface StockAdjustModalProps {
  isOpen: boolean;
  item: StockItem | null;
  onClose: () => void;
  onConfirm: (delta: number, reason: string) => void;
}

export const StockAdjustModal: React.FC<StockAdjustModalProps> = ({
  isOpen,
  item,
  onClose,
  onConfirm,
}) => {
  const [delta, setDelta] = useState<number>(1);
  const [mode, setMode] = useState<'ADD' | 'SUBTRACT'>('ADD');
  const [reason, setReason] = useState<string>('Penjualan / Keluar');
  const [customReason, setCustomReason] = useState('');

  if (!isOpen || !item) return null;

  const currentStock = item.quantity;
  const effectiveDelta = mode === 'ADD' ? Math.abs(delta) : -Math.abs(delta);
  const projectedStock = Math.max(0, currentStock + effectiveDelta);

  const quickPresets = [1, 5, 10, 20, 50, 100];
  const commonReasons =
    mode === 'ADD'
      ? ['Restock dari Gudang', 'Barang Masuk', 'Retur', 'Koreksi Stok']
      : ['Penjualan / Keluar', 'Barang Rusak', 'Kadaluarsa', 'Koreksi Stok'];

  const handleApplyPreset = (val: number) => {
    soundEffects.playClickSound();
    setDelta(val);
  };

  const handleToggleMode = (newMode: 'ADD' | 'SUBTRACT') => {
    soundEffects.playClickSound();
    setMode(newMode);
    setReason(newMode === 'ADD' ? 'Restock dari Gudang' : 'Penjualan / Keluar');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (delta <= 0) return;
    const finalReason = customReason.trim() || reason;

    if (mode === 'ADD') {
      soundEffects.playStockAdd();
    } else {
      soundEffects.playStockSubtract();
    }

    onConfirm(effectiveDelta, finalReason);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 modal-backdrop animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl overflow-hidden border border-zinc-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 bg-zinc-50">
          <div className="min-w-0 pr-2">
            <span className="text-[10px] font-semibold text-zinc-400 uppercase">
              {item.category}
            </span>
            <h3 className="text-xs font-bold text-black truncate">{item.name}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:text-black hover:bg-zinc-200 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Mode Switcher (Monochrome) */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-zinc-100 rounded-xl">
            <button
              type="button"
              onClick={() => handleToggleMode('ADD')}
              className={`py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all touch-press ${
                mode === 'ADD'
                  ? 'bg-black text-white'
                  : 'text-zinc-600 hover:text-black'
              }`}
            >
              <Plus size={14} /> Tambah Stok
            </button>
            <button
              type="button"
              onClick={() => handleToggleMode('SUBTRACT')}
              className={`py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all touch-press ${
                mode === 'SUBTRACT'
                  ? 'bg-black text-white'
                  : 'text-zinc-600 hover:text-black'
              }`}
            >
              <Minus size={14} /> Kurang Stok
            </button>
          </div>

          {/* Current vs New Projection Card */}
          <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-zinc-400 block">Stok Saat Ini</span>
              <span className="text-sm font-bold text-zinc-700">
                {currentStock} <span className="text-xs font-normal">{item.unit}</span>
              </span>
            </div>
            <ArrowRight size={16} className="text-zinc-400" />
            <div className="text-right">
              <span className="text-[10px] text-zinc-400 block">Stok Baru</span>
              <span className="text-base font-extrabold text-black font-mono">
                {projectedStock} <span className="text-xs font-normal font-sans">{item.unit}</span>
              </span>
            </div>
          </div>

          {/* Stepper Amount Input */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleApplyPreset(Math.max(1, delta - 1))}
                className="w-10 h-10 rounded-xl bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-black font-bold touch-press"
              >
                <Minus size={16} />
              </button>
              <input
                type="number"
                min="1"
                value={delta}
                onChange={(e) => setDelta(Math.max(1, parseInt(e.target.value) || 1))}
                className="flex-1 text-center font-bold text-base py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-black font-mono"
              />
              <button
                type="button"
                onClick={() => handleApplyPreset(delta + 1)}
                className="w-10 h-10 rounded-xl bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-black font-bold touch-press"
              >
                <Plus size={16} />
              </button>
            </div>

            {/* Quick Chips Presets */}
            <div className="flex flex-wrap gap-1 pt-1">
              {quickPresets.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleApplyPreset(val)}
                  className={`px-2 py-0.5 text-xs font-bold rounded-lg border transition-all ${
                    delta === val
                      ? 'bg-black text-white border-black'
                      : 'bg-white text-zinc-600 border-zinc-200 hover:border-black'
                  }`}
                >
                  +{val}
                </button>
              ))}
            </div>
          </div>

          {/* Reason Section */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-500 block uppercase">
              Alasan:
            </label>
            <div className="grid grid-cols-2 gap-1">
              {commonReasons.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    soundEffects.playClickSound();
                    setReason(r);
                    setCustomReason('');
                  }}
                  className={`px-2 py-1.5 text-[11px] font-medium rounded-lg border text-left truncate transition-all ${
                    reason === r && !customReason
                      ? 'bg-black text-white border-black font-bold'
                      : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:border-black'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
            <input
              type="text"
              placeholder="Atau ketik keterangan lain..."
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              className="w-full mt-1 px-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:border-black"
            />
          </div>

          {/* Confirm Button */}
          <button
            type="submit"
            className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-black hover:bg-zinc-800 flex items-center justify-center gap-1.5 shadow-xs transition-all touch-press"
          >
            <Check size={14} /> Simpan ({mode === 'ADD' ? `+${delta}` : `-${delta}`})
          </button>
        </form>
      </div>
    </div>
  );
};
