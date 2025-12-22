# PrintShopPro vs ui-v3 Comparison - Customers Page

> Audited: December 22, 2025

---

## Layout Comparison

### PrintShopPro Customer Card
```
┌────────────────────────────────────────────────────────────────────────────┐
│ David Thompson [PLATINUM]                                                  │
│ 🏢 Riverside School District  ✉ david@rsd.edu  📞 (555) 456-7890          │
│                                                                            │
│                   💲 Total Revenue    🕐 Last Order    Orders             │
│                      $15,234.00          2 days ago       23              │
└────────────────────────────────────────────────────────────────────────────┘
```

**Card styling:** `p-4`, `hover:bg-accent/50`, `transition-colors`
**Name:** `font-semibold text-lg`
**Contact row:** Icons (Buildings, EnvelopeSimple, Phone) with `text-sm text-muted-foreground`
**Stats:** Three columns with labels, revenue in `text-lg font-semibold text-primary`

### Current ui-v3 Card (v2.1.4)
```
┌────────────────────────────────────────────────────────────────┐
│ David Jativa [SILVER]                              $1284.63    │
│ David Jativa                              2 orders · 20hrs ago │
└────────────────────────────────────────────────────────────────┘
```

**Card styling:** `px-3 py-2`, `hover:bg-card/80`, `transition-all`
**Name:** `text-sm font-semibold`
**Company:** Plain `text-xs text-muted-foreground`
**Stats:** Stacked right side, compact

---

## Feature Comparison

| Feature | PrintShopPro | ui-v3 | Priority |
|---------|--------------|-------|----------|
| **Header Actions** | New Quote, Export CSV, New Customer | None | Medium |
| **Search** | With recent searches dropdown | Basic input | Low |
| **Filter Popover** | Sort, Group By, Tier Filter | None | High |
| **Card Size** | Larger (p-4) | Compact (px-3 py-2) | - |
| **Contact Info** | Email, phone with icons | Hidden | - |
| **Stats Display** | 3 columns with labels/icons | Stacked, no labels | - |
| **Grouping** | Group by Tier | None | Medium |
| **Skeleton Loading** | CustomersListSkeleton | Basic pulse | Low |
| **CSV Export** | Yes | No | Low |
| **Filter Presets** | Save/load presets | None | Low |

---

## Header Section Comparison

### PrintShopPro Header
```tsx
<div className="border-b border-border p-6">
  <div className="flex items-center justify-between gap-3 mb-4">
    <div>
      <h1 className="text-2xl font-bold">Customers</h1>
      <p className="text-sm text-muted-foreground mt-1">
        {count} customers
      </p>
    </div>
    <div className="flex gap-2">
      <Button variant="outline">New Quote</Button>
      <Button variant="outline">Export CSV</Button>
      <Button>New Customer</Button>
    </div>
  </div>

  {/* Search with filter popover */}
  <div className="relative flex-1">
    <Input placeholder="Search..." className="pl-16 pr-32" />
    <Popover>
      <PopoverTrigger>
        <FunnelSimple /> {/* Filter icon */}
      </PopoverTrigger>
      <PopoverContent>
        {/* Sort By, Group By, Filter by Tier dropdowns */}
      </PopoverContent>
    </Popover>
  </div>
</div>
```

### ui-v3 Header
```tsx
<div className="space-y-4">
  <div>
    <h2 className="text-xl font-semibold">Customers</h2>
    <p className="text-muted-foreground text-xs">{total} total customers</p>
  </div>

  <div className="flex gap-2">
    <Input placeholder="Search..." className="pl-9" />
    <Button>Search</Button>
    {searchQuery && <Button variant="ghost">Clear</Button>}
  </div>
</div>
```

---

## Filter/Sort Options in PrintShopPro

### Sort Options
```typescript
type SortOption =
  | 'alphabetical'      // A-Z
  | 'revenue-high'      // Revenue High to Low
  | 'revenue-low'       // Revenue Low to High
  | 'recent-orders'     // Recent Orders First
  | 'oldest-orders'     // Oldest Orders First
```

### Group Options
```typescript
type GroupByOption = 'none' | 'tier'
```

### Tier Filter
```typescript
type TierFilterOption = 'all' | 'platinum' | 'gold' | 'silver' | 'bronze'
```

