/**
 * Print Shop OS - Data Hooks
 *
 * React hooks that connect UI components to data (dev data or real API)
 *
 * Usage:
 *   import { useOrders, useCustomers, useDashboardStats, useProductionStats } from '@/lib/hooks'
 */

import { useState, useEffect, useCallback } from 'react'
import {
  fetchOrders,
  fetchCustomers,
  fetchDashboardStats,
  fetchOrderById,
  fetchCustomerById,
  fetchOrderPayments,
  type Order,
  type Customer,
  type Payment
} from './api-adapter'
import { transformQuoteToOrder, type QuoteAsOrder } from './quote-adapter'

// Re-export for backwards compatibility
export {
  fetchOrders,
  fetchCustomers,
  fetchDashboardStats,
  fetchOrderById,
  fetchCustomerById,
  fetchOrderPayments,
  type Order,
  type Customer,
  type Payment
} from './api-adapter'

// =============================================================================
// Types
// =============================================================================

export interface ProductionStats {
  quote: number
  art: number
  screenprint: number
  embroidery: number
  dtg: number
  fulfillment: number
  complete: number
  total: number
}

// =============================================================================
// Constants
// =============================================================================

const API_BASE_URL = import.meta.env.VITE_DASHBOARD_API_URL || 'https://mintprints-api.ronny.works'

// Quote statuses that should appear on Quotes page, not Orders page
const QUOTE_STATUSES = [
  'QUOTE',
  'Quote Out For Approval - Email',
  'Quote Out For Approval - Viewed',
  'DRAFT'
]

// =============================================================================
// useProductionStats - Fetch production stats from API
// =============================================================================

