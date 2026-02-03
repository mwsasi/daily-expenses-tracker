
import React, { useMemo } from 'react';
import { Download, FileSpreadsheet, Table, CalendarDays, TrendingUp, TrendingDown, PieChart as PieChartIcon } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Transaction, DailySummary, TransactionType, Category } from '../types';
import { CATEGORY_CONFIG } from '../constants';

interface ReportViewProps {
  transactions: Transaction[];
  summary: DailySummary;
}

const ReportView: React.FC<ReportViewProps> = ({ transactions, summary }) => {
  const currentMonthStr = new Date().toISOString().substring(0, 7);
  const currentMonthName = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

  const tailwindColorToHex = (colorName: string) => {
    const map: Record<string, string> = {
      'blue-500': '#3b82f6',
      'emerald-500': '#10b981',
      'orange-500': '#f97316',
      'red-500': '#ef4444',
      'amber-600': '#d97706',
      'yellow-600': '#ca8a04',
      'purple-500': '#a855f7',
      'indigo-500': '#6366f1',
      'cyan-600': '#0891b2',
      'slate-700': '#334155',
      'rose-500': '#f43f5e',
      'teal-500': '#14b8a6',
      'gray-500': '#6b7280',
    };
    return map[colorName] || '#000000';
  };

  const currentMonthExpenseData = useMemo(() => {
    const filtered = transactions.filter(t => t.date.startsWith(currentMonthStr) && t.type === TransactionType.EXPENSE);
    const aggregated = filtered.reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
      return acc;
    }, {} as Record<string, number>);

    // Explicitly type entries and map/sort to avoid arithmetic errors on unknown types
    return Object.entries(aggregated).map(([name, value]) => ({
      name,
      value: value as number,
      color: tailwindColorToHex(CATEGORY_CONFIG[name as Category].color.replace('bg-', ''))
    })).sort((a: { value: number }, b: { value: number }) => b.value - a.value);
  }, [transactions, currentMonthStr]);

  const generateExcelXML = () => {
    if (transactions.length === 0) return;

    const categoryOrder: Category[] = [
      Category.OPENING_BALANCE,
      Category.DAILY_INCOME,
      Category.FUEL,
      Category.BIKE,
      Category.BIKE_REPAIR,
      Category.FOOD,
      Category.TEA,
      Category.MOBILE_TOPUP,
      Category.INTERNET_TOPUP,
      Category.PARCEL,
      Category.BUY_ACCESSORIES,
      Category.SAVINGS,
      Category.OTHERS
    ];

    const transactionsByDate: Record<string, Record<string, number>> = {};
    // Fix: Remove generic type argument if constructor is reported as untyped
    const uniqueDates: string[] = Array.from(new Set(transactions.map(t => t.date))).sort();

    uniqueDates.forEach((date: string) => {
      transactionsByDate[date] = {};
      categoryOrder.forEach((cat: Category) => {
        transactionsByDate[date][cat] = transactions
          .filter(t => t.date === date && t.category === cat)
          .reduce((sum, t) => sum + t.amount, 0);
      });
    });

    let xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="BoldHeader">
   <Font ss:Bold="1"/>
   <Interior ss:Color="#E2E8F0" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
   </Borders>
  </Style>
  <Style ss:ID="RowLabel">
   <Font ss:Bold="1"/>
   <Interior ss:Color="#F1F5F9" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="Currency">
   <NumberFormat ss:Format="&quot;Rs &quot;#,##0.00"/>
  </Style>
  <Style ss:ID="DateStyle">
   <Alignment ss:Horizontal="Center"/>
  </Style>
  <Style ss:ID="TotalRow">
   <Font ss:Bold="1"/>
   <Interior ss:Color="#CBD5E1" ss:Pattern="Solid"/>
  </Style>
 </Styles>

 <Worksheet ss:Name="Daily Transactions">
  <Table>
   <Column ss:Width="100"/>
   ${transactions.map(() => `<Column ss:Width="120"/>`).join('')}
   <Row>
    <Cell ss:StyleID="RowLabel"><Data ss:Type="String">Date</Data></Cell>
    ${transactions.map(t => `<Cell ss:StyleID="DateStyle"><Data ss:Type="String">${t.date}</Data></Cell>`).join('')}
   </Row>
   <Row>
    <Cell ss:StyleID="RowLabel"><Data ss:Type="String">Category</Data></Cell>
    ${transactions.map(t => `<Cell><Data ss:Type="String">${t.category}</Data></Cell>`).join('')}
   </Row>
   <Row>
    <Cell ss:StyleID="RowLabel"><Data ss:Type="String">Amount</Data></Cell>
    ${transactions.map(t => `<Cell ss:StyleID="Currency"><Data ss:Type="Number">${t.amount}</Data></Cell>`).join('')}
   </Row>
  </Table>
 </Worksheet>

 <Worksheet ss:Name="Monthly Summary">
  <Table>
   <Column ss:Width="100"/>
   ${categoryOrder.map(() => `<Column ss:Width="110"/>`).join('')}
   <Row ss:StyleID="BoldHeader">
    <Cell><Data ss:Type="String">Date</Data></Cell>
    ${categoryOrder.map(cat => `<Cell><Data ss:Type="String">${cat}</Data></Cell>`).join('')}
   </Row>`;

    uniqueDates.forEach((date: string) => {
      xml += `<Row><Cell ss:StyleID="DateStyle"><Data ss:Type="String">${date}</Data></Cell>`;
      categoryOrder.forEach((cat: Category) => {
        const amt = transactionsByDate[date][cat] || 0;
        xml += `<Cell ss:StyleID="Currency"><Data ss:Type="Number">${amt}</Data></Cell>`;
      });
      xml += `</Row>`;
    });

    xml += `
   <Row ss:StyleID="TotalRow">
    <Cell><Data ss:Type="String">GRAND TOTAL</Data></Cell>`;
    categoryOrder.forEach(cat => {
      const total = transactions
        .filter(t => t.category === cat)
        .reduce((sum, t) => sum + t.amount, 0);
      xml += `<Cell ss:StyleID="Currency"><Data ss:Type="Number">${total}</Data></Cell>`;
    });
    xml += `</Row></Table></Worksheet></Workbook>`;

    const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `SpendWise_Report_${new Date().toISOString().split('T')[0]}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const monthlyData = transactions.reduce<Record<string, { income: number, expense: number }>>((acc, curr) => {
    const month = curr.date.substring(0, 7);
    if (!acc[month]) {
      acc[month] = { income: 0, expense: 0 };
    }
    if (curr.type === TransactionType.INCOME) {
      acc[month].income += curr.amount;
    } else {
      acc[month].expense += curr.amount;
    }
    return acc;
  }, {});

  const sortedMonths = Object.keys(monthlyData).sort((a, b) => b.localeCompare(a));

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat(undefined, { minimumFractionDigits: 2 }).format(val);
  };

  const getMonthName = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    return new Date(parseInt(year), parseInt(month) - 1).toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Financial Reports</h2>
          <p className="text-sm text-slate-500">Analyze your spending and export data for external use.</p>
        </div>
        <button
          onClick={generateExcelXML}
          disabled={transactions.length === 0}
          className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-emerald-200 disabled:opacity-50"
        >
          <FileSpreadsheet className="w-5 h-5" />
          Export to Excel (.xls)
        </button>
      </div>

      {/* Monthly Performance Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
          <CalendarDays className="w-5 h-5 text-emerald-600" />
          <h3 className="font-bold text-slate-800">Monthly Performance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                <th className="px-6 py-4">Month</th>
                <th className="px-6 py-4 text-right">Income</th>
                <th className="px-6 py-4 text-right">Expenses</th>
                <th className="px-6 py-4 text-right">Net Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedMonths.map((month) => {
                const data = monthlyData[month] || { income: 0, expense: 0 };
                const net = data.income - data.expense;
                return (
                  <tr key={month} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-700">{getMonthName(month)}</td>
                    <td className="px-6 py-4 text-right text-emerald-600 font-bold">Rs {formatCurrency(data.income)}</td>
                    <td className="px-6 py-4 text-right text-rose-500 font-bold">Rs {formatCurrency(data.expense)}</td>
                    <td className={`px-6 py-4 text-right font-black ${net >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {net >= 0 ? '+' : ''}Rs {formatCurrency(net)}
                    </td>
                  </tr>
                );
              })}
              {sortedMonths.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">No monthly data available yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Visual Representation & Category Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Distribution Chart */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
            <PieChartIcon className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-slate-800">Expense Distribution: {currentMonthName}</h3>
          </div>
          <div className="p-6 h-[400px] flex-grow">
            {currentMonthExpenseData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={currentMonthExpenseData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {currentMonthExpenseData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [`Rs ${formatCurrency(value)}`, 'Amount']}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={80}
                    iconType="circle"
                    formatter={(value) => <span className="text-xs font-medium text-slate-600">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                <PieChartIcon className="w-12 h-12 opacity-20" />
                <p className="text-sm italic">No expenses recorded for {currentMonthName} yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Detailed Category Breakdown Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
            <Table className="w-5 h-5 text-slate-400" />
            <h3 className="font-semibold text-slate-700">All-Time Category Totals</h3>
          </div>
          <div className="overflow-y-auto max-h-[400px]">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 text-[10px] uppercase tracking-wider text-slate-500 sticky top-0 bg-white">
                  <th className="px-6 py-3 font-bold">Category</th>
                  <th className="px-6 py-3 font-bold text-right">Total (Rs)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {Object.entries(transactions.reduce((acc, curr) => {
                  acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
                  return acc;
                }, {} as Record<string, number>))
                  // Fix: Explicitly type entries to avoid arithmetic errors on unknown types
                  .sort((a: [string, number], b: [string, number]) => (b[1] as number) - (a[1] as number))
                  .map(([category, amount]) => (
                  <tr key={category} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-slate-700 flex items-center gap-3">
                       <div className={`w-2 h-2 rounded-full ${CATEGORY_CONFIG[category as Category].color}`} />
                       {category}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-900 text-right">Rs {formatCurrency(amount as number)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Overall Summary Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
          <Download className="w-5 h-5 text-slate-400" />
          <h3 className="font-semibold text-slate-700">Overall Totals</h3>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex justify-between items-center py-2 border-b border-slate-50">
            <span className="text-sm text-slate-600">Initial Opening Balance</span>
            <span className="font-bold text-slate-900">Rs {formatCurrency(summary.openingBalance)}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-slate-50">
            <span className="text-sm text-slate-600 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" /> Total Income
            </span>
            <span className="font-bold text-emerald-600">+Rs {formatCurrency(summary.totalIncome)}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-slate-50">
            <span className="text-sm text-slate-600 flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-rose-500" /> Total Expenses
            </span>
            <span className="font-bold text-rose-600">-Rs {formatCurrency(summary.totalExpenses)}</span>
          </div>
          <div className="flex flex-col gap-1 pt-4 mt-2 border-t-2 border-slate-100">
            <div className="flex justify-between items-center">
              <span className="text-base font-bold text-slate-800">Available Balance</span>
              <span className={`text-xl font-black ${summary.currentBalance >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                Rs {formatCurrency(summary.currentBalance)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportView;
