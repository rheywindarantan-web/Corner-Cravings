(function () {
  'use strict';
  var list = document.getElementById('customer-order-list');
  if (!list || !window.CornerCravings) return;

  var STEPS = ['Pending', 'Preparing', 'Ready', 'Completed'];
  function escapeHtml(value) { var node = document.createElement('div'); node.textContent = value == null ? '' : String(value); return node.innerHTML; }
  function readAdminOrders() { try { var value = JSON.parse(localStorage.getItem('cornerCravingsAdminOrders') || '[]'); return Array.isArray(value) ? value : []; } catch (e) { return []; } }
  function orderTotal(order) {
    if (order.totals && Number.isFinite(Number(order.totals.total))) return Number(order.totals.total);
    if (Number.isFinite(Number(order.total))) return Number(order.total);
    return (order.items || []).reduce(function (sum, item) { return sum + Number(item.price || item.unitPrice || 0) * Number(item.quantity || 0); }, 0);
  }
  function statusSteps(status) {
    var active = STEPS.indexOf(status);
    if (status === 'Cancelled') return '<div class="customer-order-cancelled">This order was cancelled.</div>';
    if (active < 0) active = 0;
    return '<ol class="order-tracker">' + STEPS.map(function (step, index) {
      var state = index < active ? ' is-complete' : index === active ? ' is-current' : '';
      return '<li class="order-tracker__step' + state + '"><span>' + (index < active ? '✓' : index + 1) + '</span><strong>' + step + '</strong></li>';
    }).join('') + '</ol>';
  }
  function render() {
    var saved = window.CornerCravings.getCustomerOrders();
    var live = readAdminOrders();
    var orders = saved.map(function (order) {
      var match = live.find(function (entry) { return String(entry.id) === String(order.id || String(order.orderNumber || '').replace(/\D/g, '')); });
      return match ? Object.assign({}, order, match, { orderNumber: order.orderNumber || match.orderNumber || 'CC-' + match.id }) : order;
    });
    if (!orders.length) {
      list.innerHTML = '<div class="customer-orders-empty"><h2>No orders yet</h2><p>Your submitted orders will appear here with their live status.</p><a class="btn btn-primary" href="customer-menu.html">Browse Menu</a></div>';
      return;
    }
    list.innerHTML = orders.map(function (order) {
      var items = (order.items || []).map(function (item) { return Number(item.quantity || 1) + '× ' + escapeHtml(item.name); }).join(', ');
      var placedAt = order.placedAt ? new Date(order.placedAt).toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : escapeHtml(order.orderDate || '');
      return '<article class="customer-order-card"><header><div><span class="customer-order-number">' + escapeHtml(order.orderNumber || 'CC-' + order.id) + '</span><h2>' + escapeHtml(order.status || 'Pending') + '</h2></div><strong class="customer-order-total">' + window.CornerCravings.formatPeso(orderTotal(order)) + '</strong></header>' + statusSteps(order.status || 'Pending') + '<div class="customer-order-meta"><p><strong>Placed</strong><span>' + placedAt + '</span></p><p><strong>Items</strong><span>' + items + '</span></p><p><strong>Fulfillment</strong><span>' + escapeHtml(order.delivery && order.delivery.method === 'pickup' ? 'Store pickup' : 'Delivery') + '</span></p><p><strong>Payment</strong><span>' + escapeHtml(order.paymentMethod || 'Cash on Delivery') + '</span></p></div></article>';
    }).join('');
  }
  window.addEventListener('storage', render);
  render();
})();
