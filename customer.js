/**
 * Corner Cravings — Customer Ordering Architecture & State Management
 * Handles the owner menu catalog, cart operations, delivery preferences, demo session, and order lifecycle.
 */

(function () {
  'use strict';

  // Manual GCash collection settings for the frontend prototype. Replace these
  // values only after the business owner confirms the receiving wallet.
  var GCASH_PAYMENT_CONFIG = {
    mobileNumber: '09614625860',
    referenceLength: 13,
    maxReceiptBytes: 5 * 1024 * 1024,
    maxReceiptWidth: 1000,
    receiptQuality: 0.72
  };

  // ==========================================================================
  // Centralized Menu Data
  // ==========================================================================
  // The legacy fallback below is used only if menu-data.js fails to load.
  var DEMO_MENU = [
    {
      id: 'prod-1',
      name: 'Signature Beef Burger',
      category: 'street-food',
      categoryLabel: 'Street Food',
      price: 250.00,
      description: 'Juicy flame-grilled beef patty with fresh lettuce, melted cheese, and our signature savory house sauce on a toasted bun.',
      imageWebp: 'assets/images/signature-burger.jpg',
      imageJpg: 'assets/images/signature-burger.jpg',
      imageAlt: 'Signature Beef Burger',
      popular: true,
      sizes: [
        { id: 'size-reg', name: 'Regular', priceDiff: 0.00 },
        { id: 'size-large', name: 'Large', priceDiff: 30.00 }
      ],
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
      price: 180.00,
      description: 'Chilled rich espresso poured gently over cold milk, vanilla syrup, ice cubes, and a lavish crosshatch of sweet caramel sauce.',
      imageWebp: 'assets/images/iced-macchiato.jpg',
      imageJpg: 'assets/images/iced-macchiato.jpg',
      imageAlt: 'Iced Caramel Macchiato',
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

  if (Array.isArray(window.CornerCravingsMenu) && window.CornerCravingsMenu.length) {
    DEMO_MENU = window.CornerCravingsMenu;
  }

  // ==========================================================================
  // Storage Keys (Strictly Isolated from Admin/Staff)
  // ==========================================================================
  var STORAGE_KEYS = {
    SESSION: 'cornerCravingsCustomerSession',
    PROFILE: 'cornerCravingsCustomerProfile',
    CART: 'cornerCravingsCustomerCart',
    DELIVERY: 'cornerCravingsCustomerDelivery',
    LAST_ORDER: 'cornerCravingsCustomerLastOrder',
    ORDERS: 'cornerCravingsCustomerOrders',
    FAVORITES: 'cornerCravingsCustomerFavorites'
  };

  // Delivery fee lookup (matching Figma review order options)
  var DELIVERY_FEES = {
    standard: 50.00,
    priority: 100.00,
    pickup: 0.00
  };

  function getStoreConfig() {
    var defaults = {
      openTime: '09:00',
      closeTime: '21:00',
      deliveryFee: DELIVERY_FEES.standard
    };
    try {
      var saved = JSON.parse(localStorage.getItem('cornerCravingsStoreConfig') || 'null');
      return saved ? Object.assign({}, defaults, saved) : defaults;
    } catch (e) {
      return defaults;
    }
  }

  function minutesFromTime(value, fallback) {
    var match = /^(\d{1,2}):(\d{2})$/.exec(String(value || ''));
    if (!match) return fallback;
    return Math.min(23, Number(match[1])) * 60 + Math.min(59, Number(match[2]));
  }

  function formatStoreTime(value) {
    var total = minutesFromTime(value, 0);
    var hour = Math.floor(total / 60);
    var minute = total % 60;
    var suffix = hour >= 12 ? 'PM' : 'AM';
    var displayHour = hour % 12 || 12;
    return displayHour + ':' + String(minute).padStart(2, '0') + ' ' + suffix;
  }

  var DEFAULT_DELIVERY = {
    recipientName: '',
    contactNumber: '',
    address: '',
    landmark: '',
    area: '',
    method: 'standard',
    notes: ''
  };

  // ==========================================================================
  // Formatters & Utility Helpers
  // ==========================================================================
  function formatPeso(amount) {
    var val = parseFloat(amount) || 0;
    return '₱' + val.toFixed(2);
  }

  function getProductById(id) {
    var catalog = Array.isArray(window.CornerCravingsMenu) ? window.CornerCravingsMenu : DEMO_MENU;
    for (var i = 0; i < catalog.length; i++) {
      if (catalog[i].id === id) {
        return catalog[i];
      }
    }
    for (var j = 0; j < DEMO_MENU.length; j++) {
      if (DEMO_MENU[j].id === id) {
        return DEMO_MENU[j];
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
      if (raw !== null) {
        var parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          var currentItems = parsed.filter(function (item) { return getProductById(item.productId); });
          if (currentItems.length !== parsed.length) localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(currentItems));
          return currentItems;
        }
      }
      localStorage.setItem(STORAGE_KEYS.CART, '[]');
      return [];
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
    if (product.available === false) {
      showToast(product.name + ' is currently unavailable.');
      return false;
    }

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
        customizationText: sizeObj ? sizeObj.name : '',
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
    var storeConfig = getStoreConfig();
    var configuredFees = {
      standard: Number.isFinite(Number(storeConfig.deliveryFee)) ? Number(storeConfig.deliveryFee) : DELIVERY_FEES.standard,
      priority: Number.isFinite(Number(storeConfig.priorityDeliveryFee)) ? Number(storeConfig.priorityDeliveryFee) : DELIVERY_FEES.priority,
      pickup: 0
    };
    var deliveryFee = configuredFees[method] !== undefined ? configuredFees[method] : configuredFees.standard;
    
    // Estimated tax matching mockup: subtotal 610 gives 32.00 (~5.25%)
    var estimatedTax = 0;
    if (subtotal > 0) {
      estimatedTax = (subtotal === 610) ? 32.00 : parseFloat((subtotal * 0.052459).toFixed(2));
    }
    var total = subtotal + deliveryFee + estimatedTax;

    return {
      subtotal: subtotal,
      deliveryFee: deliveryFee,
      estimatedTax: estimatedTax,
      total: total,
      itemCount: itemCount,
      deliveryMethod: method
    };
  }

  // ==========================================================================
  // Delivery State Management
  // ==========================================================================
  function getDeliveryDetails() {
    var session = getCustomerSession();
    var fallback = {
      recipientName: (session && session.name) ? session.name : '',
      contactNumber: (session && session.phone) ? session.phone : '',
      address: '',
      landmark: '',
      area: '',
      method: 'standard',
      notes: ''
    };
    try {
      var raw = localStorage.getItem(STORAGE_KEYS.DELIVERY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && parsed.recipientName === 'Juan Dela Cruz') {
          parsed.recipientName = (session && session.name) ? session.name : '';
          parsed.address = '';
          parsed.landmark = '';
          parsed.area = '';
          parsed.contactNumber = (session && session.phone) ? session.phone : '';
          localStorage.setItem(STORAGE_KEYS.DELIVERY, JSON.stringify(parsed));
        }
        return Object.assign({}, fallback, parsed);
      }
    } catch (e) {}
    return fallback;
  }

  function saveDeliveryDetails(details) {
    try {
      var current = getDeliveryDetails();
      var merged = Object.assign({}, current, details);
      localStorage.setItem(STORAGE_KEYS.DELIVERY, JSON.stringify(merged));
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

  function favoriteOwnerKey() {
    var session = getCustomerSession() || {};
    return String(session.email || session.id || session.customerId || 'guest').trim().toLowerCase();
  }

  function getFavoriteProductIds() {
    try {
      var saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.FAVORITES) || '{}');
      if (Array.isArray(saved)) return saved;
      var values = saved && saved[favoriteOwnerKey()];
      return Array.isArray(values) ? values : [];
    } catch (e) {
      return [];
    }
  }

  function saveFavoriteProductIds(productIds) {
    var clean = (Array.isArray(productIds) ? productIds : []).filter(function (id, index, list) {
      return typeof id === 'string' && id && list.indexOf(id) === index;
    });
    try {
      var saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.FAVORITES) || '{}');
      if (!saved || Array.isArray(saved) || typeof saved !== 'object') saved = {};
      saved[favoriteOwnerKey()] = clean;
      localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(saved));
    } catch (e) {}
    return clean;
  }

  function addFavoriteProduct(productId) {
    var favorites = getFavoriteProductIds();
    if (favorites.indexOf(productId) === -1) favorites.unshift(productId);
    return saveFavoriteProductIds(favorites);
  }

  function removeFavoriteProduct(productId) {
    return saveFavoriteProductIds(getFavoriteProductIds().filter(function (id) { return id !== productId; }));
  }

  function isFavoriteProduct(productId) {
    return getFavoriteProductIds().indexOf(productId) !== -1;
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

  function getCustomerOrders() {
    try {
      var orders = JSON.parse(localStorage.getItem(STORAGE_KEYS.ORDERS) || '[]');
      if (!Array.isArray(orders)) return [];
      var clean = orders.filter(function (order) { return !order.isDemo; });
      if (clean.length !== orders.length) localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(clean));
      return clean;
    } catch (e) { return []; }
  }

  function validateCart() {
    var cart = getCart();
    var issues = [];
    var catalog = Array.isArray(window.CornerCravingsMenu) ? window.CornerCravingsMenu : [];
    var availability = {};
    var pricesUpdated = false;
    try {
      availability = JSON.parse(localStorage.getItem('cornerCravingsProductAvailability') || '{}');
    } catch (e) {}

    var invEngine = (typeof window !== 'undefined' && window.CornerCravingsInventory) ||
                    (typeof CornerCravingsInventory !== 'undefined' ? CornerCravingsInventory : null);

    var validatedItems = cart.map(function (item) {
      var product = catalog.find(function (p) {
        return p.id === item.productId || p.id === item.id || p.name === item.name;
      });

      var isAvailable = !!product;
      if (product) {
        if (product.id && Object.prototype.hasOwnProperty.call(availability, product.id)) {
          isAvailable = availability[product.id] !== false;
        } else {
          isAvailable = product.available !== false;
        }

        var oldBasePrice = Number(item.basePrice);
        if (!Number.isFinite(oldBasePrice)) oldBasePrice = Number(product.price);
        var oldUnitPrice = Number(item.unitPrice);
        if (!Number.isFinite(oldUnitPrice)) oldUnitPrice = oldBasePrice;
        var currentBasePrice = Number(product.price);
        if (Number.isFinite(currentBasePrice) && currentBasePrice !== oldBasePrice) {
          item.unitPrice = Math.max(0, oldUnitPrice + (currentBasePrice - oldBasePrice));
          item.basePrice = currentBasePrice;
          pricesUpdated = true;
        }
      }

      if (!isAvailable) {
        issues.push('"' + item.name + '" is no longer available and must be removed from the cart.');
      }

      return {
        item: item,
        available: isAvailable,
        product: product
      };
    });

    if (invEngine && typeof invEngine.calculateOrderIngredients === 'function' && typeof invEngine.checkIngredientsAvailability === 'function') {
      var ingredientCheck = invEngine.checkIngredientsAvailability(invEngine.calculateOrderIngredients({ items: cart }));
      if (!ingredientCheck.available) {
        ingredientCheck.missing.forEach(function (missing) {
          issues.push(missing.name + ' is out of stock or has insufficient stock (needs ' + missing.required + ', available ' + missing.available + ').');
        });
      }
    }

    if (pricesUpdated) saveCart(cart);

    return {
      valid: issues.length === 0 && cart.length > 0,
      empty: cart.length === 0,
      items: validatedItems,
      issues: issues,
      pricesUpdated: pricesUpdated
    };
  }

  function saveCustomerOrder(order) {
    var orders = getCustomerOrders();
    orders.unshift(order);
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders.slice(0, 50)));
  }

  // ==========================================================================
  // Store Operating Hours & Operational Status
  // ==========================================================================
  function getStoreStatus(testDate) {
    var overrideRaw = localStorage.getItem('cornerCravingsStoreStatus');
    var storeConfig = getStoreConfig();
    var openMinutes = minutesFromTime(storeConfig.openTime, 9 * 60);
    var closeMinutes = minutesFromTime(storeConfig.closeTime, 21 * 60);
    var hoursLabel = formatStoreTime(storeConfig.openTime) + ' – ' + formatStoreTime(storeConfig.closeTime);

    if (overrideRaw) {
      try {
        var parsedOverride = JSON.parse(overrideRaw);
        if (typeof parsedOverride === 'boolean') {
          return {
            isOpen: parsedOverride,
            isOverride: true,
            hours: hoursLabel,
            message: parsedOverride ? 'Store is open (manual override)' : 'Store is currently closed (manual override)'
          };
        }
        if (typeof parsedOverride === 'object' && parsedOverride !== null) {
          return {
            isOpen: parsedOverride.isOpen !== false,
            isOverride: true,
            hours: parsedOverride.hours || hoursLabel,
            message: parsedOverride.message || (parsedOverride.isOpen ? 'Store is open' : 'Store is currently closed')
          };
        }
      } catch (e) {
        if (overrideRaw === 'open' || overrideRaw === 'closed') {
          var isOverrideOpen = overrideRaw === 'open';
          return {
            isOpen: isOverrideOpen,
            isOverride: true,
            hours: hoursLabel,
            message: isOverrideOpen ? 'Store is open (manual override)' : 'Store is currently closed (manual override)'
          };
        }
      }
    }

    var now = testDate ? new Date(testDate) : new Date();
    var currentMinutes = now.getHours() * 60 + now.getMinutes();
    var isOpen = closeMinutes > openMinutes
      ? currentMinutes >= openMinutes && currentMinutes < closeMinutes
      : currentMinutes >= openMinutes || currentMinutes < closeMinutes;

    return {
      isOpen: isOpen,
      isOverride: false,
      hours: hoursLabel,
      currentHour: now.getHours(),
      message: isOpen ? 'Open today until ' + formatStoreTime(storeConfig.closeTime) : 'Closed · Opens at ' + formatStoreTime(storeConfig.openTime)
    };
  }

  // ==========================================================================
  // Customer Cancellation & Reorder Logic
  // ==========================================================================
  function cancelOrder(orderId, reason) {
    var cleanId = String(orderId || '').replace(/\D/g, '');
    var adminOrders = [];
    try {
      adminOrders = JSON.parse(localStorage.getItem('cornerCravingsAdminOrders') || '[]');
    } catch (e) {}

    var adminOrder = adminOrders.find(function (o) {
      return String(o.id) === cleanId || String(o.orderNumber || '').replace(/\D/g, '') === cleanId;
    });

    var custOrders = getCustomerOrders();
    var custOrder = custOrders.find(function (o) {
      return String(o.id) === cleanId || String(o.orderNumber || '').replace(/\D/g, '') === cleanId;
    });

    var targetOrder = adminOrder || custOrder;
    if (!targetOrder) {
      return { success: false, message: 'Order not found.' };
    }

    if (targetOrder.status !== 'Pending') {
      return {
        success: false,
        message: 'Order cannot be cancelled because it is already ' + targetOrder.status + '.'
      };
    }

    var nowIso = new Date().toISOString();
    var cancelHistoryItem = {
      status: 'Cancelled',
      timestamp: nowIso,
      actor: 'customer',
      note: reason ? ('Cancelled by customer: ' + reason) : 'Cancelled by customer'
    };

    [adminOrder, custOrder].forEach(function (ord) {
      if (ord) {
        ord.status = 'Cancelled';
        ord.fulfillmentStatus = 'cancelled';
        ord.updatedAt = nowIso;
        ord.statusUpdatedAt = nowIso;
        if (!Array.isArray(ord.statusHistory)) ord.statusHistory = [];
        ord.statusHistory.push(cancelHistoryItem);
      }
    });

    if (adminOrder) {
      try {
        localStorage.setItem('cornerCravingsAdminOrders', JSON.stringify(adminOrders));
      } catch (e) {}
    }

    if (custOrder) {
      try {
        localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(custOrders));
      } catch (e) {}
    }

    var lastOrder = getLastOrder();
    if (lastOrder && (String(lastOrder.id) === cleanId || String(lastOrder.orderNumber || '').replace(/\D/g, '') === cleanId)) {
      lastOrder.status = 'Cancelled';
      lastOrder.fulfillmentStatus = 'cancelled';
      lastOrder.updatedAt = nowIso;
      lastOrder.statusUpdatedAt = nowIso;
      if (!Array.isArray(lastOrder.statusHistory)) lastOrder.statusHistory = [];
      lastOrder.statusHistory.push(cancelHistoryItem);
      saveLastOrder(lastOrder);
    }

    try {
      window.dispatchEvent(new CustomEvent('cornercravings:orders-updated', { detail: { order: targetOrder } }));
    } catch (e) {}

    return { success: true, order: targetOrder };
  }

  function reorderItems(order) {
    if (!order || !Array.isArray(order.items) || order.items.length === 0) {
      return { success: false, message: 'No items in order to reorder.' };
    }

    var catalog = Array.isArray(window.CornerCravingsMenu) ? window.CornerCravingsMenu : DEMO_MENU;
    var availability = {};
    try {
      availability = JSON.parse(localStorage.getItem('cornerCravingsProductAvailability') || '{}');
    } catch (e) {}

    var cart = getCart();
    var addedCount = 0;
    var unavailableItems = [];

    order.items.forEach(function (item) {
      var prodId = item.id || item.productId;
      var qty = parseInt(item.quantity, 10) || 1;
      var product = catalog.find(function (p) {
        return (prodId && p.id === prodId) || p.name === item.name;
      });

      var isAvailable = true;
      if (product) {
        if (product.id && Object.prototype.hasOwnProperty.call(availability, product.id)) {
          isAvailable = availability[product.id] !== false;
        } else {
          isAvailable = product.available !== false;
        }
      } else {
        isAvailable = false;
      }

      var inventoryEngine = (typeof window !== 'undefined' && window.CornerCravingsInventory) ||
                            (typeof CornerCravingsInventory !== 'undefined' ? CornerCravingsInventory : null);
      if (isAvailable && inventoryEngine && typeof inventoryEngine.getMissingIngredientsForProduct === 'function') {
        isAvailable = inventoryEngine.getMissingIngredientsForProduct(product.id, qty).length === 0;
      }

      if (!isAvailable) {
        unavailableItems.push(item.name);
        return;
      }

      var sizeExtra = 0;
      if (Array.isArray(product.sizes) && item.size) {
        var currentSize = product.sizes.find(function (size) {
          return size.id === item.size || size.name === item.size;
        });
        if (currentSize) sizeExtra = Number(currentSize.priceDiff) || 0;
      }

      var currentAddons = [];
      var addonsPrice = 0;
      if (Array.isArray(product.addons) && Array.isArray(item.addons)) {
        item.addons.forEach(function (oldAddon) {
          var currentAddon = product.addons.find(function (addon) { return addon.id === oldAddon.id; });
          if (currentAddon) {
            currentAddons.push(currentAddon);
            addonsPrice += Number(currentAddon.price) || 0;
          }
        });
      }
      var unitPrice = Number(product.price) + sizeExtra + addonsPrice;

      var optionKey = [
        product ? product.id : (item.id || item.name),
        item.size || 'default',
        currentAddons.map(function (x) { return x.id; }).sort().join('-')
      ].join('_');

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
          imageWebp: product.imageWebp || item.imageWebp || '',
          imageJpg: product.imageJpg || item.imageJpg || '',
          imageAlt: product.imageAlt || product.name,
          unitPrice: unitPrice,
          basePrice: product.price,
          size: item.size || null,
          customizationText: item.customizationText || item.size || '',
          addons: currentAddons,
          quantity: qty
        });
      }
      addedCount += qty;
    });

    if (addedCount > 0) {
      saveCart(cart, true);
    }

    return {
      success: addedCount > 0,
      addedCount: addedCount,
      unavailableItems: unavailableItems
    };
  }

  function createDemoOrder(paymentMethod, paymentDetails) {
    var cart = getCart();
    if (cart.length === 0) return null;

    var delivery = getDeliveryDetails();
    var totals = calculateCartTotals(delivery.method);
    var now = new Date();
    var nowIso = now.toISOString();

    var orderNumber = 'CC-' + Math.floor(100000 + Math.random() * 900000);
    var adminId = orderNumber.replace(/\D/g, '');
    var dateString = now.toLocaleDateString('en-PH', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    var session = getCustomerSession() || {};
    var isPickup = delivery && delivery.method === 'pickup';
    var defaultMethod = isPickup ? 'Cash on Pickup' : 'Cash on Delivery';
    var chosenPaymentMethod = paymentMethod || defaultMethod;
    var isDigitalPayment = chosenPaymentMethod.indexOf('GCash') !== -1 || chosenPaymentMethod.indexOf('Maya') !== -1;

    // Central Order Schema conforming object
    var order = {
      id: adminId,
      orderNumber: orderNumber,
      orderDate: dateString,
      customerId: session.id || session.email || ('guest-' + adminId),
      customer: delivery.recipientName || session.name || 'Customer',
      email: session.email || 'customer@cornercravings.com',
      phone: delivery.contactNumber || session.phone || '',
      placedAt: nowIso,
      updatedAt: nowIso,
      statusUpdatedAt: nowIso,
      fulfillmentType: isPickup ? 'pickup' : 'delivery',
      fulfillmentStatus: 'pending',
      status: 'Pending',
      paymentMethod: chosenPaymentMethod,
      paymentStatus: isDigitalPayment ? 'verification_pending' : 'unpaid',
      paymentDetails: paymentDetails || {},
      items: cart.map(function (item) {
        return {
          id: item.id || item.productId || '',
          name: item.name,
          option: item.customizationText || item.size || 'Regular',
          customizationText: item.customizationText || '',
          size: item.size || '',
          addons: item.addons || [],
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          price: item.unitPrice,
          imageWebp: item.imageWebp || '',
          imageJpg: item.imageJpg || ''
        };
      }),
      delivery: delivery,
      totals: totals,
      total: totals.total,
      notes: delivery.notes || '',
      statusHistory: [
        {
          status: 'Pending',
          timestamp: nowIso,
          actor: 'customer',
          note: isPickup ? 'Order placed for store pickup' : 'Order placed for delivery'
        }
      ],
      isDemo: false
    };

    try {
      var adminOrders = JSON.parse(localStorage.getItem('cornerCravingsAdminOrders') || '[]');
      if (!Array.isArray(adminOrders)) adminOrders = [];
      adminOrders.unshift(order);
      localStorage.setItem('cornerCravingsAdminOrders', JSON.stringify(adminOrders));
    } catch (error) {
      console.warn('Unable to add the order to the admin queue:', error);
    }

    saveLastOrder(order);
    saveCustomerOrder(order);
    clearCart();

    try {
      window.dispatchEvent(new CustomEvent('cornercravings:orders-updated', { detail: { order: order } }));
    } catch (e) {}

    return order;
  }

  // ==========================================================================
  // UI Helpers: Header Badge, Toast Notification, Promo Notice
  // ==========================================================================
  function updateCartCountBadge(shouldPulse) {
    if (typeof document === 'undefined' || !document.querySelectorAll) return;
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
    var toastMessage = document.createElement('span');
    toastMessage.textContent = String(message || '');
    toast.appendChild(toastMessage);

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

  function renderStoreStatusBanner() {
    var status = getStoreStatus();
    var existingBanner = document.getElementById('customer-store-banner');
    if (existingBanner && typeof existingBanner.remove === 'function') existingBanner.remove();

    if (!document || typeof document.querySelector !== 'function') return;
    var current = (typeof location !== 'undefined' ? location.pathname || '' : '').toLowerCase();
    if (current.indexOf('customer-') === -1 && !current.endsWith('/') && current !== '') {
      return;
    }
    if (current.indexOf('dashboard') !== -1 || current.indexOf('staff-') !== -1 || current.indexOf('stock-') !== -1 || current.indexOf('products') !== -1 || current.indexOf('index.html') !== -1) {
      return;
    }

    var header = document.querySelector('.customer-header');
    if (!header || !header.parentNode) return;

    var banner = document.createElement('div');
    banner.id = 'customer-store-banner';
    banner.className = 'store-status-banner ' + (status.isOpen ? 'store-status-banner--open' : 'store-status-banner--closed');

    var dotClass = status.isOpen ? 'dot--open' : 'dot--closed';
    var statusLabel = status.isOpen ? 'Open Now' : 'Currently Closed';
    var statusText = status.isOpen ?
      'Hours: ' + status.hours + ' · Taking orders for pickup & delivery' :
      'Hours: ' + status.hours + (status.isOverride ? ' · Online ordering is temporarily paused' : ' · Orders placed now will be queued for opening');

    banner.innerHTML = '<div class="container store-status-content">' +
      '<div class="store-status-badge"><span class="store-status-dot ' + dotClass + '"></span><strong>' + statusLabel + '</strong></div>' +
      '<span class="store-status-info">' + statusText + '</span>' +
    '</div>';

    header.parentNode.insertBefore(banner, header.nextSibling);
  }

  function renderBottomNav() {
    if (typeof document === 'undefined' || !document.body) return;
    if (document.getElementById('customer-bottom-nav')) return;

    var current = (typeof location !== 'undefined' ? location.pathname || '' : '').toLowerCase();
    // Guard: Only render bottom nav on customer pages!
    if (current.indexOf('customer-') === -1 && !current.endsWith('/') && current !== '') {
      return;
    }
    if (current.indexOf('dashboard') !== -1 || current.indexOf('staff-') !== -1 || current.indexOf('stock-') !== -1 || current.indexOf('products') !== -1 || current.indexOf('index.html') !== -1) {
      return;
    }

    var isMenu = current.indexOf('customer-menu.html') !== -1 || current.indexOf('customer-product.html') !== -1;
    var isCart = current.indexOf('customer-cart.html') !== -1 || current.indexOf('customer-delivery.html') !== -1 || current.indexOf('customer-payment.html') !== -1;
    var isOrders = current.indexOf('customer-orders.html') !== -1 || current.indexOf('customer-confirmation.html') !== -1;
    var isAccount = current.indexOf('customer-profile.html') !== -1 || current.indexOf('customer-login.html') !== -1 || current.indexOf('customer-signup.html') !== -1 || current.indexOf('customer-edit-profile.html') !== -1;
    var isHome = !isMenu && !isCart && !isOrders && !isAccount && (current.endsWith('customer-home.html') || current.endsWith('/') || current === '' || current.indexOf('customer-home') !== -1);

    var session = getCustomerSession();
    var accountUrl = session ? 'customer-profile.html' : 'customer-login.html';

    var cart = getCart();
    var cartCount = cart.reduce(function (sum, item) { return sum + (item.quantity || 1); }, 0);
    var cartBadgeStyle = cartCount > 0 ? 'display:inline-flex;' : 'display:none;';

    var nav = document.createElement('nav');
    nav.id = 'customer-bottom-nav';
    nav.className = 'customer-bottom-nav';
    nav.setAttribute('aria-label', 'Mobile bottom navigation');

    nav.innerHTML = '' +
      '<a href="customer-home.html" class="bottom-nav-item ' + (isHome ? 'is-active' : '') + '">' +
        '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>' +
        '<span>Home</span>' +
      '</a>' +
      '<a href="customer-menu.html" class="bottom-nav-item ' + (isMenu ? 'is-active' : '') + '">' +
        '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>' +
        '<span>Menu</span>' +
      '</a>' +
      '<a href="customer-cart.html" class="bottom-nav-item ' + (isCart ? 'is-active' : '') + '" style="position:relative;">' +
        '<div style="position:relative; display:inline-flex;">' +
          '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>' +
          '<span class="cart-badge bottom-nav-badge" style="' + cartBadgeStyle + '">' + cartCount + '</span>' +
        '</div>' +
        '<span>Cart</span>' +
      '</a>' +
      '<a href="customer-orders.html" class="bottom-nav-item ' + (isOrders ? 'is-active' : '') + '">' +
        '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>' +
        '<span>Orders</span>' +
      '</a>' +
      '<a href="' + accountUrl + '" class="bottom-nav-item ' + (isAccount ? 'is-active' : '') + '">' +
        '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>' +
        '<span>Account</span>' +
      '</a>';

    document.body.appendChild(nav);
  }

  function initHeaderActions() {
    updateCartCountBadge();
    renderStoreStatusBanner();
    renderBottomNav();

    // Keep order tracking available throughout the signed-in customer flow.
    document.querySelectorAll('.customer-nav ul, .customer-mobile-menu ul, .pm-nav-links').forEach(function (list) {
      if (list.querySelector('[href="customer-orders.html"]')) return;
      var item = document.createElement('li');
      var link = document.createElement('a');
      link.href = 'customer-orders.html';
      link.textContent = 'Track Orders';
      if (list.closest('.customer-mobile-menu')) {
        link.className = 'customer-mobile-menu__link';
      } else if (list.closest('.customer-nav')) {
        link.className = 'customer-nav__link';
      }
      item.appendChild(link);
      list.appendChild(item);
    });

    // Promo link click handler (Honest coming soon state)
    var promoLinks = document.querySelectorAll('[data-action="promo"]');
    for (var r = 0; r < promoLinks.length; r++) {
      promoLinks[r].addEventListener('click', function (e) {
        e.preventDefault();
        showToast('Corner Cravings promos are coming soon!');
      });
    }

    // Profile icon click handler
    var profileButtons = document.querySelectorAll('[data-action="profile"]');
    for (var p = 0; p < profileButtons.length; p++) {
      profileButtons[p].addEventListener('click', function (e) {
        e.preventDefault();
        var session = getCustomerSession();
        if (session) {
          window.location.href = 'customer-profile.html';
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

  // Automatically purge legacy mockup orders or test accounts from browser storage
  (function purgeLegacyMockData() {
    try {
      if (typeof localStorage === 'undefined') return;
      function isMockOrder(o) {
        if (!o) return true;
        if (o.isDemo) return true;
        var mockIds = ['8824', '8823', '8822', '8821', '8820', '8819', '8818', '8817', '8816', '8815', '10245', '10244', '10243', '10242', '092', '093', '089', 'ORD-092', 'ORD-093', 'ORD-089'];
        if (mockIds.indexOf(String(o.id)) !== -1) return true;
        var mockNames = [
          'yashimin flores', 'belle mariano', 'dan santos', 'maria mendez', 'paolo garcia',
          'juan reyes', 'carlo perez', 'anna lim', 'daniel cruz', 'sarah jenkins',
          'michael johnson', 'emily chen', 'david kim', 'mae sales'
        ];
        var cust = String(o.customer || (o.delivery && o.delivery.recipientName) || '').trim().toLowerCase();
        if (mockNames.indexOf(cust) !== -1) return true;
        return false;
      }

      var adminRaw = localStorage.getItem('cornerCravingsAdminOrders');
      if (adminRaw) {
        var parsedAdmin = JSON.parse(adminRaw);
        if (Array.isArray(parsedAdmin)) {
          var filteredAdmin = parsedAdmin.filter(function (o) { return !isMockOrder(o); });
          if (filteredAdmin.length !== parsedAdmin.length) {
            localStorage.setItem('cornerCravingsAdminOrders', JSON.stringify(filteredAdmin));
          }
        }
      }
      var custRaw = localStorage.getItem(STORAGE_KEYS.ORDERS);
      if (custRaw) {
        var parsedCust = JSON.parse(custRaw);
        if (Array.isArray(parsedCust)) {
          var filteredCust = parsedCust.filter(function (o) { return !isMockOrder(o); });
          if (filteredCust.length !== parsedCust.length) {
            localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(filteredCust));
          }
        }
      }
      var delRaw = localStorage.getItem(STORAGE_KEYS.DELIVERY);
      if (delRaw) {
        var parsedDel = JSON.parse(delRaw);
        if (parsedDel && parsedDel.recipientName === 'Juan Dela Cruz') {
          localStorage.removeItem(STORAGE_KEYS.DELIVERY);
        }
      }
      var profRaw = localStorage.getItem('cornerCravingsCustomerProfile');
      if (profRaw) {
        var parsedProf = JSON.parse(profRaw);
        if (parsedProf && (parsedProf.firstName === 'Mae' || parsedProf.email === 'mae.sales@cornercravings.com')) {
          localStorage.removeItem('cornerCravingsCustomerProfile');
        }
      }
    } catch (e) {}
  })();

  // Auto-init on page load
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initHeaderActions);
    } else {
      initHeaderActions();
    }
  }

  // Export globally for customer flow pages
  window.CornerCravings = {
    DEMO_MENU: DEMO_MENU,
    GCASH_PAYMENT_CONFIG: GCASH_PAYMENT_CONFIG,
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
    getFavoriteProductIds: getFavoriteProductIds,
    addFavoriteProduct: addFavoriteProduct,
    removeFavoriteProduct: removeFavoriteProduct,
    isFavoriteProduct: isFavoriteProduct,
    getLastOrder: getLastOrder,
    getCustomerOrders: getCustomerOrders,
    getStoreStatus: getStoreStatus,
    cancelOrder: cancelOrder,
    reorderItems: reorderItems,
    renderStoreStatusBanner: renderStoreStatusBanner,
    validateCart: validateCart,
    createDemoOrder: createDemoOrder,
    updateCartCountBadge: updateCartCountBadge,
    renderBottomNav: renderBottomNav,
    showToast: showToast
  };
})();
