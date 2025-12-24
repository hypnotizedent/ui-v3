/**
 * Print Shop OS - Supplier API Adapter
 * 
 * Provides functions to search and fetch product data from supplier APIs
 * (S&S Activewear, SanMar, AS Colour) via mintprints-api.ronny.works
 * 
 * Usage:
 *   import { searchProducts, getProduct, getTopProducts } from '@/lib/supplier-adapter'
 */

// =============================================================================
// API Configuration
// =============================================================================

const API_BASE = 'https://mintprints-api.ronny.works';

// =============================================================================
// Types
// =============================================================================

export interface SupplierProduct {
    sku: string;
    name: string;
    brand: string;
    supplier: 'sanmar' | 'ss_activewear' | 'as_colour' | 'alphabroder';
    category: string;
    basePrice: number;
    msrp?: number;
    isCurated?: boolean;
    totalOrdered?: number;
    description?: string;
    imageUrl?: string;
}

export interface ProductDetail extends SupplierProduct {
    colors: Array<{
        name: string;
        code: string;
        hex: string;
        imageUrl?: string;
    }>;
    sizes: Array<{
        code: string;
        name: string;
        sortOrder: number;
    }>;
    priceBreaks: Array<{
        minQty: number;
        maxQty?: number;
        price: number;
    }>;
    specifications?: Record<string, string>;
    inventory?: {
        total: number;
        byWarehouse?: Record<string, number>;
    };
}

export interface SearchParams {
    q?: string;
    limit?: number;
    category?: string;
    supplier?: string;
    brand?: string;
}

// =============================================================================
// API Functions
// =============================================================================

/**
 * Search for products across all suppliers
 */
export async function searchProducts(params: SearchParams = {}): Promise<SupplierProduct[]> {
    try {
        const queryParams = new URLSearchParams();
        if (params.q) queryParams.set('q', params.q);
        if (params.limit) queryParams.set('limit', params.limit.toString());
        if (params.category) queryParams.set('category', params.category);
        if (params.supplier) queryParams.set('supplier', params.supplier);
        if (params.brand) queryParams.set('brand', params.brand);

        const url = `${API_BASE}/api/supplier/search?${queryParams.toString()}`;
        console.log('[SupplierAdapter] Searching:', url);

        const response = await fetch(url);

        if (!response.ok) {
            console.error('[SupplierAdapter] Search failed:', response.status);
            return [];
        }

        const data = await response.json();
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error('[SupplierAdapter] Search error:', error);
        return [];
    }
}

/**
 * Get top/popular products
 */
export async function getTopProducts(
    limit: number = 20,
    category?: string
): Promise<SupplierProduct[]> {
    try {
        const queryParams = new URLSearchParams();
        queryParams.set('limit', limit.toString());
        if (category) queryParams.set('category', category);

        const url = `${API_BASE}/api/supplier/top-products?${queryParams.toString()}`;
        console.log('[SupplierAdapter] Fetching top products:', url);

        const response = await fetch(url);

        if (!response.ok) {
            console.error('[SupplierAdapter] Top products failed:', response.status);
            return [];
        }

        const data = await response.json();
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error('[SupplierAdapter] Top products error:', error);
        return [];
    }
}

/**
 * Get detailed product information by SKU
 */
export async function getProduct(sku: string): Promise<ProductDetail | null> {
    try {
        const url = `${API_BASE}/api/supplier/products/${encodeURIComponent(sku)}`;
        console.log('[SupplierAdapter] Fetching product:', url);

        const response = await fetch(url);

        if (!response.ok) {
            console.error('[SupplierAdapter] Product fetch failed:', response.status);
            return null;
        }

        return await response.json();
    } catch (error) {
        console.error('[SupplierAdapter] Product fetch error:', error);
        return null;
    }
}

/**
 * Get product colors
 */
export async function getProductColors(sku: string): Promise<ProductDetail['colors']> {
    try {
        const url = `${API_BASE}/api/supplier/products/${encodeURIComponent(sku)}/colors`;
        const response = await fetch(url);

        if (!response.ok) return [];
        return await response.json();
    } catch (error) {
        console.error('[SupplierAdapter] Colors fetch error:', error);
        return [];
    }
}

/**
 * Get product stock availability
 */
export async function getProductStock(
    sku: string,
    color?: string,
    size?: string
): Promise<{ available: boolean; quantity: number; warehouse?: string }> {
    try {
        const queryParams = new URLSearchParams();
        if (color) queryParams.set('color', color);
        if (size) queryParams.set('size', size);

        const url = `${API_BASE}/api/supplier/products/${encodeURIComponent(sku)}/stock?${queryParams.toString()}`;
        const response = await fetch(url);

        if (!response.ok) {
            return { available: false, quantity: 0 };
        }
        return await response.json();
    } catch (error) {
        console.error('[SupplierAdapter] Stock fetch error:', error);
        return { available: false, quantity: 0 };
    }
}

/**
 * Get product pricing with quantity breaks
 */
export async function getProductPricing(sku: string): Promise<ProductDetail['priceBreaks']> {
    try {
        const url = `${API_BASE}/api/supplier/products/${encodeURIComponent(sku)}/pricing`;
        const response = await fetch(url);

        if (!response.ok) return [];
        return await response.json();
    } catch (error) {
        console.error('[SupplierAdapter] Pricing fetch error:', error);
        return [];
    }
}

/**
 * Track product usage (for analytics)
 */
export async function trackProductUsage(sku: string, quantity: number): Promise<void> {
    try {
        await fetch(`${API_BASE}/api/supplier/products/${encodeURIComponent(sku)}/track`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quantity }),
        });
    } catch (error) {
        console.error('[SupplierAdapter] Track usage error:', error);
    }
}

// =============================================================================
// Export all functions
// =============================================================================

export const supplierApi = {
    searchProducts,
    getTopProducts,
    getProduct,
    getProductColors,
    getProductStock,
    getProductPricing,
    trackProductUsage,
};

export default supplierApi;
