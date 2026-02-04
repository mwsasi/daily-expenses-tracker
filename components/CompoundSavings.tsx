
import React, { useState, useMemo, useEffect } from 'react';
import { 
  PiggyBank, 
  TrendingUp, 
  Calendar, 
  Info, 
  Calculator, 
  Table as TableIcon, 
  Edit3, 
  Trash2, 
  MoreHorizontal, 
  ChevronRight, 
  Target, 
  Zap, 
  Flag, 
  CheckCircle2, 
  ArrowUpRight, 
  Coins, 
  ShieldCheck,
  History
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { Transaction, TransactionType, CategoryConfig } from '../types';
import { getCategoryConfig, ICON_MAP } from '../constants';
import TransactionForm from './TransactionForm';

interface CompoundSavingsProps {
  transactions: Transaction[];
  customCategories: CategoryConfig[];
  onSaveTransaction: (t: Transaction) => void;
  onRemoveTransaction: (id: string) => void;
  onStartEdit: (t: Transaction) => void;
  editingTransaction: Transaction | null;
  onCancelEdit: () => void;
}

const CompoundSavings: React.FC<CompoundSavingsProps> = ({ 
  transactions, 
  customCategories, 
  onSaveTransaction, 
  onRemoveTransaction, 
  onStartEdit,
  editingTransaction,
  onCancelEdit
}) => {
  // Persistence for projector settings
  const [annualRate, setAnnualRate] = useState<number>(() => {
    const saved = localStorage.getItem('spendwise_projector_rate');
    return saved ? parseFloat(saved) : 7.0;
  });
  const [projectionYears, setProjectionYears] = useState<number>(() => {
    const saved = localStorage.getItem('spendwise_projector_years');
    return saved ? parseInt(saved) : 10;
  });
  
  // State for the projected value to decouple it from immediate transaction reactivity
  const [projectedValue, setProjectedValue] = useState<number>(0);
  
  const [targetAmount, setTargetAmount] = useState<number>(() => {
    const saved = localStorage.getItem('spendwise_savings_target');
    return saved ? parseFloat(saved) : 0;
  });

  const savingsTransactions = useMemo(() => {
    return transactions
      .filter(t => t.type === TransactionType.SAVINGS)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions]);

  const totalSavings = useMemo(() => {
    return savingsTransactions.reduce((sum, t) => sum + t.amount, 0);
  }, [savingsTransactions]);

  // Data for Historical Growth Chart
  const growthData = useMemo(() => {
    if (savingsTransactions.length === 0) return [];

    // Group by date and sort ascending for the chart
    const dailyTotals: Record<string, number> = {};
    savingsTransactions.forEach(t => {
      dailyTotals[t.date] = (dailyTotals[t.date] || 0) + t.amount;
    });

    const sortedDates = Object.keys(dailyTotals).sort();
    let cumulative = 0;
    
    return sortedDates.map(date => {
      cumulative += dailyTotals[date];
      return {
        date,
        amount: cumulative,
        formattedDate: new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      };
    });
  }, [savingsTransactions]);

  // Compound Interest Calculation: FV = P * (1 + r)^n
  const calculateFutureValue = (principal: number, years: number, rate: number) => {
    const r = rate / 100;
    return principal * Math.pow(1 + r, years);
  };

  // Only update the projection when the user changes the "inputs" (annualRate or projectionYears)
  useEffect(() => {
    const newValue = calculateFutureValue(totalSavings, projectionYears, annualRate);
    setProjectedValue(newValue);
    
    // Save settings
    localStorage.setItem('spendwise_projector_rate', annualRate.toString());
    localStorage.setItem('spendwise_projector_years', projectionYears.toString());
  }, [annualRate, projectionYears, totalSavings]);

  useEffect(() => {
    localStorage.setItem('spendwise_savings_target', targetAmount.toString());
  }, [targetAmount]);

  const progressPercent = useMemo(() => {
    if (targetAmount <= 0) return 0;
    return Math.min((totalSavings / targetAmount) * 100, 100);
  }, [totalSavings, targetAmount]);

  const projectedGrowth = useMemo(() => {
    return Math.max(0, projectedValue - totalSavings);
  }, [projectedValue, totalSavings]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat(undefined, { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    }).format(val);
  };

  const rateOptions = Array.from({ length: 40 }, (_, i) => (i + 1) * 0.5); 
  const yearOptions = Array.from({ length: 50 }, (_, i) => i + 1); 

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Inputs & Projection Config */}
        <div className="lg:col-span-5 space-y-8">
          <div className="space-y-3">
             <div className="flex items-center justify-between px-2">
               <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Wealth Contribution</h4>
               <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase">Savings Entry</span>
             </div>
             <TransactionForm 
                onAdd={onSaveTransaction}
                onCancel={onCancelEdit}
                editingTransaction={editingTransaction}
                filterType={TransactionType.SAVINGS}
                customCategories={customCategories}
             />
          </div>

          <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-teal-100 p-2.5 rounded-2xl">
                  <Calculator className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <h3 className="font-black text-slate-800 uppercase tracking-widest text-[10px]">What-If Scenarios</h3>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.1em]">Adjust growth parameters</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-500" />
                <span className="text-[9px] font-black text-slate-500 uppercase">Stable Projection</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Expected ROI</label>
                <div className="relative">
                  <select 
                    value={annualRate}
                    onChange={(e) => setAnnualRate(parseFloat(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 text-sm font-black text-slate-700 focus:outline-none focus:ring-4 focus:ring-teal-500/10 appearance-none cursor-pointer"
                  >
                    {rateOptions.map(rate => (
                      <option key={rate} value={rate}>{rate.toFixed(1)}% Annual</option>
                    ))}
                  </select>
                  <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 rotate-90 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Time Horizon</label>
                <div className="relative">
                  <select 
                    value={projectionYears}
                    onChange={(e) => setProjectionYears(parseInt(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 text-sm font-black text-slate-700 focus:outline-none focus:ring-4 focus:ring-teal-500/10 appearance-none cursor-pointer"
                  >
                    {yearOptions.map(year => (
                      <option key={year} value={year}>{year} {year === 1 ? 'Year' : 'Years'}</option>
                    ))}
                  </select>
                  <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 rotate-90 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Portfolio Goal Target</label>
              <div className="relative">
                <input 
                  type="number"
                  value={targetAmount || ''}
                  onChange={(e) => setTargetAmount(parseFloat(e.target.value) || 0)}
                  placeholder="Set your target Rs..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-black text-slate-700 focus:outline-none focus:ring-4 focus:ring-teal-500/10"
                />
                <Target className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
              </div>
            </div>
            
            <div className="bg-slate-50 p-4 rounded-2xl border border-dashed border-slate-200">
               <p className="text-[10px] text-slate-500 font-bold leading-relaxed italic">
                 Projections only recalculate when Return or Years are adjusted. This maintains a steady vision for your wealth goals.
               </p>
            </div>
          </div>
        </div>

        {/* Right Column: Prominent Projections & Portfolio */}
        <div className="lg:col-span-7 space-y-8">
          <div className="bg-slate-900 rounded-[3rem] p-12 text-white shadow-2xl relative overflow-hidden group border border-white/5">
            <div className="absolute -top-12 -right-12 p-12 opacity-[0.02] group-hover:scale-110 transition-transform duration-[2s]">
              <Coins className="w-80 h-80" />
            </div>
            
            <div className="relative z-10 space-y-10">
              <div className="flex items-center justify-between">
                <div className="space-y-1.5">
                  <h3 className="text-xs font-black text-teal-400 uppercase tracking-[0.4em]">Wealth Forecast</h3>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
                    Based on {annualRate}% Return over {projectionYears} Years
                  </p>
                </div>
                <div className="bg-teal-500/10 p-4 rounded-[1.5rem] border border-teal-500/20 shadow-inner">
                  <ArrowUpRight className="w-8 h-8 text-teal-400" />
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-7xl font-black tracking-tighter text-white drop-shadow-2xl text-center md:text-left">
                  Rs {formatCurrency(projectedValue)}
                </p>
                <p className="text-[10px] font-black text-teal-500/60 uppercase tracking-[0.2em] ml-1">Estimated Net Portfolio Value</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                <div className="p-6 rounded-[2.5rem] bg-white/5 border border-white/10 hover:bg-white/[0.07] transition-colors">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Invested Principal</p>
                  <p className="text-2xl font-black text-white">Rs {formatCurrency(totalSavings)}</p>
                </div>
                <div className="p-6 rounded-[2.5rem] bg-teal-500/5 border border-teal-500/10 hover:bg-teal-500/10 transition-colors">
                  <p className="text-[10px] font-black text-teal-500/70 uppercase tracking-widest mb-1.5">Projected Growth</p>
                  <p className="text-2xl font-black text-teal-400">+ Rs {formatCurrency(projectedGrowth)}</p>
                </div>
              </div>

              {targetAmount > 0 && (
                <div className="space-y-4 pt-6">
                  <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-[0.2em]">
                    <span className="text-slate-500">Goal Achievement Progress</span>
                    <span className="text-white">{progressPercent.toFixed(1)}%</span>
                  </div>
                  <div className="h-4 bg-white/5 rounded-full overflow-hidden border border-white/5 p-1">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ease-out ${progressPercent >= 100 ? 'bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.5)]' : 'bg-teal-500'}`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Savings Growth Chart */}
          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="bg-teal-50 p-2.5 rounded-2xl">
                <History className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-800 tracking-tight">Portfolio Growth Trajectory</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Historical Cumulative Savings</p>
              </div>
            </div>

            <div className="h-[250px] w-full">
              {growthData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={growthData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="formattedDate" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                      minTickGap={30}
                    />
                    <YAxis 
                      hide
                      domain={['auto', 'auto']}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                      labelStyle={{ fontSize: '10px', fontWeight: 900, color: '#64748b', marginBottom: '4px' }}
                      formatter={(value: number) => [`Rs ${formatCurrency(value)}`, 'Total Savings']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="amount" 
                      stroke="#14b8a6" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorSavings)" 
                      animationDuration={1500}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4">
                  <TrendingUp className="w-12 h-12 opacity-20" />
                  <p className="text-xs font-black uppercase tracking-widest">Awaiting growth data</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden flex flex-col h-full max-h-[550px]">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="bg-white border border-slate-200 p-2.5 rounded-2xl shadow-sm">
                  <TableIcon className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800 tracking-tight">Portfolio Transactions</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Verified Savings Ledger</p>
                </div>
              </div>
            </div>

            <div className="flex-grow overflow-auto scrollbar-hide">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-10 bg-slate-50/90 backdrop-blur-md">
                  <tr className="text-[10px] uppercase tracking-widest text-slate-500 font-black border-b border-slate-200">
                    <th className="px-8 py-5">Value Date</th>
                    <th className="px-8 py-5 text-right">Contribution</th>
                    <th className="px-8 py-5">Allocation Context</th>
                    <th className="px-8 py-5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {savingsTransactions.map((t, idx) => (
                    <tr 
                      key={t.id} 
                      className={`group hover:bg-teal-50/30 transition-all ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/20'} ${editingTransaction?.id === t.id ? 'bg-teal-50 ring-2 ring-teal-500 ring-inset' : ''}`}
                    >
                      <td className="px-8 py-6 whitespace-nowrap text-xs font-bold text-slate-400">
                        {t.date}
                      </td>
                      <td className={`px-8 py-6 text-right font-mono font-black text-sm text-teal-600`}>
                        Rs {formatCurrency(t.amount)}
                      </td>
                      <td className="px-8 py-6 text-[11px] font-bold text-slate-500 uppercase tracking-tight">
                        {t.note}
                      </td>
                      <td className="px-8 py-6 text-center">
                        <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => onStartEdit(t)} className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-xl transition-all border border-transparent hover:border-teal-100">
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button onClick={() => onRemoveTransaction(t.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-100">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {savingsTransactions.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-24 text-center">
                        <div className="flex flex-col items-center gap-4 opacity-20">
                           <PiggyBank className="w-16 h-16" />
                           <p className="text-sm font-black uppercase tracking-[0.2em]">Start building wealth</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompoundSavings;
