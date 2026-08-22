import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Plus,
  Search,
  Layers,
  Eye,
  EyeOff,
  Share2,
  FileText,
  Clock,
  Barcode,
  Edit2,
  User,
  MapPin,
  KeyRound,
  ChevronDown,
  AlertTriangle,
  Volume2,
  VolumeX,
} from 'lucide-react';
import type { FloorId, StockItem, UserAccount } from '../types/stock';
import { FLOOR_DEFINITIONS } from '../types/stock';
import { StockStorageEngine } from '../services/db';
import { ReportService } from '../services/reports';
import { soundEffects } from '../utils/audio';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { OfflineBadge } from '../components/OfflineBadge';
import { BarcodeScannerModal } from '../components/BarcodeScannerModal';
import { StockAdjustModal } from '../components/StockAdjustModal';
import { ItemFormModal } from '../components/ItemFormModal';
import { CategoryManagerModal } from '../components/CategoryManagerModal';
import { FloorExportImportModal } from '../components/FloorExportImportModal';
import { TextReportModal } from '../components/TextReportModal';
import { ChangePasswordModal } from '../components/ChangePasswordModal';
import { FloorGlyph, ScannerGlyph } from '../components/CustomIcons';

interface FloorViewProps {
  floorId: FloorId;
  onOpenAdmin: () => void;
}

