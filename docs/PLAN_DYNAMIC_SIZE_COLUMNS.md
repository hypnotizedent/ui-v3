# Dynamic Size Columns - Implementation Plan

> **Version Target**: v2.3.0
> **Estimated Effort**: 3-4 hours
> **Dependencies**: None (frontend-only)

---

## Reference: Printavo Approach (from screenshots)

### What Printavo Does

1. **"..." menu** in table header top-right corner
2. Opens **"Manage Columns"** dropdown panel
3. **Checkbox list** grouped by category
4. **Persists selection** (localStorage or account settings)

### Printavo Column Categories

| Category | Sizes | Default |
|----------|-------|---------|
| Infant | 6M, 12M, 18M, 24M | Unchecked |
| Toddler | 2T, 3T, 4T, 5T | Unchecked |
| Youth | Youth-XS, Youth-S, Youth-M, Youth-L, Youth-XL | Unchecked |
| Adult | XS, S, M, L, XL, 2XL, 3XL, 4XL, 5XL, 6XL | S-3XL checked |
| Other | Quantity, Markup % | Both checked |

### Printavo Always-Visible Columns
- Category
- Item #
- Color
- Description
- Quantity (total)
- Items
- Price
- Taxed
- Total

---

## Current ui-v3 State

### Existing Size Columns (OrderDetailPage.tsx)
```typescript
// Line 621
const sizeColumns = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL', '6XL'] as const;
```

### Existing Column Toggle (ManageColumnsModal.tsx)
Already has a `ManageColumnsModal` component with this config:
```typescript
export const DEFAULT_COLUMN_CONFIG: ColumnConfig = {
  itemNumber: true,
  color: true,
  quantity: true,
  sizes: {
    adult: {
      XS: true, S: true, M: true, L: true, XL: true,
      '2XL': true, '3XL': true, '4XL': false, '5XL': false, '6XL': false
    }
  }
};
```

### Database Size Columns Available
From Printavo sync, we have these fields in `line_items` table:
```
size_xs, size_s, size_m, size_l, size_xl, size_2_xl, size_3_xl, size_4_xl, size_5_xl
size_yxs, size_ys, size_ym, size_yl, size_yxl     (youth)
size_6_m, size_12_m, size_18_m, size_24_m         (infant)
size_2_t, size_3_t, size_4_t, size_5_t            (toddler)
size_other
```

---

## Implementation Plan

### Phase 1: Expand Size Column Configuration (30 min)

**File**: `src/components/orders/ManageColumnsModal.tsx`

Update `ColumnConfig` type to include all size categories:
```typescript
export interface ColumnConfig {
  itemNumber: boolean;
  color: boolean;
  quantity: boolean;
  sizes: {
    infant: {
      '6M': boolean;
      '12M': boolean;
      '18M': boolean;
      '24M': boolean;
    };
    toddler: {
      '2T': boolean;
      '3T': boolean;
      '4T': boolean;
      '5T': boolean;
    };
    youth: {
      'Y-XS': boolean;
      'Y-S': boolean;
      'Y-M': boolean;
      'Y-L': boolean;
      'Y-XL': boolean;
    };
    adult: {
      XS: boolean;
      S: boolean;
      M: boolean;
      L: boolean;
      XL: boolean;
      '2XL': boolean;
      '3XL': boolean;
      '4XL': boolean;
      '5XL': boolean;
      '6XL': boolean;
    };
  };
}
```

**Default Config**:
```typescript
export const DEFAULT_COLUMN_CONFIG: ColumnConfig = {
  itemNumber: true,
  color: true,
  quantity: true,
  sizes: {
    infant: { '6M': false, '12M': false, '18M': false, '24M': false },
    toddler: { '2T': false, '3T': false, '4T': false, '5T': false },
    youth: { 'Y-XS': false, 'Y-S': false, 'Y-M': false, 'Y-L': false, 'Y-XL': false },
    adult: { XS: false, S: true, M: true, L: true, XL: true, '2XL': true, '3XL': true, '4XL': false, '5XL': false, '6XL': false }
  }
};
```

