export type CustomerTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
  country?: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  address?: Address;
  tier: CustomerTier;
  orders_count: number;
  total_revenue: number;
  last_order_date?: string;
}

// Legacy status types (for existing components)
export type OrderStatus = 'QUOTE' | 'NEW' | 'ART APPROVAL' | 'IN PRODUCTION' | 'COMPLETE' | 'SHIPPED';

// API status types (matching production-stats categories)
export type APIOrderStatus = 'quote' | 'art' | 'screenprint' | 'embroidery' | 'dtg' | 'fulfillment' | 'complete';

// Simplified order type matching API response
export interface APIOrder {
  id: number;
  visual_id: string;
  order_nickname: string | null;
  status: string;
  printavo_status_name: string;
  customer_name: string;
  total_amount: number;
  due_date: string | null;
  artwork_count: number;
}

export type ImprintLocation = 'Front' | 'Back' | 'Left Chest' | 'Right Sleeve' | 'Left Sleeve' | 'Neck';
export type ImprintMethod = 'screen-print' | 'dtg' | 'embroidery' | 'vinyl' | 'digital-transfer';

export interface Mockup {
  url: string;
  thumbnailUrl: string;
}

export interface ProductionFile {
  url: string;
  filename: string;
}

export interface Artwork {
  id: string;
  imprint_id: string;
  file_url: string;
  filename: string;
  file_size: number;
  approved: boolean;
  uploaded_at: string;
  notes: string;
}

export interface Imprint {
  id: string;
  line_item_id: string;
  location: ImprintLocation;
  method: ImprintMethod;
  colors: number;
  width: number;
  height: number;
  artwork: Artwork | null;
  setup_fee: number;
  mockups: Mockup[];
}

export interface SizeBreakdown {
  XS: number;
  S: number;
  M: number;
  L: number;
  XL: number;
  '2XL': number;
  '3XL': number;
}

export interface LineItem {
  id: string;
  order_id: string;
  product_name: string;
  product_sku: string;
  product_color: string;
  sizes: SizeBreakdown;
  quantity: number;
  unit_price: number;
  subtotal: number;
  imprints: Imprint[];
  mockups: Mockup[];
  production_files: ProductionFile[];
}

export interface Order {
  id: string;
  visual_id: string;
  customer_id: string;
  customer_name: string;
  customer_company?: string;
  line_items_count?: number;
  status: OrderStatus;
  line_items: LineItem[];
  subtotal: number;
  tax: number;
  total: number;
  due_date: string;
  customer_due_date?: string;
  created_at: string;
  production_notes: string;
  nickname?: string;
}

export type TransactionType = 'payment' | 'refund';
export type PaymentMethod = 'cash' | 'check' | 'card' | 'venmo' | 'zelle' | 'paypal' | 'bank-transfer';

export interface Transaction {
  id: string;
  order_id: string;
  type: TransactionType;
  amount: number;
  method: PaymentMethod;
  reference: string;
  date: string;
  notes: string;
}

export type View = 'dashboard' | 'orders' | 'order-detail' | 'quotes' | 'quote-builder' | 'quote-requests' | 'customers' | 'customer-detail' | 'reports' | 'products' | 'settings';

// Supplier product types
export type SupplierName = 'ss_activewear' | 'as_colour' | 'sanmar' | 'all';

export interface SupplierProduct {
  supplier: string;
  supplier_sku: string;
  style_code: string;
  brand: string;
  title: string;
  description?: string;
  category?: string;
  subcategory?: string;
  base_price: number | null;
  piece_price?: number | null;
  case_price?: number | null;
  case_qty?: number | null;
  color: string;
  color_hex?: string;
  size: string;
  image_url: string | null;
  gtin?: string;
  status?: string;
  inventory: {
    total: number;
    warehouses?: Array<{
      name: string;
      qty: number;
    }>;
  };
}
