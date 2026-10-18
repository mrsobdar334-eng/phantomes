/**
 * Al Naseeb Dry Fruit Shop - Database & Storage Layer
 * ---------------------------------------------------
 * Seamlessly manages Supabase backend communication with automatic
 * resilient fallback to local storage and automatic order syncing.
 */

// Default Seed Products (High Quality Dry Fruits)
const DEFAULT_PRODUCTS = [
    {
        id: "prod-01",
        name: "Kaghzi Badam (Thin Shell Almonds)",
        urdu_name: "کاغذی بادام کوئٹہ",
        category: "almonds",
        price_250g: 850,
        price_500g: 1650,
        price_1kg: 3150,
        original_price_1kg: 3600,
        description: "Authentic high-grade Quetta Kaghzi Almonds. Crisp, hand-cracked easily with fingers, naturally sweet and rich in essential Vitamin E and Omega-3 oils.",
        origin: "Quetta, Balochistan",
        image_url: "https://images.unsplash.com/photo-1508061252445-5350f379c132?auto=format&fit=crop&w=800&q=80",
        badge: "Best Seller",
        is_featured: true,
        in_stock: true,
        stock_quantity: 65,
        rating: 4.9,
        reviews_count: 142
    },
    {
        id: "prod-02",
        name: "Irani Roasted & Salted Pistachios",
        urdu_name: "ایرانی نمکین پستہ",
        category: "pistachios",
        price_250g: 1150,
        price_500g: 2250,
        price_1kg: 4300,
        original_price_1kg: 4800,
        description: "Jumbo size open-shell Iranian Pistachios lightly roasted with Himalayan pink salt. Crisp texture, distinct rich nutty aroma.",
        origin: "Rafsanjan, Iran",
        image_url: "https://images.unsplash.com/photo-1596706059955-46b0d9e5dbdf?auto=format&fit=crop&w=800&q=80",
        badge: "Staff Pick",
        is_featured: true,
        in_stock: true,
        stock_quantity: 40,
        rating: 5.0,
        reviews_count: 98
    },
    {
        id: "prod-03",
        name: "Gilgit Snow White Walnuts (اخروٹ گری)",
        urdu_name: "گلگت اخروٹ گری سفید",
        category: "walnuts",
        price_250g: 950,
        price_500g: 1850,
        price_1kg: 3500,
        original_price_1kg: 3950,
        description: "Light extra-amber walnut kernels sourced fresh from the orchards of Gilgit-Baltistan. 100% oil intact, sweet, zero bitterness.",
        origin: "Gilgit-Baltistan",
        image_url: "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=800&q=80",
        badge: "Fresh Harvest",
        is_featured: true,
        in_stock: true,
        stock_quantity: 55,
        rating: 4.8,
        reviews_count: 87
    },
    {
        id: "prod-04",
        name: "Jumbo W240 Roasted Cashews (کاجو بھنا ہوا)",
        urdu_name: "سپریم کاجو روسٹڈ",
        category: "cashews",
        price_250g: 1050,
        price_500g: 2050,
        price_1kg: 3900,
        original_price_1kg: 4400,
        description: "Premium grade whole W-240 cashew nuts. Golden oven-roasted, creamy, crunchy, rich in healthy fats and magnesium.",
        origin: "Goa & Mangalore Imported",
        image_url: "https://images.unsplash.com/photo-1536591375315-1988d689b1c7?auto=format&fit=crop&w=800&q=80",
        badge: "Hot Deal",
        is_featured: true,
        in_stock: true,
        stock_quantity: 48,
        rating: 4.9,
        reviews_count: 115
    },
    {
        id: "prod-05",
        name: "Royal Saudi Medjool & Ajwa Dates (عجوہ و مجدول)",
        urdu_name: "عجوہ اور مجدول کھجور مدینہ",
        category: "dates",
        price_250g: 1200,
        price_500g: 2300,
        price_1kg: 4400,
        original_price_1kg: 5000,
        description: "Handpicked authentic Madinah Munawwarah Ajwa and jumbo luscious Medjool dates. Soft, caramel flavor, revered for sacred health benefits.",
        origin: "Madinah, Saudi Arabia",
        image_url: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=800&q=80",
        badge: "Sacred & Sweet",
        is_featured: true,
        in_stock: true,
        stock_quantity: 80,
        rating: 5.0,
        reviews_count: 210
    },
    {
        id: "prod-06",
        name: "Organic Afghani Sundried Figs (قندھاری انجیر)",
        urdu_name: "قندھاری رسیلی انجیر",
        category: "figs-raisins",
        price_250g: 900,
        price_500g: 1750,
        price_1kg: 3350,
        original_price_1kg: 3800,
        description: "Large, naturally sun-dried Kandahari garland figs. Tender flesh packed with natural honey sweetness and high digestive fiber.",
        origin: "Kandahar, Afghanistan",
        image_url: "https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?auto=format&fit=crop&w=800&q=80",
        badge: "100% Organic",
        is_featured: true,
        in_stock: true,
        stock_quantity: 35,
        rating: 4.8,
        reviews_count: 64
    },
    {
        id: "prod-07",
        name: "Royal Chilgoza Pine Nuts (چلغوزہ روایتی)",
        urdu_name: "خالص چلغوزہ وزیرستان",
        category: "chilgoza",
        price_250g: 2400,
        price_500g: 4700,
        price_1kg: 9200,
        original_price_1kg: 10500,
        description: "Rare Himalayan wild pine nuts (Chilgoza). King of dry fruits, rich in buttery oils, protein, and heart-healthy antioxidants.",
        origin: "Waziristan & Zhob Valleys",
        image_url: "https://images.unsplash.com/photo-1509358271058-acd22cc93898?auto=format&fit=crop&w=800&q=80",
        badge: "Royal Luxury",
        is_featured: true,
        in_stock: true,
        stock_quantity: 20,
        rating: 5.0,
        reviews_count: 53
    },
    {
        id: "prod-08",
        name: "Al Naseeb Royal Grand Mix Box (شاہی مکس ڈرائی فروٹ)",
        urdu_name: "شاہی گفٹ باکس مکس ڈرائی فروٹ",
        category: "mix",
        price_250g: 1350,
        price_500g: 2600,
        price_1kg: 4950,
        original_price_1kg: 5700,
        description: "Our signature 8-in-1 luxury blend: Almonds, Pistachios, Cashews, Walnuts, Afghani Figs, Golden Kishmish, Coconut Slices, and Dried Apricots in an airtight gift box.",
        origin: "Al Naseeb Signature Blend",
        image_url: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80",
        badge: "Top Gift Pick",
        is_featured: true,
        in_stock: true,
        stock_quantity: 50,
        rating: 5.0,
        reviews_count: 312
    },
    {
        id: "prod-09",
        name: "Golden Green Kishmish (سندر خوانی کشمش)",
        urdu_name: "سندر خوانی کشمش چمن",
        category: "figs-raisins",
        price_250g: 550,
        price_500g: 1050,
        price_1kg: 1950,
        original_price_1kg: 2300,
        description: "Extra-long Sundarkhani green raisins from Balochistan. Seedless, naturally dried, burst of sweet juicy freshness.",
        origin: "Chaman, Balochistan",
        image_url: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80",
        badge: "Superfood",
        is_featured: false,
        in_stock: true,
        stock_quantity: 70,
        rating: 4.7,
        reviews_count: 45
    },
    {
        id: "prod-10",
        name: "Pure Super Negin Iranian Saffron (خالص زعفران)",
        urdu_name: "سپر نگین ایرانی زعفران",
        category: "saffron",
        price_250g: 1800,
        price_500g: 3400,
        price_1kg: 6500,
        original_price_1kg: 7500,
        description: "Grade 1 Super Negin Saffron (Special 5g / 10g / 20g equivalent packs). Intense floral crimson threads, unmatched natural aroma and golden color.",
        origin: "Khorasan, Iran",
        image_url: "https://images.unsplash.com/photo-1509358271058-acd22cc93898?auto=format&fit=crop&w=800&q=80",
        badge: "Grade 1 Pure",
        is_featured: true,
        in_stock: true,
        stock_quantity: 25,
        rating: 5.0,
        reviews_count: 78
    }
];

