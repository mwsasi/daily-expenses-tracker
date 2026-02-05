import React, { useMemo, useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Table, 
  CalendarDays, 
  TrendingDown, 
  FileText, 
  Filter, 
  ArrowRightLeft, 
  PiggyBank, 
  Landmark,
  PieChart as PieChartIcon,
  Zap,
  ArrowUpCircle,
  ChevronDown
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
import { Transaction, DailySummary, TransactionType, CategoryConfig } from './types';
import { getCategoryConfig } from './constants';
import DateDropdown, { DatePreset } from './components/DateDropdown';

interface ReportViewProps {
  transactions: Transaction[];
  summary: DailySummary;
  customCategories: CategoryConfig[];
  budgets: Record<string, number>;
}

const ReportView: React.FC<ReportViewProps> = ({ transactions, summary, customCategories }) => {
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
    let income = 0, expense = 0, savings = 0;
    periodTransactions.forEach(t => {
      if (t.type === TransactionType.INCOME && t.category !== 'Opening Balance') income += t.amount;
      else if (t.type === TransactionType.EXPENSE) expense += t.amount;
      else if (t.type === TransactionType.SAVINGS) savings += t.amount;
    });
    return { income, expense, savings, net: income - expense };
  }, [periodTransactions]);

  const ledgerData = useMemo(() => {
    const allDates: string[] = Array.from(new Set(transactions.map(t => t.date))).sort() as string[];
    const ledgerMap: Record<string, any> = {};
    let runningBalance = 0;

    allDates.forEach((date: string) => {
      const dayTxs = transactions.filter(t => t.date === date);
      const dayOpening = dayTxs.filter(t => t.category === 'Opening Balance').reduce((sum: number, t: Transaction) => sum + t.amount, 0);
      const dayIncome = dayTxs.filter(t => t.type === TransactionType.INCOME && t.category !== 'Opening Balance').reduce((sum: number, t: Transaction) => sum + t.amount, 0);
      const dayExpenses = dayTxs.filter(t => t.type === TransactionType.EXPENSE).reduce((sum: number, t: Transaction) => sum + t.amount, 0);
      const daySavings = dayTxs.filter(t => t.type === TransactionType.SAVINGS).reduce((sum: number, t: Transaction) => sum + t.amount, 0);
      
      const catBreakdown: Record<string, number> = {};
      dayTxs.forEach((t: Transaction) => {
        catBreakdown[t.category] = (catBreakdown[t.category] || 0) + t.amount;
      });

      runningBalance += dayOpening + dayIncome - dayExpenses - daySavings;
      
      ledgerMap[date] = { 
        date, 
        opening: dayOpening, 
        income: dayIncome, 
        expenses: dayExpenses,
        savings: daySavings,
        available: runningBalance,
        categories: catBreakdown
      };
    });

    return Object.keys(ledgerMap)
      .filter(date => {
        let matches = true;
        if (startDate) matches = date >= startDate;
        if (matches && endDate) matches = matches && date <= endDate;
        return matches;
      })
      .map(date => ledgerMap[date]);
  }, [transactions, startDate, endDate]);

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
      .map(([name, data]: [string, { amount: number, color: string }]) => ({
        name,
        amount: data.amount,
        color: data.color
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [periodTransactions, customCategories]);

  const generateExcelXML = () => {
    const periodLabel: string = escapeXML(`${startDate} to ${endDate}`);
    const allUsedCats: string[] = Array.from(new Set(periodTransactions.map((t: Transaction) => t.category))).sort() as string[];
    
    const priorityCategories: string[] = ['Opening Balance', 'Daily Income', 'Savings'];
    const otherCategories: string[] = allUsedCats.filter((cat: string) => !priorityCategories.includes(cat));
    const finalMatrixCats: string[] = [
      ...priorityCategories.filter((cat: string) => allUsedCats.includes(cat)),
      ...otherCategories
    ];
    
    const columnTotals: Record<string, number> = {};
    finalMatrixCats.forEach((cat: string) => {
      columnTotals[cat] = periodTransactions.filter(t => t.category === cat).reduce((s, t) => s + (Number(t.amount) || 0), 0);
    });

    let xml = `<?xml version="1.0" encoding="UTF-8"?><?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Bottom"/>
   <Borders/>
   <Font ss:FontName="Segoe UI" ss:Size="11" ss:Color="#1E293B"/>
  </Style>
  <Style ss:ID="TitleStyle">
   <Font ss:FontName="Segoe UI" ss:Bold="1" ss:Size="14" ss:Color="#059669"/>
  </Style>
  <Style ss:ID="HeaderStyle">
   <Font ss:FontName="Segoe UI" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#059669" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
   </Borders>
  </Style>
  <Style ss:ID="TotalStyle">
   <Font ss:FontName="Segoe UI" ss:Bold="1" ss:Color="#1E293B"/>
   <Interior ss:Color="#F1F5F9" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Top" ss:LineStyle="Double" ss:Weight="3"/>
   </Borders>
  </Style>
  <Style ss:ID="BoldLabel">
   <Font ss:FontName="Segoe UI" ss:Bold="1"/>
  </Style>
  <Style ss:ID="CenterText">
   <Alignment ss:Horizontal="Center"/>
  </Style>
 </Styles>

 <Worksheet ss:Name="Executive Summary">
  <Table ss:DefaultColumnWidth="180">
   <Row ss:Height="30"><Cell ss:StyleID="TitleStyle"><Data ss:Type="String">Wealth Assessment: ${periodLabel}</Data></Cell></Row>
   <Row ss:Height="25">
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Metric</Data></Cell>
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Value (RS)</Data></Cell>
   </Row>
   <Row><Cell ss:StyleID="BoldLabel"><Data ss:Type="String">Gross Monthly Income</Data></Cell><Cell><Data ss:Type="String">RS${formatCurrency(fullPeriodSummary.income)}</Data></Cell></Row>
   <Row><Cell ss:StyleID="BoldLabel"><Data ss:Type="String">Operational Expenses</Data></Cell><Cell><Data ss:Type="String">RS${formatCurrency(fullPeriodSummary.expense)}</Data></Cell></Row>
   <Row><Cell ss:StyleID="BoldLabel"><Data ss:Type="String">Wealth Reallocation (Savings)</Data></Cell><Cell><Data ss:Type="String">RS${formatCurrency(fullPeriodSummary.savings)}</Data></Cell></Row>
   <Row><Cell ss:StyleID="BoldLabel"><Data ss:Type="String">Closing Total Wealth</Data></Cell><Cell><Data ss:Type="String">RS${formatCurrency(summary.currentBalance + summary.totalSavings)}</Data></Cell></Row>
  </Table>
 </Worksheet>

 <Worksheet ss:Name="Master Matrix">
  <Table ss:DefaultColumnWidth="120">
   <Row ss:Height="25">
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Date</Data></Cell>
    ${finalMatrixCats.map((cat: string) => `<Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">${escapeXML(cat)}</Data></Cell>`).join('')}
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Liquid Position</Data></Cell>
   </Row>`;

    ledgerData.forEach((day: any) => {
      xml += `
   <Row>
    <Cell ss:StyleID="CenterText"><Data ss:Type="String">${escapeXML(day.date)}</Data></Cell>
    ${finalMatrixCats.map((cat: string) => {
      const amt = day.categories[cat] || 0;
      return `<Cell><Data ss:Type="String">RS${formatCurrency(amt)}</Data></Cell>`;
    }).join('')}
    <Cell><Data ss:Type="String">RS${formatCurrency(day.available)}</Data></Cell>
   </Row>`;
    });

    if (ledgerData.length > 0) {
      xml += `
   <Row ss:Height="25">
    <Cell ss:StyleID="TotalStyle"><Data ss:Type="String">GRAND TOTAL</Data></Cell>
    ${finalMatrixCats.map((cat: string) => `<Cell ss:StyleID="TotalStyle"><Data ss:Type="String">RS${formatCurrency(columnTotals[cat] || 0)}</Data></Cell>`).join('')}
    <Cell ss:StyleID="TotalStyle"><Data ss:Type="String">RS${formatCurrency(ledgerData[ledgerData.length - 1]?.available || 0)}</Data></Cell>
   </Row>`;
    }

    xml += `
  </Table>
 </Worksheet>
</Workbook>`;

    const blob = new Blob([xml], { type: 'text/xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SpendWise_Report_${startDate.replace(/-/g, '_')}_to_${endDate.replace(/-/g, '_')}.xls`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="bg-emerald-600 p-3 rounded-2xl shadow-lg shadow-emerald-200">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight capitalize">Financial Report Engine</h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1 capitalize">Exclusive Excel (.Xls) Analytical Exports</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-4">
          <button 
            onClick={generateExcelXML} 
            className="flex items-center gap-2 bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black text-sm hover:bg-emerald-700 transition-all active:scale-95 shadow-xl shadow-emerald-100 capitalize w-full md:w-auto justify-center"
          >
            <FileSpreadsheet className="w-5 h-5" />
            Generate Excel Report
          </button>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-8">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-emerald-600" />
              <h3 className="font-black text-slate-800 uppercase tracking-[0.2em] text-[10px] capitalize">Contextual Filters</h3>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <button onClick={() => setTypeFilter('ALL')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all capitalize ${typeFilter === 'ALL' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'}`}>All Data</button>
              <button onClick={() => setTypeFilter(TransactionType.INCOME)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all capitalize ${typeFilter === TransactionType.INCOME ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-emerald-400 border-slate-100 hover:border-emerald-100'}`}><ArrowUpCircle className="w-3.5 h-3.5" /> Income</button>
              <button onClick={() => setTypeFilter(TransactionType.EXPENSE)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all capitalize ${typeFilter === TransactionType.EXPENSE ? 'bg-rose-500 text-white border-rose-500' : 'bg-white text-rose-400 border-slate-100 hover:border-rose-100'}`}><Zap className="w-3.5 h-3.5" /> Expenses</button>
              <button onClick={() => setTypeFilter(TransactionType.SAVINGS)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all capitalize ${typeFilter === TransactionType.SAVINGS ? 'bg-teal-500 text-white border-teal-500' : 'bg-white text-teal-400 border-slate-100 hover:border-teal-100'}`}><PiggyBank className="w-3.5 h-3.5" /> Savings</button>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 items-center bg-slate-50 p-3 rounded-[2rem] border border-slate-100">
            <DateDropdown 
              value={datePreset}
              onChange={setDatePreset}
            />

            {datePreset === 'custom' && (
              <div className="flex items-center gap-2 animate-in slide-in-from-left-2 duration-300">
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-[10px] font-black text-slate-700 shadow-sm capitalize focus:ring-4 focus:ring-emerald-500/10 outline-none" />
                <ArrowRightLeft className="w-3 h-3 text-slate-300" />
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-[10px] font-black text-slate-700 shadow-sm capitalize focus:ring-4 focus:ring-emerald-500/10 outline-none" />
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          <div className="bg-emerald-50 p-6 rounded-[2rem] border border-emerald-100 group transition-all hover:shadow-lg hover:shadow-emerald-100/50"><p className="text-[10px] font-black text-emerald-600 tracking-widest mb-1.5 capitalize">Period Inflow</p><p className="text-xl font-black text-emerald-700 tracking-tighter">RS{formatCurrency(fullPeriodSummary.income)}</p></div>
          <div className="bg-rose-50 p-6 rounded-[2rem] border border-rose-100 group transition-all hover:shadow-lg hover:shadow-rose-100/50"><p className="text-[10px] font-black text-rose-600 tracking-widest mb-1.5 capitalize">Period Outflow</p><p className="text-xl font-black text-rose-700 tracking-tighter">RS{formatCurrency(fullPeriodSummary.expense)}</p></div>
          <div className="bg-teal-50 p-6 rounded-[2rem] border border-teal-100 group transition-all hover:shadow-lg hover:shadow-teal-100/50"><p className="text-[10px] font-black text-teal-600 tracking-widest mb-1.5 capitalize">Period Savings</p><p className="text-xl font-black text-teal-700 tracking-tighter">RS{formatCurrency(fullPeriodSummary.savings)}</p></div>
          <div className="bg-blue-50 p-6 rounded-[2rem] border border-blue-100 group transition-all hover:shadow-lg hover:shadow-blue-100/50"><p className="text-[10px] font-black text-blue-600 tracking-widest mb-1.5 capitalize">Period Surplus</p><p className="text-xl font-black text-blue-700 tracking-tighter">RS{formatCurrency(fullPeriodSummary.net)}</p></div>
          <div className="bg-indigo-50 p-6 rounded-[2rem] border border-indigo-100 group transition-all hover:shadow-lg hover:shadow-indigo-100/50"><div className="flex items-center justify-between mb-1.5"><p className="text-[10px] font-black text-indigo-600 tracking-widest capitalize">Total Net Worth</p><Landmark className="w-3.5 h-3.5 text-indigo-400" /></div><p className="text-xl font-black text-indigo-700 tracking-tighter">RS{formatCurrency(summary.currentBalance + summary.totalSavings)}</p></div>
        </div>

        <div className="pt-8 border-t border-slate-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-200"><PieChartIcon className="w-5 h-5 text-slate-600" /></div>
            <div>
              <h3 className="text-lg font-black text-slate-800 tracking-tight capitalize">Category Concentration</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 capitalize">Distribution Analysis For {typeFilter === 'ALL' ? 'Selected Period' : typeFilter}</p>
            </div>
          </div>
          <div className="h-[400px] w-full bg-slate-50/30 p-8 rounded-[3rem] border border-slate-100">
            {categoryConcentrationData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryConcentrationData} layout="vertical" margin={{ left: 40, right: 40, top: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={120} tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }} />
                  <Tooltip cursor={{ fill: 'rgba(226, 232, 240, 0.4)' }} contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.1)', padding: '16px' }} formatter={(value: number) => [`RS${formatCurrency(value)}`, 'Total']} />
                  <Bar dataKey="amount" radius={[0, 12, 12, 0]} barSize={32}>
                    {categoryConcentrationData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4"><CalendarDays className="w-16 h-16 opacity-10" /><p className="text-sm font-black uppercase tracking-[0.2em] opacity-30 capitalize">No Categorical Data Found In This View</p></div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
          <div className="flex items-center gap-3">
            <div className="bg-white p-2.5 rounded-2xl border border-slate-200 shadow-sm"><Table className="w-5 h-5 text-emerald-600" /></div>
            <div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight capitalize">Period Financial Log</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 capitalize">Itemized Historical Settlements</p>
            </div>
          </div>
          <div className="bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-sm"><span className="text-[10px] font-black text-slate-500 uppercase tracking-widest capitalize">{periodTransactions.length} Verified Entries</span></div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-slate-50 text-[10px] uppercase tracking-widest text-slate-500 font-black border-b border-slate-200 capitalize"><th className="px-8 py-5">Value Date</th><th className="px-8 py-5">Category Context</th><th className="px-8 py-5">Note / Details</th><th className="px-8 py-5 text-right">Settled Amount</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-xs">
              {periodTransactions.slice().reverse().map((row: Transaction) => (
                <tr key={row.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-8 py-5 font-bold text-slate-400 group-hover:text-slate-800 transition-colors">{row.date}</td>
                  <td className="px-8 py-5 font-black text-slate-800 uppercase tracking-tight capitalize">{row.category}</td>
                  <td className="px-8 py-5 italic text-slate-500 capitalize">{row.note}</td>
                  <td className={`px-8 py-5 text-right font-black text-sm tracking-tight ${row.type === TransactionType.INCOME ? 'text-emerald-600' : row.type === TransactionType.SAVINGS ? 'text-teal-600' : 'text-slate-900'}`}>{row.type === TransactionType.EXPENSE ? '-' : row.type === TransactionType.SAVINGS ? '→' : '+'}RS{formatCurrency(row.amount)}</td>
                </tr>
              ))}
              {periodTransactions.length === 0 && (
                <tr><td colSpan={4} className="py-24 text-center"><div className="flex flex-col items-center gap-4 opacity-10"><TrendingDown className="w-16 h-16" /><p className="text-sm font-black uppercase tracking-[0.2em] capitalize">Zero Transactions Found For Criteria</p></div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReportView;