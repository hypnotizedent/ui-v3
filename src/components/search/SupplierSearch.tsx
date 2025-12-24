
import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MagnifyingGlass, Spinner, CheckCircle, XCircle } from '@phosphor-icons/react';
import { toast } from 'sonner';

const API_BASE = 'https://mintprints-api.ronny.works';

interface SupplierProduct {
    sku: string;
    name: string;
    brand: string;
    supplier: string;
    category: string;
    basePrice: number;
    colors: Array<{ name: string; code: string; hex?: string }>;
    sizes: Array<{ name: string; code: string }>;
    image_url?: string;
    qty_available?: number;
}

interface SupplierSearchProps {
    onSelect: (product: SupplierProduct) => void;
    className?: string;
}

export function SupplierSearch({ onSelect, className = '' }: SupplierSearchProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SupplierProduct[]>([]);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (query.length >= 2) {
                performSearch(query);
            } else {
                setResults([]);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [query]);

    // Click outside to close
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const performSearch = async (searchTerm: string) => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/supplier/search?q=${encodeURIComponent(searchTerm)}&limit=10`);
            if (!res.ok) throw new Error('Search failed');
            const data = await res.json();
            setResults(data || []);
            setIsOpen(true);
        } catch (err) {
            console.error('Supplier search error:', err);
            // Don't toast on every keystroke error, just log it
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (product: SupplierProduct) => {
        onSelect(product);
        setIsOpen(false);
        setQuery('');
        setResults([]);
    };

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            <div className="relative">
                <MagnifyingGlass
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                />
                <Input
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => {
                        if (results.length > 0) setIsOpen(true);
                    }}
                    placeholder="Search SanMar catalog (e.g. Gildan 5000)..."
                    className="pl-9 pr-4"
                />
                {loading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Spinner className="animate-spin text-muted-foreground" size={16} />
                    </div>
                )}
            </div>

            {isOpen && results.length > 0 && (
                <Card className="absolute top-full left-0 right-0 mt-2 max-h-96 overflow-auto z-50 shadow-xl border-border animate-in fade-in zoom-in-95 duration-100">
                    <div className="p-1">
                        {results.map((product) => (
                            <button
                                key={`${product.supplier}-${product.sku}`}
                                onClick={() => handleSelect(product)}
                                className="w-full text-left p-3 hover:bg-muted/50 rounded-md transition-colors flex items-start gap-4 border-b border-border/40 last:border-0"
                            >
                                <div className="w-12 h-12 bg-white rounded border border-border flex items-center justify-center overflow-hidden flex-shrink-0">
                                    {product.image_url ? (
                                        <img src={product.image_url} alt={product.name} className="w-full h-full object-contain" />
                                    ) : (
                                        <span className="text-xs text-muted-foreground font-semibold">{product.sku.substring(0, 2)}</span>
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2 mb-0.5">
                                        <span className="font-medium text-sm truncate">{product.name}</span>
                                        <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-normal">
                                            {product.sku}
                                        </Badge>
                                    </div>

                                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                        <span className="font-semibold text-foreground/80">{product.brand}</span>
                                        <span>•</span>
                                        <span className="capitalize">{product.category}</span>
                                    </div>

                                    <div className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-2">
                                            {product.colors && (
                                                <span className="inline-flex items-center gap-1" title={`${product.colors.length} colors`}>
                                                    <span className="w-2 h-2 rounded-full bg-primary/20" />
                                                    {product.colors.length} colors
                                                </span>
                                            )}
                                        </div>
                                        {product.basePrice > 0 && (
                                            <span className="font-semibold text-primary">
                                                Est. ${product.basePrice.toFixed(2)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </Card>
            )}

            {isOpen && query.length >= 2 && !loading && results.length === 0 && (
                <Card className="absolute top-full left-0 right-0 mt-2 p-4 text-center text-sm text-muted-foreground z-50 shadow-lg">
                    No products found matching "{query}"
                </Card>
            )}
        </div>
    );
}
