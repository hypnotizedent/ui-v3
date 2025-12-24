# Version Control Integration Examples

This document provides practical examples of how to integrate version control into existing components.

## Example 1: Customer Detail Component with Version Control

```typescript
import { useEffect } from 'react';
import { useVersionControl } from '@/hooks/use-version-control';
import { VersionHistoryBadge } from '@/components/shared/VersionHistoryBadge';
import type { Customer } from '@/lib/types';

function CustomerDetailWithVersioning({ customerId }: { customerId: string }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  
  // Initialize version control
  const {
    versionedEntity,
    initializeVersioning,
    addVersion,
    getAllVersions,
    revertToVersion
  } = useVersionControl<Customer>(customerId, 'customer');

  // Initialize versioning when customer loads
  useEffect(() => {
    if (customer && !versionedEntity) {
      initializeVersioning(customer, 'Customer created');
    }
  }, [customer, versionedEntity]);

  // When customer data changes, create new version
  const handleUpdateCustomer = async (updatedCustomer: Customer) => {
    setCustomer(updatedCustomer);
    
    // Track the change in version control
    addVersion(
      updatedCustomer,
      'Customer information updated',
      'user-123',
      'John Smith'
    );
    
    // Also save to API
    await saveCustomerToAPI(updatedCustomer);
  };

  // Handle reverting to previous version
  const handleRevert = (version: number) => {
    const targetVersion = versionedEntity?.versions.find(v => v.version === version);
    if (targetVersion) {
      setCustomer(targetVersion.data);
      // Optionally save to API
      saveCustomerToAPI(targetVersion.data);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1>Customer Detail</h1>
        
        {/* Version History Badge */}
        {versionedEntity && (
          <VersionHistoryBadge
            versions={getAllVersions()}
            currentVersion={versionedEntity.current_version}
            entityName={customer?.name || 'Customer'}
            onRevert={handleRevert}
          />
        )}
      </div>

      {/* Rest of your component */}
    </div>
  );
}
```

## Example 2: Order Status Change with Version Tracking

```typescript
import { useVersionControl } from '@/hooks/use-version-control';
import type { Order } from '@/lib/types';

function OrderStatusChanger({ order }: { order: Order }) {
  const { addVersion } = useVersionControl<Order>(order.id, 'order');

  const handleStatusChange = async (newStatus: string) => {
    const updatedOrder = {
      ...order,
      status: newStatus
    };

    // Create new version with specific change description
    addVersion(
      updatedOrder,
      `Status changed from ${order.status} to ${newStatus}`,
      await getCurrentUserId(),
      await getCurrentUserName()
    );

    // Update the order in your system
    await updateOrderStatus(order.id, newStatus);
    
    toast.success('Order status updated');
  };

  return (
    <Select onValueChange={handleStatusChange} value={order.status}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="QUOTE">Quote</SelectItem>
        <SelectItem value="NEW">New</SelectItem>
        <SelectItem value="IN_PRODUCTION">In Production</SelectItem>
        <SelectItem value="COMPLETE">Complete</SelectItem>
      </SelectContent>
    </Select>
  );
}
```

## Example 3: Artwork Upload with Version Tracking

```typescript
import { useVersionControl } from '@/hooks/use-version-control';
import type { Artwork } from '@/lib/types';

function ArtworkUploader({ imprintId }: { imprintId: string }) {
  const [artwork, setArtwork] = useState<Artwork | null>(null);
  
  const {
    initializeVersioning,
    addVersion
  } = useVersionControl<Artwork>(`artwork-${imprintId}`, 'artwork');

  const handleFileUpload = async (file: File) => {
    // Upload file and get URL
    const fileUrl = await uploadFile(file);
    
    const newArtwork: Artwork = {
      id: `artwork-${imprintId}-${Date.now()}`,
      imprint_id: imprintId,
      file_url: fileUrl,
      filename: file.name,
      file_size: file.size,
      approved: false,
      uploaded_at: new Date().toISOString(),
      notes: ''
    };

    setArtwork(newArtwork);

    // Create version entry
    if (!artwork) {
      // First upload
      initializeVersioning(newArtwork, 'Initial artwork upload');
    } else {
      // Replacement upload
      addVersion(newArtwork, `Artwork replaced with ${file.name}`);
    }

    toast.success('Artwork uploaded and versioned');
  };

  const handleApprovalToggle = () => {
    if (!artwork) return;

    const updatedArtwork = {
      ...artwork,
      approved: !artwork.approved
    };

    setArtwork(updatedArtwork);
    
    addVersion(
      updatedArtwork,
      updatedArtwork.approved ? 'Artwork approved' : 'Artwork approval revoked'
    );
  };

  return (
    <div>
      <input type="file" onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) handleFileUpload(file);
      }} />
      
      {artwork && (
        <div>
          <img src={artwork.file_url} alt={artwork.filename} />
          <Button onClick={handleApprovalToggle}>
            {artwork.approved ? 'Revoke Approval' : 'Approve Artwork'}
          </Button>
        </div>
      )}
    </div>
  );
}
```

