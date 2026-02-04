
import React, { useState, useMemo, useEffect } from 'react';
import { 
  PiggyBank, 
  TrendingUp, 
  Calculator, 
  Table as TableIcon, 
  Edit3, 
  Trash2, 
  ArrowUpRight, 
  Coins, 
  History,
  Landmark,
  Building2,
  ChevronDown,
  Check,
  Target
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

type BankFilter = 'all' | 'Commercial Bank' | 'Amana Bank';

const CompoundSavings: React.FC<CompoundSavingsProps> = ({ 
  transactions, 
  customCategories, 
  onSaveTransaction, 
  onRemoveTransaction, 
  onStartEdit,
  editingTransaction,
  onCancelEdit
}) => {
  const [annualRate, setAnnualRate] = useState<number>(() => {
    const saved = localStorage.getItem('spendwise_projector_rate');
    return saved ? parseFloat(saved) : 7.0;
  });
  const [projectionYears, setProjectionYears] = useState<number>(() => {
    const saved = localStorage.getItem('spendwise_projector_years');
    return saved ? parseInt(saved) : 10;
  });
  
  const [projectedValue, setProjectedValue] = useState<number>(0);
  
  const [targetAmount, setTargetAmount] = useState<number>(() => {
    const saved = localStorage.getItem('spendwise_savings_target');
    return saved ? parseFloat(saved) : 0;
  });

  const [bankFilter, setBankFilter] = useState<BankFilter>('all');
  const [isBankDropdownOpen, setIsBankDropdownOpen] = useState(false);

  const savingsTransactions = useMemo(() => {
    return transactions
      .filter(t => t.type === TransactionType.SAVINGS)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    if (bankFilter === 'all') return savingsTransactions;
    return savingsTransactions.filter(t => t.account === bankFilter);
  }, [savingsTransactions, bankFilter]);

  const bankBreakdown = useMemo(() => {
    const commercial = savingsTransactions
      .filter(t => t.account === 'Commercial Bank')
      .reduce((sum, t) => sum + t.amount, 0);
    const amana = savingsTransactions
      .filter(t => t.account === 'Amana Bank')
      .reduce((sum, t) => sum + t.amount, 0);
    return { commercial, amana, total: commercial + amana };
  }, [savingsTransactions]);

  const totalInView = useMemo(() => {
    if (bankFilter === 'all') return bankBreakdown.total;
    if (bankFilter === 'Commercial Bank') return bankBreakdown.commercial;
    return bankBreakdown.amana;
  }, [bankFilter, bankBreakdown]);

  const growthData = useMemo(() => {
    if (filteredTransactions.length === 0) return [];

    const dailyTotals: Record<string, number> = {};
    // Calculate cumulative growth from the beginning of history, but respect the filter
    const sortedAllFiltered = [...filteredTransactions].sort((a, b) => a.date.localeCompare(b.date));
    
    let cumulative = 0;
    return sortedAllFiltered.map(t => {
      cumulative += t.amount;
      return {
        date: t.date,
        amount: cumulative,
        formattedDate: new Date(t.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      };
    });
  }, [filteredTransactions]);

  const calculateFutureValue = (principal: number, years: number, rate: number) => {
    const r = rate / 100;
    return principal * Math.pow(1 + r, years);
  };

  useEffect(() => {
    const newValue = calculateFutureValue(totalInView, projectionYears, annualRate);
    setProjectedValue(newValue);
    
    localStorage.setItem('spendwise_projector_rate', annualRate.toString());
    localStorage.setItem('spendwise_projector_years', projectionYears.toString());
  }, [annualRate, projectionYears, totalInView]);

  useEffect(() => {
    localStorage.setItem('spendwise_savings_target', targetAmount.toString());
  }, [targetAmount]);

  const progressPercent = useMemo(() => {
    if (targetAmount <= 0) return 0;
    return Math.min((totalInView / targetAmount) * 100, 100);
  }, [totalInView, targetAmount]);

  const projectedGrowth = useMemo(() => {
    return Math.max(0, projectedValue - totalInView);
  }, [projectedValue, totalInView]);

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
        <div className="lg:col-span-5 space-y-8">
          <div className="space-y-3">
             <div className="flex items-center justify-between px-2">
               <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] lowercase">wealth contribution</h4>
               <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase lowercase">savings entry</span>
             </div>
             <TransactionForm 
                onAdd={onSaveTransaction}
                onCancel={onCancelEdit}
                editingTransaction={editingTransaction}
                filterType={TransactionType.SAVINGS}
                customCategories={customCategories}
             />
          </div>

          <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm space-y-6">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] lowercase">account allocation</h4>
            <div className="space-y-4">
              <button 
                onClick={() => setBankFilter('Commercial Bank')}
                className={`w-full flex items-center justify-between p-5 border rounded-2xl transition-all group active:scale-95 ${bankFilter === 'Commercial Bank' ? 'bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-100' : 'bg-blue-50/50 border-blue-100 text-slate-800 hover:border-blue-300'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl shadow-lg transition-colors ${bankFilter === 'Commercial Bank' ? 'bg-white/20' : 'bg-blue-600 text-white'}`}>
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className={`font-black text-sm lowercase leading-tight ${bankFilter === 'Commercial Bank' ? 'text-white' : 'text-slate-800'}`}>commercial bank</p>
                    <p className={`text-[9px] font-bold lowercase tracking-wider mt-0.5 ${bankFilter === 'Commercial Bank' ? 'text-blue-100' : 'text-slate-400'}`}>verified savings</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-black text-base ${bankFilter === 'Commercial Bank' ? 'text-white' : 'text-blue-700'}`}>RS {formatCurrency(bankBreakdown.commercial)}</p>
                  <p className={`text-[9px] font-black uppercase lowercase ${bankFilter === 'Commercial Bank' ? 'text-blue-200' : 'text-blue-400'}`}>
                    {bankBreakdown.total > 0 ? ((bankBreakdown.commercial / bankBreakdown.total) * 100).toFixed(1) : '0.0'}% split
                  </p>
                </div>
              </button>

              <button 
                onClick={() => setBankFilter('Amana Bank')}
                className={`w-full flex items-center justify-between p-5 border rounded-2xl transition-all group active:scale-95 ${bankFilter === 'Amana Bank' ? 'bg-teal-600 border-teal-600 text-white shadow-xl shadow-teal-100' : 'bg-teal-50/50 border-teal-100 text-slate-800 hover:border-teal-300'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl shadow-lg transition-colors ${bankFilter === 'Amana Bank' ? 'bg-white/20' : 'bg-teal-600 text-white'}`}>
                    <Landmark className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className={`font-black text-sm lowercase leading-tight ${bankFilter === 'Amana Bank' ? 'text-white' : 'text-slate-800'}`}>amana bank</p>
                    <p className={`text-[9px] font-bold lowercase tracking-wider mt-0.5 ${bankFilter === 'Amana Bank' ? 'text-teal-100' : 'text-slate-400'}`}>islamic banking pool</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-black text-base ${bankFilter === 'Amana Bank' ? 'text-white' : 'text-teal-700'}`}>RS {formatCurrency(bankBreakdown.amana)}</p>
                  <p className={`text-[9px] font-black uppercase lowercase ${bankFilter === 'Amana Bank' ? 'text-teal-200' : 'text-teal-400'}`}>
                    {bankBreakdown.total > 0 ? ((bankBreakdown.amana / bankBreakdown.total) * 100).toFixed(1) : '0.0'}% split
                  </p>
                </div>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-teal-100 p-2.5 rounded-2xl">
                  <Calculator className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <h3 className="font-black text-slate-800 uppercase tracking-widest text-[10px] lowercase">what-if scenarios</h3>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.1em] lowercase">adjust growth parameters</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 lowercase">expected roi</label>
                <div className="relative">
                  <select 
                    value={annualRate}
                    onChange={(e) => setAnnualRate(parseFloat(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 text-sm font-black text-slate-700 focus:outline-none focus:ring-4 focus:ring-teal-500/10 appearance-none cursor-pointer lowercase"
                  >
                    {rateOptions.map(rate => (
                      <option key={rate} value={rate}>{rate.toFixed(1)}% annual</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 lowercase">time horizon</label>
                <div className="relative">
                  <select 
                    value={projectionYears}
                    onChange={(e) => setProjectionYears(parseInt(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 text-sm font-black text-slate-700 focus:outline-none focus:ring-4 focus:ring-teal-500/10 appearance-none cursor-pointer lowercase"
                  >
                    {yearOptions.map(year => (
                      <option key={year} value={year}>{year} {year === 1 ? 'year' : 'years'}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 lowercase">portfolio goal target</label>
              <div className="relative">
                <input 
                  type="number"
                  value={targetAmount || ''}
                  onChange={(e) => setTargetAmount(parseFloat(e.target.value) || 0)}
                  placeholder="set your target RS..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-black text-slate-700 focus:outline-none focus:ring-4 focus:ring-teal-500/10 lowercase"
                />
                <Target className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 space-y-8">
          <div className={`rounded-[3rem] p-12 text-white shadow-2xl relative overflow-hidden group border border-white/5 transition-all duration-500 ${bankFilter === 'Commercial Bank' ? 'bg-blue-900' : bankFilter === 'Amana Bank' ? 'bg-teal-900' : 'bg-slate-900'}`}>
            <div className="absolute -top-12 -right-12 p-12 opacity-[0.02] group-hover:scale-110 transition-transform duration-[2s]">
              <Coins className="w-80 h-80" />
            </div>
            
            <div className="relative z-10 space-y-10">
              <div className="flex items-center justify-between">
                <div className="space-y-1.5">
                  <h3 className="text-xs font-black text-teal-400 uppercase tracking-[0.4em] lowercase">{bankFilter === 'all' ? 'wealth forecast' : `${bankFilter.split(' ')[0]} forecast`}</h3>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest lowercase">
                    based on {annualRate}% return over {projectionYears} years
                  </p>
                </div>
                <div className="bg-teal-500/10 p-4 rounded-[1.5rem] border border-teal-500/20 shadow-inner">
                  <ArrowUpRight className="w-8 h-8 text-teal-400" />
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-7xl font-black tracking-tighter text-white drop-shadow-2xl text-center md:text-left">
                  RS {formatCurrency(projectedValue)}
                </p>
                <p className="text-[10px] font-black text-teal-500/60 uppercase tracking-[0.2em] ml-1 lowercase">estimated net {bankFilter === 'all' ? 'portfolio' : 'account'} value</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                <div className="p-6 rounded-[2.5rem] bg-white/5 border border-white/10 hover:bg-white/[0.07] transition-colors">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 lowercase">invested principal</p>
                  <p className="text-2xl font-black text-white">RS {formatCurrency(totalInView)}</p>
                </div>
                <div className="p-6 rounded-[2.5rem] bg-teal-500/5 border border-teal-500/10 hover:bg-teal-500/10 transition-colors">
                  <p className="text-[10px] font-black text-teal-500/70 uppercase tracking-widest mb-1.5 lowercase">projected growth</p>
                  <p className="text-2xl font-black text-teal-400">+ RS {formatCurrency(projectedGrowth)}</p>
                </div>
              </div>

              {targetAmount > 0 && (
                <div className="space-y-4 pt-6">
                  <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-[0.2em] lowercase">
                    <span className="text-slate-500">goal achievement progress</span>
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

          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-teal-50 p-2.5 rounded-2xl">
                  <History className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800 tracking-tight lowercase">portfolio trajectory</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 lowercase">historical cumulative {bankFilter === 'all' ? 'savings' : bankFilter.toLowerCase()}</p>
                </div>
              </div>
              
              <div className="relative">
                <button 
                  onClick={() => setIsBankDropdownOpen(!isBankDropdownOpen)}
                  className="flex items-center justify-between gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 min-w-[180px] text-[11px] font-black text-slate-700 hover:border-teal-500 transition-all shadow-sm lowercase"
                >
                  <div className="flex items-center gap-2">
                    <Landmark className="w-3.5 h-3.5 text-teal-600" />
                    <span>{bankFilter === 'all' ? 'all accounts' : bankFilter.toLowerCase()}</span>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isBankDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isBankDropdownOpen && (
                  <div className="absolute top-full left-0 mt-2 w-full bg-white border border-slate-100 rounded-2xl shadow-2xl z-50 py-2 animate-in fade-in zoom-in-95 duration-200">
                    <div className="px-3 py-1 mb-1 border-b border-slate-50">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest lowercase">filter by bank</span>
                    </div>
                    {(['all', 'Commercial Bank', 'Amana Bank'] as BankFilter[]).map((bank) => (
                      <button
                        key={bank}
                        onClick={() => {
                          setBankFilter(bank);
                          setIsBankDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-4 py-2 text-[11px] font-bold text-left transition-colors lowercase ${bankFilter === bank ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50'}`}
                      >
                        <span>{bank === 'all' ? 'all accounts' : bank.toLowerCase()}</span>
                        {bankFilter === bank && <Check className="w-3.5 h-3.5" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="h-[250px] w-full">
              {growthData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={growthData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={bankFilter === 'Commercial Bank' ? '#3b82f6' : '#14b8a6'} stopOpacity={0.15}/>
                        <stop offset="95%" stopColor={bankFilter === 'Commercial Bank' ? '#3b82f6' : '#14b8a6'} stopOpacity={0}/>
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
                    <YAxis hide domain={['auto', 'auto']} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                      labelStyle={{ fontSize: '10px', fontWeight: 900, color: '#64748b', marginBottom: '4px' }}
                      formatter={(value: number) => [`RS ${formatCurrency(value)}`, 'total savings']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="amount" 
                      stroke={bankFilter === 'Commercial Bank' ? '#3b82f6' : '#14b8a6'} 
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
                  <p className="text-xs font-black uppercase tracking-widest lowercase">awaiting growth data</p>
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
                  <h3 className="text-xl font-black text-slate-800 tracking-tight lowercase">{bankFilter === 'all' ? 'portfolio transactions' : `${bankFilter.split(' ')[0]} entries`}</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 lowercase">verified savings ledger</p>
                </div>
              </div>
            </div>

            <div className="flex-grow overflow-auto scrollbar-hide">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-10 bg-slate-50/90 backdrop-blur-md">
                  <tr className="text-[10px] uppercase tracking-widest text-slate-500 font-black border-b border-slate-200 lowercase">
                    <th className="px-8 py-5">value date</th>
                    <th className="px-8 py-5 text-right">contribution</th>
                    <th className="px-8 py-5">bank account</th>
                    <th className="px-8 py-5 text-center">actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTransactions.map((t, idx) => (
                    <tr 
                      key={t.id} 
                      className={`group hover:bg-teal-50/30 transition-all ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/20'} ${editingTransaction?.id === t.id ? 'bg-teal-50 ring-2 ring-teal-500 ring-inset' : ''}`}
                    >
                      <td className="px-8 py-6 whitespace-nowrap text-xs font-bold text-slate-400">{t.date}</td>
                      <td className="px-8 py-6 text-right font-mono font-black text-sm text-teal-600">RS {formatCurrency(t.amount)}</td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-1.5">
                           {t.account === 'Commercial Bank' ? <Building2 className="w-3 h-3 text-blue-500" /> : <Landmark className="w-3 h-3 text-teal-500" />}
                           <span className="text-[11px] font-black text-slate-700 uppercase tracking-tight lowercase">{t.account || 'unassigned'}</span>
                        </div>
                        <div className="text-[8px] font-bold text-slate-400 lowercase italic mt-0.5">{t.note}</div>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <div className="flex items-center justify-center gap-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
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
                  {filteredTransactions.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-24 text-center">
                        <div className="flex flex-col items-center gap-4 opacity-20">
                           <PiggyBank className="w-16 h-16" />
                           <p className="text-sm font-black uppercase tracking-[0.2em] lowercase">no entries for this filter</p>
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
