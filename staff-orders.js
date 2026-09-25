(function () {
  'use strict';
  var STORE = 'cornerCravingsAdminOrders';
  var PAGE_SIZE = 10;
  var currentPage = 1;
  var page = location.pathname.toLowerCase();
  var isHistory = page.indexOf('staff-history.html') !== -1;
  var table = document.querySelector('.staff-table');
  var tbody = table && table.querySelector('tbody');
  if (!tbody) return;

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

  function isMockOrder(order) {
    if (!order) return true;
    if (order.isDemo) return true;
    var mockIds = ['8824', '8823', '8822', '8821', '8820', '8819', '8818', '8817', '8816', '8815', '10245', '10244', '10243', '10242', '092', '093', '089', 'ORD-092', 'ORD-093', 'ORD-089'];
    if (mockIds.indexOf(String(order.id)) !== -1) return true;
    var mockNames = [
      'yashimin flores', 'belle mariano', 'dan santos', 'maria mendez', 'paolo garcia',
      'juan reyes', 'carlo perez', 'anna lim', 'daniel cruz', 'sarah jenkins',
      'michael johnson', 'emily chen', 'david kim', 'mae sales'
    ];
    var cust = String(order.customer || '').trim().toLowerCase();
    if (mockNames.indexOf(cust) !== -1) return true;
    return false;
  }

  function readOrders() {
    try {
      var value = JSON.parse(localStorage.getItem(STORE) || '[]');
      if (!Array.isArray(value)) return [];
      var customerOrders = value.filter(function (order) { return !isMockOrder(order); });
      if (customerOrders.length !== value.length) localStorage.setItem(STORE, JSON.stringify(customerOrders));
      return customerOrders;
    } catch (error) {
      return [];
    }
  }

  function writeOrders(orders) {
    localStorage.setItem(STORE, JSON.stringify(orders));
    window.dispatchEvent(new CustomEvent('cornercravings:orders-updated'));
  }

  function terminal(order) {
    return order.status === 'Completed' || order.status === 'Delivered' || order.status === 'Picked Up' || order.status === 'Cancelled';
  }

  function isPickup(order) {
    return order.fulfillmentType === 'pickup' || (order.delivery && order.delivery.method === 'pickup');
  }

  function isSuccessfulTerminal(order) {
    return order.status === 'Completed' || order.status === 'Delivered' || order.status === 'Picked Up';
  }

  function total(order) {
    if (order.totals && Number.isFinite(Number(order.totals.total))) return Number(order.totals.total);
    if (Number.isFinite(Number(order.total))) return Number(order.total);
    return (order.items || []).reduce(function (sum, item) {
      return sum + Number(item.price || item.unitPrice || 0) * Number(item.quantity || 0);
    }, 0);
  }

  function peso(value) {
    return '₱' + Number(value || 0).toFixed(2);
  }

  function time(value) {
    return new Date(value).toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' });
  }

  function date(value) {
    return new Date(value).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function elapsedMins(value) {
    return Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  }

  function elapsed(value) {
    var mins = elapsedMins(value);
    return mins < 60 ? mins + 'm ago' : Math.floor(mins / 60) + 'h ago';
  }

  function statusClass(status) {
    if (status === 'Preparing') return 'progress';
    if (status === 'Out for Delivery') return 'out-for-delivery';
    if (status === 'Picked Up' || status === 'Delivered') return 'completed';
    return String(status || 'Pending').toLowerCase().replace(/\s+/g, '-');
  }

  function statusLabel(status, order) {
    if (status === 'Preparing') return 'In Progress';
    if (status === 'Ready') return isPickup(order) ? 'Ready for Pickup' : 'Ready for Delivery';
    return status;
  }

  function timerAlertBadge(order) {
    if (order.status !== 'Pending' && order.status !== 'Preparing') return '';
    var mins = elapsedMins(order.placedAt);
    if (order.status === 'Pending' && mins >= 10) {
      return '<span class="pill pill--warning" title="Pending for ' + mins + ' minutes"><span class="pill__dot"></span>Needs Prep (' + mins + 'm)</span>';
    }
    if (order.status === 'Preparing' && mins >= 25) {
      return '<span class="pill pill--danger" title="In prep for ' + mins + ' minutes"><span class="pill__dot"></span>Overdue (' + mins + 'm)</span>';
    }
    return '';
  }

  function itemsText(order) {
    return (order.items || []).map(function (item) {
      return Number(item.quantity || 1) + '× ' + item.name;
    }).join(', ');
  }

  function nextAction(order) {
    if (order.status === 'Pending') {
      return '<button class="action-btn action-btn--outline" type="button" data-order-action="Preparing" data-order-id="' + escapeHtml(order.id) + '">Start Prep</button>';
    }
    if (order.status === 'Preparing') {
      return '<button class="action-btn" type="button" data-order-action="Ready" data-order-id="' + escapeHtml(order.id) + '">Mark Ready</button>';
    }
    if (order.status === 'Ready') {
      if (isPickup(order)) {
        return '<button class="action-btn" type="button" data-order-action="Picked Up" data-order-id="' + escapeHtml(order.id) + '">Mark Picked Up</button>';
      }
      return '<button class="action-btn" type="button" data-order-action="Out for Delivery" data-order-id="' + escapeHtml(order.id) + '">Dispatch Order</button>';
    }
    if (order.status === 'Out for Delivery') {
      return '<button class="action-btn" type="button" data-order-action="Delivered" data-order-id="' + escapeHtml(order.id) + '">Mark Delivered</button>';
    }
    return '';
  }

  function filtered() {
    var orders = readOrders().filter(function (order) {
      return isHistory ? terminal(order) : !terminal(order);
    });
    var search = document.querySelector('.staff-search input');
    var filter = document.querySelector('.staff-filter-select');
    var query = search ? search.value.trim().toLowerCase() : '';
    var selected = filter ? filter.value : 'all';
    orders = orders.filter(function (order) {
      var mapped = statusClass(order.status);
      var queryMatch = !query || (order.id + ' ' + (order.orderNumber || '') + ' ' + (order.customer || '') + ' ' + itemsText(order)).toLowerCase().indexOf(query) !== -1;
      var filterMatch = selected === 'all' || selected === mapped;
      return queryMatch && filterMatch;
    });
    return orders.sort(function (a, b) {
      return new Date(b.placedAt) - new Date(a.placedAt);
    });
  }

  function updateStats(all) {
    var active = all.filter(function (order) { return !terminal(order); });
    var pending = active.filter(function (order) { return order.status === 'Pending'; }).length;
    var preparing = active.filter(function (order) { return order.status === 'Preparing'; }).length;
    var ready = active.filter(function (order) { return order.status === 'Ready'; }).length;
    var values = document.querySelectorAll('.stat-card__value');

    if (!isHistory) {
      var completedWithTimes = all.filter(function (order) { return isSuccessfulTerminal(order) && order.updatedAt; });
      var avgMinutes = completedWithTimes.length ? Math.round(completedWithTimes.reduce(function (sum, order) {
        return sum + Math.max(0, new Date(order.updatedAt) - new Date(order.placedAt)) / 60000;
      }, 0) / completedWithTimes.length) : 0;
      if (values[0]) values[0].textContent = pending;
      if (values[1]) values[1].textContent = preparing;
      if (values[2]) values[2].textContent = ready;
      if (values[3]) values[3].textContent = avgMinutes ? avgMinutes + 'm' : '—';
    } else {
      var completed = all.filter(function (order) { return isSuccessfulTerminal(order) && order.paymentStatus === 'paid'; });
      var revenue = completed.reduce(function (sum, order) { return sum + total(order); }, 0);
      var counts = {};
      completed.forEach(function (order) {
        (order.items || []).forEach(function (item) {
          counts[item.name] = (counts[item.name] || 0) + Number(item.quantity || 0);
        });
      });
      var top = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; })[0] || 'None yet';
      if (values[0]) values[0].textContent = all.filter(terminal).length;
      if (values[1]) values[1].textContent = peso(revenue);
      if (values[2]) values[2].textContent = top;
    }
  }

  function render() {
    var all = readOrders();
    updateStats(all);
    var orders = filtered();
    var pages = Math.max(1, Math.ceil(orders.length / PAGE_SIZE));
    if (!isHistory && currentPage > pages) currentPage = pages;
    var start = isHistory ? 0 : (currentPage - 1) * PAGE_SIZE;
    var visible = isHistory ? orders : orders.slice(start, start + PAGE_SIZE);

    if (isHistory) {
      tbody.innerHTML = visible.map(function (order) {
        var receiptAction = isPickup(order)
          ? '<span class="receipt-unavailable">Pickup order</span>'
          : '<button class="action-btn action-btn--outline receipt-download-btn" type="button" data-download-receipt="' + escapeHtml(order.id) + '">Download</button>';
        return '<tr class="staff-row-clickable" data-inspect-order="' + escapeHtml(order.id) + '">' +
          '<td class="cell-primary" data-label="Order">#ORD-' + escapeHtml(order.id) + '</td>' +
          '<td data-label="Date">' + date(order.placedAt) + '<div class="cell-sub">' + time(order.placedAt) + '</div></td>' +
          '<td data-label="Customer">' + escapeHtml(order.customer || 'Customer') + '</td>' +
          '<td data-label="Items">' + escapeHtml(itemsText(order)) + '</td>' +
          '<td class="cell-primary" data-label="Total">' + peso(total(order)) + '</td>' +
          '<td data-label="Status"><span class="pill pill--' + statusClass(order.status) + '"><span class="pill__dot"></span>' + escapeHtml(order.status) + '</span></td>' +
          '<td data-label="Receipt">' + receiptAction + '</td>' +
        '</tr>';
      }).join('');
    } else {
      tbody.innerHTML = visible.map(function (order) {
        var note = order.notes ? '<div class="cell-sub" style="color:var(--staff-primary); font-style:italic;">Note: ' + escapeHtml(order.notes) + '</div>' : '';
        var isPickup = (order.fulfillmentType === 'pickup') || (order.delivery && order.delivery.method === 'pickup');
        var viewBtn = '<button class="action-btn action-btn--outline" type="button" data-inspect-order="' + escapeHtml(order.id) + '" style="margin-right:6px;">View</button>';
        return '<tr class="staff-row-clickable" data-inspect-order="' + escapeHtml(order.id) + '">' +
          '<td data-label="Order"><div class="cell-primary">#ORD-' + escapeHtml(order.id) + '</div><div class="cell-sub">' + (isPickup ? 'Pickup' : 'Delivery') + '</div></td>' +
          '<td data-label="Items">' + escapeHtml(itemsText(order)) + note + '</td>' +
          '<td data-label="Placed">' + time(order.placedAt) + '<div class="cell-sub">' + elapsed(order.placedAt) + '</div></td>' +
          '<td data-label="Status">' +
            '<span class="pill pill--' + statusClass(order.status) + '"><span class="pill__dot"></span>' + escapeHtml(statusLabel(order.status, order)) + '</span>' +
            timerAlertBadge(order) +
          '</td>' +
          '<td data-label="Actions" style="text-align:right;">' + viewBtn + nextAction(order) + '</td>' +
        '</tr>';
      }).join('');
    }

    if (!visible.length) {
      tbody.innerHTML = '<tr><td colspan="' + (isHistory ? '7' : '5') + '"><div class="staff-empty-state"><strong>No ' + (isHistory ? 'completed' : 'active') + ' orders</strong><span>Orders will appear here automatically.</span></div></td></tr>';
    }

    var showing = document.querySelector('.showing-text');
    if (showing) {
      showing.textContent = orders.length
        ? (isHistory ? 'Showing all ' + orders.length + ' orders' : 'Showing ' + (start + 1) + ' to ' + (start + visible.length) + ' of ' + orders.length + ' orders')
        : 'Showing 0 orders';
    }
  }

  function findOrder(orderId) {
    return readOrders().find(function (entry) {
      return String(entry.id) === String(orderId) || String(entry.orderNumber || '').replace(/\D/g, '') === String(orderId);
    });
  }

  function downloadDeliveryReceipt(orderId) {
    var order = findOrder(orderId);
    if (!order) {
      if (typeof window.alert === 'function') window.alert('This order could not be found.');
      return;
    }
    if (isPickup(order)) {
      if (typeof window.alert === 'function') window.alert('Delivery receipts are available for delivery orders only.');
      return;
    }

    var delivery = order.delivery || {};
    var totals = order.totals || {};
    var subtotal = Number.isFinite(Number(totals.subtotal)) ? Number(totals.subtotal) : (order.items || []).reduce(function (sum, item) {
      return sum + Number(item.unitPrice || item.price || 0) * Number(item.quantity || 1);
    }, 0);
    var deliveryFee = Number(totals.deliveryFee || 0);
    var tax = Number(totals.estimatedTax || 0);
    var orderNumber = String(order.orderNumber || ('ORD-' + order.id)).replace(/^#/, '');
    var itemRows = (order.items || []).map(function (item) {
      var qty = Number(item.quantity || 1);
      var unitPrice = Number(item.unitPrice || item.price || 0);
      var options = item.customizationText || item.size || item.option || '';
      if (Array.isArray(item.addons) && item.addons.length) {
        options += (options ? ' · ' : '') + item.addons.map(function (addon) { return addon.name || addon; }).join(', ');
      }
      return '<tr><td><strong>' + escapeHtml(item.name || 'Menu item') + '</strong>' + (options ? '<small>' + escapeHtml(options) + '</small>' : '') + '</td><td>' + qty + '</td><td>' + peso(unitPrice) + '</td><td>' + peso(unitPrice * qty) + '</td></tr>';
    }).join('');
    var address = delivery.address || order.deliveryAddress || 'No delivery address recorded';
    var contact = order.phone || delivery.contactNumber || 'No contact number recorded';
    var receiptHtml = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Delivery Receipt ' + escapeHtml(orderNumber) + '</title><style>' +
      'body{margin:0;background:#f5f1ee;color:#241713;font-family:Arial,sans-serif}.receipt{box-sizing:border-box;width:min(760px,calc(100% - 32px));margin:32px auto;background:#fff;padding:32px;border-top:6px solid #f5651b;box-shadow:0 8px 28px #3b1d1218}.brand{display:flex;justify-content:space-between;gap:20px;border-bottom:1px solid #eadbd4;padding-bottom:18px}.brand h1{font-size:24px;margin:0}.brand p,.meta p{margin:5px 0;color:#765e55}.section{margin-top:24px}.section h2{font-size:13px;text-transform:uppercase;letter-spacing:.08em;color:#a43810;margin:0 0 10px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.box{border:1px solid #eadbd4;border-radius:8px;padding:12px}.box strong{display:block;font-size:12px;color:#765e55;margin-bottom:5px}table{width:100%;border-collapse:collapse;font-size:14px}th,td{padding:11px 8px;border-bottom:1px solid #eee;text-align:left}th:nth-child(n+2),td:nth-child(n+2){text-align:right}td small{display:block;color:#765e55;margin-top:4px}.totals{width:min(330px,100%);margin:20px 0 0 auto}.totals div{display:flex;justify-content:space-between;padding:5px 0}.totals .grand{border-top:2px solid #241713;margin-top:7px;padding-top:10px;font-size:18px;color:#c34313}.notice{margin-top:24px;padding:12px;background:#fff5ef;border-radius:8px;color:#765e55;font-size:12px}.print{display:block;margin:20px auto 0;border:0;border-radius:8px;padding:11px 20px;background:#f5651b;color:#fff;font-weight:700;cursor:pointer}@media(max-width:560px){.receipt{margin:0;width:100%;padding:20px;box-shadow:none}.brand,.grid{display:block}.box{margin-top:10px}th,td{font-size:12px;padding:9px 4px}}@media print{body{background:#fff}.receipt{width:100%;margin:0;box-shadow:none}.print{display:none}}' +
      '</style></head><body><main class="receipt"><header class="brand"><div><h1>Corner Cravings</h1><p>Customer Delivery Receipt</p></div><div class="meta"><p><strong>' + escapeHtml(orderNumber) + '</strong></p><p>' + escapeHtml(date(order.placedAt) + ' · ' + time(order.placedAt)) + '</p></div></header>' +
      '<section class="section"><h2>Delivery details</h2><div class="grid"><div class="box"><strong>Customer</strong>' + escapeHtml(order.customer || 'Customer') + '</div><div class="box"><strong>Contact number</strong>' + escapeHtml(contact) + '</div><div class="box" style="grid-column:1/-1"><strong>Delivery address</strong>' + escapeHtml(address) + (delivery.landmark ? '<br><small>Landmark: ' + escapeHtml(delivery.landmark) + '</small>' : '') + '</div></div></section>' +
      '<section class="section"><h2>Order items</h2><table><thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Amount</th></tr></thead><tbody>' + (itemRows || '<tr><td colspan="4">No items recorded</td></tr>') + '</tbody></table></section>' +
      '<div class="totals"><div><span>Subtotal</span><strong>' + peso(subtotal) + '</strong></div><div><span>Delivery fee</span><strong>' + (deliveryFee ? peso(deliveryFee) : 'Free') + '</strong></div>' + (tax ? '<div><span>Taxes &amp; fees</span><strong>' + peso(tax) + '</strong></div>' : '') + '<div class="grand"><span>Total</span><strong>' + peso(total(order)) + '</strong></div></div>' +
      '<section class="section"><div class="grid"><div class="box"><strong>Payment method</strong>' + escapeHtml(order.paymentMethod || 'Cash on Delivery') + '</div><div class="box"><strong>Payment status</strong>' + escapeHtml(order.paymentStatus || 'unpaid') + '</div></div></section>' +
      (order.notes ? '<div class="notice"><strong>Customer note:</strong> ' + escapeHtml(order.notes) + '</div>' : '<div class="notice">Please keep this receipt as your delivery and payment reference.</div>') +
      '<button class="print" type="button" onclick="window.print()">Print receipt</button></main></body></html>';

    var url = URL.createObjectURL(new Blob([receiptHtml], { type: 'text/html;charset=utf-8' }));
    var link = document.createElement('a');
    link.href = url;
    link.download = 'corner-cravings-delivery-receipt-' + orderNumber.replace(/[^a-z0-9-]/gi, '-') + '.html';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 0);
  }

  // ==========================================================================
  // Order Inspection Modal Logic
  // ==========================================================================
  var hasGetElement = document && typeof document.getElementById === 'function';
  var modalEl = hasGetElement ? document.getElementById('staff-order-modal') : null;
  var modalCloseBtn = hasGetElement ? document.getElementById('staff-modal-close') : null;
  var modalTitleEl = hasGetElement ? document.getElementById('staff-modal-order-number') : null;
  var modalStatusEl = hasGetElement ? document.getElementById('staff-modal-status') : null;
  var modalBodyEl = hasGetElement ? document.getElementById('staff-modal-body') : null;
  var modalFooterEl = hasGetElement ? document.getElementById('staff-modal-footer') : null;

  function openInspectionModal(orderId) {
    if (!modalEl) return;
    var orders = readOrders();
    var order = orders.find(function (entry) {
      return String(entry.id) === String(orderId) || String(entry.orderNumber || '').replace(/\D/g, '') === String(orderId);
    });
    if (!order) return;

    var isPickup = (order.fulfillmentType === 'pickup') || (order.delivery && order.delivery.method === 'pickup');
    var del = order.delivery || {};

    if (modalTitleEl) {
      modalTitleEl.textContent = 'Order #' + (order.orderNumber || ('ORD-' + order.id));
    }
    if (modalStatusEl) {
      modalStatusEl.className = 'pill pill--' + statusClass(order.status);
      modalStatusEl.innerHTML = '<span class="pill__dot"></span>' + escapeHtml(statusLabel(order.status, order));
    }

    // Customer Information
    var customerHtml = '<div class="staff-customer-info-grid">' +
      '<div><strong>Customer</strong>' + escapeHtml(order.customer || 'Customer') + '</div>' +
      '<div><strong>Contact</strong>' + (order.phone ? '<a href="tel:' + escapeHtml(order.phone) + '" style="color:var(--staff-primary); font-weight:700;">' + escapeHtml(order.phone) + '</a>' : (del.contactNumber || '—')) + '</div>' +
      '<div><strong>Fulfillment</strong>' + (isPickup ? 'Store Pickup' : 'Delivery') + '</div>' +
      '<div><strong>Time Placed</strong>' + date(order.placedAt) + ' ' + time(order.placedAt) + ' (' + elapsed(order.placedAt) + ')</div>' +
      '<div style="grid-column: 1 / -1;"><strong>Address / Pickup Point</strong>' + (isPickup ? 'Corner Cravings Counter — Pasong Putik, Quezon City' : escapeHtml(del.address || 'Standard Delivery Address') + (del.landmark ? ' (' + escapeHtml(del.landmark) + ')' : '')) + '</div>' +
    '</div>';

    // Kitchen Notes
    var notesHtml = '';
    if (order.notes) {
      notesHtml = '<div class="staff-kitchen-note-box">' +
        '<strong>⚠️ Kitchen &amp; Preparation Instructions:</strong>' +
        '“' + escapeHtml(order.notes) + '”' +
      '</div>';
    }

    // Items Breakdown Table
    var itemsListHtml = '<table class="staff-items-table">' +
      '<thead><tr><th>Item</th><th>Options / Add-ons</th><th>Qty</th><th>Price</th><th style="text-align:right;">Subtotal</th></tr></thead>' +
      '<tbody>' +
      (order.items || []).map(function (item) {
        var opts = item.customizationText || item.size || item.option || 'Standard';
        if (Array.isArray(item.addons) && item.addons.length) {
          opts += ' + ' + item.addons.map(function(a){ return a.name; }).join(', ');
        }
        var unitPrice = Number(item.unitPrice || item.price || 0);
        var qty = Number(item.quantity || 1);
        return '<tr>' +
          '<td><strong>' + escapeHtml(item.name) + '</strong></td>' +
          '<td><span style="font-size:12px; color:var(--staff-text-body);">' + escapeHtml(opts) + '</span></td>' +
          '<td>' + qty + '</td>' +
          '<td>' + peso(unitPrice) + '</td>' +
          '<td style="text-align:right;"><strong>' + peso(unitPrice * qty) + '</strong></td>' +
        '</tr>';
      }).join('') +
      '</tbody></table>';

    // Totals Breakdown
    var totals = order.totals || {};
    var totalsHtml = '<div class="staff-totals-box">' +
      '<div class="staff-totals-row"><span>Subtotal:</span><strong>' + peso(totals.subtotal || total(order)) + '</strong></div>' +
      (totals.deliveryFee !== undefined ? '<div class="staff-totals-row"><span>Delivery Fee:</span><strong>' + (totals.deliveryFee > 0 ? peso(totals.deliveryFee) : 'Free') + '</strong></div>' : '') +
      (totals.estimatedTax !== undefined ? '<div class="staff-totals-row"><span>Taxes &amp; Fees:</span><strong>' + peso(totals.estimatedTax) + '</strong></div>' : '') +
      '<div class="staff-totals-grand"><span>Total:</span><span>' + peso(total(order)) + '</span></div>' +
      '<div style="font-size:11.5px; color:var(--staff-text-body); margin-top:4px;">Payment: <strong>' + escapeHtml(order.paymentMethod || 'Cash') + '</strong> (' + escapeHtml(order.paymentStatus || 'unpaid') + ')</div>' +
    '</div>';

    // Status History
    var historyHtml = '';
    if (Array.isArray(order.statusHistory) && order.statusHistory.length) {
      historyHtml = '<div style="margin-top:10px;"><p class="staff-modal-section-title">Order Status Audit Trail</p><ul style="padding-left:18px; margin:6px 0; font-size:12px; color:var(--staff-text-body); list-style-type:circle;">' +
        order.statusHistory.map(function (h) {
          var t = h.timestamp ? new Date(h.timestamp).toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' }) : '';
          var actor = h.actor ? ' [' + escapeHtml(h.actor) + ']' : '';
          var n = h.note ? ' — ' + escapeHtml(h.note) : '';
          return '<li><strong>' + escapeHtml(h.status) + '</strong> (' + t + ')' + actor + n + '</li>';
        }).join('') +
      '</ul></div>';
    }

    // Inventory Ingredients Breakdown
    var invHtml = '';
    var invEngine = (typeof window !== 'undefined' && window.CornerCravingsInventory) ||
                    (typeof CornerCravingsInventory !== 'undefined' ? CornerCravingsInventory : null);
    if (invEngine && typeof invEngine.calculateOrderIngredients === 'function') {
      var reqs = invEngine.calculateOrderIngredients(order);
      if (reqs && reqs.length) {
        var deductedBadge = order.inventoryDeducted ?
          '<span style="background:#dcfce7; color:#15803d; padding:2px 8px; border-radius:12px; font-size:11px; font-weight:700;">Deducted from Stock</span>' :
          '<span style="background:#fef3c7; color:#b45309; padding:2px 8px; border-radius:12px; font-size:11px; font-weight:700;">Pending Kitchen Prep</span>';
        invHtml = '<div style="margin-top:14px; padding:12px 14px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px;">' +
          '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">' +
            '<strong style="font-size:12.5px; color:var(--staff-text-dark, #1e293b);">Kitchen Recipe Ingredients</strong>' +
            deductedBadge +
          '</div>' +
          '<div style="display:flex; flex-wrap:wrap; gap:6px;">' +
          reqs.map(function (req) {
            return '<span style="background:#fff; border:1px solid #cbd5e1; border-radius:6px; padding:4px 8px; font-size:11.5px;">' +
              '<strong>' + escapeHtml(req.name) + '</strong>: ' + req.quantity + ' ' + escapeHtml(req.unit) +
            '</span>';
          }).join('') +
          '</div></div>';
      }
    }

    if (modalBodyEl) {
      modalBodyEl.innerHTML = customerHtml + notesHtml + itemsListHtml + invHtml + totalsHtml + historyHtml;
    }

    // Modal Footer Actions
    if (modalFooterEl) {
      var actionBtnsHtml = '';
      if (order.status === 'Pending') {
        actionBtnsHtml += '<button class="action-btn action-btn--outline" type="button" data-order-action="Preparing" data-order-id="' + escapeHtml(order.id) + '">Start Prep</button>' +
                          '<button class="staff-btn-cancel-order" type="button" data-order-action="Cancelled" data-order-id="' + escapeHtml(order.id) + '">Cancel Order</button>';
      } else if (order.status === 'Preparing') {
        actionBtnsHtml += '<button class="action-btn" type="button" data-order-action="Ready" data-order-id="' + escapeHtml(order.id) + '">Mark Ready</button>' +
                          '<button class="staff-btn-cancel-order" type="button" data-order-action="Cancelled" data-order-id="' + escapeHtml(order.id) + '">Cancel Order</button>';
      } else if (order.status === 'Ready') {
        actionBtnsHtml += isPickup(order)
          ? '<button class="action-btn" type="button" data-order-action="Picked Up" data-order-id="' + escapeHtml(order.id) + '">Mark Picked Up</button>'
          : '<button class="action-btn" type="button" data-order-action="Out for Delivery" data-order-id="' + escapeHtml(order.id) + '">Dispatch Order</button>';
      } else if (order.status === 'Out for Delivery') {
        actionBtnsHtml += '<button class="action-btn" type="button" data-order-action="Delivered" data-order-id="' + escapeHtml(order.id) + '">Mark Delivered</button>';
      }
      if (!isPickup) {
        actionBtnsHtml += '<button class="action-btn action-btn--outline receipt-download-btn" type="button" data-download-receipt="' + escapeHtml(order.id) + '">Download Delivery Receipt</button>';
      }
      actionBtnsHtml += '<button class="action-btn action-btn--outline" type="button" id="staff-modal-btn-close">Close</button>';
      modalFooterEl.innerHTML = actionBtnsHtml;

      var innerCloseBtn = document.getElementById('staff-modal-btn-close');
      if (innerCloseBtn) innerCloseBtn.addEventListener('click', closeInspectionModal);
    }

    modalEl.classList.add('is-active');
  }

  function closeInspectionModal() {
    if (modalEl) modalEl.classList.remove('is-active');
  }

  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', closeInspectionModal);
  }

  if (modalEl) {
    modalEl.addEventListener('click', function (e) {
      if (e.target === modalEl) closeInspectionModal();
    });
  }

  // ==========================================================================
  // Action Handling & Status Transitions
  // ==========================================================================
  function handleOrderAction(action, orderId) {
    var orders = readOrders();
    var order = orders.find(function (entry) {
      return String(entry.id) === String(orderId) || String(entry.orderNumber || '').replace(/\D/g, '') === String(orderId);
    });
    if (!order) return;

    var orderLabel = order.orderNumber || ('#ORD-' + order.id);
    var allowedNext = {
      Pending: ['Preparing', 'Cancelled'],
      Preparing: ['Ready', 'Cancelled'],
      Ready: isPickup(order) ? ['Picked Up'] : ['Out for Delivery'],
      'Out for Delivery': ['Delivered']
    };
    if (!allowedNext[order.status] || allowedNext[order.status].indexOf(action) === -1) {
      if (typeof window.alert === 'function') window.alert('This status change is not allowed. Refresh the order and follow the next available action.');
      return;
    }

    var isFinalAction = action === 'Completed' || action === 'Delivered' || action === 'Picked Up';
    var isCashPayment = String(order.paymentMethod || '').toLowerCase().indexOf('cash') !== -1;
    if (isFinalAction && !isCashPayment && order.paymentStatus !== 'paid') {
      if (typeof window.alert === 'function') window.alert('Digital payment must be verified by an admin before this order can be completed.');
      return;
    }

    // Safeguards & Confirmations
    if (isFinalAction && typeof window.confirm === 'function') {
      var confirmComplete = window.confirm('Mark order ' + orderLabel + ' as ' + action + '? Confirm that the order has been handed over successfully.');
      if (!confirmComplete) return;
    }

    var noteMsg = '';
    if (action === 'Cancelled') {
      if (typeof window.confirm === 'function') {
        var confirmCancel = window.confirm('Are you sure you want to cancel order ' + orderLabel + '?');
        if (!confirmCancel) return;
      }
      var reason = 'Out of ingredients / staff cancelled';
      if (typeof window.prompt === 'function') {
        var userReason = window.prompt('Enter cancellation reason (for staff audit log):', reason);
        if (userReason === null) return;
        reason = userReason;
      }
      noteMsg = 'Cancelled by kitchen staff: ' + reason;
    } else {
      noteMsg = action === 'Preparing' ? 'Kitchen started preparation' :
                action === 'Ready' ? 'Food prepared and ready' :
                action === 'Out for Delivery' ? 'Order dispatched for delivery' :
                action === 'Delivered' ? 'Order delivered to customer' :
                action === 'Picked Up' ? 'Order handed to customer at the store' :
                action === 'Completed' ? 'Order fulfilled and handed over' : ('Status updated to ' + action);
    }

    // Deduct or handle inventory on status transition
    if (action === 'Preparing' && !order.inventoryDeducted) {
      var invEngine = (typeof window !== 'undefined' && window.CornerCravingsInventory) ||
                      (typeof CornerCravingsInventory !== 'undefined' ? CornerCravingsInventory : null);
      if (invEngine && typeof invEngine.deductOrderIngredients === 'function') {
        var deductionResult = invEngine.deductOrderIngredients(order);
        if (!deductionResult || !deductionResult.success) {
          var shortageMessage = deductionResult && Array.isArray(deductionResult.missing)
            ? deductionResult.missing.map(function (missing) { return missing.name + ' (needs ' + missing.required + ', available ' + missing.available + ')'; }).join(', ')
            : (deductionResult && deductionResult.reason) || 'Inventory could not be deducted.';
          if (typeof window.alert === 'function') window.alert('Cannot start preparation: ' + shortageMessage);
          return;
        }
        if (deductionResult && deductionResult.success && deductionResult.deducted && deductionResult.deducted.length > 0) {
          if (!Array.isArray(order.statusHistory)) order.statusHistory = [];
          order.statusHistory.push({
            status: 'Preparing',
            timestamp: new Date().toISOString(),
            actor: 'staff',
            note: '[Inventory] Deducted ' + deductionResult.deducted.length + ' recipe ingredients for kitchen prep'
          });
        }
      }
    } else if (action === 'Cancelled' && order.inventoryDeducted) {
      if (!Array.isArray(order.statusHistory)) order.statusHistory = [];
      var shouldRestore = typeof window.confirm === 'function' && window.confirm('Restore the deducted ingredients to stock? Choose OK only if preparation did not consume them. Choose Cancel to record them as kitchen waste.');
      var cancelInvEngine = (typeof window !== 'undefined' && window.CornerCravingsInventory) ||
                            (typeof CornerCravingsInventory !== 'undefined' ? CornerCravingsInventory : null);
      if (shouldRestore && cancelInvEngine && typeof cancelInvEngine.restoreOrderIngredients === 'function') {
        var restoreResult = cancelInvEngine.restoreOrderIngredients(order, reason);
        order.statusHistory.push({
          status: 'Cancelled',
          timestamp: new Date().toISOString(),
          actor: 'staff',
          note: '[Inventory] Restored ' + ((restoreResult && restoreResult.restored && restoreResult.restored.length) || 0) + ' ingredients to stock'
        });
      } else {
        order.statusHistory.push({
          status: 'Cancelled',
          timestamp: new Date().toISOString(),
          actor: 'staff',
          note: '[Inventory] Consumed recipe ingredients recorded as kitchen preparation waste'
        });
      }
    }

    var now = new Date().toISOString();
    if (!Array.isArray(order.statusHistory)) order.statusHistory = [];
    order.statusHistory.push({
      status: action,
      timestamp: now,
      actor: 'staff',
      note: noteMsg
    });

    order.status = action;
    order.fulfillmentStatus = action.toLowerCase().replace(/\s+/g, '_');
    order.updatedAt = now;
    order.statusUpdatedAt = now;
    if (isFinalAction && isCashPayment) {
      order.paymentStatus = 'paid';
    }
    if (action === 'Cancelled' && order.paymentStatus === 'paid') order.paymentStatus = 'refund_pending';

    writeOrders(orders);
    render();
    if (modalEl && modalEl.classList.contains('is-active')) {
      if (isFinalAction || action === 'Cancelled') {
        closeInspectionModal();
      } else {
        openInspectionModal(order.id);
      }
    }
  }

  // Table row click delegation
  tbody.addEventListener('click', function (event) {
    var receiptBtn = event.target.closest('[data-download-receipt]');
    if (receiptBtn) {
      if (event && typeof event.stopPropagation === 'function') event.stopPropagation();
      downloadDeliveryReceipt(receiptBtn.dataset.downloadReceipt);
      return;
    }

    var actionBtn = event.target.closest('[data-order-action]');
    if (actionBtn) {
      if (event && typeof event.stopPropagation === 'function') event.stopPropagation();
      handleOrderAction(actionBtn.dataset.orderAction, actionBtn.dataset.orderId);
      return;
    }

    var viewBtn = event.target.closest('[data-inspect-order]');
    if (viewBtn) {
      openInspectionModal(viewBtn.dataset.inspectOrder);
      return;
    }

    var row = event.target.closest('tr[data-inspect-order]');
    if (row) {
      openInspectionModal(row.dataset.inspectOrder);
    }
  });

  // Modal action buttons delegation
  if (modalFooterEl) {
    modalFooterEl.addEventListener('click', function (event) {
      var receiptBtn = event.target.closest('[data-download-receipt]');
      if (receiptBtn) {
        downloadDeliveryReceipt(receiptBtn.dataset.downloadReceipt);
        return;
      }
      var actionBtn = event.target.closest('[data-order-action]');
      if (actionBtn) {
        handleOrderAction(actionBtn.dataset.orderAction, actionBtn.dataset.orderId);
      }
    });
  }

  var search = document.querySelector('.staff-search input');
  if (search) search.addEventListener('input', function () { currentPage = 1; render(); });

  var filter = document.querySelector('.staff-filter-select');
  if (filter) filter.addEventListener('change', function () { currentPage = 1; render(); });

  var exportButton = document.querySelector('[data-export-orders]');
  if (exportButton) {
    exportButton.addEventListener('click', function () {
      var rows = [['Order ID', 'Date', 'Customer', 'Items', 'Total', 'Status']].concat(filtered().map(function (order) {
        return [order.id, order.placedAt, order.customer, itemsText(order), total(order), order.status];
      }));
      var csv = rows.map(function (row) {
        return row.map(function (cell) {
          return '"' + String(cell == null ? '' : cell).replace(/"/g, '""') + '"';
        }).join(',');
      }).join('\n');
      var link = document.createElement('a');
      link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
      link.download = 'corner-cravings-order-history.csv';
      link.click();
      URL.revokeObjectURL(link.href);
    });
  }

  var clearStaffHistoryBtn = hasGetElement ? document.getElementById('btn-clear-staff-history') : null;
  if (clearStaffHistoryBtn) {
    clearStaffHistoryBtn.addEventListener('click', function () {
      if (confirm('Clear completed and cancelled orders from staff history? Active kitchen orders will be preserved.')) {
        var orders = readOrders();
        var activeOnly = orders.filter(function (order) { return !terminal(order); });
        writeOrders(activeOnly);
        currentPage = 1;
        render();
      }
    });
  }

  // Auto-refresh timers periodically every 30 seconds
  if (typeof setInterval === 'function') {
    setInterval(render, 30000);
  }

  window.addEventListener('storage', render);
  window.addEventListener('cornercravings:orders-updated', render);
  render();

  if (typeof window !== 'undefined') {
    window.CornerCravingsStaff = {
      handleOrderAction: handleOrderAction,
      downloadDeliveryReceipt: downloadDeliveryReceipt,
      readOrders: readOrders,
      writeOrders: writeOrders
    };
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      handleOrderAction: handleOrderAction,
      downloadDeliveryReceipt: downloadDeliveryReceipt,
      readOrders: readOrders,
      writeOrders: writeOrders
    };
  }
})();
