# UI Data Fields Audit

> Generated: December 21, 2025
> Purpose: Document every field the Spark UI expects from the API

---

## Orders List View (Dashboard.tsx, OrdersList.tsx)

| Field | Component | Display Purpose | Source |
|-------|-----------|-----------------|--------|
| `id` | OrderCard | Key for React | API |
| `visual_id` | OrderCard | "#13708" header | API |
| `order_nickname` | OrderCard | Job name subtitle | API |
| `nickname` | Dashboard | Alias for order_nickname | Adapter |
| `customer_name` | OrderCard | Contact person name | API |
| `customer_company` | OrderCard | Business name (if different) | API |
| `printavo_status_name` | OrderCard | Status badge text | API |
| `status` | OrderCard | Mapped status enum | Adapter |
| `total_amount` | OrderCard | Price display | API |
| `total` | Dashboard | Alias for total_amount | Adapter |
| `due_date` | OrderCard | Due date display | API |
| `line_items[]` | Dashboard | Item count calculation | API |
| `line_items[].quantity` | Dashboard | Sum for "X items" badge | Adapter |

---

## Order Detail View (OrderDetailPage.tsx, OrderDetail.tsx)

### Order Fields
| Field | Component | Display Purpose | Source |
|-------|-----------|-----------------|--------|
| `id` | OrderDetailPage | Internal ID | API |
| `orderNumber` | OrderDetailPage | Display "#13689" | API (camelCase) |
| `orderNickname` | OrderDetailPage | Job name | API (camelCase) |
| `status` | OrderDetailPage | Status badge | API |
| `totalAmount` | OrderDetailPage | Order total | API (camelCase) |
| `amountOutstanding` | OrderDetailPage | Balance due | API (camelCase) |
| `dueDate` | OrderDetailPage | Due date | API (camelCase) |
| `createdAt` | OrderDetailPage | Created date | API (camelCase) |
| `notes` | OrderDetailPage | Customer notes | API |
| `productionNotes` | OrderDetailPage | Production notes | API (camelCase) |
| `artworkFiles[]` | OrderDetailPage | Artwork gallery | API (camelCase) |

### Customer Fields (nested in order detail)
| Field | Component | Display Purpose | Source |
|-------|-----------|-----------------|--------|
| `customer.id` | OrderDetailPage | Link to customer | API |
| `customer.name` | OrderDetailPage | Contact name | API |
| `customer.company` | OrderDetailPage | Company name | API |
| `customer.email` | OrderDetailPage | Email link | API |
| `customer.phone` | OrderDetailPage | Phone link | API |

### Line Items Fields
| Field | Component | Display Purpose | Source |
|-------|-----------|-----------------|--------|
| `lineItems[].id` | LineItemsTable | Row key | API |
| `lineItems[].description` | LineItemsTable | Product name | API |
| `lineItems[].styleNumber` | LineItemsTable | SKU/style | API |
| `lineItems[].color` | LineItemsTable | Color name | API |
| `lineItems[].sizes` | LineItemsTable | Size breakdown grid | API |
| `lineItems[].sizes.xs/s/m/l/xl/xxl/xxxl` | LineItemsTable | Individual sizes | API |
| `lineItems[].totalQuantity` | LineItemsTable | Total qty | API |
| `lineItems[].unitCost` | LineItemsTable | Unit price | API |
| `lineItems[].totalCost` | LineItemsTable | Line total | API |
| `lineItems[].imprints[]` | LineItemsTable | Imprint details | API |
| `lineItems[].mockup` | LineItemsTable | Mockup URL (singular!) | API |

### Imprint Fields
| Field | Component | Display Purpose | Source |
|-------|-----------|-----------------|--------|
| `imprints[].id` | ImprintRow | Row key | API |
| `imprints[].location` | ImprintRow | Print location | API |
| `imprints[].decorationType` | ImprintRow | Method badge | API |
| `imprints[].description` | ImprintRow | Imprint details | API |
| `imprints[].colorCount` | ImprintRow | Color count | API |
| `imprints[].width` | ImprintRow | Dimensions | API |
| `imprints[].height` | ImprintRow | Dimensions | API |
| `imprints[].mockups[]` | ImprintRow | **UI expects array, API doesn't provide** | GAP |

---

## Customer List View (CustomersListPage.tsx, CustomersList.tsx)

| Field | Component | Display Purpose | Source |
|-------|-----------|-----------------|--------|
| `id` | CustomerCard | Key/link | API |
| `name` | CustomerCard | Contact name | API |
| `email` | CustomerCard | Email display | API |
| `phone` | CustomerCard | Phone display | API |
| `company` | CustomerCard | Company name | API |
| `orders_count` | CustomerCard | Order count badge | API |
| `total_revenue` | CustomerCard | Lifetime value | **MISSING** |
| `tier` | CustomerCard | Bronze/Silver/Gold/Platinum | **MISSING** |
| `last_order_date` | CustomerCard | "Last order X ago" | **MISSING** |

---

## Customer Detail View (CustomerDetailPage.tsx, CustomerDetail.tsx)

| Field | Component | Display Purpose | Source |
|-------|-----------|-----------------|--------|
| `id` | CustomerDetail | Internal ID | API |
| `name` | CustomerDetail | Header name | API |
| `email` | CustomerDetail | Email link | API |
| `phone` | CustomerDetail | Phone link | API |
| `company` | CustomerDetail | Company display | API |
| `tier` | CustomerDetail | Tier badge | **MISSING** |
| `orders_count` | CustomerDetail | Order count | API |
| `total_revenue` | CustomerDetail | Lifetime value | **MISSING** |
| `address.street` | CustomerDetail | Full address | **MISSING** |
| `address.city` | CustomerDetail | City (partial) | API has city |
| `address.state` | CustomerDetail | State (partial) | API has state |
| `address.zip` | CustomerDetail | Zip | **MISSING** |
| `billingAddress.*` | CustomerDetail | Billing address form | **MISSING** |
| `shippingAddress.*` | CustomerDetail | Shipping address form | **MISSING** |
| `orders[]` | CustomerDetail | Customer's order history | **NEEDS ENDPOINT** |

---

## Types Expected (from src/lib/types.ts)

### SizeBreakdown
```typescript
{
  XS: number;   // API: xs
  S: number;    // API: s
  M: number;    // API: m
  L: number;    // API: l
  XL: number;   // API: xl
  '2XL': number; // API: xxl
  '3XL': number; // API: xxxl
}
```

### Imprint.mockups[]
UI expects: `mockups: Mockup[]` on each imprint
API provides: `mockup: string | null` on lineItem (singular, not on imprint)

### Customer.address
UI expects: Full Address object with street, city, state, zip
API provides: Only city, state at top level

---

## Notes

1. **Two API formats**: List endpoints use snake_case, detail endpoints use camelCase
2. **Mockup placement**: UI expects mockups on imprints, API has mockup on lineItem
3. **Size keys**: UI uses uppercase (XS, S, M...), API uses lowercase (xs, s, m...)
4. **Missing customer fields**: tier, total_revenue, addresses not in API
