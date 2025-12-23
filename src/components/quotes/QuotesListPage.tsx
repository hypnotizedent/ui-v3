import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  MagnifyingGlass,
  Plus,
  FileText,
  Warning,
  ArrowClockwise,
  CaretLeft,
  CaretRight
} from '@phosphor-icons/react';
import { useQuotesList, type OrderListItem } from '@/lib/hooks';
import { formatCurrency, formatDate } from '@/lib/helpers';

interface QuotesListPageProps {
  onViewQuote: (quoteId: string) => void;
  onNewQuote: () => void;
}

const getStatusColor = (status: string) => {
  const statusLower = status?.toLowerCase() || '';
  if (statusLower.includes('quote out') || statusLower === 'sent') {
    return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
  }
  if (statusLower === 'quote' || statusLower === 'draft') {
    return 'bg-muted text-muted-foreground';
  }
  if (statusLower.includes('approved')) {
    return 'bg-green-500/20 text-green-400 border-green-500/30';
  }
  if (statusLower.includes('rejected') || statusLower.includes('cancelled')) {
    return 'bg-red-500/20 text-red-400 border-red-500/30';
  }
  return 'bg-muted text-muted-foreground';
};

const PAGE_SIZE = 100;

export function QuotesListPage({ onViewQuote, onNewQuote }: QuotesListPageProps) {
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);

  const { quotes, total, loading, error, refetch } = useQuotesList({
    limit: PAGE_SIZE,
    page,
    search: searchInput || undefined,
  });

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Quotes</h2>
            <p className="text-muted-foreground text-xs mt-0.5">Loading quotes...</p>
          </div>
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
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Quotes</h2>
          </div>
        </div>
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-5 pb-5 text-center">
            <Warning size={40} className="mx-auto mb-3 text-destructive" />
            <h3 className="text-base font-semibold mb-1">Failed to Load Quotes</h3>
            <p className="text-xs text-muted-foreground mb-3">{error.message}</p>
            <Button variant="outline" size="sm" className="gap-2 h-8" onClick={() => refetch()}>
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Quotes</h2>
          <p className="text-muted-foreground text-xs mt-0.5">
            {total.toLocaleString()} total quotes
          </p>
        </div>
        {/* New Quote button is in the global header - no duplicate needed here */}
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by quote number, customer..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9 bg-card border-border h-9"
          />
        </div>
      </div>

      {quotes.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" weight="duotone" />
            <h3 className="text-lg font-semibold mb-2">
              {total === 0 ? 'No Quotes Found' : 'No Matching Quotes'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {total === 0
                ? 'Orders with quote status will appear here'
                : 'Try a different search term'}
            </p>
            {total === 0 && (
              <Button onClick={onNewQuote} className="gap-2">
                <Plus size={16} weight="bold" />
                Create Quote
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-card border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-3 py-2">Quote</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-3 py-2">Customer</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-3 py-2">Status</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-3 py-2">Due</th>
                  <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wide px-3 py-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {quotes.map((quote) => (
                  <tr
                    key={quote.id}
                    onClick={() => onViewQuote(quote.visual_id)}
                    className="border-b border-border/50 hover:bg-secondary/30 cursor-pointer transition-colors"
                  >
                    <td className="px-3 py-2">
                      <div>
                        <span className="font-medium text-sm">#{quote.visual_id}</span>
                        {quote.order_nickname && (
                          <span className="text-muted-foreground text-xs ml-2 truncate max-w-[150px] inline-block align-bottom">
                            {quote.order_nickname}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-sm">{quote.customer_name}</td>
                    <td className="px-3 py-2">
                      <Badge
                        variant="secondary"
                        className={`${getStatusColor(quote.printavo_status_name)} font-medium text-xs px-1.5 py-0`}
                      >
                        {quote.printavo_status_name}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 text-sm text-muted-foreground">
                      {quote.due_date ? formatDate(quote.due_date) : '—'}
                    </td>
                    <td className="px-3 py-2 text-right font-medium text-sm">
                      {formatCurrency(quote.total_amount)}
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
            Showing {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, total)} of {total.toLocaleString()}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={!hasPrevPage || loading}
              className="gap-1 h-8"
            >
              <CaretLeft size={16} weight="bold" />
              Previous
            </Button>
            <span className="text-xs text-muted-foreground px-2">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => p + 1)}
              disabled={!hasNextPage || loading}
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
