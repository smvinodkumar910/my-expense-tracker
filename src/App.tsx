/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Expense, Category } from './types';
import { DEFAULT_CATEGORIES, generateSampleExpenses, formatCurrency, getFormattedMonthStr } from './utils';
import { ExpenseCharts } from './components/ExpenseCharts';
import { CategoryBudgets } from './components/CategoryBudgets';
import { ExpenseForm } from './components/ExpenseForm';
import { ExpenseHistory } from './components/ExpenseHistory';
import { CategoryIcon } from './components/LucideIcon';
import { 
  Wallet, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Layers, 
  FileText, 
  PiggyBank, 
  Sparkles, 
  RotateCcw, 
  Download, 
  Upload, 
  Sliders, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  ChevronDown,
  Menu,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  // --- CORE STATE ---
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [overallBudgetLimit, setOverallBudgetLimit] = useState<number>(2000);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  
  // Navigation tabs for the right container pane
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<'charts' | 'budgets' | 'ledger'>('charts');
  
  // Inline edit state
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Hidden file input ref for importing backpack JSONs
  const importFileInputRef = useRef<HTMLInputElement>(null);

  // --- INITIALIZATION & PERSISTENCE ---
  useEffect(() => {
    // 1. Initialize Default Selected Month (YYYY-MM)
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    setSelectedMonth(`${yyyy}-${mm}`);

    // 2. Load cached database layers from LocalStorage
    try {
      const cachedExpenses = localStorage.getItem('expenses_tracker_list');
      const cachedCategories = localStorage.getItem('expenses_tracker_categories');
      const cachedOverallBudget = localStorage.getItem('expenses_tracker_overall_budget');

      if (cachedExpenses) {
        setExpenses(JSON.parse(cachedExpenses));
      } else {
        // First load triggers dynamic seed generation
        const seedData = generateSampleExpenses(DEFAULT_CATEGORIES);
        setExpenses(seedData);
        localStorage.setItem('expenses_tracker_list', JSON.stringify(seedData));
      }

      if (cachedCategories) {
        setCategories(JSON.parse(cachedCategories));
      } else {
        localStorage.setItem('expenses_tracker_categories', JSON.stringify(DEFAULT_CATEGORIES));
      }

      if (cachedOverallBudget) {
        setOverallBudgetLimit(parseFloat(cachedOverallBudget));
      }
    } catch (err) {
      console.error('Failed to restore local database layers:', err);
    }
  }, []);

  // Save changes to localStorage on state changes
  const saveExpensesToLocalStorage = (updated: Expense[]) => {
    localStorage.setItem('expenses_tracker_list', JSON.stringify(updated));
  };

  const saveCategoriesToLocalStorage = (updated: Category[]) => {
    localStorage.setItem('expenses_tracker_categories', JSON.stringify(updated));
  };

  const saveOverallBudgetToLocalStorage = (val: number) => {
    localStorage.setItem('expenses_tracker_overall_budget', String(val));
  };

  // --- DERIVED METADATA GRID ---
  // List of all unique weeks/months represented across expenses to drive selectors
  const availableMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    
    // Always include the current year/calendar month
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    monthsSet.add(`${yyyy}-${mm}`);

    expenses.forEach(e => {
      // e.date comes in YYYY-MM-DD
      const m = e.date.substring(0, 7);
      if (m.length === 7) {
        monthsSet.add(m);
      }
    });

    return Array.from(monthsSet).sort().reverse(); // Show newest month top
  }, [expenses]);

  // Expenses filtered specifically for the active selected YYYY-MM month
  const activeMonthExpenses = useMemo(() => {
    return expenses.filter(e => e.date.startsWith(selectedMonth));
  }, [expenses, selectedMonth]);

  // Total amount spent in the active month
  const totalMonthSpent = useMemo(() => {
    return activeMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [activeMonthExpenses]);

  // Percentage filled of overall monthly limits
  const monthlyProgressPercent = useMemo(() => {
    if (overallBudgetLimit <= 0) return 0;
    return (totalMonthSpent / overallBudgetLimit) * 100;
  }, [totalMonthSpent, overallBudgetLimit]);

  // Determine top spending category for the current month
  const topCategoryStats = useMemo(() => {
    if (activeMonthExpenses.length === 0) return null;

    const summary: Record<string, number> = {};
    activeMonthExpenses.forEach(e => {
      summary[e.categoryId] = (summary[e.categoryId] || 0) + e.amount;
    });

    let topCatId = '';
    let maxSpent = 0;

    Object.entries(summary).forEach(([catId, amount]) => {
      if (amount > maxSpent) {
        maxSpent = amount;
        topCatId = catId;
      }
    });

    if (!topCatId) return null;

    const catObj = categories.find(c => c.id === topCatId) || {
      id: topCatId,
      name: 'Uncategorized',
      color: '#64748b',
      icon: 'Tag'
    };

    return {
      category: catObj,
      amount: maxSpent
    };
  }, [activeMonthExpenses, categories]);

  // Total life spend across ALL recorded transaction sheets
  const lifetimeSpend = useMemo(() => {
    return expenses.reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  // --- ACTIONS & ENGINE HANDLERS ---
  const handleCreateExpense = (data: Omit<Expense, 'id'>) => {
    const newItem: Expense = {
      id: `exp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      ...data,
    };
    const updated = [newItem, ...expenses];
    setExpenses(updated);
    saveExpensesToLocalStorage(updated);

    // Auto navigate to Ledger or Charts to view the new expense!
    // This provides amazing immediate physical confirmation.
    if (activeWorkspaceTab === 'budgets') {
      setActiveWorkspaceTab('charts');
    }
  };

  const handleUpdateExpense = (updatedItem: Expense) => {
    const updated = expenses.map(e => (e.id === updatedItem.id ? updatedItem : e));
    setExpenses(updated);
    saveExpensesToLocalStorage(updated);
    setEditingExpense(null);
  };

  const handleDeleteExpense = (id: string) => {
    const confirmed = window.confirm('Are you sure you want to permanently delete this expense?');
    if (!confirmed) return;

    const updated = expenses.filter(e => e.id !== id);
    setExpenses(updated);
    saveExpensesToLocalStorage(updated);

    // Cancel editing if current edit element is deleted
    if (editingExpense?.id === id) {
      setEditingExpense(null);
    }
  };

  const handleCreateCategory = (name: string, color: string, icon: string, limit: number | null) => {
    const newCat: Category = {
      id: `cat-${Date.now()}`,
      name,
      color,
      icon,
      budgetLimit: limit,
    };
    const updated = [...categories, newCat];
    setCategories(updated);
    saveCategoriesToLocalStorage(updated);
  };

  const handleUpdateCategoryBudget = (categoryId: string, limit: number | null) => {
    const updated = categories.map(c => 
      c.id === categoryId ? { ...c, budgetLimit: limit } : c
    );
    setCategories(updated);
    saveCategoriesToLocalStorage(updated);
  };

  const handleUpdateOverallBudget = (limit: number) => {
    setOverallBudgetLimit(limit);
    saveOverallBudgetToLocalStorage(limit);
  };

  // Populate dynamic realistic demo data immediately
  const handleLoadDemoData = () => {
    const agreed = window.confirm('This will load a complete template of sample transactions relative to your current month. Proceed?');
    if (!agreed) return;

    const seeds = generateSampleExpenses(categories);
    setExpenses(seeds);
    saveExpensesToLocalStorage(seeds);
    setEditingExpense(null);
  };

  // Reset entirely to starting template
  const handleResetData = () => {
    const agreed = window.confirm('CRITICAL ACTION: Resetting will purge every recorded expense and custom categories. Confirm Reset?');
    if (!agreed) return;

    setExpenses([]);
    setCategories(DEFAULT_CATEGORIES);
    setOverallBudgetLimit(2000);
    setEditingExpense(null);

    localStorage.removeItem('expenses_tracker_list');
    localStorage.removeItem('expenses_tracker_categories');
    localStorage.removeItem('expenses_tracker_overall_budget');
  };

  // Backup exporter: Save database as downloadable JSON
  const handleExportBackup = () => {
    const dbPayload = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      overallBudgetLimit,
      categories,
      expenses,
    };
    
    // Create actual blob trigger links
    const blob = new Blob([JSON.stringify(dbPayload, null, 2)], { type: 'application/json' });
    const u = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = u;
    link.download = `expense_database_backup_${selectedMonth}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Backup importer: Parse local JSON file
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const textStr = event.target?.result as string;
        const parsed = JSON.parse(textStr);

        if (parsed.expenses && Array.isArray(parsed.expenses)) {
          setExpenses(parsed.expenses);
          saveExpensesToLocalStorage(parsed.expenses);
        }
        if (parsed.categories && Array.isArray(parsed.categories)) {
          setCategories(parsed.categories);
          saveCategoriesToLocalStorage(parsed.categories);
        }
        if (parsed.overallBudgetLimit && typeof parsed.overallBudgetLimit === 'number') {
          setOverallBudgetLimit(parsed.overallBudgetLimit);
          saveOverallBudgetToLocalStorage(parsed.overallBudgetLimit);
        }
        
        alert('Database restored successfully from backup!');
      } catch (err) {
        alert('Invalid backup schema file format. Please import a real JSON database file.');
      }
    };
    reader.readAsText(file);
    // Reset file element value
    e.target.value = '';
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row font-sans text-[#0F172A] antialiased" id="root-viewport">
      
      {/* Mobile Top Navigation Bar */}
      <div className="md:hidden bg-[#0F172A] text-white px-4 py-3.5 flex items-center justify-between border-b border-[#1E293B] sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-sm shadow-xs">
            <Wallet className="h-4.5 w-4.5 text-white" />
          </div>
          <div>
            <span className="text-sm font-extrabold tracking-tight block leading-none">Smartledger</span>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Active Tracker</span>
          </div>
        </div>
        <button 
          onClick={() => setIsMobileSidebarOpen(true)}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile Pop-out Drawer (Adaptive & Interactive) */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <>
            {/* Backdrop overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileSidebarOpen(false)}
              className="fixed inset-0 bg-black z-50 md:hidden"
            />
            {/* Slide-out Panel */}
            <motion.aside 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed inset-y-0 left-0 w-72 bg-[#0F172A] text-slate-300 z-50 md:hidden flex flex-col justify-between p-6 shadow-2xl border-r border-[#1E293B]"
            >
              <div>
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-sm shadow-xs">
                      <Wallet className="h-4.5 w-4.5 text-white" />
                    </div>
                    <div>
                      <span className="text-sm font-extrabold text-white tracking-tight block leading-none">Smartledger</span>
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Active Tracker</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsMobileSidebarOpen(false)}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <nav className="space-y-1.5">
                  <button
                    onClick={() => {
                      setActiveWorkspaceTab('charts');
                      setIsMobileSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-xs font-extrabold uppercase tracking-wide cursor-pointer ${
                      activeWorkspaceTab === 'charts'
                        ? 'bg-indigo-600/15 text-indigo-400 border-l-4 border-indigo-500 pl-3'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <TrendingUp className="w-4 h-4 shrink-0 text-indigo-500/90" />
                    <span>Visual Analytics</span>
                  </button>
                  <button
                    onClick={() => {
                      setActiveWorkspaceTab('budgets');
                      setIsMobileSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-xs font-extrabold uppercase tracking-wide cursor-pointer ${
                      activeWorkspaceTab === 'budgets'
                        ? 'bg-indigo-600/15 text-indigo-400 border-l-4 border-indigo-500 pl-3'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Sliders className="w-4 h-4 shrink-0 text-indigo-500/90" />
                    <span>Targets & Budgets</span>
                  </button>
                  <button
                    onClick={() => {
                      setActiveWorkspaceTab('ledger');
                      setIsMobileSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-xs font-extrabold uppercase tracking-wide cursor-pointer ${
                      activeWorkspaceTab === 'ledger'
                        ? 'bg-indigo-600/15 text-indigo-400 border-l-4 border-indigo-500 pl-3'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <FileText className="w-4 h-4 shrink-0 text-indigo-500/90" />
                    <span>Transactions Ledger</span>
                  </button>
                </nav>

                <div className="mt-8 pt-6 border-t border-slate-800/60">
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-2">Workspace Actions</span>
                  <button
                    onClick={() => {
                      handleLoadDemoData();
                      setIsMobileSidebarOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                    <span>Load Demo Data</span>
                  </button>
                </div>
              </div>

              {/* Profile area in mobile drawer */}
              <div className="pt-6 border-t border-slate-800/80">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shrink-0 shadow-sm shadow-indigo-500/20">
                    VK
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-sm font-bold text-white truncate leading-tight">Vinod Kumar</p>
                    <p className="text-[11px] text-slate-500 truncate leading-none mt-0.5">smvinodkumar910@gmail.com</p>
                  </div>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar Panel */}
      <aside className="hidden md:flex flex-col w-64 bg-[#0F172A] text-slate-300 border-r border-[#1E293B] shrink-0 h-screen sticky top-0 justify-between p-6">
        <div>
          {/* Logo Brand Header */}
          <div className="flex items-center gap-3 text-white mb-8">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center font-bold text-base shadow-sm shadow-indigo-500/30">
              <Wallet className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-[15px] font-extrabold tracking-tight block leading-none text-white">Smartledger</span>
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5 block">Active Tracker</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            <button
              onClick={() => setActiveWorkspaceTab('charts')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-xs font-extrabold uppercase tracking-wide cursor-pointer ${
                activeWorkspaceTab === 'charts'
                  ? 'bg-indigo-600/15 text-indigo-400 border-l-4 border-indigo-500 pl-3'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
              }`}
            >
              <TrendingUp className="w-4 h-4 shrink-0 text-indigo-500/90" />
              <span>Visual Analytics</span>
            </button>
            <button
              onClick={() => setActiveWorkspaceTab('budgets')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-xs font-extrabold uppercase tracking-wide cursor-pointer ${
                activeWorkspaceTab === 'budgets'
                  ? 'bg-indigo-600/15 text-indigo-400 border-l-4 border-indigo-500 pl-3'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
              }`}
            >
              <Sliders className="w-4 h-4 shrink-0 text-indigo-500/90" />
              <span>Targets & Budgets</span>
            </button>
            <button
              onClick={() => setActiveWorkspaceTab('ledger')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-xs font-extrabold uppercase tracking-wide cursor-pointer ${
                activeWorkspaceTab === 'ledger'
                  ? 'bg-indigo-600/15 text-indigo-400 border-l-4 border-indigo-500 pl-3'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4 shrink-0 text-indigo-500/90" />
              <span>Transactions Ledger</span>
            </button>
          </nav>

          {/* Load templates section */}
          <div className="mt-8 pt-6 border-t border-slate-800/60">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-2">Sandbox utilities</span>
            <button
              onClick={handleLoadDemoData}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 bg-slate-800/60 hover:bg-slate-800 text-slate-200 text-xs font-bold rounded-xl transition cursor-pointer border border-transparent hover:border-slate-700"
              id="btn-demo-data"
            >
              <Sparkles className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
              <span>Load Demo Data</span>
            </button>
          </div>
        </div>

        {/* Profile identity bottom element */}
        <div className="pt-6 border-t border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shrink-0 shadow-sm shadow-indigo-500/20">
              VK
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-white truncate leading-tight">Vinod Kumar</p>
              <p className="text-[11px] text-slate-500 truncate leading-none mt-0.5">smvinodkumar910@gmail.com</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Container pane */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        
        {/* Top Header navbar and Month toggler */}
        <header className="min-h-[5rem] md:h-20 bg-white border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between px-6 md:px-8 py-4 sm:py-0 gap-4 shrink-0 sticky top-0 z-10 shadow-3xs">
          <div>
            <h2 className="text-base md:text-lg font-bold text-[#0F172A] tracking-tight">
              {activeWorkspaceTab === 'charts' ? 'Expense Analytics' : activeWorkspaceTab === 'budgets' ? 'Budget Targets' : 'Transactions Ledger'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Active ledger view for <strong className="text-indigo-600">{getFormattedMonthStr(selectedMonth)}</strong>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Native Responsive Month Picker */}
            <div className="relative rounded-xl">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                id="month-picker-ledger-header"
                className="appearance-none font-bold text-xs bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl pl-3.5 pr-9 py-2 outline-hidden cursor-pointer focus:ring-2 focus:ring-indigo-100 transition-all font-sans"
              >
                {availableMonths.map((m) => (
                  <option key={m} value={m}>
                    {getFormattedMonthStr(m)}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-slate-400">
                <ChevronDown className="h-3.5 w-3.5" />
              </div>
            </div>

            {/* Downloader backup JSON button */}
            <button
              onClick={handleExportBackup}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-50 border border-slate-200/80 rounded-xl transition cursor-pointer"
              title="Download local JSON sheet backup"
              id="btn-export"
              aria-label="Download backup"
            >
              <Download className="h-4 w-4" />
            </button>

            {/* Restorer backup JSON button */}
            <button
              onClick={() => importFileInputRef.current?.click()}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-50 border border-slate-200/80 rounded-xl transition cursor-pointer"
              title="Upload existing JSON sheet backup"
              id="btn-import"
              aria-label="Upload backup"
            >
              <Upload className="h-4 w-4" />
            </button>
            <input
              type="file"
              ref={importFileInputRef}
              onChange={handleImportBackup}
              accept=".json"
              className="hidden"
            />

            {/* Global purge / factory wipe button */}
            <button
              onClick={handleResetData}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200/80 hover:border-rose-100/60 rounded-xl transition cursor-pointer"
              title="Factory format database"
              id="btn-reset"
              aria-label="Reset application"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Content Body Layout Canvas */}
        <main className="flex-1 p-6 md:p-8 space-y-6 overflow-y-auto">
          
          {/* Top Status Cards Deck */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="kpi-metrics-row">
            
            {/* Card 1: Periodic spend tracker */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs relative overflow-hidden flex flex-col justify-between h-28 hover:shadow-md transition-all duration-200">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">Monthly Total Spent</span>
                <span className="text-xl font-extrabold text-[#0F172A] tracking-tight mt-1 block">
                  {formatCurrency(totalMonthSpent)}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="text-[11px] font-semibold text-slate-500 block">
                  {activeMonthExpenses.length} active payments logged
                </span>
              </div>
              <div className="absolute right-4 top-4 h-9 w-9 bg-indigo-50/70 text-indigo-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-4.5 w-4.5" />
              </div>
            </div>

            {/* Card 2: Buffer headroom slider */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs relative overflow-hidden flex flex-col justify-between h-28 hover:shadow-md transition-all duration-200">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">Headroom Remaining</span>
                <span className={`text-xl font-extrabold tracking-tight mt-1 block ${
                  overallBudgetLimit >= totalMonthSpent ? 'text-[#0F172A]' : 'text-rose-600'
                }`}>
                  {overallBudgetLimit >= totalMonthSpent 
                    ? formatCurrency(overallBudgetLimit - totalMonthSpent)
                    : `- ${formatCurrency(totalMonthSpent - overallBudgetLimit)}`
                  }
                </span>
              </div>
              <div className="w-full mt-2">
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-300 ${
                      monthlyProgressPercent >= 100 ? 'bg-rose-500' : monthlyProgressPercent >= 80 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(monthlyProgressPercent, 100)}%` }}
                  />
                </div>
              </div>
              <div className="absolute right-4 top-4 h-9 w-9 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
                <PiggyBank className="h-4.5 w-4.5" />
              </div>
            </div>

            {/* Card 3: Top spending sector card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs relative overflow-hidden flex flex-col justify-between h-28 hover:shadow-md transition-all duration-200">
              {topCategoryStats ? (
                <>
                  <div className="min-w-0 pr-8">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">Top Spender Category</span>
                    <span className="text-base font-bold text-[#0F172A] mt-1 block truncate">
                      {topCategoryStats.category.name}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-slate-505 block">
                    Spent <strong className="text-slate-800">{formatCurrency(topCategoryStats.amount)}</strong>
                  </span>
                  <div 
                    className="absolute right-4 top-4 h-9 w-9 rounded-lg flex items-center justify-center text-white"
                    style={{ backgroundColor: topCategoryStats.category.color }}
                  >
                    <CategoryIcon name={topCategoryStats.category.icon} className="h-4.5 w-4.5" />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">Top Spender Category</span>
                    <span className="text-xs font-semibold text-slate-400 mt-2 block italic leading-snug">No active expenses logged</span>
                  </div>
                  <div className="absolute right-4 top-4 h-9 w-9 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 border border-dashed border-slate-200">
                    <HelpCircle className="h-4.5 w-4.5" />
                  </div>
                </>
              )}
            </div>

            {/* Card 4: Global aggregated tracker */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs relative overflow-hidden flex flex-col justify-between h-28 hover:shadow-md transition-all duration-200">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">Lifetime Cumulative Spent</span>
                <span className="text-xl font-extrabold text-[#0F172A] tracking-tight mt-1 block">
                  {formatCurrency(lifetimeSpend)}
                </span>
              </div>
              <div className="flex items-center gap-1 mt-2">
                <span className="text-[11px] font-semibold text-slate-500">
                  Tracking {expenses.length} payments aggregate
                </span>
              </div>
              <div className="absolute right-4 top-4 h-9 w-9 bg-slate-50 text-slate-600 rounded-lg flex items-center justify-center">
                <FileText className="h-4.5 w-4.5" />
              </div>
            </div>
          </section>

          {/* Core Content Split Grid Pane */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Side 1: Entry Controls Hub to feed inputs (4 cols) */}
            <section className="lg:col-span-4 space-y-6">
              <div className="sticky top-24">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 block">
                  Logging Hub
                </h3>
                <ExpenseForm
                  categories={categories}
                  onCreateExpense={handleCreateExpense}
                  onCreateCategory={handleCreateCategory}
                  editingExpense={editingExpense}
                  onUpdateExpense={handleUpdateExpense}
                  onCancelEdit={() => setEditingExpense(null)}
                />
              </div>
            </section>

            {/* Side 2: Dedicated workspace analytics (8 cols) */}
            <section className="lg:col-span-8 space-y-6">
              <div className="space-y-4">
                
                {/* Horizontal Tab headers internally to switch displays locally as well if desired */}
                <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    {activeWorkspaceTab === 'charts' ? 'Visual Data Analytics' : activeWorkspaceTab === 'budgets' ? 'Budget Target Controls' : 'Ledger Log Entries'}
                  </h3>

                  <div className="flex bg-slate-100 p-1 rounded-xl shadow-3xs" id="workspace-parent-tabs">
                    <button
                      onClick={() => setActiveWorkspaceTab('charts')}
                      id="btn-workspace-charts"
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        activeWorkspaceTab === 'charts'
                          ? 'bg-white text-indigo-700 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Charts
                    </button>
                    <button
                      onClick={() => setActiveWorkspaceTab('budgets')}
                      id="btn-workspace-budgets"
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        activeWorkspaceTab === 'budgets'
                          ? 'bg-white text-indigo-700 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Budgets
                    </button>
                    <button
                      onClick={() => setActiveWorkspaceTab('ledger')}
                      id="btn-workspace-ledger"
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        activeWorkspaceTab === 'ledger'
                          ? 'bg-white text-indigo-700 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Ledger
                    </button>
                  </div>
                </div>

                {/* Main Dynamic View Panels with transitions */}
                <div className="transition-all duration-200">
                  <AnimatePresence mode="wait">
                    {activeWorkspaceTab === 'charts' && (
                      <motion.div
                        key="charts"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.15 }}
                      >
                        <ExpenseCharts
                          expenses={activeMonthExpenses}
                          categories={categories}
                          currentMonth={selectedMonth}
                        />
                      </motion.div>
                    )}

                    {activeWorkspaceTab === 'budgets' && (
                      <motion.div
                        key="budgets"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.15 }}
                      >
                        <CategoryBudgets
                          categories={categories}
                          expenses={activeMonthExpenses}
                          onUpdateBudget={handleUpdateCategoryBudget}
                          overallBudgetLimit={overallBudgetLimit}
                          onUpdateOverallBudget={handleUpdateOverallBudget}
                        />
                      </motion.div>
                    )}

                    {activeWorkspaceTab === 'ledger' && (
                      <motion.div
                        key="ledger"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.15 }}
                      >
                        <ExpenseHistory
                          expenses={expenses}
                          categories={categories}
                          onDeleteExpense={handleDeleteExpense}
                          onEditExpense={(item) => {
                            setEditingExpense(item);
                            window.scrollTo({ top: 300, behavior: 'smooth' });
                          }}
                          selectedMonth={selectedMonth}
                          setSelectedMonth={setSelectedMonth}
                          availableMonths={availableMonths}
                          activeEditId={editingExpense?.id || null}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

              </div>
            </section>

          </div>
        </main>
      </div>
    </div>
  );
}
