import { useState } from 'react';
import { Clock, FileText, Package, Users, CaretDown, CaretRight, DownloadSimple, ArrowCounterClockwise } from '@phosphor-icons/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { formatVersionTimestamp } from '@/lib/version-control';
import { useKV } from '@github/spark/hooks';
import { DemoDataGenerator } from '@/components/shared/DemoDataGenerator';
import type { VersionedEntity, VersionEntry } from '@/lib/version-control';

interface VersionHistoryItemProps {
  version: VersionEntry<any>;
  isLatest: boolean;
  onRevert: (version: number) => void;
  onViewDetails: (version: number) => void;
}

function VersionHistoryItem({ version, isLatest, onRevert, onViewDetails }: VersionHistoryItemProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-border rounded-lg p-3 hover:bg-accent/30 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant={isLatest ? "default" : "secondary"} className="text-xs">
              v{version.version}
            </Badge>
            {isLatest && (
              <Badge variant="outline" className="text-xs">Current</Badge>
            )}
            <span className="text-xs text-muted-foreground">
              {formatVersionTimestamp(version.timestamp)}
            </span>
          </div>
          
          <p className="text-sm font-medium mb-1">{version.change_description}</p>
          
          {version.user_name && (
            <p className="text-xs text-muted-foreground">by {version.user_name}</p>
          )}
          
          {version.fields_changed && version.fields_changed.length > 0 && (
            <div className="mt-2">
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                {expanded ? <CaretDown size={14} /> : <CaretRight size={14} />}
                {version.fields_changed.length} field{version.fields_changed.length !== 1 ? 's' : ''} changed
              </button>
              
              {expanded && (
                <div className="mt-2 space-y-1">
                  {version.fields_changed.map((field, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs mr-1">
                      {field}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onViewDetails(version.version)}
            className="h-8 w-8 p-0"
          >
            <FileText size={16} />
          </Button>
          
          {!isLatest && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onRevert(version.version)}
              className="h-8 w-8 p-0"
            >
              <ArrowCounterClockwise size={16} />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

interface EntityVersionHistoryProps {
  entityType: 'order' | 'customer' | 'artwork';
  entityId: string;
  entityName: string;
}

function EntityVersionHistory({ entityType, entityId, entityName }: EntityVersionHistoryProps) {
  const storageKey = `version_${entityType}_${entityId}`;
  const [versionedEntity] = useKV<VersionedEntity<any> | null>(storageKey, null);
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);

  if (!versionedEntity || !versionedEntity.versions.length) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground text-center">No version history available</p>
        </CardContent>
      </Card>
    );
  }

  const handleRevert = (version: number) => {
    console.log(`Reverting ${entityType} ${entityId} to version ${version}`);
  };

  const handleViewDetails = (version: number) => {
    setSelectedVersion(version);
  };

  const selectedVersionData = versionedEntity.versions.find(v => v.version === selectedVersion);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock size={20} />
              Version History
            </CardTitle>
            <CardDescription>
              {entityName} - {versionedEntity.versions.length} version{versionedEntity.versions.length !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-3">
                {[...versionedEntity.versions].reverse().map((version) => (
                  <VersionHistoryItem
                    key={version.version}
                    version={version}
                    isLatest={version.version === versionedEntity.current_version}
                    onRevert={handleRevert}
                    onViewDetails={handleViewDetails}
                  />
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <div>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Version Details</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedVersionData ? (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2">Version {selectedVersionData.version}</p>
                  <p className="text-xs text-muted-foreground mb-3">
                    {formatVersionTimestamp(selectedVersionData.timestamp)}
                  </p>
                  <Separator className="my-3" />
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Changes</p>
                  <p className="text-sm text-muted-foreground">{selectedVersionData.change_description}</p>
                </div>

                {selectedVersionData.fields_changed && selectedVersionData.fields_changed.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Modified Fields</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedVersionData.fields_changed.map((field, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {field}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-sm font-medium mb-2">Data Snapshot</p>
                  <ScrollArea className="h-[200px]">
                    <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto">
                      {JSON.stringify(selectedVersionData.data, null, 2)}
                    </pre>
                  </ScrollArea>
                </div>

                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="w-full gap-2">
                    <DownloadSimple size={16} />
                    Export
                  </Button>
                  {selectedVersionData.version !== versionedEntity.current_version && (
                    <Button 
                      size="sm" 
                      className="w-full gap-2"
                      onClick={() => handleRevert(selectedVersionData.version)}
                    >
                      <ArrowCounterClockwise size={16} />
                      Revert
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                Select a version to view details
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'orders' | 'customers' | 'artwork'>('orders');
  const [refreshKey, setRefreshKey] = useState(0);

  const [orderKeys] = useKV<string[]>('version_order_keys', []);
  const [customerKeys] = useKV<string[]>('version_customer_keys', []);
  const [artworkKeys] = useKV<string[]>('version_artwork_keys', []);

  const orderVersions = (orderKeys || []).map(key => {
    const entityId = key.replace('version_order_', '');
    return { id: entityId, name: `Order ${entityId}` };
  });

  const customerVersions = (customerKeys || []).map(key => {
    const entityId = key.replace('version_customer_', '');
    return { id: entityId, name: `Customer ${entityId}` };
  });

  const artworkVersions = (artworkKeys || []).map(key => {
    const entityId = key.replace('version_artwork_', '');
    return { id: entityId, name: `Artwork ${entityId}` };
  });

  const [selectedEntity, setSelectedEntity] = useState<{ type: 'order' | 'customer' | 'artwork'; id: string; name: string } | null>(null);

  const hasAnyData = orderVersions.length > 0 || customerVersions.length > 0 || artworkVersions.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Version Control & History</h1>
        <p className="text-muted-foreground mt-1">
          Track and manage version history for orders, customers, and artwork files
        </p>
      </div>

      {!hasAnyData && (
        <DemoDataGenerator onGenerate={() => setRefreshKey(prev => prev + 1)} />
      )}

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-4">
        <TabsList>
          <TabsTrigger value="orders" className="gap-2">
            <Package size={16} />
            Orders
            {orderVersions.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {orderVersions.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="customers" className="gap-2">
            <Users size={16} />
            Customers
            {customerVersions.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {customerVersions.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="artwork" className="gap-2">
            <FileText size={16} />
            Artwork
            {artworkVersions.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {artworkVersions.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-4">
          {selectedEntity?.type === 'order' ? (
            <div className="space-y-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedEntity(null)}
                className="gap-2"
              >
                ← Back to list
              </Button>
              <EntityVersionHistory
                entityType="order"
                entityId={selectedEntity.id}
                entityName={selectedEntity.name}
              />
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Orders with Version History</CardTitle>
                <CardDescription>
                  Select an order to view its version history
                </CardDescription>
              </CardHeader>
              <CardContent>
                {orderVersions.length === 0 ? (
                  <div className="text-center py-12">
                    <Package size={48} className="mx-auto text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground">No orders with version history yet</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Version history is automatically created when orders are created or modified
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-2">
                    {orderVersions.map(order => (
                      <Button
                        key={order.id}
                        variant="outline"
                        className="justify-start h-auto py-3"
                        onClick={() => setSelectedEntity({ type: 'order', id: order.id, name: order.name })}
                      >
                        <Package size={20} className="mr-3" />
                        <span>{order.name}</span>
                      </Button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          {selectedEntity?.type === 'customer' ? (
            <div className="space-y-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedEntity(null)}
                className="gap-2"
              >
                ← Back to list
              </Button>
              <EntityVersionHistory
                entityType="customer"
                entityId={selectedEntity.id}
                entityName={selectedEntity.name}
              />
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Customers with Version History</CardTitle>
                <CardDescription>
                  Select a customer to view their version history
                </CardDescription>
              </CardHeader>
              <CardContent>
                {customerVersions.length === 0 ? (
                  <div className="text-center py-12">
                    <Users size={48} className="mx-auto text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground">No customers with version history yet</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Version history is automatically created when customer information is modified
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-2">
                    {customerVersions.map(customer => (
                      <Button
                        key={customer.id}
                        variant="outline"
                        className="justify-start h-auto py-3"
                        onClick={() => setSelectedEntity({ type: 'customer', id: customer.id, name: customer.name })}
                      >
                        <Users size={20} className="mr-3" />
                        <span>{customer.name}</span>
                      </Button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="artwork" className="space-y-4">
          {selectedEntity?.type === 'artwork' ? (
            <div className="space-y-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedEntity(null)}
                className="gap-2"
              >
                ← Back to list
              </Button>
              <EntityVersionHistory
                entityType="artwork"
                entityId={selectedEntity.id}
                entityName={selectedEntity.name}
              />
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Artwork with Version History</CardTitle>
                <CardDescription>
                  Select an artwork file to view its version history
                </CardDescription>
              </CardHeader>
              <CardContent>
                {artworkVersions.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText size={48} className="mx-auto text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground">No artwork with version history yet</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Version history is automatically created when artwork files are uploaded or modified
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-2">
                    {artworkVersions.map(artwork => (
                      <Button
                        key={artwork.id}
                        variant="outline"
                        className="justify-start h-auto py-3"
                        onClick={() => setSelectedEntity({ type: 'artwork', id: artwork.id, name: artwork.name })}
                      >
                        <FileText size={20} className="mr-3" />
                        <span>{artwork.name}</span>
                      </Button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
