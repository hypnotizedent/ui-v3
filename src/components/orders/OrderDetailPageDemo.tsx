import { useState } from 'react';
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
  FileText,
  Package,
} from '@phosphor-icons/react';
import { formatCurrency, formatDate } from '@/lib/helpers';
import { CustomerSelector } from './detail/CustomerSelector';
import { LineItemsTable } from './detail/LineItemsTable';
import { toast } from 'sonner';

interface OrderDetailPageDemoProps {
  onViewCustomer: (customerId: string) => void;
}

// Mock data for demo
const mockOrder = {
  id: 1,
  orderNumber: 'ORD-2024-001',
  orderNickname: 'Tech Startup Shirts',
  status: 'quote',
  totalAmount: 2450.00,
  amountOutstanding: 2450.00,
  dueDate: '2024-12-25',
  createdAt: '2024-12-15',
  customer: {
    id: 1,
    name: 'John Smith',
    email: 'john@techstartup.com',
    phone: '(555) 123-4567',
    company: 'Tech Startup Inc',
  },
  productionNotes: '<p>Please use water-based ink for eco-friendly printing.</p>',
  notes: 'Customer prefers soft-hand feel on prints.',
};

const mockLineItems = [
  {
    id: '1',
    product_sku: '18000',
    product_name: 'Gildan Heavy Cotton T-Shirt',
    product_color: 'Navy',
    supplier: 'ss' as const,
    sizes: {
      'XS': 0,
      'S': 12,
      'M': 24,
      'L': 18,
      'XL': 12,
      '2XL': 6,
      '3XL': 3,
      '4XL': 0,
      '5XL': 0,
    },
    quantity: 75,
    unit_price: 12.50,
    subtotal: 937.50,
    mockupUrl: 'https://via.placeholder.com/150',
    imprints: [
      {
        id: 'imp1',
        location: 'Front',
        method: 'screen-print',
        width: 12,
        height: 14,
        colors: 3,
        mockupUrl: 'https://via.placeholder.com/100',
      },
      {
        id: 'imp2',
        location: 'Back',
        method: 'screen-print',
        width: 10,
        height: 12,
        colors: 2,
        mockupUrl: 'https://via.placeholder.com/100',
      },
    ],
  },
  {
    id: '2',
    product_sku: 'PC54',
    product_name: 'Port & Company Core Cotton Tee',
    product_color: 'Black',
    supplier: 'sanmar' as const,
    sizes: {
      'XS': 5,
      'S': 10,
      'M': 15,
      'L': 12,
      'XL': 8,
      '2XL': 5,
      '3XL': 0,
      '4XL': 0,
      '5XL': 0,
    },
    quantity: 55,
    unit_price: 10.00,
    subtotal: 550.00,
    mockupUrl: 'https://via.placeholder.com/150',
    imprints: [
      {
        id: 'imp3',
        location: 'Left Chest',
        method: 'embroidery',
        width: 4,
        height: 4,
        colors: 1,
      },
    ],
  },
  {
    id: '3',
    product_sku: 'AS5001',
    product_name: 'AS Colour Staple Tee',
    product_color: 'White',
    supplier: 'ascolour' as const,
    sizes: {
      'XS': 3,
      'S': 8,
      'M': 12,
      'L': 10,
      'XL': 5,
      '2XL': 2,
      '3XL': 0,
      '4XL': 0,
      '5XL': 0,
    },
    quantity: 40,
    unit_price: 14.00,
    subtotal: 560.00,
    imprints: [],
  },
];

export function OrderDetailPageDemo({ onViewCustomer }: OrderDetailPageDemoProps) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            #{mockOrder.orderNumber}
            {mockOrder.orderNickname && (
              <span className="text-muted-foreground"> · {mockOrder.orderNickname}</span>
            )}
          </h2>
          <div className="flex items-center gap-3 mt-2">
            <Badge
              variant="secondary"
              className="bg-slate-500/10 text-slate-400 border-slate-500/20 font-medium text-xs uppercase tracking-wide"
            >
              QUOTE
            </Badge>
            <div className="text-2xl font-bold">{formatCurrency(mockOrder.totalAmount)}</div>
            <span className="text-sm text-muted-foreground">
              Balance:{' '}
              <span className="text-yellow-400">
                {formatCurrency(mockOrder.amountOutstanding)}
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
            Send Quote
          </Button>
        </div>
      </div>

      {/* Customer Selector */}
      <CustomerSelector
        customer={mockOrder.customer}
        onViewCustomer={onViewCustomer}
        onCustomerChange={(customer) => {
          toast.success(`Customer changed to ${customer.name}`);
        }}
      />

      {/* Dates Row */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span>Created {formatDate(mockOrder.createdAt)}</span>
        <span>•</span>
        <span>Due {formatDate(mockOrder.dueDate)}</span>
      </div>

      <Separator />

      {/* Line Items Table */}
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <LineItemsTable
            items={mockLineItems}
            onAddLineItem={() => toast.info('Add line item clicked')}
            onAddImprint={() => toast.info('Add imprint clicked')}
          />
        </CardContent>
      </Card>

      {/* Details Section */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Production Notes */}
        {mockOrder.productionNotes && (
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold mb-2">Production Notes</h3>
              <div
                className="text-sm text-muted-foreground prose prose-sm prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: mockOrder.productionNotes }}
              />
            </CardContent>
          </Card>
        )}

        {/* Order Notes */}
        {mockOrder.notes && (
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold mb-2">Notes</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {mockOrder.notes}
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
              <span className="font-medium">{formatCurrency(2047.50)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Setup Fees</span>
              <span className="font-medium">{formatCurrency(150.00)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax (10%)</span>
              <span className="font-medium">{formatCurrency(252.50)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-base font-semibold">
              <span>Total</span>
              <span>{formatCurrency(mockOrder.totalAmount)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
