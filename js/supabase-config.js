/**
 * Al Naseeb Dry Fruit Shop - Supabase & Store Configuration
 * ---------------------------------------------------------
 * Contains your exact Supabase project credentials and store configuration.
 * Correct URL: https://gcqpmenyjnrnmyhutkwv.supabase.co (ref: gcqpmenyjnrnmyhutkwv)
 */

const DEFAULT_CONFIG = {
    // Supabase project credentials:
    supabaseUrl: "https://gcqpmenyjnrnmyhutkwv.supabase.co",
    supabaseAnonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjcXBtZW55am5ybm15aHV0a3d2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIzMzAyNTQsImV4cCI6MjEwNzkwNjI1NH0.WH5yePxjr-_YXFkkXBhGwqw5gon8VN-RKsklwZlZkaE",
    supabasePublishableKey: "sb_publishable_OHkBX4HeLyJ9kULOaRqc5w_C1m7GqbR",
    
    // Store Contact & WhatsApp Details
    storeName: "Al Naseeb Dry Fruit Shop",
    storeTagline: "Premium Quality Dry Fruits, Nuts & Royal Delights",
    storeUrduName: "ال نصیب ڈرائی فروٹس شاپ",
    whatsappNumber: "923001234567", // Format: international without +, e.g. 923001234567
    whatsappDisplay: "+92 300 1234567",
    phoneDisplay: "+92 300 1234567 / +92 321 7654321",
    emailDisplay: "info@alnaseebdryfruits.com",
    addressDisplay: "Shop #14, Royal Dry Fruit Market, Liaquat Bazaar, Quetta & Mall Road, Lahore",
    
    // Currency & Checkout Settings
    currency: "Rs.",
    freeDeliveryThreshold: 3000,
    standardShippingFee: 250,
    
    // Admin Security PIN (Changeable in settings)
    adminPin: "1234"
};

// Retrieve configuration (automatically migrates any old cached typo URL)
function getStoreConfig() {
    try {
        const storedStr = localStorage.getItem("alnaseeb_store_config");
        if (storedStr) {
            const parsed = JSON.parse(storedStr);
            // Auto-heal old typo if present in local storage
            if (parsed.supabaseUrl && parsed.supabaseUrl.includes("jnrmny")) {
                parsed.supabaseUrl = DEFAULT_CONFIG.supabaseUrl;
                localStorage.setItem("alnaseeb_store_config", JSON.stringify(parsed));
            }
            return { ...DEFAULT_CONFIG, ...parsed };
        }
    } catch (e) {
        console.warn("Could not read local store config:", e);
    }
    return { ...DEFAULT_CONFIG };
}

// Save configuration updates
function saveStoreConfig(newConfig) {
    try {
        const updated = { ...getStoreConfig(), ...newConfig };
        localStorage.setItem("alnaseeb_store_config", JSON.stringify(updated));
        window.STORE_CONFIG = updated;
        return true;
    } catch (e) {
        console.error("Failed to save store config:", e);
        return false;
    }
}

// Global reference
window.STORE_CONFIG = getStoreConfig();
window.saveStoreConfig = saveStoreConfig;
