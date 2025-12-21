import { useState, useMemo } from 'react';
import { useCustomersList, type CustomerListItem } from '@/lib/hooks';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  MagnifyingGlass,
  Users,
  CaretLeft,
  CaretRight,
  ArrowClockwise,
  Warning,
  Buildings,
  Envelope,
  Phone,
  MapPin,
  CurrencyDollar,
  Clock
} from '@phosphor-icons/react';
import { formatDistanceToNow } from 'date-fns';

interface CustomersListPageProps {
  onViewCustomer: (customerId: string) => void;
}

const PAGE_SIZE = 50;

const getTierColor = (tier?: string) => {
  switch (tier?.toLowerCase()) {
    case 'platinum':
      return 'bg-slate-100 text-slate-900 border-slate-300';
    case 'gold':
      return 'bg-amber-500 text-slate-900 border-amber-600';
    case 'silver':
      return 'bg-slate-300 text-slate-900 border-slate-400';
    case 'bronze':
      return 'bg-amber-700 text-amber-100 border-amber-800';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
};

export function CustomersListPage({ onViewCustomer }: CustomersListPageProps) {
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);

  const offset = page * PAGE_SIZE;

  const { customers, total, loading, error, refetch } = useCustomersList({
    limit: PAGE_SIZE,
    offset: searchQuery ? undefined : offset,
    search: searchQuery || undefined,
  });

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const handleSearch = () => {
    setSearchQuery(searchInput);
    setPage(0);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
    setPage(0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handlePrevPage = () => {
    setPage(p => Math.max(0, p - 1));
  };

  const handleNextPage = () => {
    setPage(p => Math.min(totalPages - 1, p + 1));
  };

  if (loading && customers.length === 0) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Customers</h2>
          <p className="text-muted-foreground text-xs mt-0.5">Loading customers...</p>
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
          <h2 className="text-xl font-semibold tracking-tight">Customers</h2>
        </div>
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-5 pb-5 text-center">
            <Warning size={40} className="mx-auto mb-3 text-destructive" />
            <h3 className="text-base font-semibold mb-1">Failed to Load Customers</h3>
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
        <h2 className="text-xl font-semibold tracking-tight">Customers</h2>
        <p className="text-muted-foreground text-xs mt-0.5">
          {total.toLocaleString()} total customers
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="customer-search"
            placeholder="Search by name, company, or email..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-9 bg-card border-border h-9"
          />
        </div>
        <Button onClick={handleSearch} variant="secondary" size="sm" className="h-9">
          Search
        </Button>
        {searchQuery && (
          <Button onClick={handleClearSearch} variant="ghost" size="sm" className="h-9">
            Clear
          </Button>
        )}
      </div>

      {customers.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="py-8 text-center">
            <Users className="w-10 h-10 mx-auto text-muted-foreground mb-3" weight="duotone" />
            <p className="text-sm text-muted-foreground">
              {searchQuery ? 'No customers match your search' : 'No customers found'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {customers.map((customer) => {
            const lastOrderDate = customer.last_order_date 
              ? formatDistanceToNow(new Date(customer.last_order_date), { addSuffix: true })
              : 'Never';

            return (
              <Card 
                key={customer.id}
                onClick={() => onViewCustomer(String(customer.id))}
                className="bg-card/80 hover:bg-card border-border cursor-pointer transition-all hover:border-primary/50 overflow-hidden group"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-semibold text-foreground">
                          {customer.name}
                        </h3>
                        <Badge className={`${getTierColor(customer.tier)} uppercase text-xs font-bold px-2 py-0.5`}>
                          {customer.tier}
                        </Badge>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
                        {customer.company && (
                          <div className="flex items-center gap-1.5">
                            <Buildings className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">{customer.company}</span>
                          </div>
                        )}
                        {customer.email && (
                          <div className="flex items-center gap-1.5">
                            <Envelope className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">{customer.email}</span>
                          </div>
                        )}
                        {customer.phone && (
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-4 h-4 flex-shrink-0" />
                            <span>{customer.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-6 text-right">
                      <div>
                        <div className="flex items-center justify-end gap-1.5 text-xs text-muted-foreground mb-0.5">
                          <CurrencyDollar className="w-3.5 h-3.5" />
                          <span>Total Revenue</span>
                        </div>
                        <p className="text-lg font-semibold text-primary">
                          ${customer.total_revenue.toFixed(2)}
                        </p>
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-end gap-1.5 text-xs text-muted-foreground mb-0.5">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Last Order</span>
                        </div>
                        <p className="text-sm font-medium text-foreground">
                          {lastOrderDate}
                        </p>
                      </div>
                      
                      <div>
                        <div className="text-xs text-muted-foreground mb-0.5">
                          Orders
                        </div>
                        <p className="text-2xl font-bold text-foreground">
                          {customer.orders_count}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {!searchQuery && totalPages > 1 && (
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
