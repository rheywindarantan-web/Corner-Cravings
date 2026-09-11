(function () {
  'use strict';

  var stockInForm = document.getElementById('stock-in-form');
  var receiptBody = document.getElementById('receipt-body');
  var deliveryCount = document.getElementById('delivery-count');

  if (stockInForm && receiptBody) {
    stockInForm.addEventListener('submit', function (event) {
      event.preventDefault();
      var item = document.getElementById('stock-item');
      var category = document.getElementById('stock-category');
      var quantity = document.getElementById('stock-quantity');
      var received = document.getElementById('stock-date');

      if (!item.value || !category.value || !quantity.value || Number(quantity.value) <= 0 || !received.value) {
        window.alert('Please complete all delivery fields with a valid quantity.');
        return;
      }

      var row = document.createElement('tr');
      var cells = [item.options[item.selectedIndex].text, category.options[category.selectedIndex].text, quantity.value + ' units', received.value, 'Verified'];
      cells.forEach(function (value, index) {
        var cell = document.createElement('td');
        if (index === 4) cell.innerHTML = '<span class="inventory-status inventory-status--verified">Verified</span>';
        else cell.textContent = value;
        row.appendChild(cell);
      });
      receiptBody.prepend(row);
      deliveryCount.textContent = String(Number(deliveryCount.textContent || 0) + Number(quantity.value));
      stockInForm.reset();
      window.alert('Stock delivery logged successfully.');
    });
  }

  var search = document.getElementById('inventory-search');
  var filter = document.getElementById('inventory-category-filter');
  var outboundRows = Array.prototype.slice.call(document.querySelectorAll('#stock-out-body tr'));
  var empty = document.getElementById('inventory-empty');

  function filterOutbound() {
    if (!outboundRows.length) return;
    var query = search ? search.value.trim().toLowerCase() : '';
    var category = filter ? filter.value : 'all';
    var visible = 0;
    outboundRows.forEach(function (row) {
      var matchesText = row.textContent.toLowerCase().indexOf(query) !== -1;
      var matchesCategory = category === 'all' || row.dataset.category === category;
      var show = matchesText && matchesCategory;
      row.hidden = !show;
      if (show) visible += 1;
    });
    if (empty) empty.style.display = visible ? 'none' : 'block';
  }

  if (search) search.addEventListener('input', filterOutbound);
  if (filter) filter.addEventListener('change', filterOutbound);
})();
