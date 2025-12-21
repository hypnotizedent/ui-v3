import { useState } from 'react';
import { 
  DotsSixVertical, 
  Copy, 
  Trash, 
  CaretDown,
  CaretRight,
  Printer,
  Plus
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/helpers';

interface LineItemRowProps {
  item: {
    id: string;
    product_sku: string;
    product_name: string;
    product_color: string;
    supplier?: string;
    sizes: Record<string, number>;
    quantity: number;
    unit_price: number;
    subtotal: number;
    mockupUrl?: string;
    imprints: Array<{
      id: string;
      location: string;
      method: string;
      width: number;
      height: number;
      colors: number;
      mockupUrl?: string;
    }>;
  };
  onDuplicate: () => void;
  onDelete: () => void;
  onAddImprint: () => void;
}

const SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'];

export function LineItemRow({ item, onDuplicate, onDelete, onAddImprint }: LineItemRowProps) {
  const [imprintsOpen, setImprintsOpen] = useState(false);

  const getSupplierBadge = (supplier?: string) => {
    if (!supplier || supplier === 'manual') return null;
    
    const badges: Record<string, { label: string; color: string }> = {
      ss: { label: 'SS', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
      sanmar: { label: 'SM', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
      ascolour: { label: 'AS', color: 'bg-green-500/10 text-green-400 border-green-500/20' },
    };

    const badge = badges[supplier];
    if (!badge) return null;

    return (
      <Badge 
        variant="outline" 
        className={`text-[10px] font-bold px-1.5 py-0 h-5 ${badge.color}`}
      >
        {badge.label}
      </Badge>
    );
  };

  return (
    <div className="border border-border rounded-lg bg-card/30 overflow-hidden">
      {/* Main Row */}
      <div className="flex items-center gap-2 p-3 hover:bg-secondary/20 transition-colors">
        {/* Drag Handle */}
        <button className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors p-1">
          <DotsSixVertical className="w-4 h-4" weight="bold" />
        </button>

        {/* SKU Input */}
        <div className="w-32 shrink-0">
          <Input
            value={item.product_sku}
            placeholder="SKU"
            className="h-8 text-sm"
          />
          {getSupplierBadge(item.supplier)}
        </div>

        {/* Style Name */}
        <div className="flex-1 min-w-[150px]">
          <div className="text-sm font-medium">{item.product_name}</div>
          <div className="text-xs text-muted-foreground">{item.product_color}</div>
        </div>

        {/* Size Grid */}
        <div className="flex gap-1">
          {SIZES.map(size => {
            const qty = item.sizes[size] || 0;
            return (
              <Input
                key={size}
                value={qty || ''}
                placeholder="0"
                className="h-8 w-12 text-center text-xs p-1"
                type="number"
                min="0"
              />
            );
          })}
        </div>

        {/* Price */}
        <div className="w-24 text-right shrink-0">
          <div className="text-sm font-semibold">{formatCurrency(item.subtotal)}</div>
          <div className="text-xs text-muted-foreground">
            {item.quantity} × {formatCurrency(item.unit_price)}
          </div>
        </div>

        {/* Preview */}
        {item.mockupUrl && (
          <div className="w-12 h-12 shrink-0 rounded border border-border overflow-hidden bg-muted">
            <img src={item.mockupUrl} alt="Preview" className="w-full h-full object-cover" />
          </div>
        )}

        {/* Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
              <DotsSixVertical className="w-4 h-4" weight="bold" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onDuplicate} className="gap-2 cursor-pointer">
              <Copy className="w-4 h-4" weight="bold" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={onDelete} 
              className="gap-2 cursor-pointer text-destructive"
            >
              <Trash className="w-4 h-4" weight="bold" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Imprints Section */}
      {item.imprints.length > 0 && (
        <Collapsible open={imprintsOpen} onOpenChange={setImprintsOpen}>
          <div className="border-t border-border/50">
            <CollapsibleTrigger asChild>
              <button className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-secondary/20 transition-colors">
                {imprintsOpen ? (
                  <CaretDown className="w-3 h-3" weight="bold" />
                ) : (
                  <CaretRight className="w-3 h-3" weight="bold" />
                )}
                <Printer className="w-3 h-3" weight="bold" />
                <span className="font-medium">
                  Locations & Decoration ({item.imprints.length} imprint{item.imprints.length !== 1 ? 's' : ''})
                </span>
              </button>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <div className="px-3 pb-3 space-y-2">
                {item.imprints.map((imprint, idx) => (
                  <div 
                    key={imprint.id}
                    className="flex items-center gap-3 p-2 bg-secondary/30 rounded border border-border/50"
                  >
                    {imprint.mockupUrl && (
                      <div className="w-10 h-10 rounded border border-border overflow-hidden bg-muted shrink-0">
                        <img 
                          src={imprint.mockupUrl} 
                          alt={`Imprint ${idx + 1}`} 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary" className="text-xs">
                          {imprint.location}
                        </Badge>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs font-medium capitalize">
                          {imprint.method.replace('-', ' ')}
                        </span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">
                          {imprint.width}" × {imprint.height}"
                        </span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">
                          {imprint.colors} color{imprint.colors !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 shrink-0"
                      onClick={() => console.log('Delete imprint', imprint.id)}
                    >
                      <Trash className="w-3 h-3" weight="bold" />
                    </Button>
                  </div>
                ))}
                
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2 h-8"
                  onClick={onAddImprint}
                >
                  <Plus className="w-3 h-3" weight="bold" />
                  Add Imprint
                </Button>
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
      )}
    </div>
  );
}

interface LineItemsTableProps {
  items: Array<{
    id: string;
    product_sku: string;
    product_name: string;
    product_color: string;
    supplier?: string;
    sizes: Record<string, number>;
    quantity: number;
    unit_price: number;
    subtotal: number;
    mockupUrl?: string;
    imprints: Array<{
      id: string;
      location: string;
      method: string;
      width: number;
      height: number;
      colors: number;
      mockupUrl?: string;
    }>;
  }>;
  onAddLineItem: () => void;
  onAddImprint: () => void;
}

export function LineItemsTable({ items, onAddLineItem, onAddImprint }: LineItemsTableProps) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">LINE ITEMS</h3>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={onAddImprint}
          >
            <Printer className="w-4 h-4" weight="bold" />
            Add Imprint
          </Button>
          <Button
            size="sm"
            className="gap-2 bg-primary hover:bg-primary/90"
            onClick={onAddLineItem}
          >
            <Plus className="w-4 h-4" weight="bold" />
            Add Line Item
          </Button>
        </div>
      </div>

      {/* Column Headers */}
      <div className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide border-b border-border">
        <div className="w-5"></div> {/* Drag handle space */}
        <div className="w-32">SKU</div>
        <div className="flex-1 min-w-[150px]">Style</div>
        <div className="flex gap-1">
          {SIZES.map(size => (
            <div key={size} className="w-12 text-center">{size}</div>
          ))}
        </div>
        <div className="w-24 text-right">Price</div>
        <div className="w-12 text-center">Preview</div>
        <div className="w-8"></div> {/* Actions space */}
      </div>

      {/* Rows */}
      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No line items yet. Click "Add Line Item" to get started.
          </div>
        ) : (
          items.map((item) => (
            <LineItemRow
              key={item.id}
              item={item}
              onDuplicate={() => console.log('Duplicate', item.id)}
              onDelete={() => console.log('Delete', item.id)}
              onAddImprint={() => console.log('Add imprint to', item.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
