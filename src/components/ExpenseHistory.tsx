import React, { useState, useMemo } from 'react';
import { Expense, Category } from '../types';
import { formatCurrency, getFormattedMonthStr } from '../utils';
import { CategoryIcon } from './LucideIcon';
import { 
  Search, 
  Trash2, 
  Edit3, 
  Filter, 
  ArrowUpDown, 
  Calendar, 
  Tag, 
  FolderMinus, 
  ChevronDown, 
  Sparkle,
  X 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ExpenseHistoryProps {
  expenses: Expense[];
  categories: Category[];
  onDeleteExpense: (id: string) => void;
  onEditExpense: (expense: Expense) => void;
  selectedMonth: string; // YYYY-MM
  setSelectedMonth: (month: string) => void;
  availableMonths: string[]; // List of YYYY-MM strings for selection
  activeEditId: string | null;
}

type SortField = 'date' | 'amount';
type SortOrder = 'desc' | 'asc';

export function ExpenseHistory({
  expenses,
  categories,
  onDeleteExpense,
  onEditExpense,
  selectedMonth,
  setSelectedMonth,
  availableMonths,
  activeEditId,
}: ExpenseHistoryProps) {
  // Local state for searching, sorting, and inline filtering
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCatId, setSelectedCatId] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Multi-layered filtering & sorting pipeline
  const processedExpenses = useMemo(() => {
    let result = [...expenses];

    // 1. Filter by Current Active Month (YYYY-MM)
    result = result.filter(e => e.date.startsWith(selectedMonth));

    // 2. Filter by Category
    if (selectedCatId !== 'all') {
      result = result.filter(e => e.categoryId === selectedCatId);
    }

    // 3. Filter by Search Query
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(e => 
        e.description.toLowerCase().includes(q) ||
        categories.find(c => c.id === e.categoryId)?.name.toLowerCase().includes(q)
      );
    }

    // 4. Sort calculations
    result.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'date') {
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      } else {
        comparison = a.amount - b.amount;
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return result;
  }, [expenses, selectedMonth, selectedCatId, searchQuery, sortField, sortOrder, categories]);

  // Aggregate sum of currently filtered expenses
  const filteredSpentSum = useMemo(() => {
    return processedExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [processedExpenses]);

  const toggleSortOrder = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortField(field);
      setSortOrder('desc'); // Default to descending when change fields
    }
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedCatId('all');
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden" id="expense-history-ledger">
      
      {/* Search and Filters Header bar */}
      <div className="p-6 border-b border-slate-100 space-y-4 bg-slate-50/20">
        
        {/* Row 1: Month Selector & Core Info */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h3 className="font-extrabold text-slate-800 text-base">Expense Ledger</h3>
            <p className="text-xs text-slate-500">Search and audit transactional cashflows</p>
          </div>

          {/* Month selective dropdown */}
          <div className="relative rounded-xl shadow-2xs shrink-0 self-start sm:self-center">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              id="month-picker-ledger"
              className="appearance-none font-bold text-xs bg-white text-slate-700 border border-slate-200 rounded-xl pl-4 pr-10 py-2.5 outline-hidden cursor-pointer focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
            >
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  {getFormattedMonthStr(m)}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
              <ChevronDown className="h-4 w-4" />
            </div>
          </div>
        </div>

        {/* Row 2: Search Input and Category Selector Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Quick Search */}
          <div className="md:col-span-6 relative shadow-2xs">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              placeholder="Search description or merchant..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs font-semibold pl-9 pr-8 py-2.5 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-hidden focus:bg-white text-slate-800 placeholder-slate-400"
              id="ledger-search-input"
            />
            {searchQuery && (
              <button 
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Filter Categories */}
          <div className="md:col-span-3">
            <select
              value={selectedCatId}
              onChange={(e) => setSelectedCatId(e.target.value)}
              id="ledger-category-filter"
              className="w-full text-xs font-bold border border-slate-200 rounded-xl px-3 py-2.5 bg-white text-slate-700 outline-hidden cursor-pointer focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sorting Field Select Toggle */}
          <div className="md:col-span-3 flex gap-2">
            <button
              type="button"
              onClick={() => toggleSortOrder('date')}
              id="sort-by-date"
              className={`flex-1 py-1 px-2.5 border text-[10px] font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                sortField === 'date'
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              Date
              {sortField === 'date' && (
                <ArrowUpDown className={`h-3 w-3 transition-transform ${sortOrder === 'asc' ? 'rotate-180' : ''}`} />
              )}
            </button>
            <button
              type="button"
              onClick={() => toggleSortOrder('amount')}
              id="sort-by-amount"
              className={`flex-1 py-1 px-2.5 border text-[10px] font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                sortField === 'amount'
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              Amount
              {sortField === 'amount' && (
                <ArrowUpDown className={`h-3 w-3 transition-transform ${sortOrder === 'asc' ? 'rotate-180' : ''}`} />
              )}
            </button>
          </div>
        </div>

        {/* Counter Summary info */}
        <div className="flex justify-between items-center text-xs text-slate-500 pt-1 font-semibold">
          <span>Found <strong className="text-slate-800">{processedExpenses.length}</strong> items</span>
          <span>Sum: <strong className="text-slate-800">{formatCurrency(filteredSpentSum)}</strong></span>
        </div>
      </div>

      {/* Transaction List Viewport */}
      <div>
        {processedExpenses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center" id="history-empty-state">
            <div className="h-14 w-14 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4 border border-slate-100">
              <FolderMinus className="h-6 w-6" />
            </div>
            <h4 className="font-bold text-slate-700 text-sm mb-1">No matching transactions</h4>
            <p className="text-xs text-slate-400 max-w-xs leading-relaxed mb-4">
              We couldn't locate any records fitting your selection in {getFormattedMonthStr(selectedMonth)}.
            </p>
            {(searchQuery !== '' || selectedCatId !== 'all') && (
              <button
                onClick={clearAllFilters}
                className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl transition cursor-pointer"
                id="btn-clear-filters"
              >
                Clear Search Filter
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100 max-h-[460px] overflow-y-auto" id="ledger-list-container">
            <AnimatePresence initial={false}>
              {processedExpenses.map((expense) => {
                const catObj = categories.find((c) => c.id === expense.categoryId) || {
                  id: 'unknown',
                  name: 'Other/Custom',
                  color: '#64748b',
                  icon: 'Tag',
                };
                const isCurrentlyActiveEdit = activeEditId === expense.id;

                return (
                  <motion.div
                    key={expense.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -15 }}
                    transition={{ duration: 0.15 }}
                    className={`flex items-center justify-between p-4 sm:p-5 transition-all ${
                      isCurrentlyActiveEdit 
                        ? 'bg-indigo-50/40 border-l-4 border-indigo-600' 
                        : 'bg-white hover:bg-slate-50/40'
                    }`}
                    id={`expense-row-${expense.id}`}
                  >
                    {/* Category icon avatar + Details text */}
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Round visual badge matching Category Color Accent */}
                      <div
                        className="h-10 w-10 sm:h-11 sm:w-11 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-2xs relative"
                        style={{ backgroundColor: catObj.color }}
                      >
                        <CategoryIcon name={catObj.icon} className="h-5 w-5" />
                        <span className="absolute -bottom-1.5 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-white text-slate-400 border border-slate-100 shadow-2xs">
                          <span className="text-[9px] font-bold">🎯</span>
                        </span>
                      </div>

                      {/* Merchant label, categorical info and date stamp */}
                      <div className="min-w-0">
                        <span className="block font-bold text-slate-800 text-xs sm:text-sm truncate">
                          {expense.description}
                        </span>
                        
                        <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 mt-1 text-[10px] font-semibold text-slate-500">
                          <span 
                            className="px-1.5 py-0.5 rounded-full text-white inline-block text-[9px] font-extrabold shadow-3xs"
                            style={{ backgroundColor: catObj.color }}
                          >
                            {catObj.name}
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="inline-flex items-center gap-0.5 text-slate-400 font-mono">
                            <Calendar className="h-2.5 w-2.5 text-slate-300" />
                            {new Date(expense.date.replace(/-/g, '/')).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Numeric pricing, delete and edit operations */}
                    <div className="flex items-center gap-3 ml-2 shrink-0">
                      <span className="text-sm sm:text-base font-extrabold text-slate-800">
                        {formatCurrency(expense.amount)}
                      </span>

                      {/* Tool actions grouping */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onEditExpense(expense)}
                          className={`p-2 rounded-xl transition cursor-pointer ${
                            isCurrentlyActiveEdit 
                              ? 'bg-indigo-600 text-white shadow-xs' 
                              : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                          }`}
                          title="Edit transaction"
                          id={`btn-edit-${expense.id}`}
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteExpense(expense.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                          title="Delete transaction"
                          id={`btn-delete-${expense.id}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
