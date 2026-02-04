
import React, { useState, useEffect } from 'react';
import { CategoryConfig, TransactionType } from '../types';
import { ICON_MAP, PRESET_COLORS, DEFAULT_CATEGORIES } from '../constants';
import { Plus, Trash2, Settings, Check, X, MoreHorizontal, Edit3, AlertTriangle, Palette } from 'lucide-react';

interface CategoryManagerProps {
  customCategories: CategoryConfig[];
  onAdd: (category: CategoryConfig) => void;
  onUpdate: (category: CategoryConfig) => void;
  onDelete: (id: string) => void;
}

const CategoryManager: React.FC<CategoryManagerProps> = ({ customCategories, onAdd, onUpdate, onDelete }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryConfig | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [iconName, setIconName] = useState('MoreHorizontal');
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingCategory) {
      setName(editingCategory.name);
      setType(editingCategory.type);
      setIconName(editingCategory.iconName);
      setColor(editingCategory.color);
      setIsAdding(true);
      setError(null);
    } else if (!isAdding) {
      setName('');
      setType(TransactionType.EXPENSE);
      setIconName('MoreHorizontal');
      setColor(PRESET_COLORS[0]);
      setError(null);
    }
  }, [editingCategory, isAdding]);

  const allCategories = [...DEFAULT_CATEGORIES, ...customCategories];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Check for duplicates
    const isDuplicate = allCategories.some(c => 
      c.id !== editingCategory?.id && 
      c.name.toLowerCase() === name.trim().toLowerCase()
    );

    if (isDuplicate) {
      setError("A category with this name already exists.");
      return;
    }
    
    if (editingCategory) {
      onUpdate({
        ...editingCategory,
        name: name.trim(),
        type,
        iconName,
        color
      });
      setEditingCategory(null);
    } else {
      onAdd({
        id: crypto.randomUUID(),
        name: name.trim(),
        type,
        iconName,
        color,
        isCustom: true
      });
    }
    
    setName('');
    setIsAdding(false);
    setError(null);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingCategory(null);
    setError(null);
  };

  const handleDelete = (cat: CategoryConfig) => {
    if (window.confirm(`Are you sure you want to delete "${cat.name}"? All existing transactions in this category will be moved to the default "${cat.type === TransactionType.INCOME ? 'Daily Income' : cat.type === TransactionType.SAVINGS ? 'Savings' : 'Others'}" category.`)) {
      onDelete(cat.id);
    }
  };

  return (
    <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-6 md:p-8 max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-slate-100 p-3 rounded-2xl text-slate-600">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 lowercase">category settings</h2>
            <p className="text-xs text-slate-500 font-bold lowercase">manage your custom income and expense categories.</p>
          </div>
        </div>
        {!isAdding && (
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl font-black hover:bg-emerald-700 transition-all text-sm shadow-lg shadow-emerald-100 lowercase"
          >
            <Plus className="w-4 h-4" /> add category
          </button>
        )}
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-slate-50 p-6 rounded-3xl border border-slate-200 space-y-6 animate-in fade-in zoom-in duration-300">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-black text-slate-800 lowercase">{editingCategory ? 'edit category' : 'create new category'}</h3>
            <button type="button" onClick={handleCancel} className="p-1 hover:bg-slate-200 rounded-lg text-slate-400 transition-colors active:scale-90">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-black text-slate-500 mb-2 lowercase tracking-widest">category name</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => { setName(e.target.value); setError(null); }}
                placeholder="gym, netflix, rent..."
                className={`w-full px-4 py-2 rounded-xl border ${error ? 'border-rose-500 bg-rose-50' : 'border-slate-200 bg-white'} focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-sm`}
                required
              />
              {error && (
                <p className="text-[10px] text-rose-500 font-bold mt-1.5 flex items-center gap-1 lowercase">
                  <AlertTriangle className="w-3 h-3" /> {error}
                </p>
              )}
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 mb-2 lowercase tracking-widest">transaction type</label>
              <div className="flex gap-2">
                {[TransactionType.EXPENSE, TransactionType.INCOME, TransactionType.SAVINGS].map(t => (
                  <button 
                    key={t}
                    type="button" 
                    onClick={() => setType(t)}
                    className={`flex-1 py-2 rounded-xl font-black text-[10px] border transition-all lowercase ${type === t ? (t === TransactionType.EXPENSE ? 'bg-rose-500 border-rose-500' : t === TransactionType.INCOME ? 'bg-emerald-500 border-emerald-500' : 'bg-teal-500 border-teal-500') + ' text-white shadow-lg' : 'bg-white text-slate-400 border-slate-200'}`}
                  >
                    {t.toLowerCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-500 mb-2 lowercase tracking-widest">select icon</label>
            <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2 h-32 overflow-y-auto p-2 bg-white border border-slate-200 rounded-xl scrollbar-hide">
              {Object.keys(ICON_MAP).map(icon => {
                const IconComp = ICON_MAP[icon];
                return (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setIconName(icon)}
                    className={`p-2 rounded-lg flex items-center justify-center transition-all ${iconName === icon ? 'bg-emerald-100 text-emerald-600 ring-2 ring-emerald-500 shadow-inner' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}
                  >
                    <IconComp className="w-5 h-5" />
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-[10px] font-black text-slate-500 lowercase tracking-widest">visual identity</label>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-bold text-slate-400 lowercase">pick custom color:</span>
                <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-slate-200 shadow-sm cursor-pointer active:scale-90 transition-transform">
                  <input 
                    type="color" 
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="absolute inset-0 w-full h-full scale-150 cursor-pointer"
                  />
                  <Palette className="absolute inset-0 m-auto w-3 h-3 text-white mix-blend-difference pointer-events-none" />
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2.5 p-3 bg-white border border-slate-200 rounded-2xl">
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  style={{ backgroundColor: c }}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${color === c ? 'ring-4 ring-slate-200 scale-110 shadow-lg' : 'hover:scale-105 opacity-80'}`}
                >
                  {color.toLowerCase() === c.toLowerCase() && <Check className="w-4 h-4 text-white drop-shadow-sm" />}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button 
              type="submit"
              className="flex-grow bg-slate-900 text-white py-4 rounded-2xl font-black hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 active:scale-[0.98] lowercase text-sm"
            >
              {editingCategory ? 'update category' : 'create category'}
            </button>
            <button 
              type="button" 
              onClick={handleCancel}
              className="px-8 py-4 bg-slate-200 text-slate-600 rounded-2xl font-black hover:bg-slate-300 transition-all active:scale-95 lowercase text-sm"
            >
              cancel
            </button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        <h3 className="font-black text-slate-400 text-[10px] uppercase tracking-[0.2em] flex items-center gap-2 lowercase">
          portfolio categories 
          <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-[9px] font-bold">{allCategories.length} total</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {allCategories.map(cat => {
            const IconComp = ICON_MAP[cat.iconName] || MoreHorizontal;
            return (
              <div key={cat.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl group hover:border-slate-300 transition-all shadow-sm">
                <div className="flex items-center gap-4">
                  <div 
                    style={{ backgroundColor: cat.color }} 
                    className="p-3 rounded-xl text-white shadow-md transition-transform group-hover:scale-110"
                  >
                    <IconComp className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-black text-slate-800 lowercase">{cat.name}</p>
                    <div className="flex items-center gap-2">
                      <span className={`text-[8px] uppercase font-black tracking-widest px-1.5 py-0.5 rounded-md lowercase ${cat.type === TransactionType.INCOME ? 'bg-emerald-50 text-emerald-600' : cat.type === TransactionType.SAVINGS ? 'bg-teal-50 text-teal-600' : 'bg-rose-50 text-rose-600'}`}>
                        {cat.type.toLowerCase()}
                      </span>
                      {cat.isCustom && (
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest lowercase">custom</span>
                      )}
                    </div>
                  </div>
                </div>
                {cat.isCustom && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => setEditingCategory(cat)}
                      className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all active:scale-90"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(cat)}
                      className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all active:scale-90"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CategoryManager;
