import { Order, Customer } from '@/lib/types';
import { useProductionStats } from '@/lib/hooks';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Briefcase,
  FileText,
  Users as UsersIcon,
  Printer,
  CalendarBlank,
  ArrowRight
} from '@phosphor-icons/react';
import { formatCurrency } from '@/lib/helpers';

interface DashboardProps {
  orders: Order[];
  customers: Customer[];
  onViewOrder: (orderId: string) => void;
}

export function Dashboard({ orders, customers, onViewOrder }: DashboardProps) {
  const { stats: productionStats, loading } = useProductionStats();

  const activeJobs = orders.filter(o => 
    o.status !== 'COMPLETE' && o.status !== 'QUOTE'
  );

  const followUpNeeded = orders.filter(o => o.status === 'QUOTE');

  const productionOrders = orders.filter(o => 
    o.status === 'IN PRODUCTION'
  );

  const totalInProduction = productionOrders.reduce((sum, o) => sum + o.total, 0);

  const now = new Date();
  const dateOptions: Intl.DateTimeFormatOptions = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  const formattedDate = now.toLocaleDateString('en-US', dateOptions);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{formattedDate}</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Card className="bg-card/50 border-border/50 hover:border-border transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Active Jobs</h3>
              <Briefcase className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="space-y-0.5">
              <p className="text-3xl font-bold leading-none">{activeJobs.length}</p>
              <p className="text-xs text-muted-foreground">Not marked as complete</p>
              <p className="text-sm font-medium text-primary">
                {formatCurrency(totalInProduction)} in production
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50 hover:border-border transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Follow-Up Needed</h3>
              <FileText className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="space-y-0.5">
              <p className="text-3xl font-bold leading-none">{followUpNeeded.length}</p>
              <p className="text-xs text-muted-foreground">Created this month · Not approved</p>
              <p className="text-sm font-medium text-primary">
                {formatCurrency(followUpNeeded.reduce((sum, o) => sum + o.total, 0))} potential value
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50 hover:border-border transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Production Status</h3>
              <Printer className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="space-y-0.5">
              <p className="text-3xl font-bold leading-none">{productionOrders.length}</p>
              <p className="text-xs text-muted-foreground">
                {productionStats?.art || 0} pending approval
              </p>
              <p className="text-sm font-medium text-primary">
                {productionStats?.fulfillment || 0} ready for pickup
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50 hover:border-border transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Customers</h3>
              <UsersIcon className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="space-y-0.5">
              <p className="text-3xl font-bold leading-none">{customers.length}</p>
              <p className="text-xs text-muted-foreground">0 jobs completed</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold">All Active Jobs</h2>
              <p className="text-xs text-muted-foreground">
                Jobs not marked as delivered, sorted by due date
              </p>
            </div>
            <Button variant="ghost" size="sm" className="gap-2 text-sm h-8">
              View Jobs Board
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-card/80 rounded-lg p-3 border border-border/50 animate-pulse">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-muted rounded w-32" />
                      <div className="h-3 bg-muted rounded w-48" />
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="h-6 bg-muted rounded w-20" />
                      <div className="h-4 bg-muted rounded w-16" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : activeJobs.length === 0 ? (
            <div className="text-center py-8">
              <Briefcase className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No active jobs</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {activeJobs.slice(0, 10).map((order) => {
                const dueDate = new Date(order.due_date);
                const isOverdue = dueDate < now;
                const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                
                return (
                  <div
                    key={order.id}
                    onClick={() => onViewOrder(order.visual_id)}
                    className="bg-card/80 rounded-lg p-3 border border-border/50 hover:border-border hover:bg-card transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3 className="font-semibold text-sm">J-{order.visual_id}</h3>
                          <Badge 
                            variant="secondary" 
                            className="text-xs font-medium px-1.5 py-0"
                          >
                            {order.status.toLowerCase()}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{order.customer_name}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <CalendarBlank className="w-3 h-3" />
                            <span>
                              {isOverdue ? 'Overdue' : `Overdue`} {formatDate(order.due_date)} (
                              {isOverdue ? `${Math.abs(daysUntilDue)}d` : `${daysUntilDue}d`})
                            </span>
                          </div>
                          <span>$ {formatCurrency(order.total)}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-medium text-muted-foreground">
                          {order.line_items.reduce((sum, li) => sum + li.quantity, 0)} items
                        </p>
                      </div>
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