export function useProductionStats() {
  const [stats, setStats] = useState<ProductionStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_BASE_URL}/api/production-stats`)
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }
      const data = await response.json()
      // API returns strings, convert to numbers
      setStats({
        quote: parseInt(data.quote, 10) || 0,
        art: parseInt(data.art, 10) || 0,
        screenprint: parseInt(data.screenprint, 10) || 0,
        embroidery: parseInt(data.embroidery, 10) || 0,
        dtg: parseInt(data.dtg, 10) || 0,
        fulfillment: parseInt(data.fulfillment, 10) || 0,
        complete: parseInt(data.complete, 10) || 0,
        total: parseInt(data.total, 10) || 0,
      })
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch production stats'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { stats, loading, error, refetch: load }
}

// =============================================================================
// useOrders - Fetch and manage orders list (legacy, uses transforms)
// =============================================================================

export function useOrders(options?: { limit?: number; status?: string }) {
  const [orders, setOrders] = useState<Order[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetchOrders(options)
      setOrders(result.orders)
      setTotal(result.total)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch orders'))
    } finally {
      setLoading(false)
    }
  }, [options?.limit, options?.status])

  useEffect(() => {
    load()
  }, [load])

  return { orders, total, loading, error, refetch: load }
}

// =============================================================================
// APIOrder type for direct API responses
// =============================================================================

export interface OrderListItem {
  id: number
  visual_id: string
  order_nickname: string | null
  status: string
  printavo_status_name: string
  customer_name: string
  total_amount: number
  due_date: string | null
  artwork_count: number
}

// =============================================================================
// useOrdersList - Fetch orders directly from API with pagination
// =============================================================================

export function useOrdersList(options?: {
  limit?: number
  page?: number  // 1-indexed page number (API uses page, not offset)
  status?: string
  excludeQuotes?: boolean  // Filter out quote statuses (for Orders page)
}) {
  const [orders, setOrders] = useState<OrderListItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (options?.limit) params.set('limit', String(options.limit))
      if (options?.page) params.set('page', String(options.page))  // API uses page, not offset
      if (options?.status && options.status !== 'all') params.set('status', options.status)
      // Add exclude_quotes param for API-side filtering
      if (options?.excludeQuotes) params.set('exclude_quotes', 'true')

      const response = await fetch(`${API_BASE_URL}/api/orders?${params}`)
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }
      const data = await response.json()

      // Map API response to our type
      let mappedOrders: OrderListItem[] = (data.orders || []).map((o: any) => ({
        id: o.id,
        visual_id: o.visual_id || String(o.id),
        order_nickname: o.order_nickname || o.nickname || null,
        status: o.status || 'unknown',
        printavo_status_name: o.printavo_status_name || o.status || '',
        customer_name: o.customer_name || 'Unknown',
        total_amount: parseFloat(o.total_amount) || parseFloat(o.total) || 0,
        due_date: o.due_date || null,
        artwork_count: o.artwork_count || 0,
      }))

      // Client-side filter for excludeQuotes (in case API doesn't support it)
      if (options?.excludeQuotes) {
        mappedOrders = mappedOrders.filter(o => !QUOTE_STATUSES.includes(o.printavo_status_name))
      }

      setOrders(mappedOrders)
      // Adjust total if filtering client-side
      setTotal(options?.excludeQuotes ? mappedOrders.length : (data.total || mappedOrders.length))
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch orders'))
    } finally {
      setLoading(false)
    }
  }, [options?.limit, options?.page, options?.status, options?.excludeQuotes])

  useEffect(() => {
    load()
  }, [load])

  return { orders, total, loading, error, refetch: load }
}

// =============================================================================
// useQuotesList - Fetch orders with quote statuses (for Quotes page)
// =============================================================================

export function useQuotesList(options?: {
  limit?: number
  page?: number
  search?: string
}) {
  const [quotes, setQuotes] = useState<OrderListItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // Fetch a larger batch to filter client-side for quotes
      // We need to fetch more since we're filtering client-side
      const params = new URLSearchParams()
      params.set('limit', String(500))  // Fetch more to find quotes
      if (options?.page) params.set('page', String(options.page))

      const response = await fetch(`${API_BASE_URL}/api/orders?${params}`)
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }
      const data = await response.json()

      // Map and filter to only quote statuses
      let mappedQuotes: OrderListItem[] = (data.orders || [])
        .map((o: any) => ({
          id: o.id,
          visual_id: o.visual_id || String(o.id),
          order_nickname: o.order_nickname || o.nickname || null,
          status: o.status || 'unknown',
          printavo_status_name: o.printavo_status_name || o.status || '',
          customer_name: o.customer_name || 'Unknown',
          total_amount: parseFloat(o.total_amount) || parseFloat(o.total) || 0,
          due_date: o.due_date || null,
          artwork_count: o.artwork_count || 0,
        }))
        .filter((o: OrderListItem) => QUOTE_STATUSES.includes(o.printavo_status_name))

      // Apply search filter if provided
      if (options?.search) {
        const searchLower = options.search.toLowerCase()
        mappedQuotes = mappedQuotes.filter(q =>
          q.visual_id.toLowerCase().includes(searchLower) ||
          q.customer_name.toLowerCase().includes(searchLower) ||
          (q.order_nickname && q.order_nickname.toLowerCase().includes(searchLower))
        )
      }

      setQuotes(mappedQuotes)
      setTotal(mappedQuotes.length)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch quotes'))
    } finally {
      setLoading(false)
    }
  }, [options?.limit, options?.page, options?.search])

  useEffect(() => {
    load()
  }, [load])

  return { quotes, total, loading, error, refetch: load }
}

// =============================================================================
// Quote Request Types (Customer-submitted requests)
// =============================================================================

export interface QuoteRequest {
  id: number
  quote_number: string
  quote_id: number | null
  customer_id: number | null
  customer_name: string | null
  customer_email: string | null
  product_type: string | null
  decoration_method: string | null
  quantity: number | null
  placements: string[]
  colors: number | null
  notes: string | null
  due_date: string | null
  budget_min: number | null
  budget_max: number | null
  artwork_ready: boolean
  contact_name: string | null
  contact_phone: string | null
  status: 'pending' | 'reviewed' | 'quoted' | 'sent' | 'approved' | 'declined' | 'rejected' | 'converted'
  estimated_price: number | null
  reviewed_by: string | null
  created_at: string
  updated_at: string | null
}

// =============================================================================
// useQuoteRequestsList - Fetch customer quote requests from API
// =============================================================================

export function useQuoteRequestsList(options?: {
  limit?: number
  status?: string
}) {
  const [requests, setRequests] = useState<QuoteRequest[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (options?.status && options.status !== 'all') {
        params.set('status', options.status)
      }

      const response = await fetch(`${API_BASE_URL}/api/quotes?${params}`)
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }
      const data = await response.json()

      // Map API response to our type
      const mappedRequests: QuoteRequest[] = (data.data || []).map((r: any) => ({
        id: r.id,
        quote_number: r.quote_number || `QR-${r.id}`,
        customer_id: r.customer_id,
        customer_name: r.customer_name || r.contact_name || 'Unknown',
        customer_email: r.customer_email || r.contact_email,
        product_type: r.product_type,
        decoration_method: r.decoration_method,
        quantity: r.quantity,
        placements: Array.isArray(r.placements) ? r.placements : (r.placements ? JSON.parse(r.placements) : []),
        colors: r.colors,
        notes: r.notes,
        due_date: r.due_date,
        budget_min: r.budget_min ? parseFloat(r.budget_min) : null,
        budget_max: r.budget_max ? parseFloat(r.budget_max) : null,
        artwork_ready: r.artwork_ready || false,
        contact_name: r.contact_name,
        contact_phone: r.contact_phone,
        status: r.status || 'pending',
        estimated_price: r.estimated_price ? parseFloat(r.estimated_price) : null,
        reviewed_by: r.reviewed_by,
        created_at: r.created_at,
        updated_at: r.updated_at,
      }))

      setRequests(mappedRequests)
      setTotal(mappedRequests.length)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch quote requests'))
    } finally {
      setLoading(false)
    }
  }, [options?.status])

  useEffect(() => {
    load()
  }, [load])

  return { requests, total, loading, error, refetch: load }
}

// =============================================================================
// Order Detail Types
// =============================================================================

export interface LineItemMockup {
  id: string
  url: string
  name: string
  thumbnail_url?: string | null
}

export interface LineItemImprint {
  id: number
  location: string | null
  decorationType: string | null
  description: string | null
  colorCount: number | null
  colors: string | null
  width: number | null
  height: number | null
  hasUnderbase: boolean | null
  stitchCount: number | null
  mockups: LineItemMockup[]
}

export interface OrderDetailLineItem {
  id: number
  groupId: string | null
  groupName: string | null
  styleNumber: string | null
  description: string | null
  color: string | null
  category: string | null
  unitCost: number
  totalQuantity: number
  totalCost: number
  sizes: {
    // Baby/Toddler
    '6m': number
    '12m': number
    '18m': number
    '24m': number
    '2t': number
    '3t': number
    '4t': number
    '5t': number
    // Youth
    yxs: number
    ys: number
    ym: number
    yl: number
    yxl: number
    // Adult
    xs: number
    s: number
    m: number
    l: number
    xl: number
    xxl: number
    xxxl: number
    xxxxl: number
    xxxxxl: number
    xxxxxx: number  // 6XL
    // Other
    other: number
  }
  mockup: LineItemMockup | null
  imprints: LineItemImprint[]
}

export interface OrderDetailCustomer {
  id: number
  name: string
  email: string | null
  phone: string | null
  company: string | null
  city: string | null
  state: string | null
}

export interface OrderDetailArtwork {
  id: string
  url: string
  name: string
  source: string
  thumbnail_url?: string | null
}

export interface OrderDetail {
  id: number
  orderNumber: string
  orderNickname: string | null
  status: string
  printavoStatusName: string
  totalAmount: number
  amountOutstanding: number
  salesTax: number
  dueDate: string | null
  customerDueDate: string | null
  createdAt: string
  updatedAt: string
  customer: OrderDetailCustomer
  customerPo: string | null
  notes: string | null
  productionNotes: string | null
  artworkCount: number
  artworkFiles: OrderDetailArtwork[]
  lineItems: OrderDetailLineItem[]
}

// =============================================================================
// useOrderDetail - Fetch single order by visual_id
// =============================================================================

export function useOrderDetail(visualId: string | null) {
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const load = useCallback(async () => {
    if (!visualId) {
      setOrder(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_BASE_URL}/api/orders/${visualId}`)
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Order not found')
        }
        throw new Error(`API error: ${response.status}`)
      }
      const data = await response.json()

      // Get order-level imprintMockups to distribute to imprints
      const orderImprintMockups = (data.imprintMockups || []).map((m: any) => ({
        id: m.id,
        url: m.url,
        name: m.name || 'Imprint Mockup',
        thumbnail_url: m.thumbnail_url || m.thumbnailUrl || null,
      }));

      // Map API response to our type
      const orderDetail: OrderDetail = {
        id: data.id,
        orderNumber: data.orderNumber || data.visualId || data.visual_id || String(data.id),
        orderNickname: data.orderNickname || data.order_nickname || null,
        status: data.printavoStatusName || data.printavo_status_name || data.status || 'unknown',
        printavoStatusName: data.printavoStatusName || data.printavo_status_name || data.status || '',
        totalAmount: parseFloat(data.totalAmount) || parseFloat(data.total_amount) || 0,
        amountOutstanding: parseFloat(data.amountOutstanding) || parseFloat(data.amount_outstanding) || 0,
        salesTax: parseFloat(data.salesTax) || parseFloat(data.sales_tax) || 0,
        dueDate: data.dueDate || data.due_date || null,
        customerDueDate: data.customerDueDate || data.customer_due_date || null,
        createdAt: data.createdAt || data.created_at || '',
        updatedAt: data.updatedAt || data.updated_at || '',
        customer: {
          id: data.customer?.id || 0,
          name: data.customer?.name || 'Unknown',
          email: data.customer?.email || null,
          phone: data.customer?.phone || null,
          company: data.customer?.company || null,
          city: data.customer?.city || null,
          state: data.customer?.state || null,
        },
        customerPo: data.customerPo || data.customer_po || null,
        notes: data.notes || null,
        productionNotes: data.productionNotes || data.production_notes || null,
        artworkCount: data.artworkCount || data.artwork_count || 0,
        artworkFiles: (data.artworkFiles || data.artwork_files || []).map((a: any) => ({
          id: a.id,
          url: a.url,
          name: a.name,
          source: a.source,
          thumbnail_url: a.thumbnail_url || a.thumbnailUrl || null,
        })),
        lineItems: (data.lineItems || data.line_items || []).map((li: any) => {
          // Get imprints from API or create mock data for testing
          let imprints = (li.imprints || []).map((imp: any) => {
            // Use imprint's own mockups if available, otherwise use order-level imprintMockups
            const imprintMockups = (imp.mockups || []).length > 0
              ? (imp.mockups || []).map((m: any) => ({
                  id: m.id,
                  url: m.url,
                  name: m.name || 'Mockup',
                  thumbnail_url: m.thumbnail_url || m.thumbnailUrl || null,
                }))
              : orderImprintMockups;

            return {
              id: imp.id,
              location: imp.location || null,
              decorationType: imp.decorationType || imp.decoration_type || null,
              description: imp.description || null,
              colorCount: imp.colorCount || imp.color_count || null,
              colors: imp.colors || null,
              width: imp.width || null,
              height: imp.height || null,
              hasUnderbase: imp.hasUnderbase || imp.has_underbase || null,
              stitchCount: imp.stitchCount || imp.stitch_count || null,
              mockups: imprintMockups,
            };
          });

          // Return null mockup if none exists (no fake data)
          const mockup = li.mockup ? {
            id: li.mockup.id,
            url: li.mockup.url,
            name: li.mockup.name,
            thumbnail_url: li.mockup.thumbnail_url || li.mockup.thumbnailUrl || null,
          } : null;

          return {
            id: li.id,
            groupId: li.groupId || li.group_id || null,
            groupName: li.groupName || li.group_name || null,
            styleNumber: li.styleNumber || li.style_number || null,
            description: li.description || li.style_description || null,
            color: li.color || null,
            category: li.category || null,
            unitCost: parseFloat(li.unitCost) || parseFloat(li.unit_cost) || 0,
            totalQuantity: li.totalQuantity || li.total_quantity || 0,
            totalCost: (() => {
              const cost = parseFloat(li.totalCost) || parseFloat(li.total_cost) || 0;
              if (cost > 0) return cost;
              // Calculate from quantity * unit cost if totalCost is missing
              const qty = li.totalQuantity || li.total_quantity || 0;
              const unit = parseFloat(li.unitCost) || parseFloat(li.unit_cost) || 0;
              return qty * unit;
            })(),
            sizes: {
              // Baby/Toddler
              '6m': li.sizes?.['6m'] || li.size_6_m || 0,
              '12m': li.sizes?.['12m'] || li.size_12_m || 0,
              '18m': li.sizes?.['18m'] || li.size_18_m || 0,
              '24m': li.sizes?.['24m'] || li.size_24_m || 0,
              '2t': li.sizes?.['2t'] || li.size_2_t || 0,
              '3t': li.sizes?.['3t'] || li.size_3_t || 0,
              '4t': li.sizes?.['4t'] || li.size_4_t || 0,
              '5t': li.sizes?.['5t'] || li.size_5_t || 0,
              // Youth
              yxs: li.sizes?.yxs || li.size_yxs || 0,
              ys: li.sizes?.ys || li.size_ys || 0,
              ym: li.sizes?.ym || li.size_ym || 0,
              yl: li.sizes?.yl || li.size_yl || 0,
              yxl: li.sizes?.yxl || li.size_yxl || 0,
              // Adult
              xs: li.sizes?.xs || li.size_xs || 0,
              s: li.sizes?.s || li.size_s || 0,
              m: li.sizes?.m || li.size_m || 0,
              l: li.sizes?.l || li.size_l || 0,
              xl: li.sizes?.xl || li.size_xl || 0,
              xxl: li.sizes?.xxl || li.size_2_xl || li.sizes?.['2xl'] || 0,
              xxxl: li.sizes?.xxxl || li.size_3_xl || li.sizes?.['3xl'] || 0,
              xxxxl: li.sizes?.xxxxl || li.size_4_xl || li.sizes?.['4xl'] || 0,
              xxxxxl: li.sizes?.xxxxxl || li.size_5_xl || li.sizes?.['5xl'] || 0,
              xxxxxx: li.sizes?.xxxxxx || li.size_6_xl || li.sizes?.['6xl'] || 0,
              // Other
              other: li.sizes?.other || li.size_other || 0,
            },
            mockup: mockup,
            imprints: imprints,
          };
        }),
      }

      setOrder(orderDetail)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch order'))
    } finally {
      setLoading(false)
    }
  }, [visualId])

  useEffect(() => {
    load()
  }, [load])

  return { order, loading, error, refetch: load }
}

