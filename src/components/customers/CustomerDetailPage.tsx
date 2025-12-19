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
  ArrowClockwise
} from '@phosphor-icons/react';
import { formatCurrency, formatDate, getAPIStatusColor, getAPIStatusLabel } from '@/lib/helpers';

interface CustomerDetailPageProps {
  customerId: string;
  onViewOrder: (orderId: string) => void;
}

export function CustomerDetailPage({ customerId, onViewOrder }: CustomerDetailPageProps) {
  const { customer, orders, loading, error, refetch } = useCustomerDetail(customerId);

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
          {(customer.city || customer.state) && (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <MapPin className="w-4 h-4" weight="bold" />
                  Location
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <p>
                  {customer.city && customer.state
                    ? `${customer.city}, ${customer.state}`
                    : customer.city || customer.state}
                </p>
              </CardContent>
            </Card>
          )}

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
                      onClick={() => onViewOrder(order.visual_id)}
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
