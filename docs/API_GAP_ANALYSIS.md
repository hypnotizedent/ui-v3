# API Gap Analysis

> Generated: December 21, 2025
> Compares UI expectations vs actual API responses

---

## Legend

| Status | Meaning |
|--------|---------|
| ✅ OK | Field exists and matches |
| ⚠️ ADAPTER | Field exists but needs transformation |
| ❌ API GAP | Field missing from API (needs backend fix) |
| 🔄 UI GAP | API has it but UI doesn't use it |

---

## Orders List Endpoint (`/api/orders`)

| UI Expects | API Returns | Status | Fix Location |
|------------|-------------|--------|--------------|
| `id` | `id` | ✅ OK | - |
| `visual_id` | `visual_id` | ✅ OK | - |
| `order_nickname` | `order_nickname` | ✅ OK | - |
| `nickname` | `order_nickname` | ⚠️ ADAPTER | api-adapter.ts |
| `customer_name` | `customer_name` | ✅ OK | - |
| `customer_company` | `customer_company` | ✅ OK | - |
| `printavo_status_name` | `printavo_status_name` | ✅ OK | - |
| `status` | `printavo_status_name` | ⚠️ ADAPTER | mapStatus() |
| `total` | `total_amount` | ⚠️ ADAPTER | rename |
| `total_amount` | `total_amount` | ✅ OK | - |
| `due_date` | `due_date` | ✅ OK | - |
| `created_at` | `custom_created_at` | ⚠️ ADAPTER | rename |
| `line_items[]` | `line_items[]` | ✅ OK | - |
| `line_item_count` | (calculated) | ⚠️ ADAPTER | line_items.length |
| - | `amount_outstanding` | 🔄 UI GAP | Not displayed |
| - | `artwork_count` | 🔄 UI GAP | Not displayed |
| - | `customer_po` | 🔄 UI GAP | Not displayed |
| - | `status_history` | 🔄 UI GAP | Not displayed |

---

## Order Detail Endpoint (`/api/orders/:id`)

| UI Expects | API Returns | Status | Fix Location |
|------------|-------------|--------|--------------|
| `id` | `id` | ✅ OK | - |
| `orderNumber` | `orderNumber` | ✅ OK | - |
| `orderNickname` | `orderNickname` | ✅ OK | - |
| `visual_id` | (missing) | ❌ API GAP | Add to query |
| `status` | `printavoStatusName` | ⚠️ ADAPTER | mapStatus() |
| `totalAmount` | `totalAmount` | ✅ OK | - |
| `amountOutstanding` | `amountOutstanding` | ✅ OK | - |
| `dueDate` | `dueDate` | ✅ OK | - |
| `createdAt` | `createdAt` | ✅ OK | - |
| `notes` | `notes` | ✅ OK | - |
| `productionNotes` | `productionNotes` | ✅ OK | - |
| `artworkFiles` | `artworkFiles` | ✅ OK | - |
| `customer.id` | `customer.id` | ✅ OK | - |
| `customer.name` | `customer.name` | ✅ OK | - |
| `customer.company` | `customer.company` | ✅ OK | - |
| `customer.email` | `customer.email` | ✅ OK | - |
| `customer.phone` | `customer.phone` | ✅ OK | - |
| `lineItems[]` | `lineItems[]` | ✅ OK | - |

---

## Line Items (in order detail)

