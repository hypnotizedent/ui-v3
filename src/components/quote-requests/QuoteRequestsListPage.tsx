import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Warning,
  ArrowClockwise,
  Envelope,
  TShirt,
  CalendarBlank,
  CurrencyDollar,
  Check,
  X,
  Lightning,
  PaperPlaneTilt,
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import { useQuoteRequestsList, type QuoteRequest } from '@/lib/hooks';
import { formatDate } from '@/lib/helpers';

interface QuoteRequestsListPageProps {
  onViewRequest: (requestId: number) => void;
  onGenerateQuote: (requestId: number) => void;
}

const API_BASE = import.meta.env.VITE_DASHBOARD_API_URL || 'https://mintprints-api.ronny.works';

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    case 'reviewed':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'quoted':
      return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'sent':
      return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
    case 'approved':
      return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    case 'declined':
    case 'rejected':
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    case 'converted':
      return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

const getDecorationLabel = (method: string | null) => {
  if (!method) return 'Not specified';
  const labels: Record<string, string> = {
    'screen-print': 'Screen Print',
    'dtg': 'DTG',
    'embroidery': 'Embroidery',
    'dtf': 'DTF',
    'vinyl': 'Heat Transfer',
    'unsure': 'Not Sure',
  };
  return labels[method] || method;
};

const getProductLabel = (type: string | null) => {
  if (!type) return 'Not specified';
  const labels: Record<string, string> = {
    't-shirts': 'T-Shirts',
    'hoodies': 'Hoodies & Sweatshirts',
    'hats': 'Hats & Caps',
    'bags': 'Bags & Totes',
    'other': 'Other',
  };
  return labels[type] || type;
};

export function QuoteRequestsListPage({ onViewRequest, onGenerateQuote }: QuoteRequestsListPageProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sendingQuoteId, setSendingQuoteId] = useState<number | null>(null);

  const { requests, total, loading, error, refetch } = useQuoteRequestsList({
    status: statusFilter === 'all' ? undefined : statusFilter,
  });

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  const handleSendQuote = async (request: QuoteRequest) => {
    if (!request.quote_id) {
      toast.error('No quote found for this request');
      return;
    }

    setSendingQuoteId(request.id);

    try {
      const response = await fetch(`${API_BASE}/api/v2/quotes/${request.quote_id}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send quote');
      }

      if (data.email_sent) {
        toast.success(`Quote ${request.quote_number} sent to ${request.customer_email}`);
      } else {
        toast.warning('Quote status updated but email could not be sent');
      }

      refetch();
    } catch (error) {
      console.error('Send quote error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send quote');
    } finally {
      setSendingQuoteId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Quote Requests</h2>
            <p className="text-muted-foreground text-xs mt-0.5">Loading requests...</p>
          </div>
        </div>
        <div className="animate-pulse space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-card rounded-lg border border-border" />
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
            <h2 className="text-xl font-semibold tracking-tight">Quote Requests</h2>
          </div>
        </div>
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-5 pb-5 text-center">
            <Warning size={40} className="mx-auto mb-3 text-destructive" />
            <h3 className="text-base font-semibold mb-1">Failed to Load Requests</h3>
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
          <h2 className="text-xl font-semibold tracking-tight">Quote Requests</h2>
          <p className="text-muted-foreground text-xs mt-0.5">
            {pendingCount > 0 && (
              <span className="text-yellow-400 font-medium">{pendingCount} pending</span>
            )}
            {pendingCount > 0 && ' · '}
            {total} total requests
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="reviewed">Reviewed</SelectItem>
              <SelectItem value="quoted">Quoted</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="declined">Declined</SelectItem>
              <SelectItem value="converted">Converted</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="h-8" onClick={() => refetch()}>
            <ArrowClockwise size={16} />
          </Button>
        </div>
      </div>

      {requests.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="py-12 text-center">
            <Envelope className="w-12 h-12 mx-auto text-muted-foreground mb-4" weight="duotone" />
            <h3 className="text-lg font-semibold mb-2">No Quote Requests</h3>
            <p className="text-sm text-muted-foreground">
              {statusFilter === 'all'
                ? 'Customer quote requests will appear here'
                : `No ${statusFilter} requests found`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {requests.map((request) => (
            <Card
              key={request.id}
              className="bg-card border-border hover:border-primary/30 transition-colors cursor-pointer"
              onClick={() => onViewRequest(request.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-sm">{request.quote_number}</span>
                      <Badge
                        variant="secondary"
                        className={`${getStatusColor(request.status)} font-medium text-xs px-1.5 py-0`}
                      >
                        {request.status}
                      </Badge>
                      {request.artwork_ready && (
                        <Badge variant="outline" className="text-xs px-1.5 py-0">
                          <Check size={12} className="mr-1" />
                          Art Ready
                        </Badge>
                      )}
                    </div>

                    {/* Customer Info */}
                    <div className="text-sm mb-2">
                      <span className="font-medium">{request.customer_name || request.contact_name}</span>
                      {request.customer_email && (
                        <span className="text-muted-foreground ml-2">{request.customer_email}</span>
                      )}
                    </div>

                    {/* Details Grid */}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <TShirt size={14} />
                        <span>{getProductLabel(request.product_type)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>{getDecorationLabel(request.decoration_method)}</span>
                      </div>
                      {request.quantity && (
                        <div>
                          <span className="font-medium text-foreground">{request.quantity}</span> units
                        </div>
                      )}
                      {request.placements.length > 0 && (
                        <div>
                          {request.placements.join(', ')}
                        </div>
                      )}
                      {request.colors && (
                        <div>
                          <span className="font-medium text-foreground">{request.colors}</span> colors
                        </div>
                      )}
                      {request.due_date && (
                        <div className="flex items-center gap-1">
                          <CalendarBlank size={14} />
                          <span>Due {formatDate(request.due_date)}</span>
                        </div>
                      )}
                      {(request.budget_min || request.budget_max) && (
                        <div className="flex items-center gap-1">
                          <CurrencyDollar size={14} />
                          <span>
                            ${request.budget_min || 0} - ${request.budget_max || 'Open'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Notes Preview */}
                    {request.notes && (
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-1">
                        {request.notes}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    {request.status === 'pending' && (
                      <Button
                        size="sm"
                        className="gap-1.5 h-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          onGenerateQuote(request.id);
                        }}
                      >
                        <Lightning size={14} weight="fill" />
                        Generate Quote
                      </Button>
                    )}
                    {request.status === 'quoted' && (
                      <>
                        {request.estimated_price && (
                          <div className="text-right">
                            <div className="text-xs text-muted-foreground">Estimated</div>
                            <div className="font-semibold text-green-400">
                              ${request.estimated_price.toFixed(2)}
                            </div>
                          </div>
                        )}
                        <Button
                          size="sm"
                          variant="default"
                          className="gap-1.5 h-8 bg-blue-600 hover:bg-blue-700"
                          disabled={sendingQuoteId === request.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSendQuote(request);
                          }}
                        >
                          <PaperPlaneTilt size={14} weight="fill" />
                          {sendingQuoteId === request.id ? 'Sending...' : 'Send Quote'}
                        </Button>
                      </>
                    )}
                    {request.status === 'sent' && (
                      <Badge variant="outline" className="text-xs text-blue-400 border-blue-500/30">
                        <Envelope size={12} className="mr-1" />
                        Sent
                      </Badge>
                    )}
                    <div className="text-xs text-muted-foreground text-right">
                      {formatDate(request.created_at)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
