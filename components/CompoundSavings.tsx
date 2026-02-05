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
  Target,
  Plus,
  CreditCard,
  Globe,
  Wallet
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
import DateDropdown, { DatePreset } from './DateDropdown';

interface CompoundSavingsProps {
  transactions: Transaction[];
  customCategories: CategoryConfig[];
  onSaveTransaction: (t: Transaction) => void;
  onRemoveTransaction: (id: string) => void;
  onStartEdit: (t: Transaction) => void;
  editingTransaction: Transaction | null;
  onCancelEdit: () => void;
  accounts: string[];
  onAddAccount: (name: string) => void;
  ledgerDateFilter: DatePreset;
  onDateFilterChange: (preset: DatePreset) => void;
}

const BANK_ICONS = [Building2, Landmark, CreditCard, Coins, Globe, Wallet, PiggyBank];

const CompoundSavings: React.FC<CompoundSavingsProps> = ({ 
  transactions, 
  customCategories, 
  onSaveTransaction, 
  onRemoveTransaction, 
  onStartEdit,
  editingTransaction,
  onCancelEdit,
  accounts,
  onAddAccount,
  ledgerDateFilter,
  onDateFilterChange
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
  const [bankFilter, setBankFilter] = useState<string>('all');

  const filterByPreset = (txs: Transaction[], preset: DatePreset) => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    return txs.filter(t => {
      switch (preset) {
        case 'today': return t.date === today;
        case 'yesterday': {
          const y = new Date(now);
          y.setDate(now.getDate() - 1);
          return t.date === y.toISOString().split('T')[0];
        }
        case 'last7': {
          const l7 = new Date(now);
          l7.setDate(now.getDate() - 7);
          return t.date >= l7.toISOString().split('T')[0];
        }
        case 'thisMonth': return t.date.startsWith(now.toISOString().substring(0, 7));
        case 'lastMonth': {
          const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          return t.date.startsWith(lm.toISOString().substring(0, 7));
        }
        case 'thisYear': return t.date.startsWith(now.getFullYear().toString());
        default: return true;
      }
    });
  };

  const allSavingsTxs = useMemo(() => {
    return transactions.filter(t => t.type === TransactionType.SAVINGS);
  }, [transactions]);

  const filteredSavingsTxs = useMemo(() => {
    let txs = allSavingsTxs;
    if (bankFilter !== 'all') {
      txs = txs.filter(t => t.account === bankFilter);
    }
    return filterByPreset(txs, ledgerDateFilter).sort((a, b) => b.date.localeCompare(a.date));
  }, [allSavingsTxs, bankFilter, ledgerDateFilter]);

  const allAccounts = useMemo(() => {
    const txAccounts = Array.from(new Set(allSavingsTxs.map(t => t.account).filter(Boolean))) as string[];
    return Array.from(new Set([...accounts, ...txAccounts]));
  }, [accounts, allSavingsTxs]);

  const bankBreakdown = useMemo(() => {
    const breakdown: Record<string, number> = {};
    let total = 0;
    allAccounts.forEach(acc => {
      const sum = allSavingsTxs.filter(t => t.account === acc).reduce((s, t) => s + t.amount, 0);
      breakdown[acc] = sum;
      total += sum;
    });
    return { breakdown, total };
  }, [allSavingsTxs, allAccounts]);

  const totalInView = useMemo(() => {
    if (bankFilter === 'all') return bankBreakdown.total;
    return bankBreakdown.breakdown[bankFilter] || 0;
  }, [bankFilter, bankBreakdown]);

  useEffect(() => {
    const r = annualRate / 100;
    const newValue = totalInView * Math.pow(1 + r, projectionYears);
    setProjectedValue(newValue);
    localStorage.setItem('spendwise_projector_rate', annualRate.toString());
    localStorage.setItem('spendwise_projector_years', projectionYears.toString());
  }, [annualRate, projectionYears, totalInView]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 space-y-8">
          <TransactionForm 
            onAdd={onSaveTransaction}
            onCancel={onCancelEdit}
            editingTransaction={editingTransaction}
            filterType={TransactionType.SAVINGS}
            customCategories={customCategories}
            accounts={allAccounts}
            onAddAccount={onAddAccount}
          />

          <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm space-y-6">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest capitalize">Banking Institutions</h4>
            <div className="grid grid-cols-2 gap-4">
              {allAccounts.map((accName, idx) => {
                const isActive = bankFilter === accName;
                const balance = bankBreakdown.breakdown[accName] || 0;
                return (
                  <button key={accName} onClick={() => setBankFilter(isActive ? 'all' : accName)} className={`flex flex-col items-center justify-center p-6 rounded-[2.5rem] border-2 transition-all duration-300 ${isActive ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-100' : 'bg-white border-slate-50 text-slate-800'}`}>
                    <p className={`font-black text-xs capitalize truncate ${isActive ? 'text-white' : 'text-slate-800'}`}>{accName}</p>
                    <div className={`mt-3 px-4 py-2 rounded-full ${isActive ? 'bg-white/20' : 'bg-slate-100'} border border-black/5`}>
                      <p className={`text-base font-black tracking-tighter tabular-nums ${isActive ? 'text-white' : 'text-slate-900'}`}>RS{formatCurrency(balance)}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 space-y-8">
          <div className={`rounded-[3rem] p-12 text-white shadow-2xl relative overflow-hidden group border border-white/5 transition-all duration-500 ${bankFilter !== 'all' ? 'bg-indigo-950' : 'bg-slate-900'}`}>
            <div className="relative z-10 space-y-10">
              <h3 className="text-xs font-black text-teal-400 uppercase tracking-[0.4em] capitalize">Wealth Forecast Engine</h3>
              
              <div className="inline-flex bg-white/10 px-8 py-5 rounded-full border border-white/5 backdrop-blur-md">
                <p className="text-5xl md:text-8xl font-black tracking-tighter text-white tabular-nums">RS{formatCurrency(projectedValue)}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-7 rounded-[2.5rem] bg-white/5 border border-white/10">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 capitalize">Invested Principal</p>
                  <div className="inline-flex bg-white/10 px-5 py-2.5 rounded-full">
                    <p className="text-2xl font-black text-white tracking-tight tabular-nums">RS{formatCurrency(totalInView)}</p>
                  </div>
                </div>
                <div className="p-7 rounded-[2.5rem] bg-teal-500/5 border border-teal-500/10">
                  <p className="text-[10px] font-black text-teal-500/70 uppercase tracking-widest mb-3 capitalize">Projected Appreciation</p>
                  <div className="inline-flex bg-teal-500/20 px-5 py-2.5 rounded-full">
                    <p className="text-2xl font-black text-teal-400 tracking-tight tabular-nums">+RS{formatCurrency(projectedValue - totalInView)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl md:rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden flex flex-col h-full md:max-h-[600px]">
            <div className="p-5 md:p-8 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex flex-col">
                <h3 className="text-base md:text-2xl font-black text-indigo-600 capitalize">Savings Ledger</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Historical Wealth Reallocation</p>
              </div>
              <DateDropdown value={ledgerDateFilter} onChange={onDateFilterChange} />
            </div>
            <div className="overflow-auto scrollbar-hide">
              <table className="hidden md:table w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                    <th className="px-8 py-5">Date</th>
                    <th className="px-8 py-5">Source Account</th>
                    <th className="px-8 py-5 text-right">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSavingsTxs.length > 0 ? filteredSavingsTxs.map(t => (
                    <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-8 py-6">
                        <span className="bg-slate-100 px-3 py-1.5 rounded-full text-xs font-black text-slate-500 border border-slate-200">{t.date}</span>
                      </td>
                      <td className="px-8 py-6 font-black text-slate-800 text-base capitalize">{t.account || t.category}</td>
                      <td className="px-8 py-6 text-right">
                        <span className="inline-block bg-teal-50 px-5 py-2 rounded-full font-black text-base tracking-tight border border-teal-100 tabular-nums shadow-sm text-slate-900">
                          RS{t.amount.toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={3} className="px-8 py-20 text-center">
                        <p className="text-slate-300 font-black uppercase text-[10px] tracking-widest">No savings found for this period</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              <div className="md:hidden divide-y divide-slate-100">
                {filteredSavingsTxs.map(t => (
                  <div key={t.id} className="p-5 flex items-center justify-between active:bg-slate-50 transition-colors">
                    <div className="flex flex-col gap-1.5">
                      <span className="bg-slate-100 px-2.5 py-0.5 rounded-full text-[9px] font-black text-slate-500 w-fit">{t.date}</span>
                      <span className="text-base font-black text-slate-800 capitalize">{t.account || t.category}</span>
                    </div>
                    <span className="bg-teal-50 px-4 py-2 rounded-full text-base font-black tracking-tighter border border-teal-100 tabular-nums shadow-sm text-slate-900">
                      RS{t.amount.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompoundSavings;