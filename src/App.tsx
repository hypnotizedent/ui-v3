import { useState } from 'react';
import { Package, Users, ChartLine, ArrowLeft, FileText } from '@phosphor-icons/react';
import { Transaction, View, OrderStatus, ImprintMethod } from '@/lib/types';
import { useOrders, useCustomers } from '@/lib/hooks';
import { type OrderStatus as ApiOrderStatus } from '@/lib/api-adapter';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { OrdersList } from '@/components/orders/OrdersList';
import { OrderDetailPage } from '@/components/orders/OrderDetailPage';
import { QuotesListPage } from '@/components/quotes/QuotesListPage';
import { createQuote } from '@/lib/quote-api';
// QuoteBuilderPage replaced by OrderDetailPage with mode="quote"
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
  
  console.log('App loaded - Spark UI v2.2.0', { ordersCount: apiOrders.length, customersCount: apiCustomers.length });
  
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
        setup_fee: 0,
        mockups: imp.mockups || []
      })),
      mockups: li.mockups || [],
      production_files: li.production_files || []
    })),
    subtotal: o.subtotal,
    tax: o.sales_tax,
    total: o.total,
    due_date: o.due_date,
    customer_due_date: o.customer_due_date || undefined,
    created_at: o.created_at,
    production_notes: o.production_note,
    nickname: o.nickname || undefined
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
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);
  
  const handleViewOrder = (orderId: string) => {
    setSelectedOrderId(orderId);
    setCurrentView('order-detail');
  };
  
  const handleViewCustomer = (customerId: string) => {
    setSelectedCustomerId(customerId);
    setCurrentView('customer-detail');
  };

  const handleViewQuote = (quoteId: string) => {
    setSelectedQuoteId(quoteId);
    setCurrentView('quote-builder');
  };

  const handleNewQuote = async () => {
    try {
      // Create a new draft quote via API
      const newQuote = await createQuote({});
      setSelectedQuoteId(String(newQuote.id));
      setCurrentView('quote-builder');
    } catch (err) {
      console.error('Failed to create quote:', err);
      // Still navigate but without a quote ID - will show error state
      setSelectedQuoteId(null);
      setCurrentView('quotes');
    }
  };

  const handleBack = () => {
    if (currentView === 'order-detail') {
      setCurrentView('orders');
      setSelectedOrderId(null);
    } else if (currentView === 'customer-detail') {
      setCurrentView('customers');
      setSelectedCustomerId(null);
    } else if (currentView === 'quote-builder') {
      setCurrentView('quotes');
      setSelectedQuoteId(null);
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
            onNavigateToOrders={() => setCurrentView('orders')}
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
      case 'quotes':
        return (
          <QuotesListPage
            onViewQuote={handleViewQuote}
            onNewQuote={handleNewQuote}
          />
        );
      case 'quote-builder':
        return selectedQuoteId ? (
          <OrderDetailPage
            visualId={selectedQuoteId}
            mode="quote"
            onViewCustomer={handleViewCustomer}
            onConvertSuccess={(orderId) => {
              // After conversion, navigate to the new order
              setSelectedOrderId(orderId);
              setCurrentView('order-detail');
              setSelectedQuoteId(null);
            }}
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
  
  const showBackButton = currentView === 'order-detail' || currentView === 'customer-detail' || currentView === 'quote-builder';
  
  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Sidebar */}
      <aside className="w-52 border-r border-border bg-card/30 flex flex-col fixed h-screen">
        <div className="px-3 py-3 border-b border-border">
          <div className="flex items-center gap-2.5">
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 2L10 10L2 16L10 22L16 30L22 22L30 16L22 10L16 2Z" fill="#10B981"/>
              <circle cx="24" cy="8" r="2.5" fill="#10B981"/>
              <circle cx="8" cy="24" r="1.5" fill="#10B981"/>
              <circle cx="26" cy="6" r="1" fill="#10B981"/>
            </svg>
            <span className="font-bold text-lg tracking-wide">MINT PRINTS</span>
            <span className="text-[8px] text-muted-foreground ml-1">v2.2.0</span>
          </div>
        </div>
        
        <nav className="flex-1 px-2 py-2 space-y-0.5">
          <Button 
            variant={currentView === 'dashboard' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setCurrentView('dashboard')}
            className="w-full justify-start gap-2 h-8"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Home
          </Button>
          
          <Button
            variant={currentView === 'orders' || currentView === 'order-detail' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => { setCurrentView('orders'); setSelectedOrderId(null); }}
            className="w-full justify-start gap-2 h-8"
          >
            <Package weight="bold" className="w-4 h-4" />
            Orders
          </Button>

          <Button
            variant={currentView === 'quotes' || currentView === 'quote-builder' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => { setCurrentView('quotes'); setSelectedQuoteId(null); }}
            className="w-full justify-start gap-2 h-8"
          >
            <FileText weight="bold" className="w-4 h-4" />
            Quotes
          </Button>

          <Button
            variant={currentView === 'customers' || currentView === 'customer-detail' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => { setCurrentView('customers'); setSelectedCustomerId(null); }}
            className="w-full justify-start gap-2 h-8"
          >
            <Users weight="bold" className="w-4 h-4" />
            Customers
          </Button>
          
          <Button 
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 h-8"
          >
            <ChartLine weight="bold" className="w-4 h-4" />
            Reports
          </Button>
        </nav>
        
        <div className="px-2 py-2 border-t border-border">
          <div className="flex items-center justify-center gap-1">
            <Button 
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </Button>
            <Button 
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </Button>
            <Button 
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </Button>
          </div>
        </div>
      </aside>

      {/* Content */}
      <div className="flex-1 ml-52">
        <header className="border-b border-border bg-background/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {showBackButton && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleBack}
                  className="gap-1.5 h-8"
                >
                  <ArrowLeft weight="bold" className="w-4 h-4" />
                  Back
                </Button>
              )}
              <div className="relative w-96">
                <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search customers, quotes, jobs..."
                  className="w-full pl-9 pr-3 py-1.5 bg-card/50 border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="default" size="sm" className="gap-2 h-8" onClick={handleNewQuote}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Quote
              </Button>
            </div>
          </div>
        </header>
        
        <main className="p-4">
          {renderView()}
        </main>
      </div>
    </div>
  );
}

export default App;
