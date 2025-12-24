import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { fetchShopAddress, fetchShippingRates, buyShippingLabel, type ShippingRate, type ShippingAddress } from '@/lib/api-adapter';
import { toast } from 'sonner';
import { CircleNotch, Truck, Money } from '@phosphor-icons/react';

interface CreateLabelModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    order: {
        id: string;
        customer: {
            name: string;
            company: string;
            email: string;
            phone: string;
            address?: {
                street: string;
                city: string;
                state: string;
                zip: string;
            }
        }
    };
}

export function CreateLabelModal({ open, onOpenChange, order }: CreateLabelModalProps) {
    const [step, setStep] = useState<'details' | 'rates' | 'success'>('details');
    const [loading, setLoading] = useState(false);

    // Parcel Details
    const [weight, setWeight] = useState('1.0');
    const [length, setLength] = useState('12');
    const [width, setWidth] = useState('10');
    const [height, setHeight] = useState('4');

    // Address
    const [toAddress, setToAddress] = useState<ShippingAddress>({
        name: order.customer.name,
        company: order.customer.company || '',
        street1: order.customer.address?.street || '',
        city: order.customer.address?.city || '',
        state: order.customer.address?.state || '',
        zip: order.customer.address?.zip || '',
        country: 'US',
        phone: order.customer.phone || ''
    });

    // Rates
    const [rates, setRates] = useState<ShippingRate[]>([]);
    const [selectedRateId, setSelectedRateId] = useState<string>('');
    const [shipmentId, setShipmentId] = useState<string>('');

    // Success
    const [labelResult, setLabelResult] = useState<{ labelUrl: string, trackingCode: string } | null>(null);

    // pre-fill address if available
    useEffect(() => {
        if (open) {
            setStep('details');
            setLabelResult(null);
            setRates([]);
            // Reset address from order prop if needed
        }
    }, [open]);

    const handleGetRates = async () => {
        setLoading(true);
        try {
            const parcel = {
                weight: parseFloat(weight),
                length: parseFloat(length),
                width: parseFloat(width),
                height: parseFloat(height)
            };

            const result = await fetchShippingRates(toAddress, parcel);
            setShipmentId(result.shipmentId);
            setRates(result.rates);
            if (result.rates.length > 0) {
                setSelectedRateId(result.rates[0].id);
            }
            setStep('rates');
        } catch (err: any) {
            toast.error(err.message || 'Failed to get rates');
        } finally {
            setLoading(false);
        }
    };

    const handleBuyLabel = async () => {
        setLoading(true);
        try {
            const result = await buyShippingLabel(shipmentId, selectedRateId);
            setLabelResult(result);
            setStep('success');
            toast.success('Label purchased successfully!');
        } catch (err: any) {
            toast.error(err.message || 'Failed to purchase label');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle>Create Shipping Label</DialogTitle>
                </DialogHeader>

                {step === 'details' && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <h3 className="font-medium text-sm">Package Details</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <Label>Weight (lbs)</Label>
                                        <Input value={weight} onChange={e => setWeight(e.target.value)} type="number" step="0.1" />
                                    </div>
                                    <div>
                                        {/* Spacer */}
                                    </div>
                                    <div>
                                        <Label>Length (in)</Label>
                                        <Input value={length} onChange={e => setLength(e.target.value)} type="number" />
                                    </div>
                                    <div>
                                        <Label>Width (in)</Label>
                                        <Input value={width} onChange={e => setWidth(e.target.value)} type="number" />
                                    </div>
                                    <div>
                                        <Label>Height (in)</Label>
                                        <Input value={height} onChange={e => setHeight(e.target.value)} type="number" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h3 className="font-medium text-sm">Recipient Address</h3>
                                <div>
                                    <Label>Name</Label>
                                    <Input value={toAddress.name} onChange={e => setToAddress({ ...toAddress, name: e.target.value })} />
                                </div>
                                <div>
                                    <Label>Street</Label>
                                    <Input value={toAddress.street1} onChange={e => setToAddress({ ...toAddress, street1: e.target.value })} />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <Input placeholder="City" value={toAddress.city} onChange={e => setToAddress({ ...toAddress, city: e.target.value })} />
                                    <Input placeholder="State" value={toAddress.state} onChange={e => setToAddress({ ...toAddress, state: e.target.value })} />
                                </div>
                                <Input placeholder="Zip" value={toAddress.zip} onChange={e => setToAddress({ ...toAddress, zip: e.target.value })} />
                            </div>
                        </div>
                    </div>
                )}

                {step === 'rates' && (
                    <div className="space-y-4">
                        <h3 className="font-medium">Select a Rate</h3>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {rates.map(rate => (
                                <div
                                    key={rate.id}
                                    className={`p-3 border rounded-lg cursor-pointer flex justify-between items-center ${selectedRateId === rate.id ? 'border-primary bg-primary/5' : 'hover:bg-muted'}`}
                                    onClick={() => setSelectedRateId(rate.id)}
                                >
                                    <div className="flex items-center gap-3">
                                        <Truck className="w-5 h-5 text-muted-foreground" />
                                        <div>
                                            <p className="font-medium">{rate.carrier} - {rate.service}</p>
                                            <p className="text-xs text-muted-foreground">{rate.deliveryDays ? `${rate.deliveryDays} days` : 'Standard'}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-lg">${parseFloat(rate.rate).toFixed(2)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {step === 'success' && labelResult && (
                    <div className="text-center py-6 space-y-4">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                            <Truck className="w-8 h-8 text-green-600" weight="fill" />
                        </div>
                        <h3 className="text-xl font-semibold text-green-700">Label Created!</h3>
                        <p className="text-muted-foreground">Tracking: {labelResult.trackingCode}</p>
                        <div className="flex gap-3 justify-center pt-4">
                            <Button asChild>
                                <a href={labelResult.labelUrl} target="_blank" rel="noopener noreferrer">
                                    Print Label (PNG)
                                </a>
                            </Button>
                        </div>
                    </div>
                )}

                <DialogFooter>
                    {step === 'details' && (
                        <Button onClick={handleGetRates} disabled={loading}>
                            {loading && <CircleNotch className="w-4 h-4 animate-spin mr-2" />}
                            Get Rates
                        </Button>
                    )}
                    {step === 'rates' && (
                        <>
                            <Button variant="outline" onClick={() => setStep('details')}>Back</Button>
                            <Button onClick={handleBuyLabel} disabled={loading || !selectedRateId}>
                                {loading && <CircleNotch className="w-4 h-4 animate-spin mr-2" />}
                                Buy Label
                            </Button>
                        </>
                    )}
                    {step === 'success' && (
                        <Button onClick={handleClose}>Done</Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
