# Mint OS Session Summary - December 22, 2025

## 🎉 Major Milestone: Printavo Migration Complete

**Safe to cancel Printavo subscription.**

All data synced:
- 12,905 orders
- 3,325 customers  
- 43,076 line items
- ~32,000 mockups
- 103 files backfilled (21 orders that were missing)

---

## Completed Today

### API Fixes (ronny-ops)
- [x] Customer name construction (first + last)
- [x] Line items JOIN fix (was using empty link table)
- [x] Customer CRUD endpoints (POST/PUT)
- [x] Quotes v2 auth removed (dashboard access)
- [x] Status definitions documented (PAID vs OPPORTUNITY)
- [x] PAYMENT NEEDED reclassified to "awaiting_payment"
- [x] Mockup backfill script created and executed (103 files)

### UI Progress (spark)
- [x] v2.1.1-2.1.4: Order cards, customer page fixes
- [x] v2.2.0: Quotes nav added
- [x] v2.2.1: Unified detail page (quotes use OrderDetailPage)
- [x] Quote-to-order conversion button
- [x] UI wiring gaps audited

### Documentation Created
| Document | Location | Purpose |
|----------|----------|---------|
| REF_STATUS_DEFINITIONS.md | ronny-ops | PAID vs OPPORTUNITY status mapping |
| DISCOVERY_ALL_API_CAPABILITIES.md | ronny-ops | 113 endpoints inventory |
| ROADMAP_v2x_WIRE_APIS.md | both repos | Version plan |
| DIAG_ARTWORK_DATA_MODEL.md | ronny-ops | Mockup data structure |
| RECOMMEND_MOCKUP_BACKFILL.md | ronny-ops | Sync approach |
| AUDIT_UI_WIRING_GAPS.md | spark | Buttons needing wiring |

---

## Next Session Priorities

### 🔴 HIGH PRIORITY - Wire UI to API

**8 placeholder handlers in OrderDetailPage.tsx need real API calls:**

| Handler | API Endpoint | Status |
|---------|--------------|--------|
| handleSave | PUT /api/orders/:id/line-items/:id | Needs building |
| handleDelete | DELETE /api/orders/:id/line-items/:id | Needs building |
| handleAddLineItem | POST /api/orders/:id/line-items | Needs building |
| handleDuplicate | POST /api/orders/:id/duplicate | May exist |
| handleMockupUpload | POST /api/orders/:id/artwork | Needs building |
| handleAddImprint | POST /api/orders/:id/imprints | Needs building |
| handleStatusChange | PATCH /api/orders/:id/status | EXISTS ✅ |
| handleConvertToOrder | POST /api/v2/quotes/:id/convert | EXISTS ✅ |

### 🟡 MEDIUM PRIORITY - Port PrintShopPro Components

| Priority | Component | Lines | Purpose |
|----------|-----------|-------|---------|
| 1 | Status Select pattern | 20 | Dropdown status change |
| 2 | ArtworkUpload.tsx | 242 | Drag-drop file upload |
| 3 | LineItemGrid.tsx | 1,161 | Full line item editor |

### 🟢 NICE TO HAVE
- CustomerQuickAdd for inline customer creation
- DecorationManager for imprint editing
- CustomerArtworkLibrary for artwork management

---

## Terminal Setup (Next Session)

**Terminal 1 (ronny-ops):**
```bash
cd ~/ronny-ops
claude --dangerously-skip-permissions
```

**Terminal 2 (spark):**
```bash
cd ~/spark
claude --dangerously-skip-permissions
```

---

## Kickoff Prompts

### ronny-ops - Build Line Item CRUD

```
Read CLAUDE.md for context. Build the missing line item CRUD endpoints:

POST   /api/orders/:id/line-items      - Add line item
PUT    /api/orders/:id/line-items/:id  - Update line item  
DELETE /api/orders/:id/line-items/:id  - Delete line item
POST   /api/orders/:id/artwork         - Upload artwork to MinIO

Reference the existing Quote Builder v2 line item endpoints for patterns.
Test each endpoint with curl before committing.
```

### spark - Wire Status Dropdown

```
Read CLAUDE.md and docs/AUDIT_UI_WIRING_GAPS.md for context.

Port the status select pattern from PrintShopPro (JobDetail.tsx:386).
Wire it to PATCH /api/orders/:id/status (endpoint already exists).
Add to OrderDetailPage header next to the order status display.

Test by changing an order's status and verifying it persists on refresh.
```

---

## Version Status

| Version | Focus | Status |
|---------|-------|--------|
| v2.1.x | Order/customer display fixes | ✅ Complete |
| v2.2.1 | Unified quote/order detail | ✅ Complete |
| v2.2.2 | Status dropdown + line item CRUD | 🔜 Next |
| v2.3.0 | Reports dashboard | Backlog |
| v2.4.0 | Shipping labels | Backlog |

---

## Key Files Reference

| File | Purpose |
|------|---------|
| ronny-ops/CLAUDE.md | API priorities + Printavo timeline |
| spark/ui-v3/CLAUDE.md | UI priorities + wiring gaps |
| ronny-ops/00_Architecture_&_SOPs/Mint-OS/ | All documentation |
| spark/ui-v3/docs/ | UI audit docs |
| ronny-ops/03_Scripts/backfill-mockups-complete.js | Mockup sync script |

---

## Verified Working

- ✅ Mockups display for orders that have them
- ✅ Customer names display correctly
- ✅ Line item counts accurate
- ✅ Quote builder creates quotes via API
- ✅ Convert to order button exists
- ✅ Customer CRUD endpoints work
- ✅ All 21 missing order mockups synced

---

**Total API Endpoints Available: 113**
**Total UI Coverage: ~25%**
**Estimated time to 80% coverage: 5-7 days**
