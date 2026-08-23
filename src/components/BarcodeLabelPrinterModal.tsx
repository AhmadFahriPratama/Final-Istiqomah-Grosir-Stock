import React, { useState, useMemo } from 'react';
import {
  X,
  Tag,
  Printer,
  Search,
  Check,
} from 'lucide-react';
import type { FloorId, StockItem } from '../types/stock';
import { FLOOR_DEFINITIONS } from '../types/stock';
import { StockStorageEngine } from '../services/db';
import { soundEffects } from '../utils/audio';
import { useRegisterModal } from '../utils/modalManager';

interface BarcodeLabelPrinterModalProps {
  isOpen: boolean;
  floorId?: FloorId | 'ALL';
  initialItem?: StockItem | null;
  onClose: () => void;
}

export type LabelType = 'PRODUCT' | 'SHELF_TAG';
export type LabelPaper = 'A4_GRID' | 'THERMAL_80';

// Pure SVG Code128-B Barcode Generator
function generateCode128Svg(code: string, width = 180, height = 45): string {
  const cleanCode = code || '00000000';
  // Code128 Patterns
  const patterns: Record<number, string> = {
    0: '11011001100', 1: '11001101100', 2: '11001100110', 3: '10010011000',
    4: '10010001100', 5: '10001001100', 6: '10011001000', 7: '10011000100',
    8: '10001100100', 9: '11001001000', 10: '11001000100', 11: '11000100100',
    12: '10110011100', 13: '10011011100', 14: '10011001110', 15: '10111001100',
    16: '10011101100', 17: '10011100110', 18: '11001110010', 19: '11001011100',
    20: '11001001110', 21: '11011100100', 22: '11001110100', 23: '11101101110',
    24: '11101001100', 25: '11100101100', 26: '11100100110', 27: '11101100100',
    28: '11100110100', 29: '11100110010', 30: '11011011000', 31: '11011000110',
    32: '11000110110', 33: '10100011000', 34: '10001011000', 35: '10001000110',
    36: '10110001000', 37: '10001101000', 38: '10001100010', 39: '11010001000',
    40: '11000101000', 41: '11000100010', 42: '10110111000', 43: '10110001110',
    44: '10001101110', 45: '10111011000', 46: '10111000110', 47: '10001110110',
    48: '11101110110', 49: '11010001110', 50: '11000101110', 51: '11011101000',
    52: '11011100010', 53: '11011101110', 54: '11101011000', 55: '11101000110',
    56: '11100010110', 57: '11101101000', 58: '11101100010', 59: '11100011010',
    60: '11101111010', 61: '11001000010', 62: '11110001010', 63: '10100110000',
    64: '10100001100', 65: '10010110000', 66: '10010000110', 67: '10000101100',
    68: '10000100110', 69: '10110010000', 70: '10110000100', 71: '10011010000',
    72: '10011000010', 73: '10000110100', 74: '10000110010', 75: '11000010010',
    76: '11001010000', 77: '11110111010', 78: '11000010100', 79: '10001111010',
    80: '10100111100', 81: '10010111100', 82: '10010011110', 83: '10111100100',
    84: '10011110100', 85: '10011110010', 86: '11110100100', 87: '11110010100',
    88: '11110010010', 89: '11011011110', 90: '11011110110', 91: '11110110110',
    92: '10101111000', 93: '10100011110', 94: '10001011110', 95: '10111101000',
    96: '10111100010', 97: '11110101000', 98: '11110100010', 99: '10111011110',
    100: '10111101110', 101: '11101011110', 102: '11110101110', 103: '11010000100',
    104: '11010010000', 105: '11010011100', 106: '1100011101011'
  };

  // Start B = 104
  let checksum = 104;
  let patternStr = patterns[104];

  for (let i = 0; i < cleanCode.length; i++) {
    const charCode = cleanCode.charCodeAt(i) - 32;
    const validCode = Math.max(0, Math.min(95, charCode));
    patternStr += patterns[validCode] || patterns[0];
    checksum += validCode * (i + 1);
  }

  const checkVal = checksum % 103;
  patternStr += patterns[checkVal] || patterns[0];
  patternStr += patterns[106]; // Stop code

  const barWidth = width / patternStr.length;
  let rects = '';

  for (let i = 0; i < patternStr.length; i++) {
    if (patternStr[i] === '1') {
      const x = (i * barWidth).toFixed(2);
      rects += `<rect x="${x}" y="0" width="${barWidth.toFixed(2)}" height="${height}" fill="#000000" />`;
    }
  }

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">${rects}</svg>`;
}

