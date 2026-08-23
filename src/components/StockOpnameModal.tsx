import React, { useState, useMemo } from 'react';
import {
  X,
  ClipboardCheck,
  Search,
  Plus,
  Minus,
  Save,
  RotateCcw,
} from 'lucide-react';
import type { FloorId, StockOpnameEntry } from '../types/stock';
import { FLOOR_DEFINITIONS } from '../types/stock';
import { StockStorageEngine } from '../services/db';
import { soundEffects } from '../utils/audio';
import { useRegisterModal } from '../utils/modalManager';
import { ScannerGlyph } from './CustomIcons';
import { BarcodeScannerModal } from './BarcodeScannerModal';

interface StockOpnameModalProps {
  isOpen: boolean;
  floorId: FloorId;
  onClose: () => void;
  onOpnameComplete?: () => void;
}

export const StockOpnameModal: React.FC<StockOpnameModalProps> = ({
  isOpen,
  floorId,
  onClose,
  onOpnameComplete,
}) => {
  useRegisterModal('StockOpnameModal', isOpen, onClose);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterVarianceOnly, setFilterVarianceOnly] = useState<boolean>(false);
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [opnameNote, setOpnameNote] = useState<string>('');
  const [physicalCounts, setPhysicalCounts] = useState<Record<string, number>>({});
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const floorData = useMemo(() => {
    return StockStorageEngine.getFloorData(floorId);
  }, [floorId, isOpen]);

  // Initialize physical counts with system stock if not set yet
  const entries: StockOpnameEntry[] = useMemo(() => {
    return floorData.items.map((it) => {
      const physical = physicalCounts[it.id] !== undefined ? physicalCounts[it.id] : it.quantity;
      const variance = physical - it.quantity;
      return {
        itemId: it.id,
        name: it.name,
        category: it.category,
        barcode: it.barcode,
        systemStock: it.quantity,
        physicalStock: physical,
        variance,
        unit: it.unit,
        location: it.locationDetails,
      };
    });
  }, [floorData, physicalCounts]);

  const filteredEntries = useMemo(() => {
    return entries.filter((e) => {
      if (filterVarianceOnly && e.variance === 0) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        e.name.toLowerCase().includes(q) ||
        (e.barcode && e.barcode.toLowerCase().includes(q)) ||
        (e.category && e.category.toLowerCase().includes(q)) ||
        (e.location && e.location.toLowerCase().includes(q))
      );
    });
  }, [entries, filterVarianceOnly, searchQuery]);

  const summary = useMemo(() => {
    let exactCount = 0;
    let deficitCount = 0; // kurang
    let surplusCount = 0; // lebih
    let totalAdjustedItems = 0;

    entries.forEach((e) => {
      if (e.variance === 0) exactCount++;
      else if (e.variance < 0) {
        deficitCount++;
        totalAdjustedItems++;
      } else {
        surplusCount++;
        totalAdjustedItems++;
      }
    });

    return { exactCount, deficitCount, surplusCount, totalAdjustedItems, totalItems: entries.length };
  }, [entries]);

  if (!isOpen) return null;

  const handleUpdatePhysical = (itemId: string, newQty: number) => {
    const safeQty = Math.max(0, newQty);
    setPhysicalCounts((prev) => ({
      ...prev,
      [itemId]: safeQty,
    }));
  };

  const handleBarcodeScanned = (scannedCode: string) => {
    const matched = floorData.items.find(
      (i) => i.barcode && i.barcode.trim().toLowerCase() === scannedCode.trim().toLowerCase()
    );

    if (matched) {
      soundEffects.playScanBeep();
      const currentVal = physicalCounts[matched.id] !== undefined ? physicalCounts[matched.id] : matched.quantity;
      handleUpdatePhysical(matched.id, currentVal + 1);
      setSearchQuery(matched.name);
    } else {
      soundEffects.playClickSound();
      alert(`Barang dengan barcode ${scannedCode} tidak ditemukan di ${FLOOR_DEFINITIONS[floorId]?.name}`);
    }
  };

  const handleResetAllToSystem = () => {
    soundEffects.playClickSound();
    if (confirm('Reset seluruh hitungan fisik ke stok sistem saat ini?')) {
      setPhysicalCounts({});
    }
  };

  const handleSaveOpname = () => {
    soundEffects.playClickSound();
    if (summary.totalAdjustedItems === 0) {
      alert('Tidak ada selisih stok yang perlu disesuaikan.');
      return;
    }

    if (
      !confirm(
        `Terapkan hasil opname untuk ${summary.totalAdjustedItems} barang yang berselisih ke database sistem?`
      )
    ) {
      return;
    }

    setIsSaving(true);
    const records = Object.entries(physicalCounts).map(([itemId, physicalStock]) => ({
      itemId,
      physicalStock,
    }));

    const result = StockStorageEngine.applyStockOpname(floorId, records, opnameNote.trim());
    if (result.success) {
      soundEffects.playUnlockSound();
      setSuccessToast(`Berhasil merekonsiliasi ${result.adjustedCount} barang.`);
      setTimeout(() => {
        onOpnameComplete?.();
        onClose();
      }, 1200);
    }
    setIsSaving(false);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 modal-backdrop anim-fade-in overflow-hidden">
        <div className="bg-[#f5eedc] rounded-3xl max-w-4xl w-full shadow-2xl border-2 border-[#2a1a10] overflow-hidden flex flex-col h-[94vh] anim-slide-up text-left">
          {/* Header Toolbar */}
          <div className="flex items-center justify-between px-5 py-3.5 bg-[#faf5e8] border-b border-[#ded2b8] shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#2a1a10] text-[#faf5e8] flex items-center justify-center shadow-xs">
                <ClipboardCheck size={17} />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-[#2a1a10] leading-tight">
                  Mode Stok Opname — {FLOOR_DEFINITIONS[floorId]?.name}
                </h3>
                <p className="text-[11px] text-[#78604d]">
                  Audit fisik cepat, scan barcode, dan rekonsiliasi selisih
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsScannerOpen(true)}
                className="px-3 py-1.5 bg-[#2a1a10] hover:bg-[#3d2618] text-[#faf5e8] rounded-xl text-xs font-bold flex items-center gap-1.5 touch-press shadow-xs"
                title="Scan barcode untuk tambah hitungan fisik"
              >
                <ScannerGlyph size={14} /> Scan Count
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full text-[#78604d] hover:text-[#2a1a10] hover:bg-[#f0e7d2] transition-colors"
              >
                <X size={17} />
              </button>
            </div>
          </div>

          {/* Search, Filter & Summary Bar */}
          <div className="p-3 bg-[#faf5e8]/80 border-b border-[#ded2b8] flex flex-wrap items-center justify-between gap-3 shrink-0 text-xs">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search size={13} className="absolute left-3 top-2.5 text-[#9e8b74]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari barang atau barcode..."
                className="w-full pl-8 pr-7 py-1.5 text-xs bg-white border border-[#ded2b8] rounded-xl focus:border-[#2a1a10] focus:outline-none text-[#2a1a10]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1.5 text-[#9e8b74] hover:text-[#2a1a10]"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filter Variance Toggle */}
            <label className="flex items-center gap-1.5 cursor-pointer font-bold text-[#78604d]">
              <input
                type="checkbox"
                checked={filterVarianceOnly}
                onChange={(e) => setFilterVarianceOnly(e.target.checked)}
                className="rounded accent-[#8a4f25]"
              />
              <span>Tampilkan Selisih Saja ({summary.totalAdjustedItems})</span>
            </label>

            {/* Variance Statistics Badges */}
            <div className="flex items-center gap-2 font-mono text-[11px]">
              <span className="px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                ✓ Sesuai: {summary.exactCount}
              </span>
              {summary.deficitCount > 0 && (
                <span className="px-2 py-0.5 rounded-lg bg-red-100 text-red-800 font-bold border border-red-200">
                  - Kurang: {summary.deficitCount}
                </span>
              )}
              {summary.surplusCount > 0 && (
                <span className="px-2 py-0.5 rounded-lg bg-amber-100 text-amber-800 font-bold border border-amber-200">
                  + Lebih: {summary.surplusCount}
                </span>
              )}
            </div>

            {/* Reset Button */}
            <button
              type="button"
              onClick={handleResetAllToSystem}
              className="p-1.5 text-[#78604d] hover:text-[#2a1a10] hover:bg-[#f0e7d2] rounded-lg transition-colors"
              title="Reset hitungan fisik ke stok sistem"
            >
              <RotateCcw size={14} />
            </button>
          </div>

          {/* Opname Table Viewport */}
          <div className="flex-1 overflow-auto p-3 sm:p-4">
            <div className="bg-[#faf5e8] rounded-2xl border border-[#ded2b8] overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#ebe0c8] text-[#2a1a10] border-b border-[#ded2b8] text-[11px] font-bold">
                    <th className="py-2.5 px-3 w-8 text-center">No</th>
                    <th className="py-2.5 px-3">Nama Produk & Barcode</th>
                    <th className="py-2.5 px-3 w-28 text-center">Stok Sistem</th>
                    <th className="py-2.5 px-3 w-40 text-center">Hitungan Fisik</th>
                    <th className="py-2.5 px-3 w-28 text-center">Selisih</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ded2b8] text-xs font-medium">
                  {filteredEntries.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-[#9e8b74] italic">
                        Tidak ada data barang yang sesuai filter.
                      </td>
                    </tr>
                  ) : (
                    filteredEntries.map((e, idx) => (
                      <tr
                        key={e.itemId}
                        className={`transition-colors ${
                          e.variance < 0
                            ? 'bg-red-50/50 hover:bg-red-50'
                            : e.variance > 0
                            ? 'bg-amber-50/50 hover:bg-amber-50'
                            : 'hover:bg-[#f0e7d2]/40'
                        }`}
                      >
                        <td className="py-2.5 px-3 text-center font-mono text-[11px] text-[#78604d]">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="font-bold text-[#2a1a10] block">{e.name}</span>
                          <span className="text-[10px] text-[#78604d]">
                            {e.category} {e.barcode ? `• ${e.barcode}` : ''}{' '}
                            {e.location ? `• Rak ${e.location}` : ''}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-sm text-[#78604d]">
                          {e.systemStock} {e.unit}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleUpdatePhysical(e.itemId, e.physicalStock - 1)}
                              className="w-7 h-7 rounded-lg bg-white border border-[#ded2b8] text-[#2a1a10] flex items-center justify-center hover:bg-[#f0e7d2] touch-press shrink-0"
                            >
                              <Minus size={12} />
                            </button>
                            <input
                              type="number"
                              min={0}
                              value={e.physicalStock}
                              onChange={(evt) =>
                                handleUpdatePhysical(e.itemId, Number(evt.target.value) || 0)
                              }
                              className="w-16 py-1 text-center font-mono font-black text-sm bg-white border border-[#ded2b8] rounded-lg focus:border-[#2a1a10] focus:outline-none text-[#2a1a10]"
                            />
                            <button
                              type="button"
                              onClick={() => handleUpdatePhysical(e.itemId, e.physicalStock + 1)}
                              className="w-7 h-7 rounded-lg bg-white border border-[#ded2b8] text-[#2a1a10] flex items-center justify-center hover:bg-[#f0e7d2] touch-press shrink-0"
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {e.variance === 0 ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              0 Pas
                            </span>
                          ) : e.variance < 0 ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">
                              {e.variance} Kurang
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                              +{e.variance} Lebih
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer Action Bar */}
          <div className="px-5 py-3.5 bg-[#faf5e8] border-t border-[#ded2b8] shrink-0 flex flex-wrap items-center justify-between gap-3">
            <div className="flex-1 max-w-sm">
              <input
                type="text"
                value={opnameNote}
                onChange={(e) => setOpnameNote(e.target.value)}
                placeholder="Catatan opname (misal: Audit Rutin Akhir Bulan)..."
                className="w-full px-3 py-1.5 text-xs bg-white border border-[#ded2b8] rounded-xl focus:border-[#2a1a10] focus:outline-none text-[#2a1a10]"
              />
            </div>

            {successToast && (
              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
                {successToast}
              </span>
            )}

            <button
              type="button"
              disabled={isSaving || summary.totalAdjustedItems === 0}
              onClick={handleSaveOpname}
              className="px-5 py-2.5 bg-[#2a1a10] hover:bg-[#3d2618] disabled:opacity-40 text-[#faf5e8] rounded-xl text-xs font-bold flex items-center gap-1.5 touch-press shadow-xs"
            >
              <Save size={14} />
              <span>
                Terapkan Hasil Opname ({summary.totalAdjustedItems} Selisih)
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Barcode Scanner Modal for Opname */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={(code: string) => {
          handleBarcodeScanned(code);
        }}
      />
    </>
  );
};
