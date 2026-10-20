import React, { useState, useMemo } from 'react';
import { BarChart3, AlignLeft, LayoutGrid, Calendar, Sparkles } from 'lucide-react';
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

    // Initial baseline for Commercial Bank
    if (isCommercial) {
      COMMERCIAL_BANK_MONTHLY_HISTORY.forEach((item) => {
        map.set(item.month, {
          use: item.use,
          intFee: item.intFee,
          pay: item.pay,
        });
      });
    }

    // Merge transactions
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

  // Find max value for scaling
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

        {/* HORIZONTAL BARS VIEW (Empty fill, neon glowing borders) */}
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
          /* VERTICAL COLUMNS VIEW (Empty fill, neon glowing borders) */
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
