# Print Shop OS - Product Requirements Document

A comprehensive print shop management dashboard for tracking customers, orders, line items, imprints, artwork, and payments.

**Experience Qualities**:
1. **Efficient** - Quick access to order status and customer information with minimal clicks
2. **Professional** - Clean, dark interface that feels purpose-built for production environments
3. **Clear** - Visual hierarchy that surfaces critical information like due dates and order status

**Complexity Level**: Complex Application (advanced functionality with multiple views)
- Multiple interconnected entities (customers, orders, line items, imprints, artwork, transactions)
- Dashboard analytics, list views, and detail views
- Status workflow management

## Essential Features

### Dashboard Overview
- **Functionality**: Displays active orders count, revenue summary, and orders needing attention
- **Purpose**: Quick pulse-check on shop operations
- **Trigger**: Default landing view on app load
- **Progression**: View dashboard → Click order card → Navigate to order detail
- **Success criteria**: Shows accurate counts, clickable cards navigate correctly

### Orders List
- **Functionality**: Filterable, searchable list of all orders with status badges
- **Purpose**: Central hub for order management
- **Trigger**: Click "Orders" in navigation
- **Progression**: View list → Filter by status → Search by customer/ID → Click row → View detail
- **Success criteria**: Filters work correctly, search is responsive, status badges display correctly

### Order Detail
- **Functionality**: Complete order view with line items, imprints, artwork, and payment history
- **Purpose**: Full context for any order at a glance
- **Trigger**: Click order row from list or dashboard
- **Progression**: View order → Expand line items → View imprints → Check payment status
- **Success criteria**: All nested data displays correctly, size grids render properly

### Customers List
- **Functionality**: Searchable customer directory with tier filtering
- **Purpose**: Manage customer relationships
- **Trigger**: Click "Customers" in navigation
- **Progression**: View list → Filter by tier → Search → Click customer → View detail
- **Success criteria**: Tier badges display correctly, search works on name/company

### Customer Detail
- **Functionality**: Full customer profile with contact info and order history
- **Purpose**: Complete customer context for sales and support
- **Trigger**: Click customer row from list
- **Progression**: View profile → See order history → Click order → Navigate to order detail
- **Success criteria**: Order history shows correctly, total spend calculates accurately

### Version Control & History
- **Functionality**: Track and manage complete version history for orders, customers, and artwork files
- **Purpose**: Audit trail, change tracking, ability to revert to previous states
- **Trigger**: Navigate to Settings page (gear icon)
- **Progression**: Select entity type (Orders/Customers/Artwork) → Choose entity → View version timeline → Compare versions → Revert if needed
- **Success criteria**: All versions are tracked with timestamps, user attribution, field changes are identified, revert functionality works correctly

## Edge Case Handling

- **Empty states**: Show helpful messages when no orders/customers exist with call-to-action
- **Missing artwork**: Display placeholder state for imprints without uploaded artwork
- **Zero quantities**: Size cells with 0 display muted, non-zero are emphasized
- **Long names**: Truncate with ellipsis, full name on hover via tooltip
- **No version history**: Display demo data generator to help users understand version control features
- **Version conflicts**: Each version maintains complete data snapshot to prevent data loss

## Design Direction

Industrial, professional, and focused. The interface should feel like a control center for production operations - information-dense but organized, with status information immediately visible.

## Color Selection

Dark theme with mint/emerald accents for a modern, production-focused aesthetic.

- **Primary Color**: Emerald (`oklch(0.696 0.17 162.48)`) - Growth, production, action
- **Secondary Colors**: Slate grays for structure and hierarchy
- **Accent Color**: Mint/Emerald (#10B981) for CTAs and success states
- **Status Colors**:
  - QUOTE: Slate (`oklch(0.55 0.02 260)`)
  - NEW: Blue (`oklch(0.65 0.2 250)`)
  - ART APPROVAL: Yellow (`oklch(0.8 0.15 85)`)
  - IN PRODUCTION: Purple (`oklch(0.65 0.2 300)`)
  - COMPLETE: Green (`oklch(0.7 0.17 145)`)
  - SHIPPED: Emerald (`oklch(0.696 0.17 162.48)`)
- **Foreground/Background Pairings**:
  - Background (Slate 900): White text - Ratio 15:1 ✓
  - Card (Slate 800): White text - Ratio 12:1 ✓
  - Accent (Emerald): White text - Ratio 4.6:1 ✓

## Font Selection

Clean, technical typography that prioritizes readability in data-dense interfaces.

- **Primary Font**: Inter - Modern, highly readable for UI text
- **Typographic Hierarchy**:
  - H1 (Page Title): Inter SemiBold/28px/tight
  - H2 (Section Title): Inter SemiBold/20px/tight
  - H3 (Card Title): Inter Medium/16px/normal
  - Body: Inter Regular/14px/normal
  - Caption: Inter Regular/12px/normal
  - Badge: Inter Medium/11px/uppercase

## Animations

Subtle, functional animations that enhance clarity without slowing workflows - quick transitions on tab changes, smooth hover states on cards, and gentle fades for loading states.

## Component Selection

- **Components**:
  - Card: Order cards, customer cards, stat cards
  - Badge: Status indicators, tier badges, method badges, version badges
  - Table: Orders list, customers list, line items
  - Tabs: Navigation between views, version control entity types
  - Input: Search fields
  - Select: Status filter, tier filter
  - ScrollArea: Long lists within cards, version history timeline
  - Separator: Section dividers
  - Tooltip: Truncated text reveals
  - Popover: Version history quick view

- **Customizations**:
  - Size breakdown grid component for XS-3XL quantities
  - Imprint location badge with method indicator
  - Payment timeline component
  - Version history badge with popover
  - Version timeline component with diff viewer

- **States**:
  - Buttons: Default (slate), hover (lighter), active (emerald)
  - Cards: Default (slate-800 border), hover (slate-700 border)
  - Badges: Colored backgrounds with matching text

- **Icon Selection**:
  - Package: Orders
  - Users: Customers
  - ChartLine: Dashboard
  - Printer: Imprints
  - CreditCard: Payments
  - FileImage: Artwork

- **Spacing**: Tailwind scale - gap-4 for cards, gap-2 for inline elements, p-4 for card padding

- **Mobile**: Stack cards vertically, collapsible sections for order details, horizontal scroll for size grids
