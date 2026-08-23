import React, { useState, useMemo } from 'react';
import {
  X,
  ArrowRightLeft,
  Search,
  ArrowRight,
} from 'lucide-react';
import type { FloorId, StockItem } from '../types/stock';
import { FLOOR_DEFINITIONS } from '../types/stock';
import { StockStorageEngine } from '../services/db';
import { soundEffects } from '../utils/audio';
import { useRegisterModal } from '../utils/modalManager';
import { FloorGlyph } from './CustomIcons';

interface FloorTransferModalProps {
  isOpen: boolean;
  sourceFloorId: FloorId;
  initialItem?: StockItem | null;
  onClose: () => void;
  onTransferComplete?: () => void;
}

export const FloorTransferModal: React.FC<FloorTransferModalProps> = ({
  isOpen,
  sourceFloorId,
  initialItem,
  onClose,
  onTransferComplete,
}) => {
  useRegisterModal('FloorTransferModal', isOpen, onClose);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItemId, setSelectedItemId] = useState<string>(initialItem?.id || '');
  const [targetFloorId, setTargetFloorId] = useState<FloorId>(
    sourceFloorId === '4' ? '1' : '4'
  );
  const [transferQty, setTransferQty] = useState<number>(1);
  const [transferNote, setTransferNote] = useState<string>('');
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const floorData = useMemo(() => {
    return StockStorageEngine.getFloorData(sourceFloorId);
  }, [sourceFloorId, isOpen]);

  const availableItems = useMemo(() => {
    if (!searchQuery.trim()) return floorData.items;
    const q = searchQuery.toLowerCase();
    return floorData.items.filter(
      (it) =>
        it.name.toLowerCase().includes(q) ||
        (it.barcode && it.barcode.toLowerCase().includes(q)) ||
        (it.category && it.category.toLowerCase().includes(q))
    );
  }, [floorData, searchQuery]);

  const selectedItem = useMemo(() => {
    return floorData.items.find((i) => i.id === selectedItemId) || initialItem || null;
  }, [floorData, selectedItemId, initialItem]);

  if (!isOpen) return null;

  const targetFloorOptions: FloorId[] = (['1', '2', '3', '4'] as FloorId[]).filter(
    (f) => f !== sourceFloorId
  );

  const handleExecuteTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) {
      setStatusMsg({ type: 'error', text: 'Pilih barang yang ingin dipindahkan.' });
      return;
    }
    if (transferQty <= 0) {
      setStatusMsg({ type: 'error', text: 'Jumlah transfer minimal 1 unit.' });
      return;
    }
    if (transferQty > selectedItem.quantity) {
      setStatusMsg({
        type: 'error',
        text: `Stok tidak cukup. Stok saat ini: ${selectedItem.quantity} ${selectedItem.unit}`,
      });
      return;
    }

    const result = StockStorageEngine.transferStock(
      sourceFloorId,
      targetFloorId,
      selectedItem.id,
      transferQty,
      transferNote.trim()
    );

    if (result.success) {
      soundEffects.playUnlockSound();
      setStatusMsg({ type: 'success', text: result.message });
      setTimeout(() => {
        onTransferComplete?.();
        onClose();
      }, 1000);
    } else {
      soundEffects.playClickSound();
      setStatusMsg({ type: 'error', text: result.message });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 modal-backdrop anim-fade-in">
      <div className="bg-[#faf5e8] rounded-3xl max-w-md w-full shadow-2xl border-2 border-[#2a1a10] overflow-hidden flex flex-col max-h-[92vh] anim-slide-up text-left">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#ded2b8] shrink-0 bg-[#faf5e8]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#2a1a10] text-[#faf5e8] flex items-center justify-center shadow-xs">
              <ArrowRightLeft size={16} />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-[#2a1a10] leading-tight">
                Mutasi Antar-Lantai
              </h3>
              <p className="text-[11px] text-[#78604d]">
                Pindahkan stok dari {FLOOR_DEFINITIONS[sourceFloorId]?.name} ke lantai lain
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-[#78604d] hover:text-[#2a1a10] hover:bg-[#f0e7d2] transition-colors"
          >
            <X size={17} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleExecuteTransfer} className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Step 1: Source Item Selection */}
          <div>
            <label className="text-xs font-bold text-[#2a1a10] block mb-1.5">
              1. Pilih Barang dari {FLOOR_DEFINITIONS[sourceFloorId]?.name}
            </label>

            {selectedItem ? (
              <div className="p-3 bg-[#f0e7d2] rounded-2xl border border-[#ded2b8] flex items-center justify-between">
                <div className="min-w-0 pr-2">
                  <span className="font-extrabold text-sm text-[#2a1a10] block truncate">
                    {selectedItem.name}
                  </span>
                  <div className="flex items-center gap-2 text-[11px] text-[#78604d] mt-0.5">
                    <span>Jenis: {selectedItem.category}</span>
                    <span>•</span>
                    <span className="font-mono font-bold text-[#2a1a10]">
                      Stok: {selectedItem.quantity} {selectedItem.unit}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedItemId('')}
                  className="px-2.5 py-1 text-xs font-semibold bg-[#faf5e8] text-[#78604d] hover:text-[#2a1a10] border border-[#ded2b8] rounded-lg shrink-0 touch-press"
                >
                  Ganti
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-3 text-[#9e8b74]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari nama atau barcode barang..."
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-white border-2 border-[#ded2b8] rounded-xl focus:border-[#2a1a10] focus:outline-none font-medium text-[#2a1a10]"
                  />
                </div>

                <div className="max-h-36 overflow-y-auto rounded-xl border border-[#ded2b8] bg-white divide-y divide-[#ded2b8]">
                  {availableItems.length === 0 ? (
                    <p className="p-3 text-center text-xs text-[#9e8b74]">
                      Tidak ada barang ditemukan
                    </p>
                  ) : (
                    availableItems.map((it) => (
                      <button
                        key={it.id}
                        type="button"
                        onClick={() => {
                          soundEffects.playClickSound();
                          setSelectedItemId(it.id);
                          setTransferQty(1);
                        }}
                        className="w-full p-2.5 text-left hover:bg-[#faf5e8] flex items-center justify-between transition-colors touch-press text-xs"
                      >
                        <div className="min-w-0 pr-2">
                          <span className="font-bold text-[#2a1a10] block truncate">
                            {it.name}
                          </span>
                          <span className="text-[10px] text-[#78604d]">
                            {it.category} {it.barcode ? `• ${it.barcode}` : ''}
                          </span>
                        </div>
                        <span className="font-mono font-bold text-xs text-[#2a1a10] shrink-0">
                          {it.quantity} {it.unit}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Target Floor Selection */}
          <div>
            <label className="text-xs font-bold text-[#2a1a10] block mb-1.5">
              2. Pilih Lantai Tujuan
            </label>
            <div className="grid grid-cols-3 gap-2">
              {targetFloorOptions.map((fId) => {
                const info = FLOOR_DEFINITIONS[fId];
                const isSelected = targetFloorId === fId;
                return (
                  <button
                    key={fId}
                    type="button"
                    onClick={() => {
                      soundEffects.playClickSound();
                      setTargetFloorId(fId);
                    }}
                    className={`p-2.5 rounded-2xl border-2 text-center transition-all touch-press flex flex-col items-center justify-center gap-1 ${
                      isSelected
                        ? 'bg-[#2a1a10] text-[#faf5e8] border-[#2a1a10] shadow-sm'
                        : 'bg-white text-[#78604d] border-[#ded2b8] hover:border-[#2a1a10]'
                    }`}
                  >
                    <FloorGlyph
                      floorId={fId}
                      size={18}
                      className={isSelected ? 'text-[#faf5e8]' : 'text-[#78604d]'}
                    />
                    <span className="text-xs font-extrabold leading-tight">
                      {info.name}
                    </span>
                    <span
                      className={`text-[9px] leading-tight ${
                        isSelected ? 'text-[#ded2b8]' : 'text-[#9e8b74]'
                      }`}
                    >
                      {info.subtitle}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 3: Quantity & Fast Chips */}
          {selectedItem && (
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-[#2a1a10]">
                  3. Jumlah Unit Dipindahkan
                </label>
                <span className="text-[11px] font-mono text-[#78604d]">
                  Maksimal: <strong>{selectedItem.quantity}</strong> {selectedItem.unit}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={selectedItem.quantity}
                  value={transferQty}
                  onChange={(e) => setTransferQty(Math.max(1, Number(e.target.value) || 1))}
                  className="flex-1 px-3.5 py-2.5 text-base font-mono font-black text-center bg-white border-2 border-[#ded2b8] focus:border-[#2a1a10] rounded-xl focus:outline-none text-[#2a1a10]"
                />
                <span className="text-xs font-bold text-[#78604d] px-1">
                  {selectedItem.unit}
                </span>
              </div>

              {/* Quick Qty Chips */}
              <div className="flex items-center gap-1.5 mt-2">
                {[1, 5, 10, 20].map((q) => (
                  <button
                    key={q}
                    type="button"
                    disabled={q > selectedItem.quantity}
                    onClick={() => {
                      soundEffects.playClickSound();
                      setTransferQty(q);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white border border-[#ded2b8] text-[11px] font-bold text-[#2a1a10] hover:bg-[#f0e7d2] disabled:opacity-30 touch-press"
                  >
                    +{q}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playClickSound();
                    setTransferQty(selectedItem.quantity);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-[#2a1a10] text-[#faf5e8] text-[11px] font-bold hover:bg-[#3d2618] touch-press ml-auto"
                >
                  Semua ({selectedItem.quantity})
                </button>
              </div>
            </div>
          )}

          {/* Optional Note */}
          <div>
            <label className="text-xs font-semibold text-[#78604d] block mb-1">
              Catatan Transfer (Opsional)
            </label>
            <input
              type="text"
              value={transferNote}
              onChange={(e) => setTransferNote(e.target.value)}
              placeholder="Contoh: Restock display pagi, pesanan pembeli..."
              className="w-full px-3 py-2 text-xs bg-white border border-[#ded2b8] rounded-xl focus:border-[#2a1a10] focus:outline-none text-[#2a1a10]"
            />
          </div>

          {/* Status Message */}
          {statusMsg && (
            <div
              className={`p-3 rounded-xl text-xs font-bold ${
                statusMsg.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              {statusMsg.text}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!selectedItem || transferQty <= 0 || (selectedItem && transferQty > selectedItem.quantity)}
            className="w-full py-3.5 bg-[#2a1a10] hover:bg-[#3d2618] disabled:opacity-40 text-[#faf5e8] rounded-2xl text-xs font-extrabold flex items-center justify-center gap-2 touch-press shadow-md transition-all mt-3"
          >
            <span>Pindahkan {transferQty} Unit ke {FLOOR_DEFINITIONS[targetFloorId]?.name}</span>
            <ArrowRight size={15} />
          </button>
        </form>
      </div>
    </div>
  );
};
