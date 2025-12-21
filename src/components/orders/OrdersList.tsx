import { useState, useMemo } from 'react';
import { useOrdersList, type OrderListItem } from '@/lib/hooks';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  MagnifyingGlass,
  Package,
  CaretLeft,
  CaretRight,
  ArrowClockwise,
  Warning,
  FileText,
  Palette,
  TShirt,
  CheckCircle
} from '@phosphor-icons/react';
import { formatCurrency, formatDate, getAPIStatusColor, getAPIStatusLabel } from '@/lib/helpers';

interface OrdersListProps {
  onViewOrder: (orderId: string) => void;
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses', icon: Package },
  { value: 'quote', label: 'Quotes', icon: FileText },
  { value: 'art', label: 'Art', icon: Palette },
  { value: 'screenprint', label: 'Screenprint', icon: TShirt },
  { value: 'embroidery', label: 'Embroidery', icon: TShirt },
  { value: 'dtg', label: 'DTG', icon: TShirt },
  { value: 'fulfillment', label: 'Fulfillment', icon: Package },
  { value: 'complete', label: 'Complete', icon: CheckCircle },
];

const PAGE_SIZE = 50;

export function OrdersList({ onViewOrder }: OrdersListProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(0);

  const offset = page * PAGE_SIZE;

  const { orders, total, loading, error, refetch } = useOrdersList({
    limit: PAGE_SIZE,
    offset,
    status: statusFilter,
  });

  // Client-side search filtering
  const filteredOrders = useMemo(() => {
    if (!search) return orders;
    const searchLower = search.toLowerCase();
    return orders.filter(o =>
      o.visual_id.toLowerCase().includes(searchLower) ||
      o.customer_name.toLowerCase().includes(searchLower) ||
      (o.order_nickname && o.order_nickname.toLowerCase().includes(searchLower))
    );
  }, [orders, search]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setPage(0); // Reset to first page when filter changes
  };

  const handlePrevPage = () => {
    setPage(p => Math.max(0, p - 1));
  };

  const handleNextPage = () => {
    setPage(p => Math.min(totalPages - 1, p + 1));
  };

  if (loading && orders.length === 0) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Orders</h2>
          <p className="text-muted-foreground text-xs mt-0.5">Loading orders...</p>
        </div>
        <div className="animate-pulse space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 bg-card rounded-lg border border-border" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Orders</h2>
        </div>
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6 pb-6 text-center">
            <Warning size={40} className="mx-auto mb-3 text-destructive" />
            <h3 className="text-base font-semibold mb-1">Failed to Load Orders</h3>
            <p className="text-xs text-muted-foreground mb-3">{error.message}</p>
            <Button onClick={() => refetch()} variant="outline" size="sm" className="gap-2 h-8">
              <ArrowClockwise size={16} />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Orders</h2>
        <p className="text-muted-foreground text-xs mt-0.5">
          {total.toLocaleString()} total orders
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="order-search"
            placeholder="Search by order #, customer, or nickname..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card border-border h-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-full sm:w-[180px] bg-card border-border h-9">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>
                <span className="flex items-center gap-2">
                  <opt.icon size={14} weight="bold" />
                  {opt.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Orders Table */}
      {filteredOrders.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="py-8 text-center">
            <Package className="w-10 h-10 mx-auto text-muted-foreground mb-3" weight="duotone" />
            <p className="text-sm text-muted-foreground">
              {orders.length === 0 ? 'No orders found' : 'No orders match your search'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-card border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-3 py-2">Order</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-3 py-2">Customer</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-3 py-2">Status</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-3 py-2">Due</th>
                  <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wide px-3 py-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => onViewOrder(order.visual_id)}
                    className="border-b border-border/50 hover:bg-secondary/30 cursor-pointer transition-colors"
                  >
                    <td className="px-3 py-2">
                      <div>
                        <span className="font-medium text-sm">#{order.visual_id}</span>
                        {order.order_nickname && (
                          <span className="text-muted-foreground text-xs ml-2 truncate max-w-[150px] inline-block align-bottom">
                            {order.order_nickname}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-sm">{order.customer_name}</td>
                    <td className="px-3 py-2">
                      <Badge
                        variant="secondary"
                        className={`${getAPIStatusColor(order.printavo_status_name)} font-medium text-xs px-1.5 py-0`}
                      >
                        {order.printavo_status_name}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 text-sm text-muted-foreground">
                      {order.due_date ? formatDate(order.due_date) : '—'}
                    </td>
                    <td className="px-3 py-2 text-right font-medium text-sm">
                      {formatCurrency(order.total_amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Showing {offset + 1}–{Math.min(offset + PAGE_SIZE, total)} of {total.toLocaleString()}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevPage}
              disabled={page === 0 || loading}
              className="gap-1 h-8"
            >
              <CaretLeft size={16} weight="bold" />
              Previous
            </Button>
            <span className="text-xs text-muted-foreground px-2">
              Page {page + 1} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={page >= totalPages - 1 || loading}
              className="gap-1 h-8"
            >
              Next
              <CaretRight size={16} weight="bold" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
