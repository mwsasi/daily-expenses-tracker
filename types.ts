
export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
  SAVINGS = 'SAVINGS'
}

export type Category = string;

export interface CategoryConfig {
  id: string;
  name: string;
  iconName: string;
  color: string;
  type: TransactionType;
  isCustom?: boolean;
}

export interface Transaction {
  id: string;
  date: string;
  type: TransactionType;
  category: Category;
  amount: number;
  note: string;
  // Optional account property for tracking savings bank/account
  account?: string;
}

export interface Budget {
  category: Category;
  amount: number;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number; // Optional manual override or initial amount
  deadline?: string;
  color: string;
  iconName: string;
  linkedAccount?: string; // If specific to a bank
}

export interface DailySummary {
  openingBalance: number;
  totalIncome: number;
  totalExpenses: number;
  currentBalance: number;
  totalBudget: number;
  cumulativeIncome: number;
  todayExpenses?: number;
  todayIncome?: number;
  // totalSavings field to track wealth reallocation
  totalSavings: number;
}

// Define the AIStudio interface for the global window object to match ambient definitions
export interface AIStudio {
  hasSelectedApiKey: () => Promise<boolean>;
  openSelectKey: () => Promise<void>;
}

// Extend the global Window interface for AI Studio environment
declare global {
  interface Window {
    // Making aistudio optional to match environmental definitions and resolve modifier conflict
    aistudio?: AIStudio;
  }
}
