import React, { useState, useMemo } from 'react';
import {
  X,
  ShoppingCart,
  Search,
  Printer,
  Copy,
  Check,
  Send,
} from 'lucide-react';
import type { FloorId, RestockItem } from '../types/stock';
import { FLOOR_DEFINITIONS } from '../types/stock';
import { StockStorageEngine } from '../services/db';
import { soundEffects } from '../utils/audio';
import { useRegisterModal } from '../utils/modalManager';

interface RestockPlannerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RestockPlannerModal: React.FC<RestockPlannerModalProps> = ({
  isOpen,
  onClose,
}) => {
  useRegisterModal('RestockPlannerModal', isOpen, onClose);

  const [selectedFloor, setSelectedFloor] = useState<FloorId | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [supplierPhone, setSupplierPhone] = useState<string>('');
  const [customOrderQtys, setCustomOrderQtys] = useState<Record<string, number>>({});
  const [copied, setCopied] = useState<boolean>(false);

  const rawItems = useMemo(() => {
    return StockStorageEngine.getRestockItems(selectedFloor);
  }, [selectedFloor, isOpen]);

  const items: (RestockItem & { orderQty: number })[] = useMemo(() => {
    return rawItems.map((it) => {
      const orderQty = customOrderQtys[it.id] !== undefined ? customOrderQtys[it.id] : it.suggestedRestock;
      return {
        ...it,
        orderQty,
      };
    });
  }, [rawItems, customOrderQtys]);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(
      (it) =>
        it.name.toLowerCase().includes(q) ||
        it.category.toLowerCase().includes(q) ||
        (it.barcode && it.barcode.toLowerCase().includes(q))
    );
  }, [items, searchQuery]);

  const summary = useMemo(() => {
    let outOfStock = 0;
    let lowStock = 0;
    let totalOrderUnits = 0;

    items.forEach((it) => {
      if (it.currentStock === 0) outOfStock++;
      else lowStock++;
      totalOrderUnits += it.orderQty;
    });

    return { outOfStock, lowStock, totalOrderUnits, totalItems: items.length };
  }, [items]);

  if (!isOpen) return null;

  const handleUpdateQty = (id: string, qty: number) => {
    const safe = Math.max(1, qty);
    setCustomOrderQtys((prev) => ({
      ...prev,
      [id]: safe,
    }));
  };

  const generateOrderText = () => {
    const now = new Date().toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    let text = `📦 *DAFTAR PESANAN KULAKAN / RESTOCK*\n`;
    text += `*Istiqomah Grosir Stock*\n`;
    text += `Tanggal: ${now}\n`;
    text += `Kategori Lantai: ${selectedFloor === 'ALL' ? 'Semua Lantai (1-4)' : FLOOR_DEFINITIONS[selectedFloor]?.name}\n`;
    text += `Total Macam: ${filteredItems.length} item • Total Unit: ${summary.totalOrderUnits}\n\n`;
    text += `*DETAIL BARANG YANG DIPESAN:*\n`;

    filteredItems.forEach((it, idx) => {
      text += `${idx + 1}. *${it.name}* [${it.floorName}]\n`;
      text += `   ↳ Pesan: *${it.orderQty} ${it.unit}* (Sisa stok toko: ${it.currentStock} ${it.unit})\n`;
      if (it.barcode) text += `   ↳ SKU/Barcode: ${it.barcode}\n`;
    });

    text += `\nMohon segera diproses. Terima kasih! 🙏`;
    return text;
  };

  const handleCopyText = () => {
    soundEffects.playClickSound();
    const text = generateOrderText();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendWhatsApp = () => {
    soundEffects.playClickSound();
    const text = generateOrderText();
    const cleanPhone = supplierPhone.replace(/\D/g, '');
    const phoneParam = cleanPhone ? (cleanPhone.startsWith('0') ? `62${cleanPhone.slice(1)}` : cleanPhone) : '';
    const url = phoneParam
      ? `https://wa.me/${phoneParam}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handlePrintPO = () => {
    soundEffects.playClickSound();
    const printHtml = `
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8">
        <title>Surat Pesanan Kulakan - Istiqomah Grosir Stock</title>
        <style>
          @page { size: A4 portrait; margin: 12mm; }
          body { font-family: sans-serif; color: #2a1a10; margin: 0; font-size: 9pt; }
          .header { border-bottom: 2px solid #2a1a10; padding-bottom: 8px; margin-bottom: 12px; }
          h1 { margin: 0; font-size: 14pt; text-transform: uppercase; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #ded2b8; padding: 5px 7px; text-align: left; }
          th { background: #ebe0c8; font-weight: bold; }
          .num { text-align: right; font-family: monospace; font-weight: bold; }
          .center { text-align: center; }
          .footer-sign { margin-top: 30px; display: flex; justify-content: space-between; }
          .sign-box { width: 160px; text-align: center; }
          .sign-space { height: 45px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>SURAT PESANAN KULAKAN (PURCHASE ORDER)</h1>
          <p style="margin: 3px 0 0 0; color: #78604d;">Istiqomah Grosir Stock • Waktu: ${new Date().toLocaleString('id-ID')}</p>
        </div>

        <p><strong>Ringkasan:</strong> Total ${filteredItems.length} Macam Barang • Total ${summary.totalOrderUnits} Unit</p>

        <table>
          <thead>
            <tr>
              <th style="width: 25px;" class="center">No</th>
              <th>Nama Produk & Kategori</th>
              <th style="width: 80px;">Lantai</th>
              <th style="width: 80px;">SKU</th>
              <th style="width: 60px;" class="num">Sisa Stok</th>
              <th style="width: 80px;" class="num">Jumlah Pesan</th>
            </tr>
          </thead>
          <tbody>
            ${filteredItems
              .map(
                (it, idx) => `
              <tr>
                <td class="center font-mono">${idx + 1}</td>
                <td><b>${it.name}</b> (${it.category})</td>
                <td>${it.floorName}</td>
                <td style="font-family: monospace; font-size: 8pt;">${it.barcode || '-'}</td>
                <td class="num">${it.currentStock} ${it.unit}</td>
                <td class="num" style="background: #faf5e8; font-size: 10pt;">${it.orderQty} ${it.unit}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>

        <div class="footer-sign">
          <div class="sign-box">
            <div>Dibuat Oleh (Purchasing),</div>
            <div class="sign-space"></div>
            <div><b>( ................................ )</b></div>
          </div>
          <div class="sign-box">
            <div>Disetujui (Super Admin),</div>
            <div class="sign-space"></div>
            <div><b>Fahri</b></div>
          </div>
        </div>

        <script>
          window.onload = function() { window.print(); };
        </script>
      </body>
      </html>
    `;

    const printWin = window.open('', '_blank');
    if (printWin) {
      printWin.document.open();
      printWin.document.write(printHtml);
      printWin.document.close();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 modal-backdrop anim-fade-in overflow-hidden">
      <div className="bg-[#f5eedc] rounded-3xl max-w-4xl w-full shadow-2xl border-2 border-[#2a1a10] overflow-hidden flex flex-col h-[94vh] anim-slide-up text-left">
        {/* Header Toolbar */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#faf5e8] border-b border-[#ded2b8] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#2a1a10] text-[#faf5e8] flex items-center justify-center shadow-xs">
              <ShoppingCart size={17} />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-[#2a1a10] leading-tight">
                Perencana Kulakan / Restock PO
              </h3>
              <p className="text-[11px] text-[#78604d]">
                Daftar belanja stok menipis & habis untuk pemesanan ke distributor
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintPO}
              className="px-3.5 py-1.5 bg-[#faf5e8] hover:bg-[#f0e7d2] text-[#2a1a10] border border-[#ded2b8] rounded-xl text-xs font-bold flex items-center gap-1.5 touch-press shadow-xs"
            >
              <Printer size={14} /> Cetak PO
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full text-[#78604d] hover:text-[#2a1a10] hover:bg-[#f0e7d2] transition-colors"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        {/* Filters & Floor Selector Bar */}
        <div className="p-3 bg-[#faf5e8]/80 border-b border-[#ded2b8] flex flex-wrap items-center justify-between gap-3 shrink-0 text-xs">
          {/* Floor Chips */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                soundEffects.playClickSound();
                setSelectedFloor('ALL');
              }}
              className={`px-3 py-1.5 rounded-xl font-bold border transition-colors touch-press ${
                selectedFloor === 'ALL'
                  ? 'bg-[#2a1a10] text-[#faf5e8] border-[#2a1a10]'
                  : 'bg-white text-[#78604d] border-[#ded2b8]'
              }`}
            >
              Semua Lantai
            </button>
            {(['1', '2', '3', '4'] as FloorId[]).map((fId) => (
              <button
                key={fId}
                onClick={() => {
                  soundEffects.playClickSound();
                  setSelectedFloor(fId);
                }}
                className={`px-2.5 py-1.5 rounded-xl font-bold border transition-colors touch-press ${
                  selectedFloor === fId
                    ? 'bg-[#2a1a10] text-[#faf5e8] border-[#2a1a10]'
                    : 'bg-white text-[#78604d] border-[#ded2b8]'
                }`}
              >
                {FLOOR_DEFINITIONS[fId]?.name}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search size={13} className="absolute left-3 top-2.5 text-[#9e8b74]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari barang restock..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-[#ded2b8] rounded-xl focus:border-[#2a1a10] focus:outline-none text-[#2a1a10]"
            />
          </div>

          {/* Statistics Badges */}
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <span className="px-2 py-0.5 rounded-lg bg-red-100 text-red-800 font-bold border border-red-200">
              Habis: {summary.outOfStock}
            </span>
            <span className="px-2 py-0.5 rounded-lg bg-amber-100 text-amber-800 font-bold border border-amber-200">
              Menipis: {summary.lowStock}
            </span>
            <span className="px-2 py-0.5 rounded-lg bg-[#2a1a10] text-[#faf5e8] font-bold">
              Total: {summary.totalOrderUnits} unit
            </span>
          </div>
        </div>

        {/* Table Viewport */}
        <div className="flex-1 overflow-auto p-3 sm:p-4">
          <div className="bg-[#faf5e8] rounded-2xl border border-[#ded2b8] overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#ebe0c8] text-[#2a1a10] border-b border-[#ded2b8] text-[11px] font-bold">
                  <th className="py-2.5 px-3 w-8 text-center">No</th>
                  <th className="py-2.5 px-3">Nama Produk</th>
                  <th className="py-2.5 px-3 w-24">Lantai</th>
                  <th className="py-2.5 px-3 w-20 text-center">Stok Toko</th>
                  <th className="py-2.5 px-3 w-16 text-center">Min</th>
                  <th className="py-2.5 px-3 w-36 text-center">Jumlah Pesan (Order)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ded2b8] text-xs font-medium">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[#9e8b74] italic">
                      Tidak ada barang yang perlu dikulak / stok masih aman.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((it, idx) => (
                    <tr
                      key={`${it.floorId}_${it.id}`}
                      className={it.currentStock === 0 ? 'bg-red-50/40 hover:bg-red-50/70' : 'hover:bg-[#f0e7d2]/40'}
                    >
                      <td className="py-2.5 px-3 text-center font-mono text-[11px] text-[#78604d]">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-[#2a1a10] block">{it.name}</span>
                        <span className="text-[10px] text-[#78604d]">
                          {it.category} {it.barcode ? `• ${it.barcode}` : ''}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-[#78604d]">
                        {it.floorName}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold">
                        <span className={it.currentStock === 0 ? 'text-red-700' : 'text-amber-700'}>
                          {it.currentStock} {it.unit}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-[#78604d]">
                        {it.minStock}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <input
                            type="number"
                            min={1}
                            value={it.orderQty}
                            onChange={(e) => handleUpdateQty(it.id, Number(e.target.value) || 1)}
                            className="w-20 py-1 text-center font-mono font-black text-sm bg-white border-2 border-[#ded2b8] rounded-xl focus:border-[#2a1a10] focus:outline-none text-[#2a1a10]"
                          />
                          <span className="text-[10px] font-bold text-[#78604d]">
                            {it.unit}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer WhatsApp & Copy Toolbar */}
        <div className="px-5 py-3.5 bg-[#faf5e8] border-t border-[#ded2b8] shrink-0 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 max-w-sm">
            <input
              type="tel"
              value={supplierPhone}
              onChange={(e) => setSupplierPhone(e.target.value)}
              placeholder="No WA Supplier (Opsional, cth: 0812...)"
              className="w-full px-3 py-2 text-xs bg-white border border-[#ded2b8] rounded-xl focus:border-[#2a1a10] focus:outline-none text-[#2a1a10]"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyText}
              className="px-3.5 py-2 bg-white hover:bg-[#f0e7d2] text-[#2a1a10] border border-[#ded2b8] rounded-xl text-xs font-bold flex items-center gap-1.5 touch-press"
            >
              {copied ? <Check size={14} className="text-emerald-700" /> : <Copy size={14} />}
              <span>{copied ? 'Tersalin' : 'Salin Format Teks'}</span>
            </button>

            <button
              onClick={handleSendWhatsApp}
              disabled={filteredItems.length === 0}
              className="px-4 py-2 bg-[#25D366] hover:bg-[#20b858] disabled:opacity-40 text-white rounded-xl text-xs font-black flex items-center gap-1.5 touch-press shadow-sm"
            >
              <Send size={14} />
              <span>Kirim ke WhatsApp Supplier</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
