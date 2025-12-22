import { useState } from 'react';
import { useCustomersList, type CustomerListItem } from '@/lib/hooks';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  MagnifyingGlass,
  Users,
  CaretLeft,
  CaretRight,
  ArrowClockwise,
  Warning,
  FunnelSimple
} from '@phosphor-icons/react';
import { formatDistanceToNow } from 'date-fns';

interface CustomersListPageProps {
  onViewCustomer: (customerId: string) => void;
}

const PAGE_SIZE = 50;

type SortOption = 'recent' | 'name' | 'revenue' | 'orders';
type TierOption = 'all' | 'platinum' | 'gold' | 'silver' | 'bronze';

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
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [tierFilter, setTierFilter] = useState<TierOption>('all');

  const offset = page * PAGE_SIZE;

  const { customers, total, loading, error, refetch } = useCustomersList({
    limit: PAGE_SIZE,
    offset: searchQuery ? undefined : offset,
    search: searchQuery || undefined,
    sort: searchQuery ? undefined : sortBy,
    tier: searchQuery ? undefined : tierFilter,
  });

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const hasActiveFilters = sortBy !== 'recent' || tierFilter !== 'all';

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

  const handleSortChange = (value: SortOption) => {
    setSortBy(value);
    setPage(0);
  };

  const handleTierChange = (value: TierOption) => {
    setTierFilter(value);
    setPage(0);
  };

  const clearFilters = () => {
    setSortBy('recent');
    setTierFilter('all');
    setPage(0);
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
            <div key={i} className="h-16 bg-card rounded-lg border border-border" />
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

        {/* Filter Popover */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={hasActiveFilters ? "default" : "outline"}
              size="sm"
              className="h-9 gap-1.5"
            >
              <FunnelSimple size={16} />
              Filter
              {hasActiveFilters && <span className="text-xs">({tierFilter !== 'all' ? 1 : 0 + (sortBy !== 'recent' ? 1 : 0)})</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64" align="end">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm">Filters</h4>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="h-7 text-xs px-2"
                  >
                    Clear all
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Sort By</label>
                <Select value={sortBy} onValueChange={(v) => handleSortChange(v as SortOption)}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Recent Activity</SelectItem>
                    <SelectItem value="name">Name (A-Z)</SelectItem>
                    <SelectItem value="revenue">Revenue (High to Low)</SelectItem>
                    <SelectItem value="orders">Orders (High to Low)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Filter by Tier</label>
                <Select value={tierFilter} onValueChange={(v) => handleTierChange(v as TierOption)}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tiers</SelectItem>
                    <SelectItem value="platinum">Platinum</SelectItem>
                    <SelectItem value="gold">Gold</SelectItem>
                    <SelectItem value="silver">Silver</SelectItem>
                    <SelectItem value="bronze">Bronze</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </PopoverContent>
        </Popover>
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
        <div className="space-y-2">
          {customers.map((customer) => {
            const lastOrderDate = customer.last_order_date
              ? formatDistanceToNow(new Date(customer.last_order_date), { addSuffix: true })
              : 'Never';

            return (
              <Card
                key={customer.id}
                onClick={() => onViewCustomer(String(customer.id))}
                className="bg-card/50 hover:bg-accent/50 border-border/50 cursor-pointer transition-colors hover:border-border"
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold text-foreground truncate">
                          {customer.name}
                        </h3>
                        <Badge className={`${getTierColor(customer.tier)} uppercase text-[10px] font-semibold px-1.5 py-0 h-4`}>
                          {customer.tier}
                        </Badge>
                      </div>
                      {customer.company && (
                        <p className="text-sm text-muted-foreground truncate mt-0.5">
                          {customer.company}
                        </p>
                      )}
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className="text-base font-semibold text-foreground">
                        ${customer.total_revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {customer.orders_count} order{customer.orders_count !== 1 ? 's' : ''} · {lastOrderDate}
                      </p>
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
