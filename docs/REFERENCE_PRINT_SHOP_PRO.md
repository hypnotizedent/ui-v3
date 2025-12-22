# Print Shop Pro - Feature Reference for ui-v3

> Generated: December 22, 2025
> Purpose: Document advanced components from print-shop-pro worth porting to ui-v3

---

## Overview

**Repository:** `~/spark/print-shop-pro/`
**Type:** Full-featured print shop management system (reference/inspiration)
**Components:** 69+ components across 8 domains
**Tech Stack:** React, TypeScript, Vite, Tailwind, Phosphor Icons, shadcn/ui

---

## Feature Categories

### Tier 1: High Priority (Port Soon)

These features directly enhance the dashboard experience:

| Feature | Component(s) | Why Port? |
|---------|--------------|-----------|
| **Global Search** | `GlobalSearch.tsx` | Cmd+K search across orders, customers |
| **Keyboard Shortcuts** | `KeyboardShortcutsHelp.tsx`, `use-keyboard-shortcuts.ts` | Power user navigation |
| **Status Filter Pills** | `StatusFilterPills.tsx` | Quick filter by order status |
| **Loading Skeletons** | `skeletons/*.tsx` | Better loading UX |
| **Job/Order Cards** | `JobCard.tsx`, `QuoteCard.tsx` | Card-based order views |

### Tier 2: Medium Priority (Add After Core)

Features that add significant value:

| Feature | Component(s) | Why Port? |
|---------|--------------|-----------|
| **Customer Detail** | `CustomerDetail.tsx` | Full customer profile with history |
| **Artwork Library** | `CustomerArtworkLibrary.tsx` | Per-customer artwork storage |
| **Email History** | `EmailNotificationHistory.tsx` | Communication timeline |
| **Production Calendar** | `ProductionCalendar.tsx` | Calendar view of orders by due date |
| **Reports Dashboard** | `Reports.tsx` | Sales analytics, conversion rates |

### Tier 3: Advanced Features (Future)

Nice-to-have features for later phases:

| Feature | Component(s) | Why Port? |
|---------|--------------|-----------|
| **Quote Builder** | `QuoteBuilder.tsx`, `LineItemGrid.tsx` | Create/edit quotes |
| **Decoration Manager** | `DecorationManager.tsx` | Imprint configuration UI |
| **Pricing Rules** | `PricingRulesManager.tsx` | Customer-specific pricing |
| **Purchase Orders** | `PurchaseOrderManager.tsx` | Inventory tracking |
| **Supplier APIs** | `ssactivewear-api.ts`, `sanmar-api.ts` | Product catalog integration |

---

## Component Details

### 1. Global Search (Tier 1)
**File:** `src/components/GlobalSearch.tsx`

**Features:**
- Searches across orders, jobs, customers simultaneously
- Keyboard activated (Cmd+K)
- Shows categorized results
- Highlights matching text

**Props:**
```typescript
interface GlobalSearchProps {
  quotes: Quote[]
  jobs: Job[]
  customers: Customer[]
  onSelectQuote: (quote: Quote) => void
  onSelectJob: (job: Job) => void
  onSelectCustomer: (customer: Customer) => void
}
```

**Port Notes:**
- Adapt to search orders, customers from real API
- Add debounced search for large datasets
- Consider server-side search for 12k+ orders

---

### 2. Keyboard Shortcuts (Tier 1)
**File:** `src/hooks/use-keyboard-shortcuts.ts`

**Features:**
- Register global keyboard shortcuts
- Supports meta/ctrl/shift modifiers
- Context-aware (different shortcuts per view)

**Shortcuts Implemented:**
| Shortcut | Action |
|----------|--------|
| `Cmd+N` | New quote/job |
| `Cmd+K` | Focus search |
| `Cmd+1-7` | Navigate sections |
| `Shift+?` | Show shortcuts help |
| `Esc` | Close dialogs |

**Hook API:**
```typescript
useKeyboardShortcuts([
  { key: 'n', metaKey: true, callback: () => handleNew() },
  { key: 'k', metaKey: true, callback: () => focusSearch() },
])
```

---

### 3. Status Filter Pills (Tier 1)
**File:** `src/components/StatusFilterPills.tsx`

**Features:**
- Horizontal scrollable filter chips
- Click to filter by status
- Shows count per status
- Active state highlighting

