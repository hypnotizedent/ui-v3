# Spark UI (ui-v3) - Claude Code Context

## 🎯 MISSION
Wire this Spark UI to the live Mint OS API so the dashboard displays real production data from Mint Prints.

---

## 🎯 CURRENT STATUS - v2.2.1 Order Detail Page (December 22, 2025)

### Completed Today
- [x] Quotes nav and routes added
- [x] Unified detail page (quotes use OrderDetailPage)
- [x] Quote-to-order conversion button
- [x] Quote API hooks created
- [x] quote-adapter.ts transforms quote → order shape
- [x] /api/v2/quotes endpoints working

### Order Detail Page - What Works
| Feature | Status | Notes |
|---------|--------|-------|
| Header with order # | ✅ | Shows orderNumber/quoteNumber |
| Customer info bar | ✅ | Name, email, phone |
| Line items table | ✅ | With sizes grid |
| Pricing totals | ✅ | Subtotal, tax, total |
| Status display | ✅ | Color-coded badges |
| Convert to Order | ✅ | Green button for quotes |
| Imprint details | ✅ | Location, type, colors |

### Order Detail Page - Issues
| Issue | Severity | Root Cause |
|-------|----------|------------|
| Mockups not showing (some orders) | MEDIUM | Order 6978 has 25 mockups ✅, Order 13689 has 1 ✅ |
| No status dropdown | HIGH | API endpoint missing, UI not built |
| Edits don't persist | HIGH | 8 handlers show toast only, no API calls |
| No line item add/delete | MEDIUM | API endpoints needed |
| Artwork gallery empty | MEDIUM | artworkFiles[] empty from API |

---

## 🚀 IMPLEMENTATION PLAN: Status Dropdown (v2.2.2)

### Overview
Replace static status Badge with clickable Select dropdown that calls API.

### Prerequisites (ronny-ops)
```bash
# API endpoint needed - doesn't exist yet
PATCH /api/orders/:id/status
Body: { "status": "COMPLETE" }
Returns: { "success": true, "order": {...} }
```

### Step 1: Check API Endpoint
```bash
# Test if endpoint exists
curl -X PATCH "https://mintprints-api.ronny.works/api/orders/6978/status" \
  -H "Content-Type: application/json" \
  -d '{"status": "SP - PRODUCTION"}'
```

**Current Result:** `{"error": "Not found"}` - **NEEDS BUILDING IN RONNY-OPS**

### Step 2: Available Status Values (from DB)
```
COMPLETE
DTG - PRODUCTION
INVOICE PAID
MATERIALS PENDING
PAYMENT NEEDED
QUOTE
Quote Out For Approval - Email
READY FOR PICK UP
SP - Need to Burn Screens
```

### Step 3: UI Location
**File:** `src/components/orders/OrderDetailPage.tsx`
**Lines:** 1229-1234 (current Badge display)

```typescript
// CURRENT (line 1229-1234):
<Badge
  variant="secondary"
  className={`${getAPIStatusColor(order.status)} font-medium text-xs uppercase tracking-wide px-1.5 py-0`}
>
  {getAPIStatusLabel(order.status)}
</Badge>

// REPLACE WITH:
<Select value={order.status} onValueChange={handleStatusChange}>
  <SelectTrigger className={`w-[180px] h-7 ${getAPIStatusColor(order.status)}`}>
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="QUOTE">Quote</SelectItem>
    <SelectItem value="Quote Out For Approval - Email">Quote Sent</SelectItem>
    <SelectItem value="PAYMENT NEEDED">Payment Needed</SelectItem>
    <SelectItem value="INVOICE PAID">Invoice Paid</SelectItem>
    <SelectItem value="MATERIALS PENDING">Materials Pending</SelectItem>
    <SelectItem value="SP - Need to Burn Screens">Burn Screens</SelectItem>
    <SelectItem value="SP - PRODUCTION">SP Production</SelectItem>
    <SelectItem value="DTG - PRODUCTION">DTG Production</SelectItem>
    <SelectItem value="READY FOR PICK UP">Ready for Pickup</SelectItem>
    <SelectItem value="COMPLETE">Complete</SelectItem>
  </SelectContent>
</Select>
```

