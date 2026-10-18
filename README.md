# 🌰 Al Naseeb Dry Fruit Shop (ال نصیب ڈرائی فروٹس شاپ)
### Premium E-Commerce Website with Supabase Backend & Admin Panel

A luxury, fully-responsive e-commerce website designed specifically for dry fruits, nuts, and organic superfoods. Built with HTML5, CSS3, modern vanilla JavaScript, and connected with **Supabase** as the backend database, featuring seamless WhatsApp ordering and an executive Admin Management Dashboard.

---

## 🌟 Key Features

### 🛒 1. Customer Storefront (`index.html`)
- **Royal & Appetizing Aesthetic:** Deep Royal Emerald (`#0e3d2f`), Warm Almond Cream (`#faf7f2`), and Radiant Antique Gold (`#c89d2d`).
- **Dynamic Weight Selector:** Customers can toggle between **250 Grams**, **500 Grams**, and **1 Kilogram** on any card with immediate dynamic price calculation.
- **Direct One-Click WhatsApp Ordering:**
  - Every product card has an **Order on WhatsApp** button that creates a pre-filled WhatsApp message with product name, selected pack size, and price.
  - Floating WhatsApp chat button with pulsing animation and customized greetings.
- **Slide-Over Cart Drawer:**
  - Quantity controls (`+` / `-`), remove items, persistent cart using browser storage.
  - Automatic **Free Shipping** calculation when cart total exceeds Rs. 3,000.
  - Two checkout options:
    1. **Cash on Delivery (COD) Checkout:** Saves the order directly to Supabase with instant Order ID generation (`ORD-XXXX`).
    2. **Send Entire Order via WhatsApp:** Formats a clean itemized receipt of the complete cart and opens WhatsApp directly.
- **Live Search & Category Filtering:** Instant search bar and category tabs (Almonds/Badam, Pistachios/Pista, Walnuts/Akhrot, Cashews/Kaju, Dates/Khajoor, Figs & Raisins, Chilgoza, Mix Hampers, Saffron).
- **Product Details Modal (Quick View):** Displays harvest origin, nutritional highlights, and airtight packaging information.

---

### 🛡️ 2. Admin Management Dashboard (`admin.html`)
- **Security PIN Protected:** Default PIN is `1234` (easily changeable from Admin Settings).
- **Live Metrics Cards:**
  - Total Products in catalog
  - Total Orders received
  - Gross Revenue (Rs.)
  - Pending Orders
- **Product Management:**
  - Add new dry fruit products (Title, Urdu title, Category, Origin, 250g / 500g / 1kg prices, Sale price, Stock count, Image URL, Badges).
  - Edit existing products with live previews and quick image presets.
  - Delete products.
- **Order Management:**
  - View all incoming customer orders with customer name, phone number, address, city, and item breakdown.
  - **"Message Customer on WhatsApp"** button: Opens WhatsApp directly to the customer's phone number with their order confirmation!
  - Real-time order status updates: `Pending`, `Processing`, `Shipped`, `Delivered`, `Cancelled`.
- **Supabase & Store Configuration:**
  - Pre-configured with the provided Supabase project credentials.
  - Live "Test Supabase Connection" button.
  - **"Seed Default Products into Supabase"** button for 1-click database population.
  - **"Copy SQL Schema Script"** button to easily set up tables in Supabase.
  - Configurable WhatsApp receiving number, delivery charges, free shipping threshold, and admin PIN.

---

## ⚡ 3. Supabase Database Setup

Your Supabase API keys have been integrated into `js/supabase-config.js`:
- **Project URL:** `https://gcqpmenyjnrnmyhutkwv.supabase.co`
- **Anon Public Key:** `eyJhbGciOi...`
- **Publishable Key:** `sb_publishable_OHkBX4HeLyJ9kULOaRqc5w_C1m7GqbR`

### To create the tables in your Supabase project:
1. Open your [Supabase Dashboard](https://supabase.com/dashboard).
2. Go to **SQL Editor** in the left sidebar.
3. Open the file `supabase_schema.sql` (included in this project) or click **"Copy Supabase SQL Schema Script"** inside the Admin Panel (`admin.html`).
4. Paste the SQL code into the Supabase SQL Editor and click **Run**.
5. That's it! Your `products`, `orders`, and `categories` tables will be created with public e-commerce permissions.

> **Resilient Offline Fallback:** Even if Supabase is initializing, network is slow, or tables haven't been run yet, the website **never breaks or crashes**. It automatically falls back to local data and displays all products flawlessly.

---

## 🚀 How to Run the Website Locally

You can open the files directly in any web browser, or launch a quick local server:

### Option A: Direct Open
Double-click `index.html` to open the customer shop, and `admin.html` to open the Admin Panel (PIN: `1234`).

### Option B: Local HTTP Server (Recommended)
Using Python in PowerShell or Terminal:
```bash
python -m http.server 8000
```
Then navigate to:
- Storefront: `http://localhost:8000`
- Admin Panel: `http://localhost:8000/admin.html`

---

## 📁 File Structure

```
phantemes/
├── index.html               # Main Customer Storefront
├── admin.html               # Executive Admin Management Portal
├── supabase_schema.sql      # Supabase SQL table creation and seed script
├── README.md                # Documentation & Setup guide
├── css/
│   ├── style.css            # Storefront styling (Royal Emerald & Gold theme)
│   └── admin.css            # Executive admin dashboard styles
└── js/
    ├── supabase-config.js   # Supabase keys, phone numbers & store settings
    ├── db.js                # Database layer (Supabase client + resilient local fallback)
    ├── app.js               # Storefront logic (cart, weights, filters, WhatsApp)
    └── admin.js             # Admin dashboard logic (CRUD, orders, status, WhatsApp)
```

---

## 📞 WhatsApp Configuration
To change the recipient WhatsApp number where customer orders are received:
1. Go to `admin.html` &rarr; Enter PIN `1234`.
2. Click **Supabase & Settings** tab in the sidebar.
3. Change **WhatsApp Number for Orders** (e.g., `923001234567`) and click **Save Store Settings**.
4. All "Order on WhatsApp" buttons will immediately use your updated number!
