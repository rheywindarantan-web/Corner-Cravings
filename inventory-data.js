/**
 * Corner Cravings - Central Restaurant Inventory & Recipe Engine
 * Connects digital customer orders to restaurant kitchen ingredient stock.
 */
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.CornerCravingsInventory = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var STORAGE_KEY = 'cornerCravingsInventory';
  var RECIPE_STORAGE_KEY = 'cornerCravingsProductRecipes';

  // Canonical restaurant ingredients catalog
  var DEFAULT_ITEMS = [
    // Base Staples
    { id: 1, sku: 'ING-GAR-RICE', name: 'Garlic Fried Rice (Sinangag)', category: 'Staples & Bases', unit: 'kg', stock: 45, reorderLevel: 10, unitCost: 65.00, supplier: 'Golden Grains Rice Trading' },
    { id: 2, sku: 'ING-EGG', name: 'Fresh Chicken Eggs', category: 'Dairy & Eggs', unit: 'pcs', stock: 180, reorderLevel: 30, unitCost: 8.50, supplier: 'Bounty Fresh Farms' },
    { id: 3, sku: 'ING-OIL', name: 'Cooking Vegetable Oil', category: 'Staples & Bases', unit: 'L', stock: 25, reorderLevel: 5, unitCost: 85.00, supplier: 'Spring Cooking Oils' },
    { id: 4, sku: 'ING-GAR-BITS', name: 'Golden Garlic Bits', category: 'Condiments', unit: 'kg', stock: 8, reorderLevel: 2, unitCost: 180.00, supplier: 'Pasong Putik Spice Mart' },

    // Silog Meats & Proteins
    { id: 5, sku: 'ING-BEEF-TAPA', name: 'Marinated Beef Tapa', category: 'Meats & Proteins', unit: 'kg', stock: 15, reorderLevel: 4, unitCost: 380.00, supplier: 'San Miguel PureFoods' },
    { id: 6, sku: 'ING-HOTDOG', name: 'Filipino Red Hotdogs', category: 'Meats & Proteins', unit: 'pcs', stock: 80, reorderLevel: 20, unitCost: 12.00, supplier: 'CDO Foodsphere' },
    { id: 7, sku: 'ING-LONGGANISA', name: 'Pork Longganisa', category: 'Meats & Proteins', unit: 'pcs', stock: 60, reorderLevel: 15, unitCost: 14.00, supplier: 'Pampanga Best Foods' },
    { id: 8, sku: 'ING-MACAO-SAUSAGE', name: 'Sweet Macao Sausage', category: 'Meats & Proteins', unit: 'pcs', stock: 40, reorderLevel: 10, unitCost: 16.00, supplier: 'Pasong Putik Meat Trading' },
    { id: 9, sku: 'ING-BOLOGNA', name: 'Round Bologna Slices', category: 'Meats & Proteins', unit: 'pcs', stock: 50, reorderLevel: 15, unitCost: 10.00, supplier: 'CDO Foodsphere' },
    { id: 10, sku: 'ING-SIOMAI', name: 'Pork Siomai Dumplings', category: 'Meats & Proteins', unit: 'pcs', stock: 120, reorderLevel: 30, unitCost: 6.50, supplier: 'Golden Dragon Dimsum' },
    { id: 11, sku: 'ING-HUNGARIAN', name: 'Smoky Hungarian Sausage', category: 'Meats & Proteins', unit: 'pcs', stock: 35, reorderLevel: 10, unitCost: 38.00, supplier: 'San Miguel PureFoods' },
    { id: 12, sku: 'ING-BANGUS', name: 'Boneless Daing na Bangus', category: 'Meats & Proteins', unit: 'pcs', stock: 25, reorderLevel: 8, unitCost: 110.00, supplier: 'Dagupan Fresh Fish Port' },
    { id: 13, sku: 'ING-PORKCHOP', name: 'Marinated Pork Chop', category: 'Meats & Proteins', unit: 'pcs', stock: 30, reorderLevel: 8, unitCost: 65.00, supplier: 'San Miguel PureFoods' },
    { id: 14, sku: 'ING-SHANGHAI', name: 'Lumpiang Shanghai Rolls', category: 'Meats & Proteins', unit: 'pcs', stock: 100, reorderLevel: 25, unitCost: 7.00, supplier: 'Golden Dragon Dimsum' },
    { id: 15, sku: 'ING-CHICKEN', name: 'Chicken Leg Quarters', category: 'Meats & Proteins', unit: 'pcs', stock: 28, reorderLevel: 8, unitCost: 55.00, supplier: 'Magnolia Poultry' },
    { id: 16, sku: 'ING-SPAM', name: 'SPAM Luncheon Meat', category: 'Meats & Proteins', unit: 'cans', stock: 20, reorderLevel: 5, unitCost: 145.00, supplier: 'Hormel Foods Corp.' },

    // Pastas & Noodles
    { id: 17, sku: 'ING-NOODLE-CANTON', name: 'Pancit Canton Noodles', category: 'Pastas & Noodles', unit: 'packs', stock: 35, reorderLevel: 10, unitCost: 32.00, supplier: 'Liwayway Noodles Supply' },
    { id: 18, sku: 'ING-NOODLE-BIHON', name: 'Pancit Bihon Noodles', category: 'Pastas & Noodles', unit: 'packs', stock: 35, reorderLevel: 10, unitCost: 30.00, supplier: 'Liwayway Noodles Supply' },
    { id: 19, sku: 'ING-NOODLE-PALABOK', name: 'Palabok Rice Noodles', category: 'Pastas & Noodles', unit: 'packs', stock: 30, reorderLevel: 8, unitCost: 35.00, supplier: 'Liwayway Noodles Supply' },
    { id: 20, sku: 'ING-PASTA-SPAG', name: 'Spaghetti Pasta', category: 'Pastas & Noodles', unit: 'kg', stock: 25, reorderLevel: 6, unitCost: 85.00, supplier: 'Universal Robina Corp' },
    { id: 21, sku: 'ING-SAUCE-SPAG', name: 'Sweet Spaghetti Meat Sauce', category: 'Sauces & Condiments', unit: 'kg', stock: 20, reorderLevel: 5, unitCost: 120.00, supplier: 'Universal Robina Corp' },
    { id: 22, sku: 'ING-SAUCE-PALABOK', name: 'Palabok Shrimp Sauce', category: 'Sauces & Condiments', unit: 'kg', stock: 18, reorderLevel: 5, unitCost: 130.00, supplier: 'Mama Sita Food Dist.' },
    { id: 23, sku: 'ING-CHICHARON', name: 'Crushed Chicharon', category: 'Condiments', unit: 'kg', stock: 10, reorderLevel: 3, unitCost: 220.00, supplier: 'R. Lapid Chicharon' },
    { id: 24, sku: 'ING-CALAMANSI', name: 'Fresh Calamansi', category: 'Produce', unit: 'pcs', stock: 150, reorderLevel: 40, unitCost: 1.20, supplier: 'Dizon Farms Produce' },
    { id: 25, sku: 'ING-CHEESE', name: 'Grated Cheddar Cheese', category: 'Dairy & Eggs', unit: 'kg', stock: 12, reorderLevel: 3, unitCost: 280.00, supplier: 'Magnolia Dairy' },

    // Burgers & Buns
    { id: 26, sku: 'ING-BURGER-BUN', name: 'Sesame Burger Buns', category: 'Bakery', unit: 'pcs', stock: 50, reorderLevel: 15, unitCost: 9.50, supplier: 'Gardenia Bakeries' },
    { id: 27, sku: 'ING-BURGER-PATTY', name: 'Savory Burger Patties', category: 'Meats & Proteins', unit: 'pcs', stock: 45, reorderLevel: 15, unitCost: 24.00, supplier: 'CDO Foodsphere' },
    { id: 28, sku: 'ING-FRIES', name: 'Straight-Cut French Fries', category: 'Frozen Goods', unit: 'kg', stock: 20, reorderLevel: 5, unitCost: 115.00, supplier: 'McCain Foodservice' },
    { id: 29, sku: 'ING-PINEAPPLE', name: 'Pineapple Rings', category: 'Canned Goods', unit: 'cans', stock: 15, reorderLevel: 4, unitCost: 65.00, supplier: 'Del Monte Philippines' },
    { id: 30, sku: 'ING-BURGER-SAUCE', name: 'House Burger Sauce', category: 'Sauces & Condiments', unit: 'L', stock: 10, reorderLevel: 3, unitCost: 95.00, supplier: 'Corner Cravings Commissary' },

    // Shakes, Sodas & Desserts
    { id: 31, sku: 'ING-GRAHAM-CRUMBS', name: 'Crushed Graham Crumbs', category: 'Dry Goods', unit: 'kg', stock: 18, reorderLevel: 5, unitCost: 110.00, supplier: 'Monde Nissin Corp' },
    { id: 32, sku: 'ING-GRAHAM-BAR', name: 'Graham Dessert Bars', category: 'Bakery', unit: 'pcs', stock: 40, reorderLevel: 10, unitCost: 18.00, supplier: 'Corner Cravings Bakery' },
    { id: 33, sku: 'ING-MANGO-PUREE', name: 'Sweet Mango Puree', category: 'Produce & Purees', unit: 'L', stock: 22, reorderLevel: 6, unitCost: 160.00, supplier: 'Guimaras Best Purees' },
    { id: 34, sku: 'ING-AVOCADO-PUREE', name: 'Creamy Avocado Puree', category: 'Produce & Purees', unit: 'L', stock: 18, reorderLevel: 5, unitCost: 175.00, supplier: 'Davao Highland Purees' },
    { id: 35, sku: 'ING-SODA-SYRUP', name: 'Fruity Soda Flavored Syrup', category: 'Beverage Syrups', unit: 'L', stock: 15, reorderLevel: 4, unitCost: 135.00, supplier: 'Universal Starch & Syrup' },
    { id: 36, sku: 'ING-COND-MILK', name: 'Sweetened Condensed Milk', category: 'Dairy & Eggs', unit: 'L', stock: 25, reorderLevel: 6, unitCost: 85.00, supplier: 'Alaska Milk Corp' },

    // Coffee & Packaging
    { id: 37, sku: 'ING-COFFEE-BEANS', name: 'Dark Roast Espresso Beans', category: 'Beverage Goods', unit: 'kg', stock: 16, reorderLevel: 4, unitCost: 520.00, supplier: 'Benguet Highlands Coffee' },
    { id: 38, sku: 'ING-FRESH-MILK', name: 'Fresh Whole Milk', category: 'Dairy & Eggs', unit: 'L', stock: 36, reorderLevel: 10, unitCost: 95.00, supplier: 'Magnolia Dairy' },
    { id: 39, sku: 'ING-SYRUP-CARAMEL', name: 'Caramel Syrup', category: 'Beverage Syrups', unit: 'L', stock: 8, reorderLevel: 2, unitCost: 260.00, supplier: 'Monin Philippines' },
    { id: 40, sku: 'ING-SYRUP-MOCHA', name: 'Chocolate Mocha Syrup', category: 'Beverage Syrups', unit: 'L', stock: 8, reorderLevel: 2, unitCost: 270.00, supplier: 'Hershey Foodservice' },
    { id: 41, sku: 'ING-SYRUP-SALTED', name: 'Salted Caramel Syrup', category: 'Beverage Syrups', unit: 'L', stock: 8, reorderLevel: 2, unitCost: 280.00, supplier: 'Monin Philippines' },
    { id: 42, sku: 'ING-CUP-16OZ', name: 'Clear Plastic Cups 16oz', category: 'Packaging', unit: 'pcs', stock: 250, reorderLevel: 50, unitCost: 2.80, supplier: 'Universal Robina Packaging' },
    { id: 43, sku: 'ING-CUP-LID', name: 'Cup Lids (Flat & Dome)', category: 'Packaging', unit: 'pcs', stock: 250, reorderLevel: 50, unitCost: 1.20, supplier: 'EcoPack Container Solutions' },
    { id: 44, sku: 'ING-CUP-12OZ', name: 'Clear Plastic Cups 12oz', category: 'Packaging', unit: 'pcs', stock: 150, reorderLevel: 30, unitCost: 2.20, supplier: 'Universal Robina Packaging' },

    // Shared Beverage Bases
    { id: 45, sku: 'ING-ICE', name: 'Food-Grade Ice', category: 'Beverage Goods', unit: 'kg', stock: 40, reorderLevel: 10, unitCost: 12.00, supplier: 'Crystal Clear Tube Ice' },
    { id: 46, sku: 'ING-FILTERED-WATER', name: 'Filtered Water', category: 'Beverage Goods', unit: 'L', stock: 80, reorderLevel: 20, unitCost: 2.50, supplier: 'Corner Cravings Filtration' },
    { id: 47, sku: 'ING-SPARKLING-WATER', name: 'Sparkling Water', category: 'Beverage Goods', unit: 'L', stock: 30, reorderLevel: 8, unitCost: 35.00, supplier: 'Summit Beverages' },
    { id: 48, sku: 'ING-BLACK-TEA', name: 'Brewed Black Tea Base', category: 'Beverage Goods', unit: 'L', stock: 25, reorderLevel: 6, unitCost: 25.00, supplier: 'Formosa Tea Supply' },
    { id: 49, sku: 'ING-CREAMER', name: 'Non-Dairy Milk Tea Creamer', category: 'Dairy & Eggs', unit: 'kg', stock: 12, reorderLevel: 3, unitCost: 145.00, supplier: 'Super Creamer Ind.' },
    { id: 50, sku: 'ING-SIMPLE-SYRUP', name: 'Simple Sugar Syrup', category: 'Beverage Syrups', unit: 'L', stock: 15, reorderLevel: 4, unitCost: 40.00, supplier: 'Corner Cravings Commissary' },

    // Milk Tea, Matcha & Frappe Bases
    { id: 51, sku: 'ING-TARO-POWDER', name: 'Taro Milk Tea Powder', category: 'Beverage Powders', unit: 'kg', stock: 8, reorderLevel: 2, unitCost: 290.00, supplier: 'Formosa Tea Supply' },
    { id: 52, sku: 'ING-OKINAWA-SYRUP', name: 'Okinawa Brown Sugar Syrup', category: 'Beverage Syrups', unit: 'L', stock: 8, reorderLevel: 2, unitCost: 240.00, supplier: 'Formosa Tea Supply' },
    { id: 53, sku: 'ING-WINTERMELON-SYRUP', name: 'Wintermelon Syrup', category: 'Beverage Syrups', unit: 'L', stock: 8, reorderLevel: 2, unitCost: 230.00, supplier: 'Formosa Tea Supply' },
    { id: 54, sku: 'ING-COOKIES-CREAM', name: 'Cookies and Cream Powder', category: 'Beverage Powders', unit: 'kg', stock: 8, reorderLevel: 2, unitCost: 280.00, supplier: 'Formosa Tea Supply' },
    { id: 55, sku: 'ING-CHOCOLATE-SYRUP', name: 'Chocolate Syrup', category: 'Beverage Syrups', unit: 'L', stock: 10, reorderLevel: 3, unitCost: 210.00, supplier: 'Hershey Foodservice' },
    { id: 56, sku: 'ING-MATCHA', name: 'Matcha Powder', category: 'Beverage Powders', unit: 'kg', stock: 5, reorderLevel: 1, unitCost: 680.00, supplier: 'Kyoto Tea Imports' },
    { id: 57, sku: 'ING-UBE-PUREE', name: 'Ube Flavor Puree', category: 'Produce & Purees', unit: 'L', stock: 8, reorderLevel: 2, unitCost: 195.00, supplier: 'Pampanga Ube Cooperative' },
    { id: 58, sku: 'ING-WHIPPING-CREAM', name: 'Whipping Cream', category: 'Dairy & Eggs', unit: 'L', stock: 8, reorderLevel: 2, unitCost: 210.00, supplier: 'Anchor Food Professionals' },
    { id: 59, sku: 'ING-OREO-CRUMBS', name: 'Crushed Oreo Cookies', category: 'Dry Goods', unit: 'kg', stock: 8, reorderLevel: 2, unitCost: 260.00, supplier: 'Mondelez Philippines' },

    // Fruit Flavors & Cultured Drink
    { id: 60, sku: 'ING-YAKULT', name: 'Yakult Probiotic Drink', category: 'Beverage Goods', unit: 'bottles', stock: 80, reorderLevel: 20, unitCost: 11.00, supplier: 'Yakult Philippines Inc.' },
    { id: 61, sku: 'ING-SYRUP-STRAWBERRY', name: 'Strawberry Fruit Syrup', category: 'Beverage Syrups', unit: 'L', stock: 10, reorderLevel: 3, unitCost: 220.00, supplier: 'Monin Philippines' },
    { id: 62, sku: 'ING-SYRUP-GREEN-APPLE', name: 'Green Apple Fruit Syrup', category: 'Beverage Syrups', unit: 'L', stock: 10, reorderLevel: 3, unitCost: 220.00, supplier: 'Monin Philippines' },
    { id: 63, sku: 'ING-SYRUP-MANGO', name: 'Mango Fruit Syrup', category: 'Beverage Syrups', unit: 'L', stock: 10, reorderLevel: 3, unitCost: 210.00, supplier: 'Monin Philippines' },
    { id: 64, sku: 'ING-SYRUP-BLUEBERRY', name: 'Blueberry Fruit Syrup', category: 'Beverage Syrups', unit: 'L', stock: 10, reorderLevel: 3, unitCost: 240.00, supplier: 'Monin Philippines' },
    { id: 65, sku: 'ING-SYRUP-LYCHEE', name: 'Lychee Fruit Syrup', category: 'Beverage Syrups', unit: 'L', stock: 10, reorderLevel: 3, unitCost: 230.00, supplier: 'Monin Philippines' },
    { id: 66, sku: 'ING-SYRUP-MIXED-BERRIES', name: 'Mixed Berries Fruit Syrup', category: 'Beverage Syrups', unit: 'L', stock: 8, reorderLevel: 2, unitCost: 245.00, supplier: 'Monin Philippines' },

    // Menu Garnishes, Fillings & Add-ons
    { id: 67, sku: 'ING-SHRIMP', name: 'Cooked Shrimp', category: 'Meats & Proteins', unit: 'kg', stock: 8, reorderLevel: 2, unitCost: 420.00, supplier: 'Pasong Putik Seafood Hub' },
    { id: 68, sku: 'ING-SPRING-ONION', name: 'Fresh Spring Onion', category: 'Produce', unit: 'kg', stock: 5, reorderLevel: 1, unitCost: 90.00, supplier: 'Dizon Farms Produce' },
    { id: 69, sku: 'ING-PANCIT-VEG', name: 'Pancit Vegetable Mix', category: 'Produce', unit: 'kg', stock: 12, reorderLevel: 3, unitCost: 75.00, supplier: 'Dizon Farms Produce' },
    { id: 70, sku: 'ING-PANCIT-MEAT', name: 'Sliced Chicken or Pork for Pancit', category: 'Meats & Proteins', unit: 'kg', stock: 10, reorderLevel: 3, unitCost: 260.00, supplier: 'San Miguel PureFoods' },
    { id: 71, sku: 'ING-PANCIT-SAUCE', name: 'Savory Pancit Stir-Fry Sauce', category: 'Sauces & Condiments', unit: 'L', stock: 10, reorderLevel: 3, unitCost: 95.00, supplier: 'Corner Cravings Commissary' },
    { id: 72, sku: 'ING-CABBAGE', name: 'Shredded Cabbage', category: 'Produce', unit: 'kg', stock: 8, reorderLevel: 2, unitCost: 55.00, supplier: 'Dizon Farms Produce' },
    { id: 73, sku: 'ING-COFFEE-JELLY', name: 'Coffee Jelly Cubes', category: 'Dessert Toppings', unit: 'kg', stock: 6, reorderLevel: 2, unitCost: 140.00, supplier: 'Corner Cravings Commissary' },
    { id: 74, sku: 'ING-SYRUP-VANILLA', name: 'Vanilla Syrup', category: 'Beverage Syrups', unit: 'L', stock: 7, reorderLevel: 2, unitCost: 240.00, supplier: 'Monin Philippines' },
    { id: 75, sku: 'ING-SYRUP-HAZELNUT', name: 'Hazelnut Syrup', category: 'Beverage Syrups', unit: 'L', stock: 7, reorderLevel: 2, unitCost: 250.00, supplier: 'Monin Philippines' },
    { id: 76, sku: 'ING-SEA-SALT-FOAM', name: 'Sea Salt Cold Foam', category: 'Dairy & Eggs', unit: 'L', stock: 6, reorderLevel: 2, unitCost: 180.00, supplier: 'Corner Cravings Commissary' },
    { id: 77, sku: 'ING-TAPIOCA-PEARLS', name: 'Cooked Tapioca Pearls', category: 'Dessert Toppings', unit: 'kg', stock: 10, reorderLevel: 3, unitCost: 120.00, supplier: 'Formosa Tea Supply' },
    { id: 78, sku: 'ING-EGG-PUDDING', name: 'Egg Pudding', category: 'Dessert Toppings', unit: 'kg', stock: 6, reorderLevel: 2, unitCost: 160.00, supplier: 'Corner Cravings Commissary' },
    { id: 79, sku: 'ING-CREAM-CHEESE-FOAM', name: 'Cream Cheese Foam', category: 'Dairy & Eggs', unit: 'L', stock: 6, reorderLevel: 2, unitCost: 195.00, supplier: 'Corner Cravings Commissary' },
    { id: 80, sku: 'ING-GRASS-JELLY', name: 'Grass Jelly', category: 'Dessert Toppings', unit: 'kg', stock: 6, reorderLevel: 2, unitCost: 130.00, supplier: 'Formosa Tea Supply' },
    { id: 81, sku: 'ING-NATA', name: 'Nata de Coco', category: 'Dessert Toppings', unit: 'kg', stock: 8, reorderLevel: 2, unitCost: 95.00, supplier: 'Pasong Putik Dessert Mart' },
    { id: 82, sku: 'ING-POPPING-BOBA', name: 'Popping Boba', category: 'Dessert Toppings', unit: 'kg', stock: 8, reorderLevel: 2, unitCost: 280.00, supplier: 'Formosa Tea Supply' },
    { id: 83, sku: 'ING-RAINBOW-JELLY', name: 'Rainbow Fruit Jelly', category: 'Dessert Toppings', unit: 'kg', stock: 6, reorderLevel: 2, unitCost: 145.00, supplier: 'Formosa Tea Supply' },
    { id: 84, sku: 'ING-CHIA-SEEDS', name: 'Chia Seeds', category: 'Dry Goods', unit: 'kg', stock: 4, reorderLevel: 1, unitCost: 320.00, supplier: 'Healthy Options Wholesale' },
    { id: 85, sku: 'ING-RED-BEAN', name: 'Sweet Red Bean', category: 'Dessert Toppings', unit: 'kg', stock: 6, reorderLevel: 2, unitCost: 150.00, supplier: 'Formosa Tea Supply' },
    { id: 86, sku: 'ING-BACON', name: 'Crispy Bacon Strips', category: 'Meats & Proteins', unit: 'pcs', stock: 50, reorderLevel: 15, unitCost: 16.00, supplier: 'San Miguel PureFoods' },
    { id: 87, sku: 'ING-JALAPENO', name: 'Pickled Jalapeno Slices', category: 'Condiments', unit: 'kg', stock: 4, reorderLevel: 1, unitCost: 220.00, supplier: 'Pasong Putik Spice Mart' },
    { id: 88, sku: 'ING-GARLIC-MAYO', name: 'Creamy Garlic Mayo', category: 'Sauces & Condiments', unit: 'L', stock: 6, reorderLevel: 2, unitCost: 120.00, supplier: 'Corner Cravings Commissary' },
    { id: 89, sku: 'ING-CHEESE-DIP', name: 'Warm Cheese Dip', category: 'Sauces & Condiments', unit: 'L', stock: 6, reorderLevel: 2, unitCost: 140.00, supplier: 'Corner Cravings Commissary' },
    { id: 90, sku: 'ING-CHILI-GARLIC', name: 'House Chili Garlic Oil', category: 'Condiments', unit: 'L', stock: 6, reorderLevel: 2, unitCost: 160.00, supplier: 'Corner Cravings Commissary' },
    { id: 91, sku: 'ING-ATCHARA', name: 'Atchara Pickled Papaya', category: 'Condiments', unit: 'kg', stock: 6, reorderLevel: 2, unitCost: 110.00, supplier: 'Pasong Putik Wet Market' },
    { id: 92, sku: 'ING-GRAVY', name: 'Savory Gravy', category: 'Sauces & Condiments', unit: 'L', stock: 8, reorderLevel: 2, unitCost: 80.00, supplier: 'Corner Cravings Commissary' },
    { id: 93, sku: 'ING-TOMATO-CUCUMBER', name: 'Sliced Tomato and Cucumber', category: 'Produce', unit: 'kg', stock: 8, reorderLevel: 2, unitCost: 65.00, supplier: 'Dizon Farms Produce' },
    { id: 94, sku: 'ING-GARLIC-BREAD', name: 'Toasted Garlic Bread', category: 'Bakery', unit: 'pcs', stock: 40, reorderLevel: 10, unitCost: 14.00, supplier: 'Corner Cravings Bakery' },
    { id: 95, sku: 'ING-JAPANESE-SIOMAI', name: 'Japanese Siomai', category: 'Meats & Proteins', unit: 'pcs', stock: 50, reorderLevel: 15, unitCost: 8.50, supplier: 'Golden Dragon Dimsum' }
  ];

  // Start receipt history empty so the admin can simulate every delivery.
  // Existing ingredient quantities remain available as opening balances.
  var DEFAULT_TRANSACTIONS = [];

  function isLegacyDemoReceipt(transaction) {
    if (!transaction || transaction.type !== 'IN' || transaction.reason !== 'Delivery') return false;
    var id = Number(transaction.id);
    var batch = String(transaction.batch || '');
    var date = String(transaction.date || '');
    return id >= 1 && id <= 22 && /^DR-2026-09(?:0[1-9]|1[0-9]|2[0-2])$/.test(batch) && /^2026-09-(?:1[0-9]|2[01])T/.test(date);
  }

  /**
   * Ensure every current catalog balance has an audit origin. This migration
   * never changes stock quantities; it only creates an opening-balance ledger
   * record for an item that has no movement history at all.
   */
  function ensureOpeningBalanceTransactions(inventory) {
    if (!inventory || !Array.isArray(inventory.items)) return inventory;
    if (!Array.isArray(inventory.transactions)) inventory.transactions = [];

    var itemsWithHistory = {};
    var nextId = 0;
    var earliestTime = null;
    inventory.transactions.forEach(function (transaction) {
      itemsWithHistory[Number(transaction.itemId)] = true;
      nextId = Math.max(nextId, Number(transaction.id) || 0);
      var transactionTime = new Date(transaction.date).getTime();
      if (Number.isFinite(transactionTime) && (earliestTime === null || transactionTime < earliestTime)) earliestTime = transactionTime;
    });

    var baselineDate = new Date(earliestTime === null ? Date.now() : earliestTime - 1000).toISOString();
    inventory.items.forEach(function (item) {
      if (itemsWithHistory[Number(item.id)]) return;
      var openingStock = Math.max(0, Number(item.stock) || 0);
      nextId += 1;
      inventory.transactions.push({
        id: nextId,
        itemId: Number(item.id),
        sku: item.sku,
        type: 'ADJUSTMENT',
        direction: openingStock > 0 ? 'INCREASE' : 'NONE',
        quantity: openingStock,
        reason: 'Opening Balance',
        notes: 'Initial inventory balance recorded when the unified inventory ledger was enabled.',
        batch: 'OPENING-' + String(item.sku || item.id).replace(/^ING-/, ''),
        stockAfter: openingStock,
        status: 'POSTED',
        source: 'OPENING_BALANCE',
        actor: 'Inventory Setup',
        openingBalance: true,
        date: baselineDate
      });
    });
    return inventory;
  }

  function withPackaging(requirements, cupSku) {
    return [{ sku: cupSku || 'ING-CUP-16OZ', qty: 1 }, { sku: 'ING-CUP-LID', qty: 1 }].concat(requirements);
  }

  function drinkRecipe(requirements) {
    return withPackaging(requirements.concat([{ sku: 'ING-ICE', qty: 0.16 }]));
  }

  function yakultRecipe(flavorSku) {
    return drinkRecipe([
      { sku: 'ING-YAKULT', qty: 1 },
      { sku: flavorSku, qty: 0.035 },
      { sku: 'ING-FILTERED-WATER', qty: 0.12 }
    ]);
  }

  function frappeRecipe(flavorRequirements) {
    return withPackaging([
      { sku: 'ING-FRESH-MILK', qty: 0.12 },
      { sku: 'ING-COND-MILK', qty: 0.025 },
      { sku: 'ING-ICE', qty: 0.22 }
    ].concat(flavorRequirements));
  }

  function teaRecipe(flavorSku) {
    return drinkRecipe([{ sku: 'ING-BLACK-TEA', qty: 0.2 }, { sku: flavorSku, qty: 0.035 }]);
  }

  function milkRecipe(flavorSku) {
    return drinkRecipe([{ sku: 'ING-FRESH-MILK', qty: 0.22 }, { sku: flavorSku, qty: 0.04 }]);
  }

  function sodaRecipe(flavorSku) {
    return drinkRecipe([{ sku: 'ING-SPARKLING-WATER', qty: 0.22 }, { sku: flavorSku, qty: 0.03 }]);
  }

  function frosteeRecipe(flavorSku) {
    return withPackaging([
      { sku: 'ING-FILTERED-WATER', qty: 0.12 },
      { sku: 'ING-ICE', qty: 0.24 },
      { sku: flavorSku, qty: 0.04 }
    ]);
  }

  // Recipe requirements per product ID: array of { sku, qty }. Quantities are
  // editable production estimates, not claims about the owner's confidential recipe.
  var RECIPE_MAP = {
    // Rice Meals
    'rice-meals-tapsilog': [{ sku: 'ING-BEEF-TAPA', qty: 0.15 }, { sku: 'ING-GAR-RICE', qty: 0.2 }, { sku: 'ING-EGG', qty: 1 }],
    'rice-meals-hotsilog': [{ sku: 'ING-HOTDOG', qty: 2 }, { sku: 'ING-GAR-RICE', qty: 0.2 }, { sku: 'ING-EGG', qty: 1 }],
    'rice-meals-longsilog': [{ sku: 'ING-LONGGANISA', qty: 3 }, { sku: 'ING-GAR-RICE', qty: 0.2 }, { sku: 'ING-EGG', qty: 1 }],
    'rice-meals-macaosilog': [{ sku: 'ING-MACAO-SAUSAGE', qty: 4 }, { sku: 'ING-GAR-RICE', qty: 0.2 }, { sku: 'ING-EGG', qty: 1 }],
    'rice-meals-balonsilog': [{ sku: 'ING-BOLOGNA', qty: 3 }, { sku: 'ING-GAR-RICE', qty: 0.2 }, { sku: 'ING-EGG', qty: 1 }],
    'rice-meals-siomaisilog': [{ sku: 'ING-SIOMAI', qty: 4 }, { sku: 'ING-GAR-RICE', qty: 0.2 }, { sku: 'ING-EGG', qty: 1 }, { sku: 'ING-CALAMANSI', qty: 1 }],
    'rice-meals-hungariansilog': [{ sku: 'ING-HUNGARIAN', qty: 1 }, { sku: 'ING-GAR-RICE', qty: 0.2 }, { sku: 'ING-EGG', qty: 1 }],
    'rice-meals-bangsilog': [{ sku: 'ING-BANGUS', qty: 1 }, { sku: 'ING-GAR-RICE', qty: 0.2 }, { sku: 'ING-EGG', qty: 1 }, { sku: 'ING-CALAMANSI', qty: 1 }],
    'rice-meals-porksilog': [{ sku: 'ING-PORKCHOP', qty: 1 }, { sku: 'ING-GAR-RICE', qty: 0.2 }, { sku: 'ING-EGG', qty: 1 }],
    'rice-meals-shanghai-silog': [{ sku: 'ING-SHANGHAI', qty: 5 }, { sku: 'ING-GAR-RICE', qty: 0.2 }, { sku: 'ING-EGG', qty: 1 }],
    'rice-meals-chixsilog': [{ sku: 'ING-CHICKEN', qty: 1 }, { sku: 'ING-GAR-RICE', qty: 0.2 }, { sku: 'ING-EGG', qty: 1 }],
    'rice-meals-spamsilog': [{ sku: 'ING-SPAM', qty: 0.25 }, { sku: 'ING-GAR-RICE', qty: 0.2 }, { sku: 'ING-EGG', qty: 1 }],

    // Silog Combos (includes meal + 12oz Soda + Graham Bar)
    'silog-combo-silog-meal-combo': [{ sku: 'ING-HOTDOG', qty: 2 }, { sku: 'ING-GAR-RICE', qty: 0.2 }, { sku: 'ING-EGG', qty: 1 }, { sku: 'ING-CUP-12OZ', qty: 1 }, { sku: 'ING-SODA-SYRUP', qty: 0.05 }, { sku: 'ING-GRAHAM-BAR', qty: 1 }],
    'silog-combo-siomaisilog-combo': [{ sku: 'ING-SIOMAI', qty: 4 }, { sku: 'ING-GAR-RICE', qty: 0.2 }, { sku: 'ING-EGG', qty: 1 }, { sku: 'ING-CALAMANSI', qty: 1 }, { sku: 'ING-CUP-12OZ', qty: 1 }, { sku: 'ING-SODA-SYRUP', qty: 0.05 }, { sku: 'ING-GRAHAM-BAR', qty: 1 }],
    'silog-combo-bangsilog-combo': [{ sku: 'ING-BANGUS', qty: 1 }, { sku: 'ING-GAR-RICE', qty: 0.2 }, { sku: 'ING-EGG', qty: 1 }, { sku: 'ING-CALAMANSI', qty: 1 }, { sku: 'ING-CUP-12OZ', qty: 1 }, { sku: 'ING-SODA-SYRUP', qty: 0.05 }, { sku: 'ING-GRAHAM-BAR', qty: 1 }],
    'silog-combo-tapsilog-combo': [{ sku: 'ING-BEEF-TAPA', qty: 0.15 }, { sku: 'ING-GAR-RICE', qty: 0.2 }, { sku: 'ING-EGG', qty: 1 }, { sku: 'ING-CUP-12OZ', qty: 1 }, { sku: 'ING-SODA-SYRUP', qty: 0.05 }, { sku: 'ING-GRAHAM-BAR', qty: 1 }],
    'silog-combo-porksilog-combo': [{ sku: 'ING-PORKCHOP', qty: 1 }, { sku: 'ING-GAR-RICE', qty: 0.2 }, { sku: 'ING-EGG', qty: 1 }, { sku: 'ING-CUP-12OZ', qty: 1 }, { sku: 'ING-SODA-SYRUP', qty: 0.05 }, { sku: 'ING-GRAHAM-BAR', qty: 1 }],
    'silog-combo-chixsilog-combo': [{ sku: 'ING-CHICKEN', qty: 1 }, { sku: 'ING-GAR-RICE', qty: 0.2 }, { sku: 'ING-EGG', qty: 1 }, { sku: 'ING-CUP-12OZ', qty: 1 }, { sku: 'ING-SODA-SYRUP', qty: 0.05 }, { sku: 'ING-GRAHAM-BAR', qty: 1 }],

    // Special Pasta
    'special-pasta-palabok': [{ sku: 'ING-NOODLE-PALABOK', qty: 1 }, { sku: 'ING-SAUCE-PALABOK', qty: 0.15 }, { sku: 'ING-CHICHARON', qty: 0.03 }, { sku: 'ING-SHRIMP', qty: 0.04 }, { sku: 'ING-EGG', qty: 1 }, { sku: 'ING-SPRING-ONION', qty: 0.01 }, { sku: 'ING-CALAMANSI', qty: 2 }],
    'special-pasta-spaghetti': [{ sku: 'ING-PASTA-SPAG', qty: 0.15 }, { sku: 'ING-SAUCE-SPAG', qty: 0.2 }, { sku: 'ING-HOTDOG', qty: 1 }, { sku: 'ING-CHEESE', qty: 0.03 }],
    'special-pasta-pancit-canton': [{ sku: 'ING-NOODLE-CANTON', qty: 1 }, { sku: 'ING-PANCIT-VEG', qty: 0.08 }, { sku: 'ING-PANCIT-MEAT', qty: 0.06 }, { sku: 'ING-PANCIT-SAUCE', qty: 0.04 }, { sku: 'ING-CALAMANSI', qty: 2 }],
    'special-pasta-pancit-bihon': [{ sku: 'ING-NOODLE-BIHON', qty: 1 }, { sku: 'ING-PANCIT-VEG', qty: 0.08 }, { sku: 'ING-PANCIT-MEAT', qty: 0.06 }, { sku: 'ING-PANCIT-SAUCE', qty: 0.04 }, { sku: 'ING-CALAMANSI', qty: 2 }],

    // Pasta Combos (includes pasta + 16oz Graham Shake)
    'pasta-combo-pancit-bihon-canton-combo': [{ sku: 'ING-NOODLE-CANTON', qty: 1 }, { sku: 'ING-PANCIT-VEG', qty: 0.08 }, { sku: 'ING-PANCIT-MEAT', qty: 0.06 }, { sku: 'ING-PANCIT-SAUCE', qty: 0.04 }, { sku: 'ING-CALAMANSI', qty: 2 }, { sku: 'ING-CUP-16OZ', qty: 1 }, { sku: 'ING-CUP-LID', qty: 1 }, { sku: 'ING-ICE', qty: 0.18 }, { sku: 'ING-MANGO-PUREE', qty: 0.1 }, { sku: 'ING-GRAHAM-CRUMBS', qty: 0.04 }, { sku: 'ING-COND-MILK', qty: 0.03 }],
    'pasta-combo-palabok-combo': [{ sku: 'ING-NOODLE-PALABOK', qty: 1 }, { sku: 'ING-SAUCE-PALABOK', qty: 0.15 }, { sku: 'ING-CHICHARON', qty: 0.03 }, { sku: 'ING-SHRIMP', qty: 0.04 }, { sku: 'ING-EGG', qty: 1 }, { sku: 'ING-SPRING-ONION', qty: 0.01 }, { sku: 'ING-CALAMANSI', qty: 2 }, { sku: 'ING-CUP-16OZ', qty: 1 }, { sku: 'ING-CUP-LID', qty: 1 }, { sku: 'ING-ICE', qty: 0.18 }, { sku: 'ING-MANGO-PUREE', qty: 0.1 }, { sku: 'ING-GRAHAM-CRUMBS', qty: 0.04 }, { sku: 'ING-COND-MILK', qty: 0.03 }],
    'pasta-combo-spaghetti-combo': [{ sku: 'ING-PASTA-SPAG', qty: 0.15 }, { sku: 'ING-SAUCE-SPAG', qty: 0.2 }, { sku: 'ING-HOTDOG', qty: 1 }, { sku: 'ING-CHEESE', qty: 0.03 }, { sku: 'ING-CUP-16OZ', qty: 1 }, { sku: 'ING-CUP-LID', qty: 1 }, { sku: 'ING-ICE', qty: 0.18 }, { sku: 'ING-MANGO-PUREE', qty: 0.1 }, { sku: 'ING-GRAHAM-CRUMBS', qty: 0.04 }, { sku: 'ING-COND-MILK', qty: 0.03 }],

    // Special Burgers
    'special-burger-special-burger': [{ sku: 'ING-BURGER-BUN', qty: 1 }, { sku: 'ING-BURGER-PATTY', qty: 1 }, { sku: 'ING-BURGER-SAUCE', qty: 0.03 }, { sku: 'ING-CHEESE', qty: 0.02 }, { sku: 'ING-CABBAGE', qty: 0.04 }],
    'special-burger-special-burger-with-fries': [{ sku: 'ING-BURGER-BUN', qty: 1 }, { sku: 'ING-BURGER-PATTY', qty: 1 }, { sku: 'ING-BURGER-SAUCE', qty: 0.03 }, { sku: 'ING-CHEESE', qty: 0.02 }, { sku: 'ING-CABBAGE', qty: 0.04 }, { sku: 'ING-FRIES', qty: 0.15 }],
    'special-burger-aloha-burger': [{ sku: 'ING-BURGER-BUN', qty: 1 }, { sku: 'ING-BURGER-PATTY', qty: 1 }, { sku: 'ING-BURGER-SAUCE', qty: 0.03 }, { sku: 'ING-CHEESE', qty: 0.02 }, { sku: 'ING-CABBAGE', qty: 0.04 }, { sku: 'ING-PINEAPPLE', qty: 0.1 }],
    'special-burger-aloha-burger-with-fries': [{ sku: 'ING-BURGER-BUN', qty: 1 }, { sku: 'ING-BURGER-PATTY', qty: 1 }, { sku: 'ING-BURGER-SAUCE', qty: 0.03 }, { sku: 'ING-CHEESE', qty: 0.02 }, { sku: 'ING-CABBAGE', qty: 0.04 }, { sku: 'ING-PINEAPPLE', qty: 0.1 }, { sku: 'ING-FRIES', qty: 0.15 }],

    // Iced Cold Coffee
    'iced-coffee-latte': [{ sku: 'ING-CUP-16OZ', qty: 1 }, { sku: 'ING-CUP-LID', qty: 1 }, { sku: 'ING-COFFEE-BEANS', qty: 0.03 }, { sku: 'ING-FRESH-MILK', qty: 0.2 }, { sku: 'ING-ICE', qty: 0.16 }],
    'iced-coffee-caramel-macchiato': [{ sku: 'ING-CUP-16OZ', qty: 1 }, { sku: 'ING-CUP-LID', qty: 1 }, { sku: 'ING-COFFEE-BEANS', qty: 0.03 }, { sku: 'ING-FRESH-MILK', qty: 0.18 }, { sku: 'ING-SYRUP-CARAMEL', qty: 0.03 }, { sku: 'ING-ICE', qty: 0.16 }],
    'iced-coffee-spanish-latte': [{ sku: 'ING-CUP-16OZ', qty: 1 }, { sku: 'ING-CUP-LID', qty: 1 }, { sku: 'ING-COFFEE-BEANS', qty: 0.03 }, { sku: 'ING-FRESH-MILK', qty: 0.15 }, { sku: 'ING-COND-MILK', qty: 0.05 }, { sku: 'ING-ICE', qty: 0.16 }],
    'iced-coffee-iced-mocha': [{ sku: 'ING-CUP-16OZ', qty: 1 }, { sku: 'ING-CUP-LID', qty: 1 }, { sku: 'ING-COFFEE-BEANS', qty: 0.03 }, { sku: 'ING-FRESH-MILK', qty: 0.18 }, { sku: 'ING-SYRUP-MOCHA', qty: 0.03 }, { sku: 'ING-ICE', qty: 0.16 }],
    'iced-coffee-vietnamese-latte': [{ sku: 'ING-CUP-16OZ', qty: 1 }, { sku: 'ING-CUP-LID', qty: 1 }, { sku: 'ING-COFFEE-BEANS', qty: 0.03 }, { sku: 'ING-COND-MILK', qty: 0.07 }, { sku: 'ING-ICE', qty: 0.16 }],
    'iced-coffee-salted-caramel': [{ sku: 'ING-CUP-16OZ', qty: 1 }, { sku: 'ING-CUP-LID', qty: 1 }, { sku: 'ING-COFFEE-BEANS', qty: 0.03 }, { sku: 'ING-FRESH-MILK', qty: 0.18 }, { sku: 'ING-SYRUP-SALTED', qty: 0.03 }, { sku: 'ING-ICE', qty: 0.16 }],

    // Milk Tea (16oz estimates; owner recipes can override these portions)
    'milk-tea-taro': drinkRecipe([{ sku: 'ING-BLACK-TEA', qty: 0.12 }, { sku: 'ING-CREAMER', qty: 0.03 }, { sku: 'ING-TARO-POWDER', qty: 0.035 }, { sku: 'ING-SIMPLE-SYRUP', qty: 0.02 }]),
    'milk-tea-okinawa': drinkRecipe([{ sku: 'ING-BLACK-TEA', qty: 0.12 }, { sku: 'ING-CREAMER', qty: 0.03 }, { sku: 'ING-OKINAWA-SYRUP', qty: 0.035 }]),
    'milk-tea-wintermelon': drinkRecipe([{ sku: 'ING-BLACK-TEA', qty: 0.12 }, { sku: 'ING-CREAMER', qty: 0.03 }, { sku: 'ING-WINTERMELON-SYRUP', qty: 0.035 }]),
    'milk-tea-cookies-n-cream': drinkRecipe([{ sku: 'ING-BLACK-TEA', qty: 0.1 }, { sku: 'ING-CREAMER', qty: 0.035 }, { sku: 'ING-COOKIES-CREAM', qty: 0.04 }]),
    'milk-tea-choco-kisses': drinkRecipe([{ sku: 'ING-BLACK-TEA', qty: 0.1 }, { sku: 'ING-CREAMER', qty: 0.035 }, { sku: 'ING-CHOCOLATE-SYRUP', qty: 0.035 }]),
    'milk-tea-matcha-milk-tea': drinkRecipe([{ sku: 'ING-BLACK-TEA', qty: 0.08 }, { sku: 'ING-FRESH-MILK', qty: 0.14 }, { sku: 'ING-MATCHA', qty: 0.004 }, { sku: 'ING-SIMPLE-SYRUP', qty: 0.02 }]),

    // Yakult Series
    'yakult-series-strawberry-yakult': yakultRecipe('ING-SYRUP-STRAWBERRY'),
    'yakult-series-green-apple-yakult': yakultRecipe('ING-SYRUP-GREEN-APPLE'),
    'yakult-series-mango-yakult-splash': yakultRecipe('ING-SYRUP-MANGO'),
    'yakult-series-blueberry-yakult': yakultRecipe('ING-SYRUP-BLUEBERRY'),
    'yakult-series-lychee-yakult': yakultRecipe('ING-SYRUP-LYCHEE'),

    // Ice-Blended Frappes
    'frappe-choco-lava': frappeRecipe([{ sku: 'ING-CHOCOLATE-SYRUP', qty: 0.05 }]),
    'frappe-oreo-cream': frappeRecipe([{ sku: 'ING-OREO-CRUMBS', qty: 0.05 }]),
    'frappe-matcha-craze': frappeRecipe([{ sku: 'ING-MATCHA', qty: 0.006 }]),
    'frappe-ube-craze': frappeRecipe([{ sku: 'ING-UBE-PUREE', qty: 0.06 }]),
    'frappe-strawberry-dunk': frappeRecipe([{ sku: 'ING-SYRUP-STRAWBERRY', qty: 0.05 }]),
    'frappe-mango-graham': frappeRecipe([{ sku: 'ING-MANGO-PUREE', qty: 0.1 }, { sku: 'ING-GRAHAM-CRUMBS', qty: 0.04 }]),
    'frappe-avocado-graham': frappeRecipe([{ sku: 'ING-AVOCADO-PUREE', qty: 0.1 }, { sku: 'ING-GRAHAM-CRUMBS', qty: 0.04 }]),

    // Matcha Series
    'matcha-series-matcha-espresso': drinkRecipe([{ sku: 'ING-MATCHA', qty: 0.004 }, { sku: 'ING-FRESH-MILK', qty: 0.16 }, { sku: 'ING-COFFEE-BEANS', qty: 0.02 }, { sku: 'ING-SIMPLE-SYRUP', qty: 0.02 }]),
    'matcha-series-matcha-strawberry': drinkRecipe([{ sku: 'ING-MATCHA', qty: 0.004 }, { sku: 'ING-FRESH-MILK', qty: 0.16 }, { sku: 'ING-SYRUP-STRAWBERRY', qty: 0.04 }]),
    'matcha-series-matcha-ube': drinkRecipe([{ sku: 'ING-MATCHA', qty: 0.004 }, { sku: 'ING-FRESH-MILK', qty: 0.16 }, { sku: 'ING-UBE-PUREE', qty: 0.04 }]),

    // Iced Shaken Tea
    'shaken-tea-mango-tea': teaRecipe('ING-SYRUP-MANGO'),
    'shaken-tea-blueberry-tea': teaRecipe('ING-SYRUP-BLUEBERRY'),
    'shaken-tea-lychee-tea': teaRecipe('ING-SYRUP-LYCHEE'),
    'shaken-tea-mixed-berries-tea': teaRecipe('ING-SYRUP-MIXED-BERRIES'),

    // Fruity Milk
    'fruity-milk-blueberry-milk': milkRecipe('ING-SYRUP-BLUEBERRY'),
    'fruity-milk-strawberry-milk': milkRecipe('ING-SYRUP-STRAWBERRY'),

    // Fruity Soda
    'fruity-soda-lychee-soda': sodaRecipe('ING-SYRUP-LYCHEE'),
    'fruity-soda-strawberry-soda': sodaRecipe('ING-SYRUP-STRAWBERRY'),
    'fruity-soda-blueberry-soda': sodaRecipe('ING-SYRUP-BLUEBERRY'),
    'fruity-soda-green-apple-soda': sodaRecipe('ING-SYRUP-GREEN-APPLE'),
    'fruity-soda-mango-soda': sodaRecipe('ING-SYRUP-MANGO'),

    // Frostee Series
    'frostee-series-lychee-frostee': frosteeRecipe('ING-SYRUP-LYCHEE'),
    'frostee-series-strawberry-frostee': frosteeRecipe('ING-SYRUP-STRAWBERRY'),
    'frostee-series-blueberry-frostee': frosteeRecipe('ING-SYRUP-BLUEBERRY'),
    'frostee-series-green-apple-frostee': frosteeRecipe('ING-SYRUP-GREEN-APPLE'),
    'frostee-series-mango-frostee': frosteeRecipe('ING-SYRUP-MANGO')
  };

  // Add-on ingredient mapping (matched by end of add-on ID or name)
  var ADDON_RECIPE_MAP = {
    'extra-rice': [{ sku: 'ING-GAR-RICE', qty: 0.2 }],
    'extra-egg': [{ sku: 'ING-EGG', qty: 1 }],
    'fried-egg': [{ sku: 'ING-EGG', qty: 1 }],
    'boiled-egg': [{ sku: 'ING-EGG', qty: 1 }],
    'siomai': [{ sku: 'ING-SIOMAI', qty: 1 }],
    'garlic-bits': [{ sku: 'ING-GAR-BITS', qty: 0.02 }],
    'extra-hotdog': [{ sku: 'ING-HOTDOG', qty: 1 }],
    'extra-hotdog-slices': [{ sku: 'ING-HOTDOG', qty: 1 }],
    'extra-longganisa': [{ sku: 'ING-LONGGANISA', qty: 1 }],
    'extra-tapa': [{ sku: 'ING-BEEF-TAPA', qty: 0.1 }],
    'extra-cheese': [{ sku: 'ING-CHEESE', qty: 0.03 }],
    'extra-fries': [{ sku: 'ING-FRIES', qty: 0.15 }],
    'calamansi': [{ sku: 'ING-CALAMANSI', qty: 2 }],
    'crushed-chicharon': [{ sku: 'ING-CHICHARON', qty: 0.03 }],
    'extra-espresso': [{ sku: 'ING-COFFEE-BEANS', qty: 0.03 }],
    'caramel-drizzle': [{ sku: 'ING-SYRUP-CARAMEL', qty: 0.02 }],
    'graham-crumbs': [{ sku: 'ING-GRAHAM-CRUMBS', qty: 0.03 }],
    'japanese-siomai': [{ sku: 'ING-JAPANESE-SIOMAI', qty: 1 }],
    'chili-garlic-oil': [{ sku: 'ING-CHILI-GARLIC', qty: 0.02 }],
    'atchara': [{ sku: 'ING-ATCHARA', qty: 0.08 }],
    'gravy': [{ sku: 'ING-GRAVY', qty: 0.05 }],
    'tomato-cucumber': [{ sku: 'ING-TOMATO-CUCUMBER', qty: 0.08 }],
    'extra-sauce': [{ sku: 'ING-SAUCE-SPAG', qty: 0.08 }],
    'garlic-bread': [{ sku: 'ING-GARLIC-BREAD', qty: 2 }],
    'extra-patty': [{ sku: 'ING-BURGER-PATTY', qty: 1 }],
    'bacon-strips': [{ sku: 'ING-BACON', qty: 2 }],
    'pineapple-ring': [{ sku: 'ING-PINEAPPLE', qty: 0.1 }],
    'jalapeno-slices': [{ sku: 'ING-JALAPENO', qty: 0.03 }],
    'garlic-mayo-dip': [{ sku: 'ING-GARLIC-MAYO', qty: 0.05 }],
    'cheese-dip': [{ sku: 'ING-CHEESE-DIP', qty: 0.05 }],
    'coffee-jelly': [{ sku: 'ING-COFFEE-JELLY', qty: 0.06 }],
    'vanilla-syrup': [{ sku: 'ING-SYRUP-VANILLA', qty: 0.02 }],
    'caramel-syrup': [{ sku: 'ING-SYRUP-CARAMEL', qty: 0.02 }],
    'hazelnut-syrup': [{ sku: 'ING-SYRUP-HAZELNUT', qty: 0.02 }],
    'sea-salt-foam': [{ sku: 'ING-SEA-SALT-FOAM', qty: 0.05 }],
    'pearl': [{ sku: 'ING-TAPIOCA-PEARLS', qty: 0.06 }],
    'egg-pudding': [{ sku: 'ING-EGG-PUDDING', qty: 0.06 }],
    'cream-cheese': [{ sku: 'ING-CREAM-CHEESE-FOAM', qty: 0.05 }],
    'oreo-crumbs': [{ sku: 'ING-OREO-CRUMBS', qty: 0.04 }],
    'grass-jelly': [{ sku: 'ING-GRASS-JELLY', qty: 0.06 }],
    'nata': [{ sku: 'ING-NATA', qty: 0.06 }],
    'popping-boba': [{ sku: 'ING-POPPING-BOBA', qty: 0.06 }],
    'rainbow-jelly': [{ sku: 'ING-RAINBOW-JELLY', qty: 0.06 }],
    'chia-seeds': [{ sku: 'ING-CHIA-SEEDS', qty: 0.01 }],
    'extra-yakult': [{ sku: 'ING-YAKULT', qty: 1 }],
    'lemon-slices': [{ sku: 'ING-CALAMANSI', qty: 2 }],
    'whipped-cream': [{ sku: 'ING-WHIPPING-CREAM', qty: 0.04 }],
    'chocolate-drizzle': [{ sku: 'ING-CHOCOLATE-SYRUP', qty: 0.02 }],
    'extra-matcha': [{ sku: 'ING-MATCHA', qty: 0.003 }],
    'red-bean': [{ sku: 'ING-RED-BEAN', qty: 0.06 }],
    'strawberry-swirl': [{ sku: 'ING-SYRUP-STRAWBERRY', qty: 0.03 }],
    'espresso': [{ sku: 'ING-COFFEE-BEANS', qty: 0.03 }]
  };

  function readInventory() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.items) && parsed.items.length > 0) {
          // Check if items are Corner Cravings items (has ING- sku)
          var hasRestaurantItems = parsed.items.some(function (it) {
            return String(it.sku || '').indexOf('ING-') === 0;
          });
          if (hasRestaurantItems) {
            var inventoryChanged = false;
            // Non-destructive catalog migration: new canonical ingredients are
            // appended without replacing the admin's existing stock balances.
            var knownSkus = {};
            parsed.items.forEach(function (item) { knownSkus[item.sku] = true; });
            DEFAULT_ITEMS.forEach(function (item) {
              if (!knownSkus[item.sku]) {
                parsed.items.push(JSON.parse(JSON.stringify(item)));
                inventoryChanged = true;
              }
            });

            // Backfill unitCost and supplier for existing cached items
            var defaultMap = {};
            DEFAULT_ITEMS.forEach(function (it) { defaultMap[it.sku] = it; });
            parsed.items.forEach(function (item) {
              var def = defaultMap[item.sku];
              if (def) {
                if (item.unitCost === undefined || item.unitCost === null || isNaN(item.unitCost)) {
                  item.unitCost = def.unitCost || 0;
                  inventoryChanged = true;
                }
                if (!item.supplier) {
                  item.supplier = def.supplier || 'Corner Cravings Local Hub';
                  inventoryChanged = true;
                }
              } else {
                if (item.unitCost === undefined || item.unitCost === null || isNaN(item.unitCost)) {
                  item.unitCost = 0;
                  inventoryChanged = true;
                }
                if (!item.supplier) {
                  item.supplier = 'Local Market / Vendor';
                  inventoryChanged = true;
                }
              }
            });

            if (!Array.isArray(parsed.transactions)) {
              parsed.transactions = [];
              inventoryChanged = true;
            }
            var transactionCountBeforeDemoCleanup = parsed.transactions.length;
            parsed.transactions = parsed.transactions.filter(function (transaction) {
              return !isLegacyDemoReceipt(transaction);
            });
            if (parsed.transactions.length !== transactionCountBeforeDemoCleanup) inventoryChanged = true;
            var transactionCountBeforeOpeningBalances = parsed.transactions.length;
            ensureOpeningBalanceTransactions(parsed);
            if (parsed.transactions.length !== transactionCountBeforeOpeningBalances) inventoryChanged = true;

            if (inventoryChanged) writeInventory(parsed);
            return parsed;
          }
        }
      }
    } catch (e) {}

    // Initialize or migrate to Corner Cravings default dataset
    var initial = ensureOpeningBalanceTransactions({
      items: JSON.parse(JSON.stringify(DEFAULT_ITEMS)),
      transactions: JSON.parse(JSON.stringify(DEFAULT_TRANSACTIONS))
    });
    writeInventory(initial);
    return initial;
  }

  function writeInventory(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
        window.dispatchEvent(new CustomEvent('cornercravings:inventory-updated', { detail: data }));
      }
    } catch (e) {}
  }

  function getItemBySku(sku) {
    var inv = readInventory();
    return inv.items.find(function (it) { return it.sku === sku; }) || null;
  }

  function getItemById(id) {
    var inv = readInventory();
    return inv.items.find(function (it) { return Number(it.id) === Number(id); }) || null;
  }

  function getInventoryItems() {
    var inv = readInventory();
    return inv.items.map(function (it) {
      var stock = Number(it.stock);
      var reorderLevel = Number(it.reorderLevel);
      var unitCost = Number(it.unitCost) || 0;
      var status = 'OK';
      if (stock <= 0) {
        status = 'OUT';
      } else if (stock <= reorderLevel) {
        status = 'LOW';
      }
      return Object.assign({}, it, {
        stock: stock,
        reorderLevel: reorderLevel,
        unitCost: unitCost,
        supplier: it.supplier || 'Corner Cravings Local Hub',
        stockValuation: Math.round(stock * unitCost * 100) / 100,
        inventoryStatus: status
      });
    });
  }

  function getLowStockItems() {
    var items = getInventoryItems();
    return items.filter(function (it) {
      return it.inventoryStatus === 'LOW' || it.inventoryStatus === 'OUT';
    });
  }

  function updateInventoryItem(idOrSku, updates, actor) {
    if (!idOrSku) return { success: false, reason: 'Item ID or SKU is required.' };
    var inv = readInventory();
    var item = inv.items.find(function (it) {
      return Number(it.id) === Number(idOrSku) || it.sku === idOrSku;
    });
    if (!item) return { success: false, reason: 'Inventory item not found.' };

    var oldStock = Number(item.stock) || 0;
    var newStock = updates.stock !== undefined && updates.stock !== null && !isNaN(updates.stock)
      ? Math.max(0, Number(updates.stock))
      : oldStock;
    var stockChanged = Math.abs(newStock - oldStock) > 0.0001;
    var adjTx = null;

    if (stockChanged) {
      var diff = Math.round((newStock - oldStock) * 1000) / 1000;
      adjTx = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        itemId: Number(item.id),
        sku: item.sku,
        type: 'ADJUSTMENT',
        quantity: Math.abs(diff),
        direction: diff > 0 ? 'INCREASE' : 'DECREASE',
        reason: updates.adjustmentReason || 'Physical Stock Audit / Direct Edit',
        notes: 'Stock updated from ' + oldStock + ' to ' + newStock + ' ' + item.unit + (updates.adjustmentNotes ? ' (' + updates.adjustmentNotes + ')' : ''),
        batch: 'ADJ-' + Date.now().toString().slice(-6),
        stockAfter: newStock,
        status: 'POSTED',
        source: 'MANUAL_EDIT',
        actor: actor || 'Admin',
        date: new Date().toISOString()
      };
      inv.transactions.push(adjTx);
      item.stock = newStock;
    }

    if (updates.name && String(updates.name).trim()) item.name = String(updates.name).trim();
    if (updates.category && String(updates.category).trim()) item.category = String(updates.category).trim();
    if (updates.unit && String(updates.unit).trim()) item.unit = String(updates.unit).trim();
    if (updates.reorderLevel !== undefined && !isNaN(updates.reorderLevel)) {
      item.reorderLevel = Math.max(0, Number(updates.reorderLevel));
    }
    if (updates.unitCost !== undefined && !isNaN(updates.unitCost)) {
      item.unitCost = Math.max(0, Number(updates.unitCost));
    }
    if (updates.supplier !== undefined) item.supplier = String(updates.supplier).trim();

    writeInventory(inv);
    return {
      success: true,
      item: item,
      transaction: adjTx,
      stockChanged: stockChanged
    };
  }

  function addInventoryItem(itemData) {
    if (!itemData || !itemData.name) {
      return { success: false, reason: 'Ingredient name is required.' };
    }
    var inv = readInventory();
    var name = String(itemData.name).trim();
    var sku = (itemData.sku || ('ING-' + name.toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-|-$/g, ''))).trim();
    if (!/^ING-[A-Z0-9-]+$/.test(sku)) {
      return { success: false, reason: 'SKU must start with ING- and contain only letters, numbers, and hyphens.' };
    }
    if (inv.items.some(function (it) { return it.sku.toLowerCase() === sku.toLowerCase() || it.name.toLowerCase() === name.toLowerCase(); })) {
      return { success: false, reason: 'An ingredient with this name or SKU already exists.' };
    }

    var nextId = inv.items.reduce(function (max, it) { return Math.max(max, Number(it.id) || 0); }, 0) + 1;
    var initialStock = Math.max(0, Number(itemData.stock || itemData.quantity) || 0);
    var unitCost = Math.max(0, Number(itemData.unitCost) || 0);
    var reorderLevel = Math.max(0, Number(itemData.reorderLevel) || 1);
    var supplier = String(itemData.supplier || 'Corner Cravings Local Hub').trim();
    var unit = String(itemData.unit || 'pcs').trim();
    var category = String(itemData.category || 'General Ingredients').trim();

    var newItem = {
      id: nextId,
      sku: sku,
      name: name,
      category: category,
      unit: unit,
      stock: initialStock,
      reorderLevel: reorderLevel,
      unitCost: unitCost,
      supplier: supplier
    };

    inv.items.push(newItem);

    var initTx = null;
    if (initialStock > 0) {
      initTx = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        itemId: nextId,
        sku: sku,
        type: 'IN',
        quantity: initialStock,
        reason: 'Initial Stock-In Delivery',
        batch: itemData.batch || ('INIT-' + sku),
        supplier: supplier,
        unitCost: unitCost,
        stockAfter: initialStock,
        status: 'POSTED',
        source: 'MANUAL',
        date: new Date().toISOString()
      };
      inv.transactions.push(initTx);
    }

    writeInventory(inv);
    return { success: true, item: newItem, transaction: initTx };
  }

  function recordStockIn(delivery) {
    if (!delivery) return { success: false, reason: 'Delivery data is required.' };
    var inv = readInventory();
    var item = inv.items.find(function (it) {
      return Number(it.id) === Number(delivery.itemId) || it.sku === delivery.sku;
    });
    if (!item) return { success: false, reason: 'Inventory item not found.' };

    var qty = Number(delivery.quantity);
    if (!Number.isFinite(qty) || qty <= 0) {
      return { success: false, reason: 'Quantity must be greater than zero.' };
    }

    var newStock = Math.round((Number(item.stock) + qty) * 1000) / 1000;
    item.stock = newStock;
    if (delivery.unitCost && Number(delivery.unitCost) > 0) {
      item.unitCost = Number(delivery.unitCost);
    }
    if (delivery.supplier) item.supplier = String(delivery.supplier).trim();

    var nowIso = delivery.occurredAt || new Date().toISOString();
    var tx = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      itemId: Number(item.id),
      sku: item.sku,
      type: 'IN',
      quantity: qty,
      reason: delivery.reason || 'Delivery',
      batch: delivery.batch || ('DR-' + Date.now().toString().slice(-6)),
      supplier: delivery.supplier || item.supplier || '',
      unitCost: Number(delivery.unitCost) || item.unitCost || 0,
      expiryDate: delivery.expiryDate || '',
      notes: delivery.notes || '',
      source: delivery.source || 'MANUAL',
      stockAfter: newStock,
      status: delivery.status || 'POSTED',
      date: nowIso
    };

    inv.transactions.push(tx);
    writeInventory(inv);

    return {
      success: true,
      item: item,
      transaction: tx,
      balanceAfter: newStock
    };
  }

  function getInventoryMetrics() {
    var items = getInventoryItems();
    var inv = readInventory();
    var totalValuation = 0;
    var lowStockCount = 0;
    var outOfStockCount = 0;
    var inStockCount = 0;

    items.forEach(function (it) {
      var cost = Number(it.unitCost) || 0;
      var stock = Math.max(0, Number(it.stock) || 0);
      totalValuation += stock * cost;

      if (stock <= 0) {
        outOfStockCount += 1;
      } else if (stock <= Number(it.reorderLevel)) {
        lowStockCount += 1;
      } else {
        inStockCount += 1;
      }
    });

    var recentReceipts = (inv.transactions || []).filter(function (tx) {
      return tx.type === 'IN' && !tx.reversedAt && tx.status !== 'REVERSED';
    });

    return {
      totalValuation: Math.round(totalValuation * 100) / 100,
      totalValuationFormatted: '₱' + (Math.round(totalValuation * 100) / 100).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      totalItems: items.length,
      lowStockCount: lowStockCount,
      outOfStockCount: outOfStockCount,
      inStockCount: inStockCount,
      healthyCount: inStockCount,
      recentReceiptsCount: recentReceipts.length
    };
  }

  function normalizeRecipe(recipe) {
    if (!Array.isArray(recipe)) return [];
    var merged = {};
    recipe.forEach(function (entry) {
      var sku = String(entry && entry.sku || '').trim();
      var qty = Number(entry && (entry.qty != null ? entry.qty : entry.quantity));
      if (!sku || !Number.isFinite(qty) || qty <= 0) return;
      merged[sku] = Math.round(((merged[sku] || 0) + qty) * 1000) / 1000;
    });
    return Object.keys(merged).map(function (sku) { return { sku: sku, qty: merged[sku] }; });
  }

  function readRecipeOverrides() {
    try {
      var parsed = JSON.parse(localStorage.getItem(RECIPE_STORAGE_KEY) || '{}');
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch (error) {
      return {};
    }
  }

  function saveProductRecipe(productId, recipe) {
    var id = String(productId || '').trim();
    var normalized = normalizeRecipe(recipe);
    if (!id) return { success: false, reason: 'A product ID is required.' };
    if (!normalized.length) return { success: false, reason: 'Add at least one valid ingredient.' };
    var known = {};
    getInventoryItems().forEach(function (item) { known[item.sku] = true; });
    var unknown = normalized.filter(function (entry) { return !known[entry.sku]; });
    if (unknown.length) return { success: false, reason: 'Unknown inventory ingredient: ' + unknown[0].sku };
    var recipes = readRecipeOverrides();
    recipes[id] = normalized;
    localStorage.setItem(RECIPE_STORAGE_KEY, JSON.stringify(recipes));
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new CustomEvent('cornercravings:recipes-updated', { detail: { productId: id, recipe: normalized } }));
    }
    return { success: true, recipe: normalized };
  }

  function deleteProductRecipe(productId) {
    var recipes = readRecipeOverrides();
    if (!Object.prototype.hasOwnProperty.call(recipes, productId)) return false;
    delete recipes[productId];
    localStorage.setItem(RECIPE_STORAGE_KEY, JSON.stringify(recipes));
    return true;
  }

  /**
   * Resolves ingredients for a product ID, taking into account flavor options and add-ons
   */
  function getProductRecipe(productId, options, addOns) {
    var customRecipes = readRecipeOverrides();
    var sourceRecipe = Object.prototype.hasOwnProperty.call(customRecipes, productId) ? customRecipes[productId] : RECIPE_MAP[productId];
    var baseRequirements = sourceRecipe ? normalizeRecipe(JSON.parse(JSON.stringify(sourceRecipe))) : [];

    // A selected combo flavor consumes its exact syrup instead of only a
    // generic fruity-soda ingredient.
    if (productId.indexOf('silog-combo') !== -1 && options && options.id) {
      var sodaFlavorSkus = {
        'fruity-soda-lychee': 'ING-SYRUP-LYCHEE',
        'fruity-soda-strawberry': 'ING-SYRUP-STRAWBERRY',
        'fruity-soda-blueberry': 'ING-SYRUP-BLUEBERRY',
        'fruity-soda-green-apple': 'ING-SYRUP-GREEN-APPLE',
        'fruity-soda-mango': 'ING-SYRUP-MANGO'
      };
      var selectedSyrup = sodaFlavorSkus[options.id];
      if (selectedSyrup) {
        baseRequirements = baseRequirements.map(function (req) {
          return req.sku === 'ING-SODA-SYRUP' ? { sku: selectedSyrup, qty: req.qty } : req;
        });
      }
    }

    // Handle combo shake flavor swap
    if (productId.indexOf('pasta-combo') !== -1 && options && options.id === 'graham-shake-avocado-graham') {
      baseRequirements = baseRequirements.map(function (req) {
        if (req.sku === 'ING-MANGO-PUREE') {
          return { sku: 'ING-AVOCADO-PUREE', qty: req.qty };
        }
        return req;
      });
    }

    // Add-on requirements
    if (Array.isArray(addOns)) {
      addOns.forEach(function (addon) {
        var addId = typeof addon === 'string' ? addon : (addon.id || addon.name || '');
        // Match the most specific key first (for example japanese-siomai
        // before siomai) so add-ons never consume the wrong ingredient.
        var keys = Object.keys(ADDON_RECIPE_MAP).sort(function (a, b) { return b.length - a.length; });
        for (var index = 0; index < keys.length; index += 1) {
          var key = keys[index];
          if (addId.indexOf(key) !== -1 || (addon.name && addon.name.toLowerCase().indexOf(key.replace(/-/g, ' ')) !== -1)) {
            ADDON_RECIPE_MAP[key].forEach(function (req) {
              baseRequirements.push({ sku: req.sku, qty: req.qty });
            });
            break;
          }
        }
      });
    }

    return baseRequirements;
  }

  /**
   * Calculates aggregated ingredients needed for an entire order
   */
  function calculateOrderIngredients(order) {
    var items = (order && order.items) || [];
    var aggregated = {}; // sku -> { sku, name, unit, quantity }

    var inv = readInventory();
    var skuToItem = {};
    inv.items.forEach(function (it) { skuToItem[it.sku] = it; });

    items.forEach(function (orderItem) {
      var prodId = orderItem.productId || orderItem.id;
      var qty = Number(orderItem.quantity || 1);
      var recipe = getProductRecipe(prodId, orderItem.selectedOption, orderItem.selectedAddOns);

      recipe.forEach(function (req) {
        var needed = req.qty * qty;
        if (!aggregated[req.sku]) {
          var master = skuToItem[req.sku] || { name: req.sku, unit: 'units' };
          aggregated[req.sku] = {
            sku: req.sku,
            itemId: master.id,
            name: master.name,
            unit: master.unit,
            quantity: 0
          };
        }
        aggregated[req.sku].quantity += needed;
      });
    });

    return Object.keys(aggregated).map(function (sku) {
      var entry = aggregated[sku];
      entry.quantity = Math.round(entry.quantity * 1000) / 1000;
      return entry;
    });
  }

  /**
   * Checks if an order or list of requirements can be fulfilled with current stock
   */
  function checkIngredientsAvailability(orderOrRequirements) {
    var requirements = Array.isArray(orderOrRequirements) ? orderOrRequirements : calculateOrderIngredients(orderOrRequirements);
    var inv = readInventory();
    var skuToItem = {};
    inv.items.forEach(function (it) { skuToItem[it.sku] = it; });

    var missing = [];
    requirements.forEach(function (req) {
      var item = skuToItem[req.sku];
      var currentStock = item ? Number(item.stock) : 0;
      if (currentStock < req.quantity) {
        missing.push({
          sku: req.sku,
          name: item ? item.name : req.sku,
          unit: item ? item.unit : '',
          required: req.quantity,
          available: currentStock,
          shortage: Math.round((req.quantity - currentStock) * 1000) / 1000
        });
      }
    });

    return {
      available: missing.length === 0,
      missing: missing
    };
  }

  /**
   * Deducts ingredients when kitchen starts preparing an order
   */
  function deductOrderIngredients(order) {
    if (!order) return { success: false, reason: 'Invalid order' };
    if (order.inventoryDeducted) {
      return { success: false, reason: 'Ingredients already deducted for this order' };
    }

    var requirements = calculateOrderIngredients(order);
    if (requirements.length === 0) {
      order.inventoryDeducted = true;
      order.inventoryDeductedAt = new Date().toISOString();
      return { success: true, deducted: [] };
    }

    var availability = checkIngredientsAvailability(requirements);
    if (!availability.available) {
      return {
        success: false,
        reason: 'Insufficient inventory for this order',
        missing: availability.missing
      };
    }

    var inv = readInventory();
    var nowIso = new Date().toISOString();
    var orderRef = order.orderNumber || ('ORD-' + order.id);
    var deductedRecords = [];

    requirements.forEach(function (req) {
      var item = inv.items.find(function (it) { return it.sku === req.sku; });
      if (item) {
        item.stock = Math.round((Number(item.stock) - req.quantity) * 1000) / 1000;
        var tx = {
          id: Date.now() + Math.floor(Math.random() * 1000),
          itemId: Number(item.id),
          sku: item.sku,
          type: 'OUT',
          quantity: req.quantity,
          reason: 'Order Prep ' + orderRef,
          source: 'ORDER',
          orderId: order.id,
          batch: item.sku + '-PREP',
          stockAfter: item.stock,
          status: 'POSTED',
          date: nowIso
        };
        inv.transactions.push(tx);
        deductedRecords.push({
          sku: item.sku,
          name: item.name,
          quantity: req.quantity,
          unit: item.unit,
          balanceAfter: item.stock
        });
      }
    });

    writeInventory(inv);
    order.inventoryDeducted = true;
    order.inventoryDeductedAt = nowIso;
    order.consumedIngredients = deductedRecords;

    return {
      success: true,
      deducted: deductedRecords
    };
  }

  /**
   * Restores ingredients when an in-prep order is cancelled or corrected
   */
  function restoreOrderIngredients(order, reason) {
    if (!order || !order.inventoryDeducted) {
      return { success: false, reason: 'No inventory was deducted for this order' };
    }

    var requirements = calculateOrderIngredients(order);
    var inv = readInventory();
    var nowIso = new Date().toISOString();
    var orderRef = order.orderNumber || ('ORD-' + order.id);
    var restored = [];

    requirements.forEach(function (req) {
      var item = inv.items.find(function (it) { return it.sku === req.sku; });
      if (item) {
        item.stock = Math.round((Number(item.stock) + req.quantity) * 1000) / 1000;
        inv.transactions.push({
          id: Date.now() + Math.floor(Math.random() * 1000),
          itemId: Number(item.id),
          sku: item.sku,
          type: 'IN',
          quantity: req.quantity,
          reason: 'Restock Cancelled ' + orderRef + (reason ? ' (' + reason + ')' : ''),
          source: 'ORDER',
          orderId: order.id,
          batch: item.sku + '-RESTOCK',
          stockAfter: item.stock,
          status: 'POSTED',
          date: nowIso
        });
        restored.push({
          sku: item.sku,
          name: item.name,
          quantity: req.quantity,
          unit: item.unit,
          balanceAfter: item.stock
        });
      }
    });

    writeInventory(inv);
    order.inventoryDeducted = false;
    order.inventoryRestoredAt = nowIso;

    return {
      success: true,
      restored: restored
    };
  }

  /**
   * Checks if any required ingredient for a product is completely depleted (stock <= 0)
   */
  function getMissingIngredientsForProduct(productId, quantity) {
    var recipe = getProductRecipe(productId);
    if (!recipe || recipe.length === 0) return [];

    var requestedQuantity = Math.max(1, Number(quantity) || 1);

    var inv = readInventory();
    var skuToItem = {};
    inv.items.forEach(function (it) { skuToItem[it.sku] = it; });

    var missing = [];
    recipe.forEach(function (req) {
      var item = skuToItem[req.sku];
      var requiredQuantity = Math.round(Number(req.qty || req.quantity || 0) * requestedQuantity * 1000) / 1000;
      var availableQuantity = item ? Number(item.stock) : 0;
      if (!item || availableQuantity < requiredQuantity) {
        missing.push({
          sku: req.sku,
          name: item ? item.name : req.sku,
          stock: availableQuantity,
          required: requiredQuantity,
          shortage: Math.round((requiredQuantity - availableQuantity) * 1000) / 1000
        });
      }
    });

    return missing;
  }

  function isProductInStock(productId) {
    return getMissingIngredientsForProduct(productId).length === 0;
  }

  function resetToDefaultInventory() {
    var initial = ensureOpeningBalanceTransactions({
      items: JSON.parse(JSON.stringify(DEFAULT_ITEMS)),
      transactions: JSON.parse(JSON.stringify(DEFAULT_TRANSACTIONS))
    });
    writeInventory(initial);
    return initial;
  }

  return {
    STORAGE_KEY: STORAGE_KEY,
    RECIPE_STORAGE_KEY: RECIPE_STORAGE_KEY,
    DEFAULT_ITEMS: DEFAULT_ITEMS,
    DEFAULT_TRANSACTIONS: DEFAULT_TRANSACTIONS,
    ensureOpeningBalanceTransactions: ensureOpeningBalanceTransactions,
    RECIPE_MAP: RECIPE_MAP,
    ADDON_RECIPE_MAP: ADDON_RECIPE_MAP,
    readInventory: readInventory,
    writeInventory: writeInventory,
    getInventoryItems: getInventoryItems,
    getItemBySku: getItemBySku,
    getItemById: getItemById,
    getLowStockItems: getLowStockItems,
    updateInventoryItem: updateInventoryItem,
    addInventoryItem: addInventoryItem,
    recordStockIn: recordStockIn,
    getInventoryMetrics: getInventoryMetrics,
    readRecipeOverrides: readRecipeOverrides,
    saveProductRecipe: saveProductRecipe,
    deleteProductRecipe: deleteProductRecipe,
    getProductRecipe: getProductRecipe,
    calculateOrderIngredients: calculateOrderIngredients,
    checkIngredientsAvailability: checkIngredientsAvailability,
    deductOrderIngredients: deductOrderIngredients,
    restoreOrderIngredients: restoreOrderIngredients,
    getMissingIngredientsForProduct: getMissingIngredientsForProduct,
    isProductInStock: isProductInStock,
    resetToDefaultInventory: resetToDefaultInventory
  };
});