export const FloorView: React.FC<FloorViewProps> = ({ floorId }) => {
  const floorInfo = FLOOR_DEFINITIONS[floorId];

  // User & Auth State
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() =>
    StockStorageEngine.getCurrentUser()
  );
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isSoundOn, setIsSoundOn] = useState<boolean>(() => soundEffects.isSoundEnabled());

  // Data State
  const [floorData, setFloorData] = useState(() => StockStorageEngine.getFloorData(floorId));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters & Controls
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [hideOutOfStock, setHideOutOfStock] = useState<boolean>(true);
  const [filterOnlyLowStock, setFilterOnlyLowStock] = useState<boolean>(false);
  const [showRecentMutations, setShowRecentMutations] = useState<boolean>(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Modals
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [adjustingItem, setAdjustingItem] = useState<StockItem | null>(null);
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);
  const [isItemFormOpen, setIsItemFormOpen] = useState<boolean>(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState<boolean>(false);
  const [isCategoryPickerOpen, setIsCategoryPickerOpen] = useState<boolean>(false);
  const [categoryPickerSearch, setCategoryPickerSearch] = useState<string>('');
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [reportText, setReportText] = useState<string>('');

  const refreshData = useCallback(() => {
    const data = StockStorageEngine.getFloorData(floorId);
    setFloorData(data);
    setCurrentUser(StockStorageEngine.getCurrentUser());
  }, [floorId]);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      refreshData();
      setIsLoading(false);
    }, 60);

    const handleStorageEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ floorId: FloorId }>;
      if (customEvent.detail?.floorId === floorId) {
        refreshData();
      }
    };

    const handleUserChanged = (e: Event) => {
      const custom = e as CustomEvent<{ user: UserAccount | null }>;
      setCurrentUser(custom.detail?.user || null);
    };

    const handleSoundToggled = (e: Event) => {
      const custom = e as CustomEvent<{ enabled: boolean }>;
      setIsSoundOn(custom.detail?.enabled ?? true);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT'
      ) {
        return;
      }
      if (e.key === '/' || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')) {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.altKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        setIsScannerOpen(true);
      } else if (e.altKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setEditingItem(null);
        setIsItemFormOpen(true);
      }
    };

    window.addEventListener('istiqomah_stock_updated', handleStorageEvent);
    window.addEventListener('istiqomah_user_changed', handleUserChanged);
    window.addEventListener('istiqomah_sound_toggled', handleSoundToggled);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('istiqomah_stock_updated', handleStorageEvent);
      window.removeEventListener('istiqomah_user_changed', handleUserChanged);
      window.removeEventListener('istiqomah_sound_toggled', handleSoundToggled);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [floorId, refreshData]);

  const lowStockCount = useMemo(() => {
    return floorData.items.filter(
      (it) => it.quantity > 0 && it.quantity <= it.minStock && it.minStock > 0
    ).length;
  }, [floorData.items]);

  const filteredItems = useMemo(() => {
    return floorData.items.filter((item) => {
      if (selectedCategory !== 'ALL' && item.category !== selectedCategory) {
        return false;
      }
      if (filterOnlyLowStock && (item.quantity <= 0 || item.quantity > item.minStock || item.minStock === 0)) {
        return false;
      }
      if (hideOutOfStock && item.quantity <= 0 && !filterOnlyLowStock) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = item.name.toLowerCase().includes(query);
        const matchesBarcode = item.barcode?.toLowerCase().includes(query);
        const matchesLocation = item.locationDetails?.toLowerCase().includes(query);
        const matchesNotes = item.notes?.toLowerCase().includes(query);
        return matchesName || matchesBarcode || matchesLocation || matchesNotes;
      }
      return true;
    });
  }, [floorData.items, selectedCategory, hideOutOfStock, filterOnlyLowStock, searchQuery]);

  const outOfStockCount = useMemo(() => {
    return floorData.items.filter((item) => {
      if (selectedCategory !== 'ALL' && item.category !== selectedCategory) return false;
      return item.quantity <= 0;
    }).length;
  }, [floorData.items, selectedCategory]);

  const handleBarcodeScanned = (scannedCode: string) => {
    setIsScannerOpen(false);
    const found = floorData.items.find(
      (it) => it.barcode && it.barcode.trim().toLowerCase() === scannedCode.toLowerCase()
    );

    if (found) {
      soundEffects.playScanBeep();
      setAdjustingItem(found);
    } else {
      soundEffects.playClickSound();
      setSearchQuery(scannedCode);
    }
  };

  const handleStockAdjustConfirm = (delta: number, reason: string) => {
    if (adjustingItem) {
      StockStorageEngine.adjustStock(floorId, adjustingItem.id, delta, reason);
      refreshData();
    }
  };

  const handleSaveItem = (
    itemData: Omit<StockItem, 'id' | 'createdAt' | 'updatedAt'>,
    editId?: string
  ) => {
    if (editId) {
      StockStorageEngine.updateItem(floorId, {
        ...itemData,
        id: editId,
        createdAt: editingItem?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } else {
      StockStorageEngine.addItem(floorId, itemData);
    }
    refreshData();
  };

  const handleDeleteItem = (itemId: string) => {
    soundEffects.playClickSound();
    StockStorageEngine.deleteItem(floorId, itemId);
    refreshData();
  };

  const handleAddCategory = (catName: string) => {
    StockStorageEngine.addCategory(floorId, catName);
    refreshData();
  };
  const handleRemoveCategory = (catName: string) => {
    StockStorageEngine.removeCategory(floorId, catName);
    refreshData();
  };

  const handleOpenReport = () => {
    soundEffects.playClickSound();
    const text = ReportService.generateFloorReport(floorId);
    setReportText(text);
    setIsReportModalOpen(true);
  };

  return (
    <div className="min-h-screen pb-28 pt-3 px-3 max-w-md mx-auto space-y-3">
      {/* Top Header Bar */}
      <header className="flex items-center justify-between py-1 px-0.5">
        <div className="flex items-center gap-2.5">
          {/* Custom Floor Badge */}
          <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center shadow-xs">
            <FloorGlyph floorId={floorId} size={20} />
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm font-extrabold text-black leading-tight">
                {floorInfo.name}
              </h1>
              <span className="text-[10px] font-medium text-zinc-400">
                • {floorInfo.subtitle}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-zinc-500 mt-0.5">
              <span className="font-semibold">{floorData.items.length} macam</span>
              {currentUser && (
                <>
                  <span className="text-zinc-300">•</span>
                  <button
                    onClick={() => setIsPasswordModalOpen(true)}
                    className="text-zinc-700 hover:text-black font-semibold flex items-center gap-0.5 transition-colors"
                    title="Ganti Password"
                  >
                    <User size={10} className="text-zinc-400" />
                    <span>{currentUser.name}</span>
                    <KeyRound size={9} className="text-zinc-400 ml-0.5" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <OfflineBadge />

          {/* Sound Toggle */}
          <button
            onClick={() => soundEffects.toggleSound()}
            className={`p-2 rounded-xl border transition-all touch-press shadow-2xs ${
              isSoundOn
                ? 'bg-white border-zinc-200 text-zinc-800'
                : 'bg-zinc-100 border-zinc-300 text-zinc-400'
            }`}
            title={isSoundOn ? 'Suara Aktif (Klik untuk Mematikan)' : 'Suara Mati (Klik untuk Mengaktifkan)'}
          >
            {isSoundOn ? <Volume2 size={14} /> : <VolumeX size={14} />}
          </button>

          <button
            onClick={() => {
              soundEffects.playClickSound();
              setIsExportModalOpen(true);
            }}
            className="p-2 rounded-xl bg-white border border-zinc-200 text-zinc-700 hover:border-black touch-press shadow-2xs"
            title="Sinkronisasi Data"
          >
            <Share2 size={14} />
          </button>

          <button
            onClick={handleOpenReport}
            className="p-2 rounded-xl bg-white border border-zinc-200 text-zinc-700 hover:border-black touch-press shadow-2xs"
            title="Salin Laporan Teks"
          >
            <FileText size={14} />
          </button>
        </div>
      </header>

      {/* Low Stock Alert Ticker (Smart Topping) */}
      {lowStockCount > 0 && (
        <div className="flex items-center justify-between p-2.5 px-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-900 text-xs font-semibold shadow-2xs animate-in fade-in">
          <div className="flex items-center gap-1.5 min-w-0">
            <AlertTriangle size={14} className="text-amber-700 shrink-0" />
            <span className="truncate">
              <strong>{lowStockCount} barang</strong> stoknya menipis
            </span>
          </div>
          <button
            onClick={() => {
              soundEffects.playClickSound();
              setFilterOnlyLowStock(!filterOnlyLowStock);
            }}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold shrink-0 transition-all ${
              filterOnlyLowStock
                ? 'bg-amber-800 text-white shadow-xs'
                : 'bg-white text-amber-900 border border-amber-300 hover:bg-amber-100'
            }`}
          >
            {filterOnlyLowStock ? 'Lihat Semua' : 'Filter Menipis'}
          </button>
        </div>
      )}

      {/* Search & Scanner Bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-2.5 text-zinc-400" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari barang... (tekan '/' atau Ctrl+K)"
            className="w-full pl-9 pr-8 py-2 text-xs bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-black font-medium placeholder:text-zinc-400 shadow-2xs transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2 text-xs text-zinc-400 hover:text-black"
            >
              ✕
            </button>
          )}
        </div>

        <button
          onClick={() => {
            soundEffects.playClickSound();
            setIsScannerOpen(true);
          }}
          className="p-2 bg-black hover:bg-zinc-800 text-white rounded-xl touch-press shadow-xs flex items-center justify-center"
          title="Scan Barcode (Alt+S)"
        >
          <ScannerGlyph size={16} />
        </button>
      </div>

      {/* Categories Bar */}
      <div className="space-y-2 bg-white p-3 rounded-2xl border border-zinc-200 shadow-xs">
        <div className="flex items-center justify-between px-0.5">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
            Kategori
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                soundEffects.playClickSound();
                setIsCategoryPickerOpen(true);
                setCategoryPickerSearch('');
              }}
              className="text-[10px] font-bold text-black hover:underline flex items-center gap-1"
            >
              <Layers size={11} /> Semua Kategori
            </button>
            <span className="text-zinc-200">•</span>
            <button
              onClick={() => {
                soundEffects.playClickSound();
                setIsCategoryModalOpen(true);
              }}
              className="text-[10px] font-semibold text-zinc-500 hover:text-black flex items-center gap-1"
            >
              Kelola
            </button>
          </div>
        </div>

        {/* Dropdown Selector */}
        <div className="relative">
          <select
            value={selectedCategory}
            onChange={(e) => {
              soundEffects.playClickSound();
              setSelectedCategory(e.target.value);
            }}
            className="w-full pl-3 pr-8 py-2 text-xs font-bold bg-zinc-50 border border-zinc-200 rounded-xl text-black focus:outline-none focus:border-black appearance-none"
          >
            <option value="ALL">Semua Kategori ({floorData.items.length})</option>
            {floorData.categories.map((cat) => {
              const count = floorData.items.filter((it) => it.category === cat).length;
              return (
                <option key={cat} value={cat}>
                  {cat} ({count})
                </option>
              );
            })}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-2.5 text-zinc-400 pointer-events-none" />
        </div>

        {/* Quick-Chips */}
        <div className="flex flex-wrap gap-1 pt-0.5">
          <button
            onClick={() => {
              soundEffects.playClickSound();
              setSelectedCategory('ALL');
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all touch-press ${
              selectedCategory === 'ALL'
                ? 'bg-black text-white shadow-xs'
                : 'bg-zinc-50 text-zinc-600 border border-zinc-200 hover:border-black'
            }`}
          >
            Semua ({floorData.items.length})
          </button>

          {floorData.categories.slice(0, 4).map((cat) => {
            const count = floorData.items.filter((it) => it.category === cat).length;
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => {
                  soundEffects.playClickSound();
                  setSelectedCategory(cat);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all touch-press flex items-center gap-1 ${
                  isSelected
                    ? 'bg-black text-white shadow-xs'
                    : 'bg-zinc-50 text-zinc-700 border border-zinc-200 hover:border-black'
                }`}
              >
                <span>{cat}</span>
                <span
                  className={`text-[9px] px-1 py-0.2 rounded-md ${
                    isSelected ? 'bg-zinc-800 text-white' : 'bg-zinc-200 text-zinc-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}

          {floorData.categories.length > 4 && (
            <button
              onClick={() => {
                soundEffects.playClickSound();
                setIsCategoryPickerOpen(true);
                setCategoryPickerSearch('');
              }}
              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-zinc-100 text-zinc-700 hover:text-black border border-zinc-200 touch-press flex items-center gap-1"
            >
              +{floorData.categories.length - 4} Lainnya
            </button>
          )}
        </div>
      </div>

      {/* Action Row (Out of stock switch + Add item) */}
      <div className="flex items-center justify-between bg-white border border-zinc-200 rounded-xl p-2 px-3 shadow-2xs">
        <button
          onClick={() => {
            soundEffects.playClickSound();
            setHideOutOfStock(!hideOutOfStock);
          }}
          className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-600 hover:text-black transition-colors"
        >
          {hideOutOfStock ? <EyeOff size={13} /> : <Eye size={13} />}
          <span>{hideOutOfStock ? 'Sembunyikan Habis' : 'Tampilkan Habis'}</span>
          {outOfStockCount > 0 && (
            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-zinc-100 text-zinc-700">
              {outOfStockCount}
            </span>
          )}
        </button>

        <button
          onClick={() => {
            soundEffects.playClickSound();
            setEditingItem(null);
            setIsItemFormOpen(true);
          }}
          className="px-3 py-1.5 bg-black hover:bg-zinc-800 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 touch-press shadow-xs"
        >
          <Plus size={13} /> Tambah Produk
        </button>
      </div>

      {/* Stock Items List */}
      <div>
        {isLoading ? (
          <SkeletonLoader count={4} />
        ) : filteredItems.length === 0 ? (
          <div className="bg-white border border-dashed border-zinc-300 rounded-2xl p-7 text-center space-y-1.5 shadow-2xs">
            <h4 className="text-xs font-bold text-zinc-700">Tidak ada barang ditemukan</h4>
            <p className="text-[11px] text-zinc-400 max-w-xs mx-auto">
              {searchQuery
                ? `Tidak ada hasil untuk "${searchQuery}"`
                : hideOutOfStock && outOfStockCount > 0
                ? `${outOfStockCount} barang habis disembunyikan`
                : 'Belum ada barang di kategori ini.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredItems.map((item) => {
              const isOutOfStock = item.quantity <= 0;
              const isLowStock = !isOutOfStock && item.quantity <= item.minStock;

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    soundEffects.playClickSound();
                    setAdjustingItem(item);
                  }}
                  className="bg-white rounded-2xl p-3.5 border border-zinc-200 hover:border-black cursor-pointer transition-all flex items-center justify-between shadow-xs touch-press group"
                >
                  {/* Item Info */}
                  <div className="min-w-0 flex-1 pr-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-700">
                        {item.category}
                      </span>
                      {item.barcode && (
                        <span className="text-[9px] text-zinc-400 font-mono flex items-center gap-0.5">
                          <Barcode size={10} /> {item.barcode}
                        </span>
                      )}
                      {item.locationDetails && (
                        <span className="text-[9px] text-zinc-400 flex items-center gap-0.5">
                          <MapPin size={9} />
                          {item.locationDetails}
                        </span>
                      )}
                    </div>

                    <h3 className="text-xs font-bold text-black mt-1 truncate group-hover:text-black leading-snug">
                      {item.name}
                    </h3>

                    {/* Clean Status Badges */}
                    {isOutOfStock ? (
                      <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.2 rounded bg-zinc-900 text-white text-[9px] font-bold">
                        Habis (0)
                      </span>
                    ) : isLowStock && item.minStock > 0 ? (
                      <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[9px] font-bold">
                        <AlertTriangle size={9} /> Min {item.minStock} {item.unit}
                      </span>
                    ) : item.maxStock && item.quantity >= item.maxStock ? (
                      <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-600 text-[9px] font-medium">
                        Max {item.maxStock} {item.unit}
                      </span>
                    ) : null}
                  </div>

                  {/* Stock Quantity Numeral & Edit */}
                  <div className="flex items-center gap-2.5 shrink-0">
                    <div className="text-right">
                      <span className="text-base font-black text-black font-mono block leading-none">
                        {item.quantity}
                      </span>
                      <span className="text-[9px] text-zinc-400 block mt-0.5 font-medium">
                        {item.unit}
                      </span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        soundEffects.playClickSound();
                        setEditingItem(item);
                        setIsItemFormOpen(true);
                      }}
                      className="p-1.5 text-zinc-300 hover:text-black hover:bg-zinc-100 rounded-xl transition-colors"
                      title="Edit Produk"
                    >
                      <Edit2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Mutations Drawer */}
      <div className="pt-1">
        <button
          onClick={() => {
            soundEffects.playClickSound();
            setShowRecentMutations(!showRecentMutations);
          }}
          className="w-full flex items-center justify-between text-xs font-bold text-zinc-700 p-2.5 rounded-xl bg-white border border-zinc-200 shadow-2xs transition-colors hover:border-black"
        >
          <span className="flex items-center gap-1.5">
            <Clock size={13} className="text-zinc-400" />
            Riwayat Mutasi ({floorData.mutations.length})
          </span>
          <span className="text-[10px] text-zinc-500 font-semibold">
            {showRecentMutations ? 'Tutup' : 'Lihat'}
          </span>
        </button>

        {showRecentMutations && (
          <div className="mt-2 space-y-1 max-h-52 overflow-y-auto">
            {floorData.mutations.length === 0 ? (
              <p className="text-xs text-zinc-400 py-3 text-center italic">
                Belum ada riwayat mutasi
              </p>
            ) : (
              floorData.mutations.slice(0, 15).map((m) => (
                <div
                  key={m.id}
                  className="bg-white border border-zinc-200 p-2.5 rounded-xl text-xs flex items-center justify-between shadow-2xs"
                >
                  <div className="min-w-0 pr-2">
                    <span className="font-bold text-black block truncate">
                      {m.itemName}
                    </span>
                    <span className="text-[10px] text-zinc-400 block">
                      {m.reason} {m.userName ? `• ${m.userName}` : ''}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-mono font-bold text-xs text-black block">
                      {m.type === 'IN' ? `+${m.amount}` : `-${m.amount}`}
                    </span>
                    <span className="text-[9px] text-zinc-400 block font-mono">
                      {m.prevStock} → {m.newStock}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleBarcodeScanned}
      />

      <StockAdjustModal
        isOpen={!!adjustingItem}
        item={adjustingItem}
        onClose={() => setAdjustingItem(null)}
        onConfirm={handleStockAdjustConfirm}
      />

      <ItemFormModal
        isOpen={isItemFormOpen}
        itemToEdit={editingItem}
        categories={floorData.categories}
        onClose={() => {
          setIsItemFormOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSaveItem}
        onDelete={handleDeleteItem}
      />

      <CategoryManagerModal
        isOpen={isCategoryModalOpen}
        floorName={floorInfo.name}
        categories={floorData.categories}
        onClose={() => setIsCategoryModalOpen(false)}
        onAddCategory={handleAddCategory}
        onRemoveCategory={handleRemoveCategory}
      />

      {/* Category Picker Modal */}
      {isCategoryPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 modal-backdrop animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl overflow-hidden border border-zinc-200 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-zinc-100 bg-zinc-50 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-black text-white flex items-center justify-center shadow-xs">
                  <Layers size={16} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-black leading-none">Pilih Kategori</h3>
                  <p className="text-[10px] text-zinc-400 font-medium mt-0.5">
                    {floorInfo.name} ({floorData.categories.length} kategori)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCategoryPickerOpen(false)}
                className="p-1.5 rounded-full text-zinc-400 hover:text-black hover:bg-zinc-200 transition-colors touch-press"
              >
                ✕
              </button>
            </div>

            <div className="p-3 border-b border-zinc-100 bg-white shrink-0">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Cari kategori..."
                  value={categoryPickerSearch}
                  onChange={(e) => setCategoryPickerSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-black font-medium"
                />
              </div>
            </div>

            <div className="p-3 overflow-y-auto grid grid-cols-2 gap-1.5 flex-1">
              <button
                onClick={() => {
                  soundEffects.playClickSound();
                  setSelectedCategory('ALL');
                  setIsCategoryPickerOpen(false);
                }}
                className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all touch-press ${
                  selectedCategory === 'ALL'
                    ? 'bg-black text-white border-black shadow-xs'
                    : 'bg-zinc-50 text-zinc-800 border-zinc-200 hover:border-black'
                }`}
              >
                <span className="block truncate">Semua Kategori</span>
                <span className="text-[10px] font-normal opacity-70 block mt-0.5">
                  {floorData.items.length} produk
                </span>
              </button>

              {floorData.categories
                .filter((c) =>
                  c.toLowerCase().includes(categoryPickerSearch.toLowerCase().trim())
                )
                .map((cat) => {
                  const count = floorData.items.filter((it) => it.category === cat).length;
                  const isSelected = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => {
                        soundEffects.playClickSound();
                        setSelectedCategory(cat);
                        setIsCategoryPickerOpen(false);
                      }}
                      className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all touch-press ${
                        isSelected
                          ? 'bg-black text-white border-black shadow-xs'
                          : 'bg-zinc-50 text-zinc-800 border-zinc-200 hover:border-black'
                      }`}
                    >
                      <span className="block truncate">{cat}</span>
                      <span className="text-[10px] font-normal opacity-70 block mt-0.5">
                        {count} produk
                      </span>
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* Export / Sync Modal */}
      <FloorExportImportModal
        isOpen={isExportModalOpen}
        floorId={floorId}
        onClose={() => setIsExportModalOpen(false)}
        onDataChanged={refreshData}
      />

      {/* Text Report Modal */}
      <TextReportModal
        isOpen={isReportModalOpen}
        title={`Laporan ${floorInfo.name}`}
        reportText={reportText}
        onClose={() => setIsReportModalOpen(false)}
      />

      {/* Change Password Modal */}
      {currentUser && (
        <ChangePasswordModal
          isOpen={isPasswordModalOpen}
          currentUser={currentUser}
          onClose={() => setIsPasswordModalOpen(false)}
          onSuccess={() => {
            refreshData();
          }}
        />
      )}
    </div>
  );
};
