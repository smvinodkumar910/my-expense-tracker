export interface Expense {
  id: string;
  amount: number;
  description: string;
  categoryId: string;
  date: string; // YYYY-MM-DD
}

export interface Category {
  id: string;
  name: string;
  color: string; // Hex color string, e.g., "#3b82f6"
  icon: string;  // Name of Lucide icon to use
  budgetLimit: number | null; // Monthly limit for this category, null means none
}

export interface MonthlyBudget {
  month: string; // YYYY-MM
  overallLimit: number;
}