class DatabaseService {
    constructor() {
        this.supabase = null;
        this.isOnline = false;
        this.initClient();
        this.initLocalStorage();
    }

    // Initialize Supabase Client
    initClient() {
        const config = window.STORE_CONFIG || {};
        const url = config.supabaseUrl;
        const key = config.supabaseAnonKey;

        if (window.supabase && typeof window.supabase.createClient === 'function' && url && key) {
            try {
                this.supabase = window.supabase.createClient(url, key);
                console.log("[Al Naseeb DB] Supabase client initialized for:", url);
                // Test connection in background
                this.testConnection();
            } catch (err) {
                console.warn("[Al Naseeb DB] Could not initialize Supabase client:", err);
                this.supabase = null;
            }
        } else {
            console.warn("[Al Naseeb DB] Supabase library or credentials not ready yet.");
        }
    }

    // Initialize Local Storage cache
    initLocalStorage() {
        try {
            if (!localStorage.getItem("alnaseeb_products")) {
                localStorage.setItem("alnaseeb_products", JSON.stringify(DEFAULT_PRODUCTS));
            }
        } catch (e) {
            console.error("Local storage initialization failed:", e);
        }
    }

    // Test connection to Supabase
    async testConnection() {
        if (!this.supabase) {
            this.initClient();
        }
        if (!this.supabase) {
            return { success: false, message: "Supabase client not initialized. Check your credentials." };
        }
        try {
            const { data, error } = await this.supabase
                .from('orders')
                .select('id')
                .limit(1);

            if (error) {
                if (error.code === '42P01' || error.message.includes('relation "orders" does not exist')) {
                    return {
                        success: false,
                        tableMissing: true,
                        message: "Connected, but 'orders' table does not exist. Run supabase_schema.sql in Supabase SQL Editor."
                    };
                }
                return { success: false, message: error.message };
            }
            this.isOnline = true;
            return { success: true, message: "Connected to Supabase successfully!", count: data ? data.length : 0 };
        } catch (err) {
            this.isOnline = false;
            return {
                success: false,
                message: err.message || "Failed to reach Supabase. Check network connection."
            };
        }
    }

