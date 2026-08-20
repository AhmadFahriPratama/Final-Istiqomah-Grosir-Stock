import React, { useState, useEffect } from 'react';
import {
  X,
  Camera,
  Trash2,
  Check,
  ChevronRight,
  ChevronLeft,
  Barcode,
  Sparkles,
} from 'lucide-react';
import type { StockItem } from '../types/stock';
import { BarcodeScannerModal } from './BarcodeScannerModal';
import { soundEffects } from '../utils/audio';
import confetti from 'canvas-confetti';

interface ItemFormModalProps {
  isOpen: boolean;
  itemToEdit?: StockItem | null;
  categories: string[];
  onClose: () => void;
  onSave: (
    itemData: Omit<StockItem, 'id' | 'createdAt' | 'updatedAt'>,
    editId?: string
  ) => void;
  onDelete?: (itemId: string) => void;
}

export const ItemFormModal: React.FC<ItemFormModalProps> = ({
  isOpen,
  itemToEdit,
  categories,
  onClose,
  onSave,
  onDelete,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);

  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [barcode, setBarcode] = useState('');
  const [quantity, setQuantity] = useState<number>(0);
  const [minStock, setMinStock] = useState<number>(5);
  const [unit, setUnit] = useState('Pcs');
  const [locationDetails, setLocationDetails] = useState('');
  const [notes, setNotes] = useState('');

  const [isScannerOpen, setIsScannerOpen] = useState(false);

  useEffect(() => {
    if (itemToEdit) {
      setName(itemToEdit.name || '');
      setCategory(itemToEdit.category || categories[0] || 'Umum');
      setBarcode(itemToEdit.barcode || '');
      setQuantity(itemToEdit.quantity ?? 0);
      setMinStock(itemToEdit.minStock ?? 5);
      setUnit(itemToEdit.unit || 'Pcs');
      setLocationDetails(itemToEdit.locationDetails || '');
      setNotes(itemToEdit.notes || '');
      setCurrentStep(3);
    } else {
      setName('');
      setCategory(categories[0] || 'Umum');
      setCustomCategory('');
      setBarcode('');
      setQuantity(1);
      setMinStock(5);
      setUnit('Pcs');
      setLocationDetails('');
      setNotes('');
      setCurrentStep(1);
    }
  }, [itemToEdit, categories, isOpen]);

  if (!isOpen) return null;

  const quickUnits = ['Pcs', 'Pack', 'Box', 'Karton', 'Unit', 'Roll', 'Pasang', 'Lusin'];

  const handleNext = () => {
    soundEffects.playClickSound();
    if (currentStep === 2 && customCategory.trim()) {
      setCategory(customCategory.trim());
    }
    setCurrentStep((prev) => Math.min(prev + 1, 4));
  };

  const handlePrev = () => {
    soundEffects.playClickSound();
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleGenerateSKU = () => {
    soundEffects.playClickSound();
    const autoSku = 'SKU-' + Math.floor(100000 + Math.random() * 900000);
    setBarcode(autoSku);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setCurrentStep(3);
      return;
    }

    const finalCategory = customCategory.trim() || category || 'Umum';

    onSave(
      {
        name: name.trim(),
        category: finalCategory,
        barcode: barcode.trim(),
        quantity: Math.max(0, quantity),
        minStock: Math.max(0, minStock),
        unit: unit.trim() || 'Pcs',
        locationDetails: locationDetails.trim(),
        notes: notes.trim(),
      },
      itemToEdit?.id
    );

    if (!itemToEdit) {
      soundEffects.playItemCreated();
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
    } else {
      soundEffects.playClickSound();
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 modal-backdrop animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl overflow-hidden border border-zinc-200 my-auto flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-100 bg-zinc-50">
          <div>
            <span className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
              {itemToEdit ? 'Edit Data Barang' : `Langkah ${currentStep} dari 4`}
            </span>
            <h3 className="text-xs font-bold text-black">
              {itemToEdit
                ? itemToEdit.name
                : currentStep === 1
                ? 'Scan atau Masukkan Barcode'
                : currentStep === 2
                ? 'Pilih Jenis Barang'
                : currentStep === 3
                ? 'Nama & Satuan'
                : 'Stok Fisik Awal & Lokasi'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:text-black hover:bg-zinc-200 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Minimal Progress Indicator */}
        {!itemToEdit && (
          <div className="grid grid-cols-4 gap-1 px-5 pt-2">
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={`h-1 rounded-full transition-all ${
                  step <= currentStep ? 'bg-black' : 'bg-zinc-200'
                }`}
              />
            ))}
          </div>
        )}

        {/* Wizard Form Body */}
        <form onSubmit={handleSave} className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* STEP 1: Barcode / SKU */}
          {currentStep === 1 && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              <div className="text-center py-2">
                <div className="w-12 h-12 rounded-2xl bg-zinc-100 text-black flex items-center justify-center mx-auto mb-2">
                  <Barcode size={24} />
                </div>
                <h4 className="text-xs font-bold text-black">Scan Barcode Produk</h4>
                <p className="text-[11px] text-zinc-400 max-w-xs mx-auto mt-0.5">
                  Gunakan kamera HP atau ketik nomor SKU produk secara manual.
                </p>
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setIsScannerOpen(true)}
                  className="w-full py-2.5 bg-black hover:bg-zinc-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 touch-press"
                >
                  <Camera size={15} /> Buka Scanner Kamera
                </button>

                <div className="relative">
                  <input
                    type="text"
                    placeholder="Atau ketik nomor Barcode / SKU..."
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-black font-mono text-center font-bold"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleGenerateSKU}
                  className="w-full py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-zinc-200 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1 touch-press"
                >
                  <Sparkles size={12} /> Buat SKU Otomatis
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Category */}
          {currentStep === 2 && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-zinc-600 block">
                  Pilih Jenis (Kategori):
                </span>
                <span className="text-[10px] text-zinc-400">Ketuk untuk memilih</span>
              </div>

              <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-0.5">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      soundEffects.playClickSound();
                      setCategory(cat);
                      setCustomCategory('');
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all touch-press ${
                      category === cat && !customCategory
                        ? 'bg-black text-white border-black'
                        : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:border-black'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="pt-1">
                <label className="text-[10px] font-semibold text-zinc-500 block mb-1">
                  Atau Buat Jenis Baru:
                </label>
                <input
                  type="text"
                  placeholder="Ketik jenis baru..."
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-black"
                />
              </div>
            </div>
          )}

          {/* STEP 3: Nama Barang & Satuan */}
          {currentStep === 3 && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <div>
                <label className="text-[11px] font-bold text-zinc-700 block mb-1">
                  Nama Barang / Produk:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Tisu Basah Antiseptic 50s"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-black font-bold"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-zinc-700 block mb-1">
                  Satuan Barang:
                </label>
                <div className="flex flex-wrap gap-1 mb-1.5">
                  {quickUnits.map((u) => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => {
                        soundEffects.playClickSound();
                        setUnit(u);
                      }}
                      className={`px-2 py-1 text-xs font-bold rounded-lg border transition-all ${
                        unit === u
                          ? 'bg-black text-white border-black'
                          : 'bg-white text-zinc-600 border-zinc-200 hover:border-black'
                      }`}
                    >
                      {u}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Atau ketik satuan custom..."
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-black"
                />
              </div>

              {itemToEdit && (
                <div>
                  <label className="text-[10px] font-semibold text-zinc-500 block mb-1">
                    Nomor Barcode / SKU:
                  </label>
                  <input
                    type="text"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-xl font-mono"
                  />
                </div>
              )}
            </div>
          )}

          {/* STEP 4: Stok Fisik Awal & Lokasi */}
          {currentStep === 4 && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-zinc-700 block mb-1">
                    Stok Fisik Saat Ini:
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-3 py-2 text-base text-center bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-black font-bold font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-zinc-700 block mb-1">
                    Batas Peringatan Min:
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={minStock}
                    onChange={(e) => setMinStock(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-3 py-2 text-base text-center bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-black font-bold font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-zinc-600 block mb-1">
                  Lokasi Rak / Posisi Barang (Opsional):
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Rak A1 Tingkat 2"
                  value={locationDetails}
                  onChange={(e) => setLocationDetails(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-zinc-600 block mb-1">
                  Catatan Tambahan (Opsional):
                </label>
                <input
                  type="text"
                  placeholder="Keterangan singkat..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-black"
                />
              </div>
            </div>
          )}

          {/* Stepper Navigation Buttons */}
          <div className="pt-2 border-t border-zinc-100 flex items-center justify-between gap-2">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handlePrev}
                className="px-3 py-2 bg-zinc-100 hover:bg-zinc-200 text-black rounded-xl text-xs font-bold flex items-center gap-1 touch-press"
              >
                <ChevronLeft size={14} /> Kembali
              </button>
            ) : (
              <div />
            )}

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-4 py-2 bg-black hover:bg-zinc-800 text-white rounded-xl text-xs font-bold flex items-center gap-1 touch-press"
              >
                Lanjut <ChevronRight size={14} />
              </button>
            ) : (
              <button
                type="submit"
                className="px-5 py-2 bg-black hover:bg-zinc-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 touch-press shadow-xs"
              >
                <Check size={14} /> {itemToEdit ? 'Simpan Perubahan' : 'Simpan Produk'}
              </button>
            )}
          </div>

          {/* Delete button when editing */}
          {itemToEdit && onDelete && (
            <div className="pt-1 text-center">
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Hapus ${itemToEdit.name} dari database?`)) {
                    onDelete(itemToEdit.id);
                    onClose();
                  }
                }}
                className="text-[11px] text-zinc-400 hover:text-black font-semibold flex items-center justify-center gap-1 mx-auto"
              >
                <Trash2 size={12} /> Hapus Barang Ini
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Barcode Scanner Modal for Step 1 */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={(scanned) => {
          setIsScannerOpen(false);
          setBarcode(scanned);
          soundEffects.playScanBeep();
          setCurrentStep(2);
        }}
      />
    </div>
  );
};