### Step 4: Handler Implementation
```typescript
// Add after line ~1095 (handleConvertToOrder)
const handleStatusChange = async (newStatus: string) => {
  try {
    const response = await fetch(
      `${API_BASE}/api/orders/${order.id}/status`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      }
    );

    if (!response.ok) throw new Error('Failed to update status');

    toast.success(`Status changed to ${newStatus}`);
    refetch(); // Refresh order data
  } catch (error) {
    toast.error('Failed to update status');
  }
};
```

### Step 5: Imports Needed
```typescript
// Add to imports at top of file
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
```

### Testing
1. Navigate to `/orders/6978`
2. Click status dropdown
3. Select new status
4. Verify toast shows success
5. Refresh page - status should persist

### PrintShopPro Reference
**File:** `~/spark/print-shop-pro/src/components/JobDetail.tsx`
**Lines:** 386-400

---

### Next Steps - UI (v2.2.1+)

1. **Fix Mockup Display (API side)**
   - [ ] Check ronny-ops for mockup data in DB
   - [ ] Update API to return mockup URLs
   - [ ] Verify images load from files.ronny.works

2. **Port from print-shop-pro**
   - [ ] ArtworkUpload.tsx (242 lines) - file upload
   - [ ] ProductMockup.tsx (361 lines) - mockup display
   - [ ] DecorationManager.tsx (1,319 lines) - imprint editing
   - [ ] LineItemGrid.tsx (1,161 lines) - full editor

3. **Wire Saves to API**
   - [ ] Line item edits → PUT /api/orders/:id/line-items/:id
   - [ ] Add line item → POST /api/orders/:id/line-items
   - [ ] Image upload → POST /api/orders/:id/artwork
   - [ ] Status change → PUT /api/orders/:id/status

4. **Blocked Until API Ready**
   - [ ] Customer create (POST /api/customers)
   - [ ] Customer edit (PUT /api/customers/:id)
   - [ ] Mockup upload endpoint

### print-shop-pro Components to Port
| Component | Lines | Purpose | Priority |
|-----------|-------|---------|----------|
| ArtworkUpload.tsx | 242 | File upload with drag-drop | HIGH |
| ProductMockup.tsx | 361 | Mockup image display | HIGH |
| LineItemGrid.tsx | 1,161 | Full line item editor | HIGH |
| DecorationManager.tsx | 1,319 | Imprint/decoration editing | MEDIUM |
| PricingSummary.tsx | 115 | Pricing calculations | LOW |
| JobDetail.tsx | 709 | Order detail layout | REFERENCE |

---

## 🔌 UI WIRING GAPS (Audited Dec 22, 2025)

**Full audit:** `docs/AUDIT_UI_WIRING_GAPS.md`

### Critical (Blocking Daily Use)
| Feature | File | Handler | Line |
|---------|------|---------|------|
| Line item save | OrderDetailPage.tsx | `handleSave` | 1748 |
| Line item delete | OrderDetailPage.tsx | `handleDelete` | 1738 |
| Add line item | OrderDetailPage.tsx | `handleAddLineItem` | 1135 |
| Status change | OrderDetailPage.tsx | *missing* | - |
| Customer save | CustomerDetailPage.tsx | `handleSaveContact` | 164 |

### Important (Needed Soon)
| Feature | File | Handler | Line |
|---------|------|---------|------|
| Imprint save | OrderDetailPage.tsx | `handleSave` | 1532 |
| Imprint delete | OrderDetailPage.tsx | `handleDelete` | 1542 |
| Mockup upload | OrderDetailPage.tsx | `handleMockupUpload` | 1546 |
| Address save | CustomerDetailPage.tsx | `handleSaveAddress` | 182 |

### API Endpoints Needed (create in ronny-ops)
```
PATCH /api/orders/:id/status          # Change order status
POST  /api/orders/:id/line-items      # Add line item
PUT   /api/orders/:id/line-items/:id  # Update line item
DELETE /api/orders/:id/line-items/:id # Remove line item
POST  /api/orders/:id/artwork         # Upload artwork
PUT   /api/customers/:id              # Update customer
POST  /api/customers                  # Create customer
```