    // ==========================================
    // PRODUCTS API
    // ==========================================

    async getProducts() {
        if (this.supabase) {
            try {
                const { data, error } = await this.supabase
                    .from('products')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (!error && Array.isArray(data) && data.length > 0) {
                    this.isOnline = true;
                    try {
                        localStorage.setItem("alnaseeb_products", JSON.stringify(data));
                    } catch (e) {}
                    return data;
                }
            } catch (err) {
                console.warn("[Al Naseeb DB] Supabase fetch failed, falling back to local cache:", err.message);
            }
        }

        try {
            const local = localStorage.getItem("alnaseeb_products");
            if (local) {
                const parsed = JSON.parse(local);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            }
        } catch (e) {
            console.error("Local products read error:", e);
        }
        return DEFAULT_PRODUCTS;
    }

    async saveProduct(product) {
        if (!product.id) {
            product.id = 'prod-' + Date.now();
        }

        // 1. Sync to Supabase
        if (this.supabase) {
            try {
                const { error } = await this.supabase
                    .from('products')
                    .upsert([product]);
                if (error) {
                    console.warn("[Al Naseeb DB] Supabase upsert error:", error.message);
                } else {
                    this.isOnline = true;
                }
            } catch (err) {
                console.warn("[Al Naseeb DB] Supabase upsert failed:", err.message);
            }
        }

        // 2. Update local storage cache
        try {
            const list = await this.getProducts();
            const idx = list.findIndex(p => p.id === product.id);
            if (idx >= 0) {
                list[idx] = { ...list[idx], ...product };
            } else {
                list.unshift(product);
            }
            localStorage.setItem("alnaseeb_products", JSON.stringify(list));
        } catch (e) {
            console.error("Failed saving product locally:", e);
        }

        return product;
    }

    async deleteProduct(productId) {
        if (this.supabase) {
            try {
                await this.supabase
                    .from('products')
                    .delete()
                    .eq('id', productId);
            } catch (err) {
                console.warn("[Al Naseeb DB] Supabase delete failed:", err.message);
            }
        }

        try {
            const list = await this.getProducts();
            const filtered = list.filter(p => p.id !== productId);
            localStorage.setItem("alnaseeb_products", JSON.stringify(filtered));
        } catch (e) {}
        return true;
    }

    // ==========================================
    // ORDERS API (Direct Supabase Insertion)
    // ==========================================

