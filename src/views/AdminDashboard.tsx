import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  Send,
  Download,
  Upload,
  FileText,
  Database,
  CheckCircle,
  Users,
  Plus,
  Trash2,
  Edit2,
  AlertTriangle,
  ShoppingBag,
  Shirt,
  Armchair,
  Package,
} from 'lucide-react';
import type { FloorId, BackupExportData, AdminSettings, UserAccount } from '../types/stock';
import { FLOOR_DEFINITIONS } from '../types/stock';
import { StockStorageEngine } from '../services/db';
import { TelegramService } from '../services/telegram';
import { ReportService } from '../services/reports';
import { soundEffects } from '../utils/audio';
import { TextReportModal } from '../components/TextReportModal';

interface AdminDashboardProps {
  onSelectFloor: (floorId: FloorId) => void;
}

const FLOOR_ICONS: Record<FloorId, typeof ShoppingBag> = {
  '1': ShoppingBag,
  '2': Shirt,
  '3': Armchair,
  '4': Package,
};

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onSelectFloor }) => {
  const currentUser = StockStorageEngine.getCurrentUser();
  const isFahri =
    Boolean(
      currentUser &&
        (currentUser.username.toLowerCase() === 'fahri' ||
          currentUser.name.toLowerCase() === 'fahri' ||
          currentUser.role === 'ADMIN')
    );

  const [settings, setSettings] = useState<AdminSettings>(() =>
    StockStorageEngine.getAdminSettings()
  );
  const [stats, setStats] = useState(() => StockStorageEngine.getAggregateStats());

  // Telegram Config
  const [botToken, setBotToken] = useState(settings.telegram.botToken || '');
  const [chatId, setChatId] = useState(settings.telegram.chatId || '');
  const [autoBackup, setAutoBackup] = useState(settings.telegram.autoBackup || false);
  const [telegramStatus, setTelegramStatus] = useState<string | null>(null);
  const [isTestingTelegram, setIsTestingTelegram] = useState(false);
  const [isSendingBackup, setIsSendingBackup] = useState(false);

  // User Management State
  const [usersList, setUsersList] = useState<UserAccount[]>(settings.users || []);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState<'ADMIN' | 'STAFF'>('STAFF');
  const [formAssignedFloors, setFormAssignedFloors] = useState<FloorId[]>(['1']);
  const [userToast, setUserToast] = useState<string | null>(null);

  // Report Modal
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [masterReportText, setMasterReportText] = useState('');

  // Import Ref
  const fullImportRef = useRef<HTMLInputElement | null>(null);
  const [importStatus, setImportStatus] = useState<{ success: boolean; message: string } | null>(
    null
  );

  const refreshAll = () => {
    const s = StockStorageEngine.getAdminSettings();
    setSettings(s);
    setUsersList(s.users || []);
    setStats(StockStorageEngine.getAggregateStats());
  };

  useEffect(() => {
    refreshAll();
    const handleStorageEvent = () => refreshAll();
    window.addEventListener('istiqomah_stock_updated', handleStorageEvent);
    return () => window.removeEventListener('istiqomah_stock_updated', handleStorageEvent);
  }, []);

  // Save Telegram Settings
  const handleSaveTelegram = () => {
    soundEffects.playClickSound();
    const updated: AdminSettings = {
      ...settings,
      telegram: {
        ...settings.telegram,
        botToken: botToken.trim(),
        chatId: chatId.trim(),
        autoBackup,
      },
    };
    StockStorageEngine.saveAdminSettings(updated);
    setSettings(updated);
    setTelegramStatus('Pengaturan Telegram berhasil disimpan.');
    setTimeout(() => setTelegramStatus(null), 3000);
  };

  const handleTestTelegram = async () => {
    soundEffects.playClickSound();
    setIsTestingTelegram(true);
    setTelegramStatus('Menguji koneksi...');
    try {
      const res = await TelegramService.testConnection(botToken, chatId);
      setTelegramStatus(res.message);
      if (res.success) {
        soundEffects.playUnlockSound();
      }
    } catch (e) {
      setTelegramStatus('Error pengujian: ' + String(e));
    } finally {
      setIsTestingTelegram(false);
    }
  };

  const handleSendFullTelegramBackup = async () => {
    soundEffects.playClickSound();
    setIsSendingBackup(true);
    setTelegramStatus('Mengirim database...');
    try {
      const backupData = StockStorageEngine.exportAllFloors();
      const res = await TelegramService.sendBackup(backupData);
      setTelegramStatus(res.message);
      if (res.success) {
        soundEffects.playBackupSent();
      }
    } catch (e) {
      setTelegramStatus('Gagal kirim: ' + String(e));
    } finally {
      setIsSendingBackup(false);
    }
  };

  const handleDownloadAllJSON = () => {
    soundEffects.playClickSound();
    const backup = StockStorageEngine.exportAllFloors();
    const dataStr =
      'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backup, null, 2));
    const downloadAnchor = document.createElement('a');
    const filename = `IstiqomahStock_FULL_BACKUP_${new Date().toISOString().slice(0, 10)}.json`;
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', filename);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    soundEffects.playBackupSent();
  };

  const handleFullFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed: BackupExportData = JSON.parse(content);
        const result = StockStorageEngine.importData(parsed, undefined, 'REPLACE');
        setImportStatus(result);
        if (result.success) {
          soundEffects.playBackupSent();
          refreshAll();
        }
      } catch (err) {
        setImportStatus({
          success: false,
          message: 'Format file tidak sesuai: ' + String(err),
        });
      }
    };
    reader.readAsText(file);
    if (fullImportRef.current) fullImportRef.current.value = '';
  };

  // Staff Account CRUD Handlers
  const handleStartAddUser = () => {
    soundEffects.playClickSound();
    setEditingUserId(null);
    setFormName('');
    setFormUsername('');
    setFormPassword('');
    setFormRole('STAFF');
    setFormAssignedFloors(['1']);
    setIsAddingUser(true);
  };

  const handleStartEditUser = (u: UserAccount) => {
    soundEffects.playClickSound();
    setEditingUserId(u.id);
    setFormName(u.name);
    setFormUsername(u.username);
    setFormPassword(u.password);
    setFormRole(u.role);
    setFormAssignedFloors([...u.assignedFloors]);
    setIsAddingUser(true);
  };

  const handleToggleFloorAssignment = (fId: FloorId) => {
    soundEffects.playClickSound();
    if (formAssignedFloors.includes(fId)) {
      if (formAssignedFloors.length > 1) {
        setFormAssignedFloors(formAssignedFloors.filter((f) => f !== fId));
      }
    } else {
      setFormAssignedFloors([...formAssignedFloors, fId]);
    }
  };

  const handleSaveUserForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formUsername.trim() || !formPassword.trim()) {
      return;
    }

    soundEffects.playClickSound();

    const userAccount: UserAccount = {
      id: editingUserId || `user_${Date.now()}`,
      name: formName.trim(),
      username: formUsername.trim().toLowerCase(),
      password: formPassword.trim(),
      role: formRole,
      assignedFloors: formRole === 'ADMIN' ? ['1', '2', '3', '4'] : formAssignedFloors,
    };

    StockStorageEngine.saveUser(userAccount);
    refreshAll();
    setIsAddingUser(false);
    setUserToast(`Akun ${userAccount.name} (@${userAccount.username}) berhasil disimpan!`);
    setTimeout(() => setUserToast(null), 3000);
  };

  const handleDeleteUserAccount = (userId: string, userName: string) => {
    if (userName.toLowerCase() === 'fahri') {
      alert('Akun Fahri tidak dapat dihapus.');
      return;
    }
    if (confirm(`Hapus akun staf "${userName}"?`)) {
      soundEffects.playClickSound();
      StockStorageEngine.deleteUser(userId);
      refreshAll();
    }
  };

  const handleOpenMasterReport = () => {
    soundEffects.playClickSound();
    const text = ReportService.generateMasterReport();
    setMasterReportText(text);
    setIsReportModalOpen(true);
  };

  // If user is not Fahri / Admin, show clean Access Denied screen
  if (!isFahri) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-black text-white flex items-center justify-center mb-4 shadow-sm">
          <AlertTriangle size={26} />
        </div>
        <h2 className="text-base font-bold text-black">
          Akses Dibatasi
        </h2>
        <p className="text-xs text-zinc-500 max-w-xs mt-1 mb-5">
          Halaman Dashboard Utama khusus untuk akun <strong>Fahri</strong> (Administrator).
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-28 pt-3 px-3 max-w-md mx-auto space-y-3">
      {/* Header Bar */}
      <header className="flex items-center justify-between py-1 px-0.5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-black text-white flex items-center justify-center font-bold">
            <ShieldCheck size={18} />
          </div>
          <div>
            <h1 className="text-sm font-extrabold text-black leading-tight">
              Dashboard Utama
            </h1>
            <span className="text-[10px] text-zinc-400 font-medium block">
              Pusat Kontrol (Fahri)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleOpenMasterReport}
            className="px-3 py-2 bg-black hover:bg-zinc-800 text-white rounded-xl text-xs font-bold flex items-center gap-1 touch-press"
          >
            <FileText size={13} /> Laporan
          </button>
        </div>
      </header>

      {/* Aggregate Stats */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-white p-3.5 rounded-xl border border-zinc-200">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
            Total Macam
          </span>
          <span className="text-xl font-extrabold text-black mt-0.5 block font-mono">
            {stats.totalItemsCount} <span className="text-xs font-normal text-zinc-400 font-sans">item</span>
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-zinc-200">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
            Total Unit Fisik
          </span>
          <span className="text-xl font-extrabold text-black mt-0.5 block font-mono">
            {stats.totalStockQty} <span className="text-xs font-normal text-zinc-400 font-sans">unit</span>
          </span>
        </div>
      </div>

      {/* Team Staff & Floor Assignments Management */}
      <div className="bg-white rounded-2xl p-3.5 border border-zinc-200 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Users size={14} className="text-black" />
            <h3 className="text-xs font-bold text-black">Akun Tim Toko</h3>
          </div>
          <button
            onClick={handleStartAddUser}
            className="px-2.5 py-1 bg-black hover:bg-zinc-800 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 touch-press"
          >
            <Plus size={11} /> Tambah Staf
          </button>
        </div>

        {userToast && (
          <div className="p-2 rounded-lg bg-zinc-100 text-[10px] font-semibold text-black flex items-center gap-1">
            <CheckCircle size={12} /> {userToast}
          </div>
        )}

        {/* Staff Add / Edit Form Modal Inline */}
        {isAddingUser && (
          <form
            onSubmit={handleSaveUserForm}
            className="bg-zinc-50 border border-zinc-200 rounded-xl p-3 space-y-2.5 animate-in fade-in duration-150"
          >
            <div className="flex items-center justify-between border-b border-zinc-200 pb-1.5">
              <span className="text-xs font-bold text-black">
                {editingUserId ? 'Edit Akun Staf' : 'Tambah Penjaga Baru'}
              </span>
              <button
                type="button"
                onClick={() => setIsAddingUser(false)}
                className="text-[10px] text-zinc-400 hover:text-black"
              >
                Batal
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-semibold text-zinc-600 block mb-0.5">
                  Nama:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nama staf"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg font-bold"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-zinc-600 block mb-0.5">
                  Username:
                </label>
                <input
                  type="text"
                  required
                  placeholder="username"
                  value={formUsername}
                  onChange={(e) => setFormUsername(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg font-mono font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-semibold text-zinc-600 block mb-0.5">
                  Password:
                </label>
                <input
                  type="text"
                  required
                  placeholder="password"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-zinc-600 block mb-0.5">
                  Peran:
                </label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as 'ADMIN' | 'STAFF')}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg font-bold"
                >
                  <option value="STAFF">Penjaga Lantai (Staf)</option>
                  <option value="ADMIN">Administrator (Khusus Fahri)</option>
                </select>
              </div>
            </div>

            {formRole === 'STAFF' && (
              <div>
                <label className="text-[10px] font-semibold text-zinc-600 block mb-1">
                  Akses Lantai:
                </label>
                <div className="grid grid-cols-4 gap-1">
                  {(['1', '2', '3', '4'] as FloorId[]).map((f) => {
                    const isChecked = formAssignedFloors.includes(f);
                    return (
                      <button
                        key={f}
                        type="button"
                        onClick={() => handleToggleFloorAssignment(f)}
                        className={`py-1 text-[10px] font-bold rounded-lg border transition-all ${
                          isChecked
                            ? 'bg-black text-white border-black'
                            : 'bg-white text-zinc-600 border-zinc-200'
                        }`}
                      >
                        Lt {f}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2 bg-black hover:bg-zinc-800 text-white rounded-lg text-xs font-bold touch-press"
            >
              Simpan Akun
            </button>
          </form>
        )}

        {/* Staff Account List */}
        <div className="space-y-1.5">
          {usersList.map((u) => (
            <div
              key={u.id}
              className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-between"
            >
              <div className="min-w-0 pr-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-black">{u.name}</span>
                  {u.role === 'ADMIN' && (
                    <span className="text-[8px] font-bold bg-black text-white px-1.5 py-0.2 rounded">
                      ADMIN
                    </span>
                  )}
                </div>

                <div className="text-[10px] text-zinc-400 mt-0.5 flex items-center gap-1">
                  <span>Akses:</span>
                  {u.role === 'ADMIN' ? (
                    <span className="font-semibold text-black">Admin + Semua Lantai</span>
                  ) : (
                    <span className="font-semibold text-black">
                      {u.assignedFloors.map((f) => FLOOR_DEFINITIONS[f].name).join(', ')}
                    </span>
                  )}
                  <span>- Pass: <code className="font-mono text-zinc-600 font-bold">{u.password}</code></span>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => handleStartEditUser(u)}
                  className="p-1 text-zinc-400 hover:text-black rounded"
                  title="Edit Akun"
                >
                  <Edit2 size={13} />
                </button>
                {u.name.toLowerCase() !== 'fahri' && (
                  <button
                    onClick={() => handleDeleteUserAccount(u.id, u.name)}
                    className="p-1 text-zinc-400 hover:text-black rounded"
                    title="Hapus Akun"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Floor Summaries List */}
      <div className="bg-white rounded-2xl p-3.5 border border-zinc-200 space-y-2">
        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
          Ringkasan Lantai
        </span>

        <div className="space-y-1.5">
          {stats.floorSummaries.map((f) => {
            const FloorIcon = FLOOR_ICONS[f.floorId] || Package;

            return (
              <div
                key={f.floorId}
                onClick={() => {
                  soundEffects.playClickSound();
                  onSelectFloor(f.floorId);
                }}
                className="p-2.5 rounded-xl bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 cursor-pointer transition-all flex items-center justify-between touch-press"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-black text-white flex items-center justify-center">
                    <FloorIcon size={15} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-black">{f.name}</h4>
                    <span className="text-[10px] text-zinc-400">
                      {f.subtitle} - {f.itemCount} item
                    </span>
                  </div>
                </div>

                <span className="text-xs font-bold text-black font-mono">
                  {f.stockQty} unit
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Telegram Bot API Settings */}
      <div className="bg-white rounded-2xl p-3.5 border border-zinc-200 space-y-2.5">
        <h3 className="text-xs font-bold text-black flex items-center gap-1.5">
          <Send size={13} /> Pengaturan Telegram Bot Backup
        </h3>

        <div className="space-y-2">
          <div>
            <label className="text-[10px] font-semibold text-zinc-600 block mb-1">
              Bot Token (@BotFather):
            </label>
            <input
              type="text"
              value={botToken}
              onChange={(e) => setBotToken(e.target.value)}
              placeholder="123456789:ABCdefGhIJKlm..."
              className="w-full px-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg font-mono focus:outline-none focus:border-black"
            />
          </div>

          <div>
            <label className="text-[10px] font-semibold text-zinc-600 block mb-1">
              Chat ID / Channel ID:
            </label>
            <input
              type="text"
              value={chatId}
              onChange={(e) => setChatId(e.target.value)}
              placeholder="-100123456789"
              className="w-full px-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg font-mono focus:outline-none focus:border-black"
            />
          </div>

          <label className="flex items-center gap-2 pt-0.5 cursor-pointer">
            <input
              type="checkbox"
              checked={autoBackup}
              onChange={(e) => setAutoBackup(e.target.checked)}
              className="rounded text-black w-3.5 h-3.5 focus:ring-0"
            />
            <span className="text-[10px] text-zinc-600 font-medium">
              Auto-backup otomatis saat online
            </span>
          </label>
        </div>

        {telegramStatus && (
          <div className="p-2 rounded-lg bg-zinc-100 text-[10px] text-black font-medium">
            {telegramStatus}
          </div>
        )}

        <div className="grid grid-cols-3 gap-1.5 pt-0.5">
          <button
            onClick={handleSaveTelegram}
            className="py-1.5 bg-black text-white rounded-lg text-[10px] font-bold touch-press"
          >
            Simpan
          </button>
          <button
            onClick={handleTestTelegram}
            disabled={isTestingTelegram}
            className="py-1.5 bg-zinc-100 hover:bg-zinc-200 text-black border border-zinc-200 rounded-lg text-[10px] font-semibold touch-press disabled:opacity-50"
          >
            {isTestingTelegram ? 'Menguji...' : 'Tes Bot'}
          </button>
          <button
            onClick={handleSendFullTelegramBackup}
            disabled={isSendingBackup}
            className="py-1.5 bg-zinc-900 text-white rounded-lg text-[10px] font-bold touch-press disabled:opacity-50"
          >
            {isSendingBackup ? 'Mengirim...' : 'Kirim Backup'}
          </button>
        </div>
      </div>

      {/* Master Backup JSON Tools */}
      <div className="bg-white rounded-2xl p-3.5 border border-zinc-200 space-y-2">
        <h3 className="text-xs font-bold text-black flex items-center gap-1.5">
          <Database size={13} /> Master Database JSON
        </h3>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleDownloadAllJSON}
            className="p-2.5 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-xl text-left touch-press"
          >
            <Download size={14} className="text-black mb-1" />
            <span className="text-xs font-bold text-black block">Unduh JSON</span>
            <span className="text-[9px] text-zinc-400 block">Semua Lantai</span>
          </button>

          <div>
            <input
              type="file"
              accept=".json"
              ref={fullImportRef}
              onChange={handleFullFileImport}
              className="hidden"
            />
            <button
              onClick={() => fullImportRef.current?.click()}
              className="w-full h-full p-2.5 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-xl text-left touch-press"
            >
              <Upload size={14} className="text-black mb-1" />
              <span className="text-xs font-bold text-black block">Pulihkan JSON</span>
              <span className="text-[9px] text-zinc-400 block">Pilih File</span>
            </button>
          </div>
        </div>

        {importStatus && (
          <div className="p-2 rounded-lg bg-zinc-100 text-xs text-black">
            {importStatus.message}
          </div>
        )}
      </div>

      {/* Text Report Modal */}
      <TextReportModal
        isOpen={isReportModalOpen}
        title="Laporan Master Seluruh Lantai"
        reportText={masterReportText}
        onClose={() => setIsReportModalOpen(false)}
      />
    </div>
  );
};
