import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Plus,
  FileSpreadsheet,
  Download,
  Upload,
  Calendar,
  Layers,
  BarChart3,
  ListFilter,
  Trash2,
  AlertTriangle,
  RefreshCw,
  HelpCircle,
  ExternalLink,
  Cloud,
  Edit3,
  CheckCircle2
} from 'lucide-react';
import { CardProfile, Transaction } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { TransactionTable } from './TransactionTable';
import { MonthlyBreakdown } from './MonthlyBreakdown';
import { AnalyticsChart } from './AnalyticsChart';
import { TransactionModal } from './TransactionModal';
import { ImportSheetModal } from '../sheets/ImportSheetModal';
import { EditCardModal } from '../dashboard/EditCardModal';
import { GoogleSpreadsheetInfo } from '../../utils/googleDriveSync';

interface CardDetailViewProps {
  card: CardProfile;
  transactions: Transaction[];
  onBack: () => void;
  onAddTransaction: (tx: Omit<Transaction, 'id' | 'balance' | 'createdAt'>) => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (txId: string) => void;
  onImportTransactions: (transactions: Omit<Transaction, 'id' | 'balance' | 'createdAt'>[], mode: 'replace' | 'append') => void;
  onDeleteCard: (cardId: string) => void;
  onUpdateCardConfig: (cardId: string, updated: Partial<CardProfile>) => void;
  onOpenGuide: () => void;
  // Google Drive auto-sync props
  googleUser?: {
    displayName: string | null;
    email: string | null;
    photoURL: string | null;
  } | null;
  spreadsheetInfo?: GoogleSpreadsheetInfo | null;
  onSyncAllToGoogleDrive?: () => void;
  isGoogleSyncing?: boolean;
  onConnectGoogle?: () => void;
  initialOpenTxModal?: boolean;
}

