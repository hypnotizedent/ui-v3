import { useState } from 'react';
import { useOrderDetail, type OrderDetail, type OrderDetailLineItem } from '@/lib/hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  User,
  Calendar,
  FileText,
  CreditCard,
  Image,
  Warning,
  ArrowClockwise,
  Phone,
  Envelope,
  Buildings,
  Package,
  Printer,
  FilePdf,
  FileImage,
  File
} from '@phosphor-icons/react';
import { formatCurrency, formatDate, getAPIStatusColor, getAPIStatusLabel, getMethodLabel } from '@/lib/helpers';
import { SizeBreakdown, ImprintMethod } from '@/lib/types';
import { ImageModal } from '@/components/shared/ImageModal';

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

// Infer imprint method from order status/category
function inferImprintMethod(status: string): ImprintMethod {
  const normalized = status.toLowerCase();
  if (normalized.includes('embroid')) return 'embroidery';
  if (normalized.includes('dtg')) return 'dtg';
  if (normalized.includes('vinyl')) return 'vinyl';
  if (normalized.includes('digital') || normalized.includes('transfer')) return 'digital-transfer';
  return 'screen-print';
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-semibold tracking-tight">
              Order #{order.orderNumber}
            </h2>
            <Badge
              variant="secondary"
              className={`${getAPIStatusColor(order.status)} font-medium text-xs uppercase tracking-wide`}
            >
              {getAPIStatusLabel(order.status)}
            </Badge>
          </div>
          {order.orderNickname && (
            <p className="text-muted-foreground mt-1">{order.orderNickname}</p>
          )}
        </div>
        <div className="text-right">
          <div className="text-2xl font-semibold">{formatCurrency(order.totalAmount)}</div>
          <p className="text-sm text-muted-foreground">
            Balance:{' '}
            <span className={balance > 0 ? 'text-yellow-400' : 'text-green-400'}>
              {formatCurrency(balance)}
            </span>
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Line Items */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <FileText className="w-4 h-4" weight="bold" />
                Line Items ({order.lineItems.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.lineItems.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-4">
                  No line items
                </p>
              ) : (
                (() => {
                  // Extract imprint mockups sorted by ID for position matching
                  const imprintMockups = order.artworkFiles
                    .filter(f => f.source === 'imprintMockup')
                    .sort((a, b) => parseInt(a.id) - parseInt(b.id));

                  return order.lineItems.map((item, index) => (
                    <LineItemCard
                      key={item.id}
                      item={item}
                      index={index}
                      orderStatus={order.status}
                      imprintMockup={imprintMockups[index] || null}
                      onImageClick={openImageModal}
                    />
                  ));
                })()
              )}
            </CardContent>
          </Card>

          {/* Production Files - only show productionFile source, not line item mockups */}
          {(() => {
            const productionFiles = order.artworkFiles.filter(f => f.source === 'productionFile');
            const imageFiles = productionFiles.filter(f => isImageFile(f.name));
            const nonImageFiles = productionFiles.filter(f => !isImageFile(f.name));
            
            return productionFiles.length > 0 && (
              <Card className="bg-card border-border">
                <CardHeader>
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
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
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
                              <FileImage className="w-8 h-8 text-white" weight="bold" />
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 p-1 bg-black/80 text-white text-xs truncate">
                              {file.name}
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
                            className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors"
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
              <CardHeader>
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
              <CardHeader>
                <CardTitle className="text-base font-medium">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {order.notes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <User className="w-4 h-4" weight="bold" />
                Customer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <button
                onClick={() => onViewCustomer(String(order.customer.id))}
                className="text-primary hover:underline font-medium text-left"
              >
                {order.customer.name}
              </button>
              {order.customer.company && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Buildings className="w-4 h-4" />
                  {order.customer.company}
                </div>
              )}
              {order.customer.email && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Envelope className="w-4 h-4" />
                  <a href={`mailto:${order.customer.email}`} className="hover:text-foreground">
                    {order.customer.email}
                  </a>
                </div>
              )}
              {order.customer.phone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  <a href={`tel:${order.customer.phone}`} className="hover:text-foreground">
                    {order.customer.phone}
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dates */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4" weight="bold" />
                Dates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {order.createdAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span>{formatDate(order.createdAt)}</span>
                </div>
              )}
              {order.dueDate && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Due Date</span>
                  <span
                    className={
                      new Date(order.dueDate) < new Date() &&
                      order.status.toLowerCase() !== 'complete' &&
                      order.status.toLowerCase() !== 'shipped'
                        ? 'text-destructive'
                        : ''
                    }
                  >
                    {formatDate(order.dueDate)}
                  </span>
                </div>
              )}
              {order.customerPo && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Customer PO</span>
                  <span>{order.customerPo}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Summary */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <CreditCard className="w-4 h-4" weight="bold" />
                Payment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm space-y-2">
                <div className="flex justify-between font-medium">
                  <span>Total</span>
                  <span>{formatCurrency(order.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-green-400">
                  <span>Paid</span>
                  <span>{formatCurrency(paid)}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between font-medium">
                  <span>Balance Due</span>
                  <span className={balance > 0 ? 'text-yellow-400' : 'text-green-400'}>
                    {formatCurrency(balance)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Image Modal */}
      <ImageModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        images={modalImages}
        currentIndex={modalIndex}
        onNavigate={setModalIndex}
      />
    </div>
  );
}

interface LineItemCardProps {
  item: OrderDetailLineItem;
  index: number;
  orderStatus: string;
  imprintMockup: { id: string; url: string; name: string; thumbnail_url?: string | null } | null;
  onImageClick?: (images: Array<{ url: string; name: string; id: string }>, index: number) => void;
}

const SIZE_LABELS: (keyof SizeBreakdown)[] = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'];

function LineItemCard({ item, index, orderStatus, imprintMockup, onImageClick }: LineItemCardProps) {
  const sizes = mapSizesToGrid(item.sizes);
  const total = item.totalQuantity;
  const hasOtherSizes = (item.sizes.xxxxl || 0) + (item.sizes.xxxxxl || 0) + (item.sizes.other || 0) > 0;

  // Infer imprint method from order status
  const imprintMethod = inferImprintMethod(orderStatus);

  return (
    <div className="p-4 bg-secondary/30 rounded-lg space-y-4">
      <div className="flex items-start gap-4">
        {/* Mockup Thumbnail */}
        {item.mockup ? (
          isPdfUrl(item.mockup.url) ? (
            item.mockup.thumbnail_url ? (
              <a
                href={item.mockup.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-card border border-border hover:border-primary transition-colors"
              >
                <img
                  src={item.mockup.thumbnail_url}
                  alt={item.mockup.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </a>
            ) : (
              <a
                href={item.mockup.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 w-20 h-20 rounded-lg bg-card border border-border hover:border-primary transition-colors flex items-center justify-center"
              >
                <FilePdf size={32} className="text-red-400" weight="fill" />
              </a>
            )
          ) : (
            <button
              onClick={() => onImageClick?.([item.mockup!], 0)}
              className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-card border border-border hover:border-primary transition-colors cursor-pointer"
            >
              <img
                src={item.mockup.url}
                alt={item.mockup.name}
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
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1">
          <Printer className="w-3 h-3" weight="bold" />
          Imprint
        </p>
        <div className="p-3 bg-card rounded border border-border">
          <div className="flex items-center gap-3">
            {/* Imprint Mockup Thumbnail */}
            {imprintMockup && (
              isPdfUrl(imprintMockup.url) ? (
                imprintMockup.thumbnail_url ? (
                  <a
                    href={imprintMockup.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 w-12 h-12 rounded border border-border hover:border-primary transition-colors overflow-hidden"
                  >
                    <img
                      src={imprintMockup.thumbnail_url}
                      alt="Imprint mockup"
                      className="w-12 h-12 object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </a>
                ) : (
                  <a
                    href={imprintMockup.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 w-12 h-12 rounded border border-border hover:border-primary transition-colors flex items-center justify-center bg-muted/50"
                  >
                    <FilePdf size={24} className="text-red-400" weight="fill" />
                  </a>
                )
              ) : (
                <button
                  onClick={() => onImageClick?.([imprintMockup], 0)}
                  className="flex-shrink-0 cursor-pointer"
                >
                  <img
                    src={imprintMockup.url}
                    alt="Imprint mockup"
                    className="w-12 h-12 object-cover rounded border border-border hover:opacity-80 transition-opacity"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </button>
              )
            )}
            <div className="flex items-center justify-between flex-1">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  Front
                </Badge>
                <Badge variant="secondary" className="text-xs bg-primary/20 text-primary">
                  {getMethodLabel(imprintMethod)}
                </Badge>
              </div>
              {imprintMockup && (
                isPdfUrl(imprintMockup.url) ? (
                  <a
                    href={imprintMockup.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline"
                  >
                    Open PDF
                  </a>
                ) : (
                  <button
                    onClick={() => onImageClick?.([imprintMockup], 0)}
                    className="text-xs text-primary hover:underline"
                  >
                    View mockup
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
