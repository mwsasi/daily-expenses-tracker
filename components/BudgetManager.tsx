import React from 'react';
import { Category, TransactionType, CategoryConfig } from '../types';
import { DEFAULT_CATEGORIES, ICON_MAP } from '../constants';
import { Target, Save, MoreHorizontal, LayoutDashboard, Calculator } from 'lucide-react';

interface BudgetManagerProps {
  budgets: Record<string, number>;
  onUpdate: (category: Category, amount: number) => void;
  customCategories: CategoryConfig[];
}

const BudgetManager: React.FC<BudgetManagerProps> = ({ budgets, onUpdate, customCategories }) => {
  const allCategories = [...DEFAULT_CATEGORIES, ...customCategories];
  const expenseCategories = allCategories.filter(c => c.type === TransactionType.EXPENSE);

  const totalBudget = expenseCategories.reduce((sum, cat) => sum + (budgets[cat.name] || 0), 0);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat(undefined, { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    }).format(val);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group border border-white/5">
        <div className="absolute -top-12 -right-12 p-12 opacity-[0.03] group-hover:scale-110 transition-transform duration-[2s]">
          <Target className="w-64 h-64" />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-500/10 p-2.5 rounded-2xl border border-emerald-500/20">
                <LayoutDashboard className="w-5 h-5 text-emerald-400" />
              </div>
              <h2 className="text-xs font-black text-emerald-400 uppercase tracking-[0.4em] capitalize">Monthly Strategy</h2>
            </div>
            <p className="text-3xl font-black tracking-tight capitalize">Aggregate Budget Control</p>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-[2rem] min-w-[240px]">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest capitalize">Total Budget Limit</span>
              <Calculator className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <p className="text-3xl font-black text-white tracking-tighter">RS{formatCurrency(totalBudget)}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-emerald-100 p-3 rounded-2xl text-emerald-600">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 capitalize">Category Limits</h2>
            <p className="text-sm text-slate-500 font-bold capitalize">Set Monthly Spending Caps For Your Operational Expenses.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
          {expenseCategories.map(cat => {
            const IconComp = ICON_MAP[cat.iconName] || MoreHorizontal;
            return (
              <div key={cat.id} className="flex items-center justify-between p-4 rounded-2xl border border-slate-50 hover:border-slate-200 transition-all group bg-white hover:shadow-md hover:shadow-slate-100/50">
                <div className="flex items-center gap-3">
                  <div 
                    style={{ backgroundColor: cat.color }} 
                    className="p-2.5 rounded-xl text-white shadow-sm transition-transform group-hover:scale-110"
                  >
                    <IconComp className="w-4 h-4" />
                  </div>
                  <span className="font-black text-slate-700 text-sm capitalize">{cat.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-300 text-[9px] font-black tracking-widest">RS</span>
                  <input 
                    type="number" 
                    placeholder="0.00"
                    inputMode="decimal"
                    value={budgets[cat.name] || ''}
                    onChange={(e) => onUpdate(cat.name, parseFloat(e.target.value) || 0)}
                    className="w-24 px-3 py-2 bg-slate-50 border-0 focus:ring-4 focus:ring-emerald-500/10 rounded-xl text-right font-black text-slate-800 text-sm transition-all tracking-tight"
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-10 p-6 bg-emerald-50/50 rounded-3xl border border-emerald-100">
          <div className="flex gap-4">
            <div className="bg-emerald-100 p-2 rounded-xl h-fit text-emerald-600 shadow-sm"><Save className="w-4 h-4" /></div>
            <p className="text-[10px] text-emerald-800 font-bold leading-relaxed capitalize">
              <strong>Intelligent Enforcement:</strong> Your Budgets Are Automatically Persisted And Reset On The First Of Every Month. The Dashboard Will Visualize Your Consumption Real-Time.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetManager;