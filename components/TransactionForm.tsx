
import React, { useState, useRef, useEffect } from 'react';
import { TransactionType, Category, Transaction, CategoryConfig } from '../types';
import { DEFAULT_CATEGORIES, ICON_MAP } from '../constants';
import { MoreHorizontal, X } from 'lucide-react';

interface TransactionFormProps {
  onAdd: (transaction: Transaction) => void;
  onCancel?: () => void;
  editingTransaction?: Transaction | null;
  filterType?: TransactionType;
  customCategories: CategoryConfig[];
}

const TransactionForm: React.FC<TransactionFormProps> = ({ 
  onAdd, 
  onCancel, 
  editingTransaction, 
  filterType, 
  customCategories 
}) => {
  const allCategories = [...DEFAULT_CATEGORIES, ...customCategories];
  
  const getDefaultCategory = (type?: TransactionType) => {
    if (type === TransactionType.INCOME) return 'Daily Income';
    if (type === TransactionType.SAVINGS) return 'Savings';
    return 'Food'; 
  };

  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<Category>(getDefaultCategory(filterType));
  const [note, setNote] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  const amountRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingTransaction) {
      setAmount(editingTransaction.amount.toString());
      setCategory(editingTransaction.category);
      setNote(editingTransaction.note === editingTransaction.category ? '' : editingTransaction.note);
      setDate(editingTransaction.date);
    } else {
      setAmount('');
      setNote('');
      setCategory(getDefaultCategory(filterType));
      setDate(new Date().toISOString().split('T')[0]);
    }
  }, [editingTransaction, filterType]);

  const handleCategorySelect = (selectedCat: Category) => {
    setCategory(selectedCat);
    amountRef.current?.focus();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;

    const config = allCategories.find(c => c.name === category) || allCategories[allCategories.length - 1];
    const enforcedType = filterType || config.type;

    const transactionData: Transaction = {
      id: editingTransaction ? editingTransaction.id : crypto.randomUUID(),
      date,
      type: enforcedType,
      category,
      amount: parseFloat(amount),
      note: note || category,
    };

    onAdd(transactionData);
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

  return (
    <form onSubmit={handleSubmit} className={`bg-white p-5 md:p-6 rounded-2xl shadow-sm border ${isEditing ? 'border-emerald-500 ring-4 ring-emerald-50' : 'border-slate-100'} space-y-4 transition-all`}>
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-base md:text-lg font-black text-slate-800 lowercase">
          {isEditing ? 'edit transaction' : (filterType === TransactionType.INCOME ? 'add income' : filterType === TransactionType.SAVINGS ? 'add saving' : 'add expense')}
        </h3>
        {isEditing && (
          <button 
            type="button" 
            onClick={onCancel}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors active:scale-90"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] md:text-xs font-black text-slate-500 mb-1 lowercase tracking-wide">date</label>
          <input 
            type="date" 
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-bold text-sm"
          />
        </div>
        <div>
          <label className="block text-[10px] md:text-xs font-black text-slate-500 mb-1 lowercase tracking-wide">amount</label>
          <input 
            ref={amountRef}
            type="number" 
            placeholder="0.00"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-black text-base"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-[10px] md:text-xs font-black text-slate-500 mb-1 lowercase tracking-wide">category</label>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 h-auto max-h-40 overflow-y-auto scrollbar-hide p-1 border border-slate-100 rounded-xl">
          {categoriesToShow.map((cat) => {
            const IconComp = ICON_MAP[cat.iconName] || MoreHorizontal;
            const isActive = category === cat.name;
            
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategorySelect(cat.name)}
                className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all active:scale-95 ${
                  isActive 
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm' 
                  : 'border-slate-50 bg-white text-slate-400 hover:border-slate-200'
                }`}
              >
                <div 
                  style={{ backgroundColor: cat.color }} 
                  className="p-1.5 md:p-2 rounded-lg text-white mb-1 shadow-sm"
                >
                  <IconComp className="w-3.5 h-3.5 md:w-4 md:h-4" />
                </div>
                <span className="text-[9px] text-center font-bold lowercase leading-tight">{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="block text-[10px] md:text-xs font-black text-slate-500 mb-1 lowercase tracking-wide">note (optional)</label>
        <input 
          type="text" 
          placeholder="what was this for?"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-bold text-sm"
        />
      </div>

      <div className="flex gap-2">
        <button 
          type="submit"
          className={`flex-grow ${isEditing ? 'bg-emerald-600' : (filterType === TransactionType.INCOME ? 'bg-emerald-600' : filterType === TransactionType.SAVINGS ? 'bg-teal-600' : 'bg-slate-900')} text-white font-black py-3 rounded-xl shadow-lg transition-all active:scale-95 lowercase text-sm`}
        >
          {isEditing ? 'update entry' : `add ${filterType === TransactionType.INCOME ? 'income' : filterType === TransactionType.SAVINGS ? 'saving' : 'expense'}`}
        </button>
        {isEditing && (
          <button 
            type="button"
            onClick={onCancel}
            className="px-6 py-3 bg-slate-100 text-slate-500 font-black rounded-xl hover:bg-slate-200 transition-all active:scale-95 lowercase text-sm"
          >
            cancel
          </button>
        )}
      </div>
    </form>
  );
};

export default TransactionForm;
