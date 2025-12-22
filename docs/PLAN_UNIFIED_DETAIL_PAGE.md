# Plan: Unified Quote/Order Detail Page

## Goal
Make `/quotes/:id` use the same layout as `/orders/:id` for consistent UX.

---

## Current State

### OrderDetailPage.tsx (2,028 lines)
- Located: `src/components/orders/OrderDetailPage.tsx`
- Uses `useOrderDetail(visualId)` hook from `@/lib/hooks`
- Renders: header, customer card, line items table, pricing summary, artwork gallery
- Supports: inline editing, manage columns, add/remove items
- Heavy component with many sub-components

### QuoteBuilderPage.tsx (347 lines)
- Located: `src/components/quotes/QuoteBuilderPage.tsx`
- Simple placeholder with customer search, line items list, notes, pricing
- Uses `fetchQuote()` from `@/lib/quote-api`
- Missing: most functionality from OrderDetailPage

---

## Data Structure Comparison

### Order API Response (`/api/orders/:id`)
```typescript
interface OrderDetail {
  id: number
  orderNumber: string              // "13707"
  orderNickname: string | null     // "Players Alliance"
  status: string
  printavoStatusName: string       // "Quote Out For Approval - Email"
  totalAmount: number              // 9028.8
  amountOutstanding: number
  dueDate: string | null
  createdAt: string
  updatedAt: string
  customer: {
    id: number
    name: string                   // "Kamili Williams"
    email: string | null
    phone: string | null
    company: string | null         // "The Players Alliance"
  }
  customerPo: string | null
  notes: string | null
  productionNotes: string | null
  artworkCount: number
  artworkFiles: ArtworkFile[]
  lineItems: LineItem[]
}

interface LineItem {
  id: number
  styleNumber: string | null       // "G2000"
  description: string | null       // "Gildan - Ultra Cotton..."
  color: string | null             // "Black"
  category: string | null
  unitCost: number                 // 8.36
  totalCost: number
  totalQuantity: number            // 1080
  sizes: {
    xs: number, s: number, m: number, l: number, xl: number,
    xxl: number, xxxl: number, xxxxl: number, xxxxxl: number, other: number
  }
  mockup: Mockup | null
  imprints: Imprint[]
}
```

### Quote API Response (`/api/v2/quotes/:id`)
```typescript
interface QuoteResponse {
  success: boolean
  quote: {
    id: number
    quote_number: string           // "Q-2025-1001"
    customer_id: number | null
    customer_name: string | null
    customer_email: string | null
    status: string                 // "draft"
    subtotal: string               // "500.00"
    tax_amount: string
    discount: string
    total: string                  // "541.25"
    customer_notes: string | null
    internal_notes: string | null
    expires_at: string | null
    created_at: string
    updated_at: string
  }
  line_items: QuoteLineItem[]
  artwork: Artwork[]
}

interface QuoteLineItem {
  id: number
  quote_id: number
  product_type: string | null      // "T-Shirt"
  print_method: string | null      // "Screen Print"
  description: string              // "Gildan 5000 - 2 color print"
  sizes: Record<string, number>    // {"S": 5, "M": 10, "L": 15, "XL": 10}
  total_quantity: number           // 40
  unit_price: string               // "12.50"
  line_total: string               // "500.00"
  colors: number | null            // 2
  locations: string[] | null       // ["front"]
  notes: string | null
}
```

---

## Options Analysis

### Option A: One Component, Two Data Sources
- OrderDetailPage accepts `mode: 'order' | 'quote'`
- Fetches from different endpoints based on mode
- Same layout, same UX

**Pros:**
- No duplication
- Consistent UI guaranteed

**Cons:**
- 2000-line component becomes more complex
- Conditional logic scattered throughout
- Harder to maintain

### Option B: Shared Layout Component
- Create `DetailPageLayout.tsx` with visual structure
- `OrderDetailPage` and `QuoteDetailPage` both use it
- Each page handles own data fetching

