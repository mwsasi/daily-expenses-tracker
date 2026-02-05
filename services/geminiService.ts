import { GoogleGenAI } from "@google/genai";
import { Transaction } from "../types";

// Simple In-Memory Cache And Throttle
let lastCallTime = 0;
const THROTTLE_MS = 60000; // 1 Minute Throttle To Save Quota

export const getFinancialInsights = async (transactions: Transaction[]): Promise<string> => {
  if (transactions.length === 0) return "Add Some Transactions To Get Ai-Powered Financial Insights!";

  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    return "Ai Insights Require An Api Key. Please Configure The Api_Key Environment Variable In Your Deployment Settings.";
  }

  const now = Date.now();
  if (now - lastCallTime < THROTTLE_MS) {
    return "Insights Are Generated Periodically. Please Wait A Minute Before Requesting A Fresh Analysis.";
  }

  try {
    // Initialize GoogleGenAI using process.env.API_KEY directly as a named parameter as per guidelines
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const sortedTxs = [...transactions].sort((a, b) => b.date.localeCompare(a.date));
    const recentSummary = sortedTxs.slice(0, 50).map(t => 
      `${t.date}: ${t.type} - ${t.category}: Rs ${t.amount} (${t.note})`
    ).join('\n');

    // Use 'gemini-3-pro-preview' for complex financial reasoning tasks
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
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
        // Omitting maxOutputTokens and thinkingConfig to allow optimal reasoning and complete responses
      }
    });

    lastCallTime = Date.now();
    // Access response.text as a property (not a method)
    return response.text || "I'm Unable To Analyze Your Trends Right Now. Keep Tracking To Build More History!";
  } catch (error: any) {
    console.error("Gemini Error:", error);
    
    // Comprehensive Quota And Rate Limit Detection
    const errorStr = JSON.stringify(error).toLowerCase();
    if (
      errorStr.includes('429') || 
      errorStr.includes('resource_exhausted') || 
      errorStr.includes('quota') || 
      errorStr.includes('limit')
    ) {
      return "Ai Quota Exceeded: The Free Insight Limit Has Been Reached For Today. This Service Resets Daily. Your Local Charts, Reports, And Data Tracking Are Still Fully Functional!";
    }
    
    return "The Financial Ai Engine Is Currently Resting. Please Try Again Later.";
  }
};