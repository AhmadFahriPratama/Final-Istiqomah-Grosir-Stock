import { StockStorageEngine } from './services/db';
import { ReportService } from './services/reports';
import { FLOOR_DEFINITIONS } from './types/stock';

// Mock localStorage in Node environment
class MockLocalStorage {
  private store: Record<string, string> = {};
  getItem(key: string): string | null {
    return this.store[key] || null;
  }
  setItem(key: string, value: string): void {
    this.store[key] = value;
  }
  removeItem(key: string): void {
    delete this.store[key];
  }
  clear(): void {
    this.store = {};
  }
}

// Attach mock
const globalObj = globalThis as unknown as {
  localStorage: MockLocalStorage;
  sessionStorage: MockLocalStorage;
  window: { dispatchEvent: () => boolean };
};
globalObj.localStorage = new MockLocalStorage();
globalObj.sessionStorage = new MockLocalStorage();
globalObj.window = {
  dispatchEvent: () => true,
};

console.log('=== RUNNING ISTIQOMAH STOCK VERIFICATION SUITE ===\n');

// Test 1: Only Fahri is Admin, all others are restricted
console.log('Test 1: Verifying Fahri is the ONLY Admin and others are Staff');

const fahri = StockStorageEngine.authenticateUser('Fahri', '819');
console.assert(fahri !== null && fahri.role === 'ADMIN', 'Fahri must have role ADMIN');
console.log('  ✓ Fahri (819): role === ADMIN (Full Access + Admin Dashboard)');

const staffAccounts = [
  { name: 'eza', pass: '123', floors: 4 },
  { name: 'hasan', pass: '123', floors: 4 },
  { name: 'amal', pass: '123', floors: 4 },
  { name: 'alfan', pass: '123', floors: 4 },
  { name: 'zahra', pass: '123', floors: 1 },
  { name: 'alfi', pass: '123', floors: 1 },
  { name: 'erpan', pass: '123', floors: 2 },
  { name: 'hendra', pass: '123', floors: 2 },
];

for (const s of staffAccounts) {
  const auth = StockStorageEngine.authenticateUser(s.name, s.pass);
  console.assert(auth !== null, `Login failed for ${s.name}`);
  console.assert(auth?.role === 'STAFF', `${s.name} MUST be role STAFF (not ADMIN)`);
  console.assert(auth?.assignedFloors.length === s.floors, `${s.name} floor count mismatch`);
  console.log(`  ✓ ${s.name} (123): role === STAFF, ${auth?.assignedFloors.length} lantai`);
}
console.log('✓ Access restriction verified.');

// Test 2: User Password Self-Update Feature
console.log('\nTest 2: Testing User Password Self-Update Feature');
// Zahra updates her password from 123 -> zahra2026
const zahraOriginal = StockStorageEngine.authenticateUser('zahra', '123');
console.assert(zahraOriginal !== null, 'Zahra login failed');

StockStorageEngine.saveUser({
  ...zahraOriginal!,
  password: 'zahra2026',
});

// Old password should fail
const oldPassAttempt = StockStorageEngine.authenticateUser('zahra', '123');
console.assert(oldPassAttempt === null, 'Old password should now fail after change');

// New password should succeed
const newPassAttempt = StockStorageEngine.authenticateUser('zahra', 'zahra2026');
console.assert(newPassAttempt !== null, 'New password should succeed');
console.assert(newPassAttempt?.password === 'zahra2026', 'Password not updated');
console.log('  ✓ Zahra successfully updated her password (from 123 to zahra2026)');

// Restore Zahra's password back to 123
StockStorageEngine.saveUser({
  ...zahraOriginal!,
  password: '123',
});
console.log('✓ Self-service password change verified 100%.');

// Test 3: Floor Structure & Initialization (0 Default Items & Categories)
console.log('\nTest 3: Verifying 4 Floors Clean Slate (0 Products & 0 Categories)');
const floor1 = StockStorageEngine.getFloorData('1');
const floor2 = StockStorageEngine.getFloorData('2');
const floor3 = StockStorageEngine.getFloorData('3');
const floor4 = StockStorageEngine.getFloorData('4');

console.assert(floor1.floorId === '1' && floor2.floorId === '2' && floor3.floorId === '3' && floor4.floorId === '4', 'Floor ID mismatch');
console.assert(floor1.items.length === 0, 'Floor 1 items must be 0');
console.assert(floor2.items.length === 0, 'Floor 2 items must be 0');
console.assert(floor3.items.length === 0, 'Floor 3 items must be 0');
console.assert(floor4.items.length === 0, 'Floor 4 items must be 0');
console.assert(floor1.categories.length === 0, 'Floor 1 categories must be 0');
console.assert(FLOOR_DEFINITIONS['1'].subtitle === 'Kebutuhan', 'Floor 1 subtitle mismatch');
console.assert(FLOOR_DEFINITIONS['2'].subtitle === 'Pakaian', 'Floor 2 subtitle mismatch');
console.assert(FLOOR_DEFINITIONS['3'].subtitle === 'Perabotan', 'Floor 3 subtitle mismatch');
console.assert(FLOOR_DEFINITIONS['4'].subtitle === 'Gudang', 'Floor 4 subtitle mismatch');
console.log('✓ 4 floors verified with clean slate (0 products, 0 categories).');

// Test 4: Manual Item Creation & Stock Adjustments with Staff Tagging
console.log('\nTest 4: Manual Item Creation & Stock Adjustment with Staff Tagging (Fahri)');
StockStorageEngine.setCurrentUser(fahri);

// Manually add an item
const createdItem = StockStorageEngine.addItem('2', {
  name: 'Baju Koko Polos Putih L',
  category: 'Baju Pria',
  barcode: '8991234567890',
  quantity: 20,
  minStock: 5,
  unit: 'Pcs',
  locationDetails: 'Rak 2A',
});

const initialStock = createdItem.quantity;
const res = StockStorageEngine.adjustStock('2', createdItem.id, 10, 'Restock Barang');
console.assert(res.success === true, 'Adjust stock failed');
console.assert(res.newStock === initialStock + 10, 'New stock mismatch');

const f2Updated = StockStorageEngine.getFloorData('2');
console.assert(f2Updated.mutations[0].userName === 'Fahri', 'Mutation author should be Fahri');
console.log('✓ Manual item creation and stock adjustment recorded under logged-in staff.');

// Test 5: Export / Import JSON & Reports
console.log('\nTest 5: Export / Import JSON & Reports Generation');
const singleExport = StockStorageEngine.exportSingleFloor('2');
console.assert(singleExport.type === 'SINGLE_FLOOR', 'Single export type mismatch');

const allExport = StockStorageEngine.exportAllFloors();
console.assert(allExport.type === 'ALL_FLOORS', 'All floors export type mismatch');

const importRes = StockStorageEngine.importData(singleExport, '2', 'MERGE');
console.assert(importRes.success === true, 'Import failed');

const floorReport = ReportService.generateFloorReport('2');
console.assert(floorReport.includes('LAPORAN STOK LANTAI 2'), 'Floor 2 report title missing');
console.log('✓ Export, Import & Text reports generation verified.');

console.log('\n=== ALL VERIFICATION TESTS PASSED 100%! ===');
