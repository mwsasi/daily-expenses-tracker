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
  BarChart3
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
import { Transaction, DailySummary, TransactionType, CategoryConfig } from '../types';
import { getCategoryConfig } from '../constants';
import DateDropdown, { DatePreset } from './DateDropdown';

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

  const dailyLedgerData = useMemo(() => {
    const dates = Array.from(new Set(periodTransactions.map(t => t.date))).sort();
    return dates.map(date => {
      const dayTxs = periodTransactions.filter(t => t.date === date);
      const catTotals: Record<string, number> = {};
      dayTxs.forEach(t => {
        catTotals[t.category] = (catTotals[t.category] || 0) + t.amount;
      });
      return { date, categories: catTotals };
    });
  }, [periodTransactions]);

  const generateExcelXML = () => {
    const periodLabel = escapeXML(`${startDate || 'Start'} to ${endDate || 'End'}`);
    const usedCats = Array.from(new Set(periodTransactions.map(t => t.category))).sort();
    
    // Formatting helper for XML Cells
    const createCell = (value: string | number, style: string = 'Default') => {
      const type = typeof value === 'number' ? 'Number' : 'String';
      return `<Cell ss:StyleID="${style}"><Data ss:Type="${type}">${value}</Data></Cell>`;
    };

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
  <Style ss:ID="LabelStyle">
   <Font ss:FontName="Segoe UI" ss:Bold="1" ss:Color="#475569"/>
   <Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/>
  </Style>
 </Styles>

 <Worksheet ss:Name="Executive Summary">
  <Table ss:DefaultColumnWidth="150">
   <Column ss:Width="200"/>
   <Column ss:Width="150"/>
   <Row ss:Height="30"><Cell ss:StyleID="TitleStyle"><Data ss:Type="String">SpendWise Report: ${periodLabel}</Data></Cell></Row>
   <Row ss:Index="3">
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Metric Description</Data></Cell>
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Amount (RS)</Data></Cell>
   </Row>
   <Row>
    <Cell ss:StyleID="LabelStyle"><Data ss:Type="String">Total Inflow (Income)</Data></Cell>
    ${createCell(fullPeriodSummary.income)}
   </Row>
   <Row>
    <Cell ss:StyleID="LabelStyle"><Data ss:Type="String">Total Outflow (Expenses)</Data></Cell>
    ${createCell(fullPeriodSummary.expense)}
   </Row>
   <Row>
    <Cell ss:StyleID="LabelStyle"><Data ss:Type="String">Total Reallocation (Savings)</Data></Cell>
    ${createCell(fullPeriodSummary.savings)}
   </Row>
   <Row>
    <Cell ss:StyleID="LabelStyle"><Data ss:Type="String">Net Surplus/Deficit</Data></Cell>
    ${createCell(fullPeriodSummary.net)}
   </Row>
   <Row>
    <Cell ss:StyleID="LabelStyle"><Data ss:Type="String">Current Net Worth</Data></Cell>
    ${createCell(summary.currentBalance + summary.totalSavings)}
   </Row>
  </Table>
 </Worksheet>

 <Worksheet ss:Name="Daily Matrix">
  <Table ss:DefaultColumnWidth="100">
   <Column ss:Width="120"/>
   <Row ss:Height="25">
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Date</Data></Cell>
    ${usedCats.map(cat => `<Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">${escapeXML(cat)}</Data></Cell>`).join('')}
   </Row>
   ${dailyLedgerData.map(day => `
   <Row>
    <Cell><Data ss:Type="String">${day.date}</Data></Cell>
    ${usedCats.map(cat => createCell(day.categories[cat] || 0)).join('')}
   </Row>`).join('')}
  </Table>
 </Worksheet>

 <Worksheet ss:Name="Detailed Log">
  <Table ss:DefaultColumnWidth="120">
   <Column ss:Width="100"/>
   <Column ss:Width="150"/>
   <Column ss:Width="100"/>
   <Column ss:Width="250"/>
   <Row ss:Height="25">
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Date</Data></Cell>
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Category</Data></Cell>
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Type</Data></Cell>
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Note</Data></Cell>
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Amount</Data></Cell>
   </Row>
   ${periodTransactions.map(t => `
   <Row>
    <Cell><Data ss:Type="String">${t.date}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXML(t.category)}</Data></Cell>
    <Cell><Data ss:Type="String">${t.type}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXML(t.note)}</Data></Cell>
    ${createCell(t.amount)}
   </Row>`).join('')}
  </Table>
 </Worksheet>
</Workbook>`;

    const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SpendWise_Analysis_${startDate || 'All'}_to_${endDate || 'Today'}.xls`;
    link.click();
    URL.revokeObjectURL(url);
  };

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

  return (
    <div className="space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="bg-emerald-600 p-3 rounded-2xl shadow-lg shadow-emerald-200">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight capitalize">Financial Report Engine</h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1 capitalize">Verified Excel Spreadsheet Distribution</p>
          </div>
        </div>
        <button 
          onClick={generateExcelXML} 
          className="flex items-center gap-2 bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black text-sm hover:bg-emerald-700 transition-all active:scale-95 shadow-xl shadow-emerald-100 capitalize w-full md:w-auto justify-center"
        >
          <FileSpreadsheet className="w-5 h-5" />
          Export Data to Excel
        </button>
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-8">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-emerald-600" />
              <h3 className="font-black text-slate-800 uppercase tracking-[0.2em] text-[10px] capitalize">Analytical Range</h3>
            </div>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => setTypeFilter('ALL')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${typeFilter === 'ALL' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'}`}>Full Portfolio</button>
              <button onClick={() => setTypeFilter(TransactionType.INCOME)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${typeFilter === TransactionType.INCOME ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-emerald-400 border-slate-100 hover:border-emerald-100'}`}><ArrowUpCircle className="w-3.5 h-3.5" /> Inflow</button>
              <button onClick={() => setTypeFilter(TransactionType.EXPENSE)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${typeFilter === TransactionType.EXPENSE ? 'bg-rose-500 text-white border-rose-500' : 'bg-white text-rose-400 border-slate-100 hover:border-rose-100'}`}><Zap className="w-3.5 h-3.5" /> Outflow</button>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 items-center bg-slate-50 p-3 rounded-[2rem] border border-slate-100">
            <DateDropdown value={datePreset} onChange={setDatePreset} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {[
            { label: 'Period Flow', val: fullPeriodSummary.income, bg: 'bg-emerald-50' },
            { label: 'Period Spend', val: fullPeriodSummary.expense, bg: 'bg-rose-50' },
            { label: 'Period Realloc', val: fullPeriodSummary.savings, bg: 'bg-teal-50' },
            { label: 'Period Margin', val: fullPeriodSummary.net, bg: 'bg-blue-50' },
            { label: 'Total Equity', val: summary.currentBalance + summary.totalSavings, bg: 'bg-indigo-50' }
          ].map((item, idx) => (
            <div key={idx} className={`${item.bg} p-6 rounded-[2rem] border border-slate-100 transition-all hover:shadow-lg`}>
              <p className={`text-[10px] font-black uppercase tracking-widest mb-3 capitalize text-slate-400`}>{item.label}</p>
              <div className={`bg-white/60 px-4 py-1.5 rounded-full inline-block border border-black/5`}>
                <p className="text-base font-black tracking-tighter text-slate-900">RS{formatCurrency(item.val)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
          <div className="flex items-center gap-3">
            <div className="bg-white p-2.5 rounded-2xl border border-slate-200 shadow-sm"><Table className="w-5 h-5 text-emerald-600" /></div>
            <div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight capitalize">Settlement Ledger</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 capitalize">Historical Audit Trail</p>
            </div>
          </div>
          <div className="bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{periodTransactions.length} Verified Records</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-slate-50 text-[10px] uppercase tracking-widest text-slate-500 font-black border-b border-slate-200 capitalize"><th className="px-8 py-5">Value Date</th><th className="px-8 py-5">Category Context</th><th className="px-8 py-5">Note / Details</th><th className="px-8 py-5 text-right">Settled Amount</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {periodTransactions.slice().reverse().map((row: Transaction) => (
                <tr key={row.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-8 py-5 font-bold text-slate-400 group-hover:text-slate-800 transition-colors">{row.date}</td>
                  <td className="px-8 py-5 font-black text-slate-800 uppercase tracking-tight capitalize">{row.category}</td>
                  <td className="px-8 py-5 italic text-slate-500 capitalize">{row.note}</td>
                  <td className="px-8 py-5 text-right">
                    <span className={`inline-flex items-center px-4 py-1.5 rounded-full font-black text-sm tracking-tight border text-slate-900 bg-white border-slate-100`}>
                      {row.type === TransactionType.EXPENSE ? '-' : row.type === TransactionType.SAVINGS ? '→' : '+'}RS{formatCurrency(row.amount)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReportView;