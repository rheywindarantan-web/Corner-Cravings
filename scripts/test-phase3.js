const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

console.log('--- Starting Phase 3 Automated Verification ---');

// Setup shared Mock LocalStorage
class MockLocalStorage {
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

const mockStorage = new MockLocalStorage();

// Mock CustomEvent and window
class MockCustomEvent {
  constructor(type, params) {
    this.type = type;
    this.detail = params ? params.detail : null;
  }
}

// -------------------------------------------------------------
// Test 1: Admin Dashboard Sales Analytics & Date Filtering
// -------------------------------------------------------------
console.log('\n[Test 1] Testing Admin Dashboard Sales Analytics & Date Filtering...');
const dashboardCode = fs.readFileSync(path.join(__dirname, '..', 'dashboard.js'), 'utf8');

const sampleOrders = [
  {
    id: 'ORD-101',
    placedAt: new Date().toISOString(), // Today
    status: 'Completed',
    fulfillmentType: 'delivery',
    paymentMethod: 'GCash',
    paymentStatus: 'paid',
    items: [
      { name: 'Tapsilog', price: 178, quantity: 2, category: 'Silog Combo Meal' }
    ],
    totals: { total: 356 },
    isDemo: false
  },
  {
    id: 'ORD-102',
    placedAt: new Date().toISOString(), // Today
    status: 'Preparing',
    fulfillmentType: 'pickup',
    paymentMethod: 'Cash on Pickup',
    paymentStatus: 'unpaid',
    items: [
      { name: 'Latte', price: 79, quantity: 1, category: 'Iced Cold Coffee' }
    ],
    totals: { total: 79 },
    isDemo: false
  },
  {
    id: 'ORD-103',
    placedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    status: 'Completed',
    fulfillmentType: 'delivery',
    paymentMethod: 'Cash on Delivery',
    paymentStatus: 'paid',
    items: [
      { name: 'Palabok Combo', price: 169, quantity: 1, category: 'Pasta Combo Meal' }
    ],
    totals: { total: 169 },
    isDemo: true
  },
  {
    id: 'ORD-104',
    placedAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(), // 40 days ago
    status: 'Cancelled',
    fulfillmentType: 'delivery',
    paymentMethod: 'Cash on Delivery',
    paymentStatus: 'cancelled',
    items: [
      { name: 'Siomaisilog Combo', price: 118, quantity: 1, category: 'Silog Combo Meal' }
    ],
    totals: { total: 118 },
    isDemo: false
  }
];

const dashboardSandbox = {
  window: {},
  localStorage: mockStorage,
  CustomEvent: MockCustomEvent,
  Date: Date,
  Math: Math,
  Number: Number,
  String: String,
  Array: Array,
  Object: Object,
  JSON: JSON,
  module: { exports: {} }
};
vm.createContext(dashboardSandbox);
vm.runInContext(dashboardCode, dashboardSandbox);
const Dashboard = dashboardSandbox.module.exports || dashboardSandbox.window.CornerCravingsDashboard;

assert(typeof Dashboard.calculateDashboardMetrics === 'function', 'calculateDashboardMetrics should be exported');

// Test all-time including demo
const allMetrics = Dashboard.calculateDashboardMetrics(sampleOrders, 'all', true);
assert.strictEqual(allMetrics.totalOrders, 4, 'Total orders should be 4');
assert.strictEqual(allMetrics.completedCount, 2, 'Completed orders should be 2');
assert.strictEqual(allMetrics.activeCount, 1, 'Active queue should be 1 (Preparing)');
assert.strictEqual(allMetrics.cancelledCount, 1, 'Cancelled should be 1');
assert.strictEqual(allMetrics.grossRevenue, 356 + 169, 'Gross revenue should sum completed orders');
assert.strictEqual(allMetrics.aov, (356 + 169) / 2, 'AOV should be 262.50');
console.log('  ✓ All-time dashboard metrics calculated accurately');

// Test Today filter (should only include ORD-101 and ORD-102)
const todayMetrics = Dashboard.calculateDashboardMetrics(sampleOrders, 'today', true);
assert.strictEqual(todayMetrics.totalOrders, 2, 'Today should have 2 orders');
assert.strictEqual(todayMetrics.completedCount, 1, 'Today completed should be 1');
assert.strictEqual(todayMetrics.grossRevenue, 356, 'Today gross revenue should be 356');
console.log('  ✓ Date-range filtering (Today) isolates today\'s transactions cleanly');

// Test excluding demo orders
const realMetrics = Dashboard.calculateDashboardMetrics(sampleOrders, 'all', false);
assert.strictEqual(realMetrics.totalOrders, 3, 'Excluding demo should leave 3 orders');
assert.strictEqual(realMetrics.grossRevenue, 356, 'Excluding demo should leave 356 revenue');
console.log('  ✓ Scope toggle correctly filters out demo sample records');

// -------------------------------------------------------------
// Test 2: Category Sales Aggregation & Operations Split
// -------------------------------------------------------------
console.log('\n[Test 2] Testing Category Sales Aggregation & Operational Splits...');
assert(allMetrics.categoryTotals['Silog Combo Meal'], 'Silog Combo Meal should have category entry');
assert.strictEqual(allMetrics.categoryTotals['Silog Combo Meal'].revenue, 356, 'Silog revenue should be 356 (ORD-104 cancelled not counted)');
assert.strictEqual(allMetrics.categoryTotals['Silog Combo Meal'].count, 2, 'Silog item count should be 2');
assert.strictEqual(allMetrics.fulfillment.delivery, 3, 'Delivery count should be 3');
assert.strictEqual(allMetrics.fulfillment.pickup, 1, 'Pickup count should be 1');
assert.strictEqual(allMetrics.payments.gcash, 1, 'GCash count should be 1');
assert.strictEqual(allMetrics.payments.cod, 3, 'COD/COP count should be 3');
console.log('  ✓ Category sales and fulfillment/payment splits accurately aggregated');

// -------------------------------------------------------------
// Test 3: Payment Tracking & Refund Handling
// -------------------------------------------------------------
console.log('\n[Test 3] Testing Payment Tracking & Refund Handling...');
const orderMgmtCode = fs.readFileSync(path.join(__dirname, '..', 'order-management.js'), 'utf8');
mockStorage.setItem('cornerCravingsAdminOrders', JSON.stringify([
  {
    id: '9901',
    status: 'Pending',
    paymentMethod: 'Cash on Delivery',
    paymentStatus: 'unpaid',
    totals: { total: 250 },
    statusHistory: []
  },
  {
    id: '9902',
    status: 'Completed',
    paymentMethod: 'GCash',
    paymentStatus: 'paid',
    totals: { total: 400 },
    statusHistory: []
  }
]));

const orderMgmtSandbox = {
  window: {},
  location: { pathname: '/orders.html', search: '' },
  localStorage: mockStorage,
  CustomEvent: MockCustomEvent,
  Date: Date,
  Math: Math,
  Number: Number,
  String: String,
  Array: Array,
  Object: Object,
  JSON: JSON,
  module: { exports: {} }
};
vm.createContext(orderMgmtSandbox);
vm.runInContext(orderMgmtCode, orderMgmtSandbox);
const OrderMgmt = orderMgmtSandbox.module.exports || orderMgmtSandbox.window.CornerCravingsOrders;

assert(typeof OrderMgmt.markPaymentPaid === 'function', 'markPaymentPaid should be exported');
assert(typeof OrderMgmt.processRefund === 'function', 'processRefund should be exported');

// Test mark payment paid
const markRes = OrderMgmt.markPaymentPaid('9901', 'Cash verified on pickup');
assert(markRes.success, 'markPaymentPaid should succeed');
assert.strictEqual(markRes.order.paymentStatus, 'paid', 'Payment status should be paid');
const lastAudit = markRes.order.statusHistory[markRes.order.statusHistory.length - 1];
assert.strictEqual(lastAudit.actor, 'admin', 'Audit entry actor must be admin');
assert.strictEqual(lastAudit.note, 'Cash verified on pickup', 'Audit note must record note');
console.log('  ✓ markPaymentPaid updates status to paid with admin audit record');

// Test refund on unpaid order (should fail)
const unpaidRefundRes = OrderMgmt.processRefund('9901', 'Test');
// Note: 9901 is now paid, so let's set an unpaid order to test guard
mockStorage.setItem('cornerCravingsAdminOrders', JSON.stringify([
  { id: '9903', status: 'Cancelled', paymentStatus: 'unpaid', totals: { total: 100 }, statusHistory: [] }
]));
const failRefund = OrderMgmt.processRefund('9903', 'Invalid refund');
assert.strictEqual(failRefund.success, false, 'Unpaid order cannot be refunded');
console.log('  ✓ processRefund rejects refunding unpaid orders');

// Test refund on paid order
mockStorage.setItem('cornerCravingsAdminOrders', JSON.stringify([
  { id: '9904', status: 'Cancelled', paymentStatus: 'paid', totals: { total: 300 }, statusHistory: [] }
]));
const refundRes = OrderMgmt.processRefund('9904', 'Out of stock refund');
assert(refundRes.success, 'Paid order should be refunded');
assert.strictEqual(refundRes.order.paymentStatus, 'refunded', 'Payment status must be refunded');
const refundAudit = refundRes.order.statusHistory[refundRes.order.statusHistory.length - 1];
assert.strictEqual(refundAudit.actor, 'admin');
assert(refundAudit.note.indexOf('Out of stock refund') !== -1);
console.log('  ✓ processRefund updates status to refunded with audit history');

// -------------------------------------------------------------
// Test 4: Store Operating Hours Override & Customer Sync
// -------------------------------------------------------------
console.log('\n[Test 4] Testing Store Operating Hours Override & Customer Sync...');
// 1. Set manual closed override via Dashboard
Dashboard.setStoreOverride('closed');
assert.strictEqual(mockStorage.getItem('cornerCravingsStoreStatus'), 'closed', 'Override should be stored');

// 2. Load customer.js and check getStoreStatus
const customerCode = fs.readFileSync(path.join(__dirname, '..', 'customer.js'), 'utf8');
const customerSandbox = {
  window: {},
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
vm.runInContext(customerCode, customerSandbox);

const customerStatus = customerSandbox.window.CornerCravings.getStoreStatus();
assert.strictEqual(customerStatus.isOpen, false, 'Customer getStoreStatus must observe closed override');
console.log('  ✓ Manual closed override immediately sets customer store status to closed');

// 3. Reset to auto
Dashboard.setStoreOverride('auto');
assert.strictEqual(mockStorage.getItem('cornerCravingsStoreStatus'), null, 'Override should be cleared');
const midDayDate = new Date('2026-09-22T13:00:00+08:00');
const autoStatus = customerSandbox.window.CornerCravings.getStoreStatus(midDayDate);
assert.strictEqual(autoStatus.isOpen, true, 'Auto schedule at 1PM must be open');
console.log('  ✓ Resetting to auto re-enables standard operating schedule');

// -------------------------------------------------------------
// Test 5: Product Catalog Operations
// -------------------------------------------------------------
console.log('\n[Test 5] Testing Product Catalog Management Operations...');
const productsCode = fs.readFileSync(path.join(__dirname, '..', 'products.js'), 'utf8');
const productsSandbox = {
  window: {},
  location: { pathname: '/products.html', search: '' },
  localStorage: mockStorage,
  CustomEvent: MockCustomEvent,
  Date: Date,
  Math: Math,
  Number: Number,
  String: String,
  Array: Array,
  Object: Object,
  JSON: JSON,
  module: { exports: {} }
};
vm.createContext(productsSandbox);
vm.runInContext(productsCode, productsSandbox);
const Products = productsSandbox.module.exports || productsSandbox.window.CornerCravingsProducts;

assert(typeof Products.saveProductEdit === 'function', 'saveProductEdit should be exported');
assert(typeof Products.saveAvailability === 'function', 'saveAvailability should be exported');
assert(typeof Products.deleteProduct === 'function', 'deleteProduct should be exported');

Products.saveProductEdit({ id: 'rice-meals-tapsilog', name: 'Premium Angus Tapsilog', price: 199, description: 'Upgraded tapa' });
const edits = JSON.parse(mockStorage.getItem('cornerCravingsProductEdits') || '{}');
assert.strictEqual(edits['rice-meals-tapsilog'].name, 'Premium Angus Tapsilog');
assert.strictEqual(edits['rice-meals-tapsilog'].price, 199);

Products.saveAvailability('rice-meals-tapsilog', false);
const avail = JSON.parse(mockStorage.getItem('cornerCravingsProductAvailability') || '{}');
assert.strictEqual(avail['rice-meals-tapsilog'], false);

Products.deleteProduct('test-item-99');
const deleted = JSON.parse(mockStorage.getItem('cornerCravingsDeletedProducts') || '[]');
assert(deleted.indexOf('test-item-99') !== -1, 'Deleted item must be recorded in cornerCravingsDeletedProducts');
console.log('  ✓ Product edits, availability toggles, and deletions persist accurately');

// -------------------------------------------------------------
// Test 6: Business Operations Config & Staff Accounts
// -------------------------------------------------------------
console.log('\n[Test 6] Testing Business Operations Config & Staff Accounts...');
const profileCode = fs.readFileSync(path.join(__dirname, '..', 'profile.js'), 'utf8');
const profileSandbox = {
  window: {},
  location: { pathname: '/profile.html', search: '' },
  localStorage: mockStorage,
  CustomEvent: MockCustomEvent,
  Date: Date,
  Math: Math,
  Number: Number,
  String: String,
  Array: Array,
  Object: Object,
  JSON: JSON,
  module: { exports: {} }
};
vm.createContext(profileSandbox);
vm.runInContext(profileCode, profileSandbox);
const Profile = profileSandbox.module.exports || profileSandbox.window.CornerCravingsProfile;

assert(typeof Profile.saveStoreConfig === 'function', 'saveStoreConfig should be exported');
assert(typeof Profile.saveStaffList === 'function', 'saveStaffList should be exported');

Profile.saveStoreConfig({
  openTime: '10:00',
  closeTime: '22:00',
  deliveryFee: 55,
  phone: '0918-111-2222',
  address: 'Quezon City Branch'
});
const savedCfg = Profile.getStoreConfig();
assert.strictEqual(savedCfg.deliveryFee, 55, 'Delivery fee must be 55');
assert.strictEqual(savedCfg.openTime, '10:00', 'Opening time must be 10:00');

Profile.saveStaffList([
  { name: 'Chef Gordon', email: 'gordon@cornercravings.com', role: 'Head Chef', token: 'CC-007', active: true }
]);
const savedStaff = Profile.getStaffList();
assert.strictEqual(savedStaff.length, 1);
assert.strictEqual(savedStaff[0].name, 'Chef Gordon');
console.log('  ✓ Store business operations and staff employee accounts saved and managed cleanly');

console.log('\n--- ALL PHASE 3 AUTOMATED TESTS PASSED SUCCESSFULLY! ---');
