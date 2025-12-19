import { useState } from 'react';
import { Package, Users, ChartLine, ArrowLeft } from '@phosphor-icons/react';
import { Transaction, View, OrderStatus, ImprintMethod } from '@/lib/types';
import { useOrders, useCustomers } from '@/lib/hooks';
import { type OrderStatus as ApiOrderStatus } from '@/lib/api-adapter';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { OrdersList } from '@/components/orders/OrdersList';
import { OrderDetailPage } from '@/components/orders/OrderDetailPage';
import { CustomersListPage } from '@/components/customers/CustomersListPage';
import { CustomerDetailPage } from '@/components/customers/CustomerDetailPage';
import { Button } from '@/components/ui/button';

// Map API status to component status
function mapApiStatus(status: ApiOrderStatus): OrderStatus {
  const statusMap: Record<ApiOrderStatus, OrderStatus> = {
    'quote': 'QUOTE',
    'pending_approval': 'NEW',
    'artwork_approved': 'ART APPROVAL',
    'in_production': 'IN PRODUCTION',
    'shipped': 'SHIPPED',
    'ready_for_pickup': 'COMPLETE',
    'delivered': 'COMPLETE',
    'on_hold': 'NEW',
    'cancelled': 'COMPLETE'
  };
  return statusMap[status] || 'NEW';
}

// Map API imprint type to component imprint method
function mapImprintType(type: string): ImprintMethod {
  const typeMap: Record<string, ImprintMethod> = {
    'screen_print': 'screen-print',
    'dtg': 'dtg',
    'embroidery': 'embroidery',
    'vinyl': 'vinyl',
    'digital_transfer': 'digital-transfer'
  };
  return typeMap[type] || 'screen-print';
}

// Map API imprint location to component location type
function mapImprintLocation(location: string): 'Front' | 'Back' | 'Left Chest' | 'Right Sleeve' | 'Left Sleeve' | 'Neck' {
  const locationMap: Record<string, 'Front' | 'Back' | 'Left Chest' | 'Right Sleeve' | 'Left Sleeve' | 'Neck'> = {
    'Front Center': 'Front',
    'Front': 'Front',
    'Back Center': 'Back',
    'Back': 'Back',
    'Left Chest': 'Left Chest',
    'Right Sleeve': 'Right Sleeve',
    'Left Sleeve': 'Left Sleeve',
    'Neck': 'Neck'
  };
  return locationMap[location] || 'Front';
}

