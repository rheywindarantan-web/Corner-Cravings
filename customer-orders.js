(function () {
  'use strict';
  var list = document.getElementById('customer-order-list');
  if (!list || !window.CornerCravings) return;

  function escapeHtml(value) { var node = document.createElement('div'); node.textContent = value == null ? '' : String(value); return node.innerHTML; }
  function readAdminOrders() {
    try {
      var value = JSON.parse(localStorage.getItem('cornerCravingsAdminOrders') || '[]');
      return Array.isArray(value) ? value.filter(function (order) { return !order.isDemo; }) : [];
    } catch (e) { return []; }
  }

  function orderTotal(order) {
    if (order.totals && Number.isFinite(Number(order.totals.total))) return Number(order.totals.total);
    if (Number.isFinite(Number(order.total))) return Number(order.total);
    return (order.items || []).reduce(function (sum, item) { return sum + Number(item.price || item.unitPrice || 0) * Number(item.quantity || 0); }, 0);
  }

  function getSteps(order) {
    var isPickup = (order.fulfillmentType === 'pickup') || (order.delivery && order.delivery.method === 'pickup');
    if (isPickup) {
      return ['Pending', 'Preparing', 'Ready for Pickup', 'Picked Up'];
    }
    return ['Pending', 'Preparing', 'Ready for Delivery', 'Out for Delivery', 'Delivered'];
  }

  function normalizeStepIndex(status, steps) {
    var s = String(status || '').toLowerCase();
    if (s === 'pending') return 0;
    if (s === 'preparing') return 1;
    if (s.indexOf('ready') !== -1) return 2;
    if (s === 'out for delivery' || s === 'out_for_delivery') return Math.min(3, steps.length - 1);
    if (s === 'completed' || s === 'delivered' || s === 'picked up' || s === 'picked_up') return steps.length - 1;
    return 0;
  }

  function statusSteps(order) {
    var status = order.status || 'Pending';
    if (status === 'Cancelled' || order.fulfillmentStatus === 'cancelled') {
      return '<div class="customer-order-cancelled">This order was cancelled.</div>';
    }
    var steps = getSteps(order);
    var active = normalizeStepIndex(status, steps);

    return '<ol class="order-tracker" style="--tracker-steps:' + steps.length + '">' + steps.map(function (step, index) {
      var state = index < active ? ' is-complete' : index === active ? ' is-current' : '';
      return '<li class="order-tracker__step' + state + '"><span>' + (index < active ? '✓' : index + 1) + '</span><strong>' + step + '</strong></li>';
    }).join('') + '</ol>';
  }

  function renderHistoryTimeline(order) {
    if (!Array.isArray(order.statusHistory) || order.statusHistory.length === 0) return '';
    var timelineItems = order.statusHistory.map(function (hist) {
      var timeStr = hist.timestamp ? new Date(hist.timestamp).toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' }) : '';
      var noteStr = hist.note ? ' — ' + escapeHtml(hist.note) : '';
      return '<li style="font-size:12px; color:var(--cust-muted); margin-bottom:4px;"><strong>' + escapeHtml(hist.status) + '</strong> (' + timeStr + ')' + noteStr + '</li>';
    }).join('');
    return '<details style="margin-top:12px; font-size:12.5px; cursor:pointer;"><summary style="font-weight:600; color:var(--cust-text-secondary);">Order Status History (' + order.statusHistory.length + ')</summary><ul style="padding-left:18px; margin-top:8px; list-style-type:disc;">' + timelineItems + '</ul></details>';
  }

  function render() {
    var session = window.CornerCravings.getCustomerSession();
    var saved = window.CornerCravings.getCustomerOrders();
    var live = readAdminOrders();

    // Map saved customer orders with latest live admin updates
    var orders = saved.map(function (order) {
      var match = live.find(function (entry) {
        return String(entry.id) === String(order.id || String(order.orderNumber || '').replace(/\D/g, ''));
      });
      return match ? Object.assign({}, order, match, { orderNumber: order.orderNumber || match.orderNumber || 'CC-' + match.id }) : order;
    });

    // If customer is logged in, filter by email or customerId for privacy/account separation
    if (session && session.email) {
      orders = orders.filter(function (order) {
        return (order.email && order.email.toLowerCase() === session.email.toLowerCase()) ||
               (order.customerId && String(order.customerId) === String(session.id || session.email));
      });
    }

    if (!orders.length) {
      list.innerHTML = '<div class="customer-orders-empty"><h2>No orders yet</h2><p>Your submitted orders will appear here with their live status.</p><a class="btn btn-primary" href="customer-menu.html">Browse Menu</a></div>';
      return;
    }

    list.innerHTML = orders.map(function (order) {
      var items = (order.items || []).map(function (item) {
        return Number(item.quantity || 1) + '× ' + escapeHtml(item.name);
      }).join(', ');
      var placedAt = order.placedAt ? new Date(order.placedAt).toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : escapeHtml(order.orderDate || '');
      var isPickup = (order.fulfillmentType === 'pickup') || (order.delivery && order.delivery.method === 'pickup');

      var canCancel = order.status === 'Pending';
      var isCancelled = order.status === 'Cancelled' || order.fulfillmentStatus === 'cancelled';
      var isPreparing = order.status === 'Preparing';
      var isReady = order.status && order.status.indexOf('Ready') !== -1;

      var cancelBtnHtml = '';
      if (canCancel) {
        cancelBtnHtml = '<button type="button" class="btn-order-action btn-order-cancel" data-order-action="cancel" data-order-id="' + escapeHtml(order.id) + '">Cancel Order</button>';
      } else if (isPreparing) {
        cancelBtnHtml = '<span class="order-action-notice">Kitchen is preparing your order</span>';
      } else if (isReady) {
        cancelBtnHtml = '<span class="order-action-notice order-action-notice--ready">Ready for ' + (isPickup ? 'pickup' : 'delivery') + '</span>';
      }

      var reorderBtnHtml = '<button type="button" class="btn-order-action btn-order-reorder" data-order-action="reorder" data-order-id="' + escapeHtml(order.id) + '">Order Again</button>';
      var actionsHtml = '<div class="customer-order-actions">' + cancelBtnHtml + reorderBtnHtml + '</div>';

      var notesHtml = order.notes ? '<p><strong>Instructions</strong><span style="color:var(--cust-primary); font-style:italic;">“' + escapeHtml(order.notes) + '”</span></p>' : '';

      return '<article class="customer-order-card"><header><div><span class="customer-order-number">' +
        escapeHtml(order.orderNumber || 'CC-' + order.id) + '</span><h2>' + escapeHtml(order.status || 'Pending') +
        '</h2></div><strong class="customer-order-total">' + window.CornerCravings.formatPeso(orderTotal(order)) +
        '</strong></header>' + statusSteps(order) +
        '<div class="customer-order-meta">' +
          '<p><strong>Placed</strong><span>' + placedAt + '</span></p>' +
          '<p><strong>Items</strong><span>' + items + '</span></p>' +
          '<p><strong>Fulfillment</strong><span>' + (isPickup ? 'Store Pickup' : 'Delivery') + '</span></p>' +
          '<p><strong>Payment</strong><span>' + escapeHtml(order.paymentMethod || 'Cash') + ' (' + escapeHtml(order.paymentStatus || 'unpaid') + ')</span></p>' +
          notesHtml +
        '</div>' +
        renderHistoryTimeline(order) +
        actionsHtml +
      '</article>';
    }).join('');
  }

  if (list && typeof list.addEventListener === 'function') {
    list.addEventListener('click', function (e) {
      var btn = e.target.closest ? e.target.closest('[data-order-action]') : null;
      if (!btn) return;
      var action = btn.getAttribute('data-order-action');
      var orderId = btn.getAttribute('data-order-id');

    var saved = window.CornerCravings.getCustomerOrders();
    var live = readAdminOrders();
    var orders = saved.map(function (order) {
      var match = live.find(function (entry) {
        return String(entry.id) === String(order.id || String(order.orderNumber || '').replace(/\D/g, ''));
      });
      return match ? Object.assign({}, order, match, { orderNumber: order.orderNumber || match.orderNumber || 'CC-' + match.id }) : order;
    });

    var targetOrder = orders.find(function (o) {
      return String(o.id) === String(orderId) || String(o.orderNumber || '').replace(/\D/g, '') === String(orderId);
    });

    if (!targetOrder) {
      // Also check raw live admin orders if not found in customer saved
      targetOrder = live.find(function (o) {
        return String(o.id) === String(orderId) || String(o.orderNumber || '').replace(/\D/g, '') === String(orderId);
      });
    }

    if (!targetOrder) return;

    if (action === 'cancel') {
      var confirmMsg = 'Are you sure you want to cancel order ' + (targetOrder.orderNumber || ('#CC-' + targetOrder.id)) + '?';
      if (!window.confirm(confirmMsg)) return;

      var reason = window.prompt('Reason for cancellation (optional):', 'Changed my mind');
      if (reason === null) return;

      var res = window.CornerCravings.cancelOrder(targetOrder.id, reason);
      if (res && res.success) {
        window.CornerCravings.showToast('Order ' + (targetOrder.orderNumber || ('#CC-' + targetOrder.id)) + ' has been cancelled.');
        render();
      } else {
        alert(res ? res.message : 'Unable to cancel this order.');
      }
    } else if (action === 'reorder') {
      var reorderRes = window.CornerCravings.reorderItems(targetOrder);
      if (reorderRes && reorderRes.success) {
        var msg = 'Added ' + reorderRes.addedCount + ' items to your cart!';
        if (reorderRes.unavailableItems && reorderRes.unavailableItems.length > 0) {
          msg += ' (' + reorderRes.unavailableItems.join(', ') + ' currently unavailable)';
        }
        window.CornerCravings.showToast(msg);
        setTimeout(function () {
          window.location.href = 'customer-cart.html';
        }, 400);
      } else {
        window.CornerCravings.showToast(reorderRes && reorderRes.message ? reorderRes.message : 'No available items to reorder from this order.');
      }
    }
  });
}

  window.addEventListener('storage', render);
  window.addEventListener('cornercravings:orders-updated', render);
  render();
})();
