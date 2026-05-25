import React, { useState, useEffect } from 'react';
import { Expense, Category } from '../types';
import { BUDGET_ICONS } from '../utils';
import { CategoryIcon } from './LucideIcon';
import { 
  Plus, 
  Tag, 
  Calendar, 
  DollarSign, 
  Heart, 
  PlusCircle, 
  Check, 
  CheckCircle, 
  X, 
  Settings, 
  Sparkles,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ExpenseFormProps {
  categories: Category[];
  onCreateExpense: (data: Omit<Expense, 'id'>) => void;
  onCreateCategory: (name: string, color: string, icon: string, limit: number | null) => void;
  editingExpense: Expense | null;
  onUpdateExpense: (expense: Expense) => void;
  onCancelEdit: () => void;
}

export function ExpenseForm({
  categories,
  onCreateExpense,
  onCreateCategory,
  editingExpense,
  onUpdateExpense,
  onCancelEdit,
}: ExpenseFormProps) {
  const [activeTab, setActiveTab] = useState<'expense' | 'category'>('expense');

  // Expense form state
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [date, setDate] = useState<string>('');

  // Category form state
  const [newCatName, setNewCatName] = useState<string>('');
  const [newCatColor, setNewCatColor] = useState<string>('#3b82f6'); // Default Blue
  const [newCatIcon, setNewCatIcon] = useState<string>('PiggyBank');
  const [newCatLimit, setNewCatLimit] = useState<string>('');

  // Default color presets for categories
  const PRESET_COLORS = [
    '#3b82f6', // blue
    '#0ea5e9', // sky
    '#10b981', // emerald
    '#22c55e', // green
    '#eab308', // yellow
    '#f97316', // orange
    '#ef4444', // red
    '#ec4899', // pink
    '#a855f7', // purple
    '#6366f1', // indigo
    '#64748b', // slate
  ];

  // Initialize input fields when active category layout changes or during editing
  useEffect(() => {
    if (editingExpense) {
      setAmount(String(editingExpense.amount));
      setDescription(editingExpense.description);
      setCategoryId(editingExpense.categoryId);
      setDate(editingExpense.date);
      setActiveTab('expense'); // Force toggle
    } else {
      resetExpenseForm();
    }
  }, [editingExpense]);

  // Set today's date if empty and not editing
  useEffect(() => {
    if (!editingExpense && !date) {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      setDate(`${yyyy}-${mm}-${dd}`);
    }
  }, [editingExpense]);

  const resetExpenseForm = () => {
    setAmount('');
    setDescription('');
    if (categories.length > 0) {
      setCategoryId(categories[0].id);
    }
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    setDate(`${yyyy}-${mm}-${dd}`);
  };

  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Please enter a valid expense amount greater than 0.');
      return;
    }
    if (!description.trim()) {
      alert('Please enter a description/merchant.');
      return;
    }
    if (!categoryId) {
      alert('Please choose or create a category first.');
      return;
    }

    if (editingExpense) {
      onUpdateExpense({
        ...editingExpense,
        amount: parsedAmount,
        description: description.trim(),
        categoryId,
        date,
      });
    } else {
      onCreateExpense({
        amount: parsedAmount,
        description: description.trim(),
        categoryId,
        date,
      });
      resetExpenseForm();
    }
  };

  const handleCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nameStr = newCatName.trim();
    if (!nameStr) {
      alert('Please enter a category name.');
      return;
    }

    // Check duplicate
    if (categories.some(c => c.name.toLowerCase() === nameStr.toLowerCase())) {
      alert('A category with that name already exists.');
      return;
    }

    let parsedLimit: number | null = null;
    if (newCatLimit.trim()) {
      const parsed = parseFloat(newCatLimit);
      if (!isNaN(parsed) && parsed >= 0) {
        parsedLimit = parsed;
      }
    }

    onCreateCategory(nameStr, newCatColor, newCatIcon, parsedLimit);
    
    // Clear state & swap tab
    setNewCatName('');
    setNewCatLimit('');
    setActiveTab('expense');
    
    // Auto-select the newly created category for convenience
    // This is handled downstream because we create a random slug id
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden" id="form-container">
      {/* Dynamic Action Tabs Header */}
      <div className="flex border-b border-slate-100 bg-slate-50/50 p-1">
        <button
          type="button"
          onClick={() => {
            if (!editingExpense) setActiveTab('expense');
          }}
          className={`flex-1 py-3 text-xs font-bold text-center transition-all rounded-lg cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'expense'
              ? 'bg-white text-indigo-700 shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          } ${editingExpense ? 'opacity-80' : ''}`}
          id="tab-add-expense"
        >
          <Plus className="h-4 w-4" />
          {editingExpense ? 'Modify Transaction' : 'Log Expense'}
        </button>
        <button
          type="button"
          disabled={!!editingExpense}
          onClick={() => setActiveTab('category')}
          className={`flex-1 py-3 text-xs font-bold text-center transition-all rounded-lg flex items-center justify-center gap-2 ${
            editingExpense ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
          } ${
            activeTab === 'category'
              ? 'bg-white text-indigo-700 shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
          id="tab-add-category"
        >
          <Tag className="h-4 w-4" />
          Create Category
        </button>
      </div>

      <div className="p-6">
        {activeTab === 'expense' ? (
          /* TRANSACTION ENTRY FORM */
          <form onSubmit={handleExpenseSubmit} className="space-y-4" id="expense-form">
            {/* Amount input */}
            <div>
              <label htmlFor="amount-input" className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                Amount (USD)
              </label>
              <div className="relative rounded-xl shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <DollarSign className="h-5 w-5 text-indigo-600" />
                </div>
                <input
                  type="number"
                  step="0.01"
                  required
                  id="amount-input"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="block w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 text-lg font-bold text-slate-800 placeholder-slate-400 bg-slate-50/20 focus:bg-white transition-all outline-hidden"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Description/Merchant input */}
            <div>
              <label htmlFor="description-input" className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                Description / Merchant
              </label>
              <input
                type="text"
                required
                id="description-input"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 text-sm font-semibold text-slate-800 placeholder-slate-400 bg-slate-50/20 focus:bg-white transition-all outline-hidden"
                placeholder="e.g., Whole Foods, Shell Gas, Rent..."
              />
            </div>

            {/* Row with Category & Date pickers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Category picker dropdown */}
              <div>
                <label htmlFor="category-select" className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                  Category
                </label>
                <select
                  id="category-select"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 text-sm font-semibold text-slate-800 bg-slate-50/20 focus:bg-white transition-all outline-hidden cursor-pointer"
                >
                  {categories.length === 0 ? (
                    <option value="">No categories available</option>
                  ) : (
                    categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Date selection field */}
              <div>
                <label htmlFor="date-input" className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                  Transaction Date
                </label>
                <div className="relative rounded-xl">
                  <input
                    type="date"
                    required
                    id="date-input"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 text-sm font-semibold text-slate-800 bg-slate-50/20 focus:bg-white transition-all outline-hidden cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Submit and modification buttons */}
            <div className="pt-2 flex gap-3">
              <button
                type="submit"
                className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition cursor-pointer flex items-center justify-center gap-2 hover:scale-[1.01]"
                id="btn-submit-expense"
              >
                {editingExpense ? 'Save Changes' : 'Confirm Spending'}
              </button>

              {editingExpense && (
                <button
                  type="button"
                  onClick={onCancelEdit}
                  className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs rounded-xl transition cursor-pointer"
                  id="btn-cancel-edit-expense"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        ) : (
          /* CUSTOM CATEGORY GENERATION FORM */
          <form onSubmit={handleCategorySubmit} className="space-y-4" id="category-form">
            {/* Category Name input */}
            <div>
              <label htmlFor="new-category-name" className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                Category Label Name
              </label>
              <input
                type="text"
                required
                id="new-category-name"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 text-sm font-semibold text-slate-800 placeholder-slate-400 bg-slate-50/20 focus:bg-white transition-all outline-hidden"
                placeholder="e.g., Subscriptions, Kids, Utilities..."
              />
            </div>

            {/* Category target Budget Limit (optional) */}
            <div>
              <label htmlFor="new-category-limit" className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                Monthly Target Budget Limit (Optional)
              </label>
              <div className="relative rounded-xl">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <DollarSign className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="number"
                  id="new-category-limit"
                  value={newCatLimit}
                  onChange={(e) => setNewCatLimit(e.target.value)}
                  className="block w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 text-sm font-semibold text-slate-800 placeholder-slate-400 bg-slate-50/20 focus:bg-white transition-all outline-hidden"
                  placeholder="Unlimited"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">If blank, unlimited monthly headroom will be assigned.</p>
            </div>

            {/* Custom Accent Color Palette selection Grid */}
            <div>
              <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">
                Brand Accent Color
              </label>
              <div className="flex flex-wrap gap-2.5 h-[36px] overflow-x-auto p-0.5" id="color-palette-grid">
                {PRESET_COLORS.map((color) => {
                  const isCurSelected = newCatColor === color;
                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewCatColor(color)}
                      style={{ backgroundColor: color }}
                      className={`h-7 w-7 rounded-lg cursor-pointer shrink-0 transition-transform relative ${
                        isCurSelected ? 'scale-110 shadow-md ring-3 ring-indigo-100' : 'hover:scale-105'
                      }`}
                      title={color}
                    >
                      {isCurSelected && (
                        <span className="absolute inset-0 flex items-center justify-center text-white">
                          <Check className="h-4 w-4" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dynamic Icon Picker list */}
            <div>
              <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">
                Identify Icon Symbol
              </label>
              <div className="grid grid-cols-8 gap-1.5 max-h-[105px] overflow-y-auto border border-slate-100 p-2.5 rounded-xl bg-slate-50/50" id="icon-picker-grid">
                {BUDGET_ICONS.map((iconName) => {
                  const isCurSelected = newCatIcon === iconName;
                  return (
                    <button
                      key={iconName}
                      type="button"
                      onClick={() => setNewCatIcon(iconName)}
                      className={`p-2 rounded-lg cursor-pointer flex items-center justify-center transition-all ${
                        isCurSelected
                          ? 'bg-slate-800 text-white shadow-xs'
                          : 'hover:bg-slate-200 text-slate-500 hover:text-slate-800'
                      }`}
                      title={iconName}
                    >
                      <CategoryIcon name={iconName} className="h-4 w-4" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Confirm Category button */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition hover:scale-[1.01] flex items-center justify-center gap-2 cursor-pointer"
                id="btn-submit-category"
              >
                <PlusCircle className="h-4 w-4" />
                Register New Category
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