| UI Expects | API Returns | Status | Fix Location |
|------------|-------------|--------|--------------|
| `id` | `id` | ✅ OK | - |
| `product_name` | `description` | ⚠️ ADAPTER | rename |
| `product_sku` | `styleNumber` | ⚠️ ADAPTER | rename |
| `product_color` | `color` | ⚠️ ADAPTER | rename |
| `quantity` | `totalQuantity` | ⚠️ ADAPTER | rename |
| `unit_price` | `unitCost` | ⚠️ ADAPTER | rename |
| `subtotal` | `totalCost` | ⚠️ ADAPTER | rename |
| `sizes.XS` | `sizes.xs` | ⚠️ ADAPTER | uppercase keys |
| `sizes.S` | `sizes.s` | ⚠️ ADAPTER | uppercase keys |
| `sizes.M` | `sizes.m` | ⚠️ ADAPTER | uppercase keys |
| `sizes.L` | `sizes.l` | ⚠️ ADAPTER | uppercase keys |
| `sizes.XL` | `sizes.xl` | ⚠️ ADAPTER | uppercase keys |
| `sizes['2XL']` | `sizes.xxl` | ⚠️ ADAPTER | rename |
| `sizes['3XL']` | `sizes.xxxl` | ⚠️ ADAPTER | rename |
| `imprints[]` | `imprints[]` | ✅ OK | - |
| `mockups[]` | `mockup` (singular!) | ⚠️ ADAPTER | wrap in array |
| `production_files[]` | (missing) | ❌ API GAP | Add to query |

---

## Imprints (in line items)

| UI Expects | API Returns | Status | Fix Location |
|------------|-------------|--------|--------------|
| `id` | `id` | ✅ OK | - |
| `location` | `location` | ✅ OK | - |
| `method` | `decorationType` | ⚠️ ADAPTER | mapDecorationType() |
| `description` | `description` | ✅ OK | - |
| `colors` | `colorCount` | ⚠️ ADAPTER | rename |
| `width` | `width` | ✅ OK | - |
| `height` | `height` | ✅ OK | - |
| `artwork` | (missing) | ❌ API GAP | Not in DB |
| `setup_fee` | (missing) | ❌ API GAP | Not in DB |
| `mockups[]` | (missing) | ❌ API GAP | Mockups on lineItem |

---

## Customers List Endpoint (`/api/customers`)

| UI Expects | API Returns | Status | Fix Location |
|------------|-------------|--------|--------------|
| `id` | `id` | ✅ OK | - |
| `name` | `name` | ✅ OK | - |
| `email` | `email` | ✅ OK | - |
| `phone` | `phone` | ✅ OK | - |
| `company` | `company` | ✅ OK | - |
| `orders_count` | `orders_count` | ✅ OK | - |
| `total_revenue` | (missing) | ❌ API GAP | Add SUM(total_amount) |
| `tier` | (missing) | ❌ API GAP | Add tier logic |
| `last_order_date` | (missing) | ❌ API GAP | Add MAX(created_at) |
| `address.street` | (missing) | ❌ API GAP | Add to query |
| `address.city` | `city` | ⚠️ ADAPTER | nest in address |
| `address.state` | `state` | ⚠️ ADAPTER | nest in address |
| `address.zip` | (missing) | ❌ API GAP | Add to query |

---

## Summary Statistics

### By Status

| Status | Count | Percentage |
|--------|-------|------------|
| ✅ OK | 34 | 49% |
| ⚠️ ADAPTER | 22 | 32% |
| ❌ API GAP | 10 | 14% |
| 🔄 UI GAP | 4 | 6% |
| **Total** | **70** | 100% |

### API Gaps Requiring Backend Changes

1. **Customer total_revenue** - Need `SUM(orders.total_amount)` in customer query
2. **Customer tier** - Need tier calculation logic
3. **Customer last_order_date** - Need `MAX(orders.created_at)`
4. **Customer address fields** - street, zip missing from query
5. **Order detail visual_id** - Not returned in camelCase endpoint
6. **LineItem production_files** - Not queried
7. **Imprint artwork** - Not in database schema
8. **Imprint setup_fee** - Not in database schema
9. **Imprint mockups** - Mockups on lineItem, not imprint

### Adapter Transformations Needed

1. Size keys: lowercase → uppercase (xs → XS)
2. Field renames: description → product_name, styleNumber → product_sku
3. mockup (singular) → mockups[] (array)
4. decorationType → method enum mapping
5. custom_created_at → created_at
6. total_amount → total (alias)
