import React, { useState, useEffect } from 'react';
import { Sparkles, Loader2, RefreshCw } from 'lucide-react';
import { Transaction } from '../types';
import { getFinancialInsights } from '../services/geminiService';

interface AIAssistantProps {
  transactions: Transaction[];
}

const AIAssistant: React.FC<AIAssistantProps> = ({ transactions }) => {
  const [insights, setInsights] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const fetchInsights = async () => {
    if (transactions.length === 0) return;
    setLoading(true);
    const result = await getFinancialInsights(transactions);
    setInsights(result);
    setLoading(false);
  };

  useEffect(() => {
    if (transactions.length > 0 && !insights) {
      fetchInsights();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions.length]);

  return (
    <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-8 opacity-10">
        <Sparkles className="w-24 h-24" />
      </div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-200" />
            <h3 className="font-bold text-lg capitalize">SpendWise AI Insights</h3>
          </div>
          <button 
            onClick={fetchInsights}
            disabled={loading || transactions.length === 0}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-6 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-200" />
            <p className="text-sm text-indigo-100 animate-pulse text-center capitalize">Analyzing Your Spending Habits...</p>
          </div>
        ) : (
          <div className="prose prose-invert prose-sm max-w-none">
             {insights ? (
               <div className="whitespace-pre-wrap text-indigo-50 leading-relaxed font-medium">
                 {insights}
               </div>
             ) : (
               <p className="text-indigo-200 italic capitalize">Add Transactions To See AI Recommendations For Your Finances.</p>
             )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AIAssistant;