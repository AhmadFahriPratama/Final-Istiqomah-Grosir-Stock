import React, { useState } from 'react';
import { X, Plus, Trash2, Layers, Tag } from 'lucide-react';
import { soundEffects } from '../utils/audio';
import { useRegisterModal } from '../utils/modalManager';

interface CategoryManagerModalProps {
  isOpen: boolean;
  floorName: string;
  categories: string[];
  onClose: () => void;
  onAddCategory: (name: string) => void;
  onRemoveCategory: (name: string) => void;
}

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
  isOpen,
  floorName,
  categories,
  onClose,
  onAddCategory,
  onRemoveCategory,
}) => {
  useRegisterModal('CategoryManagerModal', isOpen, onClose);
  const [newCat, setNewCat] = useState('');

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCat.trim()) return;
    soundEffects.playClickSound();
    onAddCategory(newCat.trim());
    setNewCat('');
  };

  const handleRemove = (cat: string) => {
    if (categories.length <= 1) {
      alert('Minimal harus ada 1 kategori barang.');
      return;
    }
    if (
      confirm(
        `⚠️ HAPUS KATEGORI:\n\nApakah Anda yakin ingin menghapus "${cat}" dari ${floorName}?\nBarang yang sudah ada akan tetap aman di sistem.`
      )
    ) {
      soundEffects.playClickSound();
      onRemoveCategory(cat);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 modal-backdrop animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-xs w-full shadow-2xl overflow-hidden border border-zinc-200">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-zinc-100 bg-zinc-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-black text-white flex items-center justify-center shadow-xs">
              <Layers size={15} />
            </div>
            <div>
              <h3 className="text-xs font-bold text-black leading-tight">Kelola Kategori</h3>
              <p className="text-[10px] text-zinc-400 font-medium">{floorName} ({categories.length} jenis)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:text-black hover:bg-zinc-200 transition-colors touch-press"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-4 space-y-3">
          {/* Add Category Form */}
          <form onSubmit={handleAdd} className="flex gap-1.5">
            <input
              type="text"
              placeholder="Tambah kategori baru..."
              value={newCat}
              onChange={(e) => setNewCat(e.target.value)}
              className="flex-1 px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-black font-semibold text-black"
            />
            <button
              type="submit"
              disabled={!newCat.trim()}
              className="px-3.5 py-2 bg-black hover:bg-zinc-800 disabled:opacity-40 text-white rounded-xl text-xs font-bold flex items-center gap-1 touch-press shadow-xs shrink-0"
            >
              <Plus size={13} /> Tambah
            </button>
          </form>

          {/* Categories List */}
          <div className="space-y-1.5 max-h-60 overflow-y-auto pr-0.5">
            {categories.map((cat) => (
              <div
                key={cat}
                className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-xs transition-colors"
              >
                <span className="font-bold text-zinc-900 flex items-center gap-1.5">
                  <Tag size={12} className="text-zinc-400" /> {cat}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemove(cat)}
                  className="p-1 text-zinc-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                  title="Hapus Kategori"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
