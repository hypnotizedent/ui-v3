# Customer Card Layout Diagnostic v2.1.4

> Audited: December 22, 2025
> File: `src/components/customers/CustomersListPage.tsx`

---

## Current vs Desired Layout

### Current Layout (v2.1.3)
```
┌────────────────────────────────────────────────────────────────┐
│ Victor [BRONZE]                     Revenue  Orders  Last Order│
│ 🏢 Company  ✉ email  📞 phone       $192.60    1     1 day ago │
└────────────────────────────────────────────────────────────────┘
```

**Issues:**
1. Email/phone clutter the card (rarely needed in list view)
2. Three separate stat columns take too much space
3. "Revenue" / "Orders" / "Last Order" labels are redundant
4. Card feels busy and hard to scan

### Desired Layout (v2.1.4)
```
┌────────────────────────────────────────────────────────────────┐
│ Victor Martin [BRONZE]                              $192.60    │
│ Acme Company                              1 order · 1 day ago  │
└────────────────────────────────────────────────────────────────┘
```

**Improvements:**
1. Full name (API already provides this)
2. Company on second line (no icon)
3. Email/phone removed from card (visible in detail view)
4. Revenue prominent on top-right
5. Orders + time combined: "X order(s) · time ago"

---

## API Data Analysis

**API Response Sample:**
```json
{
  "name": "Yolaine  Bonner",     // ← Full name (may have double spaces)
  "first_name": "Yolaine",
  "last_name": " Bonner",        // ← Note leading space
  "company": "",                 // ← Often empty
  "email": "yolaine@example.com",
  "phone": "555-1234",
  "total_revenue": "192.60",
  "orders_count": "1",
  "last_order_date": "2025-12-21T..."
}
```

**Observations:**
- `name` is already full name (first + last)
- Some names have double spaces (API issue: leading space in last_name)
- Most customers have empty `company`
- `orders_count` is now populated (was null before API fix)

---

## Current Code Analysis

**CustomersListPage.tsx (lines 165-229):**
```tsx
<CardContent className="px-3 py-2">
  <div className="flex items-start justify-between gap-3">
    {/* LEFT SIDE */}
    <div className="flex-1 min-w-0">
      {/* Row 1: Name + Tier */}
      <div className="flex items-center gap-1.5 mb-1">
        <h3>{customer.name}</h3>
        <Badge>{customer.tier}</Badge>
      </div>
      {/* Row 2: Company, Email, Phone with icons */}
      <div className="flex items-center gap-3">
        {customer.company && <Buildings /> {customer.company}}
        {customer.email && <EnvelopeSimple /> {customer.email}}
        {customer.phone && <Phone /> {customer.phone}}
      </div>
    </div>

    {/* RIGHT SIDE - Three columns */}
    <div className="flex items-center gap-4">
      <div>Revenue: ${customer.total_revenue}</div>
      <div>Orders: {customer.orders_count}</div>
      <div>Last Order: {lastOrderDate}</div>
    </div>
  </div>
</CardContent>
```

---

## Proposed Changes

### 1. Remove Email/Phone from Card
```tsx
// DELETE these lines (189-200):
{customer.email && (...)}
{customer.phone && (...)}
```

### 2. Simplify Company Display
```tsx
// BEFORE:
{customer.company && (
  <span className="flex items-center gap-1">
    <Buildings size={12} />
    <span>{customer.company}</span>
  </span>
)}

// AFTER:
{customer.company && (
  <p className="text-xs text-muted-foreground truncate">
    {customer.company}
  </p>
)}
```

### 3. Restructure Right Side
```tsx
// BEFORE: Three separate columns
<div className="flex items-center gap-4">
  <div>Revenue: $X</div>
  <div>Orders: X</div>
  <div>Last Order: X</div>
</div>

// AFTER: Stacked layout
<div className="text-right">
  <p className="text-sm font-semibold">${customer.total_revenue.toFixed(2)}</p>
  <p className="text-xs text-muted-foreground">
    {customer.orders_count} order{customer.orders_count !== 1 ? 's' : ''} · {lastOrderDate}
  </p>
</div>
```

### 4. Clean Name Display (Optional API Fix)
```typescript
// In hooks.ts, trim extra spaces:
name: (c.name || 'Unknown').replace(/\s+/g, ' ').trim(),
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/customers/CustomersListPage.tsx` | Remove email/phone, simplify layout |
| `src/lib/hooks.ts` | (Optional) Trim extra spaces from name |

---

## Import Cleanup

After removing email/phone from card:
```tsx
// Can potentially remove if not used elsewhere:
// - EnvelopeSimple
// - Phone
// Keep Buildings only if showing company with icon
```

---

## Summary

| Change | Current | Proposed |
|--------|---------|----------|
| Email | Shown with icon | **Remove** |
| Phone | Shown with icon | **Remove** |
| Company | With Buildings icon | Plain text |
| Revenue | "Revenue" label + value | Value only (prominent) |
| Orders | "Orders" label + count | "X order(s)" |
| Last Order | "Last Order" label + time | "· time ago" |
| Right layout | 3 columns | Stacked (2 lines) |
