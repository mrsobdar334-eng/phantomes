-- ==========================================================
-- Al Naseeb Dry Fruit Shop - Supabase Database Schema
-- Run this in your Supabase Project -> SQL Editor -> Run
-- ==========================================================

-- 1. Enable UUID Extension (if needed)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    urdu_name TEXT,
    icon TEXT,
    sort_order INT DEFAULT 0
);

-- 3. Create Products Table
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price_250g NUMERIC NOT NULL,
    price_500g NUMERIC NOT NULL,
    price_1kg NUMERIC NOT NULL,
    original_price_1kg NUMERIC,
    description TEXT,
    origin TEXT,
    image_url TEXT NOT NULL,
    badge TEXT,
    is_featured BOOLEAN DEFAULT true,
    in_stock BOOLEAN DEFAULT true,
    stock_quantity INT DEFAULT 100,
    rating NUMERIC DEFAULT 4.9,
    reviews_count INT DEFAULT 35,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create Orders Table
CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT,
    delivery_address TEXT NOT NULL,
    city TEXT NOT NULL,
    notes TEXT,
    items JSONB NOT NULL,
    subtotal NUMERIC NOT NULL,
    delivery_fee NUMERIC DEFAULT 0,
    discount NUMERIC DEFAULT 0,
    total_amount NUMERIC NOT NULL,
    payment_method TEXT DEFAULT 'Cash on Delivery (COD)',
    status TEXT DEFAULT 'Pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create Settings Table
CREATE TABLE IF NOT EXISTS store_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================================
-- Configure Row Level Security (RLS) for public e-commerce
-- Allows anyone to read products and categories, and submit orders
-- ==========================================================

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;

-- Categories Policies
DROP POLICY IF EXISTS "Public can view categories" ON categories;
CREATE POLICY "Public can view categories" ON categories FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anon can manage categories" ON categories;
CREATE POLICY "Anon can manage categories" ON categories FOR ALL USING (true);

-- Products Policies
DROP POLICY IF EXISTS "Public can view products" ON products;
CREATE POLICY "Public can view products" ON products FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anon can manage products" ON products;
CREATE POLICY "Anon can manage products" ON products FOR ALL USING (true);

-- Orders Policies
DROP POLICY IF EXISTS "Public can insert orders" ON orders;
CREATE POLICY "Public can insert orders" ON orders FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public can view orders" ON orders;
CREATE POLICY "Public can view orders" ON orders FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public can update orders" ON orders;
CREATE POLICY "Public can update orders" ON orders FOR UPDATE USING (true);

-- Store Settings Policies
DROP POLICY IF EXISTS "Public can view store settings" ON store_settings;
CREATE POLICY "Public can view store settings" ON store_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public can update store settings" ON store_settings;
CREATE POLICY "Public can update store settings" ON store_settings FOR ALL USING (true);

-- ==========================================================
-- Initial Seed Data: Categories
-- ==========================================================
INSERT INTO categories (id, name, urdu_name, icon, sort_order) VALUES
('almonds', 'Almonds', 'بادام', 'fa-seedling', 1),
('pistachios', 'Pistachios', 'پستہ', 'fa-spa', 2),
('walnuts', 'Walnuts', 'اخروٹ', 'fa-brain', 3),
('cashews', 'Cashews', 'کاجو', 'fa-cookie', 4),
('dates', 'Royal Dates', 'کھجور', 'fa-sun', 5),
('figs-raisins', 'Figs & Raisins', 'انجیر اور کشمش', 'fa-apple-whole', 6),
('chilgoza', 'Chilgoza & Pine Nuts', 'چلغوزہ', 'fa-tree', 7),
('mix', 'Mix Dry Fruit Boxes', 'مکس ڈرائی فروٹ', 'fa-gift', 8),
('saffron', 'Pure Saffron & Herbs', 'زعفران', 'fa-fire-flame-curved', 9)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, urdu_name = EXCLUDED.urdu_name;

