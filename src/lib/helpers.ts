import { OrderStatus, CustomerTier, ImprintMethod, PaymentMethod } from './types';

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

export function getStatusColor(status: OrderStatus): string {
  const colors: Record<OrderStatus, string> = {
    'QUOTE': 'bg-slate-500/20 text-slate-300',
    'NEW': 'bg-blue-500/20 text-blue-300',
    'ART APPROVAL': 'bg-yellow-500/20 text-yellow-300',
    'IN PRODUCTION': 'bg-purple-500/20 text-purple-300',
    'COMPLETE': 'bg-green-500/20 text-green-300',
    'SHIPPED': 'bg-emerald-500/20 text-emerald-300'
  };
  return colors[status];
}

// Status colors matching dashboard (handles both category and Printavo status names)
export function getAPIStatusColor(status: string): string {
  const normalized = status.toLowerCase().replace(/[_\s]+/g, '_');
  const colors: Record<string, string> = {
    // Category-based (from production-stats)
    'quote': 'bg-violet-500/20 text-violet-400',
    'art': 'bg-purple-500/20 text-purple-400',
    'screenprint': 'bg-blue-500/20 text-blue-400',
    'embroidery': 'bg-pink-500/20 text-pink-400',
    'dtg': 'bg-cyan-500/20 text-cyan-400',
    'fulfillment': 'bg-orange-500/20 text-orange-400',
    'complete': 'bg-green-500/20 text-green-400',
    // Printavo status names (actual values from database)
    'quote_out_for_approval___email': 'bg-violet-500/20 text-violet-400',
    'materials_pending': 'bg-amber-500/20 text-amber-400',
    'ready_for_pick_up': 'bg-orange-500/20 text-orange-400',
    'payment_needed': 'bg-red-500/20 text-red-400',
    'invoice_paid': 'bg-green-500/20 text-green-400',
    'shipped___tracking_updated': 'bg-emerald-500/20 text-emerald-400',
    // Art statuses
    'ready_for_art_dept': 'bg-purple-500/20 text-purple-400',
    'art___wip': 'bg-purple-500/20 text-purple-400',
    // Screen print statuses
    'sp___art_needs_to_be_outsourced': 'bg-blue-500/20 text-blue-400',
    'sp___art_needs_to_be_traced': 'bg-blue-500/20 text-blue-400',
    'sp___need_film_files_made': 'bg-blue-500/20 text-blue-400',
    'sp___need_to_print_films': 'bg-blue-500/20 text-blue-400',
    'sp___need_to_burn_screens': 'bg-blue-500/20 text-blue-400',
    'sp___needs_ink_mixing': 'bg-blue-500/20 text-blue-400',
    'sp___preproduction': 'bg-blue-500/20 text-blue-400',
    'sp___production': 'bg-blue-500/20 text-blue-400',
    // Embroidery statuses
    'emb___art_needs_to_be_reviewed': 'bg-pink-500/20 text-pink-400',
    'emb___art_needs_to_be_sent_to_jj': 'bg-pink-500/20 text-pink-400',
    'emb___awaiting_digitized_file': 'bg-pink-500/20 text-pink-400',
    'emb___need_to_make_sew_out': 'bg-pink-500/20 text-pink-400',
    'emb___need_sew_out_approval': 'bg-pink-500/20 text-pink-400',
    'emb___preproduction': 'bg-pink-500/20 text-pink-400',
    'emb___production': 'bg-pink-500/20 text-pink-400',
    // DTG statuses
    'dtg___art_needs_to_be_outsourced': 'bg-cyan-500/20 text-cyan-400',
    'dtg___need_to_set_up_files__crop_and_scale_': 'bg-cyan-500/20 text-cyan-400',
    'dtg_need_to_pretreat': 'bg-cyan-500/20 text-cyan-400',
    'dtg___awaiting_supacolor_transfers': 'bg-cyan-500/20 text-cyan-400',
    'dtg___production': 'bg-cyan-500/20 text-cyan-400',
    'supa___need_to_order_supacolor_transfers': 'bg-cyan-500/20 text-cyan-400',
    'supa___production': 'bg-cyan-500/20 text-cyan-400',
    // Legacy/simplified
    'new': 'bg-blue-500/20 text-blue-400',
    'on_hold': 'bg-red-500/20 text-red-400',
    'cancelled': 'bg-slate-500/20 text-slate-400',
  };
  return colors[normalized] || 'bg-slate-500/20 text-slate-400';
}

// Human-readable status labels
export function getAPIStatusLabel(status: string): string {
  const normalized = status.toLowerCase().replace(/[_\s]+/g, '_');
  const labels: Record<string, string> = {
    // Category-based
    'quote': 'Quote',
    'art': 'Art',
    'screenprint': 'Screen',
    'embroidery': 'Emb',
    'dtg': 'DTG',
    'fulfillment': 'Fulfill',
    'complete': 'Done',
    // Printavo status names
    'new': 'New',
    'art_approval': 'Art',
    'artwork_approved': 'Approved',
    'payment_needed': 'Payment',
    'in_production': 'Production',
    'screen_print_production': 'Screen',
    'embroidery_production': 'Emb',
    'dtg_production': 'DTG',
    'ready': 'Ready',
    'ready_for_pickup': 'Pickup',
    'shipped': 'Shipped',
    'delivered': 'Done',
    'on_hold': 'Hold',
    'cancelled': 'Cancelled',
  };
  return labels[normalized] || status.replace(/_/g, ' ');
}

export function getTierColor(tier: CustomerTier): string {
  const colors: Record<CustomerTier, string> = {
    'bronze': 'bg-amber-700/20 text-amber-400',
    'silver': 'bg-slate-400/20 text-slate-300',
    'gold': 'bg-yellow-500/20 text-yellow-400',
    'platinum': 'bg-cyan-500/20 text-cyan-300'
  };
  return colors[tier];
}

export function getMethodLabel(method: ImprintMethod): string {
  const labels: Record<ImprintMethod, string> = {
    'screen-print': 'Screen Print',
    'dtg': 'DTG',
    'embroidery': 'Embroidery',
    'vinyl': 'Vinyl',
    'digital-transfer': 'Digital Transfer'
  };
  return labels[method];
}

export function getPaymentMethodLabel(method: PaymentMethod): string {
  const labels: Record<PaymentMethod, string> = {
    'cash': 'Cash',
    'check': 'Check',
    'card': 'Card',
    'venmo': 'Venmo',
    'zelle': 'Zelle',
    'paypal': 'PayPal',
    'bank-transfer': 'Bank Transfer'
  };
  return labels[method];
}

import { Order } from './types';

export function getOrdersNeedingAttention(orders: Order[]): Order[] {
  const now = new Date();
  return orders.filter(order => {
    if (order.status === 'COMPLETE' || order.status === 'SHIPPED') return false;
    const dueDate = new Date(order.due_date);
    const isOverdue = dueDate < now;
    const isPendingApproval = order.status === 'ART APPROVAL';
    return isOverdue || isPendingApproval;
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function calculateOrderTotals(order: Order): { subtotal: number; tax: number; total: number } {
  const subtotal = order.line_items.reduce((sum, item) => sum + item.subtotal, 0);
  const tax = subtotal * 0.08;
  const total = subtotal + tax;
  return { subtotal, tax, total };
}