### Phase 2: Update ManageColumnsModal UI (45 min)

**Current**: Simple checkboxes
**New**: Grouped sections with headers

```
[Manage Columns]
─────────────────
□ Item #
□ Color

Infant Sizes
  □ 6M  □ 12M  □ 18M  □ 24M

Toddler Sizes
  □ 2T  □ 3T  □ 4T  □ 5T

Youth Sizes
  □ Y-XS  □ Y-S  □ Y-M  □ Y-L  □ Y-XL

Adult Sizes
  □ XS  ☑ S  ☑ M  ☑ L  ☑ XL  ☑ 2XL  ☑ 3XL  □ 4XL  □ 5XL  □ 6XL

─────────────────
[Reset to Default]
```

### Phase 3: Add Size Field Mapping (30 min)

**File**: `src/lib/hooks.ts` - Update `useOrderDetail`

Add all size fields to the `OrderDetailLineItem` interface:
```typescript
sizes: {
  // Infant
  '6m': number;
  '12m': number;
  '18m': number;
  '24m': number;
  // Toddler
  '2t': number;
  '3t': number;
  '4t': number;
  '5t': number;
  // Youth
  yxs: number;
  ys: number;
  ym: number;
  yl: number;
  yxl: number;
  // Adult
  xs: number;
  s: number;
  m: number;
  l: number;
  xl: number;
  xxl: number;
  xxxl: number;
  xxxxl: number;
  xxxxxl: number;
  // Other
  other: number;
}
```

Map API fields in the transform:
```typescript
sizes: {
  '6m': li.sizes?.['6m'] || li.size_6_m || 0,
  '12m': li.sizes?.['12m'] || li.size_12_m || 0,
  // ... etc
}
```

### Phase 4: Update Table Rendering (1 hour)

**File**: `src/components/orders/OrderDetailPage.tsx`

1. **Define ordered size columns**:
```typescript
const ALL_SIZE_COLUMNS = [
  // Infant
  { key: '6m', label: '6M', category: 'infant' },
  { key: '12m', label: '12M', category: 'infant' },
  { key: '18m', label: '18M', category: 'infant' },
  { key: '24m', label: '24M', category: 'infant' },
  // Toddler
  { key: '2t', label: '2T', category: 'toddler' },
  { key: '3t', label: '3T', category: 'toddler' },
  { key: '4t', label: '4T', category: 'toddler' },
  { key: '5t', label: '5T', category: 'toddler' },
  // Youth
  { key: 'yxs', label: 'Y-XS', category: 'youth' },
  { key: 'ys', label: 'Y-S', category: 'youth' },
  { key: 'ym', label: 'Y-M', category: 'youth' },
  { key: 'yl', label: 'Y-L', category: 'youth' },
  { key: 'yxl', label: 'Y-XL', category: 'youth' },
  // Adult
  { key: 'xs', label: 'XS', category: 'adult' },
  { key: 's', label: 'S', category: 'adult' },
  { key: 'm', label: 'M', category: 'adult' },
  { key: 'l', label: 'L', category: 'adult' },
  { key: 'xl', label: 'XL', category: 'adult' },
  { key: 'xxl', label: '2XL', category: 'adult' },
  { key: 'xxxl', label: '3XL', category: 'adult' },
  { key: 'xxxxl', label: '4XL', category: 'adult' },
  { key: 'xxxxxl', label: '5XL', category: 'adult' },
  { key: '6xl', label: '6XL', category: 'adult' },
] as const;
```

2. **Compute visible columns** (respecting existing v2.2.5 logic):
```typescript
// Check if any line item has any size data
const hasSizeBreakdown = items.some(item =>
  ALL_SIZE_COLUMNS.some(col => (item.sizes as any)[col.key] > 0)
);

// Get columns to show based on config
const visibleSizeColumns = hasSizeBreakdown
  ? ALL_SIZE_COLUMNS.filter(col => {
      const category = col.category as keyof typeof currentColumnConfig.sizes;
      const sizeKey = col.label as keyof typeof currentColumnConfig.sizes[typeof category];
      return currentColumnConfig.sizes[category]?.[sizeKey];
    })
  : []; // No sizes = just show Qty column
```