    async getOrders() {
        // Fetch real-time orders from Supabase
        if (this.supabase) {
            try {
                const { data, error } = await this.supabase
                    .from('orders')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (!error && Array.isArray(data)) {
                    this.isOnline = true;
                    try {
                        localStorage.setItem("alnaseeb_orders", JSON.stringify(data));
                    } catch (e) {}
                    return data;
                } else if (error) {
                    console.error("[Al Naseeb DB] Error getting orders from Supabase:", error.message);
                }
            } catch (err) {
                console.warn("[Al Naseeb DB] Supabase fetch orders failed:", err.message);
            }
        }

        try {
            const local = localStorage.getItem("alnaseeb_orders");
            return local ? JSON.parse(local) : [];
        } catch (e) {
            return [];
        }
    }

    async createOrder(orderData) {
        if (!orderData.id) {
            orderData.id = "ORD-" + Math.floor(100000 + Math.random() * 900000);
        }
        if (!orderData.created_at) {
            orderData.created_at = new Date().toISOString();
        }

        let savedToSupabase = false;

        // 1. Insert into Supabase
        if (this.supabase) {
            try {
                console.log("[Al Naseeb DB] Inserting order into Supabase...", orderData);
                const { data, error } = await this.supabase
                    .from('orders')
                    .insert([orderData])
                    .select();

                if (error) {
                    console.error("[Al Naseeb DB] Supabase Insert Error:", error);
                    throw error;
                } else {
                    console.log("[Al Naseeb DB] Order successfully stored in Supabase:", data);
                    savedToSupabase = true;
                    this.isOnline = true;
                }
            } catch (err) {
                console.error("[Al Naseeb DB] Supabase order insert failed:", err.message);
            }
        }

        // 2. Cache in local storage
        try {
            const local = localStorage.getItem("alnaseeb_orders");
            const list = local ? JSON.parse(local) : [];
            list.unshift(orderData);
            localStorage.setItem("alnaseeb_orders", JSON.stringify(list));
        } catch (e) {
            console.error("Local order cache failed:", e);
        }

        return { order: orderData, savedToSupabase: savedToSupabase };
    }

    async updateOrderStatus(orderId, newStatus) {
        if (this.supabase) {
            try {
                await this.supabase
                    .from('orders')
                    .update({ status: newStatus })
                    .eq('id', orderId);
            } catch (err) {
                console.warn("[Al Naseeb DB] Supabase order status update failed:", err.message);
            }
        }

        try {
            const orders = await this.getOrders();
            const order = orders.find(o => o.id === orderId);
            if (order) {
                order.status = newStatus;
                localStorage.setItem("alnaseeb_orders", JSON.stringify(orders));
            }
        } catch (e) {}
        return true;
    }

    // Sync any orders stored locally that might not be in Supabase yet
    async syncPendingOrdersToSupabase() {
        if (!this.supabase) return { synced: 0 };
        try {
            const local = localStorage.getItem("alnaseeb_orders");
            if (!local) return { synced: 0 };
            const localOrders = JSON.parse(local);
            if (!Array.isArray(localOrders) || localOrders.length === 0) return { synced: 0 };

            // Get existing order IDs in Supabase
            const { data: remoteOrders, error } = await this.supabase
                .from('orders')
                .select('id');

            if (error) return { synced: 0 };

            const remoteIds = new Set((remoteOrders || []).map(o => o.id));
            const unsynced = localOrders.filter(o => !remoteIds.has(o.id) && !o.id.startsWith("ORD-948")); // Skip sample dummy orders

            if (unsynced.length > 0) {
                const { error: insertError } = await this.supabase
                    .from('orders')
                    .insert(unsynced);

                if (!insertError) {
                    console.log(`[Al Naseeb DB] Synced ${unsynced.length} pending orders to Supabase!`);
                    return { synced: unsynced.length };
                }
            }
        } catch (e) {
            console.warn("Auto-sync error:", e);
        }
        return { synced: 0 };
    }

    // Seed default products directly into Supabase
    async seedProductsToSupabase() {
        if (!this.supabase) {
            this.initClient();
        }
        if (!this.supabase) {
            return { success: false, message: "Supabase client not initialized." };
        }
        try {
            const { error } = await this.supabase
                .from('products')
                .upsert(DEFAULT_PRODUCTS, { onConflict: 'id' });

            if (error) throw error;
            return { success: true, count: DEFAULT_PRODUCTS.length };
        } catch (err) {
            return { success: false, message: err.message };
        }
    }
}

// Global Singleton Instance
window.dbService = new DatabaseService();
