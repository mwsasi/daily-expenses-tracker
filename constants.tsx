
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
  MoreHorizontal
} from 'lucide-react';
import { Category, TransactionType } from './types';

export const CATEGORY_CONFIG: Record<Category, { icon: React.ReactNode; color: string; defaultType: TransactionType }> = {
  [Category.OPENING_BALANCE]: { icon: <Wallet className="w-5 h-5" />, color: 'bg-blue-500', defaultType: TransactionType.INCOME },
  [Category.DAILY_INCOME]: { icon: <PlusCircle className="w-5 h-5" />, color: 'bg-emerald-500', defaultType: TransactionType.INCOME },
  [Category.FUEL]: { icon: <Fuel className="w-5 h-5" />, color: 'bg-orange-500', defaultType: TransactionType.EXPENSE },
  [Category.BIKE_REPAIR]: { icon: <Wrench className="w-5 h-5" />, color: 'bg-red-500', defaultType: TransactionType.EXPENSE },
  [Category.FOOD]: { icon: <Utensils className="w-5 h-5" />, color: 'bg-amber-600', defaultType: TransactionType.EXPENSE },
  [Category.TEA]: { icon: <Coffee className="w-5 h-5" />, color: 'bg-yellow-600', defaultType: TransactionType.EXPENSE },
  [Category.MOBILE_TOPUP]: { icon: <Smartphone className="w-5 h-5" />, color: 'bg-purple-500', defaultType: TransactionType.EXPENSE },
  [Category.INTERNET_TOPUP]: { icon: <Globe className="w-5 h-5" />, color: 'bg-indigo-500', defaultType: TransactionType.EXPENSE },
  [Category.PARCEL]: { icon: <Package className="w-5 h-5" />, color: 'bg-cyan-600', defaultType: TransactionType.EXPENSE },
  [Category.BIKE]: { icon: <Bike className="w-5 h-5" />, color: 'bg-slate-700', defaultType: TransactionType.EXPENSE },
  [Category.BUY_ACCESSORIES]: { icon: <ShoppingBag className="w-5 h-5" />, color: 'bg-rose-500', defaultType: TransactionType.EXPENSE },
  [Category.SAVINGS]: { icon: <PiggyBank className="w-5 h-5" />, color: 'bg-teal-500', defaultType: TransactionType.EXPENSE },
  [Category.OTHERS]: { icon: <MoreHorizontal className="w-5 h-5" />, color: 'bg-gray-500', defaultType: TransactionType.EXPENSE },
};
