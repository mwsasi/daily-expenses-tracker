
import React, { useState, useEffect } from 'react';
import { Sparkles, Loader2, RefreshCw, Key, ExternalLink, AlertCircle } from 'lucide-react';
import { Transaction } from '../types';
import { getFinancialInsights } from '../services/geminiService';

interface AIAssistantProps {
  transactions: Transaction[];
}

const AIAssistant: React.FC<AIAssistantProps> = ({ transactions }) => {
  const [insights, setInsights] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [isQuotaError, setIsQuotaError] = useState<boolean>(false);

  const fetchInsights = async () => {
    if (transactions.length === 0) return;
    setLoading(true);
    setIsQuotaError(false);
    
    const result = await getFinancialInsights(transactions);
    setInsights(result.text);
    if (result.isQuotaError) {
      setIsQuotaError(true);
    }
    setLoading(false);
  };

  const handleSelectKey = async () => {
    if (window.aistudio?.openSelectKey) {
      await window.aistudio.openSelectKey();
      // Assume success and retry
      fetchInsights();
    }
  };

  useEffect(() => {
    if (transactions.length > 0 && !insights) {
      fetchInsights();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions.length]);

  return (
    <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[2.5rem] p-6 md:p-8 text-white shadow-2xl shadow-indigo-500/30 relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-1000">
        <Sparkles className="w-24 h-24" aria-hidden="true" />
      </div>
      
      <div className="relative z-10 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-2.5 rounded-2xl backdrop-blur-md border border-white/10">
              <Sparkles className="w-5 h-5 text-indigo-200" aria-hidden="true" />
            </div>
            <div>
              <h3 className="font-black text-lg md:text-xl tracking-tight capitalize">SpendWise AI Core</h3>
              <p className="text-[10px] text-indigo-200 font-black uppercase tracking-widest mt-0.5 opacity-60">Neural Financial Advisor</p>
            </div>
          </div>
          <button 
            onClick={fetchInsights}
            disabled={loading || transactions.length === 0}
            aria-label="Refresh AI insights"
            className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all disabled:opacity-30 active:scale-90 border border-white/5"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" /> : <RefreshCw className="w-5 h-5" aria-hidden="true" />}
          </button>
        </div>

        <div className="bg-white/5 backdrop-blur-xl rounded-[2rem] p-6 border border-white/10 shadow-inner">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 gap-4" aria-live="polite">
              <div className="relative">
                <div className="absolute inset-0 bg-indigo-400 blur-xl opacity-20 animate-pulse rounded-full" />
                <Loader2 className="w-10 h-10 animate-spin text-white relative" />
              </div>
              <p className="text-xs font-black text-indigo-100 animate-pulse text-center capitalize tracking-wider uppercase">Decoding Financial Metadata...</p>
            </div>
          ) : (
            <div className="prose prose-invert prose-sm max-w-none animate-in fade-in duration-700">
               {isQuotaError ? (
                 <div className="space-y-6 py-4">
                   <div className="flex gap-4">
                     <AlertCircle className="w-6 h-6 text-rose-300 shrink-0" />
                     <p className="text-sm font-bold text-indigo-50 leading-relaxed">
                       {insights}
                     </p>
                   </div>
                   
                   <div className="flex flex-col gap-3">
                     <button 
                        onClick={handleSelectKey}
                        className="flex items-center justify-center gap-2 bg-white text-indigo-700 px-6 py-4 rounded-2xl font-black text-sm hover:bg-indigo-50 transition-all active:scale-95 shadow-xl"
                     >
                       <Key className="w-4 h-4" />
                       Select Personal API Key
                     </button>
                     
                     <a 
                       href="https://ai.google.dev/gemini-api/docs/billing" 
                       target="_blank" 
                       rel="noopener noreferrer"
                       className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-200 hover:text-white transition-colors"
                     >
                       <ExternalLink className="w-3 h-3" />
                       View Billing Documentation
                     </a>
                   </div>
                 </div>
               ) : insights ? (
                 <div className="whitespace-pre-wrap text-indigo-50 leading-relaxed font-bold tracking-tight text-sm">
                   {insights}
                 </div>
               ) : (
                 <div className="flex flex-col items-center py-8 gap-4 opacity-50">
                    <RefreshCw className="w-12 h-12 stroke-[1px]" aria-hidden="true" />
                    <p className="text-xs font-black text-indigo-200 text-center capitalize tracking-widest uppercase">Awaiting Wealth Movement Data</p>
                 </div>
               )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
