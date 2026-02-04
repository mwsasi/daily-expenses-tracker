
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Transaction, TransactionType, CategoryConfig } from '../types';
import { getCategoryConfig } from '../constants';

interface ChartsProps {
  transactions: Transaction[];
  customCategories: CategoryConfig[];
  budgets?: Record<string, number>;
}

const Charts: React.FC<ChartsProps> = ({ transactions, customCategories, budgets = {} }) => {
  const currentMonthStr = new Date().toISOString().substring(0, 7);
  
  const expenseData = transactions
    .filter(t => t.type === TransactionType.EXPENSE)
    .reduce((acc, curr) => {
      const existing = acc.find((item: any) => item.name === curr.category);
      const config = getCategoryConfig(curr.category, customCategories);
      if (existing) {
        existing.value += curr.amount;
      } else {
        acc.push({ 
          name: curr.category, 
          value: curr.amount, 
          color: config.color
        });
      }
      return acc;
    }, [] as any[]);

  // Prepare data for Budget vs Spending Chart
  // Fixed: Added explicit type cast and type guard for budgets entries
  const budgetVsSpendingData = Object.entries(budgets as Record<string, number>)
    .filter((entry): entry is [string, number] => entry[1] > 0)
    .map(([catName, limit]) => {
      const spent = transactions
        .filter(t => t.category === catName && t.type === TransactionType.EXPENSE && t.date.startsWith(currentMonthStr))
        .reduce((sum, t) => sum + t.amount, 0);
      return {
        name: catName.length > 10 ? catName.substring(0, 8) + '..' : catName,
        fullName: catName,
        Budget: limit as number,
        Spent: spent
      };
    })
    // Fixed: Added type safety for arithmetic operation
    .sort((a, b) => (b.Spent / (b.Budget || 1)) - (a.Spent / (a.Budget || 1)));

  const formatYAxis = (tickItem: number) => `RS ${tickItem}`;

  if (transactions.length === 0) {
    return (
      <div className="bg-white p-10 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-slate-400">
        <p className="font-bold lowercase">not enough data to generate charts</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-[0.2em] mb-6 lowercase">expense distribution</h3>
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
                  {expenseData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                  formatter={(value: number) => [`RS ${value.toFixed(2)}`, 'amount']} 
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-[0.2em] mb-6 lowercase">income vs expenses</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  {
                    name: 'period flow',
                    income: transactions.filter(t => t.type === TransactionType.INCOME).reduce((sum, t) => sum + t.amount, 0),
                    expenses: transactions.filter(t => t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + t.amount, 0)
                  }
                ]}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={formatYAxis} tick={{ fontSize: 10, fontWeight: 700 }} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }} 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                  formatter={(value: number) => [`RS ${value.toFixed(2)}`, '']} 
                />
                <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
                <Bar dataKey="expenses" name="Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={40} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {budgetVsSpendingData.length > 0 && (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-[0.2em] lowercase">budget vs spending variance</h3>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest lowercase">selected period</span>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={budgetVsSpendingData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={formatYAxis} tick={{ fontSize: 10, fontWeight: 700 }} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }} 
                  contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.1)', padding: '16px' }}
                  formatter={(value: number, name: string) => [`RS ${value.toFixed(2)}`, name]}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                <Bar dataKey="Budget" fill="#94a3b8" radius={[4, 4, 0, 0]} barSize={30} opacity={0.5} />
                <Bar dataKey="Spent" radius={[4, 4, 0, 0]} barSize={30}>
                  {budgetVsSpendingData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.Spent > entry.Budget ? '#ef4444' : '#10b981'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default Charts;
