# Audit: Order Detail Features

**Date:** December 22, 2025
**Version:** v2.2.1

---

## Mockup Display Investigation

### API Response (Order 13707)
```json
{
  "lineItems[0].mockup": null,
  "artworkFiles": [],
  "artworkCount": null
}
```

### API Response (Order 13689 - "has mockups")
```json
{
  "lineItems[0].mockup": null,
  "artworkFiles": [],
  "artworkCount": null
}
```

### Root Cause
- **API is not returning mockup data** even for orders that should have them
- The database has 31,920 mockups but they're not being joined in the API query
- `artworkFiles` array is always empty

### Current Rendering (ui-v3)
- **Component:** `src/components/orders/OrderDetailPage.tsx`
- **Line:** 930-946 (line item mockup column)
- **Line:** 1013-1041 (imprint mockups)
- **Uses:** `item.mockup.url`, `item.mockup.thumbnail_url`
- **Status:** Code is correct, waiting on API to return data

### Fix Required (ronny-ops)
1. Check `dashboard-api/src/routes/orders.ts` for mockup joins
2. Verify mockups table has data for these order IDs
3. Update API query to include:
   - `lineItem.mockup` (linked mockup)
   - `artworkFiles` from order-level artwork

---

## print-shop-pro Features to Port

### HIGH Priority

| Component | Lines | Description | Effort |
|-----------|-------|-------------|--------|
| **ArtworkUpload.tsx** | 242 | Drag-drop file upload with preview, approval workflow | 2-3 hrs |
| **ProductMockup.tsx** | 361 | Mockup image display with zoom, multiple views | 2 hrs |
| **LineItemGrid.tsx** | 1,161 | Full line item editor with sizes, prices, inline edit | 4-6 hrs |

### MEDIUM Priority

| Component | Lines | Description | Effort |
|-----------|-------|-------------|--------|
| **DecorationManager.tsx** | 1,319 | Imprint/decoration editing, templates | 4-6 hrs |
| **JobDetail.tsx** | 709 | Order detail layout (reference only) | N/A |

### LOW Priority

| Component | Lines | Description | Effort |
|-----------|-------|-------------|--------|
| **PricingSummary.tsx** | 115 | Pricing breakdown display | 1 hr |
| **ImprintTemplateManager.tsx** | ? | Save/load imprint templates | 2 hrs |

---

## Feature Comparison

### Current ui-v3 vs print-shop-pro

| Feature | ui-v3 | print-shop-pro | Gap |
|---------|-------|----------------|-----|
| Line item display | ✅ Table | ✅ Grid + Table | - |
| Size breakdown | ✅ Grid | ✅ Grid | - |
| Inline editing | ⚠️ UI only | ✅ Full save | No API |
| Add line item | ⚠️ Dialog | ✅ Dialog | No API |
| Delete line item | ❌ None | ✅ With confirm | Missing |
| Imprint display | ✅ Basic | ✅ Full details | - |
| Imprint editing | ❌ None | ✅ Full editor | Missing |
| Mockup display | ✅ Ready | ✅ Full zoom | API issue |
| Mockup upload | ❌ None | ✅ Drag-drop | Missing |
| Artwork gallery | ⚠️ UI ready | ✅ Full gallery | API issue |
| Status change | ❌ None | ✅ Dropdown | Missing |
| Payment tracking | ❌ None | ✅ Full tracker | Missing |

---

## Key Findings

### 1. Mockups Not Showing
- **Cause:** API doesn't return mockup URLs
- **Fix:** Update ronny-ops API to join mockups table
- **Frontend:** Code already handles mockup display

### 2. Edits Don't Persist
- **Cause:** No PUT/POST API calls on save
- **Fix:** Wire up API endpoints
- **Endpoints needed:**
  - `PUT /api/orders/:id/line-items/:id`
  - `POST /api/orders/:id/line-items`
  - `DELETE /api/orders/:id/line-items/:id`

### 3. No Image Upload
- **Cause:** No upload API endpoint
- **Fix:** Create endpoint in ronny-ops
- **Endpoint needed:** `POST /api/orders/:id/artwork`
- **Storage:** MinIO at files.ronny.works

### 4. ArtworkUpload Component
```typescript
// Key props from print-shop-pro
interface ArtworkUploadProps {
  location: string;
  artwork?: LegacyArtworkFile;
  onUpload: (artwork: LegacyArtworkFile) => void;
  onRemove: () => void;
  canApprove?: boolean;
  onApprove?: (approved: boolean) => void;
  allowMultiple?: boolean;
}
```

---

## Recommended Next Steps

### Immediate (Today/Tomorrow)
1. **Fix API mockup response** - ronny-ops task
2. **Test with order that has mockups** - verify display works

### This Week
1. **Port ArtworkUpload.tsx** (242 lines)
   - Adapt for our API
   - Upload to MinIO via presigned URL
2. **Add line item delete**
   - UI: Add delete button
   - API: DELETE endpoint

### Next Week
1. **Port LineItemGrid.tsx** (1,161 lines)
   - Or create simplified version
2. **Wire save functionality**
   - PUT for edits
   - POST for new items

---

## Reference: print-shop-pro File Locations

```
~/spark/print-shop-pro/src/components/
├── ArtworkUpload.tsx          # 242 lines - drag-drop upload
├── ArtworkApprovalWorkflow.tsx # artwork approval states
├── CustomerArtworkLibrary.tsx  # customer's saved artwork
├── DecorationManager.tsx       # 1,319 lines - imprint editing
├── ImprintTemplateManager.tsx  # save/load templates
├── JobArtworkReview.tsx        # artwork review workflow
├── JobDetail.tsx               # 709 lines - order detail
├── LineItemGrid.tsx            # 1,161 lines - line item editor
├── PricingSummary.tsx          # 115 lines - pricing display
├── ProductMockup.tsx           # 361 lines - mockup display
└── ProductMockupWithSize.tsx   # mockup with size overlay
```
