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
├── customer.js                  # Demo menu, cart, and checkout state
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

Customer menu items are currently centralized in the `DEMO_MENU` array near the top of `customer.js`. Replace this demonstration data after the owner supplies the approved:

- Product names
- Categories
- Prices
- Descriptions
- Sizes and add-ons
- Food photographs

The current product names, prices, generated images, ratings, and review text must not be treated as verified business information.

## Verified business information

- Business: Corner Cravings
- Address: Blk 29 Lot 1, Bougainvilla St., Brgy. Pasong Putik, Quezon City
- Categories: street food, rice meals, pasta, tea, coffee, and frappes
- Facebook: <https://www.facebook.com/share/1LJfeS9R3v/>

## Prototype limitations

This repository is currently a front-end prototype:

- Authentication is not connected to a secure server or database.
- Customer accounts and checkout state use browser storage.
- Orders are not transmitted to the business or a production order-management system.
- Payment methods do not process real payments.
- Credit/debit card information must not be entered or stored.
- The Google Maps embed requires an internet connection.
- Menu content, prices, operating hours, and customer reviews still require owner approval.

Do not deploy the authentication, payment, or ordering flows as a production system without a secure backend, server-side validation, proper session management, database storage, and an approved payment provider.

## Technology

- HTML5
- CSS3
- Vanilla JavaScript
- Browser `localStorage` for prototype state
- Google Fonts
- Google Maps embed

No package installation or compilation is required.
