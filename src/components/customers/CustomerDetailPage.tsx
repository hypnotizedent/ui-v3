import { useCustomerDetail, type OrderListItem } from '@/lib/hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  User,
  Envelope,
  Phone,
  Buildings,
  MapPin,
  Package,
  Warning,
  ArrowClockwise,
  PencilSimple,
  Check,
  X
} from '@phosphor-icons/react';
import { formatCurrency, formatDate, getAPIStatusColor, getAPIStatusLabel } from '@/lib/helpers';
import { useState, useEffect } from 'react';

interface CustomerDetailPageProps {
  customerId: string;
  onViewOrder: (orderId: string) => void;
}

export function CustomerDetailPage({ customerId, onViewOrder }: CustomerDetailPageProps) {
  const { customer, orders, loading, error, refetch } = useCustomerDetail(customerId);

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [shippingSameAsBilling, setShippingSameAsBilling] = useState(false);
  const [billingAddress, setBillingAddress] = useState({
    street: '',
    city: '',
    state: '',
    zip: '',
    country: 'US'
  });
  const [shippingAddress, setShippingAddress] = useState({
    street: '',
    city: '',
    state: '',
    zip: '',
    country: 'US'
  });

  // Initialize addresses when customer loads
  useEffect(() => {
    if (customer?.billingAddress) {
      setBillingAddress({
        street: customer.billingAddress.street || '',
        city: customer.billingAddress.city || '',
        state: customer.billingAddress.state || '',
        zip: customer.billingAddress.zip || '',
        country: customer.billingAddress.country || 'US'
      });
    }
    if (customer?.shippingAddress) {
      setShippingAddress({
        street: customer.shippingAddress.street || '',
        city: customer.shippingAddress.city || '',
        state: customer.shippingAddress.state || '',
        zip: customer.shippingAddress.zip || '',
        country: customer.shippingAddress.country || 'US'
      });
    }
  }, [customer]);

  // Google Places Autocomplete for billing address
  useEffect(() => {
    if (!window.google || !isEditing) return;
    
    const input = document.getElementById('billing-address-autocomplete') as HTMLInputElement;
    if (!input) return;

    const autocomplete = new window.google.maps.places.Autocomplete(input, {
      types: ['address'],
      componentRestrictions: { country: 'us' }
    });
    
    const getComponent = (components: any[], type: string) => 
      components?.find(c => c.types.includes(type))?.long_name || '';
    
    const listener = () => {
      const place = autocomplete.getPlace();
      const components = place.address_components;
      
      if (components) {
        setBillingAddress({
          street: `${getComponent(components, 'street_number')} ${getComponent(components, 'route')}`.trim(),
          city: getComponent(components, 'locality') || getComponent(components, 'sublocality'),
          state: getComponent(components, 'administrative_area_level_1'),
          zip: getComponent(components, 'postal_code'),
          country: getComponent(components, 'country')
        });
      }
    };
    
    autocomplete.addListener('place_changed', listener);
    
    // Cleanup
    return () => {
      window.google.maps.event.clearInstanceListeners(autocomplete);
    };
  }, [isEditing]);

  // Google Places Autocomplete for shipping address
  useEffect(() => {
    if (!window.google || !isEditing || shippingSameAsBilling) return;
    
    const input = document.getElementById('shipping-address-autocomplete') as HTMLInputElement;
    if (!input) return;

    const autocomplete = new window.google.maps.places.Autocomplete(input, {
      types: ['address'],
      componentRestrictions: { country: 'us' }
    });
    
    const getComponent = (components: any[], type: string) => 
      components?.find(c => c.types.includes(type))?.long_name || '';
    
    const listener = () => {
      const place = autocomplete.getPlace();
      const components = place.address_components;
      
      if (components) {
        setShippingAddress({
          street: `${getComponent(components, 'street_number')} ${getComponent(components, 'route')}`.trim(),
          city: getComponent(components, 'locality') || getComponent(components, 'sublocality'),
          state: getComponent(components, 'administrative_area_level_1'),
          zip: getComponent(components, 'postal_code'),
          country: getComponent(components, 'country')
        });
      }
    };
    
    autocomplete.addListener('place_changed', listener);
    
    // Cleanup
    return () => {
      window.google.maps.event.clearInstanceListeners(autocomplete);
    };
  }, [isEditing, shippingSameAsBilling]);

  const handleSave = () => {
    // TODO: Implement API call to save addresses
    // For now, just update local state and exit edit mode
    console.log('Saving addresses:', { 
      billingAddress, 
      shippingAddress: shippingSameAsBilling ? billingAddress : shippingAddress 
    });
    
    // Show a warning that this is not persisted yet
    alert('Note: Address changes are displayed but not yet persisted to the database. API integration needed.');
    
    setIsEditing(false);
  };

  const handleCancel = () => {
    // Reset to original values
    if (customer?.billingAddress) {
      setBillingAddress({
        street: customer.billingAddress.street || '',
        city: customer.billingAddress.city || '',
        state: customer.billingAddress.state || '',
        zip: customer.billingAddress.zip || '',
        country: customer.billingAddress.country || 'US'
      });
    }
    if (customer?.shippingAddress) {
      setShippingAddress({
        street: customer.shippingAddress.street || '',
        city: customer.shippingAddress.city || '',
        state: customer.shippingAddress.state || '',
        zip: customer.shippingAddress.zip || '',
        country: customer.shippingAddress.country || 'US'
      });
    }
    setIsEditing(false);
  };

  // Calculate totals
  const totalSpent = orders.reduce((sum, o) => sum + o.total_amount, 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-48 mb-2" />
          <div className="h-4 bg-muted rounded w-32" />
        </div>
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="space-y-6">
            {[...Array(2)].map((_, i) => (
              <Card key={i} className="bg-card border-border">
                <CardContent className="py-6">
                  <div className="animate-pulse h-20 bg-muted rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="lg:col-span-2">
            <Card className="bg-card border-border">
              <CardContent className="py-6">
                <div className="animate-pulse space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-16 bg-muted rounded" />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Customer Details</h2>
        </div>
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6 text-center">
            <Warning size={48} className="mx-auto mb-4 text-destructive" />
            <h3 className="text-lg font-semibold mb-2">Failed to Load Customer</h3>
            <p className="text-sm text-muted-foreground mb-4">{error.message}</p>
            <Button onClick={() => refetch()} variant="outline" className="gap-2">
              <ArrowClockwise size={16} />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="space-y-6">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6 text-center">
            <User size={48} className="mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Customer Not Found</h3>
            <p className="text-sm text-muted-foreground">
              Could not find customer #{customerId}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">{customer.name}</h2>
          {customer.company && (
            <p className="text-muted-foreground mt-1">{customer.company}</p>
          )}
        </div>
        <div className="text-right">
          <div className="text-2xl font-semibold">{formatCurrency(totalSpent)}</div>
          <p className="text-sm text-muted-foreground">
            Lifetime value • {customer.orders_count} orders
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact Info */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <User className="w-4 h-4" weight="bold" />
                Contact Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              {customer.email && (
                <div className="flex items-center gap-3">
                  <Envelope className="w-4 h-4 text-muted-foreground" weight="bold" />
                  <a href={`mailto:${customer.email}`} className="text-primary hover:underline">
                    {customer.email}
                  </a>
                </div>
              )}
              {customer.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-muted-foreground" weight="bold" />
                  <a href={`tel:${customer.phone}`} className="hover:text-primary">
                    {customer.phone}
                  </a>
                </div>
              )}
              {customer.company && (
                <div className="flex items-center gap-3">
                  <Buildings className="w-4 h-4 text-muted-foreground" weight="bold" />
                  <span>{customer.company}</span>
                </div>
              )}
              {!customer.email && !customer.phone && !customer.company && (
                <p className="text-muted-foreground">No contact info available</p>
              )}
            </CardContent>
          </Card>

          {/* Location */}
          <Card className="bg-card border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <MapPin className="w-4 h-4" weight="bold" />
                  Location
                </CardTitle>
                {!isEditing ? (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    className="h-8 w-8 p-0"
                  >
                    <PencilSimple className="w-4 h-4" />
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={handleSave}
                      className="h-8 w-8 p-0"
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={handleCancel}
                      className="h-8 w-8 p-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="text-sm space-y-4">
              {!isEditing ? (
                <>
                  {/* View Mode - Billing Address */}
                  <div>
                    <p className="text-xs text-muted-foreground uppercase mb-1">Billing Address</p>
                    {customer?.billingAddress ? (
                      <>
                        <p className="text-foreground">{customer.billingAddress.street || '—'}</p>
                        <p className="text-muted-foreground">
                          {customer.billingAddress.city}, {customer.billingAddress.state} {customer.billingAddress.zip}
                        </p>
                        {customer.billingAddress.country && customer.billingAddress.country !== 'US' && (
                          <p className="text-muted-foreground">{customer.billingAddress.country}</p>
                        )}
                      </>
                    ) : (
                      <p className="text-muted-foreground">
                        {customer?.city && customer?.state
                          ? `${customer.city}, ${customer.state}`
                          : customer?.city || customer?.state || '—'}
                      </p>
                    )}
                  </div>
                  
                  {/* View Mode - Shipping Address (if different) */}
                  {customer?.shippingAddress && customer.shippingAddress.street !== customer?.billingAddress?.street && (
                    <div>
                      <p className="text-xs text-muted-foreground uppercase mb-1">Shipping Address</p>
                      <p className="text-foreground">{customer.shippingAddress.street}</p>
                      <p className="text-muted-foreground">
                        {customer.shippingAddress.city}, {customer.shippingAddress.state} {customer.shippingAddress.zip}
                      </p>
                      {customer.shippingAddress.country && customer.shippingAddress.country !== 'US' && (
                        <p className="text-muted-foreground">{customer.shippingAddress.country}</p>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* Edit Mode - Billing Address */}
                  <div>
                    <p className="text-xs text-muted-foreground uppercase mb-2">Billing Address</p>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-muted-foreground uppercase block mb-1">Street Address</label>
                        <input
                          id="billing-address-autocomplete"
                          type="text"
                          value={billingAddress.street}
                          onChange={(e) => setBillingAddress({...billingAddress, street: e.target.value})}
                          placeholder="Start typing address..."
                          className="w-full bg-secondary border border-input rounded px-3 py-2 text-foreground"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-muted-foreground uppercase block mb-1">City</label>
                          <input
                            type="text"
                            value={billingAddress.city}
                            onChange={(e) => setBillingAddress({...billingAddress, city: e.target.value})}
                            className="w-full bg-secondary border border-input rounded px-3 py-2 text-foreground"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground uppercase block mb-1">State</label>
                          <input
                            type="text"
                            value={billingAddress.state}
                            onChange={(e) => setBillingAddress({...billingAddress, state: e.target.value})}
                            className="w-full bg-secondary border border-input rounded px-3 py-2 text-foreground"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-muted-foreground uppercase block mb-1">ZIP Code</label>
                          <input
                            type="text"
                            value={billingAddress.zip}
                            onChange={(e) => setBillingAddress({...billingAddress, zip: e.target.value})}
                            className="w-full bg-secondary border border-input rounded px-3 py-2 text-foreground"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground uppercase block mb-1">Country</label>
                          <input
                            type="text"
                            value={billingAddress.country}
                            onChange={(e) => setBillingAddress({...billingAddress, country: e.target.value})}
                            placeholder="US"
                            className="w-full bg-secondary border border-input rounded px-3 py-2 text-foreground"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Shipping same as billing checkbox */}
                  <div>
                    <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                      <input
                        type="checkbox"
                        checked={shippingSameAsBilling}
                        onChange={(e) => setShippingSameAsBilling(e.target.checked)}
                        className="rounded bg-secondary border-input"
                      />
                      Shipping address same as billing
                    </label>
                  </div>

                  {/* Edit Mode - Shipping Address */}
                  {!shippingSameAsBilling && (
                    <div>
                      <p className="text-xs text-muted-foreground uppercase mb-2">Shipping Address</p>
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs text-muted-foreground uppercase block mb-1">Street Address</label>
                          <input
                            id="shipping-address-autocomplete"
                            type="text"
                            value={shippingAddress.street}
                            onChange={(e) => setShippingAddress({...shippingAddress, street: e.target.value})}
                            placeholder="Start typing address..."
                            className="w-full bg-secondary border border-input rounded px-3 py-2 text-foreground"
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-muted-foreground uppercase block mb-1">City</label>
                            <input
                              type="text"
                              value={shippingAddress.city}
                              onChange={(e) => setShippingAddress({...shippingAddress, city: e.target.value})}
                              className="w-full bg-secondary border border-input rounded px-3 py-2 text-foreground"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground uppercase block mb-1">State</label>
                            <input
                              type="text"
                              value={shippingAddress.state}
                              onChange={(e) => setShippingAddress({...shippingAddress, state: e.target.value})}
                              className="w-full bg-secondary border border-input rounded px-3 py-2 text-foreground"
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-muted-foreground uppercase block mb-1">ZIP Code</label>
                            <input
                              type="text"
                              value={shippingAddress.zip}
                              onChange={(e) => setShippingAddress({...shippingAddress, zip: e.target.value})}
                              className="w-full bg-secondary border border-input rounded px-3 py-2 text-foreground"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground uppercase block mb-1">Country</label>
                            <input
                              type="text"
                              value={shippingAddress.country}
                              onChange={(e) => setShippingAddress({...shippingAddress, country: e.target.value})}
                              placeholder="US"
                              className="w-full bg-secondary border border-input rounded px-3 py-2 text-foreground"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Stats */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Package className="w-4 h-4" weight="bold" />
                Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Orders</span>
                <span className="font-medium">{customer.orders_count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Spent</span>
                <span className="font-medium">{formatCurrency(totalSpent)}</span>
              </div>
              {customer.orders_count > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Avg Order</span>
                  <span className="font-medium">
                    {formatCurrency(totalSpent / customer.orders_count)}
                  </span>
                </div>
              )}
              {customer.created_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Customer Since</span>
                  <span>{formatDate(customer.created_at)}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Orders */}
        <div className="lg:col-span-2">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-base font-medium">Order History</CardTitle>
            </CardHeader>
            <CardContent>
              {orders.length === 0 ? (
                <div className="py-8 text-center">
                  <Package className="w-12 h-12 mx-auto text-muted-foreground mb-3" weight="duotone" />
                  <p className="text-muted-foreground text-sm">No orders found</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      onClick={() => onViewOrder(String(order.id))}
                      className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">#{order.visual_id}</span>
                            {order.order_nickname && (
                              <span className="text-muted-foreground text-sm truncate max-w-[150px]">
                                {order.order_nickname}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {order.due_date ? formatDate(order.due_date) : 'No due date'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge
                          variant="secondary"
                          className={`${getAPIStatusColor(order.status)} font-medium text-xs uppercase tracking-wide`}
                        >
                          {getAPIStatusLabel(order.status)}
                        </Badge>
                        <span className="font-medium">
                          {formatCurrency(order.total_amount)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
