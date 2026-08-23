import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Plus,
  Search,
  Layers,
  Eye,
  EyeOff,
  Share2,
  FileText,
  Barcode,
  Edit2,
  User,
  MapPin,
  KeyRound,
  AlertTriangle,
  Volume2,
  VolumeX,
} from 'lucide-react';
import type { FloorId, StockItem, UserAccount } from '../types/stock';
import { FLOOR_DEFINITIONS } from '../types/stock';
import { StockStorageEngine } from '../services/db';
import { soundEffects } from '../utils/audio';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { OfflineBadge } from '../components/OfflineBadge';
import { BarcodeScannerModal } from '../components/BarcodeScannerModal';
import { StockAdjustModal } from '../components/StockAdjustModal';
import { ItemFormModal } from '../components/ItemFormModal';
import { CategoryManagerModal } from '../components/CategoryManagerModal';
import { FloorExportImportModal } from '../components/FloorExportImportModal';
import { ReportGeneratorModal } from '../components/ReportGeneratorModal';
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
  const [isTableReportModalOpen, setIsTableReportModalOpen] = useState<boolean>(false);

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
    setIsTableReportModalOpen(true);
  };

  return (
    <div className="min-h-screen pb-28 pt-4 px-4 max-w-md mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-stone-100 text-stone-600 flex items-center justify-center shrink-0">
            <FloorGlyph floorId={floorId} size={18} />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-stone-900 leading-tight">
              {floorInfo.name}
              <span className="text-stone-400 font-normal ml-1.5 text-xs">
                {floorInfo.subtitle}
              </span>
            </h1>
            <div className="flex items-center gap-2 text-xs text-stone-400 mt-0.5">
              <span>{floorData.items.length} macam</span>
              {currentUser && (
                <>
                  <span>·</span>
                  <button
                    onClick={() => setIsPasswordModalOpen(true)}
                    className="text-stone-500 hover:text-stone-800 flex items-center gap-1 transition-colors"
                    title="Ganti Password"
                  >
                    <User size={10} />
                    <span>{currentUser.name}</span>
                    <KeyRound size={9} className="text-stone-300" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <OfflineBadge />
          <button
            onClick={() => soundEffects.toggleSound()}
            className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-colors touch-press ${
              isSoundOn
                ? 'bg-white border-stone-200 text-stone-500'
                : 'bg-stone-100 border-stone-200 text-stone-300'
            }`}
            title={isSoundOn ? 'Suara Aktif' : 'Suara Mati'}
          >
            {isSoundOn ? <Volume2 size={14} /> : <VolumeX size={14} />}
          </button>
          <button
            onClick={() => {
              soundEffects.playClickSound();
              setIsExportModalOpen(true);
            }}
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-white border border-stone-200 text-stone-500 hover:border-stone-400 touch-press"
            title="Sinkronisasi"
          >
            <Share2 size={14} />
          </button>
          <button
            onClick={handleOpenReport}
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-white border border-stone-200 text-stone-500 hover:border-stone-400 touch-press"
            title="Laporan"
          >
            <FileText size={14} />
          </button>
        </div>
      </header>

      {/* Low Stock Alert */}
      {lowStockCount > 0 && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 border border-amber-200/60 text-amber-800 text-xs mb-3">
          <div className="flex items-center gap-1.5">
            <AlertTriangle size={13} />
            <span>
              <strong>{lowStockCount}</strong> barang stok menipis
            </span>
          </div>
          <button
            onClick={() => {
              soundEffects.playClickSound();
              setFilterOnlyLowStock(!filterOnlyLowStock);
            }}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
              filterOnlyLowStock
                ? 'bg-amber-700 text-white'
                : 'bg-white text-amber-800 border border-amber-200'
            }`}
          >
            {filterOnlyLowStock ? 'Lihat Semua' : 'Filter'}
          </button>
        </div>
      )}

      {/* Search + Scanner */}
      <div className="flex items-center gap-2 mb-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-[11px] text-stone-300" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari barang..."
            className="w-full pl-9 pr-8 py-2.5 text-sm bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-stone-400 placeholder:text-stone-300 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-stone-300 hover:text-stone-600"
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
          className="w-10 h-10 bg-stone-900 hover:bg-stone-800 text-white rounded-xl touch-press flex items-center justify-center shrink-0"
          title="Scan Barcode"
        >
          <ScannerGlyph size={16} />
        </button>
      </div>

      {/* Category Filter */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-2 px-0.5">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-stone-400">Kategori</span>
            <button
              onClick={() => {
                soundEffects.playClickSound();
                setIsCategoryPickerOpen(true);
                setCategoryPickerSearch('');
              }}
              className="text-[11px] text-stone-500 hover:text-stone-800 flex items-center gap-1 transition-colors"
            >
              <Layers size={10} /> Semua
            </button>
          </div>
          <button
            onClick={() => {
              soundEffects.playClickSound();
              setIsCategoryModalOpen(true);
            }}
            className="text-[11px] text-stone-400 hover:text-stone-700 transition-colors"
          >
            Kelola
          </button>
        </div>

        {/* Category Chips - Horizontal scroll */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <button
            onClick={() => {
              soundEffects.playClickSound();
              setSelectedCategory('ALL');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors touch-press shrink-0 ${
              selectedCategory === 'ALL'
                ? 'bg-stone-900 text-white'
                : 'bg-white text-stone-600 border border-stone-200 hover:border-stone-400'
            }`}
          >
            Semua ({floorData.items.length})
          </button>

          {floorData.categories.map((cat) => {
            const count = floorData.items.filter((it) => it.category === cat).length;
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => {
                  soundEffects.playClickSound();
                  setSelectedCategory(cat);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors touch-press shrink-0 ${
                  isSelected
                    ? 'bg-stone-900 text-white'
                    : 'bg-white text-stone-600 border border-stone-200 hover:border-stone-400'
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Action Row */}
      <div className="flex items-center justify-between mb-3 px-0.5">
        <button
          onClick={() => {
            soundEffects.playClickSound();
            setHideOutOfStock(!hideOutOfStock);
          }}
          className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-700 transition-colors"
        >
          {hideOutOfStock ? <EyeOff size={13} /> : <Eye size={13} />}
          <span>{hideOutOfStock ? 'Habis tersembunyi' : 'Tampilkan semua'}</span>
          {outOfStockCount > 0 && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-stone-100 text-stone-500">
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
          className="px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 touch-press"
        >
          <Plus size={14} /> Tambah
        </button>
      </div>

      {/* Stock Items */}
      <div className="space-y-1.5">
        {isLoading ? (
          <SkeletonLoader count={4} />
        ) : filteredItems.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-stone-400">
              {searchQuery
                ? `Tidak ada hasil untuk "${searchQuery}"`
                : hideOutOfStock && outOfStockCount > 0
                ? `${outOfStockCount} barang habis tersembunyi`
                : 'Belum ada barang.'}
            </p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const isOutOfStock = item.quantity <= 0;
            const isLowStock = !isOutOfStock && item.quantity <= item.minStock && item.minStock > 0;

            return (
              <div
                key={item.id}
                onClick={() => {
                  soundEffects.playClickSound();
                  setAdjustingItem(item);
                }}
                className={`bg-white rounded-xl p-3.5 border cursor-pointer transition-all flex items-center justify-between touch-press group ${
                  isOutOfStock
                    ? 'border-stone-200 opacity-60'
                    : isLowStock
                    ? 'border-amber-200'
                    : 'border-stone-200 hover:border-stone-300'
                }`}
              >
                {/* Item Info */}
                <div className="min-w-0 flex-1 pr-3">
                  <h3 className="text-sm font-semibold text-stone-900 truncate leading-snug">
                    {item.name}
                  </h3>

                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-[11px] text-stone-400">
                      {item.category}
                    </span>
                    {item.barcode && (
                      <span className="text-[10px] text-stone-300 font-mono flex items-center gap-0.5">
                        <Barcode size={9} /> {item.barcode}
                      </span>
                    )}
                    {item.locationDetails && (
                      <span className="text-[10px] text-stone-300 flex items-center gap-0.5">
                        <MapPin size={9} /> {item.locationDetails}
                      </span>
                    )}
                  </div>

                  {/* Status */}
                  {isOutOfStock ? (
                    <span className="inline-block mt-1 text-[10px] font-medium text-stone-400">
                      Habis
                    </span>
                  ) : isLowStock ? (
                    <span className="inline-flex items-center gap-0.5 mt-1 text-[10px] font-medium text-amber-700">
                      <AlertTriangle size={9} /> Stok menipis (min {item.minStock})
                    </span>
                  ) : null}
                </div>

                {/* Quantity + Edit */}
                <div className="flex items-center gap-2.5 shrink-0">
                  <div className="text-right">
                    <span className="text-lg font-bold text-stone-900 font-mono block leading-none">
                      {item.quantity}
                    </span>
                    <span className="text-[10px] text-stone-400 block mt-0.5">
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
                    className="p-1.5 text-stone-300 hover:text-stone-700 hover:bg-stone-50 rounded-lg transition-colors"
                    title="Edit Produk"
                  >
                    <Edit2 size={14} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Category Picker Modal */}
      {isCategoryPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop anim-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-xl overflow-hidden border border-stone-200 flex flex-col max-h-[80vh] anim-slide-up">
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-stone-100 shrink-0">
              <div>
                <h3 className="text-sm font-semibold text-stone-900">Pilih Kategori</h3>
                <p className="text-xs text-stone-400 mt-0.5">
                  {floorInfo.name} · {floorData.categories.length} kategori
                </p>
              </div>
              <button
                onClick={() => setIsCategoryPickerOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-3 border-b border-stone-100 shrink-0">
              <div className="relative">
                <Search size={13} className="absolute left-3 top-2.5 text-stone-300" />
                <input
                  type="text"
                  placeholder="Cari kategori..."
                  value={categoryPickerSearch}
                  onChange={(e) => setCategoryPickerSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-stone-400"
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
                className={`p-3 rounded-lg border text-left text-xs transition-colors touch-press ${
                  selectedCategory === 'ALL'
                    ? 'bg-stone-900 text-white border-stone-900'
                    : 'bg-white text-stone-700 border-stone-200 hover:border-stone-400'
                }`}
              >
                <span className="block font-semibold">Semua</span>
                <span className="text-[11px] opacity-60 mt-0.5 block">
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
                      className={`p-3 rounded-lg border text-left text-xs transition-colors touch-press ${
                        isSelected
                          ? 'bg-stone-900 text-white border-stone-900'
                          : 'bg-white text-stone-700 border-stone-200 hover:border-stone-400'
                      }`}
                    >
                      <span className="block font-semibold truncate">{cat}</span>
                      <span className="text-[11px] opacity-60 mt-0.5 block">
                        {count} produk
                      </span>
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      )}

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

      <FloorExportImportModal
        isOpen={isExportModalOpen}
        floorId={floorId}
        onClose={() => setIsExportModalOpen(false)}
        onDataChanged={refreshData}
      />

      <ReportGeneratorModal
        isOpen={isTableReportModalOpen}
        defaultFloorId={floorId}
        onClose={() => setIsTableReportModalOpen(false)}
      />

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
