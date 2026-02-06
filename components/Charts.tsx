
import React, { useMemo } from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Legend, 
  Tooltip, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid,
  AreaChart,
  Area
} from 'recharts';
import { ArrowUpCircle } from 'lucide-react';
import { Transaction, TransactionType, CategoryConfig } from '../types';
import { getCategoryConfig } from '../constants';

interface ChartsProps {
  transactions: Transaction[];
  customCategories: CategoryConfig[];
  budgets?: Record<string, number>;
}

const Charts: React.FC<ChartsProps> = ({ transactions, customCategories, budgets = {} }) => {
  const currentMonthStr = new Date().toISOString().substring(0, 7);
  
  // 1. Expense Distribution Data
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

  // 2. Budget vs Spending Data
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
    .sort((a, b) => (b.Spent / (b.Budget || 1)) - (a.Spent / (a.Budget || 1)));

  // 3. Monthly Income Trend Data
  const monthlyIncomeTrend = useMemo(() => {
    const incomeMap: Record<string, number> = {};
    
    // Get last 6 months list to ensure zero-filling if needed
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      return d.toISOString().substring(0, 7);
    }).reverse();

    last6Months.forEach(m => { incomeMap[m] = 0; });

    transactions.forEach(t => {
      if (t.type === TransactionType.INCOME) {
        const month = t.date.substring(0, 7);
        if (incomeMap.hasOwnProperty(month)) {
          incomeMap[month] += t.amount;
        } else if (t.date >= last6Months[0]) {
           incomeMap[month] = (incomeMap[month] || 0) + t.amount;
        }
      }
    });

    return Object.entries(incomeMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, amount]) => ({
        month: new Date(month + "-01").toLocaleString('default', { month: 'short', year: '2-digit' }),
        fullMonth: month,
        Income: amount
      }));
  }, [transactions]);

  const formatYAxis = (tickItem: number) => `RS${tickItem.toLocaleString()}`;

  if (transactions.length === 0) {
    return (
      <div className="bg-white p-10 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-slate-400">
        <p className="font-bold capitalize">Not Enough Data To Generate Charts</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Monthly Income Trend Chart */}
      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-[0.2em] mb-1 capitalize">Monthly Income Performance</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest capitalize">6-Month Wealth Accumulation Trend</p>
          </div>
          <div className="bg-emerald-50 text-emerald-600 p-3 rounded-2xl">
            <ArrowUpCircle className="w-5 h-5" />
          </div>
        </div>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyIncomeTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="month" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }} 
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tickFormatter={formatYAxis} 
                tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }}
                width={70}
              />
              <Tooltip 
                cursor={{ stroke: '#10b981', strokeWidth: 2, strokeDasharray: '5 5' }}
                contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '16px' }}
                formatter={(value: number) => [`RS${value.toLocaleString()}`, 'Total Income']}
              />
              <Area 
                type="monotone" 
                dataKey="Income" 
                stroke="#10b981" 
                strokeWidth={4} 
                fillOpacity={1} 
                fill="url(#colorIncome)" 
                animationDuration={2000}
                dot={{ r: 6, fill: '#10b981', strokeWidth: 3, stroke: '#fff' }}
                activeDot={{ r: 8, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expense Distribution */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-[0.2em] mb-6 capitalize">Expense Distribution</h3>
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
                  formatter={(value: number) => [`RS${value.toFixed(2)}`, 'Amount']} 
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Global Income vs Expenses Summary */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-[0.2em] mb-6 capitalize">Period Flow Assessment</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  {
                    name: 'Current Period',
                    income: transactions.filter(t => t.type === TransactionType.INCOME).reduce((sum, t) => sum + t.amount, 0),
                    expenses: transactions.filter(t => t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + t.amount, 0)
                  }
                ]}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={formatYAxis} tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }} width={60} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }} 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                  formatter={(value: number) => [`RS${value.toFixed(2)}`, '']} 
                />
                <Bar dataKey="income" name="Total Income" fill="#10b981" radius={[8, 8, 0, 0]} barSize={40} />
                <Bar dataKey="expenses" name="Total Expenses" fill="#f43f5e" radius={[8, 8, 0, 0]} barSize={40} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {budgetVsSpendingData.length > 0 && (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-[0.2em] capitalize">Budget Consumption Variance</h3>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest capitalize">Current Target Cycle</span>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={budgetVsSpendingData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={formatYAxis} tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }} width={60} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }} 
                  contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.1)', padding: '16px' }}
                  formatter={(value: number, name: string) => [`RS${value.toFixed(2)}`, name]}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                <Bar dataKey="Budget" fill="#e2e8f0" radius={[4, 4, 0, 0]} barSize={30} />
                <Bar dataKey="Spent" radius={[4, 4, 0, 0]} barSize={30}>
                  {budgetVsSpendingData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.Spent > entry.Budget ? '#f43f5e' : '#10b981'} 
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
