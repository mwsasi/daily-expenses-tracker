
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
  PiggyBank, 
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
  Users
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
  PiggyBank, 
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
  Users
};

export const DEFAULT_CATEGORIES: CategoryConfig[] = [
  { id: 'opening_balance', name: 'Opening Balance', iconName: 'Wallet', color: 'bg-blue-500', type: TransactionType.INCOME },
  { id: 'daily_income', name: 'Daily Income', iconName: 'PlusCircle', color: 'bg-emerald-500', type: TransactionType.INCOME },
  { id: 'fuel', name: 'Fuel', iconName: 'Fuel', color: 'bg-orange-500', type: TransactionType.EXPENSE },
  { id: 'bike_repair', name: 'Bike Repair', iconName: 'Wrench', color: 'bg-red-500', type: TransactionType.EXPENSE },
  { id: 'food', name: 'Food', iconName: 'Utensils', color: 'bg-amber-600', type: TransactionType.EXPENSE },
  { id: 'tea', name: 'Tea', iconName: 'Coffee', color: 'bg-yellow-600', type: TransactionType.EXPENSE },
  { id: 'mobile_topup', name: 'Mobile Topup', iconName: 'Smartphone', color: 'bg-purple-500', type: TransactionType.EXPENSE },
  { id: 'internet_topup', name: 'Internet Topup', iconName: 'Globe', color: 'bg-indigo-500', type: TransactionType.EXPENSE },
  { id: 'parcel', name: 'Parcel', iconName: 'Package', color: 'bg-cyan-600', type: TransactionType.EXPENSE },
  { id: 'bike', name: 'Bike', iconName: 'Bike', color: 'bg-slate-700', type: TransactionType.EXPENSE },
  { id: 'buy_accessories', name: 'Buy Accessories', iconName: 'ShoppingBag', color: 'bg-rose-500', type: TransactionType.EXPENSE },
  { id: 'savings', name: 'Savings', iconName: 'PiggyBank', color: 'bg-teal-500', type: TransactionType.SAVINGS },
  { id: 'others', name: 'Others', iconName: 'MoreHorizontal', color: 'bg-gray-500', type: TransactionType.EXPENSE },
];

export const getCategoryConfig = (name: string, customCategories: CategoryConfig[] = []) => {
  const all = [...DEFAULT_CATEGORIES, ...customCategories];
  return all.find(c => c.name === name) || all[all.length - 1];
};

export const COLOR_OPTIONS = [
  'bg-blue-500', 'bg-emerald-500', 'bg-orange-500', 'bg-red-500', 'bg-amber-600', 
  'bg-yellow-600', 'bg-purple-500', 'bg-indigo-500', 'bg-cyan-600', 'bg-slate-700', 
  'bg-rose-500', 'bg-teal-500', 'bg-gray-500', 'bg-pink-500', 'bg-violet-600'
];
