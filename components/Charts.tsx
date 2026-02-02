
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Transaction, TransactionType } from '../types';
import { CATEGORY_CONFIG } from '../constants';

interface ChartsProps {
  transactions: Transaction[];
}

const Charts: React.FC<ChartsProps> = ({ transactions }) => {
  const expenseData = transactions
    .filter(t => t.type === TransactionType.EXPENSE)
    .reduce((acc, curr) => {
      const existing = acc.find(item => item.name === curr.category);
      if (existing) {
        existing.value += curr.amount;
      } else {
        acc.push({ name: curr.category, value: curr.amount, color: CATEGORY_CONFIG[curr.category].color.replace('bg-', '') });
      }
      return acc;
    }, [] as any[]);

  const tailwindColorToHex = (colorName: string) => {
    const map: Record<string, string> = {
      'blue-500': '#3b82f6',
      'emerald-500': '#10b981',
      'orange-500': '#f97316',
      'red-500': '#ef4444',
      'amber-600': '#d97706',
      'yellow-600': '#ca8a04',
      'purple-500': '#a855f7',
      'indigo-500': '#6366f1',
      'cyan-600': '#0891b2',
      'slate-700': '#334155',
      'rose-500': '#f43f5e',
      'teal-500': '#14b8a6',
      'gray-500': '#6b7280',
    };
    return map[colorName] || '#000000';
  };

  const formatYAxis = (tickItem: number) => `Rs ${tickItem}`;

  if (transactions.length === 0) {
    return (
      <div className="bg-white p-10 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-slate-400">
        <p>Not enough data to generate charts</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-semibold text-slate-800 mb-6">Expense Distribution</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={expenseData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {expenseData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={tailwindColorToHex(entry.color)} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => [`Rs ${value.toFixed(2)}`, 'Amount']} />
              <Legend verticalAlign="bottom" height={36}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-semibold text-slate-800 mb-6">Income vs Expenses</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={[
                {
                  name: 'Financials',
                  income: transactions.filter(t => t.type === TransactionType.INCOME).reduce((sum, t) => sum + t.amount, 0),
                  expenses: transactions.filter(t => t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + t.amount, 0)
                }
              ]}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} tickFormatter={formatYAxis} />
              <Tooltip cursor={{ fill: '#f8fafc' }} formatter={(value: number) => [`Rs ${value.toFixed(2)}`, '']} />
              <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
              <Bar dataKey="expenses" name="Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Charts;
