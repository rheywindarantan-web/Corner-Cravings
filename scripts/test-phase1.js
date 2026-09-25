/**
 * Phase 1 Automated Verification Script
 * Tests:
 * 1. Clean order queue and legacy demo-data migration (order-management.js)
 * 2. Empty order queues remain empty until a customer submits an order
 * 3. Cart validation (customer.js validateCart)
 * 4. Customer order creation with audit trail & statusHistory (customer.js createDemoOrder)
 * 5. Customer order scoping & status tracking (customer-orders.js)
 * 6. Sales metrics calculation separating demo from actual orders (products.js)
 */

const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

console.log('--- Starting Phase 1 Automated Verification ---');

// Mock localStorage
function createMockStorage() {
  const store = {};
  return {
    getItem: (key) => (key in store ? store[key] : null),
    setItem: (key, val) => { store[key] = String(val); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach(k => delete store[k]); },
    _dump: () => store
  };
}

// 1. Test order-management.js
console.log('[Test 1] Testing clean order queue and legacy demo cleanup...');
const mockStorage1 = createMockStorage();
const sandbox1 = {
  window: {
    addEventListener: () => {},
    dispatchEvent: () => {}
  },
  document: {
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: () => [],
    createElement: (tag) => ({ innerHTML: '', textContent: '' })
  },
  location: { pathname: '/orders.html', search: '' },
  localStorage: mockStorage1,
  CustomEvent: function(name, opts) { this.name = name; this.opts = opts; }
};

const orderMgmtCode = fs.readFileSync('order-management.js', 'utf8');
vm.runInNewContext(orderMgmtCode, sandbox1);

const ordersApi = sandbox1.window.CornerCravingsOrders;
assert.ok(ordersApi, 'CornerCravingsOrders must be exported globally');

// A fresh browser must start with no fake customer orders.
const initialOrders = ordersApi.readOrders();
assert.ok(Array.isArray(initialOrders), 'Order store must return an array');
assert.strictEqual(initialOrders.length, 0, 'A fresh order queue must be empty');

const realOrder = { id: 'LIVE-1', orderNumber: 'CC-LIVE-1', customer: 'Simulation Customer', isDemo: false };
const oldDemoOrder = { id: 'DEMO-1', customer: 'Old Sample Customer', isDemo: true };
mockStorage1.setItem('cornerCravingsAdminOrders', JSON.stringify([oldDemoOrder, realOrder]));
const migratedOrders = ordersApi.readOrders();
assert.strictEqual(migratedOrders.length, 1, 'Legacy demo records must be removed automatically');
assert.strictEqual(migratedOrders[0].id, 'LIVE-1', 'Customer-submitted records must be preserved');

ordersApi.saveOrders([]);
assert.strictEqual(ordersApi.readOrders().length, 0, 'An empty queue must never repopulate fake orders');
console.log('  ✓ Fresh queues are empty and legacy sample records are removed');


// 2. Test customer.js cart validation and order creation
console.log('[Test 2] Testing customer.js validateCart and createDemoOrder...');
const mockStorage2 = createMockStorage();
const sandbox2 = {
  window: {
    addEventListener: () => {},
    dispatchEvent: () => {},
    CornerCravingsMenu: [
      { id: 'rice-meals-tapsilog', name: 'Tapsilog', price: 125, available: true },
      { id: 'iced-coffee-latte', name: 'Latte', price: 79, available: true },
      { id: 'special-burger-aloha-burger', name: 'Aloha Burger', price: 169, available: false }
    ]
  },
  document: {
    addEventListener: () => {},
    getElementById: () => null,
    querySelectorAll: () => []
  },
  localStorage: mockStorage2,
  CustomEvent: function(name, opts) { this.name = name; this.opts = opts; }
};

const customerCode = fs.readFileSync('customer.js', 'utf8');
vm.runInNewContext(customerCode, sandbox2);
const cc = sandbox2.window.CornerCravings;
assert.ok(cc, 'window.CornerCravings must be exported');
assert.ok(typeof cc.validateCart === 'function', 'validateCart must be a function');

