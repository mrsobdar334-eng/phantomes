/**
 * Al Naseeb Dry Fruit Shop - Admin Panel Logic
 * --------------------------------------------
 * Handles Products CRUD, Orders lifecycle, Supabase settings sync,
 * WhatsApp messaging with customers, and dashboard statistics.
 */

(function () {
    'use strict';

    let allProducts = [];
    let allOrders = [];
    let currentEditProductId = null;

    // DOM Elements
    const lockScreen = document.getElementById('admin-lock-screen');
    const pinInput = document.getElementById('admin-pin-input');
    const btnUnlock = document.getElementById('btn-unlock-admin');
    const lockError = document.getElementById('lock-error-msg');

    const topbarDbPill = document.getElementById('topbar-db-pill');
    const navTabLinks = document.querySelectorAll('.nav-tab-link');
    const tabPanes = document.querySelectorAll('.admin-tab-pane');

    // Metrics Elements
    const metricTotalProducts = document.getElementById('metric-total-products');
    const metricTotalOrders = document.getElementById('metric-total-orders');
    const metricTotalRevenue = document.getElementById('metric-total-revenue');
    const metricPendingOrders = document.getElementById('metric-pending-orders');

    // Products Tab
    const productsTableBody = document.getElementById('adm-products-tbody');
    const btnOpenAddProduct = document.getElementById('btn-open-add-product');
    const productModal = document.getElementById('adm-product-modal');
    const btnCloseProductModal = document.getElementById('btn-close-adm-product');
    const productForm = document.getElementById('adm-product-form');
    const productModalTitle = document.getElementById('adm-product-modal-title');
    const searchProductsInput = document.getElementById('adm-search-products');

    // Orders Tab
    const ordersTableBody = document.getElementById('adm-orders-tbody');
    const searchOrdersInput = document.getElementById('adm-search-orders');

    // Settings Tab
    const supabaseUrlInput = document.getElementById('cfg-supabase-url');
    const supabaseKeyInput = document.getElementById('cfg-supabase-key');
    const btnTestDb = document.getElementById('btn-test-db');
    const dbTestResult = document.getElementById('db-test-result');
    const btnSeedDb = document.getElementById('btn-seed-db');
    const btnCopySql = document.getElementById('btn-copy-sql');
    const settingsForm = document.getElementById('store-settings-form');

    // ==========================================
    // Initialization & Security PIN
    // ==========================================
    function init() {
        checkAuthentication();
        setupNavigation();
        setupEventListeners();
    }

    function checkAuthentication() {
        const isAuth = sessionStorage.getItem('alnaseeb_admin_authenticated');
        if (isAuth === 'true') {
            if (lockScreen) lockScreen.style.display = 'none';
            loadDashboardData();
        } else {
            if (lockScreen) lockScreen.style.display = 'flex';
            if (pinInput) pinInput.focus();
        }
    }

    if (btnUnlock && pinInput) {
        btnUnlock.addEventListener('click', handleUnlock);
        pinInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') handleUnlock();
        });
    }

    function handleUnlock() {
        const config = window.STORE_CONFIG || {};
        const expectedPin = config.adminPin || '1234';
        const entered = (pinInput.value || '').trim();

        if (entered === expectedPin) {
            sessionStorage.setItem('alnaseeb_admin_authenticated', 'true');
            lockScreen.style.display = 'none';
            loadDashboardData();
        } else {
            lockError.textContent = 'Incorrect PIN! Default is 1234.';
            pinInput.value = '';
            pinInput.focus();
        }
    }

    // ==========================================
    // Navigation Tabs
    // ==========================================
    function setupNavigation() {
        navTabLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetTab = link.dataset.tab;
                
                navTabLinks.forEach(l => l.classList.remove('active'));
                tabPanes.forEach(p => p.classList.remove('active'));

                link.classList.add('active');
                const activePane = document.getElementById(`tab-${targetTab}`);
                if (activePane) activePane.classList.add('active');

                // If settings tab, populate fields
                if (targetTab === 'settings') {
                    populateSettingsForm();
                }
            });
        });
    }

    // ==========================================
    // Dashboard Data Loading
    // ==========================================
    async function loadDashboardData() {
        checkDbStatus();
        await window.dbService.syncPendingOrdersToSupabase();
        await Promise.all([
            fetchAndRenderProducts(),
            fetchAndRenderOrders()
        ]);
        updateMetrics();
    }

    async function checkDbStatus() {
        if (!topbarDbPill) return;
        const res = await window.dbService.testConnection();
        if (res.success) {
            topbarDbPill.className = 'db-status-pill online';
            topbarDbPill.innerHTML = `<span class="status-dot"></span> Supabase Connected`;
        } else {
            topbarDbPill.className = 'db-status-pill fallback';
            topbarDbPill.innerHTML = `<span class="status-dot"></span> Local Storage Mode`;
        }
    }

    function updateMetrics() {
        const config = window.STORE_CONFIG || {};
        const currency = config.currency || 'Rs.';

        if (metricTotalProducts) {
            metricTotalProducts.textContent = allProducts.length;
        }
        if (metricTotalOrders) {
            metricTotalOrders.textContent = allOrders.length;
        }
        if (metricTotalRevenue) {
            const rev = allOrders
                .filter(o => o.status !== 'Cancelled')
                .reduce((acc, o) => acc + Number(o.total_amount || 0), 0);
            metricTotalRevenue.textContent = `${currency} ${rev.toLocaleString()}`;
        }
        if (metricPendingOrders) {
            const pending = allOrders.filter(o => o.status === 'Pending').length;
            metricPendingOrders.textContent = pending;
        }
    }

    // ==========================================
    // Products Management
    // ==========================================
    async function fetchAndRenderProducts() {
        allProducts = await window.dbService.getProducts();
        renderProductsTable();
    }

    function renderProductsTable() {
        if (!productsTableBody) return;
        const query = (searchProductsInput?.value || '').toLowerCase().trim();

        const filtered = allProducts.filter(p => {
            return !query || 
                p.name.toLowerCase().includes(query) ||
                (p.category && p.category.toLowerCase().includes(query)) ||
                (p.origin && p.origin.toLowerCase().includes(query));
        });

        if (filtered.length === 0) {
            productsTableBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 2.5rem; color: var(--adm-muted);">
                        No products match your search.
                    </td>
                </tr>
            `;
            return;
        }

        const config = window.STORE_CONFIG || {};
        const currency = config.currency || 'Rs.';

        productsTableBody.innerHTML = filtered.map(p => `
            <tr>
                <td>
                    <div class="table-product-cell">
                        <img src="${p.image_url}" class="table-product-img" alt="${p.name}" onerror="this.src='https://images.unsplash.com/photo-1508061252445-5350f379c132?auto=format&fit=crop&w=200&q=80'" />
                        <div class="table-product-info">
                            <h4>${p.name}</h4>
                            <span>${p.origin || 'Al Naseeb Select'}</span>
                        </div>
                    </div>
                </td>
                <td>
                    <span style="background: #eef2ef; padding: 3px 8px; border-radius: 4px; font-size: 0.78rem; font-weight: 600; text-transform: capitalize;">
                        ${p.category}
                    </span>
                </td>
                <td>
                    <div style="font-size: 0.82rem; line-height: 1.4;">
                        <div><strong>250g:</strong> ${currency} ${Number(p.price_250g).toLocaleString()}</div>
                        <div><strong>500g:</strong> ${currency} ${Number(p.price_500g).toLocaleString()}</div>
                        <div><strong>1 KG:</strong> ${currency} ${Number(p.price_1kg).toLocaleString()}</div>
                    </div>
                </td>
                <td>
                    ${p.in_stock ? `<span class="status-tag delivered">In Stock (${p.stock_quantity || 50})</span>` : `<span class="status-tag cancelled">Out of Stock</span>`}
                </td>
                <td>
                    ${p.badge ? `<span style="background: #faf3e0; color: #b45309; font-weight: 700; font-size: 0.75rem; padding: 2px 7px; border-radius: 4px;">${p.badge}</span>` : '—'}
                </td>
                <td>
                    <div class="table-btn-group">
                        <button class="table-icon-btn" onclick="window.editProduct('${p.id}')" title="Edit Product">
                            <i class="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button class="table-icon-btn delete" onclick="window.deleteProduct('${p.id}')" title="Delete Product">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    // Add / Edit Product Modal Handlers
    if (btnOpenAddProduct) {
        btnOpenAddProduct.addEventListener('click', () => {
            currentEditProductId = null;
            productModalTitle.textContent = 'Add New Dry Fruit Product';
            productForm.reset();
            document.getElementById('prod-form-id').value = '';
            productModal.classList.add('active');
        });
    }

    if (btnCloseProductModal) {
        btnCloseProductModal.addEventListener('click', () => {
            productModal.classList.remove('active');
        });
    }

    window.editProduct = function (id) {
        const prod = allProducts.find(p => p.id === id);
        if (!prod) return;

        currentEditProductId = id;
        productModalTitle.textContent = 'Edit Product Details';

        document.getElementById('prod-form-id').value = prod.id;
        document.getElementById('prod-form-name').value = prod.name;
        document.getElementById('prod-form-urdu').value = prod.urdu_name || '';
        document.getElementById('prod-form-category').value = prod.category;
        document.getElementById('prod-form-price250').value = prod.price_250g;
        document.getElementById('prod-form-price500').value = prod.price_500g;
        document.getElementById('prod-form-price1kg').value = prod.price_1kg;
        document.getElementById('prod-form-orig1kg').value = prod.original_price_1kg || '';
        document.getElementById('prod-form-origin').value = prod.origin || '';
        document.getElementById('prod-form-image').value = prod.image_url;
        document.getElementById('prod-form-badge').value = prod.badge || '';
        document.getElementById('prod-form-stock').value = prod.stock_quantity || 50;
        document.getElementById('prod-form-desc').value = prod.description || '';

        productModal.classList.add('active');
    };

    window.deleteProduct = async function (id) {
        const prod = allProducts.find(p => p.id === id);
        const name = prod ? prod.name : 'this product';
        if (confirm(`Are you sure you want to delete "${name}"?`)) {
            await window.dbService.deleteProduct(id);
            await fetchAndRenderProducts();
            updateMetrics();
            alert('Product removed.');
        }
    };

    if (productForm) {
        productForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const productData = {
                id: document.getElementById('prod-form-id').value || ('prod-' + Date.now()),
                name: document.getElementById('prod-form-name').value.trim(),
                urdu_name: document.getElementById('prod-form-urdu').value.trim(),
                category: document.getElementById('prod-form-category').value,
                price_250g: Number(document.getElementById('prod-form-price250').value),
                price_500g: Number(document.getElementById('prod-form-price500').value),
                price_1kg: Number(document.getElementById('prod-form-price1kg').value),
                original_price_1kg: Number(document.getElementById('prod-form-orig1kg').value) || null,
                origin: document.getElementById('prod-form-origin').value.trim(),
                image_url: document.getElementById('prod-form-image').value.trim(),
                badge: document.getElementById('prod-form-badge').value.trim(),
                stock_quantity: Number(document.getElementById('prod-form-stock').value) || 50,
                description: document.getElementById('prod-form-desc').value.trim(),
                in_stock: true,
                is_featured: true,
                created_at: new Date().toISOString()
            };

            await window.dbService.saveProduct(productData);
            productModal.classList.remove('active');
            await fetchAndRenderProducts();
            updateMetrics();
            alert('Product saved successfully!');
        });
    }

    if (searchProductsInput) {
        searchProductsInput.addEventListener('input', renderProductsTable);
    }

    // Preset Image Helper for Admin
    window.setPresetImage = function (url) {
        const input = document.getElementById('prod-form-image');
        if (input) input.value = url;
    };

    // ==========================================
    // Orders Management
    // ==========================================
    async function fetchAndRenderOrders() {
        allOrders = await window.dbService.getOrders();
        renderOrdersTable();
    }

    function renderOrdersTable() {
        if (!ordersTableBody) return;
        const query = (searchOrdersInput?.value || '').toLowerCase().trim();

        const filtered = allOrders.filter(o => {
            return !query ||
                o.id.toLowerCase().includes(query) ||
                o.customer_name.toLowerCase().includes(query) ||
                o.customer_phone.includes(query) ||
                o.city.toLowerCase().includes(query);
        });

        if (filtered.length === 0) {
            ordersTableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 2.5rem; color: var(--adm-muted);">
                        No orders recorded yet.
                    </td>
                </tr>
            `;
            return;
        }

        const config = window.STORE_CONFIG || {};
        const currency = config.currency || 'Rs.';

        ordersTableBody.innerHTML = filtered.map(o => {
            const dateStr = o.created_at ? new Date(o.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Recent';
            
            // Format items
            const itemsSummary = (o.items || []).map(i => {
                return `• ${i.name} (${i.weight || '500g'}) × ${i.quantity}`;
            }).join('<br/>');

            const statusClass = (o.status || 'pending').toLowerCase();

            return `
                <tr>
                    <td>
                        <strong style="color: var(--adm-primary); font-size: 0.95rem;">#${o.id}</strong>
                        <div style="font-size: 0.75rem; color: var(--adm-muted);">${dateStr}</div>
                    </td>
                    <td>
                        <div style="font-weight: 700; color: var(--adm-primary);">${o.customer_name}</div>
                        <div style="font-size: 0.8rem; color: var(--adm-muted);">${o.customer_phone}</div>
                        <button class="btn-order-whatsapp" onclick="window.chatWithCustomer('${o.customer_phone}', '${o.customer_name}', '${o.id}', ${o.total_amount})" style="margin-top: 4px;">
                            <i class="fa-brands fa-whatsapp"></i> WhatsApp
                        </button>
                    </td>
                    <td>
                        <div style="font-size: 0.82rem; max-width: 200px;">
                            <div>${o.delivery_address}</div>
                            <strong style="color: var(--adm-primary);">${o.city}</strong>
                            ${o.notes ? `<div style="font-style: italic; color: var(--adm-muted); font-size: 0.75rem;">Note: ${o.notes}</div>` : ''}
                        </div>
                    </td>
                    <td>
                        <div style="font-size: 0.82rem; line-height: 1.4; max-width: 220px;">
                            ${itemsSummary}
                        </div>
                    </td>
                    <td>
                        <strong style="color: var(--adm-primary); font-size: 1rem;">${currency} ${Number(o.total_amount).toLocaleString()}</strong>
                        <div style="font-size: 0.72rem; color: var(--adm-muted);">${o.payment_method || 'COD'}</div>
                    </td>
                    <td>
                        <select onchange="window.changeOrderStatus('${o.id}', this.value)" style="padding: 4px 8px; border-radius: 6px; border: 1px solid var(--adm-border); font-size: 0.8rem; font-weight: 600;">
                            <option value="Pending" ${o.status === 'Pending' ? 'selected' : ''}>⏳ Pending</option>
                            <option value="Processing" ${o.status === 'Processing' ? 'selected' : ''}>📦 Processing</option>
                            <option value="Shipped" ${o.status === 'Shipped' ? 'selected' : ''}>🚚 Shipped</option>
                            <option value="Delivered" ${o.status === 'Delivered' ? 'selected' : ''}>✅ Delivered</option>
                            <option value="Cancelled" ${o.status === 'Cancelled' ? 'selected' : ''}>❌ Cancelled</option>
                        </select>
                    </td>
                    <td>
                        <button class="table-icon-btn" onclick="window.viewOrderInvoice('${o.id}')" title="View Details">
                            <i class="fa-solid fa-eye"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    if (searchOrdersInput) {
        searchOrdersInput.addEventListener('input', renderOrdersTable);
    }

    // Direct WhatsApp message to customer from Admin
    window.chatWithCustomer = function (phone, name, orderId, total) {
        // Clean phone number
        let cleanPhone = phone.replace(/[^0-9]/g, '');
        if (cleanPhone.startsWith('03')) {
            cleanPhone = '92' + cleanPhone.slice(1);
        }
        const config = window.STORE_CONFIG || {};
        const currency = config.currency || 'Rs.';

        const message = 
`Assalam-o-Alaikum ${name}! 
This is Al Naseeb Dry Fruit Shop regarding your Order #${orderId}.
Total Amount: ${currency} ${Number(total).toLocaleString()} (Cash on Delivery).

Your order has been received and is being packed fresh. We will notify you once dispatched. Please feel free to ask if you have any questions!`;

        window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
    };

    window.changeOrderStatus = async function (orderId, newStatus) {
        await window.dbService.updateOrderStatus(orderId, newStatus);
        const order = allOrders.find(o => o.id === orderId);
        if (order) order.status = newStatus;
        updateMetrics();
    };

    window.viewOrderInvoice = function (orderId) {
        const o = allOrders.find(ord => ord.id === orderId);
        if (!o) return;

        const config = window.STORE_CONFIG || {};
        const currency = config.currency || 'Rs.';

        alert(`Al Naseeb Dry Fruits - Order Invoice\n` +
              `------------------------------------\n` +
              `Order ID: #${o.id}\n` +
              `Customer: ${o.customer_name}\n` +
              `Phone: ${o.customer_phone}\n` +
              `Address: ${o.delivery_address}, ${o.city}\n` +
              `Total Bill: ${currency} ${o.total_amount}\n` +
              `Status: ${o.status}\n` +
              `Payment: ${o.payment_method}`);
    };

    // ==========================================
    // Supabase & Settings Handlers
    // ==========================================
    function populateSettingsForm() {
        const config = window.STORE_CONFIG || {};
        if (supabaseUrlInput) supabaseUrlInput.value = config.supabaseUrl || '';
        if (supabaseKeyInput) supabaseKeyInput.value = config.supabaseAnonKey || '';

        const setVal = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.value = val || '';
        };

        setVal('cfg-store-name', config.storeName);
        setVal('cfg-whatsapp-num', config.whatsappNumber);
        setVal('cfg-display-phone', config.phoneDisplay);
        setVal('cfg-display-email', config.emailDisplay);
        setVal('cfg-free-thresh', config.freeDeliveryThreshold);
        setVal('cfg-shipping-fee', config.standardShippingFee);
        setVal('cfg-admin-pin', config.adminPin);
    }

    if (btnTestDb) {
        btnTestDb.addEventListener('click', async () => {
            btnTestDb.disabled = true;
            btnTestDb.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Testing Connection...`;
            dbTestResult.innerHTML = '';

            const res = await window.dbService.testConnection();

            if (res.success) {
                dbTestResult.innerHTML = `<div style="color: #15803d; font-weight: 600; margin-top: 0.5rem;"><i class="fa-solid fa-circle-check"></i> ${res.message}</div>`;
            } else if (res.tableMissing) {
                dbTestResult.innerHTML = `<div style="color: #b45309; font-weight: 600; margin-top: 0.5rem;"><i class="fa-solid fa-triangle-exclamation"></i> ${res.message}</div>`;
            } else {
                dbTestResult.innerHTML = `<div style="color: #dc2626; font-weight: 600; margin-top: 0.5rem;"><i class="fa-solid fa-circle-xmark"></i> ${res.message}</div>`;
            }

            btnTestDb.disabled = false;
            btnTestDb.innerHTML = `<i class="fa-solid fa-plug"></i> Test Connection`;
            checkDbStatus();
        });
    }

    if (btnSeedDb) {
        btnSeedDb.addEventListener('click', async () => {
            btnSeedDb.disabled = true;
            btnSeedDb.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Seeding Database...`;

            const res = await window.dbService.seedProductsToSupabase();
            if (res.success) {
                alert(`Success! Seeded ${res.count} products into Supabase.`);
                await fetchAndRenderProducts();
            } else {
                alert(`Seed failed: ${res.message}\nMake sure you have created the 'products' table using supabase_schema.sql first.`);
            }

            btnSeedDb.disabled = false;
            btnSeedDb.innerHTML = `<i class="fa-solid fa-database"></i> Seed Default Products into Supabase`;
        });
    }

    if (btnCopySql) {
        btnCopySql.addEventListener('click', () => {
            const sql = `-- ==========================================================
-- Al Naseeb Dry Fruit Shop - SQL Setup
-- Run this in your Supabase SQL Editor
-- ==========================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    urdu_name TEXT,
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

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public products view" ON products FOR SELECT USING (true);
CREATE POLICY "Public products insert/update" ON products FOR ALL USING (true);

CREATE POLICY "Public orders insert" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Public orders select" ON orders FOR SELECT USING (true);
CREATE POLICY "Public orders update" ON orders FOR UPDATE USING (true);
`;
            navigator.clipboard.writeText(sql).then(() => {
                alert('Supabase SQL Schema copied to clipboard! Paste it into Supabase -> SQL Editor and hit Run.');
            }).catch(() => {
                alert('Please copy the contents from supabase_schema.sql file in the root directory.');
            });
        });
    }

    if (settingsForm) {
        settingsForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const updatedConfig = {
                supabaseUrl: supabaseUrlInput.value.trim(),
                supabaseAnonKey: supabaseKeyInput.value.trim(),
                storeName: document.getElementById('cfg-store-name').value.trim(),
                whatsappNumber: document.getElementById('cfg-whatsapp-num').value.trim(),
                phoneDisplay: document.getElementById('cfg-display-phone').value.trim(),
                emailDisplay: document.getElementById('cfg-display-email').value.trim(),
                freeDeliveryThreshold: Number(document.getElementById('cfg-free-thresh').value),
                standardShippingFee: Number(document.getElementById('cfg-shipping-fee').value),
                adminPin: document.getElementById('cfg-admin-pin').value.trim()
            };

            window.saveStoreConfig(updatedConfig);
            // Reinitialize DB Client with updated credentials
            window.dbService.initClient();
            checkDbStatus();
            alert('Settings saved successfully!');
        });
    }

    function setupEventListeners() {
        // Refresh & Sync Orders
        const btnSyncOrders = document.getElementById('btn-sync-orders');
        if (btnSyncOrders) {
            btnSyncOrders.addEventListener('click', async () => {
                btnSyncOrders.disabled = true;
                btnSyncOrders.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Syncing...`;
                const res = await window.dbService.syncPendingOrdersToSupabase();
                await fetchAndRenderOrders();
                updateMetrics();
                btnSyncOrders.disabled = false;
                btnSyncOrders.innerHTML = `<i class="fa-solid fa-arrows-rotate"></i> Refresh & Sync`;
                alert(`Sync check completed! ${res.synced} offline order(s) synced to Supabase.`);
            });
        }

        // Logout / Lock
        const btnLogout = document.getElementById('btn-admin-logout');
        if (btnLogout) {
            btnLogout.addEventListener('click', () => {
                sessionStorage.removeItem('alnaseeb_admin_authenticated');
                window.location.reload();
            });
        }
    }

    // Run on DOM Ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
