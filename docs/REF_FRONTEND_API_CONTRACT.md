# Mint OS Frontend API Contract

> **Last Updated**: December 21, 2025
> **API Base URL**: `https://mintprints-api.ronny.works`
> **Status**: Production Ready

---

## Overview

This document defines the exact API responses the frontend should expect.
Use this as the contract between backend and frontend teams.

---

## 1. Orders List

### Endpoint
```
GET /api/orders
GET /api/orders?status=active
GET /api/orders?page=1&limit=50
```

### Response
```typescript
interface OrdersListResponse {
  orders: OrderSummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface OrderSummary {
  id: number;
  visual_id: string;
  order_nickname: string;
  customer_name: string;     // Contact name (first + last), falls back to company
  customer_company: string;  // Company/business name
  customer_id: number;
  printavo_status_name: string;
  total: string;
  due_date: string | null;
  created_at: string;
  line_item_count: number;
}
```

### Field Mapping (DB -> API -> Frontend)
| Database | API Response | Frontend Use |
|----------|--------------|--------------|
| orders.id | id | Unique key |
| orders.visual_id | visual_id | Display ID (e.g., "13648") |
| orders.order_nickname | order_nickname | Job name |
| customers.first_name + last_name (or company) | customer_name | Contact name display |
| customers.company | customer_company | Company/business name |
| orders.printavo_status_name | printavo_status_name | Status badge |
| orders.total_amount | total | Currency display |
| orders.due_date | due_date | Date formatting |

---

## 2. Order Detail

### Endpoint
```
GET /api/orders/:id
GET /api/orders/:visualId  (if using visual_id)
```

### Response
```typescript
interface OrderDetailResponse {
  id: number;
  visual_id: string;
  order_nickname: string;
  printavo_status_name: string;
  total: string;
  due_date: string | null;
  created_at: string;
  updated_at: string;

  customer: {
    id: number;
    company: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };

  lineItems: LineItem[];
  mockups: Mockup[];  // At order level via order_visual_id
}

interface LineItem {
  id: number;
  style_description: string;
  style_number: string;
  color: string;
  total_quantity: number;
  unit_cost: string;

  // Size breakdown
  size_xs: number;
  size_s: number;
  size_m: number;
  size_l: number;
  size_xl: number;
  size_2_xl: number;
  size_3_xl: number;

  imprints: Imprint[];
}

interface Imprint {
  id: number;
  description: string;
  location: string;
  decoration_type: string;
}

interface Mockup {
  id: number;
  full_url: string;
  thumbnail_url: string;
  order_visual_id: string;  // Links to order
}
```

### Example Response
```json
{
  "id": 38217,
  "visual_id": "13689",
  "order_nickname": "Papa's Raw Bar Locals Only",
  "printavo_status_name": "COMPLETE",
  "total": "1303.66",
  "customer": {
    "id": 2595389,
    "company": "Papa's Raw Bar",
    "email": "troyganter@yahoo.com"
  },
  "lineItems": [
    {
      "id": 12345,
      "style_description": "Bella Canvas 3001",
      "color": "Navy",
      "total_quantity": 48,
      "imprints": [
        {
          "id": 5678,
          "description": "Front Chest",
          "location": "Left Chest",
          "decoration_type": "Screen Print"
        }
      ]
    }
  ],
  "mockups": [
    {
      "id": 9012,
      "full_url": "https://files.ronny.works/artwork/abcd1234.jpg",
      "thumbnail_url": "https://files.ronny.works/artwork/abcd1234.jpg",
      "order_visual_id": "13689"
    }
  ]
}
```

---

## 3. Customers List

### Endpoint
```
GET /api/customers
GET /api/customers?search=keyword
```

### Response
```typescript
interface CustomersListResponse {
  customers: CustomerSummary[];
  pagination: {...};
}

interface CustomerSummary {
  id: number;
  company: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  orders_count: number;
}
```

---

## 4. Customer Detail

### Endpoint
```
GET /api/customers/:id
```

### Response
```typescript
interface CustomerDetailResponse {
  id: number;
  company: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  orders: OrderSummary[];  // Recent orders for this customer
}
```

---

## 5. Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad request (invalid params) |
| 401 | Unauthorized (missing/invalid token) |
| 404 | Resource not found |
| 500 | Server error |

---

## 6. Status Values