-- ==========================================================
-- Initial Seed Data: Premium Products
-- ==========================================================
INSERT INTO products (id, name, category, price_250g, price_500g, price_1kg, original_price_1kg, description, origin, image_url, badge, is_featured, in_stock, stock_quantity, rating, reviews_count) VALUES
(
    'prod-01',
    'Kaghzi Badam (Thin Shell Almonds)',
    'almonds',
    850,
    1650,
    3150,
    3600,
    'Authentic high-grade Quetta Kaghzi Almonds. Crisp, hand-cracked easily with fingers, naturally sweet and rich in essential Vitamin E and Omega-3 oils.',
    'Quetta, Balochistan',
    'https://images.unsplash.com/photo-1508061252445-5350f379c132?auto=format&fit=crop&w=800&q=80',
    'Best Seller',
    true,
    true,
    65,
    4.9,
    142
),
(
    'prod-02',
    'Irani Roasted & Salted Pistachios',
    'pistachios',
    1150,
    2250,
    4300,
    4800,
    'Jumbo size open-shell Iranian Pistachios lightly roasted with Himalayan pink salt. Crisp texture, distinct rich nutty aroma.',
    'Rafsanjan, Iran',
    'https://images.unsplash.com/photo-1596706059955-46b0d9e5dbdf?auto=format&fit=crop&w=800&q=80',
    'Staff Pick',
    true,
    true,
    40,
    5.0,
    98
),
(
    'prod-03',
    'Gilgit Snow White Walnuts (اخروٹ گری)',
    'walnuts',
    950,
    1850,
    3500,
    3950,
    'Light extra-amber walnut kernels sourced fresh from the orchards of Gilgit-Baltistan. 100% oil intact, sweet, zero bitterness.',
    'Gilgit-Baltistan',
    'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=800&q=80',
    'Fresh Harvest',
    true,
    true,
    55,
    4.8,
    87
),
(
    'prod-04',
    'Jumbo W240 Roasted Cashews (کاجو بھنا ہوا)',
    'cashews',
    1050,
    2050,
    3900,
    4400,
    'Premium grade whole W-240 cashew nuts. Golden oven-roasted, creamy, crunchy, rich in healthy fats and magnesium.',
    'Goa & Mangalore Imported',
    'https://images.unsplash.com/photo-1536591375315-1988d689b1c7?auto=format&fit=crop&w=800&q=80',
    'Hot Deal',
    true,
    true,
    48,
    4.9,
    115
),
(
    'prod-05',
    'Royal Saudi Medjool & Ajwa Dates (عجوہ و مجدول)',
    'dates',
    1200,
    2300,
    4400,
    5000,
    'Handpicked authentic Madinah Munawwarah Ajwa and jumbo luscious Medjool dates. Soft, caramel flavor, revered for sacred health benefits.',
    'Madinah, Saudi Arabia',
    'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=800&q=80',
    'Sacred & Sweet',
    true,
    true,
    80,
    5.0,
    210
),
(
    'prod-06',
    'Organic Afghani Sundried Figs (قندھاری انجیر)',
    'figs-raisins',
    900,
    1750,
    3350,
    3800,
    'Large, naturally sun-dried Kandahari garland figs. Tender flesh packed with natural honey sweetness and high digestive fiber.',
    'Kandahar, Afghanistan',
    'https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?auto=format&fit=crop&w=800&q=80',
    '100% Organic',
    true,
    true,
    35,
    4.8,
    64
),
(
    'prod-07',
    'Royal Chilgoza Pine Nuts (چلغوزہ روایتی)',
    'chilgoza',
    2400,
    4700,
    9200,
    10500,
    'Rare Himalayan wild pine nuts (Chilgoza). King of dry fruits, rich in buttery oils, protein, and heart-healthy antioxidants.',
    'Waziristan & Zhob Valleys',
    'https://images.unsplash.com/photo-1509358271058-acd22cc93898?auto=format&fit=crop&w=800&q=80',
    'Luxury Royal',
    true,
    true,
    20,
    5.0,
    53
),
(
    'prod-08',
    'Al Naseeb Royal Grand Mix Box (شاہی مکس ڈرائی فروٹ)',
    'mix',
    1350,
    2600,
    4950,
    5700,
    'Our signature 8-in-1 luxury blend: Almonds, Pistachios, Cashews, Walnuts, Afghani Figs, Golden Kishmish, Coconut Slices, and Dried Apricots.',
    'Al Naseeb Signature Blend',
    'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80',
    'Top Gift Pick',
    true,
    true,
    50,
    5.0,
    312
),
(
    'prod-09',
    'Golden Green Kishmish (سندر خوانی کشمش)',
    'figs-raisins',
    550,
    1050,
    1950,
    2300,
    'Extra-long Sundarkhani green raisins from Balochistan. Seedless, naturally dried, burst of sweet juicy freshness.',
    'Chaman, Balochistan',
    'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80',
    'Everyday Superfood',
    false,
    true,
    70,
    4.7,
    45
),
(
    'prod-10',
    'Pure Super Negin Iranian Saffron (خالص زعفران)',
    'saffron',
    1800,
    3400,
    6500,
    7500,
    'Grade 1 Super Negin Saffron (5g / 10g / 20g packs). Intense floral crimson threads, unmatched natural aroma and golden color.',
    'Khorasan, Iran',
    'https://images.unsplash.com/photo-1509358271058-acd22cc93898?auto=format&fit=crop&w=800&q=80',
    'Pure Grade 1',
    true,
    true,
    25,
    5.0,
    78
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    price_250g = EXCLUDED.price_250g,
    price_500g = EXCLUDED.price_500g,
    price_1kg = EXCLUDED.price_1kg,
    description = EXCLUDED.description,
    image_url = EXCLUDED.image_url;
