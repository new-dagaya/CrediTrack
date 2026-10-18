import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, 
  Plus, 
  FileSpreadsheet, 
  BarChart3, 
  ListFilter, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Settings, 
  Sparkles,
  Layers,
  HelpCircle,
  TrendingDown,
  TrendingUp,
  CreditCard,
  Trash2,
  AlertTriangle,
  ExternalLink,
  Cloud
} from 'lucide-react';
import { CardProfile, Transaction } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { TransactionTable } from './TransactionTable';
import { MonthlyBreakdown } from './MonthlyBreakdown';
import { AnalyticsChart } from './AnalyticsChart';
import { TransactionModal } from './TransactionModal';
import { ImportSheetModal } from '../sheets/ImportSheetModal';
import { GoogleSpreadsheetInfo } from '../../utils/googleDriveSync';

interface CardDetailViewProps {
  card: CardProfile;
  transactions: Transaction[];
  onBack: () => void;
  onAddTransaction: (tx: Omit<Transaction, 'id' | 'balance' | 'createdAt'>) => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (tx: Transaction) => void;
  onDeleteCard: (cardId: string) => void;
  onImportTransactions: (imported: Transaction[], mode: 'replace' | 'append') => void;
  onUpdateCardConfig: (cardId: string, updatedConfig: Partial<CardProfile>) => void;
  onOpenGuide: () => void;
  // Google Drive & Sheets Integration
  googleUser?: { displayName: string | null; email: string | null } | null;
  spreadsheetInfo?: GoogleSpreadsheetInfo | null;
  onSyncAllToGoogleDrive?: () => void;
  isGoogleSyncing?: boolean;
  onConnectGoogle?: () => void;
}

export const CardDetailView: React.FC<CardDetailViewProps> = ({
  card,
  transactions,
  onBack,
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction,
  onDeleteCard,
  onImportTransactions,
  onUpdateCardConfig,
  onOpenGuide,
  googleUser,
  spreadsheetInfo,
  onSyncAllToGoogleDrive,
  isGoogleSyncing = false,
  onConnectGoogle,
}) => {
  const [activeTab, setActiveTab] = useState<'transactions' | 'monthly' | 'analytics'>('transactions');
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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

  // Theme gradient lookup with solid high-contrast backgrounds
  const getThemeGradient = (color: CardProfile['themeColor']) => {
    switch (color) {
      case 'amber':
        return 'from-amber-700 via-amber-800 to-amber-950 border-amber-600/40 text-white';
      case 'emerald':
        return 'from-emerald-700 via-teal-800 to-emerald-950 border-emerald-600/40 text-white';
      case 'blue':
        return 'from-blue-700 via-indigo-800 to-slate-950 border-blue-600/40 text-white';
      case 'purple':
        return 'from-purple-700 via-purple-850 to-indigo-950 border-purple-600/40 text-white';
      case 'rose':
        return 'from-rose-700 via-rose-800 to-rose-950 border-rose-600/40 text-white';
      case 'cyan':
        return 'from-cyan-700 via-teal-850 to-slate-950 border-cyan-600/40 text-white';
      default:
        return 'from-slate-800 via-slate-850 to-slate-950 border-slate-700/60 text-white';
    }
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Top Navigation & Breadcrumb */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white transition-colors shadow-xs cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-xs font-semibold">All Cards</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Import Sheet Action */}
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-emerald-700 dark:text-emerald-400 transition-colors shadow-xs cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Import / Sync</span>
          </button>

          {/* Google Drive Sync / Connect Button */}
          {googleUser ? (
            <button
              onClick={onSyncAllToGoogleDrive}
              disabled={isGoogleSyncing}
              title="Sync all transactions to Google Drive sheet"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isGoogleSyncing ? 'animate-spin text-emerald-500' : ''}`} />
              <span className="hidden sm:inline">
                {isGoogleSyncing ? 'Syncing...' : 'Sync Sheet'}
              </span>
            </button>
          ) : (
            <button
              onClick={onConnectGoogle}
              title="Connect Google Drive to auto-sync this card"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Cloud className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Connect Drive</span>
            </button>
          )}

          {/* Guide */}
          <button
            onClick={onOpenGuide}
            title="Google Drive & Sheets Integration Guide"
            className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors shadow-xs cursor-pointer"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* Delete Card */}
          <button
            onClick={() => setShowDeleteConfirm(true)}
            title="Delete this credit card"
            className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors shadow-xs cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Card Detail Hero Header */}
      <div
        className={`p-6 rounded-3xl bg-gradient-to-br ${getThemeGradient(
          card.themeColor
        )} border shadow-md dark:shadow-2xl relative overflow-hidden`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-xs uppercase tracking-wider font-semibold text-white/80">
                {card.bankName}
              </span>
              <span className="text-xs text-white/70 font-mono">
                {card.cardNumberMask}
              </span>
              {spreadsheetInfo?.spreadsheetId ? (
                <a
                  href={spreadsheetInfo.webViewLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[10px] text-emerald-200 bg-emerald-950/60 border border-emerald-400/30 px-2 py-0.5 rounded-full font-medium hover:bg-emerald-900 transition-colors"
                >
                  <CheckCircle2 className="w-2.5 h-2.5" />
                  <span>Google Drive Synced</span>
                  <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
                </a>
              ) : null}
            </div>

            <h1 className="text-2xl font-bold text-white tracking-tight mt-1">
              {card.name}
            </h1>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-xs text-white/70">Current Outstanding Balance</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono tracking-tight mt-0.5">
              Rs. {formatCurrency(currentOutstanding)}
            </div>
            {card.creditLimit && (
              <div className="text-[11px] text-white/70 mt-1">
                Limit: Rs. {formatCurrency(card.creditLimit)} ·{' '}
                <span className="font-semibold text-emerald-200">
                  {utilizationPct}% utilized
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* View Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('transactions')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'transactions'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-200'
            }`}
          >
            <ListFilter className="w-3.5 h-3.5" />
            <span>Transactions ({transactions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('monthly')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'monthly'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Monthly Breakdown</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'analytics'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Analytics & Trends</span>
          </button>
        </div>

        {/* Repositioned Add Transaction Button */}
        <button
          onClick={handleOpenAddTx}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add Transaction</span>
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
        title="Add Transaction"
        className="fixed bottom-22 sm:bottom-8 right-5 sm:right-8 z-40 w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 flex items-center justify-center shadow-xl shadow-emerald-500/35 border-2 border-slate-900/10 dark:border-white/20 transition-all cursor-pointer"
      >
        <Plus className="w-7 h-7 stroke-[2.5]" />
      </button>

      {/* Transaction Modal (Add / Edit) */}
      <TransactionModal
        card={card}
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        onSave={handleSaveTx}
        editingTransaction={editingTx}
        currentBalance={currentOutstanding}
      />

      {/* Import / Google Drive Sync Modal */}
      <ImportSheetModal
        card={card}
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportComplete={onImportTransactions}
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
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl animate-scaleUp">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              Delete {card.name}?
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
              This will permanently delete this card profile along with its entire transaction log (
              <strong className="text-slate-900 dark:text-white">
                {transactions.length} records
              </strong>
              ). This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteCard(card.id);
                  setShowDeleteConfirm(false);
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
