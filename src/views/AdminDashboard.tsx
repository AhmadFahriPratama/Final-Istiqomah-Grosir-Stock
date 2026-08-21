import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Users,
  History,
  Layers,
  Send,
  Database,
  FileText,
  ChevronRight,
  AlertTriangle,
  Package,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import type { FloorId, AdminSettings, UserAccount } from '../types/stock';
import { StockStorageEngine } from '../services/db';
import { ReportService } from '../services/reports';
import { soundEffects } from '../utils/audio';
import { TextReportModal } from '../components/TextReportModal';
import { UserManagementModal } from '../components/UserManagementModal';
import { UserHistoryModal } from '../components/UserHistoryModal';
import { TelegramSettingsModal } from '../components/TelegramSettingsModal';
import { MasterDatabaseModal } from '../components/MasterDatabaseModal';
import { FloorSummaryModal } from '../components/FloorSummaryModal';

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

  // Modal Control States
  const [isUserManageOpen, setIsUserManageOpen] = useState(false);
  const [isUserHistoryOpen, setIsUserHistoryOpen] = useState(false);
  const [isFloorSummaryOpen, setIsFloorSummaryOpen] = useState(false);
  const [isTelegramOpen, setIsTelegramOpen] = useState(false);
  const [isDatabaseOpen, setIsDatabaseOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [masterReportText, setMasterReportText] = useState('');

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
    window.addEventListener('istiqomah_stock_updated', handleStorageEvent);
    return () => window.removeEventListener('istiqomah_stock_updated', handleStorageEvent);
  }, []);

  const handleOpenMasterReport = () => {
    soundEffects.playClickSound();
    const text = ReportService.generateMasterReport();
    setMasterReportText(text);
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
          <div className="w-9 h-9 rounded-2xl bg-black text-white flex items-center justify-center font-bold shadow-xs">
            <ShieldCheck size={18} />
          </div>
          <div>
            <h1 className="text-sm font-extrabold text-black leading-tight">
              Pusat Kontrol Fahri
            </h1>
            <span className="text-[10px] text-zinc-400 font-medium block">
              Super Admin Istiqomah Grosir Stock
            </span>
          </div>
        </div>

        <button
          onClick={handleOpenMasterReport}
          className="px-3 py-1.5 bg-black hover:bg-zinc-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 touch-press shadow-xs"
        >
          <FileText size={13} /> Laporan
        </button>
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
              Petugas Toko
            </span>
            <span className="text-base font-extrabold text-black font-mono leading-none">
              {usersList.length} <span className="text-[10px] font-normal text-zinc-500 font-sans">staf</span>
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

      {/* Main Modular Admin Features Menu */}
      <div className="space-y-2 pt-1">
        <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider px-1 block">
          Menu Fitur Administrator
        </span>

        <div className="space-y-2">
          {/* 1. User Manage Button */}
          <div
            onClick={() => {
              soundEffects.playClickSound();
              setIsUserManageOpen(true);
            }}
            className="p-4 rounded-2xl bg-white hover:bg-zinc-50 border border-zinc-200 hover:border-black cursor-pointer transition-all flex items-center justify-between touch-press shadow-xs"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center shrink-0">
                <Users size={18} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-black">Manajemen User</h3>
                  <span className="text-[9px] font-bold bg-zinc-100 text-zinc-700 px-1.5 py-0.5 rounded border border-zinc-200">
                    {usersList.length} User
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Tambah staf baru, ganti password & atur akses lantai
                </p>
              </div>
            </div>
            <ChevronRight size={17} className="text-zinc-400 shrink-0" />
          </div>

          {/* 2. History User Button (NEW FEATURE) */}
          <div
            onClick={() => {
              soundEffects.playClickSound();
              setIsUserHistoryOpen(true);
            }}
            className="p-4 rounded-2xl bg-white hover:bg-zinc-50 border border-zinc-200 hover:border-black cursor-pointer transition-all flex items-center justify-between touch-press shadow-xs"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center shrink-0">
                <History size={18} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-black">Riwayat Perubahan User</h3>
                  <span className="text-[9px] font-bold bg-black text-white px-1.5 py-0.5 rounded border border-black">
                    Live Audit
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Lihat log mutasi & aktivitas koreksi stok oleh setiap user
                </p>
              </div>
            </div>
            <ChevronRight size={17} className="text-zinc-400 shrink-0" />
          </div>

          {/* 3. Ringkasan Lantai Button */}
          <div
            onClick={() => {
              soundEffects.playClickSound();
              setIsFloorSummaryOpen(true);
            }}
            className="p-4 rounded-2xl bg-white hover:bg-zinc-50 border border-zinc-200 hover:border-black cursor-pointer transition-all flex items-center justify-between touch-press shadow-xs"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center shrink-0">
                <Layers size={18} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-black">Ringkasan 4 Lantai</h3>
                  <span className="text-[9px] font-bold bg-zinc-100 text-zinc-700 px-1.5 py-0.5 rounded border border-zinc-200">
                    Lt 1 - 4
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Rincian fisik & macam barang di setiap lantai kerja
                </p>
              </div>
            </div>
            <ChevronRight size={17} className="text-zinc-400 shrink-0" />
          </div>

          {/* 4. Telegram & Auto-Backup Button */}
          <div
            onClick={() => {
              soundEffects.playClickSound();
              setIsTelegramOpen(true);
            }}
            className="p-4 rounded-2xl bg-white hover:bg-zinc-50 border border-zinc-200 hover:border-black cursor-pointer transition-all flex items-center justify-between touch-press shadow-xs"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center shrink-0">
                <Send size={17} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-black">Telegram & Auto-Backup</h3>
                  {settings.telegram.autoBackup ? (
                    <span className="text-[9px] font-bold bg-black text-white px-1.5 py-0.5 rounded border border-black flex items-center gap-0.5">
                      <CheckCircle2 size={9} /> Aktif
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded border border-zinc-200">
                      Nonaktif
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Konfigurasi bot token, chat ID & kirim backup instan
                </p>
              </div>
            </div>
            <ChevronRight size={17} className="text-zinc-400 shrink-0" />
          </div>

          {/* 5. Master Database (JSON) Button */}
          <div
            onClick={() => {
              soundEffects.playClickSound();
              setIsDatabaseOpen(true);
            }}
            className="p-4 rounded-2xl bg-white hover:bg-zinc-50 border border-zinc-200 hover:border-black cursor-pointer transition-all flex items-center justify-between touch-press shadow-xs"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center shrink-0">
                <Database size={18} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-black">Master Database (JSON)</h3>
                  <span className="text-[9px] font-bold bg-zinc-100 text-zinc-700 px-1.5 py-0.5 rounded border border-zinc-200">
                    JSON v2.0
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Unduh cadangan data lengkap, pulihkan JSON, atau reset
                </p>
              </div>
            </div>
            <ChevronRight size={17} className="text-zinc-400 shrink-0" />
          </div>
        </div>
      </div>

      {/* Sub-Modals for each feature */}
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
        onSettingsUpdated={(up) => {
          setSettings(up);
          refreshAll();
        }}
      />

      <MasterDatabaseModal
        isOpen={isDatabaseOpen}
        onClose={() => setIsDatabaseOpen(false)}
        onDataResetOrImported={refreshAll}
      />

      <TextReportModal
        isOpen={isReportModalOpen}
        title="Laporan Master Seluruh Lantai"
        reportText={masterReportText}
        onClose={() => setIsReportModalOpen(false)}
      />
    </div>
  );
};
