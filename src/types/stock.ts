export type FloorId = '1' | '2' | '3' | '4';

export interface FloorInfo {
  id: FloorId;
  name: string;
  subtitle: string;
  iconName: string;
  defaultCategories: string[];
}

export const FLOOR_DEFINITIONS: Record<FloorId, FloorInfo> = {
  '1': {
    id: '1',
    name: 'Lantai 1',
    subtitle: 'Kebutuhan',
    iconName: 'ShoppingBag',
    defaultCategories: [],
  },
  '2': {
    id: '2',
    name: 'Lantai 2',
    subtitle: 'Pakaian',
    iconName: 'Shirt',
    defaultCategories: [],
  },
  '3': {
    id: '3',
    name: 'Lantai 3',
    subtitle: 'Perabotan',
    iconName: 'Armchair',
    defaultCategories: [],
  },
  '4': {
    id: '4',
    name: 'Lantai 4',
    subtitle: 'Gudang',
    iconName: 'Package',
    defaultCategories: [],
  },
};

export interface StockItem {
  id: string;
  name: string;
  category: string;
  barcode?: string;
  quantity: number;
  minStock: number;
  unit: string;
  locationDetails?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MutationLog {
  id: string;
  itemId: string;
  itemName: string;
  type: 'IN' | 'OUT' | 'ADJUST';
  amount: number;
  prevStock: number;
  newStock: number;
  reason: string;
  timestamp: string;
  userName?: string;
}

export interface FloorData {
  floorId: FloorId;
  categories: string[];
  items: StockItem[];
  mutations: MutationLog[];
  lastUpdated: string;
}

export interface UserAccount {
  id: string;
  username: string;
  name: string;
  password: string;
  role: 'ADMIN' | 'STAFF';
  assignedFloors: FloorId[];
}

export const DEFAULT_USERS: UserAccount[] = [
  {
    id: 'user_fahri',
    username: 'fahri',
    name: 'Fahri',
    password: '819',
    role: 'ADMIN',
    assignedFloors: ['1', '2', '3', '4'],
  },
  {
    id: 'user_eza',
    username: 'eza',
    name: 'Eza',
    password: '123',
    role: 'STAFF',
    assignedFloors: ['1', '2', '3', '4'],
  },
  {
    id: 'user_hasan',
    username: 'hasan',
    name: 'Hasan',
    password: '123',
    role: 'STAFF',
    assignedFloors: ['1', '2', '3', '4'],
  },
  {
    id: 'user_amal',
    username: 'amal',
    name: 'Amal',
    password: '123',
    role: 'STAFF',
    assignedFloors: ['1', '2', '3', '4'],
  },
  {
    id: 'user_alfan',
    username: 'alfan',
    name: 'Alfan',
    password: '123',
    role: 'STAFF',
    assignedFloors: ['1', '2', '3', '4'],
  },
  {
    id: 'user_zahra',
    username: 'zahra',
    name: 'Zahra',
    password: '123',
    role: 'STAFF',
    assignedFloors: ['2'],
  },
  {
    id: 'user_alfi',
    username: 'alfi',
    name: 'Alfi',
    password: '123',
    role: 'STAFF',
    assignedFloors: ['2'],
  },
  {
    id: 'user_erpan',
    username: 'erpan',
    name: 'Erpan',
    password: '123',
    role: 'STAFF',
    assignedFloors: ['3', '4'],
  },
  {
    id: 'user_hendra',
    username: 'hendra',
    name: 'Hendra',
    password: '123',
    role: 'STAFF',
    assignedFloors: ['3', '4'],
  },
];

export interface TelegramConfig {
  botToken: string;
  chatId: string;
  autoBackup: boolean;
  lastBackupTime?: string;
  lastStatus?: string;
  lastMessage?: string;
}

export interface AdminSettings {
  adminPasswordHash: string;
  floorPasswords: Record<FloorId, string>;
  users: UserAccount[];
  telegram: TelegramConfig;
}

export interface BackupExportData {
  version: string;
  appName: 'Istiqomah Grosir Stock';
  exportedAt: string;
  type: 'SINGLE_FLOOR' | 'ALL_FLOORS';
  floorId?: FloorId;
  floors: {
    [key in FloorId]?: FloorData;
  };
  adminSettings?: AdminSettings;
}
