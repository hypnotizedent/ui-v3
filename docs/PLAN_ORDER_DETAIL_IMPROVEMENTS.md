# Order Detail Page Improvements Plan

**Created:** 2025-12-23
**Status:** PLANNING - DO NOT IMPLEMENT
**Target:** OrderDetailPage.tsx (main) and OrderDetailPagePSP.tsx (alternate view)

---

## 1. Current State Analysis

### Page Structure (OrderDetailPage.tsx - ~2,900 lines)
```
┌─────────────────────────────────────────────────────────────────┐
│ Header Row 1: ← Back | Order # | Nickname | [Status▼] | Total  │
│ Header Row 2: Customer · Company · Email · Files · Paid · Due  │
├─────────────────────────────────────────────────────────────────┤
│ LINE ITEMS CARD                                                 │
│ ├─ Table with expandable rows                                   │
│ ├─ Mockup thumbnail per line item (inline)                     │
│ ├─ Sizes columns (configurable)                                │
│ └─ Imprints nested under each line item                        │
├─────────────────────────────────────────────────────────────────┤
│ PRICING SIDEBAR (right column on wide screens)                  │
│ ├─ Subtotal, Tax, Total, Paid, Balance                         │
│ └─ Production Files thumbnails                                 │
├─────────────────────────────────────────────────────────────────┤
│ PRODUCTION NOTES CARD                                          │
├─────────────────────────────────────────────────────────────────┤
│ ORDER NOTES CARD                                                │
├─────────────────────────────────────────────────────────────────┤
│ CUSTOMER EDIT DIALOG (modal)                                   │
│ CREATE CUSTOMER DIALOG (modal)                                 │
└─────────────────────────────────────────────────────────────────┘
```

### API Data Structure (from /api/orders/:id)
```typescript
Order {
  id, visualId, orderNumber, orderNickname,
  status, printavoStatusName,
  totalAmount, salesTax, amountPaid, amountOutstanding,
  dueDate, customerDueDate,
  notes, productionNotes,
  customer: { id, name, email, phone, company },
  lineItems: [{
    id, description, styleNumber, color, category,
    unitCost, totalQuantity, totalCost,
    sizes: { xs, s, m, l, xl, xxl, xxxl, ... },
    mockup: { id, url, thumbnailUrl } | null,  // LINE ITEM LEVEL
    imprints: [{
      id, location, decorationType, description,
      colorCount, colors, width, height,
      mockups: []  // IMPRINT LEVEL (currently always empty)
    }]
  }],
  artworkFiles: [...],
  imprintMockups: []  // ORDER LEVEL (currently always empty)
}
```

### Key Findings

| Aspect | Current State | Issue |
|--------|---------------|-------|
| Mockup Storage | Line item level only | Imprint mockups not populated from API |
| Location Field | Free text input | No autocomplete, typos common |
| Decoration Type | Free text input | No standardization |
| Size Columns | Configurable via settings | Good - auto-shows columns with data |
| More Actions | Print + Email only | Missing: Duplicate, Archive, Delete, Shipping |
| Page Height | Requires scroll | Notes/Pricing below fold |

---

## 2. Mockups Inline Integration Plan

### Current Mockup Flow
1. Line items have `mockup` field with `{ id, url, thumbnailUrl }`
2. Imprints have `mockups[]` array but always empty
3. PSP page collects all mockups into separate "MOCKUPS & ARTWORK" section
4. Main page shows mockup thumbnail inline in line item row

### Problem
- Mockups are associated with LINE ITEMS, not specific imprints/decorations
- Users want to see artwork for each decoration location (Front art, Back art, etc.)
- Current data model doesn't support imprint-level mockups

### Recommended Solution

**Option A: Keep Line Item Level (Minimal Change)**
- Keep mockup at line item level
- Show thumbnail in line item row (current behavior)
- Remove separate "MOCKUPS & ARTWORK" section from PSP page
- ✅ No API changes needed

**Option B: Add Imprint-Level Mockups (Better UX)**
- API change: Populate `imprints[].mockups[]` from database
- UI change: Show mockup thumbnail per imprint location
- Show thumbnail next to "Left Chest Embroidery" text
- ⚠️ Requires API investigation

### API Research Needed
```sql
-- Check if mockups have imprint associations in database
SELECT m.id, m.file_url, m.line_item_id, m.imprint_id
FROM mockups m
WHERE m.imprint_id IS NOT NULL
LIMIT 10;
```

### Recommendation
Start with **Option A** (remove separate section, keep inline).
Investigate **Option B** for future enhancement if imprint_id exists in mockups table.

---

## 3. Single Page Layout Plan

### Current Scroll Requirements
On 1080p laptop, user must scroll to see:
- Production Notes card
- Order Notes card
- (Pricing is already in sidebar, visible)

### Proposed Layout Changes

