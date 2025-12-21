/**
 * Print Shop OS - API Data Adapter
 * 
 * Transforms data from mintprints-api.ronny.works into the shape
 * expected by the Spark UI components.
 * 
 * Usage:
 *   import { fetchOrders, fetchCustomers } from '@/lib/api-adapter'
 *   const orders = await fetchOrders()
 */

// =============================================================================
// CONFIGURATION
// =============================================================================

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://mintprints-api.ronny.works'

// Set to true to use local dev data instead of API
const USE_DEV_DATA = import.meta.env.VITE_USE_DEV_DATA === 'true'

// =============================================================================
// TYPES (matching Spark UI expectations)
// =============================================================================

export type OrderStatus = 
  | 'quote'
  | 'pending_approval'
  | 'artwork_approved'
  | 'in_production'
  | 'shipped'
  | 'ready_for_pickup'
  | 'delivered'
  | 'on_hold'
  | 'cancelled'

export type StatusCategory = 'quote' | 'preproduction' | 'production' | 'complete' | 'hold' | 'cancelled'

export interface Status {
  id: string
  name: string
  category: StatusCategory
  color: string
  order: number
}

export interface Artwork {
  id: string
  imprint_id: string
  file_url: string
  filename: string
  file_size: number
  approved: boolean
  uploaded_at: string
  notes: string
}

export interface Imprint {
  id: string
  type: 'screen_print' | 'dtg' | 'embroidery' | 'vinyl' | 'digital_transfer'
  location: string
  colors: number
  width: number
  height: number
  description: string
  artwork: Artwork | null
}

export interface Size {
  size: string
  quantity: number
}

export interface LineItem {
  id: string
  product: {
    name: string
    sku: string
    color: string
    brand: string
  }
  sizes: Size[]
  quantity: number
  unit_price: number
  subtotal: number
  imprints: Imprint[]
}

export interface Payment {
  id: string
  amount: number
  method: 'credit_card' | 'check' | 'cash' | 'paypal' | 'venmo' | 'invoice_net_30' | 'other'
  date: string
  note: string
}

export interface Customer {
  id: string
  name: string
  email: string
  phone: string
  company: string
  address?: {
    street: string
    city: string
    state: string
    zip: string
  }
  orders_count?: number
  total_revenue?: number
  tier?: 'bronze' | 'silver' | 'gold' | 'platinum'
}

export interface Order {
  id: string
  visual_id: string
  printavo_id: number | null
  nickname: string | null
  status: OrderStatus
  customer_id: string
  customer: Customer
  line_items: LineItem[]
  payments: Payment[]
  tasks: any[]
  artwork_files: any[]
  artwork_count: number
  subtotal: number
  discount: number
  discount_percent: number
  sales_tax: number
  sales_tax_percent: number
  total: number
  amount_paid: number
  amount_outstanding: number
  due_date: string
  order_date: string
  created_at: string
  updated_at: string
  customer_note: string
  production_note: string
  public_url: string
  workorder_url: string
}

// =============================================================================
// API RESPONSE TYPES (what mintprints-api actually returns)
// =============================================================================

interface APIOrder {
  id: number
  visual_id: string
  printavo_id: number | null
  order_nickname: string | null
  status: string
  printavo_status_name: string
  customer_name: string
  customer_id: number | null
  due_date: string | null
  created_at: string
  updated_at: string
  subtotal: string | number
  tax: string | number
  total: string | number
  amount_paid: string | number
  amount_outstanding: string | number
  production_notes: string | null
  customer_notes: string | null
  line_items: APILineItem[]
}

interface APILineItem {
  id: number
  style_description: string | null
  style_number: string | null
  color: string | null
  category: string | null
  quantity: number
  price: string | number
  size_xs: number
  size_s: number
  size_m: number
  size_l: number
  size_xl: number
  size_2_xl: number
  size_3_xl: number
  size_other: number
}

interface APICustomer {
  id: number
  name: string
  email: string | null
  phone: string | null
  company: string | null
  orders_count: number
  created_at: string
}

// =============================================================================
// STATUS MAPPING
// =============================================================================

