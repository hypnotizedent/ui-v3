// OrderDetailPagePSP - PrintShopPro-style Order/Quote Detail Page
// Ported from: ~/spark/print-shop-pro/src/components/QuoteBuilder.tsx

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { CustomerSelector } from './CustomerSelector'
import { LineItemGrid } from './LineItemGrid'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  ArrowLeft,
  Plus,
  FloppyDisk,
  DotsThree,
  UserCircle,
  Copy,
  CurrencyDollar,
  Printer,
  Trash,
  Warning,
  ArrowClockwise,
  Image,
  FilePdf,
} from '@phosphor-icons/react'
import { useOrderDetail, type OrderDetail, type OrderDetailLineItem } from '@/lib/hooks'
import type { PSPLineItem } from '@/lib/printshoppro-types'
import { convertToLineItem, generateId, calculateLineItemTotal, calculateSizesTotal } from '@/lib/printshoppro-types'
import { formatCurrency, formatDate, getAPIStatusColor, getAPIStatusLabel } from '@/lib/helpers'
import { convertToOrder } from '@/lib/quote-api'
import { toast } from 'sonner'

const API_BASE = 'https://mintprints-api.ronny.works'

interface OrderDetailPagePSPProps {
  visualId: string
  onBack: () => void
  onViewCustomer: (customerId: string) => void
  mode?: 'order' | 'quote'
  onConvertSuccess?: (orderId: string) => void
}