---

## 📚 Documentation Index

| Doc | Purpose |
|-----|---------|
| docs/AUDIT_UI_WIRING_GAPS.md | **UI elements needing API wiring** |
| docs/AUDIT_ORDER_DETAIL_FEATURES.md | Feature audit & mockup investigation |
| docs/ROADMAP_v2x_WIRE_APIS.md | Version roadmap |
| docs/PLAN_UNIFIED_DETAIL_PAGE.md | Unified order/quote detail page |
| docs/PORT_QUOTE_BUILDER.md | Quote Builder porting plan |
| docs/DISCOVERY_QUOTE_BUILDER_UI.md | PrintShopPro analysis |
| docs/PLAN_ORDER_DETAIL_v220.md | Order detail improvements |
| docs/DIAG_ORDER_DETAIL_PAGE.md | Order detail audit |
| docs/DIAG_PRINTSHOPPRO_COMPARISON.md | UI comparison |

---

## 📊 BACKEND STATUS (COMPLETE - DO NOT MODIFY)

| Entity | Count | Status |
|--------|-------|--------|
| Orders | 12,905 | ✅ Live |
| Customers | 3,325 | ✅ Live |
| Line Items | 43,076 | ✅ Live |
| Imprints | 7,965 | ✅ Live |
| Mockups | 31,920 | ✅ Live |

**API Base URL**: `https://mintprints-api.ronny.works`
**Files URL**: `https://files.ronny.works`

---

## 🔌 LIVE API ENDPOINTS

### Test Commands
```bash
# Health check
curl -s "https://mintprints-api.ronny.works/api/health" | jq

# Orders list
curl -s "https://mintprints-api.ronny.works/api/orders?limit=5" | jq

# Order detail (with line items, imprints, mockups)
curl -s "https://mintprints-api.ronny.works/api/orders/13689" | jq

# Customers
curl -s "https://mintprints-api.ronny.works/api/customers?limit=5" | jq
```

### Test Order IDs with Complete Data
- **6978** - Has 25 line items with mockups ✅
- **13648** - Has imprints
- **13689** - Papa's Raw Bar (mockups NOT in API response - needs API fix)
- **16** - Has line items with mockups

---

## 📋 API CONTRACT (EXACT FIELD NAMES)

### Orders List Response
```typescript
interface OrdersListResponse {
  orders: OrderSummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface OrderSummary {
  id: number;
  visual_id: string;           // Display ID like "13689"
  order_nickname: string;      // Job name
  customer_name: string;       // Contact name (first + last), falls back to company
  customer_company: string;    // Company/business name
  customer_id: number;
  printavo_status_name: string; // Status text
  total_amount: string;        // e.g. "1303.66"
  due_date: string | null;
  created_at: string;
}
```

**Order Card Display:**
```
Line 1: customer_name     → "Jonathan Lieberman"
Line 2: customer_company  → "PTP Universal" (if different from name)
```

### Order Detail Response
```typescript
interface OrderDetailResponse {
  id: number;
  visual_id: string;
  order_nickname: string;
  printavo_status_name: string;
  total: string;
  due_date: string | null;
  created_at: string;
  updated_at: string;

  customer: {
    id: number;
    company: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };

  lineItems: LineItem[];
  mockups: Mockup[];
}

interface LineItem {
  id: number;
  style_description: string;
  style_number: string;
  color: string;
  total_quantity: number;
  unit_cost: string;
  size_xs: number;
  size_s: number;
  size_m: number;
  size_l: number;
  size_xl: number;
  size_2_xl: number;
  size_3_xl: number;
  imprints: Imprint[];
}

interface Imprint {
  id: number;
  description: string;
  location: string;
  decoration_type: string;  // "Screen Print", "Embroidery", "DTG"
}

interface Mockup {
  id: number;
  full_url: string;         // https://files.ronny.works/artwork/...
  thumbnail_url: string;
  order_visual_id: string;
}
```

---

## 🔧 FIELD MAPPING (API → Frontend)

