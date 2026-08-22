import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, Check } from 'lucide-react';
import type { StockItem } from '../types/stock';
import { soundEffects } from '../utils/audio';
import { useRegisterModal } from '../utils/modalManager';

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
  useRegisterModal('StockAdjustModal', isOpen, onClose);
  // Input as string to allow seamless backspacing, deleting, and typing
  const [inputText, setInputText] = useState<string>('1');
  const [mode, setMode] = useState<'ADD' | 'SUBTRACT'>('ADD');
  const [reason, setReason] = useState<string>('Restock Supplier');
  const [customReason, setCustomReason] = useState('');

  useEffect(() => {
    if (isOpen) {
      setInputText('1');
      setMode('ADD');
      setReason('Restock Supplier');
      setCustomReason('');
    }
  }, [isOpen]);

  if (!isOpen || !item) return null;

  const currentStock = item.quantity;
  const parsedAmount = parseInt(inputText, 10);
  const validAmount = isNaN(parsedAmount) || parsedAmount <= 0 ? 0 : parsedAmount;
  const effectiveDelta = mode === 'ADD' ? validAmount : -validAmount;
  const projectedStock = Math.max(0, currentStock + effectiveDelta);

  const quickPresets = [1, 5, 10, 12, 24, 50, 100];
  const commonReasons =
    mode === 'ADD'
      ? ['Restock Supplier', 'Barang Masuk', 'Retur Pelanggan', 'Koreksi Stok Opname']
      : ['Penjualan Kasir', 'Barang Rusak / Cacat', 'Hilang / Selisih', 'Koreksi Stok Opname'];

  const handleInputChange = (val: string) => {
    // Only allow numeric digits
    const cleaned = val.replace(/\D/g, '');
    setInputText(cleaned);
  };

  const handleApplyPreset = (val: number) => {
    soundEffects.playClickSound();
    setInputText(String(val));
  };

  const handleQuickIncrement = (step: number) => {
    soundEffects.playClickSound();
    const current = parseInt(inputText, 10) || 0;
    const next = Math.max(1, current + step);
    setInputText(String(next));
  };

  const handleToggleMode = (newMode: 'ADD' | 'SUBTRACT') => {
    soundEffects.playClickSound();
    setMode(newMode);
    setReason(newMode === 'ADD' ? 'Restock Supplier' : 'Penjualan Kasir');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validAmount <= 0) return;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 modal-backdrop animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl overflow-hidden border border-zinc-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-100 bg-zinc-50">
          <div className="min-w-0 pr-2">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
              {item.category}
            </span>
            <h3 className="text-xs font-bold text-black truncate">{item.name}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:text-black hover:bg-zinc-200 transition-colors touch-press"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3.5">
          {/* Mode Tabs */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-zinc-100 rounded-xl">
            <button
              type="button"
              onClick={() => handleToggleMode('ADD')}
              className={`py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all touch-press ${
                mode === 'ADD'
                  ? 'bg-black text-white shadow-xs'
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
                  ? 'bg-black text-white shadow-xs'
                  : 'text-zinc-600 hover:text-black'
              }`}
            >
              <Minus size={14} /> Kurang Stok
            </button>
          </div>

          {/* Stock Projection Comparison */}
          <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-3 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-medium text-zinc-400 block">Stok Awal</span>
              <span className="text-sm font-bold text-zinc-700 font-mono">
                {currentStock} <span className="text-xs font-normal font-sans text-zinc-500">{item.unit}</span>
              </span>
            </div>

            <div className="text-center px-2">
              <span className={`text-[11px] font-bold font-mono px-2 py-0.5 rounded-md ${
                mode === 'ADD' ? 'bg-black text-white' : 'bg-zinc-200 text-zinc-900'
              }`}>
                {mode === 'ADD' ? `+${validAmount}` : `-${validAmount}`}
              </span>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-medium text-zinc-400 block">Stok Akhir</span>
              <span className="text-base font-extrabold text-black font-mono">
                {projectedStock} <span className="text-xs font-normal font-sans text-zinc-500">{item.unit}</span>
              </span>
            </div>
          </div>

          {/* Numeric Input & Stepper Controls */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
              Jumlah ({item.unit}):
            </label>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickIncrement(-1)}
                className="w-10 h-10 rounded-xl bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-black font-bold touch-press shrink-0"
              >
                <Minus size={16} />
              </button>

              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="0"
                value={inputText}
                onFocus={(e) => e.target.select()}
                onChange={(e) => handleInputChange(e.target.value)}
                className="flex-1 text-center font-bold text-lg py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-black font-mono"
              />

              <button
                type="button"
                onClick={() => handleQuickIncrement(1)}
                className="w-10 h-10 rounded-xl bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-black font-bold touch-press shrink-0"
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
                  className={`px-2 py-1 text-[11px] font-bold rounded-lg border transition-all touch-press ${
                    validAmount === val
                      ? 'bg-black text-white border-black'
                      : 'bg-white text-zinc-700 border-zinc-200 hover:border-black'
                  }`}
                >
                  {mode === 'ADD' ? `+${val}` : `-${val}`}
                  {val === 12 ? ' (Lusin)' : val === 24 ? ' (Dus)' : ''}
                </button>
              ))}

              <button
                type="button"
                onClick={() => {
                  soundEffects.playClickSound();
                  setInputText('');
                }}
                className="px-2 py-1 text-[11px] font-bold rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-500 hover:text-black touch-press"
              >
                Hapus
              </button>
            </div>
          </div>

          {/* Reason Section */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
              Keterangan:
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
                  className={`px-2 py-1.5 text-[11px] font-medium rounded-lg border text-left truncate transition-all touch-press ${
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
              placeholder="Atau ketik alasan lain..."
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:border-black"
            />
          </div>

          {/* Confirm Button */}
          <button
            type="submit"
            disabled={validAmount <= 0}
            className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-black hover:bg-zinc-800 disabled:opacity-40 flex items-center justify-center gap-1.5 shadow-xs transition-all touch-press"
          >
            <Check size={14} /> Simpan ({mode === 'ADD' ? `+${validAmount}` : `-${validAmount}`} {item.unit})
          </button>
        </form>
      </div>
    </div>
  );
};
