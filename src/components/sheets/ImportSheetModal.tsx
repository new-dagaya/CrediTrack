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
  Layers
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
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-800 dark:text-slate-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Google Sheet Sync & Import</h2>
                <span className="text-xs text-emerald-800 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/40 px-2 py-0.5 rounded-full font-medium">
                  {card.bankName}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Automated Google Drive sync or bank statement import</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white flex items-center justify-center text-sm transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950/60 p-2 gap-2">
          <button
            onClick={() => setActiveTab('drive')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'drive'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-200'
            }`}
          >
            <Cloud className="w-3.5 h-3.5" />
            <span>Google Drive Sync</span>
          </button>

          <button
            onClick={() => setActiveTab('paste')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'paste'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Paste / CSV Statement</span>
          </button>

          <button
            onClick={onOpenGuide}
            className="ml-auto flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-400 hover:underline px-2 py-1 font-semibold cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Sync Guide</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-slate-700 dark:text-slate-200">
          
          {feedback && (
            <div
              className={`p-3 rounded-2xl flex items-center gap-2.5 text-xs font-medium ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                  : 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          {activeTab === 'drive' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-xs space-y-2">
                <p className="font-bold text-emerald-800 dark:text-emerald-300 text-sm">
                  Seamless Google Drive Integration
                </p>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  No manual API keys or spreadsheet configuration required. Upon signing in, CrediTrack automatically generates your <strong className="text-slate-900 dark:text-white">CrediTrack_Card_Manager</strong> Google Sheet and keeps every transaction synced.
                </p>
              </div>

              {googleUser ? (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">
                        Connected as {googleUser.displayName || googleUser.email}
                      </span>
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                        <CheckCircle2 className="w-3 h-3" />
                        Google Drive OAuth Active
                      </span>
                    </div>

                    {spreadsheetInfo?.webViewLink && (
                      <a
                        href={spreadsheetInfo.webViewLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-white"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Open Sheet</span>
                      </a>
                    )}
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={onSyncGoogleNow}
                      disabled={isSyncingGoogle}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-emerald-500/20 active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 stroke-[2.5] ${isSyncingGoogle ? 'animate-spin' : ''}`} />
                      <span>{isSyncingGoogle ? 'Synchronizing to Google Drive...' : 'Sync All Cards to Google Sheet Now'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center space-y-3">
                  <Cloud className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mx-auto" />
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      Google Drive Not Connected Yet
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                      Click below to authenticate with Google. CrediTrack will automatically create your spreadsheet and keep all card records synced.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (onConnectGoogle) {
                        onConnectGoogle();
                      }
                    }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 cursor-pointer"
                  >
                    <span>Connect with Google</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'paste' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Paste copied rows from Google Sheets or CSV statement
                  </label>
                  <label className="text-xs text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer flex items-center gap-1 font-semibold">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload .CSV file</span>
                    <input
                      type="file"
                      accept=".csv,text/csv,text/plain"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                <textarea
                  rows={5}
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder={`Month\tDate\tType\tAmount\tBalance\tDescription\n2026 Aug\t8/11/2026\tUse\t12,500\t12,500\tSupermarket Groceries\n2026 Aug\t8/15/2026\tPay\t10,000\t2,500\tOnline Payment`}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-2xl p-3 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 shadow-2xs"
                />
              </div>

              {parsedHeaders.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Detected Columns ({parsedRows.length} rows found)
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {Object.entries({
                      Date: 'dateCol',
                      Amount: 'amountCol',
                      Type: 'typeCol',
                      Description: 'descriptionCol',
                      Month: 'monthCol',
                      Balance: 'balanceCol',
                    }).map(([label, key]) => (
                      <div key={key} className="space-y-1">
                        <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                          {label} Column
                        </label>
                        <select
                          value={(mapping as any)[key]}
                          onChange={(e) =>
                            setMapping((prev) => ({
                              ...prev,
                              [key]: e.target.value,
                            }))
                          }
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                        >
                          <option value="">(None)</option>
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
                    <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                      <input
                        type="radio"
                        name="importMode"
                        checked={importMode === 'replace'}
                        onChange={() => setImportMode('replace')}
                        className="text-emerald-500 focus:ring-emerald-400"
                      />
                      <span>Replace existing {card.name} logs</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
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
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/90 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
          >
            Cancel
          </button>

          {activeTab === 'paste' && parsedRows.length > 0 && (
            <button
              onClick={handleExecuteImport}
              disabled={isProcessing}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <span>Import {parsedRows.length} Rows</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
