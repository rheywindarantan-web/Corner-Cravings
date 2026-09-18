(function () {
  'use strict';

  var KEY = 'cornerCravingsStaffProfile';
  var defaults = {
    name: 'Jane Emily Doe', role: 'Senior Barista', id: 'EMP-0492', joined: 'Mar 2022', status: 'Full-Time',
    dob: 'Oct 15, 1995', department: 'Front of House', manager: 'Michael Scott',
    email: 'jane.doe@cornercravings.com', phone: '(555) 123-4567',
    address: '123 Cafe Lane, Apt 4B\nSeattle, WA 98101', store: 'Corner Cravings',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80'
  };

  function getProfile() {
    try { return Object.assign({}, defaults, JSON.parse(localStorage.getItem(KEY)) || {}); }
    catch (error) { return Object.assign({}, defaults); }
  }

  document.addEventListener('DOMContentLoaded', function () {
    var form = document.getElementById('staff-edit-profile-form');
    if (!form) return;
    var profile = getProfile();
    var parts = profile.name.trim().split(/\s+/);
    form.elements.firstName.value = parts.shift() || '';
    form.elements.lastName.value = parts.join(' ') || '';
    form.elements.email.value = profile.email;
    form.elements.phone.value = profile.phone;
    form.elements.store.value = profile.store || 'Corner Cravings';
    document.getElementById('staff-edit-avatar').src = profile.avatar;

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      profile.name = form.elements.firstName.value.trim() + ' ' + form.elements.lastName.value.trim();
      profile.email = form.elements.email.value.trim();
      profile.phone = form.elements.phone.value.trim();
      profile.store = form.elements.store.value;
      localStorage.setItem(KEY, JSON.stringify(profile));
      window.location.href = 'staff-profile.html';
    });
  });
})();
