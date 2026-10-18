import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  ArrowUpDown, 
  ChevronDown, 
  Calendar,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  AlertTriangle
} from 'lucide-react';
import { Transaction, TransactionType } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface TransactionTableProps {
  transactions: Transaction[];
  onEdit: (tx: Transaction) => void;
  onDelete: (tx: Transaction) => void;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  onEdit,
  onDelete,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [txToDelete, setTxToDelete] = useState<Transaction | null>(null);

  // Extract unique months for filter dropdown
  const uniqueMonths = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach(t => {
      if (t.month) set.add(t.month);
    });
    return Array.from(set);
  }, [transactions]);

  // Filter and sort transactions
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
        const timeA = a.createdAt || 0;
        const timeB = b.createdAt || 0;
        return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
      });
  }, [transactions, searchTerm, selectedMonth, selectedType, sortOrder]);

  return (
    <div className="space-y-4">
      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search description, merchant, date..."
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 shadow-sm transition-colors"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2">
          {/* Month selector */}
          <div className="relative flex-1 sm:w-36">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full appearance-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-3 py-2.5 pr-8 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500 shadow-sm transition-colors"
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
              className="w-full appearance-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-3 py-2.5 pr-8 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500 shadow-sm transition-colors"
            >
              <option value="ALL">All Types</option>
              <option value="Use">Use (Expense)</option>
              <option value="Pay">Pay (Payment)</option>
              <option value="Interest/Fee">Interest/Fee</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Sort Toggle */}
          <button
            onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
            title="Toggle Sort Order"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white shadow-sm transition-colors"
          >
            <ArrowUpDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Transactions Summary Counter */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
        <span>Showing {filteredTransactions.length} of {transactions.length} records</span>
        {searchTerm && (
          <button
            onClick={() => { setSearchTerm(''); setSelectedMonth('ALL'); setSelectedType('ALL'); }}
            className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Main Table Container (Styled like Image 1 with touch row actions) */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-lg dark:shadow-xl transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold tracking-wider uppercase text-[10px]">
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
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* Month */}
                      <td className="py-3 px-3.5 whitespace-nowrap text-slate-600 dark:text-slate-400 font-sans text-xs">
                        {tx.month}
                      </td>

                      {/* Date */}
                      <td className="py-3 px-3 whitespace-nowrap text-slate-800 dark:text-slate-300 font-medium">
                        {tx.date}
                      </td>

                      {/* Type (Dropdown Style Tag with strict color coding) */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 font-bold text-xs px-2 py-0.5 rounded-md ${
                            isPay
                              ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40'
                              : isInt
                              ? 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40'
                              : 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40'
                          }`}
                        >
                          {isPay ? (
                            <ArrowDownLeft className="w-3 h-3" />
                          ) : (
                            <ArrowUpRight className="w-3 h-3" />
                          )}
                          <span>{tx.type}</span>
                        </span>
                      </td>

                      {/* Amount */}
                      <td
                        className={`py-3 px-3.5 text-right whitespace-nowrap font-bold text-xs ${
                          isPay ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-500'
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

                      {/* Edit & Delete Actions (Touch friendly min-hitbox) */}
                      <td className="py-2 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onEdit(tx)}
                            title="Edit Transaction"
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setTxToDelete(tx)}
                            title="Delete Transaction"
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
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
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl animate-scaleUp">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Delete Transaction?</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
              Are you sure you want to delete <strong className="text-slate-900 dark:text-white">{txToDelete.description}</strong> ({txToDelete.date} · Rs. {formatCurrency(txToDelete.amount)})?
            </p>
            <p className="text-[11px] text-amber-800 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 p-2.5 rounded-xl mb-6">
              Running balances for following transactions will be automatically recalculated and synced.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setTxToDelete(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDelete(txToDelete);
                  setTxToDelete(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-semibold text-white shadow-lg shadow-rose-600/30"
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
