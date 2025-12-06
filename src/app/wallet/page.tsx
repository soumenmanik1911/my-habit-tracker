'use client';

import { useState, useTransition } from 'react';
import { addExpense, deleteExpense } from '@/actions/expenses';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MainLayout } from '@/components/MainLayout';

interface Expense {
  id: number;
  amount: number;
  category: string;
  description: string;
  is_debt: boolean;
  date: string;
}

export default function WalletPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string>('');

  // Fetch expenses (current month)
  const fetchExpenses = async () => {
    try {
      const response = await fetch('/api/wallet/expenses');
      const data = await response.json();
      setExpenses(data);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    }
  };

  // Handle form submission
  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      const result = await addExpense(formData);
      if (result.error) {
        setMessage(result.error);
      } else {
        setMessage('Expense added successfully!');
        fetchExpenses(); // Refresh the list
      }
    });
  };

  // Handle expense deletion
  const handleDeleteExpense = (expenseId: number) => {
    startTransition(async () => {
      const result = await deleteExpense(expenseId);
      if (result.error) {
        setMessage(result.error);
      } else {
        setMessage('Expense deleted successfully!');
        fetchExpenses(); // Refresh the list
      }
    });
  };

  // Calculate totals
  const regularExpenses = expenses.filter(e => !e.is_debt);
  const debts = expenses.filter(e => e.is_debt);
  const totalExpenses = regularExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalDebts = debts.reduce((sum, e) => sum + e.amount, 0);

  // Group expenses by category
  const expensesByCategory = regularExpenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);

  return (
    <MainLayout showHeader={true} showSidebar={true}>
      <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Wallet Tracker</h1>
        <p className="text-gray-400">Track your expenses and manage your debts (Udhaar)</p>
      </div>

      {/* Add Expense Form */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Add Expense</CardTitle>
          <CardDescription className="text-gray-400">
            Log a new expense or debt
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="amount" className="text-sm font-medium text-gray-300">
                  Amount (₹)
                </label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  step="0.01"
                  placeholder="100.00"
                  className="bg-gray-800 border-gray-700 text-white"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="category" className="text-sm font-medium text-gray-300">
                  Category
                </label>
                <Select name="category" required>
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Food">Food</SelectItem>
                    <SelectItem value="Travel">Travel</SelectItem>
                    <SelectItem value="Recharge">Recharge</SelectItem>
                    <SelectItem value="Books">Books</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label htmlFor="description" className="text-sm font-medium text-gray-300">
                Description (Optional)
              </label>
              <Input
                id="description"
                name="description"
                placeholder="e.g., Lunch, Bus fare, Phone recharge"
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isDebt"
                name="isDebt"
                className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-blue-600"
              />
              <label htmlFor="isDebt" className="text-sm font-medium text-gray-300">
                This is "Udhaar" (Debt)
              </label>
            </div>
            
            <Button
              type="submit"
              disabled={isPending}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isPending ? 'Adding...' : 'Add Expense'}
            </Button>
          </form>
          
          {message && (
            <div className={`mt-4 p-3 rounded ${message.includes('success') ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
              {message}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Total Expenses (This Month)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">
              ₹{totalExpenses.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Total Debts (Udhaar)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-400">
              ₹{totalDebts.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expense Category Breakdown */}
      {Object.keys(expensesByCategory).length > 0 && (
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Expense Breakdown</CardTitle>
            <CardDescription className="text-gray-400">
              Expenses by category this month
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(expensesByCategory).map(([category, amount]) => (
                <div key={category} className="flex justify-between items-center">
                  <span className="text-gray-300">{category}</span>
                  <span className="text-white font-medium">₹{amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Expenses */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Recent Transactions</CardTitle>
          <CardDescription className="text-gray-400">
            Latest expenses and debts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={fetchExpenses}
            className="mb-4 bg-gray-700 hover:bg-gray-600"
          >
            Refresh
          </Button>

          {expenses.length === 0 ? (
            <p className="text-gray-400 text-center py-8">
              No expenses recorded yet
            </p>
          ) : (
            <div className="space-y-3">
              {expenses.map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between p-4 bg-gray-800 rounded-lg border border-gray-700"
                >
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-white">
                        ₹{expense.amount.toFixed(2)}
                        {expense.is_debt && <span className="text-orange-400 ml-2">(Udhaar)</span>}
                      </h3>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          expense.is_debt
                            ? 'bg-orange-900 text-orange-300'
                            : 'bg-blue-900 text-blue-300'
                        }`}
                      >
                        {expense.category}
                      </span>
                    </div>
                    {expense.description && (
                      <p className="text-sm text-gray-400 mt-1">{expense.description}</p>
                    )}
                    <div className="text-sm text-gray-500 mt-1">
                      {new Date(expense.date).toLocaleDateString()}
                    </div>
                  </div>
                  <Button
                    onClick={() => handleDeleteExpense(expense.id)}
                    disabled={isPending}
                    className="ml-4 bg-red-600 hover:bg-red-700 text-xs px-3 py-1"
                  >
                    Delete
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </MainLayout>
  );
}