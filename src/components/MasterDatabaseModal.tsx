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
      message: 'File backup JSON berhasil diunduh ke perangkat Anda.',
    });
    setTimeout(() => setImportStatus(null), 4000);
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
          onDataResetOrImported();
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

  const handleClearAllData = () => {
    soundEffects.playClickSound();
    const confirmed = window.confirm(
      'Apakah Anda yakin ingin MENGOSONGKAN SEMUA DATA (0 produk & 0 jenis) di seluruh lantai?\n\nTindakan ini akan mengosongkan seluruh stok agar dapat diisi manual dari awal.'
    );
    if (confirmed) {
      StockStorageEngine.clearAllFloorData();
      soundEffects.playLockSound();
      onDataResetOrImported();
      setImportStatus({
        success: true,
        message: 'Semua produk dan jenis di seluruh lantai berhasil dikosongkan (Reset ke 0).',
      });
      setTimeout(() => setImportStatus(null), 4000);
    }
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
                Cadangkan, pulihkan, atau reset database inventaris
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
                onChange={handleFullFileImport}
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
                  Import & timpa database dari file backup
                </span>
              </button>
            </div>
          </div>

          {/* Info Card */}
          <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-2xl space-y-1">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1">
              <FileCheck size={12} /> Format Standar Backup
            </span>
            <p className="text-[11px] text-zinc-600 leading-relaxed">
              File backup berformat <code>.json</code> v2.0 berisi seluruh katalog barang, kategori, log mutasi riwayat staf, dan konfigurasi dari Lantai 1 s/d Lantai 4.
            </p>
          </div>

          {/* Danger Zone: Reset all data */}
          <div className="pt-2 border-t border-zinc-200">
            <span className="text-[10px] font-bold text-zinc-800 uppercase tracking-wider block mb-1.5">
              Area Reset Data (Koreksi Total)
            </span>
            <button
              onClick={handleClearAllData}
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
    </div>
  );
};
