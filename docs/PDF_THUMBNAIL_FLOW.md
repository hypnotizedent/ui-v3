# PDF Thumbnail Implementation Flow

## Data Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Backend (ronny-ops)                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  1. PDF uploaded to MinIO                                                │
│     ├── Original: ABC123.pdf                                             │
│     └── Thumbnail: ABC123_thumb.png (256x256 max)                        │
│                                                                           │
│  2. Database (PostgreSQL)                                                │
│     └── orders.artwork_files JSONB:                                      │
│         {                                                                 │
│           "url": "https://files.ronny.works/artwork/ABC123.pdf",         │
│           "thumbnail_url": "https://files.../ABC123_thumb.png",          │
│           "file_id": "ABC123",                                           │
│           "source": "imprintMockup"                                      │
│         }                                                                 │
│                                                                           │
│  3. API (mint-os-dashboard-api)                                          │
│     └── GET /api/orders/{id}                                             │
│         Returns: { artworkFiles: [...], lineItems: [...] }               │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTP Request
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         Frontend (ui-v3)                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  1. API Hooks (src/lib/hooks.ts)                                         │
│     └── useOrderDetail(visualId)                                         │
│         ├── Fetches order data                                           │
│         └── Maps to OrderDetail type                                     │
│             ├── artworkFiles → includes thumbnail_url                    │
│             └── lineItems[].mockup → includes thumbnail_url              │
│                                                                           │
│  2. UI Component (src/components/orders/OrderDetailPage.tsx)             │
│     └── OrderDetailPage                                                  │
│         └── LineItemCard                                                 │
│             ├── Line Item Mockup                                         │
│             │   └── isPdfUrl?                                            │
│             │       ├── Yes → thumbnail_url?                             │
│             │       │   ├── Yes → Show <img src={thumbnail_url} />       │
│             │       │   └── No  → Show <FilePdf icon />                  │
│             │       └── No  → Show <img src={url} />                     │
│             │                                                             │
│             └── Imprint Mockup                                           │
│                 └── isPdfUrl?                                            │
│                     ├── Yes → thumbnail_url?                             │
│                     │   ├── Yes → Show <img src={thumbnail_url} />       │
│                     │   └── No  → Show <FilePdf icon />                  │
│                     └── No  → Show <img src={url} />                     │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

## Component Decision Tree

```
Is there a mockup?
├── No  → Show placeholder (empty image icon)
└── Yes → Is it a PDF URL?
          ├── No  → Show image directly
          └── Yes → Does it have thumbnail_url?
                    ├── No  → Show PDF icon (FilePdf)
                    └── Yes → Show thumbnail image
                              └── On click: Open full PDF in new tab
```

## Example API Response

```json
{
  "id": 13702,
  "orderNumber": "13702",
  "lineItems": [
    {
      "id": 1,
      "description": "Gildan Softstyle T-Shirt",
      "mockup": {
        "id": "ABC123",
        "url": "https://files.ronny.works/artwork/ABC123.pdf",
        "name": "Front Design.pdf",
        "thumbnail_url": "https://files.ronny.works/artwork/ABC123_thumb.png"
      }
    }
  ],
  "artworkFiles": [
    {
      "id": "ABC123",
      "url": "https://files.ronny.works/artwork/ABC123.pdf",
      "name": "Front Design.pdf",
      "source": "imprintMockup",
      "thumbnail_url": "https://files.ronny.works/artwork/ABC123_thumb.png"
    }
  ]
}
```

## Type Definitions

```typescript
// In hooks.ts
export interface LineItemMockup {
  id: string
  url: string
  name: string
  thumbnail_url?: string | null  // Optional field
}

export interface OrderDetailArtwork {
  id: string
  url: string
  name: string
  source: string
  thumbnail_url?: string | null  // Optional field
}
```

## Fallback Strategy

1. **Primary**: Display `thumbnail_url` image if available
2. **Secondary**: Display PDF icon if no thumbnail
3. **Tertiary**: If image fails to load (onError), hide broken image
4. **Always**: Link to full PDF remains functional
