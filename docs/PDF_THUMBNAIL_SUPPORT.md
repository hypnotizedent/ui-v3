# PDF Thumbnail Support

## Overview

This document describes the implementation of PDF thumbnail support in the UI. PDF files can now display preview thumbnails instead of just PDF file icons, improving the user experience when viewing order mockups and artwork.

## Changes Made

### 1. Type Definitions (`src/lib/hooks.ts`)

Added optional `thumbnail_url` field to relevant interfaces:

```typescript
export interface LineItemMockup {
  id: string
  url: string
  name: string
  thumbnail_url?: string | null  // NEW
}

export interface OrderDetailArtwork {
  id: string
  url: string
  name: string
  source: string
  thumbnail_url?: string | null  // NEW
}
```

### 2. API Data Mapping (`src/lib/hooks.ts`)

Updated the `useOrderDetail` hook to extract `thumbnail_url` from API responses:

```typescript
// Extract thumbnail_url for artwork files
artworkFiles: (data.artworkFiles || data.artwork_files || []).map((a: any) => ({
  id: a.id,
  url: a.url,
  name: a.name,
  source: a.source,
  thumbnail_url: a.thumbnail_url || a.thumbnailUrl || null,  // NEW
}))

// Extract thumbnail_url for line item mockups
mockup: li.mockup ? {
  id: li.mockup.id,
  url: li.mockup.url,
  name: li.mockup.name,
  thumbnail_url: li.mockup.thumbnail_url || li.mockup.thumbnailUrl || null,  // NEW
} : null
```

### 3. UI Rendering (`src/components/orders/OrderDetailPage.tsx`)

Updated PDF rendering in two places:

#### Line Item Mockup Thumbnails

Before: PDF files showed a static PDF icon
After: PDF files show thumbnail image if available, otherwise fall back to PDF icon

```tsx
{item.mockup ? (
  isPdfUrl(item.mockup.url) ? (
    item.mockup.thumbnail_url ? (
      <a href={item.mockup.url} target="_blank" rel="noopener noreferrer">
        <img src={item.mockup.thumbnail_url} alt={item.mockup.name} />
      </a>
    ) : (
      <a href={item.mockup.url} target="_blank" rel="noopener noreferrer">
        <FilePdf size={32} />
      </a>
    )
  ) : (
    // Regular image rendering...
  )
) : (
  // No mockup placeholder...
)}
```

#### Imprint Mockup Thumbnails

Similar logic applied to imprint mockups:
- Shows thumbnail if `thumbnail_url` is available
- Falls back to PDF icon if thumbnail is not available
- Maintains clickability to open full PDF

## API Integration

The UI expects the backend API (`https://mintprints-api.ronny.works`) to return artwork file objects with the following structure:

```json
{
  "id": "ABC123",
  "url": "https://files.ronny.works/artwork/ABC123.pdf",
  "name": "Front Design.pdf",
  "source": "imprintMockup",
  "thumbnail_url": "https://files.ronny.works/artwork/ABC123_thumb.png"
}
```

The `thumbnail_url` field is optional. If it's not present or `null`, the UI will display a PDF icon instead.

## Backend Requirements

This frontend implementation assumes the backend has:

1. ✅ Generated PNG thumbnails for PDF files (stored as `{file_id}_thumb.png`)
2. ✅ Updated the database to include `thumbnail_url` in artwork file entries
3. ✅ Modified the API to return `thumbnail_url` in order detail responses

See the backend repository (`hypnotizedent/ronny-ops`) for implementation details.

## User Experience

### Before
- PDF mockups displayed as red PDF file icons
- No visual preview of PDF content
- Users had to click to open full PDF

### After
- PDF mockups show thumbnail preview when available
- Users can see content at a glance
- Clicking still opens the full PDF in a new tab
- Graceful fallback to PDF icon when thumbnail is unavailable

## Error Handling

- If `thumbnail_url` fails to load (404, network error, etc.), the image has an `onError` handler that hides the broken image
- The parent link/anchor remains clickable to access the full PDF
- If thumbnail doesn't exist, UI automatically shows the PDF icon

## Browser Compatibility

- All modern browsers support the image preview functionality
- The `<img>` tag with `object-cover` ensures proper aspect ratio
- PNG thumbnails are widely supported across all browsers

## Future Enhancements

Potential improvements:
1. Add loading skeleton while thumbnail is loading
2. Add image zoom/preview modal for thumbnails
3. Support for other document types (DOCX, AI, etc.)
4. Progressive image loading for better performance
5. Lazy loading for thumbnails in long lists
