(function () {
  'use strict';

  var defaults = {
    firstName: 'Alex',
    lastName: 'Mercer',
    email: 'alex.m@cornercravings.com',
    phone: '+1 (555) 123-4567',
    storeName: 'Corner Cravings',
    role: 'Owner / Admin',
    id: 'CC-8492-AD',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=240&q=85'
  };

  function getProfile() {
    try {
      var saved = JSON.parse(localStorage.getItem('cornerCravingsAdminProfile') || 'null');
      if (!saved) return defaults;
      var parts = (saved.name || '').trim().split(/\s+/);
      return Object.assign({}, defaults, saved, {
        firstName: saved.firstName || parts[0] || defaults.firstName,
        lastName: saved.lastName || parts.slice(1).join(' ') || defaults.lastName
      });
    } catch (error) {
      return defaults;
    }
  }

  function value(id, fallback) {
    if (typeof document === 'undefined') return;
    var el = document.getElementById(id);
    if (el) el.value = fallback || '';
  }

  function render(profile) {
    if (typeof document === 'undefined') return;
    value('profile-first-name', profile.firstName);
    value('profile-last-name', profile.lastName);
    value('profile-email', profile.email);
    value('profile-phone', profile.phone);
    value('profile-store', profile.storeName);

    var dName = document.getElementById('profile-display-name');
    if (dName) dName.textContent = profile.firstName + ' ' + profile.lastName;
    var dRole = document.getElementById('profile-display-role');
    if (dRole) dRole.textContent = profile.role;
    var dId = document.getElementById('profile-display-id');
    if (dId) dId.textContent = 'ID: ' + profile.id;
    var dAvatar = document.getElementById('profile-avatar');
    if (dAvatar) dAvatar.src = profile.avatar;
  }

  function initPersonalProfile() {
    var layout = document.getElementById('profile-settings-form');
    var form = document.getElementById('profile-settings-form');
    if (!layout || !form) return;

    function setEditing(editing) {
      layout.classList.toggle('is-editing', editing);
      form.querySelectorAll('input:not([readonly])').forEach(function (input) { input.disabled = !editing; });
      var title = document.getElementById('profile-page-title');
      if (title) title.textContent = editing ? 'Edit Profile' : 'Profile Settings';
      if (editing) {
        var fn = document.getElementById('profile-first-name');
        if (fn) fn.focus();
      }
    }

    var profile = getProfile();
    render(profile);
    setEditing(false);

    var editBtn = document.getElementById('profile-edit');
    if (editBtn) editBtn.addEventListener('click', function () { setEditing(true); });
    var cancelBtn = document.getElementById('profile-cancel');
    if (cancelBtn) cancelBtn.addEventListener('click', function () { render(getProfile()); setEditing(false); });

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var confirmModal = document.getElementById('profile-confirm');
      if (confirmModal) confirmModal.classList.add('is-open');
    });

    var confirmNo = document.getElementById('profile-confirm-no');
    if (confirmNo) confirmNo.addEventListener('click', function () {
      var confirmModal = document.getElementById('profile-confirm');
      if (confirmModal) confirmModal.classList.remove('is-open');
    });

    var confirmYes = document.getElementById('profile-confirm-yes');
    if (confirmYes) confirmYes.addEventListener('click', function () {
      var current = getProfile();
      var updated = Object.assign({}, current, {
        firstName: document.getElementById('profile-first-name').value.trim(),
        lastName: document.getElementById('profile-last-name').value.trim(),
        email: document.getElementById('profile-email').value.trim(),
        phone: document.getElementById('profile-phone').value.trim(),
        storeName: document.getElementById('profile-store').value.trim()
      });
      updated.name = updated.firstName + ' ' + updated.lastName;
      localStorage.setItem('cornerCravingsAdminProfile', JSON.stringify(updated));
      render(updated);
      setEditing(false);
      var confirmModal = document.getElementById('profile-confirm');
      if (confirmModal) confirmModal.classList.remove('is-open');
    });

    var photoInput = document.getElementById('profile-photo-input');
    if (photoInput) {
      photoInput.addEventListener('change', function (event) {
        var file = event.target.files && event.target.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) { window.alert('Please choose an image file.'); return; }
        var reader = new FileReader();
        reader.onload = function () {
          var avatarImg = document.getElementById('profile-avatar');
          if (avatarImg) avatarImg.src = reader.result;
          var saved = getProfile();
          saved.avatar = reader.result;
          localStorage.setItem('cornerCravingsAdminProfile', JSON.stringify(saved));
        };
        reader.readAsDataURL(file);
      });
    }
  }

  // ==========================================
  // Store Business Operations Configuration
  // ==========================================
  var storeDefaults = {
    openTime: '09:00',
    closeTime: '21:00',
    deliveryFee: 49,
    phone: '0917-555-CRAVE',
    address: 'Blk 29 Lot 1, Bougainvilla St., Brgy. Pasong Putik, Quezon City'
  };

  function getStoreConfig() {
    try {
      var saved = JSON.parse(localStorage.getItem('cornerCravingsStoreConfig') || 'null');
      return saved ? Object.assign({}, storeDefaults, saved) : storeDefaults;
    } catch (e) {
      return storeDefaults;
    }
  }

  function saveStoreConfig(cfg) {
    localStorage.setItem('cornerCravingsStoreConfig', JSON.stringify(cfg));
    localStorage.setItem('cornerCravingsStoreHours', JSON.stringify({ open: cfg.openTime, close: cfg.closeTime }));
    try {
      window.dispatchEvent(new CustomEvent('cornercravings:store-config-updated', { detail: cfg }));
    } catch (e) {}
  }

  function initStoreOperations() {
    if (typeof document === 'undefined') return;
    var form = document.getElementById('store-operations-form');
    if (!form) return;

    var cfg = getStoreConfig();
    value('store-open-time', cfg.openTime);
    value('store-close-time', cfg.closeTime);
    value('store-delivery-fee', cfg.deliveryFee);
    value('store-phone-contact', cfg.phone);
    value('store-branch-address', cfg.address);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var updated = {
        openTime: document.getElementById('store-open-time').value,
        closeTime: document.getElementById('store-close-time').value,
        deliveryFee: Number(document.getElementById('store-delivery-fee').value || 49),
        phone: document.getElementById('store-phone-contact').value.trim(),
        address: document.getElementById('store-branch-address').value.trim()
      };
      saveStoreConfig(updated);
      alert('Store business operations saved successfully.');
    });
  }

  // ==========================================
  // Staff & Employee Accounts Management
  // ==========================================
  var defaultStaff = [
    { name: 'Elena Reyes', email: 'elena@cornercravings.com', role: 'Lead Cook', token: 'CC-STAFF-01', active: true },
    { name: 'Marco Diaz', email: 'marco@cornercravings.com', role: 'Kitchen Staff', token: 'CC-STAFF-02', active: true }
  ];

  function getStaffList() {
    try {
      var saved = JSON.parse(localStorage.getItem('cornerCravingsStaffAccounts') || 'null');
      if (Array.isArray(saved)) return saved;
      localStorage.setItem('cornerCravingsStaffAccounts', JSON.stringify(defaultStaff));
      return defaultStaff.slice();
    } catch (e) {
      return defaultStaff.slice();
    }
  }

  function escapeStaffText(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function saveStaffList(list) {
    localStorage.setItem('cornerCravingsStaffAccounts', JSON.stringify(list));
    renderStaffTable();
  }

  function renderStaffTable() {
    if (typeof document === 'undefined') return;
    var tbody = document.getElementById('staff-accounts-list-body');
    if (!tbody) return;

    var staff = getStaffList();
    var count = document.getElementById('staff-account-count');
    if (count) {
      var activeCount = staff.filter(function (member) { return member.active !== false; }).length;
      count.textContent = staff.length + (staff.length === 1 ? ' account' : ' accounts') + ' · ' + activeCount + ' active';
    }
    if (staff.length === 0) {
      tbody.innerHTML = '<tr class="staff-table__empty-row"><td colspan="5"><div class="staff-empty"><span class="staff-empty__icon" aria-hidden="true">+</span><strong>No staff accounts yet</strong><p>Add a staff member to give your team access to employee operations.</p></div></td></tr>';
      return;
    }

    tbody.innerHTML = staff.map(function (s, index) {
      var badgeClass = s.active !== false ? 'staff-status--active' : 'staff-status--inactive';
      var badgeText = s.active !== false ? 'Active' : 'Inactive';
      var displayName = s.name || 'Staff Member';
      var initials = displayName.split(/\s+/).filter(Boolean).slice(0, 2).map(function (part) { return part.charAt(0).toUpperCase(); }).join('') || 'ST';
      return '<tr class="staff-row">' +
        '<td data-label="Staff member"><div class="staff-identity"><span class="staff-avatar" aria-hidden="true">' + escapeStaffText(initials) + '</span><div><strong>' + escapeStaffText(displayName) + '</strong><small>Employee account</small></div></div></td>' +
        '<td data-label="Email"><a class="staff-email" href="mailto:' + escapeStaffText(s.email || '') + '">' + escapeStaffText(s.email || '—') + '</a></td>' +
        '<td data-label="Role"><span class="staff-role">' + escapeStaffText(s.role || 'Kitchen Staff') + '</span></td>' +
        '<td data-label="Status"><span class="staff-status ' + badgeClass + '"><span></span>' + badgeText + '</span></td>' +
        '<td data-label="Actions"><div class="staff-actions">' +
          '<button type="button" class="staff-action staff-action--toggle" data-toggle-staff="' + index + '">' + (s.active !== false ? 'Deactivate' : 'Activate') + '</button>' +
          '<button type="button" class="staff-action staff-action--delete" data-delete-staff="' + index + '">Delete</button>' +
        '</div></td>' +
      '</tr>';
    }).join('');
  }

  function initStaffManagement() {
    if (typeof document === 'undefined') return;
    var toggleBtn = document.getElementById('btn-toggle-add-staff');
    var addForm = document.getElementById('add-staff-quick-form');
    var cancelBtn = document.getElementById('btn-cancel-add-staff');
    var tbody = document.getElementById('staff-accounts-list-body');

    if (toggleBtn && addForm) {
      toggleBtn.addEventListener('click', function () {
        var isHidden = addForm.hidden;
        addForm.hidden = !isHidden;
        toggleBtn.setAttribute('aria-expanded', String(isHidden));
        if (isHidden) {
          var nameInput = document.getElementById('new-staff-name');
          if (nameInput) nameInput.focus();
        }
      });
    }

    if (cancelBtn && addForm) {
      cancelBtn.addEventListener('click', function () {
        addForm.hidden = true;
        if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'false');
      });
    }

    if (addForm) {
      addForm.addEventListener('submit', function (e) {
        e.preventDefault();
        var name = document.getElementById('new-staff-name').value.trim();
        var email = document.getElementById('new-staff-email').value.trim();
        var role = document.getElementById('new-staff-role').value;
        var token = document.getElementById('new-staff-token').value.trim();

        if (!name || !email || !token) { alert('Please enter the staff name, email, and access token.'); return; }

        var list = getStaffList();
        var duplicate = list.some(function (staff) {
          return String(staff.email || '').toLowerCase() === email.toLowerCase();
        });
        if (duplicate) { alert('A staff account with this email already exists.'); return; }
        list.push({ name: name, email: email, role: role, token: token, active: true });
        saveStaffList(list);

        addForm.reset();
        addForm.hidden = true;
        if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'false');
      });
    }

    if (tbody) {
      tbody.addEventListener('click', function (e) {
        var toggleBtn = e.target.closest('[data-toggle-staff]');
        var deleteBtn = e.target.closest('[data-delete-staff]');
        var list = getStaffList();

        if (toggleBtn) {
          var idx = Number(toggleBtn.getAttribute('data-toggle-staff'));
          if (list[idx]) {
            list[idx].active = list[idx].active === false ? true : false;
            saveStaffList(list);
          }
        } else if (deleteBtn) {
          var delIdx = Number(deleteBtn.getAttribute('data-delete-staff'));
          if (list[delIdx] && confirm('Delete staff account "' + list[delIdx].name + '"?')) {
            list.splice(delIdx, 1);
            saveStaffList(list);
          }
        }
      });
    }

    renderStaffTable();
  }

  if (typeof document !== 'undefined') {
    initPersonalProfile();
    initStoreOperations();
    initStaffManagement();
  }

  window.CornerCravingsProfile = {
    getProfile: getProfile,
    getStoreConfig: getStoreConfig,
    saveStoreConfig: saveStoreConfig,
    getStaffList: getStaffList,
    saveStaffList: saveStaffList
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      getProfile: getProfile,
      getStoreConfig: getStoreConfig,
      saveStoreConfig: saveStoreConfig,
      getStaffList: getStaffList,
      saveStaffList: saveStaffList
    };
  }
})();
