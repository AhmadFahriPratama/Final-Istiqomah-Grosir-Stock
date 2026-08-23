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
  Filter,
} from 'lucide-react';
import type { FloorId } from '../types/stock';
import { FLOOR_DEFINITIONS } from '../types/stock';
import { ExportReportEngine, type ReportFilterOptions } from '../services/exportReportEngine';
import { soundEffects } from '../utils/audio';
import { useRegisterModal } from '../utils/modalManager';
import { FloorGlyph } from './CustomIcons';
import { CustomPrintReportModal } from './CustomPrintReportModal';

interface ReportGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultFloorId?: FloorId | 'ALL';
}

export const ReportGeneratorModal: React.FC<ReportGeneratorModalProps> = ({
  isOpen,
  onClose,
  defaultFloorId = 'ALL',
}) => {
  useRegisterModal('ReportGeneratorModal', isOpen, onClose);

  const [selectedFloor, setSelectedFloor] = useState<FloorId | 'ALL'>(defaultFloorId);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'HABIS' | 'MENIPIS' | 'NORMAL'>('ALL');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [isCustomPrintOpen, setIsCustomPrintOpen] = useState<boolean>(false);
  const [isSendingTelegram, setIsSendingTelegram] = useState<boolean>(false);
  const [telegramStatus, setTelegramStatus] = useState<{
    success?: boolean;
    message: string;
  } | null>(null);

  // Active filter payload
  const filterOptions: ReportFilterOptions = useMemo(
    () => ({
      floorId: selectedFloor,
      category: selectedCategory,
      searchQuery: searchFilter,
      statusFilter: statusFilter,
    }),
    [selectedFloor, selectedCategory, searchFilter, statusFilter]
  );

  // Get raw grouped data to find all available categories for current floor
  const baseFloorData = useMemo(() => {
    return ExportReportEngine.getGroupedData({ floorId: selectedFloor, category: 'ALL' });
  }, [selectedFloor, isOpen]);

  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    baseFloorData.sections.forEach((sec) => {
      sec.categories.forEach((c) => cats.add(c.categoryName));
    });
    return Array.from(cats).sort((a, b) => a.localeCompare(b));
  }, [baseFloorData]);

  // Filtered live data
  const reportData = useMemo(() => {
    return ExportReportEngine.getGroupedData(filterOptions);
  }, [filterOptions, isOpen]);

  if (!isOpen) return null;

  const handleExportPDF = () => {
    soundEffects.playClickSound();
    setIsCustomPrintOpen(true);
  };

  const handleExportExcel = () => {
    ExportReportEngine.generateExcel(filterOptions);
  };

  const handleExportWord = () => {
    ExportReportEngine.generateWordDoc(filterOptions);
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

  const currentFloorLabel =
    selectedFloor === 'ALL' ? 'Semua Lantai' : FLOOR_DEFINITIONS[selectedFloor].name;

  const currentCategoryLabel =
    selectedCategory === 'ALL' ? 'Semua Jenis' : selectedCategory;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 modal-backdrop anim-fade-in overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden border border-stone-200 my-auto flex flex-col max-h-[94vh] anim-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-stone-100 bg-stone-50/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-stone-900 text-white flex items-center justify-center shadow-xs">
              <FileText size={17} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900 leading-tight">
                Pusat Laporan & Cetak Tabel
              </h3>
              <p className="text-xs text-stone-400 mt-0.5">
                Kustomisasi filter per lantai & jenis barang untuk PDF, Excel, Word
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              soundEffects.playClickSound();
              onClose();
            }}
            className="w-7 h-7 flex items-center justify-center rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors touch-press"
          >
            <X size={16} />
          </button>
        </div>

        {/* Filter Controls Panel */}
        <div className="p-3.5 bg-stone-50/70 border-b border-stone-200 shrink-0 space-y-3">
          {/* Row 1: Floor Selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5 px-0.5">
              <span className="text-[11px] font-semibold text-stone-500 flex items-center gap-1">
                <Filter size={11} /> 1. Pilih Lantai Laporan:
              </span>
              <span className="text-[11px] font-mono text-stone-400">
                {selectedFloor === 'ALL' ? '4 Lantai Terpilih' : FLOOR_DEFINITIONS[selectedFloor].subtitle}
              </span>
            </div>

            <div className="grid grid-cols-5 gap-1.5">
              <button
                type="button"
                onClick={() => {
                  soundEffects.playClickSound();
                  setSelectedFloor('ALL');
                  setSelectedCategory('ALL');
                }}
                className={`py-2 px-1 text-xs font-semibold rounded-xl border text-center transition-all touch-press ${
                  selectedFloor === 'ALL'
                    ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                    : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'
                }`}
              >
                Semua Lt
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
                    className={`py-2 px-1 text-xs font-semibold rounded-xl border flex items-center justify-center gap-1.5 transition-all touch-press ${
                      isSelected
                        ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                        : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'
                    }`}
                  >
                    <FloorGlyph floorId={fId} size={13} />
                    <span>Lt {fId}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row 2: Category / Jenis Selector & Status Filter */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-0.5">
            {/* Category / Jenis Dropdown */}
            <div>
              <label className="text-[11px] font-semibold text-stone-500 block mb-1">
                2. Jenis / Kategori:
              </label>
              <div className="relative">
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    soundEffects.playClickSound();
                    setSelectedCategory(e.target.value);
                  }}
                  className="w-full pl-3 pr-8 py-2 text-xs font-semibold bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-stone-400 appearance-none text-stone-900 shadow-2xs"
                >
                  <option value="ALL">Semua Jenis ({availableCategories.length} Kategori)</option>
                  {availableCategories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={14}
                  className="absolute right-2.5 top-2.5 text-stone-400 pointer-events-none"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="text-[11px] font-semibold text-stone-500 block mb-1">
                3. Filter Status Stok:
              </label>
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    soundEffects.playClickSound();
                    setStatusFilter(e.target.value as typeof statusFilter);
                  }}
                  className="w-full pl-3 pr-8 py-2 text-xs font-semibold bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-stone-400 appearance-none text-stone-900 shadow-2xs"
                >
                  <option value="ALL">Semua Status Produk</option>
                  <option value="MENIPIS">⚠️ Stok Menipis Saja</option>
                  <option value="HABIS">🚫 Stok Habis (0) Saja</option>
                  <option value="NORMAL">✅ Stok Normal / Cukup</option>
                </select>
                <ChevronDown
                  size={14}
                  className="absolute right-2.5 top-2.5 text-stone-400 pointer-events-none"
                />
              </div>
            </div>

            {/* Search filter */}
            <div>
              <label className="text-[11px] font-semibold text-stone-500 block mb-1">
                4. Cari Produk / SKU:
              </label>
              <div className="relative">
                <Search size={13} className="absolute left-3 top-2.5 text-stone-300" />
                <input
                  type="text"
                  placeholder="Ketik nama atau SKU..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-stone-400 font-medium placeholder:text-stone-300 shadow-2xs"
                />
                {searchFilter && (
                  <button
                    onClick={() => setSearchFilter('')}
                    className="absolute right-2.5 top-2 text-xs text-stone-400 hover:text-stone-700"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Live Filter Summary & Export Action Bar */}
        <div className="p-3 bg-white border-b border-stone-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Summary Badges */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-stone-700">
              <span className="font-bold text-stone-900 font-mono text-sm">
                {reportData.totalStockQty}
              </span>
              <span className="text-stone-400 text-xs">unit</span>
              <span className="text-stone-300">·</span>
              <span className="font-bold text-stone-900 font-mono text-sm">
                {reportData.totalItemCount}
              </span>
              <span className="text-stone-400 text-xs">macam</span>
            </div>

            {reportData.totalLowStock > 0 && (
              <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                <AlertTriangle size={10} /> {reportData.totalLowStock} menipis
              </span>
            )}

            {reportData.totalOutOfStock > 0 && (
              <span className="text-[10px] font-semibold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md">
                {reportData.totalOutOfStock} habis
              </span>
            )}
          </div>

          {/* Export Buttons */}
          <div className="flex items-center gap-1.5">
            {/* PDF Button */}
            <button
              type="button"
              onClick={handleExportPDF}
              className="px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 touch-press shadow-xs"
              title="Cetak atau simpan sebagai file PDF rapi"
            >
              <Printer size={14} /> Cetak / PDF
            </button>

            {/* Excel Button */}
            <button
              type="button"
              onClick={handleExportExcel}
              className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 touch-press"
              title="Download format Spreadsheet Excel"
            >
              <FileSpreadsheet size={14} /> Excel
            </button>

            {/* Word Button */}
            <button
              type="button"
              onClick={handleExportWord}
              className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 touch-press"
              title="Download format Word DOCX"
            >
              <FileCode size={14} /> Word
            </button>

            {/* Telegram Button */}
            <button
              type="button"
              disabled={isSendingTelegram}
              onClick={handleSendTelegram}
              className="p-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl touch-press disabled:opacity-50"
              title="Kirim dokumen backup ke Telegram Bot"
            >
              <Send size={14} />
            </button>
          </div>
        </div>

        {/* Telegram Status Toast Alert */}
        {telegramStatus && (
          <div
            className={`mx-4 mt-3 p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between shrink-0 anim-fade-in ${
              telegramStatus.success
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                : telegramStatus.success === false
                ? 'bg-red-50 text-red-900 border-red-200'
                : 'bg-stone-100 text-stone-900 border-stone-200'
            }`}
          >
            <div className="flex items-center gap-1.5">
              {telegramStatus.success ? (
                <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle size={14} className="text-stone-500 shrink-0" />
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

        {/* Active Filter Banner */}
        <div className="px-4 py-2 bg-stone-100/60 border-b border-stone-200 text-[11px] text-stone-500 flex items-center justify-between shrink-0">
          <span>
            Target: <strong>{currentFloorLabel}</strong> · <strong>{currentCategoryLabel}</strong>
            {statusFilter !== 'ALL' && ` · Status: ${statusFilter}`}
            {searchFilter && ` · Cari: "${searchFilter}"`}
          </span>
          <span className="text-[10px] text-stone-400 font-mono">
            Preview Live
          </span>
        </div>

        {/* Live Table Content Area */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {reportData.sections.length === 0 ? (
            <div className="py-12 text-center text-stone-400">
              <p className="text-sm font-semibold text-stone-600">Tidak ada produk ditemukan</p>
              <p className="text-xs mt-1">Coba ubah pilihan lantai, jenis, atau filter status di atas.</p>
            </div>
          ) : (
            reportData.sections.map((sec) => (
              <div key={sec.floorId} className="space-y-3">
                {/* Floor Header */}
                <div className="flex items-center gap-2 px-1">
                  <div className="w-5 h-5 rounded-md bg-stone-900 text-white flex items-center justify-center">
                    <FloorGlyph floorId={sec.floorId} size={12} />
                  </div>
                  <h4 className="text-xs font-bold text-stone-900">
                    {sec.floorName}
                  </h4>
                </div>

                {sec.categories.map((cat) => (
                  <div
                    key={cat.categoryName}
                    className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-2xs"
                  >
                    {/* Category Title Bar */}
                    <div className="px-3.5 py-2 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
                      <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                        <Layers size={13} className="text-stone-400" /> {cat.categoryName}
                      </span>
                      <span className="text-[10px] font-mono text-stone-500 font-medium">
                        {cat.categoryTotalQty} unit · {cat.items.length} macam
                      </span>
                    </div>

                    {/* Table View */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-stone-50/50 text-[10px] text-stone-400 font-semibold border-b border-stone-200">
                            <th className="py-2 px-3 text-center w-8">No</th>
                            <th className="py-2 px-3">Nama Produk</th>
                            <th className="py-2 px-3 text-right">Stok Fisik</th>
                            <th className="py-2 px-3">Satuan</th>
                            <th className="py-2 px-3 text-right">Min</th>
                            <th className="py-2 px-3 text-right">Max</th>
                            <th className="py-2 px-3">Lokasi / Rak</th>
                            <th className="py-2 px-3 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100 font-medium">
                          {cat.items.map((it) => (
                            <tr key={it.no} className="hover:bg-stone-50/50 transition-colors">
                              <td className="py-2 px-3 text-center text-[11px] text-stone-400 font-mono">
                                {it.no}
                              </td>
                              <td className="py-2 px-3">
                                <span className="font-semibold text-stone-900 block">{it.name}</span>
                                {it.barcode !== '-' && (
                                  <span className="text-[9px] text-stone-400 font-mono block">
                                    SKU: {it.barcode}
                                  </span>
                                )}
                              </td>
                              <td className="py-2 px-3 text-right font-mono font-bold text-stone-900 text-sm">
                                {it.quantity}
                              </td>
                              <td className="py-2 px-3 text-stone-500 text-xs">{it.unit}</td>
                              <td className="py-2 px-3 text-right font-mono text-stone-500">
                                {it.minStock || 0}
                              </td>
                              <td className="py-2 px-3 text-right font-mono text-stone-400">
                                {it.maxStock || '∞'}
                              </td>
                              <td className="py-2 px-3 text-stone-500 text-xs">{it.location}</td>
                              <td className="py-2 px-3 text-center">
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${
                                    it.status === 'HABIS'
                                      ? 'bg-red-50 text-red-700'
                                      : it.status === 'MENIPIS'
                                      ? 'bg-amber-50 text-amber-800'
                                      : it.status === 'PENUH'
                                      ? 'bg-stone-100 text-stone-600'
                                      : 'bg-emerald-50 text-emerald-800'
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
            ))
          )}
        </div>
      </div>

      {/* Custom In-App Print Document Viewer */}
      <CustomPrintReportModal
        isOpen={isCustomPrintOpen}
        filterOptions={filterOptions}
        onClose={() => setIsCustomPrintOpen(false)}
      />
    </div>
  );
};
