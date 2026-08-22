import React, { useState, useRef } from 'react';
import {
  X,
  Database,
  Download,
  Upload,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  FileCheck,
  ShieldAlert,
} from 'lucide-react';
import type { BackupExportData } from '../types/stock';
import { StockStorageEngine } from '../services/db';
import { soundEffects } from '../utils/audio';

interface MasterDatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataResetOrImported: () => void;
}

export const MasterDatabaseModal: React.FC<MasterDatabaseModalProps> = ({
  isOpen,
  onClose,
  onDataResetOrImported,
}) => {
  const fullImportRef = useRef<HTMLInputElement | null>(null);
  const [importStatus, setImportStatus] = useState<{ success: boolean; message: string } | null>(
    null
  );

  // Security confirmation state for Reset
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState('');

  // Pending restore file state
  const [pendingRestore, setPendingRestore] = useState<{
    data: BackupExportData;
    fileName: string;
    itemCount: number;
  } | null>(null);
  const [restoreMode, setRestoreMode] = useState<'MERGE' | 'REPLACE'>('MERGE');

  if (!isOpen) return null;

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
    setImportStatus({
      success: true,
      message: 'File backup JSON berhasil diunduh.',
    });
    setTimeout(() => setImportStatus(null), 4000);
  };

  const handleFullFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed: BackupExportData = JSON.parse(content);
        if (!parsed || !parsed.floors) {
          throw new Error('Format file tidak valid.');
        }

        let totalItems = 0;
        Object.values(parsed.floors).forEach((floor) => {
          totalItems += floor?.items?.length || 0;
        });

        setPendingRestore({
          data: parsed,
          fileName: file.name,
          itemCount: totalItems,
        });
        setRestoreMode('MERGE');
        soundEffects.playClickSound();
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

  const handleConfirmRestore = () => {
    if (!pendingRestore) return;
    soundEffects.playClickSound();

    if (restoreMode === 'REPLACE') {
      const confirmed = window.confirm(
        '⚠️ PERINGATAN TIMPA SEMUA:\n\nSemua data di database saat ini akan dihapus dan digantikan dengan data dari file backup.\n\nLanjutkan?'
      );
      if (!confirmed) return;
    }

    const result = StockStorageEngine.importData(pendingRestore.data, undefined, restoreMode);
    setImportStatus(result);
    setPendingRestore(null);

    if (result.success) {
      soundEffects.playBackupSent();
      onDataResetOrImported();
    }
  };

  const handleExecuteReset = () => {
    if (resetConfirmText.trim().toUpperCase() !== 'RESET') {
      return;
    }
    soundEffects.playLockSound();
    StockStorageEngine.clearAllFloorData();
    onDataResetOrImported();
    setIsResetModalOpen(false);
    setResetConfirmText('');
    setImportStatus({
      success: true,
      message: 'Semua produk dan kategori berhasil dikosongkan (Reset ke 0).',
    });
    setTimeout(() => setImportStatus(null), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 modal-backdrop animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-zinc-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-zinc-100 bg-zinc-50/90 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-black text-white flex items-center justify-center shadow-xs">
              <Database size={16} />
            </div>
            <div>
              <h3 className="text-xs font-bold text-black leading-none">
                Master Database (JSON)
              </h3>
              <p className="text-[10px] text-zinc-500 font-medium mt-0.5">
                Cadangkan, pulihkan, atau reset database toko
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              soundEffects.playClickSound();
              onClose();
            }}
            className="w-7 h-7 flex items-center justify-center rounded-full text-zinc-400 hover:text-black hover:bg-zinc-200 transition-colors touch-press"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {importStatus && (
            <div
              className={`p-3 rounded-2xl border text-xs font-semibold flex items-center gap-2 ${
                importStatus.success
                  ? 'bg-black text-white border-zinc-800 shadow-md'
                  : 'bg-zinc-100 text-zinc-900 border-zinc-300'
              }`}
            >
              {importStatus.success ? (
                <CheckCircle2 size={16} className="text-white shrink-0" />
              ) : (
                <AlertTriangle size={16} className="text-zinc-800 shrink-0" />
              )}
              <span>{importStatus.message}</span>
            </div>
          )}

          {/* Backup & Restore Action Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={handleDownloadAllJSON}
              className="p-3.5 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 hover:border-black rounded-2xl text-left touch-press transition-all shadow-xs"
            >
              <div className="w-8 h-8 rounded-xl bg-black text-white flex items-center justify-center mb-2">
                <Download size={15} />
              </div>
              <span className="text-xs font-bold text-black block">Unduh File JSON</span>
              <span className="text-[10px] text-zinc-500 block mt-0.5">
                Simpan seluruh database 4 lantai ke file lokal
              </span>
            </button>

            <div>
              <input
                type="file"
                accept=".json"
                ref={fullImportRef}
                onChange={handleFullFileSelect}
                className="hidden"
              />
              <button
                onClick={() => fullImportRef.current?.click()}
                className="w-full h-full p-3.5 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 hover:border-black rounded-2xl text-left touch-press transition-all shadow-xs"
              >
                <div className="w-8 h-8 rounded-xl bg-black text-white flex items-center justify-center mb-2">
                  <Upload size={15} />
                </div>
                <span className="text-xs font-bold text-black block">Pulihkan JSON</span>
                <span className="text-[10px] text-zinc-500 block mt-0.5">
                  Import data dari file backup
                </span>
              </button>
            </div>
          </div>

          {/* Pending Restore Confirmation Card */}
          {pendingRestore && (
            <div className="p-3.5 bg-zinc-50 border-2 border-black rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <FileCheck size={16} className="text-black" />
                  <span className="text-xs font-bold text-black">Konfirmasi Pemulihan</span>
                </div>
                <button
                  onClick={() => setPendingRestore(null)}
                  className="text-[10px] text-zinc-400 hover:text-black font-semibold"
                >
                  Batal
                </button>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-zinc-200 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-zinc-500">File:</span>
                  <span className="font-bold text-black truncate max-w-[180px]">
                    {pendingRestore.fileName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Total Barang:</span>
                  <span className="font-mono font-bold text-black">
                    {pendingRestore.itemCount} macam
                  </span>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-600 block mb-1 uppercase tracking-wider">
                  Pilih Metode:
                </label>
                <div className="grid grid-cols-2 gap-1">
                  <button
                    type="button"
                    onClick={() => setRestoreMode('MERGE')}
                    className={`py-1.5 text-xs font-bold rounded-xl border transition-all touch-press ${
                      restoreMode === 'MERGE'
                        ? 'bg-black text-white border-black'
                        : 'bg-white text-zinc-600 border-zinc-200'
                    }`}
                  >
                    Gabung / Update
                  </button>
                  <button
                    type="button"
                    onClick={() => setRestoreMode('REPLACE')}
                    className={`py-1.5 text-xs font-bold rounded-xl border transition-all touch-press ${
                      restoreMode === 'REPLACE'
                        ? 'bg-black text-white border-black'
                        : 'bg-white text-zinc-600 border-zinc-200'
                    }`}
                  >
                    Timpa Semua
                  </button>
                </div>
                {restoreMode === 'REPLACE' && (
                  <p className="text-[10px] text-zinc-800 font-semibold bg-zinc-100 p-2 rounded-lg mt-1.5 border border-zinc-300">
                    ⚠️ Mode Timpa Semua akan menghapus data lama dan menggantikannya dengan file ini.
                  </p>
                )}
              </div>

              <button
                onClick={handleConfirmRestore}
                className="w-full py-2 bg-black hover:bg-zinc-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 touch-press shadow-xs"
              >
                <CheckCircle2 size={13} /> Terapkan Pemulihan Sekarang
              </button>
            </div>
          )}

          {/* Info Card */}
          <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-2xl space-y-1">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1">
              <FileCheck size={12} /> Format Data Backup
            </span>
            <p className="text-[11px] text-zinc-600 leading-relaxed">
              File cadangan (<code>.json</code>) mencakup seluruh daftar barang, kategori, riwayat mutasi, dan akun dari Lantai 1 sampai 4.
            </p>
          </div>

          {/* Danger Zone: Reset all data with strict safeguard */}
          <div className="pt-2 border-t border-zinc-200">
            <span className="text-[10px] font-bold text-zinc-800 uppercase tracking-wider block mb-1.5">
              Reset Database Toko
            </span>
            <button
              onClick={() => {
                soundEffects.playClickSound();
                setIsResetModalOpen(true);
                setResetConfirmText('');
              }}
              className="w-full py-2.5 bg-zinc-900 hover:bg-black text-white border border-black rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 touch-press transition-colors shadow-xs"
            >
              <Trash2 size={14} /> Kosongkan Semua Produk & Jenis (Reset ke 0)
            </button>
            <p className="text-[9px] text-zinc-400 text-center mt-1">
              Data stok di semua lantai akan kembali kosong (0 macam item).
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-zinc-50 border-t border-zinc-100 flex justify-end shrink-0">
          <button
            onClick={() => {
              soundEffects.playClickSound();
              onClose();
            }}
            className="px-4 py-2 bg-black hover:bg-zinc-800 text-white rounded-xl text-xs font-bold touch-press shadow-xs"
          >
            Tutup
          </button>
        </div>
      </div>

      {/* Strict Security Confirmation Modal for RESET */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 modal-backdrop animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-xs w-full p-5 shadow-2xl border-2 border-black space-y-3.5">
            <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center mx-auto">
              <ShieldAlert size={20} />
            </div>

            <div className="text-center space-y-1">
              <h4 className="text-xs font-extrabold text-black uppercase tracking-wider">
                Konfirmasi Reset Total
              </h4>
              <p className="text-[11px] text-zinc-600 leading-relaxed">
                Tindakan ini akan <strong>menghapus seluruh produk & stok</strong> di Lantai 1, 2, 3, dan 4.
              </p>
            </div>

            <div className="space-y-1.5 pt-1">
              <label className="text-[10px] font-bold text-zinc-700 block text-center">
                Ketik kata <span className="font-mono text-black font-extrabold">RESET</span> untuk melanjutkan:
              </label>
              <input
                type="text"
                autoFocus
                placeholder="RESET"
                value={resetConfirmText}
                onChange={(e) => setResetConfirmText(e.target.value)}
                className="w-full px-3 py-2 text-center text-xs font-mono font-extrabold tracking-widest bg-zinc-50 border border-zinc-300 rounded-xl focus:outline-none focus:border-black uppercase"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsResetModalOpen(false)}
                className="py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl text-xs font-bold touch-press"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={resetConfirmText.trim().toUpperCase() !== 'RESET'}
                onClick={handleExecuteReset}
                className="py-2 bg-black hover:bg-zinc-800 disabled:opacity-30 text-white rounded-xl text-xs font-bold touch-press shadow-xs"
              >
                Reset Semua
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
