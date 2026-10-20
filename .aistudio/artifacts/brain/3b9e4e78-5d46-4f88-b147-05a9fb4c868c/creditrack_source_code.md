# CrediTrack — Complete Updated Source Code

## Overview of Chart Neon Styling Updates
- **Hollow Neon Chart Bars**: Removed all middle fills (`bg-transparent`), leaving the inside of bars completely empty and transparent.
- **Neon Border Styling**:
  - **Expense (`Use`)**: Bright Neon Red (`border-2 border-red-500 dark:border-red-400` with subtle glow `shadow-[0_0_8px_rgba(239,68,68,0.45)]`)
  - **Interest & Fees (`Int & Fee`)**: Bright Neon Yellow (`border-2 border-yellow-400 dark:border-yellow-300` with subtle glow `shadow-[0_0_8px_rgba(250,204,21,0.45)]`)
  - **Payments (`Pay`)**: Bright Neon Green (`border-2 border-emerald-400 dark:border-emerald-300` with subtle glow `shadow-[0_0_8px_rgba(52,211,153,0.45)]`)
- **Dual Chart Support**: Styled both horizontal bars and vertical column layouts in both `NeonChart.tsx` (Dashboard) and `AnalyticsChart.tsx` (Card Details).
- **Light & Dark Mode**: Pristine light mode colors with no misplaced dark surfaces, and vivid neon glows in dark mode.

---

## 1. `src/index.css`

