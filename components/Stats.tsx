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
      label: 'net balance',
      value: summary.currentBalance,
      icon: <Briefcase className="w-5 h-5 md:w-6 md:h-6" />,
      bgColor: 'bg-indigo-50',
      accentColor: 'text-indigo-600',
      isPrimary: true
    },
    {
      id: 'income',
      label: "today's income",
      value: summary.todayIncome,
      icon: <ArrowUpCircle className="w-5 h-5 md:w-6 md:h-6" />,
      bgColor: 'bg-emerald-50',
      accentColor: 'text-emerald-500',
      clickable: true
    },
    {
      id: 'expenses',
      label: "today's spend",
      value: summary.todayExpenses,
      icon: <Zap className="w-5 h-5 md:w-6 md:h-6" />,
      bgColor: 'bg-amber-50',
      accentColor: 'text-amber-600',
      clickable: true
    },
    {
      id: 'income',
      label: 'gross income',
      value: summary.cumulativeIncome,
      icon: <BarChart3 className="w-5 h-5 md:w-6 md:h-6" />,
      bgColor: 'bg-indigo-50',
      accentColor: 'text-indigo-600'
    },
    {
      id: 'budget',
      label: 'monthly budget',
      value: summary.totalBudget,
      icon: <Target className="w-5 h-5 md:w-6 md:h-6" />,
      bgColor: 'bg-slate-50',
      accentColor: 'text-slate-600'
    },
    {
      id: 'expenses',
      label: 'monthly exp.',
      value: summary.totalExpenses,
      icon: <TrendingDown className="w-5 h-5 md:w-6 md:h-6" />,
      bgColor: 'bg-rose-50',
      accentColor: 'text-rose-600'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-3 md:gap-6">
      {overviewCards.map((card, i) => (
        <div 
          key={i} 
          onClick={() => card.clickable && onTabChange?.(card.id as any)}
          className={`bg-white p-3 md:p-7 rounded-2xl md:rounded-[2.5rem] shadow-sm border ${card.isPrimary ? 'border-indigo-200 ring-4 ring-indigo-50' : 'border-slate-100'} flex flex-col sm:flex-row items-start justify-between transition-all duration-300 hover:shadow-xl hover:border-slate-200 ${card.clickable ? 'cursor-pointer hover:-translate-y-1 active:scale-95' : ''}`}
        >
          <div className="order-2 sm:order-1 mt-2 sm:mt-0">
            <div className="flex items-center gap-1.5 mb-1">
              <p className="text-[9px] md:text-[11px] font-black text-slate-400 lowercase tracking-wide">{card.label}</p>
            </div>
            <p className={`text-sm md:text-2xl font-black truncate max-w-[120px] md:max-w-none ${card.isPrimary ? 'text-indigo-800' : 'text-slate-900'}`}>RS {formatCurrency(card.value)}</p>
          </div>
          <div className={`${card.bgColor} ${card.accentColor} p-2 md:p-4 rounded-xl md:rounded-2xl order-1 sm:order-2 shrink-0`}>{card.icon}</div>
        </div>
      ))}
    </div>
  );
};

export default Stats;