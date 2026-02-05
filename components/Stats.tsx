import React from 'react';
import { TrendingDown, Wallet, ArrowUpCircle, Zap, BarChart3, Target, Briefcase } from 'lucide-react';
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
}

const Stats: React.FC<StatsProps> = ({ summary, activeTab, onTabChange }) => {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat(undefined, { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    }).format(val);
  };

  const overviewCards: StatCard[] = [
    {
      id: 'overview',
      label: 'Net Balance',
      value: summary.currentBalance,
      icon: <Briefcase className="w-5 h-5 md:w-6 md:h-6" />,
      bgColor: 'bg-indigo-50',
      accentColor: 'text-indigo-600',
      pillBg: 'bg-indigo-600',
      isPrimary: true
    },
    {
      id: 'income',
      label: "Today's Income",
      value: summary.todayIncome ?? 0,
      icon: <ArrowUpCircle className="w-5 h-5 md:w-6 md:h-6" />,
      bgColor: 'bg-emerald-50',
      accentColor: 'text-emerald-500',
      pillBg: 'bg-emerald-100',
      clickable: true
    },
    {
      id: 'expenses',
      label: "Today's Spend",
      value: summary.todayExpenses ?? 0,
      icon: <Zap className="w-5 h-5 md:w-6 md:h-6" />,
      bgColor: 'bg-amber-50',
      accentColor: 'text-amber-600',
      pillBg: 'bg-amber-100',
      clickable: true
    },
    {
      id: 'income',
      label: 'Gross Income',
      value: summary.cumulativeIncome,
      icon: <BarChart3 className="w-5 h-5 md:w-6 md:h-6" />,
      bgColor: 'bg-indigo-50',
      accentColor: 'text-indigo-600',
      pillBg: 'bg-slate-100'
    },
    {
      id: 'budget',
      label: 'Monthly Budget',
      value: summary.totalBudget,
      icon: <Target className="w-5 h-5 md:w-6 md:h-6" />,
      bgColor: 'bg-slate-50',
      accentColor: 'text-slate-600',
      pillBg: 'bg-slate-200'
    },
    {
      id: 'expenses',
      label: 'Monthly Expenses',
      value: summary.totalExpenses,
      icon: <TrendingDown className="w-5 h-5 md:w-6 md:h-6" />,
      bgColor: 'bg-rose-50',
      accentColor: 'text-rose-600',
      pillBg: 'bg-rose-100'
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-3 md:gap-6">
      {overviewCards.map((card, i) => (
        <div 
          key={i} 
          onClick={() => card.clickable && onTabChange?.(card.id as any)}
          className={`bg-white p-4 md:p-8 rounded-2xl md:rounded-[2.5rem] shadow-sm border ${card.isPrimary ? 'border-indigo-200 ring-4 ring-indigo-50' : 'border-slate-100'} flex items-center md:items-start justify-between transition-all duration-300 hover:shadow-xl hover:border-slate-200 ${card.clickable ? 'cursor-pointer active:scale-[0.98]' : ''}`}
        >
          <div className="flex flex-col min-w-0 flex-1">
            <p className="text-[9px] md:text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2.5 truncate">{card.label}</p>
            <div className={`${card.pillBg} inline-flex items-center px-3 md:px-5 py-2 md:py-3 rounded-full shadow-sm w-fit border border-black/5`}>
               <p className="text-xs md:text-3xl font-black tracking-tighter truncate tabular-nums text-slate-900">RS{formatCurrency(card.value)}</p>
            </div>
          </div>
          <div className={`${card.bgColor} ${card.accentColor} p-2 md:p-6 rounded-xl md:rounded-[2rem] shrink-0 ml-2`}>
            <div className="w-5 h-5 md:w-8 md:h-8 flex items-center justify-center">
              {card.icon}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Stats;