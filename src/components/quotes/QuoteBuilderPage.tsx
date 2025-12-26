import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  FloppyDisk,
  Plus,
  User,
  Package,
  FileText,
  CircleNotch,
  CheckCircle
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import { fetchQuote, createQuote, updateQuote, Quote } from '@/lib/quote-api';

interface QuoteBuilderPageProps {
  quoteId: string | null;
  onBack: () => void;
}

export function QuoteBuilderPage({ quoteId, onBack }: QuoteBuilderPageProps) {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [customerSearch, setCustomerSearch] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');

  const isNewQuote = !quoteId;

  // Load existing quote
  useEffect(() => {
    if (quoteId) {
      loadQuote(parseInt(quoteId));
    }
  }, [quoteId]);

  const loadQuote = async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchQuote(id);
      setQuote(data);
      setNotes(data.internal_notes || '');
    } catch (err) {
      setError('Failed to load quote');
      console.error('Error loading quote:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      if (isNewQuote) {
        // Create new quote
        const newQuote = await createQuote({
          internal_notes: notes || undefined,
        });
        setQuote(newQuote);
        toast.success(`Quote ${newQuote.quote_number} created!`);
      } else if (quote) {
        // Update existing quote
        const updated = await updateQuote(quote.id, {
          internal_notes: notes || undefined,
        });
        setQuote(updated);
        toast.success('Quote saved');
      }
    } catch (err) {
      setError('Failed to save quote');
      toast.error('Failed to save quote');
      console.error('Error saving quote:', err);
    } finally {
      setSaving(false);
    }
  };

  // Calculate totals from quote data
  const subtotal = parseFloat(quote?.subtotal || '0');
  const discount = parseFloat(quote?.discount || '0');
  const total = parseFloat(quote?.total || '0');

  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft size={20} />
          </Button>
          <div className="animate-pulse">
            <div className="h-7 w-40 bg-muted rounded mb-2" />
            <div className="h-4 w-60 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft size={20} />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">
                {isNewQuote ? 'New Quote' : quote?.quote_number || `Quote #${quoteId}`}
              </h1>
              <Badge className="bg-muted text-muted-foreground uppercase text-xs">
                {quote?.status || 'Draft'}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {isNewQuote ? 'Create a new quote for a customer' : 'Edit quote details'}
            </p>
            {error && (
              <p className="text-sm text-destructive mt-1">{error}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSave} disabled={saving}>
            {saving ? (
              <CircleNotch size={16} className="mr-2 animate-spin" />
            ) : (
              <FloppyDisk size={16} className="mr-2" />
            )}
            {saving ? 'Saving...' : 'Save Draft'}
          </Button>
          <Button disabled>
            Send Quote
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main Content - 2 columns */}
        <div className="col-span-2 space-y-6">
          {/* Customer Selection */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <User className="w-4 h-4" weight="bold" />
                Customer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {quote?.customer_name ? (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="font-medium">{quote.customer_name}</p>
                    <p className="text-xs text-muted-foreground">Customer ID: {quote.customer_id}</p>
                  </div>
                ) : (
                  <>
                    <div>
                      <Label htmlFor="customer-search" className="text-xs text-muted-foreground">
                        Search or select customer
                      </Label>
                      <Input
                        id="customer-search"
                        placeholder="Type to search customers..."
                        value={customerSearch}
                        onChange={(e) => setCustomerSearch(e.target.value)}
                        className="mt-1.5"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Customer search will be wired to API in next phase
                    </p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <Package className="w-4 h-4" weight="bold" />
                  Line Items
                </CardTitle>
                <Button size="sm" variant="outline" className="gap-1.5 h-8">
                  <Plus size={14} />
                  Add Item
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {quote?.line_items && quote.line_items.length > 0 ? (
                <div className="space-y-2">
                  {quote.line_items.map((item) => (
                    <div key={item.id} className="p-3 bg-muted/30 rounded-lg flex justify-between items-center">
                      <div>
                        <p className="font-medium text-sm">{item.description}</p>
                        {item.style_number && (
                          <p className="text-xs text-muted-foreground">
                            {item.style_number} {item.color && `• ${item.color}`}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          ${parseFloat(item.line_total).toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.quantity} × ${parseFloat(item.unit_price).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border border-dashed border-border rounded-lg p-8 text-center">
                  <Package className="w-10 h-10 mx-auto text-muted-foreground mb-3" weight="duotone" />
                  <p className="text-sm text-muted-foreground mb-3">
                    No line items yet
                  </p>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Plus size={14} />
                    Add First Item
                  </Button>
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-3">
                Line item editor will be added in Phase 2
              </p>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <FileText className="w-4 h-4" weight="bold" />
                Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="notes" className="text-xs text-muted-foreground">
                    Internal Notes
                  </Label>
                  <Textarea
                    id="notes"
                    placeholder="Add notes for your team..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="mt-1.5 resize-none"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - 1 column */}
        <div className="space-y-6">
          {/* Quote Details */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground">
                  Quote Number
                </Label>
                <p className="text-sm font-medium mt-1">
                  {quote?.quote_number || 'Will be assigned on save'}
                </p>
              </div>
              <div>
                <Label htmlFor="due-date" className="text-xs text-muted-foreground">
                  Due Date
                </Label>
                <div className="relative mt-1.5">
                  <CalendarBlank className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="due-date"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing Summary */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">Pricing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Discount</span>
                <span>${discount.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold text-base">
                <span>Total</span>
                <span className="text-primary">${total.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Status Info */}
          <Card className="bg-muted/30 border-border">
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground text-center">
                Quote Builder v2.2.0 - Phase 1B
                <br />
                <span className="text-[10px]">API-connected</span>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
