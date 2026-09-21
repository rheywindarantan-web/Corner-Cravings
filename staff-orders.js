(function () {
  'use strict';
  var STORE = 'cornerCravingsAdminOrders';
  var PAGE_SIZE = 10;
  var currentPage = 1;
  var page = location.pathname.toLowerCase();
  var isHistory = page.endsWith('/staff-history.html') || page.endsWith('staff-history.html');
  var table = document.querySelector('.staff-table');
  var tbody = table && table.querySelector('tbody');
  if (!tbody) return;

  function escapeHtml(value) { var node = document.createElement('div'); node.textContent = value == null ? '' : String(value); return node.innerHTML; }
  function readOrders() { try { var value = JSON.parse(localStorage.getItem(STORE) || '[]'); return Array.isArray(value) ? value : []; } catch (error) { return []; } }
  function writeOrders(orders) { localStorage.setItem(STORE, JSON.stringify(orders)); window.dispatchEvent(new CustomEvent('cornercravings:orders-updated')); }
  function terminal(order) { return order.status === 'Completed' || order.status === 'Cancelled'; }
  function total(order) {
    if (order.totals && Number.isFinite(Number(order.totals.total))) return Number(order.totals.total);
    if (Number.isFinite(Number(order.total))) return Number(order.total);
    return (order.items || []).reduce(function (sum, item) { return sum + Number(item.price || 0) * Number(item.quantity || 0); }, 0);
  }
  function peso(value) { return '₱' + Number(value || 0).toFixed(2); }
  function time(value) { return new Date(value).toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' }); }
  function date(value) { return new Date(value).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }); }
  function elapsed(value) { var mins = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000)); return mins < 60 ? mins + 'm ago' : Math.floor(mins / 60) + 'h ago'; }
  function statusClass(status) { return status === 'Preparing' ? 'progress' : String(status || 'Pending').toLowerCase(); }
  function statusLabel(status) { return status === 'Preparing' ? 'In Progress' : status; }
  function itemsText(order) { return (order.items || []).map(function (item) { return Number(item.quantity || 1) + '× ' + item.name; }).join(', '); }
  function nextAction(order) {
    if (order.status === 'Pending') return '<button class="action-btn action-btn--outline" type="button" data-order-action="Preparing" data-order-id="' + escapeHtml(order.id) + '">Start Prep</button>';
    if (order.status === 'Preparing') return '<button class="action-btn" type="button" data-order-action="Ready" data-order-id="' + escapeHtml(order.id) + '">Mark Ready</button>';
    if (order.status === 'Ready') return '<button class="action-btn" type="button" data-order-action="Completed" data-order-id="' + escapeHtml(order.id) + '">Complete</button>';
    return '';
  }
  function filtered() {
    var orders = readOrders().filter(function (order) { return isHistory ? terminal(order) : !terminal(order); });
    var search = document.querySelector('.staff-search input');
    var filter = document.querySelector('.staff-filter-select');
    var query = search ? search.value.trim().toLowerCase() : '';
    var selected = filter ? filter.value : 'all';
    orders = orders.filter(function (order) {
      var mapped = statusClass(order.status);
      return (!query || (order.id + ' ' + order.customer + ' ' + itemsText(order)).toLowerCase().indexOf(query) !== -1) && (selected === 'all' || selected === mapped);
    });
    return orders.sort(function (a, b) { return new Date(b.placedAt) - new Date(a.placedAt); });
  }
  function updateStats(all) {
    var active = all.filter(function (order) { return !terminal(order); });
    var pending = active.filter(function (order) { return order.status === 'Pending'; }).length;
    var preparing = active.filter(function (order) { return order.status === 'Preparing'; }).length;
    var ready = active.filter(function (order) { return order.status === 'Ready'; }).length;
    var completedToday = all.filter(function (order) { return order.status === 'Completed' && String(order.updatedAt || order.placedAt).slice(0, 10) === new Date().toISOString().slice(0, 10); }).length;
    var values = document.querySelectorAll('.stat-card__value');
    if (!isHistory) {
      var completedWithTimes = all.filter(function (order) { return order.status === 'Completed' && order.updatedAt; });
      var avgMinutes = completedWithTimes.length ? Math.round(completedWithTimes.reduce(function (sum, order) { return sum + Math.max(0, new Date(order.updatedAt) - new Date(order.placedAt)) / 60000; }, 0) / completedWithTimes.length) : 0;
      if (values[0]) values[0].textContent = pending;
      if (values[1]) values[1].textContent = preparing;
      if (values[2]) values[2].textContent = ready;
      if (values[3]) values[3].textContent = avgMinutes ? avgMinutes + 'm' : '—';
    } else {
      var completed = all.filter(function (order) { return order.status === 'Completed'; });
      var revenue = completed.reduce(function (sum, order) { return sum + total(order); }, 0);
      var counts = {};
      completed.forEach(function (order) { (order.items || []).forEach(function (item) { counts[item.name] = (counts[item.name] || 0) + Number(item.quantity || 0); }); });
      var top = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; })[0] || 'No sales yet';
      if (values[0]) values[0].textContent = all.filter(terminal).length;
      if (values[1]) values[1].textContent = peso(revenue);
      if (values[2]) values[2].textContent = completed.length ? peso(revenue / completed.length) : peso(0);
      if (values[3]) values[3].textContent = top;
    }
  }
  function render() {
    var all = readOrders();
    updateStats(all);
    var orders = filtered();
    var pages = Math.max(1, Math.ceil(orders.length / PAGE_SIZE));
    if (currentPage > pages) currentPage = pages;
    var start = (currentPage - 1) * PAGE_SIZE;
    var visible = orders.slice(start, start + PAGE_SIZE);
    if (isHistory) {
      tbody.innerHTML = visible.map(function (order) {
        return '<tr><td class="cell-primary" data-label="Order">#ORD-' + escapeHtml(order.id) + '</td><td data-label="Date">' + date(order.placedAt) + '<div class="cell-sub">' + time(order.placedAt) + '</div></td><td data-label="Customer">' + escapeHtml(order.customer || 'Customer') + '</td><td data-label="Items">' + escapeHtml(itemsText(order)) + '</td><td class="cell-primary" data-label="Total">' + peso(total(order)) + '</td><td data-label="Status"><span class="pill pill--' + statusClass(order.status) + '"><span class="pill__dot"></span>' + escapeHtml(order.status) + '</span></td></tr>';
      }).join('');
    } else {
      tbody.innerHTML = visible.map(function (order) {
        var note = order.notes ? '<div class="cell-sub">' + escapeHtml(order.notes) + '</div>' : '';
        return '<tr><td data-label="Order"><div class="cell-primary">#ORD-' + escapeHtml(order.id) + '</div><div class="cell-sub">' + escapeHtml(order.delivery && order.delivery.method === 'pickup' ? 'Pickup' : 'Delivery') + '</div></td><td data-label="Items">' + escapeHtml(itemsText(order)) + note + '</td><td data-label="Placed">' + time(order.placedAt) + '<div class="cell-sub">' + elapsed(order.placedAt) + '</div></td><td data-label="Status"><span class="pill pill--' + statusClass(order.status) + '"><span class="pill__dot"></span>' + escapeHtml(statusLabel(order.status)) + '</span></td><td data-label="Actions" style="text-align:right">' + nextAction(order) + '</td></tr>';
      }).join('');
    }
    if (!visible.length) tbody.innerHTML = '<tr><td colspan="6"><div class="staff-empty-state"><strong>No ' + (isHistory ? 'completed' : 'active') + ' orders</strong><span>Orders will appear here automatically.</span></div></td></tr>';
    var showing = document.querySelector('.showing-text');
    if (showing) showing.textContent = orders.length ? 'Showing ' + (start + 1) + ' to ' + (start + visible.length) + ' of ' + orders.length + ' orders' : 'Showing 0 orders';
  }

  tbody.addEventListener('click', function (event) {
    var button = event.target.closest('[data-order-action]');
    if (!button) return;
    var orders = readOrders();
    var order = orders.find(function (entry) { return String(entry.id) === String(button.dataset.orderId); });
    if (!order) return;
    order.status = button.dataset.orderAction;
    order.updatedAt = new Date().toISOString();
    order.statusUpdatedAt = order.updatedAt;
    writeOrders(orders);
    render();
  });
  var search = document.querySelector('.staff-search input');
  if (search) search.addEventListener('input', function () { currentPage = 1; render(); });
  var filter = document.querySelector('.staff-filter-select');
  if (filter) filter.addEventListener('change', function () { currentPage = 1; render(); });
  var exportButton = document.querySelector('[data-export-orders]');
  if (exportButton) exportButton.addEventListener('click', function () {
    var rows = [['Order ID', 'Date', 'Customer', 'Items', 'Total', 'Status']].concat(filtered().map(function (order) { return [order.id, order.placedAt, order.customer, itemsText(order), total(order), order.status]; }));
    var csv = rows.map(function (row) { return row.map(function (cell) { return '"' + String(cell == null ? '' : cell).replace(/"/g, '""') + '"'; }).join(','); }).join('\n');
    var link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); link.download = 'corner-cravings-order-history.csv'; link.click(); URL.revokeObjectURL(link.href);
  });
  window.addEventListener('storage', render);
  window.addEventListener('cornercravings:orders-updated', render);
  render();
})();
