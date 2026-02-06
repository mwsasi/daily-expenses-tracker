
import React, { useState } from 'react';
import { SavingsGoal, Transaction } from '../types';
import { Target, Plus, Trash2, CheckCircle2, MoreHorizontal, X, LayoutDashboard, Calculator, Palette } from 'lucide-react';
import { ICON_MAP, PRESET_COLORS } from '../constants';

interface SavingsGoalsProps {
  goals: SavingsGoal[];
  onAdd: (goal: SavingsGoal) => void;
  onDelete: (id: string) => void;
  transactions: Transaction[];
  accounts: string[];
}

const SavingsGoals: React.FC<SavingsGoalsProps> = ({ goals, onAdd, onDelete, transactions, accounts }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [iconName, setIconName] = useState('Target');
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [linkedAccount, setLinkedAccount] = useState('all');

  const calculateProgress = (goal: SavingsGoal) => {
    const relevantTxs = transactions.filter(t => {
      const isSavings = t.type === 'SAVINGS';
      const matchesAccount = !goal.linkedAccount || goal.linkedAccount === 'all' || t.account === goal.linkedAccount;
      return isSavings && matchesAccount;
    });
    
    const current = relevantTxs.reduce((sum, t) => sum + t.amount, 0);
    const percent = goal.targetAmount > 0 ? (current / goal.targetAmount) * 100 : 0;
    return { current, percent };
  };

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !target) return;

    onAdd({
      id: crypto.randomUUID(),
      name,
      targetAmount: parseFloat(target),
      currentAmount: 0,
      color,
      iconName,
      linkedAccount: linkedAccount === 'all' ? undefined : linkedAccount
    });

    setName('');
    setTarget('');
    setIsAdding(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-100 p-2.5 rounded-2xl text-indigo-600">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-800 capitalize">Financial Ambitions</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Track Your Path To Milestones</p>
          </div>
        </div>
        {!isAdding && (
          <button 
            onClick={() => setIsAdding(true)}
            className="bg-indigo-600 text-white p-2.5 rounded-2xl hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-100"
          >
            <Plus className="w-5 h-5" />
          </button>
        )}
      </div>

      {isAdding && (
        <form onSubmit={handleAddGoal} className="bg-slate-50 p-6 rounded-[2rem] border-2 border-dashed border-indigo-200 space-y-4 animate-in fade-in zoom-in-95 duration-300">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-black text-slate-700 uppercase tracking-tight">Set New Milestone</h4>
            <button type="button" onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input 
              type="text" 
              placeholder="Goal Name (e.g., Vacation)" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-sm"
              required 
            />
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">RS</span>
              <input 
                type="number" 
                placeholder="Target Amount" 
                value={target} 
                onChange={e => setTarget(e.target.value)} 
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-black text-sm"
                required 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select 
              value={linkedAccount} 
              onChange={e => setLinkedAccount(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-sm bg-white"
            >
              <option value="all">Global Savings Balance</option>
              {accounts.map(acc => <option key={acc} value={acc}>{acc} Funds Only</option>)}
            </select>
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1">
              {PRESET_COLORS.slice(0, 10).map(c => (
                <button 
                  key={c} 
                  type="button" 
                  onClick={() => setColor(c)}
                  style={{ backgroundColor: c }}
                  className={`w-8 h-8 rounded-full shrink-0 border-4 ${color === c ? 'border-indigo-200 scale-110 shadow-lg' : 'border-white hover:border-slate-100'}`}
                />
              ))}
            </div>
          </div>

          <button type="submit" className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl active:scale-95">
            Lock Target
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {goals.map(goal => {
          const { current, percent } = calculateProgress(goal);
          const IconComp = ICON_MAP[goal.iconName] || Target;
          const isComplete = percent >= 100;

          return (
            <div key={goal.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6 group hover:shadow-xl hover:border-indigo-100 transition-all relative overflow-hidden">
              {isComplete && (
                <div className="absolute top-0 right-0 p-4 animate-bounce">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 fill-emerald-50" />
                </div>
              )}
              
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div style={{ backgroundColor: goal.color }} className="p-3 rounded-2xl text-white shadow-lg transition-transform group-hover:scale-110">
                    <IconComp className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-slate-800 capitalize leading-tight">{goal.name}</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Target: RS{goal.targetAmount.toLocaleString()}</p>
                  </div>
                </div>
                <button 
                  onClick={() => onDelete(goal.id)}
                  className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <span className="text-xs font-black text-slate-900 block">RS{current.toLocaleString()}</span>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Saved So Far</span>
                  </div>
                  <div className="text-right">
                    <span className={`text-xl font-black tracking-tighter ${isComplete ? 'text-emerald-600' : 'text-slate-900'}`}>{percent.toFixed(0)}%</span>
                  </div>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 ease-out ${isComplete ? 'bg-emerald-500' : ''}`}
                    style={{ width: `${Math.min(percent, 100)}%`, backgroundColor: !isComplete ? goal.color : undefined }}
                  />
                </div>
                {!isComplete && (
                   <p className="text-[9px] font-bold text-slate-400 text-center uppercase tracking-widest">RS{(goal.targetAmount - current).toLocaleString()} To Go</p>
                )}
              </div>
            </div>
          );
        })}

        {goals.length === 0 && !isAdding && (
          <div className="sm:col-span-2 py-16 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-[2.5rem] bg-slate-50/30 group cursor-pointer hover:bg-indigo-50/30 transition-all" onClick={() => setIsAdding(true)}>
            <div className="bg-white p-5 rounded-full shadow-sm border border-slate-100 text-slate-300 group-hover:text-indigo-400 group-hover:scale-110 transition-all">
              <Plus className="w-10 h-10" />
            </div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-6 group-hover:text-indigo-600">Initialize Your First Savings Target</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SavingsGoals;
