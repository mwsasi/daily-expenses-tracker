
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
import DateDropdown, { DatePreset } from './components/DateDropdown';
import { Trash2, Wallet, LayoutDashboard, PlusCircle, FileText, Target, ArrowUpCircle, MoreHorizontal, Zap, BarChart3, Settings, Sparkles } from 'lucide-react';

type TabType = 'overview' | 'income' | 'expenses' | 'reports' | 'budget' | 'settings';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
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
  const updateCustomCategory = (updatedCat: CategoryConfig) => setCustomCategories(prev => prev.map(c => c.id === updatedCat.id ? updatedCat : c));
  const deleteCustomCategory = (id: string) => setCustomCategories(prev => prev.filter(c => c.id !== id));

  const clearAll = () => { if (window.confirm("Delete all data? This cannot be undone.")) setTransactions([]); };

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
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
    let opening: number = 0, income: number = 0, expenses: number = 0;
    let todayExp: number = 0, todayInc: number = 0, liquid: number = 0;
    let cumulativeInc: number = 0;
    // Calculate total savings independently
    let savings: number = 0;
    
    transactions.forEach(t => {
      const isToday = t.date === todayStr;
      const isCurrentMonth = t.date.startsWith(currentMonthStr);
      const amount = Number(t.amount) || 0;
      if (t.type === TransactionType.INCOME) {
        liquid += amount; cumulativeInc += amount;
        if (t.category === 'Opening Balance') opening += amount;
      } else if (t.type === TransactionType.EXPENSE) {
        liquid -= amount;
      } else if (t.type === TransactionType.SAVINGS) {
        // Move money from liquid pool to savings pool
        liquid -= amount;
        savings += amount;
      }
      
      if (isCurrentMonth) {
        if (t.type === TransactionType.INCOME && t.category !== 'Opening Balance') { income += amount; if (isToday) todayInc += amount; }
        else if (t.type === TransactionType.EXPENSE) { expenses += amount; if (isToday) todayExp += amount; }
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
      currentBalance: liquid, 
      todayExpenses: todayExp, 
      todayIncome: todayInc, 
      cumulativeIncome: cumulativeInc, 
      totalBudget: totalBudgetValue,
      totalSavings: savings
    };
  }, [transactions, todayStr, currentMonthStr, budgets]);

  const budgetUsagePercent = Math.min((summary.totalExpenses / (summary.totalBudget || 1)) * 100, 100);
  const formatCurrency = (val: number) => new Intl.NumberFormat(undefined, { minimumFractionDigits: 2 }).format(val);

  const handleQuickAdd = (categoryName: string) => {
    setPreselectedCategory(categoryName);
    setEditingTransaction(null);
    const formEl = document.getElementById('transaction-form');
    if (formEl) formEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const quickExpenseCategories = ['Food', 'Fuel', 'Bike repair', 'Parcel', 'Mobile Tp up', 'Data top up', 'Tea', 'Buy acceries', 'Others'];
  const navItems = [
    { id: 'overview', label: 'overview', icon: LayoutDashboard },
    { id: 'income', label: 'income', icon: ArrowUpCircle },
    { id: 'expenses', label: 'expenses', icon: Zap },
    { id: 'budget', label: 'budgets', icon: Target },
    { id: 'reports', label: 'reports', icon: FileText },
    { id: 'settings', label: 'settings', icon: Settings }
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
                <button key={tab.id} onClick={() => { setActiveTab(tab.id as TabType); setEditingTransaction(null); setPreselectedCategory(null); }} className={`py-2 md:py-4 px-1 flex items-center gap-1.5 border-b-2 font-black text-[10px] md:text-[12px] lowercase tracking-wide transition-all active:scale-95 ${activeTab === tab.id ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-400'}`}>
                  <tab.icon className="w-3 h-3 md:w-3.5 md:h-3.5" />{tab.label}
                </button>
              ))}
            </nav>
          </div>
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
                <div className="h-3 md:h-5 bg-slate-100 rounded-full overflow-hidden border border-slate-50 p-0.5 md:p-1">
                  <div className={`h-full rounded-full transition-all duration-1000 ease-out ${budgetUsagePercent >= 100 ? 'bg-rose-500' : budgetUsagePercent >= 80 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${budgetUsagePercent}%` }} />
                </div>
             </div>
             <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
              <div className="lg:col-span-8 space-y-6 md:space-y-8">
                <Charts transactions={transactions} customCategories={customCategories} budgets={budgets} />
                <BudgetProgress budgets={budgets} monthlySpending={monthlySpending} customCategories={customCategories} />
              </div>
              <div className="lg:col-span-4 space-y-6 md:space-y-8"><AIAssistant transactions={transactions} /></div>
             </div>
          </div>
        )}

        {activeTab === 'expenses' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <Sparkles className="w-4 h-4 text-amber-500" /><h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] lowercase">quick expense entry</h3>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-9 gap-4">
                {quickExpenseCategories.map(catName => {
                  const config = getCategoryConfig(catName, customCategories);
                  const IconComp = ICON_MAP[config.iconName] || MoreHorizontal;
                  return (
                    <button key={catName} onClick={() => handleQuickAdd(catName)} className="flex flex-col items-center gap-2 group active:scale-90 transition-all">
                      <div style={{ backgroundColor: config.color }} className="w-14 h-14 md:w-16 md:h-16 rounded-[1.25rem] flex items-center justify-center text-white shadow-lg group-hover:-translate-y-1 transition-all"><IconComp className="w-6 h-6 md:w-7 md:h-7" /></div>
                      <span className="text-[10px] font-black text-slate-600 lowercase text-center leading-tight">{catName}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-8">
              <div className="lg:col-span-5">
                <TransactionForm onAdd={saveTransaction} onCancel={() => { setEditingTransaction(null); setPreselectedCategory(null); }} editingTransaction={editingTransaction} filterType={TransactionType.EXPENSE} customCategories={customCategories} preselectedCategory={preselectedCategory} />
              </div>
              <div className="lg:col-span-7">
                <div className="bg-white rounded-2xl md:rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden flex flex-col h-full max-h-[750px]">
                   <div className="p-4 md:p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                      <h3 className="text-lg md:text-2xl font-black text-slate-800 lowercase">expense ledger</h3>
                      <DateDropdown value={ledgerDateFilter} onChange={setLedgerDateFilter} />
                   </div>
                   <div className="overflow-auto scrollbar-hide">
                      <table className="w-full text-left border-collapse">
                         <thead className="bg-slate-50 border-b border-slate-200"><tr className="text-[9px] font-black text-slate-500 lowercase"><th className="px-8 py-5">date</th><th className="px-8 py-5">details</th><th className="px-8 py-5 text-right">value</th></tr></thead>
                         <tbody className="divide-y divide-slate-100">
                            {transactions.filter(t => t.type === TransactionType.EXPENSE).map(t => (
                              <tr key={t.id} className="hover:bg-slate-50 transition-colors"><td className="px-8 py-6 text-xs font-bold text-slate-400">{t.date}</td><td className="px-8 py-6 font-black text-slate-800 text-sm lowercase">{t.category}</td><td className="px-8 py-6 text-right font-black text-sm text-slate-900">RS {t.amount.toFixed(2)}</td></tr>
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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="lg:col-span-5"><TransactionForm onAdd={saveTransaction} editingTransaction={editingTransaction} filterType={TransactionType.INCOME} customCategories={customCategories} /></div>
            <div className="lg:col-span-7"><div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm lowercase">income history view</div></div>
          </div>
        )}
        {activeTab === 'budget' && <BudgetManager budgets={budgets} onUpdate={updateBudget} customCategories={customCategories} />}
        {activeTab === 'reports' && <ReportView transactions={transactions} summary={summary} customCategories={customCategories} budgets={budgets} />}
        {activeTab === 'settings' && <CategoryManager customCategories={customCategories} onAdd={addCustomCategory} onUpdate={updateCustomCategory} onDelete={deleteCustomCategory} />}
      </main>
    </div>
  );
};

export default App;