## Example 4: Bulk Operations with Version Control

```typescript
import { useVersionControl } from '@/hooks/use-version-control';

function BulkOrderPriceUpdater({ orderIds }: { orderIds: string[] }) {
  const [percentage, setPercentage] = useState(10);

  const handleBulkUpdate = async () => {
    const promises = orderIds.map(async (orderId) => {
      const order = await getOrder(orderId);
      const { addVersion } = useVersionControl<Order>(orderId, 'order');
      
      const updatedOrder = {
        ...order,
        total: order.total * (1 + percentage / 100),
        subtotal: order.subtotal * (1 + percentage / 100)
      };

      // Create version for each order
      addVersion(
        updatedOrder,
        `Bulk price increase: ${percentage}%`,
        'admin-user',
        'Admin'
      );

      return updateOrder(updatedOrder);
    });

    await Promise.all(promises);
    toast.success(`Updated ${orderIds.length} orders with version tracking`);
  };

  return (
    <div>
      <Input
        type="number"
        value={percentage}
        onChange={(e) => setPercentage(Number(e.target.value))}
        placeholder="Percentage increase"
      />
      <Button onClick={handleBulkUpdate}>
        Update {orderIds.length} Orders
      </Button>
    </div>
  );
}
```

## Example 5: Version Comparison Display

```typescript
import { getVersionDiff } from '@/lib/version-control';
import type { VersionEntry } from '@/lib/version-control';

function VersionComparison({ v1, v2 }: { 
  v1: VersionEntry<any>; 
  v2: VersionEntry<any>; 
}) {
  const differences = getVersionDiff(v1, v2);

  return (
    <div className="space-y-2">
      <h3>Changes from v{v1.version} to v{v2.version}</h3>
      
      {differences.map(field => (
        <div key={field} className="grid grid-cols-2 gap-4 p-2 border rounded">
          <div>
            <Badge>Before</Badge>
            <pre>{JSON.stringify(v1.data[field], null, 2)}</pre>
          </div>
          <div>
            <Badge>After</Badge>
            <pre>{JSON.stringify(v2.data[field], null, 2)}</pre>
          </div>
        </div>
      ))}
    </div>
  );
}
```

## Example 6: Automatic Version Creation on Form Submit

```typescript
import { useForm } from 'react-hook-form';
import { useVersionControl } from '@/hooks/use-version-control';

function CustomerEditForm({ customer }: { customer: Customer }) {
  const { register, handleSubmit } = useForm({
    defaultValues: customer
  });

  const { addVersion } = useVersionControl<Customer>(
    customer.id, 
    'customer'
  );

  const onSubmit = async (data: Customer) => {
    // Automatically create version on form save
    addVersion(
      data,
      'Customer information updated via form',
      'current-user-id',
      'Current User'
    );

    await saveCustomer(data);
    toast.success('Customer updated and versioned');
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Input {...register('name')} placeholder="Name" />
      <Input {...register('email')} placeholder="Email" />
      <Input {...register('phone')} placeholder="Phone" />
      <Button type="submit">Save Changes</Button>
    </form>
  );
}
```

## Best Practices

1. **Initialize Early**: Create the first version when entities are created
2. **Descriptive Messages**: Use clear change descriptions
3. **User Attribution**: Always pass user info when available
4. **Strategic Versioning**: Don't version every keystroke, version on save/submit
5. **Error Handling**: Wrap version operations in try-catch blocks
6. **Loading States**: Show loading indicators during version operations
7. **Confirmation**: Ask for confirmation before reverting to previous versions
