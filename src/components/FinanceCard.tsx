'use client';

import { useState, useEffect } from 'react';
import { AnimatedDoughnutChart } from './ui/charts';

interface ExpenseData {
  category: string;
  total: number;
}

interface FinanceCardProps {
  className?: string;
}

export default function FinanceCard({ className = '' }: FinanceCardProps) {
  const [expenseData, setExpenseData] = useState<ExpenseData[]>([]);
  const [totalDebt, setTotalDebt] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFinanceData();
  }, []);

  const fetchFinanceData = async () => {
    try {
      const [breakdownResponse, statsResponse] = await Promise.all([
        fetch('/api/expense-breakdown'),
        fetch('/api/dashboard-stats'),
      ]);

      const breakdown = await breakdownResponse.json();
      const stats = await statsResponse.json();

      setExpenseData(breakdown);
      setTotalDebt(stats.totalDebt);
    } catch (error) {
      console.error('Error fetching finance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getChartData = () => {
    const colors = [
      '#ef4444', // red-500
      '#f97316', // orange-500
      '#eab308', // yellow-500
      '#22c55e', // green-500
      '#3b82f6', // blue-500
      '#8b5cf6', // violet-500
      '#ec4899', // pink-500
      '#6b7280', // gray-500
    ];

    return {
      labels: expenseData.map(item => item.category),
      datasets: [
        {
          data: expenseData.map(item => item.total),
          backgroundColor: colors.slice(0, expenseData.length),
          borderColor: colors.slice(0, expenseData.length).map(color =>
            color.replace('500', '600')
          ),
          borderWidth: 2,
          hoverBorderWidth: 3,
          hoverBorderColor: colors.slice(0, expenseData.length).map(color =>
            color.replace('500', '400')
          ),
        },
      ],
    };
  };

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="space-y-4">
          <div className="h-6 bg-zinc-700 rounded w-1/3"></div>
          <div className="h-48 bg-zinc-700 rounded"></div>
          <div className="h-4 bg-zinc-700 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  const totalExpenses = expenseData.reduce((sum, item) => sum + item.total, 0);

  return (
    <div className={className}>
      {/* Udhaar Alert - More prominent on mobile */}
      {totalDebt > 0 && (
        <div className="mb-4 p-3 sm:p-4 bg-rose-500/10 border border-rose-500/20 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse"></div>
              <span className="text-rose-400 font-medium text-sm">Udhaar Alert</span>
            </div>
            <div className="text-rose-300 font-bold text-lg sm:text-xl">
              ₹{totalDebt.toFixed(2)}
            </div>
          </div>
          <div className="text-rose-400/80 text-xs mt-1">
            Total outstanding debt
          </div>
        </div>
      )}

      {/* Chart - Responsive height */}
      <div className="mb-4 sm:mb-6">
        <AnimatedDoughnutChart
          data={getChartData()}
          height={180}
          options={{
            plugins: {
              legend: {
                position: 'bottom',
                labels: {
                  color: '#e5e7eb',
                  usePointStyle: true,
                  padding: 12,
                  font: {
                    size: 11,
                  },
                },
              },
            },
            cutout: '65%',
          }}
        />
      </div>

      {/* Summary - Better mobile layout */}
      <div className="space-y-3 sm:space-y-2 mb-4 sm:mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-1 gap-2">
          <div className="flex justify-between items-center p-2 sm:p-0 bg-zinc-800/30 sm:bg-transparent rounded-lg sm:rounded-none">
            <span className="text-zinc-400 text-sm">Total Expenses:</span>
            <span className="text-white font-semibold text-base sm:text-sm">₹{totalExpenses.toFixed(2)}</span>
          </div>
          {totalDebt > 0 && (
            <div className="flex justify-between items-center p-2 sm:p-0 bg-zinc-800/30 sm:bg-transparent rounded-lg sm:rounded-none">
              <span className="text-zinc-400 text-sm">Total Debt:</span>
              <span className="text-rose-400 font-semibold text-base sm:text-sm">₹{totalDebt.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between items-center p-2 sm:p-0 bg-zinc-800/30 sm:bg-transparent rounded-lg sm:rounded-none border-t sm:border-t-0 border-zinc-700/50">
            <span className="text-zinc-400 text-sm font-medium">Net Position:</span>
            <span className={`font-bold text-base sm:text-sm ${totalExpenses - totalDebt >= 0 ? 'text-green-400' : 'text-rose-400'}`}>
              ₹{(totalExpenses - totalDebt).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Category Breakdown - Scrollable on mobile */}
      {expenseData.length > 0 && (
        <div className="mt-4 sm:mt-6">
          <h4 className="text-sm font-medium text-zinc-300 mb-3">Category Breakdown</h4>
          <div className="space-y-2 max-h-32 sm:max-h-none overflow-y-auto sm:overflow-visible">
            {expenseData.map((item, index) => (
              <div key={item.category} className={`flex justify-between items-center text-sm p-2 rounded-lg ${
                index % 2 === 0 ? 'bg-zinc-800/20' : 'bg-zinc-800/10'
              }`}>
                <span className="text-zinc-400 truncate mr-2">{item.category}</span>
                <span className="text-white font-medium flex-shrink-0">₹{item.total.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}