```css
@import "tailwindcss";

@custom-variant dark (&:where(.dark, .dark *));
@variant dark (&:where(.dark, .dark *));

@layer base {
  :root {
    color-scheme: light;
  }

  .dark {
    color-scheme: dark;
  }

  body {
    font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    -webkit-tap-highlight-color: transparent;
    user-select: none;
    -webkit-user-select: none;
    transition: background-color 0.25s ease, color 0.25s ease;
  }

  input, textarea, select {
    user-select: auto;
    -webkit-user-select: auto;
  }

  .font-mono {
    font-family: 'JetBrains Mono', monospace;
  }
}

/* ============================================================
   NEON BUTTONS & GLOW UTILITIES (ACROSS ALL SURFACES)
   ============================================================ */

/* Neon Emerald Primary Buttons */
.neon-btn-emerald {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: #ffffff;
  border: 1px solid rgba(52, 211, 153, 0.6);
  box-shadow: 0 0 14px rgba(16, 185, 129, 0.4), 0 2px 4px rgba(0, 0, 0, 0.08);
  font-weight: 700;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
.neon-btn-emerald:hover {
  background: linear-gradient(135deg, #34d399 0%, #10b981 100%);
  box-shadow: 0 0 22px rgba(16, 185, 129, 0.65), 0 4px 8px rgba(0, 0, 0, 0.12);
  transform: translateY(-1px);
}
.neon-btn-emerald:active {
  transform: scale(0.97);
}

/* Neon Cyan Secondary / Accent Buttons */
.neon-btn-cyan {
  background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
  color: #ffffff;
  border: 1px solid rgba(103, 232, 249, 0.6);
  box-shadow: 0 0 14px rgba(6, 182, 212, 0.4), 0 2px 4px rgba(0, 0, 0, 0.08);
  font-weight: 700;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
.neon-btn-cyan:hover {
  background: linear-gradient(135deg, #22d3ee 0%, #06b6d4 100%);
  box-shadow: 0 0 22px rgba(6, 182, 212, 0.65), 0 4px 8px rgba(0, 0, 0, 0.12);
  transform: translateY(-1px);
}
.neon-btn-cyan:active {
  transform: scale(0.97);
}

/* Neon Rose / Danger Buttons */
.neon-btn-rose {
  background: linear-gradient(135deg, #f43f5e 0%, #e11d48 100%);
  color: #ffffff;
  border: 1px solid rgba(251, 113, 133, 0.6);
  box-shadow: 0 0 14px rgba(244, 63, 94, 0.4), 0 2px 4px rgba(0, 0, 0, 0.08);
  font-weight: 700;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
.neon-btn-rose:hover {
  background: linear-gradient(135deg, #fb7185 0%, #f43f5e 100%);
  box-shadow: 0 0 22px rgba(244, 63, 94, 0.65), 0 4px 8px rgba(0, 0, 0, 0.12);
  transform: translateY(-1px);
}
.neon-btn-rose:active {
  transform: scale(0.97);
}

/* Neon Amber / Warning Buttons */
.neon-btn-amber {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: #ffffff;
  border: 1px solid rgba(252, 211, 77, 0.6);
  box-shadow: 0 0 14px rgba(245, 158, 11, 0.4), 0 2px 4px rgba(0, 0, 0, 0.08);
  font-weight: 700;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
.neon-btn-amber:hover {
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  box-shadow: 0 0 22px rgba(245, 158, 11, 0.65), 0 4px 8px rgba(0, 0, 0, 0.12);
  transform: translateY(-1px);
}
.neon-btn-amber:active {
  transform: scale(0.97);
}

/* Outlined Neon Buttons */
.neon-btn-outline-emerald {
  background: rgba(16, 185, 129, 0.08);
  color: #059669;
  border: 1.5px solid rgba(16, 185, 129, 0.45);
  box-shadow: 0 0 10px rgba(16, 185, 129, 0.18);
  font-weight: 700;
  transition: all 0.2s ease;
}
.neon-btn-outline-emerald:hover {
  background: rgba(16, 185, 129, 0.18);
  border-color: rgba(16, 185, 129, 0.8);
  box-shadow: 0 0 16px rgba(16, 185, 129, 0.35);
}
.dark .neon-btn-outline-emerald {
  color: #34d399;
  border-color: rgba(52, 211, 153, 0.5);
  box-shadow: 0 0 12px rgba(16, 185, 129, 0.25);
}

.neon-btn-outline-cyan {
  background: rgba(6, 182, 212, 0.08);
  color: #0891b2;
  border: 1.5px solid rgba(6, 182, 212, 0.45);
  box-shadow: 0 0 10px rgba(6, 182, 212, 0.18);
  font-weight: 700;
  transition: all 0.2s ease;
}
.neon-btn-outline-cyan:hover {
  background: rgba(6, 182, 212, 0.18);
  border-color: rgba(6, 182, 212, 0.8);
  box-shadow: 0 0 16px rgba(6, 182, 212, 0.35);
}
.dark .neon-btn-outline-cyan {
  color: #22d3ee;
  border-color: rgba(34, 211, 238, 0.5);
  box-shadow: 0 0 12px rgba(6, 182, 212, 0.25);
}

/* Luminous Neon Typography Glows */
.neon-text-emerald {
  color: #059669;
  text-shadow: 0 0 8px rgba(16, 185, 129, 0.25);
}
.dark .neon-text-emerald {
  color: #34d399;
  text-shadow: 0 0 14px rgba(52, 211, 153, 0.65);
}

.neon-text-cyan {
  color: #0891b2;
  text-shadow: 0 0 8px rgba(6, 182, 212, 0.25);
}
.dark .neon-text-cyan {
  color: #22d3ee;
  text-shadow: 0 0 14px rgba(34, 211, 238, 0.65);
}

.neon-text-rose {
  color: #e11d48;
  text-shadow: 0 0 8px rgba(244, 63, 94, 0.25);
}
.dark .neon-text-rose {
  color: #fb7185;
  text-shadow: 0 0 14px rgba(251, 113, 133, 0.65);
}

.neon-text-amber {
  color: #d97706;
  text-shadow: 0 0 8px rgba(245, 158, 11, 0.25);
}
.dark .neon-text-amber {
  color: #fbbf24;
  text-shadow: 0 0 14px rgba(251, 191, 36, 0.65);
}

/* ============================================================
   HOLLOW NEON CHART BAR BORDER UTILITIES (EMPTY FILLS)
   ============================================================ */

.neon-chart-bar-expense {
  background-color: transparent !important;
  border: 2px solid #ef4444 !important;
  box-shadow: 0 0 8px rgba(239, 68, 68, 0.45);
}

.neon-chart-bar-interest {
  background-color: transparent !important;
  border: 2px solid #facc15 !important;
  box-shadow: 0 0 8px rgba(250, 204, 21, 0.45);
}

.neon-chart-bar-payment {
  background-color: transparent !important;
  border: 2px solid #34d399 !important;
  box-shadow: 0 0 8px rgba(52, 211, 153, 0.45);
}

/* Light / Dark Mode Scrollbars */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.4);
  border-radius: 9999px;
}
::-webkit-scrollbar-thumb:hover {
  background: rgba(100, 116, 139, 0.6);
}
.dark ::-webkit-scrollbar-thumb {
  background: rgba(71, 85, 105, 0.5);
}
.dark ::-webkit-scrollbar-thumb:hover {
  background: rgba(100, 116, 139, 0.8);
}

.pb-safe {
  padding-bottom: env(safe-area-inset-bottom, 1rem);
}
.pt-safe {
  padding-top: env(safe-area-inset-top, 0.5rem);
}
```

