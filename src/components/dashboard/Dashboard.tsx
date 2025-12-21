import { Order, Customer } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Briefcase,
  CalendarBlank
} from '@phosphor-icons/react';
import { formatCurrency } from '@/lib/helpers';

interface DashboardProps {
  orders: Order[];
  customers: Customer[];
  onViewOrder: (orderId: string) => void;
  onNavigateToOrders?: () => void;
}

export function Dashboard({ orders, customers, onViewOrder, onNavigateToOrders }: DashboardProps) {
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card/50 border-border/50 hover:border-border transition-colors">
          <CardContent className="p-2">
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50 hover:border-border transition-colors">
          <CardContent className="p-2">
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50 hover:border-border transition-colors">
          <CardContent className="p-2">
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50 hover:border-border transition-colors">
          <CardContent className="p-2">
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card/50 border-border/50">
        <CardContent className="px-4 pt-2 pb-2">
          <div className="flex items-center justify-between mb-4">
            <button 
              onClick={onNavigateToOrders}
              className="border border-border/60 hover:border-primary/50 hover:bg-primary/5 text-foreground/70 hover:text-foreground text-xs font-medium px-5 py-1.5 rounded-full transition-all hover:scale-[1.02] active:scale-100"
            >
              All Orders
            </button>
          </div>

          {activeJobs.length === 0 ? (
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
                              Due {formatDate(order.due_date)} ({isOverdue ? `${Math.abs(daysUntilDue)}d overdue` : `${daysUntilDue}d`})
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
