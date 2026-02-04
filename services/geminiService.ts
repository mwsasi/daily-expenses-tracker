
import { GoogleGenAI } from "@google/genai";
import { Transaction } from "../types";

// Simple in-memory cache and throttle
let lastCallTime = 0;
const THROTTLE_MS = 60000; // 1 minute throttle to save quota

export const getFinancialInsights = async (transactions: Transaction[]): Promise<string> => {
  if (transactions.length === 0) return "Add some transactions to get AI-powered financial insights!";

  const now = Date.now();
  if (now - lastCallTime < THROTTLE_MS) {
    return "Insights are generated periodically to preserve energy. Please wait a minute before requesting a fresh analysis.";
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Sort transactions by date to ensure the model sees the timeline correctly
    const sortedTxs = [...transactions].sort((a, b) => b.date.localeCompare(a.date));
    
    // Limit transaction context to keep it focused
    const recentSummary = sortedTxs.slice(0, 50).map(t => 
      `${t.date}: ${t.type} - ${t.category}: Rs ${t.amount} (${t.note})`
    ).join('\n');

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a professional financial advisor. Analyze the following financial activity.
      
      TASK:
      1. Review the recent transactions provided below.
      2. Identify spending trends and patterns.
      3. Provide 4 concise, actionable insights focused on:
         - Significant changes in category spending.
         - Savings growth vs. expense inflation.
         - One "power move" to improve net liquidity next month.

      Transactions:
      ${recentSummary}`,
      config: {
        temperature: 0.7,
        maxOutputTokens: 500,
        thinkingConfig: { thinkingBudget: 0 }, // Disable thinking for faster/cheaper response
      }
    });

    lastCallTime = Date.now();
    return response.text || "I'm unable to analyze your trends right now. Keep tracking to build more history!";
  } catch (error: any) {
    console.error("Gemini Error:", error);
    
    // Specific handling for Quota Exceeded
    if (error?.message?.includes('429') || error?.status === 429 || error?.message?.includes('quota')) {
      return "AI Quota Exceeded: You've reached the limit for free insights today. This typically resets in 24 hours. Your local data and charts are still fully functional!";
    }
    
    return "The financial AI engine is currently resting. Please try again later.";
  }
};
