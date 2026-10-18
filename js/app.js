/**
 * Al Naseeb Dry Fruit Shop - Storefront Application Script
 * ---------------------------------------------------------
 * Features:
 * - Real-time product listing with category filter & live search
 * - Interactive weight selector (250g, 500g, 1kg) with dynamic price calculation
 * - Dynamic Cart drawer with persistent localStorage
 * - Seamless Cash-on-Delivery checkout with Supabase synchronization
 * - Direct one-click WhatsApp order generation for single items or full cart
 * - Product details modal with origin & nutritional highlights
 */

(function () {
    'use strict';

    // Application State
    let products = [];
    let cart = [];
    let activeCategory = 'all';
    let searchQuery = '';
    let selectedWeights = {}; // Map of productId -> '250g' | '500g' | '1kg'

    // DOM Elements
    const productsGrid = document.getElementById('products-grid');
    const categoryTabs = document.querySelectorAll('.cat-tab-btn');
    const searchInput = document.getElementById('search-input');
    const cartToggleBtn = document.getElementById('btn-cart-toggle');
    const cartDrawer = document.getElementById('cart-drawer');
    const cartOverlay = document.getElementById('cart-overlay');
    const btnCloseCart = document.getElementById('btn-close-cart');
    const cartItemsList = document.getElementById('cart-items-list');
    const cartBadgeCount = document.getElementById('cart-badge-count');
    const cartSubtotalEl = document.getElementById('cart-subtotal');
    const cartShippingEl = document.getElementById('cart-shipping');
    const cartTotalEl = document.getElementById('cart-total');
    const btnCheckoutModal = document.getElementById('btn-open-checkout');
    const btnCheckoutWhatsapp = document.getElementById('btn-cart-whatsapp');
    const checkoutModal = document.getElementById('checkout-modal');
    const btnCloseCheckout = document.getElementById('btn-close-checkout');
    const checkoutForm = document.getElementById('checkout-form');
    const productModal = document.getElementById('product-modal');
    const btnCloseProductModal = document.getElementById('btn-close-product-modal');
    const floatingWhatsappBtn = document.getElementById('floating-whatsapp');

    // ==========================================
    // Initialization
    // ==========================================
    async function init() {
        loadCartFromStorage();
        updateCartUI();
        setupEventListeners();
        await loadProducts();
        setupFloatingWhatsapp();
        // Background sync any unsynced orders to Supabase
        window.dbService.syncPendingOrdersToSupabase();
    }

    // Load products from DB Service
    async function loadProducts() {
        try {
            renderLoadingSkeleton();
            products = await window.dbService.getProducts();
            // Default selected weight to 500g for each product
            products.forEach(p => {
                if (!selectedWeights[p.id]) {
                    selectedWeights[p.id] = '500g';
                }
            });
            renderProducts();
        } catch (err) {
            console.error("Failed to load products:", err);
            showToast("Failed to load products. Check network.", "error");
        }
    }

    // Loading Skeleton UI
    function renderLoadingSkeleton() {
        if (!productsGrid) return;
        productsGrid.innerHTML = Array(6).fill(0).map(() => `
            <div class="product-card" style="opacity: 0.6; min-height: 380px; display:flex; align-items:center; justify-content:center;">
                <div style="text-align: center; color: var(--text-muted);">
                    <i class="fa-solid fa-spinner fa-spin fa-2x" style="color: var(--accent-gold); margin-bottom: 0.8rem;"></i>
                    <p>Loading fresh harvests...</p>
                </div>
            </div>
        `).join('');
    }

    // ==========================================
    // Render Products Grid
    // ==========================================
    function renderProducts() {
        if (!productsGrid) return;

        const config = window.STORE_CONFIG || {};
        const currency = config.currency || 'Rs.';

        // Filter products
        const filtered = products.filter(p => {
            const matchesCat = (activeCategory === 'all' || p.category === activeCategory);
            const matchesSearch = !searchQuery || 
                p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (p.urdu_name && p.urdu_name.includes(searchQuery)) ||
                (p.origin && p.origin.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
            return matchesCat && matchesSearch;
        });

        if (filtered.length === 0) {
            productsGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem;">
                    <i class="fa-solid fa-box-open fa-3x" style="color: var(--accent-gold); margin-bottom: 1rem;"></i>
                    <h3 style="color: var(--primary); margin-bottom: 0.5rem;">No Dry Fruits Found</h3>
                    <p style="color: var(--text-muted); margin-bottom: 1.5rem;">Try adjusting your search query or category filter.</p>
                    <button class="btn-primary" onclick="window.resetStoreFilters()">View All Dry Fruits</button>
                </div>
            `;
            return;
        }

        productsGrid.innerHTML = filtered.map(p => {
            const currentWeight = selectedWeights[p.id] || '500g';
            const price = getProductPrice(p, currentWeight);
            const originalPrice = p.original_price_1kg ? Math.round((p.original_price_1kg / 1000) * getGrams(currentWeight)) : null;

            return `
                <div class="product-card" data-id="${p.id}">
                    <div class="card-media" onclick="window.openProductModal('${p.id}')">
                        <img src="${p.image_url}" alt="${p.name}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1508061252445-5350f379c132?auto=format&fit=crop&w=800&q=80'" />
                        ${p.badge ? `<span class="card-badge ${p.badge.toLowerCase().includes('sale') ? 'sale' : ''}">${p.badge}</span>` : ''}
                        ${p.origin ? `<span class="card-origin"><i class="fa-solid fa-location-dot"></i> ${p.origin}</span>` : ''}
                    </div>
                    
                    <div class="card-body">
                        <div class="card-rating">
                            <i class="fa-solid fa-star"></i>
                            <i class="fa-solid fa-star"></i>
                            <i class="fa-solid fa-star"></i>
                            <i class="fa-solid fa-star"></i>
                            <i class="fa-solid fa-star"></i>
                            <span>(${p.reviews_count || 42})</span>
                        </div>

                        <h3 class="card-title" onclick="window.openProductModal('${p.id}')">${p.name}</h3>
                        ${p.urdu_name ? `<div class="card-urdu urdu-text">${p.urdu_name}</div>` : ''}

                        <!-- Weight Pills Selector -->
                        <div class="weight-selector" data-prod-id="${p.id}">
                            <div class="weight-pill ${currentWeight === '250g' ? 'active' : ''}" onclick="window.setProductWeight('${p.id}', '250g')">250 Gram</div>
                            <div class="weight-pill ${currentWeight === '500g' ? 'active' : ''}" onclick="window.setProductWeight('${p.id}', '500g')">500 Gram</div>
                            <div class="weight-pill ${currentWeight === '1kg' ? 'active' : ''}" onclick="window.setProductWeight('${p.id}', '1kg')">1 KG</div>
                        </div>

                        <!-- Price Row -->
                        <div class="card-price-row">
                            <span class="current-price">${currency} ${price.toLocaleString()}</span>
                            ${originalPrice && originalPrice > price ? `<span class="original-price">${currency} ${originalPrice.toLocaleString()}</span>` : ''}
                        </div>

                        <!-- Action Buttons -->
                        <div class="card-actions">
                            <button class="btn-card-cart" onclick="window.addToCartFromCard('${p.id}')">
                                <i class="fa-solid fa-cart-plus"></i> Add to Cart
                            </button>
                            <button class="btn-card-whatsapp" onclick="window.orderOnWhatsAppDirect('${p.id}')">
                                <i class="fa-brands fa-whatsapp"></i> WhatsApp
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Helper: Calculate price based on weight
    function getProductPrice(product, weight) {
        if (weight === '250g') return Number(product.price_250g);
        if (weight === '500g') return Number(product.price_500g);
        return Number(product.price_1kg);
    }

    function getGrams(weight) {
        if (weight === '250g') return 250;
        if (weight === '500g') return 500;
        return 1000;
    }

    // Window Exposure for inline click handlers
    window.setProductWeight = function (productId, weight) {
        selectedWeights[productId] = weight;
        renderProducts();
    };

    window.resetStoreFilters = function () {
        activeCategory = 'all';
        searchQuery = '';
        if (searchInput) searchInput.value = '';
        categoryTabs.forEach(t => t.classList.remove('active'));
        const allTab = document.querySelector('.cat-tab-btn[data-category="all"]');
        if (allTab) allTab.classList.add('active');
        renderProducts();
    };

    // ==========================================
    // Cart Management
    // ==========================================
    function loadCartFromStorage() {
        try {
            const stored = localStorage.getItem('alnaseeb_cart');
            if (stored) {
                cart = JSON.parse(stored);
            }
        } catch (e) {
            cart = [];
        }
    }

    function saveCartToStorage() {
        try {
            localStorage.setItem('alnaseeb_cart', JSON.stringify(cart));
        } catch (e) {}
    }

    window.addToCartFromCard = function (productId) {
        const prod = products.find(p => p.id === productId);
        if (!prod) return;

        const weight = selectedWeights[productId] || '500g';
        const price = getProductPrice(prod, weight);

        // Check if item with same ID and same weight is already in cart
        const existingIdx = cart.findIndex(item => item.id === prod.id && item.weight === weight);
        if (existingIdx >= 0) {
            cart[existingIdx].quantity += 1;
        } else {
            cart.push({
                id: prod.id,
                name: prod.name,
                weight: weight,
                price: price,
                quantity: 1,
                image: prod.image_url
            });
        }

        saveCartToStorage();
        updateCartUI();
        openCartDrawer();
        showToast(`Added ${prod.name} (${weight}) to your cart!`, "success");
    };

    window.changeCartQty = function (index, delta) {
        if (!cart[index]) return;
        cart[index].quantity += delta;
        if (cart[index].quantity <= 0) {
            cart.splice(index, 1);
        }
        saveCartToStorage();
        updateCartUI();
    };

    window.removeFromCart = function (index) {
        if (!cart[index]) return;
        const removed = cart.splice(index, 1);
        saveCartToStorage();
        updateCartUI();
        showToast(`Removed from cart`, "info");
    };

    function updateCartUI() {
        const config = window.STORE_CONFIG || {};
        const currency = config.currency || 'Rs.';
        const freeThreshold = config.freeDeliveryThreshold || 3000;
        const standardShipping = config.standardShippingFee || 250;

        // Total count
        const totalCount = cart.reduce((acc, item) => acc + item.quantity, 0);
        if (cartBadgeCount) {
            cartBadgeCount.textContent = totalCount;
            cartBadgeCount.style.display = totalCount > 0 ? 'flex' : 'none';
        }

        if (!cartItemsList) return;

        if (cart.length === 0) {
            cartItemsList.innerHTML = `
                <div class="empty-cart-state">
                    <div class="empty-cart-icon"><i class="fa-solid fa-bag-shopping"></i></div>
                    <h4 style="color: var(--primary); margin-bottom: 0.4rem;">Your Basket is Empty</h4>
                    <p style="font-size: 0.85rem;">Discover our royal selection of fresh almonds, pistachios, dates & walnuts!</p>
                </div>
            `;
            if (cartSubtotalEl) cartSubtotalEl.textContent = `${currency} 0`;
            if (cartShippingEl) cartShippingEl.textContent = `${currency} 0`;
            if (cartTotalEl) cartTotalEl.textContent = `${currency} 0`;
            if (btnCheckoutModal) btnCheckoutModal.disabled = true;
            if (btnCheckoutWhatsapp) btnCheckoutWhatsapp.disabled = true;
            return;
        }

        if (btnCheckoutModal) btnCheckoutModal.disabled = false;
        if (btnCheckoutWhatsapp) btnCheckoutWhatsapp.disabled = false;

        const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        const shipping = subtotal >= freeThreshold ? 0 : standardShipping;
        const total = subtotal + shipping;

        // Render Cart items
        cartItemsList.innerHTML = cart.map((item, idx) => `
            <div class="cart-item-row">
                <img src="${item.image}" class="cart-item-img" alt="${item.name}" />
                <div class="cart-item-info">
                    <button class="btn-remove-item" onclick="window.removeFromCart(${idx})" title="Remove item">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                    <h4 class="cart-item-title">${item.name}</h4>
                    <div class="cart-item-weight">Pack: <span>${item.weight}</span></div>
                    <div class="cart-item-qty-row">
                        <div class="qty-controls">
                            <button class="qty-btn" onclick="window.changeCartQty(${idx}, -1)">-</button>
                            <span class="qty-val">${item.quantity}</span>
                            <button class="qty-btn" onclick="window.changeCartQty(${idx}, 1)">+</button>
                        </div>
                        <span class="cart-item-price">${currency} ${(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                </div>
            </div>
        `).join('');

        if (cartSubtotalEl) cartSubtotalEl.textContent = `${currency} ${subtotal.toLocaleString()}`;
        if (cartShippingEl) {
            cartShippingEl.textContent = shipping === 0 ? 'FREE (Special Offer)' : `${currency} ${shipping}`;
        }
        if (cartTotalEl) cartTotalEl.textContent = `${currency} ${total.toLocaleString()}`;
    }

    function openCartDrawer() {
        if (cartDrawer) cartDrawer.classList.add('active');
        if (cartOverlay) cartOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeCartDrawer() {
        if (cartDrawer) cartDrawer.classList.remove('active');
        if (cartOverlay) cartOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    // ==========================================
    // WhatsApp Integrations
    // ==========================================
    function setupFloatingWhatsapp() {
        const config = window.STORE_CONFIG || {};
        const number = config.whatsappNumber || '923001234567';
        if (floatingWhatsappBtn) {
            floatingWhatsappBtn.addEventListener('click', () => {
                const message = encodeURIComponent(`Assalam-o-Alaikum Al Naseeb Dry Fruit Shop! I am browsing your online store and would like to inquire about your premium dry fruits.`);
                window.open(`https://wa.me/${number}?text=${message}`, '_blank');
            });
        }
    }

    // Direct WhatsApp button on each product card
    window.orderOnWhatsAppDirect = function (productId) {
        const prod = products.find(p => p.id === productId);
        if (!prod) return;

        const config = window.STORE_CONFIG || {};
        const number = config.whatsappNumber || '923001234567';
        const currency = config.currency || 'Rs.';
        const weight = selectedWeights[productId] || '500g';
        const price = getProductPrice(prod, weight);

        const text = 
`*السلام علیکم - AL NASEEB DRY FRUIT SHOP*
I would like to order this item:

🏷️ *Product:* ${prod.name}
⚖️ *Pack Size:* ${weight}
💰 *Price:* ${currency} ${price.toLocaleString()}
📍 *Origin:* ${prod.origin || 'Balochistan'}

Please confirm availability and delivery details. My address is:`;

        window.open(`https://wa.me/${number}?text=${encodeURIComponent(text)}`, '_blank');
    };

    // Checkout Whole Cart via WhatsApp
    function checkoutViaWhatsApp() {
        if (cart.length === 0) return;
        const config = window.STORE_CONFIG || {};
        const number = config.whatsappNumber || '923001234567';
        const currency = config.currency || 'Rs.';
        const freeThreshold = config.freeDeliveryThreshold || 3000;
        const standardShipping = config.standardShippingFee || 250;

        const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        const shipping = subtotal >= freeThreshold ? 0 : standardShipping;
        const total = subtotal + shipping;

        let itemsText = cart.map((item, i) => {
            return `${i + 1}. *${item.name}* (${item.weight}) x ${item.quantity} = ${currency} ${(item.price * item.quantity).toLocaleString()}`;
        }).join('\n');

        const message = 
`*السلام علیکم - AL NASEEB DRY FRUITS ORDER*
━━━━━━━━━━━━━━━━━━
I would like to place an order from your website:

${itemsText}

━━━━━━━━━━━━━━━━━━
Subtotal: ${currency} ${subtotal.toLocaleString()}
Delivery Fee: ${shipping === 0 ? 'FREE' : currency + ' ' + shipping}
*TOTAL AMOUNT: ${currency} ${total.toLocaleString()}*
Payment: Cash on Delivery (COD)

*My Delivery Details:*
Name: 
Phone: 
Complete Address: 
City: 
Special Instructions: `;

        window.open(`https://wa.me/${number}?text=${encodeURIComponent(message)}`, '_blank');
    }

    // ==========================================
    // Checkout Modal & Supabase Order Placement
    // ==========================================
    function openCheckoutModal() {
        if (cart.length === 0) return;
        closeCartDrawer();
        if (checkoutModal) checkoutModal.classList.add('active');
    }

    function closeCheckoutModal() {
        if (checkoutModal) checkoutModal.classList.remove('active');
    }

    async function handleCheckoutSubmit(e) {
        e.preventDefault();
        if (cart.length === 0) return;

        const submitBtn = checkoutForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Processing Order...`;

        const config = window.STORE_CONFIG || {};
        const currency = config.currency || 'Rs.';
        const freeThreshold = config.freeDeliveryThreshold || 3000;
        const standardShipping = config.standardShippingFee || 250;

        const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        const shipping = subtotal >= freeThreshold ? 0 : standardShipping;
        const total = subtotal + shipping;

        const orderData = {
            id: 'ORD-' + Math.floor(100000 + Math.random() * 900000),
            customer_name: document.getElementById('cust-name').value.trim(),
            customer_phone: document.getElementById('cust-phone').value.trim(),
            customer_email: (document.getElementById('cust-email')?.value || '').trim(),
            delivery_address: document.getElementById('cust-address').value.trim(),
            city: document.getElementById('cust-city').value.trim(),
            notes: (document.getElementById('cust-notes')?.value || '').trim(),
            items: cart,
            subtotal: subtotal,
            delivery_fee: shipping,
            discount: 0,
            total_amount: total,
            payment_method: 'Cash on Delivery (COD)',
            status: 'Pending',
            created_at: new Date().toISOString()
        };

        try {
            const res = await window.dbService.createOrder(orderData);
            const savedOrder = res.order || orderData;
            const isSupabase = res.savedToSupabase;
            
            // Clear Cart
            cart = [];
            saveCartToStorage();
            updateCartUI();
            closeCheckoutModal();

            // Display Success Screen / Modal
            renderOrderSuccess(savedOrder, isSupabase);
        } catch (err) {
            console.error("Order creation failed:", err);
            showToast("Error saving order. Please try ordering via WhatsApp.", "error");
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    }

    function renderOrderSuccess(order, isSupabase) {
        const config = window.STORE_CONFIG || {};
        const currency = config.currency || 'Rs.';
        const number = config.whatsappNumber || '923001234567';

        const successModal = document.createElement('div');
        successModal.className = 'modal-overlay active';
        successModal.innerHTML = `
            <div class="modal-card" style="text-align: center; padding: 2.5rem 1.5rem;">
                <div style="width: 70px; height: 70px; border-radius: 50%; background: #dcfce7; color: #15803d; font-size: 2rem; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.25rem;">
                    <i class="fa-solid fa-check"></i>
                </div>
                <div style="margin-bottom: 0.5rem;">
                    <span style="display:inline-flex; align-items:center; gap:6px; background:${isSupabase ? '#dcfce7' : '#fef3c7'}; color:${isSupabase ? '#15803d' : '#b45309'}; padding:4px 12px; border-radius:9999px; font-size:0.8rem; font-weight:700;">
                        <i class="fa-solid ${isSupabase ? 'fa-cloud-arrow-up' : 'fa-database'}"></i> ${isSupabase ? 'Saved to Supabase Cloud' : 'Saved Locally & Synced'}
                    </span>
                </div>
                <h2 style="color: var(--primary); margin-bottom: 0.5rem;">Shukriya! Order Placed Successfully</h2>
                <p style="color: var(--text-muted); font-size: 0.95rem; margin-bottom: 1.25rem;">
                    Your Order ID is <strong style="color: var(--primary); font-size: 1.1rem;">#${order.id}</strong>.
                    Our team will pack your dry fruits fresh and dispatch them shortly.
                </p>
                <div style="background: #faf7f2; border: 1px solid var(--border-color); border-radius: 10px; padding: 1rem; margin-bottom: 1.5rem; text-align: left; font-size: 0.88rem;">
                    <div><strong>Customer:</strong> ${order.customer_name} (${order.customer_phone})</div>
                    <div><strong>Address:</strong> ${order.delivery_address}, ${order.city}</div>
                    <div><strong>Total Bill:</strong> ${currency} ${Number(order.total_amount).toLocaleString()} (Cash on Delivery)</div>
                </div>
                <div style="display: flex; flex-direction: column; gap: 0.65rem;">
                    <button class="btn-primary" onclick="window.sendOrderWhatsAppCopy('${order.id}', '${order.customer_name}', '${order.customer_phone}', ${order.total_amount})">
                        <i class="fa-brands fa-whatsapp"></i> Send Order Details to WhatsApp
                    </button>
                    <button class="btn-checkout-primary" style="background: #e2ede7; color: var(--primary);" onclick="this.closest('.modal-overlay').remove()">
                        Continue Shopping
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(successModal);
    }

    window.sendOrderWhatsAppCopy = function (orderId, name, phone, total) {
        const config = window.STORE_CONFIG || {};
        const number = config.whatsappNumber || '923001234567';
        const currency = config.currency || 'Rs.';
        const msg = encodeURIComponent(`Assalam-o-Alaikum! I have placed Order #${orderId} for ${name} (${phone}). Total Bill: ${currency} ${total}. Please confirm my parcel.`);
        window.open(`https://wa.me/${number}?text=${msg}`, '_blank');
    };

    // ==========================================
    // Product Quick View Modal
    // ==========================================
    window.openProductModal = function (productId) {
        const prod = products.find(p => p.id === productId);
        if (!prod || !productModal) return;

        const currentWeight = selectedWeights[productId] || '500g';
        const price = getProductPrice(prod, currentWeight);
        const config = window.STORE_CONFIG || {};
        const currency = config.currency || 'Rs.';

        const body = productModal.querySelector('.modal-body');
        body.innerHTML = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; align-items: start;">
                <div>
                    <img src="${prod.image_url}" alt="${prod.name}" style="width: 100%; height: 280px; object-fit: cover; border-radius: 12px; border: 1px solid var(--border-color);" />
                    <div style="margin-top: 1rem; display: flex; gap: 0.5rem;">
                        <span style="background: #f0fdf4; color: #166534; font-size: 0.75rem; padding: 4px 8px; border-radius: 4px; font-weight: 600;"><i class="fa-solid fa-leaf"></i> 100% Natural</span>
                        <span style="background: #faf3e0; color: #b45309; font-size: 0.75rem; padding: 4px 8px; border-radius: 4px; font-weight: 600;"><i class="fa-solid fa-award"></i> Grade A Quality</span>
                    </div>
                </div>
                <div>
                    <h3 style="color: var(--primary); font-size: 1.35rem; line-height: 1.2; margin-bottom: 0.35rem;">${prod.name}</h3>
                    ${prod.urdu_name ? `<p class="urdu-text" style="color: var(--accent-gold); font-size: 1.1rem; margin-bottom: 0.8rem;">${prod.urdu_name}</p>` : ''}
                    
                    <p style="font-size: 0.9rem; color: var(--text-muted); line-height: 1.6; margin-bottom: 1.25rem;">
                        ${prod.description}
                    </p>

                    <div style="background: #faf7f2; padding: 0.85rem; border-radius: 8px; margin-bottom: 1.25rem; font-size: 0.85rem;">
                        <div style="margin-bottom: 4px;"><strong>Origin:</strong> ${prod.origin || 'Pakistan / Regional Orchards'}</div>
                        <div style="margin-bottom: 4px;"><strong>Packaging:</strong> Food-grade airtight sealed pouch / box</div>
                        <div><strong>Shelf Life:</strong> 6 to 9 Months in cool, dry place</div>
                    </div>

                    <div style="margin-bottom: 1.25rem;">
                        <label style="font-size: 0.82rem; font-weight: 700; color: var(--primary); display: block; margin-bottom: 0.4rem;">SELECT PACK SIZE:</label>
                        <div class="weight-selector">
                            <div class="weight-pill ${currentWeight === '250g' ? 'active' : ''}" onclick="window.setProductWeight('${prod.id}', '250g'); window.openProductModal('${prod.id}');">250g</div>
                            <div class="weight-pill ${currentWeight === '500g' ? 'active' : ''}" onclick="window.setProductWeight('${prod.id}', '500g'); window.openProductModal('${prod.id}');">500g</div>
                            <div class="weight-pill ${currentWeight === '1kg' ? 'active' : ''}" onclick="window.setProductWeight('${prod.id}', '1kg'); window.openProductModal('${prod.id}');">1 KG</div>
                        </div>
                    </div>

                    <div style="font-size: 1.6rem; font-weight: 800; color: var(--primary); margin-bottom: 1.25rem;">
                        ${currency} ${price.toLocaleString()}
                    </div>

                    <div style="display: flex; gap: 0.6rem;">
                        <button class="btn-primary" style="flex: 1;" onclick="window.addToCartFromCard('${prod.id}'); window.closeProductModal();">
                            <i class="fa-solid fa-cart-plus"></i> Add to Basket
                        </button>
                        <button class="btn-whatsapp-outline" style="background: var(--whatsapp); border: none; color: #fff;" onclick="window.orderOnWhatsAppDirect('${prod.id}')">
                            <i class="fa-brands fa-whatsapp"></i> WhatsApp
                        </button>
                    </div>
                </div>
            </div>
        `;
        productModal.classList.add('active');
    };

    window.closeProductModal = function () {
        if (productModal) productModal.classList.remove('active');
    };

    // ==========================================
    // Event Listeners Setup
    // ==========================================
    function setupEventListeners() {
        // Category Tabs Filter
        categoryTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                categoryTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                activeCategory = tab.dataset.category || 'all';
                renderProducts();
            });
        });

        // Search Input
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                searchQuery = e.target.value.trim();
                renderProducts();
            });
        }

        // Cart Drawer Toggles
        if (cartToggleBtn) cartToggleBtn.addEventListener('click', openCartDrawer);
        if (btnCloseCart) btnCloseCart.addEventListener('click', closeCartDrawer);
        if (cartOverlay) cartOverlay.addEventListener('click', closeCartDrawer);

        // Checkout Triggers
        if (btnCheckoutModal) btnCheckoutModal.addEventListener('click', openCheckoutModal);
        if (btnCloseCheckout) btnCloseCheckout.addEventListener('click', closeCheckoutModal);
        if (btnCheckoutWhatsapp) btnCheckoutWhatsapp.addEventListener('click', checkoutViaWhatsApp);
        if (checkoutForm) checkoutForm.addEventListener('submit', handleCheckoutSubmit);

        // Product Modal Close
        if (btnCloseProductModal) btnCloseProductModal.addEventListener('click', window.closeProductModal);

        // Close modals on Esc key
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeCartDrawer();
                closeCheckoutModal();
                window.closeProductModal();
            }
        });
    }

    // Toast Helper
    function showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        const icon = type === 'success' ? 'fa-circle-check' : (type === 'error' ? 'fa-triangle-exclamation' : 'fa-bell');
        toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => toast.remove(), 300);
        }, 3200);
    }

    // Run on DOM Ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
