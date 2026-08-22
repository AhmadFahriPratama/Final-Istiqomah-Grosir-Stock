import React from 'react';
import { X, Layers, ChevronRight, AlertTriangle } from 'lucide-react';
import type { FloorId } from '../types/stock';
import { StockStorageEngine } from '../services/db';
import { soundEffects } from '../utils/audio';
import { useRegisterModal } from '../utils/modalManager';
import { FloorGlyph } from './CustomIcons';

interface FloorSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFloor: (floorId: FloorId) => void;
}

export const FloorSummaryModal: React.FC<FloorSummaryModalProps> = ({
  isOpen,
  onClose,
  onSelectFloor,
}) => {
  useRegisterModal('FloorSummaryModal', isOpen, onClose);
  const stats = StockStorageEngine.getAggregateStats();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 modal-backdrop animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-zinc-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-100 bg-zinc-50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-black text-white flex items-center justify-center shadow-xs">
              <Layers size={16} />
            </div>
            <div>
              <h3 className="text-xs font-bold text-black leading-none">
                Ringkasan Lantai
              </h3>
              <p className="text-[10px] text-zinc-400 font-medium mt-0.5">
                Total {stats.totalStockQty} unit • {stats.totalItemsCount} macam
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              soundEffects.playClickSound();
              onClose();
            }}
            className="p-1.5 rounded-full text-zinc-400 hover:text-black hover:bg-zinc-200 transition-colors touch-press"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-3.5 overflow-y-auto space-y-2 flex-1">
          {stats.floorSummaries.map((f) => (
            <div
              key={f.floorId}
              onClick={() => {
                soundEffects.playClickSound();
                onClose();
                onSelectFloor(f.floorId);
              }}
              className="p-3 rounded-2xl bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 hover:border-black cursor-pointer transition-all flex items-center justify-between touch-press shadow-2xs"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center shrink-0">
                  <FloorGlyph floorId={f.floorId} size={18} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs font-bold text-black">{f.name}</h4>
                    <span className="text-[10px] text-zinc-400 font-medium">
                      ({f.subtitle})
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-0.5 text-[11px] text-zinc-600">
                    <span className="font-bold text-black font-mono">
                      {f.stockQty} unit
                    </span>
                    <span className="text-zinc-300">•</span>
                    <span>{f.itemCount} macam</span>
                    {f.lowStock > 0 && (
                      <>
                        <span className="text-zinc-300">•</span>
                        <span className="text-amber-700 bg-amber-100/80 px-1.5 py-0.2 rounded text-[10px] font-bold flex items-center gap-0.5">
                          <AlertTriangle size={9} /> {f.lowStock} tipis
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <ChevronRight size={16} className="text-zinc-400 shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