export const CardDetailView: React.FC<CardDetailViewProps> = ({
  card,
  transactions,
  onBack,
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction,
  onImportTransactions,
  onDeleteCard,
  onUpdateCardConfig,
  onOpenGuide,
  googleUser,
  spreadsheetInfo,
  onSyncAllToGoogleDrive,
  isGoogleSyncing = false,
  onConnectGoogle,
  initialOpenTxModal = false,
}) => {
  const [activeTab, setActiveTab] = useState<'transactions' | 'monthly' | 'analytics'>('transactions');
  const [isTxModalOpen, setIsTxModalOpen] = useState(initialOpenTxModal);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isEditCardModalOpen, setIsEditCardModalOpen] = useState(false);

  // Latest running balance
  const currentOutstanding = useMemo(() => {
    if (transactions.length === 0) return 0;
    const last = transactions[transactions.length - 1];
    return last ? last.balance : 0;
  }, [transactions]);

  // Credit limit utilization
  const utilizationPct = card.creditLimit
    ? Math.min(Math.round((currentOutstanding / card.creditLimit) * 100), 100)
    : null;

  // Handlers
  const handleOpenAddTx = () => {
    setEditingTx(null);
    setIsTxModalOpen(true);
  };

  const handleOpenEditTx = (tx: Transaction) => {
    setEditingTx(tx);
    setIsTxModalOpen(true);
  };

  const handleSaveTx = async (txData: Omit<Transaction, 'id' | 'balance' | 'createdAt'>) => {
    if (editingTx) {
      onEditTransaction({
        ...editingTx,
        ...txData,
        updatedAt: Date.now(),
      });
    } else {
      onAddTransaction(txData);
    }
  };

  // Theme gradient lookup with solid high-contrast vibrant backgrounds in light mode & deep neon in dark mode
  const getThemeGradient = (color: CardProfile['themeColor']) => {
    switch (color) {
      case 'amber':
        return 'from-amber-500 via-amber-600 to-orange-500 dark:from-amber-950 dark:via-amber-900 dark:to-slate-900 border-amber-300/60 dark:border-amber-500/40 text-white shadow-[0_4px_24px_rgba(245,158,11,0.25)] dark:shadow-[0_0_24px_rgba(245,158,11,0.3)]';
      case 'emerald':
        return 'from-emerald-500 via-emerald-600 to-teal-600 dark:from-emerald-950 dark:via-teal-900 dark:to-slate-900 border-emerald-300/60 dark:border-emerald-500/40 text-white shadow-[0_4px_24px_rgba(16,185,129,0.25)] dark:shadow-[0_0_24px_rgba(16,185,129,0.3)]';
      case 'blue':
        return 'from-blue-500 via-indigo-600 to-blue-600 dark:from-blue-950 dark:via-indigo-900 dark:to-slate-900 border-blue-300/60 dark:border-blue-500/40 text-white shadow-[0_4px_24px_rgba(59,130,246,0.25)] dark:shadow-[0_0_24px_rgba(59,130,246,0.3)]';
      case 'purple':
        return 'from-purple-500 via-purple-600 to-indigo-600 dark:from-purple-950 dark:via-purple-900 dark:to-slate-900 border-purple-300/60 dark:border-purple-500/40 text-white shadow-[0_4px_24px_rgba(168,85,247,0.25)] dark:shadow-[0_0_24px_rgba(168,85,247,0.3)]';
      case 'rose':
        return 'from-rose-500 via-rose-600 to-pink-600 dark:from-rose-950 dark:via-rose-900 dark:to-slate-900 border-rose-300/60 dark:border-rose-500/40 text-white shadow-[0_4px_24px_rgba(244,63,94,0.25)] dark:shadow-[0_0_24px_rgba(244,63,94,0.3)]';
      case 'cyan':
        return 'from-cyan-500 via-teal-600 to-cyan-600 dark:from-cyan-950 dark:via-cyan-900 dark:to-slate-900 border-cyan-300/60 dark:border-cyan-500/40 text-white shadow-[0_4px_24px_rgba(6,182,212,0.25)] dark:shadow-[0_0_24px_rgba(6,182,212,0.3)]';
      default:
        return 'from-teal-600 via-emerald-600 to-cyan-700 dark:from-slate-900 dark:via-slate-850 dark:to-slate-950 border-emerald-300/60 dark:border-slate-700/60 text-white shadow-[0_4px_24px_rgba(16,185,129,0.25)] dark:shadow-[0_0_24px_rgba(16,185,129,0.3)]';
    }
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Top Navigation & Breadcrumb */}
      <div className="flex items-center justify-between gap-3">
        {/* Neon Back Button */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200/90 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white transition-all shadow-[0_0_10px_rgba(16,185,129,0.12)] active:scale-95 cursor-pointer font-bold text-xs"
        >
          <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
          <span>Dashboard</span>
        </button>

        {/* Action Controls for this Card */}
        <div className="flex items-center gap-2">
          {/* Google Sheets Link / Connect Drive */}
          {spreadsheetInfo?.webViewLink ? (
            <a
              href={spreadsheetInfo.webViewLink}
              target="_blank"
              rel="noopener noreferrer"
              title="Open CrediTrack_Card_Manager in Google Sheets"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-emerald-50/80 dark:bg-slate-900 dark:hover:bg-slate-800 border border-emerald-400/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold transition-all shadow-[0_0_10px_rgba(16,185,129,0.2)] active:scale-95 cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5 stroke-[2.2]" />
              <span className="hidden sm:inline">Google Sheet</span>
            </a>
          ) : (
            <button
              onClick={onConnectGoogle}
              title="Connect Google Drive to auto-sync this card"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 text-xs font-bold border border-emerald-400/80 shadow-[0_0_14px_rgba(16,185,129,0.4)] hover:shadow-[0_0_20px_rgba(16,185,129,0.6)] transition-all cursor-pointer"
            >
              <Cloud className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="hidden sm:inline">Connect Drive</span>
            </button>
          )}

          {/* Guide Button */}
          <button
            onClick={onOpenGuide}
            title="Google Drive & Sheets Integration Guide"
            className="p-2 rounded-xl bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200/90 dark:border-slate-800 text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white transition-all shadow-[0_0_10px_rgba(16,185,129,0.1)] active:scale-95 cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 stroke-[2.2]" />
          </button>

          {/* Import Statement Button */}
          <button
            onClick={() => setIsImportModalOpen(true)}
            title="Import Statement / Sync Sheet"
            className="p-2 rounded-xl bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200/90 dark:border-slate-800 text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white transition-all shadow-[0_0_10px_rgba(16,185,129,0.1)] active:scale-95 cursor-pointer"
          >
            <Upload className="w-4 h-4 stroke-[2.2]" />
          </button>

          {/* Edit Card Name & Limit Button */}
          <button
            onClick={() => setIsEditCardModalOpen(true)}
            title="Edit card name, limit, and styling"
            className="p-2 rounded-xl bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200/90 dark:border-slate-800 text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white transition-all shadow-[0_0_10px_rgba(16,185,129,0.1)] active:scale-95 cursor-pointer"
          >
            <Edit3 className="w-4 h-4 stroke-[2.2]" />
          </button>

          {/* Delete Card Button */}
          <button
            onClick={() => setShowDeleteConfirm(true)}
            title="Delete this credit card"
            className="p-2 rounded-xl bg-white hover:bg-rose-50 dark:bg-slate-900 dark:hover:bg-rose-950/40 border border-slate-200/90 dark:border-slate-800 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 transition-all shadow-xs active:scale-95 cursor-pointer"
          >
            <Trash2 className="w-4 h-4 stroke-[2.2]" />
          </button>
        </div>
      </div>

      {/* Card Detail Hero Header */}
      <div
        className={`p-6 sm:p-7 rounded-3xl bg-gradient-to-br ${getThemeGradient(
          card.themeColor
        )} border relative overflow-hidden transition-all`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-xs uppercase tracking-wider font-extrabold text-white/90 bg-white/20 px-2.5 py-0.5 rounded-full border border-white/30 backdrop-blur-xs">
                {card.bankName}
              </span>
              <span className="text-xs text-white/90 font-mono tracking-wider drop-shadow-xs">
                {card.cardNumberMask}
              </span>
              {spreadsheetInfo?.spreadsheetId ? (
                <a
                  href={spreadsheetInfo.webViewLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[10px] text-white font-bold bg-white/20 border border-white/40 px-2.5 py-0.5 rounded-full backdrop-blur-xs hover:bg-white/30 transition-all shadow-xs"
                >
                  <CheckCircle2 className="w-2.5 h-2.5" />
                  <span>Google Drive Synced</span>
                  <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
                </a>
              ) : null}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-2 drop-shadow-xs">
              {card.name}
            </h1>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-xs text-white/85 font-medium">Current Outstanding Balance</span>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight mt-0.5 drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]">
              Rs. {formatCurrency(currentOutstanding)}
            </div>
            {card.creditLimit && (
              <div className="text-xs text-white/85 mt-1">
                Limit: <span className="font-mono font-semibold">Rs. {formatCurrency(card.creditLimit)}</span> ·{' '}
                <span className="font-bold text-white drop-shadow-xs">
                  {utilizationPct}% utilized
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* View Tabs with Consistent Neon Glow */}
      <div className="flex items-center justify-between border-b border-slate-200/90 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('transactions')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
              activeTab === 'transactions'
                ? 'bg-emerald-500 text-slate-950 border border-emerald-400/80 shadow-[0_0_14px_rgba(16,185,129,0.5)]'
                : 'bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ListFilter className="w-3.5 h-3.5" />
            <span>Transactions ({transactions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('monthly')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
              activeTab === 'monthly'
                ? 'bg-emerald-500 text-slate-950 border border-emerald-400/80 shadow-[0_0_14px_rgba(16,185,129,0.5)]'
                : 'bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Monthly Breakdown</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
              activeTab === 'analytics'
                ? 'bg-emerald-500 text-slate-950 border border-emerald-400/80 shadow-[0_0_14px_rgba(16,185,129,0.5)]'
                : 'bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Analytics & Trends</span>
          </button>
        </div>

        {/* Repositioned Add Transaction Button with Neon Glow */}
        <button
          onClick={handleOpenAddTx}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 text-xs font-black border border-emerald-400/80 shadow-[0_0_16px_rgba(16,185,129,0.5)] hover:shadow-[0_0_22px_rgba(16,185,129,0.7)] transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span className="hidden sm:inline">Log Transaction</span>
          <span className="sm:hidden">Log</span>
        </button>
      </div>

      {/* Active Tab Viewport */}
      {activeTab === 'transactions' && (
        <TransactionTable
          transactions={transactions}
          onEdit={handleOpenEditTx}
          onDelete={onDeleteTransaction}
        />
      )}

      {activeTab === 'monthly' && (
        <MonthlyBreakdown cardId={card.id} transactions={transactions} />
      )}

      {activeTab === 'analytics' && (
        <AnalyticsChart cardId={card.id} transactions={transactions} />
      )}

      {/* Floating Add Transaction Action Button */}
      <button
        onClick={handleOpenAddTx}
        aria-label="Add Transaction"
        className="fixed right-6 bottom-20 md:bottom-8 z-30 w-14 h-14 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 flex items-center justify-center border border-emerald-400/80 shadow-[0_0_20px_rgba(16,185,129,0.6)] hover:shadow-[0_0_28px_rgba(16,185,129,0.8)] transition-all cursor-pointer"
      >
        <Plus className="w-7 h-7 stroke-[3]" />
      </button>

      {/* Transaction Add / Edit Modal */}
      <TransactionModal
        card={card}
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        onSave={handleSaveTx}
        editingTransaction={editingTx}
        currentBalance={currentOutstanding}
      />

      {/* Import Statement Modal */}
      <ImportSheetModal
        card={card}
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportComplete={(imported) => {
          onImportTransactions(imported, 'replace');
          setIsImportModalOpen(false);
        }}
        onUpdateCardConfig={onUpdateCardConfig}
        onOpenGuide={onOpenGuide}
        googleUser={googleUser}
        spreadsheetInfo={spreadsheetInfo}
        onConnectGoogle={onConnectGoogle}
        onSyncGoogleNow={onSyncAllToGoogleDrive}
        isSyncingGoogle={isGoogleSyncing}
      />

      {/* Delete Card Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-60 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl animate-scaleUp">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto mb-3 shadow-[0_0_12px_rgba(244,63,94,0.3)]">
              <AlertTriangle className="w-6 h-6 stroke-[2.2]" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              Delete {card.name}?
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
              This will permanently delete this card and its transaction log. If Google Drive is synced, its dedicated tab will also be removed.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer active:scale-95 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteCard(card.id);
                  setShowDeleteConfirm(false);
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-xs font-bold text-white shadow-[0_0_14px_rgba(244,63,94,0.45)] hover:shadow-[0_0_20px_rgba(244,63,94,0.65)] transition-all cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Card Details Modal */}
      <EditCardModal
        card={card}
        isOpen={isEditCardModalOpen}
        onClose={() => setIsEditCardModalOpen(false)}
        onSaveCard={(cardId, updated) => onUpdateCardConfig(cardId, updated)}
      />
    </div>
  );
};
