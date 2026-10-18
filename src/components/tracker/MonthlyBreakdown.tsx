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
    // If it's Commercial Bank, start with the authentic baseline history from Image 2
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

    // Add or override with live transactions in the database
    // For months that have itemized transactions, let's tally them:
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

    // Merge: For months with live transactions, use live calculation (or maximum to preserve baseline if testing)
    liveMap.forEach((val, month) => {
      map.set(month, val);
    });

    // Convert map to sorted list
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
      {/* Top Banner Matching Image 2 Header Exactly */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md dark:shadow-xl transition-colors">
        {/* Total Use (Red) */}
        <div className="text-center sm:text-left">
          <p className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Total Use
          </p>
          <p className="text-sm sm:text-lg font-bold text-rose-500 font-mono mt-0.5">
            {formatCurrency(totals.totalUse)}
          </p>
        </div>

        {/* Total Pay (Green) */}
        <div className="text-center sm:text-left border-x border-slate-200 dark:border-slate-800/80 px-2 sm:px-4">
          <p className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Total Pay
          </p>
          <p className="text-sm sm:text-lg font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
            {formatCurrency(totals.totalPay)}
          </p>
        </div>

        {/* Total Int & Fee (Amber) */}
        <div className="text-center sm:text-left">
          <p className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Total Int & Fee
          </p>
          <p className="text-sm sm:text-lg font-bold text-amber-500 dark:text-amber-400 font-mono mt-0.5">
            {formatCurrency(totals.totalInt)}
          </p>
        </div>
      </div>

      {/* Monthly Payment History Table (Replica of Image 2 Left Table) */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-md dark:shadow-xl transition-colors">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/70">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white tracking-wide uppercase">
            Monthly Payment History
          </h3>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            {monthlyData.length} Billing Periods
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-2.5 px-4 whitespace-nowrap">Month</th>
                <th className="py-2.5 px-3.5 text-right whitespace-nowrap text-rose-500">Use (Rs.)</th>
                <th className="py-2.5 px-3.5 text-right whitespace-nowrap text-amber-500 dark:text-amber-400">Int & Fee (Rs.)</th>
                <th className="py-2.5 px-3.5 text-right whitespace-nowrap text-emerald-600 dark:text-emerald-400">Pay (Rs.)</th>
                <th className="py-2.5 px-4 text-right whitespace-nowrap text-slate-600 dark:text-slate-300">Net Delta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono text-xs">
              {monthlyData.map((row) => {
                return (
                  <tr key={row.month} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    {/* Month */}
                    <td className="py-2.5 px-4 whitespace-nowrap text-slate-800 dark:text-slate-300 font-sans font-medium">
                      {row.month}
                    </td>

                    {/* Use */}
                    <td className="py-2.5 px-3.5 text-right whitespace-nowrap font-bold text-rose-600 dark:text-rose-500">
                      {row.totalUse > 0 ? formatCurrency(row.totalUse) : '-'}
                    </td>

                    {/* Int & Fee */}
                    <td className="py-2.5 px-3.5 text-right whitespace-nowrap font-semibold text-amber-700 dark:text-amber-400">
                      {row.totalInterestFee > 0 ? formatCurrency(row.totalInterestFee) : '-'}
                    </td>

                    {/* Pay */}
                    <td className="py-2.5 px-3.5 text-right whitespace-nowrap font-bold text-emerald-700 dark:text-emerald-400">
                      {row.totalPay > 0 ? formatCurrency(row.totalPay) : '-'}
                    </td>

                    {/* Net Delta */}
                    <td
                      className={`py-2.5 px-4 text-right whitespace-nowrap font-bold ${
                        row.netChange > 0
                          ? 'text-rose-600 dark:text-rose-400'
                          : row.netChange < 0
                          ? 'text-emerald-700 dark:text-emerald-400'
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
