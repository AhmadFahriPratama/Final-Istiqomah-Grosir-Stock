import type { FloorId } from '../types/stock';
import { FLOOR_DEFINITIONS } from '../types/stock';
import { StockStorageEngine } from './db';

export class ReportService {
  /**
   * Generates a clean text report for a single floor
   */
  static generateFloorReport(floorId: FloorId): string {
    const floorInfo = FLOOR_DEFINITIONS[floorId];
    const data = StockStorageEngine.getFloorData(floorId);

    const now = new Date();
    const dateStr = now.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const totalQty = data.items.reduce((sum, it) => sum + it.quantity, 0);
    const outOfStockCount = data.items.filter((it) => it.quantity <= 0).length;
    const lowStockCount = data.items.filter(
      (it) => it.quantity > 0 && it.quantity <= it.minStock
    ).length;

    let report = `*LAPORAN STOK ${floorInfo.name.toUpperCase()} (${floorInfo.subtitle.toUpperCase()})*\n`;
    report += `Istiqomah Grosir Stock\n`;
    report += `Waktu: ${dateStr}\n`;
    report += `----------------------------------------\n\n`;

    report += `*RINGKASAN FISIK STOK:*\n`;
    report += `- Total Macam Barang : ${data.items.length} item\n`;
    report += `- Total Fisik Stok   : ${totalQty} unit\n`;
    report += `- Stok Kosong (0)    : ${outOfStockCount} item\n`;
    report += `- Stok Menipis (<=min): ${lowStockCount} item\n\n`;

    report += `*RINCIAN STOK PER JENIS:*\n`;
    data.categories.forEach((cat) => {
      const items = data.items.filter((it) => it.category === cat);
      if (items.length === 0) return;

      report += `\n[ ${cat.toUpperCase()} ] (${items.length} item)\n`;
      items.forEach((it) => {
        const statusBadge =
          it.quantity <= 0
            ? '[HABIS]'
            : it.quantity <= it.minStock
            ? '[MENIPIS]'
            : '[OK]';
        const locStr = it.locationDetails ? ` [Lokasi: ${it.locationDetails}]` : '';
        report += `  - ${it.name}${locStr}\n`;
        report += `    Stok: *${it.quantity} ${it.unit}* ${statusBadge}\n`;
      });
    });

    if (data.mutations.length > 0) {
      report += `\n----------------------------------------\n`;
      report += `*MUTASI TERAKHIR:*\n`;
      data.mutations.slice(0, 10).forEach((m) => {
        const symbol = m.type === 'IN' ? '+' : m.type === 'OUT' ? '-' : '';
        const timeStr = new Date(m.timestamp).toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
        });
        report += `- [${timeStr}] ${symbol}${m.amount} | ${m.itemName} (${m.prevStock} -> ${m.newStock}) - ${m.reason}\n`;
      });
    }

    report += `\n----------------------------------------\n`;
    report += `_Laporan otomatis oleh Istiqomah Grosir Stock_`;

    return report;
  }

  /**
   * Generates a clean master report for all 4 floors
   */
  static generateMasterReport(): string {
    const stats = StockStorageEngine.getAggregateStats();
    const now = new Date();
    const dateStr = now.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    let report = `*LAPORAN MASTER STOK SEMUA LANTAI*\n`;
    report += `Istiqomah Grosir Stock Multi-Floor\n`;
    report += `Waktu: ${dateStr}\n`;
    report += `----------------------------------------\n\n`;

    report += `*TOTAL REKAPITULASI FISIK STOK:*\n`;
    report += `- Total Macam Barang : ${stats.totalItemsCount} macam\n`;
    report += `- Total Fisik Stok   : ${stats.totalStockQty} unit\n`;
    report += `- Total Stok Habis   : ${stats.totalOutOfStockCount} item\n`;
    report += `- Total Stok Menipis : ${stats.totalLowStockCount} item\n\n`;

    report += `*REKAPITULASI PER LANTAI:*\n`;
    stats.floorSummaries.forEach((f) => {
      report += `\n[ ${f.name.toUpperCase()} - ${f.subtitle.toUpperCase()} ]\n`;
      report += `  - Jumlah Macam : ${f.itemCount} item\n`;
      report += `  - Total Stok   : *${f.stockQty} unit*\n`;
      report += `  - Stok Habis   : ${f.outOfStock} item\n`;
      report += `  - Stok Menipis : ${f.lowStock} item\n`;
    });

    report += `\n----------------------------------------\n`;
    report += `_Laporan dikompilasi oleh Istiqomah Grosir Stock_`;

    return report;
  }
}
