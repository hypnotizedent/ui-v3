import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { ArrowClockwise, CloudCheck, Warning } from '@phosphor-icons/react';

export function IntegrationSettings() {
    const [loading, setLoading] = useState(false);
    const [syncMode, setSyncMode] = useState<'incremental' | 'full' | 'gap'>('incremental');
    const [days, setDays] = useState('7');
    const [lastStats, setLastStats] = useState<any>(null);

    const handleSync = async () => {
        setLoading(true);
        setLastStats(null);
        try {
            const payload: any = { mode: syncMode === 'gap' ? 'incremental' : syncMode }; // gap uses incremental + days logic in API

            if (syncMode === 'gap') {
                payload.days = parseInt(days);
            }

            const response = await fetch('/api/integrations/printavo/sync', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error('Sync failed');
            }

            const result = await response.json();
            setLastStats(result.stats);
            toast.success('Sync completed successfully');
        } catch (error) {
            console.error('Sync error:', error);
            toast.error('Failed to sync. Check server logs.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Integrations</h1>
                    <p className="text-muted-foreground">Manage external connections</p>
                </div>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <span className="font-bold text-blue-600 dark:text-blue-400">P</span>
                        </div>
                        <div>
                            <CardTitle>Printavo</CardTitle>
                            <p className="text-sm text-muted-foreground">Sync orders, customers, and invoices</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="flex h-2 w-2 rounded-full bg-green-500" />
                        <span className="text-sm font-medium">Connected</span>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Button
                            variant={syncMode === 'incremental' ? 'default' : 'outline'}
                            onClick={() => setSyncMode('incremental')}
                            className="justify-start h-auto py-3 px-4"
                        >
                            <div className="text-left">
                                <div className="font-semibold">Incremental Sync</div>
                                <div className="text-xs opacity-70">Sync new orders only</div>
                            </div>
                        </Button>

                        <Button
                            variant={syncMode === 'gap' ? 'default' : 'outline'}
                            onClick={() => setSyncMode('gap')}
                            className="justify-start h-auto py-3 px-4"
                        >
                            <div className="text-left">
                                <div className="font-semibold">Gap Fill Sync</div>
                                <div className="text-xs opacity-70">Sync recent days</div>
                            </div>
                        </Button>

                        <Button
                            variant={syncMode === 'full' ? 'default' : 'outline'}
                            onClick={() => setSyncMode('full')}
                            className="justify-start h-auto py-3 px-4"
                        >
                            <div className="text-left">
                                <div className="font-semibold">Full Re-sync</div>
                                <div className="text-xs opacity-70">Process all data</div>
                            </div>
                        </Button>
                    </div>

                    <div className="bg-muted/50 p-4 rounded-lg flex items-center justify-between">
                        <div className="flex item-center gap-4">
                            {syncMode === 'gap' && (
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium whitespace-nowrap">Sync last</span>
                                    <Input
                                        type="number"
                                        className="w-20 h-8"
                                        value={days}
                                        onChange={(e) => setDays(e.target.value)}
                                    />
                                    <span className="text-sm text-muted-foreground">days</span>
                                </div>
                            )}
                            {syncMode === 'full' && (
                                <div className="flex items-center gap-2 text-amber-600">
                                    <Warning size={18} />
                                    <span className="text-sm">This may take a while.</span>
                                </div>
                            )}
                            {syncMode === 'incremental' && (
                                <div className="text-sm text-muted-foreground pt-1">
                                    Fast sync checking for new visual IDs.
                                </div>
                            )}
                        </div>

                        <Button onClick={handleSync} disabled={loading}>
                            <ArrowClockwise className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                            {loading ? 'Syncing...' : 'Start Sync'}
                        </Button>
                    </div>

                    {lastStats && (
                        <div className="bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/20 rounded-lg p-4 animate-in fade-in slide-in-from-top-2">
                            <div className="flex items-center gap-2 mb-3 text-green-700 dark:text-green-400 font-medium">
                                <CloudCheck size={18} />
                                Sync Results
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                    <div className="text-muted-foreground">Orders</div>
                                    <div className="font-mono font-medium">
                                        +{lastStats.ordersNew} <span className="opacity-50">/</span> {lastStats.ordersUpdated} upd
                                    </div>
                                </div>
                                <div>
                                    <div className="text-muted-foreground">Customers</div>
                                    <div className="font-mono font-medium">
                                        +{lastStats.customersNew} <span className="opacity-50">/</span> {lastStats.customersUpdated} upd
                                    </div>
                                </div>
                                <div>
                                    <div className="text-muted-foreground">Line Items</div>
                                    <div className="font-mono font-medium">
                                        +{lastStats.lineItemsNew} <span className="opacity-50">/</span> {lastStats.lineItemsUpdated} upd
                                    </div>
                                </div>
                                <div>
                                    <div className="text-muted-foreground">Errors</div>
                                    <div className={`font-mono font-medium ${lastStats.errors > 0 ? 'text-red-500' : ''}`}>
                                        {lastStats.errors}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
