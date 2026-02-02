
import React from 'react';
import { Download, FileSpreadsheet, Table } from 'lucide-react';
import { Transaction, DailySummary, TransactionType, Category } from '../types';

interface ReportViewProps {
  transactions: Transaction[];
  summary: DailySummary;
}

const ReportView: React.FC<ReportViewProps> = ({ transactions, summary }) => {
  const generateExcelXML = () => {
    if (transactions.length === 0) return;

    // Define the exact column order for the grid
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

    // Group transactions by date for the summary grid
    const transactionsByDate: Record<string, Record<string, number>> = {};
    // Fix: Explicitly provide the type argument to Set to ensure string[] type inference and resolve 'unknown[]' error
    const uniqueDates: string[] = [...new Set<string>(transactions.map(t => t.date))].sort();

    // Fix: Explicitly type 'date' and 'cat' to prevent indexing errors
    uniqueDates.forEach((date: string) => {
      transactionsByDate[date] = {};
      categoryOrder.forEach((cat: Category) => {
        transactionsByDate[date][cat] = transactions
          .filter(t => t.date === date && t.category === cat)
          .reduce((sum, t) => sum + t.amount, 0);
      });
    });

    // SpreadsheetML XML Content
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

 <Worksheet ss:Name="Daily Transactions (Cols)">
  <Table>
   <Column ss:Width="100"/> <!-- Label Column -->
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
    <Cell ss:StyleID="RowLabel"><Data ss:Type="String">Type</Data></Cell>
    ${transactions.map(t => `<Cell><Data ss:Type="String">${t.type}</Data></Cell>`).join('')}
   </Row>
   <Row>
    <Cell ss:StyleID="RowLabel"><Data ss:Type="String">Amount</Data></Cell>
    ${transactions.map(t => `<Cell ss:StyleID="Currency"><Data ss:Type="Number">${t.amount}</Data></Cell>`).join('')}
   </Row>
   <Row>
    <Cell ss:StyleID="RowLabel"><Data ss:Type="String">Note</Data></Cell>
    ${transactions.map(t => `<Cell><Data ss:Type="String">${t.note}</Data></Cell>`).join('')}
   </Row>
  </Table>
 </Worksheet>

 <Worksheet ss:Name="Monthly Summary (Dates)">
  <Table>
   <Column ss:Width="100"/> <!-- Date -->
   ${categoryOrder.map(() => `<Column ss:Width="110"/>`).join('')}
   
   <Row ss:StyleID="BoldHeader">
    <Cell><Data ss:Type="String">Date</Data></Cell>
    ${categoryOrder.map(cat => `<Cell><Data ss:Type="String">${cat}</Data></Cell>`).join('')}
   </Row>`;

    // Fix: Explicitly type 'date' in the loop generating XML rows
    uniqueDates.forEach((date: string) => {
      xml += `
   <Row>
    <Cell ss:StyleID="DateStyle"><Data ss:Type="String">${date}</Data></Cell>`;
      categoryOrder.forEach((cat: Category) => {
        // Fix: Use explicitly typed 'date' and 'cat' for indexing transactionsByDate
        const amt = transactionsByDate[date][cat] || 0;
        xml += `<Cell ss:StyleID="Currency"><Data ss:Type="Number">${amt}</Data></Cell>`;
      });
      xml += `
   </Row>`;
    });

    // Totals Row
    xml += `
   <Row ss:StyleID="TotalRow">
    <Cell><Data ss:Type="String">GRAND TOTAL</Data></Cell>`;
    categoryOrder.forEach(cat => {
      const total = transactions
        .filter(t => t.category === cat)
        .reduce((sum, t) => sum + t.amount, 0);
      xml += `<Cell ss:StyleID="Currency"><Data ss:Type="Number">${total}</Data></Cell>`;
    });
    xml += `
   </Row>
   
   <Row></Row>
   <Row>
    <Cell ss:StyleID="RowLabel"><Data ss:Type="String">Final Summary</Data></Cell>
   </Row>
   <Row>
    <Cell><Data ss:Type="String">Total Income</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${summary.totalIncome}</Data></Cell>
   </Row>
   <Row>
    <Cell><Data ss:Type="String">Total Expenses</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${summary.totalExpenses}</Data></Cell>
   </Row>
   <Row>
    <Cell ss:StyleID="RowLabel"><Data ss:Type="String">Available Balance</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${summary.currentBalance}</Data></Cell>
   </Row>
  </Table>
 </Worksheet>
</Workbook>`;

    const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `SpendWise_GridReport_${new Date().toISOString().split('T')[0]}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const categoryTotals = transactions.reduce((acc, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
    return acc;
  }, {} as Record<string, number>);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat(undefined, { minimumFractionDigits: 2 }).format(val);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Advanced Excel Reporting</h2>
          <p className="text-sm text-slate-500">Daily grid summary and column-wise transaction logging.</p>
        </div>
        <button
          onClick={generateExcelXML}
          disabled={transactions.length === 0}
          className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-emerald-200 disabled:opacity-50"
        >
          <FileSpreadsheet className="w-5 h-5" />
          Export Grid-Wise Excel (.xls)
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Category Breakdown Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
            <Table className="w-5 h-5 text-slate-400" />
            <h3 className="font-semibold text-slate-700">Monthly Stats</h3>
          </div>
          <div className="p-0 overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 text-[10px] uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-3 font-bold">Category</th>
                  <th className="px-6 py-3 font-bold text-right">Total (Rs)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {Object.entries(categoryTotals).sort((a, b) => a[0].localeCompare(b[0])).map(([category, amount]) => (
                  <tr key={category} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-slate-700">{category}</td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-900 text-right">Rs {formatCurrency(amount as number)}</td>
                  </tr>
                ))}
                {Object.keys(categoryTotals).length === 0 && (
                  <tr>
                    <td colSpan={2} className="px-6 py-10 text-center text-slate-400 text-sm">No data recorded.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Global Summary Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
            <Download className="w-5 h-5 text-slate-400" />
            <h3 className="font-semibold text-slate-700">Financial Snapshot</h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-slate-50">
              <span className="text-sm text-slate-600">Opening Balance</span>
              <span className="font-bold text-slate-900">Rs {formatCurrency(summary.openingBalance)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-50">
              <span className="text-sm text-slate-600">Total Monthly Income</span>
              <span className="font-bold text-emerald-600">+Rs {formatCurrency(summary.totalIncome)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-50">
              <span className="text-sm text-slate-600">Total Monthly Expenses</span>
              <span className="font-bold text-rose-600">-Rs {formatCurrency(summary.totalExpenses)}</span>
            </div>
            <div className="flex flex-col gap-1 pt-4 mt-2 border-t-2 border-slate-100">
              <div className="flex justify-between items-center">
                <span className="text-base font-bold text-slate-800">Final Balance</span>
                <span className={`text-xl font-black ${summary.currentBalance >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  Rs {formatCurrency(summary.currentBalance)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportView;
