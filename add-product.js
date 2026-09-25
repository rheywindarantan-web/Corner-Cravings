(function () {
  'use strict';
  var form = document.getElementById('product-create-form');
  if (!form) return;
  var fileInput = document.getElementById('product-image');
  var zone = document.getElementById('product-upload-zone');
  var preview = document.getElementById('product-image-preview');
  var dialog = document.getElementById('product-confirm');
  var pendingImage = '';
  var categorySelect = document.getElementById('product-category');
  var inventoryEngine = window.CornerCravingsInventory;
  var inventoryItems = inventoryEngine && typeof inventoryEngine.getInventoryItems === 'function' ? inventoryEngine.getInventoryItems() : [];
  var pendingRecipe = [];
  if (categorySelect && Array.isArray(window.CornerCravingsMenu)) {
    var categories = {};
    window.CornerCravingsMenu.forEach(function (product) { categories[product.categoryLabel] = true; });
    categorySelect.innerHTML = '<option value="">Select a category</option>' + Object.keys(categories).map(function (category) { return '<option>' + category + '</option>'; }).join('');
  }

  function escapeHtml(value) {
    var node = document.createElement('div');
    node.textContent = value == null ? '' : String(value);
    return node.innerHTML;
  }

  var recipeSection = document.createElement('section');
  recipeSection.className = 'product-recipe';
  recipeSection.setAttribute('aria-labelledby', 'product-recipe-title');
  recipeSection.innerHTML = '<div class="product-recipe__header"><div><h2 id="product-recipe-title">Ingredients per serving</h2><p>Select ingredients already tracked in inventory. These quantities are deducted when an employee starts preparing an order.</p></div><a class="btn-outline product-recipe__inventory-link" href="stock-in.html">Manage ingredients</a></div><div id="product-recipe-rows" class="product-recipe__rows"></div><button class="btn-outline product-recipe__add" id="add-recipe-row" type="button">+ Add ingredient</button><p class="product-recipe__error" id="product-recipe-error" role="alert"></p>';
  var actions = form.querySelector('.product-form-actions');
  form.insertBefore(recipeSection, actions);
  var recipeRows = document.getElementById('product-recipe-rows');
  var recipeError = document.getElementById('product-recipe-error');

  function ingredientOptions(selectedSku) {
    return '<option value="">Choose an ingredient</option>' + inventoryItems.slice().sort(function (a, b) {
      return a.name.localeCompare(b.name);
    }).map(function (item) {
      return '<option value="' + escapeHtml(item.sku) + '"' + (item.sku === selectedSku ? ' selected' : '') + '>' + escapeHtml(item.name) + ' (' + escapeHtml(item.unit) + ')</option>';
    }).join('');
  }

  function addRecipeRow(entry) {
    var row = document.createElement('div');
    row.className = 'product-recipe-row';
    row.innerHTML = '<label><span>Ingredient</span><select class="recipe-ingredient" required>' + ingredientOptions(entry && entry.sku) + '</select></label><label><span>Quantity per serving</span><div class="product-recipe-quantity"><input class="recipe-quantity" type="number" min="0.001" step="0.001" inputmode="decimal" value="' + (entry && entry.qty ? entry.qty : '') + '" required /><span class="recipe-unit">unit</span></div></label><button class="product-recipe-remove" type="button" aria-label="Remove ingredient">Remove</button>';
    recipeRows.appendChild(row);
    var select = row.querySelector('select');
    function updateUnit() {
      var item = inventoryItems.find(function (candidate) { return candidate.sku === select.value; });
      row.querySelector('.recipe-unit').textContent = item ? item.unit : 'unit';
    }
    select.addEventListener('change', updateUnit);
    row.querySelector('.product-recipe-remove').addEventListener('click', function () {
      row.remove();
      if (!recipeRows.children.length) addRecipeRow();
    });
    updateUnit();
  }

  function collectRecipe() {
    var recipe = [];
    var seen = {};
    var error = '';
    recipeRows.querySelectorAll('.product-recipe-row').forEach(function (row) {
      var sku = row.querySelector('.recipe-ingredient').value;
      var qty = Number(row.querySelector('.recipe-quantity').value);
      if (!sku || !Number.isFinite(qty) || qty <= 0) {
        error = 'Choose an ingredient and enter a quantity greater than zero for every row.';
        return;
      }
      if (seen[sku]) {
        error = 'Each ingredient can only be added once. Combine duplicate quantities into one row.';
        return;
      }
      seen[sku] = true;
      recipe.push({ sku: sku, qty: Math.round(qty * 1000) / 1000 });
    });
    if (!recipe.length && !error) error = 'Add at least one ingredient before saving the product.';
    recipeError.textContent = error;
    return error ? null : recipe;
  }

  document.getElementById('add-recipe-row').addEventListener('click', function () { addRecipeRow(); });
  if (!inventoryItems.length) {
    recipeError.textContent = 'Inventory ingredients could not be loaded. Open Manage ingredients before adding this product.';
  } else {
    addRecipeRow();
  }

  function useFile(file) {
    if (!file) return;
    if (!file.type.match(/^image\/(png|jpeg|svg\+xml)$/)) { window.alert('Choose an SVG, PNG, JPG, or JPEG image.'); return; }
    if (file.size > 4 * 1024 * 1024) { window.alert('The product image must be 4 MB or smaller.'); return; }
    var reader = new FileReader();
    reader.onload = function () { pendingImage = reader.result; preview.src = pendingImage; zone.classList.add('has-image'); };
    reader.readAsDataURL(file);
  }
  zone.addEventListener('click', function () { fileInput.click(); });
  zone.addEventListener('keydown', function (event) { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); fileInput.click(); } });
  fileInput.addEventListener('change', function () { useFile(fileInput.files && fileInput.files[0]); });
  ['dragenter','dragover'].forEach(function (name) { zone.addEventListener(name, function (event) { event.preventDefault(); zone.classList.add('is-dragging'); }); });
  ['dragleave','drop'].forEach(function (name) { zone.addEventListener(name, function (event) { event.preventDefault(); zone.classList.remove('is-dragging'); }); });
  zone.addEventListener('drop', function (event) { useFile(event.dataTransfer.files && event.dataTransfer.files[0]); });

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }
    pendingRecipe = collectRecipe();
    if (!pendingRecipe) { recipeSection.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
    dialog.classList.add('is-open');
    document.getElementById('product-confirm-no').focus();
  });
  document.getElementById('product-confirm-no').addEventListener('click', function () { dialog.classList.remove('is-open'); });
  document.getElementById('product-confirm-yes').addEventListener('click', function () {
    var product = { id: Date.now(), name: document.getElementById('product-name').value.trim(), category: document.getElementById('product-category').value, price: Number(document.getElementById('product-price').value), description: document.getElementById('product-description').value.trim(), image: pendingImage, available: true };
    var products;
    try { products = JSON.parse(localStorage.getItem('cornerCravingsProducts') || '[]'); } catch (error) { products = []; }
    if (!inventoryEngine || typeof inventoryEngine.saveProductRecipe !== 'function') {
      window.alert('The inventory recipe service is unavailable. The product was not saved.');
      return;
    }
    var recipeResult = inventoryEngine.saveProductRecipe('custom-' + product.id, pendingRecipe);
    if (!recipeResult.success) { window.alert(recipeResult.reason || 'The ingredient recipe could not be saved.'); return; }
    products.push(product); localStorage.setItem('cornerCravingsProducts', JSON.stringify(products));
    window.location.href = 'products.html';
  });
  dialog.addEventListener('click', function (event) { if (event.target === dialog) dialog.classList.remove('is-open'); });
})();
