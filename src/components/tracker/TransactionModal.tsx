import React, { useState, useEffect } from 'react';
import { PlusCircle, Edit3, X, Calendar, DollarSign, FileText, ArrowUpRight, ArrowDownLeft, AlertCircle } from 'lucide-react';
import { CardProfile, Transaction, TransactionType } from '../../types';
import { formatCurrency, formatDateForSheet, getMonthLabel, parseAmount } from '../../utils/formatters';

interface TransactionModalProps {
  card: CardProfile;
  isOpen: boolean;
  onClose: () => void;
  onSave: (txData: Omit<Transaction, 'id' | 'balance' | 'createdAt'>) => void;
  editingTransaction?: Transaction | null;
  currentBalance: number;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  card,
  isOpen,
  onClose,
  onSave,
  editingTransaction,
  currentBalance,
}) => {
  const [date, setDate] = useState<string>('');
  const [month, setMonth] = useState<string>('');
  const [type, setType] = useState<TransactionType>('Use');
  const [amountInput, setAmountInput] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (editingTransaction) {
      setDate(editingTransaction.date);
      setMonth(editingTransaction.month);
      setType(editingTransaction.type);
      setAmountInput(editingTransaction.amount.toString());
      setDescription(editingTransaction.description);
    } else {
      const today = new Date();
      const formattedDate = formatDateForSheet(today);
      const formattedMonth = getMonthLabel(today);
      setDate(formattedDate);
      setMonth(formattedMonth);
      setType('Use');
      setAmountInput('');
      setDescription('');
    }
    setErrorMsg('');
  }, [editingTransaction, isOpen]);

  // Update month automatically when date changes
  const handleDateChange = (val: string) => {
    setDate(val);
    if (val) {
      const parsed = new Date(val);
      if (!isNaN(parsed.getTime())) {
        setMonth(getMonthLabel(parsed));
      }
    }
  };

  const parsedAmount = parseAmount(amountInput);

  // Projected balance calculation
  const projectedBalance = (() => {
    if (editingTransaction) {
      const originalDelta = editingTransaction.type === 'Pay' ? -editingTransaction.amount : editingTransaction.amount;
      const newDelta = type === 'Pay' ? -parsedAmount : parsedAmount;
      return currentBalance - originalDelta + newDelta;
    }
    return type === 'Pay' ? currentBalance - parsedAmount : currentBalance + parsedAmount;
  })();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedAmount <= 0) {
      setErrorMsg('Please enter a valid amount greater than 0.');
      return;
    }
    if (!description.trim()) {
      setErrorMsg('Please enter a description (e.g. merchant or payment detail).');
      return;
    }

    onSave({
      cardId: card.id,
      month: month || getMonthLabel(new Date()),
      date: date || formatDateForSheet(new Date()),
      type,
      amount: parsedAmount,
      description: description.trim(),
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-t-3xl sm:rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden animate-slideUp">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200/90 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-400/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-[0_0_12px_rgba(16,185,129,0.25)]">
              {editingTransaction ? <Edit3 className="w-5 h-5 stroke-[2.2]" /> : <PlusCircle className="w-5 h-5 stroke-[2.2]" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white drop-shadow-[0_0_6px_rgba(16,185,129,0.2)]">
                {editingTransaction ? 'Edit Transaction' : 'Log New Transaction'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {card.name} ({card.cardNumberMask})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800/60 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Type Selector with Neon Badges */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Transaction Type</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setType('Use')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                  type === 'Use'
                    ? 'bg-rose-50 dark:bg-rose-950/70 border-rose-400 text-rose-700 dark:text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.35)]'
                    : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200/90 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Use (Expense)</span>
              </button>

              <button
                type="button"
                onClick={() => setType('Pay')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                  type === 'Pay'
                    ? 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-400 text-emerald-700 dark:text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.35)]'
                    : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200/90 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <ArrowDownLeft className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Pay (Payment)</span>
              </button>

              <button
                type="button"
                onClick={() => setType('Interest/Fee')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                  type === 'Interest/Fee'
                    ? 'bg-amber-50 dark:bg-amber-950/70 border-amber-400 text-amber-700 dark:text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.35)]'
                    : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200/90 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>Interest & Fee</span>
              </button>
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Amount (LKR / Rs.)</label>
            <div className="relative">
              <input
                type="text"
                inputMode="decimal"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                placeholder="0.00"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200/90 dark:border-slate-800 rounded-2xl px-4 py-3 text-xl font-black font-mono focus:outline-none focus:border-emerald-500 focus:shadow-[0_0_12px_rgba(16,185,129,0.25)] text-slate-900 dark:text-white transition-all"
                autoFocus
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 dark:text-slate-500">
                LKR
              </span>
            </div>
          </div>

          {/* Date & Month Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Date (M/D/YYYY)</label>
              <input
                type="text"
                value={date}
                onChange={(e) => handleDateChange(e.target.value)}
                placeholder="8/25/2026"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200/90 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 focus:shadow-[0_0_10px_rgba(16,185,129,0.2)]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Month</label>
              <input
                type="text"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                placeholder="2026 Aug"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200/90 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 focus:shadow-[0_0_10px_rgba(16,185,129,0.2)]"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Description / Merchant</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Dominos pizza, ceb care, fuel, paid"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200/90 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 focus:shadow-[0_0_10px_rgba(16,185,129,0.2)]"
            />
          </div>

          {/* Real-time Projected Balance Preview */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/90 dark:border-slate-800/80 flex items-center justify-between text-xs">
            <div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Projected Outstanding Balance</p>
              <p className="font-mono text-sm font-black text-slate-900 dark:text-white mt-0.5 drop-shadow-xs">
                Rs. {formatCurrency(projectedBalance)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Current Balance</p>
              <p className="font-mono text-xs font-bold text-slate-600 dark:text-slate-400 mt-0.5">
                Rs. {formatCurrency(currentBalance)}
              </p>
            </div>
          </div>

          {/* Action Buttons with Neon Styling */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 text-xs font-black border border-emerald-400/80 shadow-[0_0_16px_rgba(16,185,129,0.5)] hover:shadow-[0_0_22px_rgba(16,185,129,0.7)] transition-all cursor-pointer"
            >
              {editingTransaction ? 'Save Changes' : 'Add Transaction'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
