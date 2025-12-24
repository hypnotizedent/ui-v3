import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X } from '@phosphor-icons/react';

const API_BASE = import.meta.env.VITE_API_URL || 'https://mintprints-api.ronny.works';

const CATEGORIES = [
    'Blanks',
    'Supplies',
    'Outsourced',
    'Shipping',
    'Packaging',
    'Labor',
    'Other'
];

interface AddExpenseModalProps {
    orderId: number;
    onClose: () => void;
    onSuccess: () => void;
}

export function AddExpenseModal({ orderId, onClose, onSuccess }: AddExpenseModalProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        category: 'Blanks',
        description: '',
        vendor: '',
        amount: '',
        expenseDate: new Date().toISOString().split('T')[0],
        referenceNumber: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.amount || !formData.category) {
            setError('Amount and category are required');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const res = await fetch(`${API_BASE}/api/orders/${orderId}/expenses`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    category: formData.category,
                    description: formData.description,
                    vendor: formData.vendor,
                    amount: parseFloat(formData.amount),
                    expenseDate: formData.expenseDate,
                    referenceNumber: formData.referenceNumber
                })
            });

            if (!res.ok) throw new Error('Failed to add expense');
            onSuccess();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to add expense');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-card rounded-lg shadow-xl w-full max-w-md mx-4">
                <div className="flex items-center justify-between px-6 py-4 border-b">
                    <h2 className="text-lg font-semibold">Add Expense</h2>
                    <Button variant="ghost" size="sm" onClick={onClose}>
                        <X size={20} />
                    </Button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="category">Category *</Label>
                            <select
                                id="category"
                                value={formData.category}
                                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                            >
                                {CATEGORIES.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="amount">Amount *</Label>
                            <Input
                                id="amount"
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={formData.amount}
                                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Input
                            id="description"
                            placeholder="e.g., 24 Gildan 5000 shirts"
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="vendor">Vendor</Label>
                            <Input
                                id="vendor"
                                placeholder="e.g., S&S Activewear"
                                value={formData.vendor}
                                onChange={(e) => setFormData(prev => ({ ...prev, vendor: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="date">Date</Label>
                            <Input
                                id="date"
                                type="date"
                                value={formData.expenseDate}
                                onChange={(e) => setFormData(prev => ({ ...prev, expenseDate: e.target.value }))}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="reference">Reference/Invoice #</Label>
                        <Input
                            id="reference"
                            placeholder="Optional"
                            value={formData.referenceNumber}
                            onChange={(e) => setFormData(prev => ({ ...prev, referenceNumber: e.target.value }))}
                        />
                    </div>

                    {error && (
                        <div className="bg-destructive/10 text-destructive text-sm px-3 py-2 rounded">
                            {error}
                        </div>
                    )}

                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Adding...' : 'Add Expense'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
