
export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE'
}

export enum Category {
  OPENING_BALANCE = 'Opening Balance',
  DAILY_INCOME = 'Daily Income',
  FUEL = 'Fuel',
  BIKE_REPAIR = 'Bike Repair',
  FOOD = 'Food',
  TEA = 'Tea',
  MOBILE_TOPUP = 'Mobile Topup',
  INTERNET_TOPUP = 'Internet Topup',
  PARCEL = 'Parcel',
  BIKE = 'Bike',
  BUY_ACCESSORIES = 'Buy Accessories',
  SAVINGS = 'Savings',
  OTHERS = 'Others'
}

export interface Transaction {
  id: string;
  date: string;
  type: TransactionType;
  category: Category;
  amount: number;
  note: string;
}

export interface DailySummary {
  openingBalance: number;
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  currentBalance: number;
}
