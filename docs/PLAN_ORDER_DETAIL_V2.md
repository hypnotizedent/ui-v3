# Order Detail Page v2.0 - Improvement Plan

**Created:** 2025-12-23
**Status:** PLANNING - Approved for Implementation

---

## Data Analysis Summary

### Size Columns (23 total in database)

| Category | Columns | Usage |
|----------|---------|-------|
| Adult | size_xs, size_s, size_m, size_l, size_xl, size_2_xl, size_3_xl, size_4_xl, size_5_xl | HIGH (8K-11K each) |
| Youth | size_yxs, size_ys, size_ym, size_yl, size_yxl | LOW (50-178 each) |
| Toddler | size_2_t, size_3_t, size_4_t, size_5_t | RARE (22-39 each) |
| Infant | size_6_m, size_12_m, size_18_m, size_24_m | VERY RARE (2-6 each) |
| Other | size_other | HIGH (23,589) - catch-all |

**IMPORTANT**: Column names use underscores: `size_2_xl` NOT `size_2xl`

**Recommendation**:
- Default visible: Adult sizes only (S, M, L, XL, 2XL, 3XL)
- Toggle button: "Show All Sizes" expands to Youth/Toddler/Infant
- Or: Dropdown to select size category (Adult/Youth/Toddler/Infant)

### Imprint Locations (Free-form in Printavo)

Top 10 most used:
1. Front Chest Screen Print (428)
2. Full Back Screen Print (363)
3. Left Chest Screen Print (286)
4. Left Chest Embriodery (95)
5. Front Panel Embriodery (86)
6. Left Chest (71)
7. Front Chest Premium Transfer (63)
8. Full Back (62)
9. Left Chest Premium Transfer (55)
10. Private Labeling (51)

**Pattern**: Location + Method combined (e.g., "Front Chest Screen Print")

**Recommendation**:
- Replace separate Location + Method dropdowns with SINGLE autocomplete field
- Suggest from existing values as user types
- Allow free text for custom entries
- Store as single `location` field (matching Printavo structure)

### Mockup Association - CRITICAL LIMITATION

- Total mockups: 31,979
- With line_item_id: 27 (0.08%)
- With order_visual_id: 31,979 (100%)

**Reality**: Mockups are associated with ORDERS, not line items.
We CANNOT show mockups inline with specific line items without:
A) Manual association by user, OR
B) Database migration to add line_item_id to existing mockups

**Recommendation for v2.0**:
- Keep "Mockups & Artwork" section (reflects actual data model)
- BUT make it more compact (horizontal scroll, smaller thumbnails)
- Add ability to drag/drop mockup onto a decoration to associate it

**Future (v2.1)**:
- When uploading artwork to decoration, auto-create mockup with line_item_id
- Build association over time as new orders are created

---

## Proposed Layout Changes

### Current Layout (Requires Scroll)
```
Header (Order #, Status, Actions)
Customer Card | Nickname
Line Items Table (expanded decorations)
MOCKUPS & ARTWORK (separate section)
DETAILS (Due Date, Notes)
PRICING (Subtotal, Tax, Total)
```

### Proposed Layout (Single Screen)
```
┌─────────────────────────────────────────────────────────────────────────┐
│ ← Order #13691 · FENDI CHÂTEAU R/O                                      │
│   Katie Perri · FENDI CHÂTEAU · operations@fendichateau.com             │
│   [DONE ▼] Due: Dec 21, 2025  Total: $320.14  Bal: $0.00  [Save] [···] │
├───────────────────────────────────────────────────────────┬─────────────┤
│ LINE ITEMS                          [+ Imprint] [+ Line] │ ARTWORK (5) │
├───────────────────────────────────────────────────────────┤ [thumb]     │
│ K540 · Port Authority · Navy                             │ [thumb]     │
│ S:0 M:5 L:0 XL:0 · Qty:5 · $18.28 · Total: $91.40       │ [thumb]     │
│ └ Left Chest Embroidery                           [+]    │ [thumb]     │
├──────────────────────────────────────────────────────────│ [thumb]     │
│ K540 · Port Authority · White                            │             │
│ S:0 M:10 L:0 XL:0 · Qty:10 · $18.28 · Total: $182.80    │             │
│ └ Left Chest Embroidery                           [+]    │             │
├───────────────────────────────────────────────────────────┴─────────────┤
│ [Notes ▶] Rush order needed...    Subtotal: $274.20 | Tax: $7 = $320.14│
└─────────────────────────────────────────────────────────────────────────┘
```

