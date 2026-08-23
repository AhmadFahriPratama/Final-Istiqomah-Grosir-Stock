import React, { useState, useEffect } from 'react';
import {
  ChevronRight,
  KeyRound,
  AlertTriangle,
  Volume2,
  VolumeX,
} from 'lucide-react';
import type { FloorId, UserAccount } from '../types/stock';
import { FLOOR_DEFINITIONS } from '../types/stock';
import { StockStorageEngine } from '../services/db';
import { soundEffects } from '../utils/audio';
import { OfflineBadge } from '../components/OfflineBadge';
import { BarcodeScannerModal } from '../components/BarcodeScannerModal';
import { ChangePasswordModal } from '../components/ChangePasswordModal';
import { FloorGlyph, ScannerGlyph, AdminCrestGlyph } from '../components/CustomIcons';

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
  const [isSoundOn, setIsSoundOn] = useState<boolean>(() => soundEffects.isSoundEnabled());

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

    const handleSoundToggled = (e: Event) => {
      const custom = e as CustomEvent<{ enabled: boolean }>;
      setIsSoundOn(custom.detail?.enabled ?? true);
    };

    window.addEventListener('istiqomah_stock_updated', handleStorage);
    window.addEventListener('istiqomah_user_changed', handleUserChanged);
    window.addEventListener('istiqomah_sound_toggled', handleSoundToggled);
    return () => {
      window.removeEventListener('istiqomah_stock_updated', handleStorage);
      window.removeEventListener('istiqomah_user_changed', handleUserChanged);
      window.removeEventListener('istiqomah_sound_toggled', handleSoundToggled);
    };
  }, []);

  const isFahri = Boolean(
    currentUser &&
      (currentUser.username.toLowerCase() === 'fahri' ||
        currentUser.name.toLowerCase() === 'fahri' ||
        currentUser.role === 'ADMIN')
  );

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
    <div className="min-h-screen pb-28 pt-5 px-4 max-w-md mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-extrabold text-stone-900 tracking-tight leading-none">
            Istiqomah Grosir
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-xs text-stone-400">
              {currentUser ? currentUser.name : 'Sistem Stok'}
            </p>
            {currentUser && (
              <button
                onClick={() => setIsPasswordModalOpen(true)}
                className="text-stone-400 hover:text-stone-700 transition-colors"
                title="Ganti Password"
              >
                <KeyRound size={11} />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <OfflineBadge />

          <button
            onClick={() => soundEffects.toggleSound()}
            className="w-9 h-9 rounded-xl flex items-center justify-center border border-stone-200 text-stone-500 hover:text-stone-700 hover:border-stone-300 transition-colors bg-white touch-press"
            title={isSoundOn ? 'Suara Aktif' : 'Suara Mati'}
          >
            {isSoundOn ? <Volume2 size={15} /> : <VolumeX size={15} />}
          </button>

          <button
            onClick={() => {
              soundEffects.playClickSound();
              setIsScannerOpen(true);
            }}
            className="w-9 h-9 rounded-xl flex items-center justify-center bg-stone-900 text-white hover:bg-stone-800 touch-press"
            title="Scan Barcode"
          >
            <ScannerGlyph size={15} />
          </button>
        </div>
      </header>

      {/* Quick Stats */}
      <div className="flex items-center gap-5 mb-6 px-1">
        <div>
          <span className="text-2xl font-extrabold text-stone-900 font-mono leading-none">
            {stats.totalStockQty}
          </span>
          <span className="text-xs text-stone-400 ml-1.5">unit</span>
        </div>
        <div className="w-px h-6 bg-stone-200" />
        <div>
          <span className="text-2xl font-extrabold text-stone-900 font-mono leading-none">
            {stats.totalItemsCount}
          </span>
          <span className="text-xs text-stone-400 ml-1.5">macam</span>
        </div>
      </div>

      {/* Barcode Search Result */}
      {scannedResult && (
        <div className="mb-4 bg-stone-100 rounded-xl p-3.5 anim-slide-up">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-stone-500">
              Hasil Scan: <span className="font-mono text-stone-700">{scannedResult.barcode}</span>
            </span>
            <button
              onClick={() => setScannedResult(null)}
              className="text-stone-400 hover:text-stone-700 text-xs px-1"
            >
              ✕
            </button>
          </div>

          {scannedResult.foundFloorId ? (
            <div className="flex items-center justify-between bg-white p-3 rounded-lg">
              <div>
                <span className="text-sm font-semibold text-stone-900 block">
                  {scannedResult.itemName}
                </span>
                <span className="text-xs text-stone-400">
                  {FLOOR_DEFINITIONS[scannedResult.foundFloorId].name}
                </span>
              </div>
              <button
                onClick={() => handleFloorClick(scannedResult.foundFloorId!)}
                className="px-3 py-1.5 bg-stone-900 text-white rounded-lg text-xs font-semibold touch-press"
              >
                Buka
              </button>
            </div>
          ) : (
            <p className="text-xs text-stone-500 bg-white p-3 rounded-lg">
              Barang tidak ditemukan di lantai 1–4.
            </p>
          )}
        </div>
      )}

      {/* Floor Cards */}
      <div className="space-y-2">
        <h2 className="text-xs font-semibold text-stone-400 px-0.5 mb-1">
          Daftar Lantai
        </h2>

        {accessibleFloors.map((f) => (
          <div
            key={f.floorId}
            onClick={() => handleFloorClick(f.floorId)}
            className="bg-white rounded-xl p-4 border border-stone-150 hover:border-stone-300 cursor-pointer transition-all flex items-center justify-between touch-press group"
            style={{ borderColor: '#e7e5e4' }}
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-stone-100 text-stone-600 flex items-center justify-center shrink-0">
                <FloorGlyph floorId={f.floorId} size={18} />
              </div>

              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-stone-900 group-hover:text-stone-900">
                  {f.name}
                  <span className="text-stone-400 font-normal ml-1.5 text-xs">
                    {f.subtitle}
                  </span>
                </h3>

                <div className="flex items-center gap-2.5 mt-0.5 text-xs text-stone-400">
                  <span className="font-mono font-medium text-stone-600">
                    {f.stockQty}
                  </span>
                  <span>·</span>
                  <span>{f.itemCount} macam</span>
                  {f.lowStock > 0 && (
                    <>
                      <span>·</span>
                      <span className="text-amber-700 font-medium flex items-center gap-0.5">
                        <AlertTriangle size={10} />
                        {f.lowStock}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <ChevronRight size={16} className="text-stone-300 group-hover:text-stone-500 shrink-0 transition-colors" />
          </div>
        ))}
      </div>

      {/* Admin Entry */}
      {isFahri && (
        <div className="mt-3">
          <div
            onClick={() => {
              soundEffects.playClickSound();
              onOpenAdmin();
            }}
            className="bg-stone-900 text-white rounded-xl p-4 hover:bg-stone-800 cursor-pointer transition-colors flex items-center justify-between touch-press"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-stone-800 flex items-center justify-center shrink-0">
                <AdminCrestGlyph size={18} />
              </div>
              <div>
                <h3 className="text-sm font-semibold">Dashboard Admin</h3>
                <p className="text-xs text-stone-400 mt-0.5">
                  Kelola staf, cadangan data & laporan
                </p>
              </div>
            </div>
            <ChevronRight size={16} className="text-stone-500" />
          </div>
        </div>
      )}

      {/* Universal Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleUniversalScan}
      />

      {/* Password Modal */}
      {currentUser && (
        <ChangePasswordModal
          isOpen={isPasswordModalOpen}
          currentUser={currentUser}
          onClose={() => setIsPasswordModalOpen(false)}
          onSuccess={() => refreshData()}
        />
      )}
    </div>
  );
};
