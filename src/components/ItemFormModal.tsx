import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Trash2,
  Check,
  Sparkles,
  ChevronDown,
  SlidersHorizontal,
  ArrowRight,
  ArrowLeft,
  Layers,
  MapPin,
  FileText,
  CheckCircle2,
  AlertCircle,
  Tag,
  Boxes,
  Package,
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

  // Active step (1: Info, 2: Stok & Batas, 3: Barcode & Lokasi)
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [nameError, setNameError] = useState(false);

  // Form Fields
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
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setNameError(false);
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
    }
  }, [itemToEdit, categories, isOpen]);

  useEffect(() => {
    if (isOpen && step === 1) {
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 80);
    }
  }, [isOpen, step]);

  if (!isOpen) return null;

  const quickUnits = [
    'Pcs',
    'Pack',
    'Box',
    'Dus',
    'Karton',
    'Unit',
    'Roll',
    'Pasang',
    'Lusin',
    'Botol',
    'Ikat',
  ];

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

  const goToNextStep = () => {
    if (step === 1) {
      if (!name.trim()) {
        setNameError(true);
        soundEffects.playClickSound();
        nameInputRef.current?.focus();
        return;
      }
      setNameError(false);
      soundEffects.playClickSound();
      setStep(2);
    } else if (step === 2) {
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
      setStep(1);
      setNameError(true);
      nameInputRef.current?.focus();
      return;
    }

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 modal-backdrop animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-zinc-200 my-auto flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-100 bg-zinc-50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-black text-white flex items-center justify-center shrink-0 shadow-xs">
              <Package size={16} />
            </div>
            <div>
              <h3 className="text-xs font-bold text-black leading-tight">
                {itemToEdit ? 'Edit Produk' : 'Tambah Produk Baru'}
              </h3>
              <p className="text-[10px] text-zinc-400 font-medium mt-0.5">
                Langkah {step}/3: {step === 1 ? 'Identitas' : step === 2 ? 'Stok & Batas' : 'Lokasi & SKU'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:text-black hover:bg-zinc-200 transition-colors touch-press"
          >
            <X size={16} />
          </button>
        </div>

        {/* Stepper Tabs */}
        <div className="grid grid-cols-3 px-3 py-2 bg-zinc-100 border-b border-zinc-200 text-center gap-1.5 shrink-0 select-none">
          {/* Step 1 Tab */}
          <button
            type="button"
            onClick={() => {
              soundEffects.playClickSound();
              setStep(1);
            }}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all ${
              step === 1
                ? 'bg-white text-black shadow-xs border border-zinc-200'
                : 'text-zinc-500 hover:text-black hover:bg-zinc-200/60'
            }`}
          >
            <span
              className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-extrabold ${
                step === 1
                  ? 'bg-black text-white'
                  : name.trim()
                  ? 'bg-emerald-600 text-white'
                  : 'bg-zinc-300 text-zinc-700'
              }`}
            >
              {name.trim() && step !== 1 ? <Check size={10} strokeWidth={3} /> : '1'}
            </span>
            <span className="truncate">1. Info</span>
          </button>

          {/* Step 2 Tab */}
          <button
            type="button"
            onClick={() => {
              if (!name.trim()) {
                setNameError(true);
                nameInputRef.current?.focus();
                return;
              }
              soundEffects.playClickSound();
              setStep(2);
            }}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all ${
              step === 2
                ? 'bg-white text-black shadow-xs border border-zinc-200'
                : 'text-zinc-500 hover:text-black hover:bg-zinc-200/60'
            }`}
          >
            <span
              className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-extrabold ${
                step === 2
                  ? 'bg-black text-white'
                  : step > 2
                  ? 'bg-emerald-600 text-white'
                  : 'bg-zinc-300 text-zinc-700'
              }`}
            >
              {step > 2 ? <Check size={10} strokeWidth={3} /> : '2'}
            </span>
            <span className="truncate">2. Stok</span>
          </button>

          {/* Step 3 Tab */}
          <button
            type="button"
            onClick={() => {
              if (!name.trim()) {
                setNameError(true);
                nameInputRef.current?.focus();
                return;
              }
              soundEffects.playClickSound();
              setStep(3);
            }}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all ${
              step === 3
                ? 'bg-white text-black shadow-xs border border-zinc-200'
                : 'text-zinc-500 hover:text-black hover:bg-zinc-200/60'
            }`}
          >
            <span
              className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-extrabold ${
                step === 3 ? 'bg-black text-white' : 'bg-zinc-300 text-zinc-700'
              }`}
            >
              3
            </span>
            <span className="truncate">3. Lokasi & SKU</span>
          </button>
        </div>

        {/* Form Body with Multi-Step Views */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (step < 3) {
              goToNextStep();
            } else {
              handleSave();
            }
          }}
          className="p-4 space-y-4 overflow-y-auto flex-1 text-left"
        >
          {/* STEP 1: INFO & SATUAN */}
          {step === 1 && (
            <div className="space-y-3.5 animate-in fade-in slide-in-from-right-2 duration-150">
              {/* Nama Produk */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-zinc-800 flex items-center gap-1">
                    <Tag size={13} className="text-black" /> Nama Produk{' '}
                    <span className="text-red-500 font-bold">*</span>:
                  </label>
                  {nameError && (
                    <span className="text-[10px] text-red-500 font-bold flex items-center gap-0.5 animate-pulse">
                      <AlertCircle size={10} /> Wajib diisi!
                    </span>
                  )}
                </div>
                <input
                  ref={nameInputRef}
                  type="text"
                  required
                  placeholder="Contoh: Tisu Paseo 250s, Sabun Lifebuoy, dll."
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
                  className={`w-full px-3.5 py-2.5 text-xs bg-zinc-50 border rounded-xl focus:outline-none font-bold transition-all ${
                    nameError
                      ? 'border-red-400 ring-2 ring-red-100 bg-red-50/30'
                      : 'border-zinc-200 focus:border-black focus:bg-white'
                  }`}
                />
              </div>

              {/* Kategori */}
              <div>
                <label className="text-[11px] font-bold text-zinc-800 flex items-center gap-1 mb-1">
                  <Layers size={13} className="text-black" /> Kategori Barang:
                </label>

                {/* Dropdown Kategori */}
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
                    <option value="__NEW__">+ Buat Kategori Baru...</option>
                  </select>
                  <ChevronDown
                    size={14}
                    className="absolute right-3 top-2.5 text-zinc-400 pointer-events-none"
                  />
                </div>

                {/* Quick Chips */}
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
                      className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-all touch-press ${
                        category === cat && !customCategory
                          ? 'bg-black text-white border-black shadow-xs'
                          : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:border-black'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Custom Category */}
                <input
                  type="text"
                  placeholder="Ketik kategori baru..."
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-black font-medium"
                />
              </div>

              {/* Satuan Produk */}
              <div>
                <label className="text-[11px] font-bold text-zinc-800 flex items-center gap-1 mb-1">
                  <Boxes size={13} className="text-black" /> Satuan:{' '}
                  <span className="text-zinc-400 font-mono font-normal">({unit})</span>
                </label>
                <div className="flex flex-wrap gap-1">
                  {quickUnits.map((u) => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => {
                        soundEffects.playClickSound();
                        setUnit(u);
                      }}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all touch-press ${
                        unit === u
                          ? 'bg-black text-white border-black shadow-xs'
                          : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:border-black'
                      }`}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: STOK & BATAS */}
          {step === 2 && (
            <div className="space-y-3.5 animate-in fade-in slide-in-from-right-2 duration-150">
              {/* Highlight Card: Stok Fisik Awal */}
              <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-3.5 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-black uppercase tracking-wider flex items-center gap-1">
                    <Package size={13} className="text-black" /> Stok Fisik Awal
                  </span>
                  <span className="text-[10px] text-zinc-600 bg-zinc-200/70 px-2 py-0.5 rounded-full font-bold">
                    Satuan: {unit}
                  </span>
                </div>

                <div>
                  <div className="relative">
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
                          goToNextStep();
                        }
                      }}
                      className="w-full px-4 py-2.5 text-center text-2xl font-black bg-white border border-zinc-300 rounded-xl focus:outline-none focus:border-black font-mono shadow-inner"
                    />
                    <span className="absolute right-3.5 top-3.5 text-xs font-bold text-zinc-400 pointer-events-none">
                      {unit}
                    </span>
                  </div>
                </div>

                {/* Quick Presets */}
                <div>
                  <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block mb-1">
                    Pilihan Cepat:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {stockPresets.map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => {
                          soundEffects.playClickSound();
                          setQuantityText(String(val));
                        }}
                        className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border transition-all touch-press ${
                          quantityText === String(val)
                            ? 'bg-black text-white border-black shadow-xs'
                            : 'bg-white text-zinc-700 border-zinc-200 hover:border-black'
                        }`}
                      >
                        {val === 0 ? '0 (Kosong)' : val === 12 ? '12 (Lusin)' : val === 24 ? '24 (Dus)' : val}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Batas Minimum & Maksimum */}
              <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-zinc-800 flex items-center gap-1">
                    <SlidersHorizontal size={13} className="text-black" /> Batas Stok (Opsional)
                  </span>
                  <span className="text-[9px] font-semibold text-zinc-400">
                    Peringatan & Kapasitas
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
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
                      className="w-full px-2.5 py-1.5 text-center text-xs font-bold bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-black font-mono"
                    />
                    <span className="text-[9px] text-zinc-400 block mt-0.5 text-center">
                      {minStockText && minStockText !== '0'
                        ? `Peringatan ≤ ${minStockText}`
                        : 'Tanpa batas (0)'}
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
                      className="w-full px-2.5 py-1.5 text-center text-xs font-bold bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-black font-mono"
                    />
                    <span className="text-[9px] text-zinc-400 block mt-0.5 text-center">
                      {maxStockText ? `Maksimal: ${maxStockText}` : 'Tidak terbatas'}
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
            </div>
          )}

          {/* STEP 3: SKU & LOKASI */}
          {step === 3 && (
            <div className="space-y-3.5 animate-in fade-in slide-in-from-right-2 duration-150">
              {/* Barcode / SKU */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-zinc-800 flex items-center gap-1">
                    <Sparkles size={13} className="text-black" /> Barcode / SKU (Opsional):
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateSKU}
                    className="text-[10px] text-zinc-600 hover:text-black font-bold flex items-center gap-0.5 bg-zinc-100 hover:bg-zinc-200 px-2 py-0.5 rounded-lg transition-colors"
                  >
                    <Sparkles size={10} /> Buat SKU
                  </button>
                </div>

                <div className="flex gap-1.5">
                  <input
                    type="text"
                    placeholder="Nomor barcode / scan..."
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-black font-mono font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => setIsScannerOpen(true)}
                    className="px-3 py-2 bg-black hover:bg-zinc-800 text-white rounded-xl text-xs font-bold flex items-center gap-1 touch-press shrink-0 shadow-xs"
                    title="Scan Barcode"
                  >
                    <ScannerGlyph size={14} /> Scan
                  </button>
                </div>
              </div>

              {/* Lokasi / Rak */}
              <div>
                <label className="text-[11px] font-bold text-zinc-800 flex items-center gap-1 mb-1">
                  <MapPin size={13} className="text-black" /> Lokasi / Rak (Opsional):
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Rak A-02, Etalase Depan, Lorong 3"
                  value={locationDetails}
                  onChange={(e) => setLocationDetails(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-black font-medium"
                />
              </div>

              {/* Catatan */}
              <div>
                <label className="text-[11px] font-bold text-zinc-800 flex items-center gap-1 mb-1">
                  <FileText size={13} className="text-black" /> Catatan (Opsional):
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Expire 2027, Supplier CV Berkah"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-black text-zinc-700"
                />
              </div>

              {/* Ringkasan Kartu Produk */}
              <div className="bg-zinc-950 text-white rounded-2xl p-3.5 space-y-2 shadow-md">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
                    <CheckCircle2 size={12} className="text-emerald-400" /> Ringkasan Produk
                  </span>
                  <span className="text-[10px] font-mono bg-zinc-800 px-2 py-0.5 rounded-md text-emerald-400 font-bold">
                    Siap Simpan
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[9px] text-zinc-400 block">Nama:</span>
                    <p className="font-bold text-white truncate">{name || '-'}</p>
                  </div>
                  <div>
                    <span className="text-[9px] text-zinc-400 block">Kategori & Satuan:</span>
                    <p className="font-semibold text-zinc-200 truncate">
                      {customCategory.trim() || category} • {unit}
                    </p>
                  </div>
                  <div>
                    <span className="text-[9px] text-zinc-400 block">Stok Awal:</span>
                    <p className="font-bold text-emerald-300 font-mono">
                      {quantityText || '0'} {unit}
                    </p>
                  </div>
                  <div>
                    <span className="text-[9px] text-zinc-400 block">SKU / Lokasi:</span>
                    <p className="font-medium text-zinc-300 truncate font-mono text-[11px]">
                      {barcode || 'Tanpa SKU'} {locationDetails ? `• ${locationDetails}` : ''}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-3 border-t border-zinc-100 flex items-center justify-between gap-2 shrink-0">
            {step === 1 && (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2 text-xs font-bold text-zinc-600 hover:text-black hover:bg-zinc-100 rounded-xl transition-colors touch-press"
                >
                  Batal
                </button>

                <button
                  type="button"
                  onClick={goToNextStep}
                  className="px-5 py-2.5 bg-black hover:bg-zinc-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 touch-press shadow-xs ml-auto"
                >
                  Lanjut ke Stok <ArrowRight size={14} />
                </button>
              </>
            )}

            {step === 2 && (
              <>
                <button
                  type="button"
                  onClick={goToPrevStep}
                  className="px-3.5 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-100 rounded-xl flex items-center gap-1 transition-colors touch-press"
                >
                  <ArrowLeft size={14} /> Kembali
                </button>

                <div className="flex items-center gap-1.5 ml-auto">
                  <button
                    type="button"
                    onClick={() => handleSave()}
                    className="px-3 py-2 text-xs font-bold text-zinc-700 hover:text-black hover:bg-zinc-100 rounded-xl border border-zinc-200 transition-colors touch-press"
                  >
                    ⚡ Simpan Cepat
                  </button>

                  <button
                    type="button"
                    onClick={goToNextStep}
                    className="px-4 py-2 bg-black hover:bg-zinc-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 touch-press shadow-xs"
                  >
                    Lanjut <ArrowRight size={14} />
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
                    className="px-3.5 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-100 rounded-xl flex items-center gap-1 transition-colors touch-press"
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
                            `⚠️ HAPUS PRODUK:\n\nApakah Anda yakin ingin menghapus "${itemToEdit.name}" dari database?\n\nSisa stok: ${itemToEdit.quantity} ${itemToEdit.unit}.\nTindakan ini tidak dapat dibatalkan.`
                          )
                        ) {
                          onDelete(itemToEdit.id);
                          onClose();
                        }
                      }}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors touch-press"
                      title="Hapus Produk"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  className="px-5 py-2.5 bg-black hover:bg-zinc-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 touch-press shadow-md ml-auto"
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
