/**
 * Corner Cravings — Customer Ordering Architecture & State Management
 * Handles demo menu catalog, cart operations, delivery preferences, demo session, and order lifecycle.
 */

(function () {
  'use strict';

  // ==========================================================================
  // Centralized Demo Menu Data
  // ==========================================================================
  // TODO: Replace demo menu data with the owner-approved item names, prices, categories, and images.
  var DEMO_MENU = [
    {
      id: 'prod-1',
      name: 'Signature Beef Burger',
      category: 'street-food',
      categoryLabel: 'Street Food',
      price: 149.00,
      description: 'Juicy flame-grilled beef patty with fresh lettuce, melted cheese, and our signature savory house sauce on a toasted bun.',
      imageWebp: 'assets/images/hero-bakery.webp',
      imageJpg: 'assets/images/hero-bakery.jpg',
      imageAlt: 'Signature Beef Burger shown with temporary image placeholder',
      popular: true,
      sizes: null,
      addons: [
        { id: 'add-cheese', name: 'Extra Cheddar Cheese', price: 20.00 },
        { id: 'add-bacon', name: 'Crispy Bacon Strips', price: 35.00 },
        { id: 'add-patty', name: 'Extra Beef Patty', price: 65.00 }
      ]
    },
    {
      id: 'prod-2',
      name: 'Hotsilog',
      category: 'rice-meals',
      categoryLabel: 'Rice Meals',
      price: 110.00,
      description: 'Classic tender juicy red hotdog served with steaming garlic fried rice (sinangag) and a sunny-side-up fried egg.',
      imageWebp: 'assets/images/sourdough-loaf.webp',
      imageJpg: 'assets/images/sourdough-loaf.jpg',
      imageAlt: 'Hotsilog breakfast rice meal shown with temporary image placeholder',
      popular: true,
      sizes: null,
      addons: [
        { id: 'add-egg', name: 'Extra Fried Egg', price: 15.00 },
        { id: 'add-rice', name: 'Extra Garlic Rice', price: 25.00 },
        { id: 'add-hotdog', name: 'Extra Hotdog (1 pc)', price: 35.00 }
      ]
    },
    {
      id: 'prod-3',
      name: 'Longsilog',
      category: 'rice-meals',
      categoryLabel: 'Rice Meals',
      price: 125.00,
      description: 'Sweet and savory traditional pork sausage (longganisa) served with golden garlic fried rice and a crispy fried egg.',
      imageWebp: 'assets/images/bakery-story.webp',
      imageJpg: 'assets/images/bakery-story.jpg',
      imageAlt: 'Longsilog comfort rice plate shown with temporary image placeholder',
      popular: true,
      sizes: null,
      addons: [
        { id: 'add-egg', name: 'Extra Fried Egg', price: 15.00 },
        { id: 'add-rice', name: 'Extra Garlic Rice', price: 25.00 },
        { id: 'add-longganisa', name: 'Extra Longganisa (2 pcs)', price: 45.00 }
      ]
    },
    {
      id: 'prod-4',
      name: 'Street Food Platter',
      category: 'street-food',
      categoryLabel: 'Street Food',
      price: 115.00,
      description: 'Crisp, savory assortment of neighborhood street-food favorites served hot with signature sweet, spiced, and vinegar dipping sauces.',
      imageWebp: 'assets/images/almond-croissant.webp',
      imageJpg: 'assets/images/almond-croissant.jpg',
      imageAlt: 'Street food skewers and bites shown with temporary image placeholder',
      popular: false,
      sizes: null,
      addons: [
        { id: 'add-sauce', name: 'Extra Special Dipping Sauce', price: 10.00 },
        { id: 'add-kwek', name: 'Extra Kwek-Kwek (3 pcs)', price: 25.00 }
      ]
    },
    {
      id: 'prod-5',
      name: 'Classic Creamy Carbonara',
      category: 'pasta',
      categoryLabel: 'Pasta',
      price: 135.00,
      description: 'Al dente pasta tossed in a rich, velvety cream sauce with savory bacon bits, ground pepper, and freshly grated parmesan.',
      imageWebp: 'assets/images/almond-croissant.webp',
      imageJpg: 'assets/images/almond-croissant.jpg',
      imageAlt: 'Creamy savory pasta shown with temporary image placeholder',
      popular: true,
      sizes: null,
      addons: [
        { id: 'add-parm', name: 'Extra Grated Parmesan', price: 20.00 },
        { id: 'add-bacon', name: 'Extra Smoked Bacon Bits', price: 30.00 },
        { id: 'add-toast', name: 'Toasted Garlic Bread (2 pcs)', price: 25.00 }
      ]
    },
    {
      id: 'prod-6',
      name: 'Caramel Macchiato',
      category: 'drinks',
      categoryLabel: 'Drinks',
      price: 120.00,
      description: 'Freshly steamed milk with vanilla-flavored syrup, richly marked with bold espresso and topped with decadent caramel drizzle.',
      imageWebp: 'assets/images/dark-roast-coffee.webp',
      imageJpg: 'assets/images/dark-roast-coffee.jpg',
      imageAlt: 'Warm espresso drink shown with temporary image placeholder',
      popular: false,
      sizes: [
        { id: 'size-reg', name: 'Regular (16oz)', priceDiff: 0.00 },
        { id: 'size-large', name: 'Large (22oz)', priceDiff: 25.00 }
      ],
      addons: [
        { id: 'add-shot', name: 'Extra Espresso Shot', price: 30.00 },
        { id: 'add-drizzle', name: 'Extra Caramel Drizzle', price: 15.00 },
        { id: 'add-whip', name: 'Whipped Cream Topping', price: 20.00 }
      ]
    },
    {
      id: 'prod-7',
      name: 'Iced Caramel Macchiato',
      category: 'drinks',
      categoryLabel: 'Drinks',
      price: 130.00,
      description: 'Chilled rich espresso poured gently over cold milk, vanilla syrup, ice cubes, and a lavish crosshatch of sweet caramel sauce.',
      imageWebp: 'assets/images/dark-roast-coffee.webp',
      imageJpg: 'assets/images/dark-roast-coffee.jpg',
      imageAlt: 'Iced coffee beverage shown with temporary image placeholder',
      popular: true,
      sizes: [
        { id: 'size-reg', name: 'Regular (16oz)', priceDiff: 0.00 },
        { id: 'size-large', name: 'Large (22oz)', priceDiff: 25.00 }
      ],
      addons: [
        { id: 'add-shot', name: 'Extra Espresso Shot', price: 30.00 },
        { id: 'add-jelly', name: 'Coffee Jelly Sinkers', price: 25.00 },
        { id: 'add-whip', name: 'Whipped Cream Topping', price: 20.00 }
      ]
    },
    {
      id: 'prod-8',
      name: 'Classic Halo-Halo',
      category: 'drinks',
      categoryLabel: 'Drinks',
      price: 99.00,
      description: 'Iconic shaved ice favorite layered with sweetened beans, nata de coco, chewy jellies, leche flan, milk, and purple ube.',
      imageWebp: 'assets/images/hero-bakery.webp',
      imageJpg: 'assets/images/hero-bakery.jpg',
      imageAlt: 'Halo-Halo dessert treat shown with temporary image placeholder',
      popular: true,
      sizes: [
        { id: 'size-reg', name: 'Regular', priceDiff: 0.00 },
        { id: 'size-special', name: 'Special (with Ube Ice Cream)', priceDiff: 30.00 }
      ],
      addons: [
        { id: 'add-flan', name: 'Extra Leche Flan Slice', price: 25.00 },
        { id: 'add-icecream', name: 'Extra Scoop of Ube Ice Cream', price: 30.00 }
      ]
    }
  ];

  // ==========================================================================
  // Storage Keys (Strictly Isolated from Admin/Staff)
  // ==========================================================================
  var STORAGE_KEYS = {
    SESSION: 'cornerCravingsCustomerSession',
    PROFILE: 'cornerCravingsCustomerProfile',
    CART: 'cornerCravingsCustomerCart',
    DELIVERY: 'cornerCravingsCustomerDelivery',
    LAST_ORDER: 'cornerCravingsCustomerLastOrder'
  };

  // Delivery fee lookup
  var DELIVERY_FEES = {
    standard: 49.00,
    priority: 79.00,
    pickup: 0.00
  };

  // ==========================================================================
  // Formatters & Utility Helpers
  // ==========================================================================
  function formatPeso(amount) {
    var val = parseFloat(amount) || 0;
    return '₱' + val.toFixed(2);
  }

  function getProductById(id) {
    for (var i = 0; i < DEMO_MENU.length; i++) {
      if (DEMO_MENU[i].id === id) {
        return DEMO_MENU[i];
      }
    }
    return null;
  }

  // ==========================================================================
  // Cart State Management
  // ==========================================================================
  function getCart() {
    try {
      var raw = localStorage.getItem(STORAGE_KEYS.CART);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Unable to read customer cart from storage:', e);
    }
    return [];
  }

  function saveCart(cart, shouldPulse) {
    try {
      localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
    } catch (e) {
      console.warn('Unable to save customer cart:', e);
    }
    updateCartCountBadge(shouldPulse);
  }

  function addToCart(productId, quantity, selectedSizeId, selectedAddonIds) {
    var product = getProductById(productId);
    if (!product) return false;

    var qty = parseInt(quantity, 10) || 1;
    if (qty < 1) qty = 1;

    var sizeObj = null;
    var sizePriceDiff = 0;
    if (product.sizes && selectedSizeId) {
      for (var s = 0; s < product.sizes.length; s++) {
        if (product.sizes[s].id === selectedSizeId) {
          sizeObj = product.sizes[s];
          sizePriceDiff = sizeObj.priceDiff;
          break;
        }
      }
    }

    var chosenAddons = [];
    var addonsPriceSum = 0;
    if (product.addons && selectedAddonIds && selectedAddonIds.length > 0) {
      for (var a = 0; a < product.addons.length; a++) {
        if (selectedAddonIds.indexOf(product.addons[a].id) !== -1) {
          chosenAddons.push(product.addons[a]);
          addonsPriceSum += product.addons[a].price;
        }
      }
    }

    var unitPrice = product.price + sizePriceDiff + addonsPriceSum;

    // Build a unique key for items with identical product and options
    var optionKey = [
      product.id,
      selectedSizeId || 'default',
      chosenAddons.map(function (x) { return x.id; }).sort().join('-')
    ].join('_');

    var cart = getCart();
    var existingIndex = -1;
    for (var i = 0; i < cart.length; i++) {
      if (cart[i].optionKey === optionKey) {
        existingIndex = i;
        break;
      }
    }

    if (existingIndex !== -1) {
      cart[existingIndex].quantity += qty;
    } else {
      cart.push({
        optionKey: optionKey,
        productId: product.id,
        name: product.name,
        category: product.category,
        imageWebp: product.imageWebp,
        imageJpg: product.imageJpg,
        imageAlt: product.imageAlt,
        unitPrice: unitPrice,
        basePrice: product.price,
        size: sizeObj ? sizeObj.name : null,
        addons: chosenAddons,
        quantity: qty
      });
    }

    saveCart(cart, true);
    showToast('Added to order: ' + product.name);
    return true;
  }

  function updateItemQuantity(optionKey, newQuantity) {
    var cart = getCart();
    var qty = parseInt(newQuantity, 10);
    for (var i = 0; i < cart.length; i++) {
      if (cart[i].optionKey === optionKey) {
        if (qty <= 0) {
          cart.splice(i, 1);
        } else {
          cart[i].quantity = qty;
        }
        break;
      }
    }
    saveCart(cart);
  }

  function removeItemFromCart(optionKey) {
    var cart = getCart();
    var updated = cart.filter(function (item) {
      return item.optionKey !== optionKey;
    });
    saveCart(updated);
  }

  function clearCart() {
    saveCart([]);
  }

  function calculateCartTotals(deliveryMethod) {
    var cart = getCart();
    var subtotal = 0;
    var itemCount = 0;

    for (var i = 0; i < cart.length; i++) {
      subtotal += cart[i].unitPrice * cart[i].quantity;
      itemCount += cart[i].quantity;
    }

    var method = deliveryMethod || getDeliveryMethod();
    var deliveryFee = DELIVERY_FEES[method] !== undefined ? DELIVERY_FEES[method] : DELIVERY_FEES.standard;
    var total = subtotal + deliveryFee;

    return {
      subtotal: subtotal,
      deliveryFee: deliveryFee,
      total: total,
      itemCount: itemCount,
      deliveryMethod: method
    };
  }

  // ==========================================================================
  // Delivery State Management
  // ==========================================================================
  function getDeliveryDetails() {
    try {
      var raw = localStorage.getItem(STORAGE_KEYS.DELIVERY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return {
      recipientName: '',
      contactNumber: '',
      address: '',
      landmark: '',
      area: 'Pasong Putik, Quezon City',
      method: 'standard'
    };
  }

  function saveDeliveryDetails(details) {
    try {
      localStorage.setItem(STORAGE_KEYS.DELIVERY, JSON.stringify(details));
    } catch (e) {}
  }

  function getDeliveryMethod() {
    var details = getDeliveryDetails();
    return details.method || 'standard';
  }

  function setDeliveryMethod(method) {
    var details = getDeliveryDetails();
    details.method = method;
    saveDeliveryDetails(details);
  }

  // ==========================================================================
  // Customer Session & Authentication State (Demo prototype)
  // ==========================================================================
  function getCustomerSession() {
    try {
      var raw = localStorage.getItem(STORAGE_KEYS.SESSION);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return null;
  }

  function setCustomerSession(user) {
    try {
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(user));
    } catch (e) {}
  }

  function clearCustomerSession() {
    try {
      localStorage.removeItem(STORAGE_KEYS.SESSION);
    } catch (e) {}
  }

  // ==========================================================================
  // Order Confirmation State
  // ==========================================================================
  function getLastOrder() {
    try {
      var raw = localStorage.getItem(STORAGE_KEYS.LAST_ORDER);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return null;
  }

  function saveLastOrder(order) {
    try {
      localStorage.setItem(STORAGE_KEYS.LAST_ORDER, JSON.stringify(order));
    } catch (e) {}
  }

  function createDemoOrder(paymentMethod) {
    var cart = getCart();
    if (cart.length === 0) return null;

    var delivery = getDeliveryDetails();
    var totals = calculateCartTotals(delivery.method);

    var orderNumber = 'CC-' + Math.floor(100000 + Math.random() * 900000);
    var dateString = new Date().toLocaleDateString('en-PH', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    var order = {
      orderNumber: orderNumber,
      orderDate: dateString,
      items: cart,
      delivery: delivery,
      paymentMethod: paymentMethod || 'Cash on Delivery',
      totals: totals,
      status: 'Confirmed'
    };

    saveLastOrder(order);
    clearCart();
    return order;
  }

  // ==========================================================================
  // UI Helpers: Header Badge, Toast Notification, Rewards Modal
  // ==========================================================================
  function updateCartCountBadge(shouldPulse) {
    var badges = document.querySelectorAll('.cart-badge');
    var cart = getCart();
    var count = 0;
    for (var i = 0; i < cart.length; i++) {
      count += cart[i].quantity;
    }

    for (var b = 0; b < badges.length; b++) {
      badges[b].textContent = count;
      if (count > 0) {
        badges[b].style.display = 'inline-flex';
        if (shouldPulse) {
          badges[b].classList.remove('has-pulsed');
          void badges[b].offsetWidth;
          badges[b].classList.add('has-pulsed');
        }
      } else {
        badges[b].style.display = 'none';
      }
    }
  }

  function showToast(message) {
    var existing = document.getElementById('customer-toast');
    if (existing) {
      existing.remove();
    }

    var toast = document.createElement('div');
    toast.id = 'customer-toast';
    toast.className = 'customer-toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    toast.innerHTML = '<span>' + message + '</span>';

    document.body.appendChild(toast);

    setTimeout(function () {
      toast.classList.add('is-visible');
    }, 10);

    setTimeout(function () {
      toast.classList.remove('is-visible');
      setTimeout(function () {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    }, 2800);
  }

  function initHeaderActions() {
    updateCartCountBadge();

    // Rewards link click handler (Honest coming soon state)
    var rewardsLinks = document.querySelectorAll('[data-action="rewards"]');
    for (var r = 0; r < rewardsLinks.length; r++) {
      rewardsLinks[r].addEventListener('click', function (e) {
        e.preventDefault();
        showToast('Corner Cravings Rewards program coming soon!');
      });
    }

    // Profile icon click handler
    var profileButtons = document.querySelectorAll('[data-action="profile"]');
    for (var p = 0; p < profileButtons.length; p++) {
      profileButtons[p].addEventListener('click', function (e) {
        e.preventDefault();
        var session = getCustomerSession();
        if (session) {
          showToast('Signed in as ' + (session.name || session.email));
        } else {
          window.location.href = 'customer-login.html';
        }
      });
    }

    // Mobile nav toggle
    var toggleBtn = document.getElementById('customer-nav-toggle');
    var drawer = document.getElementById('customer-mobile-menu');
    if (toggleBtn && drawer) {
      toggleBtn.addEventListener('click', function () {
        var isOpen = toggleBtn.getAttribute('aria-expanded') === 'true';
        toggleBtn.setAttribute('aria-expanded', !isOpen);
        drawer.classList.toggle('is-open', !isOpen);
      });
    }
  }

  // Auto-init on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHeaderActions);
  } else {
    initHeaderActions();
  }

  // Export globally for customer flow pages
  window.CornerCravings = {
    DEMO_MENU: DEMO_MENU,
    getProductById: getProductById,
    formatPeso: formatPeso,
    getCart: getCart,
    saveCart: saveCart,
    addToCart: addToCart,
    updateItemQuantity: updateItemQuantity,
    removeItemFromCart: removeItemFromCart,
    clearCart: clearCart,
    calculateCartTotals: calculateCartTotals,
    getDeliveryDetails: getDeliveryDetails,
    saveDeliveryDetails: saveDeliveryDetails,
    getDeliveryMethod: getDeliveryMethod,
    setDeliveryMethod: setDeliveryMethod,
    getCustomerSession: getCustomerSession,
    setCustomerSession: setCustomerSession,
    clearCustomerSession: clearCustomerSession,
    getLastOrder: getLastOrder,
    createDemoOrder: createDemoOrder,
    updateCartCountBadge: updateCartCountBadge,
    showToast: showToast
  };
})();
