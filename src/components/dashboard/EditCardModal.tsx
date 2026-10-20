import React, { useState, useEffect } from 'react';
import { CreditCard, Edit3, X, AlertCircle, Save } from 'lucide-react';
import { CardProfile } from '../../types';

interface EditCardModalProps {
  card: CardProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveCard: (cardId: string, updated: Partial<CardProfile>) => void;
}

export const EditCardModal: React.FC<EditCardModalProps> = ({
  card,
  isOpen,
  onClose,
  onSaveCard,
}) => {
  const [name, setName] = useState('');
  const [bankName, setBankName] = useState('');
  const [last4, setLast4] = useState('');
  const [creditLimit, setCreditLimit] = useState('');
  const [themeColor, setThemeColor] = useState<CardProfile['themeColor']>('amber');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (card) {
      setName(card.name || '');
      setBankName(card.bankName || '');
      const maskDigits = (card.cardNumberMask || '').replace(/\D/g, '').slice(-4);
      setLast4(maskDigits);
      setCreditLimit(card.creditLimit ? card.creditLimit.toString() : '');
      setThemeColor(card.themeColor || 'amber');
      setErrorMsg('');
    }
  }, [card, isOpen]);

  if (!isOpen || !card) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Card name cannot be empty.');
      return;
    }

    const mask = last4 ? `•••• ${last4.replace(/\D/g, '').slice(-4)}` : card.cardNumberMask;
    const parsedLimit = creditLimit ? parseFloat(creditLimit.replace(/[^0-9.]/g, '')) : undefined;

    onSaveCard(card.id, {
      name: name.trim(),
      bankName: bankName.trim() || name.trim(),
      cardNumberMask: mask,
      creditLimit: isNaN(parsedLimit as number) ? undefined : parsedLimit,
      themeColor,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-60 bg-slate-900/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-t-3xl sm:rounded-3xl max-w-md w-full shadow-2xl overflow-hidden animate-slideUp">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200/90 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-400/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-[0_0_12px_rgba(16,185,129,0.25)]">
              <Edit3 className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white drop-shadow-[0_0_6px_rgba(16,185,129,0.2)]">
                Edit Credit Card
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Update card name, limit, and styling</p>
            </div>
          </div>
          <button
            type="button"
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

          {/* Card Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Card Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Commercial Bank Mastercard"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200/90 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 focus:shadow-[0_0_10px_rgba(16,185,129,0.2)]"
            />
          </div>

          {/* Bank Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Bank / Issuer Name</label>
            <input
              type="text"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              placeholder="e.g. Commercial Bank"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200/90 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 focus:shadow-[0_0_10px_rgba(16,185,129,0.2)]"
            />
          </div>

          {/* Mask & Limit Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Last 4 Digits</label>
              <input
                type="text"
                maxLength={4}
                value={last4}
                onChange={(e) => setLast4(e.target.value.replace(/\D/g, ''))}
                placeholder="e.g. 8892"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200/90 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-emerald-500 focus:shadow-[0_0_10px_rgba(16,185,129,0.2)]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Credit Limit (Rs.)</label>
              <input
                type="text"
                value={creditLimit}
                onChange={(e) => setCreditLimit(e.target.value)}
                placeholder="e.g. 500,000"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200/90 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-emerald-500 focus:shadow-[0_0_10px_rgba(16,185,129,0.2)]"
              />
            </div>
          </div>

          {/* Color Theme Selector */}
          <div className="space-y-2 pt-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Card Theme Color</label>
            <div className="flex items-center gap-2.5">
              {[
                { id: 'amber', label: 'Gold Amber', bg: 'bg-amber-500' },
                { id: 'emerald', label: 'Emerald Jade', bg: 'bg-emerald-500' },
                { id: 'blue', label: 'Sapphire Blue', bg: 'bg-blue-500' },
                { id: 'purple', label: 'Royal Purple', bg: 'bg-purple-500' },
                { id: 'rose', label: 'Ruby Rose', bg: 'bg-rose-500' },
                { id: 'cyan', label: 'Cyan Teal', bg: 'bg-cyan-500' },
                { id: 'slate', label: 'Platinum Slate', bg: 'bg-slate-400' },
              ].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setThemeColor(c.id as any)}
                  className={`w-7 h-7 rounded-full ${c.bg} transition-all cursor-pointer ${
                    themeColor === c.id ? 'ring-2 ring-emerald-500 dark:ring-white scale-110 shadow-md' : 'opacity-70 hover:opacity-100'
                  }`}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          {/* Submit Buttons with Neon Touch */}
          <div className="flex gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black text-xs border border-emerald-400/80 shadow-[0_0_16px_rgba(16,185,129,0.5)] hover:shadow-[0_0_22px_rgba(16,185,129,0.7)] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4 stroke-[2.5]" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
