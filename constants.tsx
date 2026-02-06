
import React from 'react';
import { 
  Fuel, 
  Wrench, 
  Utensils, 
  Coffee, 
  Smartphone, 
  Globe, 
  Package, 
  Bike, 
  ShoppingBag, 
  PlusCircle, 
  Wallet,
  MoreHorizontal,
  Home,
  Briefcase,
  Heart,
  Gamepad,
  Music,
  Camera,
  Book,
  Car,
  Plane,
  Gift,
  Zap,
  Shield,
  Star,
  Activity,
  User,
  Users,
  PiggyBank
} from 'lucide-react';
import { CategoryConfig, TransactionType } from './types';

export const ICON_MAP: Record<string, React.ElementType> = {
  Fuel, 
  Wrench, 
  Utensils, 
  Coffee, 
  Smartphone, 
  Globe, 
  Package, 
  Bike, 
  ShoppingBag, 
  PlusCircle, 
  Wallet,
  MoreHorizontal,
  Home,
  Briefcase,
  Heart,
  Gamepad,
  Music,
  Camera,
  Book,
  Car,
  Plane,
  Gift,
  Zap,
  Shield,
  Star,
  Activity,
  User,
  Users,
  PiggyBank
};

export const DEFAULT_CATEGORIES: CategoryConfig[] = [
  { id: 'opening_balance', name: 'Opening Balance', iconName: 'Wallet', color: '#3b82f6', type: TransactionType.INCOME },
  { id: 'daily_income', name: 'Daily Income', iconName: 'PlusCircle', color: '#10b981', type: TransactionType.INCOME },
  { id: 'savings_default', name: 'Savings', iconName: 'PiggyBank', color: '#6366f1', type: TransactionType.SAVINGS },
  { id: 'fuel', name: 'Fuel', iconName: 'Fuel', color: '#f97316', type: TransactionType.EXPENSE },
  { id: 'bike', name: 'Bike', iconName: 'Bike', color: '#8b5cf6', type: TransactionType.EXPENSE },
  { id: 'bike_repair', name: 'Bike Repair', iconName: 'Wrench', color: '#ef4444', type: TransactionType.EXPENSE },
  { id: 'food', name: 'Food', iconName: 'Utensils', color: '#d97706', type: TransactionType.EXPENSE },
  { id: 'tea', name: 'Tea', iconName: 'Coffee', color: '#ca8a04', type: TransactionType.EXPENSE },
  { id: 'house_expenses', name: 'House Expenses', iconName: 'Home', color: '#2dd4bf', type: TransactionType.EXPENSE },
  { id: 'mobile_topup', name: 'Mobile Topup', iconName: 'Smartphone', color: '#a855f7', type: TransactionType.EXPENSE },
  { id: 'internet_topup', name: 'Internet Topup', iconName: 'Globe', color: '#6366f1', type: TransactionType.EXPENSE },
  { id: 'parcel', name: 'Parcel', iconName: 'Package', color: '#0891b2', type: TransactionType.EXPENSE },
  { id: 'buy_accessories', name: 'Buy Accessories', iconName: 'ShoppingBag', color: '#f43f5e', type: TransactionType.EXPENSE },
  { id: 'others', name: 'Others', iconName: 'MoreHorizontal', color: '#6b7280', type: TransactionType.EXPENSE },
];

export const getCategoryConfig = (name: string, customCategories: CategoryConfig[] = []) => {
  const all = [...DEFAULT_CATEGORIES, ...customCategories];
  return all.find(c => c.name === name) || all[all.length - 1];
};

export const PRESET_COLORS = [
  '#3b82f6', '#10b981', '#f97316', '#ef4444', '#d97706', 
  '#ca8a04', '#a855f7', '#6366f1', '#0891b2', '#334155', 
  '#f43f5e', '#14b8a6', '#6b7280', '#ec4899', '#7c3aed',
  '#2dd4bf', '#fbbf24', '#475569', '#1e293b', '#000000'
];