3. **Render dynamic columns** in table header and body

### Phase 5: Smart Auto-Show (30 min)

Add logic to auto-show columns that have data, even if not in user config:

```typescript
function getVisibleSizeColumns(items: OrderDetailLineItem[], config: ColumnConfig) {
  // Start with user-selected columns
  const userSelected = ALL_SIZE_COLUMNS.filter(col => {
    const category = col.category as keyof typeof config.sizes;
    const sizeKey = col.label as keyof typeof config.sizes[typeof category];
    return config.sizes[category]?.[sizeKey];
  });

  // Auto-add any column that has data > 0 in any item
  const withData = ALL_SIZE_COLUMNS.filter(col =>
    items.some(item => (item.sizes as any)[col.key] > 0)
  );

  // Merge (user selected + columns with data), keeping order
  const merged = ALL_SIZE_COLUMNS.filter(col =>
    userSelected.some(s => s.key === col.key) ||
    withData.some(w => w.key === col.key)
  );

  return merged;
}
```

---

## Files to Create/Modify

| File | Action | Changes |
|------|--------|---------|
| `src/components/orders/ManageColumnsModal.tsx` | MODIFY | Add infant/toddler/youth categories, grouped UI |
| `src/components/orders/OrderDetailPage.tsx` | MODIFY | Dynamic size column rendering |
| `src/lib/hooks.ts` | MODIFY | Add all size fields to interface and mapping |

**No new files needed** - extends existing `ManageColumnsModal` infrastructure.

---

## API Changes Required

**None** - The API already returns all size fields. Just need to map them in the frontend.

Test with:
```bash
curl -s "https://mintprints-api.ronny.works/api/orders/13708" | jq '.lineItems[0]'
```

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| No size data at all | Show only "Items" column (existing v2.2.5 behavior) |
| Only youth sizes have data | Auto-show youth columns even if not in config |
| Mixed adult + youth | Show both sections |
| User unchecks column with data | Column hides (user preference wins) |
| New order, no data yet | Show defaults (S-3XL) |

---

## Answers to Your Questions

### 1. Persist per-order or global?
**Recommendation: Global (A)**
- Same column visibility for all orders
- Simpler implementation
- Already using `useKV` for persistence

### 2. Auto-expand when data exists?
**Recommendation: Yes**
- If an order has youth sizes, auto-show youth columns
- User can still hide them via toggle
- Better UX - don't hide data

### 3. Qty vs Items label?
**Recommendation: Keep "Items"**
- Current ui-v3 uses "Items" for total quantity
- "Qty" is shortened version, could be confusing
- Printavo uses both "Quantity" (calculated) and "Items" (total)

### 4. Edit mode behavior?
**Recommendation: Keep toggle behavior**
- Don't auto-expand all columns in edit mode
- User should control which columns are visible
- Can always add missing sizes via toggle

---

## Summary

| Aspect | Details |
|--------|---------|
| **Version** | v2.3.0 (feature addition, not bug fix) |
| **Effort** | 3-4 hours |
| **Dependencies** | None (frontend-only) |
| **Files Modified** | 3 files |
| **Files Created** | 0 files |
| **API Changes** | None needed |
| **Breaking Changes** | None |
| **Risk** | Low |

---

## Implementation Order

1. Update `ColumnConfig` type in ManageColumnsModal.tsx
2. Update `DEFAULT_COLUMN_CONFIG` with all categories
3. Update ManageColumnsModal UI with grouped sections
4. Add size fields to hooks.ts interface
5. Update size field mapping in hooks.ts transform
6. Update OrderDetailPage.tsx size column logic
7. Test with orders that have youth/infant sizes
8. Version bump to v2.3.0, commit, push
