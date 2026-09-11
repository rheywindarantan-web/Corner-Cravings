(function () {
  'use strict';
  var layout = document.getElementById('profile-settings-form');
  var form = document.getElementById('profile-settings-form');
  if (!layout || !form) return;

  var defaults = { firstName: 'Alex', lastName: 'Mercer', email: 'alex.m@cornercravings.com', phone: '+1 (555) 123-4567', storeName: 'Corner Cravings', role: 'Owner / Admin', id: 'CC-8492-AD', avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=240&q=85' };
  function getProfile() {
    try {
      var saved = JSON.parse(localStorage.getItem('cornerCravingsAdminProfile') || 'null');
      if (!saved) return defaults;
      var parts = (saved.name || '').trim().split(/\s+/);
      return Object.assign({}, defaults, saved, { firstName: saved.firstName || parts[0] || defaults.firstName, lastName: saved.lastName || parts.slice(1).join(' ') || defaults.lastName });
    } catch (error) { return defaults; }
  }
  function value(id, fallback) { var el = document.getElementById(id); if (el) el.value = fallback || ''; }
  function render(profile) {
    value('profile-first-name', profile.firstName); value('profile-last-name', profile.lastName); value('profile-email', profile.email); value('profile-phone', profile.phone); value('profile-store', profile.storeName);
    document.getElementById('profile-display-name').textContent = profile.firstName + ' ' + profile.lastName;
    document.getElementById('profile-display-role').textContent = profile.role;
    document.getElementById('profile-display-id').textContent = 'ID: ' + profile.id;
    document.getElementById('profile-avatar').src = profile.avatar;
  }
  function setEditing(editing) {
    layout.classList.toggle('is-editing', editing);
    form.querySelectorAll('input:not([readonly])').forEach(function (input) { input.disabled = !editing; });
    document.getElementById('profile-page-title').textContent = editing ? 'Edit Profile' : 'Profile Settings';
    if (editing) document.getElementById('profile-first-name').focus();
  }
  var profile = getProfile(); render(profile); setEditing(false);
  document.getElementById('profile-edit').addEventListener('click', function () { setEditing(true); });
  document.getElementById('profile-cancel').addEventListener('click', function () { render(getProfile()); setEditing(false); });
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }
    document.getElementById('profile-confirm').classList.add('is-open');
  });
  document.getElementById('profile-confirm-no').addEventListener('click', function () { document.getElementById('profile-confirm').classList.remove('is-open'); });
  document.getElementById('profile-confirm-yes').addEventListener('click', function () {
    var current = getProfile();
    var updated = Object.assign({}, current, { firstName: document.getElementById('profile-first-name').value.trim(), lastName: document.getElementById('profile-last-name').value.trim(), email: document.getElementById('profile-email').value.trim(), phone: document.getElementById('profile-phone').value.trim(), storeName: document.getElementById('profile-store').value.trim() });
    updated.name = updated.firstName + ' ' + updated.lastName;
    localStorage.setItem('cornerCravingsAdminProfile', JSON.stringify(updated));
    render(updated); setEditing(false); document.getElementById('profile-confirm').classList.remove('is-open');
  });
  document.getElementById('profile-photo-input').addEventListener('change', function (event) {
    var file = event.target.files && event.target.files[0]; if (!file) return;
    if (!file.type.startsWith('image/')) { window.alert('Please choose an image file.'); return; }
    var reader = new FileReader(); reader.onload = function () { document.getElementById('profile-avatar').src = reader.result; var saved = getProfile(); saved.avatar = reader.result; localStorage.setItem('cornerCravingsAdminProfile', JSON.stringify(saved)); }; reader.readAsDataURL(file);
  });
})();
