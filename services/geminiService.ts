
import { GoogleGenAI } from "@google/genai";
import { Transaction } from "../types";

// Simple In-Memory Cache And Throttle
let lastCallTime = 0;
const THROTTLE_MS = 10000; // Reduced throttle for better UX

export const getFinancialInsights = async (transactions: Transaction[]): Promise<{ text: string; isQuotaError?: boolean }> => {
  if (transactions.length === 0) return { text: "Add Some Transactions To Get Ai-Powered Financial Insights!" };

  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    return { text: "Ai Insights Require An Api Key. Please Configure The Api_Key Environment Variable." };
  }

  const now = Date.now();
  if (now - lastCallTime < THROTTLE_MS) {
    return { text: "Analyzing your trends... Please wait a few seconds for the next update." };
  }

  try {
    // Instantiate right before call to ensure latest key is used from AI Studio context
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const currentMonth = new Date().toISOString().substring(0, 7);
    const monthTransactions = transactions.filter(t => t.date.startsWith(currentMonth));
    
    if (monthTransactions.length === 0) {
      return { text: `I don't see any activity for the current month yet. Once you start logging, I can provide specific insights for your current cycle!` };
    }

    const sortedTxs = [...monthTransactions].sort((a, b) => b.date.localeCompare(a.date));
    const recentSummary = sortedTxs.slice(0, 30).map(t => 
      `${t.date}: ${t.type} - ${t.category}: Rs ${t.amount} (${t.note})`
    ).join('\n');

    // Upgrade to gemini-3-pro-preview for complex reasoning task (financial analysis)
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `You are a professional financial advisor. Analyze the following financial activity specifically for the current month (${currentMonth}).
      
      TASK:
      1. Review the transactions for the current month provided below.
      2. Identify spending trends and patterns unique to this month.
      3. Analyze the savings growth specifically relative to this month's total income and total expenses.
      4. Provide 4 concise, actionable insights focused on:
         - Category spending spikes seen this month.
         - The current month's savings growth vs. expense ratio.
         - A "power move" to optimize liquidity.

      Current Month Transactions:
      ${recentSummary}`,
      config: {
        temperature: 0.7,
      }
    });

    lastCallTime = Date.now();
    // Use .text property to access content directly
    return { text: response.text || "I'm currently observing your spending. Add more data for a deeper analysis!" };
  } catch (error: any) {
    console.error("Gemini Error:", error);
    
    const errorStr = JSON.stringify(error).toLowerCase();
    const isQuota = errorStr.includes('429') || errorStr.includes('quota') || errorStr.includes('resource_exhausted');
    
    if (isQuota) {
      return { 
        text: "The AI engine quota has been exhausted. To continue with uninterrupted analysis, you can switch to your own paid API key.", 
        isQuotaError: true 
      };
    }
    
    return { text: "Financial AI is temporarily synchronizing. Please check back in a few minutes." };
  }
};
