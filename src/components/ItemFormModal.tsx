import React, { useState, useEffect } from 'react';
import {
  X,
  Camera,
  Trash2,
  Check,
  Sparkles,
  ChevronDown,
  SlidersHorizontal,
} from 'lucide-react';
import type { StockItem } from '../types/stock';
import { BarcodeScannerModal } from './BarcodeScannerModal';
import { soundEffects } from '../utils/audio';
import { useRegisterModal } from '../utils/modalManager';

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
  useRegisterModal('ItemFormModal', isOpen, onClose);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [barcode, setBarcode] = useState('');
  
  // String-based inputs for free typing & backspacing
  const [quantityText, setQuantityText] = useState('0');
  const [minStockText, setMinStockText] = useState('0');
  const [maxStockText, setMaxStockText] = useState('');
  const [unit, setUnit] = useState('Pcs');
  const [locationDetails, setLocationDetails] = useState('');
  const [notes, setNotes] = useState('');

  const [isScannerOpen, setIsScannerOpen] = useState(false);

  useEffect(() => {
    if (itemToEdit) {
      setName(itemToEdit.name || '');
      setCategory(itemToEdit.category || categories[0] || 'Umum');
      setCustomCategory('');
      setBarcode(itemToEdit.barcode || '');
      setQuantityText(String(itemToEdit.quantity ?? 0));
      setMinStockText(String(itemToEdit.minStock ?? 0));
      setMaxStockText(itemToEdit.maxStock ? String(itemToEdit.maxStock) : '');
      setUnit(itemToEdit.unit || 'Pcs');
      setLocationDetails(itemToEdit.locationDetails || '');
      setNotes(itemToEdit.notes || '');
    } else {
      setName('');
      setCategory(categories[0] || 'Umum');
      setCustomCategory('');
      setBarcode('');
      setQuantityText('0');
      setMinStockText('0');
      setMaxStockText('');
      setUnit('Pcs');
      setLocationDetails('');
      setNotes('');
    }
  }, [itemToEdit, categories, isOpen]);

  if (!isOpen) return null;

  const quickUnits = ['Pcs', 'Pack', 'Box', 'Karton', 'Unit', 'Roll', 'Pasang', 'Lusin'];
  const stockPresets = [0, 1, 5, 10, 12, 24, 50, 100];
  const maxPresets = [
    { label: 'Unlimited', value: '' },
    { label: '50', value: '50' },
    { label: '100', value: '100' },
    { label: '250', value: '250' },
    { label: '500', value: '500' },
  ];

  const handleGenerateSKU = () => {
    soundEffects.playClickSound();
    const autoSku = 'SKU-' + Math.floor(100000 + Math.random() * 900000);
    setBarcode(autoSku);
  };

  const handleNumberInput = (setter: (val: string) => void, val: string) => {
    const cleaned = val.replace(/\D/g, '');
    setter(cleaned);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const finalCategory = customCategory.trim() || category || 'Umum';
    const parsedQty = parseInt(quantityText, 10);
    const validQty = isNaN(parsedQty) ? 0 : Math.max(0, parsedQty);

    const parsedMin = parseInt(minStockText, 10);
    const validMin = isNaN(parsedMin) ? 0 : Math.max(0, parsedMin);

    const parsedMax = parseInt(maxStockText, 10);
    const validMax = !isNaN(parsedMax) && parsedMax > 0 ? parsedMax : undefined;

    onSave(
      {
        name: name.trim(),
        category: finalCategory,
        barcode: barcode.trim(),
        quantity: validQty,
        minStock: validMin,
        maxStock: validMax,
        unit: unit.trim() || 'Pcs',
        locationDetails: locationDetails.trim(),
        notes: notes.trim(),
      },
      itemToEdit?.id
    );

    if (!itemToEdit) {
      soundEffects.playItemCreated();
    } else {
      soundEffects.playClickSound();
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 modal-backdrop animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl overflow-hidden border border-zinc-200 my-auto flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-100 bg-zinc-50 shrink-0">
          <div>
            <h3 className="text-xs font-bold text-black">
              {itemToEdit ? 'Edit Data Produk' : 'Tambah Produk Baru'}
            </h3>
            <p className="text-[10px] text-zinc-500 font-medium mt-0.5">
              Lengkapi informasi barang dan stok awal
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:text-black hover:bg-zinc-200 transition-colors touch-press"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-4 space-y-3.5 overflow-y-auto flex-1">
          {/* 1. Nama Barang */}
          <div>
            <label className="text-[11px] font-bold text-zinc-800 block mb-1">
              Nama Produk / Barang <span className="text-zinc-400 font-normal">*wajib</span>:
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="Contoh: Tisu Paseo 250s"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-black font-bold"
            />
          </div>

          {/* 2. Stok Awal Produk (Highlight Box) */}
          <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-black uppercase tracking-wider">
                Stok Awal Produk
              </span>
              <span className="text-[10px] text-zinc-500 font-medium font-mono">
                Satuan: {unit}
              </span>
            </div>

            <div>
              <label className="text-[10px] font-semibold text-zinc-600 block mb-1">
                Jumlah Stok Fisik Awal:
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="0"
                value={quantityText}
                onFocus={(e) => e.target.select()}
                onChange={(e) => handleNumberInput(setQuantityText, e.target.value)}
                className="w-full px-3 py-2 text-center text-base font-extrabold bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-black font-mono"
              />
            </div>

            {/* Quick Presets for Initial Stock */}
            <div>
              <span className="text-[9px] text-zinc-400 block mb-1">Pilih cepat stok awal:</span>
              <div className="flex flex-wrap gap-1">
                {stockPresets.map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => {
                      soundEffects.playClickSound();
                      setQuantityText(String(val));
                    }}
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-lg border transition-all touch-press ${
                      quantityText === String(val)
                        ? 'bg-black text-white border-black'
                        : 'bg-white text-zinc-700 border-zinc-200 hover:border-black'
                    }`}
                  >
                    {val === 0 ? '0 (Kosong)' : val === 12 ? '12 (Lusin)' : val === 24 ? '24 (Dus)' : val}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 3. Batas Min & Batas Max (Disediakan di bawah Stok Awal - Opsional) */}
          <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-zinc-800 flex items-center gap-1">
                <SlidersHorizontal size={12} className="text-black" /> Batas Stok (Opsional)
              </span>
              <span className="text-[9px] font-semibold text-zinc-400">
                Min: 0 • Max: Unlimited
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-semibold text-zinc-600 block mb-1">
                  Batas Min (Peringatan):
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="0 (Default)"
                  value={minStockText === '0' ? '' : minStockText}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => handleNumberInput(setMinStockText, e.target.value)}
                  className="w-full px-2 py-1.5 text-center text-xs font-bold bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-black font-mono"
                />
                <span className="text-[9px] text-zinc-400 block mt-0.5 text-center">
                  {minStockText && minStockText !== '0' ? `Peringatan ≤ ${minStockText}` : 'Tanpa peringatan (0)'}
                </span>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-zinc-600 block mb-1">
                  Batas Max (Kapasitas):
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="Unlimited"
                  value={maxStockText}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => handleNumberInput(setMaxStockText, e.target.value)}
                  className="w-full px-2 py-1.5 text-center text-xs font-bold bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-black font-mono"
                />
                <span className="text-[9px] text-zinc-400 block mt-0.5 text-center">
                  {maxStockText ? `Kapasitas: ${maxStockText}` : 'Tidak terbatas (Unlimited)'}
                </span>
              </div>
            </div>

            {/* Quick chips for Max Stock */}
            <div className="pt-0.5 flex flex-wrap gap-1 items-center">
              <span className="text-[9px] text-zinc-400 mr-0.5">Preset Max:</span>
              {maxPresets.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => {
                    soundEffects.playClickSound();
                    setMaxStockText(p.value);
                  }}
                  className={`px-2 py-0.5 text-[9px] font-bold rounded-lg border transition-all touch-press ${
                    maxStockText === p.value
                      ? 'bg-black text-white border-black'
                      : 'bg-white text-zinc-600 border-zinc-200 hover:border-black'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Kategori (Jenis Barang) */}
          <div>
            <label className="text-[11px] font-bold text-zinc-800 block mb-1">
              Jenis / Kategori:
            </label>

            {/* Dropdown for All Categories */}
            <div className="relative mb-1.5">
              <select
                value={customCategory ? '__NEW__' : category}
                onChange={(e) => {
                  soundEffects.playClickSound();
                  if (e.target.value === '__NEW__') {
                    setCustomCategory('');
                  } else {
                    setCategory(e.target.value);
                    setCustomCategory('');
                  }
                }}
                className="w-full pl-3 pr-8 py-2 text-xs font-bold bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-black appearance-none"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
                <option value="__NEW__">+ Tambah Jenis Baru...</option>
              </select>
              <ChevronDown size={14} className="absolute right-3 top-2.5 text-zinc-400 pointer-events-none" />
            </div>

            {/* Quick Chips for Top Categories */}
            <div className="flex flex-wrap gap-1 mb-1.5">
              {categories.slice(0, 5).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    soundEffects.playClickSound();
                    setCategory(cat);
                    setCustomCategory('');
                  }}
                  className={`px-2.5 py-1 rounded-lg border text-xs font-bold transition-all touch-press ${
                    category === cat && !customCategory
                      ? 'bg-black text-white border-black shadow-xs'
                      : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:border-black'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <input
              type="text"
              placeholder="Atau ketik jenis baru di sini..."
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-black font-medium"
            />
          </div>

          {/* 5. Satuan Produk */}
          <div>
            <label className="text-[11px] font-bold text-zinc-800 block mb-1">
              Satuan:
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
                  className={`px-2 py-0.5 text-xs font-bold rounded-lg border transition-all touch-press ${
                    unit === u
                      ? 'bg-black text-white border-black'
                      : 'bg-white text-zinc-600 border-zinc-200 hover:border-black'
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>

          {/* 6. Barcode / SKU */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold text-zinc-800">
                Barcode / SKU (Opsional):
              </label>
              <button
                type="button"
                onClick={handleGenerateSKU}
                className="text-[10px] text-zinc-500 hover:text-black font-semibold flex items-center gap-0.5"
              >
                <Sparkles size={11} /> Buat SKU
              </button>
            </div>

            <div className="flex gap-1.5">
              <input
                type="text"
                placeholder="Nomor barcode produk..."
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                className="flex-1 px-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-black font-mono font-bold"
              />
              <button
                type="button"
                onClick={() => setIsScannerOpen(true)}
                className="px-2.5 py-1.5 bg-black text-white rounded-xl text-xs font-bold flex items-center gap-1 touch-press shrink-0"
                title="Scan dengan Kamera"
              >
                <Camera size={13} /> Scan
              </button>
            </div>
          </div>

          {/* 7. Lokasi Rak (Opsional) */}
          <div>
            <label className="text-[10px] font-semibold text-zinc-600 block mb-1">
              Lokasi / Posisi Rak (Opsional):
            </label>
            <input
              type="text"
              placeholder="Contoh: Rak A-2"
              value={locationDetails}
              onChange={(e) => setLocationDetails(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-black"
            />
          </div>

          {/* Submit Action */}
          <div className="pt-2 border-t border-zinc-100 flex items-center justify-between gap-2">
            {itemToEdit && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  soundEffects.playClickSound();
                  if (
                    confirm(
                      `⚠️ HAPUS PRODUK:\n\nApakah Anda yakin ingin menghapus "${itemToEdit.name}" dari database?\n\nSisa stok: ${itemToEdit.quantity} ${itemToEdit.unit}.\nTindakan ini tidak dapat dibatalkan.`
                    )
                  ) {
                    onDelete(itemToEdit.id);
                    onClose();
                  }
                }}
                className="p-2 text-zinc-400 hover:text-black hover:bg-zinc-100 rounded-xl transition-colors touch-press"
                title="Hapus Produk"
              >
                <Trash2 size={16} />
              </button>
            ) : (
              <div />
            )}

            <button
              type="submit"
              className="px-5 py-2.5 bg-black hover:bg-zinc-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 touch-press shadow-xs ml-auto"
            >
              <Check size={14} /> {itemToEdit ? 'Simpan Perubahan' : 'Simpan Produk Baru'}
            </button>
          </div>
        </form>
      </div>

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={(scanned) => {
          setIsScannerOpen(false);
          setBarcode(scanned);
          soundEffects.playScanBeep();
        }}
      />
    </div>
  );
};
