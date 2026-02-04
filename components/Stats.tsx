
import React from 'react';
import { TrendingDown, Wallet, Calendar, ArrowUpCircle, Landmark, Zap, BarChart3, Target, PieChart, IndianRupee } from 'lucide-react';
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
      id: 'overview',
      label: 'Liquid Cash',
      value: summary.currentBalance,
      icon: <Wallet className="w-6 h-6" />,
      bgColor: 'bg-emerald-50',
      accentColor: 'text-emerald-600',
      isPrimary: true
    },
    {
      id: 'income',
      label: "Opening Balance",
      value: summary.openingBalance,
      icon: <IndianRupee className="w-6 h-6" />,
      bgColor: 'bg-blue-50',
      accentColor: 'text-blue-600'
    },
    {
      id: 'income',
      label: "Today's Income",
      value: summary.todayIncome,
      icon: <ArrowUpCircle className="w-6 h-6" />,
      bgColor: 'bg-emerald-50',
      accentColor: 'text-emerald-500',
      clickable: true
    },
    {
      id: 'expenses',
      label: "Today's Spend",
      value: summary.todayExpenses,
      icon: <Zap className="w-6 h-6" />,
      bgColor: 'bg-amber-50',
      accentColor: 'text-amber-600',
      clickable: true
    },
    {
      id: 'income',
      label: 'Cumulative Wealth',
      value: summary.cumulativeIncome,
      icon: <BarChart3 className="w-6 h-6" />,
      bgColor: 'bg-indigo-50',
      accentColor: 'text-indigo-600'
    },
    {
      id: 'budget',
      label: 'Monthly Budget',
      value: summary.totalBudget,
      icon: <Target className="w-6 h-6" />,
      bgColor: 'bg-slate-50',
      accentColor: 'text-slate-600'
    },
    {
      id: 'expenses',
      label: 'Monthly Expenses',
      value: summary.totalExpenses,
      icon: <TrendingDown className="w-6 h-6" />,
      bgColor: 'bg-rose-50',
      accentColor: 'text-rose-600'
    }
  ];

  const savingsCards: StatCard[] = [
    {
      id: 'savings',
      label: 'Portfolio Value',
      value: summary.totalSavings,
      icon: <PieChart className="w-6 h-6" />,
      bgColor: 'bg-teal-50',
      accentColor: 'text-teal-600',
      isPrimary: true
    },
    {
      id: 'savings',
      label: "Today's Wealth Growth",
      value: summary.todaySavings || 0,
      icon: <Calendar className="w-6 h-6" />,
      bgColor: 'bg-teal-50',
      accentColor: 'text-teal-500'
    },
    {
      id: 'savings',
      label: 'Net Monthly Sav.',
      value: summary.netSavings,
      icon: <ArrowUpCircle className="w-6 h-6" />,
      bgColor: 'bg-teal-50',
      accentColor: 'text-teal-600'
    },
    {
      id: 'savings',
      label: 'Total Net Worth',
      value: summary.currentBalance + summary.totalSavings,
      icon: <Landmark className="w-6 h-6" />,
      bgColor: 'bg-indigo-50',
      accentColor: 'text-indigo-600'
    }
  ];

  const cards = isSavingsTab ? savingsCards : overviewCards;

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 ${isSavingsTab ? 'lg:grid-cols-4' : 'lg:grid-cols-3 xl:grid-cols-4'} gap-6`}>
      {cards.map((card, i) => (
        <div 
          key={i} 
          onClick={() => card.clickable && onTabChange?.(card.id as any)}
          className={`bg-white p-7 rounded-[2.5rem] shadow-sm border ${card.isPrimary ? (isSavingsTab ? 'border-teal-200 ring-4 ring-teal-50' : 'border-emerald-200 ring-4 ring-emerald-50') : 'border-slate-100'} flex items-start justify-between transition-all duration-300 hover:shadow-xl hover:border-slate-200 ${card.clickable ? 'cursor-pointer hover:-translate-y-1 active:scale-95' : ''}`}
        >
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{card.label}</p>
              {card.clickable && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>}
            </div>
            <p className={`text-2xl font-black ${card.isPrimary ? (isSavingsTab ? 'text-teal-800' : 'text-emerald-800') : 'text-slate-900'}`}>Rs {formatCurrency(card.value)}</p>
          </div>
          <div className={`${card.bgColor} ${card.accentColor} p-4 rounded-2xl`}>{card.icon}</div>
        </div>
      ))}
    </div>
  );
};

export default Stats;
