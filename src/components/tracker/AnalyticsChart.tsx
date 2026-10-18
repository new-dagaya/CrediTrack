import React, { useState, useMemo } from 'react';
import { Transaction } from '../../types';
import { COMMERCIAL_BANK_MONTHLY_HISTORY } from '../../data/initialData';
import { formatCurrency } from '../../utils/formatters';
import { BarChart3, TrendingUp, Calendar, LayoutGrid, AlignLeft } from 'lucide-react';

interface AnalyticsChartProps {
  cardId: string;
  transactions: Transaction[];
}

export const AnalyticsChart: React.FC<AnalyticsChartProps> = ({ cardId, transactions }) => {
  const isCommercial = cardId === 'card-commercial-bank';
  const [orientation, setOrientation] = useState<'horizontal' | 'vertical'>('horizontal');
  const [timeRange, setTimeRange] = useState<'all' | '12m' | '6m'>('all');
  const [activeTooltip, setActiveTooltip] = useState<{
    month: string;
    use: number;
    intFee: number;
    pay: number;
  } | null>(null);

  // Group data by month
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

    // Add or override with live transactions
    const liveMap = new Map<string, { use: number; intFee: number; pay: number }>();
    transactions.forEach((tx) => {
      const m = tx.month || 'Other';
      if (!liveMap.has(m)) {
        liveMap.set(m, { use: 0, intFee: 0, pay: 0 });
      }
      const cur = liveMap.get(m)!;
      if (tx.type === 'Pay') cur.pay += tx.amount;
      else if (tx.type === 'Interest/Fee') cur.intFee += tx.amount;
      else cur.use += tx.amount;
    });

    liveMap.forEach((val, month) => {
      map.set(month, val);
    });

    let items = Array.from(map.entries()).map(([month, vals]) => ({
      month,
      use: Math.round(vals.use * 100) / 100,
      intFee: Math.round(vals.intFee * 100) / 100,
      pay: Math.round(vals.pay * 100) / 100,
    }));

    if (timeRange === '6m') {
      items = items.slice(-6);
    } else if (timeRange === '12m') {
      items = items.slice(-12);
    }

    return items;
  }, [cardId, transactions, isCommercial, timeRange]);

  // Find max value for scaling
  const maxValue = useMemo(() => {
    let max = 10000;
    chartData.forEach((d) => {
      if (d.use > max) max = d.use;
      if (d.pay > max) max = d.pay;
      if (d.intFee > max) max = d.intFee;
    });
    // Round up to nearest 50,000 like Image 2
    return Math.ceil(max / 50000) * 50000 || 200000;
  }, [chartData]);

  const tickMarks = [0, maxValue * 0.25, maxValue * 0.5, maxValue * 0.75, maxValue];

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">Payment History Analytics</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Monthly breakdown: Use vs Int & Fee vs Pay</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Time range buttons */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px]">
            <button
              onClick={() => setTimeRange('6m')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                timeRange === '6m' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              6M
            </button>
            <button
              onClick={() => setTimeRange('12m')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                timeRange === '12m' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              12M
            </button>
            <button
              onClick={() => setTimeRange('all')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                timeRange === 'all' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All
            </button>
          </div>

          {/* Orientation Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setOrientation('horizontal')}
              title="Horizontal Bars (As in Google Sheet Image 2)"
              className={`p-1.5 rounded-lg transition-colors ${
                orientation === 'horizontal' ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <AlignLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setOrientation('vertical')}
              title="Vertical Columns"
              className={`p-1.5 rounded-lg transition-colors ${
                orientation === 'vertical' ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Chart Card (Styled with authentic theme reminiscent of Image 2) */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-md dark:shadow-2xl p-4 sm:p-6 overflow-hidden transition-colors">
        
        {/* Legend Exactly as in Image 2 */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 pb-4 border-b border-slate-200 dark:border-slate-800/80 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-rose-500 shadow-sm shadow-rose-500/40" />
            <span className="text-slate-700 dark:text-slate-300 font-medium text-[11px] sm:text-xs">
              Monthly Payment History <strong className="text-rose-500">Use</strong>
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-amber-400 shadow-sm shadow-amber-400/40" />
            <span className="text-slate-700 dark:text-slate-300 font-medium text-[11px] sm:text-xs">
              Monthly Payment History <strong className="text-amber-500 dark:text-amber-400">Int & Fee</strong>
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-emerald-500 shadow-sm shadow-emerald-500/40" />
            <span className="text-slate-700 dark:text-slate-300 font-medium text-[11px] sm:text-xs">
              Monthly Payment History <strong className="text-emerald-600 dark:text-emerald-400">Pay</strong>
            </span>
          </div>
        </div>

        {/* Selected Tooltip Callout */}
        {activeTooltip && (
          <div className="my-3 p-3 bg-white dark:bg-slate-950/90 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs animate-fadeIn shadow-sm">
            <span className="font-bold text-slate-900 dark:text-white">{activeTooltip.month}</span>
            <div className="flex items-center gap-4 font-mono">
              <span className="text-rose-600 dark:text-rose-400">
                Use: <strong>Rs. {formatCurrency(activeTooltip.use)}</strong>
              </span>
              {activeTooltip.intFee > 0 && (
                <span className="text-amber-700 dark:text-amber-400">
                  Int & Fee: <strong>Rs. {formatCurrency(activeTooltip.intFee)}</strong>
                </span>
              )}
              <span className="text-emerald-700 dark:text-emerald-400">
                Pay: <strong>Rs. {formatCurrency(activeTooltip.pay)}</strong>
              </span>
            </div>
          </div>
        )}

        {/* HORIZONTAL BARS VIEW (REPLICA OF IMAGE 2) */}
        {orientation === 'horizontal' ? (
          <div className="space-y-4 pt-4">
            {/* Horizontal Grid Ticks at top */}
            <div className="flex justify-between pl-20 sm:pl-28 text-[10px] text-slate-500 dark:text-slate-400 font-mono border-b border-slate-200 dark:border-slate-800 pb-1">
              {tickMarks.map((tick, i) => (
                <span key={i} className="text-center">
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
                    {/* Month Label */}
                    <div className="w-16 sm:w-24 text-[11px] sm:text-xs text-slate-600 dark:text-slate-400 group-hover:text-slate-950 dark:group-hover:text-white font-medium text-right shrink-0 truncate">
                      {d.month}
                    </div>

                    {/* 3 Grouped Bars per month (Use, Int, Pay) */}
                    <div className="flex-1 space-y-1 bg-slate-100 dark:bg-slate-950/60 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800/40 relative shadow-2xs">
                      {/* Red Bar (Use) */}
                      <div className="h-2.5 sm:h-3 rounded-sm bg-slate-200 dark:bg-slate-900 flex items-center overflow-hidden">
                        <div
                          style={{ width: `${Math.min(usePct, 100)}%` }}
                          className="h-full bg-rose-500 transition-all duration-300"
                        />
                      </div>

                      {/* Amber Bar (Int & Fee) */}
                      {d.intFee > 0 && (
                        <div className="h-2 sm:h-2.5 rounded-sm bg-slate-200 dark:bg-slate-900 flex items-center overflow-hidden">
                          <div
                            style={{ width: `${Math.min(intPct, 100)}%` }}
                            className="h-full bg-amber-400 transition-all duration-300"
                          />
                        </div>
                      )}

                      {/* Green Bar (Pay) */}
                      <div className="h-2.5 sm:h-3 rounded-sm bg-slate-200 dark:bg-slate-900 flex items-center overflow-hidden">
                        <div
                          style={{ width: `${Math.min(payPct, 100)}%` }}
                          className="h-full bg-emerald-500 transition-all duration-300"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* VERTICAL COLUMNS VIEW */
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
                    className="flex flex-col items-center flex-1 min-w-[48px] h-full justify-end cursor-pointer group"
                  >
                    {/* Columns container */}
                    <div className="flex items-end gap-1 h-48 w-full justify-center px-1">
                      {/* Use Column */}
                      <div
                        style={{ height: `${Math.max(useHeight, 2)}%` }}
                        className="w-3 sm:w-4 rounded-t bg-rose-500 transition-all group-hover:brightness-110"
                        title={`Use: Rs. ${formatCurrency(d.use)}`}
                      />

                      {/* Int & Fee Column */}
                      {d.intFee > 0 && (
                        <div
                          style={{ height: `${Math.max(intHeight, 2)}%` }}
                          className="w-2.5 sm:w-3 rounded-t bg-amber-400 transition-all"
                          title={`Int: Rs. ${formatCurrency(d.intFee)}`}
                        />
                      )}

                      {/* Pay Column */}
                      <div
                        style={{ height: `${Math.max(payHeight, 2)}%` }}
                        className="w-3 sm:w-4 rounded-t bg-emerald-500 transition-all group-hover:brightness-110"
                        title={`Pay: Rs. ${formatCurrency(d.pay)}`}
                      />
                    </div>

                    {/* Month Caption */}
                    <span className="text-[10px] text-slate-600 dark:text-slate-400 mt-2 rotate-[-45deg] origin-top-left group-hover:text-slate-950 dark:group-hover:text-white whitespace-nowrap">
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
