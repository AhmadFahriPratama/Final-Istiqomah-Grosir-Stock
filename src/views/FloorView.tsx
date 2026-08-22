import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Plus,
  Search,
  Camera,
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
  ShoppingBag,
  Shirt,
  Armchair,
  Package,
  ChevronDown,
  Check,
  X,
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

interface FloorViewProps {
  floorId: FloorId;
  onOpenAdmin: () => void;
}

const FLOOR_ICONS: Record<FloorId, typeof ShoppingBag> = {
  '1': ShoppingBag,
  '2': Shirt,
  '3': Armchair,
  '4': Package,
};

export const FloorView: React.FC<FloorViewProps> = ({ floorId }) => {
  const floorInfo = FLOOR_DEFINITIONS[floorId];
  const FloorIconComponent = FLOOR_ICONS[floorId] || Package;

  // User & Auth State
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() =>
    StockStorageEngine.getCurrentUser()
  );
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  // Data State
  const [floorData, setFloorData] = useState(() => StockStorageEngine.getFloorData(floorId));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters & Controls
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [hideOutOfStock, setHideOutOfStock] = useState<boolean>(true);
  const [showRecentMutations, setShowRecentMutations] = useState<boolean>(false);

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
    }, 80);

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

    window.addEventListener('istiqomah_stock_updated', handleStorageEvent);
    window.addEventListener('istiqomah_user_changed', handleUserChanged);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('istiqomah_stock_updated', handleStorageEvent);
      window.removeEventListener('istiqomah_user_changed', handleUserChanged);
    };
  }, [floorId, refreshData]);

  const filteredItems = useMemo(() => {
    return floorData.items.filter((item) => {
      if (selectedCategory !== 'ALL' && item.category !== selectedCategory) {
        return false;
      }
      if (hideOutOfStock && item.quantity <= 0) {
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
  }, [floorData.items, selectedCategory, hideOutOfStock, searchQuery]);

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
      {/* Header Bar */}
      <header className="flex items-center justify-between py-1 px-0.5">
        <div className="flex items-center gap-2.5">
          {/* Remade Sleek Vector Floor Badge */}
          <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center shadow-xs">
            <FloorIconComponent size={18} className="stroke-[2.2]" />
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm font-extrabold text-black leading-tight">
                {floorInfo.name}
              </h1>
              <span className="text-[10px] font-medium text-zinc-500">
                ({floorInfo.subtitle})
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-medium">
              <span>{floorData.items.length} item</span>
              {currentUser && (
                <>
                  <span>-</span>
                  <button
                    onClick={() => setIsPasswordModalOpen(true)}
                    className="text-black font-semibold hover:underline flex items-center gap-0.5"
                    title="Ubah Password"
                  >
                    <User size={10} />
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

          <button
            onClick={() => {
              soundEffects.playClickSound();
              setIsExportModalOpen(true);
            }}
            className="p-2 rounded-xl bg-white border border-zinc-200 text-zinc-700 hover:border-black touch-press"
            title="Sinkronisasi & Multi-HP"
          >
            <Share2 size={14} />
          </button>

          <button
            onClick={handleOpenReport}
            className="p-2 rounded-xl bg-white border border-zinc-200 text-zinc-700 hover:border-black touch-press"
            title="Laporan Teks"
          >
            <FileText size={14} />
          </button>
        </div>
      </header>

      {/* Search & Camera Bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-2.5 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Cari barang di ${floorInfo.name}...`}
            className="w-full pl-9 pr-8 py-2 text-xs bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-black font-medium placeholder:text-zinc-400"
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
          className="p-2 bg-black hover:bg-zinc-800 text-white rounded-xl touch-press flex items-center gap-1"
          title="Scan Kamera"
        >
          <Camera size={16} />
        </button>
      </div>

      {/* Category Selection Bar (Compact Dropdown + Wrap Chips) */}
      <div className="space-y-2 bg-white p-3 rounded-2xl border border-zinc-200 shadow-xs">
        <div className="flex items-center justify-between px-0.5">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
            Jenis / Kategori Barang
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
              <Layers size={11} /> Semua Jenis
            </button>
            <span className="text-zinc-300">•</span>
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

        {/* 1. Native Dropdown Selector (Fits full screen perfectly) */}
        <div className="relative">
          <select
            value={selectedCategory}
            onChange={(e) => {
              soundEffects.playClickSound();
              setSelectedCategory(e.target.value);
            }}
            className="w-full pl-3 pr-8 py-2 text-xs font-bold bg-zinc-50 border border-zinc-200 rounded-xl text-black focus:outline-none focus:border-black appearance-none"
          >
            <option value="ALL">Semua Jenis ({floorData.items.length} macam barang)</option>
            {floorData.categories.map((cat) => {
              const count = floorData.items.filter((it) => it.category === cat).length;
              return (
                <option key={cat} value={cat}>
                  {cat} ({count} barang)
                </option>
              );
            })}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-2.5 text-zinc-400 pointer-events-none" />
        </div>

        {/* 2. Responsive Wrap Quick-Chips (Max 4 pills + view all) */}
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
              <Layers size={11} /> +{floorData.categories.length - 4} Lainnya
            </button>
          )}
        </div>
      </div>

      {/* Out of Stock Toggle & Add Button */}
      <div className="flex items-center justify-between bg-white border border-zinc-200 rounded-xl p-2 px-3">
        <button
          onClick={() => {
            soundEffects.playClickSound();
            setHideOutOfStock(!hideOutOfStock);
          }}
          className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-600 hover:text-black"
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
          className="px-2.5 py-1.5 bg-black hover:bg-zinc-800 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 touch-press"
        >
          <Plus size={13} /> Tambah Barang
        </button>
      </div>

      {/* Stock Items List */}
      <div>
        {isLoading ? (
          <SkeletonLoader count={4} />
        ) : filteredItems.length === 0 ? (
          <div className="bg-white border border-dashed border-zinc-300 rounded-2xl p-7 text-center space-y-2">
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
                  className="bg-white rounded-xl p-3.5 border border-zinc-200 hover:border-black cursor-pointer transition-all flex items-center justify-between shadow-xs touch-press group"
                >
                  {/* Item Details */}
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

                    <h3 className="text-xs font-bold text-black mt-1 truncate group-hover:text-black">
                      {item.name}
                    </h3>

                    {/* Stock Alert Label */}
                    {isOutOfStock ? (
                      <span className="text-[9px] font-bold text-zinc-900 block mt-0.5">
                        [Stok Habis / 0]
                      </span>
                    ) : isLowStock ? (
                      <span className="text-[9px] font-medium text-zinc-500 block mt-0.5">
                        [Stok Menipis: Min {item.minStock} {item.unit}]
                      </span>
                    ) : null}
                  </div>

                  {/* Stock Quantity Badge & Edit Action */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <span className="text-sm font-extrabold text-black font-mono block">
                        {item.quantity}
                      </span>
                      <span className="text-[9px] text-zinc-400 block -mt-0.5 font-medium">
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
                      className="p-1.5 text-zinc-300 hover:text-black hover:bg-zinc-100 rounded-lg transition-colors"
                      title="Edit Data Barang"
                    >
                      <Edit2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Mutations Toggle */}
      <div className="pt-2">
        <button
          onClick={() => {
            soundEffects.playClickSound();
            setShowRecentMutations(!showRecentMutations);
          }}
          className="w-full flex items-center justify-between text-xs font-bold text-zinc-600 p-2 rounded-xl bg-white border border-zinc-200"
        >
          <span className="flex items-center gap-1.5">
            <Clock size={13} className="text-zinc-500" />
            Riwayat Mutasi {floorInfo.name} ({floorData.mutations.length})
          </span>
          <span className="text-[10px] text-black">
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
                  className="bg-white border border-zinc-200 p-2 rounded-lg text-xs flex items-center justify-between"
                >
                  <div className="min-w-0 pr-2">
                    <span className="font-bold text-black block truncate">
                      {m.itemName}
                    </span>
                    <span className="text-[10px] text-zinc-400 block">
                      {m.reason} {m.userName ? `- ${m.userName}` : ''}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-xs text-black">
                      {m.type === 'IN' ? `+${m.amount}` : `-${m.amount}`}
                    </span>
                    <span className="text-[9px] text-zinc-400 block">
                      {m.prevStock} -&gt; {m.newStock}
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

      {/* Searchable Category Picker Grid Modal */}
      {isCategoryPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 modal-backdrop animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl overflow-hidden border border-zinc-200 flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-zinc-100 bg-zinc-50 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-black text-white flex items-center justify-center shadow-xs">
                  <Layers size={16} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-black leading-none">Pilih Jenis Barang</h3>
                  <p className="text-[10px] text-zinc-500 font-medium mt-0.5">
                    {floorInfo.name} ({floorData.categories.length} kategori)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCategoryPickerOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-full text-zinc-400 hover:text-black hover:bg-zinc-200 transition-colors touch-press"
              >
                <X size={16} />
              </button>
            </div>

            {/* Search Input */}
            <div className="p-3 bg-zinc-50/60 border-b border-zinc-200 shrink-0">
              <div className="relative">
                <input
                  type="text"
                  value={categoryPickerSearch}
                  onChange={(e) => setCategoryPickerSearch(e.target.value)}
                  placeholder="Cari jenis barang..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-black font-medium"
                />
                <Search size={13} className="absolute left-2.5 top-2 text-zinc-400" />
                {categoryPickerSearch && (
                  <button
                    onClick={() => setCategoryPickerSearch('')}
                    className="absolute right-2.5 top-2 text-zinc-400 hover:text-black text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Grid List */}
            <div className="p-3 overflow-y-auto space-y-1.5 flex-1">
              {/* Option: Semua */}
              {(!categoryPickerSearch.trim() || 'semua'.includes(categoryPickerSearch.toLowerCase())) && (
                <button
                  onClick={() => {
                    soundEffects.playClickSound();
                    setSelectedCategory('ALL');
                    setIsCategoryPickerOpen(false);
                  }}
                  className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all touch-press ${
                    selectedCategory === 'ALL'
                      ? 'bg-black text-white border-black font-bold shadow-xs'
                      : 'bg-zinc-50 text-zinc-800 border-zinc-200 hover:border-black'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs">Semua Jenis Barang</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md ${
                      selectedCategory === 'ALL' ? 'bg-zinc-800 text-white' : 'bg-zinc-200 text-zinc-700'
                    }`}>
                      {floorData.items.length} item
                    </span>
                    {selectedCategory === 'ALL' && <Check size={14} className="text-white" />}
                  </div>
                </button>
              )}

              {/* Grid of Categories */}
              <div className="grid grid-cols-2 gap-1.5 pt-1">
                {floorData.categories
                  .filter((cat) =>
                    cat.toLowerCase().includes(categoryPickerSearch.toLowerCase().trim())
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
                        className={`p-2.5 rounded-xl border text-left transition-all touch-press flex flex-col justify-between min-h-[58px] ${
                          isSelected
                            ? 'bg-black text-white border-black shadow-xs font-bold'
                            : 'bg-zinc-50 text-zinc-800 border-zinc-200 hover:border-black'
                        }`}
                      >
                        <span className="text-xs truncate block w-full">{cat}</span>
                        <div className="flex items-center justify-between mt-1">
                          <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded-md ${
                            isSelected ? 'bg-zinc-800 text-white' : 'bg-zinc-200 text-zinc-600'
                          }`}>
                            {count} barang
                          </span>
                          {isSelected && <Check size={12} className="text-white" />}
                        </div>
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* Footer */}
            <div className="p-3 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between shrink-0">
              <button
                onClick={() => {
                  soundEffects.playClickSound();
                  setIsCategoryPickerOpen(false);
                  setIsCategoryModalOpen(true);
                }}
                className="text-[10px] font-bold text-zinc-600 hover:text-black flex items-center gap-1 underline"
              >
                <Layers size={12} /> Kelola / Tambah Jenis
              </button>

              <button
                onClick={() => setIsCategoryPickerOpen(false)}
                className="px-3.5 py-1.5 bg-black hover:bg-zinc-800 text-white rounded-xl text-xs font-bold touch-press shadow-xs"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      <FloorExportImportModal
        isOpen={isExportModalOpen}
        floorId={floorId}
        onClose={() => setIsExportModalOpen(false)}
        onDataChanged={refreshData}
      />

      <TextReportModal
        isOpen={isReportModalOpen}
        title={`Laporan Stok ${floorInfo.name}`}
        reportText={reportText}
        onClose={() => setIsReportModalOpen(false)}
      />

      {currentUser && (
        <ChangePasswordModal
          isOpen={isPasswordModalOpen}
          currentUser={currentUser}
          onClose={() => setIsPasswordModalOpen(false)}
          onSuccess={(updated) => setCurrentUser(updated)}
        />
      )}
    </div>
  );
};
