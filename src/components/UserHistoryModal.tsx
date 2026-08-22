import React, { useState, useMemo } from 'react';
import {
  X,
  History,
  Search,
  ArrowDownLeft,
  ArrowUpRight,
  Trash2,
  PlusCircle,
  Edit3,
} from 'lucide-react';
import type { FloorId, MutationLog, UserAccount } from '../types/stock';
import { FLOOR_DEFINITIONS } from '../types/stock';
import { StockStorageEngine } from '../services/db';
import { soundEffects } from '../utils/audio';
import { useRegisterModal } from '../utils/modalManager';

interface UserHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: UserAccount[];
}

export const UserHistoryModal: React.FC<UserHistoryModalProps> = ({
  isOpen,
  onClose,
  users,
}) => {
  useRegisterModal('UserHistoryModal', isOpen, onClose);
  const [selectedUser, setSelectedUser] = useState<string>('ALL');
  const [selectedFloor, setSelectedFloor] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const allMutations = useMemo(() => {
    return StockStorageEngine.getAllMutations();
  }, [isOpen]);

  const filteredMutations = useMemo(() => {
    return allMutations.filter((m) => {
      // 1. User filter
      if (selectedUser !== 'ALL') {
        const userNameMatch = (m.userName || 'Staf').toLowerCase() === selectedUser.toLowerCase();
        if (!userNameMatch) return false;
      }

      // 2. Floor filter
      if (selectedFloor !== 'ALL') {
        if (m.floorId !== selectedFloor) return false;
      }

      // 3. Type filter
      if (selectedType !== 'ALL') {
        if (m.type !== selectedType) return false;
      }

      // 4. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = (m.itemName || '').toLowerCase().includes(q);
        const matchReason = (m.reason || '').toLowerCase().includes(q);
        const matchUser = (m.userName || '').toLowerCase().includes(q);
        if (!matchName && !matchReason && !matchUser) return false;
      }

      return true;
    });
  }, [allMutations, selectedUser, selectedFloor, selectedType, searchQuery]);

  // Aggregate stats from filtered list
  const totalInQty = useMemo(() => {
    return filteredMutations
      .filter((m) => m.type === 'IN')
      .reduce((sum, m) => sum + (m.amount || 0), 0);
  }, [filteredMutations]);

  const totalOutQty = useMemo(() => {
    return filteredMutations
      .filter((m) => m.type === 'OUT')
      .reduce((sum, m) => sum + (m.amount || 0), 0);
  }, [filteredMutations]);

  if (!isOpen) return null;

  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const getActionBadge = (m: MutationLog) => {
    if (m.actionType === 'ITEM_ADD' || (m.type === 'IN' && m.prevStock === 0)) {
      return {
        bg: 'bg-black text-white border-black shadow-xs',
        icon: PlusCircle,
        label: `+${m.amount} (Item Baru)`,
      };
    }
    if (m.actionType === 'ITEM_DELETE') {
      return {
        bg: 'bg-zinc-100 text-zinc-900 border-zinc-300',
        icon: Trash2,
        label: `Hapus Item`,
      };
    }
    if (m.actionType === 'ITEM_UPDATE' || m.type === 'ADJUST') {
      return {
        bg: 'bg-white text-zinc-800 border-zinc-300',
        icon: Edit3,
        label: `Koreksi Data`,
      };
    }
    if (m.type === 'IN') {
      return {
        bg: 'bg-zinc-900 text-white border-zinc-900 shadow-xs',
        icon: ArrowDownLeft,
        label: `+${m.amount} Unit`,
      };
    }
    return {
      bg: 'bg-zinc-100 text-zinc-900 border-zinc-300',
      icon: ArrowUpRight,
      label: `-${m.amount} Unit`,
    };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 modal-backdrop animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-zinc-200 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-zinc-100 bg-zinc-50/90 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-black text-white flex items-center justify-center shadow-xs">
              <History size={16} />
            </div>
            <div>
              <h3 className="text-xs font-bold text-black leading-none">
                Riwayat Perubahan User
              </h3>
              <p className="text-[10px] text-zinc-500 font-medium mt-0.5">
                Catatan mutasi dan perubahan stok
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

        {/* Filters Section */}
        <div className="p-3 bg-zinc-50/60 border-b border-zinc-200 space-y-2 shrink-0">
          {/* Search bar */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama barang, nama staf, atau alasan..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-black transition-colors"
            />
            <Search size={13} className="absolute left-2.5 top-2.5 text-zinc-400" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-zinc-400 hover:text-black text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick Filter Selectors */}
          <div className="grid grid-cols-3 gap-1.5">
            {/* User Filter */}
            <div>
              <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block mb-0.5">
                Filter Petugas
              </label>
              <select
                value={selectedUser}
                onChange={(e) => {
                  soundEffects.playClickSound();
                  setSelectedUser(e.target.value);
                }}
                className="w-full px-2 py-1 text-[11px] font-bold bg-white border border-zinc-200 rounded-lg text-black focus:outline-none focus:border-black"
              >
                <option value="ALL">Semua Petugas ({users.length})</option>
                {users.map((u) => (
                  <option key={u.id} value={u.name}>
                    {u.name} {u.role === 'ADMIN' ? '(Admin)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Floor Filter */}
            <div>
              <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block mb-0.5">
                Filter Lantai
              </label>
              <select
                value={selectedFloor}
                onChange={(e) => {
                  soundEffects.playClickSound();
                  setSelectedFloor(e.target.value);
                }}
                className="w-full px-2 py-1 text-[11px] font-bold bg-white border border-zinc-200 rounded-lg text-black focus:outline-none focus:border-black"
              >
                <option value="ALL">Semua Lantai</option>
                {(['1', '2', '3', '4'] as FloorId[]).map((f) => (
                  <option key={f} value={f}>
                    {FLOOR_DEFINITIONS[f].name}
                  </option>
                ))}
              </select>
            </div>

            {/* Type Filter */}
            <div>
              <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block mb-0.5">
                Jenis Aksi
              </label>
              <select
                value={selectedType}
                onChange={(e) => {
                  soundEffects.playClickSound();
                  setSelectedType(e.target.value);
                }}
                className="w-full px-2 py-1 text-[11px] font-bold bg-white border border-zinc-200 rounded-lg text-black focus:outline-none focus:border-black"
              >
                <option value="ALL">Semua Aksi</option>
                <option value="IN">Masuk (+)</option>
                <option value="OUT">Keluar (-)</option>
                <option value="ADJUST">Koreksi (~)</option>
              </select>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex items-center justify-between pt-1 px-1 text-[10px] text-zinc-500 font-medium">
            <span>
              Total: <strong className="text-black font-mono">{filteredMutations.length}</strong> aktivitas
            </span>
            <div className="flex items-center gap-2">
              <span className="text-zinc-900 font-bold font-mono">+{totalInQty} in</span>
              <span>•</span>
              <span className="text-zinc-600 font-bold font-mono">-{totalOutQty} out</span>
            </div>
          </div>
        </div>

        {/* Scrollable Mutation Feed */}
        <div className="p-3 overflow-y-auto space-y-2 flex-1 divide-y divide-zinc-100">
          {filteredMutations.length === 0 ? (
            <div className="py-12 text-center text-zinc-400 space-y-2">
              <History size={32} className="mx-auto text-zinc-300 stroke-[1.5]" />
              <p className="text-xs font-semibold text-zinc-500">
                Belum ada aktivitas mutasi yang sesuai filter
              </p>
              <p className="text-[10px] text-zinc-400">
                Aktivitas staf saat menambah/mengurangi/mengubah stok akan tercatat otomatis di sini.
              </p>
            </div>
          ) : (
            filteredMutations.map((m) => {
              const badge = getActionBadge(m);
              const BadgeIcon = badge.icon;
              const floorDef = m.floorId ? FLOOR_DEFINITIONS[m.floorId] : null;

              return (
                <div
                  key={m.id}
                  className="pt-2.5 first:pt-0 pb-1.5 flex flex-col gap-1.5 animate-in fade-in duration-100"
                >
                  {/* Top line: User avatar + name + floor + timestamp */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-zinc-800 text-white flex items-center justify-center text-[9px] font-bold">
                        {(m.userName || 'S').charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs font-bold text-black">
                        {m.userName || 'Staf Gudang'}
                      </span>
                      {floorDef && (
                        <span className="text-[9px] font-semibold bg-zinc-100 text-zinc-700 px-1.5 py-0.5 rounded border border-zinc-200">
                          {floorDef.name}
                        </span>
                      )}
                    </div>

                    <span className="text-[10px] text-zinc-400 font-mono">
                      {formatTime(m.timestamp)}
                    </span>
                  </div>

                  {/* Middle line: Item Name & Action Badge */}
                  <div className="flex items-center justify-between gap-2 pl-6">
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-zinc-900 block truncate">
                        {m.itemName}
                      </span>
                      <p className="text-[10px] text-zinc-500 italic mt-0.5">
                        {m.reason || 'Perubahan stok'}
                      </p>
                    </div>

                    <div
                      className={`px-2 py-0.5 rounded-lg border text-[10px] font-bold flex items-center gap-1 shrink-0 ${badge.bg}`}
                    >
                      <BadgeIcon size={11} />
                      <span>{badge.label}</span>
                    </div>
                  </div>

                  {/* Bottom stock transition comparison */}
                  <div className="flex items-center justify-between text-[10px] text-zinc-400 pl-6 pt-0.5 font-mono">
                    <span>
                      Stok Sebelumnya:{' '}
                      <strong className="text-zinc-600 font-bold">{m.prevStock}</strong>
                    </span>
                    <span>→</span>
                    <span>
                      Stok Akhir:{' '}
                      <strong className="text-black font-bold">{m.newStock} unit</strong>
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer with Actions */}
        <div className="p-3 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                soundEffects.playClickSound();
                // Generate CSV with UTF-8 BOM
                const headers = ['Waktu', 'Petugas', 'Lantai', 'Nama Barang', 'Aksi', 'Jumlah', 'Stok Sebelum', 'Stok Sesudah', 'Keterangan'];
                const rows = filteredMutations.map((m) => [
                  `"${formatTime(m.timestamp)}"`,
                  `"${m.userName || 'Staf'}"`,
                  `"Lantai ${m.floorId || '-'}"`,
                  `"${(m.itemName || '').replace(/"/g, '""')}"`,
                  `"${m.type}"`,
                  m.amount,
                  m.prevStock,
                  m.newStock,
                  `"${(m.reason || '').replace(/"/g, '""')}"`,
                ]);
                const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Riwayat_Aktivitas_Istiqomah_${new Date().toISOString().slice(0, 10)}.csv`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                URL.revokeObjectURL(url);
                soundEffects.playBackupSent();
              }}
              disabled={filteredMutations.length === 0}
              className="px-3 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-200 rounded-xl text-xs font-bold touch-press disabled:opacity-50"
              title="Unduh file Excel / CSV"
            >
              Unduh CSV
            </button>

            <button
              onClick={() => {
                soundEffects.playClickSound();
                let summary = `📋 *RIWAYAT AKTIVITAS STAF - ISTIQOMAH GROSIR*\n`;
                summary += `📅 Tanggal: ${new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}\n`;
                summary += `📊 Total: ${filteredMutations.length} aksi (+${totalInQty} in, -${totalOutQty} out)\n`;
                summary += `────────────────────\n\n`;

                filteredMutations.slice(0, 50).forEach((m, idx) => {
                  const actionStr = m.type === 'IN' ? `+${m.amount}` : m.type === 'OUT' ? `-${m.amount}` : `~${m.amount}`;
                  summary += `${idx + 1}. *${m.itemName}* (${actionStr} unit)\n`;
                  summary += `   👤 ${m.userName || 'Staf'} • Lt ${m.floorId || '-'}\n`;
                  summary += `   🕒 ${formatTime(m.timestamp)}\n`;
                  summary += `   📝 ${m.reason || 'Perubahan stok'} (Stok: ${m.prevStock} ➔ ${m.newStock})\n\n`;
                });

                if (navigator.clipboard) {
                  navigator.clipboard.writeText(summary);
                  alert('Riwayat aktivitas berhasil disalin ke clipboard!');
                }
              }}
              disabled={filteredMutations.length === 0}
              className="px-3 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-200 rounded-xl text-xs font-bold touch-press disabled:opacity-50"
              title="Salin Teks Ringkasan untuk WhatsApp"
            >
              Salin Teks
            </button>
          </div>

          <button
            onClick={() => {
              soundEffects.playClickSound();
              onClose();
            }}
            className="px-4 py-2 bg-black hover:bg-zinc-800 text-white rounded-xl text-xs font-bold touch-press shadow-xs"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
