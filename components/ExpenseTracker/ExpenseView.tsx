import React, { useState, useMemo } from 'react';
import { Transaction, ExpenseSummary } from '../../types';
import { parseExpenseText, getSpendingInsights } from '../../services/geminiService';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { Upload, Plus, Search, Sparkles, Filter, MoreHorizontal, ArrowUpRight, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface ExpenseViewProps {
  transactions: Transaction[];
  onAddTransaction: (t: Transaction) => void;
  onBulkAdd: (ts: Transaction[]) => void;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const ExpenseView: React.FC<ExpenseViewProps> = ({ transactions, onAddTransaction, onBulkAdd }) => {
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [insight, setInsight] = useState<string | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);

  // Derivations
  const totalSpent = useMemo(() => transactions.reduce((acc, t) => acc + t.amount, 0), [transactions]);
  
  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    transactions.forEach(t => {
      map[t.category] = (map[t.category] || 0) + t.amount;
    });
    return Object.entries(map).map(([name, value], idx) => ({
      name, value, color: COLORS[idx % COLORS.length]
    }));
  }, [transactions]);

  const handleImport = async () => {
    if (!importText.trim()) return;
    setIsProcessing(true);
    try {
      const parsed = await parseExpenseText(importText);
      const newTransactions: Transaction[] = parsed.map(p => ({
        id: crypto.randomUUID(),
        date: p.date || new Date().toISOString().split('T')[0],
        merchant: p.merchant || 'Unknown',
        amount: p.amount || 0,
        category: p.category || 'Uncategorized',
        status: 'cleared',
        paymentMethod: p.paymentMethod,
        notes: p.notes
      }));
      onBulkAdd(newTransactions);
      setImportText('');
      setShowImport(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const generateInsights = async () => {
      setLoadingInsight(true);
      const text = await getSpendingInsights(transactions);
      setInsight(text);
      setLoadingInsight(false);
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
           <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Expenses</h1>
           <p className="text-gray-500 dark:text-gray-400 mt-1">Track, categorize, and analyze your spending.</p>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={() => setShowImport(true)}
                className="flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors shadow-sm text-sm font-medium"
            >
                <Sparkles size={16} /> AI Import
            </button>
            <button className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                <Plus size={20} className="text-gray-600 dark:text-gray-300"/>
            </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm transition-colors">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Spent (YTD)</h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">${totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            <div className="mt-4 flex items-center text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 w-fit px-2 py-1 rounded">
                <ArrowUpRight size={12} className="mr-1"/> +12% vs last month
            </div>
        </div>
         <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-between transition-colors">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Top Category</h3>
            <div className="mt-2">
                {categoryData.length > 0 ? (
                    <>
                         <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{categoryData.sort((a,b) => b.value - a.value)[0].name}</p>
                         <p className="text-sm text-gray-500 dark:text-gray-400">${categoryData.sort((a,b) => b.value - a.value)[0].value.toFixed(2)}</p>
                    </>
                ) : <p className="text-gray-400 italic">No data</p>}
            </div>
        </div>
         <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-6 rounded-xl border border-indigo-100 dark:border-indigo-900/50 shadow-sm relative overflow-hidden transition-colors">
            <h3 className="text-sm font-medium text-indigo-800 dark:text-indigo-300 flex items-center gap-2">
                <Sparkles size={14} /> AI Insights
            </h3>
            <div className="mt-2 text-sm text-indigo-900/80 dark:text-indigo-200/80 leading-relaxed min-h-[60px]">
                {loadingInsight ? (
                    <span className="animate-pulse">Analyzing transaction patterns...</span>
                ) : insight ? (
                     <div className="whitespace-pre-line">{insight}</div>
                ) : (
                    <button onClick={generateInsights} className="text-indigo-600 dark:text-indigo-400 hover:underline">
                        Generate insights based on your {transactions.length} transactions
                    </button>
                )}
            </div>
        </div>
      </div>

      {/* Main Content Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Transaction Table */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden transition-colors">
             <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                 <h2 className="font-semibold text-gray-800 dark:text-gray-200">Recent Transactions</h2>
                 <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                     <Search size={16} className="cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"/>
                     <Filter size={16} className="cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"/>
                 </div>
             </div>
             <div className="overflow-x-auto">
                 <table className="w-full text-sm text-left">
                     <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
                         <tr>
                             <th className="px-6 py-3 font-medium">Date</th>
                             <th className="px-6 py-3 font-medium">Merchant</th>
                             <th className="px-6 py-3 font-medium">Category</th>
                             <th className="px-6 py-3 font-medium text-right">Amount</th>
                         </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                         {transactions.slice().sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(t => (
                             <tr key={t.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors group">
                                 <td className="px-6 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">{format(parseISO(t.date), 'MMM dd, yyyy')}</td>
                                 <td className="px-6 py-3 font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                     {t.merchant}
                                 </td>
                                 <td className="px-6 py-3">
                                     <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                                         {t.category}
                                     </span>
                                 </td>
                                 <td className="px-6 py-3 text-right font-medium text-gray-900 dark:text-gray-100">
                                     ${t.amount.toFixed(2)}
                                 </td>
                             </tr>
                         ))}
                         {transactions.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
                                    No transactions found. Try the AI Import!
                                </td>
                            </tr>
                         )}
                     </tbody>
                 </table>
             </div>
        </div>

        {/* Charts */}
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm h-80 transition-colors">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4">Breakdown</h3>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={categoryData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                        >
                            {categoryData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip 
                            formatter={(value: number) => `$${value.toFixed(2)}`}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                    </PieChart>
                </ResponsiveContainer>
                 <div className="flex flex-wrap gap-2 justify-center mt-2">
                    {categoryData.map((c, i) => (
                        <div key={i} className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                            <span className="w-2 h-2 rounded-full" style={{ background: c.color }} /> {c.name}
                        </div>
                    ))}
                 </div>
            </div>
        </div>

      </div>

      {/* AI Import Modal */}
      {showImport && (
        <div className="fixed inset-0 bg-black/20 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden transition-colors">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <Sparkles className="text-purple-600" size={18} /> Import from Text
                    </h2>
                    <button onClick={() => setShowImport(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><X size={20}/></button>
                </div>
                <div className="p-6 space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Paste bank SMS, email notifications, or raw CSV text below. Gemini will automatically extract and categorize transactions.
                    </p>
                    <textarea 
                        className="w-full h-40 p-4 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none font-mono bg-gray-50 dark:bg-gray-900 dark:text-gray-200"
                        placeholder="e.g. Paid $12.50 at Starbucks on 10/24 for Coffee..."
                        value={importText}
                        onChange={(e) => setImportText(e.target.value)}
                    />
                </div>
                <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3 bg-gray-50/50 dark:bg-gray-800/50">
                    <button onClick={() => setShowImport(false)} className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">Cancel</button>
                    <button 
                        onClick={handleImport} 
                        disabled={isProcessing || !importText}
                        className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isProcessing ? (
                             <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> Processing...</>
                        ) : 'Extract Data'}
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseView;