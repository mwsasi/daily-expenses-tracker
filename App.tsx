
import React, { useState, useEffect, useMemo } from 'react';
import { Transaction, TransactionType, Category, DailySummary, CategoryConfig, SavingsGoal } from './types';
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
import { 
  Trash2, 
  Wallet, 
  LayoutDashboard, 
  FileText, 
  Target, 
  ArrowUpCircle, 
  MoreHorizontal, 
  Zap, 
  Settings, 
  Sparkles, 
  PiggyBank, 
  Edit3, 
  PlusCircle,
  X,
  ChevronRight
} from 'lucide-react';

type TabType = 'overview' | 'income' | 'expenses' | 'savings' | 'reports' | 'budget' | 'settings';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [ledgerDateFilter, setLedgerDateFilter] = useState<DatePreset>('all');
  const [preselectedCategory, setPreselectedCategory] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
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

  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>(() => {
    const saved = localStorage.getItem('spendwise_savings_goals');
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

  useEffect(() => {
    localStorage.setItem('spendwise_bank_accounts', JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    localStorage.setItem('spendwise_savings_goals', JSON.stringify(savingsGoals));
  }, [savingsGoals]);

  const allCategories = useMemo(() => [...DEFAULT_CATEGORIES, ...customCategories], [customCategories]);

  const quickExpenseCategories = useMemo(() => 
    allCategories.filter(c => c.type === TransactionType.EXPENSE).map(c => c.name),
  [allCategories]);

  const quickIncomeCategories = useMemo(() => 
    allCategories.filter(c => c.type === TransactionType.INCOME).map(c => c.name),
  [allCategories]);

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
    setIsMobileMenuOpen(false);
  };

  const removeTransaction = (id: string) => {
    if (window.confirm("Remove This Entry Permanently?")) {
      setTransactions(prev => prev.filter(t => t.id !== id));
      if (editingTransaction?.id === id) setEditingTransaction(null);
    }
  };

  const startEditing = (t: Transaction) => {
    setEditingTransaction(t);
    setPreselectedCategory(null);
    const formEl = document.getElementById('transaction-form');
    if (formEl) formEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const updateBudget = (category: Category, amount: number) => {
    setBudgets(prev => ({ ...prev, [category]: amount }));
  };

  const addSavingsGoal = (goal: SavingsGoal) => setSavingsGoals(prev => [...prev, goal]);
  const deleteSavingsGoal = (id: string) => {
    if (window.confirm("Remove this goal? History of savings will remain, but the target will be deleted.")) {
      setSavingsGoals(prev => prev.filter(g => g.id !== id));
    }
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

  const todayStr = new Date().toLocaleDateString('en-CA');
  const currentMonthStr = todayStr.substring(0, 7);
  const firstOfCurrentMonth = currentMonthStr + "-01";

  const filterByPreset = (txs: Transaction[], preset: DatePreset) => {
    const now = new Date();
    const today = now.toLocaleDateString('en-CA');
    return txs.filter(t => {
      switch (preset) {
        case 'today': return t.date === today;
        case 'yesterday': {
          const y = new Date(now);
          y.setDate(now.getDate() - 1);
          return t.date === y.toLocaleDateString('en-CA');
        }
        case 'last7': {
          const l7 = new Date(now);
          l7.setDate(now.getDate() - 7);
          return t.date >= l7.toLocaleDateString('en-CA');
        }
        case 'thisMonth': return t.date.startsWith(now.toLocaleDateString('en-CA').substring(0, 7));
        case 'lastMonth': {
          const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          return t.date.startsWith(lm.toLocaleDateString('en-CA').substring(0, 7));
        }
        case 'thisYear': return t.date.startsWith(now.getFullYear().toString());
        default: return true;
      }
    });
  };

  const summary = useMemo(() => {
    let opening: number = 0;
    let monthlyIncome: number = 0;
    let monthlyExpenses: number = 0;
    let monthlySavings: number = 0;
    let liquidBalance: number = 0;
    let totalSavingsBalance: number = 0;
    let todayExp: number = 0;
    let todayInc: number = 0;
    let cumulativeInc: number = 0;
    
    transactions.forEach(t => {
      const amount = Number(t.amount) || 0;
      const isToday = t.date === todayStr;
      const isCurrentMonth = t.date.startsWith(currentMonthStr);
      const isBeforeCurrentMonth = t.date < firstOfCurrentMonth;
      const isOpeningCategory = t.category === 'Opening Balance';

      if (t.type === TransactionType.INCOME) {
        liquidBalance += amount;
        cumulativeInc += amount;
      } else if (t.type === TransactionType.EXPENSE) {
        liquidBalance -= amount;
      } else if (t.type === TransactionType.SAVINGS) {
        liquidBalance -= amount;
        totalSavingsBalance += amount;
      }

      if (isBeforeCurrentMonth || (isOpeningCategory && t.type === TransactionType.INCOME)) {
        if (t.type === TransactionType.INCOME) opening += amount;
        else if (t.type === TransactionType.EXPENSE) opening -= amount;
        else if (t.type === TransactionType.SAVINGS) opening -= amount;
      }

      if (isCurrentMonth) {
        if (t.type === TransactionType.INCOME && !isOpeningCategory) {
          monthlyIncome += amount;
        } else if (t.type === TransactionType.EXPENSE) {
          monthlyExpenses += amount;
        } else if (t.type === TransactionType.SAVINGS) {
          monthlySavings += amount;
        }
      }
      
      if (isToday) {
         if (t.type === TransactionType.INCOME && !isOpeningCategory) todayInc += amount;
         else if (t.type === TransactionType.EXPENSE) todayExp += amount;
      }
    });

    const totalBudgetValue = (Object.values(budgets) as number[]).reduce((sum: number, val: number) => sum + (Number(val) || 0), 0);

    return { 
      openingBalance: opening, 
      totalIncome: monthlyIncome, 
      totalExpenses: monthlyExpenses, 
      currentBalance: liquidBalance, 
      todayExpenses: todayExp,
      todayIncome: todayInc,
      cumulativeIncome: cumulativeInc,
      totalBudget: totalBudgetValue,
      totalSavings: totalSavingsBalance
    };
  }, [transactions, budgets, todayStr, currentMonthStr, firstOfCurrentMonth]);

  const filteredTransactions = useMemo(() => {
    let filtered = transactions;
    if (activeTab === 'income') filtered = transactions.filter(t => t.type === TransactionType.INCOME);
    if (activeTab === 'expenses') filtered = transactions.filter(t => t.type === TransactionType.EXPENSE);
    if (activeTab === 'savings') filtered = transactions.filter(t => t.type === TransactionType.SAVINGS);
    
    return filterByPreset(filtered, ledgerDateFilter);
  }, [transactions, activeTab, ledgerDateFilter]);

  const monthlySpending = useMemo(() => {
    const spending: Record<string, number> = {};
    transactions.forEach(t => {
      if (t.type === TransactionType.EXPENSE && t.date.startsWith(currentMonthStr)) {
        spending[t.category] = (spending[t.category] || 0) + t.amount;
      }
    });
    return spending;
  }, [transactions, currentMonthStr]);

  const handleQuickAdd = (categoryName: string, type?: TabType) => {
    if (type) setActiveTab(type);
    setPreselectedCategory(categoryName);
    setEditingTransaction(null);
    setIsMobileMenuOpen(false);
    
    setTimeout(() => {
      const formEl = document.getElementById('transaction-form');
      if (formEl) formEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'income', label: 'Income', icon: ArrowUpCircle },
    { id: 'expenses', label: 'Expenses', icon: Zap },
    { id: 'savings', label: 'Savings', icon: PiggyBank },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'budget', label: 'Budgets', icon: Target },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  const handleMobileNavClick = (tabId: TabType) => {
    setActiveTab(tabId);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-emerald-100 selection:text-emerald-900 pb-20 lg:pb-0">
      {/* Top Desktop Nav */}
      <nav className="sticky top-0 z-[100] bg-white/80 backdrop-blur-xl border-b border-slate-200 px-4 md:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-20">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('overview')}>
            <div className="bg-emerald-600 p-2.5 rounded-2xl shadow-lg shadow-emerald-200">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">SpendWise<span className="text-emerald-600">.</span></h1>
          </div>

          <div className="hidden lg:flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as TabType)}
                className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all capitalize flex items-center gap-2 ${activeTab === item.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}
          </div>

          <button onClick={clearAll} className="p-2.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl transition-all">
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12 space-y-12">
        {activeTab === 'overview' && (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Stats summary={summary} onTabChange={setActiveTab} />
            
            <div className="lg:hidden bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Rapid Action Grid</h3>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => handleQuickAdd('Daily Income', 'income')} className="flex items-center gap-3 p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-emerald-700 font-black text-xs active:scale-95 transition-all">
                  <div className="bg-emerald-600 p-1.5 rounded-lg text-white"><PlusCircle className="w-4 h-4" /></div>
                  Daily Income
                </button>
                <button onClick={() => handleQuickAdd('Opening Balance', 'income')} className="flex items-center gap-3 p-4 bg-blue-50 rounded-2xl border border-blue-100 text-blue-700 font-black text-xs active:scale-95 transition-all">
                  <div className="bg-blue-600 p-1.5 rounded-lg text-white"><Wallet className="w-4 h-4" /></div>
                  Opening Bal
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
              <div className="xl:col-span-2 space-y-12">
                <Charts transactions={transactions} customCategories={customCategories} budgets={budgets} />
              </div>
              <div className="space-y-12">
                <AIAssistant transactions={transactions} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'income' && (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="bg-white p-6 md:p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3 mb-8">
                <Sparkles className="w-5 h-5 text-emerald-500" />
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Quick Income Entry</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {quickIncomeCategories.map(catName => {
                  const config = getCategoryConfig(catName, customCategories);
                  const IconComp = ICON_MAP[config.iconName] || PlusCircle;
                  return (
                    <button key={catName} onClick={() => handleQuickAdd(catName)} className="flex items-center gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100 group active:scale-95 hover:bg-emerald-50 hover:border-emerald-100 transition-all text-left">
                      <div style={{ backgroundColor: config.color }} className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg shrink-0">
                        <IconComp className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-[11px] font-black text-slate-800 capitalize block leading-none mb-1">{catName}</span>
                        <span className="text-[9px] font-bold text-slate-400 capitalize whitespace-nowrap">Tap to add</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              <div className="space-y-8">
                <TransactionForm 
                  onAdd={saveTransaction} 
                  filterType={TransactionType.INCOME} 
                  editingTransaction={editingTransaction}
                  preselectedCategory={preselectedCategory}
                  onCancel={() => { setEditingTransaction(null); setPreselectedCategory(null); }}
                  customCategories={customCategories}
                  accounts={accounts}
                  onAddAccount={addAccount}
                />
              </div>
              <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-black text-slate-900 capitalize">Income Stream</h2>
                  <DateDropdown value={ledgerDateFilter} onChange={setLedgerDateFilter} />
                </div>
                <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm overflow-x-auto">
                  <table className="w-full text-left min-w-[600px]">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <th className="px-8 py-5">Date</th>
                        <th className="px-8 py-5">Category</th>
                        <th className="px-8 py-5 text-right">Amount</th>
                        <th className="px-8 py-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredTransactions.map(t => (
                        <tr key={t.id} className="group hover:bg-slate-50 transition-colors">
                          <td className="px-8 py-5 text-sm text-slate-500">{t.date}</td>
                          <td className="px-8 py-5 font-bold text-slate-900">{t.category}</td>
                          <td className="px-8 py-5 text-right font-black text-emerald-600">RS{t.amount.toLocaleString()}</td>
                          <td className="px-8 py-5 text-right">
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => startEditing(t)} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"><Edit3 className="w-4 h-4" /></button>
                              <button onClick={() => removeTransaction(t.id)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredTransactions.length === 0 && (
                        <tr><td colSpan={4} className="py-12 text-center text-slate-300 font-bold">No income records found for this period.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'expenses' && (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="bg-white p-6 md:p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3 mb-8">
                <Sparkles className="w-5 h-5 text-rose-500" />
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Quick Expense Entry</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4 md:gap-6">
                {quickExpenseCategories.map(catName => {
                  const config = getCategoryConfig(catName, customCategories);
                  const IconComp = ICON_MAP[config.iconName] || Zap;
                  return (
                    <button key={catName} onClick={() => handleQuickAdd(catName)} className="flex flex-col items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 group active:scale-95 hover:bg-rose-50 hover:border-rose-100 transition-all">
                      <div style={{ backgroundColor: config.color }} className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg transition-transform group-hover:-translate-y-1">
                        <IconComp className="w-5 h-5" />
                      </div>
                      <span className="text-[9px] font-black text-slate-700 capitalize text-center leading-tight truncate w-full">{catName}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              <div className="space-y-8">
                <TransactionForm 
                  onAdd={saveTransaction} 
                  filterType={TransactionType.EXPENSE} 
                  editingTransaction={editingTransaction}
                  preselectedCategory={preselectedCategory}
                  onCancel={() => { setEditingTransaction(null); setPreselectedCategory(null); }}
                  customCategories={customCategories}
                  accounts={accounts}
                  onAddAccount={addAccount}
                />
              </div>
              <div className="lg:col-span-2 space-y-12">
                <BudgetProgress budgets={budgets} monthlySpending={monthlySpending} customCategories={customCategories} />
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-black text-slate-900 capitalize">Expense Journal</h2>
                    <DateDropdown value={ledgerDateFilter} onChange={setLedgerDateFilter} />
                  </div>
                  <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm overflow-x-auto">
                    <table className="w-full text-left min-w-[600px]">
                      <thead className="bg-slate-50 border-b border-slate-100">
                        <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          <th className="px-8 py-5">Date</th>
                          <th className="px-8 py-5">Category</th>
                          <th className="px-8 py-5 text-right">Amount</th>
                          <th className="px-8 py-5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredTransactions.map(t => (
                          <tr key={t.id} className="group hover:bg-slate-50 transition-colors">
                            <td className="px-8 py-5 text-sm text-slate-500">{t.date}</td>
                            <td className="px-8 py-5 font-bold text-slate-900">{t.category}</td>
                            <td className="px-8 py-5 text-right font-black text-rose-500">RS{t.amount.toLocaleString()}</td>
                            <td className="px-8 py-5 text-right">
                              <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => startEditing(t)} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"><Edit3 className="w-4 h-4" /></button>
                                <button onClick={() => removeTransaction(t.id)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {filteredTransactions.length === 0 && (
                          <tr><td colSpan={4} className="py-12 text-center text-slate-300 font-bold">No expense records found for this period.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
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
            onStartEdit={startEditing}
            editingTransaction={editingTransaction}
            onCancelEdit={() => setEditingTransaction(null)}
            accounts={accounts}
            onAddAccount={addAccount}
            ledgerDateFilter={ledgerDateFilter}
            onDateFilterChange={setLedgerDateFilter}
            savingsGoals={savingsGoals}
            onAddSavingsGoal={addSavingsGoal}
            onDeleteSavingsGoal={deleteSavingsGoal}
          />
        )}

        {activeTab === 'reports' && (
          <ReportView 
            transactions={transactions} 
            summary={summary} 
            customCategories={customCategories}
            budgets={budgets}
          />
        )}

        {activeTab === 'budget' && (
          <BudgetManager 
            budgets={budgets} 
            onUpdate={updateBudget} 
            customCategories={customCategories} 
          />
        )}

        {activeTab === 'settings' && (
          <CategoryManager 
            customCategories={customCategories} 
            transactions={transactions}
            onAdd={addCustomCategory} 
            onUpdate={updateCustomCategory} 
            onDelete={deleteCustomCategory} 
          />
        )}
      </main>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-[150] bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[2.5rem] p-8 pb-12 animate-in slide-in-from-bottom-full duration-500 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black text-slate-900">More Options</h3>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 bg-slate-100 rounded-xl text-slate-500">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              {[
                { id: 'reports', label: 'Financial Reports', icon: FileText, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { id: 'budget', label: 'Budget Management', icon: Target, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                { id: 'settings', label: 'System Settings', icon: Settings, color: 'text-slate-600', bg: 'bg-slate-50' }
              ].map((item) => (
                <button 
                  key={item.id}
                  onClick={() => handleMobileNavClick(item.id as TabType)}
                  className="flex items-center justify-between p-5 bg-white border border-slate-100 rounded-2xl active:bg-slate-50 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className={`${item.bg} ${item.color} p-3 rounded-xl`}>
                      <item.icon className="w-6 h-6" />
                    </div>
                    <span className="font-black text-slate-800 text-sm">{item.label}</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300 group-active:translate-x-1 transition-transform" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-[100] flex items-center justify-around h-20 pb-4 safe-area-pb shadow-[0_-8px_30px_rgb(0,0,0,0.04)]">
        {navItems.filter(item => ['overview', 'income', 'expenses', 'savings'].includes(item.id)).map(item => (
          <button 
            key={item.id} 
            onClick={() => setActiveTab(item.id as TabType)}
            className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all ${activeTab === item.id ? 'text-emerald-600' : 'text-slate-400'}`}
          >
            <div className={`p-2 rounded-xl transition-colors ${activeTab === item.id ? 'bg-emerald-50' : 'bg-transparent'}`}>
              <item.icon className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-tighter">{item.label}</span>
          </button>
        ))}
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all ${['reports', 'budget', 'settings'].includes(activeTab) ? 'text-emerald-600' : 'text-slate-400'}`}
        >
          <div className={`p-2 rounded-xl transition-colors ${['reports', 'budget', 'settings'].includes(activeTab) ? 'bg-emerald-50' : 'bg-transparent'}`}>
            <MoreHorizontal className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-tighter">More</span>
        </button>
      </nav>

      <footer className="hidden lg:block bg-white border-t border-slate-200 py-12 px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">© 2025 SpendWise Matrix Engine</p>
          <div className="flex items-center gap-6">
            <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-widest">AI Core Active</span>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">v4.0.2 Stable</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
