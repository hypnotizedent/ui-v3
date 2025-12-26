/**
 * Product Catalog Page
 *
 * Search and browse products from all suppliers (S&S Activewear, AS Colour, SanMar).
 * Displays product images, brand, style, price, and inventory.
 * Supports filtering by supplier and category.
 */

import { useState, useEffect, useCallback } from 'react';
import { MagnifyingGlass, Funnel, TShirt, Package, CaretDown, Plus, Check, Warning, CircleNotch } from '@phosphor-icons/react';
import { useProductSearch, useSupplierStatus, type SupplierProduct, type OrderListItem } from '@/lib/hooks';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { OrderSelectorModal } from './OrderSelectorModal';

// Supplier display names and colors
const SUPPLIER_CONFIG: Record<string, { label: string; color: string }> = {
  ss_activewear: { label: 'S&S Activewear', color: 'bg-blue-500' },
  as_colour: { label: 'AS Colour', color: 'bg-purple-500' },
  sanmar: { label: 'SanMar', color: 'bg-green-500' },
};

interface ProductCatalogPageProps {
  onAddToOrder?: (product: SupplierProduct, quantity: number) => void;
}

const API_BASE = import.meta.env.VITE_DASHBOARD_API_URL || 'https://mintprints-api.ronny.works';

