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

  function escapeHtml(value) { var node = document.createElement('div'); node.textContent = String(value == null ? '' : value); return node.innerHTML; }
  function itemById(id) { return state.items.find(function (item) { return Number(item.id) === Number(id); }); }
  function number(value) { return Number.parseFloat(value) || 0; }
  function quantity(value) { var parsed = number(value); return Number.isInteger(parsed) ? String(parsed) : parsed.toFixed(3).replace(/0+$/, '').replace(/\.$/, ''); }
  function formatDate(value, withTime) {
    var date = new Date(value && value.length === 10 ? value + 'T00:00:00' : value);
    if (Number.isNaN(date.getTime())) return value || '—';
    return new Intl.DateTimeFormat('en-PH', withTime ? { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' } : { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
  }
  function localDateTime() { var now = new Date(); return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16); }
  function statusClass(status) {
    if (status === 'PENDING_QC' || status === 'Pending QC') return 'inventory-status--pending';
    if (status === 'Spoilage') return 'inventory-status--spoilage';
    if (status === 'Stock Transfer') return 'inventory-status--transfer';
    if (status === 'POSTED' || status === 'Verified') return 'inventory-status--verified';
    return 'inventory-status--daily';
  }
  function statusLabel(status) { return status === 'PENDING_QC' ? 'Pending QC' : status === 'POSTED' ? 'Verified' : status; }

  function readStore() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || JSON.parse(JSON.stringify(DEFAULT_DATA)); }
    catch (error) { return JSON.parse(JSON.stringify(DEFAULT_DATA)); }
  }
  function writeStore(data) { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
  function post(action, data) {
    var store = readStore(); var item = store.items.find(function (entry) { return Number(entry.id) === Number(data.itemId); }); var record;
    if (action === 'reverse') {
      record = store.transactions.find(function (entry) { return Number(entry.id) === Number(data.transactionId) && !entry.reversedAt; });
      if (!record) return Promise.reject(new Error('Dispatch record was not found or is already reversed.'));
      item = store.items.find(function (entry) { return Number(entry.id) === Number(record.itemId); }); item.stock += Number(record.quantity); record.reversedAt = new Date().toISOString(); record.status = 'REVERSED'; writeStore(store); return Promise.resolve({ ok: true, balanceAfter: item.stock });
    }
    if (action === 'correct') {
      record = store.transactions.find(function (entry) { return Number(entry.id) === Number(data.transactionId) && !entry.reversedAt; });
      if (!record) return Promise.reject(new Error('Stock-out record was not found.'));
      var oldItem = store.items.find(function (entry) { return Number(entry.id) === Number(record.itemId); }); oldItem.stock += Number(record.quantity);
      if (!item || Number(data.quantity) > item.stock) { oldItem.stock -= Number(record.quantity); return Promise.reject(new Error('Quantity exceeds available stock.')); }
      record.reversedAt = new Date().toISOString(); record.status = 'REVERSED';
    }
    if (!item) return Promise.reject(new Error('Choose a valid inventory item.'));
    var amount = Number(data.quantity); var type = action === 'stock-in' ? 'IN' : 'OUT';
    if (type === 'OUT' && amount > item.stock) return Promise.reject(new Error('Insufficient stock. Available: ' + quantity(item.stock) + ' ' + item.unit + '.'));
    item.stock += type === 'IN' ? amount : -amount;
    store.transactions.push({ id: Date.now(), itemId: Number(item.id), type: type, quantity: amount, reason: data.reason || 'Delivery', batch: data.batch || '', stockAfter: item.stock, status: data.status || 'POSTED', date: data.occurredAt });
    writeStore(store); return Promise.resolve({ ok: true, balanceAfter: item.stock });
  }
  function setBusy(button, busy, label) { if (!button) return; if (busy) button.dataset.originalLabel = button.textContent; button.disabled = busy; button.textContent = busy ? label : (button.dataset.originalLabel || button.textContent); }
  function showError(message) { window.alert(message); }

  async function loadState() {
    var payload = readStore();
    state.items = payload.items.map(function (item) { item.stock = number(item.stock); item.reorderLevel = number(item.reorderLevel); return item; });
    var active = payload.transactions.filter(function (transaction) { return !transaction.reversedAt && transaction.status !== 'REVERSED'; });
    state.receipts = active.filter(function (transaction) { return transaction.type === 'IN'; });
    state.dispatches = active.filter(function (transaction) { return transaction.type === 'OUT'; });
  }

  function populateItemSelect(select, includePlaceholder) {
    var selected = select.value;
    select.innerHTML = (includePlaceholder ? '<option value="">Choose an item</option>' : '') + state.items.slice().sort(function (a, b) { return a.name.localeCompare(b.name); }).map(function (item) {
      return '<option value="' + item.id + '">' + escapeHtml(item.name) + (includePlaceholder ? '' : ' (' + quantity(item.stock) + ' ' + escapeHtml(item.unit) + ')') + '</option>';
    }).join('');
    if (selected) select.value = selected;
  }

  function initStockIn() {
    var form = document.getElementById('stock-in-form'); if (!form) return;
    var itemSelect = document.getElementById('stock-item'); var category = document.getElementById('stock-category'); var received = document.getElementById('stock-date');
    populateItemSelect(itemSelect, true); received.value = new Date().toISOString().slice(0, 10);
    itemSelect.addEventListener('change', function () { var item = itemById(this.value); category.value = item ? item.category : ''; });
    form.addEventListener('submit', async function (event) {
      event.preventDefault(); var button = form.querySelector('[type="submit"]'); var item = itemById(itemSelect.value); var amount = number(document.getElementById('stock-quantity').value);
      if (!item || amount <= 0 || !received.value) { showError('Select an item, enter a valid quantity, and choose the received date.'); return; }
      setBusy(button, true, 'Saving…');
      try {
        var result = await post('stock-in', { itemId: item.id, quantity: amount, occurredAt: received.value + 'T' + new Date().toTimeString().slice(0, 8), reason: 'Delivery', batch: item.sku + '-' + Date.now().toString().slice(-6), status: 'POSTED' });
        await loadState(); renderReceipts(); populateItemSelect(itemSelect, true); form.reset(); category.value = ''; received.value = new Date().toISOString().slice(0, 10);
        window.alert('Delivery saved in this browser. Available stock: ' + quantity(result.balanceAfter) + ' ' + item.unit + '.');
      } catch (error) { showError(error.message); } finally { setBusy(button, false); }
    });
    var topSearch = document.querySelector('.topbar__search input'); if (topSearch) topSearch.addEventListener('input', renderReceipts);
    renderReceipts();
  }

  function renderReceipts() {
    var body = document.getElementById('receipt-body'); if (!body) return;
    var search = document.querySelector('.topbar__search input'); var query = search ? search.value.trim().toLowerCase() : '';
    var records = state.receipts.filter(function (record) { var item = itemById(record.itemId); return item && (!query || (item.name + ' ' + item.category + ' ' + (record.batch || '') + ' ' + record.status).toLowerCase().indexOf(query) !== -1); });
    body.innerHTML = records.map(function (record) { var item = itemById(record.itemId); return '<tr><td><div class="inventory-item"><span class="inventory-item__icon">◇</span><div><strong>' + escapeHtml(item.name) + '</strong><small>' + escapeHtml(record.batch || 'No batch') + '</small></div></div></td><td>' + escapeHtml(item.category) + '</td><td>' + quantity(record.quantity) + ' ' + escapeHtml(item.unit) + '</td><td>' + formatDate(record.date, false) + '</td><td><span class="inventory-status ' + statusClass(record.status) + '">' + escapeHtml(statusLabel(record.status)) + '</span></td></tr>'; }).join('');
    var count = document.getElementById('receipt-results-count'); if (count) count.textContent = records.length ? 'Showing 1–' + records.length + ' of ' + records.length + ' entries' : 'Showing 0 matching entries';
    var today = new Date().toISOString().slice(0, 10); var deliveries = state.receipts.filter(function (record) { return String(record.date).slice(0, 10) === today; }).length;
    var deliveryCount = document.getElementById('delivery-count'); if (deliveryCount) deliveryCount.textContent = deliveries;
    var deliveryLabel = document.querySelector('.delivery-summary__value'); if (deliveryLabel) deliveryLabel.lastChild.textContent = deliveries === 1 ? ' delivery' : ' deliveries';
  }

  function ensureDialog() {
    var dialog = document.getElementById('dispatch-dialog'); if (dialog) return dialog;
    dialog = document.createElement('dialog'); dialog.id = 'dispatch-dialog'; dialog.className = 'inventory-dialog';
    dialog.innerHTML = '<form id="dispatch-form"><header><div><h2 id="dispatch-dialog-title">Record Stock Out</h2><p>Quantities cannot exceed available stock.</p></div><button type="button" class="inventory-dialog__close" aria-label="Close">×</button></header><input type="hidden" name="recordId"><div class="inventory-dialog__grid"><label>Item<select name="itemId" required></select></label><label>Quantity<input name="quantity" type="number" min="0.001" step="0.001" required></label><label>Reason<select name="reason" required><option>Daily Prep</option><option>Spoilage</option><option>Stock Transfer</option><option>Damaged</option><option>Staff Meal</option><option>Other</option></select></label><label>Date dispatched<input name="date" type="datetime-local" required></label></div><p class="inventory-dialog__stock" id="dispatch-stock-help"></p><footer><button type="button" class="btn-outline inventory-dialog__cancel">Cancel</button><button type="submit" class="btn-solid-sm">Save Dispatch</button></footer></form>';
    document.body.appendChild(dialog); var form = dialog.querySelector('form'); populateItemSelect(form.elements.itemId, false);
    function close() { dialog.close(); }
    dialog.querySelector('.inventory-dialog__close').addEventListener('click', close); dialog.querySelector('.inventory-dialog__cancel').addEventListener('click', close);
    function stockHelp() { var item = itemById(form.elements.itemId.value); document.getElementById('dispatch-stock-help').textContent = item ? 'Available: ' + quantity(item.stock) + ' ' + item.unit : ''; }
    form.elements.itemId.addEventListener('change', stockHelp); form.elements.quantity.addEventListener('input', stockHelp);
    form.addEventListener('submit', async function (event) {
      event.preventDefault(); var button = form.querySelector('[type="submit"]'); var item = itemById(form.elements.itemId.value); var amount = number(form.elements.quantity.value); var recordId = form.elements.recordId.value;
      if (!item || amount <= 0) { showError('Choose an item and enter a valid quantity.'); return; }
      setBusy(button, true, 'Saving…');
      try {
        await post(recordId ? 'correct' : 'stock-out', { transactionId: recordId ? Number(recordId) : undefined, itemId: Number(item.id), quantity: amount, reason: form.elements.reason.value, occurredAt: form.elements.date.value.replace('T', ' ') + ':00' });
        await loadState(); dialog.close(); currentPage = 1; renderDispatches(); refreshDialogItems();
      } catch (error) { showError(error.message); } finally { setBusy(button, false); }
    });
    return dialog;
  }

  function refreshDialogItems() { var dialog = document.getElementById('dispatch-dialog'); if (dialog) populateItemSelect(dialog.querySelector('[name="itemId"]'), false); }
  function openDispatch(record) {
    var dialog = ensureDialog(); var form = dialog.querySelector('form'); form.reset(); refreshDialogItems();
    form.elements.recordId.value = record ? record.id : ''; form.elements.itemId.value = record ? record.itemId : state.items[0] ? state.items[0].id : ''; form.elements.quantity.value = record ? quantity(record.quantity) : ''; form.elements.reason.value = record ? record.reason : 'Daily Prep'; form.elements.date.value = record ? String(record.date).slice(0, 16) : localDateTime();
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
      if (action.dataset.inventoryAction === 'menu') { var menu = action.nextElementSibling; document.querySelectorAll('.inventory-action-menu.is-open').forEach(function (other) { if (other !== menu) other.classList.remove('is-open'); }); var opening = !menu.classList.contains('is-open'); menu.classList.toggle('is-open', opening); if (opening) { var rect = action.getBoundingClientRect(); menu.style.top = rect.bottom + 4 + 'px'; menu.style.left = Math.max(8, rect.right - 150) + 'px'; } return; }
      if (action.dataset.inventoryAction === 'view') { var item = itemById(record.itemId); window.alert(item.name + '\nRemoved: ' + quantity(record.quantity) + ' ' + item.unit + '\nReason: ' + record.reason + '\nBalance after dispatch: ' + quantity(record.stockAfter) + ' ' + item.unit + '\nDate: ' + formatDate(record.date, true)); }
      if (action.dataset.inventoryAction === 'edit') openDispatch(record);
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
    var body = document.getElementById('stock-out-body'); if (!body) return; var records = filteredDispatches(); var pages = Math.max(1, Math.ceil(records.length / PAGE_SIZE)); if (currentPage > pages) currentPage = pages; var start = (currentPage - 1) * PAGE_SIZE; var shown = records.slice(start, start + PAGE_SIZE);
    body.innerHTML = shown.map(function (record) { var item = itemById(record.itemId); var low = item.stock <= item.reorderLevel; return '<tr><td><div class="inventory-item"><div><strong>' + escapeHtml(item.name) + '</strong><small>' + escapeHtml(item.unit) + '</small></div></div></td><td>' + escapeHtml(item.category) + '</td><td class="inventory-qty--out">−' + quantity(record.quantity) + ' ' + escapeHtml(item.unit) + '</td><td class="' + (low ? 'inventory-stock--low' : '') + '">' + quantity(item.stock) + ' ' + escapeHtml(item.unit) + '</td><td><span class="inventory-status ' + statusClass(record.reason) + '">' + escapeHtml(record.reason) + '</span></td><td>' + formatDate(record.date, true) + '</td><td class="inventory-action-cell"><button class="inventory-row-action" type="button" data-inventory-action="menu" data-id="' + record.id + '" aria-label="Actions for ' + escapeHtml(item.name) + '">⋮</button><div class="inventory-action-menu" role="menu"><button type="button" data-inventory-action="view" data-id="' + record.id + '">View details</button><button type="button" data-inventory-action="edit" data-id="' + record.id + '">Correct record</button><button type="button" class="is-danger" data-inventory-action="reverse" data-id="' + record.id + '">Reverse dispatch</button></div></td></tr>'; }).join('');
    document.getElementById('inventory-empty').style.display = records.length ? 'none' : 'block'; document.getElementById('inventory-results-count').textContent = records.length ? 'Showing ' + (start + 1) + ' to ' + (start + shown.length) + ' of ' + records.length + ' entries' : 'Showing 0 entries';
    var buttons = ''; for (var page = 1; page <= pages; page++) buttons += '<button type="button" data-page="' + page + '" class="' + (page === currentPage ? 'is-current' : '') + '">' + page + '</button>'; document.getElementById('inventory-page-buttons').innerHTML = buttons; var nav = document.querySelector('.inventory-pagination'); nav.querySelector('[data-page="prev"]').disabled = currentPage === 1; nav.querySelector('[data-page="next"]').disabled = currentPage === pages;
  }

  async function start() {
    try { await loadState(); initStockIn(); initStockOut(); }
    catch (error) { showError(error.message); document.querySelectorAll('#stock-in-form button, #new-dispatch-button').forEach(function (button) { button.disabled = true; }); }
  }
  start();
})();
