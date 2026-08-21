import type { BackupExportData, FloorId } from '../types/stock';
import { FLOOR_DEFINITIONS } from '../types/stock';
import { StockStorageEngine } from './db';
import { NetworkService } from './network';

export interface TelegramBackupResult {
  success: boolean;
  message: string;
}

export class TelegramService {
  // Test bot credentials
  static async testConnection(botToken: string, chatId: string): Promise<TelegramBackupResult> {
    const isOnline = await NetworkService.checkOnline();
    if (!isOnline) {
      return {
        success: false,
        message: 'Sambungkan ke internet dahulu untuk menguji bot Telegram.',
      };
    }

    if (!botToken || !chatId) {
      return {
        success: false,
        message: 'Bot Token dan Chat ID wajib diisi.',
      };
    }

    try {
      const text = `🟢 <b>Istiqomah Stock - Tes Koneksi</b>\n\nKoneksi bot Telegram berhasil terhubung!\nWaktu: ${new Date().toLocaleString('id-ID')}`;
      const url = `https://api.telegram.org/bot${botToken.trim()}/sendMessage`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId.trim(),
          text,
          parse_mode: 'HTML',
        }),
      });

      const resJson = await response.json();
      if (resJson.ok) {
        return { success: true, message: 'Koneksi Telegram berhasil terverifikasi!' };
      } else {
        return {
          success: false,
          message: `Telegram Error: ${resJson.description || 'Gagal mengirim pesan'}`,
        };
      }
    } catch (e) {
      return {
        success: false,
        message: `Sambungkan ke internet dahulu atau periksa koneksi bot: ${String(e)}`,
      };
    }
  }

  // Send Backup to Telegram (Text summary + JSON file for cross-device sync)
  static async sendBackup(
    backupData: BackupExportData,
    customFloorId?: FloorId
  ): Promise<TelegramBackupResult> {
    const isOnline = await NetworkService.checkOnline();
    if (!isOnline) {
      return {
        success: false,
        message: 'Sambungkan ke internet dahulu untuk mengirim backup ke Telegram.',
      };
    }

    const settings = StockStorageEngine.getAdminSettings();
    const { botToken, chatId } = settings.telegram;

    if (!botToken || !chatId) {
      return {
        success: false,
        message: 'API Key Telegram belum disetel di Dashboard Utama.',
      };
    }

    try {
      const nowFormatted = new Date().toLocaleString('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });

      let caption = '';
      let filename = '';

      if (customFloorId) {
        const floorInfo = FLOOR_DEFINITIONS[customFloorId];
        const floorData = backupData.floors[customFloorId];
        const totalItems = floorData?.items.length || 0;
        const totalQty = floorData?.items.reduce((acc, it) => acc + it.quantity, 0) || 0;
        const outOfStock = floorData?.items.filter((it) => it.quantity <= 0).length || 0;

        filename = `IstiqomahStock_${floorInfo.name.replace(/\s+/g, '')}_${new Date().toISOString().slice(0, 10)}.json`;
        caption =
          `📦 <b>BACKUP DATA STOK ${floorInfo.name.toUpperCase()} (${floorInfo.subtitle.toUpperCase()})</b>\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `📅 Waktu: ${nowFormatted}\n` +
          `🏷️ Total Macam Barang: <b>${totalItems}</b> item\n` +
          `📊 Total Fisik Stok: <b>${totalQty}</b> unit\n` +
          `⚠️ Stok Kosong: <b>${outOfStock}</b> item\n\n` +
          `<i>File JSON ini dapat diimpor langsung ke HP lantai lain / master HP.</i>`;
      } else {
        const stats = StockStorageEngine.getAggregateStats();
        filename = `IstiqomahStock_FULL_BACKUP_${new Date().toISOString().slice(0, 10)}.json`;
        caption =
          `🏢 <b>BACKUP MASTER SEMUA LANTAI - ISTIQOMAH STOCK</b>\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `📅 Waktu: ${nowFormatted}\n` +
          `🏷️ Total Seluruh Item: <b>${stats.totalItemsCount}</b> macam\n` +
          `📊 Total Seluruh Unit: <b>${stats.totalStockQty}</b> unit\n` +
          `⚠️ Stok Kosong: <b>${stats.totalOutOfStockCount}</b> | Menipis: <b>${stats.totalLowStockCount}</b>\n\n` +
          `<i>File database cadangan lengkap terlampir untuk sinkronisasi multi-device.</i>`;
      }

      // Prepare JSON File Blob
      const jsonString = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const file = new File([blob], filename, { type: 'application/json' });

      const formData = new FormData();
      formData.append('chat_id', chatId.trim());
      formData.append('caption', caption);
      formData.append('parse_mode', 'HTML');
      formData.append('document', file);

      const sendDocUrl = `https://api.telegram.org/bot${botToken.trim()}/sendDocument`;

      const response = await fetch(sendDocUrl, {
        method: 'POST',
        body: formData,
      });

      const resJson = await response.json();

      if (resJson.ok) {
        settings.telegram.lastBackupTime = new Date().toISOString();
        settings.telegram.lastStatus = 'SUCCESS';
        settings.telegram.lastMessage = 'Backup berhasil dikirim ke Telegram';
        StockStorageEngine.saveAdminSettings(settings);

        return {
          success: true,
          message: `Berhasil upload backup ke Telegram (${filename})!`,
        };
      } else {
        settings.telegram.lastStatus = 'FAILED';
        settings.telegram.lastMessage = resJson.description || 'Gagal upload dokumen';
        StockStorageEngine.saveAdminSettings(settings);

        return {
          success: false,
          message: `Telegram Error: ${resJson.description || 'Gagal upload backup'}`,
        };
      }
    } catch (e) {
      return {
        success: false,
        message: `Sambungkan ke internet dahulu untuk mengirim backup: ${String(e)}`,
      };
    }
  }
}
