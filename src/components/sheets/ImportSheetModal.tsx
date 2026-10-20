import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Upload, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  Table, 
  ArrowRight, 
  RefreshCw, 
  Sparkles, 
  HelpCircle,
  Cloud,
  Layers,
  X
} from 'lucide-react';
import { CardProfile, ColumnMapping, Transaction } from '../../types';
import { 
  parseDelimitedText, 
  autoDetectColumnMapping, 
  transformRowsToTransactions
} from '../../utils/sheetsSync';
import { GoogleSpreadsheetInfo } from '../../utils/googleDriveSync';

interface ImportSheetModalProps {
  card: CardProfile;
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: (importedTransactions: Transaction[], mode: 'replace' | 'append') => void;
  onUpdateCardConfig: (cardId: string, updatedConfig: Partial<CardProfile>) => void;
  onOpenGuide: () => void;
  // Google Drive integration props
  googleUser?: { displayName: string | null; email: string | null } | null;
  spreadsheetInfo?: GoogleSpreadsheetInfo | null;
  onConnectGoogle?: () => void;
  onSyncGoogleNow?: () => void;
  isSyncingGoogle?: boolean;
}

export const ImportSheetModal: React.FC<ImportSheetModalProps> = ({
  card,
  isOpen,
  onClose,
  onImportComplete,
  onOpenGuide,
  googleUser,
  spreadsheetInfo,
  onConnectGoogle,
  onSyncGoogleNow,
  isSyncingGoogle = false,
}) => {
  const [activeTab, setActiveTab] = useState<'drive' | 'paste'>('drive');
  const [pastedText, setPastedText] = useState('');
  const [parsedHeaders, setParsedHeaders] = useState<string[]>([]);
  const [parsedRows, setParsedRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({
    monthCol: '',
    dateCol: '',
    typeCol: '',
    amountCol: '',
    balanceCol: '',
    descriptionCol: '',
  });
  const [importMode, setImportMode] = useState<'append' | 'replace'>('replace');
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // When text is typed or pasted, parse automatically
  useEffect(() => {
    if (!pastedText.trim()) {
      setParsedHeaders([]);
      setParsedRows([]);
      return;
    }
    const { headers, rows } = parseDelimitedText(pastedText);
    setParsedHeaders(headers);
    setParsedRows(rows);
    if (headers.length > 0) {
      const detected = autoDetectColumnMapping(headers);
      setMapping(detected);
    }
  }, [pastedText]);

  // Handle CSV file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setPastedText(content);
      }
    };
    reader.readAsText(file);
  };

  const handleExecuteImport = () => {
    if (parsedRows.length === 0) {
      setFeedback({ type: 'error', message: 'No data rows found to import.' });
      return;
    }
    setIsProcessing(true);
    try {
      const allTransactions = transformRowsToTransactions(
        parsedHeaders,
        parsedRows,
        mapping,
        card.id
      );

      onImportComplete(allTransactions, importMode);
      setFeedback({ 
        type: 'success', 
        message: `Successfully imported ${allTransactions.length} transactions for ${card.name}!` 
      });
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (e: any) {
      setFeedback({ type: 'error', message: e?.message || 'Import failed.' });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-t-3xl sm:rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-800 dark:text-slate-200 transition-colors">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200/90 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-400/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-[0_0_12px_rgba(16,185,129,0.25)]">
              <FileSpreadsheet className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white drop-shadow-[0_0_6px_rgba(16,185,129,0.2)]">
                  Google Sheet Sync & Import
                </h2>
                <span className="text-xs text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-400/50 px-2 py-0.5 rounded-full font-bold shadow-[0_0_8px_rgba(16,185,129,0.2)]">
                  {card.bankName}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Automated Google Drive sync or bank statement import</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switcher with Neon styling */}
        <div className="flex items-center border-b border-slate-200/90 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-2 gap-2">
          <button
            onClick={() => setActiveTab('drive')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'drive'
                ? 'bg-emerald-500 text-slate-950 shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-200'
            }`}
          >
            <Cloud className="w-3.5 h-3.5 stroke-[2.2]" />
            <span>Google Drive Sync</span>
          </button>

          <button
            onClick={() => setActiveTab('paste')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'paste'
                ? 'bg-emerald-500 text-slate-950 shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5 stroke-[2.2]" />
            <span>Paste / CSV Statement</span>
          </button>
        </div>

        {/* Modal content body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {feedback && (
            <div
              className={`p-3.5 rounded-2xl flex items-center gap-2.5 text-xs font-bold ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/60 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                  : 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800/60 shadow-[0_0_10px_rgba(244,63,94,0.2)]'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* TAB 1: AUTOMATED DRIVE SYNC */}
          {activeTab === 'drive' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/90 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cloud className="w-4 h-4 text-emerald-600 dark:text-emerald-400 stroke-[2.2]" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">Google Drive Integration</span>
                  </div>
                  {googleUser && (
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-400/50 px-2 py-0.5 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.2)]">
                      Connected
                    </span>
                  )}
                </div>

                {googleUser ? (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                      Signed in as <strong className="text-slate-900 dark:text-white">{googleUser.displayName || googleUser.email}</strong>. 
                      Every change on this card is synchronized to your dedicated tab inside <code className="text-emerald-600 font-semibold font-mono">CrediTrack_Card_Manager</code>.
                    </p>

                    <div className="flex gap-2">
                      {spreadsheetInfo?.webViewLink && (
                        <a
                          href={spreadsheetInfo.webViewLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-emerald-50/80 dark:bg-slate-800 dark:hover:bg-slate-700 border border-emerald-400/50 text-xs font-bold text-emerald-700 dark:text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.2)] transition-all cursor-pointer"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Open in Sheets</span>
                        </a>
                      )}

                      {onSyncGoogleNow && (
                        <button
                          type="button"
                          onClick={onSyncGoogleNow}
                          disabled={isSyncingGoogle}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black text-xs border border-emerald-400/80 shadow-[0_0_14px_rgba(16,185,129,0.45)] hover:shadow-[0_0_20px_rgba(16,185,129,0.65)] transition-all cursor-pointer disabled:opacity-50"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 stroke-[2.5] ${isSyncingGoogle ? 'animate-spin' : ''}`} />
                          <span>{isSyncingGoogle ? 'Syncing...' : 'Sync Now'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                      Authorize Google Drive once. CrediTrack will automatically generate and maintain your spreadsheet with separate tabs per card.
                    </p>

                    {onConnectGoogle && (
                      <button
                        type="button"
                        onClick={onConnectGoogle}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black text-xs border border-emerald-400/80 shadow-[0_0_14px_rgba(16,185,129,0.45)] cursor-pointer transition-all"
                      >
                        <Cloud className="w-4 h-4 stroke-[2.5]" />
                        <span>Connect Google Drive</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: PASTE / CSV STATEMENT */}
          {activeTab === 'paste' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Upload CSV or Paste Tabular Statement
                </span>
                <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-50/80 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200/90 dark:border-slate-700 text-xs font-bold text-emerald-700 dark:text-emerald-400 transition-all cursor-pointer shadow-xs active:scale-95">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload .CSV</span>
                  <input
                    type="file"
                    accept=".csv,text/plain,text/csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Paste tab-separated or comma-separated transaction records directly from Excel, Google Sheets, or online banking statement..."
                className="w-full h-32 bg-slate-50 dark:bg-slate-950 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-3 text-xs font-mono text-slate-900 dark:text-slate-200 focus:outline-none focus:border-emerald-500 focus:shadow-[0_0_10px_rgba(16,185,129,0.2)] resize-none"
              />

              {/* Parsing status & column mapper */}
              {parsedHeaders.length > 0 && (
                <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/90 dark:border-slate-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900 dark:text-white">
                      Detected {parsedRows.length} data rows & {parsedHeaders.length} columns
                    </span>
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-400/50 px-2 py-0.5 rounded-full font-bold">
                      Auto-Mapped
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    {[
                      { key: 'dateCol', label: 'Date Column' },
                      { key: 'monthCol', label: 'Month Column' },
                      { key: 'typeCol', label: 'Type Column' },
                      { key: 'amountCol', label: 'Amount Column' },
                      { key: 'balanceCol', label: 'Balance Column' },
                      { key: 'descriptionCol', label: 'Description' },
                    ].map(({ key, label }) => (
                      <div key={key} className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                          {label}
                        </label>
                        <select
                          value={(mapping as any)[key] || ''}
                          onChange={(e) =>
                            setMapping((prev) => ({ ...prev, [key]: e.target.value }))
                          }
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500 font-medium"
                        >
                          <option value="">-- Ignore / Calculate --</option>
                          {parsedHeaders.map((h, i) => (
                            <option key={i} value={h}>
                              {h || `Column ${i + 1}`}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 flex items-center gap-4">
                    <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 font-semibold cursor-pointer">
                      <input
                        type="radio"
                        name="importMode"
                        checked={importMode === 'replace'}
                        onChange={() => setImportMode('replace')}
                        className="text-emerald-500 focus:ring-emerald-400"
                      />
                      <span>Replace existing {card.name} logs</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 font-semibold cursor-pointer">
                      <input
                        type="radio"
                        name="importMode"
                        checked={importMode === 'append'}
                        onChange={() => setImportMode('append')}
                        className="text-emerald-500 focus:ring-emerald-400"
                      />
                      <span>Append to existing logs</span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200/90 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer active:scale-95"
          >
            Cancel
          </button>

          {activeTab === 'paste' && parsedRows.length > 0 && (
            <button
              onClick={handleExecuteImport}
              disabled={isProcessing}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 text-xs font-black border border-emerald-400/80 shadow-[0_0_16px_rgba(16,185,129,0.5)] transition-all cursor-pointer"
            >
              <span>Import {parsedRows.length} Rows</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