---

## 2. `src/components/dashboard/NeonChart.tsx`

```tsx
import React, { useState, useMemo } from 'react';
import { BarChart3, AlignLeft, LayoutGrid, Calendar } from 'lucide-react';
import { CardProfile, Transaction } from '../../types';
import { COMMERCIAL_BANK_MONTHLY_HISTORY } from '../../data/initialData';
import { formatCurrency } from '../../utils/formatters';

interface NeonChartProps {
  cards: CardProfile[];
  transactionsByCard: Record<string, Transaction[]>;
}

export const NeonChart: React.FC<NeonChartProps> = ({ cards, transactionsByCard }) => {
  const [selectedCardFilter, setSelectedCardFilter] = useState<string>('ALL');
  const [timeRange, setTimeRange] = useState<'6m' | '12m' | 'all'>('all');
  const [orientation, setOrientation] = useState<'horizontal' | 'vertical'>('horizontal');
  const [activeTooltip, setActiveTooltip] = useState<{
    month: string;
    use: number;
    intFee: number;
    pay: number;
  } | null>(null);

  // Compile monthly data across all or selected card
  const chartData = useMemo(() => {
    const map = new Map<string, { use: number; intFee: number; pay: number }>();

    // Seed commercial bank monthly history if Commercial Bank is included
    if (selectedCardFilter === 'ALL' || selectedCardFilter === 'card-commercial-bank') {
      COMMERCIAL_BANK_MONTHLY_HISTORY.forEach((item) => {
        map.set(item.month, {
          use: item.use,
          intFee: item.intFee,
          pay: item.pay,
        });
      });
    }

    // Merge live transactions
    const cardsToProcess = selectedCardFilter === 'ALL' 
      ? cards 
      : cards.filter(c => c.id === selectedCardFilter);

    cardsToProcess.forEach((card) => {
      const txs = transactionsByCard[card.id] || [];
      txs.forEach((tx) => {
        const m = tx.month || 'Other';
        if (!map.has(m)) {
          map.set(m, { use: 0, intFee: 0, pay: 0 });
        }
        const cur = map.get(m)!;
        if (tx.type === 'Pay') {
          cur.pay += tx.amount;
        } else if (tx.type === 'Interest/Fee') {
          cur.intFee += tx.amount;
        } else {
          cur.use += tx.amount;
        }
      });
    });

    let list = Array.from(map.entries()).map(([month, vals]) => ({
      month,
      use: Math.round(vals.use * 100) / 100,
      intFee: Math.round(vals.intFee * 100) / 100,
      pay: Math.round(vals.pay * 100) / 100,
    }));

    if (timeRange === '6m') {
      list = list.slice(-6);
    } else if (timeRange === '12m') {
      list = list.slice(-12);
    }

    return list;
  }, [cards, transactionsByCard, selectedCardFilter, timeRange]);

  // Max value for scaling
  const maxValue = useMemo(() => {
    let max = 10000;
    chartData.forEach((d) => {
      if (d.use > max) max = d.use;
      if (d.pay > max) max = d.pay;
      if (d.intFee > max) max = d.intFee;
    });
    return Math.ceil(max / 50000) * 50000 || 200000;
  }, [chartData]);

  const tickMarks = [0, maxValue * 0.25, maxValue * 0.5, maxValue * 0.75, maxValue];

  return (
    <div className="space-y-4">
      {/* Neon Header & Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-2xl transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-50 dark:bg-cyan-950/80 border border-cyan-500/40 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shadow-[0_0_14px_rgba(6,182,212,0.25)]">
            <BarChart3 className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5 drop-shadow-[0_0_6px_rgba(6,182,212,0.2)]">
              <span>Monthly Payment & Usage Analytics</span>
              <span className="text-[10px] text-cyan-700 dark:text-cyan-400 font-mono font-medium">['Total Use' vs 'Total Pay' vs 'Interest']</span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Interactive monthly trends with real-time balance calculations
            </p>
          </div>
        </div>

        {/* Neon Control Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Card Filter Selector */}
          <div className="relative">
            <select
              value={selectedCardFilter}
              onChange={(e) => setSelectedCardFilter(e.target.value)}
              className="appearance-none bg-white dark:bg-slate-900 border border-cyan-500/40 hover:border-cyan-500 text-cyan-800 dark:text-cyan-300 text-xs rounded-xl px-3 py-1.5 pr-7 focus:outline-none shadow-[0_0_10px_rgba(6,182,212,0.15)] transition-all cursor-pointer font-bold"
            >
              <option value="ALL">All Cards Combined</option>
              {cards.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Time Range Neon Button Group */}
          <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-950 p-1 rounded-xl border border-slate-200/90 dark:border-slate-800">
            {(['6m', '12m', 'all'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTimeRange(t)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all uppercase tracking-wider cursor-pointer active:scale-95 ${
                  timeRange === t
                    ? 'bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 border border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-transparent'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Orientation Toggle Neon Buttons */}
          <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-950 p-1 rounded-xl border border-slate-200/90 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setOrientation('horizontal')}
              title="Horizontal Neon Bars"
              className={`p-1.5 rounded-lg transition-all cursor-pointer active:scale-95 ${
                orientation === 'horizontal'
                  ? 'bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 border border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-transparent'
              }`}
            >
              <AlignLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setOrientation('vertical')}
              title="Vertical Neon Columns"
              className={`p-1.5 rounded-lg transition-all cursor-pointer active:scale-95 ${
                orientation === 'vertical'
                  ? 'bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 border border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-transparent'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Chart Canvas */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/90 shadow-sm dark:shadow-2xl relative overflow-hidden transition-colors">
        {/* Neon Outline Legend */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 pb-4 border-b border-slate-200 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-xs bg-transparent border-2 border-red-500 dark:border-red-400 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
            <span className="text-slate-700 dark:text-slate-300 font-medium text-xs">
              Total Use <strong className="text-red-500 dark:text-red-400 font-bold">(Neon Red Expense)</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-xs bg-transparent border-2 border-yellow-400 dark:border-yellow-300 shadow-[0_0_8px_rgba(250,204,21,0.5)]" />
            <span className="text-slate-700 dark:text-slate-300 font-medium text-xs">
              Interest & Fee <strong className="text-yellow-600 dark:text-yellow-400 font-bold">(Neon Yellow Interest)</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-xs bg-transparent border-2 border-emerald-400 dark:border-emerald-300 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
            <span className="text-slate-700 dark:text-slate-300 font-medium text-xs">
              Total Pay <strong className="text-emerald-600 dark:text-emerald-400 font-bold">(Neon Green Payment)</strong>
            </span>
          </div>
        </div>

        {/* Selected Tooltip */}
        {activeTooltip && (
          <div className="my-3 p-3 bg-slate-50 dark:bg-slate-900/95 border border-cyan-500/40 shadow-[0_0_14px_rgba(6,182,212,0.25)] rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs animate-fadeIn">
            <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              <span>{activeTooltip.month}</span>
            </span>
            <div className="flex items-center gap-4 font-mono text-[11px] sm:text-xs">
              <span className="text-red-500 dark:text-red-400">
                Use: <strong className="text-slate-900 dark:text-white">Rs. {formatCurrency(activeTooltip.use)}</strong>
              </span>
              {activeTooltip.intFee > 0 && (
                <span className="text-yellow-600 dark:text-yellow-400">
                  Int & Fee: <strong className="text-slate-900 dark:text-white">Rs. {formatCurrency(activeTooltip.intFee)}</strong>
                </span>
              )}
              <span className="text-emerald-600 dark:text-emerald-400">
                Pay: <strong className="text-slate-900 dark:text-white">Rs. {formatCurrency(activeTooltip.pay)}</strong>
              </span>
            </div>
          </div>
        )}

        {/* Horizontal Neon Outline Bars (Empty fill, neon glowing borders) */}
        {orientation === 'horizontal' ? (
          <div className="space-y-4 pt-4">
            <div className="flex justify-between pl-20 sm:pl-28 text-[10px] text-slate-400 dark:text-slate-500 font-mono border-b border-slate-200 dark:border-slate-800 pb-1">
              {tickMarks.map((tick, i) => (
                <span key={i} className="text-center">
                  {tick === 0 ? 'Rs. 0' : `${Math.round(tick / 1000)}k`}
                </span>
              ))}
            </div>

            <div className="space-y-3.5">
              {chartData.map((d) => {
                const usePct = (d.use / maxValue) * 100;
                const intPct = (d.intFee / maxValue) * 100;
                const payPct = (d.pay / maxValue) * 100;

                return (
                  <div
                    key={d.month}
                    onMouseEnter={() => setActiveTooltip(d)}
                    onClick={() => setActiveTooltip(d)}
                    className="flex items-center gap-3 group cursor-pointer"
                  >
                    {/* Month Label */}
                    <div className="w-16 sm:w-24 text-[11px] sm:text-xs text-slate-600 dark:text-slate-400 group-hover:text-cyan-600 dark:group-hover:text-cyan-300 font-medium text-right shrink-0 truncate transition-colors">
                      {d.month}
                    </div>

                    {/* Bars Container */}
                    <div className="flex-1 space-y-1.5 bg-slate-50/70 dark:bg-slate-900/40 p-2 rounded-xl border border-slate-200/90 dark:border-slate-800/80 group-hover:border-cyan-500/40 transition-colors">
                      {/* Neon Red Border Bar (Expense / Use) */}
                      <div className="h-3 sm:h-3.5 flex items-center">
                        <div
                          style={{ width: `${Math.max(Math.min(usePct, 100), d.use > 0 ? 3 : 0)}%` }}
                          className="h-full bg-transparent border-2 border-red-500 dark:border-red-400 rounded-md shadow-[0_0_8px_rgba(239,68,68,0.45)] transition-all duration-300"
                        />
                      </div>

                      {/* Neon Yellow Border Bar (Interest & Fee) */}
                      {d.intFee > 0 && (
                        <div className="h-2.5 sm:h-3 flex items-center">
                          <div
                            style={{ width: `${Math.max(Math.min(intPct, 100), 3)}%` }}
                            className="h-full bg-transparent border-2 border-yellow-400 dark:border-yellow-300 rounded-md shadow-[0_0_8px_rgba(250,204,21,0.45)] transition-all duration-300"
                          />
                        </div>
                      )}

                      {/* Neon Green Border Bar (Payment / Pay) */}
                      <div className="h-3 sm:h-3.5 flex items-center">
                        <div
                          style={{ width: `${Math.max(Math.min(payPct, 100), d.pay > 0 ? 3 : 0)}%` }}
                          className="h-full bg-transparent border-2 border-emerald-400 dark:border-emerald-300 rounded-md shadow-[0_0_8px_rgba(52,211,153,0.45)] transition-all duration-300"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Vertical Neon Columns (Empty fill, neon glowing borders) */
          <div className="pt-6">
            <div className="flex items-end gap-2 sm:gap-4 h-64 overflow-x-auto pb-4 pt-2">
              {chartData.map((d) => {
                const useHeight = (d.use / maxValue) * 100;
                const intHeight = (d.intFee / maxValue) * 100;
                const payHeight = (d.pay / maxValue) * 100;

                return (
                  <div
                    key={d.month}
                    onMouseEnter={() => setActiveTooltip(d)}
                    onClick={() => setActiveTooltip(d)}
                    className="flex flex-col items-center flex-1 min-w-[50px] h-full justify-end cursor-pointer group"
                  >
                    <div className="flex items-end gap-1.5 h-48 w-full justify-center px-1">
                      {/* Neon Red Use Column (Expense) */}
                      <div
                        style={{ height: `${Math.max(useHeight, 3)}%` }}
                        className="w-3.5 sm:w-4.5 rounded-t-md bg-transparent border-2 border-red-500 dark:border-red-400 shadow-[0_0_8px_rgba(239,68,68,0.45)] transition-all group-hover:brightness-125"
                        title={`Use: Rs. ${formatCurrency(d.use)}`}
                      />

                      {/* Neon Yellow Int Column (Interest) */}
                      {d.intFee > 0 && (
                        <div
                          style={{ height: `${Math.max(intHeight, 3)}%` }}
                          className="w-3 sm:w-3.5 rounded-t-md bg-transparent border-2 border-yellow-400 dark:border-yellow-300 shadow-[0_0_8px_rgba(250,204,21,0.45)] transition-all"
                          title={`Int: Rs. ${formatCurrency(d.intFee)}`}
                        />
                      )}

                      {/* Neon Green Pay Column (Payment) */}
                      <div
                        style={{ height: `${Math.max(payHeight, 3)}%` }}
                        className="w-3.5 sm:w-4.5 rounded-t-md bg-transparent border-2 border-emerald-400 dark:border-emerald-300 shadow-[0_0_8px_rgba(52,211,153,0.45)] transition-all group-hover:brightness-125"
                        title={`Pay: Rs. ${formatCurrency(d.pay)}`}
                      />
                    </div>

                    <span className="text-[10px] text-slate-600 dark:text-slate-400 mt-2 rotate-[-45deg] origin-top-left group-hover:text-cyan-600 dark:group-hover:text-cyan-300 whitespace-nowrap font-medium transition-colors">
                      {d.month}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
```

---

## 3. `src/components/tracker/AnalyticsChart.tsx`

```tsx
import React, { useState, useMemo } from 'react';
import { BarChart3, AlignLeft, LayoutGrid, Calendar } from 'lucide-react';
import { Transaction } from '../../types';
import { COMMERCIAL_BANK_MONTHLY_HISTORY } from '../../data/initialData';
import { formatCurrency } from '../../utils/formatters';

interface AnalyticsChartProps {
  cardId: string;
  transactions: Transaction[];
}

export const AnalyticsChart: React.FC<AnalyticsChartProps> = ({ cardId, transactions }) => {
  const isCommercial = cardId === 'card-commercial-bank';
  const [timeRange, setTimeRange] = useState<'6m' | '12m' | 'all'>('all');
  const [orientation, setOrientation] = useState<'horizontal' | 'vertical'>('horizontal');
  const [activeTooltip, setActiveTooltip] = useState<{
    month: string;
    use: number;
    intFee: number;
    pay: number;
  } | null>(null);

  // Group transactions by month
  const chartData = useMemo(() => {
    const map = new Map<string, { use: number; intFee: number; pay: number }>();

    if (isCommercial) {
      COMMERCIAL_BANK_MONTHLY_HISTORY.forEach((item) => {
        map.set(item.month, {
          use: item.use,
          intFee: item.intFee,
          pay: item.pay,
        });
      });
    }

    transactions.forEach((tx) => {
      const m = tx.month || 'Other';
      if (!map.has(m)) {
        map.set(m, { use: 0, intFee: 0, pay: 0 });
      }
      const cur = map.get(m)!;
      if (tx.type === 'Pay') {
        cur.pay += tx.amount;
      } else if (tx.type === 'Interest/Fee') {
        cur.intFee += tx.amount;
      } else {
        cur.use += tx.amount;
      }
    });

    let list = Array.from(map.entries()).map(([month, vals]) => ({
      month,
      use: Math.round(vals.use * 100) / 100,
      intFee: Math.round(vals.intFee * 100) / 100,
      pay: Math.round(vals.pay * 100) / 100,
    }));

    if (timeRange === '6m') {
      list = list.slice(-6);
    } else if (timeRange === '12m') {
      list = list.slice(-12);
    }

    return list;
  }, [cardId, transactions, isCommercial, timeRange]);

  const maxValue = useMemo(() => {
    let max = 10000;
    chartData.forEach((d) => {
      if (d.use > max) max = d.use;
      if (d.pay > max) max = d.pay;
      if (d.intFee > max) max = d.intFee;
    });
    return Math.ceil(max / 50000) * 50000 || 200000;
  }, [chartData]);

  const tickMarks = [0, maxValue * 0.25, maxValue * 0.5, maxValue * 0.75, maxValue];

  return (
    <div className="space-y-4">
      {/* Controls Bar with Neon Touch */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm dark:shadow-xl transition-colors">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-400/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-[0_0_10px_rgba(16,185,129,0.25)]">
            <BarChart3 className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white drop-shadow-[0_0_6px_rgba(16,185,129,0.2)]">
              Payment History Analytics
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Monthly breakdown: Use vs Int & Fee vs Pay</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Time range buttons with Neon Glow */}
          <div className="flex items-center bg-slate-50 dark:bg-slate-950 p-1 rounded-xl border border-slate-200/90 dark:border-slate-800 text-[11px]">
            <button
              onClick={() => setTimeRange('6m')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                timeRange === '6m' 
                  ? 'bg-emerald-500 text-slate-950 shadow-[0_0_10px_rgba(16,185,129,0.5)]' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              6M
            </button>
            <button
              onClick={() => setTimeRange('12m')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                timeRange === '12m' 
                  ? 'bg-emerald-500 text-slate-950 shadow-[0_0_10px_rgba(16,185,129,0.5)]' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              12M
            </button>
            <button
              onClick={() => setTimeRange('all')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                timeRange === 'all' 
                  ? 'bg-emerald-500 text-slate-950 shadow-[0_0_10px_rgba(16,185,129,0.5)]' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All
            </button>
          </div>

          {/* Orientation Toggle */}
          <div className="flex items-center bg-slate-50 dark:bg-slate-950 p-1 rounded-xl border border-slate-200/90 dark:border-slate-800">
            <button
              onClick={() => setOrientation('horizontal')}
              title="Horizontal Bars"
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                orientation === 'horizontal' 
                  ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.3)]' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <AlignLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setOrientation('vertical')}
              title="Vertical Columns"
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                orientation === 'vertical' 
                  ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.3)]' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Chart Card */}
      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm dark:shadow-2xl p-4 sm:p-6 overflow-hidden transition-colors">
        {/* Legend with Neon Outline Indicators */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 pb-4 border-b border-slate-200/90 dark:border-slate-800/80 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-xs bg-transparent border-2 border-red-500 dark:border-red-400 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
            <span className="text-slate-700 dark:text-slate-300 font-semibold text-[11px] sm:text-xs">
              Monthly Payment History <strong className="text-red-500 dark:text-red-400">Use (Neon Red Expense)</strong>
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-xs bg-transparent border-2 border-yellow-400 dark:border-yellow-300 shadow-[0_0_8px_rgba(250,204,21,0.5)]" />
            <span className="text-slate-700 dark:text-slate-300 font-semibold text-[11px] sm:text-xs">
              Monthly Payment History <strong className="text-yellow-600 dark:text-yellow-400">Int & Fee (Neon Yellow Interest)</strong>
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-xs bg-transparent border-2 border-emerald-400 dark:border-emerald-300 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
            <span className="text-slate-700 dark:text-slate-300 font-semibold text-[11px] sm:text-xs">
              Monthly Payment History <strong className="text-emerald-600 dark:text-emerald-400">Pay (Neon Green Payment)</strong>
            </span>
          </div>
        </div>

        {/* Selected Tooltip Callout */}
        {activeTooltip && (
          <div className="my-3 p-3 bg-slate-50 dark:bg-slate-950/90 border border-slate-200/90 dark:border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs animate-fadeIn shadow-xs">
            <span className="font-bold text-slate-900 dark:text-white">{activeTooltip.month}</span>
            <div className="flex items-center gap-4 font-mono">
              <span className="text-red-500 dark:text-red-400 font-bold">
                Use: <strong>Rs. {formatCurrency(activeTooltip.use)}</strong>
              </span>
              {activeTooltip.intFee > 0 && (
                <span className="text-yellow-600 dark:text-yellow-400 font-bold">
                  Int & Fee: <strong>Rs. {formatCurrency(activeTooltip.intFee)}</strong>
                </span>
              )}
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                Pay: <strong>Rs. {formatCurrency(activeTooltip.pay)}</strong>
              </span>
            </div>
          </div>
        )}

        {/* HORIZONTAL BARS VIEW */}
        {orientation === 'horizontal' ? (
          <div className="space-y-4 pt-4">
            <div className="flex justify-between pl-20 sm:pl-28 text-[10px] text-slate-500 dark:text-slate-400 font-mono border-b border-slate-200/90 dark:border-slate-800 pb-1">
              {tickMarks.map((tick, i) => (
                <span key={i} className="text-center font-semibold">
                  {tick === 0 ? '-' : `${Math.round(tick / 1000)}k`}
                </span>
              ))}
            </div>

            <div className="space-y-3.5">
              {chartData.map((d) => {
                const usePct = (d.use / maxValue) * 100;
                const intPct = (d.intFee / maxValue) * 100;
                const payPct = (d.pay / maxValue) * 100;

                return (
                  <div
                    key={d.month}
                    onMouseEnter={() => setActiveTooltip(d)}
                    onClick={() => setActiveTooltip(d)}
                    className="flex items-center gap-3 group cursor-pointer"
                  >
                    <span className="w-20 sm:w-24 text-right font-semibold text-slate-700 dark:text-slate-300 text-xs shrink-0 font-sans group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {d.month}
                    </span>

                    <div className="flex-1 space-y-1.5">
                      {/* Use bar (Neon Red border, empty fill) */}
                      {d.use > 0 && (
                        <div className="flex items-center gap-2">
                          <div
                            style={{ width: `${Math.max(usePct, 2)}%` }}
                            className="h-3 sm:h-3.5 rounded-md bg-transparent border-2 border-red-500 dark:border-red-400 shadow-[0_0_8px_rgba(239,68,68,0.45)] transition-all duration-300"
                          />
                          <span className="text-[10px] text-red-500 dark:text-red-400 font-mono font-bold shrink-0">
                            {formatCurrency(d.use)}
                          </span>
                        </div>
                      )}

                      {/* Int & Fee bar (Neon Yellow border, empty fill) */}
                      {d.intFee > 0 && (
                        <div className="flex items-center gap-2">
                          <div
                            style={{ width: `${Math.max(intPct, 2)}%` }}
                            className="h-3 sm:h-3.5 rounded-md bg-transparent border-2 border-yellow-400 dark:border-yellow-300 shadow-[0_0_8px_rgba(250,204,21,0.45)] transition-all duration-300"
                          />
                          <span className="text-[10px] text-yellow-600 dark:text-yellow-400 font-mono font-bold shrink-0">
                            {formatCurrency(d.intFee)}
                          </span>
                        </div>
                      )}

                      {/* Pay bar (Neon Green border, empty fill) */}
                      {d.pay > 0 && (
                        <div className="flex items-center gap-2">
                          <div
                            style={{ width: `${Math.max(payPct, 2)}%` }}
                            className="h-3 sm:h-3.5 rounded-md bg-transparent border-2 border-emerald-400 dark:border-emerald-300 shadow-[0_0_8px_rgba(52,211,153,0.45)] transition-all duration-300"
                          />
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold shrink-0">
                            {formatCurrency(d.pay)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* VERTICAL COLUMNS VIEW */
          <div className="pt-6">
            <div className="h-64 sm:h-72 flex items-end justify-between gap-2 border-b border-slate-200/90 dark:border-slate-800 pb-2 px-2">
              {chartData.map((d) => {
                const useHeight = Math.max((d.use / maxValue) * 100, 2);
                const intHeight = Math.max((d.intFee / maxValue) * 100, 2);
                const payHeight = Math.max((d.pay / maxValue) * 100, 2);

                return (
                  <div
                    key={d.month}
                    onMouseEnter={() => setActiveTooltip(d)}
                    onClick={() => setActiveTooltip(d)}
                    className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
                  >
                    <div className="w-full flex items-end justify-center gap-1.5 h-full">
                      {d.use > 0 && (
                        <div
                          style={{ height: `${useHeight}%` }}
                          className="w-full max-w-[14px] bg-transparent border-2 border-red-500 dark:border-red-400 rounded-t-md shadow-[0_0_8px_rgba(239,68,68,0.45)] transition-all duration-300"
                        />
                      )}
                      {d.intFee > 0 && (
                        <div
                          style={{ height: `${intHeight}%` }}
                          className="w-full max-w-[14px] bg-transparent border-2 border-yellow-400 dark:border-yellow-300 rounded-t-md shadow-[0_0_8px_rgba(250,204,21,0.45)] transition-all duration-300"
                        />
                      )}
                      {d.pay > 0 && (
                        <div
                          style={{ height: `${payHeight}%` }}
                          className="w-full max-w-[14px] bg-transparent border-2 border-emerald-400 dark:border-emerald-300 rounded-t-md shadow-[0_0_8px_rgba(52,211,153,0.45)] transition-all duration-300"
                        />
                      )}
                    </div>
                    <span className="text-[10px] text-slate-600 dark:text-slate-400 font-mono mt-2 truncate w-full text-center group-hover:text-emerald-600 dark:group-hover:text-emerald-400 font-bold transition-colors">
                      {d.month}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
```

---

## 4. `src/App.tsx` (Summary & Theme Provider)

```tsx
// Key snippet: Light mode default with full theme toggle and Google Drive sync orchestration
const [theme, setTheme] = useState<'dark' | 'light'>(() => {
  try {
    const stored = localStorage.getItem('creditrack_theme');
    if (stored === 'light' || stored === 'dark') return stored;
  } catch (e) {
    console.error(e);
  }
  return 'light'; // Clean light mode with neon accents
});

useEffect(() => {
  localStorage.setItem('creditrack_theme', theme);
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
    document.documentElement.classList.remove('light');
  } else {
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
  }
}, [theme]);
```

---

## 5. Verification & Test Results
- `npm run lint` (`tsc --noEmit`): **Passed 0 errors**
- `compile_applet`: **Build succeeded**
- Chart bars rendered with 100% transparent/empty centers and luminous neon borders.
