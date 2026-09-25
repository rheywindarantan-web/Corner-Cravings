// Mock browser storage for Node.js test execution
if (typeof global.localStorage === 'undefined') {
  const storage = {};
  global.localStorage = {
    getItem: key => Object.prototype.hasOwnProperty.call(storage, key) ? storage[key] : null,
    setItem: (key, val) => { storage[key] = String(val); },
    removeItem: key => { delete storage[key]; },
    clear: () => { Object.keys(storage).forEach(k => delete storage[k]); }
  };
}

const assert = require('assert');
const Inventory = require('../inventory-data.js');

console.log('--- Starting True Inventory Management System Automated Verification ---');

// Clean start
Inventory.resetToDefaultInventory();

// Test 1: Master Catalog & Canonical Enrichment
console.log('\n[Test 1] Testing Master Catalog Enrichment & Baseline Parameters...');
const items = Inventory.getInventoryItems();
assert.strictEqual(items.length, 95, 'Must contain 95 canonical restaurant ingredients');

const initializedStore = Inventory.readInventory();
const itemIdsWithHistory = new Set(initializedStore.transactions.map(tx => Number(tx.itemId)));
assert.strictEqual(items.every(item => itemIdsWithHistory.has(Number(item.id))), true, 'Every current inventory item must have an opening balance or movement history');
assert.strictEqual(initializedStore.transactions.filter(tx => tx.openingBalance).length, 95, 'Every ingredient must begin with one non-destructive opening-balance record');
assert.strictEqual(initializedStore.transactions.filter(tx => tx.type === 'IN').length, 0, 'A clean inventory must not include demonstration delivery receipts');

const eggItem = items.find(it => it.sku === 'ING-EGG');
assert.ok(eggItem, 'Egg item must exist');
assert.strictEqual(eggItem.unitCost, 8.50, 'Egg unit cost must be ₱8.50');
assert.strictEqual(eggItem.supplier, 'Bounty Fresh Farms', 'Egg supplier must be Bounty Fresh Farms');
assert.strictEqual(eggItem.inventoryStatus, 'OK', 'Healthy stock must have status OK');
assert.strictEqual(eggItem.stockValuation, 180 * 8.50, 'Stock valuation must be 180 * 8.50 = 1530.00');

const tapaItem = items.find(it => it.sku === 'ING-BEEF-TAPA');
assert.ok(tapaItem, 'Beef Tapa must exist');
assert.strictEqual(tapaItem.unitCost, 380.00, 'Tapa unit cost must be ₱380.00');
assert.strictEqual(tapaItem.supplier, 'San Miguel PureFoods', 'Tapa supplier must be San Miguel PureFoods');

console.log('  ✓ 95 canonical ingredients enriched with unit costs, verified suppliers, and valuations');

// Test 2: Executive Metrics Calculation
console.log('\n[Test 2] Testing Executive Inventory Metrics & KPI Calculation...');
const metrics = Inventory.getInventoryMetrics();
assert.strictEqual(metrics.totalItems, 95, 'Total items count must be 95');
assert.ok(metrics.totalValuation > 100000, 'Total valuation must be computed and greater than ₱100,000');
assert.ok(metrics.totalValuationFormatted.startsWith('₱'), 'Valuation must be formatted with ₱ symbol');
assert.strictEqual(metrics.recentReceiptsCount, 0, 'Receipt metrics must begin empty until the admin records a delivery');
console.log('  ✓ Metrics computed: Valuation = ' + metrics.totalValuationFormatted + ', Items = ' + metrics.totalItems + ', Receipts = ' + metrics.recentReceiptsCount);

// Test 3: Direct Item Edit & Automatic Adjustment Audit Trail
console.log('\n[Test 3] Testing Direct Item Edit & Automatic Physical Stock Adjustment Audit...');
const initialTapaStock = tapaItem.stock;
const editResult = Inventory.updateInventoryItem('ING-BEEF-TAPA', {
  stock: initialTapaStock + 5,
  unitCost: 395.00,
  supplier: 'San Miguel Premier Foods',
  adjustmentReason: 'Physical monthly count surplus reconciliation'
}, 'Admin Lead');

assert.strictEqual(editResult.success, true, 'Update must succeed');
assert.strictEqual(editResult.stockChanged, true, 'Stock changed flag must be true');
assert.ok(editResult.transaction, 'An audit transaction must be created');
assert.strictEqual(editResult.transaction.type, 'ADJUSTMENT', 'Transaction must be type ADJUSTMENT');
assert.strictEqual(editResult.transaction.direction, 'INCREASE', 'Direction must be INCREASE');
assert.strictEqual(editResult.transaction.quantity, 5, 'Adjusted quantity must be 5');

const updatedTapa = Inventory.getItemBySku('ING-BEEF-TAPA');
assert.strictEqual(updatedTapa.stock, initialTapaStock + 5, 'Tapa stock must be updated');
assert.strictEqual(updatedTapa.unitCost, 395.00, 'Tapa unit cost must be ₱395.00');
assert.strictEqual(updatedTapa.supplier, 'San Miguel Premier Foods', 'Supplier must be updated');

console.log('  ✓ Item editing updates physical stock, cost, and automatically writes auditable ADJUSTMENT record');

// Test 4: Quick Stock-In Inbound Delivery Logging
console.log('\n[Test 4] Testing Inbound Delivery Receipt (Stock-In)...');
const eggBefore = Inventory.getItemBySku('ING-EGG').stock;
const stockInResult = Inventory.recordStockIn({
  sku: 'ING-EGG',
  quantity: 50,
  unitCost: 8.75,
  supplier: 'Bounty Fresh Farms',
  batch: 'DR-TEST-2026-99'
});

assert.strictEqual(stockInResult.success, true, 'Stock-in must succeed');
assert.strictEqual(stockInResult.balanceAfter, eggBefore + 50, 'Egg stock must increase by 50');
assert.strictEqual(stockInResult.transaction.type, 'IN', 'Transaction must be type IN');
assert.strictEqual(stockInResult.transaction.batch, 'DR-TEST-2026-99', 'Batch number must be recorded');

const eggAfter = Inventory.getItemBySku('ING-EGG');
assert.strictEqual(eggAfter.stock, eggBefore + 50, 'Stored egg stock must equal balance after');
assert.strictEqual(eggAfter.unitCost, 8.75, 'Unit cost should update to latest delivery cost');

console.log('  ✓ Inbound delivery accurately increases stock, updates unit cost, and records IN receipt');

// Test 5: Add New Inventory Item
console.log('\n[Test 5] Testing Creation of New Inventory Ingredient...');
const addResult = Inventory.addInventoryItem({
  name: 'Organic Honey Syrup',
  category: 'Beverage Syrups',
  unit: 'L',
  stock: 12,
  reorderLevel: 3,
  unitCost: 290.00,
  supplier: 'Bee Wild Honey Farms'
});

assert.strictEqual(addResult.success, true, 'New item creation must succeed');
assert.ok(addResult.item.sku.startsWith('ING-'), 'SKU must start with ING-');
assert.strictEqual(addResult.item.stock, 12, 'Initial stock must be set');
assert.strictEqual(addResult.transaction.type, 'IN', 'Initial stock must generate an IN transaction');

const allItemsAfterAdd = Inventory.getInventoryItems();
assert.strictEqual(allItemsAfterAdd.length, 96, 'Total items must now be 96');

console.log('  ✓ New ingredient created with generated SKU, initial stock, and delivery receipt');

console.log('\n--- ALL TRUE INVENTORY SYSTEM TESTS PASSED SUCCESSFULLY! ---');
