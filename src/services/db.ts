import type {
  FloorId,
  FloorData,
  StockItem,
  MutationLog,
  AdminSettings,
  BackupExportData,
  UserAccount,
  RestockItem,
} from '../types/stock';
import { FLOOR_DEFINITIONS, DEFAULT_USERS } from '../types/stock';
import { TelegramService } from './telegram';
import { NetworkService } from './network';

const STORAGE_PREFIX = 'istiqomah_stock_floor_';
const ADMIN_CONFIG_KEY = 'istiqomah_stock_admin_config';
const CURRENT_USER_KEY = 'istiqomah_current_user';

const CLEAN_SLATE_FLAG = 'istiqomah_data_clean_slate_v2';

export const DEFAULT_ADMIN_SETTINGS: AdminSettings = {
  adminPasswordHash: 'balrev123@',
  floorPasswords: {
    '1': '1111',
    '2': '123',
    '3': '123',
    '4': '123',
  },
  users: DEFAULT_USERS,
  telegram: {
    botToken: '',
    chatId: '',
    autoBackup: false,
  },
};

export class StockStorageEngine {
  static checkAndApplyCleanSlate(): void {
    if (typeof window === 'undefined') return;
    try {
      const alreadyCleaned = localStorage.getItem(CLEAN_SLATE_FLAG);
      if (!alreadyCleaned) {
        const floors: FloorId[] = ['1', '2', '3', '4'];
        let hasDummyData = false;
        for (const fId of floors) {
          const raw = localStorage.getItem(`${STORAGE_PREFIX}${fId}`);
          if (
            raw &&
            (raw.includes('8992751111111') ||
              raw.includes('Tisu Paseo') ||
              raw.includes('Kemeja Pria Polos') ||
              raw.includes('Wajan Frypan'))
          ) {
            hasDummyData = true;
            break;
          }
        }

        if (hasDummyData) {
          this.clearAllFloorData();
        }
        localStorage.setItem(CLEAN_SLATE_FLAG, 'true');
      }
    } catch {
      // storage access note
    }
  }

  static getFloorData(floorId: FloorId): FloorData {
    this.checkAndApplyCleanSlate();
    const key = `${STORAGE_PREFIX}${floorId}`;
    const raw = localStorage.getItem(key);
    if (!raw) {
      const initialData: FloorData = {
        floorId,
        categories: [],
        items: [],
        mutations: [],
        lastUpdated: new Date().toISOString(),
      };
      this.saveFloorData(floorId, initialData);
      return initialData;
    }

    try {
      return JSON.parse(raw);
    } catch {
      const fallback: FloorData = {
        floorId,
        categories: [],
        items: [],
        mutations: [],
        lastUpdated: new Date().toISOString(),
      };
      return fallback;
    }
  }

  static clearAllFloorData(): void {
    const floors: FloorId[] = ['1', '2', '3', '4'];
    floors.forEach((fId) => {
      const emptyData: FloorData = {
        floorId: fId,
        categories: [],
        items: [],
        mutations: [],
        lastUpdated: new Date().toISOString(),
      };
      this.saveFloorData(fId, emptyData);
    });
  }

  static clearFloorData(floorId: FloorId): void {
    const emptyData: FloorData = {
      floorId,
      categories: [],
      items: [],
      mutations: [],
      lastUpdated: new Date().toISOString(),
    };
    this.saveFloorData(floorId, emptyData);
  }

  static saveFloorData(floorId: FloorId, data: FloorData): void {
    const key = `${STORAGE_PREFIX}${floorId}`;
    data.lastUpdated = new Date().toISOString();
    localStorage.setItem(key, JSON.stringify(data));

    window.dispatchEvent(
      new CustomEvent('istiqomah_stock_updated', {
        detail: { floorId },
      })
    );

    const admin = this.getAdminSettings();
    if (admin.telegram?.autoBackup && NetworkService.isOnline()) {
      const backup = this.exportSingleFloor(floorId);
      TelegramService.sendBackup(backup, floorId).catch((err: unknown) => {
        console.warn('Auto backup failed:', err);
      });
    }
  }