function App() {
  const { orders: apiOrders, loading: ordersLoading } = useOrders({ limit: 100 });
  const { customers: apiCustomers, loading: customersLoading } = useCustomers({ limit: 100 });
  
  // Transform API orders to match component types
  const orders = apiOrders.map(o => ({
    id: o.id,
    visual_id: o.visual_id,
    customer_id: o.customer_id,
    customer_name: o.customer?.name || 'Unknown',
    status: mapApiStatus(o.status),
    line_items: o.line_items.map(li => ({
      id: li.id,
      order_id: o.id,
      product_name: li.product.name,
      product_sku: li.product.sku,
      product_color: li.product.color,
      sizes: {
        XS: li.sizes.find(s => s.size === 'XS')?.quantity || 0,
        S: li.sizes.find(s => s.size === 'S')?.quantity || 0,
        M: li.sizes.find(s => s.size === 'M')?.quantity || 0,
        L: li.sizes.find(s => s.size === 'L')?.quantity || 0,
        XL: li.sizes.find(s => s.size === 'XL')?.quantity || 0,
        '2XL': li.sizes.find(s => s.size === '2XL')?.quantity || 0,
        '3XL': li.sizes.find(s => s.size === '3XL')?.quantity || 0,
      },
      quantity: li.quantity,
      unit_price: li.unit_price,
      subtotal: li.subtotal,
      imprints: li.imprints.map(imp => ({
        id: imp.id,
        line_item_id: li.id,
        location: mapImprintLocation(imp.location),
        method: mapImprintType(imp.type),
        colors: imp.colors,
        width: imp.width,
        height: imp.height,
        artwork: null,
        setup_fee: 0
      }))
    })),
    subtotal: o.subtotal,
    tax: o.sales_tax,
    total: o.total,
    due_date: o.due_date,
    created_at: o.created_at,
    production_notes: o.production_note,
    nickname: o.nickname
  }));

  // Transform API customers to match component types
  const customers = apiCustomers.map(c => ({
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone,
    company: c.company,
    address: {
      street: c.address?.street || '',
      city: c.address?.city || '',
      state: c.address?.state || '',
      zip: c.address?.zip || ''
    },
    tier: c.tier || 'bronze' as const,
    orders_count: c.orders_count || 0,
    total_revenue: c.total_revenue || 0
  }));

  const transactions: Transaction[] = [];
  
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  
  const handleViewOrder = (orderId: string) => {
    setSelectedOrderId(orderId);
    setCurrentView('order-detail');
  };
  
  const handleViewCustomer = (customerId: string) => {
    setSelectedCustomerId(customerId);
    setCurrentView('customer-detail');
  };
  
  const handleBack = () => {
    if (currentView === 'order-detail') {
      setCurrentView('orders');
      setSelectedOrderId(null);
    } else if (currentView === 'customer-detail') {
      setCurrentView('customers');
      setSelectedCustomerId(null);
    }
  };
  
  const selectedOrder = orders.find(o => o.id === selectedOrderId) || null;
  const selectedCustomer = customers.find(c => c.id === selectedCustomerId) || null;
  const orderTransactions = selectedOrder 
    ? transactions.filter(t => t.order_id === selectedOrder.id)
    : [];
  
  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <Dashboard 
            orders={orders} 
            customers={customers}
            onViewOrder={handleViewOrder}
          />
        );
      case 'orders':
        return (
          <OrdersList
            onViewOrder={handleViewOrder}
          />
        );
      case 'order-detail':
        return selectedOrderId ? (
          <OrderDetailPage
            visualId={selectedOrderId}
            onViewCustomer={handleViewCustomer}
          />
        ) : null;
      case 'customers':
        return (
          <CustomersListPage
            onViewCustomer={handleViewCustomer}
          />
        );
      case 'customer-detail':
        return selectedCustomerId ? (
          <CustomerDetailPage
            customerId={selectedCustomerId}
            onViewOrder={handleViewOrder}
          />
        ) : null;
      default:
        return null;
    }
  };
  
  const showBackButton = currentView === 'order-detail' || currentView === 'customer-detail';
  
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {showBackButton && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleBack}
                className="gap-1.5"
              >
                <ArrowLeft weight="bold" className="w-4 h-4" />
                Back
              </Button>
            )}
            <h1 className="text-xl font-semibold tracking-tight text-primary">
              Print Shop OS
            </h1>
          </div>
          
          <nav className="flex items-center gap-1">
            <Button 
              variant={currentView === 'dashboard' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setCurrentView('dashboard')}
              className="gap-1.5"
            >
              <ChartLine weight="bold" className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Button>
            <Button 
              variant={currentView === 'orders' || currentView === 'order-detail' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => { setCurrentView('orders'); setSelectedOrderId(null); }}
              className="gap-1.5"
            >
              <Package weight="bold" className="w-4 h-4" />
              <span className="hidden sm:inline">Orders</span>
            </Button>
            <Button 
              variant={currentView === 'customers' || currentView === 'customer-detail' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => { setCurrentView('customers'); setSelectedCustomerId(null); }}
              className="gap-1.5"
            >
              <Users weight="bold" className="w-4 h-4" />
              <span className="hidden sm:inline">Customers</span>
            </Button>
          </nav>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 py-6">
        {renderView()}
      </main>
    </div>
  );
}

export default App;
