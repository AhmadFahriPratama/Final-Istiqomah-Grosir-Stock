import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  Trash2,
  Check,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Search,
  Plus,
  Tag,
  Layers,
} from 'lucide-react';
import type { StockItem } from '../types/stock';
import { BarcodeScannerModal } from './BarcodeScannerModal';
import { soundEffects } from '../utils/audio';
import { useRegisterModal } from '../utils/modalManager';
import { ScannerGlyph } from './CustomIcons';

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

  // NEW ORDER: Step 1 = Barcode (Optional), Step 2 = Info Produk, Step 3 = Stok & Batas
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [nameError, setNameError] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [barcode, setBarcode] = useState('');
  
  // String-based inputs for free typing & backspacing
  const [quantityText, setQuantityText] = useState('0');
  const [minStockText, setMinStockText] = useState('0');
  const [maxStockText, setMaxStockText] = useState('');
  const [unit, setUnit] = useState('Pcs');
  const [locationDetails, setLocationDetails] = useState('');
  const [notes, setNotes] = useState('');

  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Filtered categories based on search query
  const filteredCategories = useMemo(() => {
    const query = categorySearchQuery.trim().toLowerCase();
    if (!query) return categories;
    return categories.filter((cat) => cat.toLowerCase().includes(query));
  }, [categories, categorySearchQuery]);

  // Check if search query matches any existing category exactly
  const isExactCategoryMatch = useMemo(() => {
    const query = categorySearchQuery.trim().toLowerCase();
    if (!query) return true;
    return categories.some((c) => c.toLowerCase() === query);
  }, [categories, categorySearchQuery]);

  useEffect(() => {
    if (isOpen) {
      setStep(itemToEdit ? 2 : 1); // If editing, skip barcode step directly to Info
      setNameError(false);
      setCategorySearchQuery('');
      if (itemToEdit) {
        setName(itemToEdit.name || '');
        setSelectedCategory(itemToEdit.category || categories[0] || 'Umum');
        setBarcode(itemToEdit.barcode || '');
        setQuantityText(String(itemToEdit.quantity ?? 0));
        setMinStockText(String(itemToEdit.minStock ?? 0));
        setMaxStockText(itemToEdit.maxStock ? String(itemToEdit.maxStock) : '');
        setUnit(itemToEdit.unit || 'Pcs');
        setLocationDetails(itemToEdit.locationDetails || '');
        setNotes(itemToEdit.notes || '');
      } else {
        setName('');
        setSelectedCategory(categories[0] || 'Umum');
        setBarcode('');
        setQuantityText('0');
        setMinStockText('0');
        setMaxStockText('');
        setUnit('Pcs');
        setLocationDetails('');
        setNotes('');
      }
    }
  }, [itemToEdit, categories, isOpen]);

  useEffect(() => {
    if (isOpen && step === 2) {
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 80);
    }
  }, [isOpen, step]);

  if (!isOpen) return null;

  const quickUnits = ['Pcs', 'Pack', 'Box', 'Dus', 'Karton', 'Unit', 'Roll', 'Pasang', 'Lusin', 'Botol', 'Ikat'];

  const handleGenerateSKU = () => {
    soundEffects.playClickSound();
    const autoSku = 'SKU-' + Math.floor(100000 + Math.random() * 900000);
    setBarcode(autoSku);
  };

  const handleNumberInput = (setter: (val: string) => void, val: string) => {
    const cleaned = val.replace(/\D/g, '');
    setter(cleaned);
  };

  const handleSelectCategory = (cat: string) => {
    soundEffects.playClickSound();
    setSelectedCategory(cat);
    setCategorySearchQuery('');
  };

  const handleCreateNewCategory = () => {
    const clean = categorySearchQuery.trim();
    if (!clean) return;
    soundEffects.playClickSound();
    setSelectedCategory(clean);
    setCategorySearchQuery('');
  };

  const stepLabels = ['Scan Barcode', 'Info Produk', 'Stok & Batas'];

  const goToNextStep = () => {
    if (step === 1) {
      soundEffects.playClickSound();
      setStep(2);
    } else if (step === 2) {
      if (!name.trim()) {
        setNameError(true);
        soundEffects.playClickSound();
        nameInputRef.current?.focus();
        return;
      }
      setNameError(false);
      soundEffects.playClickSound();
      setStep(3);
    }
  };

  const goToPrevStep = () => {
    soundEffects.playClickSound();
    if (step === 3) setStep(2);
    else if (step === 2) setStep(1);
  };

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!name.trim()) {
      setStep(2);
      setNameError(true);
      nameInputRef.current?.focus();
      return;
    }

    const finalCategory = selectedCategory.trim() || 'Umum';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 modal-backdrop anim-fade-in overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-stone-200 my-auto flex flex-col max-h-[92vh] anim-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 bg-stone-50/80 shrink-0">
          <div>
            <h3 className="text-sm font-bold text-stone-900 leading-tight">
              {itemToEdit ? 'Edit Produk' : 'Tambah Produk Baru'}
            </h3>
            <p className="text-xs text-stone-400 mt-0.5">
              Langkah {step}/3 — {stepLabels[step - 1]}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors touch-press"
          >
            <X size={16} />
          </button>
        </div>

        {/* Step Progress Bar */}
        <div className="flex px-5 pt-3 pb-1 gap-1.5 shrink-0 bg-stone-50/50 border-b border-stone-100">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                s <= step ? 'bg-stone-900' : 'bg-stone-200'
              }`}
            />
          ))}
        </div>

        {/* Form Body */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (step < 3) {
              goToNextStep();
            } else {
              handleSave();
            }
          }}
          className="p-5 space-y-4 overflow-y-auto flex-1 text-left"
        >
          {/* STEP 1: SCAN BARCODE (Optional) */}
          {step === 1 && (
            <div className="space-y-4 py-1">
              <div className="text-center py-2">
                <div className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-600 flex items-center justify-center mx-auto mb-3">
                  <ScannerGlyph size={22} />
                </div>
                <h4 className="text-sm font-bold text-stone-900">
                  Scan Barcode Produk
                </h4>
                <p className="text-xs text-stone-400 mt-1 max-w-[260px] mx-auto">
                  Arahkan kamera ke barcode barang atau masukkan nomornya. Lewati jika tanpa barcode.
                </p>
              </div>

              {/* Scanner Action Button */}
              <button
                type="button"
                onClick={() => setIsScannerOpen(true)}
                className="w-full py-3 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 touch-press shadow-xs"
              >
                <ScannerGlyph size={16} />
                <span>Buka Kamera Scanner</span>
              </button>

              {/* Manual Barcode Input */}
              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-semibold text-stone-500 block">
                  Atau masukkan nomor barcode:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Nomor Barcode / SKU"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-stone-400 font-mono transition-colors font-semibold"
                  />
                  <button
                    type="button"
                    onClick={handleGenerateSKU}
                    className="px-3 py-2.5 text-xs font-semibold text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors touch-press shrink-0 flex items-center gap-1"
                    title="Buat SKU acak otomatis"
                  >
                    <Sparkles size={13} /> Auto SKU
                  </button>
                </div>
              </div>

              {/* Show Active Barcode Feedback */}
              {barcode && (
                <div className="bg-stone-100 rounded-xl p-3 flex items-center justify-between anim-fade-in">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-xs font-mono font-bold text-stone-900">
                      {barcode}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setBarcode('')}
                    className="text-xs text-stone-400 hover:text-stone-700"
                  >
                    Hapus
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: INFO PRODUK (Nama, Jenis/Kategori, Satuan) */}
          {step === 2 && (
            <div className="space-y-4">
              {/* Nama Produk Field */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-stone-700 flex items-center gap-1">
                    Nama Produk <span className="text-red-500 font-bold">*</span>
                  </label>
                  {nameError && (
                    <span className="text-[11px] text-red-500 font-medium anim-fade-in">
                      Nama produk wajib diisi
                    </span>
                  )}
                </div>
                <input
                  ref={nameInputRef}
                  type="text"
                  required
                  placeholder="Nama Produk"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (e.target.value.trim()) setNameError(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      goToNextStep();
                    }
                  }}
                  className={`w-full px-3.5 py-2.5 text-sm bg-stone-50 border rounded-xl focus:outline-none font-semibold transition-colors ${
                    nameError
                      ? 'border-red-300 bg-red-50/30 focus:border-red-400'
                      : 'border-stone-200 focus:border-stone-400'
                  }`}
                />
              </div>

              {/* FITUR PENJENISAN (KATEGORI) UX TINGKAT TINGGI */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-stone-700 flex items-center gap-1.5">
                    <Layers size={13} className="text-stone-500" />
                    Jenis / Kategori:
                  </label>
                  <span className="text-[11px] text-stone-500 font-medium">
                    Terpilih: <strong className="text-stone-900 font-bold">{selectedCategory || 'Belum dipilih'}</strong>
                  </span>
                </div>

                {/* Integrated Category Search & Quick Create Bar */}
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-2.5 text-stone-400" />
                  <input
                    type="text"
                    placeholder="Cari atau ketik jenis baru..."
                    value={categorySearchQuery}
                    onChange={(e) => setCategorySearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-stone-400 font-medium placeholder:text-stone-400"
                  />
                  {categorySearchQuery && (
                    <button
                      type="button"
                      onClick={() => setCategorySearchQuery('')}
                      className="absolute right-2.5 top-2 text-xs text-stone-400 hover:text-stone-700"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Quick Add New Category Prompt (Shows when typed query is not in list) */}
                {categorySearchQuery.trim() && !isExactCategoryMatch && (
                  <button
                    type="button"
                    onClick={handleCreateNewCategory}
                    className="w-full p-2 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs font-semibold flex items-center justify-between touch-press anim-fade-in hover:bg-amber-100/70 transition-colors"
                  >
                    <span className="flex items-center gap-1.5 truncate">
                      <Plus size={13} className="shrink-0" />
                      Buat jenis baru: <strong className="underline font-bold">"{categorySearchQuery.trim()}"</strong>
                    </span>
                    <span className="text-[10px] bg-amber-200/80 px-2 py-0.5 rounded-md shrink-0 font-bold">
                      Gunakan Ini
                    </span>
                  </button>
                )}

                {/* Category Selection Chips Grid */}
                <div className="max-h-36 overflow-y-auto p-1 bg-stone-50 rounded-xl border border-stone-200/80 flex flex-wrap gap-1.5">
                  {filteredCategories.length === 0 && isExactCategoryMatch ? (
                    <p className="text-xs text-stone-400 p-2 text-center w-full">
                      Belum ada kategori yang cocok.
                    </p>
                  ) : (
                    filteredCategories.map((cat) => {
                      const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => handleSelectCategory(cat)}
                          className={`px-3 py-1.5 text-xs rounded-lg border transition-all touch-press flex items-center gap-1.5 shrink-0 ${
                            isSelected
                              ? 'bg-stone-900 text-white border-stone-900 font-semibold shadow-xs'
                              : 'bg-white text-stone-700 border-stone-200 hover:border-stone-400 hover:bg-stone-100'
                          }`}
                        >
                          {isSelected && <Check size={12} strokeWidth={3} />}
                          <Tag size={11} className={isSelected ? 'text-stone-300' : 'text-stone-400'} />
                          <span>{cat}</span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Satuan Produk */}
              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-semibold text-stone-700 block">
                  Satuan: <span className="font-mono text-stone-500 font-normal">({unit})</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {quickUnits.map((u) => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => {
                        soundEffects.playClickSound();
                        setUnit(u);
                      }}
                      className={`px-2.5 py-1.5 text-xs rounded-lg border transition-colors touch-press ${
                        unit === u
                          ? 'bg-stone-900 text-white border-stone-900 font-semibold'
                          : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'
                      }`}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: STOK & BATAS */}
          {step === 3 && (
            <div className="space-y-4">
              {/* Stok Awal Input */}
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1.5">
                  Stok Fisik Awal ({unit})
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="0"
                  autoFocus
                  value={quantityText}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => handleNumberInput(setQuantityText, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSave();
                    }
                  }}
                  className="w-full px-4 py-3 text-center text-2xl font-bold bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-stone-400 font-mono text-stone-900 shadow-inner"
                />
                <div className="flex gap-1.5 mt-2">
                  {[0, 1, 10, 24, 50, 100].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => {
                        soundEffects.playClickSound();
                        setQuantityText(String(val));
                      }}
                      className={`flex-1 py-1.5 text-[11px] font-semibold rounded-lg border transition-colors touch-press ${
                        quantityText === String(val)
                          ? 'bg-stone-900 text-white border-stone-900'
                          : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Batas Min & Max */}
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1.5">
                  Batas Stok <span className="text-stone-400 font-normal">(opsional)</span>
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <span className="text-[11px] text-stone-400 block mb-1">Minimum (Peringatan)</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="0"
                      value={minStockText === '0' ? '' : minStockText}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => handleNumberInput(setMinStockText, e.target.value)}
                      className="w-full px-3 py-2 text-center text-sm bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-stone-400 font-mono font-semibold"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-stone-400 block mb-1">Maksimum (Kapasitas)</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="∞"
                      value={maxStockText}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => handleNumberInput(setMaxStockText, e.target.value)}
                      className="w-full px-3 py-2 text-center text-sm bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-stone-400 font-mono font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* Lokasi Rak */}
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1.5">
                  Lokasi / Rak <span className="text-stone-400 font-normal">(opsional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Kode Rak / Lokasi"
                  value={locationDetails}
                  onChange={(e) => setLocationDetails(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-stone-400"
                />
              </div>

              {/* Catatan */}
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1.5">
                  Catatan <span className="text-stone-400 font-normal">(opsional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Catatan tambahan"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-stone-400"
                />
              </div>

              {/* Ringkasan Produk */}
              <div className="bg-stone-50 rounded-xl p-3.5 space-y-1.5 text-xs border border-stone-200">
                <div className="flex justify-between">
                  <span className="text-stone-400">Nama Produk</span>
                  <span className="font-semibold text-stone-900 truncate ml-4 text-right">{name || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Jenis / Kategori</span>
                  <span className="font-semibold text-stone-800">{selectedCategory}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Stok Awal</span>
                  <span className="font-mono font-bold text-stone-900">{quantityText || '0'} {unit}</span>
                </div>
                {barcode && (
                  <div className="flex justify-between">
                    <span className="text-stone-400">SKU / Barcode</span>
                    <span className="font-mono text-stone-600">{barcode}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2 shrink-0">
            {step === 1 && (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 text-xs font-medium text-stone-500 hover:text-stone-800 rounded-xl transition-colors"
                >
                  Batal
                </button>

                <button
                  type="button"
                  onClick={goToNextStep}
                  className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 touch-press ml-auto"
                >
                  {barcode ? 'Lanjut ke Info' : 'Lewati Barcode'} <ArrowRight size={14} />
                </button>
              </>
            )}

            {step === 2 && (
              <>
                <button
                  type="button"
                  onClick={goToPrevStep}
                  className="px-3.5 py-2.5 text-xs font-medium text-stone-500 hover:text-stone-800 rounded-xl flex items-center gap-1 transition-colors"
                >
                  <ArrowLeft size={14} /> Kembali
                </button>

                <div className="flex items-center gap-1.5 ml-auto">
                  <button
                    type="button"
                    onClick={() => handleSave()}
                    className="px-3 py-2.5 text-xs font-medium text-stone-600 hover:bg-stone-100 rounded-xl border border-stone-200 transition-colors touch-press"
                  >
                    Simpan Cepat
                  </button>

                  <button
                    type="button"
                    onClick={goToNextStep}
                    className="px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 touch-press"
                  >
                    Lanjut ke Stok <ArrowRight size={14} />
                  </button>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={goToPrevStep}
                    className="px-3.5 py-2.5 text-xs font-medium text-stone-500 hover:text-stone-800 rounded-xl flex items-center gap-1 transition-colors"
                  >
                    <ArrowLeft size={14} /> Kembali
                  </button>

                  {itemToEdit && onDelete && (
                    <button
                      type="button"
                      onClick={() => {
                        soundEffects.playClickSound();
                        if (
                          confirm(
                            `Hapus "${itemToEdit.name}"?\n\nSisa stok: ${itemToEdit.quantity} ${itemToEdit.unit}.\nTindakan ini tidak dapat dibatalkan.`
                          )
                        ) {
                          onDelete(itemToEdit.id);
                          onClose();
                        }
                      }}
                      className="p-2.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors touch-press"
                      title="Hapus Produk"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 touch-press ml-auto shadow-xs"
                >
                  <Check size={14} /> {itemToEdit ? 'Simpan Perubahan' : 'Simpan Produk Baru'}
                </button>
              </>
            )}
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
