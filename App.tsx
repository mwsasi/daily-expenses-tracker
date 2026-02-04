
import React, { useState, useEffect, useMemo } from 'react';
import { Transaction, TransactionType, Category, DailySummary, Budget, CategoryConfig } from './types';
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
import { Trash2, Wallet, LayoutDashboard, PlusCircle, FileText, TrendingUp, Target, PiggyBank, ArrowUpCircle, MoreHorizontal, Zap, BarChart3, ChevronRight, IndianRupee } from 'lucide-react';

type TabType = 'overview' | 'income' | 'expenses' | 'savings' | 'reports' | 'budget' | 'settings';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  
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
  };

  const updateBudget = (category: Category, amount: number) => {
    setBudgets(prev => ({ ...prev, [category]: amount }));
  };

  const addCustomCategory = (cat: CategoryConfig) => setCustomCategories(prev => [...prev, cat]);
  
  const updateCustomCategory = (updatedCat: CategoryConfig) => {
    const oldCat = customCategories.find(c => c.id === updatedCat.id);
    if (oldCat && oldCat.name !== updatedCat.name) {
      // Re-map transactions using the old name to the new name
      setTransactions(prev => prev.map(t => 
        t.category === oldCat.name ? { ...t, category: updatedCat.name } : t
      ));
      
      // Update budgets if applicable
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
      // Re-map orphaned transactions to default categories
      setTransactions(prev => prev.map(t => {
        if (t.category === catToDelete.name) {
          let fallback = 'Others';
          if (t.type === TransactionType.INCOME) fallback = 'Daily Income';
          if (t.type === TransactionType.SAVINGS) fallback = 'Savings';
          return { ...t, category: fallback };
        }
        return t;
      }));
      
      // Clean up budgets
      setBudgets(prev => {
        const newBudgets = { ...prev };
        delete newBudgets[catToDelete.name];
        return newBudgets;
      });
    }
    setCustomCategories(prev => prev.filter(c => c.id !== id));
  };

  const removeTransaction = (id: string) => setTransactions(prev => prev.filter(t => t.id !== id));
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
    let opening = 0, income = 0, expenses = 0, currentMonthSavings = 0, todayExp = 0, todayInc = 0, todaySav = 0, liquid = 0, cumulativeInc = 0;
    
    transactions.forEach(t => {
      const isToday = t.date === todayStr;
      const isCurrentMonth = t.date.startsWith(currentMonthStr);
      const amount = Number(t.amount) || 0;

      // Global opening balance (all time)
      if (t.category === 'Opening Balance') opening += amount;

      if (t.type === TransactionType.INCOME) {
        liquid += amount;
        cumulativeInc += amount;
      } else if (t.type === TransactionType.EXPENSE) {
        liquid -= amount;
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

    const totalSav = transactions.filter(t => t.type === TransactionType.SAVINGS).reduce((s, t) => s + t.amount, 0);
    const totalBudgetValue = Object.values(budgets).reduce((sum, val) => sum + (val || 0), 0);

    return {
      openingBalance: opening,
      totalIncome: income,
      totalExpenses: expenses,
      netSavings: currentMonthSavings,
      totalSavings: totalSav,
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

  return (
    <div className="min-h-screen bg-slate-50 pb-24 font-['Inter']">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setActiveTab('overview')}>
            <div className="bg-emerald-600 p-2 rounded-xl shadow-lg shadow-emerald-200"><Wallet className="w-5 h-5 text-white" /></div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 leading-tight">SpendWise</h1>
              <p className="text-[10px] text-slate-500 font-medium tracking-widest uppercase">Wealth Engine</p>
            </div>
          </div>
          <button onClick={clearAll} className="p-2 text-slate-400 hover:text-rose-500 rounded-xl transition-all"><Trash2 className="w-5 h-5" /></button>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-x-auto scrollbar-hide border-t border-slate-50">
          <nav className="flex gap-6 min-w-max">
            {[
              { id: 'overview', label: 'Overview', icon: LayoutDashboard },
              { id: 'income', label: 'Income', icon: ArrowUpCircle },
              { id: 'expenses', label: 'Expenses', icon: Zap },
              { id: 'savings', label: 'Savings', icon: PiggyBank },
              { id: 'budget', label: 'Budgets', icon: Target },
              { id: 'reports', label: 'Reports', icon: FileText },
              { id: 'settings', label: 'Settings', icon: PlusCircle }
            ].map(tab => (
              <button 
                key={tab.id} 
                onClick={() => setActiveTab(tab.id as TabType)} 
                className={`py-4 px-1 flex items-center gap-2 border-b-2 font-bold text-[11px] uppercase tracking-wider transition-all ${activeTab === tab.id ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-400'}`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
             <Stats summary={summary} activeTab={activeTab} onTabChange={setActiveTab} />
             
             <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="bg-indigo-50 p-2.5 rounded-2xl"><Target className="w-6 h-6 text-indigo-600" /></div>
                    <div>
                      <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Master Budget Utilization</h3>
                      <p className="text-[10px] text-slate-400 font-medium uppercase tracking-[0.1em]">Monthly Performance Metric</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-slate-800">Rs {formatCurrency(summary.totalExpenses)} <span className="text-slate-300 font-normal">/ {formatCurrency(summary.totalBudget)}</span></p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="h-5 bg-slate-100 rounded-full overflow-hidden border border-slate-50 p-1">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ease-out ${budgetUsagePercent >= 100 ? 'bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.4)]' : budgetUsagePercent >= 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                      style={{ width: `${budgetUsagePercent}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em]">
                    <span className={budgetUsagePercent >= 100 ? 'text-rose-600' : budgetUsagePercent >= 80 ? 'text-amber-600' : 'text-emerald-600'}>
                      {budgetUsagePercent >= 100 ? 'Budget Exceeded' : budgetUsagePercent >= 80 ? 'Action Required' : 'Status Healthy'}
                    </span>
                    <span className="text-slate-500">{budgetUsagePercent.toFixed(1)}% Used</span>
                  </div>
                </div>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8 space-y-8">
                <Charts transactions={transactions} customCategories={customCategories} />
                <BudgetProgress budgets={budgets} monthlySpending={monthlySpending} customCategories={customCategories} />
              </div>
              <div className="lg:col-span-4 space-y-8">
                <AIAssistant transactions={transactions} />
                <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
                   <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-[0.2em]">Today's Activity</h3>
                    <button onClick={() => setActiveTab('expenses')} className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 hover:underline">View Ledger <ChevronRight className="w-3 h-3" /></button>
                   </div>
                   <div className="space-y-4">
                    {transactions.filter(t => t.date === todayStr).slice(0, 5).map(t => {
                      const config = getCategoryConfig(t.category, customCategories);
                      const IconComp = ICON_MAP[config.iconName] || MoreHorizontal;
                      return (
                        <div key={t.id} onClick={() => { setEditingTransaction(t); setActiveTab(t.type === TransactionType.INCOME ? 'income' : 'expenses'); }} className="flex items-center justify-between py-1 cursor-pointer hover:bg-slate-50 transition-colors rounded-xl px-2 -mx-2">
                          <div className="flex items-center gap-3">
                            <div className={`${config.color} p-2 rounded-lg text-white scale-90 shadow-sm`}><IconComp className="w-4 h-4" /></div>
                            <div>
                              <span className="text-sm font-bold text-slate-700 block">{t.category}</span>
                              <span className="text-[10px] text-slate-400 font-medium">{t.note.length > 20 ? t.note.substring(0, 17) + '...' : t.note}</span>
                            </div>
                          </div>
                          <span className={`text-sm font-black ${t.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-slate-900'}`}>
                            {t.type === TransactionType.INCOME ? '+' : '-'}Rs {t.amount.toFixed(2)}
                          </span>
                        </div>
                      );
                    })}
                    {transactions.filter(t => t.date === todayStr).length === 0 && (
                      <div className="py-12 text-center text-slate-300 text-xs font-medium space-y-3">
                        <Zap className="w-8 h-8 mx-auto opacity-20" />
                        <p>No activity recorded today.</p>
                      </div>
                    )}
                   </div>
                </div>
              </div>
             </div>
          </div>
        )}

        {(activeTab === 'income' || activeTab === 'expenses') && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="lg:col-span-5">
              <TransactionForm 
                onAdd={saveTransaction} 
                onCancel={() => setEditingTransaction(null)} 
                editingTransaction={editingTransaction} 
                filterType={activeTab === 'income' ? TransactionType.INCOME : TransactionType.EXPENSE} 
                customCategories={customCategories} 
              />
            </div>
            <div className="lg:col-span-7">
              <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden flex flex-col h-full max-h-[750px]">
                 <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-black text-slate-800 tracking-tight">
                        {activeTab === 'income' ? "Income Ledger" : "Expense Ledger"}
                      </h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">
                        Comprehensive Historical Log
                      </p>
                    </div>
                    <div className="bg-white border border-slate-200 px-4 py-2 rounded-2xl shadow-sm">
                       <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                         {activeTab === 'income' ? 'Total: ' : 'Spent: '} Rs {formatCurrency(activeTab === 'income' ? summary.totalIncome : summary.totalExpenses)}
                       </span>
                    </div>
                 </div>
                 <div className="overflow-auto scrollbar-hide">
                    <table className="w-full text-left">
                       <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                          <tr className="text-[10px] uppercase font-black tracking-widest text-slate-500">
                             <th className="px-8 py-5">Date</th>
                             <th className="px-8 py-5">Item Details</th>
                             <th className="px-8 py-5 text-right">Value (Rs)</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-100">
                          {transactions
                            .filter(t => t.type === (activeTab === 'income' ? TransactionType.INCOME : TransactionType.EXPENSE))
                            .sort((a,b) => b.date.localeCompare(a.date))
                            .map(t => {
                              const isToday = t.date === todayStr;
                              return (
                                <tr key={t.id} onClick={() => setEditingTransaction(t)} className={`hover:bg-slate-50 cursor-pointer transition-colors group ${isToday ? 'bg-emerald-50/20' : ''}`}>
                                  <td className="px-8 py-6">
                                    <div className="flex flex-col">
                                      <span className="text-xs font-bold text-slate-500">{t.date}</span>
                                      {isToday && <span className="text-[8px] font-black uppercase text-emerald-600 tracking-widest mt-0.5">Today</span>}
                                    </div>
                                  </td>
                                  <td className="px-8 py-6">
                                    <div>
                                      <div className="font-black text-slate-800 text-sm flex items-center gap-2">
                                        {t.category}
                                        {t.category === 'Opening Balance' && <IndianRupee className="w-3 h-3 text-slate-400" />}
                                      </div>
                                      <div className="text-[10px] text-slate-400 font-medium italic mt-0.5">{t.note}</div>
                                    </div>
                                  </td>
                                  <td className={`px-8 py-6 text-right font-mono font-black text-sm ${t.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-slate-900'}`}>
                                    {formatCurrency(t.amount)}
                                  </td>
                                </tr>
                              );
                            })}
                          {transactions.filter(t => t.type === (activeTab === 'income' ? TransactionType.INCOME : TransactionType.EXPENSE)).length === 0 && (
                            <tr>
                              <td colSpan={3} className="py-32 text-center">
                                <div className="space-y-4 opacity-20">
                                  <TrendingUp className="w-16 h-16 mx-auto" />
                                  <p className="text-sm font-black uppercase tracking-widest">Empty Ledger</p>
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
        )}

        {activeTab === 'savings' && <CompoundSavings transactions={transactions} customCategories={customCategories} onSaveTransaction={saveTransaction} onRemoveTransaction={removeTransaction} onStartEdit={(t) => { setEditingTransaction(t); setActiveTab('savings'); }} editingTransaction={editingTransaction} onCancelEdit={() => setEditingTransaction(null)} />}
        {activeTab === 'budget' && <BudgetManager budgets={budgets} onUpdate={updateBudget} customCategories={customCategories} />}
        {activeTab === 'reports' && <ReportView transactions={transactions} summary={summary} customCategories={customCategories} budgets={budgets} />}
        {activeTab === 'settings' && <CategoryManager customCategories={customCategories} onAdd={addCustomCategory} onUpdate={updateCustomCategory} onDelete={deleteCustomCategory} />}
      </main>

      {/* Mobile Floating Action Button and Simplified Bottom Nav */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-6 px-8 py-4 bg-slate-900/95 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl md:hidden">
        <button onClick={() => setActiveTab('overview')} className={`flex flex-col items-center gap-1.5 ${activeTab === 'overview' ? 'text-emerald-400' : 'text-slate-400'}`}><LayoutDashboard className="w-5 h-5" /><span className="text-[8px] font-black uppercase tracking-wider">Dash</span></button>
        <button onClick={() => setActiveTab('income')} className={`flex flex-col items-center gap-1.5 ${activeTab === 'income' ? 'text-emerald-400' : 'text-slate-400'}`}><ArrowUpCircle className="w-5 h-5" /><span className="text-[8px] font-black uppercase tracking-wider">Earn</span></button>
        <button onClick={() => { setEditingTransaction(null); setActiveTab('expenses'); }} className="p-4 bg-emerald-500 rounded-2xl text-white shadow-lg shadow-emerald-500/30 -mt-12 border-4 border-slate-900 active:scale-90 transition-all"><PlusCircle className="w-7 h-7" /></button>
        <button onClick={() => setActiveTab('expenses')} className={`flex flex-col items-center gap-1.5 ${activeTab === 'expenses' ? 'text-amber-400' : 'text-slate-400'}`}><Zap className="w-5 h-5" /><span className="text-[8px] font-black uppercase tracking-wider">Spend</span></button>
        <button onClick={() => setActiveTab('savings')} className={`flex flex-col items-center gap-1.5 ${activeTab === 'savings' ? 'text-teal-400' : 'text-slate-400'}`}><PiggyBank className="w-5 h-5" /><span className="text-[8px] font-black uppercase tracking-wider">Wealth</span></button>
      </div>
    </div>
  );
};

export default App;
