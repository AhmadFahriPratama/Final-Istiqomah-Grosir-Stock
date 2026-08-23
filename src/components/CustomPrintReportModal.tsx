import React, { useState, useMemo } from 'react';
import {
  X,
  Printer,
  FileDown,
} from 'lucide-react';
import { ExportReportEngine, type ReportFilterOptions } from '../services/exportReportEngine';
import { soundEffects } from '../utils/audio';
import { useRegisterModal } from '../utils/modalManager';

export type PaperSize = 'A4' | 'F4' | 'A5' | 'THERMAL';

interface CustomPrintReportModalProps {
  isOpen: boolean;
  filterOptions: ReportFilterOptions;
  onClose: () => void;
}

export const CustomPrintReportModal: React.FC<CustomPrintReportModalProps> = ({
  isOpen,
  filterOptions,
  onClose,
}) => {
  useRegisterModal('CustomPrintReportModal', isOpen, onClose);

  const [paperSize, setPaperSize] = useState<PaperSize>('A4');

  const reportData = useMemo(() => {
    return ExportReportEngine.getGroupedData(filterOptions);
  }, [filterOptions, isOpen]);

  if (!isOpen) return null;

  const isThermal = paperSize === 'THERMAL';

  const handlePrint = () => {
    soundEffects.playClickSound();

    const printStyles = `
      @page {
        size: ${paperSize === 'THERMAL' ? '80mm auto' : `${paperSize} portrait`};
        margin: ${isThermal ? '4mm' : '10mm 12mm 12mm 12mm'};
        @bottom-right {
          content: "Halaman " counter(page) " dari " counter(pages);
          font-size: 8pt;
          font-family: sans-serif;
        }
      }
      * { box-sizing: border-box; }
      body {
        font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
        color: #2a1a10;
        margin: 0;
        padding: ${isThermal ? '2px' : '4px'};
        font-size: ${isThermal ? '8pt' : '9pt'};
        line-height: 1.35;
        background: #ffffff;
      }
      .header-wrap {
        border-bottom: 2px solid #2a1a10;
        padding-bottom: 6px;
        margin-bottom: 8px;
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
      }
      .title {
        font-size: ${isThermal ? '11pt' : '13pt'};
        font-weight: 800;
        margin: 0;
        color: #2a1a10;
        text-transform: uppercase;
        letter-spacing: -0.2px;
      }
      .sub {
        font-size: 8pt;
        color: #78604d;
        margin: 2px 0 0 0;
        font-weight: 600;
      }
      .meta-line {
        font-size: 7.5pt;
        color: #78604d;
        margin-bottom: 8px;
      }
      .floor-header {
        background: #2a1a10;
        color: #faf5e8;
        padding: 3.5px 8px;
        font-size: 9.5pt;
        font-weight: 700;
        border-radius: 3px;
        margin: 10px 0 5px 0;
        text-transform: uppercase;
      }
      .cat-section {
        margin-bottom: 10px;
        page-break-inside: avoid;
      }
      .cat-header {
        background: #f0e7d2;
        border-left: 3px solid #8a4f25;
        padding: 3px 6px;
        font-size: 8.5pt;
        font-weight: 700;
        margin-bottom: 3px;
        display: flex;
        justify-content: space-between;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 6px;
        font-size: ${isThermal ? '7.5pt' : '8.5pt'};
      }
      th {
        background: #ebe0c8;
        color: #2a1a10;
        font-weight: 700;
        text-align: left;
        padding: 3px 5px;
        border: 1px solid #ded2b8;
        font-size: 8pt;
      }
      td {
        padding: 3px 5px;
        border: 1px solid #ded2b8;
        vertical-align: middle;
      }
      tr:nth-child(even) {
        background: #faf5e8;
      }
      .num { text-align: right; font-family: monospace; font-weight: bold; }
      .center { text-align: center; }
      .badge {
        display: inline-block;
        padding: 1px 3px;
        border-radius: 2px;
        font-size: 6.5pt;
        font-weight: 700;
      }
      .badge-habis { background: #fee2e2; color: #991b1b; }
      .badge-menipis { background: #fef3c7; color: #92400e; }
      .badge-ok { background: #dcfce7; color: #166534; }
      .badge-penuh { background: #f3f4f6; color: #374151; }
      .footer-sign {
        margin-top: 20px;
        display: flex;
        justify-content: space-between;
        page-break-inside: avoid;
      }
      .sign-box {
        width: 150px;
        text-align: center;
        font-size: 8pt;
      }
      .sign-space { height: 40px; }
      @media print {
        body { padding: 0; background: transparent; }
      }
    `;

    const printHtml = `
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8">
        <title>${reportData.title}</title>
        <style>${printStyles}</style>
      </head>
      <body>
        <div class="header-wrap">
          <div>
            <h1 class="title">${reportData.title}</h1>
            <p class="sub">${reportData.subtitle}</p>
          </div>
          <div style="text-align:right; font-size:7.5pt; color:#78604d;">
            ${reportData.dateFormatted}
          </div>
        </div>

        <div class="meta-line">
          ${reportData.filterSummary} • Total: ${reportData.totalStockQty} unit (${reportData.totalItemCount} item)
        </div>

        ${reportData.sections
          .map(
            (sec) => `
          <div class="floor-header">${sec.floorName}</div>
          ${sec.categories
            .map(
              (cat) => `
            <div class="cat-section">
              <div class="cat-header">
                <span>Jenis: ${cat.categoryName}</span>
                <span>Total: ${cat.categoryTotalQty} unit (${cat.items.length} item)</span>
              </div>
              <table>
                <thead>
                  <tr>
                    <th style="width:20px;" class="center">No</th>
                    <th>Nama Produk</th>
                    <th style="width:75px;">SKU</th>
                    <th style="width:50px;" class="num">Stok</th>
                    <th style="width:40px;">Satuan</th>
                    <th style="width:40px;" class="num">Min</th>
                    <th style="width:65px;">Lokasi</th>
                    <th style="width:45px;" class="center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${cat.items
                    .map(
                      (it) => `
                    <tr>
                      <td class="center font-mono">${it.no}</td>
                      <td><b>${it.name}</b></td>
                      <td style="font-family:monospace;font-size:7pt;">${it.barcode}</td>
                      <td class="num">${it.quantity}</td>
                      <td>${it.unit}</td>
                      <td class="num">${it.minStock || 0}</td>
                      <td>${it.location}</td>
                      <td class="center"><span class="badge ${
                        it.status === 'HABIS'
                          ? 'badge-habis'
                          : it.status === 'MENIPIS'
                          ? 'badge-menipis'
                          : it.status === 'PENUH'
                          ? 'badge-penuh'
                          : 'badge-ok'
                      }">${it.status}</span></td>
                    </tr>
                  `
                    )
                    .join('')}
                </tbody>
              </table>
            </div>
          `
            )
            .join('')}
        `
          )
          .join('')}

        <div class="footer-sign">
          <div class="sign-box">
            <div>Dibuat Oleh,</div>
            <div class="sign-space"></div>
            <div><b>( ................................ )</b></div>
          </div>
          <div class="sign-box">
            <div>Mengetahui,</div>
            <div class="sign-space"></div>
            <div><b>Fahri</b></div>
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

    const printWin = window.open('', '_blank');
    if (printWin) {
      printWin.document.open();
      printWin.document.write(printHtml);
      printWin.document.close();
    } else {
      alert('Izinkan pop-up untuk mencetak.');
    }
  };

  const handleDownloadHTML = () => {
    soundEffects.playClickSound();
    const data = reportData;

    const fullHTML = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>${data.title} - ${data.dateFormatted}</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background: #faf5e8; color: #2a1a10; padding: 20px; max-width: 900px; margin: 0 auto; }
    h1 { color: #2a1a10; margin: 0; text-transform: uppercase; font-size: 14pt; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { border: 1px solid #ded2b8; padding: 5px 8px; font-size: 9pt; }
    th { background: #ebe0c8; }
  </style>
</head>
<body>
  <h1>${data.title}</h1>
  <p>${data.subtitle} • ${data.dateFormatted}</p>
  <p><strong>Filter:</strong> ${data.filterSummary}</p>
  <hr/>
</body>
</html>`;

    const blob = new Blob([fullHTML], { type: 'text/html;charset=utf-8;' });
    const filename = `Laporan_${paperSize}_${new Date().toISOString().slice(0, 10)}.html`;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    soundEffects.playBackupSent();
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-2 sm:p-4 modal-backdrop anim-fade-in overflow-hidden">
      <div className="bg-[#f5eedc] rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden border-2 border-[#2a1a10] flex flex-col h-[92vh] anim-slide-up text-left">
        {/* Simple Clean Header Toolbar */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#faf5e8] border-b border-[#ded2b8] shrink-0">
          {/* Paper Size Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-[#78604d] mr-1">Kertas:</span>
            {(['A4', 'F4', 'A5', 'THERMAL'] as PaperSize[]).map((ps) => (
              <button
                key={ps}
                onClick={() => {
                  soundEffects.playClickSound();
                  setPaperSize(ps);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors touch-press ${
                  paperSize === ps
                    ? 'bg-[#2a1a10] text-[#faf5e8] border-[#2a1a10]'
                    : 'bg-[#faf5e8] text-[#78604d] border-[#ded2b8] hover:border-[#2a1a10]'
                }`}
              >
                {ps === 'THERMAL' ? 'Struk 80mm' : ps}
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-[#2a1a10] hover:bg-[#3d2618] text-[#faf5e8] rounded-xl text-xs font-bold flex items-center gap-1.5 touch-press shadow-xs"
            >
              <Printer size={14} /> Cetak
            </button>

            <button
              onClick={handleDownloadHTML}
              className="px-3 py-2 bg-[#faf5e8] hover:bg-[#f0e7d2] text-[#2a1a10] border border-[#ded2b8] rounded-xl text-xs font-semibold flex items-center gap-1 touch-press"
              title="Unduh file HTML"
            >
              <FileDown size={14} /> Unduh
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full text-[#78604d] hover:text-[#2a1a10] hover:bg-[#f0e7d2] transition-colors touch-press"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        {/* Clean Paper Sheet Preview */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 bg-[#ebe0c8]/50 flex justify-center items-start">
          <div
            className="shadow-xl border border-[#ded2b8] bg-[#faf5e8] text-[#2a1a10] transition-all p-6 sm:p-8"
            style={{
              width: paperSize === 'THERMAL' ? '320px' : '100%',
              maxWidth: paperSize === 'A5' ? '540px' : '780px',
              minHeight: '400px',
              boxSizing: 'border-box',
            }}
          >
            {/* Sheet Header */}
            <div className="flex justify-between items-end pb-2.5 mb-2.5 border-b-2 border-[#2a1a10]">
              <div>
                <h1 className="font-extrabold uppercase tracking-tight text-base text-[#2a1a10]">
                  {reportData.title}
                </h1>
                <p className="text-xs text-[#78604d] mt-0.5 font-medium">
                  {reportData.subtitle}
                </p>
              </div>
              <div className="text-right text-[10px] text-[#78604d] font-mono">
                {reportData.dateFormatted}
              </div>
            </div>

            {/* Meta Row */}
            <div className="text-[11px] text-[#78604d] mb-3 flex items-center justify-between">
              <span>{reportData.filterSummary}</span>
              <span className="font-bold text-[#2a1a10]">
                {reportData.totalStockQty} unit • {reportData.totalItemCount} item
              </span>
            </div>

            {/* Content Sections */}
            {reportData.sections.length === 0 ? (
              <p className="text-center py-8 text-xs text-[#78604d] italic">
                Tidak ada data produk ditemukan.
              </p>
            ) : (
              reportData.sections.map((sec) => (
                <div key={sec.floorId} className="mb-4">
                  <div className="py-1 px-2.5 rounded bg-[#2a1a10] text-[#faf5e8] font-bold text-xs uppercase mb-1.5">
                    {sec.floorName}
                  </div>

                  {sec.categories.map((cat) => (
                    <div key={cat.categoryName} className="mb-2.5">
                      <div className="flex justify-between items-center px-2 py-0.5 text-[11px] font-bold bg-[#f0e7d2] border-l-2 border-[#8a4f25] text-[#2a1a10] mb-1">
                        <span>Jenis: {cat.categoryName}</span>
                        <span className="font-mono text-[10px] text-[#78604d]">
                          {cat.categoryTotalQty} unit
                        </span>
                      </div>

                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-[#ebe0c8] text-[#2a1a10] border border-[#ded2b8] text-[10px] font-bold">
                            <th className="py-1 px-2 text-center w-7">No</th>
                            <th className="py-1 px-2">Nama Produk</th>
                            <th className="py-1 px-2 w-20">SKU</th>
                            <th className="py-1 px-2 text-right w-14">Stok</th>
                            <th className="py-1 px-2 w-12">Satuan</th>
                            <th className="py-1 px-2 w-16">Lokasi</th>
                            <th className="py-1 px-2 text-center w-14">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#ded2b8] text-[11px]">
                          {cat.items.map((it) => (
                            <tr key={it.no} className="hover:bg-[#f0e7d2]/50">
                              <td className="py-1 px-2 text-center font-mono text-[10px] text-[#78604d]">
                                {it.no}
                              </td>
                              <td className="py-1 px-2 font-semibold">{it.name}</td>
                              <td className="py-1 px-2 font-mono text-[9px] text-[#78604d]">
                                {it.barcode}
                              </td>
                              <td className="py-1 px-2 text-right font-mono font-bold">
                                {it.quantity}
                              </td>
                              <td className="py-1 px-2 text-[#78604d] text-[10px]">{it.unit}</td>
                              <td className="py-1 px-2 text-[10px] text-[#78604d]">{it.location}</td>
                              <td className="py-1 px-2 text-center">
                                <span
                                  className={`px-1 py-0.5 rounded text-[8px] font-bold ${
                                    it.status === 'HABIS'
                                      ? 'bg-red-100 text-red-800'
                                      : it.status === 'MENIPIS'
                                      ? 'bg-amber-100 text-amber-800'
                                      : it.status === 'PENUH'
                                      ? 'bg-stone-100 text-stone-700'
                                      : 'bg-emerald-100 text-emerald-800'
                                  }`}
                                >
                                  {it.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              ))
            )}

            {/* Signature Box */}
            <div className="flex justify-between pt-4 mt-4 border-t border-[#ded2b8] text-xs">
              <div className="text-center w-36">
                <p className="text-[#78604d]">Dibuat Oleh,</p>
                <div className="h-10" />
                <p className="font-semibold border-t border-[#ded2b8] pt-0.5">( ........................ )</p>
              </div>
              <div className="text-center w-36">
                <p className="text-[#78604d]">Mengetahui,</p>
                <div className="h-10" />
                <p className="font-semibold border-t border-[#ded2b8] pt-0.5">Fahri</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
