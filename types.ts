
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
}

export interface Budget {
  category: Category;
  amount: number;
}

export interface DailySummary {
  openingBalance: number;
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  currentBalance: number;
  totalBudget: number;
  cumulativeIncome: number;
  totalSavings: number;
  todayExpenses?: number;
  todayIncome?: number;
  todaySavings?: number;
}