import { Category, Expense } from './types';

export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'cat-housing',
    name: 'Rent & Living',
    color: '#3b82f6', // blue
    icon: 'Home',
    budgetLimit: 1200,
  },
  {
    id: 'cat-food',
    name: 'Food & Dining',
    color: '#f97316', // orange
    icon: 'Utensils',
    budgetLimit: 450,
  },
  {
    id: 'cat-shopping',
    name: 'Shopping & Gear',
    color: '#ec4899', // pink
    icon: 'ShoppingBag',
    budgetLimit: 300,
  },
  {
    id: 'cat-transport',
    name: 'Transport & Gas',
    color: '#eab308', // yellow
    icon: 'Car',
    budgetLimit: 200,
  },
  {
    id: 'cat-entertainment',
    name: 'Entertainment',
    color: '#a855f7', // purple
    icon: 'Tv',
    budgetLimit: 150,
  },
  {
    id: 'cat-health',
    name: 'Medical & Health',
    color: '#ef4444', // red
    icon: 'HeartPulse',
    budgetLimit: 100,
  },
];

// Helper to format currency
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

// Generates beautiful realistic seed data relative to current date
export const generateSampleExpenses = (categories: Category[]): Expense[] => {
  const expenses: Expense[] = [];
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth(); // 0-indexed

  const createDateStr = (dayOffset: number): string => {
    const d = new Date(year, month, today.getDate() - dayOffset);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // Realistic sample transactions
  const samples = [
    { categoryId: 'cat-housing', desc: 'Monthly Rental Payment', amount: 1100, dayOffset: 24 },
    { categoryId: 'cat-food', desc: 'Whole Foods Grocery Run', amount: 124.50, dayOffset: 23 },
    { categoryId: 'cat-entertainment', desc: 'Netflix Subscription', amount: 15.49, dayOffset: 22 },
    { categoryId: 'cat-transport', desc: 'Shell Gas Station Fill', amount: 45.00, dayOffset: 21 },
    { categoryId: 'cat-shopping', desc: 'Warm Winter Jacket', amount: 119.99, dayOffset: 20 },
    { categoryId: 'cat-food', desc: 'Sushi Dinner with Team', amount: 84.20, dayOffset: 18 },
    { categoryId: 'cat-health', desc: 'Pharmacy Allergy Prescriptions', amount: 35.00, dayOffset: 16 },
    { categoryId: 'cat-transport', desc: 'Uber Ride City Center', amount: 22.50, dayOffset: 14 },
    { categoryId: 'cat-food', desc: 'Blue Bottle Coffee & Pastry', amount: 12.80, dayOffset: 12 },
    { categoryId: 'cat-food', desc: 'Trader Joe\'s Grocery Haul', amount: 89.15, dayOffset: 10 },
    { categoryId: 'cat-shopping', desc: 'Wireless Mechanical Keyboard', amount: 89.00, dayOffset: 8 },
    { categoryId: 'cat-entertainment', desc: 'Movie Tickets & Popcorn', amount: 34.50, dayOffset: 7 },
    { categoryId: 'cat-transport', desc: 'Shell Gas Station Fill', amount: 42.00, dayOffset: 5 },
    { categoryId: 'cat-food', desc: 'Ramen Comfort Dinner with Friend', amount: 48.60, dayOffset: 3 },
    { categoryId: 'cat-food', desc: 'Morning Bagels Delivery', amount: 18.50, dayOffset: 1 },
    { categoryId: 'cat-health', desc: 'Gym Monthly Membership', amount: 45.00, dayOffset: 0 },
  ];

  return samples.map((s, idx) => ({
    id: `exp-${idx + 1}-${Date.now()}`,
    amount: s.amount,
    description: s.desc,
    categoryId: s.categoryId,
    date: createDateStr(s.dayOffset),
  }));
};

// Formatter to read Month Name and Year (e.g., "May 2026")
export const getFormattedMonthStr = (dateStr: string): string => {
  const parts = dateStr.split('-');
  if (parts.length < 2) return dateStr;
  const year = parts[0];
  const monthIdx = parseInt(parts[1], 10) - 1;
  const dateObj = new Date(parseInt(year, 10), monthIdx, 1);
  return dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

// Get list of standard Lucide icons that can be chosen for new categories
export const BUDGET_ICONS = [
  'Utensils',       // Food
  'ShoppingBag',    // Shopping
  'Home',           // House/Rent
  'Car',            // Auto
  'Tv',             // Entertainment
  'HeartPulse',     // Health
  'GraduationCap',  // School/Edu
  'Briefcase',      // Work
  'DollarSign',     // Finance
  'PiggyBank',      // Savings/Investment
  'Gift',           // Gifts
  'Plane',          // Travel
  'Smartphone',     // Tech
  'Wrench',         // Repairs
  'Coffee',         // Cafe
  'TrendingUp'      // Growth
];
