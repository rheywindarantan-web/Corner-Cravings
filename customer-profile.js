(function () {
  'use strict';

  var PROFILE_KEY = 'cornerCravingsCustomerProfile';
  var DEFAULT_PROFILE = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    customerId: ''
  };

  function getProfile() {
    var saved = null;
    try { saved = JSON.parse(localStorage.getItem(PROFILE_KEY)); } catch (error) {}
    if (saved && (saved.firstName === 'Mae' || saved.email === 'mae.sales@cornercravings.com')) {
      saved = null;
      try { localStorage.removeItem(PROFILE_KEY); } catch (e) {}
    }
    var session = window.CornerCravings && window.CornerCravings.getCustomerSession();
    var profile = Object.assign({}, DEFAULT_PROFILE, saved || {});
    if (session) {
      var names = String(session.name || '').trim().split(/\s+/);
      if (names[0]) profile.firstName = names[0];
      if (names.length > 1) profile.lastName = names.slice(1).join(' ');
      if (session.email) profile.email = session.email;
      if (session.phone) profile.phone = session.phone;
      if (session.id) profile.customerId = session.id;
    }
    if (!profile.customerId) {
      profile.customerId = profile.email ? ('CC-' + Math.abs(profile.email.split('').reduce(function(a,b){a=((a<<5)-a)+b.charCodeAt(0);return a&a},0)).toString(36).toUpperCase().slice(0, 6)) : '—';
    }
    return profile;
  }

  function saveProfile(profile) {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    if (window.CornerCravings) {
      window.CornerCravings.setCustomerSession({
        name: (profile.firstName + ' ' + profile.lastName).trim(),
        email: profile.email,
        phone: profile.phone,
        id: profile.customerId
      });
    }
  }

  function initials(profile) {
    var str = ((profile.firstName ? profile.firstName.charAt(0) : '') + (profile.lastName ? profile.lastName.charAt(0) : '')).toUpperCase();
    return str || 'CC';
  }

  function fillText(profile) {
    var fullName = (profile.firstName + ' ' + profile.lastName).trim();
    document.querySelectorAll('[data-profile]').forEach(function (element) {
      var key = element.getAttribute('data-profile');
      if (key === 'fullName') {
        element.textContent = fullName || 'Customer Account';
      } else {
        element.textContent = profile[key] || '—';
      }
    });
    document.querySelectorAll('[data-profile-initials]').forEach(function (element) {
      element.textContent = initials(profile);
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    var profile = getProfile();
    fillText(profile);

    var form = document.getElementById('customer-profile-form');
    if (form) {
      ['firstName', 'lastName', 'email', 'phone'].forEach(function (key) {
        if (form.elements[key]) form.elements[key].value = profile[key] || '';
      });
      form.addEventListener('submit', function (event) {
        event.preventDefault();
        if (!form.checkValidity()) { form.reportValidity(); return; }
        profile.firstName = form.elements.firstName.value.trim();
        profile.lastName = form.elements.lastName.value.trim();
        profile.email = form.elements.email.value.trim();
        profile.phone = form.elements.phone.value.trim();
        saveProfile(profile);
        if (window.CornerCravings) window.CornerCravings.showToast('Profile updated successfully.');
        setTimeout(function () { window.location.href = 'customer-profile.html'; }, 500);
      });
    }

    var logout = document.getElementById('customer-profile-logout');
    if (logout) logout.addEventListener('click', function () {
      if (window.CornerCravings) window.CornerCravings.clearCustomerSession();
      window.location.href = 'customer-login.html';
    });
  });
})();
