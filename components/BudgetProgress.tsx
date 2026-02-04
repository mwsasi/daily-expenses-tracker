
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
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Active Budget Alerts</h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Real-time category monitoring</p>
        </div>
        <div className="bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
           <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{currentMonthName} Review</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
        {activeBudgets.map(([catName, limit]) => {
          const spent = monthlySpending[catName] || 0;
          const percent = Math.min((spent / limit) * 100, 100);
          const config = getCategoryConfig(catName, customCategories);
          const IconComp = ICON_MAP[config.iconName] || MoreHorizontal;
          
          let statusColor = 'text-emerald-500';
          let bgColor = 'bg-emerald-500';
          let StatusIcon = CheckCircle2;
          let message = `You have utilized ${percent.toFixed(0)}% of your ${catName} budget for ${currentMonthName}.`;

          if (percent >= 100) {
            statusColor = 'text-rose-500';
            bgColor = 'bg-rose-500';
            StatusIcon = AlertCircle;
            message = `You have exceeded your ${catName} budget for ${currentMonthName} by Rs ${(spent - limit).toFixed(2)}.`;
          } else if (percent >= 80) {
            statusColor = 'text-amber-500';
            bgColor = 'bg-amber-500';
            StatusIcon = AlertTriangle;
            message = `Careful! You have spent ${percent.toFixed(0)}% of your ${catName} budget for ${currentMonthName}.`;
          }

          return (
            <div key={catName} className="space-y-4">
              <div className="flex justify-between items-end">
                <div className="flex items-center gap-3">
                  <div className={`${config.color} p-2 rounded-xl text-white shadow-sm`}>
                    <IconComp className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-sm font-black text-slate-800 block">{catName}</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Limit: Rs {limit}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-sm font-black ${statusColor}`}>Rs {spent.toFixed(2)}</span>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{percent.toFixed(0)}% Spent</div>
                </div>
              </div>
              
              <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-50">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ease-out ${bgColor} ${percent >= 100 ? 'shadow-[0_0_8px_rgba(244,63,94,0.3)]' : ''}`} 
                  style={{ width: `${percent}%` }}
                />
              </div>
              
              <div className={`flex items-start gap-2 p-3 rounded-2xl border ${percent >= 100 ? 'bg-rose-50 border-rose-100 text-rose-700' : percent >= 80 ? 'bg-amber-50 border-amber-100 text-amber-700' : 'bg-emerald-50 border-emerald-100 text-emerald-700'}`}>
                <StatusIcon className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <p className="text-[11px] font-bold leading-snug tracking-tight">
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
