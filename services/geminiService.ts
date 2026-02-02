
import { GoogleGenAI } from "@google/genai";
import { Transaction } from "../types";

export const getFinancialInsights = async (transactions: Transaction[]): Promise<string> => {
  if (transactions.length === 0) return "Add some transactions to get AI-powered financial insights!";

  try {
    // Create a new instance right before use to ensure the latest API key is used
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const summary = transactions.map(t => `${t.date}: ${t.type} - ${t.category}: $${t.amount} (${t.note})`).join('\n');

    // Use gemini-3-flash-preview for basic text tasks like summarization and insights
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a professional financial advisor. Analyze the following daily transactions and provide 3-4 concise, actionable insights to help the user save money, improve their spending habits, or better manage their bike-related expenses. Focus on patterns and specific categories like Fuel, Repairs, and Savings.

      Transactions:
      ${summary}`,
      config: {
        temperature: 0.7,
        // When setting maxOutputTokens, include a thinkingBudget to reserve tokens for output
        maxOutputTokens: 500,
        thinkingConfig: { thinkingBudget: 100 },
      }
    });

    // Directly access .text property from GenerateContentResponse
    return response.text || "I'm unable to provide insights right now. Keep tracking your expenses!";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error generating insights. Please try again later.";
  }
};