Orders have these possible statuses (from Printavo):

```typescript
type OrderStatus =
  | 'QUOTE'
  | 'Quote Out For Approval - Email'
  | 'Quote Approved'
  | 'NEW MERCH ORDER'
  | 'Blanks Need To Be Sourced'
  | 'ON HOLD - Missing Details From Client'
  | 'MATERIALS PENDING'
  | 'SP - Art Needs to Be Outsourced'
  | 'SP - Art Needs to Be Traced'
  | 'SP - Need Film Files Made'
  | 'SP - Need to Print Films'
  | 'SP - Need to Burn Screens'
  | 'SP - Needs Ink Mixing'
  | 'SP - Preproduction'
  | 'SP - PRODUCTION'
  | 'EMB - Art Needs To Be Reviewed'
  | 'EMB - Art Needs to Be Sent To JJ'
  | 'EMB - Awaiting Digitized File'
  | 'EMB - Need to Make Sew Out'
  | 'EMB - Need Sew-Out Approval'
  | 'EMB - Preproduction'
  | 'EMB - PRODUCTION'
  | 'Ready for Pickup'
  | 'Shipped'
  | 'COMPLETE'
  | 'Cancelled';
```

### Status Category Prefixes
| Prefix | Category | Suggested Color |
|--------|----------|-----------------|
| QUOTE | Quote stage | Gray |
| SP - | Screen Print production | Green |
| EMB - | Embroidery production | Blue |
| (none) | General status | Purple |

---

## 7. Artwork/Mockup URLs

All mockup URLs are served from MinIO:
```
https://files.ronny.works/artwork/{filename}
```

### URL Patterns
| Pattern | Source | Status |
|---------|--------|--------|
| files.ronny.works/artwork/* | MinIO (ours) | ✅ Active |
| printavo.com/* | Printavo CDN | ❌ Deprecated |
| filepicker.io/* | Filestack | ❌ Deprecated |
| filestackcontent.com/* | Filestack CDN | ❌ Deprecated |

### Mockup Linking
Mockups link to orders via `order_visual_id`:
```sql
SELECT * FROM mockups WHERE order_visual_id = '13689';
```

---

## 8. Error Response Format

```typescript
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
  };
}
```

Example:
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Order 99999 not found"
  }
}
```

---

## 9. Pagination

All list endpoints support:
```
?page=1       // Page number (1-indexed)
?limit=50     // Items per page (max 100)
```

---

## 10. Date Formats

All dates are ISO 8601:
```
created_at: "2025-12-21T17:40:22.441Z"
due_date: "2025-12-25"  // Date only, no time
```

---

## 11. Data Counts (Reference)

| Entity | Count |
|--------|-------|
| Orders | 12,905 |
| Customers | 3,325 |
| Line Items | 43,076 |
| Imprints | 7,965 |
| Mockups | 31,920 |

---

## 12. Database Column Reference

### orders
| Column | Type | Notes |
|--------|------|-------|
| id | integer | Primary key |
| visual_id | varchar | Display ID (e.g., "13648") |
| printavo_id | varchar | Original Printavo ID |
| order_nickname | varchar | Job name |
| customer_id | integer | FK to customers |
| printavo_status_name | varchar | Status text |
| total_amount | numeric | Order total |
| due_date | date | Due date |

### customers
| Column | Type | Notes |
|--------|------|-------|
| id | integer | Primary key |
| printavo_id | varchar | Original Printavo ID |
| company | varchar | Company name |
| first_name | varchar | First name |
| last_name | varchar | Last name |
| email | varchar | Email |
| phone | varchar | Phone |

### line_items
| Column | Type | Notes |
|--------|------|-------|
| id | integer | Primary key |
| printavo_id | varchar | Original Printavo ID |
| order_id | integer | FK to orders |
| order_visual_id | varchar | Order visual ID |
| style_description | text | Product description |
| style_number | varchar | SKU |
| color | varchar | Color name |
| total_quantity | integer | Total quantity |
| unit_cost | numeric | Price per unit |

### mockups
| Column | Type | Notes |
|--------|------|-------|
| id | integer | Primary key |
| printavo_id | bigint | Original Printavo ID |
| order_visual_id | varchar | Links to order |
| full_url | text | Full image URL |
| thumbnail_url | text | Thumbnail URL |
| source_type | varchar | 'lineItem' or 'imprint' |
