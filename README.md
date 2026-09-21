# Corner Cravings

Corner Cravings is a responsive food-business website with a public landing page, a customer ordering prototype, and separate Admin and Employee portals. It is built with plain HTML, CSS, and JavaScript and runs directly through XAMPP without a build step.

## Features

### Public landing page

- Mobile-responsive navigation and hero section
- Food-category and ordering information
- Customer-review mockups clearly marked as sample content
- Official Facebook link
- Embedded Google Maps location
- Business address and visit information
- Admin and Employee access links in the footer

### Customer ordering prototype

- Customer login and account creation
- Customer home and searchable menu
- Product details, sizes, add-ons, and quantity selection
- Shopping cart and order review
- Delivery-information form
- Payment-method selection
- Order-confirmation receipt
- Browser-based cart and checkout persistence

### Admin portal

- Admin login and registration
- Product management
- Order monitoring
- Inventory management
- Admin profile
- Password-recovery screens

### Employee portal

- Employee login and registration
- Upcoming orders
- Order history
- Employee profile

## Running locally

1. Install and open XAMPP.
2. Place the repository in:

   ```text
   C:\xampp\htdocs\Corner-Cravings
   ```

3. Start Apache from the XAMPP Control Panel.
4. Open the public website:

   ```text
   http://localhost/Corner-Cravings/
   ```

Useful entry points:

- Customer ordering: `http://localhost/Corner-Cravings/customer-login.html`
- Admin portal: `http://localhost/Corner-Cravings/login.html`
- Employee portal: `http://localhost/Corner-Cravings/staff-login.html`

## Project structure

```text
Corner-Cravings/
├── index.html                    # Public landing page
├── landing.css                  # Landing-page styles
├── landing.js                   # Landing-page interactions
├── customer-home.html           # Customer storefront
├── customer-menu.html           # Searchable menu
├── customer-product.html        # Product configuration
├── customer-cart.html           # Cart and order review
├── customer-delivery.html       # Delivery information
├── customer-payment.html        # Payment selection
├── customer-confirmation.html   # Order receipt
├── customer-login.html          # Customer login
├── customer-signup.html         # Customer account creation
├── customer.css                 # Shared customer-side styles
├── menu-data.js                 # Shared owner menu and editable image/popular settings
├── customer.js                  # Customer cart and checkout state
├── login.html                   # Admin login
├── products.html                # Admin product dashboard
├── orders.html                  # Admin orders
├── stock-in.html                # Admin inventory
├── profile.html                 # Admin profile
├── staff-login.html             # Employee login
├── staff-orders.html            # Employee upcoming orders
├── staff-history.html           # Employee order history
├── staff-profile.html           # Employee profile
├── auth.js                      # Admin/Employee prototype behavior
├── tokens.css                   # Shared design tokens
├── Logo.png                     # Current brand logo
└── assets/images/               # Temporary food and landing images
```

## Updating the menu

The customer and Admin catalogs share the owner menu in `menu-data.js`. The supplied product names, categories, and prices have been transcribed into that file.

- Add confirmed best-seller IDs to `POPULAR_PRODUCT_IDS`.
- Add future photo paths to `PRODUCT_IMAGES`.
- Review the generated descriptions and suggested food add-ons with the owner.
- The beverage add-ons and their ₱10 prices come from the supplied menu board.

Product photos and best-seller selections are intentionally left blank until they are provided or approved by the owner.

## Verified business information

- Business: Corner Cravings
- Address: Blk 29 Lot 1, Bougainvilla St., Brgy. Pasong Putik, Quezon City
- Categories: rice meals, pasta, burgers, combo meals, coffee, milk tea, Yakult drinks, frappes, matcha drinks, shaken tea, fruity milk, fruity soda, and Frostee drinks
- Facebook: <https://www.facebook.com/share/1LJfeS9R3v/>

## Prototype limitations

This repository is currently a front-end prototype:

- Authentication is not connected to a secure server or database.
- Customer accounts and checkout state use browser storage.
- Orders are not transmitted to the business or a production order-management system.
- Payment methods do not process real payments.
- Credit/debit card information must not be entered or stored.
- The Google Maps embed requires an internet connection.
- Product photos, generated descriptions, suggested food add-ons, operating hours, and customer reviews still require owner approval.

Do not deploy the authentication, payment, or ordering flows as a production system without a secure backend, server-side validation, proper session management, database storage, and an approved payment provider.

## Technology

- HTML5
- CSS3
- Vanilla JavaScript
- Browser `localStorage` for prototype state
- Google Fonts
- Google Maps embed

No package installation or compilation is required.
