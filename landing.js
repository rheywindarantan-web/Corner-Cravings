/**
 * Corner Cravings — Landing Page Behavior
 * Lightweight, accessible interactions for mobile navigation and customer session routing.
 */

(function () {
  'use strict';

  function initMobileNav() {
    var toggleBtn = document.getElementById('nav-toggle');
    var mobileMenu = document.getElementById('mobile-menu');
    if (!toggleBtn || !mobileMenu) return;

    function openMenu() {
      toggleBtn.setAttribute('aria-expanded', 'true');
      mobileMenu.setAttribute('aria-hidden', 'false');
      mobileMenu.classList.add('is-open');
      document.body.style.overflow = 'hidden';

      var firstLink = mobileMenu.querySelector('a, button');
      if (firstLink) {
        firstLink.focus();
      }
    }

    function closeMenu() {
      toggleBtn.setAttribute('aria-expanded', 'false');
      mobileMenu.setAttribute('aria-hidden', 'true');
      mobileMenu.classList.remove('is-open');
      document.body.style.overflow = '';
    }

    toggleBtn.addEventListener('click', function (event) {
      event.stopPropagation();
      var isExpanded = toggleBtn.getAttribute('aria-expanded') === 'true';
      if (isExpanded) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' || event.key === 'Esc') {
        if (toggleBtn.getAttribute('aria-expanded') === 'true') {
          closeMenu();
          toggleBtn.focus();
        }
      }
    });

    document.addEventListener('click', function (event) {
      if (toggleBtn.getAttribute('aria-expanded') === 'true') {
        if (!mobileMenu.contains(event.target) && !toggleBtn.contains(event.target)) {
          closeMenu();
        }
      }
    });

    var mobileLinks = mobileMenu.querySelectorAll('a');
    for (var i = 0; i < mobileLinks.length; i++) {
      mobileLinks[i].addEventListener('click', function () {
        closeMenu();
      });
    }

    window.addEventListener('resize', function () {
      if (window.innerWidth > 960 && toggleBtn.getAttribute('aria-expanded') === 'true') {
        closeMenu();
      }
    });
  }

  function initCustomerOrderingLinks() {
    var orderNowBtn = document.getElementById('hero-order-now-btn');
    if (orderNowBtn) {
      try {
        var session = localStorage.getItem('cornerCravingsCustomerSession');
        if (session) {
          orderNowBtn.setAttribute('href', 'customer-home.html');
        }
      } catch (e) {}
    }
  }

  function initScrollspy() {
    var sections = document.querySelectorAll('section[id]');
    var desktopLinks = document.querySelectorAll('.nav-links .nav-link');
    var mobileLinks = document.querySelectorAll('.mobile-menu__link');
    if (!sections.length || !desktopLinks.length) return;

    function updateActive() {
      var scrollPos = window.scrollY + 130;
      var currentId = '';

      for (var i = 0; i < sections.length; i++) {
        var sec = sections[i];
        var top = sec.offsetTop;
        var height = sec.offsetHeight;
        if (scrollPos >= top && scrollPos < top + height) {
          currentId = sec.getAttribute('id');
          break;
        }
      }

      if (!currentId && window.scrollY < 200 && sections.length > 0) {
        currentId = sections[0].getAttribute('id');
      }

      function applyActive(links) {
        for (var j = 0; j < links.length; j++) {
          var href = links[j].getAttribute('href');
          if (href === '#' + currentId) {
            links[j].classList.add('is-active');
          } else if (href && href.startsWith('#')) {
            links[j].classList.remove('is-active');
          }
        }
      }

      applyActive(desktopLinks);
      applyActive(mobileLinks);
    }

    window.addEventListener('scroll', updateActive, { passive: true });
    updateActive();
  }

  function initBackToTop() {
    var btn = document.getElementById('back-to-top');
    if (!btn) return;

    function checkVisibility() {
      var y = window.pageYOffset || document.documentElement.scrollTop || window.scrollY || 0;
      if (y > 300) {
        btn.classList.add('is-visible');
      } else {
        btn.classList.remove('is-visible');
      }
    }

    window.addEventListener('scroll', checkVisibility, { passive: true });
    checkVisibility();

    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  function initDynamicYear() {
    var yearSpan = document.getElementById('current-year');
    if (yearSpan) {
      yearSpan.textContent = new Date().getFullYear();
    }
  }

  function initAll() {
    initMobileNav();
    initCustomerOrderingLinks();
    initScrollspy();
    initBackToTop();
    initDynamicYear();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
})();