// Test empty cart validation
mockStorage2.setItem('cornerCravingsCustomerCart', JSON.stringify([]));
const emptyVal = cc.validateCart();
assert.strictEqual(emptyVal.valid, false, 'Empty cart should be invalid for checkout');
assert.strictEqual(emptyVal.empty, true, 'empty flag should be true');

// Test cart with unavailable item
mockStorage2.setItem('cornerCravingsCustomerCart', JSON.stringify([
  { id: 'item-1', productId: 'special-burger-aloha-burger', name: 'Aloha Burger', unitPrice: 169, quantity: 1 }
]));
const unavailVal = cc.validateCart();
assert.strictEqual(unavailVal.valid, false, 'Cart with unavailable item must be invalid');
assert.ok(unavailVal.issues.length > 0, 'Cart must provide descriptive issues');
console.log('  ✓ validateCart accurately catches out-of-stock / unavailable products');

// Test valid cart & order creation
mockStorage2.setItem('cornerCravingsCustomerCart', JSON.stringify([
  { id: 'item-2', productId: 'rice-meals-tapsilog', name: 'Tapsilog', unitPrice: 125, quantity: 2, size: 'Regular' },
  { id: 'item-3', productId: 'iced-coffee-latte', name: 'Latte', unitPrice: 79, quantity: 1, size: 'Regular' }
]));
mockStorage2.setItem('cornerCravingsCustomerDelivery', JSON.stringify({
  method: 'standard',
  recipientName: 'Maria Santos',
  address: 'Pasong Putik, Novaliches',
  area: 'Quezon City',
  contactNumber: '0918-123-4567',
  notes: 'Ring the doorbell please'
}));

const validVal = cc.validateCart();
assert.strictEqual(validVal.valid, true, 'Cart with available products should be valid');

// Create order
const placedOrder = cc.createDemoOrder('Cash on Delivery');
assert.ok(placedOrder, 'Order must be created successfully');
assert.strictEqual(placedOrder.customer, 'Maria Santos');
assert.strictEqual(placedOrder.fulfillmentType, 'delivery');
assert.strictEqual(placedOrder.fulfillmentStatus, 'pending');
assert.strictEqual(placedOrder.status, 'Pending');
assert.strictEqual(placedOrder.paymentMethod, 'Cash on Delivery');
assert.strictEqual(placedOrder.paymentStatus, 'unpaid');
assert.strictEqual(placedOrder.isDemo, false, 'Customer placed orders must have isDemo: false');
assert.ok(Array.isArray(placedOrder.statusHistory), 'Order must have statusHistory');
assert.strictEqual(placedOrder.statusHistory[0].status, 'Pending');
assert.strictEqual(placedOrder.statusHistory[0].actor, 'customer');

// Verify order written to canonical store
const adminOrdersStored = JSON.parse(mockStorage2.getItem('cornerCravingsAdminOrders'));
assert.ok(Array.isArray(adminOrdersStored) && adminOrdersStored.length === 1);
assert.strictEqual(adminOrdersStored[0].id, placedOrder.id);
console.log('  ✓ createDemoOrder writes complete central schema to canonical store');

// 3. Test staff-orders.js status transitions & audit trail
console.log('[Test 3] Testing staff-orders.js status transitions and audit trail...');
const mockStorage3 = createMockStorage();
mockStorage3.setItem('cornerCravingsAdminOrders', JSON.stringify([placedOrder]));

const tbodyMock = {
  innerHTML: '',
  listeners: {},
  addEventListener: function(event, handler) { this.listeners[event] = handler; }
};

const sandbox3 = {
  window: {
    addEventListener: () => {},
    dispatchEvent: () => {}
  },
  document: {
    querySelector: (selector) => {
      if (selector === '.staff-table') return { querySelector: () => tbodyMock };
      return null;
    },
    querySelectorAll: () => [],
    createElement: (tag) => {
      var node = { innerHTML: '', textContent: '' };
      Object.defineProperty(node, 'innerHTML', {
        get() { return node._text || ''; },
        set(v) { node._text = v; }
      });
      Object.defineProperty(node, 'textContent', {
        get() { return node._text || ''; },
        set(v) { node._text = v; }
      });
      return node;
    }
  },
  location: { pathname: '/staff-orders.html' },
  localStorage: mockStorage3,
  CustomEvent: function(name, opts) { this.name = name; this.opts = opts; }
};

