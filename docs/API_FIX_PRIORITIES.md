# API Fix Priorities

> Generated: December 21, 2025
> Prioritized list of fixes needed to fully wire UI to API

---

## Priority 1: Blocking (UI is broken or shows wrong data)

| # | Issue | Endpoint | Current | Needed | Effort |
|---|-------|----------|---------|--------|--------|
| 1 | **Dashboard shows 0 items** | /api/orders | `line_items[].quantity` not summed | Adapter sums totalQuantity | 5 min |
| 2 | **Customer cards show $0 revenue** | /api/customers | No total_revenue | Add `SUM(total_amount)` | 10 min |
| 3 | **Order detail missing visual_id** | /api/orders/:id | Not in response | Keep from URL param | Done ✅ |

---

## Priority 2: Display Issues (UI works but data wrong/missing)

| # | Issue | Endpoint | Current | Needed | Effort |
|---|-------|----------|---------|--------|--------|
| 4 | **Size keys wrong case** | Adapter | {xs, s, m...} | {XS, S, M...} | 5 min |
| 5 | **Mockup as singular not array** | /api/orders/:id | `mockup: string` | Wrap in `mockups[]` | 5 min |
| 6 | **created_at field name** | /api/orders | `custom_created_at` | Map to `created_at` | 2 min |
| 7 | **Customer tier missing** | /api/customers | Not calculated | Add tier based on revenue | 15 min |
| 8 | **Customer last_order_date** | /api/customers | Missing | Add `MAX(orders.created_at)` | 10 min |

---

## Priority 3: Missing Features (UI ready, API not)

| # | Issue | Endpoint | Current | Needed | Effort |
|---|-------|----------|---------|--------|--------|
| 9 | **Customer full address** | /api/customers | Only city, state | Add street, zip from DB | 10 min |
| 10 | **Customer orders list** | /api/customers/:id/orders | No endpoint | Create endpoint | 20 min |
| 11 | **LineItem production_files** | /api/orders/:id | Not queried | Add to lineItems query | 15 min |

---

## Priority 4: Nice to Have (UI doesn't use yet)

| # | Issue | Endpoint | Current | Needed | Effort |
|---|-------|----------|---------|--------|--------|
| 12 | **Imprint mockups** | DB schema | Mockups on lineItem | Mockups on imprint (schema change) | 2+ hrs |
| 13 | **Imprint artwork reference** | DB schema | Not tracked | Add artwork_id FK | 1+ hr |
| 14 | **Imprint setup_fee** | DB schema | Not tracked | Add column | 30 min |

---

## Quick Wins (Can fix in 5 minutes)

### 1. Adapter: Fix item count calculation
**File:** `~/spark/ui-v3/src/lib/api-adapter.ts`
```typescript
// In transformOrder, add:
const itemCount = lineItems.reduce((sum, li) => sum + (li.quantity || li.totalQuantity || 0), 0);
```

### 2. Adapter: Uppercase size keys
**File:** `~/spark/ui-v3/src/lib/api-adapter.ts`
```typescript
function transformDetailSizes(sizes) {
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
```

### 3. Adapter: Wrap mockup in array
**File:** `~/spark/ui-v3/src/lib/api-adapter.ts`
```typescript
mockups: lineItem.mockup ? [{ url: lineItem.mockup, thumbnailUrl: lineItem.mockup }] : []
```

---

## Backend Fixes (For ronny-ops terminal)

### Fix #2: Customer total_revenue
**File:** `~/ronny-ops/02_Applications/mint-os/dashboard-api/dashboard-server.cjs`
**Endpoint:** `/api/customers`

```sql
SELECT
  c.*,
  COALESCE(SUM(o.total_amount), 0) as total_revenue,
  MAX(o.created_at) as last_order_date
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
GROUP BY c.id
```

### Fix #7: Customer tier calculation
```sql
CASE
  WHEN SUM(o.total_amount) >= 10000 THEN 'platinum'
  WHEN SUM(o.total_amount) >= 5000 THEN 'gold'
  WHEN SUM(o.total_amount) >= 1000 THEN 'silver'
  ELSE 'bronze'
END as tier
```

---

## Recommended Fix Order

1. ✅ **Customer name** (Done - customer_name fix)
2. **Customer total_revenue** (Backend: 10 min)
3. **Adapter: size keys + mockup array** (Frontend: 10 min)
4. **Customer tier** (Backend: 15 min)
5. **Customer last_order_date** (Backend: 5 min - add to same query)
6. **Customer address** (Backend: 10 min)
7. **Customer orders endpoint** (Backend: 20 min)

Total estimated time: ~70 minutes for full parity
