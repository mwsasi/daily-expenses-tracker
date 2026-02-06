
import React, { useState, useMemo, useEffect } from 'react';
import { 
  PiggyBank, 
  TrendingUp, 
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
  Wallet,
  Download,
  Loader2
} from 'lucide-react';
import { Transaction, TransactionType, CategoryConfig, SavingsGoal } from '../types';
import TransactionForm from './TransactionForm';
import DateDropdown, { DatePreset } from './DateDropdown';
import SavingsGoals from './SavingsGoals';

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
  savingsGoals: SavingsGoal[];
  onAddSavingsGoal: (goal: SavingsGoal) => void;
  onDeleteSavingsGoal: (id: string) => void;
}

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
  onDateFilterChange,
  savingsGoals,
  onAddSavingsGoal,
  onDeleteSavingsGoal
}) => {
  const [bankFilter, setBankFilter] = useState<string>('all');
  const [isGenerating, setIsGenerating] = useState(false);

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

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);
  };

  const generateBankWiseReport = async () => {
    setIsGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 800));

    const csvRows: string[] = [];
    const headers = ['Bank/Account', 'Date', 'Category', 'Note', 'Amount (RS)', 'Running Bank Balance'];
    csvRows.push(headers.join(','));

    allAccounts.forEach(bank => {
      const bankTxs = allSavingsTxs
        .filter(t => t.account === bank)
        .sort((a, b) => a.date.localeCompare(b.date));

      if (bankTxs.length === 0) return;

      let runningBalance = 0;
      bankTxs.forEach(t => {
        runningBalance += t.amount;
        const row = [
          `"${bank}"`,
          t.date,
          `"${t.category}"`,
          `"${(t.note || '').replace(/"/g, '""')}"`,
          t.amount.toFixed(2),
          runningBalance.toFixed(2)
        ];
        csvRows.push(row.join(','));
      });

      // Add a subtotal/spacer row for this bank
      csvRows.push(`${bank} TOTAL,,,,${runningBalance.toFixed(2)},`);
      csvRows.push(',,,,,'); // Spacer
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `SpendWise_Savings_BankWise_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setIsGenerating(false);
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-8">
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
            <div className="grid grid-cols-1 gap-4">
              {allAccounts.map((accName, idx) => {
                const isActive = bankFilter === accName;
                const balance = bankBreakdown.breakdown[accName] || 0;
                return (
                  <button key={accName} onClick={() => setBankFilter(isActive ? 'all' : accName)} className={`flex items-center justify-between p-6 rounded-2xl border-2 transition-all duration-300 ${isActive ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-100' : 'bg-white border-slate-50 text-slate-800'}`}>
                    <p className={`font-black text-sm capitalize truncate ${isActive ? 'text-white' : 'text-slate-800'}`}>{accName}</p>
                    <div className={`px-4 py-2 rounded-full ${isActive ? 'bg-white/20' : 'bg-slate-100'} border border-black/5`}>
                      <p className={`text-base font-black tracking-tighter tabular-nums ${isActive ? 'text-white' : 'text-slate-900'}`}>RS{formatCurrency(balance)}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-12">
          <div className="bg-indigo-600 rounded-[3rem] p-10 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
            <div>
              <p className="text-[10px] font-black text-indigo-100 uppercase tracking-widest mb-2">Total Wealth Allocation</p>
              <h2 className="text-4xl md:text-6xl font-black tracking-tighter">RS{formatCurrency(totalInView)}</h2>
            </div>
            <div className="flex flex-col items-end gap-4">
              <div className="bg-white/10 p-5 rounded-full border border-white/5 backdrop-blur-sm">
                 <PiggyBank className="w-10 h-10" />
              </div>
              <button 
                onClick={generateBankWiseReport}
                disabled={isGenerating || allSavingsTxs.length === 0}
                className="flex items-center gap-2 bg-white text-indigo-600 px-6 py-3 rounded-2xl font-black text-xs hover:bg-indigo-50 transition-all active:scale-95 disabled:opacity-50 shadow-lg"
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Download Bank-Wise Report
              </button>
            </div>
          </div>

          <SavingsGoals 
            goals={savingsGoals} 
            onAdd={onAddSavingsGoal} 
            onDelete={onDeleteSavingsGoal} 
            transactions={transactions}
            accounts={allAccounts}
          />

          <div className="bg-white rounded-2xl md:rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden flex flex-col h-full md:max-h-[700px]">
            <div className="p-5 md:p-8 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex flex-col">
                <h3 className="text-base md:text-2xl font-black text-indigo-600 capitalize">Wealth Movement Journal</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Verified Savings Ledger</p>
              </div>
              <DateDropdown value={ledgerDateFilter} onChange={onDateFilterChange} />
            </div>
            <div className="overflow-auto scrollbar-hide">
              <table className="hidden md:table w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                    <th className="px-8 py-5">Value Date</th>
                    <th className="px-8 py-5">Target Institution</th>
                    <th className="px-8 py-5 text-right">Settled Value</th>
                    <th className="px-8 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSavingsTxs.length > 0 ? filteredSavingsTxs.map(t => (
                    <tr key={t.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-8 py-6">
                        <span className="bg-slate-100 px-3 py-1.5 rounded-full text-xs font-black text-slate-500 border border-slate-200">{t.date}</span>
                      </td>
                      <td className="px-8 py-6 font-black text-slate-800 text-base capitalize">{t.account || t.category}</td>
                      <td className="px-8 py-6 text-right">
                        <span className="inline-block bg-teal-50 px-5 py-2 rounded-full font-black text-base tracking-tight border border-teal-100 tabular-nums shadow-sm text-slate-900">
                          RS{t.amount.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => onStartEdit(t)} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all">
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button onClick={() => onRemoveTransaction(t.id)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="px-8 py-20 text-center">
                        <p className="text-slate-300 font-black uppercase text-[10px] tracking-widest">No verified savings found</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              <div className="md:hidden divide-y divide-slate-100">
                {filteredSavingsTxs.map(t => (
                  <div key={t.id} className="p-5 space-y-3 active:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col gap-1.5">
                        <span className="bg-slate-100 px-2.5 py-0.5 rounded-full text-[9px] font-black text-slate-500 w-fit">{t.date}</span>
                        <span className="text-base font-black text-slate-800 capitalize">{t.account || t.category}</span>
                      </div>
                      <span className="bg-teal-50 px-4 py-2 rounded-full text-base font-black tracking-tighter border border-teal-100 tabular-nums shadow-sm text-slate-900">
                        RS{t.amount.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-end gap-4 pt-1">
                      <button onClick={() => onStartEdit(t)} className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 hover:text-emerald-600">
                        <Edit3 className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button onClick={() => onRemoveTransaction(t.id)} className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 hover:text-rose-500">
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                    </div>
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
