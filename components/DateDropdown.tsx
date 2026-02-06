
import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, Check } from 'lucide-react';

export type DatePreset = 'all' | 'today' | 'yesterday' | 'last7' | 'thisMonth' | 'lastMonth' | 'thisYear' | 'custom';

const PRESETS: { id: DatePreset; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: 'last7', label: 'Last 7 Days' },
  { id: 'thisMonth', label: 'This Month' },
  { id: 'lastMonth', label: 'Last Month' },
  { id: 'thisYear', label: 'This Year' },
  { id: 'all', label: 'Full History' },
  { id: 'custom', label: 'Custom Range' },
];

interface DateDropdownProps {
  value: DatePreset;
  onChange: (preset: DatePreset) => void;
  className?: string;
  'aria-label'?: string;
}

const DateDropdown: React.FC<DateDropdownProps> = ({ value, onChange, className = "", "aria-label": ariaLabel }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentLabel = PRESETS.find(p => p.id === value)?.label || value;

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={ariaLabel || `Filter by period: ${currentLabel}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className="flex items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl px-4 py-2.5 min-w-[160px] text-[11px] font-black text-slate-700 hover:border-emerald-500 hover:bg-emerald-50/10 transition-all shadow-sm capitalize"
      >
        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
          <span>{currentLabel}</span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      {isOpen && (
        <div 
          role="listbox"
          className="absolute top-full right-0 md:left-0 mt-2 w-full min-w-[200px] bg-white border border-slate-100 rounded-2xl shadow-2xl z-[200] py-2 animate-in fade-in zoom-in-95 duration-200"
        >
          <div className="px-3 py-1 mb-1 border-b border-slate-50">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest capitalize">Select Period</span>
          </div>
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              role="option"
              aria-selected={value === preset.id}
              onClick={() => {
                onChange(preset.id);
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between px-4 py-2 text-[11px] font-bold text-left transition-colors capitalize ${
                value === preset.id ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>{preset.label}</span>
              {value === preset.id && <Check className="w-3.5 h-3.5" aria-hidden="true" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default DateDropdown;
