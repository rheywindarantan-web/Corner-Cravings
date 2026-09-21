(function () {
  'use strict';

  var STORAGE_KEY = 'cornerCravingsAdminOrders';
  var LAST_UPDATED_KEY = 'cornerCravingsLastUpdatedOrder';
  var PAGE_SIZE = 5;
  var currentPage = 1;

  var DEFAULT_ORDERS = [
    { id: '8824', customer: 'Yashimin Flores', email: 'yashimin@example.com', placedAt: '2026-09-18T12:30:00', status: 'Preparing', items: [{ name: 'Cheesy Burger', option: 'Classic', quantity: 1, price: 250 }, { name: 'Special Spaghetti', option: 'Signature sauce', quantity: 1, price: 125 }, { name: 'Large Drip Coffee', option: 'Dark Roast', quantity: 1, price: 59 }], notes: '' },
    { id: '8825', customer: 'Belle Mariano', email: 'belle@example.com', placedAt: '2026-09-18T12:45:00', status: 'Pending', items: [{ name: 'Classic Creamy Carbonara', option: 'Regular', quantity: 1, price: 135 }], notes: '' },
    { id: '8822', customer: 'Dan Santos', email: 'dan@example.com', placedAt: '2026-09-18T13:00:00', status: 'Ready', items: [{ name: 'Hotsilog', option: 'Regular', quantity: 2, price: 110 }, { name: 'Caramel Macchiato', option: 'Large', quantity: 2, price: 145 }, { name: 'Classic Halo-Halo', option: 'Regular', quantity: 1, price: 99 }], notes: 'Customer requested separate drink carriers.' },
    { id: '8826', customer: 'Maria Mendez', email: 'maria@example.com', placedAt: '2026-09-18T13:15:00', status: 'Pending', items: [{ name: 'Longsilog', option: 'Regular', quantity: 1, price: 125 }, { name: 'Iced Caramel Macchiato', option: 'Regular', quantity: 1, price: 180 }], notes: '' },
    { id: '8827', customer: 'Paolo Garcia', email: 'paolo@example.com', placedAt: '2026-09-18T13:30:00', status: 'Preparing', items: [{ name: 'Street Food Platter', option: 'Regular', quantity: 2, price: 115 }], notes: '' },
    { id: '8819', customer: 'Juan Reyes', email: 'juan@example.com', placedAt: '2026-09-18T10:12:00', status: 'Completed', items: [{ name: 'Signature Beef Burger', option: 'Classic', quantity: 1, price: 250 }, { name: 'Hotsilog', option: 'Regular', quantity: 1, price: 110 }, { name: 'Caramel Macchiato', option: 'Regular', quantity: 1, price: 120 }], notes: '' },
    { id: '8818', customer: 'Mae Sales', email: 'mae@example.com', placedAt: '2026-09-18T09:35:00', status: 'Completed', items: [{ name: 'Iced Caramel Macchiato', option: 'Regular', quantity: 2, price: 180 }], notes: '' },
    { id: '8817', customer: 'Carlo Perez', email: 'carlo@example.com', placedAt: '2026-09-17T16:20:00', status: 'Cancelled', items: [{ name: 'Longsilog', option: 'Regular', quantity: 1, price: 125 }], notes: 'Cancelled by customer.' },
    { id: '8816', customer: 'Anna Lim', email: 'anna@example.com', placedAt: '2026-09-17T14:05:00', status: 'Completed', items: [{ name: 'Signature Beef Burger', option: 'Large', quantity: 2, price: 280 }, { name: 'Classic Halo-Halo', option: 'Regular', quantity: 1, price: 99 }, { name: 'Caramel Macchiato', option: 'Regular', quantity: 1, price: 120 }], notes: '' },
    { id: '8815', customer: 'Daniel Cruz', email: 'daniel@example.com', placedAt: '2026-09-16T18:42:00', status: 'Completed', items: [{ name: 'Classic Creamy Carbonara', option: 'Regular', quantity: 1, price: 135 }, { name: 'Caramel Macchiato', option: 'Large', quantity: 1, price: 145 }], notes: '' }
  ];

  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function readOrders() {
    try {
      var saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (Array.isArray(saved) && saved.length) {
        DEFAULT_ORDERS.forEach(function (sample) {
          if (!saved.some(function (order) { return order.id === sample.id; })) saved.push(clone(sample));
        });
        saveOrders(saved);
        return saved;
      }
    } catch (error) {}
    var initial = clone(DEFAULT_ORDERS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    return initial;
  }
  function saveOrders(orders) { localStorage.setItem(STORAGE_KEY, JSON.stringify(orders)); }
  function escapeHtml(value) { var node = document.createElement('div'); node.textContent = value == null ? '' : String(value); return node.innerHTML; }
  function peso(value) { return '₱' + Number(value).toFixed(2); }
  function orderTotal(order) {
    if (order.totals && Number.isFinite(Number(order.totals.total))) return Number(order.totals.total);
    if (Number.isFinite(Number(order.total))) return Number(order.total);
    return order.items.reduce(function (total, item) { return total + Number(item.price) * Number(item.quantity); }, 0);
  }
  function itemCount(order) { return order.items.reduce(function (total, item) { return total + Number(item.quantity); }, 0); }
  function initials(name) { return name.split(/\s+/).map(function (part) { return part.charAt(0); }).slice(0, 2).join('').toUpperCase(); }
  function statusKey(status) { return String(status).toLowerCase(); }
  function isHistory(order) { return order.status === 'Completed' || order.status === 'Cancelled'; }
  function formatDate(value) { return new Date(value).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }); }
  function formatTime(value) { return new Date(value).toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' }); }

  function renderLists() {
    var body = document.getElementById('upcoming-orders-body');
    if (!body) return;
    var historyPage = location.pathname.toLowerCase().endsWith('/order-history.html');
    var orders = readOrders().filter(function (order) { return historyPage ? isHistory(order) : !isHistory(order); });
    var search = document.getElementById('order-search');
    var filter = document.getElementById('order-filter');
    var query = search ? search.value.trim().toLowerCase() : '';
    var selectedStatus = filter ? filter.value : 'all';
    orders = orders.filter(function (order) {
      var searchable = [order.id, order.customer, order.email, order.status, formatDate(order.placedAt)].join(' ').toLowerCase();
      return (!query || searchable.indexOf(query) !== -1) && (selectedStatus === 'all' || statusKey(order.status) === selectedStatus);
    });
    orders.sort(function (a, b) { return new Date(b.placedAt) - new Date(a.placedAt); });

    var pages = Math.max(1, Math.ceil(orders.length / PAGE_SIZE));
    if (currentPage > pages) currentPage = pages;
    var start = (currentPage - 1) * PAGE_SIZE;
    var visible = orders.slice(start, start + PAGE_SIZE);
    body.innerHTML = visible.map(function (order) {
      var count = itemCount(order);
      var common = '<td data-label="Order"><a class="order-link" href="order-details.html?order=' + encodeURIComponent(order.id) + '">#ORD-' + escapeHtml(order.id) + '</a></td><td data-label="Customer"><div class="customer-cell"><span class="customer-initials">' + initials(order.customer) + '</span>' + escapeHtml(order.customer) + '</div></td>';
      if (historyPage) return '<tr data-status="' + statusKey(order.status) + '">' + common + '<td data-label="Date">' + formatDate(order.placedAt) + '</td><td data-label="Items">' + count + (count === 1 ? ' item' : ' items') + '</td><td data-label="Total">' + peso(orderTotal(order)) + '</td><td data-label="Status"><span class="order-status order-status--' + statusKey(order.status) + '">' + escapeHtml(order.status) + '</span></td></tr>';
      return '<tr data-status="' + statusKey(order.status) + '">' + common + '<td data-label="Time">' + formatTime(order.placedAt) + '</td><td data-label="Items">' + count + (count === 1 ? ' item' : ' items') + '</td><td data-label="Status"><span class="order-status order-status--' + statusKey(order.status) + '">' + escapeHtml(order.status) + '</span></td></tr>';
    }).join('');

    var empty = document.getElementById('orders-empty');
    if (empty) empty.style.display = orders.length ? 'none' : 'block';
    var footer = document.querySelector('.orders-panel__footer');
    if (footer) {
      var summary = footer.querySelector('span');
      if (summary) summary.textContent = orders.length ? 'Showing ' + (start + 1) + '–' + (start + visible.length) + ' of ' + orders.length + (historyPage ? ' past orders' : ' orders') : 'Showing 0 orders';
      var pagination = footer.querySelector('.order-pagination');
      if (pagination) {
        var buttons = '<button class="order-page-btn" type="button" data-page="prev" ' + (currentPage === 1 ? 'disabled' : '') + ' aria-label="Previous page">‹</button>';
        for (var page = 1; page <= pages; page += 1) buttons += '<button class="order-page-btn' + (page === currentPage ? ' is-active' : '') + '" type="button" data-page="' + page + '">' + page + '</button>';
        buttons += '<button class="order-page-btn" type="button" data-page="next" ' + (currentPage === pages ? 'disabled' : '') + ' aria-label="Next page">›</button>';
        pagination.innerHTML = buttons;
      }
    }
  }

  function initListPage() {
    if (!document.getElementById('upcoming-orders-body')) return;
    var search = document.getElementById('order-search');
    var filter = document.getElementById('order-filter');
    if (search) search.addEventListener('input', function () { currentPage = 1; renderLists(); });
    if (filter) filter.addEventListener('change', function () { currentPage = 1; renderLists(); });
    var topbarSearch = document.querySelector('.topbar__search input');
    if (topbarSearch && search) topbarSearch.addEventListener('input', function () { search.value = topbarSearch.value; currentPage = 1; renderLists(); });
    var pagination = document.querySelector('.order-pagination');
    if (pagination) pagination.addEventListener('click', function (event) {
      var button = event.target.closest('[data-page]'); if (!button || button.disabled) return;
      if (button.dataset.page === 'prev') currentPage -= 1; else if (button.dataset.page === 'next') currentPage += 1; else currentPage = Number(button.dataset.page);
      renderLists();
    });
    document.getElementById('upcoming-orders-body').addEventListener('click', function (event) {
      if (event.target.closest('a, button')) return;
      var link = event.target.closest('tr').querySelector('.order-link'); if (link) location.href = link.href;
    });
    renderLists();
  }

  function initDetailsPage() {
    var form = document.getElementById('order-update-form');
    if (!form) return;
    var id = new URLSearchParams(location.search).get('order') || '8824';
    var orders = readOrders();
    var order = orders.find(function (entry) { return entry.id === id; });
    if (!order) { document.querySelector('.order-detail-card').innerHTML = '<p class="orders-empty" style="display:block">Order not found.</p>'; return; }
    var breadcrumb = document.querySelector('.order-breadcrumb strong'); if (breadcrumb) breadcrumb.textContent = 'ORD-' + order.id;
    var breadcrumbLink = document.querySelector('.order-breadcrumb a'); if (breadcrumbLink && isHistory(order)) { breadcrumbLink.href = 'order-history.html'; breadcrumbLink.textContent = 'Order History'; }
    var meta = document.querySelector('.order-detail-card__meta'); if (meta) meta.textContent = 'Placed: ' + new Date(order.placedAt).toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
    var customer = document.querySelector('.order-customer'); if (customer) customer.innerHTML = '<strong>Customer</strong><span>' + escapeHtml(order.customer) + '</span><span>' + escapeHtml(order.email) + '</span>';
    var tbody = document.querySelector('.order-items tbody');
    if (tbody) tbody.innerHTML = order.items.map(function (item) { return '<tr><td><div class="order-product"><span class="order-product__icon">◇</span><div><strong>' + escapeHtml(item.name) + '</strong><span>' + escapeHtml(item.option || 'Regular') + '</span></div></div></td><td>' + item.quantity + '</td><td>' + peso(Number(item.price) * Number(item.quantity)) + '</td></tr>'; }).join('') + '<tr class="order-total"><td></td><td>Total</td><td>' + peso(orderTotal(order)) + '</td></tr>';
    var status = document.getElementById('fulfillment-status'); if (status) status.value = order.status;
    var notes = document.getElementById('admin-notes'); if (notes) notes.value = order.notes || '';
    form.addEventListener('submit', function (event) {
      event.preventDefault(); order.status = status.value; order.notes = notes.value.trim(); order.updatedAt = new Date().toISOString(); saveOrders(orders); localStorage.setItem(LAST_UPDATED_KEY, order.id); location.href = 'order-update-success.html?order=' + encodeURIComponent(order.id);
    });
    var printButton = document.getElementById('print-order-ticket'); if (printButton) printButton.addEventListener('click', function () { window.print(); });
  }

  function initSuccessPage() {
    var card = document.querySelector('.order-success-card'); if (!card) return;
    var id = new URLSearchParams(location.search).get('order') || localStorage.getItem(LAST_UPDATED_KEY) || '8824';
    var order = readOrders().find(function (entry) { return entry.id === id; }); if (!order) return;
    var paragraph = card.querySelector('p'); if (paragraph) paragraph.textContent = 'The status for Order #ORD-' + order.id + ' has been updated to ' + order.status + '.';
    var details = card.querySelector('.btn-outline'); if (details) details.href = 'order-details.html?order=' + encodeURIComponent(order.id);
    var back = card.querySelector('.btn-solid-sm'); if (back) { back.href = isHistory(order) ? 'order-history.html' : 'orders.html'; back.textContent = isHistory(order) ? 'Back to Order History' : 'Back to Upcoming Orders'; }
  }

  initListPage();
  initDetailsPage();
  initSuccessPage();
})();