// =============================================================================
// useCustomers - Fetch and manage customers list
// =============================================================================

export function useCustomers(options?: { limit?: number; search?: string }) {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetchCustomers(options)
      setCustomers(result.customers)
      setTotal(result.total)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch customers'))
    } finally {
      setLoading(false)
    }
  }, [options?.limit, options?.search])

  useEffect(() => {
    load()
  }, [load])

  return { customers, total, loading, error, refetch: load }
}

// =============================================================================
// Customer List Types
// =============================================================================

export interface CustomerListItem {
  id: number
  name: string
  email: string | null
  phone: string | null
  company: string | null
  city: string | null
  state: string | null
  billingAddress?: {
    street: string
    city: string
    state: string
    zip: string
    country?: string
  }
  shippingAddress?: {
    street: string
    city: string
    state: string
    zip: string
    country?: string
  }
  orders_count: number
  total_revenue: number
  tier: 'bronze' | 'silver' | 'gold' | 'platinum'
  last_order_date: string | null
  created_at: string
}

// =============================================================================
// useCustomersList - Fetch customers directly from API with pagination
// =============================================================================

export function useCustomersList(options?: {
  limit?: number
  offset?: number
  search?: string
  sort?: 'name' | 'revenue' | 'orders' | 'recent'
  tier?: 'all' | 'platinum' | 'gold' | 'silver' | 'bronze'
}) {
  const [customers, setCustomers] = useState<CustomerListItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      let url: string
      if (options?.search && options.search.trim()) {
        // Use search endpoint
        url = `${API_BASE_URL}/api/customers/search?q=${encodeURIComponent(options.search)}`
      } else {
        // Use list endpoint with pagination, sorting, and filtering
        const params = new URLSearchParams()
        if (options?.limit) params.set('limit', String(options.limit))
        if (options?.offset) params.set('offset', String(options.offset))
        if (options?.sort) params.set('sort', options.sort)
        if (options?.tier && options.tier !== 'all') params.set('tier', options.tier)
        url = `${API_BASE_URL}/api/customers?${params}`
      }

      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }
      const data = await response.json()

      const mappedCustomers: CustomerListItem[] = (data.customers || []).map((c: any) => ({
        id: c.id,
        name: c.name || 'Unknown',
        email: c.email || null,
        phone: c.phone || null,
        company: c.company || null,
        city: c.city || null,
        state: c.state || null,
        billingAddress: c.billingAddress || c.billing_address ? {
          street: c.billingAddress?.street || c.billing_address?.street || '',
          city: c.billingAddress?.city || c.billing_address?.city || '',
          state: c.billingAddress?.state || c.billing_address?.state || '',
          zip: c.billingAddress?.zip || c.billing_address?.zip || '',
          country: c.billingAddress?.country || c.billing_address?.country || undefined,
        } : undefined,
        shippingAddress: c.shippingAddress || c.shipping_address ? {
          street: c.shippingAddress?.street || c.shipping_address?.street || '',
          city: c.shippingAddress?.city || c.shipping_address?.city || '',
          state: c.shippingAddress?.state || c.shipping_address?.state || '',
          zip: c.shippingAddress?.zip || c.shipping_address?.zip || '',
          country: c.shippingAddress?.country || c.shipping_address?.country || undefined,
        } : undefined,
        orders_count: c.orders_count || 0,
        total_revenue: parseFloat(c.total_revenue || c.totalRevenue || '0') || 0,
        tier: c.tier || 'bronze',
        last_order_date: c.last_order_date || c.lastOrderDate || null,
        created_at: c.created_at || '',
      }))

      setCustomers(mappedCustomers)
      setTotal(data.total || mappedCustomers.length)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch customers'))
    } finally {
      setLoading(false)
    }
  }, [options?.limit, options?.offset, options?.search, options?.sort, options?.tier])

  useEffect(() => {
    load()
  }, [load])

  return { customers, total, loading, error, refetch: load }
}

