import { useState, useEffect } from 'react';
import { useOrderDetail, type OrderDetail, type OrderDetailLineItem, type LineItemImprint } from '@/lib/hooks';
import { useKV } from '@github/spark/hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
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
  DotsThree,
  Copy,
  Trash,
  Columns,
  Stamp
} from '@phosphor-icons/react';
import { formatCurrency, formatDate, getAPIStatusColor, getAPIStatusLabel } from '@/lib/helpers';
import { SizeBreakdown } from '@/lib/types';
import { ImageModal } from '@/components/shared/ImageModal';
import { ManageColumnsModal, ColumnConfig, DEFAULT_COLUMN_CONFIG } from './ManageColumnsModal';
import { toast } from 'sonner';

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
function mapSizesToGrid(sizes: OrderDetailLineItem['sizes']): Record<string, number> {
  return {
    XS: sizes.xs || 0,
    S: sizes.s || 0,
    M: sizes.m || 0,
    L: sizes.l || 0,
    XL: sizes.xl || 0,
    '2XL': sizes.xxl || 0,
    '3XL': sizes.xxxl || 0,
    '4XL': sizes.xxxxl || 0,
    '5XL': sizes.xxxxxl || 0,
    '6XL': 0,
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
  const [columnConfig, setColumnConfig] = useKV<ColumnConfig>('order-column-config', DEFAULT_COLUMN_CONFIG);
  
  const currentColumnConfig = columnConfig || DEFAULT_COLUMN_CONFIG;

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
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-7 bg-muted rounded w-48 mb-1.5" />
          <div className="h-3 bg-muted rounded w-32" />
        </div>
        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <Card className="bg-card border-border">
              <CardContent className="py-6">
                <div className="animate-pulse space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-20 bg-muted rounded" />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="bg-card border-border">
                <CardContent className="py-5">
                  <div className="animate-pulse h-16 bg-muted rounded" />
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
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Order Details</h2>
        </div>
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-5 pb-5 text-center">
            <Warning size={40} className="mx-auto mb-3 text-destructive" />
            <h3 className="text-base font-semibold mb-1">Failed to Load Order</h3>
            <p className="text-xs text-muted-foreground mb-3">{error.message}</p>
            <Button onClick={() => refetch()} variant="outline" size="sm" className="gap-2 h-8">
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
      <div className="space-y-4">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-5 pb-5 text-center">
            <Package size={40} className="mx-auto mb-3 text-muted-foreground" />
            <h3 className="text-base font-semibold mb-1">Order Not Found</h3>
            <p className="text-xs text-muted-foreground">
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
    <div className="space-y-3">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            #{order.orderNumber}
            {order.orderNickname && (
              <span className="text-muted-foreground"> · {order.orderNickname}</span>
            )}
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="flex items-center gap-2 justify-end mb-0.5">
              <Badge
                variant="secondary"
                className={`${getAPIStatusColor(order.status)} font-medium text-xs uppercase tracking-wide px-1.5 py-0`}
              >
                {getAPIStatusLabel(order.status)}
              </Badge>
              <div className="text-xl font-semibold">{formatCurrency(order.totalAmount)}</div>
            </div>
            <p className="text-xs text-muted-foreground">
              Balance:{' '}
              <span className={balance > 0 ? 'text-yellow-400' : 'text-green-400'}>
                {formatCurrency(balance)}
              </span>
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
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
        <CardHeader className="py-2 px-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            {/* Customer Info - Left */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => onViewCustomer(String(order.customer.id))}
                  className="font-semibold text-sm text-foreground hover:text-primary hover:underline text-left"
                >
                  {order.customer.name}
                </button>
                {order.customer.company && (
                  <>
                    <span className="text-muted-foreground text-xs">·</span>
                    <span className="text-muted-foreground text-xs">{order.customer.company}</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5 flex-wrap">
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
            <div className="flex items-center gap-2 text-xs flex-wrap">
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
        
        <CardContent className="pt-4 pb-4 space-y-3">
          {/* Line Items Section Header */}
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-medium">Line Items</h3>
          </div>
          
          {order.lineItems.length === 0 ? (
            <p className="text-muted-foreground text-xs text-center py-3">
              No line items
            </p>
          ) : (
            order.lineItems.map((item, index) => (
              <LineItemCard
                key={item.id}
                item={item}
                index={index}
                orderStatus={order.status}
                onImageClick={openImageModal}
                columnConfig={currentColumnConfig}
                onConfigChange={setColumnConfig}
              />
            ))
          )}
          
          {/* Add Line Item Button */}
          <div className="pt-1">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 h-8"
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
            <CardHeader className="py-2 px-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FileText className="w-3.5 h-3.5" weight="bold" />
                Production Files ({productionFiles.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 py-3">
              {/* Image Files with Previews */}
              {imageFiles.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5">
                    Images ({imageFiles.length})
                  </p>
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-1.5">
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
                          <FileImage className="w-5 h-5 text-white" weight="bold" />
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
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5">
                      Other Files ({nonImageFiles.length})
                    </p>
                  )}
                  <div className="grid gap-1.5">
                    {nonImageFiles.map((file) => (
                      <a
                        key={file.id}
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors"
                      >
                        {getFileIcon(file.name)}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{file.name}</p>
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
          <CardHeader className="py-2 px-3">
            <CardTitle className="text-sm font-medium">Production Notes</CardTitle>
          </CardHeader>
          <CardContent className="py-3">
            <div
              className="text-xs text-muted-foreground prose prose-sm prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: order.productionNotes }}
            />
          </CardContent>
        </Card>
      )}

      {/* Order Notes */}
      {order.notes && (
        <Card className="bg-card border-border">
          <CardHeader className="py-2 px-3">
            <CardTitle className="text-sm font-medium">Notes</CardTitle>
          </CardHeader>
          <CardContent className="py-3">
            <p className="text-xs text-muted-foreground whitespace-pre-wrap">
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
  onImageClick?: (images: Array<{ url: string; name: string; id: string }>, index: number) => void;
  columnConfig: ColumnConfig;
  onConfigChange: (config: ColumnConfig) => void;
}

const ADULT_SIZE_LABELS = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL', '6XL'] as const;

function LineItemCard({ item, index, orderStatus, onImageClick, columnConfig, onConfigChange }: LineItemCardProps) {
  const sizes = mapSizesToGrid(item.sizes);
  const total = item.totalQuantity;
  const [manageColumnsOpen, setManageColumnsOpen] = useState(false);
  
  const handleDuplicate = () => {
    toast.success('Line item duplicated');
  };
  
  const handleDelete = () => {
    toast.success('Line item deleted');
  };

  const lineItemMockups = item.mockup ? [item.mockup] : [];
  const allLineItemMockups = lineItemMockups.sort((a, b) => {
    const aIsPdf = a.url?.toLowerCase().endsWith('.pdf');
    const bIsPdf = b.url?.toLowerCase().endsWith('.pdf');
    if (aIsPdf && !bIsPdf) return 1;
    if (!aIsPdf && bIsPdf) return -1;
    return 0;
  });

  return (
    <>
      <div className="p-3 bg-secondary/30 rounded-lg space-y-3 relative">
        {/* 3-dot menu */}
        <div className="absolute top-2 right-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <DotsThree size={18} weight="bold" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleDuplicate} className="gap-2 cursor-pointer">
                <Copy className="w-4 h-4" weight="bold" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} className="gap-2 cursor-pointer text-destructive">
                <Trash className="w-4 h-4" weight="bold" />
                Delete
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setManageColumnsOpen(true)} className="gap-2 cursor-pointer">
                <Columns className="w-4 h-4" weight="bold" />
                Manage Columns
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-start gap-3">
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
                className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-card border border-border hover:border-primary transition-colors cursor-pointer"
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
            <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-muted/50 border border-border flex items-center justify-center">
              <Image className="w-5 h-5 text-muted-foreground/50" weight="duotone" />
            </div>
          )}

        <div className="flex-1 min-w-0 flex items-start justify-between pr-10">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs bg-muted px-1.5 py-0.5 rounded">#{index + 1}</span>
              <h4 className="font-medium text-sm truncate">
                {item.description || item.styleNumber || 'Line Item'}
              </h4>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground flex-wrap">
              {columnConfig.itemNumber && item.styleNumber && <span>{item.styleNumber}</span>}
              {columnConfig.itemNumber && columnConfig.color && item.styleNumber && item.color && <span>•</span>}
              {columnConfig.color && item.color && <span>{item.color}</span>}
              {columnConfig.category && item.category && (
                <>
                  <span>•</span>
                  <Badge variant="outline" className="text-xs px-1 py-0">
                    {item.category}
                  </Badge>
                </>
              )}
              {!columnConfig.itemNumber && !columnConfig.color && !columnConfig.category && item.styleNumber && (
                <span>{item.styleNumber}</span>
              )}
              {!columnConfig.itemNumber && !columnConfig.color && !columnConfig.category && item.styleNumber && item.color && (
                <span>•</span>
              )}
              {!columnConfig.itemNumber && !columnConfig.color && !columnConfig.category && item.color && (
                <span>{item.color}</span>
              )}
            </div>
          </div>
          <div className="text-right ml-3">
            <div className="font-medium text-sm">{formatCurrency(item.totalCost)}</div>
            <div className="text-xs text-muted-foreground">
              {item.totalQuantity} × {formatCurrency(item.unitCost)}
            </div>
          </div>
        </div>
      </div>

      {/* Size Grid */}
      <div className="overflow-x-auto">
        <div className="inline-flex gap-0.5 text-xs">
          {ADULT_SIZE_LABELS.filter(size => columnConfig.sizes.adult[size as keyof typeof columnConfig.sizes.adult]).map(size => (
            <div
              key={size}
              className="flex flex-col items-center min-w-[36px]"
            >
              <span className="text-muted-foreground font-medium px-1.5 py-0.5">
                {size}
              </span>
              <span
                className={`px-1.5 py-0.5 rounded ${
                  sizes[size] > 0
                    ? 'bg-primary/20 text-primary font-medium'
                    : 'text-muted-foreground/50'
                }`}
              >
                {sizes[size]}
              </span>
            </div>
          ))}
          {columnConfig.quantity && (
            <div className="flex flex-col items-center min-w-[44px] border-l border-border pl-1 ml-1">
              <span className="text-muted-foreground font-medium px-1.5 py-0.5">
                Total
              </span>
              <span className="px-1.5 py-0.5 font-semibold">
                {total}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Imprints Section */}
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1">
          <Printer className="w-3 h-3" weight="bold" />
          Imprints
        </p>
        
        {/* Imprint Details with Mockups */}
        {item.imprints && item.imprints.length > 0 ? (
          <div className="mt-2 space-y-1.5">
            {item.imprints.map((imprint) => (
              <div key={imprint.id} className="p-2 bg-card/50 rounded border border-border/50 space-y-1.5">
                <div className="flex items-start gap-2">
                  <Stamp className="w-3.5 h-3.5 text-primary/60 mt-0.5 flex-shrink-0" weight="duotone" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-medium">
                        {imprint.location || 'Imprint'}
                      </span>
                      {imprint.decorationType && (
                        <Badge variant="secondary" className="text-[10px] px-1 py-0 bg-primary/10 text-primary">
                          {imprint.decorationType}
                        </Badge>
                      )}
                    </div>
                    {imprint.description && imprint.description !== imprint.location && (
                      <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">
                        {imprint.description.split('\n').slice(1).join(' ').trim() || ''}
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Mockups for this imprint */}
                {imprint.mockups && imprint.mockups.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap pl-5">
                    {imprint.mockups.map((mockup) => (
                      isPdfUrl(mockup.url) ? (
                        <PdfThumbnail
                          key={mockup.id}
                          thumbnailUrl={mockup.thumbnail_url}
                          pdfUrl={mockup.url}
                          name={mockup.name || 'Imprint mockup'}
                          size="small"
                          className="w-12 h-12"
                        />
                      ) : (
                        <button
                          key={mockup.id}
                          onClick={() => onImageClick?.([mockup], 0)}
                          className="w-12 h-12 flex-shrink-0 rounded border border-border bg-muted hover:ring-2 hover:ring-primary/20 transition-all cursor-pointer overflow-hidden"
                          title={mockup.name || 'Mockup'}
                        >
                          <img
                            src={mockup.url}
                            alt={mockup.name || 'Imprint mockup'}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </button>
                      )
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-1.5 mt-2">
            <div className="w-9 h-9 flex-shrink-0 rounded border border-dashed border-border bg-muted/30 flex items-center justify-center">
              <Image className="w-3.5 h-3.5 text-muted-foreground/50" weight="duotone" />
            </div>
            <span className="text-xs text-muted-foreground">No imprints</span>
          </div>
        )}
        
        {/* Add Imprint Button */}
        <div className="pt-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-2 border border-dashed border-border hover:border-primary hover:bg-primary/5"
            onClick={() => {
              // TODO: Implement add imprint functionality
            }}
          >
            <Printer className="w-3.5 h-3.5" weight="bold" />
            Add Imprint
          </Button>
        </div>
      </div>
      </div>

      <ManageColumnsModal
        open={manageColumnsOpen}
        onOpenChange={setManageColumnsOpen}
        config={columnConfig}
        onChange={onConfigChange}
      />
    </>
  );
}
