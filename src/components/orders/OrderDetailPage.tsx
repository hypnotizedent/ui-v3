import { useState, useEffect } from 'react';
import { useOrderDetail, type OrderDetail, type OrderDetailLineItem } from '@/lib/hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  FileText,
  Image,
  Warning,
  ArrowClockwise,
  Package,
  Printer,
  FilePdf,
  FileImage,
  File,
  DotsThree
} from '@phosphor-icons/react';
import { formatCurrency, formatDate, getAPIStatusColor, getAPIStatusLabel } from '@/lib/helpers';
import { SizeBreakdown } from '@/lib/types';
import { ImageModal } from '@/components/shared/ImageModal';

// Component for rendering PDF thumbnail with fallback
function PdfThumbnail({ 
  thumbnailUrl, 
  pdfUrl, 
  name, 
  size = 'large',
  className = '' 
}: { 
  thumbnailUrl: string | null | undefined; 
  pdfUrl: string; 
  name: string; 
  size?: 'small' | 'large';
  className?: string;
}) {
  const [thumbnailFailed, setThumbnailFailed] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  
  // Reset state when thumbnailUrl changes
  useEffect(() => {
    setThumbnailFailed(false);
    setImgLoaded(false);
  }, [thumbnailUrl]);
  
  const iconSize = size === 'small' ? 20 : 28;
  const dimensions = size === 'small' 
    ? 'w-16 h-16'
    : 'w-24 h-24';
  
  const hasThumbnail = thumbnailUrl && !thumbnailFailed;
  
  return (
    <a
      href={pdfUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`${dimensions} flex-shrink-0 rounded-lg border-2 border-border hover:border-primary transition-all hover:shadow-lg overflow-hidden relative bg-card group ${className}`}
      title={`Open ${name} (PDF)`}
    >
      {hasThumbnail ? (
        <>
          <img
            src={thumbnailUrl}
            alt={name}
            className={`w-full h-full object-cover transition-all duration-200 group-hover:scale-105 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImgLoaded(true)}
            onError={() => {
              setThumbnailFailed(true);
              setImgLoaded(false);
            }}
          />
          {!imgLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
              <FilePdf size={iconSize} className="text-red-400/50 animate-pulse" weight="fill" />
            </div>
          )}
          {/* PDF indicator badge */}
          <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-red-500 rounded text-white text-[10px] font-bold uppercase shadow-md">
            PDF
          </div>
        </>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/20 dark:to-red-900/20 group-hover:from-red-100 group-hover:to-red-200 dark:group-hover:from-red-900/30 dark:group-hover:to-red-800/30 transition-all">
          <FilePdf size={iconSize} className="text-red-500 mb-1 group-hover:scale-110 transition-transform" weight="fill" />
          <span className="text-[10px] text-red-600 dark:text-red-400 uppercase font-bold tracking-wide">PDF</span>
        </div>
      )}
    </a>
  );
}

// Helper to check if URL is a PDF
function isPdfUrl(url: string | undefined): boolean {
  if (!url) return false;
  return url.toLowerCase().endsWith('.pdf');
}

// Helper to get file extension
function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}

// Helper to check if file is an image
function isImageFile(filename: string): boolean {
  const ext = getFileExtension(filename);
  return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext);
}

// Helper to get file icon
function getFileIcon(filename: string) {
  const ext = getFileExtension(filename);
  
  if (ext === 'pdf') {
    return <FilePdf className="w-5 h-5 text-red-400" weight="fill" />;
  }
  
  if (isImageFile(filename)) {
    return <FileImage className="w-5 h-5 text-blue-400" weight="fill" />;
  }
  
  return <File className="w-5 h-5 text-muted-foreground" weight="bold" />;
}

// Map API size keys to SizeBreakdown format
function mapSizesToGrid(sizes: OrderDetailLineItem['sizes']): SizeBreakdown {
  return {
    XS: sizes.xs || 0,
    S: sizes.s || 0,
    M: sizes.m || 0,
    L: sizes.l || 0,
    XL: sizes.xl || 0,
    '2XL': sizes.xxl || 0,
    '3XL': sizes.xxxl || 0,
  };
}

interface OrderDetailPageProps {
  visualId: string;
  onViewCustomer: (customerId: string) => void;
}

export function OrderDetailPage({ visualId, onViewCustomer }: OrderDetailPageProps) {
  const { order, loading, error, refetch } = useOrderDetail(visualId);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalImages, setModalImages] = useState<Array<{ url: string; name: string; id: string }>>([]);
  const [modalIndex, setModalIndex] = useState(0);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [visualId]);

  const openImageModal = (images: Array<{ url: string; name: string; id: string }>, index: number = 0) => {
    setModalImages(images);
    setModalIndex(index);
    setModalOpen(true);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-48 mb-2" />
          <div className="h-4 bg-muted rounded w-32" />
        </div>
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-card border-border">
              <CardContent className="py-8">
                <div className="animate-pulse space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-24 bg-muted rounded" />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="bg-card border-border">
                <CardContent className="py-6">
                  <div className="animate-pulse h-20 bg-muted rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Order Details</h2>
        </div>
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6 text-center">
            <Warning size={48} className="mx-auto mb-4 text-destructive" />
            <h3 className="text-lg font-semibold mb-2">Failed to Load Order</h3>
            <p className="text-sm text-muted-foreground mb-4">{error.message}</p>
            <Button onClick={() => refetch()} variant="outline" className="gap-2">
              <ArrowClockwise size={16} />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="space-y-6">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6 text-center">
            <Package size={48} className="mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Order Not Found</h3>
            <p className="text-sm text-muted-foreground">
              Could not find order #{visualId}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const balance = order.amountOutstanding;
  const paid = order.totalAmount - order.amountOutstanding;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            #{order.orderNumber}
            {order.orderNickname && (
              <span className="text-muted-foreground"> · {order.orderNickname}</span>
            )}
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="flex items-center gap-2 justify-end mb-1">
              <Badge
                variant="secondary"
                className={`${getAPIStatusColor(order.status)} font-medium text-xs uppercase tracking-wide`}
              >
                {getAPIStatusLabel(order.status)}
              </Badge>
              <div className="text-2xl font-semibold">{formatCurrency(order.totalAmount)}</div>
            </div>
            <p className="text-sm text-muted-foreground">
              Balance:{' '}
              <span className={balance > 0 ? 'text-yellow-400' : 'text-green-400'}>
                {formatCurrency(balance)}
              </span>
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <DotsThree size={20} weight="bold" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Minimal Info Bar - Customer and Dates */}
      <Card className="bg-card/50 border-border">
        <CardHeader className="py-3 px-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            {/* Customer Info - Left */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => onViewCustomer(String(order.customer.id))}
                  className="font-semibold text-foreground hover:text-primary hover:underline text-left"
                >
                  {order.customer.name}
                </button>
                {order.customer.company && (
                  <>
                    <span className="text-muted-foreground">·</span>
                    <span className="text-muted-foreground">{order.customer.company}</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5 flex-wrap">
                {order.customer.email && (
                  <a href={`mailto:${order.customer.email}`} className="hover:text-foreground">
                    {order.customer.email}
                  </a>
                )}
                {order.customer.email && order.customer.phone && <span>·</span>}
                {order.customer.phone && (
                  <a href={`tel:${order.customer.phone}`} className="hover:text-foreground">
                    {order.customer.phone}
                  </a>
                )}
              </div>
            </div>

            {/* Dates - Right */}
            <div className="flex items-center gap-2 text-sm flex-wrap">
              {order.createdAt && (
                <>
                  <span className="text-muted-foreground">Created {formatDate(order.createdAt)}</span>
                  <span className="text-muted-foreground">·</span>
                </>
              )}
              {order.dueDate && (
                <span
                  className={`text-muted-foreground ${
                    new Date(order.dueDate) < new Date() &&
                    order.status.toLowerCase() !== 'complete' &&
                    order.status.toLowerCase() !== 'shipped'
                      ? 'text-destructive font-medium'
                      : ''
                  }`}
                >
                  Due {formatDate(order.dueDate)}
                </span>
              )}
            </div>
          </div>
        </CardHeader>
        
        <Separator className="my-0" />
        
        <CardContent className="pt-6 space-y-4">
          {/* Line Items Section Header */}
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-base font-medium">Line Items</h3>
          </div>
          
          {order.lineItems.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-4">
              No line items
            </p>
          ) : (
            (() => {
              const imprintMockups = order.artworkFiles
                .filter(f => f.source === 'imprintMockup')
                .sort((a, b) => {
                  const aIsPdf = a.url?.toLowerCase().endsWith('.pdf');
                  const bIsPdf = b.url?.toLowerCase().endsWith('.pdf');
                  if (aIsPdf && !bIsPdf) return 1;
                  if (!aIsPdf && bIsPdf) return -1;
                  return 0;
                });

              return order.lineItems.map((item, index) => (
                <LineItemCard
                  key={item.id}
                  item={item}
                  index={index}
                  orderStatus={order.status}
                  imprintMockups={imprintMockups}
                  onImageClick={openImageModal}
                />
              ));
            })()
          )}
          
          {/* Add Line Item Button */}
          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => {
                // TODO: Implement add line item functionality
              }}
            >
              <Package className="w-4 h-4" weight="bold" />
              Add Line Item
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Production Files - Collapsible */}
      {(() => {
        const productionFiles = order.artworkFiles.filter(f => f.source === 'productionFile');
        const imageFiles = productionFiles.filter(f => isImageFile(f.name));
        const nonImageFiles = productionFiles.filter(f => !isImageFile(f.name));
        
        return productionFiles.length > 0 && (
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <FileText className="w-4 h-4" weight="bold" />
                Production Files ({productionFiles.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Image Files with Previews */}
              {imageFiles.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                    Images ({imageFiles.length})
                  </p>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                    {imageFiles.map((file, idx) => (
                      <button
                        key={file.id}
                        onClick={() => openImageModal(imageFiles, idx)}
                        className="relative group aspect-square rounded-lg overflow-hidden bg-muted border border-border hover:border-primary transition-colors cursor-pointer"
                      >
                        <img
                          src={file.url}
                          alt={file.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <FileImage className="w-6 h-6 text-white" weight="bold" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Non-Image Files */}
              {nonImageFiles.length > 0 && (
                <div>
                  {imageFiles.length > 0 && (
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                      Other Files ({nonImageFiles.length})
                    </p>
                  )}
                  <div className="grid gap-2">
                    {nonImageFiles.map((file) => (
                      <a
                        key={file.id}
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-2 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors"
                      >
                        {getFileIcon(file.name)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{file.name}</p>
                          <p className="text-xs text-muted-foreground">{getFileExtension(file.name).toUpperCase()} file</p>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })()}

      {/* Production Notes */}
      {order.productionNotes && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Production Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="text-sm text-muted-foreground prose prose-sm prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: order.productionNotes }}
            />
          </CardContent>
        </Card>
      )}

      {/* Order Notes */}
      {order.notes && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {order.notes}
            </p>
          </CardContent>
        </Card>
      )}

      <ImageModal
        images={modalImages}
        currentIndex={modalIndex}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onNavigate={setModalIndex}
      />
    </div>
  );
}

interface LineItemCardProps {
  item: OrderDetailLineItem;
  index: number;
  orderStatus: string;
  imprintMockups: Array<{ id: string; url: string; name: string; thumbnail_url?: string | null }>;
  onImageClick?: (images: Array<{ url: string; name: string; id: string }>, index: number) => void;
}

const SIZE_LABELS: (keyof SizeBreakdown)[] = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'];

function LineItemCard({ item, index, orderStatus, imprintMockups, onImageClick }: LineItemCardProps) {
  const sizes = mapSizesToGrid(item.sizes);
  const total = item.totalQuantity;
  const hasOtherSizes = (item.sizes.xxxxl || 0) + (item.sizes.xxxxxl || 0) + (item.sizes.other || 0) > 0;

  const lineItemMockups = item.mockup ? [item.mockup] : [];
  const allLineItemMockups = lineItemMockups.sort((a, b) => {
    const aIsPdf = a.url?.toLowerCase().endsWith('.pdf');
    const bIsPdf = b.url?.toLowerCase().endsWith('.pdf');
    if (aIsPdf && !bIsPdf) return 1;
    if (!aIsPdf && bIsPdf) return -1;
    return 0;
  });

  return (
    <div className="p-4 bg-secondary/30 rounded-lg space-y-4">
      <div className="flex items-start gap-4">
        {/* Mockup Thumbnail */}
        {allLineItemMockups.length > 0 && allLineItemMockups[0] ? (
          isPdfUrl(allLineItemMockups[0].url) ? (
            <PdfThumbnail
              thumbnailUrl={allLineItemMockups[0].thumbnail_url}
              pdfUrl={allLineItemMockups[0].url}
              name={allLineItemMockups[0].name}
              size="large"
            />
          ) : (
            <button
              onClick={() => onImageClick?.(allLineItemMockups, 0)}
              className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-card border border-border hover:border-primary transition-colors cursor-pointer"
            >
              <img
                src={allLineItemMockups[0].url}
                alt={allLineItemMockups[0].name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </button>
          )
        ) : (
          <div className="flex-shrink-0 w-20 h-20 rounded-lg bg-muted/50 border border-border flex items-center justify-center">
            <Image className="w-6 h-6 text-muted-foreground/50" weight="duotone" />
          </div>
        )}

        <div className="flex-1 min-w-0 flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs bg-muted px-2 py-0.5 rounded">#{index + 1}</span>
              <h4 className="font-medium truncate">
                {item.description || item.styleNumber || 'Line Item'}
              </h4>
            </div>
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground flex-wrap">
              {item.styleNumber && <span>{item.styleNumber}</span>}
              {item.styleNumber && item.color && <span>•</span>}
              {item.color && <span>{item.color}</span>}
              {item.category && (
                <>
                  <span>•</span>
                  <Badge variant="outline" className="text-xs">
                    {item.category}
                  </Badge>
                </>
              )}
            </div>
          </div>
          <div className="text-right ml-4">
            <div className="font-medium">{formatCurrency(item.totalCost)}</div>
            <div className="text-sm text-muted-foreground">
              {item.totalQuantity} × {formatCurrency(item.unitCost)}
            </div>
          </div>
        </div>
      </div>

      {/* Size Grid */}
      <div className="overflow-x-auto">
        <div className="inline-flex gap-1 text-xs">
          {SIZE_LABELS.map(size => (
            <div
              key={size}
              className="flex flex-col items-center min-w-[40px]"
            >
              <span className="text-muted-foreground font-medium px-2 py-1">
                {size}
              </span>
              <span
                className={`px-2 py-1 rounded ${
                  sizes[size] > 0
                    ? 'bg-primary/20 text-primary font-medium'
                    : 'text-muted-foreground/50'
                }`}
              >
                {sizes[size]}
              </span>
            </div>
          ))}
          <div className="flex flex-col items-center min-w-[50px] border-l border-border pl-1 ml-1">
            <span className="text-muted-foreground font-medium px-2 py-1">
              Total
            </span>
            <span className="px-2 py-1 font-semibold">
              {total}
            </span>
          </div>
        </div>
        {hasOtherSizes && (
          <p className="text-xs text-muted-foreground mt-1">
            + other sizes included
          </p>
        )}
      </div>

      {/* Imprints Section */}
      <div className="space-y-3">
        <p className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1">
          <Printer className="w-3 h-3" weight="bold" />
          Imprints
        </p>
        
        {/* Multiple imprint cards */}
        {imprintMockups.length > 0 ? (
          imprintMockups.map((mockup, mockupIdx) => (
            <div key={mockup.id} className="p-4 bg-card rounded-lg border border-border">
              <div className="flex flex-col gap-3">
                {/* Imprint Mockup Thumbnail */}
                <div className="flex gap-3">
                  {isPdfUrl(mockup.url) ? (
                    <PdfThumbnail
                      thumbnailUrl={mockup.thumbnail_url}
                      pdfUrl={mockup.url}
                      name={mockup.name || 'Imprint mockup'}
                      size="large"
                    />
                  ) : (
                    <button
                      onClick={() => onImageClick?.([mockup], 0)}
                      className="flex-shrink-0 cursor-pointer group"
                    >
                      <img
                        src={mockup.url}
                        alt={mockup.name || 'Imprint mockup'}
                        className="w-24 h-24 object-contain rounded-lg bg-muted border-2 border-border hover:border-primary transition-all hover:shadow-lg group-hover:scale-105"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </button>
                  )}
                  <div className="flex-1 flex items-center">
                    <p className="text-sm text-muted-foreground">
                      {mockup.name || `Imprint ${mockupIdx + 1}`}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-4 bg-card rounded-lg border border-border">
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <div className="text-center">
                <Image className="w-12 h-12 mx-auto mb-2 opacity-30" weight="duotone" />
                <p className="text-sm">No imprints available</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Add Imprint Button */}
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => {
            // TODO: Implement add imprint functionality
          }}
        >
          <Printer className="w-4 h-4" weight="bold" />
          Add Imprint
        </Button>
      </div>
    </div>
  );
}
