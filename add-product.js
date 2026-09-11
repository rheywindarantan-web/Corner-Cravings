(function () {
  'use strict';
  var form = document.getElementById('product-create-form');
  if (!form) return;
  var fileInput = document.getElementById('product-image');
  var zone = document.getElementById('product-upload-zone');
  var preview = document.getElementById('product-image-preview');
  var dialog = document.getElementById('product-confirm');
  var pendingImage = '';

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
    dialog.classList.add('is-open');
    document.getElementById('product-confirm-no').focus();
  });
  document.getElementById('product-confirm-no').addEventListener('click', function () { dialog.classList.remove('is-open'); });
  document.getElementById('product-confirm-yes').addEventListener('click', function () {
    var product = { id: Date.now(), name: document.getElementById('product-name').value.trim(), category: document.getElementById('product-category').value, price: Number(document.getElementById('product-price').value), description: document.getElementById('product-description').value.trim(), image: pendingImage, available: true };
    var products;
    try { products = JSON.parse(localStorage.getItem('cornerCravingsProducts') || '[]'); } catch (error) { products = []; }
    products.push(product); localStorage.setItem('cornerCravingsProducts', JSON.stringify(products));
    window.location.href = 'products.html';
  });
  dialog.addEventListener('click', function (event) { if (event.target === dialog) dialog.classList.remove('is-open'); });
})();
