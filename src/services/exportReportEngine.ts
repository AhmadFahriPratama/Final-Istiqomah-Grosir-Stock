import type { FloorId, StockItem } from '../types/stock';
import { FLOOR_DEFINITIONS } from '../types/stock';
import { StockStorageEngine } from './db';
import { TelegramService, type TelegramBackupResult } from './telegram';
import { soundEffects } from '../utils/audio';

export interface ReportItemRow {
  no: number;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  minStock: number;
  maxStock?: number;
  location: string;
  barcode: string;
  status: 'HABIS' | 'MENIPIS' | 'NORMAL' | 'PENUH';
}

export class ExportReportEngine {
  /**
   * Helper to retrieve items grouped by category for a specific floor or all floors
   */
  static getGroupedData(floorId: FloorId | 'ALL'): {
    title: string;
    subtitle: string;
    dateFormatted: string;
    totalStockQty: number;
    totalItemCount: number;
    totalLowStock: number;
    totalOutOfStock: number;
    sections: {
      floorName: string;
      floorId: FloorId;
      categories: {
        categoryName: string;
        items: ReportItemRow[];
        categoryTotalQty: number;
      }[];
    }[];
  } {
    const now = new Date();
    const dateFormatted = now.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const targetFloorIds: FloorId[] =
      floorId === 'ALL' ? ['1', '2', '3', '4'] : [floorId];

    let totalStockQty = 0;
    let totalItemCount = 0;
    let totalLowStock = 0;
    let totalOutOfStock = 0;

    const sections = targetFloorIds.map((fId) => {
      const fInfo = FLOOR_DEFINITIONS[fId];
      const data = StockStorageEngine.getFloorData(fId);

      const categoryMap = new Map<string, StockItem[]>();
      data.categories.forEach((cat) => categoryMap.set(cat, []));
      data.items.forEach((item) => {
        const cat = item.category || 'Umum';
        if (!categoryMap.has(cat)) categoryMap.set(cat, []);
        categoryMap.get(cat)!.push(item);
      });

      const categories = Array.from(categoryMap.entries())
        .filter(([_, items]) => items.length > 0)
        .map(([catName, items]) => {
          let catTotal = 0;
          const rows: ReportItemRow[] = items.map((it, idx) => {
            catTotal += it.quantity;
            totalStockQty += it.quantity;
            totalItemCount += 1;

            let status: 'HABIS' | 'MENIPIS' | 'NORMAL' | 'PENUH' = 'NORMAL';
            if (it.quantity <= 0) {
              status = 'HABIS';
              totalOutOfStock += 1;
            } else if (it.quantity <= it.minStock && it.minStock > 0) {
              status = 'MENIPIS';
              totalLowStock += 1;
            } else if (it.maxStock && it.quantity >= it.maxStock) {
              status = 'PENUH';
            }

            return {
              no: idx + 1,
              name: it.name,
              category: catName,
              quantity: it.quantity,
              unit: it.unit,
              minStock: it.minStock,
              maxStock: it.maxStock,
              location: it.locationDetails || '-',
              barcode: it.barcode || '-',
              status,
            };
          });

          return {
            categoryName: catName,
            items: rows,
            categoryTotalQty: catTotal,
          };
        });

      return {
        floorName: `${fInfo.name} (${fInfo.subtitle})`,
        floorId: fId,
        categories,
      };
    });

    const title =
      floorId === 'ALL'
        ? 'LAPORAN REKAPITULASI STOK SEMUA LANTAI'
        : `LAPORAN STOK ${FLOOR_DEFINITIONS[floorId].name.toUpperCase()}`;

    const subtitle =
      floorId === 'ALL'
        ? 'Istiqomah Grosir Stock • Multi-Floor Master Report'
        : `Istiqomah Grosir Stock • Divisi ${FLOOR_DEFINITIONS[floorId].subtitle}`;

    return {
      title,
      subtitle,
      dateFormatted,
      totalStockQty,
      totalItemCount,
      totalLowStock,
      totalOutOfStock,
      sections,
    };
  }

