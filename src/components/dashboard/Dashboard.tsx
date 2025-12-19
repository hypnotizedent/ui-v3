import { Order, Customer } from '@/lib/types';
import { useProductionStats } from '@/lib/hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Package,
  Users,
  Clock,
  FileText,
  Palette,
  TShirt,
  CheckCircle,
  Briefcase,
  ArrowClockwise,
  Warning
} from '@phosphor-icons/react';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { formatCurrency, formatDate, getOrdersNeedingAttention } from '@/lib/helpers';

interface DashboardProps {
  orders: Order[];
  customers: Customer[];
  onViewOrder: (orderId: string) => void;
}

export function Dashboard({ orders, customers, onViewOrder }: DashboardProps) {
  const { stats: productionStats, loading, error, refetch } = useProductionStats();

  const ordersNeedingAttention = getOrdersNeedingAttention(orders);

  // Calculate in-production total
  const inProduction = productionStats
    ? productionStats.screenprint + productionStats.embroidery + productionStats.dtg
    : 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground text-sm mt-1">Loading production stats...</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 animate-pulse">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="bg-card border-border">
              <CardContent className="p-4">
                <div className="h-4 bg-muted rounded w-16 mb-2" />
                <div className="h-8 bg-muted rounded w-12" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Dashboard</h2>
        </div>
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6 text-center">
            <Warning size={48} className="mx-auto mb-4 text-destructive" />
            <h3 className="text-lg font-semibold mb-2">Failed to Load Stats</h3>
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Production Overview
        </p>
      </div>

      {/* Production Stats Grid - 8 cards */}
      {productionStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {/* Quotes */}
          <Card className="bg-amber-500/10 border-amber-500/20 hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-amber-600 mb-2">
                <FileText size={18} weight="fill" />
                <span className="text-xs font-medium uppercase tracking-wide">Quotes</span>
              </div>
              <p className="text-2xl font-bold">{productionStats.quote.toLocaleString()}</p>
            </CardContent>
          </Card>

          {/* Art */}
          <Card className="bg-purple-500/10 border-purple-500/20 hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-purple-600 mb-2">
                <Palette size={18} weight="fill" />
                <span className="text-xs font-medium uppercase tracking-wide">Art</span>
              </div>
              <p className="text-2xl font-bold">{productionStats.art.toLocaleString()}</p>
            </CardContent>
          </Card>

          {/* Screenprint */}
          <Card className="bg-blue-500/10 border-blue-500/20 hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-blue-600 mb-2">
                <TShirt size={18} weight="fill" />
                <span className="text-xs font-medium uppercase tracking-wide">Screen</span>
              </div>
              <p className="text-2xl font-bold">{productionStats.screenprint.toLocaleString()}</p>
            </CardContent>
          </Card>

          {/* Embroidery */}
          <Card className="bg-pink-500/10 border-pink-500/20 hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-pink-600 mb-2">
                <TShirt size={18} weight="fill" />
                <span className="text-xs font-medium uppercase tracking-wide">Emb</span>
              </div>
              <p className="text-2xl font-bold">{productionStats.embroidery.toLocaleString()}</p>
            </CardContent>
          </Card>

          {/* DTG */}
          <Card className="bg-cyan-500/10 border-cyan-500/20 hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-cyan-600 mb-2">
                <TShirt size={18} weight="fill" />
                <span className="text-xs font-medium uppercase tracking-wide">DTG</span>
              </div>
              <p className="text-2xl font-bold">{productionStats.dtg.toLocaleString()}</p>
            </CardContent>
          </Card>

          {/* Fulfillment */}
          <Card className="bg-orange-500/10 border-orange-500/20 hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-orange-600 mb-2">
                <Package size={18} weight="fill" />
                <span className="text-xs font-medium uppercase tracking-wide">Fulfill</span>
              </div>
              <p className="text-2xl font-bold">{productionStats.fulfillment.toLocaleString()}</p>
            </CardContent>
          </Card>

          {/* Complete */}
          <Card className="bg-green-500/10 border-green-500/20 hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-green-600 mb-2">
                <CheckCircle size={18} weight="fill" />
                <span className="text-xs font-medium uppercase tracking-wide">Done</span>
              </div>
              <p className="text-2xl font-bold">{productionStats.complete.toLocaleString()}</p>
            </CardContent>
          </Card>

          {/* Total */}
          <Card className="bg-primary/10 border-primary/20 hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-primary mb-2">
                <Briefcase size={18} weight="fill" />
                <span className="text-xs font-medium uppercase tracking-wide">Total</span>
              </div>
              <p className="text-2xl font-bold">{productionStats.total.toLocaleString()}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              In Production
            </CardTitle>
            <Briefcase className="w-4 h-4 text-muted-foreground" weight="bold" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{inProduction}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Screen + Embroidery + DTG
            </p>
            {productionStats && (
              <div className="mt-3 flex gap-2 flex-wrap">
                <Badge variant="secondary" className="text-xs">
                  {productionStats.screenprint} screen
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {productionStats.embroidery} emb
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {productionStats.dtg} dtg
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Quotes
            </CardTitle>
            <FileText className="w-4 h-4 text-muted-foreground" weight="bold" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {productionStats?.quote.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Awaiting customer approval
            </p>
            {productionStats && productionStats.art > 0 && (
              <div className="mt-3">
                <Badge variant="outline" className="text-xs">
                  {productionStats.art} in art approval
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ready for Delivery
            </CardTitle>
            <Package className="w-4 h-4 text-muted-foreground" weight="bold" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{productionStats?.fulfillment || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Jobs in fulfillment stage
            </p>
            {productionStats && (
              <div className="mt-3">
                <Badge className="text-xs bg-green-600">
                  {productionStats.complete.toLocaleString()} completed all-time
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders & Needs Attention */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base font-medium">Recent Orders</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {orders.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4 text-center">
                No orders yet
              </p>
            ) : (
              orders.slice(0, 5).map((order) => (
                <div
                  key={order.id}
                  onClick={() => onViewOrder(order.id)}
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
                        {order.customer_name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={order.status} />
                    <span className="text-sm font-medium">
                      {formatCurrency(order.total)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base font-medium">Orders Needing Attention</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {ordersNeedingAttention.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4 text-center">
                All orders are on track
              </p>
            ) : (
              ordersNeedingAttention.slice(0, 5).map((order) => (
                <div
                  key={order.id}
                  onClick={() => onViewOrder(order.id)}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary cursor-pointer transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">#{order.visual_id}</span>
                      <StatusBadge status={order.status} />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Due: {formatDate(order.due_date)}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-destructive border-destructive/50">
                    {new Date(order.due_date) < new Date() ? 'Overdue' : 'Pending'}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
