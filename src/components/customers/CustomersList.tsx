import { useState, useMemo } from 'react';
import { Customer, CustomerTier } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MagnifyingGlass, Users } from '@phosphor-icons/react';
import { TierBadge } from '@/components/shared/TierBadge';
import { formatCurrency } from '@/lib/helpers';

interface CustomersListProps {
  customers: Customer[];
  onViewCustomer: (customerId: string) => void;
}

const ALL_TIERS: CustomerTier[] = ['bronze', 'silver', 'gold', 'platinum'];

export function CustomersList({ customers, onViewCustomer }: CustomersListProps) {
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState<CustomerTier | 'all'>('all');
  
  const filteredCustomers = useMemo(() => {
    let result = [...customers];
    
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(c => 
        c.name.toLowerCase().includes(searchLower) ||
        c.company.toLowerCase().includes(searchLower) ||
        c.email.toLowerCase().includes(searchLower)
      );
    }
    
    if (tierFilter !== 'all') {
      result = result.filter(c => c.tier === tierFilter);
    }
    
    result.sort((a, b) => b.total_revenue - a.total_revenue);
    
    return result;
  }, [customers, search, tierFilter]);
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Customers</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Manage customer relationships
        </p>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="customer-search"
            placeholder="Search by name, company, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card border-border"
          />
        </div>
        <Select value={tierFilter} onValueChange={(v) => setTierFilter(v as CustomerTier | 'all')}>
          <SelectTrigger className="w-full sm:w-[150px] bg-card border-border">
            <SelectValue placeholder="Filter by tier" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tiers</SelectItem>
            {ALL_TIERS.map(tier => (
              <SelectItem key={tier} value={tier} className="capitalize">{tier}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {filteredCustomers.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="py-12 text-center">
            <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" weight="duotone" />
            <p className="text-muted-foreground">
              {customers.length === 0 ? 'No customers yet' : 'No customers match your filters'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-card border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-3">Customer</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-3">Company</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-3">Tier</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-3">Orders</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-3">Last Order</th>
                  <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-3">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr 
                    key={customer.id}
                    onClick={() => onViewCustomer(customer.id)}
                    className="border-b border-border/50 hover:bg-secondary/30 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div>
                        <span className="font-medium">{customer.name}</span>
                        <p className="text-sm text-muted-foreground">{customer.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">{customer.company}</td>
                    <td className="px-4 py-3">
                      <TierBadge tier={customer.tier} />
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {customer.orders_count}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {customer.last_order_date
                        ? new Date(customer.last_order_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {formatCurrency(customer.total_revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
