import React, { useState } from 'react';
import {
  X,
  Users,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  KeyRound,
  Shield,
  Search,
} from 'lucide-react';
import type { FloorId, UserAccount } from '../types/stock';
import { FLOOR_DEFINITIONS } from '../types/stock';
import { StockStorageEngine } from '../services/db';
import { soundEffects } from '../utils/audio';
import { useRegisterModal } from '../utils/modalManager';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: UserAccount[];
  onUsersUpdated: () => void;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  isOpen,
  onClose,
  users,
  onUsersUpdated,
}) => {
  useRegisterModal('UserManagementModal', isOpen, onClose);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState<'ADMIN' | 'STAFF'>('STAFF');
  const [formAssignedFloors, setFormAssignedFloors] = useState<FloorId[]>(['1']);
  const [userToast, setUserToast] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const handleStartAddUser = () => {
    soundEffects.playClickSound();
    setEditingUserId(null);
    setFormName('');
    setFormUsername('');
    setFormPassword('');
    setFormRole('STAFF');
    setFormAssignedFloors(['1']);
    setIsAddingUser(true);
  };

  const handleStartEditUser = (u: UserAccount) => {
    soundEffects.playClickSound();
    setEditingUserId(u.id);
    setFormName(u.name);
    setFormUsername(u.username);
    setFormPassword(u.password);
    setFormRole(u.role);
    setFormAssignedFloors([...u.assignedFloors]);
    setIsAddingUser(true);
  };

  const handleToggleFloorAssignment = (fId: FloorId) => {
    soundEffects.playClickSound();
    if (formAssignedFloors.includes(fId)) {
      if (formAssignedFloors.length > 1) {
        setFormAssignedFloors(formAssignedFloors.filter((f) => f !== fId));
      }
    } else {
      setFormAssignedFloors([...formAssignedFloors, fId]);
    }
  };

  const handleSaveUserForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formUsername.trim() || !formPassword.trim()) {
      return;
    }

    soundEffects.playClickSound();

    const userAccount: UserAccount = {
      id: editingUserId || `user_${Date.now()}`,
      name: formName.trim(),
      username: formUsername.trim().toLowerCase(),
      password: formPassword.trim(),
      role: formRole,
      assignedFloors: formRole === 'ADMIN' ? ['1', '2', '3', '4'] : formAssignedFloors,
    };

    StockStorageEngine.saveUser(userAccount);
    onUsersUpdated();
    setIsAddingUser(false);
    setUserToast(`Akun ${userAccount.name} (@${userAccount.username}) berhasil disimpan!`);
    setTimeout(() => setUserToast(null), 3000);
  };

  const handleDeleteUserAccount = (userId: string, userName: string) => {
    if (userName.toLowerCase() === 'fahri') {
      alert('Akun Admin Fahri adalah akun utama dan tidak dapat dihapus.');
      return;
    }
    if (confirm(`⚠️ HAPUS AKUN STAF:\n\nApakah Anda yakin ingin menghapus akun petugas "${userName}"?\nPetugas ini tidak akan dapat login lagi ke aplikasi.`)) {
      soundEffects.playClickSound();
      StockStorageEngine.deleteUser(userId);
      onUsersUpdated();
    }
  };

  const filteredUsers = users.filter((u) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return u.name.toLowerCase().includes(q) || u.username.toLowerCase().includes(q);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 modal-backdrop animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-zinc-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-zinc-100 bg-zinc-50/90 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-black text-white flex items-center justify-center shadow-xs">
              <Users size={16} />
            </div>
            <div>
              <h3 className="text-xs font-bold text-black leading-none">
                Manajemen User & Staf
              </h3>
              <p className="text-[10px] text-zinc-500 font-medium mt-0.5">
                Kelola akun petugas, password & hak akses lantai
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

        {/* Action / Search Bar */}
        <div className="p-3 bg-zinc-50/60 border-b border-zinc-200 flex items-center gap-2 shrink-0">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari staf..."
              className="w-full pl-7 pr-3 py-1.5 text-xs bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-black"
            />
            <Search size={12} className="absolute left-2.5 top-2.5 text-zinc-400" />
          </div>

          <button
            onClick={handleStartAddUser}
            className="px-3 py-1.5 bg-black hover:bg-zinc-800 text-white rounded-xl text-xs font-bold flex items-center gap-1 touch-press shrink-0 shadow-xs"
          >
            <Plus size={13} /> Tambah Staf
          </button>
        </div>

        {/* Toast Alert */}
        {userToast && (
          <div className="mx-3 mt-2 p-2 rounded-xl bg-black text-white border border-zinc-800 text-xs font-semibold flex items-center gap-1.5 shrink-0 shadow-lg">
            <CheckCircle size={14} className="text-white" />
            <span>{userToast}</span>
          </div>
        )}

        {/* Body Content */}
        <div className="p-3 overflow-y-auto space-y-3 flex-1">
          {/* Add / Edit Form Modal Inline */}
          {isAddingUser && (
            <form
              onSubmit={handleSaveUserForm}
              className="bg-zinc-50 border border-zinc-300 rounded-2xl p-3.5 space-y-2.5 animate-in zoom-in-95 duration-150 shadow-sm"
            >
              <div className="flex items-center justify-between border-b border-zinc-200 pb-1.5">
                <span className="text-xs font-bold text-black flex items-center gap-1.5">
                  <Shield size={13} />
                  {editingUserId ? 'Edit Akun Staf' : 'Tambah Penjaga Baru'}
                </span>
                <button
                  type="button"
                  onClick={() => setIsAddingUser(false)}
                  className="text-[10px] text-zinc-400 hover:text-black font-semibold"
                >
                  Batal
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-semibold text-zinc-600 block mb-0.5">
                    Nama Petugas:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Eza"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-zinc-200 rounded-xl font-bold focus:outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-zinc-600 block mb-0.5">
                    Username Login:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="eza"
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-zinc-200 rounded-xl font-mono font-bold focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-semibold text-zinc-600 block mb-0.5">
                    Password Akun:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="password"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-zinc-200 rounded-xl font-mono font-bold focus:outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-zinc-600 block mb-0.5">
                    Peran / Hak Akses:
                  </label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as 'ADMIN' | 'STAFF')}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-zinc-200 rounded-xl font-bold focus:outline-none focus:border-black"
                  >
                    <option value="STAFF">Penjaga Lantai (Staf)</option>
                    <option value="ADMIN">Super Admin (Fahri)</option>
                  </select>
                </div>
              </div>

              {formRole === 'STAFF' && (
                <div>
                  <label className="text-[10px] font-semibold text-zinc-600 block mb-1">
                    Pilih Akses Lantai Kerja:
                  </label>
                  <div className="grid grid-cols-4 gap-1">
                    {(['1', '2', '3', '4'] as FloorId[]).map((f) => {
                      const isChecked = formAssignedFloors.includes(f);
                      return (
                        <button
                          key={f}
                          type="button"
                          onClick={() => handleToggleFloorAssignment(f)}
                          className={`py-1 text-[10px] font-bold rounded-lg border transition-all ${
                            isChecked
                              ? 'bg-black text-white border-black shadow-xs'
                              : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-100'
                          }`}
                        >
                          Lt {f}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2 bg-black hover:bg-zinc-800 text-white rounded-xl text-xs font-bold touch-press shadow-xs mt-1"
              >
                Simpan Data Akun
              </button>
            </form>
          )}

          {/* User List */}
          <div className="space-y-2">
            {filteredUsers.map((u) => (
              <div
                key={u.id}
                className="p-3 rounded-2xl bg-zinc-50 border border-zinc-200 flex items-center justify-between hover:border-zinc-300 transition-colors"
              >
                <div className="min-w-0 pr-2 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-[10px] font-bold">
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs font-bold text-black">{u.name}</span>
                    <span className="text-[10px] text-zinc-400 font-mono">@{u.username}</span>
                    {u.role === 'ADMIN' && (
                      <span className="text-[8px] font-bold bg-black text-white px-1.5 py-0.5 rounded">
                        ADMIN
                      </span>
                    )}
                  </div>

                  <div className="text-[10px] text-zinc-500 flex flex-wrap items-center gap-1 pl-7">
                    <span>Akses:</span>
                    {u.role === 'ADMIN' ? (
                      <span className="font-semibold text-black">Admin (Semua Lantai)</span>
                    ) : (
                      <span className="font-semibold text-black">
                        {u.assignedFloors.map((f) => FLOOR_DEFINITIONS[f].name).join(', ')}
                      </span>
                    )}
                    <span>•</span>
                    <span className="flex items-center gap-0.5">
                      <KeyRound size={10} className="text-zinc-400" />
                      <code className="font-mono font-bold text-zinc-700">{u.password}</code>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleStartEditUser(u)}
                    className="p-1.5 text-zinc-400 hover:text-black hover:bg-zinc-200 rounded-lg transition-colors"
                    title="Edit Akun"
                  >
                    <Edit2 size={14} />
                  </button>
                  {u.name.toLowerCase() !== 'fahri' && (
                    <button
                      onClick={() => handleDeleteUserAccount(u.id, u.name)}
                      className="p-1.5 text-zinc-400 hover:text-black hover:bg-zinc-200 rounded-lg transition-colors"
                      title="Hapus Akun"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-zinc-50 border-t border-zinc-100 flex justify-end shrink-0">
          <button
            onClick={() => {
              soundEffects.playClickSound();
              onClose();
            }}
            className="px-4 py-2 bg-black hover:bg-zinc-800 text-white rounded-xl text-xs font-bold touch-press shadow-xs"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
