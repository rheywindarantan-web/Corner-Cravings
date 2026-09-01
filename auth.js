/* ==========================================================================
   Corner Cravings — Auth screens behavior
   Password visibility toggle + basic client-side form handling
   ========================================================================== */

(function () {
  'use strict';

  function isValidGmail(email) {
    return /^[a-zA-Z0-9._%+-]+@gmail\.com$/i.test(email);
  }

  function getAdminProfile() {
    try {
      var saved = localStorage.getItem('cornerCravingsAdminProfile');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      return {
        name: 'Alex Santos',
        email: 'alex@gmail.com',
        role: 'Operations Manager',
        accessRole: 'Admin',
        department: 'Bakery Operations',
        shift: '08:00 - 17:00'
      };
    }

    return {
      name: 'Alex Santos',
      email: 'alex@gmail.com',
      role: 'Operations Manager',
      accessRole: 'Admin',
      department: 'Bakery Operations',
      shift: '08:00 - 17:00'
    };
  }

  function saveAdminProfile(profile) {
    localStorage.setItem('cornerCravingsAdminProfile', JSON.stringify(profile));
  }

  function renderAdminProfile(profile) {
    if (!profile) {
      profile = getAdminProfile();
    }

    var avatar = document.getElementById('admin-profile-avatar');
    var nameDisplay = document.getElementById('admin-profile-name-display');
    var roleDisplay = document.getElementById('admin-profile-role-display');
    var emailDisplay = document.getElementById('admin-profile-email-display');
    var roleReadonly = document.getElementById('admin-profile-role-readonly');
    var departmentDisplay = document.getElementById('admin-profile-department-display');
    var shiftDisplay = document.getElementById('admin-profile-shift-display');

    if (avatar && profile.name) {
      var initials = profile.name.split(' ').map(function (part) { return part.charAt(0).toUpperCase(); }).slice(0, 2).join('');
      avatar.textContent = initials || 'AS';
    }

    if (nameDisplay) nameDisplay.textContent = profile.name || 'Alex Santos';
    if (roleDisplay) roleDisplay.textContent = profile.role || 'Operations Manager';
    if (emailDisplay) emailDisplay.textContent = profile.email || 'alex@gmail.com';
    if (roleReadonly) roleReadonly.textContent = profile.accessRole || 'Admin';
    if (departmentDisplay) departmentDisplay.textContent = profile.department || 'Bakery Operations';
    if (shiftDisplay) shiftDisplay.textContent = profile.shift || '08:00 - 17:00';

    var nameInput = document.getElementById('admin-profile-name');
    var roleInput = document.getElementById('admin-profile-role');
    var emailInput = document.getElementById('admin-profile-email');
    var accessRoleInput = document.getElementById('admin-profile-access-role');
    var departmentInput = document.getElementById('admin-profile-department');
    var shiftInput = document.getElementById('admin-profile-shift');

    if (nameInput) nameInput.value = profile.name || 'Alex Santos';
    if (roleInput) roleInput.value = profile.role || 'Operations Manager';
    if (emailInput) emailInput.value = profile.email || 'alex@gmail.com';
    if (accessRoleInput) accessRoleInput.value = profile.accessRole || 'Admin';
    if (departmentInput) departmentInput.value = profile.department || 'Bakery Operations';
    if (shiftInput) shiftInput.value = profile.shift || '08:00 - 17:00';
  }

  function getStaffAccounts() {
    try {
      var saved = localStorage.getItem('cornerCravingsStaffAccounts');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      return [];
    }
  }

  function saveStaffAccount(account) {
    var accounts = getStaffAccounts();
    var existing = accounts.filter(function (item) {
      return item.email && item.email.toLowerCase() === account.email.toLowerCase();
    });

    if (!existing.length) {
      accounts.push(account);
      localStorage.setItem('cornerCravingsStaffAccounts', JSON.stringify(accounts));
    }
  }

  document.querySelectorAll('[data-role-target]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var target = btn.getAttribute('data-role-target');
      if (!target) return;

      document.querySelectorAll('[data-role-target]').forEach(function (button) {
        var isActive = button === btn;
        button.classList.toggle('is-active', isActive);
        button.style.background = isActive ? (button.getAttribute('data-role-target') === 'staff-login.html' ? 'var(--staff-primary)' : 'var(--color-primary)') : '#fff';
        button.style.color = isActive ? '#fff' : 'var(--color-text-dark)';
      });

      window.location.href = target;
    });
  });

  // Password show/hide toggles
  document.querySelectorAll('[data-toggle-target]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var targetId = btn.getAttribute('data-toggle-target');
      var input = document.getElementById(targetId);
      if (!input) return;

      var isHidden = input.type === 'password';
      input.type = isHidden ? 'text' : 'password';
      btn.setAttribute('aria-label', isHidden ? 'Hide password' : 'Show password');
      btn.classList.toggle('is-active', isHidden);
    });
  });

  function getStaffProfile() {
    try {
      var saved = localStorage.getItem('cornerCravingsStaffProfile');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      return {
        name: 'Jane Emily Doe',
        role: 'Senior Barista',
        id: 'EMP-0492',
        joined: 'Mar 2022',
        status: 'Full-Time',
        dob: 'Oct 15, 1995',
        department: 'Front of House',
        manager: 'Michael Scott',
        email: 'jane.doe@cornercravings.com',
        phone: '(555) 123-4567',
        address: '123 Cafe Lane, Apt 4B\nSeattle, WA 98101',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80'
      };
    }

    return {
      name: 'Jane Emily Doe',
      role: 'Senior Barista',
      id: 'EMP-0492',
      joined: 'Mar 2022',
      status: 'Full-Time',
      dob: 'Oct 15, 1995',
      department: 'Front of House',
      manager: 'Michael Scott',
      email: 'jane.doe@cornercravings.com',
      phone: '(555) 123-4567',
      address: '123 Cafe Lane, Apt 4B\nSeattle, WA 98101',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80'
    };
  }

  function saveStaffProfile(profile) {
    localStorage.setItem('cornerCravingsStaffProfile', JSON.stringify(profile));
  }

  function renderStaffProfile(profile) {
    if (!profile) {
      profile = getStaffProfile();
    }

    var nameDisplay = document.getElementById('staff-profile-name-display');
    var roleDisplay = document.getElementById('staff-profile-role-display');
    var nameInput = document.getElementById('staff-profile-name');
    var dobInput = document.getElementById('staff-profile-dob');
    var departmentInput = document.getElementById('staff-profile-department');
    var managerInput = document.getElementById('staff-profile-manager');
    var emailInput = document.getElementById('staff-profile-email');
    var phoneInput = document.getElementById('staff-profile-phone');
    var addressInput = document.getElementById('staff-profile-address');
    var avatar = document.getElementById('staff-profile-avatar');

    if (nameDisplay) nameDisplay.textContent = profile.name || 'Jane Emily Doe';
    if (roleDisplay) roleDisplay.textContent = profile.role || 'Senior Barista';
    if (nameInput) nameInput.value = profile.name || 'Jane Emily Doe';
    if (dobInput) dobInput.value = profile.dob || 'Oct 15, 1995';
    if (departmentInput) departmentInput.value = profile.department || 'Front of House';
    if (managerInput) managerInput.value = profile.manager || 'Michael Scott';
    if (emailInput) emailInput.value = profile.email || 'jane.doe@cornercravings.com';
    if (phoneInput) phoneInput.value = profile.phone || '(555) 123-4567';
    if (addressInput) addressInput.value = profile.address || '123 Cafe Lane, Apt 4B\nSeattle, WA 98101';
    if (avatar) avatar.src = profile.avatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80';

    var staffId = document.getElementById('staff-profile-id');
    var joined = document.getElementById('staff-profile-joined');
    var status = document.getElementById('staff-profile-status');

    if (staffId) staffId.textContent = 'ID: ' + (profile.id || 'EMP-0492');
    if (joined) joined.textContent = 'Joined: ' + (profile.joined || 'Mar 2022');
    if (status) status.textContent = profile.status || 'Full-Time';
  }

  var adminProfileForm = document.getElementById('admin-profile-form');
  if (adminProfileForm) {
    function setAdminProfileEditing(isEditing) {
      var fields = adminProfileForm.querySelectorAll('input');
      fields.forEach(function (input) {
        input.disabled = !isEditing;
      });

      var toggleButton = document.getElementById('admin-profile-toggle');
      var cancelButton = document.getElementById('admin-profile-cancel');

      if (toggleButton) {
        toggleButton.textContent = isEditing ? 'Editing Profile' : 'Edit Profile';
      }

      if (cancelButton) {
        cancelButton.style.display = isEditing ? 'inline-flex' : 'none';
      }
    }

    renderAdminProfile(getAdminProfile());
    setAdminProfileEditing(false);

    var toggleButton = document.getElementById('admin-profile-toggle');
    if (toggleButton) {
      toggleButton.addEventListener('click', function () {
        var isCurrentlyEditing = !document.getElementById('admin-profile-name').disabled;
        setAdminProfileEditing(!isCurrentlyEditing);
        if (!isCurrentlyEditing) {
          document.getElementById('admin-profile-name').focus();
        }
      });
    }

    var cancelButton = document.getElementById('admin-profile-cancel');
    if (cancelButton) {
      cancelButton.addEventListener('click', function () {
        renderAdminProfile(getAdminProfile());
        setAdminProfileEditing(false);
      });
    }

    adminProfileForm.addEventListener('submit', function (event) {
      event.preventDefault();

      var updatedProfile = {
        name: document.getElementById('admin-profile-name').value.trim(),
        email: document.getElementById('admin-profile-email').value.trim(),
        role: document.getElementById('admin-profile-role').value.trim(),
        accessRole: document.getElementById('admin-profile-access-role').value.trim(),
        department: document.getElementById('admin-profile-department').value.trim(),
        shift: document.getElementById('admin-profile-shift').value.trim()
      };

      if (!updatedProfile.name || !updatedProfile.email || !updatedProfile.role || !updatedProfile.department || !updatedProfile.shift) {
        window.alert('Please fill in all profile fields before saving.');
        return;
      }

      if (!isValidGmail(updatedProfile.email)) {
        window.alert('Please use a valid Gmail address for the admin profile.');
        return;
      }

      saveAdminProfile(updatedProfile);
      renderAdminProfile(updatedProfile);
      setAdminProfileEditing(false);
      window.alert('Profile updated successfully.');
    });
  }

  var staffProfileForm = document.getElementById('staff-profile-form');
  if (staffProfileForm) {
    function setStaffProfileEditing(isEditing) {
      var fields = staffProfileForm.querySelectorAll('input, textarea');
      fields.forEach(function (input) {
        input.disabled = !isEditing;
      });

      var toggleButton = document.getElementById('staff-profile-toggle');
      var cancelButton = document.getElementById('staff-profile-cancel');

      if (toggleButton) {
        toggleButton.textContent = isEditing ? 'Editing Profile' : 'Edit Profile';
      }

      if (cancelButton) {
        cancelButton.style.display = isEditing ? 'inline-flex' : 'none';
      }
    }

    renderStaffProfile(getStaffProfile());
    setStaffProfileEditing(false);

    var toggleButton = document.getElementById('staff-profile-toggle');
    if (toggleButton) {
      toggleButton.addEventListener('click', function () {
        var isCurrentlyEditing = !document.getElementById('staff-profile-name').disabled;
        setStaffProfileEditing(!isCurrentlyEditing);
        if (!isCurrentlyEditing) {
          document.getElementById('staff-profile-name').focus();
        }
      });
    }

    var cancelButton = document.getElementById('staff-profile-cancel');
    if (cancelButton) {
      cancelButton.addEventListener('click', function () {
        renderStaffProfile(getStaffProfile());
        setStaffProfileEditing(false);
      });
    }

    staffProfileForm.addEventListener('submit', function (event) {
      event.preventDefault();

      var updatedProfile = {
        name: document.getElementById('staff-profile-name').value.trim(),
        role: document.getElementById('staff-profile-role-display').textContent.trim() || 'Senior Barista',
        id: document.getElementById('staff-profile-id').textContent.replace('ID: ', '').trim(),
        joined: document.getElementById('staff-profile-joined').textContent.replace('Joined: ', '').trim(),
        status: document.getElementById('staff-profile-status').textContent.trim(),
        dob: document.getElementById('staff-profile-dob').value.trim(),
        department: document.getElementById('staff-profile-department').value.trim(),
        manager: document.getElementById('staff-profile-manager').value.trim(),
        email: document.getElementById('staff-profile-email').value.trim(),
        phone: document.getElementById('staff-profile-phone').value.trim(),
        address: document.getElementById('staff-profile-address').value.trim(),
        avatar: document.getElementById('staff-profile-avatar').src
      };

      if (!updatedProfile.name || !updatedProfile.email || !updatedProfile.department || !updatedProfile.phone || !updatedProfile.address) {
        window.alert('Please fill in all employee profile fields before saving.');
        return;
      }

      if (!isValidGmail(updatedProfile.email)) {
        window.alert('Please use a valid Gmail address for the staff profile.');
        return;
      }

      saveStaffProfile(updatedProfile);
      renderStaffProfile(updatedProfile);
      setStaffProfileEditing(false);
      window.alert('Employee profile updated successfully.');
    });
  }

  function applySearchFilter(searchInput) {
    if (!searchInput || !searchInput.closest('.staff-search')) {
      return;
    }

    var query = (searchInput.value || '').trim().toLowerCase();
    var table = searchInput.closest('.staff-main') || searchInput.closest('body');
    var rows = table.querySelectorAll('.staff-table tbody tr');

    rows.forEach(function (row) {
      var text = (row.textContent || '').replace(/\s+/g, ' ').toLowerCase();
      var visible = !query || text.indexOf(query) !== -1;
      row.style.display = visible ? '' : 'none';
    });
  }

  function applyOrderFilter(filterValue) {
    var table = document.querySelector('.staff-table tbody');
    if (!table) return;

    var rows = table.querySelectorAll('tr');
    rows.forEach(function (row) {
      var status = (row.querySelector('.pill') || row.querySelector('.status'));
      var statusText = status ? status.textContent.trim().toLowerCase() : '';
      var visible = filterValue === 'all' || statusText.indexOf(filterValue) !== -1;
      row.style.display = visible ? '' : 'none';
    });
  }

  function applyHistoryFilter(filterValue) {
    var table = document.querySelector('.staff-table tbody');
    if (!table) return;

    var rows = table.querySelectorAll('tr');
    rows.forEach(function (row) {
      var status = (row.querySelector('.pill') || row.querySelector('.status')).textContent.trim().toLowerCase();
      var visible = filterValue === 'all' || status.indexOf(filterValue) !== -1;
      row.style.display = visible ? '' : 'none';
    });
  }

  document.querySelectorAll('.staff-search input[type="search"]').forEach(function (input) {
    input.addEventListener('input', function () {
      applySearchFilter(input);
    });
  });

  document.querySelectorAll('.staff-filter-select').forEach(function (select) {
    select.addEventListener('change', function () {
      var filterValue = select.value || 'all';
      if (select.closest('.staff-main') && select.closest('.staff-main').querySelector('.staff-table')) {
        applyOrderFilter(filterValue);
      } else {
        applyHistoryFilter(filterValue);
      }
    });
  });

  // Shared action handlers for buttons without inline navigation
  document.querySelectorAll('[data-route]').forEach(function (btn) {
    btn.addEventListener('click', function (event) {
      if (btn.tagName && btn.tagName.toLowerCase() === 'a') {
        return;
      }
      event.preventDefault();
      var target = btn.getAttribute('data-route');
      if (target) {
        window.location.href = target;
      }
    });
  });

  document.querySelectorAll('[data-action]').forEach(function (btn) {
    btn.addEventListener('click', function (event) {
      event.preventDefault();
      var action = btn.getAttribute('data-action');

      if (action === 'filter') {
        var dropdown = btn.closest('.staff-filter-dropdown');
        if (dropdown) {
          var isOpen = dropdown.classList.toggle('is-open');
          btn.setAttribute('aria-expanded', String(isOpen));
          return;
        }

        var nearestSearch = btn.closest('.staff-topbar__actions, .staff-panel__tools')?.querySelector('input[type="search"]');
        if (nearestSearch) {
          nearestSearch.focus();
          return;
        }

        window.alert('Order filter opened.');
      } else if (action === 'export') {
        window.alert('Order history export started.');
      } else if (action === 'restock') {
        window.alert('Inventory restock requested.');
      } else if (action === 'save') {
        if (btn.classList.contains('staff-btn-solid')) {
          window.alert('Profile editor opened.');
          return;
        }

        if (btn.classList.contains('action-btn--outline')) {
          btn.textContent = 'Prep Started';
          btn.classList.add('is-done');
          btn.disabled = true;
          var prepRow = btn.closest('tr');
          if (prepRow) {
            var statusPill = prepRow.querySelector('.pill');
            if (statusPill) {
              statusPill.className = 'pill pill--progress';
              statusPill.innerHTML = '<span class="pill__dot"></span>In Progress';
            }
          }
          window.alert('Prep started for this order.');
          return;
        }

        window.alert('Changes saved successfully.');
      } else if (action === 'notify') {
        window.alert('Notifications opened.');
      } else if (action === 'new-order') {
        window.alert('New order form opened.');
      } else if (action === 'mark-ready') {
        btn.textContent = 'Ready';
        btn.classList.add('is-done');
        btn.disabled = true;
        var readyRow = btn.closest('tr');
        if (readyRow) {
          var readyPill = readyRow.querySelector('.pill');
          if (readyPill) {
            readyPill.className = 'pill pill--ready';
            readyPill.innerHTML = '<span class="pill__dot"></span>Ready';
          }
        }
        window.alert('Order marked as ready.');
      } else if (action === 'page') {
        var targetPage = btn.getAttribute('data-page');
        if (targetPage) {
          window.location.href = targetPage;
        }
      }
    });
  });

  document.querySelectorAll('.staff-icon-btn, .action-menu-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (btn.classList.contains('action-menu-btn')) {
        window.alert('More actions menu opened.');
      } else {
        window.alert('Notifications opened.');
      }
    });
  });

  document.querySelectorAll('.staff-page-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.staff-page-btn').forEach(function (pageBtn) {
        pageBtn.classList.remove('is-active');
        pageBtn.removeAttribute('aria-current');
      });
      btn.classList.add('is-active');
      btn.setAttribute('aria-current', 'page');
    });
  });

  // Shared logout / clock-out behavior
  document.querySelectorAll('.btn-logout, .btn-clockout').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var target = btn.getAttribute('data-logout-target');

      if (!target) {
        target = btn.classList.contains('btn-clockout') ? 'staff-login.html' : 'login.html';
      }

      window.location.href = target;
    });
  });

  var addProductForm = document.getElementById('add-product-form');
  if (addProductForm) {
    addProductForm.addEventListener('submit', function (event) {
      event.preventDefault();
      window.alert('Product saved successfully.');
      window.location.href = 'products.html';
    });
  }

  // Login form
  var loginForm = document.getElementById('login-form');
  if (loginForm) {
    var rememberedAdminEmail = localStorage.getItem('cornerCravingsAdminRememberedEmail');
    if (rememberedAdminEmail) {
      var emailInput = document.getElementById('email');
      var rememberCheckbox = document.getElementById('remember-admin');
      if (emailInput) emailInput.value = rememberedAdminEmail;
      if (rememberCheckbox) rememberCheckbox.checked = true;
    }

    loginForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = document.getElementById('email').value.trim();
      var password = document.getElementById('password').value;
      var rememberAdmin = document.getElementById('remember-admin') && document.getElementById('remember-admin').checked;

      if (!email || !password) {
        window.alert('Please enter both your Gmail address and password.');
        return;
      }

      if (!isValidGmail(email)) {
        window.alert('Please use a valid Gmail address to log in.');
        return;
      }

      if (rememberAdmin) {
        localStorage.setItem('cornerCravingsAdminRememberedEmail', email);
      } else {
        localStorage.removeItem('cornerCravingsAdminRememberedEmail');
      }

      console.log('Login submitted:', { email: email });
      window.location.href = 'products.html';
    });
  }

  // Staff login form
  var staffLoginForm = document.getElementById('staff-login-form');
  if (staffLoginForm) {
    staffLoginForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = document.getElementById('email').value.trim();
      var token = document.getElementById('token').value;

      if (!email || !token) {
        window.alert('Please enter both your Gmail address and access token.');
        return;
      }

      if (!isValidGmail(email)) {
        window.alert('Please use a valid Gmail address for staff login.');
        return;
      }

      console.log('Staff login submitted:', { email: email });
      window.location.href = 'staff-orders.html';
    });
  }

  // Sign up form
  var signupForm = document.getElementById('signup-form');
  if (signupForm) {
    signupForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = document.getElementById('full-name').value.trim();
      var email = document.getElementById('signup-email').value.trim();
      var password = document.getElementById('signup-password').value;
      var confirmPassword = document.getElementById('signup-confirm-password').value;

      if (!name || !email || !password || !confirmPassword) {
        window.alert('Please fill in all sign-up fields.');
        return;
      }
      if (!isValidGmail(email)) {
        window.alert('Please use a valid Gmail address for signup.');
        return;
      }
      if (password !== confirmPassword) {
        window.alert('Passwords do not match. Please try again.');
        return;
      }
      if (password.length < 8) {
        window.alert('Password must be at least 8 characters long.');
        return;
      }

      console.log('Admin sign-up submitted:', { name: name, email: email });
      window.alert('Your account has been created successfully!');
      window.location.href = 'login.html';
    });
  }

  // Staff sign up form
  var staffSignupForm = document.getElementById('staff-signup-form');
  if (staffSignupForm) {
    staffSignupForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = document.getElementById('staff-full-name').value.trim();
      var email = document.getElementById('staff-signup-email').value.trim();
      var token = document.getElementById('staff-access-token').value.trim();
      var password = document.getElementById('staff-signup-password').value;
      var confirmPassword = document.getElementById('staff-signup-confirm-password').value;

      if (!name || !email || !token || !password || !confirmPassword) {
        window.alert('Please fill in all staff sign-up fields.');
        return;
      }
      if (!isValidGmail(email)) {
        window.alert('Please use a valid Gmail address for staff signup.');
        return;
      }
      if (password !== confirmPassword) {
        window.alert('Passwords do not match. Please try again.');
        return;
      }
      if (password.length < 8) {
        window.alert('Password must be at least 8 characters long.');
        return;
      }

      var staffAccounts = getStaffAccounts();
      var alreadyExists = staffAccounts.some(function (entry) {
        return entry.email && entry.email.toLowerCase() === email.toLowerCase();
      });

      if (alreadyExists) {
        window.alert('This employee account already exists. Please go to the staff login page and sign in.');
        window.location.href = 'staff-login.html';
        return;
      }

      saveStaffAccount({
        name: name,
        email: email,
        token: token,
        password: password
      });

      console.log('Staff sign-up submitted:', { name: name, email: email, token: token });
      window.alert('Your staff account has been created successfully!');
      window.location.href = 'staff-login.html';
    });
  }

  // Forgot password form
  var forgotForm = document.getElementById('forgot-form');
  if (forgotForm) {
    forgotForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = document.getElementById('email').value.trim();
      var code = document.getElementById('code').value.trim();

      if (!email) {
        window.alert('Please enter your email address.');
        return;
      }
      if (!code) {
        window.alert('Please enter the verification code sent to your email.');
        return;
      }

      console.log('Verify and reset submitted:', { email: email, code: code });
      window.location.href = 'reset-password.html';
    });
  }

  // Reset password form
  var resetForm = document.getElementById('reset-form');
  if (resetForm) {
    resetForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var newPassword = document.getElementById('new-password').value;
      var confirmPassword = document.getElementById('confirm-password').value;

      if (!newPassword || !confirmPassword) {
        window.alert('Please fill in both password fields.');
        return;
      }
      if (newPassword !== confirmPassword) {
        window.alert('Passwords do not match. Please try again.');
        return;
      }
      if (newPassword.length < 8) {
        window.alert('Password must be at least 8 characters long.');
        return;
      }

      console.log('Password reset submitted.');
      window.alert('Your password has been reset successfully.');
      window.location.href = 'login.html';
    });
  }
})();
