import { useState } from 'react';
import { User, MagnifyingGlass, CaretDown } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useCustomersList } from '@/lib/hooks';

interface Customer {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
}

interface CustomerSelectorProps {
  customer: Customer;
  onCustomerChange?: (customer: Customer) => void;
  onViewCustomer?: (customerId: string) => void;
}

export function CustomerSelector({ 
  customer, 
  onCustomerChange,
  onViewCustomer 
}: CustomerSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const { customers, loading } = useCustomersList({ 
    limit: 50,
    search: search || undefined 
  });

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSelectCustomer = (selectedCustomer: Customer) => {
    onCustomerChange?.(selectedCustomer);
    setOpen(false);
    setSearch('');
  };

  return (
    <Card className="bg-card/50 border-border p-4">
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <Avatar className="h-12 w-12 border-2 border-primary/20">
          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
            {getInitials(customer.name)}
          </AvatarFallback>
        </Avatar>

        {/* Customer Info */}
        <div className="flex-1 min-w-0">
          <button
            onClick={() => onViewCustomer?.(String(customer.id))}
            className="font-semibold text-base text-foreground hover:text-primary hover:underline text-left transition-colors"
          >
            {customer.name}
          </button>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5 flex-wrap">
            {customer.company && (
              <>
                <span className="truncate">{customer.company}</span>
                {(customer.email || customer.phone) && <span>•</span>}
              </>
            )}
            {customer.email && (
              <>
                <a 
                  href={`mailto:${customer.email}`} 
                  className="hover:text-foreground truncate"
                  onClick={(e) => e.stopPropagation()}
                >
                  {customer.email}
                </a>
                {customer.phone && <span>•</span>}
              </>
            )}
            {customer.phone && (
              <a 
                href={`tel:${customer.phone}`} 
                className="hover:text-foreground"
                onClick={(e) => e.stopPropagation()}
              >
                {customer.phone}
              </a>
            )}
          </div>
        </div>

        {/* Change Button */}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2 shrink-0"
            >
              Change
              <CaretDown className="w-3 h-3" weight="bold" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-96 p-0" align="end">
            <div className="p-3 border-b border-border">
              <div className="relative">
                <MagnifyingGlass 
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" 
                  weight="bold" 
                />
                <Input
                  placeholder="Search customers..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                  autoFocus
                />
              </div>
            </div>
            
            <div className="max-h-80 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Loading customers...
                </div>
              ) : customers.length === 0 ? (
                <div className="p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-2">
                    No customers found
                  </p>
                  {search && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        // TODO: Implement create customer
                        console.log('Create new customer:', search);
                      }}
                    >
                      Create "{search}"
                    </Button>
                  )}
                </div>
              ) : (
                <div className="py-2">
                  {customers.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => handleSelectCustomer({
                        id: c.id,
                        name: c.name,
                        email: c.email,
                        phone: c.phone,
                        company: c.company,
                      })}
                      className="w-full px-3 py-2 hover:bg-secondary/50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {getInitials(c.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">{c.name}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            {c.company || c.email || 'No details'}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </Card>
  );
}
