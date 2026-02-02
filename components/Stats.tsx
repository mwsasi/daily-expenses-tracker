
import React from 'react';
import { TrendingUp, TrendingDown, Wallet, PiggyBank, Calendar, Calculator } from 'lucide-react';
import { DailySummary } from '../types';

interface StatsProps {
  summary: DailySummary & { todayExpenses: number, todayIncome: number };
}

const Stats: React.FC<StatsProps> = ({ summary }) => {
  const cards = [
    {
      label: 'Total Available',
      value: summary.currentBalance,
      icon: <Wallet className="w-6 h-6 text-emerald-600" />,
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-700',
      isPrimary: true
    },
    {
      label: 'Opening Balance',
      value: summary.openingBalance,
      icon: <Calculator className="w-6 h-6 text-blue-600" />,
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700'
    },
    {
      label: "Today's Spent",
      value: summary.todayExpenses,
      icon: <Calendar className="w-6 h-6 text-orange-600" />,
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-700'
    },
    {
      label: 'Monthly Expenses',
      value: summary.totalExpenses,
      icon: <TrendingDown className="w-6 h-6 text-rose-600" />,
      bgColor: 'bg-rose-50',
      textColor: 'text-rose-700'
    }
  ];

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat(undefined, { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    }).format(val);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <div key={i} className={`bg-white p-5 rounded-2xl shadow-sm border ${card.isPrimary ? 'border-emerald-200 ring-2 ring-emerald-50' : 'border-slate-100'} flex items-start justify-between`}>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{card.label}</p>
            <p className={`text-2xl font-black ${card.isPrimary ? 'text-emerald-700' : 'text-slate-800'}`}>Rs {formatCurrency(card.value)}</p>
          </div>
          <div className={`${card.bgColor} p-3 rounded-xl`}>
            {card.icon}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Stats;