#### Change 1: Collapse Notes by Default
```tsx
// Add collapsible state
const [notesExpanded, setNotesExpanded] = useState(false);

// Render as expandable section
<Collapsible open={notesExpanded} onOpenChange={setNotesExpanded}>
  <CollapsibleTrigger className="flex items-center gap-2">
    <CaretRight className={notesExpanded ? 'rotate-90' : ''} />
    <span>Notes ({hasNotes ? '1' : '0'})</span>
  </CollapsibleTrigger>
  <CollapsibleContent>
    {/* Production Notes + Order Notes */}
  </CollapsibleContent>
</Collapsible>
```

#### Change 2: Inline Totals Row
Move pricing summary to bottom of line items table:
```
│ LINE ITEMS TABLE                                           │
├────────────────────────────────────────────────────────────┤
│ [Mockup] K540 Navy | XS:0 S:0 M:5 ... | $18.28 | $91.40   │
│          └ Left Chest Embroidery [+]                       │
├────────────────────────────────────────────────────────────┤
│                    Subtotal: $274.20 | Tax: $7 | $320.14  │
└────────────────────────────────────────────────────────────┘
```

#### Change 3: Compact Header
Already good - has Order #, Status, Total in header row.

### Implementation Steps
1. Add `<Collapsible>` component for notes sections
2. Move subtotal/tax/total to table footer row
3. Remove separate Pricing Card (keep only in sidebar for wide screens)
4. Test on 1080p viewport

---

## 4. Decoration Fields Recommendations

### Current State
- **Location**: Free text input
- **Decoration Type**: Free text input
- **Colors**: Free text input

### Data Analysis (from Printavo imports)
Common locations seen in API:
- "Left Chest Embroidery" (with typo "Embridoery")
- "Front"
- "Back"
- "Full Back"
- "Sleeve"

Common decoration types:
- "Screen Print"
- "Embroidery"
- "DTG"
- "Vinyl"
- "Heat Transfer"

### Recommendation: Combobox with Suggestions

```tsx
// Instead of plain Input, use Combobox
const LOCATION_SUGGESTIONS = [
  'Front', 'Back', 'Full Front', 'Full Back',
  'Left Chest', 'Right Chest', 'Left Sleeve', 'Right Sleeve',
  'Nape', 'Pocket', 'Custom'
];

const DECORATION_SUGGESTIONS = [
  'Screen Print', 'Embroidery', 'DTG', 'Vinyl',
  'Heat Transfer', 'Sublimation', 'Digital Print'
];

<Combobox
  options={LOCATION_SUGGESTIONS}
  value={location}
  onValueChange={setLocation}
  placeholder="Select or type location..."
  allowCustom={true}  // Allow freeform entry
/>
```

### Benefits
- Reduces typos
- Standardizes common values
- Still allows custom entries
- Better autocomplete UX

### Implementation
1. Create `<Combobox>` component (or use shadcn/ui combobox)
2. Define suggestion arrays from historical data
3. Replace `<Input>` with `<Combobox>` for location/type fields
4. Keep `allowCustom={true}` for flexibility

---

## 5. Size Columns Configuration Plan

### Current Implementation (Good!)
Already implemented in `LineItemsTable`:
- `ALL_SIZE_COLUMNS` array with 20 sizes
- `ColumnConfig` with baby/youth/adult categories
- `getVisibleSizeColumns()` auto-shows columns with data
- Settings gear icon to configure visible columns

### Available Sizes
```typescript
const ALL_SIZE_COLUMNS = [
  // Baby/Toddler (8)
  '6M', '12M', '18M', '24M', '2T', '3T', '4T', '5T',
  // Youth (5)
  'Y-XS', 'Y-S', 'Y-M', 'Y-L', 'Y-XL',
  // Adult (10)
  'XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL', '6XL'
];
```

### Current Config Storage
- Uses `useKV` hook with key `'order-column-config'`
- Persists to localStorage
- Default shows: S, M, L, XL, 2XL, 3XL

### Recommendation: No Changes Needed
Current implementation is solid. Consider:
1. Add "Reset to Default" button in settings
2. Add preset configurations (e.g., "Youth Only", "Adult Only")

---

## 6. More Actions Menu Implementation

### Current Actions (MoreActionsMenu.tsx)
- ✅ Print Work Order (`window.print()`)
- ✅ Email Invoice (`mailto:` link)

### Missing Actions (Priority Order)

