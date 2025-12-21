import { useState } from 'react';
import { useOrderDetail } from '@/lib/hooks';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import {
  DotsThree,
  FloppyDisk,
  PaperPlaneTilt,
  Warning,
  ArrowClockwise,
  Package,
  FileText,
} from '@phosphor-icons/react';
import { formatCurrency, formatDate, getAPIStatusColor, getAPIStatusLabel } from '@/lib/helpers';
import { CustomerSelector } from './detail/CustomerSelector';
import { LineItemsTable } from './detail/LineItemsTable';
import { toast } from 'sonner';

interface OrderDetailPageNewProps {
  visualId: string;
  onViewCustomer: (customerId: string) => void;
}

export function OrderDetailPageNew({ visualId, onViewCustomer }: OrderDetailPageNewProps) {
  const { order, loading, error, refetch } = useOrderDetail(visualId);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-48 mb-2" />
          <div className="h-4 bg-muted rounded w-32" />
        </div>
        <div className="space-y-6">
          <div className="h-32 bg-muted rounded" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
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

  // Transform line items to match LineItemsTable props
  const lineItems = order.lineItems.map(item => ({
    id: String(item.id),
    product_sku: item.styleNumber || '',
    product_name: item.description || 'Unknown Item',
    product_color: item.color || '',
    supplier: undefined,
    sizes: {
      'XS': item.sizes.xs,
      'S': item.sizes.s,
      'M': item.sizes.m,
      'L': item.sizes.l,
      'XL': item.sizes.xl,
      '2XL': item.sizes.xxl,
      '3XL': item.sizes.xxxl,
      '4XL': item.sizes.xxxxl,
      '5XL': item.sizes.xxxxxl,
    },
    quantity: item.totalQuantity,
    unit_price: item.unitCost,
    subtotal: item.totalCost,
    mockupUrl: item.mockup?.url,
    imprints: [], // TODO: Add imprints when available
  }));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            #{order.orderNumber}
            {order.orderNickname && (
              <span className="text-muted-foreground"> · {order.orderNickname}</span>
            )}
          </h2>
          <div className="flex items-center gap-3 mt-2">
            <Badge
              variant="secondary"
              className={`${getAPIStatusColor(order.status)} font-medium text-xs uppercase tracking-wide`}
            >
              {getAPIStatusLabel(order.status)}
            </Badge>
            <div className="text-2xl font-bold">{formatCurrency(order.totalAmount)}</div>
            <span className="text-sm text-muted-foreground">
              Balance:{' '}
              <span className={balance > 0 ? 'text-yellow-400' : 'text-green-400'}>
                {formatCurrency(balance)}
              </span>
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <DotsThree size={18} weight="bold" />
                More Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="gap-2 cursor-pointer">
                <FileText className="w-4 h-4" weight="bold" />
                Download PDF
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2 cursor-pointer">
                <Package className="w-4 h-4" weight="bold" />
                Duplicate Order
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2"
            onClick={() => toast.success('Draft saved')}
          >
            <FloppyDisk size={16} weight="bold" />
            Save Draft
          </Button>

          <Button 
            size="sm" 
            className="gap-2 bg-primary hover:bg-primary/90"
            onClick={() => toast.success('Quote sent')}
          >
            <PaperPlaneTilt size={16} weight="bold" />
            {order.status === 'quote' ? 'Send Quote' : 'Send Invoice'}
          </Button>
        </div>
      </div>

      {/* Customer Selector */}
      <CustomerSelector
        customer={{
          id: order.customer.id,
          name: order.customer.name,
          email: order.customer.email,
          phone: order.customer.phone,
          company: order.customer.company,
        }}
        onViewCustomer={onViewCustomer}
        onCustomerChange={(customer) => {
          toast.success(`Customer changed to ${customer.name}`);
        }}
      />

      {/* Dates Row */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        {order.createdAt && (
          <>
            <span>Created {formatDate(order.createdAt)}</span>
            <span>•</span>
          </>
        )}
        {order.dueDate && (
          <span
            className={
              new Date(order.dueDate) < new Date() &&
              order.status.toLowerCase() !== 'complete' &&
              order.status.toLowerCase() !== 'shipped'
                ? 'text-destructive font-medium'
                : ''
            }
          >
            Due {formatDate(order.dueDate)}
          </span>
        )}
      </div>

      <Separator />

      {/* Line Items Table */}
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <LineItemsTable
            items={lineItems}
            onAddLineItem={() => toast.info('Add line item clicked')}
            onAddImprint={() => toast.info('Add imprint clicked')}
          />
        </CardContent>
      </Card>

      {/* Details Section */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Production Notes */}
        {order.productionNotes && (
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold mb-2">Production Notes</h3>
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
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold mb-2">Notes</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {order.notes}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Pricing Section */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="space-y-2 max-w-sm ml-auto">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">{formatCurrency(order.totalAmount - (order.totalAmount * 0.1))}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax</span>
              <span className="font-medium">{formatCurrency(order.totalAmount * 0.1)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-base font-semibold">
              <span>Total</span>
              <span>{formatCurrency(order.totalAmount)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
