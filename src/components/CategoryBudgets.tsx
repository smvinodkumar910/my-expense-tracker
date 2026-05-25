import React, { useState } from 'react';
import { Category, Expense } from '../types';
import { formatCurrency } from '../utils';
import { CategoryIcon } from './LucideIcon';
import { 
  Sliders, 
  HelpCircle, 
  DollarSign, 
  CheckCircle2, 
  AlertTriangle, 
  Flame, 
  PlusCircle, 
  Edit3, 
  Save, 
  X 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CategoryBudgetsProps {
  categories: Category[];
  expenses: Expense[];
  onUpdateBudget: (categoryId: string, limit: number | null) => void;
  overallBudgetLimit: number;
  onUpdateOverallBudget: (limit: number) => void;
}

export function CategoryBudgets({
  categories,
  expenses,
  onUpdateBudget,
  overallBudgetLimit,
  onUpdateOverallBudget,
}: CategoryBudgetsProps) {
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [tempLimitVal, setTempLimitVal] = useState<string>('');
  const [editingOverall, setEditingOverall] = useState<boolean>(false);
  const [tempOverallVal, setTempOverallVal] = useState<string>('');

  // Calculate actual spending per category
  const categorySpends = categories.reduce((acc, cat) => {
    const totalForCat = expenses
      .filter(e => e.categoryId === cat.id)
      .reduce((sum, e) => sum + e.amount, 0);
    acc[cat.id] = totalForCat;
    return acc;
  }, {} as Record<string, number>);

  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);

  // Overall limit percentage
  const overallSpentPercent = overallBudgetLimit > 0 ? (totalSpent / overallBudgetLimit) * 100 : 0;
  
  // Custom styling states for budget boundaries
  const getProgressStyles = (percent: number) => {
    if (percent >= 100) {
      return {
        barColor: 'bg-rose-500',
        textColor: 'text-rose-600',
        bgLight: 'bg-rose-50 border-rose-100',
        badge: {
          bg: 'bg-rose-100 text-rose-800 border-rose-200',
          text: 'Over Limit',
          icon: Flame,
        }
      };
    }
    if (percent >= 80) {
      return {
        barColor: 'bg-amber-500',
        textColor: 'text-amber-600',
        bgLight: 'bg-amber-50 border-amber-100',
        badge: {
          bg: 'bg-amber-100 text-amber-800 border-amber-200',
          text: 'Approaching Limit',
          icon: AlertTriangle,
        }
      };
    }
    return {
      barColor: 'bg-emerald-500',
      textColor: 'text-emerald-600',
      bgLight: 'bg-emerald-50/40 border-emerald-100/50',
      badge: {
        bg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        text: 'On Track',
        icon: CheckCircle2,
      }
    };
  };

  const overallTheme = getProgressStyles(overallSpentPercent);

  const startEditingCategory = (category: Category) => {
    setEditingCategoryId(category.id);
    setTempLimitVal(category.budgetLimit !== null ? String(category.budgetLimit) : '');
  };

  const saveCategoryBudget = (catId: string) => {
    const val = tempLimitVal.trim();
    if (val === '') {
      onUpdateBudget(catId, null);
    } else {
      const parsed = parseFloat(val);
      if (!isNaN(parsed) && parsed >= 0) {
        onUpdateBudget(catId, parsed);
      }
    }
    setEditingCategoryId(null);
  };

  const startEditingOverall = () => {
    setEditingOverall(true);
    setTempOverallVal(String(overallBudgetLimit));
  };

  const saveOverallBudget = () => {
    const val = tempOverallVal.trim();
    const parsed = parseFloat(val);
    if (!isNaN(parsed) && parsed > 0) {
      onUpdateOverallBudget(parsed);
    }
    setEditingOverall(false);
  };

  return (
    <div className="space-y-6" id="budgets-panel">
      
      {/* 1. Overall Monthly Limits Overview Card */}
      <div className={`rounded-2xl border p-6 transition-all duration-300 ${overallTheme.bgLight}`}>
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${overallTheme.badge.bg}`}>
                <overallTheme.badge.icon className="h-3.5 w-3.5" />
                {overallTheme.badge.text}
              </span>
            </div>
            <h3 className="text-xl font-extrabold text-slate-800 mt-1.5">Monthly Budget Limit</h3>
            <p className="text-xs text-slate-500 mt-1">Aggregate cap across all transaction types</p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {editingOverall ? (
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl shadow-xs border border-slate-200">
                <span className="text-sm font-bold text-slate-500 pl-2">$</span>
                <input
                  type="number"
                  value={tempOverallVal}
                  onChange={(e) => setTempOverallVal(e.target.value)}
                  className="w-24 px-1 py-1 text-sm font-bold border-0 bg-transparent text-slate-800 focus:ring-0 focus:outline-hidden"
                  placeholder="2000"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && saveOverallBudget()}
                  id="overall-budget-input"
                />
                <button
                  onClick={saveOverallBudget}
                  className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-lg cursor-pointer"
                  title="Save Limit"
                  id="save-overall-budget"
                >
                  <Save className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setEditingOverall(false)}
                  className="p-1 text-slate-400 hover:bg-slate-100 rounded-lg cursor-pointer"
                  title="Cancel"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 bg-white/70 backdrop-blur-md border border-slate-200/50 rounded-2xl px-4 py-2">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Limit</span>
                  <span className="text-base font-extrabold text-slate-800">{formatCurrency(overallBudgetLimit)}</span>
                </div>
                <button
                  onClick={startEditingOverall}
                  className="p-2 text-indigo-600 hover:bg-indigo-50/50 hover:text-indigo-700 rounded-xl transition cursor-pointer"
                  title="Modify Budget"
                  id="btn-edit-overall-budget"
                >
                  <Edit3 className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Aggregate Progress Slider Bar */}
        <div className="space-y-2 mt-4">
          <div className="flex justify-between text-xs font-semibold text-slate-600">
            <span>Spent: <strong className="text-slate-800 font-bold">{formatCurrency(totalSpent)}</strong></span>
            <span>{overallSpentPercent.toFixed(1)}% Filled</span>
          </div>

          <div className="h-3 w-full bg-slate-200/80 rounded-full overflow-hidden relative">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(overallSpentPercent, 100)}%` }}
              transition={{ duration: 0.5 }}
              className={`h-full rounded-full ${overallTheme.barColor}`}
            />
          </div>

          <div className="flex justify-between items-center pt-1.5 text-xs">
            {overallBudgetLimit >= totalSpent ? (
              <span className="text-slate-500">
                You have <strong className="text-slate-700 font-bold">{formatCurrency(overallBudgetLimit - totalSpent)}</strong> headroom left
              </span>
            ) : (
              <span className="text-rose-600 font-bold inline-flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                Budget exceeded by {formatCurrency(totalSpent - overallBudgetLimit)}! Consider curbing extra spend
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 2. Category specific Budget Progress bars */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Sliders className="h-5 w-5 text-indigo-600" />
            <span className="font-bold text-slate-800 text-sm">Category Budget Breakdown</span>
          </div>
          <span className="text-xs text-slate-400">Click the pencil icon to modify targets</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" id="category-budgets-grid">
          {categories.map((cat) => {
            const spend = categorySpends[cat.id] || 0;
            const limit = cat.budgetLimit;
            const hasLimit = limit !== null && limit > 0;
            const percent = hasLimit ? (spend / limit) * 100 : 0;
            const subTheme = getProgressStyles(percent);
            const isEditing = editingCategoryId === cat.id;

            return (
              <div 
                key={cat.id} 
                className="p-4 rounded-xl border border-slate-100 bg-slate-50/20 hover:bg-slate-50/50 transition-all space-y-3"
              >
                {/* Header row with Title and Icon */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 max-w-[70%]">
                    <div 
                      className="p-2 rounded-xl text-white shrink-0"
                      style={{ backgroundColor: cat.color }}
                    >
                      <CategoryIcon name={cat.icon} className="h-4 w-4" />
                    </div>
                    <span className="font-bold text-slate-800 text-xs truncate">
                      {cat.name}
                    </span>
                  </div>

                  {/* Limit input section */}
                  <div>
                    {isEditing ? (
                      <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200">
                        <span className="text-xs text-slate-400">$</span>
                        <input
                          type="number"
                          value={tempLimitVal}
                          onChange={(e) => setTempLimitVal(e.target.value)}
                          className="w-16 px-0.5 py-0.5 text-xs font-bold border-0 bg-transparent text-slate-800 focus:ring-0 focus:outline-hidden"
                          placeholder="No limit"
                          autoFocus
                          onKeyDown={(e) => e.key === 'Enter' && saveCategoryBudget(cat.id)}
                          id={`input-limit-${cat.id}`}
                        />
                        <button
                          onClick={() => saveCategoryBudget(cat.id)}
                          className="p-0.5 text-emerald-600 hover:bg-emerald-50 rounded cursor-pointer"
                          title="Save"
                          id={`save-limit-${cat.id}`}
                        >
                          <Save className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 bg-slate-100 py-1 px-2 rounded-lg">
                        <span className="text-xs font-bold text-slate-700">
                          {hasLimit ? formatCurrency(limit).split('.')[0] : 'Unlimited'}
                        </span>
                        <button
                          onClick={() => startEditingCategory(cat)}
                          className="p-0.5 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
                          title="Set Limit"
                          id={`btn-edit-limit-${cat.id}`}
                        >
                          <Edit3 className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Progress bar visual and secondary items */}
                {hasLimit ? (
                  <div className="space-y-1.5">
                    {/* Visual meter */}
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden relative">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(percent, 100)}%` }}
                        transition={{ duration: 0.5 }}
                        className={`h-full rounded-full ${subTheme.barColor}`}
                      />
                    </div>
                    {/* Footnote text */}
                    <div className="flex justify-between items-center text-[10px] font-medium text-slate-500">
                      <span>Spent: <strong>{formatCurrency(spend)}</strong></span>
                      {spend <= limit ? (
                        <span className="text-slate-500 shrink-0">
                          {formatCurrency(limit - spend).split('.')[0]} left
                        </span>
                      ) : (
                        <span className="text-rose-500 shrink-0 font-bold">
                          +{formatCurrency(spend - limit).split('.')[0]} over
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="pt-1.5 flex items-center justify-between text-[10px] text-slate-400 font-medium">
                    <span>Spent: <strong className="text-slate-600">{formatCurrency(spend)}</strong></span>
                    <span className="italic">No cap enforced</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
