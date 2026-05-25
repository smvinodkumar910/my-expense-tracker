import React, { useState, useMemo } from 'react';
import { Expense, Category } from '../types';
import { formatCurrency, getFormattedMonthStr } from '../utils';
import { CategoryIcon } from './LucideIcon';
import { 
  TrendingUp, 
  PieChart as PieIcon, 
  BarChart3, 
  AlertTriangle,
  Flame,
  Info 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ExpenseChartsProps {
  expenses: Expense[];
  categories: Category[];
  currentMonth: string; // YYYY-MM
}

export function ExpenseCharts({ expenses, categories, currentMonth }: ExpenseChartsProps) {
  const [chartTab, setChartTab] = useState<'donut' | 'trend'>('donut');
  const [trendSubTab, setTrendSubTab] = useState<'daily' | 'weekly'>('daily');
  const [hoveredSlice, setHoveredSlice] = useState<string | null>(null);
  const [hoveredTrendPoint, setHoveredTrendPoint] = useState<{ date: string; amount: number } | null>(null);

  // Group expenses by category
  const categorySummary = useMemo(() => {
    const summary: Record<string, number> = {};
    
    // Initialize active categories to 0
    categories.forEach(num => {
      summary[num.id] = 0;
    });

    expenses.forEach(exp => {
      if (summary[exp.categoryId] !== undefined) {
        summary[exp.categoryId] += exp.amount;
      } else {
        // Fallback for custom category if deleted or custom
        summary[exp.categoryId] = exp.amount;
      }
    });

    // Create sorted list of categories with expenditures
    const list = Object.entries(summary)
      .map(([catId, amount]) => {
        const category = categories.find(c => c.id === catId) || {
          id: catId,
          name: 'Other/Deactivated',
          color: '#64748b',
          icon: 'Tag',
          budgetLimit: null
        };
        return {
          category,
          amount,
        };
      })
      .filter(item => item.amount > 0)
      .sort((a, b) => b.amount - a.amount);

    return list;
  }, [expenses, categories]);

  // Aggregate total spent in the filtered expenses
  const totalSpent = useMemo(() => {
    return expenses.reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  // Math metadata for SVG Donut
  const donutSlices = useMemo(() => {
    if (totalSpent === 0 || categorySummary.length === 0) return [];
    
    let accumulatedAngle = 0;
    const radius = 50;
    const circumference = 2 * Math.PI * radius; // Approx 314.159

    return categorySummary.map(item => {
      const percentage = (item.amount / totalSpent) * 100;
      const angle = (item.amount / totalSpent) * 360;
      const strokeDashoffset = circumference - (percentage / 100) * circumference;
      const rotationAngle = accumulatedAngle;
      
      const sliceData = {
        categoryId: item.category.id,
        categoryName: item.category.name,
        color: item.category.color,
        amount: item.amount,
        percentage,
        strokeDasharray: circumference,
        strokeDashoffset,
        rotation: rotationAngle - 90, // Circular coords offset starting top
      };

      accumulatedAngle += angle;
      return sliceData;
    });
  }, [categorySummary, totalSpent]);

  // Selected slice to highlight inside the Donut
  const activeSliceInfo = useMemo(() => {
    if (hoveredSlice) {
      return donutSlices.find(s => s.categoryId === hoveredSlice);
    }
    // Default to largest category
    return donutSlices[0] || null;
  }, [hoveredSlice, donutSlices]);

  // --- TREND DATA ANALYSIS ---
  // Get entire days list in currentMonth or collect from the actual filtered list
  const dailyTrendData = useMemo(() => {
    if (expenses.length === 0) return [];

    const dailyMap: Record<string, number> = {};
    
    // Determine bounds
    // We group by actual day strings found in standard expenses
    expenses.forEach(e => {
      dailyMap[e.date] = (dailyMap[e.date] || 0) + e.amount;
    });

    // Let's list sorted date strings
    const sortedDates = Object.keys(dailyMap).sort();
    if (sortedDates.length === 0) return [];

    // Fill in intermediate dates to show a true smooth trend line rather than isolated clusters
    const firstDate = new Date(sortedDates[0]);
    const lastDate = new Date(sortedDates[sortedDates.length - 1]);
    
    // Ensure we render at least a few days
    const datesList: { date: string; amount: number }[] = [];
    const curr = new Date(firstDate);
    
    while (curr <= lastDate) {
      const yyyy = curr.getFullYear();
      const mm = String(curr.getMonth() + 1).padStart(2, '0');
      const dd = String(curr.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;
      
      datesList.push({
        date: dateStr,
        amount: dailyMap[dateStr] || 0
      });
      
      curr.setDate(curr.getDate() + 1);
    }

    return datesList;
  }, [expenses]);

  // Group by Week of Month (Week 1, Week 2, Week 3, Week 4 / 5)
  const weeklyTrendData = useMemo(() => {
    if (expenses.length === 0) return [];

    const weekSums = [0, 0, 0, 0, 0]; // up to 5 weeks max

    expenses.forEach(e => {
      const parts = e.date.split('-');
      if (parts.length >= 3) {
        const day = parseInt(parts[2], 10);
        // Map 1-7 (Week 1), 8-14 (Week 2), 15-21 (Week 3), 22-28 (Week 4), 29+ (Week 5)
        const weekIndex = Math.min(Math.floor((day - 1) / 7), 4);
        weekSums[weekIndex] += e.amount;
      }
    });

    return weekSums.map((amount, idx) => ({
      weekLabel: `Week ${idx + 1}`,
      period: `Days ${idx * 7 + 1} - ${Math.min((idx + 1) * 7, 31)}`,
      amount
    }));
  }, [expenses]);

  // Max value calculation for trend charting grid height matching
  const maxDailyAmount = useMemo(() => {
    if (dailyTrendData.length === 0) return 0;
    return Math.max(...dailyTrendData.map(d => d.amount), 10); // clamp min 10
  }, [dailyTrendData]);

  const maxWeeklyAmount = useMemo(() => {
    if (weeklyTrendData.length === 0) return 0;
    return Math.max(...weeklyTrendData.map(w => w.amount), 10);
  }, [weeklyTrendData]);

  // Generate path points for interactive daily trend line (Width: 500, Height: 200)
  const dailyTimelinePathPoints = useMemo(() => {
    if (dailyTrendData.length < 2) return '';
    const width = 500;
    const height = 180;
    const paddingLeft = 35;
    const paddingRight = 15;
    const paddingTop = 20;
    const paddingBottom = 20;

    const useableWidth = width - paddingLeft - paddingRight;
    const useableHeight = height - paddingTop - paddingBottom;

    return dailyTrendData.map((d, index) => {
      const x = paddingLeft + (index / (dailyTrendData.length - 1)) * useableWidth;
      const y = paddingTop + useableHeight - (d.amount / maxDailyAmount) * useableHeight;
      return { x, y, date: d.date, amount: d.amount };
    });
  }, [dailyTrendData, maxDailyAmount]);

  const sparklinePath = useMemo(() => {
    if (typeof dailyTimelinePathPoints === 'string' || dailyTimelinePathPoints.length === 0) return '';
    return dailyTimelinePathPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  }, [dailyTimelinePathPoints]);

  const areaFillPath = useMemo(() => {
    if (typeof dailyTimelinePathPoints === 'string' || dailyTimelinePathPoints.length === 0) return '';
    const points = [...dailyTimelinePathPoints];
    const width = 500;
    const height = 180;
    const paddingBottom = 20;
    const useableHeight = height - paddingBottom;
    
    // Close the area curve path
    const startX = points[0].x;
    const endX = points[points.length - 1].x;

    return `${sparklinePath} L ${endX} ${useableHeight} L ${startX} ${useableHeight} Z`;
  }, [dailyTimelinePathPoints, sparklinePath]);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden" id="chart-panel">
      {/* Selector banner */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-indigo-600" />
          <h3 className="font-semibold text-slate-800 text-sm">Visual Analytics</h3>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button
            id="toggle-chart-donut"
            onClick={() => setChartTab('donut')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              chartTab === 'donut'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <PieIcon className="h-3.5 w-3.5" />
            Category Mix
          </button>
          <button
            id="toggle-chart-trend"
            onClick={() => setChartTab('trend')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              chartTab === 'trend'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            Spending Trends
          </button>
        </div>
      </div>

      {/* Main Graph Content Panel */}
      <div className="p-6">
        {expenses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center" id="chart-empty-state">
            <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4 border border-dashed border-slate-200">
              <PieIcon className="h-8 w-8" />
            </div>
            <h4 className="font-semibold text-slate-700 mb-1">No transaction record found</h4>
            <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
              Charts generate automatically as you log expenses. Add your first item in the left drawer to get started!
            </p>
          </div>
        ) : (
          <div className="min-h-[280px]">
            {chartTab === 'donut' && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center" id="donut-content">
                {/* SVG Centered Donut visual */}
                <div className="md:col-span-5 flex justify-center relative">
                  <div className="relative h-48 w-48 scale-105">
                    <svg viewBox="0 0 128 128" className="h-full w-full select-none transform rotate-0">
                      {/* Empty circle placeholder if zero values */}
                      {donutSlices.length === 0 && (
                        <circle
                          cx="64"
                          cy="64"
                          r="50"
                          fill="none"
                          stroke="#f1f5f9"
                          strokeWidth="16"
                        />
                      )}

                      {donutSlices.map((slice) => {
                        const isHovered = hoveredSlice === slice.categoryId;
                        return (
                          <circle
                            key={slice.categoryId}
                            cx="64"
                            cy="64"
                            r="50"
                            fill="none"
                            stroke={slice.color}
                            strokeWidth={isHovered ? 20 : 16}
                            strokeDasharray={slice.strokeDasharray}
                            strokeDashoffset={slice.strokeDashoffset}
                            transform={`rotate(${slice.rotation} 64 64)`}
                            className="transition-all duration-300 cursor-pointer origin-center"
                            onMouseEnter={() => setHoveredSlice(slice.categoryId)}
                            onMouseLeave={() => setHoveredSlice(null)}
                            style={{
                              strokeLinecap: 'butt',
                              opacity: hoveredSlice && !isHovered ? 0.35 : 1,
                            }}
                          />
                        );
                      })}
                    </svg>

                    {/* Donut central text summary */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4Pointer pointer-events-none text-center">
                      {activeSliceInfo ? (
                        <div className="transition-all pointer-events-none">
                          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider line-clamp-1 max-w-[120px]">
                            {activeSliceInfo.categoryName}
                          </p>
                          <p className="text-lg font-bold text-slate-800 line-clamp-1">
                            {formatCurrency(activeSliceInfo.amount)}
                          </p>
                          <p className="text-[10px] bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded-full inline-block mt-0.5">
                            {activeSliceInfo.percentage.toFixed(1)}%
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                            Total Spent
                          </p>
                          <p className="text-xl font-extrabold text-slate-800">
                            {formatCurrency(totalSpent)}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {expenses.length} payments
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Donut Legend listing */}
                <div className="md:col-span-7 space-y-2.5">
                  <h4 className="font-semibold text-xs uppercase tracking-wider text-slate-400 mb-1">
                    Spending Mix Breakdown
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2 max-h-[220px] overflow-y-auto pr-1">
                    {categorySummary.map((item) => {
                      const percentage = totalSpent ? (item.amount / totalSpent) * 100 : 0;
                      const isHovered = hoveredSlice === item.category.id;
                      
                      return (
                        <div
                          key={item.category.id}
                          className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                            isHovered 
                              ? 'bg-slate-50 border-slate-200 shadow-2xs scale-[1.01]' 
                              : 'bg-white border-slate-100 hover:bg-slate-50/50'
                          }`}
                          onMouseEnter={() => setHoveredSlice(item.category.id)}
                          onMouseLeave={() => setHoveredSlice(null)}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div 
                              className="p-1.5 rounded-lg flex items-center justify-center text-white"
                              style={{ backgroundColor: item.category.color }}
                            >
                              <CategoryIcon name={item.category.icon} className="h-3.5 w-3.5" />
                            </div>
                            <span className="font-semibold text-slate-700 text-xs truncate">
                              {item.category.name}
                            </span>
                          </div>

                          <div className="text-right ml-2 shrink-0">
                            <span className="font-bold text-slate-800 text-xs block">
                              {formatCurrency(item.amount)}
                            </span>
                            <span className="text-[10px] font-medium text-slate-500">
                              {percentage.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {chartTab === 'trend' && (
              <div className="space-y-4" id="trend-content">
                {/* Trend Options Header */}
                <div className="flex justify-between items-center bg-slate-50 rounded-xl p-1.5 border border-slate-100">
                  <span className="text-[11px] font-semibold text-slate-500 pl-2">
                    Viewing {getFormattedMonthStr(currentMonth)} activity
                  </span>
                  <div className="flex bg-slate-100 rounded-lg p-0.5">
                    <button
                      id="toggle-trend-daily"
                      onClick={() => setTrendSubTab('daily')}
                      className={`px-2.5 py-1 text-[10px] font-bold rounded-md cursor-pointer transition-all ${
                        trendSubTab === 'daily'
                          ? 'bg-white text-indigo-700 shadow-2xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Daily
                    </button>
                    <button
                      id="toggle-trend-weekly"
                      onClick={() => setTrendSubTab('weekly')}
                      className={`px-2.5 py-1 text-[10px] font-bold rounded-md cursor-pointer transition-all ${
                        trendSubTab === 'weekly'
                          ? 'bg-white text-indigo-700 shadow-2xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Weekly Grouping
                    </button>
                  </div>
                </div>

                {/* DAILY TREND (Area Line Chart) */}
                {trendSubTab === 'daily' && (
                  <div>
                    {dailyTrendData.length < 2 ? (
                      <div className="flex flex-col items-center justify-center py-10 text-center text-slate-400">
                        <BarChart3 className="h-7 w-7 text-slate-300 mb-2" />
                        <p className="text-xs">Add payments on multiple separate days to trace a spending trend line.</p>
                      </div>
                    ) : (
                      <div className="relative">
                        {/* Interactive tooltip hovering element */}
                        <div className="h-[210px] w-full flex justify-center items-center">
                          <svg viewBox="0 0 500 200" className="w-full h-full overflow-visible">
                            {/* Horizontal grid lines */}
                            {[0, 0.25, 0.5, 0.75, 1].map((r, i) => (
                              <line
                                key={i}
                                x1="35"
                                y1={20 + r * 140}
                                x2="485"
                                y2={20 + r * 140}
                                stroke="#f1f5f9"
                                strokeWidth="1.5"
                                strokeDasharray="3 3"
                              />
                            ))}

                            {/* Y axis markers */}
                            <text x="30" y="24" textAnchor="end" fill="#94a3b8" className="text-[9px] font-mono font-bold">
                              {formatCurrency(maxDailyAmount)}
                            </text>
                            <text x="30" y="94" textAnchor="end" fill="#94a3b8" className="text-[9px] font-mono font-bold">
                              {formatCurrency(maxDailyAmount * 0.5)}
                            </text>
                            <text x="30" y="164" textAnchor="end" fill="#94a3b8" className="text-[9px] font-mono font-bold">
                              $0
                            </text>

                            {/* Filled Area below Line */}
                            <path
                              d={areaFillPath}
                              fill="url(#trend-gradient)"
                              className="opacity-25"
                            />

                            {/* Beautiful glowing stroke path */}
                            <path
                              d={sparklinePath}
                              fill="none"
                              stroke="url(#line-gradient)"
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />

                            {/* Interactive Hover Area Points */}
                            {Array.isArray(dailyTimelinePathPoints) && dailyTimelinePathPoints.map((pt, idx) => {
                              const isHovered = hoveredTrendPoint?.date === pt.date;
                              return (
                                <g key={pt.date}>
                                  {/* Transparent massive hover bounds */}
                                  <circle
                                    cx={pt.x}
                                    cy={pt.y}
                                    r="14"
                                    fill="transparent"
                                    className="cursor-pointer"
                                    onMouseEnter={() => setHoveredTrendPoint({ date: pt.date, amount: pt.amount })}
                                    onMouseLeave={() => setHoveredTrendPoint(null)}
                                  />
                                  {/* Visual glowing center circle */}
                                  <circle
                                    cx={pt.x}
                                    cy={pt.y}
                                    r={isHovered ? "6" : "3.5"}
                                    fill={isHovered ? "#4f46e5" : "#6366f1"}
                                    stroke="white"
                                    strokeWidth="2"
                                    className="pointer-events-none transition-all duration-150"
                                  />
                                </g>
                              );
                            })}

                            {/* SVG Defs for linear color gradients */}
                            <defs>
                              <linearGradient id="trend-gradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#4f46e5" />
                                <stop offset="100%" stopColor="#818cf8" stopOpacity="0" />
                              </linearGradient>
                              <linearGradient id="line-gradient" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="#6366f1" />
                                <stop offset="50%" stopColor="#4f46e5" />
                                <stop offset="100%" stopColor="#a855f7" />
                              </linearGradient>
                            </defs>
                          </svg>
                        </div>

                        {/* Interactive dynamic tooltip legend */}
                        <div className="mt-1 flex items-center justify-center min-h-[30px]">
                          {hoveredTrendPoint ? (
                            <motion.div 
                              initial={{ opacity: 0, y: 3 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="bg-indigo-900 text-white rounded-lg px-3 py-1 flex items-center gap-2 shadow-sm text-[11px] font-semibold"
                            >
                              <span className="text-indigo-200">
                                {new Date(hoveredTrendPoint.date.replace(/-/g, '/')).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                              </span>
                              <span className="h-3 w-[1px] bg-indigo-700"></span>
                              <span className="text-emerald-300 font-bold">
                                Spent {formatCurrency(hoveredTrendPoint.amount)}
                              </span>
                            </motion.div>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic flex items-center gap-1">
                              <Info className="h-3.5 w-3.5 text-slate-300 shrink-0" />
                              Hover over points along the timeline to analyze daily transactional spikes
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* WEEKLY TREND (Grouped Bar Chart) */}
                {trendSubTab === 'weekly' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-5 gap-3 pt-4 pb-2" id="weekly-bars-container">
                      {weeklyTrendData.map((week, idx) => {
                        const percentOfMax = maxWeeklyAmount > 0 ? (week.amount / maxWeeklyAmount) * 100 : 0;
                        return (
                          <div key={week.weekLabel} className="flex flex-col items-center">
                            {/* Value tooltip displayed above bar */}
                            <span className="text-[9px] font-semibold text-slate-500 mb-1.5">
                              {week.amount > 0 ? formatCurrency(week.amount).split('.')[0] : '$0'}
                            </span>

                            {/* Bar container track */}
                            <div className="h-36 w-full bg-slate-50 border border-slate-100 rounded-xl relative flex items-end overflow-hidden">
                              <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: `${Math.max(percentOfMax, 2)}%` }}
                                transition={{ duration: 0.6, ease: 'easeOut' }}
                                style={{
                                  backgroundColor: week.amount > 0 ? '#4f46e5' : '#e2e8f0',
                                }}
                                className={`w-full rounded-t-lg transition-colors relative group duration-200 ${
                                  week.amount > 0 ? 'hover:bg-indigo-500' : ''
                                }`}
                              >
                                {week.amount > 0 && (
                                  <div className="absolute inset-0 bg-linear-to-t from-black/10 to-transparent pointer-events-none" />
                                )}
                              </motion.div>
                            </div>

                            {/* Labels */}
                            <span className="text-[11px] font-bold text-slate-700 mt-2">
                              {week.weekLabel}
                            </span>
                            <span className="text-[9px] text-slate-400 font-medium truncate w-full text-center">
                              {week.period}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
