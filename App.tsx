
import React, { useState, useEffect, useMemo } from 'react';
import { Transaction, TransactionType, Category, DailySummary, CategoryConfig } from './types';
import { DEFAULT_CATEGORIES, getCategoryConfig, ICON_MAP } from './constants';
import TransactionForm from './components/TransactionForm';
import Stats from './components/Stats';
import Charts from './components/Charts';
import AIAssistant from './components/AIAssistant';
import ReportView from './components/ReportView';
import BudgetManager from './components/BudgetManager';
import BudgetProgress from './components/BudgetProgress';
import CategoryManager from './components/CategoryManager';
import CompoundSavings from './components/CompoundSavings';
import DateDropdown, { DatePreset } from './components/DateDropdown';
import { Trash2, Wallet, LayoutDashboard, PlusCircle, FileText, TrendingUp, Target, PiggyBank, ArrowUpCircle, MoreHorizontal, Zap, BarChart3, ChevronRight, IndianRupee, Edit3, Menu, X, Settings, ChevronDown, Building2, Landmark, Sparkles } from 'lucide-react';

type TabType = 'overview' | 'income' | 'expenses' | 'savings' | 'reports' | 'budget' | 'settings';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [ledgerDateFilter, setLedgerDateFilter] = useState<DatePreset>('all');
  const [preselectedCategory, setPreselectedCategory] = useState<string | null>(null);
  
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('spendwise_transactions');
    return saved ? JSON.parse(saved) : [];
  });

  const [budgets, setBudgets] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('spendwise_budgets');
    return saved ? JSON.parse(saved) : {};
  });

  const [customCategories, setCustomCategories] = useState<CategoryConfig[]>(() => {
    const saved = localStorage.getItem('spendwise_custom_categories');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('spendwise_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('spendwise_budgets', JSON.stringify(budgets));
  }, [budgets]);

  useEffect(() => {
    localStorage.setItem('spendwise_custom_categories', JSON.stringify(customCategories));
  }, [customCategories]);

  const saveTransaction = (newTransaction: Transaction) => {
    setTransactions(prev => {
      if (editingTransaction) {
        setEditingTransaction(null);
        return prev.map(t => t.id === newTransaction.id ? newTransaction : t);
      }
      return [newTransaction, ...prev];
    });
    setPreselectedCategory(null);
  };

  const updateBudget = (category: Category, amount: number) => {
    setBudgets(prev => ({ ...prev, [category]: amount }));
  };

  const addCustomCategory = (cat: CategoryConfig) => setCustomCategories(prev => [...prev, cat]);
  
  const updateCustomCategory = (updatedCat: CategoryConfig) => {
    const oldCat = customCategories.find(c => c.id === updatedCat.id);
    if (oldCat && oldCat.name !== updatedCat.name) {
      setTransactions(prev => prev.map(t => 
        t.category === oldCat.name ? { ...t, category: updatedCat.name } : t
      ));
      
      setBudgets(prev => {
        const newBudgets = { ...prev };
        if (newBudgets[oldCat.name] !== undefined) {
          newBudgets[updatedCat.name] = newBudgets[oldCat.name];
          delete newBudgets[oldCat.name];
        }
        return newBudgets;
      });
    }
    setCustomCategories(prev => prev.map(c => c.id === updatedCat.id ? updatedCat : c));
  };

  const deleteCustomCategory = (id: string) => {
    const catToDelete = customCategories.find(c => c.id === id);
    if (catToDelete) {
      setTransactions(prev => prev.map(t => {
        if (t.category === catToDelete.name) {
          let fallback = 'Others';
          if (t.type === TransactionType.INCOME) fallback = 'Daily Income';
          if (t.type === TransactionType.SAVINGS) fallback = 'Savings';
          return { ...t, category: fallback };
        }
        return t;
      }));
      
      setBudgets(prev => {
        const newBudgets = { ...prev };
        delete newBudgets[catToDelete.name];
        return newBudgets;
      });
    }
    setCustomCategories(prev => prev.filter(c => c.id !== id));
  };

  const removeTransaction = (id: string) => {
    if (window.confirm("Are you sure you want to delete this transaction?")) {
      setTransactions(prev => prev.filter(t => t.id !== id));
      if (editingTransaction?.id === id) setEditingTransaction(null);
    }
  };

  const clearAll = () => { if (window.confirm("Delete all data? This cannot be undone.")) setTransactions([]); };

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const yesterdayStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  }, []);
  const currentMonthStr = useMemo(() => new Date().toISOString().substring(0, 7), []);

  const monthlySpending = useMemo(() => {
    const totals: Record<string, number> = {};
    transactions.forEach(t => {
      if (t.date.startsWith(currentMonthStr) && t.type === TransactionType.EXPENSE) {
        totals[t.category] = (totals[t.category] || 0) + Number(t.amount);
      }
    });
    return totals;
  }, [transactions, currentMonthStr]);

  const summary = useMemo(() => {
    let opening: number = 0;
    let income: number = 0;
    let expenses: number = 0;
    let currentMonthSavings: number = 0;
    let todayExp: number = 0;
    let todayInc: number = 0;
    let todaySav: number = 0;
    let liquid: number = 0;
    let cumulativeInc: number = 0;
    let totalSavingsAcc: number = 0;
    
    transactions.forEach(t => {
      const isToday = t.date === todayStr;
      const isCurrentMonth = t.date.startsWith(currentMonthStr);
      const amount = Number(t.amount) || 0;

      if (t.type === TransactionType.INCOME) {
        liquid += amount;
        cumulativeInc += amount;
        if (t.category === 'Opening Balance') opening += amount;
      } else if (t.type === TransactionType.EXPENSE) {
        liquid -= amount;
      } else if (t.type === TransactionType.SAVINGS) {
        liquid -= amount;
        totalSavingsAcc += amount;
      }

      if (isCurrentMonth) {
        if (t.type === TransactionType.SAVINGS) {
          currentMonthSavings += amount;
          if (isToday) todaySav += amount;
        } else if (t.type === TransactionType.INCOME && t.category !== 'Opening Balance') {
          income += amount;
          if (isToday) todayInc += amount;
        } else if (t.type === TransactionType.EXPENSE) {
          expenses += amount;
          if (isToday) todayExp += amount;
        }
      } else if (isToday) {
        if (t.type === TransactionType.INCOME && t.category !== 'Opening Balance') todayInc += amount;
        else if (t.type === TransactionType.EXPENSE) todayExp += amount;
      }
    });

    const totalBudgetValue = (Object.values(budgets) as number[]).reduce((sum: number, val: number) => sum + (Number(val) || 0), 0);

    return {
      openingBalance: opening,
      totalIncome: income,
      totalExpenses: expenses,
      netSavings: currentMonthSavings,
      totalSavings: totalSavingsAcc,
      todaySavings: todaySav,
      currentBalance: liquid,
      todayExpenses: todayExp,
      todayIncome: todayInc,
      cumulativeIncome: cumulativeInc,
      totalBudget: totalBudgetValue
    };
  }, [transactions, todayStr, currentMonthStr, budgets]);

  const budgetUsagePercent = Math.min((summary.totalExpenses / (summary.totalBudget || 1)) * 100, 100);

  const formatCurrency = (val: number) => new Intl.NumberFormat(undefined, { minimumFractionDigits: 2 }).format(val);

  const handleStartEdit = (t: Transaction) => {
    setEditingTransaction(t);
    if (t.type === TransactionType.INCOME) setActiveTab('income');
    else if (t.type === TransactionType.EXPENSE) setActiveTab('expenses');
    else if (t.type === TransactionType.SAVINGS) setActiveTab('savings');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleQuickAdd = (categoryName: string) => {
    setPreselectedCategory(categoryName);
    setEditingTransaction(null);
    const formEl = document.getElementById('transaction-form');
    if (formEl) {
      formEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const quickExpenseCategories = [
    'Food', 'Fuel', 'Bike repair', 'Parcel', 'Mobile Tp up', 'Data top up', 'Tea', 'Buy acceries', 'Others'
  ];

  const navItems = [
    { id: 'overview', label: 'overview', icon: LayoutDashboard },
    { id: 'income', label: 'income', icon: ArrowUpCircle },
    { id: 'expenses', label: 'expenses', icon: Zap },
    { id: 'savings', label: 'savings', icon: PiggyBank },
    { id: 'budget', label: 'budgets', icon: Target },
    { id: 'reports', label: 'reports', icon: FileText },
    { id: 'settings', label: 'settings', icon: PlusCircle }
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-28 md:pb-8 font-['Inter'] overflow-x-hidden">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-12 md:h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-2.5 cursor-pointer group" onClick={() => setActiveTab('overview')}>
            <div className="bg-emerald-600 p-1.5 md:p-2 rounded-lg md:rounded-xl shadow-lg shadow-emerald-200 transition-transform group-active:scale-90"><Wallet className="w-4 h-4 md:w-5 md:h-5 text-white" /></div>
            <div>
              <h1 className="text-base md:text-xl font-black text-slate-900 leading-tight lowercase">spendwise</h1>
              <p className="hidden md:block text-[10px] text-slate-400 font-bold lowercase tracking-wider">wealth engine</p>
            </div>
          </div>
          <button onClick={clearAll} className="p-1.5 md:p-2 text-slate-400 hover:text-rose-500 rounded-xl transition-all active:scale-90"><Trash2 className="w-4 h-4 md:w-5 md:h-5" /></button>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative border-t border-slate-50">
          <div className="overflow-x-auto scrollbar-hide">
            <nav className="flex gap-4 md:gap-8 min-w-max">
              {navItems.map(tab => (
                <button 
                  key={tab.id} 
                  onClick={() => { setActiveTab(tab.id as TabType); setEditingTransaction(null); setIsMobileMenuOpen(false); setPreselectedCategory(null); }} 
                  className={`py-2 md:py-4 px-1 flex items-center gap-1.5 border-b-2 font-black text-[10px] md:text-[12px] lowercase tracking-wide transition-all active:scale-95 ${activeTab === tab.id ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-400'}`}
                >
                  <tab.icon className="w-3 h-3 md:w-3.5 md:h-3.5" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
          <div className="absolute top-0 right-0 h-full w-8 bg-gradient-to-l from-white to-transparent pointer-events-none md:hidden" />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8 space-y-5 md:space-y-8">
        {activeTab === 'overview' && (
          <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
             <Stats summary={summary} activeTab={activeTab} onTabChange={setActiveTab} />
             
             <div className="bg-white rounded-2xl md:rounded-[2.5rem] p-5 md:p-8 border border-slate-100 shadow-sm space-y-4 md:space-y-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="bg-indigo-50 p-2 md:p-2.5 rounded-2xl"><Target className="w-5 h-5 md:w-6 md:h-6 text-indigo-600" /></div>
                    <div>
                      <h3 className="text-[11px] md:text-sm font-black text-slate-800 lowercase tracking-wide">master budget utilization</h3>
                      <p className="text-[9px] text-slate-400 font-bold lowercase tracking-wider">monthly performance metric</p>
                    </div>
                  </div>
                  <div className="text-left md:text-right">
                    <p className="text-base md:text-xl font-black text-slate-800">RS {formatCurrency(summary.totalExpenses)} <span className="text-slate-300 font-normal">/ {formatCurrency(summary.totalBudget)}</span></p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="h-3 md:h-5 bg-slate-100 rounded-full overflow-hidden border border-slate-50 p-0.5 md:p-1">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ease-out ${budgetUsagePercent >= 100 ? 'bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.4)]' : budgetUsagePercent >= 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                      style={{ width: `${budgetUsagePercent}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[9px] md:text-[10px] font-black lowercase tracking-widest">
                    <span className={budgetUsagePercent >= 100 ? 'text-rose-600' : budgetUsagePercent >= 80 ? 'text-amber-600' : 'text-emerald-600'}>
                      {budgetUsagePercent >= 100 ? 'budget exceeded' : budgetUsagePercent >= 80 ? 'action required' : 'status healthy'}
                    </span>
                    <span className="text-slate-400">{budgetUsagePercent.toFixed(1)}% used</span>
                  </div>
                </div>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
              <div className="lg:col-span-8 space-y-6 md:space-y-8">
                <Charts transactions={transactions} customCategories={customCategories} budgets={budgets} />
                <BudgetProgress budgets={budgets} monthlySpending={monthlySpending} customCategories={customCategories} />
              </div>
              <div className="lg:col-span-4 space-y-6 md:space-y-8">
                <AIAssistant transactions={transactions} />
                <div className="bg-white rounded-2xl md:rounded-3xl border border-slate-100 p-4 md:p-6 shadow-sm">
                   <div className="flex items-center justify-between mb-4 md:mb-6">
                    <h3 className="text-[10px] font-black text-slate-800 lowercase tracking-widest">today's activity</h3>
                    <button onClick={() => setActiveTab('expenses')} className="text-[10px] font-black text-emerald-600 flex items-center gap-1 hover:underline active:scale-95 transition-transform lowercase">view ledger <ChevronRight className="w-3 h-3" /></button>
                   </div>
                   <div className="space-y-3 md:space-y-4">
                    {transactions.filter(t => t.date === todayStr).slice(0, 5).map(t => {
                      const config = getCategoryConfig(t.category, customCategories);
                      const IconComp = ICON_MAP[config.iconName] || MoreHorizontal;
                      return (
                        <div key={t.id} onClick={() => { handleStartEdit(t); }} className="flex items-center justify-between py-1 cursor-pointer hover:bg-slate-50 transition-all rounded-xl px-2 -mx-2 group active:scale-[0.98]">
                          <div className="flex items-center gap-2 md:gap-3">
                            <div 
                              style={{ backgroundColor: config.color }} 
                              className="p-1.5 md:p-2 rounded-lg text-white scale-90 shadow-sm"
                            >
                              <IconComp className="w-3.5 h-3.5 md:w-4 md:h-4" />
                            </div>
                            <div>
                              <span className="text-[11px] md:text-sm font-black text-slate-700 block lowercase">{t.category}</span>
                              <span className="text-[8px] md:text-[10px] text-slate-400 font-bold lowercase">{t.note.length > 20 ? t.note.substring(0, 17) + '...' : t.note}</span>
                            </div>
                          </div>
                          <span className={`text-[11px] md:text-sm font-black ${t.type === TransactionType.INCOME ? 'text-emerald-600' : t.type === TransactionType.SAVINGS ? 'text-teal-600' : 'text-slate-900'}`}>
                            {t.type === TransactionType.INCOME ? '+' : t.type === TransactionType.SAVINGS ? '→' : '-'}RS {t.amount.toFixed(2)}
                          </span>
                        </div>
                      );
                    })}
                    {transactions.filter(t => t.date === todayStr).length === 0 && (
                      <div className="py-8 md:py-12 text-center text-slate-300 text-[10px] font-bold space-y-2 lowercase">
                        <Zap className="w-6 h-6 md:w-8 md:h-8 mx-auto opacity-20" />
                        <p>no activity recorded today.</p>
                      </div>
                    )}
                   </div>
                </div>
              </div>
             </div>
          </div>
        )}

        {activeTab === 'expenses' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Quick Expense Buttons Dashboard */}
            <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] lowercase">quick expense entry</h3>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-9 gap-4">
                {quickExpenseCategories.map(catName => {
                  const config = getCategoryConfig(catName, customCategories);
                  const IconComp = ICON_MAP[config.iconName] || MoreHorizontal;
                  return (
                    <button
                      key={catName}
                      onClick={() => handleQuickAdd(catName)}
                      className="flex flex-col items-center gap-2 group active:scale-90 transition-all"
                    >
                      <div 
                        style={{ backgroundColor: config.color }} 
                        className="w-14 h-14 md:w-16 md:h-16 rounded-[1.25rem] flex items-center justify-center text-white shadow-lg shadow-slate-100 group-hover:shadow-xl group-hover:-translate-y-1 transition-all"
                      >
                        <IconComp className="w-6 h-6 md:w-7 md:h-7" />
                      </div>
                      <span className="text-[10px] font-black text-slate-600 lowercase text-center leading-tight">
                        {catName}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-8">
              <div className="lg:col-span-5">
                <TransactionForm 
                  onAdd={saveTransaction} 
                  onCancel={() => { setEditingTransaction(null); setPreselectedCategory(null); }} 
                  editingTransaction={editingTransaction} 
                  filterType={TransactionType.EXPENSE} 
                  customCategories={customCategories} 
                  preselectedCategory={preselectedCategory}
                />
              </div>
              <div className="lg:col-span-7">
                <div className="bg-white rounded-2xl md:rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden flex flex-col h-full max-h-[450px] md:max-h-[750px]">
                   <div className="p-4 md:p-8 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 md:gap-3">
                      <div>
                        <h3 className="text-lg md:text-2xl font-black text-slate-800 tracking-tight lowercase">expense ledger</h3>
                        <p className="text-[9px] md:text-[10px] text-slate-400 font-bold lowercase tracking-widest mt-0.5 md:mt-1">comprehensive historical log</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <DateDropdown value={ledgerDateFilter} onChange={setLedgerDateFilter} />
                        <div className="bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-sm h-[40px] flex items-center">
                           <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">RS {formatCurrency(summary.totalExpenses)}</span>
                        </div>
                      </div>
                   </div>
                   <div className="overflow-auto scrollbar-hide">
                      <table className="w-full text-left border-collapse">
                         <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                            <tr className="text-[9px] md:text-[10px] font-black tracking-widest text-slate-500 lowercase">
                               <th className="px-4 md:px-8 py-3 md:py-5">date</th>
                               <th className="px-4 md:px-8 py-3 md:py-5">details</th>
                               <th className="px-4 md:px-8 py-3 md:py-5 text-right">value</th>
                               <th className="px-4 md:px-8 py-3 md:py-5 text-center">actions</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-slate-100">
                            {transactions
                              .filter(t => {
                                const matchesType = t.type === TransactionType.EXPENSE;
                                if (!matchesType) return false;
                                if (ledgerDateFilter === 'today') return t.date === todayStr;
                                if (ledgerDateFilter === 'yesterday') return t.date === yesterdayStr;
                                if (ledgerDateFilter === 'thisMonth') return t.date.startsWith(currentMonthStr);
                                if (ledgerDateFilter === 'last7') {
                                  const last7 = new Date();
                                  last7.setDate(last7.getDate() - 7);
                                  return t.date >= last7.toISOString().split('T')[0];
                                }
                                return true;
                              })
                              .sort((a,b) => b.date.localeCompare(a.date))
                              .map(t => (
                                <tr key={t.id} className={`hover:bg-slate-50 transition-colors group ${t.date === todayStr ? 'bg-emerald-50/20' : ''} ${editingTransaction?.id === t.id ? 'bg-emerald-50 ring-2 ring-emerald-500 ring-inset' : ''}`}>
                                  <td className="px-4 md:px-8 py-3 md:py-6">
                                    <div className="flex flex-col">
                                      <span className="text-[9px] md:text-xs font-bold text-slate-500">{t.date}</span>
                                      {t.date === todayStr && <span className="text-[7px] font-black lowercase text-emerald-600 tracking-widest mt-0.5">today</span>}
                                    </div>
                                  </td>
                                  <td className="px-4 md:px-8 py-3 md:py-6">
                                    <div>
                                      <div className="font-black text-slate-800 text-[11px] md:text-sm flex items-center gap-1.5 md:gap-2 lowercase">{t.category}</div>
                                      <div className="text-[8px] md:text-[10px] text-slate-400 font-bold italic mt-0.5 lowercase">{t.note}</div>
                                    </div>
                                  </td>
                                  <td className="px-4 md:px-8 py-3 md:py-6 text-right font-mono font-black text-[11px] md:text-sm text-slate-900">{formatCurrency(t.amount)}</td>
                                  <td className="px-4 md:px-8 py-3 md:py-6 text-center">
                                    <div className="flex items-center justify-center gap-1 md:gap-1.5">
                                      <button onClick={() => handleStartEdit(t)} className="p-1 md:p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all active:scale-90"><Edit3 className="w-3 md:w-4 md:h-4" /></button>
                                      <button onClick={() => removeTransaction(t.id)} className="p-1 md:p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all active:scale-90"><Trash2 className="w-3 md:w-4 md:h-4" /></button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                         </tbody>
                      </table>
                   </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'income' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="lg:col-span-5">
              <TransactionForm onAdd={saveTransaction} onCancel={() => setEditingTransaction(null)} editingTransaction={editingTransaction} filterType={TransactionType.INCOME} customCategories={customCategories} />
            </div>
            <div className="lg:col-span-7">
              <div className="bg-white rounded-2xl md:rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden flex flex-col h-full max-h-[450px] md:max-h-[750px]">
                 <div className="p-4 md:p-8 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 md:gap-3">
                    <div>
                      <h3 className="text-lg md:text-2xl font-black text-slate-800 tracking-tight lowercase">income ledger</h3>
                      <p className="text-[9px] md:text-[10px] text-slate-400 font-bold lowercase tracking-widest mt-0.5 md:mt-1">comprehensive historical log</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <DateDropdown value={ledgerDateFilter} onChange={setLedgerDateFilter} />
                      <div className="bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-sm h-[40px] flex items-center">
                         <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">RS {formatCurrency(summary.totalIncome)}</span>
                      </div>
                    </div>
                 </div>
                 <div className="overflow-auto scrollbar-hide">
                    <table className="w-full text-left border-collapse">
                       <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                          <tr className="text-[9px] md:text-[10px] font-black tracking-widest text-slate-500 lowercase">
                             <th className="px-4 md:px-8 py-3 md:py-5">date</th>
                             <th className="px-4 md:px-8 py-3 md:py-5">details</th>
                             <th className="px-4 md:px-8 py-3 md:py-5 text-right">value</th>
                             <th className="px-4 md:px-8 py-3 md:py-5 text-center">actions</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-100">
                          {transactions
                            .filter(t => {
                              const matchesType = t.type === TransactionType.INCOME;
                              if (!matchesType) return false;
                              if (ledgerDateFilter === 'today') return t.date === todayStr;
                              if (ledgerDateFilter === 'yesterday') return t.date === yesterdayStr;
                              if (ledgerDateFilter === 'thisMonth') return t.date.startsWith(currentMonthStr);
                              if (ledgerDateFilter === 'last7') {
                                const last7 = new Date();
                                last7.setDate(last7.getDate() - 7);
                                return t.date >= last7.toISOString().split('T')[0];
                              }
                              return true;
                            })
                            .sort((a,b) => b.date.localeCompare(a.date))
                            .map(t => (
                              <tr key={t.id} className={`hover:bg-slate-50 transition-colors group ${t.date === todayStr ? 'bg-emerald-50/20' : ''} ${editingTransaction?.id === t.id ? 'bg-emerald-50 ring-2 ring-emerald-500 ring-inset' : ''}`}>
                                <td className="px-4 md:px-8 py-3 md:py-6">
                                  <div className="flex flex-col">
                                    <span className="text-[9px] md:text-xs font-bold text-slate-500">{t.date}</span>
                                    {t.date === todayStr && <span className="text-[7px] font-black lowercase text-emerald-600 tracking-widest mt-0.5">today</span>}
                                  </div>
                                </td>
                                <td className="px-4 md:px-8 py-3 md:py-6">
                                  <div>
                                    <div className="font-black text-slate-800 text-[11px] md:text-sm flex items-center gap-1.5 md:gap-2 lowercase">{t.category}{t.category === 'Opening Balance' && <IndianRupee className="w-2.5 h-2.5 md:w-3 md:h-3 text-slate-400" />}</div>
                                    <div className="text-[8px] md:text-[10px] text-slate-400 font-bold italic mt-0.5 lowercase">{t.note}</div>
                                  </div>
                                </td>
                                <td className="px-4 md:px-8 py-3 md:py-6 text-right font-mono font-black text-[11px] md:text-sm text-emerald-600">{formatCurrency(t.amount)}</td>
                                <td className="px-4 md:px-8 py-3 md:py-6 text-center">
                                  <div className="flex items-center justify-center gap-1 md:gap-1.5">
                                    <button onClick={() => handleStartEdit(t)} className="p-1 md:p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all active:scale-90"><Edit3 className="w-3 md:w-4 md:h-4" /></button>
                                    <button onClick={() => removeTransaction(t.id)} className="p-1 md:p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all active:scale-90"><Trash2 className="w-3 md:w-4 md:h-4" /></button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                       </tbody>
                    </table>
                 </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'savings' && <CompoundSavings transactions={transactions} customCategories={customCategories} onSaveTransaction={saveTransaction} onRemoveTransaction={removeTransaction} onStartEdit={(t) => { handleStartEdit(t); setActiveTab('savings'); }} editingTransaction={editingTransaction} onCancelEdit={() => setEditingTransaction(null)} />}
        {activeTab === 'budget' && <BudgetManager budgets={budgets} onUpdate={updateBudget} customCategories={customCategories} />}
        {activeTab === 'reports' && <ReportView transactions={transactions} summary={summary} customCategories={customCategories} budgets={budgets} />}
        {activeTab === 'settings' && <CategoryManager customCategories={customCategories} onAdd={addCustomCategory} onUpdate={updateCustomCategory} onDelete={deleteCustomCategory} />}
      </main>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200 md:hidden" onClick={() => setIsMobileMenuOpen(false)}>
           <div className="absolute bottom-28 left-1/2 -translate-x-1/2 w-[90%] bg-white rounded-3xl p-5 shadow-2xl border border-slate-100 space-y-3 animate-in slide-in-from-bottom-4 duration-300" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-[10px] font-black text-slate-400 lowercase tracking-widest">financial toolkit</h4>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-1.5 bg-slate-50 rounded-full text-slate-400 active:scale-90"><X className="w-4 h-4" /></button>
              </div>
              <div className="grid grid-cols-1 gap-2">
                 {[
                   { id: 'budget', label: 'budget planner', icon: Target, desc: 'monthly limits' },
                   { id: 'reports', label: 'financial reports', icon: FileText, desc: 'excel exports' },
                   { id: 'settings', label: 'system settings', icon: Settings, desc: 'categories' }
                 ].map(item => (
                   <button key={item.id} onClick={() => { setActiveTab(item.id as TabType); setIsMobileMenuOpen(false); }} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 border border-slate-50 transition-all text-left group active:scale-95">
                     <div className="bg-slate-50 p-2.5 rounded-xl text-slate-500 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors"><item.icon className="w-4 h-4" /></div>
                     <div><p className="font-black text-slate-800 text-xs lowercase">{item.label}</p><p className="text-[9px] text-slate-400 font-bold lowercase">{item.desc}</p></div>
                   </button>
                 ))}
              </div>
           </div>
        </div>
      )}

      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[110] flex items-center gap-1 px-4 py-2 bg-slate-900/95 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-2xl md:hidden w-[92%] justify-between">
        <button onClick={() => { setActiveTab('overview'); setIsMobileMenuOpen(false); }} className={`flex flex-col items-center gap-1 flex-1 py-1.5 transition-all active:scale-90 ${activeTab === 'overview' ? 'text-emerald-400' : 'text-slate-500'}`}><LayoutDashboard className="w-4 h-4" /><span className="text-[8px] font-black lowercase tracking-wide">dash</span></button>
        <button onClick={() => { setActiveTab('income'); setIsMobileMenuOpen(false); }} className={`flex flex-col items-center gap-1 flex-1 py-1.5 transition-all active:scale-90 ${activeTab === 'income' ? 'text-emerald-400' : 'text-slate-500'}`}><ArrowUpCircle className="w-4 h-4" /><span className="text-[8px] font-black lowercase tracking-wide">earn</span></button>
        <div className="relative -mt-10 px-2"><button onClick={() => { setEditingTransaction(null); setPreselectedCategory(null); setActiveTab('expenses'); setIsMobileMenuOpen(false); }} className="p-3 bg-emerald-500 rounded-xl text-white shadow-lg shadow-emerald-500/30 border-4 border-slate-900 active:scale-90 transition-all"><PlusCircle className="w-5 h-5" /></button></div>
        <button onClick={() => { setActiveTab('expenses'); setIsMobileMenuOpen(false); }} className={`flex flex-col items-center gap-1 flex-1 py-1.5 transition-all active:scale-90 ${activeTab === 'expenses' ? 'text-amber-400' : 'text-slate-500'}`}><Zap className="w-4 h-4" /><span className="text-[8px] font-black lowercase tracking-wide">spend</span></button>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className={`flex flex-col items-center gap-1 flex-1 py-1.5 transition-all active:scale-90 ${isMobileMenuOpen ? 'text-teal-400' : 'text-slate-500'}`}>{isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}<span className="text-[8px] font-black lowercase tracking-wide">more</span></button>
      </div>
    </div>
  );
};

export default App;
