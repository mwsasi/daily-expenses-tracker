
import React, { useState, useRef, useEffect } from 'react';
import { TransactionType, Category, Transaction, CategoryConfig } from '../types';
import { DEFAULT_CATEGORIES, ICON_MAP } from '../constants';
import { MoreHorizontal, X, Plus, Building2, Landmark, CreditCard, Wallet, Coins, Globe, PiggyBank, Calendar, Loader2, CheckCircle2, Check } from 'lucide-react';

interface TransactionFormProps {
  onAdd: (transaction: Transaction) => void;
  onCancel?: () => void;
  editingTransaction?: Transaction | null;
  filterType?: TransactionType;
  customCategories: CategoryConfig[];
  preselectedCategory?: string | null;
  accounts: string[];
  onAddAccount: (name: string) => void;
}

const BANK_ICONS = [Building2, Landmark, CreditCard, Coins, Globe, Wallet, PiggyBank];

const TransactionForm: React.FC<TransactionFormProps> = ({ 
  onAdd, 
  onCancel, 
  editingTransaction, 
  filterType, 
  customCategories,
  preselectedCategory,
  accounts,
  onAddAccount
}) => {
  const allCategories = [...DEFAULT_CATEGORIES, ...customCategories];
  
  const toTitleCase = (str: string) => str.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  const getDefaultCategory = (type?: TransactionType) => {
    if (type === TransactionType.INCOME) return 'Daily Income';
    if (type === TransactionType.SAVINGS) return 'Savings';
    return 'Food'; 
  };

  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<Category>(getDefaultCategory(filterType));
  const [note, setNote] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [account, setAccount] = useState<string>(accounts[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // New state for inline account adding
  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');
  
  const amountRef = useRef<HTMLInputElement>(null);
  const newAccountRef = useRef<HTMLInputElement>(null);

  const getAccountIcon = (name: string, index: number) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('amana')) return Landmark;
    if (lowerName.includes('commercial')) return Building2;
    if (lowerName.includes('card')) return CreditCard;
    if (lowerName.includes('cash') || lowerName.includes('wallet')) return Wallet;
    if (lowerName.includes('invest')) return Coins;
    return BANK_ICONS[index % BANK_ICONS.length];
  };

  useEffect(() => {
    if (editingTransaction) {
      setAmount(editingTransaction.amount.toString());
      setCategory(editingTransaction.category);
      setNote(editingTransaction.note === editingTransaction.category ? '' : editingTransaction.note);
      setDate(editingTransaction.date);
      if (editingTransaction.account) setAccount(editingTransaction.account);
    } else if (preselectedCategory) {
      setCategory(preselectedCategory);
      setAmount('');
      setTimeout(() => amountRef.current?.focus(), 100);
    } else {
      setAmount('');
      setNote('');
      setCategory(getDefaultCategory(filterType));
      setDate(new Date().toISOString().split('T')[0]);
      setAccount(accounts[0]);
    }
  }, [editingTransaction, filterType, preselectedCategory, accounts]);

  // Autofocus new account input when opened
  useEffect(() => {
    if (isAddingAccount) {
      newAccountRef.current?.focus();
    }
  }, [isAddingAccount]);

  const setQuickDate = (daysAgo: number) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    setDate(d.toISOString().split('T')[0]);
  };

  const handleCategorySelect = (selectedCat: Category) => {
    setCategory(selectedCat);
    amountRef.current?.focus();
  };

  const handleConfirmAddAccount = () => {
    if (newAccountName.trim()) {
      const titleCased = toTitleCase(newAccountName.trim());
      onAddAccount(titleCased);
      setAccount(titleCased);
      setNewAccountName('');
      setIsAddingAccount(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0 || isSubmitting) return;

    setIsSubmitting(true);
    // Visual feedback delay
    await new Promise(r => setTimeout(r, 600));

    const config = allCategories.find(c => c.name === category) || allCategories[allCategories.length - 1];
    const enforcedType = filterType || config.type;

    const transactionData: Transaction = {
      id: editingTransaction ? editingTransaction.id : crypto.randomUUID(),
      date,
      type: enforcedType,
      category,
      amount: parseFloat(amount),
      note: toTitleCase(note || category),
      account: enforcedType === TransactionType.SAVINGS ? account : undefined
    };

    onAdd(transactionData);
    
    setIsSubmitting(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);

    setAmount('');
    setNote('');
    if (!editingTransaction) {
      amountRef.current?.focus();
    }
  };

  const categoriesToShow = allCategories.filter(cat => {
    const typeToMatch = editingTransaction ? editingTransaction.type : filterType;
    if (!typeToMatch) return true;
    return cat.type === typeToMatch;
  });

  const isEditing = !!editingTransaction;
  const showAccountSelector = (filterType === TransactionType.SAVINGS) || (editingTransaction?.type === TransactionType.SAVINGS);

  return (
    <form id="transaction-form" onSubmit={handleSubmit} className={`bg-white p-5 md:p-8 rounded-2xl md:rounded-[2.5rem] shadow-sm border ${isEditing ? 'border-emerald-500 ring-4 ring-emerald-50' : 'border-slate-100'} space-y-6 transition-all relative overflow-hidden`}>
      {showSuccess && (
        <div className="absolute inset-0 bg-emerald-600/95 backdrop-blur-sm z-[110] flex flex-col items-center justify-center text-white animate-in fade-in duration-300">
           <CheckCircle2 className="w-16 h-16 mb-4 animate-in zoom-in duration-500" />
           <p className="font-black text-xl uppercase tracking-widest">Entry Verified</p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-black text-slate-800 capitalize">
          {isEditing ? 'Edit Financial Entry' : (filterType === TransactionType.INCOME ? 'Record New Income' : filterType === TransactionType.SAVINGS ? 'Wealth Contribution' : 'Log New Expense')}
        </h3>
        {isEditing && (
          <button type="button" onClick={onCancel} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors active:scale-90">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest capitalize">Value Date</label>
          <div className="flex flex-wrap gap-2 mb-2">
            <button 
              type="button" 
              onClick={() => setQuickDate(0)} 
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${date === new Date().toISOString().split('T')[0] ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
            >
              Today
            </button>
            <button 
              type="button" 
              onClick={() => setQuickDate(1)} 
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${date === new Date(Date.now() - 86400000).toISOString().split('T')[0] ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
            >
              Yesterday
            </button>
          </div>
          <div className="relative">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-black text-sm bg-slate-50/30 text-slate-900" />
          </div>
        </div>
        
        <div className="space-y-2">
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest capitalize">Transaction Value</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400">RS</span>
            <input 
              ref={amountRef} 
              type="number" 
              placeholder="0.00" 
              inputMode="decimal" 
              value={amount} 
              onChange={(e) => setAmount(e.target.value)} 
              className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-black text-xl md:text-2xl bg-slate-50/30 tracking-tight tabular-nums text-slate-900" 
              required 
            />
          </div>
        </div>
      </div>

      {showAccountSelector && (
        <div className="space-y-3 animate-in fade-in slide-in-from-top-1">
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest capitalize">Settlement Account</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {accounts.map((acc, idx) => {
              const isActive = account === acc;
              const IconComp = getAccountIcon(acc, idx);
              return (
                <button
                  key={acc}
                  type="button"
                  onClick={() => setAccount(acc)}
                  className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all active:scale-95 ${isActive ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white border-slate-100 text-slate-600 hover:border-slate-300'}`}
                >
                  <IconComp className="w-4 h-4 shrink-0" />
                  <span className="text-[10px] font-black truncate capitalize">{acc}</span>
                </button>
              );
            })}
            
            {isAddingAccount ? (
              <div className="col-span-2 sm:col-span-2 flex items-center gap-2 animate-in slide-in-from-top-1 duration-200">
                <div className="relative flex-1">
                  <input
                    ref={newAccountRef}
                    type="text"
                    value={newAccountName}
                    onChange={(e) => setNewAccountName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { e.preventDefault(); handleConfirmAddAccount(); }
                      if (e.key === 'Escape') { setIsAddingAccount(false); setNewAccountName(''); }
                    }}
                    placeholder="Bank Name..."
                    className="w-full pl-3 pr-20 py-3 rounded-xl border-2 border-emerald-500/30 focus:border-emerald-500 focus:outline-none bg-white text-[10px] font-black uppercase tracking-tight"
                  />
                  <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button 
                      type="button"
                      onClick={handleConfirmAddAccount}
                      className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 active:scale-90 transition-all shadow-sm"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                    <button 
                      type="button"
                      onClick={() => { setIsAddingAccount(false); setNewAccountName(''); }}
                      className="p-1.5 bg-slate-100 text-slate-400 rounded-lg hover:bg-slate-200 active:scale-90 transition-all"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button 
                type="button" 
                onClick={() => setIsAddingAccount(true)}
                className="flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-emerald-500 hover:text-emerald-600 transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span className="text-[10px] font-black capitalize">New Account</span>
              </button>
            )}
          </div>
        </div>
      )}

      {!filterType && !isEditing && (
        <div className="space-y-2">
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest capitalize">Select Classification</label>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-48 overflow-y-auto scrollbar-hide p-1 border border-slate-100 rounded-2xl">
            {categoriesToShow.map((cat) => {
              const IconComp = ICON_MAP[cat.iconName] || MoreHorizontal;
              const isActive = category === cat.name;
              return (
                <button key={cat.id} type="button" onClick={() => handleCategorySelect(cat.name)} className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all active:scale-95 ${isActive ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm' : 'border-slate-50 bg-white text-slate-400 hover:border-slate-200'}`}>
                  <div style={{ backgroundColor: cat.color }} className="p-2 rounded-lg text-white mb-1.5 shadow-md"><IconComp className="w-4 h-4" /></div>
                  <span className="text-[9px] text-center font-black capitalize leading-tight">{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest capitalize">Memorandum / Details</label>
        <input type="text" placeholder="Reference note..." value={note} onChange={(e) => setNote(e.target.value)} className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-bold text-sm bg-slate-50/30 capitalize text-slate-900" />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-3">
        <button 
          type="submit" 
          disabled={isSubmitting}
          className={`flex-grow h-16 ${isEditing ? 'bg-emerald-600' : (filterType === TransactionType.INCOME ? 'bg-emerald-600' : filterType === TransactionType.SAVINGS ? 'bg-indigo-600' : 'bg-slate-900')} text-white font-black rounded-2xl shadow-xl transition-all active:scale-[0.98] capitalize text-base tracking-wide flex items-center justify-center disabled:opacity-50`}
        >
          {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin mr-2" /> : null}
          {isSubmitting ? 'Verifying...' : (isEditing ? 'Update Financial Record' : `Process ${filterType === TransactionType.INCOME ? 'Income' : filterType === TransactionType.SAVINGS ? 'Contribution' : 'Expenditure'}`)}
        </button>
        {isEditing && (
          <button type="button" onClick={onCancel} className="px-8 h-16 bg-slate-100 text-slate-500 font-black rounded-2xl hover:bg-slate-200 transition-all active:scale-95 capitalize text-base">Discard</button>
        )}
      </div>
    </form>
  );
};

export default TransactionForm;