**Key Changes**:
1. **Header consolidation**: Customer info, status, due date, total - all in 3 lines
2. **Artwork sidebar**: Vertical strip on right (always visible, doesn't scroll)
3. **Compact line items**: Single line per item, decorations inline
4. **Notes collapsed**: Click to expand, show preview only
5. **Pricing inline**: Bottom bar, not separate card

---

## Decoration Field Redesign

### Current (Wrong)
- Location dropdown: Front, Back, Sleeves, Custom
- Method dropdown: Screen Print, Embroidery, DTG, etc.
- Colors text input

### Proposed (Matches Printavo Data)
- **Single autocomplete field**: "Decoration"
  - Suggests: "Left Chest Screen Print", "Full Back Embroidery", etc.
  - Allows custom text
  - Pulls from top 50 most-used values
- **Colors text input**: Keep as-is
- **Artwork upload**: Keep as-is

### Implementation
```tsx
<Autocomplete
  placeholder="e.g., Left Chest Screen Print"
  options={topDecorations} // Top 50 from database
  freeSolo // Allow custom text
  value={decoration.location}
  onChange={(value) => updateDecoration(id, 'location', value)}
/>
```

---

## Size Column Configuration

### Option A: Category Tabs (Recommended)
```
[Adult ▼] | Youth | Toddler | Infant
| XS | S | M | L | XL | 2XL | 3XL | Qty |
```

Click "Youth" to switch to:
```
Adult | [Youth ▼] | Toddler | Infant
| YXS | YS | YM | YL | YXL | Qty |
```

### Option B: Expand Button
```
| S | M | L | XL | 2XL | 3XL | Qty | [+] |
```
Click [+] to show all 23 columns (scrollable)

### Option C: Settings-Based
Order settings → "Size categories": [x] Adult [x] Youth [ ] Toddler [ ] Infant
Only checked categories show columns.

**Recommendation**: Option A (Category Tabs) - cleanest UX

---

## More Actions Menu

### Required Items
1. **EasyPost Shipping** → Modal for label creation
2. **Print Job Labels** → Opens print dialog
3. **Duplicate Order** → POST /api/orders/:id/duplicate
4. **Email Customer** → POST /api/orders/:id/email
5. **Download PDF** → GET /api/orders/:id/pdf
6. **Archive** → PATCH /api/orders/:id/status
7. **Delete** → DELETE /api/orders/:id

### API Endpoints Needed
- [ ] POST /api/orders/:id/shipping-label (EasyPost)
- [ ] GET /api/orders/:id/labels (Job labels PDF)
- [ ] POST /api/orders/:id/email (Send confirmation)
- [ ] GET /api/orders/:id/pdf (Invoice PDF)

---

## Implementation Priority

### Phase 1: Layout (No API changes)
1. Consolidate header (move due date, total up)
2. Move artwork to sidebar
3. Collapse notes section
4. Inline pricing

### Phase 2: Decoration Fields
1. Replace Location/Method dropdowns with single autocomplete
2. Populate suggestions from database

### Phase 3: Size Categories
1. Add category tabs (Adult/Youth/Toddler/Infant)
2. Wire to correct column names (size_2_xl not size_2xl)

### Phase 4: More Actions
1. Implement Duplicate Order
2. Add EasyPost integration
3. Add PDF generation

---

## Estimated Effort

| Task | Effort | Priority |
|------|--------|----------|
| Header consolidation | 2 hours | HIGH |
| Artwork sidebar | 3 hours | HIGH |
| Notes collapse | 1 hour | MEDIUM |
| Decoration autocomplete | 2 hours | HIGH |
| Size category tabs | 3 hours | MEDIUM |
| EasyPost integration | 4 hours | LOW |
| PDF generation | 3 hours | LOW |

**Total for HIGH priority**: ~7 hours

---

## Questions to Resolve

1. Should artwork sidebar be collapsible?
2. Should we show "Other" size column always?
3. Should duplicate order copy line items + decorations?
4. Do we need approval workflow for quote → order?

---

## Key Data Corrections

### 1. Correct Size Column Names (From DB Research)

| Database Column | UI Might Be Using (WRONG) |
|-----------------|---------------------------|
| `size_2_xl` | `size_2xl` |
| `size_3_xl` | `size_3xl` |
| `size_2_t` | `size_2t` |
| `size_6_m` | `size_6m` |

### 2. Mockup Reality

- 31,979 total mockups
- 27 have line_item_id (0.08%)
- All link via order_visual_id
- **Cannot show per-line-item without manual association**

### 3. Top Decoration Locations (Actual Data)

```
Front Chest Screen Print     428
Full Back Screen Print       363
Left Chest Screen Print      286
Left Chest Embriodery         95  ← Note typo in data
Front Panel Embriodery        86
```

---

## Summary

| Finding | Implication |
|---------|-------------|
| **Mockups don't link to line items** | Can't show inline - need sidebar or association feature |
| **Locations are free-form text** | Replace dropdowns with autocomplete |
| **23 size columns exist** | Need category tabs to show relevant ones |
| **Column names have underscores** | UI code may be using wrong field names |

This explains a lot of the UI weirdness - the UI was built assuming data relationships that don't exist in Printavo's model!

---

## Next Steps

1. Review this plan with Ronny
2. Prioritize which changes for v2.0 vs v2.1
3. Begin implementation in order of priority