export const BarcodeLabelPrinterModal: React.FC<BarcodeLabelPrinterModalProps> = ({
  isOpen,
  floorId = '1',
  initialItem,
  onClose,
}) => {
  useRegisterModal('BarcodeLabelPrinterModal', isOpen, onClose);

  const [activeFloor, setActiveFloor] = useState<FloorId | 'ALL'>(floorId);
  const [labelType, setLabelType] = useState<LabelType>('PRODUCT');
  const [paperFormat, setPaperFormat] = useState<LabelPaper>('A4_GRID');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>(
    initialItem ? [initialItem.id] : []
  );
  const [copiesPerItem, setCopiesPerItem] = useState<number>(1);

  const allItems: StockItem[] = useMemo(() => {
    const targetFloors: FloorId[] =
      activeFloor === 'ALL' ? ['1', '2', '3', '4'] : [activeFloor];
    const res: StockItem[] = [];
    targetFloors.forEach((fId) => {
      const data = StockStorageEngine.getFloorData(fId);
      res.push(...data.items);
    });
    return res;
  }, [activeFloor, isOpen]);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return allItems;
    const q = searchQuery.toLowerCase();
    return allItems.filter(
      (it) =>
        it.name.toLowerCase().includes(q) ||
        (it.barcode && it.barcode.toLowerCase().includes(q)) ||
        (it.category && it.category.toLowerCase().includes(q)) ||
        (it.locationDetails && it.locationDetails.toLowerCase().includes(q))
    );
  }, [allItems, searchQuery]);

  const printableItems = useMemo(() => {
    return allItems.filter((i) => selectedItemIds.includes(i.id));
  }, [allItems, selectedItemIds]);

  if (!isOpen) return null;

  const toggleSelectItem = (id: string) => {
    soundEffects.playClickSound();
    setSelectedItemIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    soundEffects.playClickSound();
    if (selectedItemIds.length === filteredItems.length) {
      setSelectedItemIds([]);
    } else {
      setSelectedItemIds(filteredItems.map((i) => i.id));
    }
  };

  const handlePrintLabels = () => {
    soundEffects.playClickSound();
    if (printableItems.length === 0) {
      alert('Pilih setidaknya 1 barang untuk dicetak labelnya.');
      return;
    }

    const isA4 = paperFormat === 'A4_GRID';
    const isShelf = labelType === 'SHELF_TAG';

    const printStyles = `
      @page {
        size: ${isA4 ? 'A4 portrait' : '80mm auto'};
        margin: ${isA4 ? '8mm' : '3mm'};
      }
      * { box-sizing: border-box; }
      body {
        font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
        margin: 0;
        padding: 0;
        background: #ffffff;
      }
      .grid-container {
        display: ${isA4 ? 'grid' : 'flex'};
        ${isA4 ? 'grid-template-columns: repeat(3, 1fr); gap: 4mm;' : 'flex-direction: column; gap: 4mm;'}
      }
      .label-card {
        border: 1px dashed #999;
        border-radius: 4px;
        padding: ${isShelf ? '4mm 5mm' : '3mm 4mm'};
        text-align: center;
        background: #fff;
        page-break-inside: avoid;
        display: flex;
        flex-col;
        justify-content: space-between;
        min-height: ${isShelf ? '38mm' : '28mm'};
      }
      .brand-hdr {
        font-size: 6.5pt;
        text-transform: uppercase;
        font-weight: 800;
        letter-spacing: 0.5px;
        color: #555;
        margin-bottom: 2px;
      }
      .prod-title {
        font-size: ${isShelf ? '10pt' : '8pt'};
        font-weight: 800;
        color: #000;
        line-height: 1.15;
        margin-bottom: 3px;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      .barcode-box {
        margin: 3px 0;
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      .barcode-num {
        font-family: monospace;
        font-size: 7pt;
        font-weight: bold;
        letter-spacing: 1px;
      }
      .shelf-badge {
        font-size: 8pt;
        font-weight: 900;
        border: 1px solid #000;
        padding: 1px 4px;
        border-radius: 3px;
        display: inline-block;
        margin-top: 2px;
      }
    `;

    const labelHtmlList: string[] = [];
    printableItems.forEach((item) => {
      for (let c = 0; c < copiesPerItem; c++) {
        const barcodeVal = item.barcode || item.id.replace('item_', '');
        const svgBarcode = generateCode128Svg(barcodeVal, isShelf ? 190 : 150, isShelf ? 38 : 28);

        labelHtmlList.push(`
          <div class="label-card">
            <div>
              <div class="brand-hdr">ISTIQOMAH GROSIR</div>
              <div class="prod-title">${item.name}</div>
              ${isShelf && item.locationDetails ? `<div class="shelf-badge">RAK: ${item.locationDetails}</div>` : ''}
            </div>
            <div class="barcode-box">
              ${svgBarcode}
              <div class="barcode-num">${barcodeVal}</div>
            </div>
          </div>
        `);
      }
    });

    const fullHtml = `
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8">
        <title>Cetak Label Barcode - Istiqomah Stock</title>
        <style>${printStyles}</style>
      </head>
      <body>
        <div class="grid-container">
          ${labelHtmlList.join('')}
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
      printWin.document.write(fullHtml);
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
              <Tag size={17} />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-[#2a1a10] leading-tight">
                Cetak Label Barcode & Rak
              </h3>
              <p className="text-[11px] text-[#78604d]">
                Buat stiker barcode kemasan dan label identitas rak etalase
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintLabels}
              disabled={printableItems.length === 0}
              className="px-4 py-2 bg-[#2a1a10] hover:bg-[#3d2618] disabled:opacity-40 text-[#faf5e8] rounded-xl text-xs font-bold flex items-center gap-1.5 touch-press shadow-xs"
            >
              <Printer size={14} /> Cetak ({printableItems.length * copiesPerItem} Label)
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full text-[#78604d] hover:text-[#2a1a10] hover:bg-[#f0e7d2] transition-colors"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        {/* Options Toolbar */}
        <div className="p-3 bg-[#faf5e8]/80 border-b border-[#ded2b8] flex flex-wrap items-center justify-between gap-3 shrink-0 text-xs">
          {/* Label Type */}
          <div className="flex items-center gap-1">
            <span className="font-bold text-[#78604d] mr-1">Tipe:</span>
            <button
              onClick={() => {
                soundEffects.playClickSound();
                setLabelType('PRODUCT');
              }}
              className={`px-3 py-1.5 rounded-xl font-bold border transition-colors ${
                labelType === 'PRODUCT'
                  ? 'bg-[#2a1a10] text-[#faf5e8] border-[#2a1a10]'
                  : 'bg-white text-[#78604d] border-[#ded2b8]'
              }`}
            >
              Stiker Produk
            </button>
            <button
              onClick={() => {
                soundEffects.playClickSound();
                setLabelType('SHELF_TAG');
              }}
              className={`px-3 py-1.5 rounded-xl font-bold border transition-colors ${
                labelType === 'SHELF_TAG'
                  ? 'bg-[#2a1a10] text-[#faf5e8] border-[#2a1a10]'
                  : 'bg-white text-[#78604d] border-[#ded2b8]'
              }`}
            >
              Label Rak (Shelf Tag)
            </button>
          </div>

          {/* Paper Format */}
          <div className="flex items-center gap-1">
            <span className="font-bold text-[#78604d] mr-1">Kertas:</span>
            <button
              onClick={() => {
                soundEffects.playClickSound();
                setPaperFormat('A4_GRID');
              }}
              className={`px-2.5 py-1.5 rounded-xl font-bold border transition-colors ${
                paperFormat === 'A4_GRID'
                  ? 'bg-[#2a1a10] text-[#faf5e8] border-[#2a1a10]'
                  : 'bg-white text-[#78604d] border-[#ded2b8]'
              }`}
            >
              A4 Stiker Grid (3 Kolom)
            </button>
            <button
              onClick={() => {
                soundEffects.playClickSound();
                setPaperFormat('THERMAL_80');
              }}
              className={`px-2.5 py-1.5 rounded-xl font-bold border transition-colors ${
                paperFormat === 'THERMAL_80'
                  ? 'bg-[#2a1a10] text-[#faf5e8] border-[#2a1a10]'
                  : 'bg-white text-[#78604d] border-[#ded2b8]'
              }`}
            >
              Thermal 80mm Stiker
            </button>
          </div>

          {/* Copies Stepper */}
          <div className="flex items-center gap-1.5 font-bold text-[#78604d]">
            <span>Jumlah Cetak:</span>
            <input
              type="number"
              min={1}
              max={50}
              value={copiesPerItem}
              onChange={(e) => setCopiesPerItem(Math.max(1, Number(e.target.value) || 1))}
              className="w-14 py-1 text-center font-mono font-bold bg-white border border-[#ded2b8] rounded-lg focus:border-[#2a1a10] text-[#2a1a10]"
            />
            <span>lbr/item</span>
          </div>
        </div>

        {/* Search & Floor Filter */}
        <div className="p-3 bg-[#faf5e8] border-b border-[#ded2b8] flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                soundEffects.playClickSound();
                setActiveFloor('ALL');
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors ${
                activeFloor === 'ALL'
                  ? 'bg-[#2a1a10] text-[#faf5e8] border-[#2a1a10]'
                  : 'bg-white text-[#78604d] border-[#ded2b8]'
              }`}
            >
              Semua
            </button>
            {(['1', '2', '3', '4'] as FloorId[]).map((fId) => (
              <button
                key={fId}
                onClick={() => {
                  soundEffects.playClickSound();
                  setActiveFloor(fId);
                }}
                className={`px-2 py-1 rounded-lg text-xs font-bold border transition-colors ${
                  activeFloor === fId
                    ? 'bg-[#2a1a10] text-[#faf5e8] border-[#2a1a10]'
                    : 'bg-white text-[#78604d] border-[#ded2b8]'
                }`}
              >
                {FLOOR_DEFINITIONS[fId]?.name}
              </button>
            ))}
          </div>

          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search size={13} className="absolute left-3 top-2.5 text-[#9e8b74]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari barang label..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-[#ded2b8] rounded-xl focus:border-[#2a1a10] focus:outline-none text-[#2a1a10]"
            />
          </div>

          <button
            onClick={handleSelectAll}
            className="px-3 py-1.5 bg-white hover:bg-[#f0e7d2] text-[#2a1a10] border border-[#ded2b8] rounded-xl text-xs font-bold touch-press"
          >
            {selectedItemIds.length === filteredItems.length && filteredItems.length > 0
              ? 'Batal Pilih Semua'
              : `Pilih Semua (${filteredItems.length})`}
          </button>
        </div>

        {/* Item Selection Grid & Live Preview */}
        <div className="flex-1 overflow-auto p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left: Item Picker List */}
          <div className="bg-[#faf5e8] rounded-2xl border border-[#ded2b8] p-3 overflow-y-auto max-h-[500px] space-y-1.5">
            <h4 className="text-xs font-bold text-[#2a1a10] mb-2 px-1">
              Pilih Barang ({selectedItemIds.length} Terpilih)
            </h4>
            {filteredItems.length === 0 ? (
              <p className="py-6 text-center text-xs text-[#9e8b74] italic">
                Tidak ada barang ditemukan.
              </p>
            ) : (
              filteredItems.map((it) => {
                const isSelected = selectedItemIds.includes(it.id);
                return (
                  <button
                    key={it.id}
                    onClick={() => toggleSelectItem(it.id)}
                    className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-colors touch-press text-xs ${
                      isSelected
                        ? 'bg-[#2a1a10] text-[#faf5e8] border-[#2a1a10] shadow-xs'
                        : 'bg-white text-[#2a1a10] border-[#ded2b8] hover:border-[#2a1a10]'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <span className="font-bold block truncate">{it.name}</span>
                      <span
                        className={`text-[10px] ${
                          isSelected ? 'text-[#ded2b8]' : 'text-[#78604d]'
                        }`}
                      >
                        {it.category} {it.barcode ? `• ${it.barcode}` : '• Auto-SKU'}
                        {it.locationDetails ? ` • Rak ${it.locationDetails}` : ''}
                      </span>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-[#8a4f25] border-[#8a4f25] text-white'
                          : 'border-[#ded2b8] bg-stone-50'
                      }`}
                    >
                      {isSelected && <Check size={12} />}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Right: Live Label Sample Preview */}
          <div className="bg-[#ebe0c8]/50 rounded-2xl border border-[#ded2b8] p-4 flex flex-col items-center justify-center">
            <span className="text-[11px] font-bold text-[#78604d] mb-3 uppercase tracking-wider">
              Contoh Tampilan Label Fisik
            </span>

            {printableItems.length === 0 ? (
              <p className="text-xs text-[#9e8b74] italic py-8">
                Pilih barang di sebelah kiri untuk melihat pratinjau label.
              </p>
            ) : (
              <div className="bg-white rounded-xl border-2 border-dashed border-stone-400 p-4 w-full max-w-[260px] shadow-lg text-center space-y-2">
                <div className="text-[9px] uppercase font-black text-stone-500 tracking-wider">
                  ISTIQOMAH GROSIR
                </div>
                <div className="text-xs font-black text-black leading-tight">
                  {printableItems[0].name}
                </div>
                {labelType === 'SHELF_TAG' && printableItems[0].locationDetails && (
                  <div className="inline-block px-2 py-0.5 border-2 border-black rounded text-[10px] font-black">
                    RAK: {printableItems[0].locationDetails}
                  </div>
                )}
                <div
                  className="py-1 flex justify-center"
                  dangerouslySetInnerHTML={{
                    __html: generateCode128Svg(
                      printableItems[0].barcode || printableItems[0].id.replace('item_', ''),
                      180,
                      34
                    ),
                  }}
                />
                <div className="font-mono text-[9px] font-bold tracking-widest">
                  {printableItems[0].barcode || printableItems[0].id.replace('item_', '')}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
