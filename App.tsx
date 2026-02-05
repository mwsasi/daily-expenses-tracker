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
import { Trash2, Wallet, LayoutDashboard, FileText, Target, ArrowUpCircle, MoreHorizontal, Zap, Settings, Sparkles, PiggyBank } from 'lucide-react';

type TabType = 'overview' | 'income' | 'expenses' | 'savings' | 'reports' | 'budget' | 'settings';

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

  const [accounts, setAccounts] = useState<string[]>(() => {
    const saved = localStorage.getItem('spendwise_bank_accounts');
    return saved ? JSON.parse(saved) : ['Commercial Bank', 'Amana Bank'];
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

  useEffect(() => {
    localStorage.setItem('spendwise_bank_accounts', JSON.stringify(accounts));
  }, [accounts]);

  const toTitleCase = (str: string) => str.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  const addAccount = (name: string) => {
    const titleCased = toTitleCase(name);
    if (!accounts.includes(titleCased)) {
      setAccounts(prev => [...prev, titleCased]);
    }
  };

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

  const removeTransaction = (id: string) => {
    if (window.confirm("Remove This Entry?")) {
      setTransactions(prev => prev.filter(t => t.id !== id));
    }
  };

  const updateBudget = (category: Category, amount: number) => {
    setBudgets(prev => ({ ...prev, [category]: amount }));
  };

  const addCustomCategory = (cat: CategoryConfig) => setCustomCategories(prev => [...prev, cat]);
  
  const updateCustomCategory = (updatedCat: CategoryConfig) => {
    const oldCat = customCategories.find(c => c.id === updatedCat.id);
    if (oldCat && oldCat.name !== updatedCat.name) {
      setTransactions(prev => prev.map(t => t.category === oldCat.name ? { ...t, category: updatedCat.name } : t));
      setBudgets(prev => {
        const newBudgets = { ...prev };
        if (newBudgets[oldCat.name]) {
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
      const defaultName = catToDelete.type === TransactionType.INCOME ? 'Daily Income' : catToDelete.type === TransactionType.SAVINGS ? 'Savings' : 'Others';
      setTransactions(prev => prev.map(t => t.category === catToDelete.name ? { ...t, category: defaultName } : t));
    }
    setCustomCategories(prev => prev.filter(c => c.id !== id));
  };

  const clearAll = () => { if (window.confirm("Delete All Data? This Cannot Be Undone.")) setTransactions([]); };

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const currentMonthStr = useMemo(() => new Date().toISOString().substring(0, 7), []);

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

  const summary = useMemo(() => {
    let opening: number = 0, income: number = 0, expenses: number = 0;
    let todayExp: number = 0, todayInc: number = 0, liquid: number = 0;
    let cumulativeInc: number = 0;
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

  const monthlySpending = useMemo(() => {
    const spendingMap: Record<string, number> = {};
    transactions.forEach(t => {
      if (t.type === TransactionType.EXPENSE && t.date.startsWith(currentMonthStr)) {
        spendingMap[t.category] = (spendingMap[t.category] || 0) + (Number(t.amount) || 0);
      }
    });
    return spendingMap;
  }, [transactions, currentMonthStr]);

  const budgetUsagePercent = Math.min((summary.totalExpenses / (summary.totalBudget || 1)) * 100, 100);
  const formatCurrency = (val: number) => new Intl.NumberFormat(undefined, { minimumFractionDigits: 2 }).format(val);

  const handleQuickAdd = (categoryName: string) => {
    setPreselectedCategory(categoryName);
    setEditingTransaction(null);
    const formEl = document.getElementById('transaction-form');
    if (formEl) formEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const quickExpenseCategories = ['Food', 'Fuel', 'Bike Repair', 'Parcel', 'Mobile Top Up', 'Data Top Up', 'Tea', 'Buy Accessories', 'Others'];
  
  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'income', label: 'Income', icon: ArrowUpCircle },
    { id: 'expenses', label: 'Expenses', icon: Zap },
    { id: 'savings', label: 'Savings', icon: PiggyBank },
    { id: 'budget', label: 'Budgets', icon: Target },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  const LedgerView = ({ type, title, colorClass, pillClass }: { type: TransactionType, title: string, colorClass: string, pillClass: string }) => {
    const filteredTxs = filterByPreset(transactions.filter(t => t.type === type), ledgerDateFilter);
    
    return (
      <div className="bg-white rounded-2xl md:rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden flex flex-col h-full md:max-h-[750px]">
        <div className="p-5 md:p-8 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-col">
            <h3 className={`text-base md:text-2xl font-black ${colorClass} capitalize`}>{title}</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Historical Audit Trail</p>
          </div>
          <DateDropdown value={ledgerDateFilter} onChange={setLedgerDateFilter} />
        </div>
        <div className="overflow-auto scrollbar-hide">
          <table className="hidden md:table w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                <th className="px-8 py-5">Value Date</th>
                <th className="px-8 py-5">Category Context</th>
                <th className="px-8 py-5 text-right">Settled Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTxs.length > 0 ? filteredTxs.map(t => (
                <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-8 py-6">
                    <span className="bg-slate-100 px-3 py-1.5 rounded-full text-xs font-black text-slate-600 border border-slate-200">{t.date}</span>
                  </td>
                  <td className="px-8 py-6 font-black text-slate-800 text-base capitalize">{t.category}</td>
                  <td className="px-8 py-6 text-right">
                    <span className={`inline-block ${pillClass} px-5 py-2 rounded-full font-black text-base tracking-tight border tabular-nums shadow-sm text-slate-900`}>
                      RS{t.amount.toFixed(2)}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={3} className="px-8 py-20 text-center">
                    <p className="text-slate-300 font-black uppercase text-[10px] tracking-widest">No entries found for this period</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="md:hidden divide-y divide-slate-100">
            {filteredTxs.map(t => (
              <div key={t.id} className="p-5 flex items-center justify-between active:bg-slate-50 transition-colors">
                <div className="flex flex-col gap-1.5">
                  <span className="bg-slate-100 px-2.5 py-0.5 rounded-full text-[9px] font-black text-slate-500 w-fit">{t.date}</span>
                  <span className="text-base font-black text-slate-800 capitalize">{t.category}</span>
                </div>
                <span className={`${pillClass} px-4 py-2 rounded-full text-base font-black tracking-tighter border tabular-nums shadow-sm text-slate-900`}>
                  RS{t.amount.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24 md:pb-8 font-['Bahnschrift_SemiBold','Bahnschrift',sans-serif] overflow-x-hidden">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 md:h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-2.5 cursor-pointer group" onClick={() => setActiveTab('overview')}>
            <div className="bg-emerald-600 p-1.5 md:p-2 rounded-lg md:rounded-xl shadow-lg shadow-emerald-200 transition-transform group-active:scale-90">
              <Wallet className="w-5 h-5 md:w-5 md:h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-black text-slate-900 leading-tight capitalize">SpendWise</h1>
              <p className="hidden md:block text-[10px] text-slate-400 font-bold capitalize tracking-wider">Wealth Engine</p>
            </div>
          </div>
          
          <nav className="hidden md:flex gap-6 lg:gap-8 mx-auto">
            {navItems.map(tab => (
              <button 
                key={tab.id} 
                onClick={() => { setActiveTab(tab.id as TabType); setEditingTransaction(null); }}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-black text-[12px] capitalize tracking-wide transition-all ${activeTab === tab.id ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
              >
                <tab.icon className="w-4 h-4" />{tab.label}
              </button>
            ))}
          </nav>

          <button onClick={clearAll} className="p-2 text-slate-400 hover:text-rose-500 rounded-xl transition-all active:scale-90">
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 md:py-8 space-y-6 md:space-y-10">
        {activeTab === 'overview' && (
          <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
             <Stats summary={summary} activeTab={activeTab} onTabChange={setActiveTab} />
             
             <div className="bg-white rounded-2xl md:rounded-[2.5rem] p-5 md:p-8 border border-slate-100 shadow-sm space-y-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-indigo-50 p-2.5 rounded-2xl"><Target className="w-5 h-5 md:w-6 md:h-6 text-indigo-600" /></div>
                    <div>
                      <h3 className="text-xs md:text-sm font-black text-slate-800 capitalize tracking-wide">Master Budget Utilization</h3>
                      <p className="text-[9px] text-slate-400 font-bold capitalize tracking-wider">Monthly Performance Metric</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
                    <div className="bg-slate-900 text-white px-5 py-2.5 rounded-full shadow-lg">
                      <p className="text-xs md:text-2xl font-black tracking-tighter whitespace-nowrap tabular-nums text-white">RS{formatCurrency(summary.totalExpenses)}</p>
                    </div>
                    <span className="text-slate-300 font-black">/</span>
                    <div className="bg-slate-100 text-slate-600 px-5 py-2.5 rounded-full border border-slate-200">
                      <p className="text-xs md:text-2xl font-black tracking-tighter whitespace-nowrap tabular-nums text-slate-900">RS{formatCurrency(summary.totalBudget)}</p>
                    </div>
                  </div>
                </div>
                <div className="h-3 md:h-6 bg-slate-100 rounded-full overflow-hidden border border-slate-50 p-1">
                  <div className={`h-full rounded-full transition-all duration-1000 ease-out flex items-center justify-center text-[8px] md:text-[10px] font-black text-white ${budgetUsagePercent >= 100 ? 'bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.3)]' : budgetUsagePercent >= 80 ? 'bg-amber-500' : 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]'}`} style={{ width: `${budgetUsagePercent}%` }}>
                    {budgetUsagePercent > 15 && `${budgetUsagePercent.toFixed(0)}%`}
                  </div>
                </div>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
              <div className="lg:col-span-8 space-y-6 md:space-y-10">
                <Charts transactions={transactions} customCategories={customCategories} budgets={budgets} />
                <BudgetProgress budgets={budgets} monthlySpending={monthlySpending} customCategories={customCategories} />
              </div>
              <div className="lg:col-span-4 h-fit sticky top-24">
                <AIAssistant transactions={transactions} />
              </div>
             </div>
          </div>
        )}

        {activeTab === 'expenses' && (
          <div className="space-y-6 md:space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex justify-between items-center bg-white px-6 py-4 rounded-2xl border border-slate-100 shadow-sm">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Global Expense Filter</span>
                <DateDropdown value={ledgerDateFilter} onChange={setLedgerDateFilter} />
            </div>

            <div className="bg-white p-5 md:p-10 rounded-2xl md:rounded-[2.5rem] border border-slate-100 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] capitalize">Instant Quick Entry</h3>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-9 gap-3 md:gap-6">
                {quickExpenseCategories.map(catName => {
                  const config = getCategoryConfig(catName, customCategories);
                  const IconComp = ICON_MAP[config.iconName] || MoreHorizontal;
                  return (
                    <button key={catName} onClick={() => handleQuickAdd(catName)} className="flex flex-col items-center gap-2 group active:scale-90 transition-all">
                      <div style={{ backgroundColor: config.color }} className="w-14 h-14 md:w-20 md:h-20 rounded-2xl md:rounded-[2rem] flex items-center justify-center text-white shadow-xl shadow-slate-100 group-hover:-translate-y-1 transition-all">
                        <IconComp className="w-6 h-6 md:w-8 md:h-8" />
                      </div>
                      <span className="text-[9px] md:text-[11px] font-black text-slate-600 capitalize text-center leading-tight truncate w-full">{catName}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-10">
              <div className="lg:col-span-5">
                <TransactionForm 
                  onAdd={saveTransaction} 
                  onCancel={() => { setEditingTransaction(null); setPreselectedCategory(null); }} 
                  editingTransaction={editingTransaction} 
                  filterType={TransactionType.EXPENSE} 
                  customCategories={customCategories} 
                  preselectedCategory={preselectedCategory}
                  accounts={accounts}
                  onAddAccount={addAccount}
                />
              </div>
              <div className="lg:col-span-7">
                <LedgerView 
                  type={TransactionType.EXPENSE} 
                  title="Expense Journal" 
                  colorClass="text-slate-800"
                  pillClass="bg-slate-100 border-slate-200"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'income' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex justify-between items-center bg-white px-6 py-4 rounded-2xl border border-slate-100 shadow-sm">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Global Income Filter</span>
                <DateDropdown value={ledgerDateFilter} onChange={setLedgerDateFilter} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-10">
              <div className="lg:col-span-5">
                <TransactionForm 
                  onAdd={saveTransaction} 
                  editingTransaction={editingTransaction} 
                  filterType={TransactionType.INCOME} 
                  customCategories={customCategories}
                  accounts={accounts}
                  onAddAccount={addAccount}
                />
              </div>
              <div className="lg:col-span-7">
                <LedgerView 
                  type={TransactionType.INCOME} 
                  title="Income Statement" 
                  colorClass="text-emerald-600"
                  pillClass="bg-emerald-50 border-emerald-100"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'savings' && (
          <CompoundSavings 
            transactions={transactions} 
            customCategories={customCategories} 
            onSaveTransaction={saveTransaction}
            onRemoveTransaction={removeTransaction}
            onStartEdit={setEditingTransaction}
            editingTransaction={editingTransaction}
            onCancelEdit={() => setEditingTransaction(null)}
            accounts={accounts}
            onAddAccount={addAccount}
            ledgerDateFilter={ledgerDateFilter}
            onDateFilterChange={setLedgerDateFilter}
          />
        )}

        {activeTab === 'budget' && <BudgetManager budgets={budgets} onUpdate={updateBudget} customCategories={customCategories} />}
        {activeTab === 'reports' && <ReportView transactions={transactions} summary={summary} customCategories={customCategories} budgets={budgets} />}
        {activeTab === 'settings' && <CategoryManager transactions={transactions} customCategories={customCategories} onAdd={addCustomCategory} onUpdate={updateCustomCategory} onDelete={deleteCustomCategory} />}
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-[100] flex items-center justify-around h-20 pb-4 safe-area-pb shadow-[0_-8px_30px_rgb(0,0,0,0.04)]">
        {navItems.filter(item => ['overview', 'income', 'expenses', 'savings'].includes(item.id)).map(tab => (
          <button 
            key={tab.id} 
            onClick={() => { setActiveTab(tab.id as TabType); setEditingTransaction(null); }}
            className={`flex flex-col items-center justify-center flex-1 h-full gap-1.5 transition-all active:scale-90 ${activeTab === tab.id ? 'text-emerald-600' : 'text-slate-400'}`}
          >
            <div className={`p-2 rounded-xl transition-colors ${activeTab === tab.id ? 'bg-emerald-50' : 'bg-transparent'}`}>
              <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'stroke-[2.5px]' : 'stroke-[2px]'}`} />
            </div>
            <span className="text-[9px] font-black uppercase tracking-tighter">{tab.label}</span>
          </button>
        ))}
        <button 
          onClick={() => { setActiveTab('reports'); }}
          className={`flex flex-col items-center justify-center flex-1 h-full gap-1.5 transition-all active:scale-90 ${['reports', 'budget', 'settings'].includes(activeTab) ? 'text-emerald-600' : 'text-slate-400'}`}
        >
          <div className={`p-2 rounded-xl transition-colors ${['reports', 'budget', 'settings'].includes(activeTab) ? 'bg-emerald-50' : 'bg-transparent'}`}>
            <MoreHorizontal className="w-5 h-5 stroke-[2px]" />
          </div>
          <span className="text-[9px] font-black uppercase tracking-tighter">More</span>
        </button>
      </nav>
      
      {['reports', 'budget', 'settings'].includes(activeTab) && (
        <div className="md:hidden fixed top-14 left-0 right-0 bg-white/90 backdrop-blur-md border-b border-slate-200 z-[90] overflow-x-auto scrollbar-hide py-3 px-4">
          <div className="flex gap-4 min-w-max">
            {['reports', 'budget', 'settings'].map(id => {
              const item = navItems.find(n => n.id === id)!;
              return (
                <button 
                  key={id} 
                  onClick={() => setActiveTab(id as TabType)}
                  className={`text-[10px] font-black uppercase tracking-widest px-5 py-2 rounded-full transition-all ${activeTab === id ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' : 'bg-slate-100 text-slate-500'}`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;