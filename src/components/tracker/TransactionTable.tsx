import React, { useState, useMemo } from 'react';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Search, 
  Filter, 
  ArrowUpDown, 
  Trash2, 
  Edit2, 
  AlertTriangle,
  ChevronDown,
  Sparkles
} from 'lucide-react';
import { Transaction, TransactionType } from '../../types';
import { formatCurrency, parseTxDate } from '../../utils/formatters';

interface TransactionTableProps {
  transactions: Transaction[];
  onEdit: (tx: Transaction) => void;
  onDelete: (txId: string) => void;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  onEdit,
  onDelete,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [txToDelete, setTxToDelete] = useState<Transaction | null>(null);

  // Extract unique months in data
  const uniqueMonths = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach((tx) => {
      if (tx.month) set.add(tx.month);
    });
    return Array.from(set);
  }, [transactions]);

  // Filtered & Chronologically Sorted Transactions
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((tx) => {
        const matchesSearch =
          tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tx.date.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tx.amount.toString().includes(searchTerm);
        
        const matchesMonth = selectedMonth === 'ALL' || tx.month === selectedMonth;
        const matchesType = selectedType === 'ALL' || tx.type === selectedType;

        return matchesSearch && matchesMonth && matchesType;
      })
      .sort((a, b) => {
        const timeA = parseTxDate(a.date, a.createdAt);
        const timeB = parseTxDate(b.date, b.createdAt);
        if (timeA !== timeB) {
          return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
        }
        return sortOrder === 'desc' ? (b.createdAt || 0) - (a.createdAt || 0) : (a.createdAt || 0) - (b.createdAt || 0);
      });
  }, [transactions, searchTerm, selectedMonth, selectedType, sortOrder]);

  return (
    <div className="space-y-4">
      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search description, merchant, date..."
            className="w-full bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:shadow-[0_0_12px_rgba(16,185,129,0.25)] shadow-xs transition-all"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2">
          {/* Month selector */}
          <div className="relative flex-1 sm:w-36">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full appearance-none bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl px-3 py-2.5 pr-8 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500 focus:shadow-[0_0_12px_rgba(16,185,129,0.25)] shadow-xs transition-all cursor-pointer font-medium"
            >
              <option value="ALL">All Months</option>
              {uniqueMonths.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Type selector */}
          <div className="relative flex-1 sm:w-32">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full appearance-none bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl px-3 py-2.5 pr-8 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500 focus:shadow-[0_0_12px_rgba(16,185,129,0.25)] shadow-xs transition-all cursor-pointer font-medium"
            >
              <option value="ALL">All Types</option>
              <option value="Use">Use (Expense)</option>
              <option value="Pay">Pay (Payment)</option>
              <option value="Interest/Fee">Interest/Fee</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Sort Toggle with Neon touch */}
          <button
            onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
            title="Toggle Chronological Sort Order"
            className="min-h-[42px] min-w-[42px] flex items-center justify-center rounded-2xl bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200/90 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 shadow-xs hover:shadow-[0_0_12px_rgba(16,185,129,0.25)] transition-all cursor-pointer active:scale-95"
          >
            <ArrowUpDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Transactions Summary Counter */}
      <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 px-1 font-medium">
        <span>Showing <strong className="text-slate-900 dark:text-white">{filteredTransactions.length}</strong> of {transactions.length} records (sorted by date)</span>
        {searchTerm && (
          <button
            onClick={() => { setSearchTerm(''); setSelectedMonth('ALL'); setSelectedType('ALL'); }}
            className="text-emerald-600 dark:text-emerald-400 hover:underline font-bold drop-shadow-[0_0_6px_rgba(16,185,129,0.3)]"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Main Table Container */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm dark:shadow-xl transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200/90 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold tracking-wider uppercase text-[10px]">
                <th className="py-3 px-3.5 whitespace-nowrap">Month</th>
                <th className="py-3 px-3 whitespace-nowrap">Date</th>
                <th className="py-3 px-3 whitespace-nowrap">Type</th>
                <th className="py-3 px-3.5 text-right whitespace-nowrap">Amount (Rs.)</th>
                <th className="py-3 px-3.5 text-right whitespace-nowrap">Balance (Rs.)</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-3 text-center whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 font-sans">
                    No transactions match your search filter.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  const isPay = tx.type === 'Pay';
                  const isInt = tx.type === 'Interest/Fee';

                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* Month */}
                      <td className="py-3 px-3.5 whitespace-nowrap text-slate-600 dark:text-slate-400 font-sans text-xs font-semibold">
                        {tx.month}
                      </td>

                      {/* Date */}
                      <td className="py-3 px-3 whitespace-nowrap text-slate-900 dark:text-slate-200 font-medium">
                        {tx.date}
                      </td>

                      {/* Type (Dropdown Style Tag with strict color coding & neon touch) */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 font-bold text-xs px-2 py-0.5 rounded-md ${
                            isPay
                              ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300/80 dark:border-emerald-700/50 shadow-[0_0_8px_rgba(16,185,129,0.18)]'
                              : isInt
                              ? 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-300/80 dark:border-amber-700/50 shadow-[0_0_8px_rgba(245,158,11,0.18)]'
                              : 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-300/80 dark:border-rose-700/50 shadow-[0_0_8px_rgba(244,63,94,0.18)]'
                          }`}
                        >
                          {isPay ? (
                            <ArrowDownLeft className="w-3 h-3 stroke-[2.5]" />
                          ) : (
                            <ArrowUpRight className="w-3 h-3 stroke-[2.5]" />
                          )}
                          <span>{tx.type}</span>
                        </span>
                      </td>

                      {/* Amount with Neon Glow */}
                      <td
                        className={`py-3 px-3.5 text-right whitespace-nowrap font-bold text-xs ${
                          isPay 
                            ? 'text-emerald-600 dark:text-emerald-400 drop-shadow-[0_0_6px_rgba(16,185,129,0.3)]' 
                            : 'text-rose-600 dark:text-rose-400 drop-shadow-[0_0_6px_rgba(244,63,94,0.3)]'
                        }`}
                      >
                        {formatCurrency(tx.amount)}
                      </td>

                      {/* Balance (Sequential Running Balance) */}
                      <td className="py-3 px-3.5 text-right whitespace-nowrap font-bold text-slate-900 dark:text-slate-100 text-xs">
                        {formatCurrency(tx.balance)}
                      </td>

                      {/* Description */}
                      <td className="py-3 px-4 font-sans text-xs text-slate-800 dark:text-slate-200 min-w-[140px] max-w-[240px] truncate">
                        {tx.description}
                      </td>

                      {/* Edit & Delete Actions with Neon hover */}
                      <td className="py-2 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onEdit(tx)}
                            title="Edit Transaction"
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:shadow-[0_0_10px_rgba(16,185,129,0.3)] active:scale-95 transition-all cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setTxToDelete(tx)}
                            title="Delete Transaction"
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:shadow-[0_0_10px_rgba(244,63,94,0.3)] active:scale-95 transition-all cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {txToDelete && (
        <div className="fixed inset-0 z-60 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl animate-scaleUp">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto mb-3 shadow-[0_0_12px_rgba(244,63,94,0.3)]">
              <AlertTriangle className="w-6 h-6 stroke-[2.2]" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Delete Transaction?</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
              Are you sure you want to delete <strong className="text-slate-900 dark:text-white">{txToDelete.description}</strong> ({txToDelete.date} · Rs. {formatCurrency(txToDelete.amount)})?
            </p>
            <p className="text-[11px] text-amber-800 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-300/80 dark:border-amber-700/50 p-2.5 rounded-xl mb-6 shadow-xs">
              Running balances for following transactions will be automatically recalculated and synced.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setTxToDelete(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer active:scale-95 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDelete(txToDelete.id);
                  setTxToDelete(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-xs font-bold text-white shadow-[0_0_14px_rgba(244,63,94,0.45)] hover:shadow-[0_0_20px_rgba(244,63,94,0.65)] transition-all cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
