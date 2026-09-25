/**
 * Corner Cravings - Phase 4 Automated Test Suite
 * Verifies Inventory Integration & Stock Control:
 * 1. Recipe calculation across menu categories and add-ons
 * 2. Automated ingredient deduction on kitchen preparation start
 * 3. Low-stock detection and critical alerts
 * 4. Depleted ingredient (stock = 0) out-of-stock catalog synchronization
 * 5. Cancellation, wastage logging, and restocking
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('--- Starting Phase 4 Automated Verification ---');

// Mock browser storage
class MockStorage {
  constructor() {
    this.store = {};
  }
  getItem(key) {
    return Object.prototype.hasOwnProperty.call(this.store, key) ? this.store[key] : null;
  }
  setItem(key, value) {
    this.store[key] = String(value);
  }
  removeItem(key) {
    delete this.store[key];
  }
  clear() {
    this.store = {};
  }
}

class MockCustomEvent {
  constructor(type, params) {
    this.type = type;
    this.detail = params ? params.detail : null;
  }
}

const mockStorage = new MockStorage();

// Load inventory-data.js in sandbox
const inventoryDataCode = fs.readFileSync(path.join(__dirname, '..', 'inventory-data.js'), 'utf8');

const inventorySandbox = {
  window: {},
  self: {},
  localStorage: mockStorage,
  CustomEvent: MockCustomEvent,
  Date: Date,
  Math: Math,
  Number: Number,
  String: String,
  Array: Array,
  Object: Object,
  JSON: JSON
};
vm.createContext(inventorySandbox);
vm.runInContext(inventoryDataCode, inventorySandbox);

const Inventory = inventorySandbox.window.CornerCravingsInventory || inventorySandbox.self.CornerCravingsInventory;
assert.ok(Inventory, 'CornerCravingsInventory must be exported');

// ---------------------------------------------------------------------------
// Test 1: Recipe Engine & Ingredient Requirements Calculation
// ---------------------------------------------------------------------------
console.log('\n[Test 1] Testing Recipe Engine & Requirements Calculation...');

// 1. Tapsilog with Extra Egg and Extra Rice
const testOrder1 = {
  id: '9901',
  orderNumber: 'ORD-9901',
  items: [
    {
      productId: 'rice-meals-tapsilog',
      name: 'Tapsilog',
      quantity: 2,
      selectedAddOns: [
        { id: 'rice-meals-extra-egg', name: 'Extra Egg' },
        { id: 'rice-meals-extra-rice', name: 'Extra Plain or Fried Rice' }
      ]
    }
  ]
};

const reqs1 = Inventory.calculateOrderIngredients(testOrder1);
assert.ok(Array.isArray(reqs1), 'Requirements must be an array');

const eggReq = reqs1.find(r => r.sku === 'ING-EGG');
assert.ok(eggReq, 'Order must require Eggs');
// 2 Tapsilog * (1 base egg + 1 extra egg) = 4 eggs
assert.strictEqual(eggReq.quantity, 4, '2 Tapsilogs with extra egg must require 4 eggs');

const tapaReq = reqs1.find(r => r.sku === 'ING-BEEF-TAPA');
assert.ok(tapaReq, 'Order must require Beef Tapa');
// 2 Tapsilog * 0.15 kg = 0.3 kg
assert.strictEqual(tapaReq.quantity, 0.3, '2 Tapsilogs must require 0.3kg of Beef Tapa');

const riceReq = reqs1.find(r => r.sku === 'ING-GAR-RICE');
assert.ok(riceReq, 'Order must require Garlic Rice');
// 2 Tapsilog * (0.2 base + 0.2 extra) = 0.8 kg
assert.strictEqual(riceReq.quantity, 0.8, '2 Tapsilogs with extra rice must require 0.8kg of Garlic Rice');

console.log('  ✓ Rice meals and add-on ingredient consumption calculated accurately');

// 2. Pasta Combo with Avocado Graham Shake
const testOrder2 = {
  id: '9902',
  orderNumber: 'ORD-9902',
  items: [
    {
      productId: 'pasta-combo-palabok-combo',
      name: 'Palabok Combo',
      quantity: 1,
      selectedOption: { id: 'graham-shake-avocado-graham', name: 'Avocado Graham Shake' }
    }
  ]
};

const reqs2 = Inventory.calculateOrderIngredients(testOrder2);
const avocadoReq = reqs2.find(r => r.sku === 'ING-AVOCADO-PUREE');
assert.ok(avocadoReq, 'Avocado shake selection must require avocado puree');
assert.strictEqual(avocadoReq.quantity, 0.1, 'Must require 0.1L avocado puree');

const mangoReq = reqs2.find(r => r.sku === 'ING-MANGO-PUREE');
assert.strictEqual(mangoReq, undefined, 'Avocado selection must not require mango puree');

const cupReq = reqs2.find(r => r.sku === 'ING-CUP-16OZ');
assert.ok(cupReq && cupReq.quantity === 1, 'Pasta combo must require a 16oz cup');

console.log('  ✓ Combo options and shake beverage components mapped accurately');

// 3. Iced Cold Coffee
const testOrder3 = {
  id: '9903',
  orderNumber: 'ORD-9903',
  items: [
    {
      productId: 'iced-coffee-caramel-macchiato',
      name: 'Caramel Macchiato',
      quantity: 3
    }
  ]
};

const reqs3 = Inventory.calculateOrderIngredients(testOrder3);
const caramelReq = reqs3.find(r => r.sku === 'ING-SYRUP-CARAMEL');
assert.ok(caramelReq, 'Caramel Macchiato must require caramel syrup');
assert.strictEqual(caramelReq.quantity, 0.09, '3 Caramel Macchiatos require 0.09L caramel syrup');

const coffeeBeansReq = reqs3.find(r => r.sku === 'ING-COFFEE-BEANS');
assert.ok(coffeeBeansReq, 'Coffee requires coffee beans');
assert.strictEqual(coffeeBeansReq.quantity, 0.09, '3 coffees require 0.09kg espresso beans');

console.log('  ✓ Iced Cold Coffee drinks mapped accurately');

// ---------------------------------------------------------------------------
// Test 2: Kitchen Order Prep Automated Stock Deduction
// ---------------------------------------------------------------------------
console.log('\n[Test 2] Testing Automated Ingredient Deduction on Kitchen Prep...');

// Reset to clean stock
Inventory.resetToDefaultInventory();
const initialEggs = Inventory.getItemBySku('ING-EGG').stock;
const initialTapa = Inventory.getItemBySku('ING-BEEF-TAPA').stock;
const initialRice = Inventory.getItemBySku('ING-GAR-RICE').stock;

const prepOrder = {
  id: '7701',
  orderNumber: 'ORD-7701',
  status: 'Pending',
  items: [
    {
      productId: 'rice-meals-tapsilog',
      name: 'Tapsilog',
      quantity: 5 // 5 * 1 egg = 5 eggs, 5 * 0.15 = 0.75kg tapa, 5 * 0.2 = 1kg rice
    }
  ]
};

const deductResult = Inventory.deductOrderIngredients(prepOrder);
assert.strictEqual(deductResult.success, true, 'Deduction must succeed');
assert.strictEqual(prepOrder.inventoryDeducted, true, 'Order must be flagged as inventoryDeducted');

const currentEggs = Inventory.getItemBySku('ING-EGG').stock;
const currentTapa = Inventory.getItemBySku('ING-BEEF-TAPA').stock;
const currentRice = Inventory.getItemBySku('ING-GAR-RICE').stock;

assert.strictEqual(currentEggs, initialEggs - 5, 'Egg stock must decrease by exactly 5');
assert.strictEqual(currentTapa, initialTapa - 0.75, 'Tapa stock must decrease by exactly 0.75kg');
assert.strictEqual(currentRice, initialRice - 1, 'Rice stock must decrease by exactly 1kg');

// Verify OUT transaction recorded
const invStore = Inventory.readInventory();
const prepTx = invStore.transactions.find(t => t.reason === 'Order Prep ORD-7701' && t.sku === 'ING-EGG');
assert.ok(prepTx, 'Transaction record must exist for order prep');
assert.strictEqual(prepTx.type, 'OUT', 'Transaction must be type OUT');
assert.strictEqual(prepTx.quantity, 5, 'Transaction quantity must be 5');

// Idempotency: second deduction call must not deduct twice
const secondDeduct = Inventory.deductOrderIngredients(prepOrder);
assert.strictEqual(secondDeduct.success, false, 'Second deduction must be prevented');
assert.strictEqual(Inventory.getItemBySku('ING-EGG').stock, currentEggs, 'Stock must not decrease again');

console.log('  ✓ Automated stock deduction correctly reduces inventory and logs OUT transactions');
console.log('  ✓ Deductions are strictly idempotent and protected against duplicates');

// ---------------------------------------------------------------------------
// Test 3: Depleted Ingredient Out-of-Stock Catalog Sync
// ---------------------------------------------------------------------------
console.log('\n[Test 3] Testing Out-of-Stock Catalog Synchronization...');

// Deplete fresh eggs completely (stock = 0)
const invBeforeDeplete = Inventory.readInventory();
const eggItem = invBeforeDeplete.items.find(it => it.sku === 'ING-EGG');
const originalEggStock = eggItem.stock;
eggItem.stock = 0;
Inventory.writeInventory(invBeforeDeplete);

// Check if Tapsilog is recognized as out of stock
assert.strictEqual(Inventory.isProductInStock('rice-meals-tapsilog'), false, 'Tapsilog must be out of stock when eggs are 0');
const missingTapsilog = Inventory.getMissingIngredientsForProduct('rice-meals-tapsilog');
assert.ok(missingTapsilog.some(m => m.sku === 'ING-EGG'), 'Missing list must identify Fresh Chicken Eggs');

// But Pancit Canton (which doesn't require eggs) should still be in stock
assert.strictEqual(Inventory.isProductInStock('special-pasta-pancit-canton'), true, 'Pancit Canton should still be in stock');

// Load customer.js to verify validateCart
const menuCode = fs.readFileSync(path.join(__dirname, '..', 'menu-data.js'), 'utf8');
const customerCode = fs.readFileSync(path.join(__dirname, '..', 'customer.js'), 'utf8');

const customerSandbox = {
  window: {
    CornerCravingsInventory: Inventory
  },
  self: {},
  location: { pathname: '/customer-cart.html' },
  localStorage: mockStorage,
  CustomEvent: MockCustomEvent,
  Date: Date,
  Math: Math,
  Number: Number,
  String: String,
  Array: Array,
  Object: Object,
  JSON: JSON
};
vm.createContext(customerSandbox);
vm.runInContext(menuCode, customerSandbox);
vm.runInContext(customerCode, customerSandbox);

// Place Tapsilog in customer cart
mockStorage.setItem('cornerCravingsCustomerCart', JSON.stringify([
  {
    productId: 'rice-meals-tapsilog',
    id: 'rice-meals-tapsilog',
    name: 'Tapsilog',
    price: 125,
    quantity: 1
  }
]));

const cartValidation = customerSandbox.window.CornerCravings.validateCart();
assert.strictEqual(cartValidation.valid, false, 'Cart containing egg-depleted meal must be invalid');
assert.ok(cartValidation.issues.some(issue => issue.includes('out of stock')), 'Cart issue must specify out of stock ingredient');

// Restore egg stock
invBeforeDeplete.items.find(it => it.sku === 'ING-EGG').stock = originalEggStock;
Inventory.writeInventory(invBeforeDeplete);

assert.strictEqual(Inventory.isProductInStock('rice-meals-tapsilog'), true, 'Tapsilog must be back in stock when eggs restored');
const restoredCartValidation = customerSandbox.window.CornerCravings.validateCart();
assert.strictEqual(restoredCartValidation.valid, true, 'Cart must be valid once ingredients are replenished');

console.log('  ✓ Depleted ingredient (stock = 0) accurately flags dependent products out of stock');
console.log('  ✓ Customer cart validation protects checkout from ordering out-of-stock items');

// ---------------------------------------------------------------------------
// Test 4: Low-Stock Alerts Detection
// ---------------------------------------------------------------------------
console.log('\n[Test 4] Testing Low-Stock Detection & Alerts...');

// Reduce Beef Tapa to 3kg (reorder level is 4kg)
const invForAlerts = Inventory.readInventory();
const tapaItem = invForAlerts.items.find(it => it.sku === 'ING-BEEF-TAPA');
tapaItem.stock = 3;
Inventory.writeInventory(invForAlerts);

const lowStockItems = Inventory.getLowStockItems();
assert.ok(lowStockItems.some(it => it.sku === 'ING-BEEF-TAPA'), 'Tapa must be flagged as low stock');
const tapaAlert = lowStockItems.find(it => it.sku === 'ING-BEEF-TAPA');
assert.strictEqual(tapaAlert.inventoryStatus, 'LOW', 'Status should be LOW');

console.log('  ✓ Low-stock items accurately identified when stock <= reorderLevel');

// ---------------------------------------------------------------------------
// Test 5: Order Cancellation & Ingredient Restocking
// ---------------------------------------------------------------------------
console.log('\n[Test 5] Testing Order Cancellation & Restocking...');

// Take prepOrder (which had 5 eggs, 0.75kg tapa, 1kg rice deducted earlier)
const preRestoreEggs = Inventory.getItemBySku('ING-EGG').stock;
const restoreResult = Inventory.restoreOrderIngredients(prepOrder, 'Customer cancelled before cooking');

assert.strictEqual(restoreResult.success, true, 'Restocking must succeed');
assert.strictEqual(prepOrder.inventoryDeducted, false, 'Order must clear inventoryDeducted flag');

const postRestoreEggs = Inventory.getItemBySku('ING-EGG').stock;
assert.strictEqual(postRestoreEggs, preRestoreEggs + 5, 'Eggs must be fully restored');

// Verify IN restock transaction logged
const restockedStore = Inventory.readInventory();
const restockTx = restockedStore.transactions.find(t => t.type === 'IN' && t.reason.includes('Restock Cancelled ORD-7701'));
assert.ok(restockTx, 'Restock IN transaction must be recorded in inventory ledger');

console.log('  ✓ Restocking correctly returns ingredients to stock and logs audit transaction');

console.log('\n--- ALL PHASE 4 AUTOMATED TESTS PASSED SUCCESSFULLY! ---');
