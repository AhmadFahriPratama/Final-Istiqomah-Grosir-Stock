import React, { useState, useEffect } from 'react';
import { CheckCircle, X, DownloadCloud } from 'lucide-react';
import type { BackupExportData, FloorId } from '../types/stock';
import { FLOOR_DEFINITIONS } from '../types/stock';
import { StockStorageEngine } from '../services/db';
import { soundEffects } from '../utils/audio';

export const AutoBackupReceiverModal: React.FC = () => {
  const [detectedData, setDetectedData] = useState<BackupExportData | null>(null);
  const [fileName, setFileName] = useState<string>('Backup');
  const [targetFloor, setTargetFloor] = useState<FloorId>('1');
  const [importMode, setImportMode] = useState<'MERGE' | 'REPLACE'>('MERGE');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const processJsonText = (text: string, name: string = 'Backup') => {
    try {
      const parsed: BackupExportData = JSON.parse(text);
      if (!parsed || !parsed.floors) return;

      const detectedFloorId =
        parsed.floorId ||
        (Object.keys(parsed.floors)[0] as FloorId) ||
        '1';

      setDetectedData(parsed);
      setFileName(name);
      setTargetFloor(detectedFloorId);
      setStatusMessage(null);
      soundEffects.playUnlockSound();
    } catch {
      // not a json backup
    }
  };

  useEffect(() => {
    // 1. Listen for Service Worker postMessage (Web Share Target from Telegram)
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'ISTIQOMAH_SHARED_FILE') {
        processJsonText(event.data.content, event.data.filename || 'Telegram_Backup.json');
      }
    };
    navigator.serviceWorker?.addEventListener('message', handleServiceWorkerMessage);

    // 2. Native File Handling API (LaunchQueue on Chrome / PWA / Android)
    if ('launchQueue' in window && 'setConsumer' in (window as unknown as { launchQueue: { setConsumer: (cb: (p: { files: Array<{ getFile: () => Promise<File> }> }) => void) => void } }).launchQueue) {
      try {
        (window as unknown as { launchQueue: { setConsumer: (cb: (p: { files: Array<{ getFile: () => Promise<File> }> }) => void) => void } }).launchQueue.setConsumer(
          async (params) => {
            if (params.files && params.files.length) {
              const fileHandle = params.files[0];
              const file = await fileHandle.getFile();
              const text = await file.text();
              processJsonText(text, file.name);
            }
          }
        );
      } catch {
        // file handling note
      }
    }

    // 3. Global Drag and Drop
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    const handleDrop = async (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        if (file.name.endsWith('.json') || file.type === 'application/json') {
          const text = await file.text();
          processJsonText(text, file.name);
        }
      }
    };

    // 4. Global Clipboard Paste
    const handlePaste = async (e: ClipboardEvent) => {
      if (e.clipboardData && e.clipboardData.files.length > 0) {
        const file = e.clipboardData.files[0];
        if (file.name.endsWith('.json') || file.type === 'application/json') {
          const text = await file.text();
          processJsonText(text, file.name);
        }
      }
    };

    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('drop', handleDrop);
    window.addEventListener('paste', handlePaste);

    return () => {
      navigator.serviceWorker?.removeEventListener('message', handleServiceWorkerMessage);
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('drop', handleDrop);
      window.removeEventListener('paste', handlePaste);
    };
  }, []);

  if (!detectedData) return null;

  const isFullBackup = Object.keys(detectedData.floors).length >= 4;
  const sourceFloorName = detectedData.floorId
    ? FLOOR_DEFINITIONS[detectedData.floorId]?.name
    : isFullBackup
    ? 'Master Semua Lantai'
    : 'Lantai ' + targetFloor;

  const handleApplyBackup = () => {
    soundEffects.playClickSound();

    if (importMode === 'REPLACE') {
      const destination = isFullBackup ? 'Seluruh Lantai (1-4)' : `Lantai ${targetFloor}`;
      const confirmed = window.confirm(
        `⚠️ PERINGATAN TIMPA SEMUA:\n\nData stok saat ini di ${destination} akan DIHAPUS dan digantikan dengan isi file backup ini.\n\nLanjutkan?`
      );
      if (!confirmed) return;
    }

    const result = StockStorageEngine.importData(
      detectedData,
      isFullBackup ? undefined : targetFloor,
      importMode
    );

    setStatusMessage(result.message);
    if (result.success) {
      soundEffects.playBackupSent();
      setTimeout(() => setDetectedData(null), 1200);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 modal-backdrop anim-fade-in">
      <div className="bg-white rounded-2xl max-w-sm w-full shadow-xl overflow-hidden border border-stone-200 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-stone-100 bg-stone-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-stone-900 text-white flex items-center justify-center shadow-xs">
              <DownloadCloud size={16} />
            </div>
            <div>
              <h3 className="text-xs font-bold text-stone-900">File Backup Terdeteksi</h3>
              <p className="text-[10px] text-stone-500 font-medium mt-0.5 truncate max-w-[200px]">
                {fileName}
              </p>
            </div>
          </div>
          <button
            onClick={() => setDetectedData(null)}
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-900 hover:bg-stone-200 transition-colors touch-press"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-stone-900">
              <span>Sumber Data:</span>
              <span className="font-mono bg-stone-900 text-white px-2 py-0.5 rounded-lg text-[10px]">
                {sourceFloorName}
              </span>
            </div>

            <div className="text-[11px] text-stone-500 leading-relaxed">
              File cadangan ini dikirim dari Telegram / perangkat lain. Siap disinkronkan ke HP ini.
            </div>
          </div>

          <div className="space-y-2">
            <div>
              <label className="text-[10px] font-bold text-stone-500 block mb-1 uppercase tracking-wider">
                Terapkan Ke Lantai:
              </label>
              <select
                value={targetFloor}
                onChange={(e) => setTargetFloor(e.target.value as FloorId)}
                className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl font-bold"
              >
                {(['1', '2', '3', '4'] as FloorId[]).map((f) => (
                  <option key={f} value={f}>
                    {FLOOR_DEFINITIONS[f].name} ({FLOOR_DEFINITIONS[f].subtitle})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-stone-500 block mb-1 uppercase tracking-wider">
                Metode Impor:
              </label>
              <div className="grid grid-cols-2 gap-1">
                <button
                  type="button"
                  onClick={() => setImportMode('MERGE')}
                  className={`py-1.5 text-xs font-bold rounded-xl border transition-all touch-press ${
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
                  className={`py-1.5 text-xs font-bold rounded-xl border transition-all touch-press ${
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

          {statusMessage && (
            <div className="p-2.5 bg-stone-900 text-white rounded-xl text-xs font-bold text-center">
              {statusMessage}
            </div>
          )}

          <div className="pt-1">
            <button
              onClick={handleApplyBackup}
              className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 touch-press shadow-xs"
            >
              <CheckCircle size={14} /> Terapkan Backup ke Aplikasi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
