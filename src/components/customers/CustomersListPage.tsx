import { useState, useMemo } from 'react';
import { useCustomersList, type CustomerListItem } from '@/lib/hooks';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  MagnifyingGlass,
  Users,
  CaretLeft,
  CaretRight,
  ArrowClockwise,
  Warning
} from '@phosphor-icons/react';

interface CustomersListPageProps {
  onViewCustomer: (customerId: string) => void;
}

const PAGE_SIZE = 50;

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

      {/* Search */}
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

      {/* Customers Table */}
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
        <Card className="bg-card border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-3 py-2">Name</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-3 py-2">Company</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-3 py-2">Email</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-3 py-2">Phone</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-3 py-2">Location</th>
                  <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wide px-3 py-2">Orders</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr
                    key={customer.id}
                    onClick={() => onViewCustomer(String(customer.id))}
                    className="border-b border-border/50 hover:bg-secondary/30 cursor-pointer transition-colors"
                  >
                    <td className="px-3 py-2">
                      <span className="font-medium text-sm">{customer.name}</span>
                    </td>
                    <td className="px-3 py-2 text-sm text-muted-foreground">
                      {customer.company || '—'}
                    </td>
                    <td className="px-3 py-2 text-sm">
                      {customer.email ? (
                        <a
                          href={`mailto:${customer.email}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-primary hover:underline"
                        >
                          {customer.email}
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-3 py-2 text-sm text-muted-foreground">
                      {customer.phone || '—'}
                    </td>
                    <td className="px-3 py-2 text-sm text-muted-foreground">
                      {customer.city && customer.state
                        ? `${customer.city}, ${customer.state}`
                        : customer.city || customer.state || '—'}
                    </td>
                    <td className="px-3 py-2 text-right font-medium text-sm">
                      {customer.orders_count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Pagination (only when not searching) */}
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
