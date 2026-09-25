(function () {
  'use strict';

  var STORAGE_KEY = 'cornerCravingsInventory';
  var PAGE_SIZE = 5;
  var state = { items: [], receipts: [], dispatches: [] };
  var currentPage = 1;
  var DEFAULT_DATA = {
    items: [
      { id: 1, sku: 'INV-BUN-001', name: 'Artisan Sourdough Buns', category: 'Bakery', unit: 'pcs', stock: 120, reorderLevel: 30 },
      { id: 2, sku: 'INV-AVO-001', name: 'Organic Avocados', category: 'Produce', unit: 'pcs', stock: 8, reorderLevel: 15 },
      { id: 3, sku: 'INV-CBR-001', name: 'Cold Brew Concentrate', category: 'Beverage', unit: 'L', stock: 25, reorderLevel: 8 },
      { id: 4, sku: 'INV-MAY-001', name: 'Truffle Mayo', category: 'Condiments', unit: 'kg', stock: 18, reorderLevel: 5 },
      { id: 5, sku: 'INV-EGG-001', name: 'Free Range Eggs', category: 'Dairy & Eggs', unit: 'crates', stock: 60, reorderLevel: 12 },
      { id: 6, sku: 'INV-SAL-001', name: 'Atlantic Salmon', category: 'Proteins', unit: 'lbs', stock: 85, reorderLevel: 20 },
      { id: 7, sku: 'INV-TOM-001', name: 'Heirloom Tomatoes', category: 'Fresh Produce', unit: 'lbs', stock: 42, reorderLevel: 15 },
      { id: 8, sku: 'INV-FLR-001', name: '00 Pizza Flour', category: 'Dry Goods', unit: 'lbs', stock: 230, reorderLevel: 50 },
      { id: 9, sku: 'INV-MLK-001', name: 'Fresh Milk', category: 'Dairy & Eggs', unit: 'L', stock: 36, reorderLevel: 10 }
    ],
    transactions: [
      { id: 1, itemId: 5, type: 'IN', quantity: 15, reason: 'Delivery', batch: 'BCH-18-09-24', stockAfter: 60, status: 'POSTED', date: '2026-09-18T08:30' },
      { id: 2, itemId: 6, type: 'IN', quantity: 40, reason: 'Delivery', batch: 'SLM-15-10-24', stockAfter: 85, status: 'POSTED', date: '2026-09-18T08:10' },
      { id: 3, itemId: 7, type: 'IN', quantity: 25, reason: 'Delivery', batch: 'TOM-19-09-24', stockAfter: 42, status: 'PENDING_QC', date: '2026-09-17T11:20' },
      { id: 4, itemId: 1, type: 'OUT', quantity: 45, reason: 'Daily Prep', stockAfter: 120, status: 'POSTED', date: '2026-09-18T06:30' },
      { id: 5, itemId: 2, type: 'OUT', quantity: 12, reason: 'Spoilage', stockAfter: 8, status: 'POSTED', date: '2026-09-18T09:15' },
      { id: 6, itemId: 3, type: 'OUT', quantity: 5, reason: 'Daily Prep', stockAfter: 25, status: 'POSTED', date: '2026-09-17T22:00' },
      { id: 7, itemId: 4, type: 'OUT', quantity: 2, reason: 'Stock Transfer', stockAfter: 18, status: 'POSTED', date: '2026-09-16T11:45' }
    ]
  };

  function escapeHtml(value) {
    if (value == null) return '';
    if (typeof document !== 'undefined') {
      var node = document.createElement('div');
      node.textContent = String(value);
      return node.innerHTML;
    }
    return String(value).replace(/[&<>"']/g, function (m) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m];
    });
  }
  function itemById(id) { return state.items.find(function (item) { return Number(item.id) === Number(id); }); }
  function number(value) { return Number.parseFloat(value) || 0; }
  function quantity(value) { var parsed = number(value); return Number.isInteger(parsed) ? String(parsed) : parsed.toFixed(3).replace(/0+$/, '').replace(/\.$/, ''); }
  function formatDate(value, withTime) {
    var date = new Date(value && value.length === 10 ? value + 'T00:00:00' : value);
    if (Number.isNaN(date.getTime())) return value || '—';
    return new Intl.DateTimeFormat('en-PH', withTime ? { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' } : { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
  }
  function localDateTime() { var now = new Date(); return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16); }
  function nextTransactionId(transactions) {
    var seed = Date.now();
    while (transactions.some(function (entry) { return Number(entry.id) === seed; })) seed += 1;
    return seed;
  }
  function isSystemTransaction(record) { return record && (record.source === 'ORDER' || /^Order Prep\b/.test(String(record.reason || '')) || /^Restock Cancelled\b/.test(String(record.reason || ''))); }
  function currentAdminActor() {
    try {
      var profile = JSON.parse(localStorage.getItem('cornerCravingsAdminProfile') || 'null');
      if (profile) {
        var fullName = profile.name || [profile.firstName, profile.lastName].filter(Boolean).join(' ');
        if (fullName) return fullName;
        if (profile.email) return profile.email;
      }
    } catch (error) {}
    return 'Admin User';
  }
  function statusClass(status) {
    var s = String(status || '');
    if (s === 'PENDING_QC' || s === 'Pending QC') return 'inventory-status--pending';
    if (s === 'VOIDED' || s === 'REVERSED') return 'inventory-status--voided';
    if (s === 'Spoilage') return 'inventory-status--spoilage';
    if (s === 'Stock Transfer') return 'inventory-status--transfer';
    if (s === 'POSTED' || s === 'Verified') return 'inventory-status--verified';
    if (s.indexOf('Order Prep') !== -1) return 'inventory-status--prep';
    if (s.indexOf('Restock') !== -1) return 'inventory-status--restock';
    return 'inventory-status--daily';
  }
  function statusLabel(status) { return status === 'PENDING_QC' ? 'Pending QC' : status === 'POSTED' ? 'Verified' : (status === 'VOIDED' || status === 'REVERSED') ? 'Voided' : status; }

  function readStore() {
    if (typeof window !== 'undefined' && window.CornerCravingsInventory && typeof window.CornerCravingsInventory.readInventory === 'function') {
      return window.CornerCravingsInventory.readInventory();
    }
    try {
      var parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (parsed && Array.isArray(parsed.items) && parsed.items.length > 0) return parsed;
      return JSON.parse(JSON.stringify(DEFAULT_DATA));
    } catch (error) {
      return JSON.parse(JSON.stringify(DEFAULT_DATA));
    }
  }
  function writeStore(data) {
    if (typeof window !== 'undefined' && window.CornerCravingsInventory && typeof window.CornerCravingsInventory.writeInventory === 'function') {
      window.CornerCravingsInventory.writeInventory(data);
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  }
  function post(action, data) {
    var store = readStore(); var item = store.items.find(function (entry) { return Number(entry.id) === Number(data.itemId); }); var record;
    if (action === 'reverse') {
      record = store.transactions.find(function (entry) { return Number(entry.id) === Number(data.transactionId) && !entry.reversedAt; });
      if (!record) return Promise.reject(new Error('Inventory record was not found or is already reversed.'));
      if (isSystemTransaction(record)) return Promise.reject(new Error('Order-generated inventory records must be corrected from the order workflow.'));
      item = store.items.find(function (entry) { return Number(entry.id) === Number(record.itemId); });
      if (!item) return Promise.reject(new Error('The inventory item no longer exists.'));
      if (record.type === 'IN' && Number(record.quantity) > Number(item.stock)) return Promise.reject(new Error('This receipt cannot be reversed because part of its stock has already been used.'));
      item.stock = Math.round((Number(item.stock) + (record.type === 'IN' ? -Number(record.quantity) : Number(record.quantity))) * 1000) / 1000;
      var reversedAt = new Date().toISOString();
      var reversedBy = String(data.actor || 'Admin User').trim();
      var reversalReason = String(data.reason || '').trim();
      record.reversedAt = reversedAt;
      record.reversedBy = reversedBy;
      record.reversalReason = reversalReason;
      record.status = 'VOIDED';
      record.balanceAfterVoid = item.stock;
      store.transactions.push({ id: nextTransactionId(store.transactions), itemId: Number(item.id), sku: item.sku, type: 'ADJUSTMENT', direction: record.type === 'IN' ? 'DECREASE' : 'INCREASE', quantity: Number(record.quantity), reason: record.type === 'IN' ? 'Void Stock In' : 'Void Stock Out', notes: reversalReason, source: 'ADMIN_VOID', actor: reversedBy, linkedTransactionId: Number(record.id), stockAfter: item.stock, status: 'POSTED', date: reversedAt });
      writeStore(store); return Promise.resolve({ ok: true, balanceAfter: item.stock });
    }
    if (action === 'correct') {
      record = store.transactions.find(function (entry) { return Number(entry.id) === Number(data.transactionId) && !entry.reversedAt; });
      if (!record) return Promise.reject(new Error('Stock-out record was not found.'));
      if (record.type !== 'OUT' || isSystemTransaction(record)) return Promise.reject(new Error('This record cannot be corrected from Stock Out.'));
      var oldItem = store.items.find(function (entry) { return Number(entry.id) === Number(record.itemId); }); oldItem.stock += Number(record.quantity);
      if (!item || Number(data.quantity) > item.stock) { oldItem.stock -= Number(record.quantity); return Promise.reject(new Error('Quantity exceeds available stock.')); }
      record.reversedAt = new Date().toISOString(); record.reversalReason = 'Corrected by admin'; record.status = 'REVERSED';
    }
    if (!item) return Promise.reject(new Error('Choose a valid inventory item.'));
    var amount = Number(data.quantity); var type = action === 'stock-in' ? 'IN' : 'OUT';
    if (!Number.isFinite(amount) || amount <= 0) return Promise.reject(new Error('Enter a quantity greater than zero.'));
    if (type === 'OUT' && amount > item.stock) return Promise.reject(new Error('Insufficient stock. Available: ' + quantity(item.stock) + ' ' + item.unit + '.'));
    item.stock = Math.round((Number(item.stock) + (type === 'IN' ? amount : -amount)) * 1000) / 1000;
    if (type === 'IN' && Number(data.unitCost) > 0) item.unitCost = Number(data.unitCost);
    if (type === 'IN' && String(data.supplier || '').trim()) item.supplier = String(data.supplier).trim();
    store.transactions.push({ id: nextTransactionId(store.transactions), itemId: Number(item.id), sku: item.sku, type: type, quantity: amount, reason: data.reason || 'Delivery', batch: data.batch || '', supplier: data.supplier || '', unitCost: Number(data.unitCost) || 0, expiryDate: data.expiryDate || '', notes: data.notes || '', source: data.source || 'MANUAL', actor: data.actor || currentAdminActor(), stockAfter: item.stock, status: data.status || 'POSTED', date: data.occurredAt });
    writeStore(store); return Promise.resolve({ ok: true, balanceAfter: item.stock });
  }
  function setBusy(button, busy, label) { if (!button) return; if (busy) button.dataset.originalLabel = button.textContent; button.disabled = busy; button.textContent = busy ? label : (button.dataset.originalLabel || button.textContent); }
  function showError(message) { window.alert(message); }

  // Wide tables remain tables on larger screens. On phones, the cells use
  // these labels when each row is presented as a readable inventory card.
  function labelResponsiveTable(table) {
    if (!table) return;
    var headings = Array.prototype.map.call(table.querySelectorAll('thead th'), function (heading) {
      return heading.textContent.trim();
    });
    table.querySelectorAll('tbody tr').forEach(function (row) {
      row.querySelectorAll('td').forEach(function (cell, index) {
        cell.setAttribute('data-label', headings[index] || 'Details');
      });
    });
  }

  async function loadState() {
    var payload = readStore();
    state.items = payload.items.map(function (item) {
      item.stock = number(item.stock);
      item.reorderLevel = number(item.reorderLevel);
      item.unitCost = number(item.unitCost) || 0;
      if (!item.supplier) item.supplier = 'Corner Cravings Local Hub';
      return item;
    });
    state.transactions = (payload.transactions || []).slice();
    var active = state.transactions.filter(function (transaction) { return !transaction.reversedAt && transaction.status !== 'REVERSED'; });
    // Keep voided stock-in entries visible as immutable receipt history.
    state.receipts = state.transactions.filter(function (transaction) { return transaction.type === 'IN'; });
    state.dispatches = active.filter(function (transaction) { return transaction.type === 'OUT'; });
  }

  function populateItemSelect(select, includePlaceholder) {
    if (!select) return;
    var selected = select.value;
    select.innerHTML = (includePlaceholder ? '<option value="">Choose an item</option>' : '') + state.items.slice().sort(function (a, b) { return a.name.localeCompare(b.name); }).map(function (item) {
      return '<option value="' + item.id + '">' + escapeHtml(item.name) + (includePlaceholder ? '' : ' (' + quantity(item.stock) + ' ' + escapeHtml(item.unit) + ')') + '</option>';
    }).join('');
    if (selected) select.value = selected;
  }

  function skuFromName(name) {
    return 'ING-' + String(name || '').toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 28);
  }

  function ensureNewItemDialog(onCreated) {
    var dialog = document.getElementById('new-item-dialog');
    if (dialog) { dialog._onCreated = onCreated; return dialog; }
    dialog = document.createElement('dialog');
    dialog.id = 'new-item-dialog';
    dialog.className = 'inventory-dialog';
    dialog._onCreated = onCreated;
    dialog.innerHTML = '<form id="new-item-form">' +
      '<header><div><h2>Add Inventory Ingredient</h2><p>Create the stock item and establish initial baseline parameters.</p></div>' +
      '<button type="button" class="inventory-dialog__close" aria-label="Close">×</button></header>' +
      '<div class="inventory-dialog__grid">' +
        '<label>Ingredient name<input name="name" type="text" maxlength="80" required></label>' +
        '<label>SKU<input name="sku" type="text" maxlength="32" placeholder="Generated from name" required></label>' +
        '<label>Category<input name="category" type="text" maxlength="50" placeholder="e.g. Produce, Meats & Proteins" required></label>' +
        '<label>Unit<select name="unit" required><option value="pcs">pieces (pcs)</option><option value="kg">kilograms (kg)</option><option value="L">liters (L)</option><option value="packs">packs</option><option value="cans">cans</option><option value="bottles">bottles</option></select></label>' +
        '<label>Initial Stock<input name="stock" type="number" min="0" step="0.001" value="0" required></label>' +
        '<label>Reorder level<input name="reorderLevel" type="number" min="0" step="0.001" value="5" required></label>' +
        '<label>Unit Cost (₱)<input name="unitCost" type="number" min="0" step="0.01" value="0.00" required></label>' +
        '<label>Primary Supplier<input name="supplier" type="text" maxlength="80" placeholder="e.g. Pasong Putik Market" required></label>' +
      '</div>' +
      '<p class="inventory-dialog__stock">Units will be used across receiving, customer recipes, and usage deductions.</p>' +
      '<footer><button type="button" class="btn-outline inventory-dialog__cancel">Cancel</button><button type="submit" class="btn-solid-sm">Create Ingredient</button></footer>' +
    '</form>';
    document.body.appendChild(dialog);
    var form = dialog.querySelector('form');
    function close() { dialog.close(); }
    dialog.querySelector('.inventory-dialog__close').addEventListener('click', close);
    dialog.querySelector('.inventory-dialog__cancel').addEventListener('click', close);
    form.elements.name.addEventListener('input', function () {
      if (!form.elements.sku.dataset.edited) form.elements.sku.value = skuFromName(form.elements.name.value);
    });
    form.elements.sku.addEventListener('input', function () {
      this.value = String(this.value).toUpperCase().replace(/[^A-Z0-9-]/g, '');
      this.dataset.edited = this.value && this.value !== skuFromName(form.elements.name.value) ? 'true' : '';
    });
    form.addEventListener('submit', async function (event) {
      event.preventDefault();
      var name = form.elements.name.value.trim();
      var sku = form.elements.sku.value.trim().toUpperCase();
      var cat = form.elements.category.value.trim();
      var unit = form.elements.unit.value;
      var initStock = number(form.elements.stock.value);
      var reorder = number(form.elements.reorderLevel.value);
      var cost = number(form.elements.unitCost.value);
      var supplier = form.elements.supplier.value.trim();

      if (!/^ING-[A-Z0-9-]+$/.test(sku)) { showError('SKU must start with ING- and use letters, numbers, or hyphens.'); return; }
      if (state.items.some(function (entry) { return entry.sku.toLowerCase() === sku.toLowerCase() || entry.name.toLowerCase() === name.toLowerCase(); })) {
        showError('An ingredient with this name or SKU already exists.');
        return;
      }

      var newItem = null;
      if (window.CornerCravingsInventory && typeof window.CornerCravingsInventory.addInventoryItem === 'function') {
        var addRes = window.CornerCravingsInventory.addInventoryItem({
          name: name,
          sku: sku,
          category: cat,
          unit: unit,
          stock: initStock,
          reorderLevel: reorder,
          unitCost: cost,
          supplier: supplier
        });
        if (!addRes.success) { showError(addRes.reason || 'Failed to create ingredient.'); return; }
        newItem = addRes.item;
      } else {
        var store = readStore();
        newItem = {
          id: store.items.reduce(function (max, entry) { return Math.max(max, Number(entry.id) || 0); }, 0) + 1,
          sku: sku,
          name: name,
          category: cat,
          unit: unit,
          stock: initStock,
          reorderLevel: reorder,
          unitCost: cost,
          supplier: supplier
        };
        store.items.push(newItem);
        writeStore(store);
      }

      await loadState();
      dialog.close();
      form.reset();
      form.elements.reorderLevel.value = '5';
      renderInventoryMetrics();
      renderCatalog();
      renderLedger();
      populateItemSelect(document.getElementById('stock-item'), true);
      if (typeof dialog._onCreated === 'function') dialog._onCreated(newItem);
    });
    return dialog;
  }

  /* Executive Metrics Calculation */
  function renderInventoryMetrics() {
    var valuationEl = document.getElementById('kpi-total-valuation');
    var itemsEl = document.getElementById('kpi-total-items');
    var lowEl = document.getElementById('kpi-low-stock');
    var outEl = document.getElementById('kpi-out-stock');
    if (!valuationEl && !itemsEl) return;

    var metrics = null;
    if (window.CornerCravingsInventory && typeof window.CornerCravingsInventory.getInventoryMetrics === 'function') {
      metrics = window.CornerCravingsInventory.getInventoryMetrics();
    } else {
      var totalValuation = 0;
      var lowCount = 0;
      var outCount = 0;
      state.items.forEach(function (it) {
        var cost = Number(it.unitCost) || 0;
        var st = Math.max(0, Number(it.stock) || 0);
        totalValuation += st * cost;
        if (st <= 0) outCount++;
        else if (st <= Number(it.reorderLevel)) lowCount++;
      });
      metrics = {
        totalValuationFormatted: '₱' + totalValuation.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        totalItems: state.items.length,
        lowStockCount: lowCount,
        outOfStockCount: outCount
      };
    }

    if (valuationEl) valuationEl.textContent = metrics.totalValuationFormatted;
    if (itemsEl) itemsEl.textContent = metrics.totalItems;
    if (lowEl) lowEl.textContent = metrics.lowStockCount;
    if (outEl) outEl.textContent = metrics.outOfStockCount;
  }

  /* Master Catalog Rendering */
  function renderCatalog() {
    var body = document.getElementById('catalog-table-body');
    if (!body) return;

    var searchInput = document.getElementById('catalog-search');
    var topSearch = document.getElementById('topbar-search-input') || document.querySelector('.topbar__search input');
    var query = (searchInput && searchInput.value || (topSearch ? topSearch.value : '')).trim().toLowerCase();

    var categoryFilter = document.getElementById('catalog-category-filter');
    var selectedCat = categoryFilter ? categoryFilter.value : '';

    var statusFilter = document.getElementById('catalog-status-filter');
    var selectedStatus = statusFilter ? statusFilter.value : '';

    if (categoryFilter && categoryFilter.options.length <= 1) {
      var categories = Array.from(new Set(state.items.map(function (it) { return it.category; }).filter(Boolean))).sort();
      categories.forEach(function (cat) {
        var opt = document.createElement('option');
        opt.value = cat;
        opt.textContent = cat;
        categoryFilter.appendChild(opt);
      });
      if (selectedCat) categoryFilter.value = selectedCat;
    }

    var filtered = state.items.filter(function (it) {
      var status = it.stock <= 0 ? 'OUT' : (it.stock <= it.reorderLevel ? 'LOW' : 'OK');
      if (selectedCat && it.category !== selectedCat) return false;
      if (selectedStatus && status !== selectedStatus) return false;
      if (query) {
        var haystack = [it.name, it.sku, it.category, it.supplier || ''].join(' ').toLowerCase();
        if (haystack.indexOf(query) === -1) return false;
      }
      return true;
    }).sort(function (a, b) {
      // Sort low/out stock items first to bring attention to issues
      var aWeight = a.stock <= 0 ? 3 : (a.stock <= a.reorderLevel ? 2 : 1);
      var bWeight = b.stock <= 0 ? 3 : (b.stock <= b.reorderLevel ? 2 : 1);
      if (bWeight !== aWeight) return bWeight - aWeight;
      return a.name.localeCompare(b.name);
    });

    body.innerHTML = filtered.map(function (item) {
      var stock = Number(item.stock) || 0;
      var reorder = Number(item.reorderLevel) || 0;
      var unitCost = Number(item.unitCost) || 0;
      var totalValue = Math.round(stock * unitCost * 100) / 100;
      var status = stock <= 0 ? 'OUT' : (stock <= reorder ? 'LOW' : 'OK');
      var statusBadge = status === 'OK'
        ? '<span class="status-badge status-badge--ok"><span class="legend-dot legend-dot--ok"></span>In Stock</span>'
        : status === 'LOW'
        ? '<span class="status-badge status-badge--low"><span class="legend-dot legend-dot--low"></span>Low Stock</span>'
        : '<span class="status-badge status-badge--out"><span class="legend-dot legend-dot--out"></span>Out of Stock</span>';

      var maxReference = Math.max(stock, reorder * 2.5, 10);
      var fillPct = Math.min(100, Math.max(0, Math.round((stock / maxReference) * 100)));
      var fillClass = status === 'OK' ? 'stock-meter-fill--ok' : (status === 'LOW' ? 'stock-meter-fill--low' : 'stock-meter-fill--out');

      return '<tr>' +
        '<td>' +
          '<div class="inventory-item">' +
            '<span class="inventory-item__icon">◈</span>' +
            '<div>' +
              '<strong>' + escapeHtml(item.name) + '</strong>' +
              '<span class="item-sku-tag">' + escapeHtml(item.sku) + '</span>' +
            '</div>' +
          '</div>' +
        '</td>' +
        '<td>' + escapeHtml(item.category) + '</td>' +
        '<td>' +
          '<div class="stock-level-cell">' +
            '<span class="stock-level-val ' + (status === 'LOW' || status === 'OUT' ? 'inventory-stock--low' : '') + '">' + quantity(stock) + ' ' + escapeHtml(item.unit) + '</span>' +
            '<div class="stock-meter-track" title="Stock level indicator"><div class="stock-meter-fill ' + fillClass + '" style="width: ' + fillPct + '%;"></div></div>' +
          '</div>' +
        '</td>' +
        '<td>' + statusBadge + '</td>' +
        '<td>' + quantity(reorder) + ' ' + escapeHtml(item.unit) + '</td>' +
        '<td>₱' + unitCost.toFixed(2) + '</td>' +
        '<td><strong>₱' + totalValue.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '</strong></td>' +
        '<td>' + escapeHtml(item.supplier || 'Corner Cravings Local Hub') + '</td>' +
        '<td class="inventory-action-cell">' +
          '<div class="row-actions-cell">' +
            '<button type="button" class="btn-row-action btn-row-action--edit" data-action="edit" data-id="' + item.id + '" title="Edit item details & stock">' +
              '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg> Edit' +
            '</button>' +
            '<button type="button" class="btn-row-action btn-row-action--stockin" data-action="quick-stockin" data-id="' + item.id + '" title="Quick log delivery">' +
              '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg> Stock In' +
            '</button>' +
          '</div>' +
        '</td>' +
      '</tr>';
    }).join('');
    labelResponsiveTable(body.closest('table'));

    var countEl = document.getElementById('catalog-results-count');
    if (countEl) countEl.textContent = 'Showing ' + filtered.length + ' of ' + state.items.length + ' tracked items';
  }

  /* Movement Audit Ledger Rendering */
  function renderLedger() {
    var body = document.getElementById('ledger-table-body');
    if (!body) return;

    var searchInput = document.getElementById('ledger-search');
    var query = searchInput ? searchInput.value.trim().toLowerCase() : '';
    var typeFilter = document.getElementById('ledger-type-filter');
    var selectedType = typeFilter ? typeFilter.value : '';

    var records = state.transactions.slice().sort(function (a, b) {
      return new Date(b.date) - new Date(a.date);
    });

    var filtered = records.filter(function (record) {
      if (selectedType && record.type !== selectedType) return false;
      if (query) {
        var item = itemById(record.itemId) || {};
        var text = [item.name, record.sku, record.batch, record.reason, record.supplier, record.notes].join(' ').toLowerCase();
        if (text.indexOf(query) === -1) return false;
      }
      return true;
    });

    body.innerHTML = filtered.map(function (record) {
      var item = itemById(record.itemId) || { name: record.sku || 'Item #' + record.itemId, unit: 'units' };
      var badgeClass = record.type === 'IN' ? 'movement-badge--in' : (record.type === 'OUT' ? 'movement-badge--out' : 'movement-badge--adjustment');
      var typeLabel = record.reversedAt ? (record.type === 'IN' ? 'Voided Stock In' : 'Voided Stock Out') : (record.type === 'IN' ? 'Stock In' : (record.type === 'OUT' ? 'Stock Out' : 'Adjustment'));
      var qtySign = record.type === 'IN' ? '+' : (record.type === 'OUT' ? '−' : (record.direction === 'DECREASE' ? '−' : '+'));
      var qtyClass = record.type === 'IN' ? 'movement-qty--in' : (record.type === 'OUT' ? 'movement-qty--out' : 'movement-qty--adj');

      var ref = [record.batch, record.supplier].filter(Boolean).join(' · ');
      var reasonText = record.reason || 'Inventory movement';
      if (record.notes) reasonText += ' <small style="display:block;color:#8a746c">' + escapeHtml(record.notes) + '</small>';
      if (record.reversedAt) reasonText += '<small class="inventory-void-note">Voided ' + escapeHtml(formatDate(record.reversedAt, true)) + ' by ' + escapeHtml(record.reversedBy || 'Admin User') + ': ' + escapeHtml(record.reversalReason || 'No reason recorded') + '</small>';

      return '<tr>' +
        '<td>' + formatDate(record.date, true) + '</td>' +
        '<td><strong>' + escapeHtml(item.name) + '</strong><br><span class="item-sku-tag">' + escapeHtml(record.sku || item.sku || '') + '</span></td>' +
        '<td><span class="movement-badge ' + badgeClass + '">' + typeLabel + '</span></td>' +
        '<td class="' + qtyClass + (record.reversedAt ? ' inventory-movement--voided' : '') + '">' + qtySign + quantity(record.quantity) + ' ' + escapeHtml(item.unit) + '</td>' +
        '<td>' + (record.stockAfter != null ? quantity(record.stockAfter) + ' ' + escapeHtml(item.unit) : '—') + '</td>' +
        '<td><div>' + reasonText + (ref ? '<small style="display:block;color:#8a746c">' + escapeHtml(ref) + '</small>' : '') + '</div></td>' +
        '<td>' + escapeHtml(record.actor || (isSystemTransaction(record) ? 'Kitchen Prep / Order' : (record.source || 'Admin Staff'))) + '</td>' +
      '</tr>';
    }).join('');
    labelResponsiveTable(body.closest('table'));

    var countEl = document.getElementById('ledger-results-count');
    if (countEl) countEl.textContent = 'Showing ' + filtered.length + ' movement records';
  }

  /* Subtab and Dialog Controllers */
  function initTabs() {
    var tabs = document.querySelectorAll('.inventory-tab');
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        var target = this.dataset.tab;
        tabs.forEach(function (t) {
          t.classList.toggle('is-active', t === tab);
          t.setAttribute('aria-selected', t === tab ? 'true' : 'false');
        });
        document.querySelectorAll('.inventory-view-container').forEach(function (v) {
          v.classList.toggle('is-hidden', v.id !== ('view-' + target));
        });
      });
    });

    var lowKpi = document.getElementById('kpi-card-low-stock');
    if (lowKpi) {
      lowKpi.addEventListener('click', function () {
        var statusTab = document.getElementById('tab-btn-status');
        if (statusTab) statusTab.click();
        var statusFilter = document.getElementById('catalog-status-filter');
        if (statusFilter) {
          statusFilter.value = 'LOW';
          renderCatalog();
        }
      });
    }

    var outKpi = document.getElementById('kpi-card-out-stock');
    if (outKpi) {
      outKpi.addEventListener('click', function () {
        var statusTab = document.getElementById('tab-btn-status');
        if (statusTab) statusTab.click();
        var statusFilter = document.getElementById('catalog-status-filter');
        if (statusFilter) {
          statusFilter.value = 'OUT';
          renderCatalog();
        }
      });
    }
  }

  function openEditModal(item) {
    var dialog = document.getElementById('edit-item-dialog');
    var form = document.getElementById('edit-item-form');
    if (!dialog || !form) return;
    form.reset();
    form.dataset.origStock = item.stock;
    form.elements.itemId.value = item.id;
    form.elements.name.value = item.name;
    form.elements.sku.value = item.sku;
    form.elements.category.value = item.category;
    form.elements.unit.value = item.unit;
    form.elements.stock.value = item.stock;
    form.elements.reorderLevel.value = item.reorderLevel;
    form.elements.unitCost.value = (Number(item.unitCost) || 0).toFixed(2);
    form.elements.supplier.value = item.supplier || 'Corner Cravings Local Hub';
    form.elements.adjustmentReason.value = '';
    document.getElementById('edit-item-help').textContent = '';
    document.getElementById('edit-dialog-title').textContent = 'Edit ' + item.name;
    dialog.showModal();
    form.elements.stock.focus();
  }

  function openQuickStockInModal(item) {
    var dialog = document.getElementById('quick-stockin-dialog');
    var form = document.getElementById('quick-stockin-form');
    if (!dialog || !form) return;
    form.reset();
    form.elements.itemId.value = item.id;
    document.getElementById('quick-item-display').value = item.name + ' (' + item.sku + ') — Current Stock: ' + quantity(item.stock) + ' ' + item.unit;
    form.elements.unitCost.value = (Number(item.unitCost) || 0).toFixed(2);
    form.elements.supplier.value = item.supplier || 'Corner Cravings Local Hub';
    form.elements.batch.value = 'DR-' + new Date().getFullYear() + '-' + Date.now().toString().slice(-4);
    form.elements.occurredAt.value = new Date().toISOString().slice(0, 10);
    document.getElementById('quick-stockin-title').textContent = 'Stock In: ' + item.name;
    document.getElementById('quick-item-help').textContent = 'Recording stock-in will immediately add quantity to active kitchen stock.';
    dialog.showModal();
    form.elements.quantity.focus();
  }

  function initItemModals() {
    var editDialog = document.getElementById('edit-item-dialog');
    var editForm = document.getElementById('edit-item-form');
    if (editDialog && editForm) {
      function closeEdit() { editDialog.close(); }
      editDialog.querySelectorAll('.inventory-dialog__close, .inventory-dialog__cancel').forEach(function (btn) {
        btn.addEventListener('click', closeEdit);
      });

      var stockInput = document.getElementById('edit-item-stock');
      var helpText = document.getElementById('edit-item-help');
      stockInput.addEventListener('input', function () {
        var original = Number(editForm.dataset.origStock || 0);
        var cur = Number(this.value) || 0;
        var diff = Math.round((cur - original) * 1000) / 1000;
        if (Math.abs(diff) > 0.0001) {
          helpText.textContent = 'Physical stock change: ' + (diff > 0 ? '+' : '') + diff + ' (will log an auditable ADJUSTMENT record).';
          document.getElementById('edit-item-reason').required = true;
        } else {
          helpText.textContent = '';
          document.getElementById('edit-item-reason').required = false;
        }
      });

      editForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        var id = editForm.elements.itemId.value;
        var newStock = number(editForm.elements.stock.value);
        var unitCost = number(editForm.elements.unitCost.value);
        var reorder = number(editForm.elements.reorderLevel.value);
        var name = editForm.elements.name.value.trim();
        var category = editForm.elements.category.value.trim();
        var unit = editForm.elements.unit.value;
        var supplier = editForm.elements.supplier.value.trim();
        var reason = editForm.elements.adjustmentReason.value.trim();

        var original = Number(editForm.dataset.origStock || 0);
        if (Math.abs(newStock - original) > 0.0001 && !reason) {
          showError('Please enter an adjustment reason explaining why physical stock changed.');
          return;
        }

        var saveBtn = document.getElementById('btn-save-item-edit');
        setBusy(saveBtn, true, 'Saving changes…');
        try {
          if (window.CornerCravingsInventory && typeof window.CornerCravingsInventory.updateInventoryItem === 'function') {
            window.CornerCravingsInventory.updateInventoryItem(id, {
              name: name,
              category: category,
              unit: unit,
              stock: newStock,
              reorderLevel: reorder,
              unitCost: unitCost,
              supplier: supplier,
              adjustmentReason: reason
            });
          } else {
            var store = readStore();
            var target = store.items.find(function (it) { return Number(it.id) === Number(id); });
            if (target) {
              target.name = name;
              target.category = category;
              target.unit = unit;
              target.stock = newStock;
              target.reorderLevel = reorder;
              target.unitCost = unitCost;
              target.supplier = supplier;
              writeStore(store);
            }
          }
          await loadState();
          editDialog.close();
          renderInventoryMetrics();
          renderCatalog();
          renderReceipts();
          renderLedger();
          populateItemSelect(document.getElementById('stock-item'), true);
        } catch (err) {
          showError(err.message || 'Error updating item');
        } finally {
          setBusy(saveBtn, false);
        }
      });
    }

    var quickDialog = document.getElementById('quick-stockin-dialog');
    var quickForm = document.getElementById('quick-stockin-form');
    if (quickDialog && quickForm) {
      function closeQuick() { quickDialog.close(); }
      quickDialog.querySelectorAll('.inventory-dialog__close, .inventory-dialog__cancel').forEach(function (btn) {
        btn.addEventListener('click', closeQuick);
      });

      quickForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        var id = quickForm.elements.itemId.value;
        var qty = number(quickForm.elements.quantity.value);
        var cost = number(quickForm.elements.unitCost.value);
        var supplier = quickForm.elements.supplier.value.trim();
        var batch = quickForm.elements.batch.value.trim();
        var occurredAt = quickForm.elements.occurredAt.value;
        var expiry = quickForm.elements.expiryDate.value;

        if (qty <= 0 || !supplier || !batch || !occurredAt) {
          showError('Please complete quantity, supplier, batch/DR number, and date.');
          return;
        }

        var submitBtn = document.getElementById('btn-submit-quick-stockin');
        setBusy(submitBtn, true, 'Logging delivery…');
        try {
          var item = itemById(id);
          var result = await post('stock-in', {
            itemId: Number(id),
            quantity: qty,
            occurredAt: occurredAt + 'T' + new Date().toTimeString().slice(0, 8),
            reason: 'Delivery',
            batch: batch,
            supplier: supplier,
            unitCost: cost,
            expiryDate: expiry,
            status: 'POSTED',
            source: 'MANUAL'
          });
          await loadState();
          quickDialog.close();
          renderInventoryMetrics();
          renderCatalog();
          renderReceipts();
          renderLedger();
          populateItemSelect(document.getElementById('stock-item'), true);
          window.alert('Delivery of ' + quantity(qty) + ' ' + (item ? item.unit : '') + ' recorded successfully! Available stock is now ' + quantity(result.balanceAfter) + '.');
        } catch (err) {
          showError(err.message || 'Error recording delivery');
        } finally {
          setBusy(submitBtn, false);
        }
      });
    }

    var catalogBody = document.getElementById('catalog-table-body');
    if (catalogBody) {
      catalogBody.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-action]');
        if (!btn) return;
        var id = btn.dataset.id;
        var item = itemById(id);
        if (!item) return;

        if (btn.dataset.action === 'edit') {
          openEditModal(item);
        } else if (btn.dataset.action === 'quick-stockin') {
          openQuickStockInModal(item);
        }
      });
    }

    var catSearch = document.getElementById('catalog-search');
    if (catSearch) catSearch.addEventListener('input', renderCatalog);
    var catFilter = document.getElementById('catalog-category-filter');
    if (catFilter) catFilter.addEventListener('change', renderCatalog);
    var statFilter = document.getElementById('catalog-status-filter');
    if (statFilter) statFilter.addEventListener('change', renderCatalog);

    var ledSearch = document.getElementById('ledger-search');
    if (ledSearch) ledSearch.addEventListener('input', renderLedger);
    var ledType = document.getElementById('ledger-type-filter');
    if (ledType) ledType.addEventListener('change', renderLedger);

    var topSearch = document.getElementById('topbar-search-input') || document.querySelector('.topbar__search input');
    if (topSearch) {
      topSearch.addEventListener('input', function () {
        if (catSearch) catSearch.value = this.value;
        if (ledSearch) ledSearch.value = this.value;
        renderCatalog();
        renderReceipts();
        renderLedger();
      });
    }

    var quickAddBtn = document.getElementById('btn-quick-new-item');
    if (quickAddBtn) {
      quickAddBtn.addEventListener('click', function () {
        var dialog = ensureNewItemDialog(function (newItem) {
          renderInventoryMetrics();
          renderCatalog();
          renderLedger();
          populateItemSelect(document.getElementById('stock-item'), true);
        });
        dialog.showModal();
        dialog.querySelector('[name="name"]').focus();
      });
    }
  }

  function initStockIn() {
    var form = document.getElementById('stock-in-form'); if (!form) return;
    var itemSelect = document.getElementById('stock-item'); var category = document.getElementById('stock-category'); var received = document.getElementById('stock-date'); var unitLabel = document.getElementById('stock-unit-label');
    populateItemSelect(itemSelect, true); received.value = new Date().toISOString().slice(0, 10);
    itemSelect.addEventListener('change', function () {
      var item = itemById(this.value);
      category.value = item ? item.category : '';
      if (unitLabel) unitLabel.textContent = item ? '(' + item.unit + ')' : '';
      var costInput = document.getElementById('stock-unit-cost');
      var supplierInput = document.getElementById('stock-supplier');
      if (item && costInput && !costInput.value) costInput.value = (Number(item.unitCost) || 0).toFixed(2);
      if (item && supplierInput && !supplierInput.value) supplierInput.value = item.supplier || '';
    });
    var newItemButton = document.getElementById('new-inventory-item');
    if (newItemButton) newItemButton.addEventListener('click', function () {
      var dialog = ensureNewItemDialog(function (item) {
        populateItemSelect(itemSelect, true);
        itemSelect.value = item.id;
        itemSelect.dispatchEvent(new Event('change'));
        document.getElementById('stock-quantity').focus();
      });
      dialog.showModal();
      dialog.querySelector('[name="name"]').focus();
    });
    form.addEventListener('submit', async function (event) {
      event.preventDefault(); var button = form.querySelector('[type="submit"]'); var item = itemById(itemSelect.value); var amount = number(document.getElementById('stock-quantity').value);
      var supplier = document.getElementById('stock-supplier').value.trim(); var batch = document.getElementById('stock-batch').value.trim(); var unitCost = number(document.getElementById('stock-unit-cost').value); var expiry = document.getElementById('stock-expiry').value;
      if (!item || amount <= 0 || !received.value || !supplier || !batch) { showError('Select an item and complete quantity, supplier, batch/reference, and received date.'); return; }
      if (expiry && expiry < received.value) { showError('Expiry date cannot be earlier than the received date.'); return; }
      setBusy(button, true, 'Saving…');
      try {
        var result = await post('stock-in', { itemId: item.id, quantity: amount, occurredAt: received.value + 'T' + new Date().toTimeString().slice(0, 8), reason: 'Delivery', batch: batch, supplier: supplier, unitCost: unitCost, expiryDate: expiry, status: 'POSTED', source: 'MANUAL' });
        await loadState();
        renderReceipts();
        renderCatalog();
        renderLedger();
        renderInventoryMetrics();
        populateItemSelect(itemSelect, true);
        form.reset(); category.value = ''; if (unitLabel) unitLabel.textContent = ''; received.value = new Date().toISOString().slice(0, 10);
        window.alert('Delivery saved in this browser. Available stock: ' + quantity(result.balanceAfter) + ' ' + item.unit + '.');
      } catch (error) { showError(error.message); } finally { setBusy(button, false); }
    });
    renderReceipts();
  }

  function positionActionMenu(menu, action) {
    var rect = action.getBoundingClientRect();
    var menuWidth = 150;
    var left = Math.max(8, Math.min(window.innerWidth - menuWidth - 8, rect.right - menuWidth));
    var top = rect.bottom + 4;
    if (top + 95 > window.innerHeight) {
      top = Math.max(8, rect.top - 85);
    }
    menu.style.top = top + 'px';
    menu.style.left = left + 'px';
  }

  function renderReceipts() {
    var body = document.getElementById('receipt-body'); if (!body) return;
    var search = document.querySelector('.topbar__search input'); var query = search ? search.value.trim().toLowerCase() : '';
    var records = state.receipts.filter(function (record) {
      var item = itemById(record.itemId);
      var text = item ? [item.name, item.category, record.batch, record.supplier, record.status].join(' ').toLowerCase() : '';
      return item && (!query || text.indexOf(query) !== -1);
    }).sort(function (a, b) { return new Date(b.date) - new Date(a.date); });
    body.innerHTML = records.map(function (record) {
      var item = itemById(record.itemId);
      var detail = [record.batch || 'No reference', record.supplier || 'Supplier not recorded'].join(' · ');
      var voided = Boolean(record.reversedAt) || record.status === 'VOIDED' || record.status === 'REVERSED';
      var actions = '<button type="button" class="inventory-view-btn" data-receipt-action="view" data-id="' + record.id + '">View</button>';
      if (!voided) actions += '<button type="button" class="inventory-delete-btn" data-receipt-action="void" data-id="' + record.id + '">Delete</button>';
      return '<tr class="' + (voided ? 'inventory-row--voided' : '') + '"><td><div class="inventory-item"><span class="inventory-item__icon">◇</span><div><strong>' + escapeHtml(item.name) + '</strong><small>' + escapeHtml(detail) + '</small></div></div></td><td>' + escapeHtml(item.category) + '</td><td>' + quantity(record.quantity) + ' ' + escapeHtml(item.unit) + '</td><td>' + formatDate(record.date, false) + '</td><td><span class="inventory-status ' + statusClass(record.status) + '">' + escapeHtml(statusLabel(record.status)) + '</span></td><td class="inventory-action-cell"><div class="inventory-inline-actions">' + actions + '</div></td></tr>';
    }).join('');
    labelResponsiveTable(body.closest('table'));
    if (!body.dataset.actionsBound) {
      body.dataset.actionsBound = 'true';
      body.addEventListener('click', async function (event) {
        var action = event.target.closest('[data-receipt-action]'); if (!action) return;
        var record = state.receipts.find(function (entry) { return Number(entry.id) === Number(action.dataset.id); }); if (!record) return;
        var item = itemById(record.itemId);
        if (action.dataset.receiptAction === 'view') {
          var voidDetails = record.reversedAt ? '\n\nVOIDED\nVoided by: ' + (record.reversedBy || 'Admin User') + '\nVoided on: ' + formatDate(record.reversedAt, true) + '\nReason: ' + (record.reversalReason || 'Not recorded') + '\nBalance after void: ' + quantity(record.balanceAfterVoid) + ' ' + item.unit : '';
          window.alert(item.name + '\nReceived: ' + quantity(record.quantity) + ' ' + item.unit + '\nSupplier: ' + (record.supplier || 'Not recorded') + '\nBatch/reference: ' + (record.batch || 'Not recorded') + '\nUnit cost: ' + (record.unitCost ? '₱' + Number(record.unitCost).toFixed(2) : 'Not recorded') + '\nExpiry: ' + (record.expiryDate || 'Not recorded') + '\nBalance after receipt: ' + quantity(record.stockAfter) + ' ' + item.unit + '\nDate: ' + formatDate(record.date, true) + voidDetails);
        }
        if (action.dataset.receiptAction === 'void') {
          if (Number(record.quantity) > Number(item.stock)) {
            showError('This stock-in entry cannot be voided because part of the received stock has already been used. Available stock: ' + quantity(item.stock) + ' ' + item.unit + '.');
            return;
          }
          var reason = window.prompt('Reason for deleting this stock-in entry (required):'); if (!reason || !reason.trim()) return;
          var resultingStock = Math.round((Number(item.stock) - Number(record.quantity)) * 1000) / 1000;
          if (!window.confirm('Delete this stock-in entry?\n\n' + quantity(record.quantity) + ' ' + item.unit + ' will be removed from ' + item.name + '.\nCurrent stock: ' + quantity(item.stock) + ' ' + item.unit + '\nStock after deletion: ' + quantity(resultingStock) + ' ' + item.unit + '\n\nA record will remain in the audit history.')) return;
          try {
            await post('reverse', { transactionId: Number(record.id), reason: reason.trim(), actor: currentAdminActor() });
            await loadState();
            renderReceipts();
            renderCatalog();
            renderLedger();
            renderInventoryMetrics();
            populateItemSelect(document.getElementById('stock-item'), true);
          }
          catch (error) { showError(error.message); }
        }
      });
    }
    var count = document.getElementById('receipt-results-count'); if (count) count.textContent = records.length ? 'Showing 1–' + records.length + ' of ' + records.length + ' entries' : 'Showing 0 matching entries';
    var today = new Date().toISOString().slice(0, 10); var deliveries = state.receipts.filter(function (record) { return !record.reversedAt && record.status !== 'VOIDED' && record.status !== 'REVERSED' && String(record.date).slice(0, 10) === today; }).length;
    var deliveryCount = document.getElementById('delivery-count'); if (deliveryCount) deliveryCount.textContent = deliveries;
    var deliveryLabel = document.querySelector('.delivery-summary__value'); if (deliveryLabel) deliveryLabel.lastChild.textContent = deliveries === 1 ? ' delivery' : ' deliveries';
  }

  function ensureDialog() {
    var dialog = document.getElementById('dispatch-dialog'); if (dialog) return dialog;
    dialog = document.createElement('dialog'); dialog.id = 'dispatch-dialog'; dialog.className = 'inventory-dialog';
    dialog.innerHTML = '<form id="dispatch-form"><header><div><h2 id="dispatch-dialog-title">Record Stock Out</h2><p>Quantities cannot exceed available stock.</p></div><button type="button" class="inventory-dialog__close" aria-label="Close">×</button></header><input type="hidden" name="recordId"><div class="inventory-dialog__grid"><label>Item<select name="itemId" required></select></label><label>Quantity<input name="quantity" type="number" min="0.001" step="0.001" required></label><label>Reason<select name="reason" required><option>Daily Prep</option><option>Spoilage</option><option>Stock Transfer</option><option>Damaged</option><option>Staff Meal</option><option>Other</option></select></label><label>Date dispatched<input name="date" type="datetime-local" required></label></div><p class="inventory-dialog__stock" id="dispatch-stock-help"></p><footer><button type="button" class="btn-outline inventory-dialog__cancel">Cancel</button><button type="submit" class="btn-solid-sm">Save Dispatch</button></footer></form>';
    document.body.appendChild(dialog); var form = dialog.querySelector('form');
    form.querySelector('.inventory-dialog__grid').insertAdjacentHTML('beforeend', '<label class="inventory-dialog__wide">Notes / reference<input name="notes" type="text" maxlength="120" placeholder="Required for Other; optional otherwise"></label>');
    populateItemSelect(form.elements.itemId, false);
    function close() { dialog.close(); }
    dialog.querySelector('.inventory-dialog__close').addEventListener('click', close); dialog.querySelector('.inventory-dialog__cancel').addEventListener('click', close);
    function stockHelp() { var item = itemById(form.elements.itemId.value); document.getElementById('dispatch-stock-help').textContent = item ? 'Available: ' + quantity(item.stock) + ' ' + item.unit : ''; }
    form.elements.itemId.addEventListener('change', stockHelp); form.elements.quantity.addEventListener('input', stockHelp);
    form.addEventListener('submit', async function (event) {
      event.preventDefault(); var button = form.querySelector('[type="submit"]'); var item = itemById(form.elements.itemId.value); var amount = number(form.elements.quantity.value); var recordId = form.elements.recordId.value;
      if (!item || amount <= 0) { showError('Choose an item and enter a valid quantity.'); return; }
      if (form.elements.reason.value === 'Other' && !form.elements.notes.value.trim()) { showError('Enter notes when the stock-out reason is Other.'); return; }
      setBusy(button, true, 'Saving…');
      try {
        await post(recordId ? 'correct' : 'stock-out', { transactionId: recordId ? Number(recordId) : undefined, itemId: Number(item.id), quantity: amount, reason: form.elements.reason.value, notes: form.elements.notes.value.trim(), batch: 'OUT-' + Date.now().toString().slice(-8), source: 'MANUAL', occurredAt: form.elements.date.value + ':00' });
        await loadState(); dialog.close(); currentPage = 1; renderDispatches(); refreshDialogItems();
      } catch (error) { showError(error.message); } finally { setBusy(button, false); }
    });
    return dialog;
  }

  function refreshDialogItems() { var dialog = document.getElementById('dispatch-dialog'); if (dialog) populateItemSelect(dialog.querySelector('[name="itemId"]'), false); }
  function openDispatch(record) {
    var dialog = ensureDialog(); var form = dialog.querySelector('form'); form.reset(); refreshDialogItems();
    form.elements.recordId.value = record ? record.id : ''; form.elements.itemId.value = record ? record.itemId : state.items[0] ? state.items[0].id : ''; form.elements.quantity.value = record ? quantity(record.quantity) : ''; form.elements.reason.value = record ? record.reason : 'Daily Prep'; form.elements.notes.value = record ? (record.notes || '') : ''; form.elements.date.value = record ? String(record.date).slice(0, 16) : localDateTime();
    document.getElementById('dispatch-dialog-title').textContent = record ? 'Correct Stock Out Record' : 'Record Stock Out'; form.elements.itemId.dispatchEvent(new Event('change')); dialog.showModal();
  }

  function initStockOut() {
    var body = document.getElementById('stock-out-body'); if (!body) return;
    document.getElementById('new-dispatch-button').addEventListener('click', function () { openDispatch(null); });
    var search = document.getElementById('inventory-search'); search.addEventListener('input', function () { currentPage = 1; renderDispatches(); });
    var topSearch = document.querySelector('.topbar__search input'); if (topSearch) topSearch.addEventListener('input', function () { search.value = this.value; currentPage = 1; renderDispatches(); });
    document.querySelector('.inventory-pagination').addEventListener('click', function (event) { var page = event.target.getAttribute('data-page'); if (!page) return; var pages = Math.max(1, Math.ceil(filteredDispatches().length / PAGE_SIZE)); currentPage = page === 'prev' ? Math.max(1, currentPage - 1) : page === 'next' ? Math.min(pages, currentPage + 1) : Number(page); renderDispatches(); });
    body.addEventListener('click', async function (event) {
      var action = event.target.closest('[data-inventory-action]'); if (!action) return; var record = state.dispatches.find(function (entry) { return Number(entry.id) === Number(action.dataset.id); }); if (!record) return;
      if (action.dataset.inventoryAction === 'menu') { var menu = action.nextElementSibling; document.querySelectorAll('.inventory-action-menu.is-open').forEach(function (other) { if (other !== menu) other.classList.remove('is-open'); }); var opening = !menu.classList.contains('is-open'); menu.classList.toggle('is-open', opening); if (opening) positionActionMenu(menu, action); return; }
      if (action.dataset.inventoryAction === 'view') { var item = itemById(record.itemId); window.alert(item.name + '\nRemoved: ' + quantity(record.quantity) + ' ' + item.unit + '\nReason: ' + record.reason + '\nNotes/reference: ' + (record.notes || record.batch || 'Not recorded') + '\nSource: ' + (isSystemTransaction(record) ? 'Customer order' : 'Manual stock-out') + '\nBalance after dispatch: ' + quantity(record.stockAfter) + ' ' + item.unit + '\nDate: ' + formatDate(record.date, true)); }
      if (action.dataset.inventoryAction === 'edit') { if (isSystemTransaction(record)) { showError('Order-generated usage must be corrected from the order workflow.'); return; } openDispatch(record); }
      if (action.dataset.inventoryAction === 'reverse') {
        var reason = window.prompt('Reason for reversing this dispatch:'); if (!reason) return;
        try { await post('reverse', { transactionId: Number(record.id), reason: reason.trim() }); await loadState(); renderDispatches(); refreshDialogItems(); } catch (error) { showError(error.message); }
      }
    });
    document.addEventListener('click', function (event) { if (!event.target.closest('.inventory-action-cell')) document.querySelectorAll('.inventory-action-menu.is-open').forEach(function (menu) { menu.classList.remove('is-open'); }); });
    renderDispatches();
  }

  function filteredDispatches() { var search = document.getElementById('inventory-search'); var query = search ? search.value.trim().toLowerCase() : ''; return state.dispatches.filter(function (record) { var item = itemById(record.itemId); return item && (!query || (item.name + ' ' + item.category + ' ' + record.reason).toLowerCase().indexOf(query) !== -1); }); }
  function renderDispatches() {
    var body = document.getElementById('stock-out-body'); if (!body) return;
    var records = filteredDispatches().sort(function (a, b) { return new Date(b.date) - new Date(a.date); });
    var pages = Math.max(1, Math.ceil(records.length / PAGE_SIZE)); if (currentPage > pages) currentPage = pages;
    var start = (currentPage - 1) * PAGE_SIZE; var shown = records.slice(start, start + PAGE_SIZE);
    body.innerHTML = shown.map(function (record) {
      var item = itemById(record.itemId); var low = Number(record.stockAfter) <= Number(item.reorderLevel); var system = isSystemTransaction(record);
      var actions = '<button type="button" data-inventory-action="view" data-id="' + record.id + '">View details</button>';
      if (!system) actions += '<button type="button" data-inventory-action="edit" data-id="' + record.id + '">Correct record</button><button type="button" class="is-danger" data-inventory-action="reverse" data-id="' + record.id + '">Reverse dispatch</button>';
      return '<tr><td><div class="inventory-item"><div><strong>' + escapeHtml(item.name) + '</strong><small>' + escapeHtml(system ? 'Customer order usage' : (record.notes || item.unit)) + '</small></div></div></td><td>' + escapeHtml(item.category) + '</td><td class="inventory-qty--out">−' + quantity(record.quantity) + ' ' + escapeHtml(item.unit) + '</td><td class="' + (low ? 'inventory-stock--low' : '') + '">' + quantity(record.stockAfter) + ' ' + escapeHtml(item.unit) + '</td><td><span class="inventory-status ' + statusClass(record.reason) + '">' + escapeHtml(record.reason) + '</span></td><td>' + formatDate(record.date, true) + '</td><td class="inventory-action-cell"><button class="inventory-row-action" type="button" data-inventory-action="menu" data-id="' + record.id + '" aria-label="Actions for ' + escapeHtml(item.name) + '">⋮</button><div class="inventory-action-menu" role="menu">' + actions + '</div></td></tr>';
    }).join('');
    labelResponsiveTable(body.closest('table'));
    document.getElementById('inventory-empty').style.display = records.length ? 'none' : 'block';
    document.getElementById('inventory-results-count').textContent = records.length ? 'Showing ' + (start + 1) + ' to ' + (start + shown.length) + ' of ' + records.length + ' entries' : 'Showing 0 entries';
    var buttons = ''; for (var page = 1; page <= pages; page += 1) buttons += '<button type="button" data-page="' + page + '" class="' + (page === currentPage ? 'is-current' : '') + '">' + page + '</button>';
    document.getElementById('inventory-page-buttons').innerHTML = buttons;
    var nav = document.querySelector('.inventory-pagination'); nav.querySelector('[data-page="prev"]').disabled = currentPage === 1; nav.querySelector('[data-page="next"]').disabled = currentPage === pages;
  }

  var refreshQueued = false;
  function scheduleUnifiedInventoryRefresh() {
    if (refreshQueued) return;
    refreshQueued = true;
    window.setTimeout(async function () {
      refreshQueued = false;
      await loadState();
      renderInventoryMetrics();
      renderCatalog();
      renderReceipts();
      renderLedger();
      renderDispatches();
      refreshDialogItems();
      populateItemSelect(document.getElementById('stock-item'), true);
    }, 0);
  }

  async function start() {
    if (typeof document === 'undefined') return;
    try {
      await loadState();
      initTabs();
      initItemModals();
      renderInventoryMetrics();
      renderCatalog();
      renderLedger();
      initStockIn();
      initStockOut();
      window.addEventListener('cornercravings:inventory-updated', scheduleUnifiedInventoryRefresh);
      window.addEventListener('storage', function (event) {
        if (event.key === STORAGE_KEY) scheduleUnifiedInventoryRefresh();
      });
    } catch (error) {
      showError(error.message);
      document.querySelectorAll('#stock-in-form button, #new-dispatch-button').forEach(function (button) { button.disabled = true; });
    }
  }
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', start);
    } else {
      start();
    }
  }
})();