| API Returns | Frontend Should Use | Notes |
|-------------|---------------------|-------|
| `visual_id` | `visualId` | camelCase in JS |
| `order_nickname` | `nickname` or `orderNickname` | Job name |
| `printavo_status_name` | `status` | Status badge text |
| `customer_name` | `customerName` | Contact name (person) |
| `customer_company` | `customerCompany` | Business name |
| `total_amount` | `total` | Order total |
| `total_quantity` | `totalQuantity` | Per line item |
| `decorationType` | `decorationType` | For imprint badges (already camelCase) |

---

## 🎨 STATUS BADGE COLORS

```typescript
const statusColors: Record<string, string> = {
  'QUOTE': 'gray',
  'Quote Approved': 'blue',
  'COMPLETE': 'green',
  'Cancelled': 'red',
  // Screen Print statuses
  'SP - PRODUCTION': 'emerald',
  'SP - Preproduction': 'lime',
  // Embroidery statuses
  'EMB - PRODUCTION': 'blue',
  'EMB - Preproduction': 'sky',
  // Default
  'default': 'purple'
};
```

---

## 🖼️ MOCKUP HANDLING

### URL Format
All mockups served from MinIO:
```
https://files.ronny.works/artwork/{filename}
```

### PDF Detection
PDFs cannot be displayed as `<img>`. Must detect and handle:
```typescript
const isPDF = (url: string) => url?.toLowerCase().endsWith('.pdf');

// In render:
{isPDF(mockup.full_url) ? (
  <a href={mockup.full_url} target="_blank" className="pdf-link">
    📄 View PDF
  </a>
) : (
  <img src={mockup.full_url} alt="Mockup" />
)}
```

---

## 📝 TASKS

### 1. Audit Current State
```bash
cat src/lib/api-adapter.ts
cat src/pages/Dashboard.tsx
cat src/pages/OrderDetailPage.tsx
```

### 2. Fix API Adapter
Update `src/lib/api-adapter.ts` to:
- Point to `https://mintprints-api.ronny.works`
- Map snake_case API fields to camelCase
- Handle nested lineItems, imprints, mockups

### 3. Wire Orders List
- Fetch from `/api/orders`
- Display visual_id, order_nickname, customer_name, status
- Show line_item_count

### 4. Wire Order Detail
- Fetch from `/api/orders/:id`
- Display customer info
- Render line items with sizes
- Show imprints with decoration_type badges
- Display mockups (handle PDFs)

### 5. Remove Mock Data
- Delete or ignore any dev/mock data files
- Ensure all data comes from live API

---

## 🚀 DEPLOYMENT

1. Commit & push:
```bash
git add .
git commit -m "feat: wire real API data"
git push origin main
```

2. Spark auto-syncs from GitHub
3. Click "Publish" in Spark UI
4. Hard refresh browser (Cmd+Shift+R)

---

## ⚠️ IMPORTANT RULES

### API Issues:
- If API returns wrong/missing data → **fix the API** in `ronny-ops/02_Applications/mint-os/dashboard-api/`
- Frontend adapters only transform shape (camelCase), never compensate for missing API data
- See `docs/REF_FRONTEND_API_CONTRACT.md` for full API contract

### DO NOT:
- Use mock/dev data in production
- Add workarounds for API bugs in frontend
- Re-run Printavo sync (data is complete)

### DO:
- Use real API endpoints
- Handle API errors gracefully
- Test with order IDs: 13689, 13648, 6978
- Check browser console for errors
- Verify mockup images load from files.ronny.works

---

## ✅ SUCCESS CRITERIA

- [ ] Orders list loads from real API (should show ~12,905 total)
- [ ] Order detail shows all line items with quantities
- [ ] Mockups display correctly (no broken images)
- [ ] PDF mockups show link instead of broken image
- [ ] Imprints display with decoration type badges
- [ ] Customer info displays correctly
- [ ] No console errors
- [ ] No references to mock/dev data

---

## 📁 KEY FILES

```
src/
├── lib/
│   └── api-adapter.ts    # API calls & transformers (MAIN FILE TO EDIT)
├── pages/
│   ├── Dashboard.tsx     # Orders list
│   └── OrderDetailPage.tsx # Single order view
├── components/           # UI components
└── data/
    └── index.ts          # Mock data (REMOVE dependency on this)
```
