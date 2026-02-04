import React, { useMemo, useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Table, 
  CalendarDays, 
  TrendingDown, 
  FileText, 
  Filter, 
  ArrowRightLeft, 
  Landmark,
  PieChart as PieChartIcon,
  Zap,
  ArrowUpCircle,
  Download,
  Calendar
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell
} from 'recharts';
import { jsPDF } from 'jspdf';
import { Transaction, DailySummary, TransactionType, CategoryConfig } from '../types';
import { DEFAULT_CATEGORIES, getCategoryConfig } from '../constants';
import DateDropdown, { DatePreset } from './DateDropdown';

interface ReportViewProps {
  transactions: Transaction[];
  summary: DailySummary;
  customCategories: CategoryConfig[];
  budgets: Record<string, number>;
}

const ReportView: React.FC<ReportViewProps> = ({ transactions, summary, customCategories, budgets }) => {
  const allCategories = [...DEFAULT_CATEGORIES, ...customCategories];
  const todayStr = new Date().toISOString().split('T')[0];
  
  const [datePreset, setDatePreset] = useState<DatePreset>('thisMonth');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>(todayStr);
  const [typeFilter, setTypeFilter] = useState<'ALL' | TransactionType>('ALL');

  useEffect(() => {
    const now = new Date();
    let start = '';
    let end = todayStr;

    switch (datePreset) {
      case 'today':
        start = todayStr;
        end = todayStr;
        break;
      case 'yesterday':
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        start = yesterday.toISOString().split('T')[0];
        end = start;
        break;
      case 'last7':
        const last7 = new Date(now);
        last7.setDate(now.getDate() - 7);
        start = last7.toISOString().split('T')[0];
        end = todayStr;
        break;
      case 'thisMonth':
        start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        end = todayStr;
        break;
      case 'lastMonth':
        const firstOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        start = firstOfLastMonth.toISOString().split('T')[0];
        end = lastOfLastMonth.toISOString().split('T')[0];
        break;
      case 'thisYear':
        start = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
        end = todayStr;
        break;
      case 'all':
        start = '';
        end = todayStr;
        break;
      case 'custom':
        return;
    }

    setStartDate(start);
    setEndDate(end);
  }, [datePreset, todayStr]);

  const escapeXML = (str: any) => {
    if (str === null || str === undefined) return '';
    return str.toString()
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat(undefined, { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  }).format(val);

  const periodTransactions = useMemo(() => {
    return transactions.filter(t => {
      let matchesDate = true;
      if (startDate) matchesDate = t.date >= startDate;
      if (matchesDate && endDate) matchesDate = matchesDate && t.date <= endDate;
      
      if (!matchesDate) return false;
      if (typeFilter !== 'ALL' && t.type !== typeFilter) return false;

      return true;
    }).sort((a, b) => a.date.localeCompare(b.date));
  }, [transactions, startDate, endDate, typeFilter]);

  const fullPeriodSummary = useMemo(() => {
    let income = 0, expense = 0;
    periodTransactions.forEach(t => {
      if (t.type === TransactionType.INCOME && t.category !== 'Opening Balance') income += t.amount;
      else if (t.type === TransactionType.EXPENSE) expense += t.amount;
    });
    return { income, expense, net: income - expense };
  }, [periodTransactions]);

  const categoryConcentrationData = useMemo(() => {
    const dataMap: Record<string, { amount: number, color: string }> = {};
    periodTransactions
      .forEach(t => {
        if (!dataMap[t.category]) {
          const config = getCategoryConfig(t.category, customCategories);
          dataMap[t.category] = { amount: 0, color: config.color };
        }
        dataMap[t.category].amount += t.amount;
      });
    return Object.entries(dataMap)
      .map(([name, data]) => ({
        name,
        amount: data.amount,
        color: data.color 
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [periodTransactions, customCategories]);

  const generatePDFSummary = () => {
    const doc = new jsPDF();
    const periodLabel = datePreset === 'custom' ? `${startDate} to ${endDate}` : datePreset;
    doc.setFillColor(5, 150, 105); 
    doc.rect(0, 0, 210, 40, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.text('SpendWise Financial Summary', 15, 25);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, 150, 25);
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`Reporting Period: ${periodLabel}`, 15, 55);
    doc.setDrawColor(226, 232, 240);
    doc.line(15, 60, 195, 60);

    const startY = 75;
    const lineHeight = 12;
    const metrics: Array<{label: string, value: number, color: number[]}> = [
      { label: 'Total Period Income', value: fullPeriodSummary.income, color: [5, 150, 105] },
      { label: 'Total Period Expenses', value: fullPeriodSummary.expense, color: [244, 63, 94] },
      { label: 'Period Net Surplus', value: fullPeriodSummary.net, color: [37, 99, 235] },
      { label: 'Final Net Worth', value: summary.currentBalance, color: [79, 70, 229] }
    ];

    metrics.forEach((m, i) => {
      const currentY = startY + (i * lineHeight);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(71, 85, 105);
      doc.text(m.label, 20, currentY);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(m.color[0], m.color[1], m.color[2]);
      doc.text(`RS ${formatCurrency(m.value)}`, 140, currentY);
      doc.setDrawColor(241, 245, 249);
      doc.line(20, currentY + 3, 190, currentY + 3);
    });

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text('Report produced by SpendWise Daily Expense Tracker.', 15, 280);
    doc.save(`SpendWise_Summary_${startDate.replace(/-/g, '_')}.pdf`);
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="bg-emerald-600 p-3 rounded-2xl shadow-lg shadow-emerald-200">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight lowercase">financial report engine</h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1 lowercase">independent inflow & expense analysis</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-4">
          <button 
            onClick={generatePDFSummary} 
            className="flex items-center gap-2 bg-rose-500 text-white px-6 py-4 rounded-2xl font-black text-sm hover:bg-rose-600 transition-all active:scale-95 shadow-xl shadow-rose-100 lowercase"
          >
            <Download className="w-5 h-5" />
            pdf summary
          </button>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-8">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-emerald-600" />
              <h3 className="font-black text-slate-800 uppercase tracking-[0.2em] text-[10px] lowercase">contextual filters</h3>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <button 
                onClick={() => setTypeFilter('ALL')}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all lowercase ${typeFilter === 'ALL' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'}`}
              >
                all data
              </button>
              <button 
                onClick={() => setTypeFilter(TransactionType.INCOME)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all lowercase ${typeFilter === TransactionType.INCOME ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-emerald-400 border-slate-100 hover:border-emerald-100'}`}
              >
                <ArrowUpCircle className="w-3.5 h-3.5" /> income
              </button>
              <button 
                onClick={() => setTypeFilter(TransactionType.EXPENSE)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all lowercase ${typeFilter === TransactionType.EXPENSE ? 'bg-rose-500 text-white border-rose-500' : 'bg-white text-rose-400 border-slate-100 hover:border-rose-100'}`}
              >
                <Zap className="w-3.5 h-3.5" /> expenses
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 items-center bg-slate-50 p-3 rounded-[2rem] border border-slate-100">
            <DateDropdown value={datePreset} onChange={setDatePreset} />

            {datePreset === 'custom' && (
              <div className="flex items-center gap-2 animate-in slide-in-from-left-2 duration-300">
                <input 
                  type="date" 
                  value={startDate} 
                  onChange={(e) => setStartDate(e.target.value)} 
                  className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-[10px] font-black text-slate-700 shadow-sm lowercase focus:ring-4 focus:ring-emerald-500/10 outline-none" 
                />
                <ArrowRightLeft className="w-3 h-3 text-slate-300" />
                <input 
                  type="date" 
                  value={endDate} 
                  onChange={(e) => setEndDate(e.target.value)} 
                  className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-[10px] font-black text-slate-700 shadow-sm lowercase focus:ring-4 focus:ring-emerald-500/10 outline-none" 
                />
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-emerald-50 p-6 rounded-[2rem] border border-emerald-100 group transition-all hover:shadow-lg hover:shadow-emerald-100/50">
            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1.5 lowercase">period inflow</p>
            <p className="text-xl font-black text-emerald-700">RS {formatCurrency(fullPeriodSummary.income)}</p>
          </div>
          <div className="bg-rose-50 p-6 rounded-[2rem] border border-rose-100 group transition-all hover:shadow-lg hover:shadow-rose-100/50">
            <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1.5 lowercase">period outflow</p>
            <p className="text-xl font-black text-rose-700">RS {formatCurrency(fullPeriodSummary.expense)}</p>
          </div>
          <div className="bg-blue-50 p-6 rounded-[2rem] border border-blue-100 group transition-all hover:shadow-lg hover:shadow-blue-100/50">
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1.5 lowercase">period surplus</p>
            <p className="text-xl font-black text-blue-700">RS {formatCurrency(fullPeriodSummary.net)}</p>
          </div>
          <div className="bg-indigo-50 p-6 rounded-[2rem] border border-indigo-100 group transition-all hover:shadow-lg hover:shadow-indigo-100/50">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest lowercase">total net balance</p>
              <Landmark className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <p className="text-xl font-black text-indigo-700">RS {formatCurrency(summary.currentBalance)}</p>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
              <PieChartIcon className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-800 tracking-tight lowercase">category concentration</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 lowercase">distribution analysis for {typeFilter === 'ALL' ? 'selected period' : typeFilter}</p>
            </div>
          </div>
          
          <div className="h-[400px] w-full bg-slate-50/30 p-8 rounded-[3rem] border border-slate-100">
            {categoryConcentrationData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryConcentrationData} layout="vertical" margin={{ left: 40, right: 40, top: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    axisLine={false} 
                    tickLine={false} 
                    width={120}
                    tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }}
                  />
                  <Tooltip 
                    cursor={{ fill: 'rgba(226, 232, 240, 0.4)' }}
                    contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.1)', padding: '16px' }}
                    formatter={(value: number) => [`RS ${formatCurrency(value)}`, 'total']}
                  />
                  <Bar dataKey="amount" radius={[0, 12, 12, 0]} barSize={32}>
                    {categoryConcentrationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4">
                <CalendarDays className="w-16 h-16 opacity-10" />
                <p className="text-sm font-black uppercase tracking-[0.2em] opacity-30 lowercase">no categorical data found in this view</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportView;