import React from 'react';
import {
  X,
  Layers,
  ShoppingBag,
  Shirt,
  Armchair,
  Package,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import type { FloorId } from '../types/stock';
import { StockStorageEngine } from '../services/db';
import { soundEffects } from '../utils/audio';
import { useRegisterModal } from '../utils/modalManager';

interface FloorSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFloor: (floorId: FloorId) => void;
}

const FLOOR_ICONS: Record<FloorId, typeof ShoppingBag> = {
  '1': ShoppingBag,
  '2': Shirt,
  '3': Armchair,
  '4': Package,
};

export const FloorSummaryModal: React.FC<FloorSummaryModalProps> = ({
  isOpen,
  onClose,
  onSelectFloor,
}) => {
  useRegisterModal('FloorSummaryModal', isOpen, onClose);
  const stats = StockStorageEngine.getAggregateStats();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 modal-backdrop animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-zinc-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-zinc-100 bg-zinc-50/90 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-black text-white flex items-center justify-center shadow-xs">
              <Layers size={16} />
            </div>
            <div>
              <h3 className="text-xs font-bold text-black leading-none">
                Ringkasan Inventaris Lantai
              </h3>
              <p className="text-[10px] text-zinc-500 font-medium mt-0.5">
                Rincian fisik & macam barang di Lantai 1 s/d 4
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              soundEffects.playClickSound();
              onClose();
            }}
            className="w-7 h-7 flex items-center justify-center rounded-full text-zinc-400 hover:text-black hover:bg-zinc-200 transition-colors touch-press"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-3.5 overflow-y-auto space-y-2.5 flex-1">
          {stats.floorSummaries.map((f) => {
            const FloorIcon = FLOOR_ICONS[f.floorId] || Package;

            return (
              <div
                key={f.floorId}
                onClick={() => {
                  soundEffects.playClickSound();
                  onClose();
                  onSelectFloor(f.floorId);
                }}
                className="p-3.5 rounded-2xl bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 hover:border-black cursor-pointer transition-all flex items-center justify-between touch-press shadow-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center shrink-0">
                    <FloorIcon size={18} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-black">{f.name}</h4>
                    <span className="text-[10px] text-zinc-400 block">
                      {f.subtitle}
                    </span>

                    <div className="flex items-center gap-2 mt-1 text-[11px] text-zinc-600">
                      <span className="font-bold text-black font-mono">
                        {f.stockQty} unit
                      </span>
                      <span>•</span>
                      <span>{f.itemCount} macam</span>
                      {f.lowStock > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-amber-600 font-bold flex items-center gap-0.5">
                            <AlertCircle size={10} /> {f.lowStock} menipis
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-bold text-zinc-500 bg-white px-2 py-1 rounded-lg border border-zinc-200">
                    Buka
                  </span>
                  <ChevronRight size={16} className="text-zinc-400" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3 bg-zinc-50 border-t border-zinc-100 flex justify-end shrink-0">
          <button
            onClick={() => {
              soundEffects.playClickSound();
              onClose();
            }}
            className="px-4 py-2 bg-black hover:bg-zinc-800 text-white rounded-xl text-xs font-bold touch-press shadow-xs"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
