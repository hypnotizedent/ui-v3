# Feature Tracker - ui-v3

> Last Updated: December 22, 2025

---

## Need To Do

| Feature | Plan Doc | Priority | Effort |
|---------|----------|----------|--------|
| Imprint CRUD (add/edit/delete) | - | HIGH | 4-6h |
| Artwork upload | - | MEDIUM | 3-4h |
| Line item add (inline) | `PLAN_v224_FIXES.md` | MEDIUM | 2-3h |
| Customer address display | `AUDIT_UI_QA_DEC22.md` | LOW | 1h |
| Edit persistence (save to API) | `AUDIT_UI_WIRING_GAPS.md` | MEDIUM | 4-6h |
| Add quotes to global search | `AUDIT_SEARCH_SYSTEMS.md` | LOW | 1h |
| Cmd+K keyboard shortcut | `AUDIT_SEARCH_SYSTEMS.md` | LOW | 30m |

---

## In Progress

| Feature | Status | Notes |
|---------|--------|-------|
| - | - | - |

---

## Done

| Version | Features | Date |
|---------|----------|------|
| v2.4.0 | Unified global search with typeahead dropdown | Dec 22, 2025 |
| v2.3.0 | Dynamic size columns (baby, youth, adult) | Dec 22, 2025 |
| v2.2.5 | Remove mock data injection, empty states, size column collapse | Dec 22, 2025 |
| v2.2.4 | Pagination fix, global search, imprint modal fix, quotes cleanup | Dec 22, 2025 |
| v2.2.3 | Reports page with production stats | Dec 22, 2025 |
| v2.2.2 | Status dropdown, payment summary fields | Dec 22, 2025 |
| v2.2.1 | Quote detail view fixes | Dec 22, 2025 |
| v2.2.0 | Quotes navigation, unified detail page, quote-to-order conversion | Dec 21, 2025 |
| v2.1.x | Initial API wiring, orders list, customers list | Dec 20, 2025 |

---

## Documentation Index

| Document | Purpose |
|----------|---------|
| `AUDIT_SEARCH_SYSTEMS.md` | Global search audit & implementation plan |
| `PLAN_DYNAMIC_SIZE_COLUMNS.md` | Dynamic size columns implementation |
| `AUDIT_ORDER_DETAIL_PAGE.md` | Order detail page audit & mock data findings |
| `AUDIT_UI_QA_DEC22.md` | UI QA audit with 12 issues |
| `PLAN_v224_FIXES.md` | v2.2.4 implementation plan |
| `AUDIT_UI_WIRING_GAPS.md` | UI elements needing API wiring |

---

## API Endpoints Needed

| Endpoint | Purpose | Status |
|----------|---------|--------|
| `PATCH /api/orders/:id/status` | Change order status | Working |
| `PUT /api/orders/:id/line-items/:id` | Update line item | Working |
| `POST /api/orders/:id/line-items` | Add line item | Needed |
| `DELETE /api/orders/:id/line-items/:id` | Remove line item | Needed |
| `POST /api/orders/:id/imprints` | Add imprint | Needed |
| `PUT /api/orders/:id/imprints/:id` | Update imprint | Needed |
| `DELETE /api/orders/:id/imprints/:id` | Remove imprint | Needed |
| `POST /api/orders/:id/artwork` | Upload artwork | Needed |
| `PUT /api/customers/:id` | Update customer | Needed |