**UI Pattern:**
```
[All (125)] [Quote (23)] [Approved (18)] [Production (45)] [Complete (39)]
```

---

### 4. Loading Skeletons (Tier 1)
**Files:** `src/components/skeletons/`
- `CardSkeleton.tsx` - Order card placeholder
- `ListSkeleton.tsx` - Table/list placeholder
- `DetailSkeleton.tsx` - Detail page placeholder
- `TableSkeleton.tsx` - Data table placeholder
- `ProductCatalogSkeleton.tsx` - Product grid placeholder

**Usage Pattern:**
```typescript
{isLoading ? <CardSkeleton /> : <OrderCard order={order} />}
```

---

### 5. Order/Job Cards (Tier 1)
**Files:** `JobCard.tsx`, `QuoteCard.tsx`

**Card Layout:**
```
┌─────────────────────────────────────┐
│ #13689 • SP - PRODUCTION     [BADGE]│
│ Papa's Raw Bar                      │
│ Order Nickname                      │
├─────────────────────────────────────┤
│ Due: Jan 15  •  $1,303.66           │
│ 3 items • 150 units                 │
└─────────────────────────────────────┘
```

**Key Props:**
```typescript
interface JobCardProps {
  job: Job
  onStatusChange: (status: JobStatus) => void
  onSelect: () => void
  onUpdateNickname: (nickname: string) => void
}
```

---

### 6. Customer Detail (Tier 2)
**File:** `src/components/CustomerDetail.tsx`

**Sections:**
1. Contact info (name, email, phone, company)
2. Customer tier badge (Standard, Preferred, VIP)
3. Order history (quotes + jobs)
4. Artwork library (per-customer files)
5. Email notification history
6. Tax certificates
7. Email preferences
8. SMS opt-outs

**Key Features:**
- Collapsible sections
- Quick quote creation from customer
- Inline editing
- Stats display (total orders, total spent)

---

### 7. Artwork Library (Tier 2)
**File:** `src/components/CustomerArtworkLibrary.tsx`

**Features:**
- Per-customer artwork storage
- Version history tracking
- File type icons (PDF, AI, PNG, etc.)
- Drag-and-drop upload
- Reuse artwork across orders

**Data Structure:**
```typescript
interface CustomerArtworkFile {
  id: string
  customerId: string
  filename: string
  fileUrl: string
  fileType: string
  uploadedAt: string
  currentVersion: number
  versionHistory: ArtworkVersion[]
  tags: string[]
}
```

---

### 8. Production Calendar (Tier 2)
**File:** `src/components/ProductionCalendar.tsx`

**Features:**
- Calendar view of orders by due date
- Color-coded by status
- Click to view order details
- Filter by status, customer, etc.
- Day/Week/Month views

---

### 9. Reports Dashboard (Tier 2)
**File:** `src/components/Reports.tsx`

**Report Types:**
- Sales by period (day/week/month)
- Quote conversion rate
- Average order value
- Revenue by customer
- Production capacity utilization
- Unpaid balances

---

### 10. Decoration Manager (Tier 3)
**File:** `src/components/DecorationManager.tsx`

**Features:**
- Configure imprints per line item
- Preset templates (Front Logo, Front+Back, etc.)
- Location selection (Front, Back, Sleeve, etc.)
- Method selection (Screen Print, Embroidery, DTG)
- Color count tracking
- Size validation per product type
- Setup fee calculation

**Presets:**
```typescript
const DECORATION_PRESETS = [
  { name: 'Front Logo Only', locations: ['Front'] },
  { name: 'Front + Back', locations: ['Front', 'Back'] },
  { name: 'Full Coverage', locations: ['Front', 'Back', 'Left Sleeve', 'Right Sleeve'] },
]
```

---

### 11. Pricing Summary (Tier 3)
**File:** `src/components/PricingSummary.tsx`

**Features:**
- Subtotal calculation
- Discount (% or fixed)
- Tax rate with exempt toggle
- Grand total
- Real-time calculation

---

## Services Worth Porting

### Email System
**Files:**
- `src/lib/email-notifications.ts` - Send notifications
- `src/lib/email-preferences.ts` - Per-customer preferences

**Notification Types:**
- Quote approval request
- Quote approved confirmation
- Invoice/payment reminder
- Order status update
- Shipping notification

