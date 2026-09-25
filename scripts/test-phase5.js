/**
 * Corner Cravings - Phase 5 Automated Test Suite
 * Verifies Mobile Experience & Quality Pass:
 * 1. Customer mobile bottom navigation rendering & component hierarchy
 * 2. Active tab route resolution across customer pages
 * 3. Dynamic cart badge count synchronization in bottom nav
 * 4. Account tab destination scoping based on session state
 * 5. Responsive CSS rules, safe-area insets, and minimum 44px touch targets
 * 6. Staff portal responsive table-to-card data-label generation
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('--- Starting Phase 5 Automated Verification ---');

// ---------------------------------------------------------------------------
// Mock DOM & Environment Helpers
// ---------------------------------------------------------------------------
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

class MockElement {
  constructor(tagName) {
    this.tagName = (tagName || 'div').toUpperCase();
    this.id = '';
    this.className = '';
    this.attributes = {};
    this.style = {};
    this.children = [];
    this.parentNode = null;
    this.textContentInternal = '';
    this.innerHTMLInternal = '';
  }

  setAttribute(name, value) {
    this.attributes[name] = String(value);
    if (name === 'id') this.id = String(value);
    if (name === 'class') this.className = String(value);
    if (name === 'style') {
      var parts = String(value).split(';');
      for (var p = 0; p < parts.length; p++) {
        var kv = parts[p].split(':');
        if (kv.length === 2) {
          this.style[kv[0].trim()] = kv[1].trim();
        }
      }
    }
  }

  getAttribute(name) {
    if (name === 'id') return this.id;
    if (name === 'class') return this.className;
    return this.attributes[name] || null;
  }

  hasAttribute(name) {
    return Object.prototype.hasOwnProperty.call(this.attributes, name);
  }

  get classList() {
    var self = this;
    return {
      contains: function (cls) {
        return (self.className || '').split(/\s+/).indexOf(cls) !== -1;
      },
      add: function (cls) {
        if (!this.contains(cls)) {
          self.className = (self.className ? self.className + ' ' : '') + cls;
        }
      },
      remove: function (cls) {
        var parts = (self.className || '').split(/\s+/).filter(function (c) { return c && c !== cls; });
        self.className = parts.join(' ');
      },
      toggle: function (cls, force) {
        if (force === true || (force === undefined && !this.contains(cls))) {
          this.add(cls);
        } else {
          this.remove(cls);
        }
      }
    };
  }

  appendChild(child) {
    child.parentNode = this;
    this.children.push(child);
    return child;
  }

  removeChild(child) {
    var idx = this.children.indexOf(child);
    if (idx !== -1) {
      child.parentNode = null;
      this.children.splice(idx, 1);
    }
    return child;
  }

  remove() {
    if (this.parentNode) {
      this.parentNode.removeChild(this);
    }
  }

  get textContent() {
    return this.textContentInternal;
  }

  set textContent(val) {
    this.textContentInternal = String(val);
    this.children = [];
  }

  get innerHTML() {
    return this.innerHTMLInternal;
  }

  set innerHTML(html) {
    this.innerHTMLInternal = html;
    this.children = [];
    // Lightweight mock parser for <a> and <span> and <div>
    var tagRegex = /<([a-z0-9]+)([^>]*)>([\s\S]*?)<\/\1>/gi;
    var match;
    while ((match = tagRegex.exec(html)) !== null) {
      var tag = match[1];
      var attrStr = match[2];
      var inner = match[3];

      var el = new MockElement(tag);
      var attrRegex = /([a-zA-Z0-9_-]+)="([^"]*)"/g;
      var attrMatch;
      while ((attrMatch = attrRegex.exec(attrStr)) !== null) {
        el.setAttribute(attrMatch[1], attrMatch[2]);
      }
      el.textContentInternal = inner.replace(/<[^>]+>/g, '').trim();
      el.innerHTML = inner; // recurse for children
      el.parentNode = this;
      this.children.push(el);
    }
  }

  addEventListener() {}
  removeEventListener() {}

  querySelectorAll(selector) {
    var results = [];
    function traverse(node) {
      for (var i = 0; i < node.children.length; i++) {
        var ch = node.children[i];
        if (matches(ch, selector)) results.push(ch);
        traverse(ch);
      }
    }
    function matches(node, sel) {
      if (sel.startsWith('.')) {
        var cls = sel.slice(1);
        return node.classList.contains(cls);
      }
      if (sel.startsWith('#')) {
        return node.id === sel.slice(1);
      }
      if (sel.toLowerCase() === node.tagName.toLowerCase()) {
        return true;
      }
      return false;
    }
    traverse(this);
    return results;
  }

  querySelector(selector) {
    var res = this.querySelectorAll(selector);
    return res.length > 0 ? res[0] : null;
  }
}

class MockDocument {
  constructor() {
    this.body = new MockElement('body');
  }

  createElement(tag) {
    return new MockElement(tag);
  }

  getElementById(id) {
    var res = this.body.querySelectorAll('#' + id);
    if (this.body.id === id) return this.body;
    return res.length > 0 ? res[0] : null;
  }

  querySelector(sel) {
    return this.body.querySelector(sel);
  }

  querySelectorAll(sel) {
    return this.body.querySelectorAll(sel);
  }

  addEventListener() {}
  removeEventListener() {}
}

const mockStorage = new MockStorage();

function createCustomerEnvironment(pathname) {
  var doc = new MockDocument();
  var mockLocation = {
    pathname: pathname || '/customer-home.html',
    href: 'http://localhost/Corner-Cravings' + (pathname || '/customer-home.html')
  };

  var sandbox = {
    window: {},
    self: {},
    document: doc,
    location: mockLocation,
    localStorage: mockStorage,
    CustomEvent: class { constructor(type, params) { this.type = type; this.detail = params ? params.detail : null; } },
    Date: Date,
    Math: Math,
    Number: Number,
    String: String,
    Array: Array,
    Object: Object,
    JSON: JSON,
    console: console,
    setTimeout: setTimeout,
    clearTimeout: clearTimeout
  };
  sandbox.window = sandbox;

  var menuCode = fs.readFileSync(path.join(__dirname, '..', 'menu-data.js'), 'utf8');
  var custCode = fs.readFileSync(path.join(__dirname, '..', 'customer.js'), 'utf8');

  vm.createContext(sandbox);
  vm.runInContext(menuCode, sandbox);
  vm.runInContext(custCode, sandbox);

  return { sandbox: sandbox, doc: doc, location: mockLocation };
}

// ---------------------------------------------------------------------------
// Test 1: Customer Mobile Bottom Nav Rendering & Hierarchy
// ---------------------------------------------------------------------------
console.log('\n[Test 1] Testing Mobile Bottom Navigation Bar Rendering & Structure...');

mockStorage.clear();
var env1 = createCustomerEnvironment('/customer-home.html');
var cc1 = env1.sandbox.CornerCravings;
assert.ok(cc1 && typeof cc1.renderBottomNav === 'function', 'CornerCravings.renderBottomNav must be exported');

cc1.renderBottomNav();
var navEl = env1.doc.getElementById('customer-bottom-nav');
assert.ok(navEl, 'Bottom nav element #customer-bottom-nav must be rendered into document body');
assert.strictEqual(navEl.getAttribute('aria-label'), 'Mobile bottom navigation', 'Aria-label must be present');

var navItems = navEl.querySelectorAll('.bottom-nav-item');
assert.strictEqual(navItems.length, 5, 'Bottom navigation bar must contain exactly 5 tabs');

function getTabLabel(item) {
  var spans = item.querySelectorAll('span');
  return spans.length > 0 ? spans[spans.length - 1].textContentInternal : item.textContentInternal;
}

var itemLabels = navItems.map(getTabLabel);
assert.deepStrictEqual(itemLabels, ['Home', 'Menu', 'Cart', 'Orders', 'Account'], 'Tabs must be: Home, Menu, Cart, Orders, Account');

console.log('  ✓ Bottom navigation bar creates 5 dedicated tabs: Home, Menu, Cart, Orders, Account');

// ---------------------------------------------------------------------------
// Test 2: Active Tab Route Resolution
// ---------------------------------------------------------------------------
console.log('\n[Test 2] Testing Active Tab Route Matching across Customer Pages...');

const testRoutes = [
  { path: '/customer-home.html', activeLabel: 'Home' },
  { path: '/customer-menu.html', activeLabel: 'Menu' },
  { path: '/customer-product.html?id=rice-meals-tapsilog', activeLabel: 'Menu' },
  { path: '/customer-cart.html', activeLabel: 'Cart' },
  { path: '/customer-delivery.html', activeLabel: 'Cart' },
  { path: '/customer-payment.html', activeLabel: 'Cart' },
  { path: '/customer-orders.html', activeLabel: 'Orders' },
  { path: '/customer-confirmation.html', activeLabel: 'Orders' },
  { path: '/customer-profile.html', activeLabel: 'Account' },
  { path: '/customer-login.html', activeLabel: 'Account' }
];

testRoutes.forEach(function (routeTest) {
  var env = createCustomerEnvironment(routeTest.path);
  env.sandbox.CornerCravings.renderBottomNav();
  var nav = env.doc.getElementById('customer-bottom-nav');
  var activeItems = nav.querySelectorAll('.bottom-nav-item').filter(el => el.classList.contains('is-active'));
  
  assert.strictEqual(activeItems.length, 1, `Exactly one tab should be active for ${routeTest.path}`);
  var activeTabLabel = getTabLabel(activeItems[0]);
  assert.strictEqual(
    activeTabLabel,
    routeTest.activeLabel,
    `Active tab for "${routeTest.path}" must be "${routeTest.activeLabel}" (got "${activeTabLabel}")`
  );
});

console.log('  ✓ Correct tab marked active across all 10 customer routes and checkout screens');

// ---------------------------------------------------------------------------
// Test 3: Dynamic Cart Badge Count Synchronization
// ---------------------------------------------------------------------------
console.log('\n[Test 3] Testing Dynamic Cart Badge Count Synchronization in Bottom Nav...');

mockStorage.clear();
var env3 = createCustomerEnvironment('/customer-menu.html');
var cc3 = env3.sandbox.CornerCravings;
cc3.renderBottomNav();

var navBadge = env3.doc.querySelector('.bottom-nav-badge');
assert.ok(navBadge, 'Bottom nav cart badge element must exist');
assert.strictEqual(navBadge.style.display, 'none', 'Badge should initially be hidden for empty cart');

// Add 2 Tapsilog and 3 Hotsilog
cc3.addToCart('rice-meals-tapsilog', 2);
cc3.addToCart('rice-meals-hotsilog', 3);

assert.strictEqual(navBadge.textContent, '5', 'Bottom nav cart badge should update to 5');
assert.strictEqual(navBadge.style.display, 'inline-flex', 'Bottom nav cart badge should be visible');

// Clear cart
cc3.clearCart();
assert.strictEqual(navBadge.textContent, '0', 'Bottom nav cart badge should reset to 0');
assert.strictEqual(navBadge.style.display, 'none', 'Bottom nav cart badge should be hidden when empty');

console.log('  ✓ Cart badge in bottom navigation dynamically updates and displays live quantity totals');

// ---------------------------------------------------------------------------
// Test 4: Account Target Scoping Based on Session State
// ---------------------------------------------------------------------------
console.log('\n[Test 4] Testing Account Link Destination Based on Session...');

// Scenario A: Guest / Not Logged In
mockStorage.clear();
var envGuest = createCustomerEnvironment('/customer-home.html');
envGuest.sandbox.CornerCravings.renderBottomNav();
var guestAccountTab = envGuest.doc.querySelectorAll('.bottom-nav-item')[4];
assert.strictEqual(guestAccountTab.getAttribute('href'), 'customer-login.html', 'Guest account tab must link to customer-login.html');

// Scenario B: Signed-in Customer
mockStorage.setItem('cornerCravingsCustomerSession', JSON.stringify({
  id: 'cust-1234',
  name: 'Maria Santos',
  email: 'maria@example.com'
}));
var envUser = createCustomerEnvironment('/customer-home.html');
envUser.sandbox.CornerCravings.renderBottomNav();
var userAccountTab = envUser.doc.querySelectorAll('.bottom-nav-item')[4];
assert.strictEqual(userAccountTab.getAttribute('href'), 'customer-profile.html', 'Authenticated account tab must link to customer-profile.html');

console.log('  ✓ Account tab destination accurately directs to login (guests) or profile (signed in)');

// ---------------------------------------------------------------------------
// Test 5: Responsive CSS & Touch Target Declarations Audit
// ---------------------------------------------------------------------------
console.log('\n[Test 5] Auditing Responsive CSS Rules, Safe Areas, and 44px Tap Targets...');

// Audit customer.css
const customerCss = fs.readFileSync(path.join(__dirname, '..', 'customer.css'), 'utf8');

assert.ok(customerCss.includes('@media (max-width: 640px)'), 'customer.css must include @media (max-width: 640px)');
assert.ok(customerCss.includes('.customer-bottom-nav'), 'customer.css must define .customer-bottom-nav');
assert.ok(customerCss.includes('padding-bottom: env(safe-area-inset-bottom'), 'customer.css must support safe-area-inset-bottom');
assert.ok(customerCss.includes('calc(64px + env(safe-area-inset-bottom'), 'customer.css must pad body to prevent bottom nav overlap');
assert.ok(customerCss.includes('min-width: 44px') || customerCss.includes('min-height: 44px'), 'customer.css must declare 44px touch targets');
assert.ok(customerCss.includes('.bottom-nav-item'), 'customer.css must style .bottom-nav-item');

// Audit staff.css
const staffCss = fs.readFileSync(path.join(__dirname, '..', 'staff.css'), 'utf8');
assert.ok(staffCss.includes('attr(data-label)'), 'staff.css must use attr(data-label) for responsive mobile card cells');
assert.ok(staffCss.includes('.staff-table thead'), 'staff.css must hide or clip thead on small screens');
assert.ok(staffCss.includes('min-height: 44px') || staffCss.includes('min-height: 48px'), 'staff.css action buttons must have touch-friendly height');

// Audit dashboard.css
const dashboardCss = fs.readFileSync(path.join(__dirname, '..', 'dashboard.css'), 'utf8');
assert.ok(dashboardCss.includes('.nav-item--inventory-parent'), 'dashboard.css must define inventory parent mobile display');
assert.ok(dashboardCss.includes('.nav-item--sub'), 'dashboard.css must hide sub-navigation on mobile');
assert.ok(dashboardCss.includes('min-height: 48px'), 'dashboard.css must provide 48px touch targets for mobile admin navigation');

console.log('  ✓ CSS audits confirm mobile bottom bar layouts, card transformations, and accessible touch targets');

// ---------------------------------------------------------------------------
// Test 6: Staff Orders Table Data-Label Rendering
// ---------------------------------------------------------------------------
console.log('\n[Test 6] Testing Staff Table Data-Label Generation for Mobile Cards...');

mockStorage.clear();
const sampleStaffOrders = [
  {
    id: '8001',
    orderNumber: 'ORD-8001',
    customer: 'Juan dela Cruz',
    placedAt: new Date(Date.now() - 5 * 60000).toISOString(),
    status: 'Pending',
    fulfillmentType: 'delivery',
    items: [{ name: 'Tapsilog', quantity: 2, price: 135 }]
  },
  {
    id: '8002',
    orderNumber: 'ORD-8002',
    customer: 'Ana Gomez',
    placedAt: new Date(Date.now() - 15 * 60000).toISOString(),
    status: 'Preparing',
    fulfillmentType: 'pickup',
    items: [{ name: 'Palabok Combo', quantity: 1, price: 169 }]
  }
];
mockStorage.setItem('cornerCravingsAdminOrders', JSON.stringify(sampleStaffOrders));

// Run staff-orders in VM
const staffDoc = new MockDocument();
const staffTable = staffDoc.createElement('table');
staffTable.className = 'staff-table';
const staffTbody = staffDoc.createElement('tbody');
staffTable.appendChild(staffTbody);
staffDoc.body.appendChild(staffTable);

const staffSandbox = {
  window: {},
  self: {},
  document: staffDoc,
  location: { pathname: '/staff-orders.html' },
  localStorage: mockStorage,
  CustomEvent: class { constructor(type, params) { this.type = type; this.detail = params ? params.detail : null; } },
  Date: Date,
  Math: Math,
  Number: Number,
  String: String,
  Array: Array,
  Object: Object,
  JSON: JSON,
  console: console,
  addEventListener: function () {},
  removeEventListener: function () {},
  dispatchEvent: function () {}
};
staffSandbox.window = staffSandbox;

const staffScriptCode = fs.readFileSync(path.join(__dirname, '..', 'staff-orders.js'), 'utf8');
vm.createContext(staffSandbox);
vm.runInContext(staffScriptCode, staffSandbox);

// Check rendered HTML
var renderedHtml = staffTbody.innerHTML;
assert.ok(renderedHtml.includes('data-label="Order"'), 'Staff rows must contain data-label="Order"');
assert.ok(renderedHtml.includes('data-label="Items"'), 'Staff rows must contain data-label="Items"');
assert.ok(renderedHtml.includes('data-label="Placed"'), 'Staff rows must contain data-label="Placed"');
assert.ok(renderedHtml.includes('data-label="Status"'), 'Staff rows must contain data-label="Status"');
assert.ok(renderedHtml.includes('data-label="Actions"'), 'Staff rows must contain data-label="Actions"');

console.log('  ✓ Staff order rows generate proper data-label attributes for mobile card layout transformation');

console.log('\n--- ALL PHASE 5 AUTOMATED TESTS PASSED SUCCESSFULLY! ---');
