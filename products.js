(function () {
  'use strict';

  var PAGE_SIZE = 12;

  function escapeHtml(value) {
    var node = document.createElement('div');
    node.textContent = value == null ? '' : String(value);
    return node.innerHTML;
  }

  function peso(value) {
    return '₱' + Number(value).toFixed(2);
  }

  function orderTotal(order) {
    if (order.totals && Number.isFinite(Number(order.totals.total))) return Number(order.totals.total);
    if (Number.isFinite(Number(order.total))) return Number(order.total);
    return (order.items || []).reduce(function (sum, item) {
      return sum + Number(item.price || 0) * Number(item.quantity || 0);
    }, 0);
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
    if (typeof window !== 'undefined' && window.CornerCravingsInventory && typeof window.CornerCravingsInventory.deleteProductRecipe === 'function') {
      window.CornerCravingsInventory.deleteProductRecipe(id);
    }
  }

  function initProductsUI() {
    var grid = document.querySelector('.product-grid');
    if (!grid) return;

    var currentPage = 1;
    var currentCategory = 'all';
    var pagination = document.querySelector('.pagination');
    var search = document.querySelector('.topbar__search input');
    var products = (typeof window !== 'undefined' && Array.isArray(window.CornerCravingsMenu)) ? window.CornerCravingsMenu : [];
    var inventoryEngine = window.CornerCravingsInventory;
    var inventoryItems = inventoryEngine && typeof inventoryEngine.getInventoryItems === 'function' ? inventoryEngine.getInventoryItems() : [];
    var recipeEditor = null;

    function recipeOptions(selectedSku) {
      return '<option value="">Choose an ingredient</option>' + inventoryItems.slice().sort(function (a, b) { return a.name.localeCompare(b.name); }).map(function (item) {
        return '<option value="' + escapeHtml(item.sku) + '"' + (item.sku === selectedSku ? ' selected' : '') + '>' + escapeHtml(item.name) + ' (' + escapeHtml(item.unit) + ')</option>';
      }).join('');
    }

    function addEditRecipeRow(entry) {
      if (!recipeEditor) return;
      var rows = recipeEditor.querySelector('[data-edit-recipe-rows]');
      var row = document.createElement('div');
      row.className = 'edit-recipe-row';
      row.innerHTML = '<select class="edit-recipe-ingredient" aria-label="Ingredient" required>' + recipeOptions(entry && entry.sku) + '</select><div class="edit-recipe-quantity"><input class="edit-recipe-amount" aria-label="Quantity per serving" type="number" min="0.001" step="0.001" value="' + (entry && entry.qty ? entry.qty : '') + '" required><span>unit</span></div><button type="button" class="edit-recipe-remove">Remove</button>';
      rows.appendChild(row);
      var select = row.querySelector('select');
      function updateUnit() {
        var item = inventoryItems.find(function (candidate) { return candidate.sku === select.value; });
        row.querySelector('.edit-recipe-quantity span').textContent = item ? item.unit : 'unit';
      }
      select.addEventListener('change', updateUnit);
      row.querySelector('.edit-recipe-remove').addEventListener('click', function () {
        row.remove();
        if (!rows.children.length) addEditRecipeRow();
      });
      updateUnit();
    }

    function ensureRecipeEditor() {
      if (recipeEditor) return recipeEditor;
      var body = document.querySelector('#product-edit-modal .product-modal-body');
      if (!body) return null;
      recipeEditor = document.createElement('section');
      recipeEditor.className = 'edit-recipe-editor';
      recipeEditor.innerHTML = '<div class="edit-recipe-heading"><div><h4>Ingredients per serving</h4><p>Used for stock availability and automatic deduction.</p></div><button type="button" class="btn-outline" data-add-edit-recipe>+ Add</button></div><div class="edit-recipe-rows" data-edit-recipe-rows></div><p class="edit-recipe-error" data-edit-recipe-error role="alert"></p>';
      body.appendChild(recipeEditor);
      recipeEditor.querySelector('[data-add-edit-recipe]').addEventListener('click', function () { addEditRecipeRow(); });
      return recipeEditor;
    }

    function renderRecipeEditor(product) {
      var editor = ensureRecipeEditor();
      if (!editor) return;
      var rows = editor.querySelector('[data-edit-recipe-rows]');
      rows.innerHTML = '';
      editor.querySelector('[data-edit-recipe-error]').textContent = '';
      var recipe = inventoryEngine && typeof inventoryEngine.getProductRecipe === 'function' ? inventoryEngine.getProductRecipe(product.id) : [];
      (recipe.length ? recipe : [{}]).forEach(addEditRecipeRow);
    }

    function collectEditedRecipe() {
      var editor = ensureRecipeEditor();
      if (!editor) return null;
      var recipe = [];
      var seen = {};
      var error = '';
      editor.querySelectorAll('.edit-recipe-row').forEach(function (row) {
        var sku = row.querySelector('.edit-recipe-ingredient').value;
        var qty = Number(row.querySelector('.edit-recipe-amount').value);
        if (!sku || !Number.isFinite(qty) || qty <= 0) { error = 'Complete every ingredient row with a quantity greater than zero.'; return; }
        if (seen[sku]) { error = 'Each ingredient may only appear once.'; return; }
        seen[sku] = true;
        recipe.push({ sku: sku, qty: Math.round(qty * 1000) / 1000 });
      });
      if (!recipe.length && !error) error = 'Add at least one ingredient.';
      editor.querySelector('[data-edit-recipe-error]').textContent = error;
      return error ? null : recipe;
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
      orders = orders.filter(function (order) { return !order.isDemo; });

      var realOrders = orders.filter(function (order) { return !order.isDemo; });
      var completedReal = realOrders.filter(function (order) {
        return (order.status === 'Completed' || order.status === 'Delivered' || order.status === 'Picked Up') && order.paymentStatus === 'paid';
      });
      var activeReal = realOrders.filter(function (order) {
        return order.status !== 'Completed' && order.status !== 'Delivered' && order.status !== 'Picked Up' && order.status !== 'Cancelled';
      });
      var revenueReal = completedReal.reduce(function (sum, order) { return sum + orderTotal(order); }, 0);
      var averageReal = completedReal.length ? revenueReal / completedReal.length : 0;

      var hasRealOrders = realOrders.length > 0;
      var displayRevenue = revenueReal;
      var displayCompleted = completedReal.length;
      var displayActive = activeReal.length;
      var displayAvg = averageReal;
      var subNote = hasRealOrders ? 'Verified customer orders' : 'No completed customer orders yet';

      overview.innerHTML = '<article><span>Completed Sales</span><strong>' + peso(displayRevenue) + '</strong><small>' + subNote + '</small></article>' +
        '<article><span>Completed Orders</span><strong>' + displayCompleted + '</strong><small>Fulfilled transactions</small></article>' +
        '<article><span>Active Orders</span><strong>' + displayActive + '</strong><small>Pending through ready</small></article>' +
        '<article><span>Average Order</span><strong>' + peso(displayAvg) + '</strong><small>' + (hasRealOrders ? 'Actual average' : 'Waiting for completed orders') + '</small></article>';
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
      var manuallyAvailable = product.available !== false;
      var missingIngredients = inventoryEngine && typeof inventoryEngine.getMissingIngredientsForProduct === 'function' ? inventoryEngine.getMissingIngredientsForProduct(product.id, 1) : [];
      var available = manuallyAvailable && missingIngredients.length === 0;
      var availabilityLabel = !manuallyAvailable ? 'Unavailable' : missingIngredients.length ? 'Out of ingredients' : 'Available';
      var lazyAttr = index > 3 ? ' loading="lazy"' : '';
      var imagePath = product.imageJpg || product.imageWebp;
      var image = imagePath
        ? '<img src="' + escapeHtml(imagePath) + '" alt="' + escapeHtml(product.imageAlt) + '" data-product-image data-product-name="' + escapeHtml(product.name) + '"' + lazyAttr + ' />'
        : '<div class="admin-product-placeholder"><span>Image coming soon</span><small>' + escapeHtml(product.name) + '</small></div>';
      return '<article class="product-card" data-product-card="' + escapeHtml(product.id) + '">' +
        '<div class="product-card__image">' + image + '<span class="badge badge--category">' + escapeHtml(product.categoryLabel) + '</span></div>' +
        '<div class="product-card__body"><div class="product-card__title-row"><h3 class="product-card__name">' + escapeHtml(product.name) + '</h3><span class="product-card__price">' + peso(product.price) + '</span></div>' +
        '<p class="product-card__desc">' + escapeHtml(product.description) + '</p>' +
        '<div class="product-card__footer"><span class="status-pill ' + (available ? 'status-pill--available' : 'status-pill--soldout') + '"' + (missingIngredients.length ? ' title="Missing: ' + escapeHtml(missingIngredients.map(function (item) { return item.name; }).join(', ')) + '"' : '') + '><span class="status-pill__dot"></span>' + availabilityLabel + '</span>' +
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

    function openEditModal(product) {
      var modal = document.getElementById('product-edit-modal');
      if (!modal) {
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
        render();
        return;
      }

      document.getElementById('edit-product-id').value = product.id;
      document.getElementById('edit-product-name').value = product.name;
      document.getElementById('edit-product-price').value = product.price;
      document.getElementById('edit-product-category').value = product.categoryLabel || product.category;
      document.getElementById('edit-product-description').value = product.description || '';
      renderRecipeEditor(product);
      modal.classList.add('is-open');
      document.getElementById('edit-product-name').focus();
    }

    function closeEditModal() {
      var modal = document.getElementById('product-edit-modal');
      if (modal) modal.classList.remove('is-open');
    }

    var editForm = document.getElementById('product-edit-form');
    if (editForm) {
      editForm.addEventListener('submit', function (e) {
        e.preventDefault();
        var id = document.getElementById('edit-product-id').value;
        var product = products.find(function (p) { return p.id === id; });
        if (!product) return;

        var name = document.getElementById('edit-product-name').value.trim();
        var price = Number(document.getElementById('edit-product-price').value);
        var desc = document.getElementById('edit-product-description').value.trim();
        var recipe = collectEditedRecipe();

        if (!name) { alert('Product name cannot be empty.'); return; }
        if (!Number.isFinite(price) || price < 0) { alert('Enter a valid price.'); return; }
        if (!recipe) return;
        if (!inventoryEngine || typeof inventoryEngine.saveProductRecipe !== 'function') { alert('Inventory recipe service is unavailable.'); return; }
        var recipeResult = inventoryEngine.saveProductRecipe(product.id, recipe);
        if (!recipeResult.success) { alert(recipeResult.reason || 'Unable to save the product recipe.'); return; }

        product.name = name;
        product.price = price;
        product.description = desc;
        saveProductEdit(product);
        closeEditModal();
        render();
      });
    }

    var closeBtn = document.getElementById('btn-close-edit-modal');
    if (closeBtn) closeBtn.addEventListener('click', closeEditModal);
    var cancelBtn = document.getElementById('btn-cancel-edit-modal');
    if (cancelBtn) cancelBtn.addEventListener('click', closeEditModal);
    var modalEl = document.getElementById('product-edit-modal');
    if (modalEl) {
      modalEl.addEventListener('click', function (e) {
        if (e.target === modalEl) closeEditModal();
      });
    }

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
        render();
      } else if (editButton) {
        openEditModal(product);
      } else if (deleteButton) {
        if (!window.confirm('Delete "' + product.name + '" from the customer and admin menus?')) return;
        deleteProduct(product.id);
        products = products.filter(function (p) { return p.id !== product.id; });
        render();
      }
    });

    render();
    window.addEventListener('storage', function (event) { if (event.key === 'cornerCravingsAdminOrders') renderSalesOverview(); });
    window.addEventListener('cornercravings:orders-updated', renderSalesOverview);
  }

  if (typeof document !== 'undefined') {
    initProductsUI();
  }

  window.CornerCravingsProducts = {
    saveAvailability: saveAvailability,
    saveProductEdit: saveProductEdit,
    deleteProduct: deleteProduct
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      saveAvailability: saveAvailability,
      saveProductEdit: saveProductEdit,
      deleteProduct: deleteProduct
    };
  }
})();
