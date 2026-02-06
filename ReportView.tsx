
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
  ChevronDown,
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
import { Transaction, DailySummary, TransactionType, CategoryConfig } from './types';
import { getCategoryConfig } from './constants';
import DateDropdown, { DatePreset } from './components/DateDropdown';

interface LedgerDay {
  date: string;
  income: number;
  expenses: number;
  savings: number;
  available: number;
  categories: Record<string, number>;
}

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
        if (!startDate) {
          setStartDate(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]);
        }
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

  const ledgerData = useMemo(() => {
    const allDates: string[] = Array.from(new Set(transactions.map(t => t.date))).sort() as string[];
    const ledgerMap: Record<string, LedgerDay> = {};
    let runningBalance = 0;

    allDates.forEach((date: string) => {
      const dayTxs = transactions.filter(t => t.date === date);
      const dayIncome = dayTxs.filter(t => t.type === TransactionType.INCOME).reduce((sum, t) => sum + t.amount, 0);
      const dayExpenses = dayTxs.filter(t => t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + t.amount, 0);
      const daySavings = dayTxs.filter(t => t.type === TransactionType.SAVINGS).reduce((sum, t) => sum + t.amount, 0);
      
      const catBreakdown: Record<string, number> = {};
      dayTxs.forEach((t: Transaction) => {
        catBreakdown[t.category] = (catBreakdown[t.category] || 0) + t.amount;
      });

      runningBalance += dayIncome - dayExpenses - daySavings;
      
      ledgerMap[date] = { 
        date, 
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
      .sort((a, b) => b.localeCompare(a))
      .map(date => ledgerMap[date])
      .filter((d): d is LedgerDay => d !== undefined);
  }, [transactions, startDate, endDate]);

  const fullPeriodSummary = useMemo(() => {
    let income = 0, expense = 0, savings = 0;
    periodTransactions.forEach(t => {
      if (t.type === TransactionType.INCOME && t.category !== 'Opening Balance') income += t.amount;
      else if (t.type === TransactionType.EXPENSE) expense += t.amount;
      else if (t.type === TransactionType.SAVINGS) savings += t.amount;
    });
    return { income, expense, savings, net: income - expense - savings };
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
      .map(([name, data]: [string, { amount: number, color: string }]) => ({
        name,
        amount: data.amount,
        color: data.color
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [periodTransactions, customCategories]);

  const generateExcelXML = () => {
    // List of columns based on the user's requested layout
    const columns = [
      'Date', 
      'Opening Balance', 
      'Daily Income', 
      'Fuel', 
      'Bike', 
      'Bike Repair', 
      'Food', 
      'Tea', 
      'Mobile Topup', 
      'Internet Topup', 
      'Parcel', 
      'Buy Accessories', 
      'Savings', 
      'Others'
    ];

    const expenseCols = ['Fuel', 'Bike', 'Bike Repair', 'Food', 'Tea', 'Mobile Topup', 'Internet Topup', 'Parcel', 'Buy Accessories', 'Others'];

    const chronologicalLedger = [...ledgerData].sort((a, b) => a.date.localeCompare(b.date));
    
    // Totals for the GRAND TOTAL row
    const totals: Record<string, number> = {};
    columns.forEach(col => totals[col] = 0);

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
  <Style ss:ID="HeaderStyle">
   <Font ss:FontName="Segoe UI" ss:Bold="1" ss:Color="#000000"/>
   <Interior ss:Color="#E2E8F0" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
   </Borders>
  </Style>
  <Style ss:ID="GrandTotal">
   <Font ss:FontName="Segoe UI" ss:Bold="1" ss:Color="#000000"/>
   <Interior ss:Color="#CBD5E1" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
   </Borders>
  </Style>
  <Style ss:ID="BoldLabel">
   <Font ss:FontName="Segoe UI" ss:Bold="1"/>
  </Style>
  <Style ss:ID="Currency">
   <NumberFormat ss:Format="&quot;Rs &quot;#,##0.00"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="SummaryHeader">
    <Font ss:FontName="Segoe UI" ss:Bold="1"/>
    <Interior ss:Color="#F1F5F9" ss:Pattern="Solid"/>
  </Style>
 </Styles>

 <Worksheet ss:Name="Daily Categorical Analysis">
  <Table ss:DefaultColumnWidth="120">
   <Row ss:Height="25">
    ${columns.map(col => `<Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">${escapeXML(col)}</Data></Cell>`).join('')}
   </Row>`;

    chronologicalLedger.forEach((day: LedgerDay) => {
      xml += `<Row>`;
      columns.forEach(col => {
        let value: any = 0;
        if (col === 'Date') {
          value = day.date;
          xml += `<Cell><Data ss:Type="String">${escapeXML(value)}</Data></Cell>`;
          return;
        } else if (col === 'Opening Balance') {
          value = day.categories['Opening Balance'] || 0;
        } else if (col === 'Daily Income') {
          value = day.categories['Daily Income'] || 0;
        } else {
          value = day.categories[col] || 0;
        }
        
        totals[col] += value;
        xml += `<Cell ss:StyleID="Currency"><Data ss:Type="Number">${value}</Data></Cell>`;
      });
      xml += `</Row>`;
    });

    // GRAND TOTAL Row
    xml += `<Row ss:Height="20">
      <Cell ss:StyleID="GrandTotal"><Data ss:Type="String">GRAND TOTAL</Data></Cell>
      ${columns.slice(1).map(col => `<Cell ss:StyleID="GrandTotal" ss:StyleID="Currency"><Data ss:Type="Number">${totals[col]}</Data></Cell>`).join('')}
    </Row>`;

    // Spacer rows
    xml += `<Row></Row><Row></Row>`;

    // Final Summary Section
    const totalInc = totals['Daily Income'];
    const totalExp = expenseCols.reduce((sum, col) => sum + totals[col], 0);
    const availBal = totals['Opening Balance'] + totalInc - totalExp - totals['Savings'];

    xml += `
    <Row><Cell ss:StyleID="SummaryHeader"><Data ss:Type="String">Final Summary</Data></Cell></Row>
    <Row>
      <Cell><Data ss:Type="String">Total Income</Data></Cell>
      <Cell ss:StyleID="Currency"><Data ss:Type="Number">${totalInc}</Data></Cell>
    </Row>
    <Row>
      <Cell><Data ss:Type="String">Total Expenses</Data></Cell>
      <Cell ss:StyleID="Currency"><Data ss:Type="Number">${totalExp + totals['Savings']}</Data></Cell>
    </Row>
    <Row>
      <Cell ss:StyleID="BoldLabel"><Data ss:Type="String">Available Balance</Data></Cell>
      <Cell ss:StyleID="Currency"><Data ss:Type="Number">${availBal}</Data></Cell>
    </Row>`;

    xml += `
  </Table>
 </Worksheet>
</Workbook>`;

    const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SpendWise_Daily_Report_${startDate || 'all'}_to_${endDate}.xls`;
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
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1 capitalize">Standard Matrix Excel Exports</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-4">
          <button 
            onClick={generateExcelXML} 
            className="flex items-center gap-2 bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black text-sm hover:bg-emerald-700 transition-all active:scale-95 shadow-xl shadow-emerald-100 capitalize w-full md:w-auto justify-center"
          >
            <FileSpreadsheet className="w-5 h-5" />
            Generate Excel Analysis
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

          <div className="flex flex-wrap gap-3 items-center bg-slate-50 p-4 rounded-[2.5rem] border border-slate-100 shadow-inner">
            <DateDropdown 
              value={datePreset}
              onChange={setDatePreset}
            />

            {datePreset === 'custom' && (
              <div className="flex items-center gap-3 animate-in slide-in-from-left-4 duration-500 ease-out">
                <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">From</span>
                  <div className="relative">
                    <Calendar className="absolute left-0 top-1/2 -translate-y-1/2 w-3 h-3 text-emerald-600 pointer-events-none" />
                    <input 
                      type="date" 
                      value={startDate} 
                      onChange={(e) => setStartDate(e.target.value)} 
                      className="pl-5 bg-transparent border-none p-0 text-xs font-black text-slate-700 outline-none focus:ring-0 w-28 uppercase" 
                    />
                  </div>
                </div>
                
                <ArrowRightLeft className="w-3.5 h-3.5 text-slate-300" />
                
                <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">To</span>
                  <div className="relative">
                    <Calendar className="absolute left-0 top-1/2 -translate-y-1/2 w-3 h-3 text-rose-500 pointer-events-none" />
                    <input 
                      type="date" 
                      value={endDate} 
                      onChange={(e) => setEndDate(e.target.value)} 
                      className="pl-5 bg-transparent border-none p-0 text-xs font-black text-slate-700 outline-none focus:ring-0 w-28 uppercase" 
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          <div className="bg-emerald-50 p-6 rounded-[2rem] border border-emerald-100 group transition-all hover:shadow-lg hover:shadow-emerald-100/50"><p className="text-[10px] font-black text-emerald-600 tracking-widest mb-1.5 capitalize">Opening Balance</p><p className="text-xl font-black text-emerald-700 tracking-tighter">RS{formatCurrency(summary.openingBalance)}</p></div>
          <div className="bg-rose-50 p-6 rounded-[2rem] border border-rose-100 group transition-all hover:shadow-lg hover:shadow-rose-100/50"><p className="text-[10px] font-black text-rose-600 tracking-widest mb-1.5 capitalize">Period Outflow</p><p className="text-xl font-black text-rose-700 tracking-tighter">RS{formatCurrency(fullPeriodSummary.expense)}</p></div>
          <div className="bg-teal-50 p-6 rounded-[2rem] border border-teal-100 group transition-all hover:shadow-lg hover:shadow-teal-100/50"><p className="text-[10px] font-black text-teal-600 tracking-widest mb-1.5 capitalize">Period Savings</p><p className="text-xl font-black text-teal-700 tracking-tighter">RS{formatCurrency(fullPeriodSummary.savings)}</p></div>
          <div className="bg-blue-50 p-6 rounded-[2rem] border border-blue-100 group transition-all hover:shadow-lg hover:shadow-blue-100/50"><p className="text-[10px] font-black text-blue-600 tracking-widest mb-1.5 capitalize">Net Cash Flow</p><p className="text-xl font-black text-blue-700 tracking-tighter">RS{formatCurrency(fullPeriodSummary.net)}</p></div>
          <div className="bg-indigo-50 p-6 rounded-[2rem] border border-indigo-100 group transition-all hover:shadow-lg hover:shadow-indigo-100/50"><div className="flex items-center justify-between mb-1.5"><p className="text-[10px] font-black text-indigo-600 tracking-widest capitalize">Total Wealth</p><Landmark className="w-3.5 h-3.5 text-indigo-400" /></div><p className="text-xl font-black text-indigo-700 tracking-tighter">RS{formatCurrency(summary.currentBalance + summary.totalSavings)}</p></div>
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
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={120} tick={{ fontSize: 10, fontStyle: 'normal', fontWeight: 900, fill: '#64748b' }} />
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
              <h3 className="text-xl font-black text-slate-800 tracking-tight capitalize">Financial Ledger (Live)</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 capitalize">True Running Balance Accounting</p>
            </div>
          </div>
          <div className="bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-sm"><span className="text-[10px] font-black text-slate-500 uppercase tracking-widest capitalize">{periodTransactions.length} Verified Entries</span></div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-slate-50 text-[10px] uppercase tracking-widest text-slate-500 font-black border-b border-slate-200 capitalize">
                <th className="px-8 py-5">Value Date</th>
                <th className="px-8 py-5">Category Context</th>
                <th className="px-8 py-5">Note / Details</th>
                <th className="px-8 py-5 text-right">Inflow/Outflow</th>
                <th className="px-8 py-5 text-right">Cash in Hand</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-xs">
              {ledgerData.map((row: LedgerDay) => (
                <tr key={row.date} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-8 py-5 font-bold text-slate-400 group-hover:text-slate-800 transition-colors">{row.date}</td>
                  <td className="px-8 py-5 font-black text-slate-800 uppercase tracking-tight capitalize">Day Summary</td>
                  <td className="px-8 py-5 italic text-slate-500 capitalize">Accumulated daily activity</td>
                  <td className={`px-8 py-5 text-right font-black text-sm tracking-tight ${(row.income - row.expenses - row.savings) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {(row.income - row.expenses - row.savings) >= 0 ? '+' : ''}RS{formatCurrency(row.income - row.expenses - row.savings)}
                  </td>
                  <td className="px-8 py-5 text-right">
                    <span className="bg-slate-100 text-slate-900 px-4 py-1.5 rounded-full font-black tabular-nums border border-slate-200">
                      RS{formatCurrency(row.available)}
                    </span>
                  </td>
                </tr>
              ))}
              {ledgerData.length === 0 && (
                <tr><td colSpan={5} className="py-24 text-center"><div className="flex flex-col items-center gap-4 opacity-10"><TrendingDown className="w-16 h-16" /><p className="text-sm font-black uppercase tracking-[0.2em] capitalize">Zero Transactions Found For Criteria</p></div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReportView;
