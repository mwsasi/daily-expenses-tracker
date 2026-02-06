
import React from 'react';
import { TrendingDown, Wallet, ArrowUpCircle, Zap, BarChart3, Target, Briefcase, History, PiggyBank, PlusCircle, AlertCircle } from 'lucide-react';
import { DailySummary } from '../types';

interface StatsProps {
  summary: DailySummary & { 
    todayExpenses: number, 
    todayIncome: number, 
    cumulativeIncome: number,
    totalBudget: number,
    openingBalance: number
  };
  activeTab?: string;
  onTabChange?: (tab: any) => void;
}

interface StatCard {
  id: string;
  label: string;
  value: number;
  icon: React.ReactNode;
  bgColor: string;
  isPrimary?: boolean;
  clickable?: boolean;
  accentColor: string;
  pillBg: string;
  subLabel?: string;
  budgetContext?: {
    total: number;
    spent: number;
  };
}

const Stats: React.FC<StatsProps> = ({ summary, activeTab, onTabChange }) => {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat(undefined, { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    }).format(val);
  };

  const budgetPercent = summary.totalBudget > 0 ? (summary.totalExpenses / summary.totalBudget) * 100 : 0;
  const isOverBudget = summary.totalBudget > 0 && summary.totalExpenses > summary.totalBudget;

  const overviewCards: StatCard[] = [
    {
      id: 'overview',
      label: 'Cash In Hand',
      value: summary.currentBalance,
      icon: <Briefcase className="w-5 h-5 md:w-6 md:h-6" />,
      bgColor: 'bg-emerald-600',
      accentColor: 'text-white',
      pillBg: 'bg-slate-900',
      isPrimary: true,
      subLabel: 'Liquid Position'
    },
    {
      id: 'budget',
      label: 'Budget Utilization',
      value: summary.totalExpenses,
      icon: <Target className="w-5 h-5 md:w-6 md:h-6" />,
      bgColor: isOverBudget ? 'bg-rose-50' : 'bg-indigo-50',
      accentColor: isOverBudget ? 'text-rose-600' : 'text-indigo-600',
      pillBg: isOverBudget ? 'bg-rose-100' : 'bg-indigo-100',
      clickable: true,
      subLabel: 'Spent vs Limit',
      budgetContext: {
        total: summary.totalBudget,
        spent: summary.totalExpenses
      }
    },
    {
      id: 'income',
      label: 'Today\'s Income',
      value: summary.todayIncome || 0,
      icon: <PlusCircle className="w-5 h-5 md:w-6 md:h-6" />,
      bgColor: 'bg-emerald-50',
      accentColor: 'text-emerald-600',
      pillBg: 'bg-emerald-100',
      clickable: true,
      subLabel: 'Daily Flow'
    },
    {
      id: 'income',
      label: 'Monthly Income',
      value: summary.totalIncome,
      icon: <ArrowUpCircle className="w-5 h-5 md:w-6 md:h-6" />,
      bgColor: 'bg-emerald-50',
      accentColor: 'text-emerald-500',
      pillBg: 'bg-emerald-100',
      clickable: true
    },
    {
      id: 'expenses',
      label: 'Monthly Spend',
      value: summary.totalExpenses,
      icon: <Zap className="w-5 h-5 md:w-6 md:h-6" />,
      bgColor: 'bg-amber-50',
      accentColor: 'text-amber-600',
      pillBg: 'bg-amber-100',
      clickable: true
    },
    {
      id: 'savings',
      label: 'Total Savings',
      value: summary.totalSavings,
      icon: <PiggyBank className="w-5 h-5 md:w-6 md:h-6" />,
      bgColor: 'bg-indigo-50',
      accentColor: 'text-indigo-600',
      pillBg: 'bg-indigo-100',
      clickable: true
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
      {overviewCards.map((card, i) => (
        <div 
          key={i} 
          onClick={() => card.clickable && onTabChange?.(card.id as any)}
          className={`bg-white p-5 md:p-8 rounded-[2rem] md:rounded-[2.5rem] shadow-sm border ${card.isPrimary ? 'border-emerald-200 ring-4 ring-emerald-50' : 'border-slate-100'} flex flex-col transition-all duration-300 hover:shadow-xl hover:border-slate-200 ${card.clickable ? 'cursor-pointer active:scale-[0.98]' : ''}`}
        >
          <div className="flex items-start justify-between w-full">
            <div className="flex flex-col min-w-0 flex-1">
              <p className="text-[9px] md:text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2.5 truncate">
                {card.label}
                {card.subLabel && <span className="ml-1 opacity-60 text-[8px] italic">({card.subLabel})</span>}
              </p>
              <div className={`${card.pillBg} inline-flex items-center px-4 py-2 rounded-full shadow-sm w-fit border border-black/5`}>
                 <p className={`text-lg md:text-2xl font-black tracking-tighter truncate tabular-nums ${card.isPrimary ? 'text-white' : 'text-slate-900'}`}>RS{formatCurrency(card.value)}</p>
              </div>
            </div>
            <div className={`${card.bgColor} ${card.accentColor} p-3 md:p-5 rounded-2xl md:rounded-[1.5rem] shrink-0 ml-4 shadow-sm`}>
              <div className="w-5 h-5 md:w-6 md:h-6 flex items-center justify-center">
                {card.icon}
              </div>
            </div>
          </div>

          {card.budgetContext && (
            <div className="mt-6 space-y-2">
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                <span>Usage: {budgetPercent.toFixed(0)}%</span>
                <span>Limit: RS{formatCurrency(card.budgetContext.total)}</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ${isOverBudget ? 'bg-rose-500' : 'bg-indigo-500'}`} 
                  style={{ width: `${Math.min(budgetPercent, 100)}%` }}
                />
              </div>
              {isOverBudget && (
                <div className="flex items-center gap-1.5 text-rose-600 text-[9px] font-black uppercase tracking-tight mt-1 animate-pulse">
                  <AlertCircle className="w-3 h-3" />
                  Budget Exceeded
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default Stats;
