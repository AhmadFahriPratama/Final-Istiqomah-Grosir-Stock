import React, { useState } from 'react';
import { X, Send, Bot, CheckCircle2, ShieldCheck } from 'lucide-react';
import type { AdminSettings } from '../types/stock';
import { StockStorageEngine } from '../services/db';
import { TelegramService } from '../services/telegram';
import { soundEffects } from '../utils/audio';

interface TelegramSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AdminSettings;
  onSettingsUpdated: (updated: AdminSettings) => void;
}

export const TelegramSettingsModal: React.FC<TelegramSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSettingsUpdated,
}) => {
  const [botToken, setBotToken] = useState(settings.telegram.botToken || '');
  const [chatId, setChatId] = useState(settings.telegram.chatId || '');
  const [autoBackup, setAutoBackup] = useState(settings.telegram.autoBackup || false);
  const [telegramStatus, setTelegramStatus] = useState<string | null>(null);
  const [isTestingTelegram, setIsTestingTelegram] = useState(false);
  const [isSendingBackup, setIsSendingBackup] = useState(false);

  if (!isOpen) return null;

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
    onSettingsUpdated(updated);
    setTelegramStatus('Pengaturan Telegram berhasil disimpan.');
    setTimeout(() => setTelegramStatus(null), 3000);
  };

  const handleTestTelegram = async () => {
    soundEffects.playClickSound();
    setIsTestingTelegram(true);
    setTelegramStatus('Menguji koneksi ke Telegram...');
    try {
      const res = await TelegramService.testConnection(botToken, chatId);
      setTelegramStatus(res.message);
      if (res.success) {
        soundEffects.playUnlockSound();
      } else {
        alert(res.message);
      }
    } catch (e) {
      const errMsg = 'Sambungkan ke internet dahulu: ' + String(e);
      setTelegramStatus(errMsg);
      alert(errMsg);
    } finally {
      setIsTestingTelegram(false);
    }
  };

  const handleSendFullTelegramBackup = async () => {
    soundEffects.playClickSound();
    setIsSendingBackup(true);
    setTelegramStatus('Mengirim database ke Telegram...');
    try {
      const backupData = StockStorageEngine.exportAllFloors();
      const res = await TelegramService.sendBackup(backupData);
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
      setIsSendingBackup(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 modal-backdrop animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-zinc-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-zinc-100 bg-zinc-50/90 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-black text-white flex items-center justify-center shadow-xs">
              <Bot size={16} />
            </div>
            <div>
              <h3 className="text-xs font-bold text-black leading-none">
                Telegram Bot & Auto-Backup
              </h3>
              <p className="text-[10px] text-zinc-500 font-medium mt-0.5">
                Pusat integrasi backup data cloud otomatis
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
        <div className="p-4 overflow-y-auto space-y-3.5 flex-1">
          <div>
            <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider block mb-1">
              Bot Token (@BotFather):
            </label>
            <input
              type="text"
              value={botToken}
              onChange={(e) => setBotToken(e.target.value)}
              placeholder="123456789:ABCdefGhIJKlm..."
              className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl font-mono focus:outline-none focus:border-black font-bold"
            />
            <p className="text-[10px] text-zinc-400 mt-1">
              Dapatkan token bot pribadi dari <strong>@BotFather</strong> di Telegram.
            </p>
          </div>

          <div>
            <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider block mb-1">
              Chat ID / Channel ID:
            </label>
            <input
              type="text"
              value={chatId}
              onChange={(e) => setChatId(e.target.value)}
              placeholder="-100123456789"
              className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl font-mono focus:outline-none focus:border-black font-bold"
            />
            <p className="text-[10px] text-zinc-400 mt-1">
              Chat ID akun pribadi atau Channel ID tujuan backup file JSON.
            </p>
          </div>

          <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-2xl">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={autoBackup}
                onChange={(e) => setAutoBackup(e.target.checked)}
                className="rounded text-black w-4 h-4 focus:ring-0 cursor-pointer"
              />
              <div>
                <span className="text-xs font-bold text-black block">
                  Auto-Backup Otomatis
                </span>
                <span className="text-[10px] text-zinc-500 block">
                  Kirim backup database otomatis ke Telegram setiap kali terjadi perubahan data saat online.
                </span>
              </div>
            </label>
          </div>

          {telegramStatus && (
            <div className="p-2.5 rounded-xl bg-zinc-100 border border-zinc-200 text-xs text-black font-semibold flex items-center gap-2">
              <CheckCircle2 size={15} className="text-black shrink-0" />
              <span>{telegramStatus}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={handleTestTelegram}
              disabled={isTestingTelegram}
              className="py-2.5 bg-zinc-100 hover:bg-zinc-200 text-black border border-zinc-200 rounded-xl text-xs font-bold touch-press disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <ShieldCheck size={14} />
              {isTestingTelegram ? 'Menguji...' : 'Tes Koneksi Bot'}
            </button>

            <button
              onClick={handleSendFullTelegramBackup}
              disabled={isSendingBackup}
              className="py-2.5 bg-zinc-900 hover:bg-black text-white rounded-xl text-xs font-bold touch-press disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Send size={13} />
              {isSendingBackup ? 'Mengirim...' : 'Kirim Backup Sekarang'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-zinc-50 border-t border-zinc-100 flex justify-end gap-2 shrink-0">
          <button
            onClick={() => {
              soundEffects.playClickSound();
              onClose();
            }}
            className="px-4 py-2 bg-zinc-200 hover:bg-zinc-300 text-black rounded-xl text-xs font-bold touch-press"
          >
            Batal
          </button>
          <button
            onClick={handleSaveTelegram}
            className="px-4 py-2 bg-black hover:bg-zinc-800 text-white rounded-xl text-xs font-bold touch-press shadow-xs"
          >
            Simpan Pengaturan
          </button>
        </div>
      </div>
    </div>
  );
};
