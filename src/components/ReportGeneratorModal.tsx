import React, { useState, useMemo } from 'react';
import {
  X,
  FileText,
  FileSpreadsheet,
  FileCode,
  Send,
  Printer,
  Search,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ChevronDown,
} from 'lucide-react';
import type { FloorId } from '../types/stock';
import { ExportReportEngine } from '../services/exportReportEngine';
import { soundEffects } from '../utils/audio';
import { useRegisterModal } from '../utils/modalManager';
import { FloorGlyph } from './CustomIcons';

interface ReportGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReportGeneratorModal: React.FC<ReportGeneratorModalProps> = ({
  isOpen,
  onClose,
}) => {
  useRegisterModal('ReportGeneratorModal', isOpen, onClose);

  const [selectedFloor, setSelectedFloor] = useState<FloorId | 'ALL'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [isSendingTelegram, setIsSendingTelegram] = useState<boolean>(false);
  const [telegramStatus, setTelegramStatus] = useState<{
    success?: boolean;
    message: string;
  } | null>(null);

  // Get live grouped data based on selected floor
  const reportData = useMemo(() => {
    return ExportReportEngine.getGroupedData(selectedFloor);
  }, [selectedFloor, isOpen]);

  // Extract all categories available in the current selection
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    reportData.sections.forEach((sec) => {
      sec.categories.forEach((c) => cats.add(c.categoryName));
    });
    return Array.from(cats);
  }, [reportData]);

  if (!isOpen) return null;

  const handleExportPDF = () => {
    ExportReportEngine.generatePDFPrint(selectedFloor);
  };

  const handleExportExcel = () => {
    ExportReportEngine.generateExcel(selectedFloor);
  };

  const handleExportWord = () => {
    ExportReportEngine.generateWordDoc(selectedFloor);
  };

  const handleSendTelegram = async () => {
    soundEffects.playClickSound();
    setIsSendingTelegram(true);
    setTelegramStatus({ message: 'Mengirim dokumen laporan ke Telegram...' });

    try {
      const res = await ExportReportEngine.sendTelegramReport(selectedFloor);
      setTelegramStatus(res);
      if (res.success) {
        soundEffects.playBackupSent();
      } else {
        soundEffects.playClickSound();
      }
    } catch (e) {
      setTelegramStatus({
        success: false,
        message: 'Koneksi gagal: ' + String(e),
      });
    } finally {
      setIsSendingTelegram(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 modal-backdrop animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden border border-zinc-200 my-auto flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-100 bg-zinc-50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-black text-white flex items-center justify-center shadow-xs">
              <FileText size={18} />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-black leading-tight">
                Pusat Laporan & Ekspor
              </h3>
              <p className="text-[10px] text-zinc-400 font-medium mt-0.5">
                Format PDF, Excel (XLSX), Word (DOCX), & Backup Telegram
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              soundEffects.playClickSound();
              onClose();
            }}
            className="p-1.5 rounded-full text-zinc-400 hover:text-black hover:bg-zinc-200 transition-colors touch-press"
          >
            <X size={16} />
          </button>
        </div>

        {/* Floor Selection Bar */}
        <div className="p-3 bg-zinc-100/90 border-b border-zinc-200 shrink-0 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
              Pilih Lantai Laporan:
            </span>
            <span className="text-[10px] font-mono text-zinc-600 font-bold">
              {reportData.totalStockQty} unit • {reportData.totalItemCount} item
            </span>
          </div>

          <div className="grid grid-cols-5 gap-1">
            <button
              type="button"
              onClick={() => {
                soundEffects.playClickSound();
                setSelectedFloor('ALL');
                setSelectedCategory('ALL');
              }}
              className={`py-1.5 px-2 text-[11px] font-bold rounded-xl border text-center transition-all touch-press ${
                selectedFloor === 'ALL'
                  ? 'bg-black text-white border-black shadow-xs'
                  : 'bg-white text-zinc-700 border-zinc-200 hover:border-black'
              }`}
            >
              Semua
            </button>

            {(['1', '2', '3', '4'] as FloorId[]).map((fId) => {
              const isSelected = selectedFloor === fId;
              return (
                <button
                  key={fId}
                  type="button"
                  onClick={() => {
                    soundEffects.playClickSound();
                    setSelectedFloor(fId);
                    setSelectedCategory('ALL');
                  }}
                  className={`py-1.5 px-1 text-[11px] font-bold rounded-xl border flex items-center justify-center gap-1 transition-all touch-press ${
                    isSelected
                      ? 'bg-black text-white border-black shadow-xs'
                      : 'bg-white text-zinc-700 border-zinc-200 hover:border-black'
                  }`}
                >
                  <FloorGlyph floorId={fId} size={13} />
                  <span>Lt {fId}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Export Formats Action Bar (4 Big Tiles) */}
        <div className="p-3 bg-white border-b border-zinc-200 grid grid-cols-2 sm:grid-cols-4 gap-2 shrink-0">
          {/* 1. PDF Multi-Page */}
          <button
            type="button"
            onClick={handleExportPDF}
            className="p-2.5 rounded-2xl bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 hover:border-black transition-all flex flex-col items-center text-center touch-press shadow-2xs group"
          >
            <div className="w-8 h-8 rounded-xl bg-black text-white flex items-center justify-center mb-1 shadow-xs">
              <Printer size={15} />
            </div>
            <span className="text-xs font-bold text-black group-hover:text-black">
              Cetak / PDF
            </span>
            <span className="text-[9px] text-zinc-400 font-medium mt-0.5">
              Multi-Halaman Rapi
            </span>
          </button>

          {/* 2. Excel XLSX */}
          <button
            type="button"
            onClick={handleExportExcel}
            className="p-2.5 rounded-2xl bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 hover:border-black transition-all flex flex-col items-center text-center touch-press shadow-2xs group"
          >
            <div className="w-8 h-8 rounded-xl bg-black text-white flex items-center justify-center mb-1 shadow-xs">
              <FileSpreadsheet size={15} />
            </div>
            <span className="text-xs font-bold text-black group-hover:text-black">
              Excel (.XLSX)
            </span>
            <span className="text-[9px] text-zinc-400 font-medium mt-0.5">
              Tabel Spreadsheet
            </span>
          </button>

          {/* 3. Word DOCX */}
          <button
            type="button"
            onClick={handleExportWord}
            className="p-2.5 rounded-2xl bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 hover:border-black transition-all flex flex-col items-center text-center touch-press shadow-2xs group"
          >
            <div className="w-8 h-8 rounded-xl bg-black text-white flex items-center justify-center mb-1 shadow-xs">
              <FileCode size={15} />
            </div>
            <span className="text-xs font-bold text-black group-hover:text-black">
              Word (.DOCX)
            </span>
            <span className="text-[9px] text-zinc-400 font-medium mt-0.5">
              Dokumen Microsoft
            </span>
          </button>

          {/* 4. Telegram Cloud Backup */}
          <button
            type="button"
            disabled={isSendingTelegram}
            onClick={handleSendTelegram}
            className="p-2.5 rounded-2xl bg-zinc-950 hover:bg-zinc-900 text-white border border-zinc-800 transition-all flex flex-col items-center text-center touch-press shadow-xs disabled:opacity-50"
          >
            <div className="w-8 h-8 rounded-xl bg-zinc-800 text-white flex items-center justify-center mb-1">
              <Send size={14} />
            </div>
            <span className="text-xs font-bold text-white">
              {isSendingTelegram ? 'Mengirim...' : 'Ke Telegram'}
            </span>
            <span className="text-[9px] text-zinc-400 font-medium mt-0.5">
              Backup Cloud Bot
            </span>
          </button>
        </div>

        {/* Telegram Status Toast Alert */}
        {telegramStatus && (
          <div
            className={`mx-3 mt-2 p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between shrink-0 shadow-xs animate-in fade-in ${
              telegramStatus.success
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                : telegramStatus.success === false
                ? 'bg-red-50 text-red-900 border-red-200'
                : 'bg-zinc-100 text-black border-zinc-200'
            }`}
          >
            <div className="flex items-center gap-1.5">
              {telegramStatus.success ? (
                <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle size={14} className="text-zinc-600 shrink-0" />
              )}
              <span>{telegramStatus.message}</span>
            </div>
            <button
              onClick={() => setTelegramStatus(null)}
              className="text-xs opacity-60 hover:opacity-100 font-bold ml-2"
            >
              ✕
            </button>
          </div>
        )}

        {/* Live Filter Controls (Category & Search) */}
        <div className="p-3 bg-zinc-50 border-b border-zinc-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="relative flex-1 min-w-[160px]">
            <Search size={13} className="absolute left-2.5 top-2.5 text-zinc-400" />
            <input
              type="text"
              placeholder="Filter nama produk / barcode..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-black font-medium"
            />
          </div>

          <div className="relative min-w-[140px]">
            <select
              value={selectedCategory}
              onChange={(e) => {
                soundEffects.playClickSound();
                setSelectedCategory(e.target.value);
              }}
              className="w-full pl-3 pr-7 py-1.5 text-xs font-bold bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-black appearance-none"
            >
              <option value="ALL">Semua Kategori</option>
              {availableCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <ChevronDown
              size={13}
              className="absolute right-2.5 top-2.5 text-zinc-400 pointer-events-none"
            />
          </div>
        </div>

        {/* Table Content Area (Categorized Sections) */}
        <div className="p-3 sm:p-4 overflow-y-auto space-y-4 flex-1">
          {reportData.sections.map((sec) => {
            const filteredCategories = sec.categories
              .map((cat) => {
                if (selectedCategory !== 'ALL' && cat.categoryName !== selectedCategory) {
                  return null;
                }
                const filteredRows = cat.items.filter((it) => {
                  if (!searchFilter.trim()) return true;
                  const q = searchFilter.toLowerCase().trim();
                  return (
                    it.name.toLowerCase().includes(q) ||
                    it.barcode.toLowerCase().includes(q) ||
                    it.location.toLowerCase().includes(q)
                  );
                });
                if (filteredRows.length === 0) return null;
                return {
                  ...cat,
                  items: filteredRows,
                };
              })
              .filter(Boolean);

            if (filteredCategories.length === 0) return null;

            return (
              <div key={sec.floorId} className="space-y-3">
                {/* Floor Subheader */}
                <div className="flex items-center gap-2 px-1">
                  <div className="w-5 h-5 rounded-md bg-black text-white flex items-center justify-center">
                    <FloorGlyph floorId={sec.floorId} size={12} />
                  </div>
                  <h4 className="text-xs font-extrabold text-black uppercase tracking-wider">
                    {sec.floorName}
                  </h4>
                </div>

                {filteredCategories.map((cat) => (
                  <div
                    key={cat!.categoryName}
                    className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-2xs"
                  >
                    {/* Category Title Bar */}
                    <div className="px-3.5 py-2 bg-zinc-100 border-b border-zinc-200 flex items-center justify-between">
                      <span className="text-xs font-bold text-black flex items-center gap-1.5">
                        <Layers size={13} /> {cat!.categoryName}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-600 font-bold">
                        {cat!.categoryTotalQty} unit ({cat!.items.length} item)
                      </span>
                    </div>

                    {/* Table View */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-zinc-50/80 text-[10px] text-zinc-500 font-bold border-b border-zinc-200 uppercase">
                            <th className="py-2 px-3 text-center w-8">No</th>
                            <th className="py-2 px-3">Nama Produk</th>
                            <th className="py-2 px-3 text-right">Stok</th>
                            <th className="py-2 px-3">Satuan</th>
                            <th className="py-2 px-3 text-right">Min</th>
                            <th className="py-2 px-3">Lokasi</th>
                            <th className="py-2 px-3 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 font-medium">
                          {cat!.items.map((it) => (
                            <tr key={it.no} className="hover:bg-zinc-50/50 transition-colors">
                              <td className="py-2 px-3 text-center text-[11px] text-zinc-400 font-mono">
                                {it.no}
                              </td>
                              <td className="py-2 px-3">
                                <span className="font-bold text-black block">{it.name}</span>
                                {it.barcode !== '-' && (
                                  <span className="text-[9px] text-zinc-400 font-mono block">
                                    SKU: {it.barcode}
                                  </span>
                                )}
                              </td>
                              <td className="py-2 px-3 text-right font-mono font-extrabold text-black text-sm">
                                {it.quantity}
                              </td>
                              <td className="py-2 px-3 text-zinc-600 text-xs">{it.unit}</td>
                              <td className="py-2 px-3 text-right font-mono text-zinc-500">
                                {it.minStock || 0}
                              </td>
                              <td className="py-2 px-3 text-zinc-500 text-xs">{it.location}</td>
                              <td className="py-2 px-3 text-center">
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                    it.status === 'HABIS'
                                      ? 'bg-red-100 text-red-800'
                                      : it.status === 'MENIPIS'
                                      ? 'bg-amber-100 text-amber-800'
                                      : it.status === 'PENUH'
                                      ? 'bg-zinc-100 text-zinc-700'
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
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
