
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
  const currentMonthName = new Date().toLocaleString('default', { month: 'long' }).toLowerCase();
  
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
          <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight lowercase">active budget monitoring</h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1 lowercase">real-time category surveillance</p>
        </div>
        <div className="bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
           <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest lowercase">{currentMonthName} review</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
        {activeBudgets.map(([catName, limit]) => {
          const spent = monthlySpending[catName] || 0;
          const percent = (spent / limit) * 100;
          const config = getCategoryConfig(catName, customCategories);
          const IconComp = ICON_MAP[config.iconName] || MoreHorizontal;
          const isOverBudget = spent > limit;
          
          let statusColor = 'text-emerald-500';
          let bgColor = config.color;
          let StatusIcon = CheckCircle2;
          // Specific detailed message
          let message = `you have spent ${percent.toFixed(0)}% of your ${catName} budget for ${currentMonthName}.`;

          if (percent >= 100) {
            statusColor = 'text-rose-500';
            bgColor = '#ef4444'; // Force red on over-budget
            StatusIcon = AlertCircle;
            message = `critical: you have exceeded your ${catName} budget for ${currentMonthName} by RS ${(spent - limit).toFixed(2)}.`;
          } else if (percent >= 80) {
            statusColor = 'text-amber-500';
            bgColor = '#f59e0b'; // Force amber on warning
            StatusIcon = AlertTriangle;
            message = `caution: you have spent ${percent.toFixed(0)}% of your ${catName} budget for ${currentMonthName}.`;
          }

          return (
            <div 
              key={catName} 
              className={`p-6 rounded-[2rem] border-2 transition-all duration-300 space-y-4 ${
                isOverBudget 
                  ? 'border-rose-500 bg-rose-50/20 shadow-lg shadow-rose-100' 
                  : 'border-slate-50 hover:border-slate-200 bg-white'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div 
                    style={{ backgroundColor: config.color }} 
                    className="p-2.5 rounded-xl text-white shadow-md"
                  >
                    <IconComp className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-sm font-black text-slate-800 block leading-tight lowercase">{catName}</span>
                    <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-0.5">limit: RS {limit}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-sm font-black ${statusColor} block`}>RS {spent.toFixed(2)}</span>
                  <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{percent.toFixed(0)}% consumed</div>
                </div>
              </div>
              
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden p-0.5">
                <div 
                  className="h-full rounded-full transition-all duration-1000 ease-out" 
                  style={{ width: `${Math.min(percent, 100)}%`, backgroundColor: bgColor }}
                />
              </div>
              
              <div className={`flex items-start gap-2 p-3 rounded-xl border lowercase ${
                isOverBudget 
                  ? 'bg-rose-50 border-rose-100 text-rose-700' 
                  : percent >= 80 
                    ? 'bg-amber-50 border-amber-100 text-amber-700' 
                    : 'bg-emerald-50 border-emerald-100 text-emerald-700'
              }`}>
                <StatusIcon className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <p className="text-[10px] font-black leading-tight tracking-tight">
                  {message}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BudgetProgress;
