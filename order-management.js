(function () {
  'use strict';
  var search = document.getElementById('order-search');
  var filter = document.getElementById('order-filter');
  var rows = Array.prototype.slice.call(document.querySelectorAll('#upcoming-orders-body tr'));
  var empty = document.getElementById('orders-empty');

  function applyFilters() {
    var query = search ? search.value.trim().toLowerCase() : '';
    var status = filter ? filter.value : 'all';
    var visible = 0;
    rows.forEach(function (row) {
      var show = row.textContent.toLowerCase().indexOf(query) !== -1 && (status === 'all' || row.dataset.status === status);
      row.hidden = !show;
      if (show) visible += 1;
    });
    if (empty) empty.style.display = visible ? 'none' : 'block';
  }
  if (search) search.addEventListener('input', applyFilters);
  if (filter) filter.addEventListener('change', applyFilters);

  rows.forEach(function (row) {
    row.addEventListener('click', function (event) {
      if (event.target.closest('a, button')) return;
      var link = row.querySelector('.order-link');
      if (link) window.location.href = link.href;
    });
  });

  var updateForm = document.getElementById('order-update-form');
  if (updateForm) {
    updateForm.addEventListener('submit', function (event) {
      event.preventDefault();
      var status = document.getElementById('fulfillment-status').value;
      localStorage.setItem('cornerCravingsOrder8824Status', status);
      window.location.href = 'order-update-success.html';
    });
  }

  var printButton = document.getElementById('print-order-ticket');
  if (printButton) printButton.addEventListener('click', function () { window.print(); });

  var savedStatus = localStorage.getItem('cornerCravingsOrder8824Status');
  var statusSelect = document.getElementById('fulfillment-status');
  if (savedStatus && statusSelect) statusSelect.value = savedStatus;
})();
