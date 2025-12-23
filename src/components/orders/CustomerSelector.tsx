import { useState, useEffect, useRef } from 'react';
import { MagnifyingGlass, Plus, User } from '@phosphor-icons/react';
import { Card } from '@/components/ui/card';

const API_BASE = 'https://mintprints-api.ronny.works';

interface Customer {
  id: number;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
}

interface CustomerSelectorProps {
  selected: Customer | null;
  onSelect: (customer: Customer | null) => void;
  onCreateNew: () => void;
}

export function CustomerSelector({ selected, onSelect, onCreateNew }: CustomerSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Search customers when search term changes
  useEffect(() => {
    if (search.length >= 2) {
      setLoading(true);
      fetch(`${API_BASE}/api/customers?search=${encodeURIComponent(search)}&limit=10`)
        .then(res => res.json())
        .then(data => {
          setResults(data.customers || []);
          setLoading(false);
        })
        .catch(() => {
          setResults([]);
          setLoading(false);
        });
    } else {
      setResults([]);
    }
  }, [search]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (selected) {
    return (
      <Card className="bg-card border-border p-4">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" weight="bold" />
            </div>
            <div>
              <h3 className="font-medium text-foreground">{selected.name}</h3>
              {selected.company && (
                <p className="text-sm text-muted-foreground">{selected.company}</p>
              )}
              {selected.email && (
                <p className="text-sm text-primary">{selected.email}</p>
              )}
            </div>
          </div>
          <button
            onClick={() => onSelect(null)}
            className="text-muted-foreground hover:text-foreground text-sm transition-colors"
          >
            Change
          </button>
        </div>
      </Card>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <Card className="bg-card border-border p-4">
        <label className="block text-sm text-muted-foreground mb-2">Select Customer</label>

        <div className="relative">
          <MagnifyingGlass
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
            weight="bold"
          />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setIsOpen(true); }}
            onFocus={() => setIsOpen(true)}
            placeholder="Search customers by name, company, or email..."
            className="w-full bg-secondary border border-input rounded-lg pl-10 pr-4 py-2.5 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
          />
        </div>

        {isOpen && (search.length >= 2 || results.length > 0) && (
          <div className="mt-2 bg-popover rounded-lg border border-border max-h-60 overflow-y-auto shadow-lg">
            {loading ? (
              <div className="p-3 text-muted-foreground text-sm">Searching...</div>
            ) : results.length > 0 ? (
              results.map(customer => (
                <div
                  key={customer.id}
                  onClick={() => {
                    onSelect(customer);
                    setIsOpen(false);
                    setSearch('');
                  }}
                  className="p-3 hover:bg-muted cursor-pointer border-b border-border last:border-0 transition-colors"
                >
                  <div className="font-medium text-foreground">{customer.name}</div>
                  {customer.company && (
                    <div className="text-sm text-muted-foreground">{customer.company}</div>
                  )}
                  {customer.email && (
                    <div className="text-xs text-primary">{customer.email}</div>
                  )}
                </div>
              ))
            ) : search.length >= 2 ? (
              <div className="p-3 text-muted-foreground text-sm">No customers found</div>
            ) : null}

            <div
              onClick={() => {
                onCreateNew();
                setIsOpen(false);
              }}
              className="p-3 hover:bg-muted cursor-pointer border-t border-border flex items-center gap-2 text-primary transition-colors"
            >
              <Plus className="w-4 h-4" weight="bold" />
              Create New Customer
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
