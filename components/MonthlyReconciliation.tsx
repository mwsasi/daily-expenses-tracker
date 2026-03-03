import React, { useState, useEffect } from 'react';
import { Wallet, Edit3, Trash2, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { Transaction, TransactionType } from '../types';

interface MonthlyReconciliationProps {
  transactions: Transaction[];
  onUpdate: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
  onAdd: (transaction: Transaction) => void;
  currentBalance: number;
}

const MonthlyReconciliation: React.FC<MonthlyReconciliationProps> = ({ 
  transactions, 
  onUpdate, 
  onDelete, 
  onAdd,
  currentBalance 
}) => {
  const [show, setShow] = useState(false);
  const [openingBalanceTx, setOpeningBalanceTx] = useState<Transaction | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editAmount, setEditAmount] = useState('');

  const now = new Date();
  const todayStr = now.toLocaleDateString('en-CA');
  const currentMonthStr = todayStr.substring(0, 7);
  const firstOfCurrentMonth = currentMonthStr + "-01";
  
  // Show reconciliation if we are in the first 7 days of the month
  const dayOfMonth = now.getDate();
  const isStartOfMonth = dayOfMonth <= 7;

  useEffect(() => {
    const tx = transactions.find(t => t.category === 'Opening Balance' && t.date === firstOfCurrentMonth);
    setOpeningBalanceTx(tx || null);
    
    if (isStartOfMonth) {
      setShow(true);
    } else {
      setShow(false);
    }
  }, [transactions, firstOfCurrentMonth, isStartOfMonth]);

  if (!show) return null;

  const handleConfirm = () => {
    if (openingBalanceTx) {
      // Already exists, just hide the prompt for now (or mark as verified if we had a field for it)
      setShow(false);
    } else {
      // Create new opening balance
      const newTx: Transaction = {
        id: crypto.randomUUID(),
        date: firstOfCurrentMonth,
        type: TransactionType.INCOME,
        category: 'Opening Balance',
        amount: currentBalance,
        note: `Opening Balance for ${now.toLocaleString('default', { month: 'long' })}`
      };
      onAdd(newTx);
      setShow(false);
    }
  };

  const handleEdit = () => {
    if (openingBalanceTx) {
      setEditAmount(openingBalanceTx.amount.toString());
    } else {
      setEditAmount(currentBalance.toString());
    }
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    const amount = parseFloat(editAmount);
    if (isNaN(amount)) return;

    if (openingBalanceTx) {
      onUpdate({ ...openingBalanceTx, amount });
    } else {
      const newTx: Transaction = {
        id: crypto.randomUUID(),
        date: firstOfCurrentMonth,
        type: TransactionType.INCOME,
        category: 'Opening Balance',
        amount,
        note: `Opening Balance for ${now.toLocaleString('default', { month: 'long' })} (Manual)`
      };
      onAdd(newTx);
    }
    setIsEditing(false);
    setShow(false);
  };

  const handleDelete = () => {
    if (openingBalanceTx) {
      if (window.confirm("Delete this month's Opening Balance?")) {
        onDelete(openingBalanceTx.id);
        setShow(false);
      }
    } else {
      setShow(false); // Just dismiss if it doesn't exist
    }
  };

  return (
    <div className="bg-white rounded-[2rem] p-6 shadow-xl border-2 border-emerald-100 animate-in slide-in-from-top-4 duration-500 mb-8 overflow-hidden relative">
      <div className="absolute top-0 right-0 p-8 opacity-5">
        <Wallet className="w-24 h-24 text-emerald-600" />
      </div>

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-emerald-600 p-2 rounded-xl shadow-lg shadow-emerald-100">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">Monthly Cash Reconciliation</h3>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Verify your starting position for {now.toLocaleString('default', { month: 'long' })}</p>
          </div>
        </div>

        {isEditing ? (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Adjust Opening Balance (RS)</label>
              <input 
                type="number" 
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-emerald-100 focus:border-emerald-500 focus:outline-none font-black text-xl tabular-nums"
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <button 
                onClick={handleSaveEdit}
                className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-black text-sm shadow-lg shadow-emerald-100 active:scale-95 transition-all"
              >
                Save Changes
              </button>
              <button 
                onClick={() => setIsEditing(false)}
                className="px-6 bg-slate-100 text-slate-500 py-3 rounded-xl font-black text-sm active:scale-95 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="bg-slate-50 rounded-2xl p-5 mb-6 border border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Calculated Cash in Hand</p>
                  <p className="text-3xl font-black text-slate-900 tracking-tighter">
                    RS {openingBalanceTx ? openingBalanceTx.amount.toFixed(2) : currentBalance.toFixed(2)}
                  </p>
                </div>
                {openingBalanceTx ? (
                  <div className="bg-emerald-100 text-emerald-600 p-2 rounded-full">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                ) : (
                  <div className="bg-amber-100 text-amber-600 p-2 rounded-full animate-pulse">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {!openingBalanceTx ? (
                <button 
                  onClick={handleConfirm}
                  className="flex-1 min-w-[140px] bg-emerald-600 text-white px-6 py-4 rounded-2xl font-black text-sm shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  Confirm Balance
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button 
                  onClick={() => setShow(false)}
                  className="flex-1 min-w-[140px] bg-slate-900 text-white px-6 py-4 rounded-2xl font-black text-sm shadow-lg transition-all active:scale-95"
                >
                  Looks Good
                </button>
              )}
              
              <button 
                onClick={handleEdit}
                className="bg-white border-2 border-slate-100 text-slate-600 px-6 py-4 rounded-2xl font-black text-sm hover:border-emerald-200 hover:text-emerald-600 transition-all active:scale-95 flex items-center gap-2"
              >
                <Edit3 className="w-4 h-4" />
                Edit
              </button>

              {openingBalanceTx && (
                <button 
                  onClick={handleDelete}
                  className="bg-white border-2 border-slate-100 text-rose-500 px-6 py-4 rounded-2xl font-black text-sm hover:border-rose-100 hover:bg-rose-50 transition-all active:scale-95 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MonthlyReconciliation;