// =============================================================================
// useCustomerDetail - Fetch single customer by ID
// =============================================================================

export function useCustomerDetail(customerId: string | null) {
  const [customer, setCustomer] = useState<CustomerListItem | null>(null)
  const [orders, setOrders] = useState<OrderListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const load = useCallback(async () => {
    if (!customerId) {
      setCustomer(null)
      setOrders([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    setCustomer(null)
    setOrders([])
    try {
      // Fetch customer detail directly by ID
      const response = await fetch(`${API_BASE_URL}/api/customers/${customerId}`)
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }
      const data = await response.json()
      const found = data.customer

      if (!found) {
        throw new Error('Customer not found')
      }

      // Map shipping_address fields (API uses address1/address2/zipCode)
      const shippingAddr = found.shipping_address
      const billingAddr = found.billing_address

      const customerData: CustomerListItem = {
        id: found.id,
        name: found.name || 'Unknown',
        email: found.email || null,
        phone: found.phone || null,
        company: found.company || null,
        city: found.city || shippingAddr?.city || null,
        state: found.state || shippingAddr?.state || null,
        billingAddress: billingAddr ? {
          street: billingAddr.address1 || billingAddr.street || '',
          city: billingAddr.city || '',
          state: billingAddr.state || billingAddr.stateIso || '',
          zip: billingAddr.zipCode || billingAddr.zip || '',
          country: billingAddr.country || undefined,
        } : undefined,
        shippingAddress: shippingAddr ? {
          street: shippingAddr.address1 || shippingAddr.street || '',
          city: shippingAddr.city || '',
          state: shippingAddr.state || shippingAddr.stateIso || '',
          zip: shippingAddr.zipCode || shippingAddr.zip || '',
          country: shippingAddr.country || undefined,
        } : undefined,
        orders_count: found.orders_count || 0,
        total_revenue: parseFloat(found.total_revenue || found.totalRevenue || '0') || 0,
        tier: found.tier || 'bronze',
        last_order_date: found.last_order_date || found.lastOrderDate || null,
        created_at: found.created_at || '',
      }
      setCustomer(customerData)

      // Fetch orders filtered by customer_id
      const ordersResponse = await fetch(`${API_BASE_URL}/api/orders?customer_id=${found.id}&limit=100`)
      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json()
        const customerOrders: OrderListItem[] = (ordersData.orders || [])
          .map((o: any) => ({
            id: o.id,
            visual_id: o.visual_id || String(o.id),
            order_nickname: o.order_nickname || o.nickname || null,
            status: o.printavo_status_name || o.status || 'New',
            printavo_status_name: o.printavo_status_name || o.status || '',
            customer_name: o.customer_name || 'Unknown',
            total_amount: parseFloat(o.total_amount) || parseFloat(o.total) || 0,
            due_date: o.due_date || null,
            artwork_count: o.artwork_count || 0,
          }))
        setOrders(customerOrders)
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch customer'))
    } finally {
      setLoading(false)
    }
  }, [customerId])

  useEffect(() => {
    load()
  }, [load])

  return { customer, orders, loading, error, refetch: load }
}

// =============================================================================
// useDashboardStats - Fetch dashboard statistics
// =============================================================================

export function useDashboardStats() {
  const [stats, setStats] = useState({
    activeOrders: 0,
    totalRevenue: 0,
    customerCount: 0,
    needsAttention: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetchDashboardStats()
      setStats(result)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch stats'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { stats, loading, error, refetch: load }
}

// =============================================================================
// useOrder - Fetch single order by ID
// =============================================================================

export function useOrder(id: string | null) {
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const load = useCallback(async () => {
    if (!id) {
      setOrder(null)
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const result = await fetchOrderById(id)
      setOrder(result)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch order'))
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  return { order, loading, error, refetch: load }
}

// =============================================================================
// useCustomer - Fetch single customer by ID
// =============================================================================

export function useCustomer(id: string | null) {
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const load = useCallback(async () => {
    if (!id) {
      setCustomer(null)
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const result = await fetchCustomerById(id)
      setCustomer(result)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch customer'))
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  return { customer, loading, error, refetch: load }
}

// =============================================================================
// useOrderPayments - Fetch payments for a specific order
// =============================================================================

export function useOrderPayments(orderId: string | null) {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const load = useCallback(async () => {
    if (!orderId) {
      setPayments([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const result = await fetchOrderPayments(orderId)
      setPayments(result)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch payments'))
    } finally {
      setLoading(false)
    }
  }, [orderId])

  useEffect(() => {
    load()
  }, [load])

  return { payments, loading, error, refetch: load }
}

// =============================================================================
// useQuoteDetail - Fetch single quote by ID and transform to OrderDetail shape
// =============================================================================

const API_BASE_URL_V2 = import.meta.env.VITE_DASHBOARD_API_URL || 'https://mintprints-api.ronny.works'

export function useQuoteDetail(quoteId: string | null) {
  const [order, setOrder] = useState<QuoteAsOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const load = useCallback(async () => {
    if (!quoteId) {
      setOrder(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_BASE_URL_V2}/api/v2/quotes/${quoteId}`)
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Quote not found')
        }
        throw new Error(`API error: ${response.status}`)
      }
      const data = await response.json()

      // Transform quote to order shape
      const transformed = transformQuoteToOrder(data)
      setOrder(transformed)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch quote'))
    } finally {
      setLoading(false)
    }
  }, [quoteId])

  useEffect(() => {
    load()
  }, [load])

  return { order, loading, error, refetch: load }
}

// Re-export QuoteAsOrder type
export type { QuoteAsOrder }

// =============================================================================
// PRODUCT SEARCH TYPES
// =============================================================================

export interface SupplierProduct {
  supplier: string
  supplier_sku: string
  style_code: string
  brand: string
  title: string
  description?: string
  category?: string
  subcategory?: string
  base_price: number | null
  piece_price?: number | null
  case_price?: number | null
  case_qty?: number | null
  color: string
  color_hex?: string
  size: string
  image_url: string | null
  gtin?: string
  status?: string
  inventory: {
    total: number
    warehouses?: Array<{
      name: string
      qty: number
    }>
  }
}

export interface SupplierStatus {
  name: string
  ok: boolean
  message: string
}

// =============================================================================
// useProductSearch - Search products across suppliers
// =============================================================================

export function useProductSearch(options?: {
  query?: string
  supplier?: 'all' | 'ss_activewear' | 'as_colour' | 'sanmar'
  category?: string
  color?: string
  limit?: number
}) {
  const [products, setProducts] = useState<SupplierProduct[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const search = useCallback(async (searchQuery?: string) => {
    const query = searchQuery || options?.query
    if (!query || query.trim().length < 2) {
      setProducts([])
      return
    }

    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      params.set('q', query.trim())
      if (options?.supplier && options.supplier !== 'all') {
        params.set('supplier', options.supplier)
      }
      if (options?.category) params.set('category', options.category)
      if (options?.color) params.set('color', options.color)
      if (options?.limit) params.set('limit', String(options.limit))

      const response = await fetch(`${API_BASE_URL}/api/products/search?${params}`)
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }
      const data = await response.json()

      // Map API response to our type
      const mappedProducts: SupplierProduct[] = (data.products || []).map((p: any) => ({
        supplier: p.supplier || 'unknown',
        supplier_sku: p.supplier_sku || p.sku || '',
        style_code: p.style_code || p.styleCode || '',
        brand: p.brand || '',
        title: p.title || p.name || '',
        description: p.description || '',
        category: p.category || '',
        subcategory: p.subcategory || '',
        base_price: p.base_price ?? p.piece_price ?? null,
        piece_price: p.piece_price ?? null,
        case_price: p.case_price ?? null,
        case_qty: p.case_qty ?? null,
        color: p.color || '',
        color_hex: p.color_hex || '',
        size: p.size || '',
        image_url: p.image_url || null,
        gtin: p.gtin || '',
        status: p.status || '',
        inventory: {
          total: p.inventory?.total || 0,
          warehouses: p.inventory?.warehouses || [],
        },
      }))

      setProducts(mappedProducts)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to search products'))
      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [options?.supplier, options?.category, options?.color, options?.limit])

  return { products, loading, error, search }
}

// =============================================================================
// useSupplierStatus - Check supplier connection status
// =============================================================================

export function useSupplierStatus() {
  const [suppliers, setSuppliers] = useState<SupplierStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_BASE_URL}/api/suppliers/test`)
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }
      const data = await response.json()
      setSuppliers(data.suppliers || [])
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch supplier status'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { suppliers, loading, error, refetch: load }
}

// =============================================================================
// REPORT TYPES
// =============================================================================

export interface ReportSummary {
  total_orders: number
  quotes: number
  active_jobs: number
  completed: number
  total_revenue: number
  avg_order_value: number
  total_outstanding: number
  total_collected: number
}

export interface TopCustomer {
  id: number
  name: string
  email: string | null
  company: string | null
  order_count: number
  total_spent: number
  avg_order: number
  last_order: string | null
  status: 'active' | 'inactive' | 'at_risk'
}

// =============================================================================
// useReportSummary - Fetch executive summary (requires auth)
// =============================================================================

export function useReportSummary(options?: { startDate?: string; endDate?: string }) {
  const [summary, setSummary] = useState<ReportSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem('mint_admin_token')
      if (!token) {
        throw new Error('Not authenticated')
      }

      const params = new URLSearchParams()
      if (options?.startDate) params.set('start_date', options.startDate)
      if (options?.endDate) params.set('end_date', options.endDate)

      const url = `${API_BASE_URL}/api/reports/summary${params.toString() ? '?' + params : ''}`
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Session expired')
        }
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      setSummary({
        total_orders: parseInt(data.summary?.total_orders || '0', 10),
        quotes: parseInt(data.summary?.quotes || '0', 10),
        active_jobs: parseInt(data.summary?.active_jobs || '0', 10),
        completed: parseInt(data.summary?.completed || '0', 10),
        total_revenue: parseFloat(data.summary?.total_revenue || '0'),
        avg_order_value: parseFloat(data.summary?.avg_order_value || '0'),
        total_outstanding: parseFloat(data.summary?.total_outstanding || '0'),
        total_collected: parseFloat(data.summary?.total_collected || '0'),
      })
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch report summary'))
    } finally {
      setLoading(false)
    }
  }, [options?.startDate, options?.endDate])

  useEffect(() => {
    load()
  }, [load])

  return { summary, loading, error, refetch: load }
}

// =============================================================================
// useTopCustomers - Fetch top customers by revenue (requires auth)
// =============================================================================

export function useTopCustomers(options?: { limit?: number }) {
  const [customers, setCustomers] = useState<TopCustomer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem('mint_admin_token')
      if (!token) {
        throw new Error('Not authenticated')
      }

      const params = new URLSearchParams()
      if (options?.limit) params.set('limit', String(options.limit))

      const url = `${API_BASE_URL}/api/reports/top-customers${params.toString() ? '?' + params : ''}`
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Session expired')
        }
        throw new Error(`API error: ${response.status}`)
      }

      const result = await response.json()
      const mapped: TopCustomer[] = (result.customers || []).map((c: any) => ({
        id: c.id || 0,
        name: c.name || 'Unknown',
        email: c.email || null,
        company: c.company || null,
        order_count: parseInt(c.order_count || '0', 10),
        total_spent: parseFloat(c.total_spent || '0'),
        avg_order: parseFloat(c.avg_order || '0'),
        last_order: c.last_order || null,
        status: c.status || 'active',
      }))
      setCustomers(mapped)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch top customers'))
    } finally {
      setLoading(false)
    }
  }, [options?.limit])

  useEffect(() => {
    load()
  }, [load])

  return { customers, loading, error, refetch: load }
}
