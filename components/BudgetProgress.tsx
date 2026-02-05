import React from 'react';
import { Category, CategoryConfig } from '../types';
import { getCategoryConfig, ICON_MAP } from '../constants';
import { MoreHorizontal, AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';

interface BudgetProgressProps {
  budgets: Record<string, number>;
  monthlySpending: Record<string, number>;
  customCategories: CategoryConfig[];
}

const BudgetProgress: React.FC<BudgetProgressProps> = ({ budgets, monthlySpending, customCategories }) => {
  const currentMonthName = new Date().toLocaleString('default', { month: 'long' });
  
  const activeBudgets = (Object.entries(budgets) as [string, number][])
    .filter(([_, limit]) => limit > 0)
    .sort((a, b) => {
        const spentA = monthlySpending[a[0]] || 0;
        const spentB = monthlySpending[b[0]] || 0;
        return (spentB / b[1]) - (spentA / a[1]);
    });

  if (activeBudgets.length === 0) return null;

  return (
    <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight capitalize">Active Budget Monitoring</h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1 capitalize">Real-Time Category Surveillance</p>
        </div>
        <div className="bg-slate-50 px-4 py-1.5 rounded-full border border-slate-100">
           <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest capitalize">{currentMonthName} Review</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
        {activeBudgets.map(([catName, limit]) => {
          const spent = monthlySpending[catName] || 0;
          const percent = (spent / limit) * 100;
          const config = getCategoryConfig(catName, customCategories);
          const IconComp = ICON_MAP[config.iconName] || MoreHorizontal;
          const isOverBudget = spent > limit;
          
          let bgColor = config.color;
          let pillBg = 'bg-slate-100';
          let StatusIcon = CheckCircle2;
          let alertText = `You have used ${percent.toFixed(0)}% of your ${catName} budget.`;
          let alertColor = 'text-slate-500';

          if (percent >= 100) {
            bgColor = '#ef4444';
            pillBg = 'bg-rose-100';
            StatusIcon = AlertCircle;
            alertText = `You have exceeded your ${catName} budget for ${currentMonthName} by RS${(spent - limit).toFixed(2)}!`;
            alertColor = 'text-rose-600';
          } else if (percent >= 80) {
            bgColor = '#f59e0b';
            pillBg = 'bg-amber-100';
            StatusIcon = AlertTriangle;
            alertText = `You have spent ${percent.toFixed(0)}% of your ${catName} budget for ${currentMonthName}.`;
            alertColor = 'text-amber-700';
          } else if (percent > 0) {
            alertColor = 'text-emerald-700';
          }

          return (
            <div 
              key={catName} 
              className={`p-6 rounded-[2rem] border-2 transition-all duration-300 space-y-5 ${
                isOverBudget 
                  ? 'border-rose-500 bg-rose-50/20 shadow-lg shadow-rose-100' 
                  : 'border-slate-50 hover:border-slate-200 bg-white'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div style={{ backgroundColor: config.color }} className="p-2.5 rounded-xl text-white shadow-md">
                    <IconComp className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-sm font-black text-slate-800 block leading-tight capitalize">{catName}</span>
                    <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1">Limit: RS{limit}</span>
                  </div>
                </div>
                <div className="text-right space-y-1.5">
                  <div className={`${pillBg} px-3 py-1 rounded-full inline-block border border-black/5`}>
                    <span className="text-xs font-black tracking-tight block text-slate-900">RS{spent.toFixed(2)}</span>
                  </div>
                  <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">{percent.toFixed(0)}% Consumed</div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-50">
                  <div 
                    className="h-full rounded-full transition-all duration-1000 ease-out shadow-sm" 
                    style={{ width: `${Math.min(percent, 100)}%`, backgroundColor: bgColor }}
                  />
                </div>
                
                <div className={`flex items-start gap-2 px-1 py-1`}>
                  <StatusIcon className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${alertColor}`} />
                  <p className={`text-[10px] font-black leading-relaxed ${alertColor}`}>
                    {alertText}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BudgetProgress;