### Supplier APIs (Reference Only)
**Files:**
- `src/lib/ssactivewear-api.ts` - S&S Activewear integration
- `src/lib/sanmar-api.ts` - SanMar integration

**Capabilities:**
- Product search by style/keyword
- Inventory levels
- Pricing tiers
- Color/size availability

---

## UI Patterns to Adopt

### 1. Collapsible Sections
Used in CustomerDetail, QuoteBuilder:
```tsx
<Collapsible open={isOpen} onOpenChange={setIsOpen}>
  <CollapsibleTrigger asChild>
    <Button variant="ghost">
      {isOpen ? <CaretDown /> : <CaretRight />}
      Section Title
    </Button>
  </CollapsibleTrigger>
  <CollapsibleContent>
    {/* Content */}
  </CollapsibleContent>
</Collapsible>
```

### 2. Status Badge Colors
```typescript
const statusColors = {
  quote: 'bg-gray-500',
  approved: 'bg-blue-500',
  production: 'bg-emerald-500',
  complete: 'bg-green-500',
  cancelled: 'bg-red-500',
}
```

### 3. Empty State Pattern
```tsx
<div className="flex flex-col items-center justify-center py-12 text-center">
  <IconComponent className="h-12 w-12 text-muted-foreground mb-4" />
  <h3 className="text-lg font-medium">No items found</h3>
  <p className="text-sm text-muted-foreground mt-1">
    Try adjusting your filters or create a new item.
  </p>
  <Button className="mt-4" onClick={onCreate}>
    Create New
  </Button>
</div>
```

### 4. Inline Editing Pattern
```tsx
const [isEditing, setIsEditing] = useState(false)
const [value, setValue] = useState(initialValue)

{isEditing ? (
  <Input
    value={value}
    onChange={(e) => setValue(e.target.value)}
    onBlur={() => { save(); setIsEditing(false) }}
    autoFocus
  />
) : (
  <span onClick={() => setIsEditing(true)} className="cursor-pointer hover:underline">
    {value || 'Click to edit'}
  </span>
)}
```

---

## Data Models Reference

### Job (Order equivalent)
```typescript
interface Job {
  id: string
  job_number: string
  quote_id?: string
  status: JobStatus
  customer: Customer
  line_items: LineItem[]
  due_date: string
  ship_date?: string
  production_notes?: string
  artwork_approved: boolean
  assigned_to: string[]
  progress: number
  nickname?: string
  expenses?: Expense[]
}
```

### LineItem
```typescript
interface LineItem {
  id: string
  product_name: string
  style_number: string
  color: string
  sizes: SizeBreakdown
  quantity: number
  unit_price: number
  decorations: Decoration[]
  artwork?: ArtworkFile[]
}
```

### Customer
```typescript
interface Customer {
  id: string
  name: string
  company?: string
  email: string
  phone?: string
  tier?: 'standard' | 'preferred' | 'vip'
  emailPreferences?: EmailPreferences
  notes?: string
  createdAt?: string
}
```

---

## Implementation Priority for ui-v3

### Phase 1: Core Enhancements
1. Add loading skeletons to Dashboard, OrderDetail, Customers
2. Port StatusFilterPills for order filtering
3. Improve order cards with JobCard patterns
4. Add keyboard shortcuts hook

### Phase 2: Search & Navigation
1. Port GlobalSearch component
2. Add KeyboardShortcutsHelp dialog
3. Implement Cmd+K workflow

### Phase 3: Customer Experience
1. Port CustomerDetail with order history
2. Add basic artwork library concept
3. Implement email history view

### Phase 4: Advanced Features
1. Production calendar view
2. Reports dashboard
3. Decoration/imprint management (if needed)

---

## Files to Copy Directly

These can be ported with minimal changes:

```
# Hooks
src/hooks/use-keyboard-shortcuts.ts → copy directly
src/hooks/use-mobile.ts → already have similar

# Skeletons
src/components/skeletons/*.tsx → copy all

# Utilities
src/lib/data.ts (generators) → adapt for our types
```

---

## Summary

print-shop-pro is a mature, feature-rich reference that provides:
- **69+ components** organized by domain
- **Keyboard-first navigation** patterns
- **Advanced UX patterns** (inline editing, collapsible sections)
- **Business logic** (pricing, decorations, email)
- **Supplier integrations** (S&S, SanMar APIs)

Focus on Tier 1 features first to immediately improve ui-v3 UX.
