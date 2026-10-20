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
  Edit3,
  AlertTriangle,
  UserCheck,
  Calendar,
  Percent,
  RefreshCw
} from 'lucide-react';
import { CardProfile, Transaction } from '../../types';
import { formatCurrency, getMonthLabel } from '../../utils/formatters';
import { AddCardModal } from './AddCardModal';
import { EditCardModal } from './EditCardModal';
import { NeonChart } from './NeonChart';
import { AndroidWidgetPanel } from './AndroidWidgetPanel';
import { GoogleDriveSyncBanner } from '../common/GoogleDriveSyncBanner';
import { GoogleSpreadsheetInfo } from '../../utils/googleDriveSync';

interface DashboardProps {
  cards: CardProfile[];
  transactionsByCard: Record<string, Transaction[]>;
  onSelectCard: (card: CardProfile) => void;
  onAddCard: (newCard: CardProfile) => void;
  onEditCard: (cardId: string, updated: Partial<CardProfile>) => void;
  onDeleteCard: (cardId: string) => void;
  onOpenGuide: () => void;
  onQuickAddForCard?: (card: CardProfile) => void;
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
  onManualSync?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  cards,
  transactionsByCard,
  onSelectCard,
  onAddCard,
  onEditCard,
  onDeleteCard,
  onOpenGuide,
  onQuickAddForCard,
  googleUser,
  spreadsheetInfo,
  isConnectingGoogle = false,
  isSyncingGoogle = false,
  onSignInGoogle,
  onSignOutGoogle,
  onManualSync,
}) => {
  const [isAddCardOpen, setIsAddCardOpen] = useState(false);
  const [cardToEdit, setCardToEdit] = useState<CardProfile | null>(null);
  const [cardToDelete, setCardToDelete] = useState<CardProfile | null>(null);

  // Compute current running balances per card
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

  // Combined total outstanding / due balance across ALL active cards
  const totalOutstandingDue = useMemo(() => {
    return Object.values(cardBalances).reduce((acc, curr) => acc + curr, 0);
  }, [cardBalances]);

  // Combined total lifetime usage across all cards
  const totalLifetimeUsage = useMemo(() => {
    let total = 0;
    Object.values(transactionsByCard).forEach((txs) => {
      txs.forEach((tx) => {
        if (tx.type === 'Use' || tx.type === 'Interest/Fee') {
          total += tx.amount;
        }
      });
    });
    return total;
  }, [transactionsByCard]);

  // Combined total credit limits
  const totalCreditLimit = useMemo(() => {
    return cards.reduce((acc, card) => acc + (card.creditLimit || 0), 0);
  }, [cards]);

  // Current Month Summary across all cards
  const currentMonthStats = useMemo(() => {
    const now = new Date();
    const currentMonthLabel = getMonthLabel(now.toISOString());
    let monthUse = 0;
    let monthPay = 0;
    let monthIntFee = 0;

    Object.values(transactionsByCard).forEach((txs) => {
      txs.forEach((tx) => {
        if (tx.month === currentMonthLabel) {
          if (tx.type === 'Use') monthUse += tx.amount;
          else if (tx.type === 'Pay') monthPay += tx.amount;
          else if (tx.type === 'Interest/Fee') monthIntFee += tx.amount;
        }
      });
    });

    // If current month has no transactions yet, fallback to latest active month
    if (monthUse === 0 && monthPay === 0) {
      let latestMonth = '';
      for (const txs of Object.values(transactionsByCard)) {
        if (txs.length > 0) {
          const lastTx = txs[txs.length - 1];
          if (lastTx?.month) latestMonth = lastTx.month;
        }
      }
      if (latestMonth) {
        Object.values(transactionsByCard).forEach((txs) => {
          txs.forEach((tx) => {
            if (tx.month === latestMonth) {
              if (tx.type === 'Use') monthUse += tx.amount;
              else if (tx.type === 'Pay') monthPay += tx.amount;
              else if (tx.type === 'Interest/Fee') monthIntFee += tx.amount;
            }
          });
        });
        return {
          monthLabel: latestMonth,
          monthUse,
          monthPay,
          monthIntFee,
          netChange: monthUse + monthIntFee - monthPay,
        };
      }
    }

    return {
      monthLabel: currentMonthLabel,
      monthUse,
      monthPay,
      monthIntFee,
      netChange: monthUse + monthIntFee - monthPay,
    };
  }, [transactionsByCard]);

  // Card visual theme styling - vibrant in light mode, deep neon in dark mode
  const getCardVisuals = (color: CardProfile['themeColor']) => {
    switch (color) {
      case 'amber':
        return {
          gradient: 'from-amber-500 via-amber-600 to-orange-500 dark:from-amber-950 dark:via-amber-900 dark:to-slate-900',
          accent: 'border-amber-300/60 dark:border-amber-500/40 shadow-[0_4px_20px_rgba(245,158,11,0.2)] dark:shadow-[0_0_20px_rgba(245,158,11,0.3)]',
          badge: 'bg-white/20 dark:bg-amber-400/20 text-white dark:text-amber-200 border border-white/30 dark:border-amber-400/30',
        };
      case 'emerald':
        return {
          gradient: 'from-emerald-500 via-emerald-600 to-teal-600 dark:from-emerald-950 dark:via-teal-900 dark:to-slate-900',
          accent: 'border-emerald-300/60 dark:border-emerald-500/40 shadow-[0_4px_20px_rgba(16,185,129,0.2)] dark:shadow-[0_0_20px_rgba(16,185,129,0.3)]',
          badge: 'bg-white/20 dark:bg-emerald-400/20 text-white dark:text-emerald-200 border border-white/30 dark:border-emerald-400/30',
        };
      case 'blue':
        return {
          gradient: 'from-blue-500 via-indigo-600 to-blue-600 dark:from-blue-950 dark:via-indigo-900 dark:to-slate-900',
          accent: 'border-blue-300/60 dark:border-blue-500/40 shadow-[0_4px_20px_rgba(59,130,246,0.2)] dark:shadow-[0_0_20px_rgba(59,130,246,0.3)]',
          badge: 'bg-white/20 dark:bg-blue-400/20 text-white dark:text-blue-200 border border-white/30 dark:border-blue-400/30',
        };
      case 'purple':
        return {
          gradient: 'from-purple-500 via-purple-600 to-indigo-600 dark:from-purple-950 dark:via-purple-900 dark:to-slate-900',
          accent: 'border-purple-300/60 dark:border-purple-500/40 shadow-[0_4px_20px_rgba(168,85,247,0.2)] dark:shadow-[0_0_20px_rgba(168,85,247,0.3)]',
          badge: 'bg-white/20 dark:bg-purple-400/20 text-white dark:text-purple-200 border border-white/30 dark:border-purple-400/30',
        };
      case 'rose':
        return {
          gradient: 'from-rose-500 via-rose-600 to-pink-600 dark:from-rose-950 dark:via-rose-900 dark:to-slate-900',
          accent: 'border-rose-300/60 dark:border-rose-500/40 shadow-[0_4px_20px_rgba(244,63,94,0.2)] dark:shadow-[0_0_20px_rgba(244,63,94,0.3)]',
          badge: 'bg-white/20 dark:bg-rose-400/20 text-white dark:text-rose-200 border border-white/30 dark:border-rose-400/30',
        };
      case 'cyan':
        return {
          gradient: 'from-cyan-500 via-teal-600 to-cyan-600 dark:from-cyan-950 dark:via-cyan-900 dark:to-slate-900',
          accent: 'border-cyan-300/60 dark:border-cyan-500/40 shadow-[0_4px_20px_rgba(6,182,212,0.2)] dark:shadow-[0_0_20px_rgba(6,182,212,0.3)]',
          badge: 'bg-white/20 dark:bg-cyan-400/20 text-white dark:text-cyan-200 border border-white/30 dark:border-cyan-400/30',
        };
      default:
        return {
          gradient: 'from-teal-600 via-emerald-600 to-cyan-700 dark:from-slate-900 dark:via-slate-850 dark:to-slate-950',
          accent: 'border-emerald-300/60 dark:border-slate-500/40 shadow-[0_4px_20px_rgba(16,185,129,0.2)] dark:shadow-[0_0_20px_rgba(16,185,129,0.3)]',
          badge: 'bg-white/20 dark:bg-slate-400/20 text-white dark:text-slate-200 border border-white/30 dark:border-slate-400/30',
        };
    }
  };

  // User first name display
  const userGreetingName = googleUser?.displayName 
    ? googleUser.displayName.split(' ')[0] 
    : googleUser?.email 
    ? googleUser.email.split('@')[0] 
    : 'Cardholder';

  return (
    <div className="space-y-6 pb-20">
      
      {/* 1. PERSONALIZED WELCOME & DASHBOARD HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-3">
          {googleUser?.photoURL ? (
            <img
              src={googleUser.photoURL}
              alt="Profile"
              className="w-11 h-11 rounded-2xl border-2 border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.3)] object-cover"
            />
          ) : (
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-400 via-teal-400 to-cyan-400 flex items-center justify-center text-slate-950 font-bold text-base shadow-[0_0_14px_rgba(16,185,129,0.4)]">
              <UserCheck className="w-5 h-5 stroke-[2.5]" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight drop-shadow-[0_0_8px_rgba(16,185,129,0.25)]">
                Welcome, {userGreetingName}!
              </h1>
              {googleUser && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-400/60 px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.25)]">
                  <CheckCircle2 className="w-2.5 h-2.5" />
                  <span>Google Drive Synced</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Personal Credit Card Manager · {cards.length} cards active
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {/* Neon Styled Manual Sync Now Button */}
          {onManualSync && (
            <button
              onClick={onManualSync}
              disabled={isSyncingGoogle}
              type="button"
              aria-label="Force immediate manual sync with Google Drive"
              title="Force immediate manual sync with Google Drive"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap shrink-0 active:scale-95 cursor-pointer disabled:cursor-wait neon-btn-sync neon-pulse-sync"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 text-cyan-600 dark:text-cyan-300 stroke-[2.6] ${
                  isSyncingGoogle ? 'animate-spin text-cyan-500' : ''
                }`}
              />
              <span className="text-cyan-700 dark:text-cyan-300">
                {isSyncingGoogle ? 'Syncing...' : 'Sync Now'}
              </span>
            </button>
          )}

          {/* Neon Styled Drive Guide Button */}
          <button
            onClick={onOpenGuide}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-emerald-50/70 dark:bg-slate-900 dark:hover:bg-emerald-950/40 border border-emerald-500/40 text-emerald-700 dark:text-emerald-400 text-xs font-bold shadow-[0_0_12px_rgba(16,185,129,0.2)] hover:shadow-[0_0_18px_rgba(16,185,129,0.4)] active:scale-95 transition-all cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 stroke-[2.2]" />
            <span>Drive Guide</span>
          </button>
        </div>
      </div>

      {/* 2. PROMINENT COMBINED TOTAL USAGE & TOTAL DUE SECTION */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-[0_4px_24px_rgba(16,185,129,0.06)] dark:shadow-2xl relative overflow-hidden transition-colors">
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          {/* Total Due Amount Prominently Displayed */}
          <div className="space-y-1.5 border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800 pb-5 md:pb-0 md:pr-6">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400">
                Combined Total Due Amount
              </span>
              <span className="text-[10px] text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/70 border border-rose-400/60 px-2.5 py-0.5 rounded-full font-bold shadow-[0_0_10px_rgba(244,63,94,0.25)]">
                Outstanding
              </span>
            </div>

            <div className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white font-mono tracking-tight drop-shadow-[0_0_10px_rgba(244,63,94,0.2)]">
              Rs. {formatCurrency(totalOutstandingDue)}
            </div>

            {totalCreditLimit > 0 && (
              <p className="text-xs text-slate-500 dark:text-slate-400 pt-1">
                Limit: <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold">Rs. {formatCurrency(totalCreditLimit)}</span>
                <span className="text-slate-300 dark:text-slate-600"> · </span>
                Available: <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold drop-shadow-[0_0_6px_rgba(16,185,129,0.3)]">Rs. {formatCurrency(Math.max(totalCreditLimit - totalOutstandingDue, 0))}</span>
              </p>
            )}
          </div>

          {/* Combined Total Usage Prominently Displayed with Neon Cyan Glow */}
          <div className="space-y-1.5 md:pl-2">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400">
                Combined Total Usage
              </span>
              <span className="text-[10px] text-cyan-700 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/70 border border-cyan-400/60 px-2.5 py-0.5 rounded-full font-bold shadow-[0_0_10px_rgba(6,182,212,0.25)]">
                Lifetime Logged
              </span>
            </div>

            <div className="text-3xl sm:text-4xl font-black text-cyan-600 dark:text-cyan-400 font-mono tracking-tight drop-shadow-[0_0_12px_rgba(6,182,212,0.35)]">
              Rs. {formatCurrency(totalLifetimeUsage)}
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 pt-1">
              Recorded across all credit card transactions and monthly statements.
            </p>
          </div>
        </div>
      </div>

      {/* 3. CURRENT MONTH DASHBOARD SUMMARY SECTION */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800 shadow-xs transition-colors">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400 stroke-[2.2]" />
            <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider drop-shadow-[0_0_6px_rgba(16,185,129,0.25)]">
              Current Month Summary ({currentMonthStats.monthLabel})
            </h2>
          </div>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            All cards combined
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Month Usage with Neon Rose styling */}
          <div className="p-4 rounded-2xl bg-rose-50/40 dark:bg-slate-900 border border-rose-300/60 dark:border-rose-900/50 shadow-[0_0_12px_rgba(244,63,94,0.12)]">
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 mb-1">
              <span className="font-semibold">Total Usage</span>
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 font-mono drop-shadow-[0_0_8px_rgba(244,63,94,0.3)]">
              Rs. {formatCurrency(currentMonthStats.monthUse)}
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1">Expenses in {currentMonthStats.monthLabel}</span>
          </div>

          {/* Month Paid with Neon Emerald styling */}
          <div className="p-4 rounded-2xl bg-emerald-50/40 dark:bg-slate-900 border border-emerald-300/60 dark:border-emerald-900/50 shadow-[0_0_12px_rgba(16,185,129,0.12)]">
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 mb-1">
              <span className="font-semibold">Amount Paid</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]">
              Rs. {formatCurrency(currentMonthStats.monthPay)}
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1">Settlements in {currentMonthStats.monthLabel}</span>
          </div>

          {/* Month Total Due Amount with Neon Amber styling */}
          <div className="p-4 rounded-2xl bg-amber-50/40 dark:bg-slate-900 border border-amber-300/60 dark:border-amber-900/50 shadow-[0_0_12px_rgba(245,158,11,0.12)]">
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 mb-1">
              <span className="font-semibold">Total Due Amount</span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono drop-shadow-[0_0_8px_rgba(245,158,11,0.25)]">
              Rs. {formatCurrency(totalOutstandingDue)}
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1">Current total balance outstanding</span>
          </div>
        </div>
      </div>

      {/* 4. ANDROID 15 WIDGET SUPPORT & INSTANT CARD SHORTCUTS */}
      <AndroidWidgetPanel
        cards={cards}
        onQuickAddForCard={onQuickAddForCard || onSelectCard}
      />

      {/* 5. MODERN STYLISH NEON CHARTS SECTION */}
      <NeonChart
        cards={cards}
        transactionsByCard={transactionsByCard}
      />

      {/* 6. CREDIT CARDS SECTION WITH EDIT & DELETE */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1 gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight drop-shadow-[0_0_6px_rgba(16,185,129,0.2)]">
              Your Credit Cards
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Each card saves to its own separate sheet tab in Google Drive
            </p>
          </div>

          {/* NEON ADD CARD BUTTON */}
          <button
            onClick={() => setIsAddCardOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 text-xs font-black border border-emerald-400/80 shadow-[0_0_16px_rgba(16,185,129,0.5)] hover:shadow-[0_0_24px_rgba(16,185,129,0.7)] transition-all shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
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
                className={`group relative p-5 sm:p-6 rounded-3xl bg-gradient-to-br ${visuals.gradient} border ${visuals.accent} transition-all duration-300 cursor-pointer active:scale-[0.99] flex flex-col justify-between overflow-hidden text-white`}
              >
                {/* Card Top Row: Chip, Mask & Action Buttons */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-7 rounded-md bg-amber-200/95 border border-amber-300/80 shadow-xs flex items-center justify-center">
                      <div className="w-6 h-4 border border-amber-500/50 rounded-xs" />
                    </div>
                    <span className="text-xs font-mono tracking-widest text-white/90 drop-shadow-xs">
                      {card.cardNumberMask}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${visuals.badge} tracking-wider uppercase backdrop-blur-xs`}>
                      {card.bankName}
                    </span>

                    {/* Edit Card Button */}
                    <button
                      type="button"
                      title="Edit card name, limit, or color"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCardToEdit(card);
                      }}
                      className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/40 active:scale-95 text-white border border-white/30 flex items-center justify-center transition-all cursor-pointer shadow-xs"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete Card Button */}
                    <button
                      type="button"
                      title="Delete this card"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCardToDelete(card);
                      }}
                      className="w-7 h-7 rounded-full bg-white/20 hover:bg-rose-500 active:scale-95 text-white border border-white/30 flex items-center justify-center transition-all cursor-pointer shadow-xs"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Card Name & Outstanding Balance */}
                <div className="space-y-1 mb-4">
                  <h3 className="text-lg font-bold text-white group-hover:text-emerald-100 transition-colors drop-shadow-xs">
                    {card.name}
                  </h3>
                  <div className="flex items-baseline justify-between pt-1">
                    <span className="text-xs text-white/80">Outstanding Due:</span>
                    <span className="text-xl font-extrabold text-white font-mono drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]">
                      Rs. {formatCurrency(balance)}
                    </span>
                  </div>
                </div>

                {/* Utilization Bar */}
                {limit && (
                  <div className="space-y-1 pt-1 mb-3">
                    <div className="flex justify-between text-[11px] text-white/85">
                      <span>Limit: Rs. {formatCurrency(limit)}</span>
                      <span>{utilPct}% used</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-black/25 overflow-hidden">
                      <div
                        style={{ width: `${utilPct}%` }}
                        className="h-full bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)]"
                      />
                    </div>
                  </div>
                )}

                {/* Bottom footer strip */}
                <div className="pt-3 border-t border-white/20 flex items-center justify-between text-xs text-white/90">
                  <div className="flex items-center gap-2">
                    <span>{txCount} records</span>
                    {spreadsheetInfo?.spreadsheetId && (
                      <span className="flex items-center gap-1 text-[10px] text-white font-bold bg-white/20 border border-white/40 px-2 py-0.5 rounded-full backdrop-blur-xs shadow-xs">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Dedicated Tab</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 font-bold group-hover:translate-x-1 transition-transform drop-shadow-xs">
                    <span>Open Tracker</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 7. GOOGLE LOGIN / SYNC STATUS INDICATOR AT THE VERY BOTTOM OF THE SCREEN */}
      <div className="pt-4 border-t border-slate-200/90 dark:border-slate-800">
        <div className="mb-2 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider px-1">
          Cloud Backup & Spreadsheet Synchronization
        </div>
        <GoogleDriveSyncBanner
          user={googleUser || null}
          sheetInfo={spreadsheetInfo || null}
          isConnecting={isConnectingGoogle}
          isSyncing={isSyncingGoogle}
          onSignIn={onSignInGoogle || (() => {})}
          onSignOut={onSignOutGoogle || (() => {})}
        />
      </div>

      {/* Add Card Modal */}
      <AddCardModal
        isOpen={isAddCardOpen}
        onClose={() => setIsAddCardOpen(false)}
        onAddCard={onAddCard}
      />

      {/* Edit Card Modal */}
      <EditCardModal
        card={cardToEdit}
        isOpen={Boolean(cardToEdit)}
        onClose={() => setCardToEdit(null)}
        onSaveCard={(cardId, updated) => {
          onEditCard(cardId, updated);
          setCardToEdit(null);
        }}
      />

      {/* Delete Card Confirmation Modal */}
      {cardToDelete && (
        <div className="fixed inset-0 z-60 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl animate-scaleUp">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto mb-3 shadow-[0_0_12px_rgba(244,63,94,0.3)]">
              <AlertTriangle className="w-6 h-6 stroke-[2.2]" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              Delete {cardToDelete.name}?
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
              This will permanently delete this card profile along with its entire transaction log (
              <strong className="text-slate-900 dark:text-white font-bold">
                {(transactionsByCard[cardToDelete.id] || []).length} records
              </strong>
              ). If Google Drive is connected, its corresponding individual sheet tab will also be deleted from your Google Sheet.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setCardToDelete(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer active:scale-95 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteCard(cardToDelete.id);
                  setCardToDelete(null);
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