### Filter Popover Structure
```tsx
<PopoverContent className="w-72" align="end">
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <h4 className="font-semibold text-sm">Filters</h4>
      {hasActiveFilters && <Button size="sm">Clear all</Button>}
    </div>

    <div className="space-y-2">
      <label className="text-xs font-medium text-muted-foreground">Sort By</label>
      <Select value={sortBy} onValueChange={setSortBy}>
        {/* Options */}
      </Select>
    </div>

    <div className="space-y-2">
      <label className="text-xs font-medium text-muted-foreground">Group By</label>
      <Select value={groupBy} onValueChange={setGroupBy}>
        {/* Options */}
      </Select>
    </div>

    <div className="space-y-2">
      <label className="text-xs font-medium text-muted-foreground">Filter by Tier</label>
      <Select value={tierFilter} onValueChange={setTierFilter}>
        {/* Options */}
      </Select>
    </div>
  </div>
</PopoverContent>
```

---

## Tier Badge Colors Comparison

| Tier | PrintShopPro | ui-v3 |
|------|--------------|-------|
| Platinum | `bg-slate-300 text-slate-900` | `bg-slate-100 text-slate-900 border-slate-300` |
| Gold | `bg-yellow-500 text-yellow-900` | `bg-amber-500 text-slate-900 border-amber-600` |
| Silver | `bg-slate-400 text-slate-900` | `bg-slate-300 text-slate-900 border-slate-400` |
| Bronze | `bg-orange-600 text-white` | `bg-amber-700 text-amber-100 border-amber-800` |
| Default | `bg-muted text-muted-foreground` | `bg-muted text-muted-foreground border-border` |

---

## Spacing & Sizing Comparison

| Element | PrintShopPro | ui-v3 |
|---------|--------------|-------|
| Header padding | `p-6` | `space-y-4` |
| Card padding | `p-4` | `px-3 py-2` |
| Card gap | `gap-3` | `space-y-0.5` |
| Name size | `text-lg` | `text-sm` |
| Badge size | `text-xs` | `text-[10px]` |
| Content max-width | `max-w-5xl mx-auto` | None |
| List container | `overflow-auto p-6` | `space-y-0.5` |

---

## Features to Add (Priority Order)

### High Priority
1. **Filter Popover** - Sort By, Group By, Filter by Tier
   - Components needed: Popover, Select
   - State: sortBy, groupBy, tierFilter
   - Client-side sorting/filtering

### Medium Priority
2. **Header Action Buttons** - Export CSV, maybe New Customer
3. **Group by Tier** - Section headers when grouping enabled
4. **Better card spacing** - More padding, larger text

### Low Priority
5. **Recent Searches Dropdown** - Search history
6. **Filter Presets** - Save/load filter combinations
7. **Skeleton Loading** - Better loading states
8. **CSV Export** - Export customer list

---

## Implementation Notes

### Adding Sort/Filter (Client-Side)
```typescript
// ui-v3 already fetches from API with pagination
// For sort/filter, options:
// 1. Add sort/filter params to API (server-side)
// 2. Fetch all and sort/filter client-side (like PrintShopPro)

// PrintShopPro approach (client-side):
const filteredAndSorted = useMemo(() => {
  let result = customers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase())
    const matchesTier = tierFilter === 'all' || c.tier === tierFilter
    return matchesSearch && matchesTier
  })

  switch (sortBy) {
    case 'revenue-high':
      result.sort((a, b) => b.total_revenue - a.total_revenue)
      break
    // ... other cases
  }

  return result
}, [customers, search, sortBy, tierFilter])
```

### API Approach (Server-Side)
```typescript
// Modify useCustomersList to accept sort/filter params
const { customers } = useCustomersList({
  limit: PAGE_SIZE,
  offset,
  search,
  sortBy: 'revenue-high',  // New
  tier: 'gold',            // New
})

// API would handle: ORDER BY total_revenue DESC, WHERE tier = 'gold'
```

---

## Summary

| Aspect | PrintShopPro | ui-v3 | Notes |
|--------|--------------|-------|-------|
| Data source | Props (client) | API hooks | Different architecture |
| Search | Client filter | API search endpoint | ui-v3 more scalable |
| Sort/Filter | Rich UI | None | Gap to fill |
| Cards | Detailed | Compact | Design choice |
| Actions | Full CRUD | View only | Gap to fill |