const STATUS_MAP: Record<string, OrderStatus> = {
  // Printavo status names → our status
  'QUOTE': 'quote',
  'NEW': 'pending_approval',
  'PENDING': 'pending_approval',
  'ART APPROVAL': 'pending_approval',
  'ARTWORK APPROVED': 'artwork_approved',
  'APPROVED': 'artwork_approved',
  'IN PRODUCTION': 'in_production',
  'PRINTING': 'in_production',
  'SCREEN PRINT PRODUCTION': 'in_production',
  'DTG PRODUCTION': 'in_production',
  'EMBROIDERY PRODUCTION': 'in_production',
  'COMPLETE': 'delivered',
  'SHIPPED': 'shipped',
  'READY': 'ready_for_pickup',
  'READY FOR PICKUP': 'ready_for_pickup',
  'DELIVERED': 'delivered',
  'ON HOLD': 'on_hold',
  'HOLD': 'on_hold',
  'CANCELLED': 'cancelled',
  'CANCELED': 'cancelled',
}

const STATUSES: Status[] = [
  { id: 'quote', name: 'Quote', category: 'quote', color: '#64748b', order: 1 },
  { id: 'pending_approval', name: 'Pending Approval', category: 'preproduction', color: '#f59e0b', order: 2 },
  { id: 'artwork_approved', name: 'Artwork Approved', category: 'preproduction', color: '#10b981', order: 3 },
  { id: 'in_production', name: 'In Production', category: 'production', color: '#8b5cf6', order: 4 },
  { id: 'shipped', name: 'Shipped', category: 'complete', color: '#06b6d4', order: 5 },
  { id: 'ready_for_pickup', name: 'Ready for Pickup', category: 'complete', color: '#10b981', order: 6 },
  { id: 'delivered', name: 'Delivered', category: 'complete', color: '#22c55e', order: 7 },
  { id: 'on_hold', name: 'On Hold', category: 'hold', color: '#ef4444', order: 8 },
  { id: 'cancelled', name: 'Cancelled', category: 'cancelled', color: '#6b7280', order: 9 },
]

// =============================================================================
// TRANSFORMATION FUNCTIONS
// =============================================================================

function mapStatus(apiStatus: string): OrderStatus {
  const normalized = (apiStatus || '').toUpperCase().trim()
  return STATUS_MAP[normalized] || 'pending_approval'
}

function inferImprintType(statusName: string, category: string | null): Imprint['type'] {
  const text = `${statusName} ${category || ''}`.toLowerCase()
  if (text.includes('embroid')) return 'embroidery'
  if (text.includes('dtg') || text.includes('direct to garment')) return 'dtg'
  if (text.includes('vinyl') || text.includes('heat')) return 'vinyl'
  if (text.includes('digital')) return 'digital_transfer'
  return 'screen_print'
}

function transformSizes(apiLineItem: APILineItem): Size[] {
  const sizes: Size[] = []
  if (apiLineItem.size_xs > 0) sizes.push({ size: 'XS', quantity: apiLineItem.size_xs })
  if (apiLineItem.size_s > 0) sizes.push({ size: 'S', quantity: apiLineItem.size_s })
  if (apiLineItem.size_m > 0) sizes.push({ size: 'M', quantity: apiLineItem.size_m })
  if (apiLineItem.size_l > 0) sizes.push({ size: 'L', quantity: apiLineItem.size_l })
  if (apiLineItem.size_xl > 0) sizes.push({ size: 'XL', quantity: apiLineItem.size_xl })
  if (apiLineItem.size_2_xl > 0) sizes.push({ size: '2XL', quantity: apiLineItem.size_2_xl })
  if (apiLineItem.size_3_xl > 0) sizes.push({ size: '3XL', quantity: apiLineItem.size_3_xl })
  if (apiLineItem.size_other > 0) sizes.push({ size: 'Other', quantity: apiLineItem.size_other })
  return sizes
}

