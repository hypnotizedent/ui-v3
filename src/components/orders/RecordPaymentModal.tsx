import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CurrencyDollar, CircleNotch } from '@phosphor-icons/react';
import { toast } from 'sonner';

const API_BASE = import.meta.env.VITE_DASHBOARD_API_URL || 'https://mintprints-api.ronny.works';

interface RecordPaymentModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    orderId: number;
    orderNumber: string;
    balanceDue: number;
    onSuccess: () => void;
}

const PAYMENT_METHODS = [
    { value: 'cash', label: 'Cash' },
    { value: 'card', label: 'Credit/Debit Card' },
    { value: 'check', label: 'Check' },
    { value: 'venmo', label: 'Venmo' },
    { value: 'zelle', label: 'Zelle' },
    { value: 'paypal', label: 'PayPal' },
    { value: 'other', label: 'Other' },
];

export function RecordPaymentModal({
    open,
    onOpenChange,
    orderId,
    orderNumber,
    balanceDue,
    onSuccess,
}: RecordPaymentModalProps) {
    const [amount, setAmount] = useState<string>(balanceDue.toFixed(2));
    const [paymentMethod, setPaymentMethod] = useState<string>('card');
    const [referenceNumber, setReferenceNumber] = useState<string>('');
    const [notes, setNotes] = useState<string>('');
    const [saving, setSaving] = useState(false);

    const handleSubmit = async () => {
        const amountNum = parseFloat(amount);
        if (isNaN(amountNum) || amountNum <= 0) {
            toast.error('Please enter a valid payment amount');
            return;
        }

        if (!paymentMethod) {
            toast.error('Please select a payment method');
            return;
        }

        setSaving(true);
        try {
            const response = await fetch(`${API_BASE}/api/orders/${orderId}/payments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: amountNum,
                    paymentMethod,
                    paymentType: 'payment',
                    referenceNumber: referenceNumber || null,
                    paymentDate: new Date().toISOString().split('T')[0],
                    recordedBy: 'Admin',
                    notes: notes || null,
                }),
            });

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data.error || 'Failed to record payment');
            }

            toast.success(`Payment of $${amountNum.toFixed(2)} recorded`);
            onSuccess();
            onOpenChange(false);
            // Reset form
            setAmount('');
            setPaymentMethod('card');
            setReferenceNumber('');
            setNotes('');
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to record payment');
        } finally {
            setSaving(false);
        }
    };

    const handleClose = () => {
        if (!saving) {
            onOpenChange(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <CurrencyDollar size={20} weight="bold" className="text-green-500" />
                        Record Payment - Order #{orderNumber}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Balance Due Info */}
                    <div className="bg-muted/50 rounded-lg p-3 text-center">
                        <span className="text-sm text-muted-foreground">Balance Due: </span>
                        <span className={`text-lg font-semibold ${balanceDue > 0 ? 'text-yellow-500' : 'text-green-500'}`}>
                            ${balanceDue.toFixed(2)}
                        </span>
                    </div>

                    {/* Amount */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Amount *</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                            <Input
                                type="number"
                                step="0.01"
                                min="0.01"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="pl-7"
                                placeholder="0.00"
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* Payment Method */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Payment Method *</label>
                        <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select method" />
                            </SelectTrigger>
                            <SelectContent>
                                {PAYMENT_METHODS.map((method) => (
                                    <SelectItem key={method.value} value={method.value}>
                                        {method.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Reference Number (optional) */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Reference # (optional)</label>
                        <Input
                            value={referenceNumber}
                            onChange={(e) => setReferenceNumber(e.target.value)}
                            placeholder="Check # or Transaction ID"
                        />
                    </div>

                    {/* Notes (optional) */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Notes (optional)</label>
                        <Textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add any additional notes..."
                            className="min-h-[60px] resize-none"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose} disabled={saving}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={saving} className="gap-2">
                        {saving ? (
                            <>
                                <CircleNotch size={16} className="animate-spin" />
                                Recording...
                            </>
                        ) : (
                            <>
                                <CurrencyDollar size={16} weight="bold" />
                                Record Payment
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
