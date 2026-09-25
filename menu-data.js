'use strict';
(function () {

  // Owner-approved menu names and prices transcribed from the supplied menu boards.
  // Market-based starter picks. Replace or reorder these when owner sales data is available.
  var POPULAR_PRODUCT_IDS = [
    'rice-meals-tapsilog',
    'special-pasta-spaghetti',
    'special-burger-special-burger',
    'iced-coffee-caramel-macchiato'
  ];

  // Product image paths and descriptive alt text for Rice Meals
  var PRODUCT_IMAGES = {
    'rice-meals-tapsilog': {
      webp: 'assets/images/products/rice-meals/rice-tapsilog.webp',
      jpg: 'assets/images/products/rice-meals/rice-tapsilog.webp'
    },
    'rice-meals-hotsilog': {
      webp: 'assets/images/products/rice-meals/rice-hotsilog.webp',
      jpg: 'assets/images/products/rice-meals/rice-hotsilog.webp'
    },
    'rice-meals-longsilog': {
      webp: 'assets/images/products/rice-meals/rice-longsilog.webp',
      jpg: 'assets/images/products/rice-meals/rice-longsilog.webp'
    },
    'rice-meals-macaosilog': {
      webp: 'assets/images/products/rice-meals/rice-macaosilog.webp',
      jpg: 'assets/images/products/rice-meals/rice-macaosilog.webp'
    },
    'rice-meals-balonsilog': {
      webp: 'assets/images/products/rice-meals/rice-balonsilog.webp',
      jpg: 'assets/images/products/rice-meals/rice-balonsilog.webp'
    },
    'rice-meals-siomaisilog': {
      webp: 'assets/images/products/rice-meals/rice-siomaisilog.webp',
      jpg: 'assets/images/products/rice-meals/rice-siomaisilog.webp'
    },
    'rice-meals-hungariansilog': {
      webp: 'assets/images/products/rice-meals/rice-hungariansilog.webp',
      jpg: 'assets/images/products/rice-meals/rice-hungariansilog.webp'
    },
    'rice-meals-bangsilog': {
      webp: 'assets/images/products/rice-meals/rice-bangsilog.webp',
      jpg: 'assets/images/products/rice-meals/rice-bangsilog.webp'
    },
    'rice-meals-porksilog': {
      webp: 'assets/images/products/rice-meals/rice-porksilog.webp',
      jpg: 'assets/images/products/rice-meals/rice-porksilog.webp'
    },
    'rice-meals-shanghai-silog': {
      webp: 'assets/images/products/rice-meals/rice-shanghai-silog.webp',
      jpg: 'assets/images/products/rice-meals/rice-shanghai-silog.webp'
    },
    'rice-meals-chixsilog': {
      webp: 'assets/images/products/rice-meals/rice-chixsilog.webp',
      jpg: 'assets/images/products/rice-meals/rice-chixsilog.webp'
    },
    'rice-meals-spamsilog': {
      webp: 'assets/images/products/rice-meals/rice-spamsilog.webp',
      jpg: 'assets/images/products/rice-meals/rice-spamsilog.webp'
    },
    'special-pasta-palabok': {
      webp: 'assets/images/products/special-pasta/pasta-palabok.webp',
      jpg: 'assets/images/products/special-pasta/pasta-palabok.webp'
    },
    'special-pasta-spaghetti': {
      webp: 'assets/images/products/special-pasta/pasta-spaghetti.webp',
      jpg: 'assets/images/products/special-pasta/pasta-spaghetti.webp'
    },
    'special-pasta-pancit-canton': {
      webp: 'assets/images/products/special-pasta/pasta-pancit-canton.webp',
      jpg: 'assets/images/products/special-pasta/pasta-pancit-canton.webp'
    },
    'special-pasta-pancit-bihon': {
      webp: 'assets/images/products/special-pasta/pasta-pancit-bihon.webp',
      jpg: 'assets/images/products/special-pasta/pasta-pancit-bihon.webp'
    },
    'special-burger-special-burger': {
      webp: 'assets/images/products/special-burger/burger-special.webp',
      jpg: 'assets/images/products/special-burger/burger-special.webp'
    },
    'special-burger-special-burger-with-fries': {
      webp: 'assets/images/products/special-burger/burger-special-with-fries.webp',
      jpg: 'assets/images/products/special-burger/burger-special-with-fries.webp'
    },
    'special-burger-aloha-burger': {
      webp: 'assets/images/products/special-burger/burger-aloha.webp',
      jpg: 'assets/images/products/special-burger/burger-aloha.webp'
    },
    'special-burger-aloha-burger-with-fries': {
      webp: 'assets/images/products/special-burger/burger-aloha-with-fries.webp',
      jpg: 'assets/images/products/special-burger/burger-aloha-with-fries.webp'
    },
    'silog-combo-silog-meal-combo': {
      webp: 'assets/images/products/silog-combo/Silog-Meal-Combo.png',
      jpg: 'assets/images/products/silog-combo/Silog-Meal-Combo.png'
    },
    'silog-combo-siomaisilog-combo': {
      webp: 'assets/images/products/silog-combo/Siomaisilog-Combo.png',
      jpg: 'assets/images/products/silog-combo/Siomaisilog-Combo.png'
    },
    'silog-combo-bangsilog-combo': {
      webp: 'assets/images/products/silog-combo/Bangsilog-Combo.png',
      jpg: 'assets/images/products/silog-combo/Bangsilog-Combo.png'
    },
    'silog-combo-tapsilog-combo': {
      webp: 'assets/images/products/silog-combo/Tapsilog-Combo.png',
      jpg: 'assets/images/products/silog-combo/Tapsilog-Combo.png'
    },
    'silog-combo-porksilog-combo': {
      webp: 'assets/images/products/silog-combo/Porksilog-Combo.png',
      jpg: 'assets/images/products/silog-combo/Porksilog-Combo.png'
    },
    'silog-combo-chixsilog-combo': {
      webp: 'assets/images/products/silog-combo/Chixsilog-Combo.png',
      jpg: 'assets/images/products/silog-combo/Chixsilog-Combo.png'
    },
    'pasta-combo-pancit-bihon-canton-combo': {
      webp: 'assets/images/products/pasta-combo/Canton Combo.png',
      jpg: 'assets/images/products/pasta-combo/Canton Combo.png'
    },
    'pasta-combo-palabok-combo': {
      webp: 'assets/images/products/pasta-combo/Palabok-Combo.png',
      jpg: 'assets/images/products/pasta-combo/Palabok-Combo.png'
    },
    'pasta-combo-spaghetti-combo': {
      webp: 'assets/images/products/pasta-combo/Spaghetti-Combo.png',
      jpg: 'assets/images/products/pasta-combo/Spaghetti-Combo.png'
    },
    'iced-coffee-latte': {
      webp: 'assets/images/products/iced-coffee/iced-coffee-latte.webp',
      jpg: 'assets/images/products/iced-coffee/iced-coffee-latte.webp'
    },
    'iced-coffee-caramel-macchiato': {
      webp: 'assets/images/products/iced-coffee/iced-coffee-caramel-macchiato.webp',
      jpg: 'assets/images/products/iced-coffee/iced-coffee-caramel-macchiato.webp'
    },
    'iced-coffee-spanish-latte': {
      webp: 'assets/images/products/iced-coffee/iced-coffee-spanish-latte.webp',
      jpg: 'assets/images/products/iced-coffee/iced-coffee-spanish-latte.webp'
    },
    'iced-coffee-iced-mocha': {
      webp: 'assets/images/products/iced-coffee/iced-coffee-iced-mocha.webp',
      jpg: 'assets/images/products/iced-coffee/iced-coffee-iced-mocha.webp'
    },
    'iced-coffee-vietnamese-latte': {
      webp: 'assets/images/products/iced-coffee/iced-coffee-vietnamese-latte.webp',
      jpg: 'assets/images/products/iced-coffee/iced-coffee-vietnamese-latte.webp'
    },
    'iced-coffee-salted-caramel': {
      webp: 'assets/images/products/iced-coffee/iced-coffee-salted-caramel.webp',
      jpg: 'assets/images/products/iced-coffee/iced-coffee-salted-caramel.webp'
    },
    'milk-tea-taro': {
      webp: 'assets/images/products/milk-tea/milk-tea-taro.webp',
      jpg: 'assets/images/products/milk-tea/milk-tea-taro.jpg'
    },
    'milk-tea-okinawa': {
      webp: 'assets/images/products/milk-tea/milk-tea-okinawa.webp',
      jpg: 'assets/images/products/milk-tea/milk-tea-okinawa.jpg'
    },
    'milk-tea-wintermelon': {
      webp: 'assets/images/products/milk-tea/milk-tea-wintermelon.webp',
      jpg: 'assets/images/products/milk-tea/milk-tea-wintermelon.jpg'
    },
    'milk-tea-cookies-n-cream': {
      webp: 'assets/images/products/milk-tea/milk-tea-cookies-n-cream.webp',
      jpg: 'assets/images/products/milk-tea/milk-tea-cookies-n-cream.jpg'
    },
    'milk-tea-choco-kisses': {
      webp: 'assets/images/products/milk-tea/milk-tea-choco-kisses.webp',
      jpg: 'assets/images/products/milk-tea/milk-tea-choco-kisses.jpg'
    },
    'milk-tea-matcha-milk-tea': {
      webp: 'assets/images/products/milk-tea/milk-tea-matcha-milk-tea.webp',
      jpg: 'assets/images/products/milk-tea/milk-tea-matcha-milk-tea.jpg'
    },
    'yakult-series-strawberry-yakult': {
      webp: 'assets/images/products/yakult-series/yakult-strawberry.webp',
      jpg: 'assets/images/products/yakult-series/yakult-strawberry.webp'
    },
    'yakult-series-green-apple-yakult': {
      webp: 'assets/images/products/yakult-series/yakult-green-apple.webp',
      jpg: 'assets/images/products/yakult-series/yakult-green-apple.webp'
    },
    'yakult-series-mango-yakult-splash': {
      webp: 'assets/images/products/yakult-series/yakult-mango-splash.webp',
      jpg: 'assets/images/products/yakult-series/yakult-mango-splash.jpg'
    },
    'yakult-series-blueberry-yakult': {
      webp: 'assets/images/products/yakult-series/yakult-blueberry.webp',
      jpg: 'assets/images/products/yakult-series/yakult-blueberry.webp'
    },
    'yakult-series-lychee-yakult': {
      webp: 'assets/images/products/yakult-series/yakult-lychee.webp',
      jpg: 'assets/images/products/yakult-series/yakult-lychee.webp'
    },
    'frappe-choco-lava': {
      jpg: 'assets/images/products/frappe/Choco-Lava.png'
    },
    'frappe-oreo-cream': {
      jpg: 'assets/images/products/frappe/Oreo-Cream.png'
    },
    'frappe-matcha-craze': {
      jpg: 'assets/images/products/frappe/Matcha-Craze.png'
    },
    'frappe-ube-craze': {
      jpg: 'assets/images/products/frappe/Ube-Craze.png'
    },
    'frappe-strawberry-dunk': {
      jpg: 'assets/images/products/frappe/Strawberry-Dunk.png'
    },
    'frappe-mango-graham': {
      jpg: 'assets/images/products/frappe/Mango-Graham.png'
    },
    'frappe-avocado-graham': {
      jpg: 'assets/images/products/frappe/Avocado-Graham.png'
    },
    'matcha-series-matcha-espresso': {
      jpg: 'assets/images/products/matcha-series/Matcha-Espresso.png'
    },
    'matcha-series-matcha-strawberry': {
      jpg: 'assets/images/products/matcha-series/Matcha-Strawberry.png'
    },
    'matcha-series-matcha-ube': {
      jpg: 'assets/images/products/matcha-series/Matcha-Ube.png'
    },
    'shaken-tea-mango-tea': {
      jpg: 'assets/images/products/shaken-tea/Mango-Tea.png'
    },
    'shaken-tea-blueberry-tea': {
      jpg: 'assets/images/products/shaken-tea/Blueberry-Tea.png'
    },
    'shaken-tea-lychee-tea': {
      jpg: 'assets/images/products/shaken-tea/Lychee-Tea.png'
    },
    'shaken-tea-mixed-berries-tea': {
      jpg: 'assets/images/products/shaken-tea/Mixed-Berries-Tea.png'
    },
    'fruity-soda-lychee-soda': {
      jpg: 'assets/images/products/fruity-soda/Lychee-Soda.png'
    },
    'fruity-soda-strawberry-soda': {
      jpg: 'assets/images/products/fruity-soda/Strawberry-Soda.png'
    },
    'fruity-soda-blueberry-soda': {
      jpg: 'assets/images/products/fruity-soda/Blueberry-Soda.png'
    },
    'fruity-soda-green-apple-soda': {
      jpg: 'assets/images/products/fruity-soda/Green-Apple-Soda.png'
    },
    'fruity-soda-mango-soda': {
      jpg: 'assets/images/products/fruity-soda/Mango-Soda.png'
    },
    'frostee-series-lychee-frostee': {
      jpg: 'assets/images/products/frostee-series/Lychee-Frostee.png'
    },
    'frostee-series-strawberry-frostee': {
      jpg: 'assets/images/products/frostee-series/Strawberry-Frostee.png'
    },
    'frostee-series-blueberry-frostee': {
      jpg: 'assets/images/products/frostee-series/Blueberry-Frostee.png'
    },
    'frostee-series-green-apple-frostee': {
      jpg: 'assets/images/products/frostee-series/Green-Apple-Frostee.png'
    },
    'frostee-series-mango-frostee': {
      jpg: 'assets/images/products/frostee-series/Mango-Frostee.png'
    }
  };

  var PRODUCT_ALTS = {
    'rice-meals-tapsilog': 'Tapsilog - Tender savory beef tapa strips served with garlic fried rice and sunny-side-up egg',
    'rice-meals-hotsilog': 'Hotsilog - Diagonally scored classic red hotdogs served with garlic fried rice and sunny-side-up egg',
    'rice-meals-longsilog': 'Longsilog - Savory caramelized pork longganisa sausages served with garlic fried rice and sunny-side-up egg',
    'rice-meals-macaosilog': 'Macaosilog - Sweet and savory sliced Macao sausage served with garlic fried rice and sunny-side-up egg',
    'rice-meals-balonsilog': 'Balonsilog - Pan-fried round bologna slices with golden edges served with garlic fried rice and sunny-side-up egg',
    'rice-meals-siomaisilog': 'Siomaisilog - Steamed pork siomai dumplings with chili garlic oil and fresh calamansi, served with garlic fried rice and sunny-side-up egg',
    'rice-meals-hungariansilog': 'Hungariansilog - Smoky sliced Hungarian sausage served with garlic fried rice and sunny-side-up egg',
    'rice-meals-bangsilog': 'Bangsilog - Crispy pan-fried marinated boneless daing na bangus with calamansi, served with garlic fried rice and sunny-side-up egg',
    'rice-meals-porksilog': 'Porksilog - Tender golden-brown pan-fried pork chop served with garlic fried rice and sunny-side-up egg',
    'rice-meals-shanghai-silog': 'Shanghai Silog - Crispy lumpiang Shanghai spring rolls with sweet chili sauce, served with garlic fried rice and sunny-side-up egg',
    'rice-meals-chixsilog': 'Chixsilog - Golden crispy fried chicken leg quarter served with garlic fried rice and sunny-side-up egg',
    'rice-meals-spamsilog': 'Spamsilog - Pan-fried savory SPAM luncheon meat slices served with garlic fried rice and sunny-side-up egg',
    'special-pasta-palabok': 'Filipino palabok with orange shrimp sauce, crushed chicharon, shrimp, sliced egg, spring onions, and calamansi',
    'special-pasta-spaghetti': 'Filipino-style sweet spaghetti with red sauce, sliced hotdogs, ground meat, and grated cheese',
    'special-pasta-pancit-canton': 'Filipino pancit canton with yellow egg noodles, chicken, carrots, cabbage, spring onions, and calamansi',
    'special-pasta-pancit-bihon': 'Filipino pancit bihon with thin rice noodles, chicken, carrots, cabbage, spring onions, and calamansi',
    'special-burger-special-burger': 'Corner Cravings Special Burger with sesame bun, savory patty, shredded cabbage, cheese, and creamy house sauce',
    'special-burger-special-burger-with-fries': 'Corner Cravings Special Burger with shredded cabbage and cheese, served with golden fries and dipping sauce',
    'special-burger-aloha-burger': 'Corner Cravings Aloha Burger with savory patty, pineapple, shredded cabbage, cheese, and creamy house sauce',
    'special-burger-aloha-burger-with-fries': 'Corner Cravings Aloha Burger with pineapple and cheese, served with golden fries and dipping sauce',
    'silog-combo-silog-meal-combo': 'Hotsilog combo with Filipino red hotdogs, garlic fried rice, fried egg, green fruity soda, and graham bar',
    'silog-combo-siomaisilog-combo': 'Siomaisilog with garlic rice and fried egg, served with a 12-ounce fruity soda and graham bar',
    'silog-combo-bangsilog-combo': 'Bangsilog with fried milkfish, garlic rice, and fried egg, served with a 12-ounce fruity soda and graham bar',
    'silog-combo-tapsilog-combo': 'Tapsilog with beef tapa, garlic rice, and fried egg, served with a 12-ounce fruity soda and graham bar',
    'silog-combo-porksilog-combo': 'Porksilog with pork chop, garlic rice, and fried egg, served with a 12-ounce fruity soda and graham bar',
    'silog-combo-chixsilog-combo': 'Chixsilog with crispy fried chicken, garlic rice, and fried egg, served with a 12-ounce fruity soda and graham bar',
    'pasta-combo-pancit-bihon-canton-combo': 'Pancit Canton representative combo with vegetables and calamansi, served with a choice of Mango or Avocado Graham Shake',
    'pasta-combo-palabok-combo': 'Filipino palabok with orange sauce, shrimp, chicharon, egg, and calamansi, served with a choice of Mango or Avocado Graham Shake',
    'pasta-combo-spaghetti-combo': 'Filipino-style sweet spaghetti with red meat sauce, sliced hotdogs, and grated cheese, served with a choice of Mango or Avocado Graham Shake',
    'iced-coffee-latte': 'Iced latte with espresso, creamy milk, clear ice, and natural coffee swirls',
    'iced-coffee-caramel-macchiato': 'Iced caramel macchiato with creamy milk, espresso, caramel ribbons, and clear ice',
    'iced-coffee-spanish-latte': 'Creamy iced Spanish latte with espresso, condensed milk, and clear ice',
    'iced-coffee-iced-mocha': 'Iced mocha with espresso, milk, chocolate streaks, and clear ice',
    'iced-coffee-vietnamese-latte': 'Vietnamese iced latte with strong dark coffee, condensed milk, and clear ice',
    'iced-coffee-salted-caramel': 'Salted caramel iced coffee with espresso, creamy milk, golden caramel ribbons, and clear ice',
    'milk-tea-taro': 'Taro Milk Tea with creamy purple taro, milk swirl marbling, clear ice, and chewy black boba pearls',
    'milk-tea-okinawa': 'Okinawa Milk Tea with roasted brown sugar caramel tiger stripes, creamy milk tea, and chewy black boba pearls',
    'milk-tea-wintermelon': 'Wintermelon Milk Tea with caramelized wintermelon brewed tea, smooth cream blend, clear ice, and chewy black boba pearls',
    'milk-tea-cookies-n-cream': 'Cookies N’ Cream Milk Tea with rich vanilla milk tea, crushed dark Oreo cookies, chocolate drizzle, and chewy black boba pearls',
    'milk-tea-choco-kisses': 'Choco Kisses Milk Tea with rich milk chocolate tea, chocolate drizzle ribbons, creamy swirls, and chewy black boba pearls',
    'milk-tea-matcha-milk-tea': 'Matcha Milk Tea with vibrant ceremonial green matcha layered over fresh creamy milk and chewy black boba pearls',
    'yakult-series-strawberry-yakult': 'Strawberry Yakult with ruby-red strawberry fruit tea, cloudy probiotic yogurt swirls, and an inverted mini Yakult bottle',
    'yakult-series-green-apple-yakult': 'Green Apple Yakult with crisp electric green apple tea, cloudy probiotic yogurt swirls, and an inverted mini Yakult bottle',
    'yakult-series-mango-yakult-splash': 'Mango Yakult Splash with golden-orange mango nectar tea, cloudy probiotic yogurt swirls, and an inverted mini Yakult bottle',
    'yakult-series-blueberry-yakult': 'Blueberry Yakult with deep violet blueberry tea, whole blueberries, cloudy probiotic yogurt swirls, and an inverted mini Yakult bottle',
    'yakult-series-lychee-yakult': 'Lychee Yakult with delicate translucent lychee fruit tea, chewy nata de coco jelly, cloudy probiotic yogurt swirls, and an inverted mini Yakult bottle',
    'frappe-choco-lava': 'Choco Lava frappe with a rich chocolate blend, chocolate drizzle, and crushed chocolate topping',
    'frappe-oreo-cream': 'Oreo Cream frappe with a creamy vanilla blend, crushed chocolate cookies, and cookie crumb topping',
    'frappe-matcha-craze': 'Matcha Craze frappe with a creamy green matcha blend and a smooth whipped topping',
    'frappe-ube-craze': 'Ube Craze frappe with a creamy purple ube blend and a smooth whipped topping',
    'frappe-strawberry-dunk': 'Strawberry Dunk frappe with a creamy strawberry blend and bright strawberry flavor',
    'frappe-mango-graham': 'Mango Graham frappe with ripe mango, creamy graham blend, caramel drizzle, and graham crumbs',
    'frappe-avocado-graham': 'Avocado Graham frappe with creamy avocado, graham layers, caramel drizzle, and graham crumbs',
    'matcha-series-matcha-espresso': 'Iced Matcha Espresso with creamy green matcha, fresh milk, espresso, and clear ice',
    'matcha-series-matcha-strawberry': 'Iced Matcha Strawberry with creamy green matcha, fresh milk, strawberry puree, and clear ice',
    'matcha-series-matcha-ube': 'Iced Matcha Ube with creamy green matcha, fresh milk, purple ube, and clear ice',
    'shaken-tea-mango-tea': 'Iced shaken mango tea with golden mango flavor, brewed tea, and clear ice',
    'shaken-tea-blueberry-tea': 'Iced shaken blueberry tea with deep berry flavor, brewed tea, and clear ice',
    'shaken-tea-lychee-tea': 'Iced shaken lychee tea with delicate floral fruit flavor, brewed tea, and clear ice',
    'shaken-tea-mixed-berries-tea': 'Iced shaken mixed berries tea with strawberry, blueberry, and raspberry flavors over clear ice',
    'fruity-soda-lychee-soda': 'Sparkling lychee soda served cold with clear ice in a takeaway cup',
    'fruity-soda-strawberry-soda': 'Sparkling strawberry soda served cold with clear ice in a takeaway cup',
    'fruity-soda-blueberry-soda': 'Sparkling blueberry soda served cold with clear ice in a takeaway cup',
    'fruity-soda-green-apple-soda': 'Sparkling green apple soda served cold with clear ice in a takeaway cup',
    'fruity-soda-mango-soda': 'Sparkling mango soda served cold with clear ice in a takeaway cup',
    'frostee-series-lychee-frostee': 'Icy lychee Frostee with a smooth fruit-flavored slush texture in a takeaway cup',
    'frostee-series-strawberry-frostee': 'Icy strawberry Frostee with a smooth fruit-flavored slush texture in a takeaway cup',
    'frostee-series-blueberry-frostee': 'Icy blueberry Frostee with a smooth fruit-flavored slush texture in a takeaway cup',
    'frostee-series-green-apple-frostee': 'Icy green apple Frostee with a smooth fruit-flavored slush texture in a takeaway cup',
    'frostee-series-mango-frostee': 'Icy mango Frostee with a smooth fruit-flavored slush texture in a takeaway cup'
  };

  var riceAddons = [
    { id: 'extra-rice', name: 'Extra Plain or Fried Rice', price: 15 },
    { id: 'extra-egg', name: 'Extra Egg', price: 15 },
    { id: 'siomai', name: 'Siomai (1 pc)', price: 5 },
    { id: 'japanese-siomai', name: 'Japanese Siomai (1 pc)', price: 8 },
    { id: 'chili-garlic-oil', name: 'House Chili Garlic Oil', price: 10 },
    { id: 'atchara', name: 'Atchara (Pickled Papaya)', price: 15 },
    { id: 'garlic-bits', name: 'Crispy Garlic Bits', price: 10 },
    { id: 'gravy', name: 'Savory Gravy Cup', price: 15 },
    { id: 'tomato-cucumber', name: 'Sliced Tomato & Cucumber', price: 15 },
    { id: 'extra-hotdog', name: 'Extra Red Hotdog (1 pc)', price: 25 },
    { id: 'extra-longganisa', name: 'Extra Pork Longganisa (1 pc)', price: 25 },
    { id: 'extra-tapa', name: 'Extra Beef Tapa Portion', price: 50 }
  ];
  var pastaAddons = [
    { id: 'extra-sauce', name: 'Extra Sauce', price: 15 },
    { id: 'extra-cheese', name: 'Extra Cheese', price: 15 },
    { id: 'garlic-bread', name: 'Toasted Garlic Bread (2 pcs)', price: 25 },
    { id: 'calamansi', name: 'Fresh Calamansi (2 pcs)', price: 10 },
    { id: 'crushed-chicharon', name: 'Extra Crushed Chicharon', price: 15 },
    { id: 'boiled-egg', name: 'Sliced Hard-Boiled Egg (1 pc)', price: 15 },
    { id: 'extra-hotdog-slices', name: 'Extra Sliced Hotdogs', price: 20 }
  ];
  var burgerAddons = [
    { id: 'extra-cheese', name: 'Extra Cheese', price: 15 },
    { id: 'extra-fries', name: 'Add Fries', price: 20 },
    { id: 'extra-patty', name: 'Extra Burger Patty', price: 45 },
    { id: 'bacon-strips', name: 'Crispy Bacon Strips (2 pcs)', price: 35 },
    { id: 'fried-egg', name: 'Sunny-Side Fried Egg', price: 15 },
    { id: 'pineapple-ring', name: 'Grilled Pineapple Ring', price: 20 },
    { id: 'jalapeno-slices', name: 'Pickled Jalapeño Slices', price: 15 },
    { id: 'garlic-mayo-dip', name: 'Creamy Garlic Mayo Dip', price: 15 },
    { id: 'cheese-dip', name: 'Warm Cheese Dip', price: 18 }
  ];
  var coffeeAddons = [
    { id: 'extra-espresso', name: 'Extra Espresso Shot', price: 20 },
    { id: 'coffee-jelly', name: 'Coffee Jelly Cubes', price: 15 },
    { id: 'vanilla-syrup', name: 'Vanilla Syrup Pump', price: 15 },
    { id: 'caramel-syrup', name: 'Caramel Syrup Pump', price: 15 },
    { id: 'hazelnut-syrup', name: 'Hazelnut Syrup Pump', price: 15 },
    { id: 'sea-salt-foam', name: 'Sea Salt Cold Foam', price: 20 },
    { id: 'caramel-drizzle', name: 'Caramel Drizzle', price: 10 }
  ];
  var milkTeaAddons = [
    { id: 'pearl', name: 'Chewy Tapioca Pearls', price: 15 },
    { id: 'egg-pudding', name: 'Silky Egg Pudding', price: 20 },
    { id: 'cream-cheese', name: 'Cream Cheese Foam', price: 20 },
    { id: 'oreo-crumbs', name: 'Crushed Oreo Crumbs', price: 15 },
    { id: 'grass-jelly', name: 'Grass Jelly', price: 15 },
    { id: 'nata', name: 'Nata de Coco', price: 15 }
  ];
  var fruitDrinkAddons = [
    { id: 'popping-boba', name: 'Popping Boba', price: 18 },
    { id: 'nata', name: 'Nata de Coco', price: 15 },
    { id: 'rainbow-jelly', name: 'Rainbow Fruit Jelly', price: 15 },
    { id: 'chia-seeds', name: 'Chia Seeds', price: 12 },
    { id: 'extra-yakult', name: 'Extra Yakult Bottle Shot', price: 20 },
    { id: 'lemon-slices', name: 'Fresh Lemon / Calamansi Slices', price: 10 }
  ];
  var frappeAddons = [
    { id: 'whipped-cream', name: 'Whipped Cream Top', price: 18 },
    { id: 'graham-crumbs', name: 'Crushed Graham Crumbs', price: 15 },
    { id: 'oreo-crumbs', name: 'Crushed Oreo Crumbs', price: 15 },
    { id: 'chocolate-drizzle', name: 'Hershey’s Chocolate Drizzle', price: 10 },
    { id: 'caramel-drizzle', name: 'Caramel Drizzle', price: 10 },
    { id: 'extra-espresso', name: 'Espresso Shot (Affogato Style)', price: 20 }
  ];
  var matchaAddons = [
    { id: 'extra-matcha', name: 'Extra Matcha Shot', price: 25 },
    { id: 'cream-cheese', name: 'Cream Cheese Foam', price: 20 },
    { id: 'red-bean', name: 'Sweet Red Bean (Azuki)', price: 20 },
    { id: 'pearl', name: 'Chewy Tapioca Pearls', price: 15 },
    { id: 'strawberry-swirl', name: 'Strawberry Puree Swirl', price: 20 }
  ];
  var beverageAddons = [
    { id: 'cream-cheese', name: 'Cream Cheese Foam', price: 20 },
    { id: 'espresso', name: 'Extra Espresso', price: 20 },
    { id: 'popping-boba', name: 'Popping Boba', price: 18 },
    { id: 'nata', name: 'Nata de Coco', price: 15 },
    { id: 'pearl', name: 'Chewy Tapioca Pearls', price: 15 }
  ];
  var fruitySodaFlavors = [
    { id: 'lychee', name: 'Lychee', priceDiff: 0 },
    { id: 'strawberry', name: 'Strawberry', priceDiff: 0 },
    { id: 'blueberry', name: 'Blueberry', priceDiff: 0 },
    { id: 'green-apple', name: 'Green Apple', priceDiff: 0 },
    { id: 'mango', name: 'Mango', priceDiff: 0 }
  ];
  var grahamShakeFlavors = [
    { id: 'mango-graham', name: 'Mango Graham Shake', priceDiff: 0 },
    { id: 'avocado-graham', name: 'Avocado Graham Shake', priceDiff: 0 }
  ];

  var categoryDescriptions = {
    'rice-meals': 'A filling Filipino rice meal served with savory meat, garlic rice, and egg.',
    'special-pasta': 'A comforting noodle favorite prepared with a flavorful house-style sauce.',
    'special-burger': 'A freshly prepared burger layered with a savory patty and classic toppings.',
    'silog-combo': 'A complete silog combo served with a 12 oz fruity soda and graham bar.',
    'pasta-combo': 'A pasta combo served with your choice of mango or avocado graham shake.',
    'iced-coffee': 'A chilled coffee drink blended for a smooth, creamy, and refreshing finish.',
    'milk-tea': 'A creamy milk tea with a balanced tea flavor and a lightly sweet finish.',
    'yakult-series': 'A fruity and tangy Yakult-based drink served cold and refreshing.',
    'frappe': 'A rich, ice-blended drink with a smooth and creamy texture.',
    'matcha-series': 'A creamy matcha drink with earthy green-tea flavor and a sweet finish.',
    'shaken-tea': 'A refreshing fruit-flavored tea shaken and served over ice.',
    'fruity-soda': 'A sparkling fruit-flavored soda served cold over ice.',
    'frostee-series': 'An icy fruit drink with a cool, slushy texture.'
  };

  // Item-specific copy keeps every Rice Meal accurate on the customer and
  // Admin sides while the category description remains a fallback elsewhere.
  var productDescriptions = {
    'rice-meals-tapsilog': 'Tender, savory beef tapa with fragrant garlic fried rice and a sunny-side-up egg for a satisfying Filipino breakfast classic.',
    'rice-meals-hotsilog': 'Pan-fried Filipino red hotdogs served with fragrant garlic fried rice and a sunny-side-up egg.',
    'rice-meals-longsilog': 'Sweet and savory Filipino pork longganisa, lightly caramelized and served with garlic fried rice and a sunny-side-up egg.',
    'rice-meals-macaosilog': 'Sweet and savory Macao-style sausage served with fragrant garlic fried rice and a sunny-side-up egg.',
    'rice-meals-balonsilog': 'Golden pan-fried baloney slices with lightly crisp edges, served with garlic fried rice and a sunny-side-up egg.',
    'rice-meals-siomaisilog': 'Savory pork siomai served with fragrant garlic fried rice, a sunny-side-up egg, chili garlic oil, and calamansi.',
    'rice-meals-hungariansilog': 'Smoky, savory Hungarian sausage served with fragrant garlic fried rice and a sunny-side-up egg.',
    'rice-meals-bangsilog': 'Crispy marinated daing na bangus served with fragrant garlic fried rice, a sunny-side-up egg, and calamansi.',
    'rice-meals-porksilog': 'Tender golden-brown pork chop served with fragrant garlic fried rice and a sunny-side-up egg.',
    'rice-meals-shanghai-silog': 'Crispy lumpiang Shanghai served with fragrant garlic fried rice, a sunny-side-up egg, and sweet chili sauce.',
    'rice-meals-chixsilog': 'Crispy golden fried chicken served with fragrant garlic fried rice and a sunny-side-up egg.',
    'rice-meals-spamsilog': 'Caramelized pan-fried luncheon meat slices served with fragrant garlic fried rice and a sunny-side-up egg.',
    'special-pasta-palabok': 'Thin rice noodles covered in savory orange palabok sauce and topped with shrimp, crushed chicharon, sliced egg, spring onions, and calamansi.',
    'special-pasta-spaghetti': 'Filipino-style sweet spaghetti with rich red meat sauce, sliced red hotdogs, and a generous topping of grated cheese.',
    'special-pasta-pancit-canton': 'Stir-fried yellow egg noodles with chicken or pork, cabbage, carrots, spring onions, and a savory soy-based seasoning.',
    'special-pasta-pancit-bihon': 'Thin rice noodles stir-fried with chicken or pork, cabbage, carrots, spring onions, and a light savory seasoning.',
    'special-burger-special-burger': 'A Corner Cravings favorite made with a savory burger patty, shredded cabbage, creamy house dressing, and a soft sesame bun.',
    'special-burger-special-burger-with-fries': 'Our Special Burger served with golden straight-cut fries and creamy dipping sauce.',
    'special-burger-aloha-burger': 'Our signature burger layered with a savory patty, shredded cabbage, creamy house dressing, and a sweet pineapple ring in a soft sesame bun.',
    'special-burger-aloha-burger-with-fries': 'Our Aloha Burger with a sweet pineapple layer, served with golden straight-cut fries and creamy dipping sauce.',
    'silog-combo-silog-meal-combo': 'A classic Hotsilog meal with Filipino red hotdogs, garlic fried rice, and a sunny-side-up egg, served with one 12-ounce fruity soda and one graham bar.',
    'silog-combo-siomaisilog-combo': 'Savory pork siomai with garlic fried rice and a sunny-side-up egg, served with one 12-ounce fruity soda and one graham bar.',
    'silog-combo-bangsilog-combo': 'Crispy marinated bangus with garlic fried rice and a sunny-side-up egg, served with one 12-ounce fruity soda and one graham bar.',
    'silog-combo-tapsilog-combo': 'Tender Filipino beef tapa with garlic fried rice and a sunny-side-up egg, served with one 12-ounce fruity soda and one graham bar.',
    'silog-combo-porksilog-combo': 'A savory golden-brown pork chop with garlic fried rice and a sunny-side-up egg, served with one 12-ounce fruity soda and one graham bar.',
    'silog-combo-chixsilog-combo': 'Crispy fried chicken with garlic fried rice and a sunny-side-up egg, served with one 12-ounce fruity soda and one graham bar.',
    'pasta-combo-pancit-bihon-canton-combo': 'Choose Pancit Bihon or Pancit Canton, served with your choice of a creamy Mango Graham or Avocado Graham Shake.',
    'pasta-combo-palabok-combo': 'Savory Filipino palabok topped with shrimp, crushed chicharon, sliced egg, and spring onions, served with your choice of a Mango Graham or Avocado Graham Shake.',
    'pasta-combo-spaghetti-combo': 'Filipino-style sweet spaghetti with rich meat sauce, sliced red hotdogs, and grated cheese, served with your choice of a Mango Graham or Avocado Graham Shake.',
    'milk-tea-taro': 'Creamy and fragrant taro milk tea featuring a velvety lavender-purple blend with white cream marbling swirls and chewy black tapioca pearls.',
    'milk-tea-okinawa': 'Authentic roasted brown sugar milk tea accented with rich caramel tiger stripes dripping down the cup and chewy black tapioca pearls.',
    'milk-tea-wintermelon': 'A classic Taiwanese favorite infused with sweet caramelized wintermelon syrup, rich creamy tea, and chewy black tapioca pearls.',
    'milk-tea-cookies-n-cream': 'An indulgent sweet cream milk tea loaded with crushed dark Oreo cookie crumbles, chocolate drizzle streaks, and chewy black tapioca pearls.',
    'milk-tea-choco-kisses': 'A decadent milk chocolate tea blend laced with Hershey’s-style chocolate syrup swirls, creamy milk, and chewy black tapioca pearls.',
    'milk-tea-matcha-milk-tea': 'A visually stunning layered beverage with vibrant ceremonial green matcha floating over velvety fresh whole milk with chewy black tapioca pearls.',
    'yakult-series-strawberry-yakult': 'Sweet and tangy crushed strawberry fruit tea topped with an iconic mini Yakult bottle discharging creamy probiotic yogurt swirls into the drink.',
    'yakult-series-green-apple-yakult': 'Crisp and tart green apple tea swirled with smooth Yakult probiotic milk and translucent jelly for an invigorating, fruity refreshment.',
    'yakult-series-mango-yakult-splash': 'Rich tropical mango nectar combined with tangy Yakult probiotic milk swirls for a bright, creamy, and uplifting splash.',
    'yakult-series-blueberry-yakult': 'Plump blueberries and dark violet fruit tea infused with creamy Yakult probiotic yogurt swirls and clear ice.',
    'yakult-series-lychee-yakult': 'Fragrant and floral lychee fruit tea complemented by chewy nata de coco cubes and creamy Yakult probiotic swirls.'
  };

  var definitions = [
    ['Rice Meals', 'rice-meals', [['Tapsilog', 125], ['Hotsilog', 89], ['Longsilog', 89], ['Macaosilog', 89], ['Balonsilog', 89], ['Siomaisilog', 69], ['Hungariansilog', 89], ['Bangsilog', 109], ['Porksilog', 129], ['Shanghai Silog', 89], ['Chixsilog', 129], ['Spamsilog', 89]]],
    ['Special Pasta', 'special-pasta', [['Palabok', 109], ['Spaghetti', 125], ['Pancit Canton', 89], ['Pancit Bihon', 89]]],
    ['Special Burger', 'special-burger', [['Special Burger', 149], ['Special Burger with Fries', 169], ['Aloha Burger', 169], ['Aloha Burger with Fries', 189]]],
    ['Silog Combo Meal', 'silog-combo', [['Silog Meal Combo', 138], ['Siomaisilog Combo', 118], ['Bangsilog Combo', 158], ['Tapsilog Combo', 178], ['Porksilog Combo', 178], ['Chixsilog Combo', 178]]],
    ['Pasta Combo Meal', 'pasta-combo', [['Pancit Bihon/Canton Combo', 159], ['Palabok Combo', 169], ['Spaghetti Combo', 189]]],
    ['Iced Cold Coffee', 'iced-coffee', [['Latte', 79], ['Caramel Macchiato', 79], ['Spanish Latte', 79], ['Iced Mocha', 79], ['Vietnamese Latte', 79], ['Salted Caramel', 79]]],
    ['Milk Tea', 'milk-tea', [['Taro', 69], ['Okinawa', 69], ['Wintermelon', 69], ["Cookies N’ Cream", 69], ['Choco Kisses', 69], ['Matcha Milk Tea', 69]]],
    ['Yakult Series', 'yakult-series', [['Strawberry Yakult', 59], ['Green Apple Yakult', 59], ['Mango Yakult Splash', 59], ['Blueberry Yakult', 59], ['Lychee Yakult', 59]]],
    ['Frappe', 'frappe', [['Choco Lava', 89], ['Oreo Cream', 89], ['Matcha Craze', 89], ['Ube Craze', 89], ['Strawberry Dunk', 89], ['Mango Graham', 89], ['Avocado Graham', 89]]],
    ['Matcha Series', 'matcha-series', [['Matcha Espresso', 79], ['Matcha Strawberry', 79], ['Matcha Ube', 79]]],
    ['Iced Shaken Tea', 'shaken-tea', [['Mango Tea', 49], ['Blueberry Tea', 49], ['Lychee Tea', 49], ['Mixed Berries Tea', 49]]],
    ['Fruity Soda', 'fruity-soda', [['Lychee Soda', 49], ['Strawberry Soda', 49], ['Blueberry Soda', 49], ['Green Apple Soda', 49], ['Mango Soda', 49]]],
    ['Frostee Series', 'frostee-series', [['Lychee Frostee', 49], ['Strawberry Frostee', 49], ['Blueberry Frostee', 49], ['Green Apple Frostee', 49], ['Mango Frostee', 49]]]
  ];

  function slug(value) { return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
  function copyAddons(category) {
    var source;
    if (category === 'rice-meals' || category === 'silog-combo') {
      source = riceAddons;
    } else if (category === 'special-pasta' || category === 'pasta-combo') {
      source = pastaAddons;
    } else if (category === 'special-burger') {
      source = burgerAddons;
    } else if (category === 'iced-coffee') {
      source = coffeeAddons;
    } else if (category === 'milk-tea') {
      source = milkTeaAddons;
    } else if (category === 'frappe') {
      source = frappeAddons;
    } else if (category === 'matcha-series') {
      source = matchaAddons;
    } else if (category === 'yakult-series' || category === 'shaken-tea' || category === 'fruity-soda' || category === 'frostee-series') {
      source = fruitDrinkAddons;
    } else {
      source = beverageAddons;
    }
    return source.map(function (addon) { return { id: category + '-' + addon.id, name: addon.name, price: addon.price }; });
  }
  function copyOptions(category) {
    var source = category === 'silog-combo' ? fruitySodaFlavors : category === 'pasta-combo' ? grahamShakeFlavors : null;
    if (!source) return null;
    var prefix = category === 'silog-combo' ? 'fruity-soda-' : 'graham-shake-';
    return source.map(function (option) {
      return { id: prefix + option.id, name: option.name, priceDiff: option.priceDiff };
    });
  }
  function buildProduct(categoryLabel, category, item) {
    var id = category + '-' + slug(item[0]);
    var imgEntry = PRODUCT_IMAGES[id];
    var imageWebp = '';
    var imageJpg = '';
    if (typeof imgEntry === 'object' && imgEntry) {
      imageWebp = imgEntry.webp || '';
      imageJpg = imgEntry.jpg || imgEntry.webp || '';
    } else if (typeof imgEntry === 'string') {
      imageWebp = imgEntry;
      imageJpg = imgEntry;
    }
    var imageAlt = PRODUCT_ALTS[id] || (imgEntry ? item[0] + ' served with garlic fried rice and sunny-side-up egg' : item[0] + ' image to be added');
    return {
      id: id,
      name: item[0],
      category: category,
      categoryLabel: categoryLabel,
      price: item[1],
      description: productDescriptions[id] || categoryDescriptions[category],
      imageWebp: imageWebp,
      imageJpg: imageJpg,
      imageAlt: imageAlt,
      popular: POPULAR_PRODUCT_IDS.indexOf(id) !== -1,
      available: true,
      sizes: copyOptions(category),
      optionLabel: category === 'silog-combo' ? 'Fruity Soda Flavor' : category === 'pasta-combo' ? 'Graham Shake Flavor' : 'Size',
      addons: copyAddons(category)
    };
  }

  var catalog = [];
  definitions.forEach(function (definition) {
    definition[2].forEach(function (item) { catalog.push(buildProduct(definition[0], definition[1], item)); });
  });

  // Products created from the Admin Add Product screen are also shown in both catalogs.
  try {
    var added = JSON.parse(localStorage.getItem('cornerCravingsProducts') || '[]');
    if (Array.isArray(added)) added.forEach(function (product) {
      var categoryLabel = product.category || 'Other';
      var category = slug(categoryLabel);
      catalog.push({ id: 'custom-' + product.id, name: product.name, category: category, categoryLabel: categoryLabel, price: Number(product.price), description: product.description, imageWebp: product.image || '', imageJpg: product.image || '', imageAlt: product.name + ' image', popular: false, available: product.available !== false, sizes: null, addons: copyAddons(category) });
    });
  } catch (error) { }

  try {
    var availability = JSON.parse(localStorage.getItem('cornerCravingsProductAvailability') || '{}');
    catalog.forEach(function (product) { if (Object.prototype.hasOwnProperty.call(availability, product.id)) product.available = availability[product.id]; });
  } catch (error) { }

  // Frontend-only Admin product edits and removals are shared with customer pages.
  try {
    var productEdits = JSON.parse(localStorage.getItem('cornerCravingsProductEdits') || '{}');
    catalog.forEach(function (product) {
      var edit = productEdits[product.id];
      if (!edit) return;
      if (typeof edit.name === 'string' && edit.name.trim()) product.name = edit.name.trim();
      if (Number.isFinite(Number(edit.price)) && Number(edit.price) >= 0) product.price = Number(edit.price);
      if (typeof edit.description === 'string') product.description = edit.description;
    });
  } catch (error) { }

  try {
    var deletedProducts = JSON.parse(localStorage.getItem('cornerCravingsDeletedProducts') || '[]');
    if (Array.isArray(deletedProducts)) catalog = catalog.filter(function (product) { return deletedProducts.indexOf(product.id) === -1; });
  } catch (error) { }

  window.CornerCravingsMenu = catalog;
  window.CornerCravingsPopularProductIds = POPULAR_PRODUCT_IDS;
})();
