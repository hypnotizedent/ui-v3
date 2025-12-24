# Version Control System

## Overview

The Mint Prints application now includes a comprehensive version control system that automatically tracks changes to:
- **Orders** - All order modifications including status changes, pricing updates, and customer information
- **Customers** - Customer profile changes including contact information, address, and tier updates
- **Artwork** - Artwork file uploads, approvals, and modifications

## Features

- **Automatic Version Tracking** - Every modification creates a new version automatically
- **Version History View** - Browse complete history of changes for each entity
- **Change Comparison** - See which fields were modified in each version
- **Version Revert** - Roll back to any previous version with one click
- **User Attribution** - Track who made each change
- **Data Export** - Export version snapshots for backup or audit purposes

## How It Works

### For Orders

When an order is created or modified:
1. A new version is automatically created
2. Changed fields are identified and tracked
3. Complete order snapshot is stored
4. Version number is incremented

### For Customers

Customer modifications are tracked including:
- Contact information (name, email, phone)
- Address changes
- Company information updates
- Tier adjustments

### For Artwork

Artwork versioning tracks:
- File uploads
- Approval status changes
- File replacements
- Metadata modifications

## Using the Version Control System

### Viewing Version History

1. Navigate to **Settings** (gear icon in sidebar)
2. Select the entity type tab (Orders, Customers, or Artwork)
3. Click on an entity to view its version history
4. Browse through versions to see changes over time

### Version History Badge Component

Add version tracking to any component:

```typescript
import { VersionHistoryBadge } from '@/components/shared/VersionHistoryBadge';

<VersionHistoryBadge
  versions={versionedEntity.versions}
  currentVersion={versionedEntity.current_version}
  entityName="Order MP-2024-001"
  onRevert={(version) => handleRevert(version)}
/>
```

### Using the Version Control Hook

Integrate version control into your components:

```typescript
import { useVersionControl } from '@/hooks/use-version-control';

function MyComponent() {
  const {
    versionedEntity,
    addVersion,
    getCurrentVersion,
    getAllVersions,
    revertToVersion
  } = useVersionControl<OrderType>('order-123', 'order');

  // Create initial version
  useEffect(() => {
    if (!versionedEntity) {
      initializeVersioning(orderData, 'Initial order creation');
    }
  }, []);

  // Add new version when data changes
  const handleUpdate = (newData: OrderType) => {
    addVersion(
      newData,
      'Updated order status',
      userId,
      userName
    );
  };

  // Revert to previous version
  const handleRevert = (version: number) => {
    revertToVersion(version, 'Reverted to previous state');
  };

  return (
    <div>
      {/* Your component UI */}
    </div>
  );
}
```

### Creating Versions Manually

```typescript
import { createVersion } from '@/lib/version-control';

const newVersion = createVersion(
  entityId,
  'order',
  orderData,
  'Updated due date',
  ['due_date', 'customer_due_date'],
  'user-123',
  'John Smith'
);
```

## Data Structure

### VersionedEntity

```typescript
{
  entity_id: string;          // Unique identifier for the entity
  entity_type: 'order' | 'customer' | 'artwork';
  current_version: number;    // Latest version number
  versions: VersionEntry[];   // Array of all versions
}
```

### VersionEntry

```typescript
{
  version: number;            // Version number (1, 2, 3, etc.)
  timestamp: string;          // ISO timestamp of when version was created
  user_id?: string;          // ID of user who made the change
  user_name?: string;        // Name of user who made the change
  change_description: string; // Human-readable description of changes
  fields_changed?: string[]; // Array of field names that were modified
  data: T;                   // Complete snapshot of entity at this version
}
```

## Storage

Version data is stored using the Spark KV storage system:
- Key format: `version_{type}_{id}` (e.g., `version_order_MP-2024-001`)
- Index keys: `version_order_keys`, `version_customer_keys`, `version_artwork_keys`

## Best Practices

1. **Initialize Early** - Create the first version when an entity is created
2. **Descriptive Changes** - Use clear, concise descriptions for each version
3. **Track Fields** - Always include which fields were changed for better tracking
4. **User Attribution** - Pass user information when available for audit trails
5. **Strategic Reversion** - Only revert when necessary; each revert creates a new version

## Demo Data

To explore the version control system:
1. Navigate to Settings
2. Click "Generate Demo Version History" if no data exists
3. Browse through the sample orders, customers, and artwork
4. View version details and test the revert functionality

## API Reference

### useVersionControl Hook

```typescript
const {
  versionedEntity,      // Current versioned entity or null
  initializeVersioning, // (data, description) => void
  addVersion,          // (data, description, userId?, userName?) => void
  getVersion,          // (version) => VersionEntry | null
  getCurrentVersion,   // () => VersionEntry | null
  getAllVersions,      // () => VersionEntry[]
  revertToVersion,     // (version, description?) => void
  hasVersions          // boolean
} = useVersionControl<T>(entityId, entityType);
```

### Utility Functions

```typescript
// Compare two versions and get changed fields
const changedFields = compareVersions(oldVersion, newVersion);

// Format version timestamp for display
const displayTime = formatVersionTimestamp(version.timestamp);

// Get difference between two version entries
const diff = getVersionDiff(version1, version2);
```

## Future Enhancements

- Diff viewer showing exact changes between versions
- Bulk export/import of version data
- Version history search and filtering
- Automatic version creation on specific triggers
- Version retention policies
- Change notifications