function transformLineItem(apiLineItem: APILineItem, statusName: string): LineItem {
  const sizes = transformSizes(apiLineItem)
  const quantity = sizes.reduce((sum, s) => sum + s.quantity, 0) || apiLineItem.quantity || 0
  const unitPrice = parseFloat(String(apiLineItem.price)) || 0

  // Create placeholder imprint based on status/category
  const imprint: Imprint = {
    id: `imp-${apiLineItem.id}`,
    type: inferImprintType(statusName, apiLineItem.category),
    location: 'Front Center',
    colors: 1,
    width: 12,
    height: 14,
    description: apiLineItem.category || 'Standard imprint',
    artwork: null
  }

  return {
    id: String(apiLineItem.id),
    product: {
      name: apiLineItem.style_description || 'Unknown Product',
      sku: apiLineItem.style_number || '',
      color: apiLineItem.color || '',
      brand: ''
    },
    sizes,
    quantity,
    unit_price: unitPrice,
    subtotal: unitPrice * quantity,
    imprints: [imprint]
  }
}

function transformOrder(apiOrder: APIOrder): Order {
  const status = mapStatus(apiOrder.printavo_status_name || apiOrder.status)
  const lineItems = (apiOrder.line_items || []).map(li => 
    transformLineItem(li, apiOrder.printavo_status_name || '')
  )

  const subtotal = parseFloat(String(apiOrder.subtotal)) || 0
  const tax = parseFloat(String(apiOrder.tax)) || 0
  const total = parseFloat(String(apiOrder.total)) || 0
  const amountPaid = parseFloat(String(apiOrder.amount_paid)) || 0
  const amountOutstanding = parseFloat(String(apiOrder.amount_outstanding)) || total - amountPaid

  // Create customer object from order data
  const customer: Customer = {
    id: String(apiOrder.customer_id || 0),
    name: apiOrder.customer_name || 'Unknown Customer',
    email: '',
    phone: '',
    company: ''
  }

  return {
    id: String(apiOrder.id),
    visual_id: apiOrder.visual_id || String(apiOrder.id),
    printavo_id: apiOrder.printavo_id,
    nickname: apiOrder.order_nickname || '',
    status,
    customer_id: String(apiOrder.customer_id || 0),
    customer,
    line_items: lineItems,
    payments: [],  // Will populate from transactions if available
    tasks: [],
    artwork_files: [],
    artwork_count: 0,
    subtotal,
    discount: 0,
    discount_percent: 0,
    sales_tax: tax,
    sales_tax_percent: subtotal > 0 ? (tax / subtotal) * 100 : 0,
    total,
    amount_paid: amountPaid,
    amount_outstanding: amountOutstanding,
    due_date: apiOrder.due_date || '',
    order_date: apiOrder.created_at || '',
    created_at: apiOrder.created_at || '',
    updated_at: apiOrder.updated_at || '',
    customer_note: apiOrder.customer_notes || '',
    production_note: apiOrder.production_notes || '',
    public_url: '',
    workorder_url: ''
  }
}

function transformCustomer(apiCustomer: APICustomer): Customer {
  return {
    id: String(apiCustomer.id),
    name: apiCustomer.name || 'Unknown',
    email: apiCustomer.email || '',
    phone: apiCustomer.phone || '',
    company: apiCustomer.company || '',
    orders_count: apiCustomer.orders_count || 0
  }
}

// =============================================================================
// API FETCH FUNCTIONS
// =============================================================================

export async function fetchOrders(options?: {
  limit?: number
  page?: number
  status?: string
}): Promise<{ orders: Order[]; total: number }> {
  if (USE_DEV_DATA) {
    const { typedOrders } = await import('@/data')
    return { orders: typedOrders, total: typedOrders.length }
  }

  const params = new URLSearchParams()
  if (options?.limit) params.set('limit', String(options.limit))
  if (options?.page) params.set('page', String(options.page))
  if (options?.status) params.set('status', options.status)

  const response = await fetch(`${API_BASE_URL}/api/orders?${params}`)
  if (!response.ok) throw new Error(`API error: ${response.status}`)
  
  const data = await response.json()
  const orders = (data.orders || []).map(transformOrder)
  
  return { orders, total: data.total || orders.length }
}

export async function fetchCustomers(options?: {
  limit?: number
  page?: number
  search?: string
}): Promise<{ customers: Customer[]; total: number }> {
  if (USE_DEV_DATA) {
    const { typedCustomers } = await import('@/data')
    return { customers: typedCustomers, total: typedCustomers.length }
  }

  const params = new URLSearchParams()
  if (options?.limit) params.set('limit', String(options.limit))
  if (options?.page) params.set('page', String(options.page))
  if (options?.search) params.set('search', options.search)

  const response = await fetch(`${API_BASE_URL}/api/customers?${params}`)
  if (!response.ok) throw new Error(`API error: ${response.status}`)
  
  const data = await response.json()
  const customers = (data.customers || []).map(transformCustomer)
  
  return { customers, total: data.total || customers.length }
}

export async function fetchOrderById(id: string): Promise<Order | null> {
  if (USE_DEV_DATA) {
    const { getOrderById } = await import('@/data')
    return getOrderById(id) || null
  }

  const response = await fetch(`${API_BASE_URL}/api/orders/${id}`)
  if (!response.ok) return null
  
  const data = await response.json()
  return transformOrder(data.order || data)
}

export async function fetchCustomerById(id: string): Promise<Customer | null> {
  if (USE_DEV_DATA) {
    const { getCustomerById } = await import('@/data')
    return getCustomerById(id) || null
  }

  const response = await fetch(`${API_BASE_URL}/api/customers/${id}`)
  if (!response.ok) return null
  
  const data = await response.json()
  return transformCustomer(data.customer || data)
}

// =============================================================================
// STATS & AGGREGATIONS
// =============================================================================

export async function fetchDashboardStats(): Promise<{
  activeOrders: number
  totalRevenue: number
  customerCount: number
  needsAttention: number
}> {
  const [ordersResult, customersResult] = await Promise.all([
    fetchOrders({ limit: 500 }),
    fetchCustomers({ limit: 1 })
  ])

  const activeStatuses: OrderStatus[] = ['pending_approval', 'artwork_approved', 'in_production']
  const activeOrders = ordersResult.orders.filter(o => activeStatuses.includes(o.status)).length

  // Calculate revenue as total - outstanding (actual payments collected)
  const totalRevenue = ordersResult.orders.reduce((sum, o) => {
    const total = o.total || 0
    const outstanding = o.amount_outstanding || 0
    const paid = total - outstanding
    return sum + (paid > 0 ? paid : 0)
  }, 0)

  const needsAttention = ordersResult.orders.filter(o =>
    o.status === 'pending_approval' ||
    (o.due_date && new Date(o.due_date) < new Date())
  ).length

  return {
    activeOrders,
    totalRevenue,
    customerCount: customersResult.total,
    needsAttention
  }
}

// =============================================================================
// PAYMENTS
// =============================================================================

function mapPaymentMethod(method: string): Payment['method'] {
  const m = (method || '').toLowerCase()
  if (m.includes('card') || m.includes('credit')) return 'credit_card'
  if (m.includes('check')) return 'check'
  if (m.includes('cash')) return 'cash'
  if (m.includes('paypal')) return 'paypal'
  if (m.includes('venmo')) return 'venmo'
  if (m.includes('invoice') || m.includes('net')) return 'invoice_net_30'
  return 'other'
}

export async function fetchOrderPayments(orderId: string): Promise<Payment[]> {
  if (USE_DEV_DATA) {
    const { getOrderById } = await import('@/data')
    const order = getOrderById(orderId)
    return order?.payments || []
  }

  const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}/payments`)
  if (!response.ok) return []

  const data = await response.json()
  return (data.payments || []).map((p: any) => ({
    id: String(p.id),
    amount: parseFloat(p.amount) || 0,
    method: mapPaymentMethod(p.paymentMethod || p.payment_method),
    date: p.paymentDate || p.payment_date || p.createdAt || '',
    note: p.notes || p.note || ''
  }))
}

// =============================================================================
// EXPORTS
// =============================================================================

export { STATUSES }
