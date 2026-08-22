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
    <div className="min-h-screen pb-28 pt-4 px-3.5 max-w-md mx-auto space-y-3.5">
      {/* Header */}
      <header className="flex items-center justify-between py-1">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-black text-black tracking-tight leading-none">
              Istiqomah Grosir
            </h1>
            <span className="text-[9px] font-extrabold bg-zinc-900 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 rounded-md font-mono shadow-2xs">
              v3.0.0
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <p className="text-[11px] text-zinc-500 font-medium">
              {currentUser ? `Petugas: ${currentUser.name}` : 'Sistem Stok'}
            </p>
            {currentUser && (
              <button
                onClick={() => setIsPasswordModalOpen(true)}
                className="text-[10px] font-semibold text-zinc-400 hover:text-black flex items-center gap-0.5 ml-1 transition-colors"
                title="Ganti Password"
              >
                <KeyRound size={9} />
                <span>Ganti Password</span>
              </button>
            )}
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
              setIsScannerOpen(true);
            }}
            className="p-2 rounded-xl bg-black text-white hover:bg-zinc-800 touch-press shadow-xs flex items-center justify-center"
            title="Scan Barcode Cepat"
          >
            <ScannerGlyph size={16} />
          </button>
        </div>
      </header>

      {/* Global Quick Stats */}
      <div className="bg-white rounded-2xl p-4 border border-zinc-200 shadow-xs grid grid-cols-2 gap-2">
        <div>
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
            Total Unit
          </span>
          <span className="text-2xl font-black text-black mt-0.5 block font-mono">
            {stats.totalStockQty} <span className="text-xs font-normal text-zinc-400 font-sans">unit</span>
          </span>
        </div>

        <div className="text-right">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
            Total Macam
          </span>
          <span className="text-2xl font-black text-black mt-0.5 block font-mono">
            {stats.totalItemsCount} <span className="text-xs font-normal text-zinc-400 font-sans">item</span>
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
            <p className="text-xs text-zinc-600 bg-white p-2.5 rounded-xl border border-zinc-200">
              Barang tidak ditemukan di lantai 1 s/d 4.
            </p>
          )}
        </div>
      )}

      {/* Floor Cards List */}
      <div className="space-y-2">
        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider px-1 block">
          Daftar Lantai
        </span>

        <div className="space-y-2">
          {accessibleFloors.map((f) => (
            <div
              key={f.floorId}
              onClick={() => handleFloorClick(f.floorId)}
              className="bg-white rounded-2xl p-3.5 border border-zinc-200 hover:border-black cursor-pointer transition-all flex items-center justify-between shadow-xs touch-press group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-black text-white flex items-center justify-center shrink-0 shadow-xs">
                  <FloorGlyph floorId={f.floorId} size={20} />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-xs font-bold text-black group-hover:text-black">
                      {f.name}
                    </h3>
                    <span className="text-[10px] text-zinc-400 font-medium">
                      • {f.subtitle}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-0.5 text-[11px] text-zinc-600">
                    <span className="font-bold text-black font-mono">
                      {f.stockQty} unit
                    </span>
                    <span className="text-zinc-300">•</span>
                    <span>{f.itemCount} macam</span>
                    {f.lowStock > 0 && (
                      <>
                        <span className="text-zinc-300">•</span>
                        <span className="text-amber-800 bg-amber-100/90 px-1.5 py-0.2 rounded text-[10px] font-bold flex items-center gap-0.5">
                          <AlertTriangle size={9} /> {f.lowStock} tipis
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <ChevronRight size={16} className="text-zinc-400 group-hover:text-black shrink-0" />
            </div>
          ))}
        </div>
      </div>

      {/* Admin Quick Entry Card (For Fahri) */}
      {isFahri && (
        <div className="pt-1">
          <div
            onClick={() => {
              soundEffects.playClickSound();
              onOpenAdmin();
            }}
            className="bg-zinc-950 text-white rounded-2xl p-3.5 border border-zinc-800 hover:border-zinc-600 cursor-pointer transition-all flex items-center justify-between shadow-md touch-press"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-zinc-800 text-white flex items-center justify-center shrink-0">
                <AdminCrestGlyph size={18} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white">Dashboard Admin</h3>
                <p className="text-[10px] text-zinc-400 font-medium">
                  Kelola staf, cadangan data, & laporan master
                </p>
              </div>
            </div>
            <ChevronRight size={16} className="text-zinc-400" />
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
