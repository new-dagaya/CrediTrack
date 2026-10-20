import React, { useMemo } from 'react';
import { Transaction, MonthlyBreakdownRow } from '../../types';
import { COMMERCIAL_BANK_MONTHLY_HISTORY } from '../../data/initialData';
import { formatCurrency } from '../../utils/formatters';
import { ArrowUpRight, ArrowDownLeft, Calendar } from 'lucide-react';

interface MonthlyBreakdownProps {
  cardId: string;
  transactions: Transaction[];
}

export const MonthlyBreakdown: React.FC<MonthlyBreakdownProps> = ({ cardId, transactions }) => {
  const isCommercial = cardId === 'card-commercial-bank';

  // Group transactions by month
  const monthlyData = useMemo(() => {
    const map = new Map<string, { use: number; intFee: number; pay: number; count: number }>();

    if (isCommercial) {
      COMMERCIAL_BANK_MONTHLY_HISTORY.forEach((item) => {
        map.set(item.month, {
          use: item.use,
          intFee: item.intFee,
          pay: item.pay,
          count: 0,
        });
      });
    }

    const liveMap = new Map<string, { use: number; intFee: number; pay: number; count: number }>();
    transactions.forEach((tx) => {
      const m = tx.month || 'Other';
      if (!liveMap.has(m)) {
        liveMap.set(m, { use: 0, intFee: 0, pay: 0, count: 0 });
      }
      const cur = liveMap.get(m)!;
      cur.count += 1;
      if (tx.type === 'Pay') {
        cur.pay += tx.amount;
      } else if (tx.type === 'Interest/Fee') {
        cur.intFee += tx.amount;
      } else {
        cur.use += tx.amount;
      }
    });

    liveMap.forEach((val, month) => {
      map.set(month, val);
    });

    const result: MonthlyBreakdownRow[] = [];
    let runningBalance = 0;

    map.forEach((val, month) => {
      const net = (val.use + val.intFee) - val.pay;
      runningBalance += net;
      result.push({
        month,
        totalUse: Math.round(val.use * 100) / 100,
        totalInterestFee: Math.round(val.intFee * 100) / 100,
        totalPay: Math.round(val.pay * 100) / 100,
        netChange: Math.round(net * 100) / 100,
        endingBalance: Math.round(runningBalance * 100) / 100,
        transactionCount: val.count,
      });
    });

    return result;
  }, [cardId, transactions, isCommercial]);

  // Overall Totals
  const totals = useMemo(() => {
    let use = 0;
    let pay = 0;
    let intFee = 0;
    monthlyData.forEach((row) => {
      use += row.totalUse;
      pay += row.totalPay;
      intFee += row.totalInterestFee;
    });
    return {
      totalUse: Math.round(use * 100) / 100,
      totalPay: Math.round(pay * 100) / 100,
      totalInt: Math.round(intFee * 100) / 100,
      netBalance: Math.round((use + intFee - pay) * 100) / 100,
    };
  }, [monthlyData]);

  return (
    <div className="space-y-4">
      {/* Top Banner with Neon Numbers */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-4 p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm dark:shadow-xl transition-colors">
        {/* Total Use (Neon Rose) */}
        <div className="text-center sm:text-left">
          <p className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Total Use
          </p>
          <p className="text-base sm:text-xl font-black text-rose-600 dark:text-rose-400 font-mono mt-0.5 drop-shadow-[0_0_8px_rgba(244,63,94,0.3)]">
            {formatCurrency(totals.totalUse)}
          </p>
        </div>

        {/* Total Pay (Neon Emerald) */}
        <div className="text-center sm:text-left border-x border-slate-200/90 dark:border-slate-800/80 px-2 sm:px-4">
          <p className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Total Pay
          </p>
          <p className="text-base sm:text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-0.5 drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]">
            {formatCurrency(totals.totalPay)}
          </p>
        </div>

        {/* Total Int & Fee (Neon Amber) */}
        <div className="text-center sm:text-left">
          <p className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Total Int & Fee
          </p>
          <p className="text-base sm:text-xl font-black text-amber-600 dark:text-amber-400 font-mono mt-0.5 drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]">
            {formatCurrency(totals.totalInt)}
          </p>
        </div>
      </div>

      {/* Monthly Payment History Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm dark:shadow-xl transition-colors">
        <div className="px-4 py-3 border-b border-slate-200/90 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/70">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white tracking-wide uppercase drop-shadow-[0_0_6px_rgba(16,185,129,0.25)]">
            Monthly Payment History
          </h3>
          <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 font-mono">
            {monthlyData.length} Billing Periods
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-950/80 border-b border-slate-200/90 dark:border-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-2.5 px-4 whitespace-nowrap">Month</th>
                <th className="py-2.5 px-3.5 text-right whitespace-nowrap text-rose-600 dark:text-rose-400">Use (Rs.)</th>
                <th className="py-2.5 px-3.5 text-right whitespace-nowrap text-amber-600 dark:text-amber-400">Int & Fee (Rs.)</th>
                <th className="py-2.5 px-3.5 text-right whitespace-nowrap text-emerald-600 dark:text-emerald-400">Pay (Rs.)</th>
                <th className="py-2.5 px-4 text-right whitespace-nowrap text-slate-700 dark:text-slate-300">Net Delta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono text-xs">
              {monthlyData.map((row) => {
                return (
                  <tr key={row.month} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    {/* Month */}
                    <td className="py-2.5 px-4 whitespace-nowrap text-slate-800 dark:text-slate-300 font-sans font-semibold">
                      {row.month}
                    </td>

                    {/* Use */}
                    <td className="py-2.5 px-3.5 text-right whitespace-nowrap font-bold text-rose-600 dark:text-rose-400">
                      {row.totalUse > 0 ? formatCurrency(row.totalUse) : '-'}
                    </td>

                    {/* Int & Fee */}
                    <td className="py-2.5 px-3.5 text-right whitespace-nowrap font-semibold text-amber-700 dark:text-amber-400">
                      {row.totalInterestFee > 0 ? formatCurrency(row.totalInterestFee) : '-'}
                    </td>

                    {/* Pay */}
                    <td className="py-2.5 px-3.5 text-right whitespace-nowrap font-bold text-emerald-600 dark:text-emerald-400">
                      {row.totalPay > 0 ? formatCurrency(row.totalPay) : '-'}
                    </td>

                    {/* Net Delta */}
                    <td
                      className={`py-2.5 px-4 text-right whitespace-nowrap font-bold ${
                        row.netChange > 0
                          ? 'text-rose-600 dark:text-rose-400'
                          : row.netChange < 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {row.netChange !== 0 ? (
                        <span>
                          {row.netChange > 0 ? '+' : ''}
                          {formatCurrency(row.netChange)}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
