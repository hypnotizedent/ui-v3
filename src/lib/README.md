# Print Shop OS - API Adapter

Data transformation layer that connects the Spark UI to your real mintprints-api.

## Files

| File | Purpose |
|------|---------|
| `api-adapter.ts` | Transforms API responses → Spark types |
| `hooks.ts` | React hooks for data fetching |

## Installation

1. Copy both files to `src/lib/` in your print-shop-os repo:

```bash
cp api-adapter.ts ~/path-to-repo/src/lib/
cp hooks.ts ~/path-to-repo/src/lib/
```

2. Add environment variable to `.env`:

```env
# Use real API
VITE_API_URL=https://mintprints-api.ronny.works

# Or use dev data for local testing
VITE_USE_DEV_DATA=true
```

## Usage in Components

### Dashboard

```tsx
import { useDashboardStats } from '@/lib/hooks'

function Dashboard() {
  const { stats, loading, error } = useDashboardStats()
  
  if (loading) return <Spinner />
  if (error) return <Error message={error.message} />
  
  return (
    <div>
      <StatCard title="Active Orders" value={stats.activeOrders} />
      <StatCard title="Total Revenue" value={`$${stats.totalRevenue.toFixed(2)}`} />
      <StatCard title="Customers" value={stats.customerCount} />
      <StatCard title="Needs Attention" value={stats.needsAttention} />
    </div>
  )
}
```

### Orders List

```tsx
import { useOrders } from '@/lib/hooks'

function OrdersList() {
  const { orders, total, loading, error, refetch } = useOrders({ limit: 50 })
  
  if (loading) return <Spinner />
  if (error) return <Error message={error.message} />
  
  return (
    <div>
      <p>Showing {orders.length} of {total} orders</p>
      {orders.map(order => (
        <OrderRow key={order.id} order={order} />
      ))}
    </div>
  )
}
```

### Customers List

```tsx
import { useCustomers } from '@/lib/hooks'

function CustomersList() {
  const { customers, total, loading } = useCustomers({ limit: 50 })
  
  return (
    <div>
      {customers.map(customer => (
        <CustomerRow key={customer.id} customer={customer} />
      ))}
    </div>
  )
}
```

## Data Flow

```
mintprints-api.ronny.works
        │
        ▼
   api-adapter.ts (transforms data)
        │
        ▼
     hooks.ts (React state management)
        │
        ▼
   UI Components (Spark)
```

## Type Mappings

### Order Status

| API Status | Spark Status |
|------------|--------------|
| QUOTE | quote |
| NEW, PENDING, ART APPROVAL | pending_approval |
| APPROVED, ARTWORK APPROVED | artwork_approved |
| IN PRODUCTION, PRINTING | in_production |
| SHIPPED | shipped |
| READY, READY FOR PICKUP | ready_for_pickup |
| COMPLETE, DELIVERED | delivered |
| ON HOLD, HOLD | on_hold |
| CANCELLED, CANCELED | cancelled |

### Size Fields

| API Field | Spark Size |
|-----------|------------|
| size_xs | XS |
| size_s | S |
| size_m | M |
| size_l | L |
| size_xl | XL |
| size_2_xl | 2XL |
| size_3_xl | 3XL |
| size_other | Other |

### Imprint Types

Inferred from status name and category:
- `embroid*` → embroidery
- `dtg`, `direct to garment` → dtg
- `vinyl`, `heat` → vinyl
- `digital` → digital_transfer
- default → screen_print

## Switching Between Dev Data and API

```env
# Local development with mock data
VITE_USE_DEV_DATA=true

# Production with real API
VITE_USE_DEV_DATA=false
VITE_API_URL=https://mintprints-api.ronny.works
```

## Extending

To add new transformations:

1. Add API type in `api-adapter.ts` under "API RESPONSE TYPES"
2. Add Spark type under "TYPES"
3. Create transform function
4. Export from adapter
5. Create hook if needed in `hooks.ts`
