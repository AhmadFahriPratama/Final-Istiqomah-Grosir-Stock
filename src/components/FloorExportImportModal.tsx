import React, { useState, useRef } from 'react';
import {
  X,
  Download,
  Upload,
  Send,
  FileJson,
  CheckCircle,
  RefreshCw,
  Share2,
} from 'lucide-react';
import type { FloorId, BackupExportData } from '../types/stock';
import { FLOOR_DEFINITIONS } from '../types/stock';
import { StockStorageEngine } from '../services/db';
import { TelegramService } from '../services/telegram';
import { soundEffects } from '../utils/audio';
import { useRegisterModal } from '../utils/modalManager';

interface FloorExportImportModalProps {
  isOpen: boolean;
  floorId: FloorId;
  onClose: () => void;
  onDataChanged: () => void;
}

export const FloorExportImportModal: React.FC<FloorExportImportModalProps> = ({
  isOpen,
  floorId,
  onClose,
  onDataChanged,
}) => {
  useRegisterModal('FloorExportImportModal', isOpen, onClose);
  const [isSendingTelegram, setIsSendingTelegram] = useState(false);
  const [telegramStatus, setTelegramStatus] = useState<string | null>(null);

  const [pendingFileContent, setPendingFileContent] = useState<BackupExportData | null>(null);
  const [detectedSourceFloorId, setDetectedSourceFloorId] = useState<FloorId>(floorId);
  const [targetFloorChoice, setTargetFloorChoice] = useState<FloorId>(floorId);
  const [importMode, setImportMode] = useState<'MERGE' | 'REPLACE'>('MERGE');
  const [importStatus, setImportStatus] = useState<{ success: boolean; message: string } | null>(
    null
  );

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const floorInfo = FLOOR_DEFINITIONS[floorId];

  const handleDownloadJSON = () => {
    soundEffects.playClickSound();
    const backup = StockStorageEngine.exportSingleFloor(floorId);
    const dataStr =
      'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backup, null, 2));
    const downloadAnchor = document.createElement('a');
    const filename = `IstiqomahStock_${floorInfo.name.replace(/\s+/g, '')}_${new Date()
      .toISOString()
      .slice(0, 10)}.json`;
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', filename);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    soundEffects.playBackupSent();
  };

  const handleSendTelegram = async () => {
    soundEffects.playClickSound();
    setIsSendingTelegram(true);
    setTelegramStatus('Mengunggah ke Telegram...');

    try {
      const backup = StockStorageEngine.exportSingleFloor(floorId);
      const res = await TelegramService.sendBackup(backup, floorId);
      setTelegramStatus(res.message);
      if (res.success) {
        soundEffects.playBackupSent();
      } else {
        alert(res.message);
      }
    } catch (e) {
      const errMsg = 'Sambungkan ke internet dahulu untuk mengirim backup: ' + String(e);
      setTelegramStatus(errMsg);
      alert(errMsg);
    } finally {
      setIsSendingTelegram(false);
    }
  };

  const parseCSVToBackup = (csvText: string, currentFloor: FloorId): BackupExportData => {
    const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) throw new Error('File CSV kosong atau tidak memiliki baris data');

    // Detect separator: comma or semicolon
    const firstLine = lines[0];
    const sep = firstLine.includes(';') ? ';' : ',';

    const headers = lines[0].split(sep).map((h) => h.trim().toLowerCase().replace(/['"]+/g, ''));
    const nameIdx = headers.findIndex((h) => h.includes('nama') || h.includes('name') || h.includes('produk') || h.includes('barang'));
    const catIdx = headers.findIndex((h) => h.includes('kategori') || h.includes('cat') || h.includes('jenis'));
    const unitIdx = headers.findIndex((h) => h.includes('satuan') || h.includes('unit'));
    const qtyIdx = headers.findIndex((h) => h.includes('stok') || h.includes('qty') || h.includes('jumlah'));
    const minIdx = headers.findIndex((h) => h.includes('min'));
    const maxIdx = headers.findIndex((h) => h.includes('max'));
    const locIdx = headers.findIndex((h) => h.includes('lokasi') || h.includes('rak') || h.includes('posisi'));
    const barcodeIdx = headers.findIndex((h) => h.includes('barcode') || h.includes('sku') || h.includes('kode'));

    if (nameIdx === -1) throw new Error('Kolom "Nama Produk" tidak ditemukan pada baris judul CSV');

    const categoriesSet = new Set<string>();
    const items = [];

    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(sep).map((col) => col.trim().replace(/^["']|["']$/g, ''));
      const name = row[nameIdx];
      if (!name) continue;

      const category = (catIdx !== -1 && row[catIdx]) ? row[catIdx] : 'Umum';
      categoriesSet.add(category);

      const unit = (unitIdx !== -1 && row[unitIdx]) ? row[unitIdx] : 'Pcs';
      const qty = (qtyIdx !== -1 && !isNaN(Number(row[qtyIdx]))) ? Number(row[qtyIdx]) : 0;
      const minStock = (minIdx !== -1 && !isNaN(Number(row[minIdx]))) ? Number(row[minIdx]) : 0;
      const maxStock = (maxIdx !== -1 && !isNaN(Number(row[maxIdx]))) ? Number(row[maxIdx]) : undefined;
      const locationDetails = (locIdx !== -1 && row[locIdx]) ? row[locIdx] : undefined;
      const barcode = (barcodeIdx !== -1 && row[barcodeIdx]) ? row[barcodeIdx] : undefined;

      items.push({
        id: `csv_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
        name,
        category,
        unit,
        quantity: qty,
        minStock,
        maxStock,
        locationDetails,
        barcode,
        notes: 'Impor CSV Masal',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    if (items.length === 0) throw new Error('Tidak ada baris barang valid yang ditemukan di CSV');

    const defaultCats = StockStorageEngine.getFloorData(currentFloor).categories;
    defaultCats.forEach((c) => categoriesSet.add(c));

    return {
      version: '3.0.0',
      appName: 'Istiqomah Grosir Stock',
      exportedAt: new Date().toISOString(),
      type: 'SINGLE_FLOOR',
      floorId: currentFloor,
      floors: {
        [currentFloor]: {
          floorId: currentFloor,
          items,
          categories: Array.from(categoriesSet),
          mutations: [],
          lastUpdated: new Date().toISOString(),
        },
      },
    };
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isCSV = file.name.toLowerCase().endsWith('.csv') || file.type.includes('csv');

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        let parsed: BackupExportData;

        if (isCSV) {
          parsed = parseCSVToBackup(content, floorId);
        } else {
          parsed = JSON.parse(content);
        }

        if (!parsed || !parsed.floors) {
          throw new Error('Struktur file tidak valid');
        }

        setPendingFileContent(parsed);
        const sourceFId =
          parsed.floorId || (Object.keys(parsed.floors)[0] as FloorId) || floorId;
        setDetectedSourceFloorId(sourceFId);
        setTargetFloorChoice(sourceFId);
        setImportStatus(null);
        soundEffects.playClickSound();
      } catch (err) {
        setImportStatus({
          success: false,
          message: 'Format file tidak sesuai: ' + String(err),
        });
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleConfirmImport = () => {
    if (!pendingFileContent) return;

    if (importMode === 'REPLACE') {
      const targetName = FLOOR_DEFINITIONS[targetFloorChoice]?.name || `Lantai ${targetFloorChoice}`;
      const confirmed = window.confirm(
        `⚠️ PERINGATAN TIMPA SEMUA:\n\nSeluruh data barang di ${targetName} saat ini akan DIHAPUS dan digantikan sepenuhnya oleh data dari file backup ini.\n\nApakah Anda yakin ingin melanjutkan?`
      );
      if (!confirmed) return;
    }

    const result = StockStorageEngine.importData(
      pendingFileContent,
      targetFloorChoice,
      importMode
    );
    setImportStatus(result);

    if (result.success) {
      soundEffects.playBackupSent();
      onDataChanged();
      setPendingFileContent(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 modal-backdrop anim-fade-in overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-sm w-full shadow-xl overflow-hidden border border-stone-200 my-auto max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 bg-stone-50">
          <div className="flex items-center gap-2">
            <Share2 size={16} className="text-stone-900" />
            <h3 className="text-xs font-bold text-stone-900">
              Sinkronisasi & Multi-HP ({floorInfo.name})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-900 hover:bg-stone-200 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-3 overflow-y-auto flex-1">
          {/* Telegram Backup */}
          <div className="p-3 bg-stone-50 border border-stone-200 rounded-2xl space-y-2">
            <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
              <Send size={13} /> Backup ke Telegram
            </span>
            <p className="text-[11px] text-stone-500">
              Kirim database {floorInfo.name} ke Telegram bot untuk dibagikan ke HP lain.
            </p>
            <button
              onClick={handleSendTelegram}
              disabled={isSendingTelegram}
              className="w-full py-2 bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 touch-press"
            >
              {isSendingTelegram ? (
                <RefreshCw size={12} className="animate-spin" />
              ) : (
                <Send size={12} />
              )}
              {isSendingTelegram ? 'Mengirim...' : 'Kirim Backup ke Telegram'}
            </button>
            {telegramStatus && (
              <p className="text-[10px] text-stone-600 bg-white p-1.5 rounded border border-stone-200">
                {telegramStatus}
              </p>
            )}
          </div>

          {/* Offline File Export */}
          <div className="p-3 bg-stone-50 border border-stone-200 rounded-2xl space-y-2">
            <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
              <FileJson size={13} /> Ekspor File JSON (Offline)
            </span>
            <p className="text-[11px] text-stone-500">
              Download file data stok {floorInfo.name} untuk dikirim via WA / Bluetooth.
            </p>
            <button
              onClick={handleDownloadJSON}
              className="w-full py-2 bg-white hover:bg-stone-100 border border-stone-200 text-stone-900 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 touch-press"
            >
              <Download size={13} /> Unduh File JSON
            </button>
          </div>

          {/* Multi-HP Smart Import */}
          <div className="p-3 bg-stone-50 border border-stone-200 rounded-2xl space-y-2">
            <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
              <Upload size={13} /> Impor Data dari HP Lain
            </span>

            <input
              type="file"
              accept=".json,.csv,text/csv,application/json"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />

            {!pendingFileContent ? (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2 bg-stone-200 hover:bg-zinc-300 text-stone-900 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 touch-press"
              >
                <Upload size={13} /> Pilih File Backup JSON / CSV Excel
              </button>
            ) : (
              <div className="bg-white p-3 rounded-xl border border-stone-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-stone-900">
                    File: {FLOOR_DEFINITIONS[detectedSourceFloorId]?.name || 'Lantai Asal'}
                  </span>
                  <button
                    onClick={() => setPendingFileContent(null)}
                    className="text-[10px] text-stone-400 hover:text-stone-900"
                  >
                    Ganti
                  </button>
                </div>

                <div className="space-y-1.5">
                  <div>
                    <label className="text-[10px] font-semibold text-stone-500 block mb-0.5">
                      Lantai Tujuan di HP ini:
                    </label>
                    <select
                      value={targetFloorChoice}
                      onChange={(e) => setTargetFloorChoice(e.target.value as FloorId)}
                      className="w-full px-2 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg font-bold"
                    >
                      {(['1', '2', '3', '4'] as FloorId[]).map((f) => (
                        <option key={f} value={f}>
                          {FLOOR_DEFINITIONS[f].name} ({FLOOR_DEFINITIONS[f].subtitle})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-stone-500 block mb-0.5">
                      Metode:
                    </label>
                    <div className="grid grid-cols-2 gap-1">
                      <button
                        type="button"
                        onClick={() => setImportMode('MERGE')}
                        className={`py-1 text-[10px] font-bold rounded-lg border ${
                          importMode === 'MERGE'
                            ? 'bg-stone-900 text-white border-black'
                            : 'bg-stone-50 text-stone-500 border-stone-200'
                        }`}
                      >
                        Gabung / Update
                      </button>
                      <button
                        type="button"
                        onClick={() => setImportMode('REPLACE')}
                        className={`py-1 text-[10px] font-bold rounded-lg border ${
                          importMode === 'REPLACE'
                            ? 'bg-stone-900 text-white border-black'
                            : 'bg-stone-50 text-stone-500 border-stone-200'
                        }`}
                      >
                        Timpa Semua
                      </button>
                    </div>
                    {importMode === 'REPLACE' && (
                      <p className="text-[10px] text-stone-700 font-semibold bg-stone-100 p-1.5 rounded-lg mt-1 border border-stone-300">
                        ⚠️ Timpa Semua akan menghapus stok lama di lantai ini.
                      </p>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleConfirmImport}
                  className="w-full py-2 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 touch-press"
                >
                  <CheckCircle size={13} /> Konfirmasi Impor
                </button>
              </div>
            )}

            {importStatus && (
              <div className="p-2 rounded-lg text-xs bg-stone-100 text-stone-900">
                {importStatus.message}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
