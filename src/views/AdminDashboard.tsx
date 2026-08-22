import React, { useState, useEffect } from 'react';
import {
  Users,
  History,
  Layers,
  Send,
  Database,
  FileText,
  AlertTriangle,
  Package,
  Activity,
  Volume2,
  VolumeX,
} from 'lucide-react';
import type { FloorId, AdminSettings, UserAccount } from '../types/stock';
import { StockStorageEngine } from '../services/db';
import { soundEffects } from '../utils/audio';
import { UserManagementModal } from '../components/UserManagementModal';
import { UserHistoryModal } from '../components/UserHistoryModal';
import { TelegramSettingsModal } from '../components/TelegramSettingsModal';
import { MasterDatabaseModal } from '../components/MasterDatabaseModal';
import { FloorSummaryModal } from '../components/FloorSummaryModal';
import { ReportGeneratorModal } from '../components/ReportGeneratorModal';
import { AdminCrestGlyph } from '../components/CustomIcons';

interface AdminDashboardProps {
  onSelectFloor: (floorId: FloorId) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onSelectFloor }) => {
  const currentUser = StockStorageEngine.getCurrentUser();
  const isFahri = Boolean(
    currentUser &&
      (currentUser.username.toLowerCase() === 'fahri' ||
        currentUser.name.toLowerCase() === 'fahri' ||
        currentUser.role === 'ADMIN')
  );

  const [settings, setSettings] = useState<AdminSettings>(() =>
    StockStorageEngine.getAdminSettings()
  );
  const [stats, setStats] = useState(() => StockStorageEngine.getAggregateStats());
  const [usersList, setUsersList] = useState<UserAccount[]>(settings.users || []);
  const [mutationsCount, setMutationsCount] = useState<number>(() =>
    StockStorageEngine.getAllMutations().length
  );
  const [isSoundOn, setIsSoundOn] = useState<boolean>(() => soundEffects.isSoundEnabled());

  // Modal Control States
  const [isUserManageOpen, setIsUserManageOpen] = useState(false);
  const [isUserHistoryOpen, setIsUserHistoryOpen] = useState(false);
  const [isFloorSummaryOpen, setIsFloorSummaryOpen] = useState(false);
  const [isTelegramOpen, setIsTelegramOpen] = useState(false);
  const [isDatabaseOpen, setIsDatabaseOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const refreshAll = () => {
    const s = StockStorageEngine.getAdminSettings();
    setSettings(s);
    setUsersList(s.users || []);
    setStats(StockStorageEngine.getAggregateStats());
    setMutationsCount(StockStorageEngine.getAllMutations().length);
  };

  useEffect(() => {
    refreshAll();
    const handleStorageEvent = () => refreshAll();
    const handleSoundToggled = (e: Event) => {
      const custom = e as CustomEvent<{ enabled: boolean }>;
      setIsSoundOn(custom.detail?.enabled ?? true);
    };

    window.addEventListener('istiqomah_stock_updated', handleStorageEvent);
    window.addEventListener('istiqomah_sound_toggled', handleSoundToggled);
    return () => {
      window.removeEventListener('istiqomah_stock_updated', handleStorageEvent);
      window.removeEventListener('istiqomah_sound_toggled', handleSoundToggled);
    };
  }, []);

  const handleOpenMasterReport = () => {
    soundEffects.playClickSound();
    setIsReportModalOpen(true);
  };

  // If not Fahri / Admin, show Access Denied guard
  if (!isFahri) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-black text-white flex items-center justify-center mb-4 shadow-sm">
          <AlertTriangle size={26} />
        </div>
        <h2 className="text-base font-bold text-black">Akses Dibatasi</h2>
        <p className="text-xs text-zinc-500 max-w-xs mt-1 mb-5">
          Halaman Dashboard Utama khusus untuk akun <strong>Fahri</strong> (Administrator).
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-28 pt-4 px-3.5 max-w-md mx-auto space-y-3.5">
      {/* Header Bar */}
      <header className="flex items-center justify-between py-1">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center shadow-xs">
            <AdminCrestGlyph size={20} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm font-extrabold text-black leading-tight">
                Dashboard Admin
              </h1>
              <span className="text-[9px] font-extrabold bg-zinc-900 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 rounded-md font-mono shadow-2xs">
                v3.0.0
              </span>
            </div>
            <span className="text-[10px] text-zinc-400 font-medium block mt-0.5">
              Pengaturan & Master Data
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
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
            onClick={handleOpenMasterReport}
            className="px-3 py-1.5 bg-black hover:bg-zinc-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 touch-press shadow-xs"
          >
            <FileText size={13} /> Laporan
          </button>
        </div>
      </header>

      {/* Aggregate KPI Grid Cards */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-white p-3 rounded-2xl border border-zinc-200 shadow-xs flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-zinc-100 text-black flex items-center justify-center shrink-0">
            <Package size={15} />
          </div>
          <div>
            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">
              Total Unit
            </span>
            <span className="text-base font-extrabold text-black font-mono leading-none">
              {stats.totalStockQty} <span className="text-[10px] font-normal text-zinc-500 font-sans">unit</span>
            </span>
          </div>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-zinc-200 shadow-xs flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-zinc-100 text-black flex items-center justify-center shrink-0">
            <Layers size={15} />
          </div>
          <div>
            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">
              Total Macam
            </span>
            <span className="text-base font-extrabold text-black font-mono leading-none">
              {stats.totalItemsCount} <span className="text-[10px] font-normal text-zinc-500 font-sans">item</span>
            </span>
          </div>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-zinc-200 shadow-xs flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-zinc-100 text-black flex items-center justify-center shrink-0">
            <Users size={15} />
          </div>
          <div>
            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">
              Petugas Staf
            </span>
            <span className="text-base font-extrabold text-black font-mono leading-none">
              {usersList.length} <span className="text-[10px] font-normal text-zinc-500 font-sans">akun</span>
            </span>
          </div>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-zinc-200 shadow-xs flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-zinc-100 text-black flex items-center justify-center shrink-0">
            <Activity size={15} />
          </div>
          <div>
            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">
              Log Mutasi
            </span>
            <span className="text-base font-extrabold text-black font-mono leading-none">
              {mutationsCount} <span className="text-[10px] font-normal text-zinc-500 font-sans">log</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Modular Admin Features: 2-Column Square Grid Cards */}
      <div className="space-y-2 pt-1">
        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider px-1 block">
          Menu Kontrol
        </span>

        <div className="grid grid-cols-2 gap-2.5">
          {/* 1. Kelola Akun Staf */}
          <button
            type="button"
            onClick={() => {
              soundEffects.playClickSound();
              setIsUserManageOpen(true);
            }}
            className="p-3.5 rounded-2xl bg-white hover:bg-zinc-50 border border-zinc-200 hover:border-black text-left cursor-pointer transition-all flex flex-col justify-between min-h-[110px] touch-press shadow-xs group"
          >
            <div className="flex items-center justify-between w-full">
              <div className="w-9 h-9 rounded-xl bg-black text-white flex items-center justify-center shadow-xs">
                <Users size={16} />
              </div>
              <span className="text-[9px] font-extrabold bg-zinc-100 text-zinc-700 px-1.5 py-0.5 rounded-md font-mono">
                {usersList.length} Akun
              </span>
            </div>
            <div>
              <h4 className="text-xs font-bold text-black group-hover:text-black">
                Kelola Staf
              </h4>
              <p className="text-[10px] text-zinc-400 font-medium mt-0.5">
                Akun & hak akses
              </p>
            </div>
          </button>

          {/* 2. Audit Aktivitas */}
          <button
            type="button"
            onClick={() => {
              soundEffects.playClickSound();
              setIsUserHistoryOpen(true);
            }}
            className="p-3.5 rounded-2xl bg-white hover:bg-zinc-50 border border-zinc-200 hover:border-black text-left cursor-pointer transition-all flex flex-col justify-between min-h-[110px] touch-press shadow-xs group"
          >
            <div className="flex items-center justify-between w-full">
              <div className="w-9 h-9 rounded-xl bg-black text-white flex items-center justify-center shadow-xs">
                <History size={16} />
              </div>
              <span className="text-[9px] font-extrabold bg-zinc-100 text-zinc-700 px-1.5 py-0.5 rounded-md font-mono">
                {mutationsCount} Log
              </span>
            </div>
            <div>
              <h4 className="text-xs font-bold text-black group-hover:text-black">
                Aktivitas Staf
              </h4>
              <p className="text-[10px] text-zinc-400 font-medium mt-0.5">
                Audit mutasi & aksi
              </p>
            </div>
          </button>

          {/* 3. Ringkasan Lantai */}
          <button
            type="button"
            onClick={() => {
              soundEffects.playClickSound();
              setIsFloorSummaryOpen(true);
            }}
            className="p-3.5 rounded-2xl bg-white hover:bg-zinc-50 border border-zinc-200 hover:border-black text-left cursor-pointer transition-all flex flex-col justify-between min-h-[110px] touch-press shadow-xs group"
          >
            <div className="flex items-center justify-between w-full">
              <div className="w-9 h-9 rounded-xl bg-black text-white flex items-center justify-center shadow-xs">
                <Layers size={16} />
              </div>
              <span className="text-[9px] font-extrabold bg-zinc-100 text-zinc-700 px-1.5 py-0.5 rounded-md">
                Lt 1-4
              </span>
            </div>
            <div>
              <h4 className="text-xs font-bold text-black group-hover:text-black">
                Ringkasan Lantai
              </h4>
              <p className="text-[10px] text-zinc-400 font-medium mt-0.5">
                Rekap stok per lantai
              </p>
            </div>
          </button>

          {/* 4. Cadangan Telegram */}
          <button
            type="button"
            onClick={() => {
              soundEffects.playClickSound();
              setIsTelegramOpen(true);
            }}
            className="p-3.5 rounded-2xl bg-white hover:bg-zinc-50 border border-zinc-200 hover:border-black text-left cursor-pointer transition-all flex flex-col justify-between min-h-[110px] touch-press shadow-xs group"
          >
            <div className="flex items-center justify-between w-full">
              <div className="w-9 h-9 rounded-xl bg-black text-white flex items-center justify-center shadow-xs">
                <Send size={15} />
              </div>
              <span
                className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md ${
                  settings.telegram.autoBackup
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-zinc-100 text-zinc-500'
                }`}
              >
                {settings.telegram.autoBackup ? 'Auto Aktif' : 'Manual'}
              </span>
            </div>
            <div>
              <h4 className="text-xs font-bold text-black group-hover:text-black">
                Backup Telegram
              </h4>
              <p className="text-[10px] text-zinc-400 font-medium mt-0.5">
                Cloud bot cadangan
              </p>
            </div>
          </button>

          {/* 5. Master Database */}
          <button
            type="button"
            onClick={() => {
              soundEffects.playClickSound();
              setIsDatabaseOpen(true);
            }}
            className="p-3.5 rounded-2xl bg-white hover:bg-zinc-50 border border-zinc-200 hover:border-black text-left cursor-pointer transition-all flex flex-col justify-between min-h-[110px] touch-press shadow-xs group"
          >
            <div className="flex items-center justify-between w-full">
              <div className="w-9 h-9 rounded-xl bg-black text-white flex items-center justify-center shadow-xs">
                <Database size={16} />
              </div>
              <span className="text-[9px] font-extrabold bg-zinc-100 text-zinc-700 px-1.5 py-0.5 rounded-md">
                JSON
              </span>
            </div>
            <div>
              <h4 className="text-xs font-bold text-black group-hover:text-black">
                Master Database
              </h4>
              <p className="text-[10px] text-zinc-400 font-medium mt-0.5">
                Ekspor, impor & reset
              </p>
            </div>
          </button>

          {/* 6. Laporan Lengkap */}
          <button
            type="button"
            onClick={handleOpenMasterReport}
            className="p-3.5 rounded-2xl bg-white hover:bg-zinc-50 border border-zinc-200 hover:border-black text-left cursor-pointer transition-all flex flex-col justify-between min-h-[110px] touch-press shadow-xs group"
          >
            <div className="flex items-center justify-between w-full">
              <div className="w-9 h-9 rounded-xl bg-black text-white flex items-center justify-center shadow-xs">
                <FileText size={16} />
              </div>
              <span className="text-[9px] font-extrabold bg-zinc-100 text-zinc-700 px-1.5 py-0.5 rounded-md">
                Teks / WA
              </span>
            </div>
            <div>
              <h4 className="text-xs font-bold text-black group-hover:text-black">
                Laporan Global
              </h4>
              <p className="text-[10px] text-zinc-400 font-medium mt-0.5">
                Rekap teks 4 lantai
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Admin Modals */}
      <UserManagementModal
        isOpen={isUserManageOpen}
        onClose={() => setIsUserManageOpen(false)}
        users={usersList}
        onUsersUpdated={refreshAll}
      />

      <UserHistoryModal
        isOpen={isUserHistoryOpen}
        onClose={() => setIsUserHistoryOpen(false)}
        users={usersList}
      />

      <FloorSummaryModal
        isOpen={isFloorSummaryOpen}
        onClose={() => setIsFloorSummaryOpen(false)}
        onSelectFloor={onSelectFloor}
      />

      <TelegramSettingsModal
        isOpen={isTelegramOpen}
        onClose={() => setIsTelegramOpen(false)}
        settings={settings}
        onSettingsUpdated={() => refreshAll()}
      />

      <MasterDatabaseModal
        isOpen={isDatabaseOpen}
        onClose={() => setIsDatabaseOpen(false)}
        onDataResetOrImported={refreshAll}
      />

      <ReportGeneratorModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />
    </div>
  );
};
