import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, CurrencyDollar, TrendUp, TrendDown, Receipt, Trash } from '@phosphor-icons/react';
import { AddExpenseModal } from './AddExpenseModal';

const API_BASE = import.meta.env.VITE_API_URL || 'https://mintprints-api.ronny.works';

interface Expense {
    id: number;
    order_id: number;
    category: string;
    description: string;
    vendor: string;
    amount: number;
    expense_date: string;
    status: string;
    recorded_by: string;
}

interface ProfitData {
    orderId: number;
    visualId: string;
    revenue: number;
    totalExpenses: number;
    profit: number;
    margin: number;
    breakdown: { category: string; total: number }[];
}

interface OrderExpensesTabProps {
    orderId: number;
    orderTotal: number;
}

export function OrderExpensesTab({ orderId, orderTotal }: OrderExpensesTabProps) {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [profit, setProfit] = useState<ProfitData | null>(null);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);

    useEffect(() => {
        fetchExpenses();
        fetchProfit();
    }, [orderId]);

    const fetchExpenses = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/orders/${orderId}/expenses`);
            const data = await res.json();
            setExpenses(data.data || []);
        } catch (err) {
            console.error('Failed to fetch expenses:', err);
        }
    };

    const fetchProfit = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/orders/${orderId}/profit`);
            const data = await res.json();
            setProfit(data);
        } catch (err) {
            console.error('Failed to fetch profit:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteExpense = async (expenseId: number) => {
        if (!confirm('Delete this expense?')) return;
        try {
            await fetch(`${API_BASE}/api/expenses/${expenseId}`, { method: 'DELETE' });
            fetchExpenses();
            fetchProfit();
        } catch (err) {
            console.error('Failed to delete expense:', err);
        }
    };

    const handleAddSuccess = () => {
        setShowAddModal(false);
        fetchExpenses();
        fetchProfit();
    };

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

    const formatDate = (date: string) =>
        new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    if (loading) {
        return <div className="py-8 text-center text-muted-foreground">Loading...</div>;
    }

    const isProfit = (profit?.profit || 0) >= 0;

    return (
        <div className="space-y-6">
            {/* Profit Summary */}
            <div className="grid grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-4">
                        <div className="text-sm text-muted-foreground">Revenue</div>
                        <div className="text-2xl font-bold text-green-600">
                            {formatCurrency(profit?.revenue || orderTotal)}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <div className="text-sm text-muted-foreground">Expenses</div>
                        <div className="text-2xl font-bold text-red-600">
                            {formatCurrency(profit?.totalExpenses || 0)}
                        </div>
                    </CardContent>
                </Card>
                <Card className={isProfit ? 'border-green-500/50' : 'border-red-500/50'}>
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            {isProfit ? <TrendUp className="text-green-500" /> : <TrendDown className="text-red-500" />}
                            Profit
                        </div>
                        <div className={`text-2xl font-bold ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(profit?.profit || 0)}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <div className="text-sm text-muted-foreground">Margin</div>
                        <div className={`text-2xl font-bold ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                            {profit?.margin || 0}%
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Expenses List */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Receipt size={20} />
                        Expenses ({expenses.length})
                    </CardTitle>
                    <Button size="sm" onClick={() => setShowAddModal(true)}>
                        <Plus size={16} className="mr-1" />
                        Add Expense
                    </Button>
                </CardHeader>
                <CardContent>
                    {expenses.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <CurrencyDollar size={40} className="mx-auto mb-2 opacity-50" />
                            <p>No expenses recorded for this order</p>
                            <p className="text-sm">Add expenses to track costs and profit</p>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead>
                                <tr className="border-b text-left text-sm text-muted-foreground">
                                    <th className="pb-2">Date</th>
                                    <th className="pb-2">Category</th>
                                    <th className="pb-2">Description</th>
                                    <th className="pb-2">Vendor</th>
                                    <th className="pb-2 text-right">Amount</th>
                                    <th className="pb-2"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {expenses.map((exp) => (
                                    <tr key={exp.id} className="border-b last:border-0">
                                        <td className="py-2 text-sm">{formatDate(exp.expense_date)}</td>
                                        <td className="py-2">
                                            <span className="px-2 py-1 bg-muted rounded text-xs">{exp.category}</span>
                                        </td>
                                        <td className="py-2 text-sm">{exp.description}</td>
                                        <td className="py-2 text-sm text-muted-foreground">{exp.vendor || '-'}</td>
                                        <td className="py-2 text-right font-medium">{formatCurrency(exp.amount)}</td>
                                        <td className="py-2 text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                                                onClick={() => handleDeleteExpense(exp.id)}
                                            >
                                                <Trash size={14} />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </CardContent>
            </Card>

            {/* Breakdown by Category */}
            {profit?.breakdown && profit.breakdown.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm">Expense Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {profit.breakdown.map((item, idx) => (
                                <div key={idx} className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">{item.category}</span>
                                    <span className="font-medium">{formatCurrency(parseFloat(String(item.total)))}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Add Expense Modal */}
            {showAddModal && (
                <AddExpenseModal
                    orderId={orderId}
                    onClose={() => setShowAddModal(false)}
                    onSuccess={handleAddSuccess}
                />
            )}
        </div>
    );
}
