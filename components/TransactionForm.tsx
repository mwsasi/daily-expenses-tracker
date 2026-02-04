
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
    
    // Explicitly enforce the type if we are on a specific tab (filterType)
    // This prevents savings from being accidentally saved as expenses if a generic category is used
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
    <form onSubmit={handleSubmit} className={`bg-white p-6 rounded-2xl shadow-sm border ${isEditing ? 'border-emerald-500 ring-4 ring-emerald-50' : 'border-slate-100'} space-y-4 transition-all`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-slate-800">
          {isEditing ? 'Edit Transaction' : (filterType === TransactionType.INCOME ? 'Add New Income' : filterType === TransactionType.SAVINGS ? 'Add New Saving' : 'Add New Expense')}
        </h3>
        {isEditing && (
          <button 
            type="button" 
            onClick={onCancel}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Date</label>
          <input 
            type="date" 
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Amount</label>
          <input 
            ref={amountRef}
            type="number" 
            placeholder="0.00"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-lg"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-600 mb-1">Category</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 h-auto max-h-40 overflow-y-auto scrollbar-hide p-1 border border-slate-100 rounded-xl">
          {categoriesToShow.map((cat) => {
            const IconComp = ICON_MAP[cat.iconName] || MoreHorizontal;
            const isActive = category === cat.name;
            
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategorySelect(cat.name)}
                className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${
                  isActive 
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm' 
                  : 'border-slate-100 bg-white text-slate-500 hover:border-slate-300'
                }`}
              >
                <div className={`${cat.color} p-2 rounded-lg text-white mb-1 shadow-sm`}>
                  <IconComp className="w-4 h-4" />
                </div>
                <span className="text-[10px] text-center font-medium leading-tight">{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-600 mb-1">Note (Optional)</label>
        <input 
          type="text" 
          placeholder="What was this for?"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
        />
      </div>

      <div className="flex gap-3">
        <button 
          type="submit"
          className={`flex-grow ${isEditing ? 'bg-emerald-600 hover:bg-emerald-700' : (filterType === TransactionType.INCOME ? 'bg-emerald-600 hover:bg-emerald-700' : filterType === TransactionType.SAVINGS ? 'bg-teal-600 hover:bg-teal-700' : 'bg-slate-800 hover:bg-slate-900')} text-white font-semibold py-3 rounded-xl shadow-lg transition-all active:scale-[0.98]`}
        >
          {isEditing ? 'Update Transaction' : `Add ${filterType === TransactionType.INCOME ? 'Income' : filterType === TransactionType.SAVINGS ? 'Saving' : 'Expense'}`}
        </button>
        {isEditing && (
          <button 
            type="button"
            onClick={onCancel}
            className="px-6 py-3 bg-slate-100 text-slate-600 font-semibold rounded-xl hover:bg-slate-200 transition-all"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};

export default TransactionForm;