  static getCurrentUser(): UserAccount | null {
    const raw = sessionStorage.getItem(CURRENT_USER_KEY) || localStorage.getItem(CURRENT_USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  static setCurrentUser(user: UserAccount | null, remember: boolean = true): void {
    if (!user) {
      sessionStorage.removeItem(CURRENT_USER_KEY);
      localStorage.removeItem(CURRENT_USER_KEY);
    } else {
      const val = JSON.stringify(user);
      sessionStorage.setItem(CURRENT_USER_KEY, val);
      if (remember) {
        localStorage.setItem(CURRENT_USER_KEY, val);
      }
    }
    window.dispatchEvent(new CustomEvent('istiqomah_user_changed', { detail: { user } }));
  }

  static getAdminSettings(): AdminSettings {
    const raw = localStorage.getItem(ADMIN_CONFIG_KEY);
    if (!raw) {
      this.saveAdminSettings(DEFAULT_ADMIN_SETTINGS);
      return DEFAULT_ADMIN_SETTINGS;
    }

    try {
      const parsed = JSON.parse(raw);
      const storedUsers: UserAccount[] = Array.isArray(parsed.users) ? parsed.users : [];

      const userMap = new Map<string, UserAccount>();
      DEFAULT_USERS.forEach((u) => userMap.set(u.username.toLowerCase(), { ...u }));

      storedUsers.forEach((u) => {
        if (u.username) {
          const isDefault = DEFAULT_USERS.find((du) => du.username.toLowerCase() === u.username.toLowerCase());
          if (isDefault) {
            userMap.set(u.username.toLowerCase(), {
              ...u,
              role: isDefault.role,
              assignedFloors: isDefault.assignedFloors,
            });
          } else {
            userMap.set(u.username.toLowerCase(), u);
          }
        }
      });

      const mergedUsers = Array.from(userMap.values());

      return {
        ...DEFAULT_ADMIN_SETTINGS,
        ...parsed,
        users: mergedUsers,
      };
    } catch {
      return DEFAULT_ADMIN_SETTINGS;
    }
  }

  static saveAdminSettings(settings: AdminSettings): void {
    localStorage.setItem(ADMIN_CONFIG_KEY, JSON.stringify(settings));
  }

  static authenticateUser(usernameOrName: string, password: string): UserAccount | null {
    if (!usernameOrName || !password) return null;

    const cleanQuery = usernameOrName.trim().toLowerCase();
    const cleanPass = password.trim();

    const directMatch = DEFAULT_USERS.find((u) => {
      const matchUsername = (u.username || '').trim().toLowerCase() === cleanQuery;
      const matchName = (u.name || '').trim().toLowerCase() === cleanQuery;
      const matchPassword = (u.password || '').trim() === cleanPass;
      return (matchUsername || matchName) && matchPassword;
    });

    if (directMatch) {
      return directMatch;
    }

    const settings = this.getAdminSettings();
    const foundInSettings = (settings.users || []).find((u) => {
      const matchUsername = (u.username || '').trim().toLowerCase() === cleanQuery;
      const matchName = (u.name || '').trim().toLowerCase() === cleanQuery;
      const matchPassword = (u.password || '').trim() === cleanPass;
      return (matchUsername || matchName) && matchPassword;
    });

    if (foundInSettings) {
      return foundInSettings;
    }

    if (
      (cleanQuery === 'admin' || cleanQuery === 'admin utama' || cleanQuery === 'master admin') &&
      cleanPass === settings.adminPasswordHash
    ) {
      return {
        id: 'user_fahri',
        username: 'fahri',
        name: 'Fahri',
        password: settings.adminPasswordHash,
        role: 'ADMIN',
        assignedFloors: ['1', '2', '3', '4'],
      };
    }

    return null;
  }

  static saveUser(user: UserAccount): void {
    const settings = this.getAdminSettings();
    const users = settings.users || [...DEFAULT_USERS];
    const index = users.findIndex((u) => u.id === user.id || u.username.toLowerCase() === user.username.toLowerCase());
    if (index >= 0) {
      users[index] = user;
    } else {
      users.push(user);
    }
    this.saveAdminSettings({ ...settings, users });
  }

  static deleteUser(userId: string): void {
    const settings = this.getAdminSettings();
    const users = (settings.users || [...DEFAULT_USERS]).filter((u) => u.id !== userId);
    this.saveAdminSettings({ ...settings, users });
  }

  static adjustStock(
    floorId: FloorId,
    itemId: string,
    delta: number,
    reason: string
  ): { success: boolean; newStock: number; item?: StockItem } {
    const floorData = this.getFloorData(floorId);
    const itemIndex = floorData.items.findIndex((i) => i.id === itemId);

    if (itemIndex === -1) {
      return { success: false, newStock: 0 };
    }

    const item = floorData.items[itemIndex];
    const prevStock = item.quantity;
    const newStock = Math.max(0, prevStock + delta);
    const actualDelta = newStock - prevStock;

    item.quantity = newStock;
    item.updatedAt = new Date().toISOString();

    const currentUser = this.getCurrentUser();

    const mutation: MutationLog = {
      id: `mut_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      itemId: item.id,
      itemName: item.name,
      type: actualDelta > 0 ? 'IN' : actualDelta < 0 ? 'OUT' : 'ADJUST',
      amount: Math.abs(actualDelta),
      prevStock,
      newStock,
      reason: reason || (actualDelta > 0 ? 'Penambahan Stok' : 'Pengurangan Stok'),
      timestamp: new Date().toISOString(),
      userName: currentUser ? currentUser.name : 'Staf',
      floorId,
      actionType: actualDelta > 0 ? 'STOCK_IN' : actualDelta < 0 ? 'STOCK_OUT' : 'STOCK_ADJUST',
    };

    floorData.mutations.unshift(mutation);
    if (floorData.mutations.length > 300) {
      floorData.mutations = floorData.mutations.slice(0, 300);
    }

    this.saveFloorData(floorId, floorData);
    return { success: true, newStock, item };
  }

  static addItem(
    floorId: FloorId,
    itemData: Omit<StockItem, 'id' | 'createdAt' | 'updatedAt'>
  ): StockItem {
    const floorData = this.getFloorData(floorId);
    const newItem: StockItem = {
      ...itemData,
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    floorData.items.unshift(newItem);

    if (newItem.category && !floorData.categories.includes(newItem.category)) {
      floorData.categories.push(newItem.category);
    }

    const currentUser = this.getCurrentUser();

    floorData.mutations.unshift({
      id: `mut_${Date.now()}_add`,
      itemId: newItem.id,
      itemName: newItem.name,
      type: 'IN',
      amount: newItem.quantity,
      prevStock: 0,
      newStock: newItem.quantity,
      reason: 'Tambah produk baru',
      timestamp: new Date().toISOString(),
      userName: currentUser ? currentUser.name : 'Staf',
      floorId,
      actionType: 'ITEM_ADD',
    });

    this.saveFloorData(floorId, floorData);
    return newItem;
  }

  static updateItem(floorId: FloorId, item: StockItem): void {
    const floorData = this.getFloorData(floorId);
    const idx = floorData.items.findIndex((i) => i.id === item.id);
    if (idx !== -1) {
      const prevStock = floorData.items[idx].quantity;
      floorData.items[idx] = { ...item, updatedAt: new Date().toISOString() };

      if (prevStock !== item.quantity) {
        const delta = item.quantity - prevStock;
        const currentUser = this.getCurrentUser();
        floorData.mutations.unshift({
          id: `mut_${Date.now()}_edit`,
          itemId: item.id,
          itemName: item.name,
          type: delta > 0 ? 'IN' : 'OUT',
          amount: Math.abs(delta),
          prevStock,
          newStock: item.quantity,
          reason: prevStock !== item.quantity ? 'Koreksi stok produk' : 'Ubah detail produk',
          timestamp: new Date().toISOString(),
          userName: currentUser ? currentUser.name : 'Staf',
          floorId,
          actionType: prevStock !== item.quantity ? 'STOCK_ADJUST' : 'ITEM_UPDATE',
        });
      }

      this.saveFloorData(floorId, floorData);
    }
  }

  static deleteItem(floorId: FloorId, itemId: string): void {
    const floorData = this.getFloorData(floorId);
    const item = floorData.items.find((i) => i.id === itemId);
    floorData.items = floorData.items.filter((i) => i.id !== itemId);

    if (item) {
      const currentUser = this.getCurrentUser();
      floorData.mutations.unshift({
        id: `mut_${Date.now()}_del`,
        itemId: item.id,
        itemName: item.name,
        type: 'OUT',
        amount: item.quantity,
        prevStock: item.quantity,
        newStock: 0,
        reason: 'Hapus barang dari katalog',
        timestamp: new Date().toISOString(),
        userName: currentUser ? currentUser.name : 'Staf',
        floorId,
        actionType: 'ITEM_DELETE',
      });
    }

    this.saveFloorData(floorId, floorData);
  }

  static getAllMutations(): (MutationLog & { floorId: FloorId })[] {
    const floors: FloorId[] = ['1', '2', '3', '4'];
    const all: (MutationLog & { floorId: FloorId })[] = [];
    floors.forEach((fId) => {
      const data = this.getFloorData(fId);
      if (data.mutations && Array.isArray(data.mutations)) {
        data.mutations.forEach((m) => {
          all.push({
            ...m,
            floorId: m.floorId || fId,
          });
        });
      }
    });
    return all.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  static addCategory(floorId: FloorId, categoryName: string): boolean {
    const trimmed = categoryName.trim();
    if (!trimmed) return false;
    const floorData = this.getFloorData(floorId);
    if (!floorData.categories.includes(trimmed)) {
      floorData.categories.push(trimmed);
      this.saveFloorData(floorId, floorData);
      return true;
    }
    return false;
  }

  static removeCategory(floorId: FloorId, categoryName: string): void {
    const floorData = this.getFloorData(floorId);
    floorData.categories = floorData.categories.filter((c) => c !== categoryName);
    this.saveFloorData(floorId, floorData);
  }

  /**
   * Atomic Inter-Floor Stock Transfer
   */
  static transferStock(
    sourceFloorId: FloorId,
    targetFloorId: FloorId,
    itemId: string,
    quantity: number,
    notes?: string
  ): { success: boolean; message: string; sourceItemName?: string } {
    if (sourceFloorId === targetFloorId) {
      return { success: false, message: 'Lantai asal dan tujuan tidak boleh sama.' };
    }
    if (quantity <= 0) {
      return { success: false, message: 'Jumlah transfer harus lebih dari 0.' };
    }

    const sourceData = this.getFloorData(sourceFloorId);
    const sourceItemIndex = sourceData.items.findIndex((i) => i.id === itemId);
    if (sourceItemIndex === -1) {
      return { success: false, message: 'Barang tidak ditemukan di lantai asal.' };
    }

    const sourceItem = sourceData.items[sourceItemIndex];
    if (sourceItem.quantity < quantity) {
      return {
        success: false,
        message: `Stok tidak mencukupi. Stok saat ini: ${sourceItem.quantity} ${sourceItem.unit}`,
      };
    }

    const targetFloorName = FLOOR_DEFINITIONS[targetFloorId]?.name || `Lantai ${targetFloorId}`;
    const sourceFloorName = FLOOR_DEFINITIONS[sourceFloorId]?.name || `Lantai ${sourceFloorId}`;
    const currentUser = this.getCurrentUser();
    const userName = currentUser ? currentUser.name : 'Staf';
    const nowIso = new Date().toISOString();

    // 1. Deduct from source floor
    const prevSourceStock = sourceItem.quantity;
    sourceItem.quantity = prevSourceStock - quantity;
    sourceItem.updatedAt = nowIso;

    sourceData.mutations.unshift({
      id: `mut_${Date.now()}_tf_out`,
      itemId: sourceItem.id,
      itemName: sourceItem.name,
      type: 'OUT',
      amount: quantity,
      prevStock: prevSourceStock,
      newStock: sourceItem.quantity,
      reason: `Transfer ke ${targetFloorName}${notes ? ` (${notes})` : ''}`,
      timestamp: nowIso,
      userName,
      floorId: sourceFloorId,
      actionType: 'TRANSFER_OUT',
    });
    if (sourceData.mutations.length > 300) sourceData.mutations = sourceData.mutations.slice(0, 300);
    this.saveFloorData(sourceFloorId, sourceData);

    // 2. Add to target floor
    const targetData = this.getFloorData(targetFloorId);
    let targetItemIndex = -1;

    if (sourceItem.barcode) {
      targetItemIndex = targetData.items.findIndex((i) => i.barcode === sourceItem.barcode);
    }
    if (targetItemIndex === -1) {
      targetItemIndex = targetData.items.findIndex(
        (i) => i.name.trim().toLowerCase() === sourceItem.name.trim().toLowerCase()
      );
    }

    let targetItem: StockItem;
    let prevTargetStock = 0;

    if (targetItemIndex >= 0) {
      targetItem = targetData.items[targetItemIndex];
      prevTargetStock = targetItem.quantity;
      targetItem.quantity = prevTargetStock + quantity;
      targetItem.updatedAt = nowIso;
    } else {
      // Create new matching item in target floor
      targetItem = {
        id: `item_${Date.now()}_tf_${Math.random().toString(36).substr(2, 4)}`,
        name: sourceItem.name,
        category: sourceItem.category,
        barcode: sourceItem.barcode,
        quantity: quantity,
        minStock: sourceItem.minStock,
        maxStock: sourceItem.maxStock,
        unit: sourceItem.unit,
        locationDetails: `Transfer dari ${sourceFloorName}`,
        notes: sourceItem.notes,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      targetData.items.unshift(targetItem);

      if (targetItem.category && !targetData.categories.includes(targetItem.category)) {
        targetData.categories.push(targetItem.category);
      }
    }

    targetData.mutations.unshift({
      id: `mut_${Date.now()}_tf_in`,
      itemId: targetItem.id,
      itemName: targetItem.name,
      type: 'IN',
      amount: quantity,
      prevStock: prevTargetStock,
      newStock: targetItem.quantity,
      reason: `Diterima dari ${sourceFloorName}${notes ? ` (${notes})` : ''}`,
      timestamp: nowIso,
      userName,
      floorId: targetFloorId,
      actionType: 'TRANSFER_IN',
    });
    if (targetData.mutations.length > 300) targetData.mutations = targetData.mutations.slice(0, 300);
    this.saveFloorData(targetFloorId, targetData);

    return {
      success: true,
      message: `Berhasil memindahkan ${quantity} ${sourceItem.unit} ${sourceItem.name} dari ${sourceFloorName} ke ${targetFloorName}.`,
      sourceItemName: sourceItem.name,
    };
  }

  /**
   * Batch Stock Opname Reconciliation
   */
  static applyStockOpname(
    floorId: FloorId,
    records: { itemId: string; physicalStock: number }[],
    notes?: string
  ): { success: boolean; adjustedCount: number } {
    const floorData = this.getFloorData(floorId);
    let adjustedCount = 0;
    const nowIso = new Date().toISOString();
    const currentUser = this.getCurrentUser();
    const userName = currentUser ? currentUser.name : 'Staf';

    records.forEach((rec) => {
      const item = floorData.items.find((i) => i.id === rec.itemId);
      if (item && item.quantity !== rec.physicalStock) {
        const prevStock = item.quantity;
        const newStock = Math.max(0, rec.physicalStock);
        const diff = newStock - prevStock;

        item.quantity = newStock;
        item.updatedAt = nowIso;
        adjustedCount++;

        floorData.mutations.unshift({
          id: `mut_${Date.now()}_opname_${Math.random().toString(36).substr(2, 4)}`,
          itemId: item.id,
          itemName: item.name,
          type: 'ADJUST',
          amount: Math.abs(diff),
          prevStock,
          newStock,
          reason: `Stok Opname: Fisik ${newStock} (${diff > 0 ? `+${diff}` : diff})${notes ? ` - ${notes}` : ''}`,
          timestamp: nowIso,
          userName,
          floorId,
          actionType: 'STOCK_OPNAME',
        });
      }
    });

    if (adjustedCount > 0) {
      if (floorData.mutations.length > 300) {
        floorData.mutations = floorData.mutations.slice(0, 300);
      }
      this.saveFloorData(floorId, floorData);
    }

    return { success: true, adjustedCount };
  }

  /**
   * Aggregate low/out of stock items for Restock / Purchase Order planning
   */
  static getRestockItems(floorId?: FloorId | 'ALL'): RestockItem[] {
    const targetFloors: FloorId[] = !floorId || floorId === 'ALL' ? ['1', '2', '3', '4'] : [floorId];
    const results: RestockItem[] = [];

    targetFloors.forEach((fId) => {
      const floorInfo = FLOOR_DEFINITIONS[fId];
      const floorData = this.getFloorData(fId);

      floorData.items.forEach((item) => {
        if (item.quantity <= item.minStock) {
          const suggestedRestock =
            item.maxStock && item.maxStock > item.quantity
              ? item.maxStock - item.quantity
              : Math.max(1, item.minStock * 2 - item.quantity);

          results.push({
            id: item.id,
            floorId: fId,
            floorName: floorInfo?.name || `Lantai ${fId}`,
            name: item.name,
            category: item.category || 'Umum',
            barcode: item.barcode,
            currentStock: item.quantity,
            minStock: item.minStock,
            maxStock: item.maxStock,
            suggestedRestock,
            unit: item.unit || 'pcs',
            location: item.locationDetails,
          });
        }
      });
    });

    return results.sort((a, b) => {
      if (a.currentStock === 0 && b.currentStock > 0) return -1;
      if (b.currentStock === 0 && a.currentStock > 0) return 1;
      return a.currentStock - b.currentStock;
    });
  }

  static exportSingleFloor(floorId: FloorId): BackupExportData {
    const data = this.getFloorData(floorId);
    return {
      version: '2.0',
      appName: 'Istiqomah Grosir Stock',
      exportedAt: new Date().toISOString(),
      type: 'SINGLE_FLOOR',
      floorId,
      floors: {
        [floorId]: data,
      },
    };
  }

  static exportAllFloors(): BackupExportData {
    const floors: BackupExportData['floors'] = {
      '1': this.getFloorData('1'),
      '2': this.getFloorData('2'),
      '3': this.getFloorData('3'),
      '4': this.getFloorData('4'),
    };
    return {
      version: '2.0',
      appName: 'Istiqomah Grosir Stock',
      exportedAt: new Date().toISOString(),
      type: 'ALL_FLOORS',
      floors,
      adminSettings: this.getAdminSettings(),
    };
  }

  static importData(
    backup: BackupExportData,
    targetFloorId?: FloorId,
    mode: 'MERGE' | 'REPLACE' = 'MERGE'
  ): { success: boolean; message: string } {
    try {
      if (!backup || !backup.floors) {
        return { success: false, message: 'Format backup tidak valid' };
      }

      if (backup.type === 'ALL_FLOORS' || (!targetFloorId && Object.keys(backup.floors).length > 1)) {
        const floorKeys = Object.keys(backup.floors) as FloorId[];
        for (const fId of floorKeys) {
          const incoming = backup.floors[fId];
          if (!incoming) continue;
          if (mode === 'REPLACE') {
            this.saveFloorData(fId, incoming);
          } else {
            const current = this.getFloorData(fId);
            const merged = this.mergeFloorData(current, incoming);
            this.saveFloorData(fId, merged);
          }
        }

        if (backup.adminSettings) {
          this.saveAdminSettings(backup.adminSettings);
        }

        return { success: true, message: `Berhasil sinkronisasi database` };
      } else {
        const incomingFloorKey = (backup.floorId || Object.keys(backup.floors)[0]) as FloorId;
        const incomingData = backup.floors[incomingFloorKey];

        if (!incomingData) {
          return { success: false, message: 'Tidak ada data lantai dalam file' };
        }

        const destinationFloor = targetFloorId || incomingFloorKey || '1';

        if (mode === 'REPLACE') {
          const formatted: FloorData = {
            ...incomingData,
            floorId: destinationFloor,
          };
          this.saveFloorData(destinationFloor, formatted);
        } else {
          const current = this.getFloorData(destinationFloor);
          const merged = this.mergeFloorData(current, incomingData);
          this.saveFloorData(destinationFloor, merged);
        }

        return {
          success: true,
          message: `Berhasil sinkronisasi data ke ${FLOOR_DEFINITIONS[destinationFloor].name}`,
        };
      }
    } catch (e) {
      return { success: false, message: 'Gagal mengimpor: ' + String(e) };
    }
  }

  private static mergeFloorData(current: FloorData, incoming: FloorData): FloorData {
    const mergedCategories = Array.from(new Set([...current.categories, ...incoming.categories]));
    const itemMap = new Map<string, StockItem>();

    current.items.forEach((item) => itemMap.set(item.id, { ...item }));

    incoming.items.forEach((incItem) => {
      const existing = itemMap.get(incItem.id);
      if (existing) {
        itemMap.set(incItem.id, {
          ...existing,
          ...incItem,
          updatedAt: new Date().toISOString(),
        });
      } else {
        itemMap.set(incItem.id, { ...incItem });
      }
    });

    const mergedMutations = [...incoming.mutations, ...current.mutations].slice(0, 300);

    return {
      floorId: current.floorId,
      categories: mergedCategories,
      items: Array.from(itemMap.values()),
      mutations: mergedMutations,
      lastUpdated: new Date().toISOString(),
    };
  }

  static getAggregateStats() {
    const floors: FloorId[] = ['1', '2', '3', '4'];
    let totalItemsCount = 0;
    let totalStockQty = 0;
    let totalOutOfStockCount = 0;
    let totalLowStockCount = 0;

    const floorSummaries = floors.map((fId) => {
      const data = this.getFloorData(fId);
      const itemCount = data.items.length;
      const stockQty = data.items.reduce((sum, it) => sum + it.quantity, 0);
      const outOfStock = data.items.filter((it) => it.quantity <= 0).length;
      const lowStock = data.items.filter((it) => it.quantity > 0 && it.quantity <= it.minStock).length;

      totalItemsCount += itemCount;
      totalStockQty += stockQty;
      totalOutOfStockCount += outOfStock;
      totalLowStockCount += lowStock;

      return {
        floorId: fId,
        name: FLOOR_DEFINITIONS[fId].name,
        subtitle: FLOOR_DEFINITIONS[fId].subtitle,
        itemCount,
        stockQty,
        outOfStock,
        lowStock,
      };
    });

    return {
      totalItemsCount,
      totalStockQty,
      totalOutOfStockCount,
      totalLowStockCount,
      floorSummaries,
    };
  }
}
