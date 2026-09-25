(function () {
  'use strict';

  var currentFilter = 'all'; // 'today' | '7days' | 'month' | 'all'
  var includeDemo = false;

  function peso(val) {
    return '₱' + Number(val || 0).toFixed(2);
  }

  function escapeHtml(str) {
    if (str == null) return '';
    if (typeof document !== 'undefined') {
      var div = document.createElement('div');
      div.textContent = String(str);
      return div.innerHTML;
    }
    return String(str).replace(/[&<>"']/g, function (m) {
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
      var data = JSON.parse(localStorage.getItem('cornerCravingsAdminOrders') || '[]');
      if (!Array.isArray(data)) return [];
      var customerOrders = data.filter(function (order) { return !isMockOrder(order); });
      if (customerOrders.length !== data.length) {
        localStorage.setItem('cornerCravingsAdminOrders', JSON.stringify(customerOrders));
      }
      return customerOrders;
    } catch (e) {
      return [];
    }
  }

  function orderTotal(order) {
    if (order.totals && Number.isFinite(Number(order.totals.total))) return Number(order.totals.total);
    if (Number.isFinite(Number(order.total))) return Number(order.total);
    return (order.items || []).reduce(function (sum, item) {
      return sum + Number(item.price || 0) * Number(item.quantity || 1);
    }, 0);
  }

  function isWithinDateRange(isoDateString, filter) {
    if (!isoDateString || filter === 'all') return true;
    var orderDate = new Date(isoDateString);
    var now = new Date();
    if (isNaN(orderDate.getTime())) return true;

    if (filter === 'today') {
      return orderDate.getFullYear() === now.getFullYear() &&
             orderDate.getMonth() === now.getMonth() &&
             orderDate.getDate() === now.getDate();
    }
    if (filter === '7days') {
      var sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return orderDate >= sevenDaysAgo;
    }
    if (filter === 'month') {
      return orderDate.getFullYear() === now.getFullYear() &&
             orderDate.getMonth() === now.getMonth();
    }
    return true;
  }

  function calculateDashboardMetrics(orders, filter, withDemo) {
    var filtered = orders.filter(function (order) {
      if (!withDemo && order.isDemo) return false;
      return isWithinDateRange(order.placedAt, filter);
    });

    var completed = filtered.filter(function (o) {
      var completedStatus = o.status === 'Completed' || o.status === 'Delivered' || o.status === 'Picked Up';
      return completedStatus && o.paymentStatus === 'paid';
    });
    var active = filtered.filter(function (o) {
      return o.status === 'Pending' || o.status === 'Preparing' || o.status === 'Ready' || o.status === 'Out for Delivery';
    });
    var cancelled = filtered.filter(function (o) { return o.status === 'Cancelled'; });

    var grossRevenue = completed.reduce(function (sum, o) {
      return sum + orderTotal(o);
    }, 0);

    var aov = completed.length > 0 ? (grossRevenue / completed.length) : 0;

    // Category sales aggregation
    var categoryTotals = {};
    var menuLookup = {};
    if (typeof window !== 'undefined' && Array.isArray(window.CornerCravingsMenu)) {
      window.CornerCravingsMenu.forEach(function (p) {
        menuLookup[p.name.toLowerCase().trim()] = p.categoryLabel || p.category;
      });
    }

    completed.forEach(function (o) {
      (o.items || []).forEach(function (item) {
        var cat = item.category || menuLookup[String(item.name).toLowerCase().trim()] || 'Other Favorites';
        if (!categoryTotals[cat]) categoryTotals[cat] = { revenue: 0, count: 0 };
        var lineTotal = Number(item.price || 0) * Number(item.quantity || 1);
        categoryTotals[cat].revenue += lineTotal;
        categoryTotals[cat].count += Number(item.quantity || 1);
      });
    });

    // Fulfillment split
    var deliveryCount = 0;
    var pickupCount = 0;
    filtered.forEach(function (o) {
      if (o.fulfillmentType === 'pickup') pickupCount++;
      else deliveryCount++;
    });

    // Payment split
    var paymentSplit = { cod: 0, gcash: 0, maya: 0, other: 0 };
    filtered.forEach(function (o) {
      var method = String(o.paymentMethod || '').toLowerCase();
      if (method.indexOf('gcash') !== -1) paymentSplit.gcash++;
      else if (method.indexOf('maya') !== -1) paymentSplit.maya++;
      else if (method.indexOf('cash') !== -1) paymentSplit.cod++;
      else paymentSplit.other++;
    });

    return {
      filteredOrders: filtered,
      totalOrders: filtered.length,
      completedCount: completed.length,
      activeCount: active.length,
      cancelledCount: cancelled.length,
      grossRevenue: grossRevenue,
      aov: aov,
      categoryTotals: categoryTotals,
      fulfillment: {
        delivery: deliveryCount,
        pickup: pickupCount,
        total: deliveryCount + pickupCount
      },
      payments: paymentSplit
    };
  }

  function getStoreOverrideStatus() {
    var raw = localStorage.getItem('cornerCravingsStoreStatus');
    if (!raw) return { isOverridden: false, isOpen: true, label: 'Automatic Schedule' };
    try {
      var parsed = JSON.parse(raw);
      return { isOverridden: true, isOpen: !!parsed.isOpen, label: parsed.isOpen ? 'Manually Open' : 'Manually Closed' };
    } catch (e) {
      var s = String(raw).trim().toLowerCase();
      if (s === 'open') return { isOverridden: true, isOpen: true, label: 'Manually Open' };
      if (s === 'closed') return { isOverridden: true, isOpen: false, label: 'Manually Closed' };
      return { isOverridden: false, isOpen: true, label: 'Automatic Schedule' };
    }
  }

  function setStoreOverride(state) {
    if (state === 'auto') {
      localStorage.removeItem('cornerCravingsStoreStatus');
    } else {
      localStorage.setItem('cornerCravingsStoreStatus', state);
    }
    try {
      window.dispatchEvent(new CustomEvent('cornercravings:store-status-updated'));
    } catch (e) {}
    renderStoreControl();
  }

  function renderStoreControl() {
    if (typeof document === 'undefined') return;
    var container = document.getElementById('store-control-slot');
    if (!container) return;

    var statusObj = getStoreOverrideStatus();
    var isActuallyOpen = statusObj.isOpen;
    var scheduleLabel = '9:00 AM – 9:00 PM';

    if (typeof window !== 'undefined' && window.CornerCravings && typeof window.CornerCravings.getStoreStatus === 'function') {
      var live = window.CornerCravings.getStoreStatus();
      scheduleLabel = live.hours || scheduleLabel;
      if (!statusObj.isOverridden) isActuallyOpen = live.isOpen;
    }

    var badgeClass = isActuallyOpen ? 'store-control-badge--open' : 'store-control-badge--closed';
    var badgeText = isActuallyOpen ? 'Accepting Orders' : 'Store Closed';

    var buttonHtml = '';
    if (isActuallyOpen) {
      buttonHtml = '<button type="button" class="btn-store-toggle btn-store-toggle--close" id="btn-toggle-store">Pause / Close Ordering</button>';
    } else {
      buttonHtml = '<button type="button" class="btn-store-toggle btn-store-toggle--open" id="btn-toggle-store">Reopen Store</button>';
    }

    if (statusObj.isOverridden) {
      buttonHtml += ' <button type="button" class="btn-outline" style="height:38px; font-size:12px;" id="btn-reset-store-auto">Reset to Schedule</button>';
    }

    container.innerHTML =
      '<div class="store-control-card">' +
        '<div class="store-control-info">' +
          '<span class="store-control-badge ' + badgeClass + '"><span class="dot"></span>' + badgeText + '</span>' +
          '<div>' +
            '<p class="store-control-title">Store Operating Status</p>' +
            '<p class="store-control-desc">Schedule: ' + escapeHtml(scheduleLabel) + ' · Mode: <strong>' + statusObj.label + '</strong></p>' +
          '</div>' +
        '</div>' +
        '<div class="store-control-actions">' +
          buttonHtml +
        '</div>' +
      '</div>';

    var toggleBtn = document.getElementById('btn-toggle-store');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', function () {
        setStoreOverride(isActuallyOpen ? 'closed' : 'open');
      });
    }

    var resetBtn = document.getElementById('btn-reset-store-auto');
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        setStoreOverride('auto');
      });
    }
  }

  function renderDashboard() {
    renderStoreControl();

    var orders = readOrders();
    var metrics = calculateDashboardMetrics(orders, currentFilter, includeDemo);

    // 1. KPI Cards
    var elRevenue = document.getElementById('kpi-revenue');
    var elCompleted = document.getElementById('kpi-completed');
    var elActive = document.getElementById('kpi-active');
    var elAov = document.getElementById('kpi-aov');

    if (elRevenue) elRevenue.textContent = peso(metrics.grossRevenue);
    if (elCompleted) elCompleted.textContent = metrics.completedCount;
    if (elActive) elActive.textContent = metrics.activeCount;
    if (elAov) elAov.textContent = peso(metrics.aov);

    var elScopeNote = document.getElementById('kpi-scope-note');
    if (elScopeNote) {
      elScopeNote.textContent = 'Showing customer-submitted orders only (' + metrics.filteredOrders.length + ')';
    }

    // 2. Category Performance Bars
    var catContainer = document.getElementById('category-bars-slot');
    if (catContainer) {
      var cats = Object.keys(metrics.categoryTotals).map(function (name) {
        return { name: name, revenue: metrics.categoryTotals[name].revenue, count: metrics.categoryTotals[name].count };
      }).sort(function (a, b) { return b.revenue - a.revenue; });

      var maxRev = cats.length > 0 && cats[0].revenue > 0 ? cats[0].revenue : 1;

      if (cats.length === 0) {
        catContainer.innerHTML = '<p style="color:#8c827f; font-size:13px; margin:10px 0;">No sales recorded in this period.</p>';
      } else {
        catContainer.innerHTML = cats.map(function (c) {
          var pct = Math.min(100, Math.round((c.revenue / maxRev) * 100));
          return '<div class="category-bar-item">' +
            '<div class="category-bar-labels">' +
              '<span>' + escapeHtml(c.name) + ' <small style="color:#8c827f; font-weight:normal;">(' + c.count + ' sold)</small></span>' +
              '<span>' + peso(c.revenue) + '</span>' +
            '</div>' +
            '<div class="category-bar-track">' +
              '<div class="category-bar-fill" style="width: ' + pct + '%;"></div>' +
            '</div>' +
          '</div>';
        }).join('');
      }
    }

    // 3. Fulfillment & Payment Breakdown
    var breakdownContainer = document.getElementById('breakdown-slot');
    if (breakdownContainer) {
      var totalFulfill = metrics.fulfillment.total || 1;
      var delPct = Math.round((metrics.fulfillment.delivery / totalFulfill) * 100);
      var picPct = 100 - delPct;

      breakdownContainer.innerHTML =
        '<div class="breakdown-list">' +
          '<div class="breakdown-row">' +
            '<div class="breakdown-row__title">' +
              '<span class="breakdown-row__badge">Fulfillment</span>' +
              '<span>Delivery</span>' +
            '</div>' +
            '<div class="breakdown-row__values">' +
              '<span class="breakdown-row__amount">' + metrics.fulfillment.delivery + ' orders</span>' +
              '<span class="breakdown-row__percent">' + delPct + '% of orders</span>' +
            '</div>' +
          '</div>' +
          '<div class="breakdown-row">' +
            '<div class="breakdown-row__title">' +
              '<span class="breakdown-row__badge">Fulfillment</span>' +
              '<span>Store Pickup</span>' +
            '</div>' +
            '<div class="breakdown-row__values">' +
              '<span class="breakdown-row__amount">' + metrics.fulfillment.pickup + ' orders</span>' +
              '<span class="breakdown-row__percent">' + picPct + '% of orders</span>' +
            '</div>' +
          '</div>' +
          '<div class="breakdown-row">' +
            '<div class="breakdown-row__title">' +
              '<span class="breakdown-row__badge" style="background:#fef3c7; color:#92400e; border-color:#fde68a;">Payment</span>' +
              '<span>Cash on Delivery / Pickup</span>' +
            '</div>' +
            '<div class="breakdown-row__values">' +
              '<span class="breakdown-row__amount">' + metrics.payments.cod + ' orders</span>' +
            '</div>' +
          '</div>' +
          '<div class="breakdown-row">' +
            '<div class="breakdown-row__title">' +
              '<span class="breakdown-row__badge" style="background:#eff6ff; color:#1d4ed8; border-color:#bfdbfe;">E-Wallet</span>' +
              '<span>GCash / Maya</span>' +
            '</div>' +
            '<div class="breakdown-row__values">' +
              '<span class="breakdown-row__amount">' + (metrics.payments.gcash + metrics.payments.maya) + ' orders</span>' +
            '</div>' +
          '</div>' +
        '</div>';
    }

    // 4. Recent Orders Feed
    var recentSlot = document.getElementById('recent-orders-slot');
    if (recentSlot) {
      var sorted = orders.slice().sort(function (a, b) {
        return new Date(b.placedAt || 0) - new Date(a.placedAt || 0);
      }).slice(0, 5);

      if (sorted.length === 0) {
        recentSlot.innerHTML = '<tr class="orders-table__empty-row"><td colspan="5">No orders available.</td></tr>';
      } else {
        recentSlot.innerHTML = sorted.map(function (o) {
          var itemsCount = (o.items || []).reduce(function (sum, item) { return sum + Number(item.quantity || 1); }, 0);
          var dateStr = o.placedAt ? new Date(o.placedAt).toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' }) : '—';
          var paymentBadge = '<span class="payment-badge payment-badge--' + (o.paymentStatus || 'unpaid') + '">' + escapeHtml(o.paymentStatus || 'unpaid') + '</span>';
          var statusKey = String(o.status || 'Pending').toLowerCase().replace(/\s+/g, '-');

          return '<tr style="cursor:pointer;" onclick="location.href=\'order-details.html?order=' + encodeURIComponent(o.id) + '\'">' +
            '<td data-label="Order"><a class="order-link" href="order-details.html?order=' + encodeURIComponent(o.id) + '">#ORD-' + escapeHtml(o.id) + '</a></td>' +
            '<td data-label="Customer"><strong>' + escapeHtml(o.customer || 'Guest') + '</strong></td>' +
            '<td data-label="Time">' + dateStr + '</td>' +
            '<td data-label="Details">' + itemsCount + ' items · ' + peso(orderTotal(o)) + '</td>' +
            '<td data-label="Status">' + paymentBadge + ' <span class="order-status order-status--' + statusKey + '">' + escapeHtml(o.status) + '</span></td>' +
          '</tr>';
        }).join('');
      }
    }

    // 5. Kitchen Inventory & Low Stock Alerts
    var lowStockSlot = document.getElementById('low-stock-slot');
    if (lowStockSlot) {
      var invEngine = (typeof window !== 'undefined' && window.CornerCravingsInventory) ||
                      (typeof CornerCravingsInventory !== 'undefined' ? CornerCravingsInventory : null);
      if (invEngine && typeof invEngine.getInventoryItems === 'function') {
        var allItems = invEngine.getInventoryItems();
        var alertItems = allItems.filter(function (it) {
          return it.inventoryStatus === 'LOW' || it.inventoryStatus === 'OUT';
        });

        if (alertItems.length === 0) {
          lowStockSlot.innerHTML = '<div style="padding:16px; background:#f0fdf4; border:1px solid #bbf7d0; border-radius:8px; color:#166534; font-size:13px; display:flex; align-items:center; gap:8px;">' +
            '<span style="font-size:16px; font-weight:bold;">✓</span> All kitchen ingredients are sufficiently stocked above reorder thresholds.' +
          '</div>';
        } else {
          lowStockSlot.innerHTML = '<div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(260px, 1fr)); gap:10px;">' +
            alertItems.map(function (it) {
              var isOut = it.stock <= 0;
              var badgeBg = isOut ? '#fef2f2' : '#fffbeb';
              var badgeBorder = isOut ? '#fecaca' : '#fde68a';
              var badgeColor = isOut ? '#b91c1c' : '#b45309';
              var statusTag = isOut ? 'OUT OF STOCK' : 'LOW STOCK';

              return '<div style="background:' + badgeBg + '; border:1px solid ' + badgeBorder + '; border-radius:8px; padding:12px 14px; display:flex; justify-content:space-between; align-items:center;">' +
                '<div>' +
                  '<strong style="display:block; font-size:13px; color:#1e293b;">' + escapeHtml(it.name) + '</strong>' +
                  '<span style="font-size:11.5px; color:#64748b;">' + escapeHtml(it.category) + ' · Min: ' + it.reorderLevel + ' ' + escapeHtml(it.unit) + '</span>' +
                '</div>' +
                '<div style="text-align:right;">' +
                  '<strong style="font-size:15px; color:' + badgeColor + ';">' + it.stock + ' ' + escapeHtml(it.unit) + '</strong>' +
                  '<span style="display:block; font-size:9.5px; font-weight:700; color:' + badgeColor + '; text-transform:uppercase;">' + statusTag + '</span>' +
                '</div>' +
              '</div>';
            }).join('') +
          '</div>';
        }
      }
    }
  }

  function exportCSV() {
    var orders = readOrders();
    var metrics = calculateDashboardMetrics(orders, currentFilter, includeDemo);
    var list = metrics.filteredOrders;

    var headers = ['Order ID', 'Date Placed', 'Customer Name', 'Email', 'Phone', 'Fulfillment', 'Payment Method', 'Payment Status', 'Items Count', 'Total (PHP)', 'Status'];
    var rows = list.map(function (o) {
      var count = (o.items || []).reduce(function (sum, item) { return sum + Number(item.quantity || 1); }, 0);
      return [
        'ORD-' + o.id,
        o.placedAt || '',
        '"' + (o.customer || '').replace(/"/g, '""') + '"',
        o.email || '',
        o.phone || '',
        o.fulfillmentType || 'delivery',
        '"' + (o.paymentMethod || 'Cash').replace(/"/g, '""') + '"',
        o.paymentStatus || 'unpaid',
        count,
        orderTotal(o).toFixed(2),
        o.status || 'Pending'
      ];
    });

    var csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(',')].concat(rows.map(function (r) { return r.join(','); })).join('\n');
    if (typeof document === 'undefined') return csvContent;
    var encodedUri = encodeURI(csvContent);
    var link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'corner-cravings-sales-report-' + currentFilter + '-' + new Date().toISOString().slice(0, 10) + '.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function init() {
    if (typeof document === 'undefined') return;

    // Filter button handlers
    var filterBtns = document.querySelectorAll('[data-date-filter]');
    filterBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        filterBtns.forEach(function (b) { b.classList.remove('is-active'); });
        btn.classList.add('is-active');
        currentFilter = btn.getAttribute('data-date-filter');
        renderDashboard();
      });
    });

    // Scope toggle
    var scopeCheckbox = document.getElementById('scope-toggle-demo');
    if (scopeCheckbox) {
      scopeCheckbox.checked = includeDemo;
      scopeCheckbox.addEventListener('change', function () {
        includeDemo = scopeCheckbox.checked;
        renderDashboard();
      });
    }

    // Export button
    var exportBtn = document.getElementById('btn-export-sales-csv');
    if (exportBtn) {
      exportBtn.addEventListener('click', exportCSV);
    }

    window.addEventListener('storage', renderDashboard);
    window.addEventListener('cornercravings:orders-updated', renderDashboard);
    window.addEventListener('cornercravings:store-status-updated', renderDashboard);
    window.addEventListener('cornercravings:inventory-updated', renderDashboard);

    renderDashboard();
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  }

  // Export for testing
  if (typeof window !== 'undefined') {
    window.CornerCravingsDashboard = {
      calculateDashboardMetrics: calculateDashboardMetrics,
      isWithinDateRange: isWithinDateRange,
      orderTotal: orderTotal,
      getStoreOverrideStatus: getStoreOverrideStatus,
      setStoreOverride: setStoreOverride
    };
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      calculateDashboardMetrics: calculateDashboardMetrics,
      isWithinDateRange: isWithinDateRange,
      orderTotal: orderTotal,
      getStoreOverrideStatus: getStoreOverrideStatus,
      setStoreOverride: setStoreOverride
    };
  }
})();
