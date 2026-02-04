
import React from 'react';
import { TrendingDown, Wallet, Calendar, ArrowUpCircle, Landmark, Zap, BarChart3, Target, PieChart, IndianRupee, Briefcase } from 'lucide-react';
import { DailySummary } from '../types';

interface StatsProps {
  summary: DailySummary & { 
    todayExpenses: number, 
    todayIncome: number, 
    totalSavings: number,
    todaySavings?: number,
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

  const isSavingsTab = activeTab === 'savings';

  const overviewCards: StatCard[] = [
    {
      id: 'savings',
      label: 'total net wealth',
      value: summary.currentBalance + summary.totalSavings,
      icon: <Briefcase className="w-5 h-5 md:w-6 md:h-6" />,
      bgColor: 'bg-indigo-50',
      accentColor: 'text-indigo-600',
      isPrimary: true,
      clickable: true
    },
    {
      id: 'overview',
      label: 'wallet cash',
      value: summary.currentBalance,
      icon: <Wallet className="w-5 h-5 md:w-6 md:h-6" />,
      bgColor: 'bg-emerald-50',
      accentColor: 'text-emerald-600'
    },
    {
      id: 'savings',
      label: 'savings vault',
      value: summary.totalSavings,
      icon: <PieChart className="w-5 h-5 md:w-6 md:h-6" />,
      bgColor: 'bg-teal-50',
      accentColor: 'text-teal-600',
      clickable: true
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

  const savingsCards: StatCard[] = [
    {
      id: 'savings',
      label: 'portfolio value',
      value: summary.totalSavings,
      icon: <PieChart className="w-6 h-6" />,
      bgColor: 'bg-teal-50',
      accentColor: 'text-teal-600',
      isPrimary: true
    },
    {
      id: 'savings',
      label: "today's growth",
      value: summary.todaySavings || 0,
      icon: <Calendar className="w-6 h-6" />,
      bgColor: 'bg-teal-50',
      accentColor: 'text-teal-500'
    },
    {
      id: 'savings',
      label: 'monthly sav.',
      value: summary.netSavings,
      icon: <ArrowUpCircle className="w-6 h-6" />,
      bgColor: 'bg-teal-50',
      accentColor: 'text-teal-600'
    },
    {
      id: 'savings',
      label: 'total asset worth',
      value: summary.currentBalance + summary.totalSavings,
      icon: <Landmark className="w-6 h-6" />,
      bgColor: 'bg-indigo-50',
      accentColor: 'text-indigo-600'
    }
  ];

  const cards = isSavingsTab ? savingsCards : overviewCards;

  return (
    <div className={`grid grid-cols-2 md:grid-cols-2 ${isSavingsTab ? 'lg:grid-cols-4' : 'lg:grid-cols-3 xl:grid-cols-4'} gap-3 md:gap-6`}>
      {cards.map((card, i) => (
        <div 
          key={i} 
          onClick={() => card.clickable && onTabChange?.(card.id as any)}
          className={`bg-white p-3 md:p-7 rounded-2xl md:rounded-[2.5rem] shadow-sm border ${card.isPrimary ? (isSavingsTab ? 'border-teal-200 ring-4 ring-teal-50' : 'border-indigo-200 ring-4 ring-indigo-50') : 'border-slate-100'} flex flex-col sm:flex-row items-start justify-between transition-all duration-300 hover:shadow-xl hover:border-slate-200 ${card.clickable ? 'cursor-pointer hover:-translate-y-1 active:scale-95' : ''}`}
        >
          <div className="order-2 sm:order-1 mt-2 sm:mt-0">
            <div className="flex items-center gap-1.5 mb-1">
              <p className="text-[9px] md:text-[11px] font-black text-slate-400 lowercase tracking-wide">{card.label}</p>
            </div>
            <p className={`text-sm md:text-2xl font-black truncate max-w-[120px] md:max-w-none ${card.isPrimary ? (isSavingsTab ? 'text-teal-800' : 'text-indigo-800') : 'text-slate-900'}`}>RS {formatCurrency(card.value)}</p>
          </div>
          <div className={`${card.bgColor} ${card.accentColor} p-2 md:p-4 rounded-xl md:rounded-2xl order-1 sm:order-2 shrink-0`}>{card.icon}</div>
        </div>
      ))}
    </div>
  );
};

export default Stats;