#### 1. Duplicate Order (HIGH)
```typescript
onDuplicate: async () => {
  const response = await fetch(`${API_BASE}/api/orders/${orderId}/duplicate`, {
    method: 'POST'
  });
  const { order } = await response.json();
  toast.success(`Order duplicated as #${order.visual_id}`);
  navigate(`/orders/${order.visual_id}`);
}
```
**API Required:** `POST /api/orders/:id/duplicate`

#### 2. Archive Order (MEDIUM)
```typescript
onArchive: async () => {
  if (!confirm('Archive this order?')) return;
  await fetch(`${API_BASE}/api/orders/${orderId}/archive`, { method: 'POST' });
  toast.success('Order archived');
  navigate('/orders');
}
```
**API Required:** `POST /api/orders/:id/archive`

#### 3. Delete Order (LOW - Dangerous)
```typescript
onDelete: async () => {
  if (!confirm('DELETE this order? This cannot be undone.')) return;
  await fetch(`${API_BASE}/api/orders/${orderId}`, { method: 'DELETE' });
  toast.success('Order deleted');
  navigate('/orders');
}
```
**API Required:** `DELETE /api/orders/:id`

#### 4. Download PDF Invoice (MEDIUM)
```typescript
onDownloadPdf: async () => {
  window.open(`${API_BASE}/api/orders/${orderId}/pdf`, '_blank');
}
```
**API Required:** `GET /api/orders/:id/pdf` (returns PDF)

#### 5. EasyPost Shipping Label (FUTURE)
```typescript
// Opens modal to configure shipping
onCreateShipment: () => setShipmentModalOpen(true);
```
**API Required:**
- `POST /api/orders/:id/shipments` (create label)
- `GET /api/orders/:id/shipments` (list shipments)
- Requires EasyPost API key configuration

### Implementation Order
1. Duplicate Order (most requested)
2. Download PDF
3. Archive Order
4. Delete Order
5. EasyPost Integration (separate project)

---

## 7. API Changes Required

| Endpoint | Method | Purpose | Priority |
|----------|--------|---------|----------|
| `/api/orders/:id/duplicate` | POST | Clone order with new ID | HIGH |
| `/api/orders/:id/pdf` | GET | Generate PDF invoice | HIGH |
| `/api/orders/:id/archive` | POST | Soft-delete/archive | MEDIUM |
| `/api/orders/:id` | DELETE | Hard delete | LOW |
| `/api/orders/:id/shipments` | POST/GET | EasyPost integration | FUTURE |

### Existing APIs (Working)
- `GET /api/orders/:id` ✅
- `PATCH /api/orders/:id` ✅ (status, nickname, notes)
- `POST /api/orders/:id/line-items` ✅
- `PUT /api/orders/:id/line-items/:id` ✅
- `DELETE /api/orders/:id/line-items/:id` ✅
- `POST /api/orders/:id/imprints` ✅
- `PATCH /api/orders/:id/imprints/:id` ✅

---

## 8. UI Component Changes Required

### OrderDetailPage.tsx Changes
| Component | Change | Effort |
|-----------|--------|--------|
| Notes Section | Wrap in `<Collapsible>` | Small |
| Pricing Summary | Add inline row to LineItemsTable | Medium |
| Location Input | Replace with `<Combobox>` | Small |
| Type Input | Replace with `<Combobox>` | Small |
| MoreActionsMenu | Add new action handlers | Medium |

### New Components Needed
| Component | Purpose |
|-----------|---------|
| `Combobox` | Autocomplete with custom input |
| `ShipmentModal` | EasyPost shipping configuration |
| `PdfPreviewModal` | Invoice preview before download |

### PSP Page (OrderDetailPagePSP.tsx)
| Change | Effort |
|--------|--------|
| Remove "MOCKUPS & ARTWORK" section | Small |
| Line items already show mockups inline | None |

---

## 9. Estimated Effort

| Task | Effort | Dependencies |
|------|--------|--------------|
| Collapsible notes | 1 hour | None |
| Inline pricing row | 2 hours | None |
| Combobox for fields | 2 hours | None |
| Duplicate Order | 2 hours | API endpoint |
| Download PDF | 1 hour | API endpoint |
| Archive Order | 1 hour | API endpoint |
| Remove PSP mockups section | 30 min | None |

**Total Frontend:** ~10 hours

**API Work (ronny-ops):**
- Duplicate endpoint: 2 hours
- PDF generation: 4 hours (needs template)
- Archive endpoint: 1 hour

---

## 10. Priority Order

### Phase 1: Quick Wins (No API Changes)
1. ✅ Collapsible notes sections
2. ✅ Combobox for location/type fields
3. ✅ Remove PSP mockups section (keep inline)

### Phase 2: Layout Improvements
4. Inline pricing summary row
5. Size column presets

### Phase 3: Actions (Requires API)
6. Duplicate Order
7. Download PDF Invoice
8. Archive Order

### Phase 4: Future
9. Delete Order (with safeguards)
10. EasyPost Shipping Integration

---

## Appendix: Research Data

### Sample Order Response (13691)
```json
{
  "orderNickname": "FENDI CHÂTEAU R/O",
  "totalAmount": 320.14,
  "salesTax": 7,
  "customer": "Katie Perri",
  "lineItems": [{
    "mockup": {
      "id": "58850",
      "url": "https://cdn.filepicker.io/...",
      "thumbnailUrl": "https://cdn.filestackcontent.com/..."
    },
    "imprints": [{
      "location": "Left Chest Embridoery",
      "decorationType": "Embroidery"
    }]
  }]
}
```

### Size Columns Available in API
```
xs, s, m, l, xl, xxl, xxxl, xxxxl, xxxxxl, other
```
(Youth/baby sizes may be in DB but not exposed in API)
