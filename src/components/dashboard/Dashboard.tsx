import { Order, Customer } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Briefcase, Package, Users, ClockCounterClockwise, CheckCircle } from '@phosphor-icons/react';
import { formatCurrency } from '@/lib/helpers';
import { useProductionStats } from '@/lib/hooks';

interface DashboardProps {
  orders: Order[];
  customers: Customer[];
  onViewOrder: (orderId: string) => void;
  onNavigateToOrders?: () => void;
}

export function Dashboard({ orders, customers, onViewOrder, onNavigateToOrders }: DashboardProps) {
  const { stats, loading: statsLoading } = useProductionStats();

  const activeJobs = orders.filter(o =>
    o.status !== 'COMPLETE' && o.status !== 'QUOTE'
  );

  // Calculate active production count from stats
  const activeProduction = stats
    ? stats.screenprint + stats.embroidery + stats.dtg + stats.fulfillment + stats.art
    : 0;

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{formattedDate}</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card/50 border-border/50 hover:border-border transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Orders</p>
                <p className="text-2xl font-bold">
                  {statsLoading ? '...' : (stats?.total || 0).toLocaleString()}
                </p>
              </div>
              <Package weight="duotone" className="w-8 h-8 text-primary/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50 hover:border-border transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">In Production</p>
                <p className="text-2xl font-bold">
                  {statsLoading ? '...' : activeProduction.toLocaleString()}
                </p>
              </div>
              <ClockCounterClockwise weight="duotone" className="w-8 h-8 text-amber-500/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50 hover:border-border transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Completed</p>
                <p className="text-2xl font-bold">
                  {statsLoading ? '...' : (stats?.complete || 0).toLocaleString()}
                </p>
              </div>
              <CheckCircle weight="duotone" className="w-8 h-8 text-emerald-500/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50 hover:border-border transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Customers</p>
                <p className="text-2xl font-bold">
                  {customers.length > 0 ? customers.length.toLocaleString() : '...'}
                </p>
              </div>
              <Users weight="duotone" className="w-8 h-8 text-blue-500/60" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card/50 border-border/50">
        <CardContent className="px-4 py-2">
          <div className="flex items-center justify-between mb-2">
            <Badge
              variant="secondary"
              onClick={onNavigateToOrders}
              className="text-xs font-medium px-2 py-0.5 cursor-pointer hover:bg-[#10B981] hover:text-white transition-colors border border-[#10B981]"
            >
              All Orders
            </Badge>
          </div>

          {activeJobs.length === 0 ? (
            <div className="text-center py-8">
              <Briefcase className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No active jobs</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {activeJobs.slice(0, 10).map((order) => {
                // Calculate total pieces from line items
                const totalPieces = order.line_items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;

                // Safe date handling with fallback chain
                const displayDate = order.due_date || order.customer_due_date || order.created_at;
                const hasValidDate = displayDate && displayDate !== '' && !isNaN(new Date(displayDate).getTime());

                return (
                  <div
                    key={order.id}
                    onClick={() => onViewOrder(order.visual_id)}
                    className="bg-card/80 rounded-lg p-3 border border-border/50 hover:border-border hover:bg-card transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3 className="text-sm">
                            <span className="font-bold">#{order.visual_id}</span>
                            {order.nickname && <span className="font-bold"> · {order.nickname}</span>}
                          </h3>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {order.customer_name}
                          {order.customer_company && order.customer_company !== order.customer_name && (
                            <span className="text-muted-foreground/60"> ({order.customer_company})</span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground/70 mt-0.5">
                          {totalPieces} pcs{hasValidDate && ` · Due ${formatDate(displayDate)}`}
                        </p>
                      </div>
                      <span className="text-sm font-medium">
                        {formatCurrency(order.total)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
