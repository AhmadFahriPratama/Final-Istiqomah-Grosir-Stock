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

  const quickPresets = [1, 5, 10, 12, 24, 50];
  const commonReasons =
    mode === 'ADD'
      ? ['Restock Supplier', 'Barang Masuk', 'Retur Pelanggan', 'Koreksi Stok']
      : ['Penjualan Kasir', 'Barang Rusak', 'Hilang / Selisih', 'Koreksi Stok'];

  const handleInputChange = (val: string) => {
    const cleaned = val.replace(/\D/g, '');
    setInputText(cleaned);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop anim-fade-in">
      <div className="bg-white rounded-2xl max-w-sm w-full shadow-xl overflow-hidden border border-stone-200 anim-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-stone-100">
          <div className="min-w-0 pr-2">
            <span className="text-[11px] text-stone-400 block">{item.category}</span>
            <h3 className="text-sm font-semibold text-stone-900 truncate">{item.name}</h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Mode Switcher */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-stone-100 rounded-xl">
            <button
              type="button"
              onClick={() => handleToggleMode('ADD')}
              className={`py-2.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors touch-press ${
                mode === 'ADD'
                  ? 'bg-white text-stone-900 shadow-sm'
                  : 'text-stone-500'
              }`}
            >
              <Plus size={14} /> Masuk
            </button>
            <button
              type="button"
              onClick={() => handleToggleMode('SUBTRACT')}
              className={`py-2.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors touch-press ${
                mode === 'SUBTRACT'
                  ? 'bg-white text-stone-900 shadow-sm'
                  : 'text-stone-500'
              }`}
            >
              <Minus size={14} /> Keluar
            </button>
          </div>

          {/* Stock Before → Delta → After */}
          <div className="flex items-center justify-between py-2 text-center">
            <div>
              <span className="text-[11px] text-stone-400 block">Sekarang</span>
              <span className="text-sm font-semibold text-stone-600 font-mono">
                {currentStock}
              </span>
            </div>
            <div className="px-3">
              <span className={`text-xs font-bold font-mono px-2.5 py-1 rounded-lg ${
                mode === 'ADD' ? 'bg-stone-900 text-white' : 'bg-stone-200 text-stone-700'
              }`}>
                {mode === 'ADD' ? `+${validAmount}` : `-${validAmount}`}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-stone-400 block">Setelah</span>
              <span className="text-base font-bold text-stone-900 font-mono">
                {projectedStock}
              </span>
            </div>
          </div>

          {/* Number Input */}
          <div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleQuickIncrement(-1)}
                className="w-10 h-10 rounded-xl bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-700 touch-press shrink-0"
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
                className="flex-1 text-center font-bold text-xl py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-stone-400 font-mono"
              />

              <button
                type="button"
                onClick={() => handleQuickIncrement(1)}
                className="w-10 h-10 rounded-xl bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-700 touch-press shrink-0"
              >
                <Plus size={16} />
              </button>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-1 mt-2">
              {quickPresets.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => {
                    soundEffects.playClickSound();
                    setInputText(String(val));
                  }}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-lg border transition-colors touch-press ${
                    validAmount === val
                      ? 'bg-stone-900 text-white border-stone-900'
                      : 'bg-white text-stone-600 border-stone-200'
                  }`}
                >
                  {mode === 'ADD' ? `+${val}` : `-${val}`}
                </button>
              ))}
            </div>
          </div>

          {/* Reason */}
          <div>
            <span className="text-xs font-semibold text-stone-500 block mb-1.5">
              Alasan
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {commonReasons.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    soundEffects.playClickSound();
                    setReason(r);
                    setCustomReason('');
                  }}
                  className={`px-2.5 py-2 text-[11px] rounded-lg border text-left truncate transition-colors touch-press ${
                    reason === r && !customReason
                      ? 'bg-stone-900 text-white border-stone-900 font-semibold'
                      : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            <input
              type="text"
              placeholder="Alasan lain..."
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-stone-400 mt-1.5"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={validAmount <= 0}
            className="w-full py-3 bg-stone-900 hover:bg-stone-800 disabled:opacity-30 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 touch-press"
          >
            <Check size={14} /> Konfirmasi ({validAmount} {item.unit})
          </button>
        </form>
      </div>
    </div>
  );
};
