
import React from 'react';
import { Category, TransactionType, CategoryConfig } from '../types';
import { DEFAULT_CATEGORIES, ICON_MAP } from '../constants';
import { Target, Save, MoreHorizontal } from 'lucide-react';

interface BudgetManagerProps {
  budgets: Record<string, number>;
  onUpdate: (category: Category, amount: number) => void;
  customCategories: CategoryConfig[];
}

const BudgetManager: React.FC<BudgetManagerProps> = ({ budgets, onUpdate, customCategories }) => {
  const allCategories = [...DEFAULT_CATEGORIES, ...customCategories];
  const expenseCategories = allCategories.filter(c => c.type === TransactionType.EXPENSE);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-emerald-100 p-3 rounded-2xl text-emerald-600">
          <Target className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Monthly Budget Settings</h2>
          <p className="text-sm text-slate-500">Set monthly limits to keep your expenses in check.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
        {expenseCategories.map(cat => {
          const IconComp = ICON_MAP[cat.iconName] || MoreHorizontal;
          return (
            <div key={cat.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-50 hover:border-slate-200 transition-all group">
              <div className="flex items-center gap-3">
                <div className={`${cat.color} p-2 rounded-lg text-white shadow-sm`}>
                  <IconComp className="w-5 h-5" />
                </div>
                <span className="font-semibold text-slate-700">{cat.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-sm font-medium">Rs</span>
                <input 
                  type="number" 
                  placeholder="0.00"
                  value={budgets[cat.name] || ''}
                  onChange={(e) => onUpdate(cat.name, parseFloat(e.target.value) || 0)}
                  className="w-24 px-3 py-1.5 bg-slate-50 border-0 focus:ring-2 focus:ring-emerald-500 rounded-lg text-right font-bold text-slate-800"
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-10 p-6 bg-emerald-50 rounded-2xl border border-emerald-100">
        <div className="flex gap-4">
          <div className="text-emerald-600"><Save className="w-5 h-5" /></div>
          <p className="text-xs text-emerald-800 leading-relaxed">
            <strong>Tip:</strong> Your budgets are automatically saved and will refresh every month based on your transaction dates. We'll notify you on the dashboard when you reach 80% and 100% of these limits.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BudgetManager;
