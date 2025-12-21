/**
 * Development data for Print Shop OS
 * Used when VITE_USE_DEV_DATA=true
 */

import type { Order, Customer, OrderStatus } from '../lib/api-adapter'

// =============================================================================
// DEV CUSTOMERS
// =============================================================================

export const typedCustomers: Customer[] = [
  {
    id: '1',
    name: 'John Smith',
    email: 'john@techstartup.com',
    phone: '(555) 123-4567',
    company: 'Tech Startup Inc',
    orders_count: 5,
    total_revenue: 2500,
    tier: 'gold'
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    email: 'sarah@localschool.edu',
    phone: '(555) 234-5678',
    company: 'Lincoln High School',
    orders_count: 3,
    total_revenue: 1800,
    tier: 'silver'
  },
  {
    id: '3',
    name: 'Mike Williams',
    email: 'mike@fitnessfirst.com',
    phone: '(555) 345-6789',
    company: 'Fitness First Gym',
    orders_count: 8,
    total_revenue: 4200,
    tier: 'platinum'
  },
  {
    id: '4',
    name: 'Emily Davis',
    email: 'emily@creativestudio.com',
    phone: '(555) 456-7890',
    company: 'Creative Studio',
    orders_count: 2,
    total_revenue: 950,
    tier: 'bronze'
  },
  {
    id: '5',
    name: 'David Brown',
    email: 'david@localrestaurant.com',
    phone: '(555) 567-8901',
    company: 'Downtown Diner',
    orders_count: 4,
    total_revenue: 1600,
    tier: 'silver'
  },
  {
    id: '6',
    name: 'Lisa Anderson',
    email: 'lisa@nonprofitorg.org',
    phone: '(555) 678-9012',
    company: 'Community Helpers',
    orders_count: 6,
    total_revenue: 3100,
    tier: 'gold'
  },
  {
    id: '7',
    name: 'James Wilson',
    email: 'james@constructionco.com',
    phone: '(555) 789-0123',
    company: 'Wilson Construction',
    orders_count: 7,
    total_revenue: 5500,
    tier: 'platinum'
  },
  {
    id: '8',
    name: 'Jennifer Taylor',
    email: 'jen@yogastudio.com',
    phone: '(555) 890-1234',
    company: 'Zen Yoga Studio',
    orders_count: 2,
    total_revenue: 800,
    tier: 'bronze'
  },
  {
    id: '9',
    name: 'Robert Martinez',
    email: 'robert@autorepair.com',
    phone: '(555) 901-2345',
    company: 'Quick Fix Auto',
    orders_count: 3,
    total_revenue: 1400,
    tier: 'silver'
  },
  {
    id: '10',
    name: 'Amanda Garcia',
    email: 'amanda@bakery.com',
    phone: '(555) 012-3456',
    company: 'Sweet Treats Bakery',
    orders_count: 4,
    total_revenue: 1900,
    tier: 'gold'
  }
]

// =============================================================================
// DEV ORDERS
// =============================================================================

const createOrder = (
  id: string,
  visual_id: string,
  nickname: string,
  status: OrderStatus,
  customer_id: string,
  customer_name: string,
  total: number,
  due_date: string
): Order => {
  const customer = typedCustomers.find(c => c.id === customer_id) || {
    id: customer_id,
    name: customer_name,
    email: '',
    phone: '',
    company: '',
    orders_count: 0,
    total_revenue: 0,
    tier: 'bronze' as const
  }
  
  return {
    id,
    visual_id,
    printavo_id: parseInt(id) * 1000,
    nickname,
    status,
    customer_id,
    customer,
    line_items: [
      {
        id: `li-${id}-1`,
        product: {
          name: 'Gildan 5000 T-Shirt',
          sku: 'G5000',
          color: 'Black',
          brand: 'Gildan'
        },
        sizes: [
          { size: 'S', quantity: 10 },
          { size: 'M', quantity: 20 },
          { size: 'L', quantity: 15 },
          { size: 'XL', quantity: 5 }
        ],
        quantity: 50,
        unit_price: total / 50,
        subtotal: total * 0.8,
        imprints: [
          {
            id: `imp-${id}-1`,
            type: 'screen_print',
            location: 'Front Center',
            colors: 2,
            width: 12,
            height: 14,
            description: 'Full front logo',
            artwork: null
          }
        ]
      }
    ],
    payments: [],
    tasks: [],
    artwork_files: [],
    artwork_count: 1,
    subtotal: total * 0.9,
    discount: 0,
    discount_percent: 0,
    sales_tax: total * 0.1,
    sales_tax_percent: 8.25,
    total,
    amount_paid: status === 'delivered' ? total : total * 0.5,
    amount_outstanding: status === 'delivered' ? 0 : total * 0.5,
    due_date,
    order_date: '2024-01-15',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
    customer_note: '',
    production_note: '',
    public_url: '',
    workorder_url: ''
  }
}

// Today and some past/future dates for variety
const today = new Date()
const daysAgo = (n: number) => {
  const d = new Date(today)
  d.setDate(d.getDate() - n)
  return d.toISOString().split('T')[0]
}
const daysFromNow = (n: number) => {
  const d = new Date(today)
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}

export const typedOrders: Order[] = [
  createOrder('1', 'ORD-001', 'Tech Startup Tees', 'pending_approval', '1', 'John Smith', 750, daysFromNow(3)),
  createOrder('2', 'ORD-002', 'School Spirit Week', 'artwork_approved', '2', 'Sarah Johnson', 1200, daysFromNow(7)),
  createOrder('3', 'ORD-003', 'Gym Staff Uniforms', 'in_production', '3', 'Mike Williams', 890, daysFromNow(5)),
  createOrder('4', 'ORD-004', 'Creative Studio Merch', 'quote', '4', 'Emily Davis', 450, daysFromNow(14)),
  createOrder('5', 'ORD-005', 'Restaurant Uniforms', 'shipped', '5', 'David Brown', 620, daysAgo(2)),
  createOrder('6', 'ORD-006', 'Charity Run Shirts', 'in_production', '6', 'Lisa Anderson', 2100, daysFromNow(4)),
  createOrder('7', 'ORD-007', 'Construction Crew Gear', 'delivered', '7', 'James Wilson', 1800, daysAgo(5)),
  createOrder('8', 'ORD-008', 'Yoga Instructor Tanks', 'pending_approval', '8', 'Jennifer Taylor', 380, daysAgo(1)), // Overdue
  createOrder('9', 'ORD-009', 'Auto Shop Polos', 'ready_for_pickup', '9', 'Robert Martinez', 540, daysFromNow(1)),
  createOrder('10', 'ORD-010', 'Bakery Staff Aprons', 'artwork_approved', '10', 'Amanda Garcia', 720, daysFromNow(6))
]

// =============================================================================
// LOOKUP HELPERS
// =============================================================================

export function getOrderById(id: string): Order | undefined {
  return typedOrders.find(o => o.id === id)
}

export function getCustomerById(id: string): Customer | undefined {
  return typedCustomers.find(c => c.id === id)
}
