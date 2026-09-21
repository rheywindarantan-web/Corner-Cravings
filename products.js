(function () {
  'use strict';

  var PAGE_SIZE = 12;
  var currentPage = 1;
  var currentCategory = 'all';
  var grid = document.querySelector('.product-grid');
  var pagination = document.querySelector('.pagination');
  var search = document.querySelector('.topbar__search input');
  var products = Array.isArray(window.CornerCravingsMenu) ? window.CornerCravingsMenu : [];
  if (!grid) return;

  function escapeHtml(value) {
    var node = document.createElement('div');
    node.textContent = value == null ? '' : String(value);
    return node.innerHTML;
  }
  function peso(value) { return '₱' + Number(value).toFixed(2); }
  function orderTotal(order) {
    if (order.totals && Number.isFinite(Number(order.totals.total))) return Number(order.totals.total);
    if (Number.isFinite(Number(order.total))) return Number(order.total);
    return (order.items || []).reduce(function (sum, item) { return sum + Number(item.price || 0) * Number(item.quantity || 0); }, 0);
  }
  function renderSalesOverview() {
    var overview = document.getElementById('admin-sales-overview');
    if (!overview) {
      overview = document.createElement('section');
      overview.id = 'admin-sales-overview';
      overview.className = 'admin-sales-overview';
      overview.setAttribute('aria-label', 'Sales overview');
      grid.parentNode.insertBefore(overview, grid);
    }
    var orders = [];
    try { orders = JSON.parse(localStorage.getItem('cornerCravingsAdminOrders') || '[]'); } catch (error) { orders = []; }
    if (!Array.isArray(orders)) orders = [];
    var completed = orders.filter(function (order) { return order.status === 'Completed'; });
    var active = orders.filter(function (order) { return order.status !== 'Completed' && order.status !== 'Cancelled'; });
    var revenue = completed.reduce(function (sum, order) { return sum + orderTotal(order); }, 0);
    var average = completed.length ? revenue / completed.length : 0;
    overview.innerHTML = '<article><span>Completed Sales</span><strong>' + peso(revenue) + '</strong><small>Recorded in this browser</small></article>' +
      '<article><span>Completed Orders</span><strong>' + completed.length + '</strong><small>Fulfilled transactions</small></article>' +
      '<article><span>Active Orders</span><strong>' + active.length + '</strong><small>Pending through ready</small></article>' +
      '<article><span>Average Order</span><strong>' + peso(average) + '</strong><small>Completed orders</small></article>';
  }
  function readObject(key) {
    try { return JSON.parse(localStorage.getItem(key) || '{}'); }
    catch (error) { return {}; }
  }
  function saveAvailability(id, available) {
    var values = readObject('cornerCravingsProductAvailability');
    values[id] = available;
    localStorage.setItem('cornerCravingsProductAvailability', JSON.stringify(values));
  }
  function saveProductEdit(product) {
    var edits = readObject('cornerCravingsProductEdits');
    edits[product.id] = {
      name: product.name,
      price: product.price,
      description: product.description
    };
    localStorage.setItem('cornerCravingsProductEdits', JSON.stringify(edits));
  }
  function deleteProduct(id) {
    var deleted = [];
    try { deleted = JSON.parse(localStorage.getItem('cornerCravingsDeletedProducts') || '[]'); }
    catch (error) { deleted = []; }
    if (!Array.isArray(deleted)) deleted = [];
    if (deleted.indexOf(id) === -1) deleted.push(id);
    localStorage.setItem('cornerCravingsDeletedProducts', JSON.stringify(deleted));
    products = products.filter(function (product) { return product.id !== id; });
  }

  var filterButton = document.querySelector('[data-action="filter"]');
  var categorySelect = document.createElement('select');
  var labels = {};
  products.forEach(function (product) { labels[product.category] = product.categoryLabel; });
  categorySelect.className = 'product-category-filter';
  categorySelect.setAttribute('aria-label', 'Filter products by category');
  categorySelect.innerHTML = '<option value="all">All categories</option>' + Object.keys(labels).map(function (key) {
    return '<option value="' + escapeHtml(key) + '">' + escapeHtml(labels[key]) + '</option>';
  }).join('');
  if (filterButton) filterButton.replaceWith(categorySelect);

  function filteredProducts() {
    var query = search ? search.value.trim().toLowerCase() : '';
    return products.filter(function (product) {
      return (currentCategory === 'all' || product.category === currentCategory) &&
        (!query || (product.name + ' ' + product.categoryLabel + ' ' + product.description).toLowerCase().indexOf(query) !== -1);
    });
  }

  function card(product, index) {
    var available = product.available !== false;
    var lazyAttr = index > 3 ? ' loading="lazy"' : '';
    var image = product.imageJpg
      ? '<img src="' + escapeHtml(product.imageJpg) + '" alt="' + escapeHtml(product.imageAlt) + '" data-product-image data-product-name="' + escapeHtml(product.name) + '"' + lazyAttr + ' />'
      : '<div class="admin-product-placeholder"><span>Image coming soon</span><small>' + escapeHtml(product.name) + '</small></div>';
    return '<article class="product-card" data-product-card="' + escapeHtml(product.id) + '">' +
      '<div class="product-card__image">' + image + '<span class="badge badge--category">' + escapeHtml(product.categoryLabel) + '</span></div>' +
      '<div class="product-card__body"><div class="product-card__title-row"><h3 class="product-card__name">' + escapeHtml(product.name) + '</h3><span class="product-card__price">' + peso(product.price) + '</span></div>' +
      '<p class="product-card__desc">' + escapeHtml(product.description) + '</p>' +
      '<div class="product-card__footer"><span class="status-pill ' + (available ? 'status-pill--available' : 'status-pill--soldout') + '"><span class="status-pill__dot"></span>' + (available ? 'Available' : 'Unavailable') + '</span>' +
      '<div class="product-card__actions"><button class="product-action product-action--availability" type="button" data-toggle-product="' + escapeHtml(product.id) + '" title="Toggle availability">' + (available ? '✓' : '×') + '</button>' +
      '<button class="product-action product-action--edit" type="button" data-edit-product="' + escapeHtml(product.id) + '">Edit</button>' +
      '<button class="product-action product-action--delete" type="button" data-delete-product="' + escapeHtml(product.id) + '">Delete</button></div></div></div></article>';
  }

  function attachImageFallbacks() {
    grid.querySelectorAll('[data-product-image]').forEach(function (img) {
      img.addEventListener('error', function () {
        var media = img.closest('.product-card__image');
        if (!media) return;
        var placeholder = document.createElement('div');
        placeholder.className = 'admin-product-placeholder';
        placeholder.innerHTML = '<span>Image coming soon</span><small>' + escapeHtml(img.dataset.productName) + '</small>';
        img.replaceWith(placeholder);
      }, { once: true });
    });
  }

  function render() {
    renderSalesOverview();
    var filtered = filteredProducts();
    var pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    if (currentPage > pages) currentPage = pages;
    var start = (currentPage - 1) * PAGE_SIZE;
    var shown = filtered.slice(start, start + PAGE_SIZE);
    grid.innerHTML = shown.map(card).join('') + '<a class="add-product-card" href="add-product.html"><span class="add-product-card__icon">＋</span><p class="add-product-card__title">Add New Product</p><p class="add-product-card__subtitle">Expand your menu</p></a>';
    if (!shown.length) grid.innerHTML = '<div class="admin-products-empty"><h3>No products found</h3><p>Try another search or category.</p></div><a class="add-product-card" href="add-product.html"><span class="add-product-card__icon">＋</span><p class="add-product-card__title">Add New Product</p></a>';
    attachImageFallbacks();
    if (pagination) {
      var buttons = '<button class="page-btn" type="button" data-page="prev" ' + (currentPage === 1 ? 'disabled' : '') + ' aria-label="Previous page">‹</button>';
      for (var page = 1; page <= pages; page += 1) buttons += '<button class="page-btn' + (page === currentPage ? ' is-active' : '') + '" type="button" data-page="' + page + '">' + page + '</button>';
      buttons += '<button class="page-btn" type="button" data-page="next" ' + (currentPage === pages ? 'disabled' : '') + ' aria-label="Next page">›</button>';
      pagination.innerHTML = buttons;
    }
  }

  categorySelect.addEventListener('change', function () { currentCategory = this.value; currentPage = 1; render(); });
  if (search) search.addEventListener('input', function () { currentPage = 1; render(); });
  if (pagination) pagination.addEventListener('click', function (event) {
    var button = event.target.closest('[data-page]');
    if (!button || button.disabled) return;
    currentPage = button.dataset.page === 'prev' ? currentPage - 1 : button.dataset.page === 'next' ? currentPage + 1 : Number(button.dataset.page);
    render();
  });
  grid.addEventListener('click', function (event) {
    var availabilityButton = event.target.closest('[data-toggle-product]');
    var editButton = event.target.closest('[data-edit-product]');
    var deleteButton = event.target.closest('[data-delete-product]');
    var id = availabilityButton ? availabilityButton.dataset.toggleProduct : editButton ? editButton.dataset.editProduct : deleteButton ? deleteButton.dataset.deleteProduct : '';
    if (!id) return;
    var product = products.find(function (entry) { return entry.id === id; });
    if (!product) return;

    if (availabilityButton) {
      product.available = product.available === false;
      saveAvailability(product.id, product.available);
    } else if (editButton) {
      var name = window.prompt('Product name:', product.name);
      if (name === null) return;
      name = name.trim();
      if (!name) { window.alert('Product name cannot be empty.'); return; }
      var priceText = window.prompt('Price in pesos:', String(product.price));
      if (priceText === null) return;
      var price = Number(priceText);
      if (!Number.isFinite(price) || price < 0) { window.alert('Enter a valid product price.'); return; }
      var description = window.prompt('Product description:', product.description);
      if (description === null) return;
      product.name = name;
      product.price = price;
      product.description = description.trim();
      saveProductEdit(product);
    } else if (deleteButton) {
      if (!window.confirm('Delete "' + product.name + '" from the customer and admin menus?')) return;
      deleteProduct(product.id);
    }
    render();
  });

  render();
  window.addEventListener('storage', function (event) { if (event.key === 'cornerCravingsAdminOrders') renderSalesOverview(); });
})();
