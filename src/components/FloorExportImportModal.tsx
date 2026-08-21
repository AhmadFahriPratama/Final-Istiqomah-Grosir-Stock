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
import confetti from 'canvas-confetti';

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
    confetti({ particleCount: 30, spread: 50, origin: { y: 0.7 } });
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
        confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed: BackupExportData = JSON.parse(content);

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

    const result = StockStorageEngine.importData(
      pendingFileContent,
      targetFloorChoice,
      importMode
    );
    setImportStatus(result);

    if (result.success) {
      soundEffects.playBackupSent();
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
      onDataChanged();
      setPendingFileContent(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 modal-backdrop animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl overflow-hidden border border-zinc-200 my-auto max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 bg-zinc-50">
          <div className="flex items-center gap-2">
            <Share2 size={16} className="text-black" />
            <h3 className="text-xs font-bold text-black">
              Sinkronisasi & Multi-HP ({floorInfo.name})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:text-black hover:bg-zinc-200 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-3 overflow-y-auto flex-1">
          {/* Telegram Backup */}
          <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-2xl space-y-2">
            <span className="text-xs font-bold text-black flex items-center gap-1.5">
              <Send size={13} /> Backup ke Telegram
            </span>
            <p className="text-[11px] text-zinc-500">
              Kirim database {floorInfo.name} ke Telegram bot untuk dibagikan ke HP lain.
            </p>
            <button
              onClick={handleSendTelegram}
              disabled={isSendingTelegram}
              className="w-full py-2 bg-black hover:bg-zinc-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 touch-press"
            >
              {isSendingTelegram ? (
                <RefreshCw size={12} className="animate-spin" />
              ) : (
                <Send size={12} />
              )}
              {isSendingTelegram ? 'Mengirim...' : 'Kirim Backup ke Telegram'}
            </button>
            {telegramStatus && (
              <p className="text-[10px] text-zinc-700 bg-white p-1.5 rounded border border-zinc-200">
                {telegramStatus}
              </p>
            )}
          </div>

          {/* Offline File Export */}
          <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-2xl space-y-2">
            <span className="text-xs font-bold text-black flex items-center gap-1.5">
              <FileJson size={13} /> Ekspor File JSON (Offline)
            </span>
            <p className="text-[11px] text-zinc-500">
              Download file data stok {floorInfo.name} untuk dikirim via WA / Bluetooth.
            </p>
            <button
              onClick={handleDownloadJSON}
              className="w-full py-2 bg-white hover:bg-zinc-100 border border-zinc-200 text-black rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 touch-press"
            >
              <Download size={13} /> Unduh File JSON
            </button>
          </div>

          {/* Multi-HP Smart Import */}
          <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-2xl space-y-2">
            <span className="text-xs font-bold text-black flex items-center gap-1.5">
              <Upload size={13} /> Impor Data dari HP Lain
            </span>

            <input
              type="file"
              accept=".json"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />

            {!pendingFileContent ? (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2 bg-zinc-200 hover:bg-zinc-300 text-black rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 touch-press"
              >
                <Upload size={13} /> Pilih File Backup JSON
              </button>
            ) : (
              <div className="bg-white p-3 rounded-xl border border-zinc-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-black">
                    File: {FLOOR_DEFINITIONS[detectedSourceFloorId]?.name || 'Lantai Asal'}
                  </span>
                  <button
                    onClick={() => setPendingFileContent(null)}
                    className="text-[10px] text-zinc-400 hover:text-black"
                  >
                    Ganti
                  </button>
                </div>

                <div className="space-y-1.5">
                  <div>
                    <label className="text-[10px] font-semibold text-zinc-500 block mb-0.5">
                      Lantai Tujuan di HP ini:
                    </label>
                    <select
                      value={targetFloorChoice}
                      onChange={(e) => setTargetFloorChoice(e.target.value as FloorId)}
                      className="w-full px-2 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg font-bold"
                    >
                      {(['1', '2', '3', '4'] as FloorId[]).map((f) => (
                        <option key={f} value={f}>
                          {FLOOR_DEFINITIONS[f].name} ({FLOOR_DEFINITIONS[f].subtitle})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-zinc-500 block mb-0.5">
                      Metode:
                    </label>
                    <div className="grid grid-cols-2 gap-1">
                      <button
                        type="button"
                        onClick={() => setImportMode('MERGE')}
                        className={`py-1 text-[10px] font-bold rounded-lg border ${
                          importMode === 'MERGE'
                            ? 'bg-black text-white border-black'
                            : 'bg-zinc-50 text-zinc-600 border-zinc-200'
                        }`}
                      >
                        Gabung / Update
                      </button>
                      <button
                        type="button"
                        onClick={() => setImportMode('REPLACE')}
                        className={`py-1 text-[10px] font-bold rounded-lg border ${
                          importMode === 'REPLACE'
                            ? 'bg-black text-white border-black'
                            : 'bg-zinc-50 text-zinc-600 border-zinc-200'
                        }`}
                      >
                        Timpa Semua
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleConfirmImport}
                  className="w-full py-2 bg-black hover:bg-zinc-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 touch-press"
                >
                  <CheckCircle size={13} /> Konfirmasi Impor
                </button>
              </div>
            )}

            {importStatus && (
              <div className="p-2 rounded-lg text-xs bg-zinc-100 text-black">
                {importStatus.message}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
