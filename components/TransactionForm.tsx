
import React, { useState, useRef, useEffect } from 'react';
import { TransactionType, Category, Transaction } from '../types';
import { CATEGORY_CONFIG } from '../constants';

interface TransactionFormProps {
  onAdd: (transaction: Transaction) => void;
  filterType?: TransactionType;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ onAdd, filterType }) => {
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<Category>(
    filterType === TransactionType.INCOME ? Category.DAILY_INCOME : Category.FOOD
  );
  const [note, setNote] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  const amountRef = useRef<HTMLInputElement>(null);

  // Auto-focus amount input when the component mounts
  useEffect(() => {
    amountRef.current?.focus();
  }, []);

  const handleCategorySelect = (selectedCat: Category) => {
    setCategory(selectedCat);
    amountRef.current?.focus();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;

    const config = CATEGORY_CONFIG[category];
    
    const newTransaction: Transaction = {
      id: crypto.randomUUID(),
      date,
      type: config.defaultType,
      category,
      amount: parseFloat(amount),
      note: note || category,
    };

    onAdd(newTransaction);
    setAmount('');
    setNote('');
    amountRef.current?.focus();
  };

  const categoriesToShow = (Object.keys(Category) as Array<keyof typeof Category>).filter(key => {
    const catValue = Category[key];
    if (!filterType) return true;
    return CATEGORY_CONFIG[catValue].defaultType === filterType;
  });

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
      <h3 className="text-lg font-semibold text-slate-800 mb-2">
        {filterType === TransactionType.INCOME ? 'Add New Income' : 'Add New Expense'}
      </h3>
      
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
          {categoriesToShow.map((catKey) => {
            const catValue = Category[catKey];
            const config = CATEGORY_CONFIG[catValue];
            const isActive = category === catValue;
            
            return (
              <button
                key={catValue}
                type="button"
                onClick={() => handleCategorySelect(catValue)}
                className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${
                  isActive 
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm' 
                  : 'border-slate-100 bg-white text-slate-500 hover:border-slate-300'
                }`}
              >
                <div className={`${config.color} p-2 rounded-lg text-white mb-1 shadow-sm`}>
                  {config.icon}
                </div>
                <span className="text-[10px] text-center font-medium leading-tight">{catValue}</span>
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

      <button 
        type="submit"
        className={`w-full ${filterType === TransactionType.INCOME ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-800 hover:bg-slate-900'} text-white font-semibold py-3 rounded-xl shadow-lg transition-all active:scale-[0.98]`}
      >
        Add {filterType === TransactionType.INCOME ? 'Income' : 'Expense'}
      </button>
    </form>
  );
};

export default TransactionForm;