const staffOrdersCode = fs.readFileSync('staff-orders.js', 'utf8');
vm.runInNewContext(staffOrdersCode, sandbox3);

// Simulate staff clicking "Start Prep"
assert.ok(tbodyMock.listeners['click'], 'tbody must have click listener for action buttons');
const fakeClickEvent = {
  target: {
    closest: (selector) => {
      if (selector === '[data-order-action]') {
        return {
          dataset: {
            orderAction: 'Preparing',
            orderId: placedOrder.id
          }
        };
      }
      return null;
    }
  }
};
tbodyMock.listeners['click'](fakeClickEvent);

const updatedAfterStaff = JSON.parse(mockStorage3.getItem('cornerCravingsAdminOrders'))[0];
assert.strictEqual(updatedAfterStaff.status, 'Preparing');
assert.strictEqual(updatedAfterStaff.fulfillmentStatus, 'preparing');
assert.strictEqual(updatedAfterStaff.statusHistory.length, 2);
assert.strictEqual(updatedAfterStaff.statusHistory[1].status, 'Preparing');
assert.strictEqual(updatedAfterStaff.statusHistory[1].actor, 'staff');
console.log('  ✓ Staff order status progression appends audit history with staff actor');

// 4. Test customer-orders.js account scoping
console.log('[Test 4] Testing customer-orders.js account scoping...');
const mockStorage4 = createMockStorage();
const orderUserA = Object.assign({}, placedOrder, { id: 'ORD-AAA', orderNumber: 'ORD-AAA', customerId: 'user-a', email: 'usera@example.com' });
const orderUserB = Object.assign({}, placedOrder, { id: 'ORD-BBB', orderNumber: 'ORD-BBB', customerId: 'user-b', email: 'userb@example.com' });

mockStorage4.setItem('cornerCravingsAdminOrders', JSON.stringify([orderUserA, orderUserB]));
mockStorage4.setItem('cornerCravingsCustomerOrders', JSON.stringify([orderUserA, orderUserB]));

let renderedOrdersHtml = '';
const listElMock = {
  set innerHTML(val) { renderedOrdersHtml = val; },
  get innerHTML() { return renderedOrdersHtml; }
};

const sandbox4 = {
  window: {
    addEventListener: () => {},
    dispatchEvent: () => {},
    CornerCravings: {
      getCustomerSession: () => ({ id: 'user-a', email: 'usera@example.com', name: 'User A' }),
      getCustomerOrders: () => JSON.parse(mockStorage4.getItem('cornerCravingsCustomerOrders')),
      formatPeso: (v) => '₱' + Number(v).toFixed(2)
    }
  },
  document: {
    getElementById: (id) => (id === 'customer-order-list' ? listElMock : null),
    createElement: (tag) => {
      var node = {};
      Object.defineProperty(node, 'innerHTML', {
        get() { return node._text || ''; },
        set(v) { node._text = v; }
      });
      Object.defineProperty(node, 'textContent', {
        get() { return node._text || ''; },
        set(v) { node._text = v; }
      });
      return node;
    }
  },
  localStorage: mockStorage4
};

const customerOrdersCode = fs.readFileSync('customer-orders.js', 'utf8');
vm.runInNewContext(customerOrdersCode, sandbox4);

assert.ok(renderedOrdersHtml.includes('ORD-AAA'), 'Logged-in user A must see their own order');
assert.ok(!renderedOrdersHtml.includes('ORD-BBB'), 'Logged-in user A must NOT see orders belonging to user B');
console.log('  ✓ Customer order tracker strictly isolates orders by account email/ID');

console.log('--- Phase 1 Automated Verification Passed Successfully! ---');