**Pros:**
- Separation of concerns
- Easier to reason about

**Cons:**
- Need to extract layout (significant refactor)
- Some duplication in wiring
- Two components to maintain

### Option C: Transform Quote to Order Shape (RECOMMENDED)
- Keep OrderDetailPage unchanged
- Create `useQuoteAsOrder(quoteId)` hook
- Transform quote API response → OrderDetail shape
- Route `/quotes/:id` → OrderDetailPage

**Pros:**
- Simplest implementation
- Reuses existing 2000-line component
- No changes to OrderDetailPage
- Consistent UX by default

**Cons:**
- Need transformation layer
- Some quote-specific features may need adaptation

---

## Recommended Approach: Option C

### Implementation Plan

#### Step 1: Create Quote-to-Order Transformer
File: `src/lib/quote-adapter.ts`

```typescript
import { OrderDetail, OrderDetailLineItem } from './hooks'
import { fetchQuote, Quote, QuoteLineItem } from './quote-api'

export function transformQuoteToOrder(quote: Quote, lineItems: QuoteLineItem[]): OrderDetail {
  return {
    id: quote.id,
    orderNumber: quote.quote_number,
    orderNickname: null,
    status: quote.status,
    printavoStatusName: mapQuoteStatus(quote.status),
    totalAmount: parseFloat(quote.total || '0'),
    amountOutstanding: parseFloat(quote.total || '0'), // Quotes haven't been paid
    dueDate: quote.expires_at || null,
    createdAt: quote.created_at,
    updatedAt: quote.updated_at,
    customer: {
      id: quote.customer_id || 0,
      name: quote.customer_name || 'No Customer',
      email: quote.customer_email || null,
      phone: null,
      company: null
    },
    customerPo: null,
    notes: quote.customer_notes,
    productionNotes: quote.internal_notes,
    artworkCount: 0,
    artworkFiles: [],
    lineItems: lineItems.map(transformQuoteLineItem)
  }
}

function transformQuoteLineItem(item: QuoteLineItem): OrderDetailLineItem {
  return {
    id: item.id,
    groupId: null,
    groupName: null,
    styleNumber: null,
    description: item.description,
    color: null,
    category: item.product_type,
    unitCost: parseFloat(item.unit_price || '0'),
    totalCost: parseFloat(item.line_total || '0'),
    totalQuantity: item.total_quantity,
    sizes: normalizeSizes(item.sizes),
    mockup: null,
    imprints: item.locations?.map((loc, i) => ({
      id: i,
      location: loc,
      decorationType: item.print_method,
      description: null,
      colorCount: item.colors,
      colors: null,
      width: null,
      height: null,
      hasUnderbase: null,
      stitchCount: null,
      mockups: []
    })) || []
  }
}

function normalizeSizes(sizes: Record<string, number>): OrderDetailLineItem['sizes'] {
  return {
    xs: sizes['XS'] || sizes['xs'] || 0,
    s: sizes['S'] || sizes['s'] || 0,
    m: sizes['M'] || sizes['m'] || 0,
    l: sizes['L'] || sizes['l'] || 0,
    xl: sizes['XL'] || sizes['xl'] || 0,
    xxl: sizes['XXL'] || sizes['2XL'] || sizes['xxl'] || 0,
    xxxl: sizes['XXXL'] || sizes['3XL'] || sizes['xxxl'] || 0,
    xxxxl: sizes['XXXXL'] || sizes['4XL'] || sizes['xxxxl'] || 0,
    xxxxxl: sizes['XXXXXL'] || sizes['5XL'] || sizes['xxxxxl'] || 0,
    other: sizes['other'] || sizes['Other'] || 0
  }
}

function mapQuoteStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'draft': 'Quote Draft',
    'sent': 'Quote Sent',
    'approved': 'Quote Approved',
    'rejected': 'Quote Rejected',
    'expired': 'Quote Expired'
  }
  return statusMap[status.toLowerCase()] || status
}
```

#### Step 2: Create useQuoteDetail Hook
File: `src/lib/hooks.ts` (add to existing)

```typescript
export function useQuoteDetail(quoteId: string | null) {
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const load = useCallback(async () => {
    if (!quoteId) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`${API_BASE}/api/v2/quotes/${quoteId}`)
      const data = await response.json()

      const transformed = transformQuoteToOrder(data.quote, data.line_items || [])
      setOrder(transformed)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load quote'))
    } finally {
      setLoading(false)
    }
  }, [quoteId])

  useEffect(() => { load() }, [load])

  return { order, loading, error, refetch: load }
}
```

#### Step 3: Add Mode Prop to OrderDetailPage
```typescript
interface OrderDetailPageProps {
  visualId: string
  mode?: 'order' | 'quote'  // Add this
  onViewCustomer?: (customerId: string) => void
}

export function OrderDetailPage({ visualId, mode = 'order', onViewCustomer }: OrderDetailPageProps) {
  // Use different hook based on mode
  const orderHook = useOrderDetail(mode === 'order' ? visualId : null)
  const quoteHook = useQuoteDetail(mode === 'quote' ? visualId : null)

  const { order, loading, error, refetch } = mode === 'order' ? orderHook : quoteHook

  // Rest of component unchanged...
}
```

#### Step 4: Update App.tsx Routing
```typescript
case 'quote-builder':
  return (
    <OrderDetailPage
      visualId={selectedQuoteId || ''}
      mode="quote"
      onViewCustomer={(id) => { /* ... */ }}
    />
  )
```

---

## Field Mapping Summary

| Order Field | Quote Field | Transform |
|-------------|-------------|-----------|
| `orderNumber` | `quote_number` | Direct |
| `orderNickname` | - | null |
| `printavoStatusName` | `status` | Map to display label |
| `totalAmount` | `total` | parseFloat |
| `dueDate` | `expires_at` | Direct |
| `customer.name` | `customer_name` | Direct |
| `customer.email` | `customer_email` | Direct |
| `notes` | `customer_notes` | Direct |
| `productionNotes` | `internal_notes` | Direct |
| `lineItems[].description` | `line_items[].description` | Direct |
| `lineItems[].unitCost` | `line_items[].unit_price` | parseFloat |
| `lineItems[].totalQuantity` | `line_items[].total_quantity` | Direct |
| `lineItems[].sizes` | `line_items[].sizes` | Normalize keys |
| `lineItems[].imprints[].location` | `line_items[].locations[]` | Array to objects |
| `lineItems[].imprints[].decorationType` | `line_items[].print_method` | Direct |

---

## Quote-Specific Features to Consider

1. **Status Badge Colors** - May need quote-specific colors
2. **Edit Permissions** - Quotes can be edited, orders may be locked
3. **"Send Quote" Button** - Replace "Send to Production" for quotes
4. **Approval Flow** - Quotes have approve/reject, orders don't
5. **Pricing Editable** - Quote prices editable, order prices locked

---

## Estimated Effort

| Task | Effort |
|------|--------|
| Create quote-adapter.ts | 1 hour |
| Add useQuoteDetail hook | 30 min |
| Add mode prop to OrderDetailPage | 30 min |
| Update App.tsx routing | 15 min |
| Test quote loading | 30 min |
| Handle quote-specific UI | 1-2 hours |
| **Total** | **4-5 hours** |

---

## Next Steps

1. Create `src/lib/quote-adapter.ts` with transformer
2. Add `useQuoteDetail` hook to `src/lib/hooks.ts`
3. Add `mode` prop to OrderDetailPage
4. Delete `QuoteBuilderPage.tsx` (replaced)
5. Update App.tsx routing
6. Test with real quote data
