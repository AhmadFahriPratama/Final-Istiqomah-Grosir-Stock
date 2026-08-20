import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Shirt,
  Armchair,
  Package,
  ShieldCheck,
  Camera,
  ChevronRight,
  KeyRound,
} from 'lucide-react';
import type { FloorId, UserAccount } from '../types/stock';
import { FLOOR_DEFINITIONS } from '../types/stock';
import { StockStorageEngine } from '../services/db';
import { soundEffects } from '../utils/audio';
import { OfflineBadge } from '../components/OfflineBadge';
import { BarcodeScannerModal } from '../components/BarcodeScannerModal';
import { ChangePasswordModal } from '../components/ChangePasswordModal';

interface LandingPageProps {
  onSelectFloor: (floorId: FloorId) => void;
  onOpenAdmin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onSelectFloor, onOpenAdmin }) => {
  const [stats, setStats] = useState(() => StockStorageEngine.getAggregateStats());
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() =>
    StockStorageEngine.getCurrentUser()
  );
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannedResult, setScannedResult] = useState<{
    barcode: string;
    foundFloorId?: FloorId;
    itemName?: string;
  } | null>(null);

  const refreshData = () => {
    setStats(StockStorageEngine.getAggregateStats());
    setCurrentUser(StockStorageEngine.getCurrentUser());
  };

  useEffect(() => {
    refreshData();
    const handleStorage = () => refreshData();
    const handleUserChanged = (e: Event) => {
      const custom = e as CustomEvent<{ user: UserAccount | null }>;
      setCurrentUser(custom.detail?.user || null);
    };

    window.addEventListener('istiqomah_stock_updated', handleStorage);
    window.addEventListener('istiqomah_user_changed', handleUserChanged);
    return () => {
      window.removeEventListener('istiqomah_stock_updated', handleStorage);
      window.removeEventListener('istiqomah_user_changed', handleUserChanged);
    };
  }, []);

  const isFahri =
    Boolean(
      currentUser &&
        (currentUser.username.toLowerCase() === 'fahri' ||
          currentUser.name.toLowerCase() === 'fahri' ||
          currentUser.role === 'ADMIN')
    );

  const floorIcons: Record<FloorId, typeof ShoppingBag> = {
    '1': ShoppingBag,
    '2': Shirt,
    '3': Armchair,
    '4': Package,
  };

  const handleFloorClick = (floorId: FloorId) => {
    soundEffects.playClickSound();
    onSelectFloor(floorId);
  };

  const handleUniversalScan = (scannedBarcode: string) => {
    setIsScannerOpen(false);
    let foundFloor: FloorId | undefined;
    let foundName: string | undefined;

    for (const fId of ['1', '2', '3', '4'] as FloorId[]) {
      const data = StockStorageEngine.getFloorData(fId);
      const match = data.items.find(
        (it) => it.barcode && it.barcode.trim().toLowerCase() === scannedBarcode.toLowerCase()
      );
      if (match) {
        foundFloor = fId;
        foundName = match.name;
        break;
      }
    }

    setScannedResult({
      barcode: scannedBarcode,
      foundFloorId: foundFloor,
      itemName: foundName,
    });
  };

  // Accessible floors for current user
  const accessibleFloors = stats.floorSummaries.filter(
    (f) =>
      !currentUser ||
      isFahri ||
      currentUser.assignedFloors.includes(f.floorId)
  );

  return (
    <div className="min-h-screen pb-28 pt-4 px-3.5 max-w-md mx-auto space-y-3.5">
      {/* Header */}
      <header className="flex items-center justify-between py-1">
        <div>
          <h1 className="text-base font-extrabold text-black tracking-tight leading-none">
            Istiqomah Grosir Stock
          </h1>
          <div className="flex items-center gap-1.5 mt-1">
            <p className="text-[11px] text-zinc-500 font-medium">
              {currentUser ? `Petugas: ${currentUser.name}` : 'Manajemen Stok'}
            </p>
            {currentUser && (
              <button
                onClick={() => setIsPasswordModalOpen(true)}
                className="text-[10px] font-semibold text-zinc-500 hover:text-black flex items-center gap-0.5 ml-1 underline"
                title="Ganti Password Akun"
              >
                <KeyRound size={9} />
                <span>Ganti Password</span>
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <OfflineBadge />
          <button
            onClick={() => {
              soundEffects.playClickSound();
              setIsScannerOpen(true);
            }}
            className="p-2 rounded-xl bg-black text-white hover:bg-zinc-800 touch-press"
            title="Scan Barcode"
          >
            <Camera size={16} />
          </button>
        </div>
      </header>

      {/* Global Quick Stats */}
      <div className="bg-white rounded-2xl p-4 border border-zinc-200 shadow-xs grid grid-cols-2 gap-2">
        <div>
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
            Total Unit Fisik
          </span>
          <span className="text-xl font-extrabold text-black mt-0.5 block font-mono">
            {stats.totalStockQty} <span className="text-xs font-normal text-zinc-500 font-sans">unit</span>
          </span>
        </div>

        <div className="text-right">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
            Jumlah Macam
          </span>
          <span className="text-xl font-extrabold text-black mt-0.5 block font-mono">
            {stats.totalItemsCount} <span className="text-xs font-normal text-zinc-500 font-sans">item</span>
          </span>
        </div>
      </div>

      {/* Barcode Search Alert */}
      {scannedResult && (
        <div className="bg-zinc-100 border border-zinc-300 rounded-2xl p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-black uppercase">
              Hasil Scan ({scannedResult.barcode})
            </span>
            <button
              onClick={() => setScannedResult(null)}
              className="text-zinc-500 hover:text-black text-xs"
            >
              ✕
            </button>
          </div>

          {scannedResult.foundFloorId ? (
            <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-zinc-200">
              <div>
                <span className="text-xs font-bold text-black block">
                  {scannedResult.itemName}
                </span>
                <span className="text-[11px] text-zinc-600 font-medium">
                  {FLOOR_DEFINITIONS[scannedResult.foundFloorId].name} (
                  {FLOOR_DEFINITIONS[scannedResult.foundFloorId].subtitle})
                </span>
              </div>
              <button
                onClick={() => handleFloorClick(scannedResult.foundFloorId!)}
                className="px-3 py-1.5 bg-black text-white rounded-lg text-xs font-bold touch-press"
              >
                Buka
              </button>
            </div>
          ) : (
            <p className="text-xs text-zinc-600">
              Barcode belum terdaftar di katalog barang.
            </p>
          )}
        </div>
      )}

      {/* Accessible Floors List */}
      <div className="space-y-2">
        <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider px-1 block">
          Pilih Lantai Kerja
        </span>

        <div className="space-y-2">
          {accessibleFloors.map((f) => {
            const Icon = floorIcons[f.floorId];

            return (
              <div
                key={f.floorId}
                onClick={() => handleFloorClick(f.floorId)}
                className="bg-white rounded-2xl p-4 border border-zinc-200 hover:border-black cursor-pointer transition-all touch-press flex items-center justify-between shadow-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center font-bold shrink-0">
                    <Icon size={18} />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-bold text-black">
                        {f.name}
                      </h3>
                      <span className="text-[10px] font-medium text-zinc-500">
                        ({f.subtitle})
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-zinc-500">
                      <span className="font-bold text-black font-mono">
                        {f.stockQty} unit
                      </span>
                      <span>•</span>
                      <span>{f.itemCount} item</span>
                    </div>
                  </div>
                </div>

                <ChevronRight size={16} className="text-zinc-400" />
              </div>
            );
          })}
        </div>
      </div>

      {/* Admin Portal Card (HANYA UNTUK FAHRI) */}
      {isFahri && (
        <div
          onClick={() => {
            soundEffects.playClickSound();
            onOpenAdmin();
          }}
          className="bg-black text-white rounded-2xl p-4 shadow-sm cursor-pointer hover:bg-zinc-900 transition-all touch-press flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-800 text-white flex items-center justify-center shrink-0">
              <ShieldCheck size={16} />
            </div>
            <div>
              <h3 className="text-xs font-bold">Dashboard Utama (Admin)</h3>
              <p className="text-[10px] text-zinc-400">
                Pusat kontrol akun tim, backup database, dan Telegram
              </p>
            </div>
          </div>
          <ChevronRight size={16} className="text-zinc-400" />
        </div>
      )}

      {/* Barcode Scanner */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleUniversalScan}
        title="Pencarian Lokasi Barang"
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
