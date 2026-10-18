import React, { useState, useMemo } from 'react';
import { 
  CreditCard, 
  Plus, 
  FileSpreadsheet, 
  TrendingUp, 
  TrendingDown, 
  ShieldCheck, 
  Sparkles, 
  ChevronRight, 
  CheckCircle2, 
  HelpCircle, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  PieChart, 
  Trash2, 
  AlertTriangle 
} from 'lucide-react';
import { CardProfile, Transaction } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { AddCardModal } from './AddCardModal';
import { GoogleDriveSyncBanner } from '../common/GoogleDriveSyncBanner';
import { GoogleSpreadsheetInfo } from '../../utils/googleDriveSync';

interface DashboardProps {
  cards: CardProfile[];
  transactionsByCard: Record<string, Transaction[]>;
  onSelectCard: (card: CardProfile) => void;
  onAddCard: (newCard: CardProfile) => void;
  onDeleteCard: (cardId: string) => void;
  onOpenGuide: () => void;
  // Google Drive & Sheets Integration
  googleUser?: {
    displayName: string | null;
    email: string | null;
    photoURL: string | null;
  } | null;
  spreadsheetInfo?: GoogleSpreadsheetInfo | null;
  isConnectingGoogle?: boolean;
  isSyncingGoogle?: boolean;
  onSignInGoogle?: () => void;
  onSignOutGoogle?: () => void;
  onSyncGoogleNow?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  cards,
  transactionsByCard,
  onSelectCard,
  onAddCard,
  onDeleteCard,
  onOpenGuide,
  googleUser,
  spreadsheetInfo,
  isConnectingGoogle = false,
  isSyncingGoogle = false,
  onSignInGoogle,
  onSignOutGoogle,
  onSyncGoogleNow,
}) => {
  const [isAddCardOpen, setIsAddCardOpen] = useState(false);
  const [cardToDelete, setCardToDelete] = useState<CardProfile | null>(null);

  // Compute specific balances per card
  const cardBalances = useMemo(() => {
    const balances: Record<string, number> = {};
    cards.forEach((card) => {
      const txs = transactionsByCard[card.id] || [];
      if (txs.length > 0) {
        balances[card.id] = txs[txs.length - 1].balance;
      } else {
        balances[card.id] = 0;
      }
    });
    return balances;
  }, [cards, transactionsByCard]);

  // Combined total outstanding balance across ALL active credit cards
  const totalOutstanding = useMemo(() => {
    return Object.values(cardBalances).reduce((acc, curr) => acc + curr, 0);
  }, [cardBalances]);

  // Combined credit limit across all cards
  const totalCreditLimit = useMemo(() => {
    return cards.reduce((acc, card) => acc + (card.creditLimit || 0), 0);
  }, [cards]);

  // Card theme styling
  const getCardVisuals = (color: CardProfile['themeColor']) => {
    switch (color) {
      case 'amber':
        return {
          gradient: 'from-amber-600 via-amber-700 to-amber-900',
          accent: 'border-amber-400/30 shadow-amber-500/10',
          badge: 'bg-amber-400/20 text-amber-200',
        };
      case 'emerald':
        return {
          gradient: 'from-emerald-600 via-teal-700 to-emerald-900',
          accent: 'border-emerald-400/30 shadow-emerald-500/10',
          badge: 'bg-emerald-400/20 text-emerald-200',
        };
      case 'blue':
        return {
          gradient: 'from-blue-600 via-indigo-700 to-slate-900',
          accent: 'border-blue-400/30 shadow-blue-500/10',
          badge: 'bg-blue-400/20 text-blue-200',
        };
      case 'purple':
        return {
          gradient: 'from-purple-600 via-purple-700 to-indigo-950',
          accent: 'border-purple-400/30 shadow-purple-500/10',
          badge: 'bg-purple-400/20 text-purple-200',
        };
      case 'rose':
        return {
          gradient: 'from-rose-600 via-rose-700 to-rose-950',
          accent: 'border-rose-400/30 shadow-rose-500/10',
          badge: 'bg-rose-400/20 text-rose-200',
        };
      case 'cyan':
        return {
          gradient: 'from-cyan-600 via-cyan-700 to-slate-900',
          accent: 'border-cyan-400/30 shadow-cyan-500/10',
          badge: 'bg-cyan-400/20 text-cyan-200',
        };
      default:
        return {
          gradient: 'from-slate-700 via-slate-800 to-slate-950',
          accent: 'border-slate-500/30 shadow-slate-500/10',
          badge: 'bg-slate-400/20 text-slate-200',
        };
    }
  };

  return (
    <div className="space-y-6 pb-20">

      {/* 1. HOME SCREEN HERO: Combined Total Outstanding Balance */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-2xl relative overflow-hidden transition-colors">
        {/* Subtle ambient accent in dark mode */}
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">
                Total Combined Outstanding Balance
              </span>
              <span className="text-[11px] text-emerald-800 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/40 px-2.5 py-0.5 rounded-full font-bold">
                {cards.length} Active Cards
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight">
              Rs. {formatCurrency(totalOutstanding)}
            </h1>

            {totalCreditLimit > 0 && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                Total Credit Limit: <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold">Rs. {formatCurrency(totalCreditLimit)}</span>
                <span className="text-slate-300 dark:text-slate-600"> · </span>
                Available Credit: <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">Rs. {formatCurrency(Math.max(totalCreditLimit - totalOutstanding, 0))}</span>
              </p>
            )}
          </div>

          {/* Quick Action Button for Sheets Onboarding Guide */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={onOpenGuide}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-semibold transition-colors shadow-xs cursor-pointer"
            >
              <HelpCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Google Drive Guide</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Seamless Google Drive OAuth Integration Banner (Zero manual config) */}
      <GoogleDriveSyncBanner
        user={googleUser || null}
        sheetInfo={spreadsheetInfo || null}
        isConnecting={isConnectingGoogle}
        isSyncing={isSyncingGoogle}
        onSignIn={onSignInGoogle || (() => {})}
        onSignOut={onSignOutGoogle || (() => {})}
        onSyncNow={onSyncGoogleNow || (() => {})}
      />

      {/* 3. Credit Cards Section Header with Single Consolidated 'Add New Card' Trigger */}
      <div className="flex items-center justify-between px-1 gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Your Credit Cards</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Tap any card to open its dedicated tracker and spreadsheet sync</p>
        </div>

        {/* SINGLE CONSOLIDATED LOCATION FOR ADDING A CARD */}
        <button
          onClick={() => setIsAddCardOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 transition-all shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add New Card</span>
        </button>
      </div>

      {/* Credit Cards Interactive Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cards.map((card) => {
          const balance = cardBalances[card.id] || 0;
          const visuals = getCardVisuals(card.themeColor);
          const txCount = (transactionsByCard[card.id] || []).length;
          const limit = card.creditLimit;
          const utilPct = limit ? Math.min(Math.round((balance / limit) * 100), 100) : null;

          return (
            <div
              key={card.id}
              onClick={() => onSelectCard(card)}
              className={`group relative p-5 sm:p-6 rounded-3xl bg-gradient-to-br ${visuals.gradient} border ${visuals.accent} shadow-md dark:shadow-xl hover:shadow-lg dark:hover:shadow-2xl transition-all duration-300 cursor-pointer active:scale-[0.99] flex flex-col justify-between overflow-hidden`}
            >
              {/* Card Top Row: Chip, Mask & Delete Card Button */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-7 rounded-md bg-amber-200/90 border border-amber-300/80 shadow-inner flex items-center justify-center">
                    <div className="w-6 h-4 border border-amber-500/50 rounded-sm" />
                  </div>
                  <span className="text-xs font-mono tracking-widest text-white/80">
                    {card.cardNumberMask}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${visuals.badge} tracking-wider uppercase`}>
                    {card.bankName}
                  </span>

                  {/* Delete Card Trigger */}
                  <button
                    type="button"
                    title="Delete this card"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCardToDelete(card);
                    }}
                    className="w-7 h-7 rounded-full bg-black/30 hover:bg-rose-600/80 text-white/70 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Card Name & Outstanding Balance */}
              <div className="space-y-1 mb-4">
                <h3 className="text-lg font-bold text-white group-hover:text-emerald-200 transition-colors">
                  {card.name}
                </h3>
                <div className="flex items-baseline justify-between pt-1">
                  <span className="text-xs text-white/70">Outstanding:</span>
                  <span className="text-xl font-extrabold text-white font-mono">
                    Rs. {formatCurrency(balance)}
                  </span>
                </div>
              </div>

              {/* Utilization Bar (if credit limit set) */}
              {limit && (
                <div className="space-y-1 pt-1 mb-3">
                  <div className="flex justify-between text-[11px] text-white/70">
                    <span>Limit: Rs. {formatCurrency(limit)}</span>
                    <span>{utilPct}% used</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-black/40 overflow-hidden">
                    <div
                      style={{ width: `${utilPct}%` }}
                      className="h-full bg-white/90 rounded-full"
                    />
                  </div>
                </div>
              )}

              {/* Bottom footer strip */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-white/80">
                <div className="flex items-center gap-2">
                  <span>{txCount} logged transactions</span>
                  {spreadsheetInfo?.spreadsheetId && (
                    <span className="flex items-center gap-1 text-[10px] text-emerald-300 font-semibold bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Drive Synced</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 font-semibold group-hover:translate-x-1 transition-transform">
                  <span>View Tracker</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Card Modal */}
      <AddCardModal
        isOpen={isAddCardOpen}
        onClose={() => setIsAddCardOpen(false)}
        onAddCard={onAddCard}
      />

      {/* Delete Card Confirmation Modal */}
      {cardToDelete && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl animate-scaleUp">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              Delete {cardToDelete.name}?
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
              This will permanently delete this card profile along with its entire transaction log (
              <strong className="text-slate-900 dark:text-white">
                {(transactionsByCard[cardToDelete.id] || []).length} records
              </strong>
              ). This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setCardToDelete(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteCard(cardToDelete.id);
                  setCardToDelete(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-semibold text-white shadow-lg shadow-rose-600/30 cursor-pointer"
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
