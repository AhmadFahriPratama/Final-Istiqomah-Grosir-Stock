import React, { useState } from 'react';
import { X, Plus, Trash2, Layers } from 'lucide-react';
import { soundEffects } from '../utils/audio';

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
      alert('Minimal harus ada 1 jenis barang.');
      return;
    }
    if (confirm(`Hapus jenis "${cat}" dari ${floorName}?`)) {
      soundEffects.playClickSound();
      onRemoveCategory(cat);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 modal-backdrop animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-xs w-full shadow-2xl overflow-hidden border border-zinc-200">
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-zinc-100 bg-zinc-50">
          <div className="flex items-center gap-1.5">
            <Layers size={15} className="text-black" />
            <h3 className="text-xs font-bold text-black">Kelola Jenis ({floorName})</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-zinc-400 hover:text-black hover:bg-zinc-200"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <form onSubmit={handleAdd} className="flex gap-1.5">
            <input
              type="text"
              placeholder="Nama jenis baru..."
              value={newCat}
              onChange={(e) => setNewCat(e.target.value)}
              className="flex-1 px-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-black font-medium"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-black hover:bg-zinc-800 text-white rounded-xl text-xs font-bold flex items-center gap-1 touch-press"
            >
              <Plus size={13} /> Tambah
            </button>
          </form>

          <div className="space-y-1 max-h-56 overflow-y-auto pr-0.5">
            {categories.map((cat) => (
              <div
                key={cat}
                className="flex items-center justify-between p-2 rounded-xl bg-zinc-50 border border-zinc-200 text-xs"
              >
                <span className="font-bold text-black">{cat}</span>
                <button
                  type="button"
                  onClick={() => handleRemove(cat)}
                  className="p-1 text-zinc-400 hover:text-black rounded"
                  title="Hapus jenis"
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
