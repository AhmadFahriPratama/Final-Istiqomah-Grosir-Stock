import React, { useState, useMemo } from 'react';
import { X, Plus, Trash2, Layers, Tag, Search } from 'lucide-react';
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
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCategories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((c) => c.toLowerCase().includes(q));
  }, [categories, searchQuery]);

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
        `Hapus kategori "${cat}" dari ${floorName}?\nBarang yang sudah ada di kategori ini tetap aman di sistem.`
      )
    ) {
      soundEffects.playClickSound();
      onRemoveCategory(cat);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop anim-fade-in">
      <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl overflow-hidden border border-stone-200 anim-slide-up flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 bg-stone-50/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-stone-900 text-white flex items-center justify-center shadow-xs">
              <Layers size={15} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900 leading-tight">Kelola Jenis & Kategori</h3>
              <p className="text-xs text-stone-400 mt-0.5">{floorName} · {categories.length} jenis terdaftar</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors touch-press"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-4 space-y-3 overflow-y-auto flex-1">
          {/* Add Category Form */}
          <form onSubmit={handleAdd} className="flex gap-1.5">
            <input
              type="text"
              placeholder="Nama jenis/kategori baru..."
              value={newCat}
              onChange={(e) => setNewCat(e.target.value)}
              className="flex-1 px-3.5 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-stone-400 font-semibold text-stone-900 placeholder:text-stone-400"
            />
            <button
              type="submit"
              disabled={!newCat.trim()}
              className="px-3.5 py-2 bg-stone-900 hover:bg-stone-800 disabled:opacity-40 text-white rounded-xl text-xs font-bold flex items-center gap-1 touch-press shadow-xs shrink-0"
            >
              <Plus size={13} /> Tambah
            </button>
          </form>

          {/* Quick Search if more than 5 categories */}
          {categories.length > 4 && (
            <div className="relative">
              <Search size={13} className="absolute left-3 top-2.5 text-stone-400" />
              <input
                type="text"
                placeholder="Cari jenis barang..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-stone-400 font-medium placeholder:text-stone-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1.5 text-xs text-stone-400 hover:text-stone-700"
                >
                  ✕
                </button>
              )}
            </div>
          )}

          {/* Categories List */}
          <div className="space-y-1.5 pr-0.5">
            {filteredCategories.length === 0 ? (
              <p className="text-xs text-stone-400 py-4 text-center">
                Tidak ada jenis barang ditemukan.
              </p>
            ) : (
              filteredCategories.map((cat) => (
                <div
                  key={cat}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-stone-50 hover:bg-stone-100/80 border border-stone-200 text-xs transition-colors"
                >
                  <span className="font-semibold text-stone-800 flex items-center gap-2">
                    <Tag size={12} className="text-stone-400" /> {cat}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemove(cat)}
                    className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                    title="Hapus Kategori"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