export function OrderDetailPagePSP({
  visualId,
  onBack,
  onViewCustomer,
  mode = 'order',
  onConvertSuccess,
}: OrderDetailPagePSPProps) {
  const { order, loading, error, refetch } = useOrderDetail(visualId)
  const [lineItems, setLineItems] = useState<PSPLineItem[]>([])
  const [nickname, setNickname] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [customerNotes, setCustomerNotes] = useState('')
  const [internalNotes, setInternalNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [converting, setConverting] = useState(false)

  // Convert API line items to PrintShopPro format and populate form fields
  useEffect(() => {
    if (order?.lineItems) {
      const converted = order.lineItems.map(item => convertToLineItem(item))
      setLineItems(converted)
      setNickname(order.orderNickname || '')
      setDueDate(order.dueDate || '')
      setCustomerNotes(order.notes || '')
      setInternalNotes(order.productionNotes || '')
    }
  }, [order])

  const handleSave = async () => {
    if (!order) return

    setSaving(true)
    try {
      // Update order-level fields
      const response = await fetch(`${API_BASE}/api/orders/${visualId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_nickname: nickname || null,
          due_date: dueDate || null,
          notes: customerNotes || null,
          production_notes: internalNotes || null,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save order')
      }

      // Line items would need separate API calls (not yet implemented)
      // TODO: Implement PUT /api/orders/:id/line-items/:id for each modified line item

      toast.success('Order saved')
      refetch()
    } catch (err) {
      console.error('Save error:', err)
      toast.error('Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  const handleConvertToOrder = async () => {
    if (!order) return

    setConverting(true)
    try {
      const result = await convertToOrder(order.id)
      toast.success(`Converted to Order #${result.visual_id}`)
      if (onConvertSuccess) {
        onConvertSuccess(result.visual_id)
      }
    } catch (err) {
      console.error('Convert error:', err)
      toast.error('Failed to convert quote to order')
    } finally {
      setConverting(false)
    }
  }

  const handleAddLineItem = () => {
    const newItem: PSPLineItem = {
      id: generateId('li'),
      product_type: 'tshirt',
      product_name: '',
      product_color: '',
      product_sku: '',
      decoration: 'screen-print',
      print_locations: [],
      decorations: [],
      colors: 0,
      sizes: { XS: 0, S: 0, M: 0, L: 0, XL: 0, '2XL': 0, '3XL': 0 },
      quantity: 0,
      unit_price: 0,
      setup_fee: 0,
      line_total: 0,
    }
    setLineItems([...lineItems, newItem])
  }

  const handleAddImprint = () => {
    if (lineItems.length === 0) {
      toast.error('Add a line item first')
      return
    }

    const lastItemIndex = lineItems.length - 1
    const lastItem = lineItems[lastItemIndex]

    const newDecoration = {
      id: generateId('dec'),
      method: 'screen-print' as const,
      location: 'Front',
      inkThreadColors: '',
      setupFee: 0,
    }

    const updatedItems = [...lineItems]
    updatedItems[lastItemIndex] = {
      ...lastItem,
      decorations: [...(lastItem.decorations || []), newDecoration],
    }

    setLineItems(updatedItems)
    toast.success('Imprint added to last line item')
  }

  const handleLineItemsChange = (items: PSPLineItem[]) => {
    setLineItems(items)
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault()
        handleAddLineItem()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [lineItems])

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft size={20} />
          </Button>
          <div className="animate-pulse">
            <div className="h-8 w-48 bg-muted rounded mb-2" />
            <div className="h-4 w-24 bg-muted rounded" />
          </div>
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-2xl font-bold">Order Not Found</h1>
        </div>
        <Card className="p-6 text-center">
          <Warning size={48} className="mx-auto mb-4 text-destructive" />
          <p className="text-muted-foreground mb-4">{error?.message || 'Failed to load order'}</p>
          <Button onClick={() => refetch()} variant="outline">
            <ArrowClockwise size={16} className="mr-2" />
            Try Again
          </Button>
        </Card>
      </div>
    )
  }

  const subtotal = lineItems.reduce((sum, item) => sum + item.line_total, 0)
  const total = subtotal // TODO: Add discount and tax
  const isQuote = mode === 'quote' || order.status?.toLowerCase().includes('quote')

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Header - PrintShopPro style */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft size={20} />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">
                  {isQuote ? 'Quote' : 'Order'} #{order.orderNumber}
                </h1>
                <Badge
                  variant="secondary"
                  className={`${getAPIStatusColor(order.status)} font-medium text-xs uppercase tracking-wide px-2 py-0.5`}
                >
                  {getAPIStatusLabel(order.status)}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Created {formatDate(order.createdAt)}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <DotsThree size={20} weight="bold" />
                  More Actions
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {order.customer.id > 0 && (
                  <>
                    <DropdownMenuItem onClick={() => onViewCustomer(String(order.customer.id))}>
                      <UserCircle size={18} className="mr-2" />
                      View Customer Profile
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem onClick={() => {}} disabled>
                  <Copy size={18} className="mr-2" />
                  Duplicate {isQuote ? 'Quote' : 'Order'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.print()}>
                  <Printer size={18} className="mr-2" />
                  Print
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {}}
                  disabled
                  className="text-destructive"
                >
                  <Trash size={18} className="mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="outline"
              onClick={handleSave}
              disabled={saving}
              title="Save (⌘S)"
            >
              <FloppyDisk size={16} className="mr-2" />
              {saving ? 'Saving...' : 'Save'}
              <kbd className="ml-2 px-1.5 py-0.5 text-xs bg-muted rounded">⌘S</kbd>
            </Button>

            {isQuote && (
              <Button onClick={handleConvertToOrder} disabled={converting}>
                {converting ? 'Converting...' : 'Convert to Order'}
              </Button>
            )}
          </div>
        </div>

        {/* Customer + Nickname Grid - PrintShopPro style */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <div className="text-xs font-semibold text-muted-foreground tracking-wider uppercase mb-3">
              Customer
            </div>
            <CustomerSelector
              selected={order.customer.id > 0 ? {
                id: order.customer.id,
                name: order.customer.name || '',
                company: order.customer.company || null,
                email: order.customer.email || null,
                phone: order.customer.phone || null,
              } : null}
              onSelect={() => {}}
              onCreateNew={() => {}}
            />
          </div>
          <div>
            <div className="text-xs font-semibold text-muted-foreground tracking-wider uppercase mb-3">
              {isQuote ? 'Quote' : 'Order'} Nickname (Optional)
            </div>
            <Input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="e.g., Summer Promo, Church Event..."
            />
          </div>
        </div>

        <Separator />

        {/* Line Items Section - PrintShopPro style */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">
              Line Items
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleAddImprint}
                size="sm"
                variant="outline"
                disabled={lineItems.length === 0}
                title="Add imprint to last line item"
              >
                <Plus size={16} className="mr-1" />
                Add Imprint
              </Button>
              <Button
                onClick={handleAddLineItem}
                size="sm"
                variant="default"
                title="Add Line Item (⌘N)"
              >
                <Plus size={16} className="mr-1" />
                Add Line Item
                <kbd className="ml-2 px-1.5 py-0.5 text-xs bg-primary-foreground/20 rounded">⌘N</kbd>
              </Button>
            </div>
          </div>

          {lineItems.length === 0 ? (
            <div className="border border-dashed border-border rounded-lg p-12 text-center">
              <div className="text-muted-foreground mb-3">No line items yet</div>
              <Button onClick={handleAddLineItem} variant="outline">
                <Plus size={16} className="mr-2" />
                Add First Line Item
              </Button>
            </div>
          ) : (
            <LineItemGrid
              items={lineItems}
              onChange={handleLineItemsChange}
              customerId={String(order.customer.id)}
              customerName={order.customer.name}
            />
          )}
        </div>

        {/* Mockups Section */}
        {(() => {
          // Collect all mockups from line items and imprints
          const allMockups: Array<{ id: string; url: string; name: string; thumbnail_url?: string | null; source: string }> = []

          order.lineItems?.forEach((item, itemIndex) => {
            // Line item level mockup
            if (item.mockup) {
              allMockups.push({
                ...item.mockup,
                source: `Line ${itemIndex + 1}: ${item.description || item.styleNumber || 'Item'}`
              })
            }
            // Imprint level mockups
            item.imprints?.forEach((imprint) => {
              imprint.mockups?.forEach((mockup) => {
                allMockups.push({
                  ...mockup,
                  source: `${imprint.location || 'Imprint'} - ${item.description || item.styleNumber || 'Item'}`
                })
              })
            })
          })

          if (allMockups.length === 0) return null

          const isPDF = (url: string) => url?.toLowerCase().endsWith('.pdf')

          return (
            <>
              <Separator />
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Image size={20} className="text-muted-foreground" />
                    <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                      Mockups & Artwork
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {allMockups.length}
                    </Badge>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {allMockups.map((mockup, index) => (
                    <div
                      key={mockup.id || index}
                      className="group relative aspect-square bg-muted rounded-lg overflow-hidden border border-border hover:border-primary/50 transition-colors"
                    >
                      {isPDF(mockup.url) ? (
                        <a
                          href={mockup.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex flex-col items-center justify-center h-full text-muted-foreground hover:text-primary transition-colors"
                        >
                          <FilePdf size={48} />
                          <span className="text-xs mt-2">View PDF</span>
                        </a>
                      ) : (
                        <a href={mockup.url} target="_blank" rel="noopener noreferrer">
                          <img
                            src={mockup.thumbnail_url || mockup.url}
                            alt={mockup.name || 'Mockup'}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.src = mockup.url // Fallback to full URL
                            }}
                          />
                        </a>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="text-xs text-white truncate">{mockup.source}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )
        })()}

        <Separator />

        {/* Details + Pricing Grid - PrintShopPro style */}
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">
              Details
            </div>
            <div className="bg-card border border-border rounded-lg p-4 space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">
                  Due Date
                </label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">
                  Customer Notes
                </label>
                <Textarea
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  placeholder="Rush order needed for company event"
                  rows={2}
                  className="resize-none"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">
                  Internal Notes
                </label>
                <Textarea
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  placeholder="VIP customer - priority production"
                  rows={2}
                  className="resize-none"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">
              Pricing
            </div>
            <div className="bg-card border border-border rounded-lg p-5 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Discount</span>
                <span className="font-medium">{formatCurrency(0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax</span>
                <span className="font-medium">{formatCurrency(order.salesTax || 0)}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="font-semibold">Total</span>
                <span className="font-bold text-xl text-primary">{formatCurrency(order.totalAmount || total)}</span>
              </div>
              {order.amountOutstanding > 0 && (
                <>
                  <Separator />
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Paid</span>
                    <span className="text-green-500 font-medium">
                      {formatCurrency((order.totalAmount || total) - order.amountOutstanding)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-yellow-500">Balance Due</span>
                    <span className="font-bold text-yellow-500">{formatCurrency(order.amountOutstanding)}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <Separator />

        {/* Footer Bar - PrintShopPro style */}
        <div className="flex items-center justify-between gap-3 bg-muted/50 border border-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" disabled>
              History
            </Button>
            <Button variant="outline" size="sm" disabled>
              <CurrencyDollar size={16} className="mr-2" />
              Payments
              {order.amountOutstanding > 0 && (
                <Badge variant="destructive" className="ml-2 px-1.5 py-0 text-xs">
                  ${order.amountOutstanding.toFixed(2)} Due
                </Badge>
              )}
            </Button>
            <Button variant="outline" size="sm" disabled>
              Messages
            </Button>
          </div>

          <div className="flex items-center gap-4 px-4 py-2 bg-background rounded-md border border-border">
            <div className="flex flex-col items-end">
              <span className="text-xs text-muted-foreground">Subtotal</span>
              <span className="font-semibold text-foreground">{formatCurrency(subtotal)}</span>
            </div>
            <Separator orientation="vertical" className="h-8" />
            <div className="flex flex-col items-end">
              <span className="text-xs text-muted-foreground">Total</span>
              <span className="font-bold text-lg text-primary">{formatCurrency(order.totalAmount || total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
