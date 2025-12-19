import { Customer, Order } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  User, Envelope, Phone, Buildings, MapPin 
} from '@phosphor-icons/react';
import { TierBadge } from '@/components/shared/TierBadge';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { formatCurrency, formatDate } from '@/lib/helpers';

interface CustomerDetailProps {
  customer: Customer;
  orders: Order[];
  onViewOrder: (orderId: string) => void;
}

export function CustomerDetail({ customer, orders, onViewOrder }: CustomerDetailProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-semibold tracking-tight">
              {customer.name}
            </h2>
            <TierBadge tier={customer.tier} />
          </div>
          <p className="text-muted-foreground mt-1">{customer.company}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-semibold">{formatCurrency(customer.total_revenue)}</div>
          <p className="text-sm text-muted-foreground">
            Lifetime value • {customer.orders_count} orders
          </p>
        </div>
      </div>
      
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <User className="w-4 h-4" weight="bold" />
                Contact Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-center gap-3">
                <Envelope className="w-4 h-4 text-muted-foreground" weight="bold" />
                <a href={`mailto:${customer.email}`} className="text-primary hover:underline">
                  {customer.email}
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-muted-foreground" weight="bold" />
                <a href={`tel:${customer.phone}`} className="hover:text-primary">
                  {customer.phone}
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Buildings className="w-4 h-4 text-muted-foreground" weight="bold" />
                <span>{customer.company}</span>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <MapPin className="w-4 h-4" weight="bold" />
                Address
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <p>{customer.address.street}</p>
              <p>
                {customer.address.city}, {customer.address.state} {customer.address.zip}
              </p>
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:col-span-2">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-base font-medium">Order History</CardTitle>
            </CardHeader>
            <CardContent>
              {orders.length === 0 ? (
                <p className="text-muted-foreground text-sm py-4 text-center">
                  No orders yet
                </p>
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
                            {order.nickname && (
                              <span className="text-muted-foreground text-sm">
                                {order.nickname}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(order.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <StatusBadge status={order.status} />
                        <span className="font-medium">
                          {formatCurrency(order.total)}
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
