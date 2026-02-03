
import React, { useState, useEffect, useMemo } from 'react';
import { Transaction, TransactionType, Category, DailySummary } from './types';
import { CATEGORY_CONFIG } from './constants';
import TransactionForm from './components/TransactionForm';
import Stats from './components/Stats';
import Charts from './components/Charts';
import AIAssistant from './components/AIAssistant';
import ReportView from './components/ReportView';
import { Trash2, History, Wallet, LayoutDashboard, PlusCircle, FileText, Calendar, ArrowRightCircle, CheckCircle2, TrendingUp, Plus, ListFilter, BarChart3 } from 'lucide-react';

type TabType = 'overview' | 'income' | 'manage' | 'reports';
type HistoryViewType = 'daily' | 'cumulative';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [historyView, setHistoryView] = useState<HistoryViewType>('daily');
  const [openingInput, setOpeningInput] = useState<string>('');
  const [quickIncomeInput, setQuickIncomeInput] = useState<string>('');
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('spendwise_transactions');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('spendwise_transactions', JSON.stringify(transactions));
  }, [transactions]);

  const addTransaction = (newTransaction: Transaction) => {
    setTransactions(prev => {
      const existingIndex = prev.findIndex(t => 
        t.date === newTransaction.date && 
        t.category === newTransaction.category
      );

      if (existingIndex !== -1) {
        const updated = [...prev];
        const existing = updated[existingIndex];
        let newNote = existing.note;
        const incomingNote = newTransaction.note.trim();
        const isDefaultNote = incomingNote === newTransaction.category;

        if (!isDefaultNote && incomingNote !== "" && !existing.note.includes(incomingNote)) {
          newNote = existing.note === existing.category 
            ? incomingNote 
            : `${existing.note}, ${incomingNote}`;
        }

        updated[existingIndex] = {
          ...existing,
          amount: existing.amount + newTransaction.amount,
          note: newNote
        };
        return updated;
      }

      return [newTransaction, ...prev];
    });
  };

  const setInitialOpeningBalance = () => {
    const amount = parseFloat(openingInput);
    if (isNaN(amount) || amount < 0) return;
    const newTransaction: Transaction = {
      id: crypto.randomUUID(),
      date: new Date().toISOString().split('T')[0],
      type: TransactionType.INCOME,
      category: Category.OPENING_BALANCE,
      amount: amount,
      note: 'Initial Balance Setup',
    };
    addTransaction(newTransaction);
    setOpeningInput('');
  };

  const addQuickDailyIncome = () => {
    const amount = parseFloat(quickIncomeInput);
    if (isNaN(amount) || amount <= 0) return;
    const newTransaction: Transaction = {
      id: crypto.randomUUID(),
      date: new Date().toISOString().split('T')[0],
      type: TransactionType.INCOME,
      category: Category.DAILY_INCOME,
      amount: amount,
      note: 'Quick Daily Income Entry',
    };
    addTransaction(newTransaction);
    setQuickIncomeInput('');
  };

  const removeTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const clearAll = () => {
    if (window.confirm("Are you sure you want to clear all data? This cannot be undone.")) {
      setTransactions([]);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  const summary = useMemo<DailySummary & { todayExpenses: number, todayIncome: number }>(() => {
    // Initialize with explicit number type
    let opening: number = 0;
    let income: number = 0;
    let expenses: number = 0;
    let savings: number = 0;
    let todayExp: number = 0;
    let todayInc: number = 0;

    transactions.forEach(t => {
      const isToday = t.date === todayStr;
      const amount = Number(t.amount);
      
      if (t.category === Category.OPENING_BALANCE) {
        opening += amount;
      } else if (t.category === Category.SAVINGS) {
        savings += amount;
        expenses += amount;
        if (isToday) todayExp += amount;
      } else if (t.type === TransactionType.INCOME) {
        income += amount;
        if (isToday) todayInc += amount;
      } else {
        expenses += amount;
        if (isToday) todayExp += amount;
      }
    });

    return {
      openingBalance: opening,
      totalIncome: income,
      totalExpenses: expenses,
      netSavings: savings,
      // Fix: Use explicit arithmetic with number types
      currentBalance: (opening + income - expenses) as number,
      todayExpenses: todayExp,
      todayIncome: todayInc
    };
  }, [transactions, todayStr]);

  const groupedTransactions = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    transactions.forEach(t => {
      if (!groups[t.date]) groups[t.date] = [];
      groups[t.date].push(t);
    });
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [transactions]);

  const cumulativeByCategory = useMemo(() => {
    const totals: Record<string, { amount: number, notes: string[] }> = {};
    transactions.forEach(t => {
      if (!totals[t.category]) {
        totals[t.category] = { amount: 0, notes: [] };
      }
      totals[t.category].amount += t.amount;
      if (t.note && !totals[t.category].notes.includes(t.note)) {
        totals[t.category].notes.push(t.note);
      }
    });
    return Object.entries(totals).sort((a, b) => b[1].amount - a[1]);
  }, [transactions]);

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-emerald-600 p-2 rounded-xl shadow-lg shadow-emerald-200">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 leading-tight">SpendWise</h1>
              <p className="text-[10px] text-slate-500 font-medium tracking-widest uppercase">Daily Tracker</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={clearAll} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 hidden md:block">
          <nav className="flex gap-8">
            <button onClick={() => setActiveTab('overview')} className={`py-4 px-1 border-b-2 font-medium text-sm transition-all ${activeTab === 'overview' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500'}`}>
              <div className="flex items-center gap-2"><LayoutDashboard className="w-4 h-4" /> Financial Overview</div>
            </button>
            <button onClick={() => setActiveTab('income')} className={`py-4 px-1 border-b-2 font-medium text-sm transition-all ${activeTab === 'income' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500'}`}>
              <div className="flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Daily Income</div>
            </button>
            <button onClick={() => setActiveTab('manage')} className={`py-4 px-1 border-b-2 font-medium text-sm transition-all ${activeTab === 'manage' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500'}`}>
              <div className="flex items-center gap-2"><PlusCircle className="w-4 h-4" /> Daily Expenses</div>
            </button>
            <button onClick={() => setActiveTab('reports')} className={`py-4 px-1 border-b-2 font-medium text-sm transition-all ${activeTab === 'reports' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500'}`}>
              <div className="flex items-center gap-2"><FileText className="w-4 h-4" /> Reports & Export</div>
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <Stats summary={summary} />

        {activeTab === 'overview' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {summary.openingBalance === 0 ? (
                <div className="bg-blue-600 rounded-2xl p-6 text-white shadow-xl shadow-blue-200 flex flex-col justify-between overflow-hidden relative min-h-[160px]">
                  <div className="absolute -right-4 -bottom-4 opacity-10"><Wallet className="w-32 h-32" /></div>
                  <div className="relative z-10">
                    <h3 className="text-xl font-bold mb-1 flex items-center gap-2"><ArrowRightCircle className="w-5 h-5" /> Initial Balance</h3>
                    <p className="text-blue-100 text-xs mb-4">Set your starting capital to begin tracking.</p>
                  </div>
                  <div className="flex gap-2 relative z-10">
                    <input type="number" placeholder="Amount" value={openingInput} onChange={(e) => setOpeningInput(e.target.value)} className="w-full px-4 py-2 rounded-xl border-0 text-slate-900 focus:ring-2 focus:ring-blue-400 font-bold text-sm" />
                    <button onClick={setInitialOpeningBalance} className="bg-white text-blue-600 px-4 py-2 rounded-xl font-bold hover:bg-blue-50 transition-all text-sm whitespace-nowrap">Save</button>
                  </div>
                </div>
              ) : (
                <div className="bg-white border border-blue-100 rounded-2xl p-6 flex flex-col justify-between shadow-sm min-h-[160px]">
                  <div className="flex items-center justify-between">
                    <div className="bg-blue-100 p-2.5 rounded-xl"><CheckCircle2 className="w-6 h-6 text-blue-600" /></div>
                    <button onClick={() => { const existing = transactions.find(t => t.category === Category.OPENING_BALANCE); if (existing) { setOpeningInput(existing.amount.toString()); removeTransaction(existing.id); } }} className="text-[10px] font-bold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-all border border-blue-100 uppercase">Adjust Balance</button>
                  </div>
                  <div><span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Current Opening Balance</span><p className="text-2xl font-black text-slate-900">Rs {summary.openingBalance.toFixed(2)}</p></div>
                </div>
              )}
              <div className="bg-emerald-600 rounded-2xl p-6 text-white shadow-xl shadow-emerald-200 flex flex-col justify-between overflow-hidden relative min-h-[160px]">
                <div className="absolute -right-4 -bottom-4 opacity-10"><TrendingUp className="w-32 h-32" /></div>
                <div className="relative z-10">
                  <h3 className="text-xl font-bold mb-1 flex items-center gap-2"><Plus className="w-5 h-5" /> Quick Daily Income</h3>
                  <p className="text-emerald-100 text-xs mb-4">Earned something today? Add it here instantly.</p>
                </div>
                <div className="flex gap-2 relative z-10">
                  <input type="number" placeholder="Today's Earning" value={quickIncomeInput} onChange={(e) => setQuickIncomeInput(e.target.value)} className="w-full px-4 py-2 rounded-xl border-0 text-slate-900 focus:ring-2 focus:ring-emerald-400 font-bold text-sm" />
                  <button onClick={addQuickDailyIncome} className="bg-white text-emerald-600 px-4 py-2 rounded-xl font-bold hover:bg-emerald-50 transition-all text-sm whitespace-nowrap">Add Income</button>
                </div>
              </div>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="bg-emerald-600 p-3 rounded-2xl shadow-lg shadow-emerald-200"><Calendar className="w-6 h-6 text-white" /></div>
                <div><h3 className="font-bold text-emerald-900">Today's Cumulative Progress</h3><p className="text-sm text-emerald-700">Totals for {new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' })}</p></div>
              </div>
              <div className="flex gap-8">
                <div className="text-center"><p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Today's Income</p><p className="text-xl font-black text-emerald-900">Rs {summary.todayIncome.toFixed(2)}</p></div>
                <div className="text-center"><p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">Today's Spent</p><p className="text-xl font-black text-rose-700">Rs {summary.todayExpenses.toFixed(2)}</p></div>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-8"><Charts transactions={transactions} /></div>
              <div className="lg:col-span-4"><AIAssistant transactions={transactions} /></div>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Today's Activity Breakdown</h3>
              <div className="space-y-3">
                {transactions.filter(t => t.date === todayStr).map(t => (
                  <div key={t.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className={`${CATEGORY_CONFIG[t.category].color} p-2 rounded-lg text-white scale-75`}>{CATEGORY_CONFIG[t.category].icon}</div>
                      <div><span className="text-sm font-bold text-slate-700 block">{t.category}</span><span className="text-[10px] text-slate-400">{t.note}</span></div>
                    </div>
                    <span className={`text-sm font-black ${t.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-slate-900'}`}>{t.type === TransactionType.INCOME ? '+' : '-'}Rs {t.amount.toFixed(2)}</span>
                  </div>
                ))}
                {transactions.filter(t => t.date === todayStr).length === 0 && <p className="text-sm text-slate-400 italic py-4 text-center">No transactions for today yet.</p>}
              </div>
            </div>
          </div>
        )}

        {(activeTab === 'manage' || activeTab === 'income') && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="lg:col-span-5">
              <TransactionForm onAdd={addTransaction} filterType={activeTab === 'income' ? TransactionType.INCOME : TransactionType.EXPENSE} />
            </div>
            <div className="lg:col-span-7">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <div className="flex items-center gap-2">
                    <History className="w-5 h-5 text-slate-400" />
                    <h3 className="text-lg font-semibold text-slate-800">{activeTab === 'income' ? 'Income History' : 'Expense History'}</h3>
                  </div>
                  {/* History View Toggle */}
                  <div className="flex bg-slate-200 p-1 rounded-lg">
                    <button onClick={() => setHistoryView('daily')} className={`p-1.5 rounded-md transition-all ${historyView === 'daily' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`} title="Daily View"><ListFilter className="w-4 h-4" /></button>
                    <button onClick={() => setHistoryView('cumulative')} className={`p-1.5 rounded-md transition-all ${historyView === 'cumulative' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`} title="Cumulative View"><BarChart3 className="w-4 h-4" /></button>
                  </div>
                </div>

                <div className="max-h-[700px] overflow-y-auto scrollbar-hide">
                  {historyView === 'daily' ? (
                    groupedTransactions.map(([date, items]) => {
                      const filteredItems = items.filter(item => activeTab === 'income' ? item.type === TransactionType.INCOME : item.type === TransactionType.EXPENSE);
                      if (filteredItems.length === 0) return null;
                      const dailySum = filteredItems.reduce((sum, item) => sum + item.amount, 0);
                      return (
                        <div key={date} className="border-b border-slate-100 last:border-0">
                          <div className="bg-slate-50 px-6 py-2 flex justify-between items-center"><span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{date === todayStr ? 'Today' : date}</span><span className={`text-[10px] font-bold ${activeTab === 'income' ? 'text-emerald-600' : 'text-rose-500'}`}>DAILY {activeTab === 'income' ? 'INCOME' : 'TOTAL'}: Rs {dailySum.toFixed(2)}</span></div>
                          <div className="divide-y divide-slate-50">
                            {filteredItems.map((t) => (
                              <div key={t.id} className="p-4 hover:bg-slate-50/10 transition-colors group flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <div className={`${CATEGORY_CONFIG[t.category].color} p-2.5 rounded-xl text-white shadow-sm`}>{CATEGORY_CONFIG[t.category].icon}</div>
                                  <div><p className="font-semibold text-slate-800 leading-tight">{t.category}</p><p className="text-xs text-slate-500 mt-1">{t.note}</p></div>
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className="text-right"><p className={`font-black ${t.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-slate-800'}`}>{t.type === TransactionType.INCOME ? '+' : '-'}Rs {t.amount.toFixed(2)}</p></div>
                                  <button onClick={() => removeTransaction(t.id)} className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-rose-500 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="divide-y divide-slate-50">
                      {cumulativeByCategory.filter(([cat]) => activeTab === 'income' ? CATEGORY_CONFIG[cat as Category].defaultType === TransactionType.INCOME : CATEGORY_CONFIG[cat as Category].defaultType === TransactionType.EXPENSE).map(([cat, data]) => (
                        <div key={cat} className="p-4 hover:bg-slate-50/10 transition-colors flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`${CATEGORY_CONFIG[cat as Category].color} p-2.5 rounded-xl text-white shadow-sm`}>{CATEGORY_CONFIG[cat as Category].icon}</div>
                            <div>
                              <p className="font-semibold text-slate-800 leading-tight">{cat}</p>
                              <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-widest">Cumulative Total</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-lg font-black ${CATEGORY_CONFIG[cat as Category].defaultType === TransactionType.INCOME ? 'text-emerald-600' : 'text-slate-900'}`}>Rs {data.amount.toFixed(2)}</p>
                            <p className="text-[10px] text-slate-400 italic">Across multiple entries</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {transactions.filter(t => activeTab === 'income' ? t.type === TransactionType.INCOME : t.type === TransactionType.EXPENSE).length === 0 && <div className="p-20 text-center text-slate-400 italic">No records found.</div>}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <ReportView transactions={transactions} summary={summary} />
          </div>
        )}
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-slate-200 px-6 py-3 flex items-center justify-around md:hidden z-50">
        <button onClick={() => setActiveTab('overview')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'overview' ? 'text-emerald-600' : 'text-slate-400'}`}><LayoutDashboard className="w-6 h-6" /><span className="text-[10px] font-bold uppercase tracking-widest">Dash</span></button>
        <button onClick={() => setActiveTab('income')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'income' ? 'text-emerald-600' : 'text-slate-400'}`}><TrendingUp className="w-6 h-6" /><span className="text-[10px] font-bold uppercase tracking-widest">Income</span></button>
        <div className="relative -mt-10"><button onClick={() => setActiveTab('manage')} className={`p-4 rounded-2xl shadow-xl shadow-emerald-200 transition-all ${activeTab === 'manage' ? 'bg-emerald-600 text-white scale-110' : 'bg-slate-200 text-slate-500'}`}><PlusCircle className="w-8 h-8" /></button></div>
        <button onClick={() => setActiveTab('reports')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'reports' ? 'text-emerald-600' : 'text-slate-400'}`}><FileText className="w-6 h-6" /><span className="text-[10px] font-bold uppercase tracking-widest">Docs</span></button>
      </div>
    </div>
  );
};

export default App;