export function ProductCatalogPage({ onAddToOrder }: ProductCatalogPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<'all' | 'ss_activewear' | 'as_colour' | 'sanmar'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<SupplierProduct | null>(null);
  const [addQuantity, setAddQuantity] = useState(1);
  const [showOrderSelector, setShowOrderSelector] = useState(false);
  const [isAddingToOrder, setIsAddingToOrder] = useState(false);

  const { products, loading, error, search } = useProductSearch({
    supplier: selectedSupplier,
    limit: 50,
  });

  const { suppliers: supplierStatus } = useSupplierStatus();

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        search(searchQuery);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedSupplier, search]);

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim().length >= 2) {
      search(searchQuery);
    }
  }, [searchQuery, search]);

  // Add product to an order via API
  const addProductToOrder = useCallback(async (order: OrderListItem) => {
    if (!selectedProduct) return;

    setIsAddingToOrder(true);
    try {
      // Map supplier product to line item fields
      const lineItemData = {
        style_number: selectedProduct.style_code || '',
        style_description: `${selectedProduct.brand} ${selectedProduct.title}`.trim(),
        color: selectedProduct.color || '',
        category: selectedProduct.category || '',
        total_quantity: addQuantity,
        unit_cost: selectedProduct.base_price || selectedProduct.piece_price || 0,
        // Set sizes based on selected size (put all quantity in matching size field)
        size_xs: selectedProduct.size?.toLowerCase() === 'xs' ? addQuantity : 0,
        size_s: selectedProduct.size?.toLowerCase() === 's' ? addQuantity : 0,
        size_m: selectedProduct.size?.toLowerCase() === 'm' ? addQuantity : 0,
        size_l: selectedProduct.size?.toLowerCase() === 'l' ? addQuantity : 0,
        size_xl: selectedProduct.size?.toLowerCase() === 'xl' ? addQuantity : 0,
        size_2_xl: selectedProduct.size?.toLowerCase() === '2xl' || selectedProduct.size?.toLowerCase() === 'xxl' ? addQuantity : 0,
        size_3_xl: selectedProduct.size?.toLowerCase() === '3xl' || selectedProduct.size?.toLowerCase() === 'xxxl' ? addQuantity : 0,
        size_other: !['xs', 's', 'm', 'l', 'xl', '2xl', 'xxl', '3xl', 'xxxl'].includes(selectedProduct.size?.toLowerCase() || '') ? addQuantity : 0,
      };

      const response = await fetch(`${API_BASE}/api/orders/${order.id}/line-items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lineItemData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to add product (${response.status})`);
      }

      toast.success(
        `Added ${addQuantity}x ${selectedProduct.style_code} to Order #${order.visual_id}`,
        {
          action: {
            label: 'View Order',
            onClick: () => window.location.href = `/orders/${order.visual_id}`,
          },
        }
      );

      // Reset state
      setSelectedProduct(null);
      setAddQuantity(1);
    } catch (error) {
      console.error('Failed to add product to order:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add product to order');
    } finally {
      setIsAddingToOrder(false);
    }
  }, [selectedProduct, addQuantity]);

  const handleAddToOrder = useCallback(() => {
    if (selectedProduct && onAddToOrder) {
      // If parent provided handler, use it
      onAddToOrder(selectedProduct, addQuantity);
      toast.success(`Added ${addQuantity}x ${selectedProduct.title} to order`);
      setSelectedProduct(null);
      setAddQuantity(1);
    } else if (selectedProduct) {
      // Show order selector modal
      setShowOrderSelector(true);
    }
  }, [selectedProduct, addQuantity, onAddToOrder]);

  // Get unique categories from results
  const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));

  // Filter by category if selected
  const filteredProducts = selectedCategory === 'all'
    ? products
    : products.filter(p => p.category === selectedCategory);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Product Catalog</h1>
          <p className="text-muted-foreground text-sm">
            Search products across all suppliers
          </p>
        </div>

        {/* Supplier Status Indicators */}
        <div className="flex items-center gap-2">
          {supplierStatus.map((s) => (
            <Badge
              key={s.name}
              variant={s.ok ? 'default' : 'destructive'}
              className="flex items-center gap-1"
            >
              {s.ok ? <Check size={12} /> : <Warning size={12} />}
              {SUPPLIER_CONFIG[s.name]?.label || s.name}
            </Badge>
          ))}
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="p-4">
        <form onSubmit={handleSearch} className="flex flex-col gap-4 md:flex-row md:items-end">
          {/* Search Input */}
          <div className="flex-1">
            <label className="text-sm font-medium mb-1.5 block">Search Products</label>
            <div className="relative">
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input
                type="text"
                placeholder="Search by style, brand, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Supplier Filter */}
          <div className="w-full md:w-48">
            <label className="text-sm font-medium mb-1.5 block">Supplier</label>
            <Select
              value={selectedSupplier}
              onValueChange={(v) => setSelectedSupplier(v as typeof selectedSupplier)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Suppliers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Suppliers</SelectItem>
                <SelectItem value="ss_activewear">S&S Activewear</SelectItem>
                <SelectItem value="as_colour">AS Colour</SelectItem>
                <SelectItem value="sanmar">SanMar</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Category Filter */}
          {categories.length > 0 && (
            <div className="w-full md:w-48">
              <label className="text-sm font-medium mb-1.5 block">Category</label>
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat || 'uncategorized'}>
                      {cat || 'Uncategorized'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Search Button */}
          <Button type="submit" disabled={searchQuery.trim().length < 2}>
            <MagnifyingGlass size={18} className="mr-2" />
            Search
          </Button>
        </form>
      </Card>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <CircleNotch size={32} className="animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Searching...</span>
        </div>
      ) : error ? (
        <Card className="p-8 text-center">
          <Warning size={48} className="mx-auto text-destructive mb-4" />
          <h3 className="text-lg font-medium">Search Error</h3>
          <p className="text-muted-foreground">{error.message}</p>
        </Card>
      ) : filteredProducts.length === 0 && searchQuery.length >= 2 ? (
        <Card className="p-8 text-center">
          <Package size={48} className="mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No Products Found</h3>
          <p className="text-muted-foreground">
            Try a different search term or adjust your filters
          </p>
        </Card>
      ) : filteredProducts.length === 0 ? (
        <Card className="p-8 text-center">
          <TShirt size={48} className="mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">Search for Products</h3>
          <p className="text-muted-foreground">
            Enter at least 2 characters to search products from all suppliers
          </p>
        </Card>
      ) : (
        <>
          {/* Results Count */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {filteredProducts.length} products
              {selectedSupplier !== 'all' && ` from ${SUPPLIER_CONFIG[selectedSupplier]?.label}`}
            </p>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map((product) => (
              <ProductCard
                key={`${product.supplier}-${product.supplier_sku}`}
                product={product}
                onClick={() => setSelectedProduct(product)}
              />
            ))}
          </div>
        </>
      )}

      {/* Product Detail Modal */}
      <Dialog open={!!selectedProduct} onOpenChange={(open) => !open && setSelectedProduct(null)}>
        <DialogContent className="max-w-2xl">
          {selectedProduct && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Badge className={SUPPLIER_CONFIG[selectedProduct.supplier]?.color || 'bg-gray-500'}>
                    {SUPPLIER_CONFIG[selectedProduct.supplier]?.label || selectedProduct.supplier}
                  </Badge>
                  {selectedProduct.style_code}
                </DialogTitle>
                <DialogDescription>
                  {selectedProduct.brand} - {selectedProduct.title}
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-6 py-4">
                {/* Image */}
                <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                  {selectedProduct.image_url ? (
                    <img
                      src={selectedProduct.image_url}
                      alt={selectedProduct.title}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.currentTarget.src = '';
                        e.currentTarget.className = 'hidden';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <TShirt size={64} className="text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Color & Size</h4>
                    <p className="text-lg font-medium">{selectedProduct.color} / {selectedProduct.size}</p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Category</h4>
                    <p>{selectedProduct.category || 'N/A'}</p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Price</h4>
                    <p className="text-2xl font-bold text-primary">
                      ${(selectedProduct.base_price || selectedProduct.piece_price || 0).toFixed(2)}
                    </p>
                    {selectedProduct.case_price && selectedProduct.case_qty && (
                      <p className="text-sm text-muted-foreground">
                        Case: ${selectedProduct.case_price.toFixed(2)} / {selectedProduct.case_qty} pcs
                      </p>
                    )}
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Inventory</h4>
                    <p className={`text-lg font-medium ${
                      selectedProduct.inventory.total > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {selectedProduct.inventory.total > 0
                        ? `${selectedProduct.inventory.total.toLocaleString()} in stock`
                        : 'Out of stock'
                      }
                    </p>
                  </div>

                  {selectedProduct.description && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Description</h4>
                      <p className="text-sm">{selectedProduct.description}</p>
                    </div>
                  )}

                  {/* Add to Order */}
                  <div className="pt-4 border-t">
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={1}
                        max={selectedProduct.inventory.total || 9999}
                        value={addQuantity}
                        onChange={(e) => setAddQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-24"
                      />
                      <Button
                        onClick={handleAddToOrder}
                        disabled={selectedProduct.inventory.total === 0 || isAddingToOrder}
                        className="flex-1"
                      >
                        {isAddingToOrder ? (
                          <>
                            <CircleNotch size={18} className="mr-2 animate-spin" />
                            Adding...
                          </>
                        ) : (
                          <>
                            <Plus size={18} className="mr-2" />
                            Add to Order
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Order Selector Modal */}
      <OrderSelectorModal
        open={showOrderSelector}
        onOpenChange={setShowOrderSelector}
        onSelectOrder={addProductToOrder}
      />
    </div>
  );
}

// Product Card Component
function ProductCard({ product, onClick }: { product: SupplierProduct; onClick: () => void }) {
  const price = product.base_price || product.piece_price || 0;
  const inStock = product.inventory.total > 0;

  return (
    <Card
      className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
      onClick={onClick}
    >
      {/* Image */}
      <div className="aspect-square bg-muted relative">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.title}
            className="w-full h-full object-contain"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.src = '';
              e.currentTarget.className = 'hidden';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <TShirt size={48} className="text-muted-foreground" />
          </div>
        )}

        {/* Supplier Badge */}
        <Badge
          className={`absolute top-2 left-2 text-xs ${SUPPLIER_CONFIG[product.supplier]?.color || 'bg-gray-500'}`}
        >
          {SUPPLIER_CONFIG[product.supplier]?.label || product.supplier}
        </Badge>

        {/* Stock Status */}
        <Badge
          variant={inStock ? 'default' : 'destructive'}
          className="absolute top-2 right-2 text-xs"
        >
          {inStock ? `${product.inventory.total.toLocaleString()}` : 'Out'}
        </Badge>
      </div>

      {/* Info */}
      <div className="p-3 space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground font-medium">
            {product.brand}
          </span>
          <span className="text-xs font-mono text-muted-foreground">
            {product.style_code}
          </span>
        </div>

        <h3 className="font-medium text-sm line-clamp-2" title={product.title}>
          {product.title}
        </h3>

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {product.color} / {product.size}
          </span>
          <span className="font-bold text-primary">
            ${price.toFixed(2)}
          </span>
        </div>
      </div>
    </Card>
  );
}

export default ProductCatalogPage;