  /**
   * 1. Export as Printable Multi-Page PDF Document
   * Formats with clean page breaks per category and printable layout
   */
  static generatePDFPrint(floorId: FloorId | 'ALL') {
    soundEffects.playClickSound();
    const data = this.getGroupedData(floorId);

    let htmlContent = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>${data.title} - ${data.dateFormatted}</title>
  <style>
    @page {
      size: A4;
      margin: 12mm 12mm 15mm 12mm;
      @bottom-right {
        content: "Halaman " counter(page) " dari " counter(pages);
        font-size: 8pt;
        font-family: sans-serif;
      }
    }
    body {
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
      color: #18181b;
      margin: 0;
      padding: 10px;
      font-size: 9.5pt;
      line-height: 1.3;
      background: #ffffff;
    }
    .header {
      border-bottom: 2px solid #09090b;
      padding-bottom: 8px;
      margin-bottom: 12px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .header-left h1 {
      margin: 0;
      font-size: 15pt;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: -0.5px;
      color: #09090b;
    }
    .header-left p {
      margin: 2px 0 0 0;
      font-size: 8.5pt;
      color: #52525b;
      font-weight: 500;
    }
    .header-right {
      text-align: right;
      font-size: 8pt;
      color: #71717a;
    }
    .stats-box {
      display: flex;
      gap: 10px;
      margin-bottom: 14px;
    }
    .stat-card {
      flex: 1;
      background: #f4f4f5;
      border: 1px solid #e4e4e7;
      border-radius: 6px;
      padding: 6px 8px;
      text-align: center;
    }
    .stat-card .val {
      font-size: 12pt;
      font-weight: 800;
      font-family: 'Courier New', Courier, monospace;
      color: #09090b;
      margin-bottom: 1px;
    }
    .stat-card .lbl {
      font-size: 7.5pt;
      color: #71717a;
      text-transform: uppercase;
      font-weight: 700;
    }
    .floor-title {
      font-size: 11.5pt;
      font-weight: 800;
      background: #09090b;
      color: #ffffff;
      padding: 4px 8px;
      border-radius: 4px;
      margin: 14px 0 8px 0;
      text-transform: uppercase;
    }
    .category-section {
      margin-bottom: 16px;
      page-break-inside: avoid;
    }
    .category-header {
      background: #f4f4f5;
      border-left: 3px solid #09090b;
      padding: 4px 8px;
      font-size: 9.5pt;
      font-weight: 700;
      margin-bottom: 4px;
      display: flex;
      justify-content: space-between;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 8px;
      font-size: 8.5pt;
    }
    th {
      background: #e4e4e7;
      color: #18181b;
      font-weight: 700;
      text-align: left;
      padding: 4px 6px;
      border: 1px solid #d4d4d8;
      font-size: 8pt;
      text-transform: uppercase;
    }
    td {
      padding: 4px 6px;
      border: 1px solid #e4e4e7;
      vertical-align: middle;
    }
    tr:nth-child(even) {
      background: #fafafa;
    }
    .num {
      text-align: right;
      font-family: 'Courier New', Courier, monospace;
      font-weight: 700;
    }
    .center {
      text-align: center;
    }
    .badge {
      display: inline-block;
      padding: 1px 4px;
      border-radius: 3px;
      font-size: 7pt;
      font-weight: 700;
      text-transform: uppercase;
    }
    .badge-habis {
      background: #fee2e2;
      color: #991b1b;
    }
    .badge-menipis {
      background: #fef3c7;
      color: #92400e;
    }
    .badge-ok {
      background: #dcfce7;
      color: #166534;
    }
    .badge-penuh {
      background: #f3f4f6;
      color: #374151;
    }
    .footer-sign {
      margin-top: 25px;
      display: flex;
      justify-content: space-between;
      page-break-inside: avoid;
    }
    .sign-box {
      width: 180px;
      text-align: center;
      font-size: 8.5pt;
    }
    .sign-space {
      height: 45px;
    }
    .page-break {
      page-break-before: always;
    }
    @media print {
      body {
        padding: 0;
      }
      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-left">
      <h1>${data.title}</h1>
      <p>${data.subtitle}</p>
    </div>
    <div class="header-right">
      <strong>Dicetak:</strong><br>${data.dateFormatted}
    </div>
  </div>

  <div class="stats-box">
    <div class="stat-card">
      <div class="val">${data.totalStockQty}</div>
      <div class="lbl">Total Fisik Unit</div>
    </div>
    <div class="stat-card">
      <div class="val">${data.totalItemCount}</div>
      <div class="lbl">Macam Barang</div>
    </div>
    <div class="stat-card">
      <div class="val">${data.totalOutOfStock}</div>
      <div class="lbl">Stok Habis (0)</div>
    </div>
    <div class="stat-card">
      <div class="val">${data.totalLowStock}</div>
      <div class="lbl">Stok Menipis</div>
    </div>
  </div>
`;

    data.sections.forEach((sec, sIdx) => {
      if (sIdx > 0 && floorId === 'ALL') {
        htmlContent += `<div class="page-break"></div>`;
      }

      htmlContent += `<div class="floor-title">${sec.floorName}</div>`;

      if (sec.categories.length === 0) {
        htmlContent += `<p style="font-style:italic;color:#71717a;padding:8px;">Belum ada data barang di lantai ini.</p>`;
      }

      sec.categories.forEach((cat) => {
        htmlContent += `
        <div class="category-section">
          <div class="category-header">
            <span>Kategori: ${cat.categoryName.toUpperCase()}</span>
            <span>Total: ${cat.categoryTotalQty} unit (${cat.items.length} item)</span>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 25px;" class="center">No</th>
                <th>Nama Produk</th>
                <th style="width: 80px;">SKU / Barcode</th>
                <th style="width: 65px;" class="num">Stok</th>
                <th style="width: 45px;">Satuan</th>
                <th style="width: 45px;" class="num">Min</th>
                <th style="width: 45px;" class="num">Max</th>
                <th style="width: 75px;">Lokasi Rak</th>
                <th style="width: 55px;" class="center">Status</th>
              </tr>
            </thead>
            <tbody>
        `;

        cat.items.forEach((it) => {
          const badgeClass =
            it.status === 'HABIS'
              ? 'badge-habis'
              : it.status === 'MENIPIS'
              ? 'badge-menipis'
              : it.status === 'PENUH'
              ? 'badge-penuh'
              : 'badge-ok';

          htmlContent += `
              <tr>
                <td class="center font-mono">${it.no}</td>
                <td><strong>${it.name}</strong></td>
                <td style="font-family: monospace; font-size: 7.5pt;">${it.barcode}</td>
                <td class="num">${it.quantity}</td>
                <td>${it.unit}</td>
                <td class="num">${it.minStock || 0}</td>
                <td class="num">${it.maxStock || '∞'}</td>
                <td>${it.location}</td>
                <td class="center"><span class="badge ${badgeClass}">${it.status}</span></td>
              </tr>
          `;
        });

        htmlContent += `
            </tbody>
          </table>
        </div>
        `;
      });
    });

    htmlContent += `
  <div class="footer-sign">
    <div class="sign-box">
      <div>Dibuat Oleh (Petugas),</div>
      <div class="sign-space"></div>
      <div><strong>( ................................ )</strong></div>
    </div>
    <div class="sign-box">
      <div>Mengetahui (Super Admin),</div>
      <div class="sign-space"></div>
      <div><strong>Fahri</strong></div>
    </div>
  </div>

  <script>
    window.onload = function() {
      window.print();
    };
  </script>
</body>
</html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(htmlContent);
      printWindow.document.close();
    } else {
      alert('Izinkan pop-up untuk mencetak / menyimpan PDF laporan.');
    }
  }

  /**
   * 2. Export as XLSX / Excel Spreadsheet
   * Generates clean formatted SpreadsheetML / HTML table file with borders and totals
   */
  static generateExcel(floorId: FloorId | 'ALL') {
    soundEffects.playClickSound();
    const data = this.getGroupedData(floorId);

    let excelHTML = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Laporan Stok</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          table { border-collapse: collapse; font-family: Arial, sans-serif; font-size: 10pt; }
          th { background-color: #18181b; color: #ffffff; font-weight: bold; border: 1px solid #000000; padding: 6px; }
          td { border: 1px solid #d4d4d8; padding: 5px; }
          .title { font-size: 14pt; font-weight: bold; }
          .subtitle { font-size: 10pt; color: #52525b; }
          .cat-header { background-color: #e4e4e7; font-weight: bold; border: 1px solid #71717a; }
          .floor-header { background-color: #09090b; color: #ffffff; font-weight: bold; font-size: 11pt; }
          .num { mso-number-format:"\\#\\,\\#\\#0"; text-align: right; font-weight: bold; }
          .center { text-align: center; }
        </style>
      </head>
      <body>
        <table>
          <tr><td colspan="9" class="title">${data.title}</td></tr>
          <tr><td colspan="9" class="subtitle">${data.subtitle} • Waktu: ${data.dateFormatted}</td></tr>
          <tr><td colspan="9">Total Unit: ${data.totalStockQty} | Total Macam: ${data.totalItemCount} | Habis: ${data.totalOutOfStock} | Menipis: ${data.totalLowStock}</td></tr>
          <tr><td colspan="9"></td></tr>
    `;

    data.sections.forEach((sec) => {
      excelHTML += `
        <tr><td colspan="9" class="floor-header">${sec.floorName.toUpperCase()}</td></tr>
      `;

      sec.categories.forEach((cat) => {
        excelHTML += `
          <tr><td colspan="9" class="cat-header">Kategori: ${cat.categoryName.toUpperCase()} (${cat.items.length} item • Total: ${cat.categoryTotalQty} unit)</td></tr>
          <tr>
            <th>No</th>
            <th>Nama Produk</th>
            <th>Kategori</th>
            <th>SKU / Barcode</th>
            <th>Stok Fisik</th>
            <th>Satuan</th>
            <th>Batas Min</th>
            <th>Batas Max</th>
            <th>Lokasi Rak</th>
            <th>Status</th>
          </tr>
        `;

        cat.items.forEach((it) => {
          excelHTML += `
            <tr>
              <td class="center">${it.no}</td>
              <td><b>${it.name}</b></td>
              <td>${it.category}</td>
              <td style="mso-number-format:'\\@';">${it.barcode}</td>
              <td class="num">${it.quantity}</td>
              <td>${it.unit}</td>
              <td class="num">${it.minStock}</td>
              <td class="num">${it.maxStock || ''}</td>
              <td>${it.location}</td>
              <td class="center">${it.status}</td>
            </tr>
          `;
        });
        excelHTML += `<tr><td colspan="9"></td></tr>`;
      });
    });

    excelHTML += `</table></body></html>`;

    const blob = new Blob([excelHTML], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const filename = `Laporan_Stok_${floorId === 'ALL' ? 'SemuaLantai' : 'Lt' + floorId}_${new Date().toISOString().slice(0, 10)}.xls`;

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    soundEffects.playBackupSent();
  }

  /**
   * 3. Export as DOCX / Word Document
   * Formatted with tables, headers, and category sections
   */
  static generateWordDoc(floorId: FloorId | 'ALL') {
    soundEffects.playClickSound();
    const data = this.getGroupedData(floorId);

    let docHTML = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${data.title}</title>
        <style>
          body { font-family: 'Calibri', 'Segoe UI', Arial, sans-serif; font-size: 10.5pt; color: #18181b; }
          h1 { font-size: 16pt; margin: 0; color: #09090b; font-weight: bold; }
          p.sub { font-size: 9.5pt; color: #52525b; margin: 2px 0 14px 0; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
          th { background-color: #18181b; color: #ffffff; padding: 6px 8px; border: 1px solid #000000; font-size: 9pt; text-align: left; }
          td { border: 1px solid #d4d4d8; padding: 5px 8px; font-size: 9.5pt; }
          .floor-title { background: #09090b; color: #ffffff; padding: 6px 10px; font-size: 12pt; font-weight: bold; margin-top: 15px; }
          .cat-title { background: #f4f4f5; border-left: 4px solid #09090b; padding: 5px 10px; font-size: 10.5pt; font-weight: bold; margin: 10px 0 4px 0; }
          .num { text-align: right; font-family: monospace; font-weight: bold; }
          .center { text-align: center; }
        </style>
      </head>
      <body>
        <h1>${data.title}</h1>
        <p class="sub">${data.subtitle} • Waktu Cetak: ${data.dateFormatted}</p>
        <p><strong>Ringkasan:</strong> Total Unit: <b>${data.totalStockQty}</b> | Total Macam: <b>${data.totalItemCount}</b> | Stok Habis: <b>${data.totalOutOfStock}</b> | Stok Menipis: <b>${data.totalLowStock}</b></p>
        <hr/>
    `;

    data.sections.forEach((sec, idx) => {
      if (idx > 0 && floorId === 'ALL') {
        docHTML += `<br clear="all" style="page-break-before:always" />`;
      }

      docHTML += `<div class="floor-title">${sec.floorName.toUpperCase()}</div>`;

      sec.categories.forEach((cat) => {
        docHTML += `
          <div class="cat-title">Kategori: ${cat.categoryName.toUpperCase()} (${cat.items.length} item • Total: ${cat.categoryTotalQty} unit)</div>
          <table>
            <thead>
              <tr>
                <th style="width: 30px;" class="center">No</th>
                <th>Nama Produk</th>
                <th style="width: 100px;">SKU / Barcode</th>
                <th style="width: 70px;" class="num">Stok</th>
                <th style="width: 50px;">Satuan</th>
                <th style="width: 50px;" class="num">Min</th>
                <th style="width: 80px;">Lokasi</th>
                <th style="width: 60px;" class="center">Status</th>
              </tr>
            </thead>
            <tbody>
        `;

        cat.items.forEach((it) => {
          docHTML += `
            <tr>
              <td class="center">${it.no}</td>
              <td><b>${it.name}</b></td>
              <td style="font-family: monospace;">${it.barcode}</td>
              <td class="num">${it.quantity}</td>
              <td>${it.unit}</td>
              <td class="num">${it.minStock}</td>
              <td>${it.location}</td>
              <td class="center"><b>${it.status}</b></td>
            </tr>
          `;
        });

        docHTML += `</tbody></table>`;
      });
    });

    docHTML += `</body></html>`;

    const blob = new Blob(['\ufeff' + docHTML], { type: 'application/msword;charset=utf-8' });
    const filename = `Laporan_Stok_${floorId === 'ALL' ? 'SemuaLantai' : 'Lt' + floorId}_${new Date().toISOString().slice(0, 10)}.doc`;

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    soundEffects.playBackupSent();
  }

  /**
   * 4. Send Rich Telegram Report with custom floor selection
   */
  static async sendTelegramReport(floorId: FloorId | 'ALL'): Promise<TelegramBackupResult> {
    soundEffects.playClickSound();

    if (floorId === 'ALL') {
      const backupData = StockStorageEngine.exportAllFloors();
      return await TelegramService.sendBackup(backupData);
    } else {
      const backupData = StockStorageEngine.exportSingleFloor(floorId);
      return await TelegramService.sendBackup(backupData, floorId);
    }
  }
}
