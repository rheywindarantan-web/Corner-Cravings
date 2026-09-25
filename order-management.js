(function () {
  'use strict';

  var STORAGE_KEY = 'cornerCravingsAdminOrders';
  var LAST_UPDATED_KEY = 'cornerCravingsLastUpdatedOrder';
  var PAGE_SIZE = 5;
  var currentPage = 1;

  // Clean production queue: no fake mockup customers or demo orders
  var DEFAULT_ORDERS = [];

  function clone(value) { return JSON.parse(JSON.stringify(value)); }

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
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw !== null) {
        var saved = JSON.parse(raw);
        if (Array.isArray(saved)) {
          var customerOrders = saved.filter(function (order) { return !isMockOrder(order); });
          if (customerOrders.length !== saved.length) saveOrders(customerOrders);
          return customerOrders;
        }
      }
    } catch (error) {}
    saveOrders([]);
    return [];
  }

  function saveOrders(orders) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    try {
      window.dispatchEvent(new CustomEvent('cornercravings:orders-updated', { detail: { count: orders.length } }));
    } catch (e) {}
  }

  function clearOrderHistory() {
    var orders = readOrders();
    var activeOnly = orders.filter(function (order) { return !isHistory(order); });
    saveOrders(activeOnly);
    return activeOnly;
  }

  function loadDemoOrders() {
    var orders = readOrders();
    var nonDemo = orders.filter(function (order) { return !order.isDemo; });
    var fresh = clone(DEFAULT_ORDERS);
    var combined = fresh.concat(nonDemo);
    saveOrders(combined);
    return combined;
  }

  function clearDemoOrders() {
    var orders = readOrders();
    var nonDemo = orders.filter(function (order) { return !order.isDemo; });
    saveOrders(nonDemo);
    return nonDemo;
  }

  function resetDemoOrders() {
    var initial = clone(DEFAULT_ORDERS);
    saveOrders(initial);
    return initial;
  }

  function markPaymentPaid(orderId, note) {
    var orders = readOrders();
    var order = orders.find(function (o) { return String(o.id) === String(orderId); });
    if (!order) return { success: false, message: 'Order not found' };
    order.paymentStatus = 'paid';
    order.updatedAt = new Date().toISOString();
    if (!Array.isArray(order.statusHistory)) order.statusHistory = [];
    order.statusHistory.push({
      status: order.status,
      timestamp: new Date().toISOString(),
      actor: 'admin',
      note: note || 'Payment verified and marked as Paid by Admin'
    });
    saveOrders(orders);
    return { success: true, order: order };
  }

  function processRefund(orderId, reason) {
    var orders = readOrders();
    var order = orders.find(function (o) { return String(o.id) === String(orderId); });
    if (!order) return { success: false, message: 'Order not found' };
    if (order.paymentStatus !== 'paid' && order.paymentStatus !== 'refund_pending') {
      return { success: false, message: 'Only paid or refund-pending orders can be refunded' };
    }
    order.paymentStatus = 'refunded';
    order.updatedAt = new Date().toISOString();
    if (!Array.isArray(order.statusHistory)) order.statusHistory = [];
    order.statusHistory.push({
      status: order.status,
      timestamp: new Date().toISOString(),
      actor: 'admin',
      note: 'Refund processed: ' + (reason || 'Admin refund')
    });
    saveOrders(orders);
    return { success: true, order: order };
  }

  function escapeHtml(value) { var node = document.createElement('div'); node.textContent = value == null ? '' : String(value); return node.innerHTML; }
  function peso(value) { return '₱' + Number(value).toFixed(2); }
  function orderTotal(order) {
    if (order.totals && Number.isFinite(Number(order.totals.total))) return Number(order.totals.total);
    if (Number.isFinite(Number(order.total))) return Number(order.total);
    return order.items.reduce(function (total, item) { return total + Number(item.price) * Number(item.quantity); }, 0);
  }
  function itemCount(order) { return order.items.reduce(function (total, item) { return total + Number(item.quantity); }, 0); }
  function initials(name) { return name.split(/\s+/).map(function (part) { return part.charAt(0); }).slice(0, 2).join('').toUpperCase(); }
  function statusKey(status) { return String(status).toLowerCase().replace(/\s+/g, '-'); }
  function isPickup(order) { return order.fulfillmentType === 'pickup' || (order.delivery && order.delivery.method === 'pickup'); }
  function isSuccessfulTerminal(order) { return order.status === 'Completed' || order.status === 'Delivered' || order.status === 'Picked Up'; }
  function isHistory(order) { return isSuccessfulTerminal(order) || order.status === 'Cancelled'; }
  function allowedNextStatuses(order) {
    if (order.status === 'Pending') return ['Preparing', 'Cancelled'];
    if (order.status === 'Preparing') return ['Ready', 'Cancelled'];
    if (order.status === 'Ready') return isPickup(order) ? ['Picked Up', 'Cancelled'] : ['Out for Delivery', 'Cancelled'];
    if (order.status === 'Out for Delivery') return ['Delivered', 'Cancelled'];
    return [];
  }
  function statusLabel(status, order) {
    if (status === 'Ready') return isPickup(order) ? 'Ready for Pickup' : 'Ready for Delivery';
    return status;
  }
  function formatDate(value) { return new Date(value).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }); }
  function formatTime(value) { return new Date(value).toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' }); }

  function renderLists() {
    var body = document.getElementById('upcoming-orders-body');
    if (!body) return;
    var historyPage = location.pathname.toLowerCase().indexOf('order-history.html') !== -1;
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
      var payBadge = '<span class="payment-badge payment-badge--' + (order.paymentStatus || 'unpaid') + '" style="margin-right:6px;">' + escapeHtml(order.paymentStatus || 'unpaid') + '</span>';
      var common = '<td data-label="Order"><a class="order-link" href="order-details.html?order=' + encodeURIComponent(order.id) + '">#ORD-' + escapeHtml(order.id) + '</a></td><td data-label="Customer"><div class="customer-cell"><span class="customer-initials">' + initials(order.customer) + '</span>' + escapeHtml(order.customer) + '</div></td>';
      if (historyPage) return '<tr data-status="' + statusKey(order.status) + '">' + common + '<td data-label="Date">' + formatDate(order.placedAt) + '</td><td data-label="Items">' + count + (count === 1 ? ' item' : ' items') + '</td><td data-label="Total">' + peso(orderTotal(order)) + '</td><td data-label="Status">' + payBadge + '<span class="order-status order-status--' + statusKey(order.status) + '">' + escapeHtml(statusLabel(order.status, order)) + '</span></td></tr>';
      return '<tr data-status="' + statusKey(order.status) + '">' + common + '<td data-label="Time">' + formatTime(order.placedAt) + '</td><td data-label="Items">' + count + (count === 1 ? ' item' : ' items') + '</td><td data-label="Status">' + payBadge + '<span class="order-status order-status--' + statusKey(order.status) + '">' + escapeHtml(statusLabel(order.status, order)) + '</span></td></tr>';
    }).join('');

    var empty = document.getElementById('orders-empty');
    if (empty) {
      if (!orders.length) {
        empty.style.display = 'block';
        empty.textContent = query
          ? (historyPage ? 'No past orders match your search.' : 'No orders match your search.')
          : (historyPage ? 'No past orders. Completed and cancelled customer orders will appear here.' : 'No active orders. New orders will appear here.');
      } else {
        empty.style.display = 'none';
      }
    }
    var footer = document.querySelector('.orders-panel__footer');
    if (footer) {
      var summary = footer.querySelector('span');
      if (summary) summary.textContent = orders.length ? 'Showing ' + (start + 1) + '–' + (start + visible.length) + ' of ' + orders.length + (historyPage ? ' past orders' : ' orders') : (historyPage ? 'Showing 0 past orders' : 'Showing 0 orders');
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

    // Demo Data management actions
    var resetDemoBtn = document.getElementById('btn-reset-demo');
    if (resetDemoBtn) {
      resetDemoBtn.addEventListener('click', function () {
        if (confirm('Reset orders to initial demo dataset? Any custom orders created in this browser will be cleared.')) {
          resetDemoOrders();
          currentPage = 1;
          renderLists();
        }
      });
    }
    var clearDemoBtn = document.getElementById('btn-clear-demo');
    if (clearDemoBtn) {
      clearDemoBtn.addEventListener('click', function () {
        if (confirm('Remove all sample demo orders? Real customer orders will be preserved.')) {
          clearDemoOrders();
          currentPage = 1;
          renderLists();
        }
      });
    }

    var clearHistoryBtn = document.getElementById('btn-clear-history');
    if (clearHistoryBtn) {
      clearHistoryBtn.addEventListener('click', function () {
        if (confirm('Clear all completed and cancelled orders from history? Active orders will remain in the queue.')) {
          clearOrderHistory();
          currentPage = 1;
          renderLists();
        }
      });
    }

    window.addEventListener('storage', renderLists);
    window.addEventListener('cornercravings:orders-updated', renderLists);
    renderLists();
  }

  function initDetailsPage() {
    var form = document.getElementById('order-update-form');
    if (!form) return;
    var id = new URLSearchParams(location.search).get('order');
    var orders = readOrders();
    var order = id ? orders.find(function (entry) { return String(entry.id) === String(id); }) : orders[0];
    if (!order) {
      var detailCard = document.querySelector('.order-detail-card');
      if (detailCard) {
        detailCard.innerHTML = '<div class="orders-empty" style="display:block; text-align:center; padding:48px 24px;"><h2>No Order Selected</h2><p>No active order was found. Place an order on the customer site to test the queue live, or return to upcoming orders.</p><a href="orders.html" class="btn-solid-sm" style="display:inline-block; margin-top:14px; text-decoration:none;">View Orders Queue</a></div>';
      }
      return;
    }
    var breadcrumb = document.querySelector('.order-breadcrumb strong'); if (breadcrumb) breadcrumb.textContent = 'ORD-' + order.id;
    var breadcrumbLink = document.querySelector('.order-breadcrumb a'); if (breadcrumbLink && isHistory(order)) { breadcrumbLink.href = 'order-history.html'; breadcrumbLink.textContent = 'Order History'; }
    var meta = document.querySelector('.order-detail-card__meta'); if (meta) meta.textContent = 'Placed: ' + new Date(order.placedAt).toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
    var customer = document.querySelector('.order-customer');
    if (customer) {
      var phoneHtml = order.phone ? '<span>' + escapeHtml(order.phone) + '</span>' : '';
      var ftypeHtml = '<span style="display:inline-block; margin-top:4px; font-weight:600; text-transform:uppercase; font-size:11px; letter-spacing:0.5px; color:#d97706;">' + escapeHtml(order.fulfillmentType === 'pickup' ? 'Store Pickup' : 'Delivery') + '</span>';
      var notesBadge = order.notes ? '<span style="display:block; margin-top:6px; font-size:12px; color:#b45309; background:#fef3c7; padding:4px 8px; border-radius:4px;"><strong>Special Instructions:</strong> ' + escapeHtml(order.notes) + '</span>' : '';
      customer.innerHTML = '<strong>Customer</strong><span>' + escapeHtml(order.customer) + '</span><span>' + escapeHtml(order.email) + '</span>' + phoneHtml + ftypeHtml + notesBadge;
    }
    var tbody = document.querySelector('.order-items tbody');
    if (tbody) tbody.innerHTML = (order.items || []).map(function (item) {
      var opt = item.option || item.customizationText || (item.size ? 'Size: ' + item.size : 'Regular');
      return '<tr><td><div class="order-product"><span class="order-product__icon">◇</span><div><strong>' + escapeHtml(item.name) + '</strong><span>' + escapeHtml(opt) + '</span></div></div></td><td>' + (item.quantity || 1) + '</td><td>' + peso(Number(item.price || item.unitPrice || 0) * Number(item.quantity || 1)) + '</td></tr>';
    }).join('') + '<tr class="order-total"><td></td><td>Total</td><td>' + peso(orderTotal(order)) + '</td></tr>';

    // Kitchen Recipe Ingredients & Inventory Consumption
    var invBadgeSlot = document.getElementById('order-inventory-badge-slot');
    var invDetailsSlot = document.getElementById('order-inventory-details');
    if (invDetailsSlot) {
      var invEngine = (typeof window !== 'undefined' && window.CornerCravingsInventory) ||
                      (typeof CornerCravingsInventory !== 'undefined' ? CornerCravingsInventory : null);
      if (invEngine && typeof invEngine.calculateOrderIngredients === 'function') {
        var reqs = invEngine.calculateOrderIngredients(order);
        if (invBadgeSlot) {
          invBadgeSlot.innerHTML = order.inventoryDeducted
            ? '<span style="background:#dcfce7; color:#15803d; padding:3px 10px; border-radius:12px; font-size:11px; font-weight:700;">Deducted from Stock</span>'
            : '<span style="background:#fef3c7; color:#b45309; padding:3px 10px; border-radius:12px; font-size:11px; font-weight:700;">Pending Kitchen Prep</span>';
        }
        if (reqs.length === 0) {
          invDetailsSlot.innerHTML = '<p style="color:#64748b; margin:0;">No specific raw ingredient mappings found for this order.</p>';
        } else {
          invDetailsSlot.innerHTML = '<div style="display:flex; flex-wrap:wrap; gap:8px; margin-top:4px;">' +
            reqs.map(function (req) {
              return '<div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:6px; padding:6px 10px; font-size:12px;">' +
                '<strong style="color:#1e293b;">' + escapeHtml(req.name) + '</strong>: ' + req.quantity + ' ' + escapeHtml(req.unit) +
              '</div>';
            }).join('') +
          '</div>' +
          (order.inventoryDeductedAt ? '<p style="font-size:11px; color:#64748b; margin-top:8px;">Deducted at: ' + new Date(order.inventoryDeductedAt).toLocaleString('en-PH') + '</p>' : '');
        }
      }
    }

    // Payment & Billing Information Rendering
    var badgeSlot = document.getElementById('payment-badge-slot');
    if (badgeSlot) {
      badgeSlot.innerHTML = '<span class="payment-badge payment-badge--' + (order.paymentStatus || 'unpaid') + '">' + escapeHtml(order.paymentStatus || 'unpaid') + '</span>';
    }
    var billingSlot = document.getElementById('payment-details-info');
    if (billingSlot) {
      var payMethod = escapeHtml(order.paymentMethod || 'Cash on Delivery');
      var refText = (order.paymentDetails && order.paymentDetails.referenceNumber)
        ? '<br><strong>Ref Number:</strong> ' + escapeHtml(order.paymentDetails.referenceNumber)
        : (order.paymentReference ? '<br><strong>Ref Number:</strong> ' + escapeHtml(order.paymentReference) : '');
      var senderText = (order.paymentDetails && order.paymentDetails.senderName)
        ? '<br><strong>Sender Name:</strong> ' + escapeHtml(order.paymentDetails.senderName)
        : '';
      var recipientText = (order.paymentDetails && order.paymentDetails.recipientNumber)
        ? '<br><strong>Sent To:</strong> ' + escapeHtml(order.paymentDetails.recipientNumber)
        : '';
      var submittedAmountText = (order.paymentDetails && Number.isFinite(Number(order.paymentDetails.amountSubmitted)))
        ? '<br><strong>Submitted Amount:</strong> ' + peso(Number(order.paymentDetails.amountSubmitted))
        : '';
      billingSlot.innerHTML = '<strong>Payment Method:</strong> ' + payMethod + senderText + recipientText + refText + submittedAmountText +
        '<br><strong>Payment Status:</strong> ' + escapeHtml(order.paymentStatus || 'unpaid') +
        '<br><strong>Total Amount:</strong> ' + peso(orderTotal(order));

      var receiptData = order.paymentDetails && order.paymentDetails.receiptImage;
      if (receiptData && /^data:image\/(png|jpeg|webp);base64,/i.test(receiptData)) {
        var receiptWrap = document.createElement('div');
        receiptWrap.style.marginTop = '12px';
        var receiptLabel = document.createElement('strong');
        receiptLabel.textContent = 'Receipt Screenshot:';
        var receiptLink = document.createElement('a');
        receiptLink.href = receiptData;
        receiptLink.target = '_blank';
        receiptLink.rel = 'noopener';
        receiptLink.style.display = 'block';
        receiptLink.style.marginTop = '6px';
        var receiptImg = document.createElement('img');
        receiptImg.src = receiptData;
        receiptImg.alt = 'Customer-submitted GCash receipt';
        receiptImg.style.width = 'min(100%, 280px)';
        receiptImg.style.maxHeight = '360px';
        receiptImg.style.objectFit = 'contain';
        receiptImg.style.border = '1px solid #e2e8f0';
        receiptImg.style.borderRadius = '8px';
        receiptLink.appendChild(receiptImg);
        receiptWrap.appendChild(receiptLabel);
        receiptWrap.appendChild(receiptLink);
        billingSlot.appendChild(receiptWrap);
      }
    }
    var actionsSlot = document.getElementById('payment-actions-slot');
    if (actionsSlot) {
      var actionBtns = '';
      if (order.paymentStatus !== 'paid' && order.paymentStatus !== 'refunded' && order.paymentStatus !== 'refund_pending') {
        actionBtns += '<button type="button" class="btn-solid-sm" id="btn-mark-paid" style="height:36px; font-size:12px;">Mark as Paid</button>';
      }
      if (order.paymentStatus === 'paid' || order.paymentStatus === 'refund_pending') {
        actionBtns += '<button type="button" class="btn-outline" id="btn-refund-order" style="height:36px; font-size:12px; color:#6d28d9; border-color:#ddd6fe;">Process Refund</button>';
      }
      actionsSlot.innerHTML = actionBtns;

      var markPaidBtn = document.getElementById('btn-mark-paid');
      if (markPaidBtn) {
        markPaidBtn.addEventListener('click', function () {
          if (confirm('Confirm that payment for Order #ORD-' + order.id + ' has been received and verified?')) {
            markPaymentPaid(order.id, 'Payment marked as Paid by Admin');
            initDetailsPage();
          }
        });
      }

      var refundBtn = document.getElementById('btn-refund-order');
      if (refundBtn) {
        refundBtn.addEventListener('click', function () {
          var reason = prompt('Enter reason for issuing refund:');
          if (reason === null) return;
          reason = reason.trim() || 'Refund processed by Admin';
          processRefund(order.id, reason);
          initDetailsPage();
        });
      }
    }

    // Status History Audit Timeline
    var timeline = document.getElementById('order-audit-timeline');
    if (timeline) {
      var history = Array.isArray(order.statusHistory) ? order.statusHistory : [];
      if (history.length === 0) {
        timeline.innerHTML = '<p style="color:#8c827f; margin:0;">No audit history recorded.</p>';
      } else {
        timeline.innerHTML = '<ul style="list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:8px;">' +
          history.map(function (entry) {
            var dateStr = entry.timestamp ? new Date(entry.timestamp).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '—';
            var actorBadge = '<span style="font-size:11px; font-weight:700; text-transform:uppercase; padding:1px 6px; border-radius:3px; background:#e5e7eb; color:#374151;">' + escapeHtml(entry.actor || 'system') + '</span>';
            return '<li style="padding:6px 0; border-bottom:1px dashed #f0e9e7;">' +
              '<span style="color:#8c827f; font-size:12px; margin-right:8px;">' + dateStr + '</span>' +
              actorBadge + ' <strong>' + escapeHtml(entry.status || '') + '</strong>: ' +
              '<span style="color:#4b5563;">' + escapeHtml(entry.note || '') + '</span>' +
            '</li>';
          }).join('') +
        '</ul>';
      }
    }

    var status = document.getElementById('fulfillment-status');
    if (status) {
      var availableStatuses = [order.status].concat(allowedNextStatuses(order));
      status.innerHTML = availableStatuses.map(function (value) {
        return '<option value="' + escapeHtml(value) + '">' + escapeHtml(statusLabel(value, order)) + '</option>';
      }).join('');
      status.value = order.status;
    }
    var notes = document.getElementById('admin-notes'); if (notes) notes.value = order.notes || '';
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var newStatus = status.value;
      var newNotes = notes.value.trim();
      var now = new Date().toISOString();
      var validNextStatuses = allowedNextStatuses(order);
      if (newStatus !== order.status && validNextStatuses.indexOf(newStatus) === -1) {
        alert('This status change is not allowed. Follow the order workflow one step at a time.');
        return;
      }
      var isFinalStatus = newStatus === 'Completed' || newStatus === 'Delivered' || newStatus === 'Picked Up';
      var isCashPayment = String(order.paymentMethod || '').toLowerCase().indexOf('cash') !== -1;
      if (isFinalStatus && !isCashPayment && order.paymentStatus !== 'paid') {
        alert('Verify the digital payment before completing this order.');
        return;
      }
      if (!Array.isArray(order.statusHistory)) order.statusHistory = [];
      if (order.status !== newStatus || newNotes !== (order.notes || '')) {
        order.statusHistory.push({
          status: newStatus,
          timestamp: now,
          actor: 'admin',
          note: newNotes ? 'Admin: ' + newNotes : 'Status updated to ' + newStatus
        });
      }

      // Handle ingredient deduction if admin sets Preparing
      if (newStatus === 'Preparing' && !order.inventoryDeducted) {
        var invEngine2 = (typeof window !== 'undefined' && window.CornerCravingsInventory) ||
                         (typeof CornerCravingsInventory !== 'undefined' ? CornerCravingsInventory : null);
        if (invEngine2 && typeof invEngine2.deductOrderIngredients === 'function') {
          var deductionResult = invEngine2.deductOrderIngredients(order);
          if (!deductionResult || !deductionResult.success) {
            var shortageMessage = deductionResult && Array.isArray(deductionResult.missing)
              ? deductionResult.missing.map(function (missing) { return missing.name + ' (needs ' + missing.required + ', available ' + missing.available + ')'; }).join(', ')
              : (deductionResult && deductionResult.reason) || 'Inventory could not be deducted.';
            alert('Cannot start preparation: ' + shortageMessage);
            return;
          }
          if (deductionResult && deductionResult.success && deductionResult.deducted && deductionResult.deducted.length > 0) {
            order.statusHistory.push({
              status: 'Preparing',
              timestamp: now,
              actor: 'admin',
              note: '[Inventory] Deducted ' + deductionResult.deducted.length + ' recipe ingredients for kitchen prep'
            });
          }
        }
      } else if (newStatus === 'Cancelled' && order.inventoryDeducted) {
        var restoreStock = confirm('Restore the deducted ingredients to stock? Choose OK only if they were not consumed. Choose Cancel to record kitchen waste.');
        var cancelInvEngine = (typeof window !== 'undefined' && window.CornerCravingsInventory) ||
                              (typeof CornerCravingsInventory !== 'undefined' ? CornerCravingsInventory : null);
        if (restoreStock && cancelInvEngine && typeof cancelInvEngine.restoreOrderIngredients === 'function') {
          var restored = cancelInvEngine.restoreOrderIngredients(order, newNotes || 'Admin cancellation');
          order.statusHistory.push({
            status: 'Cancelled',
            timestamp: now,
            actor: 'admin',
            note: '[Inventory] Restored ' + ((restored && restored.restored && restored.restored.length) || 0) + ' ingredients to stock'
          });
        } else {
          order.statusHistory.push({
            status: 'Cancelled',
            timestamp: now,
            actor: 'admin',
            note: '[Inventory] Consumed recipe ingredients recorded as kitchen preparation waste'
          });
        }
      }

      order.status = newStatus;
      order.fulfillmentStatus = newStatus.toLowerCase().replace(/\s+/g, '_');
      order.notes = newNotes;
      order.updatedAt = now;
      order.statusUpdatedAt = now;
      if (isFinalStatus && isCashPayment) order.paymentStatus = 'paid';
      if (newStatus === 'Cancelled' && order.paymentStatus === 'paid') order.paymentStatus = 'refund_pending';
      saveOrders(orders);
      localStorage.setItem(LAST_UPDATED_KEY, order.id);
      location.href = 'order-update-success.html?order=' + encodeURIComponent(order.id);
    });
    var printButton = document.getElementById('print-order-ticket'); if (printButton) printButton.addEventListener('click', function () { window.print(); });
  }

  function initSuccessPage() {
    var card = document.querySelector('.order-success-card'); if (!card) return;
    var id = new URLSearchParams(location.search).get('order') || localStorage.getItem(LAST_UPDATED_KEY) || '8824';
    var order = readOrders().find(function (entry) { return String(entry.id) === String(id); }); if (!order) return;
    var paragraph = card.querySelector('p'); if (paragraph) paragraph.textContent = 'The status for Order #ORD-' + order.id + ' has been updated to ' + order.status + '.';
    var details = card.querySelector('.btn-outline'); if (details) details.href = 'order-details.html?order=' + encodeURIComponent(order.id);
    var back = card.querySelector('.btn-solid-sm'); if (back) { back.href = isHistory(order) ? 'order-history.html' : 'orders.html'; back.textContent = isHistory(order) ? 'Back to Order History' : 'Back to Upcoming Orders'; }
  }

  window.CornerCravingsOrders = {
    readOrders: readOrders,
    saveOrders: saveOrders,
    clearOrderHistory: clearOrderHistory,
    loadDemoOrders: loadDemoOrders,
    clearDemoOrders: clearDemoOrders,
    resetDemoOrders: resetDemoOrders,
    markPaymentPaid: markPaymentPaid,
    processRefund: processRefund
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      readOrders: readOrders,
      saveOrders: saveOrders,
      clearOrderHistory: clearOrderHistory,
      loadDemoOrders: loadDemoOrders,
      clearDemoOrders: clearDemoOrders,
      resetDemoOrders: resetDemoOrders,
      markPaymentPaid: markPaymentPaid,
      processRefund: processRefund
    };
  }

  if (typeof document !== 'undefined') {
    initListPage();
    initDetailsPage();
    initSuccessPage();
  }
})();
