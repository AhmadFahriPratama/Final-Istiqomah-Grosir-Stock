import React, { useState, useEffect } from 'react';
import {
  Users,
  History,
  Layers,
  Send,
  Database,
  FileText,
  AlertTriangle,
  Volume2,
  VolumeX,
  ShoppingCart,
  Tag,
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
import { RestockPlannerModal } from '../components/RestockPlannerModal';
import { BarcodeLabelPrinterModal } from '../components/BarcodeLabelPrinterModal';
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
  const [isRestockPlannerOpen, setIsRestockPlannerOpen] = useState(false);
  const [isBarcodeLabelOpen, setIsBarcodeLabelOpen] = useState(false);

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

  // Access Denied guard
  if (!isFahri) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mb-3">
          <AlertTriangle size={24} />
        </div>
        <h2 className="text-sm font-bold text-stone-900">Akses Dibatasi</h2>
        <p className="text-xs text-stone-400 max-w-xs mt-1">
          Dashboard Admin khusus untuk akun Administrator.
        </p>
      </div>
    );
  }

  const menuItems = [
    {
      icon: ShoppingCart,
      title: 'Rencana Kulakan',
      meta: 'Restock PO',
      onClick: () => setIsRestockPlannerOpen(true),
    },
    {
      icon: Tag,
      title: 'Cetak Label Barcode',
      meta: 'Stiker & Rak',
      onClick: () => setIsBarcodeLabelOpen(true),
    },
    {
      icon: Users,
      title: 'Kelola Staf',
      meta: `${usersList.length} akun`,
      onClick: () => setIsUserManageOpen(true),
    },
    {
      icon: History,
      title: 'Aktivitas Staf',
      meta: `${mutationsCount} log`,
      onClick: () => setIsUserHistoryOpen(true),
    },
    {
      icon: Layers,
      title: 'Ringkasan Lantai',
      meta: 'Lt 1–4',
      onClick: () => setIsFloorSummaryOpen(true),
    },
    {
      icon: Send,
      title: 'Backup Telegram',
      meta: settings.telegram.autoBackup ? 'Aktif' : 'Manual',
      onClick: () => setIsTelegramOpen(true),
    },
    {
      icon: Database,
      title: 'Master Database',
      meta: 'JSON',
      onClick: () => setIsDatabaseOpen(true),
    },
    {
      icon: FileText,
      title: 'Laporan Global',
      meta: '4 Lantai',
      onClick: handleOpenMasterReport,
    },
  ];

  return (
    <div className="min-h-screen pb-28 pt-5 px-4 max-w-md mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-stone-900 text-white flex items-center justify-center shrink-0">
            <AdminCrestGlyph size={18} />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-stone-900 leading-tight">
              Dashboard Admin
            </h1>
            <span className="text-xs text-stone-400">
              Pengaturan & Master Data
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => soundEffects.toggleSound()}
            className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-colors touch-press ${
              isSoundOn
                ? 'bg-white border-stone-200 text-stone-500'
                : 'bg-stone-100 border-stone-200 text-stone-300'
            }`}
          >
            {isSoundOn ? <Volume2 size={14} /> : <VolumeX size={14} />}
          </button>

          <button
            onClick={handleOpenMasterReport}
            className="px-3 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 touch-press"
          >
            <FileText size={13} /> Laporan
          </button>
        </div>
      </header>

      {/* Quick Stats */}
      <div className="flex items-center gap-5 mb-6 px-1">
        <div>
          <span className="text-xl font-extrabold text-stone-900 font-mono leading-none">
            {stats.totalStockQty}
          </span>
          <span className="text-xs text-stone-400 ml-1">unit</span>
        </div>
        <div className="w-px h-5 bg-stone-200" />
        <div>
          <span className="text-xl font-extrabold text-stone-900 font-mono leading-none">
            {stats.totalItemsCount}
          </span>
          <span className="text-xs text-stone-400 ml-1">macam</span>
        </div>
        <div className="w-px h-5 bg-stone-200" />
        <div>
          <span className="text-xl font-extrabold text-stone-900 font-mono leading-none">
            {usersList.length}
          </span>
          <span className="text-xs text-stone-400 ml-1">staf</span>
        </div>
      </div>

      {/* Menu Grid */}
      <div>
        <h2 className="text-xs font-semibold text-stone-400 mb-2 px-0.5">
          Menu Kontrol
        </h2>

        <div className="grid grid-cols-2 gap-2">
          {menuItems.map((item) => (
            <button
              key={item.title}
              type="button"
              onClick={() => {
                soundEffects.playClickSound();
                item.onClick();
              }}
              className="p-3.5 rounded-xl bg-white border border-stone-200 hover:border-stone-300 text-left transition-colors flex flex-col justify-between min-h-[88px] touch-press"
            >
              <div className="flex items-center justify-between w-full mb-2">
                <div className="w-8 h-8 rounded-lg bg-stone-100 text-stone-600 flex items-center justify-center">
                  <item.icon size={15} />
                </div>
                <span className="text-[10px] font-medium text-stone-400 font-mono">
                  {item.meta}
                </span>
              </div>
              <div>
                <h4 className="text-xs font-bold text-stone-900 leading-tight">
                  {item.title}
                </h4>
              </div>
            </button>
          ))}
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

      <RestockPlannerModal
        isOpen={isRestockPlannerOpen}
        onClose={() => setIsRestockPlannerOpen(false)}
      />

      <BarcodeLabelPrinterModal
        isOpen={isBarcodeLabelOpen}
        onClose={() => setIsBarcodeLabelOpen(false)}
      />
    </div>
  );
};
