import { useState, useMemo, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  MagnifyingGlass,
  Package,
  User,
  FileText,
  CaretRight
} from '@phosphor-icons/react';

// Types for search results
interface OrderResult {
  id: number;
  visual_id: string;
  order_nickname: string | null;
  customer_name: string;
  status: string;
  total_amount: number;
}

interface CustomerResult {
  id: number;
  name: string;
  company: string | null;
  email: string | null;
}

interface QuoteResult {
  id: number;
  quote_number: string;
  customer_name: string;
  status: string;
  total: string;
}

type SearchResult =
  | { type: 'order'; data: OrderResult }
  | { type: 'customer'; data: CustomerResult }
  | { type: 'quote'; data: QuoteResult };

interface GlobalSearchProps {
  orders: OrderResult[];
  customers: CustomerResult[];
  quotes?: QuoteResult[];
  onSelectOrder: (orderId: string) => void;
  onSelectCustomer: (customerId: string) => void;
  onSelectQuote?: (quoteId: string) => void;
  placeholder?: string;
  className?: string;
}

export function GlobalSearch({
  orders,
  customers,
  quotes = [],
  onSelectOrder,
  onSelectCustomer,
  onSelectQuote,
  placeholder = "Search orders, customers...",
  className = "",
}: GlobalSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Filter results based on search term
  const results = useMemo(() => {
    if (!searchTerm.trim()) return [];

    const term = searchTerm.toLowerCase();
    const searchResults: SearchResult[] = [];

    // Search orders
    orders.forEach(order => {
      if (
        order.visual_id?.toLowerCase().includes(term) ||
        order.order_nickname?.toLowerCase().includes(term) ||
        order.customer_name?.toLowerCase().includes(term)
      ) {
        searchResults.push({ type: 'order', data: order });
      }
    });

    // Search customers
    customers.forEach(customer => {
      if (
        customer.name?.toLowerCase().includes(term) ||
        customer.company?.toLowerCase().includes(term) ||
        customer.email?.toLowerCase().includes(term)
      ) {
        searchResults.push({ type: 'customer', data: customer });
      }
    });

    // Search quotes
    quotes.forEach(quote => {
      if (
        quote.quote_number?.toLowerCase().includes(term) ||
        quote.customer_name?.toLowerCase().includes(term)
      ) {
        searchResults.push({ type: 'quote', data: quote });
      }
    });

    // Limit results - 5 per category max
    const orderResults = searchResults.filter(r => r.type === 'order').slice(0, 5);
    const customerResults = searchResults.filter(r => r.type === 'customer').slice(0, 5);
    const quoteResults = searchResults.filter(r => r.type === 'quote').slice(0, 5);

    return [...orderResults, ...customerResults, ...quoteResults];
  }, [searchTerm, orders, customers, quotes]);

  // Group results by type for display
  const groupedResults = useMemo(() => {
    const groups: { orders: SearchResult[]; customers: SearchResult[]; quotes: SearchResult[] } = {
      orders: [],
      customers: [],
      quotes: [],
    };

    results.forEach(result => {
      if (result.type === 'order') groups.orders.push(result);
      else if (result.type === 'customer') groups.customers.push(result);
      else if (result.type === 'quote') groups.quotes.push(result);
    });

    return groups;
  }, [results]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isFocused || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % results.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
        break;
      case 'Enter':
        e.preventDefault();
        if (results[selectedIndex]) {
          handleSelect(results[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsFocused(false);
        inputRef.current?.blur();
        break;
    }
  };

  // Handle selection
  const handleSelect = (result: SearchResult) => {
    if (result.type === 'order') {
      onSelectOrder(result.data.visual_id);
    } else if (result.type === 'customer') {
      onSelectCustomer(String(result.data.id));
    } else if (result.type === 'quote' && onSelectQuote) {
      onSelectQuote(String(result.data.id));
    }
    setSearchTerm('');
    setIsFocused(false);
    setSelectedIndex(0);
  };

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  // Scroll selected item into view
  useEffect(() => {
    if (resultsRef.current && results.length > 0) {
      const selectedEl = resultsRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      selectedEl?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex, results.length]);

  // Global keyboard shortcut: Cmd+K (Mac) or Ctrl+K (Windows)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsFocused(true);
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Calculate flat index for keyboard navigation
  const getFlatIndex = (type: string, indexInGroup: number): number => {
    let offset = 0;
    if (type === 'customer') offset = groupedResults.orders.length;
    if (type === 'quote') offset = groupedResults.orders.length + groupedResults.customers.length;
    return offset + indexInGroup;
  };

  const hasResults = results.length > 0;
  const showDropdown = isFocused && searchTerm.trim().length > 0;

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <MagnifyingGlass
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
        />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          onKeyDown={handleKeyDown}
          className="pl-9 pr-12 h-9 bg-card border-border"
        />
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:inline-flex h-5 items-center gap-0.5 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          <span className="text-xs">⌘</span>K
        </kbd>
      </div>

      {showDropdown && (
        <Card className="absolute top-full mt-1 w-full max-h-[400px] overflow-auto z-50 shadow-lg border-border">
          <div ref={resultsRef} className="py-1">
            {hasResults ? (
              <>
                {/* Orders Section */}
                {groupedResults.orders.length > 0 && (
                  <div>
                    <div className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                      <Package size={12} />
                      Orders
                    </div>
                    {groupedResults.orders.map((result, idx) => {
                      if (result.type !== 'order') return null;
                      const flatIdx = getFlatIndex('order', idx);
                      const isSelected = flatIdx === selectedIndex;
                      return (
                        <button
                          key={`order-${result.data.id}`}
                          data-index={flatIdx}
                          onClick={() => handleSelect(result)}
                          className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
                            isSelected ? 'bg-primary/20 text-primary' : 'hover:bg-muted'
                          }`}
                        >
                          <Package size={16} className="text-primary flex-shrink-0" weight="duotone" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">#{result.data.visual_id}</span>
                              {result.data.order_nickname && (
                                <span className="text-sm font-medium truncate">{result.data.order_nickname}</span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                              {result.data.customer_name}
                            </p>
                          </div>
                          <CaretRight size={14} className="text-muted-foreground flex-shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Customers Section */}
                {groupedResults.customers.length > 0 && (
                  <div>
                    {groupedResults.orders.length > 0 && <div className="border-t border-border my-1" />}
                    <div className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                      <User size={12} />
                      Customers
                    </div>
                    {groupedResults.customers.map((result, idx) => {
                      if (result.type !== 'customer') return null;
                      const flatIdx = getFlatIndex('customer', idx);
                      const isSelected = flatIdx === selectedIndex;
                      return (
                        <button
                          key={`customer-${result.data.id}`}
                          data-index={flatIdx}
                          onClick={() => handleSelect(result)}
                          className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
                            isSelected ? 'bg-primary/20 text-primary' : 'hover:bg-muted'
                          }`}
                        >
                          <User size={16} className="text-emerald-500 flex-shrink-0" weight="duotone" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {result.data.company || result.data.name}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {result.data.company ? result.data.name : result.data.email}
                            </p>
                          </div>
                          <CaretRight size={14} className="text-muted-foreground flex-shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Quotes Section */}
                {groupedResults.quotes.length > 0 && (
                  <div>
                    {(groupedResults.orders.length > 0 || groupedResults.customers.length > 0) && (
                      <div className="border-t border-border my-1" />
                    )}
                    <div className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                      <FileText size={12} />
                      Quotes
                    </div>
                    {groupedResults.quotes.map((result, idx) => {
                      if (result.type !== 'quote') return null;
                      const flatIdx = getFlatIndex('quote', idx);
                      const isSelected = flatIdx === selectedIndex;
                      return (
                        <button
                          key={`quote-${result.data.id}`}
                          data-index={flatIdx}
                          onClick={() => handleSelect(result)}
                          className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
                            isSelected ? 'bg-primary/20 text-primary' : 'hover:bg-muted'
                          }`}
                        >
                          <FileText size={16} className="text-blue-500 flex-shrink-0" weight="duotone" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {result.data.quote_number}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {result.data.customer_name} • ${parseFloat(result.data.total || '0').toFixed(2)}
                            </p>
                          </div>
                          <CaretRight size={14} className="text-muted-foreground flex-shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              <div className="px-3 py-4 text-center">
                <p className="text-sm text-muted-foreground">No results for "{searchTerm}"</p>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
