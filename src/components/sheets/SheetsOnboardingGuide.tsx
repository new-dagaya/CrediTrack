import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  CheckCircle2, 
  ExternalLink, 
  Sparkles, 
  Cloud, 
  ShieldCheck, 
  Zap, 
  RefreshCw, 
  Layers,
  ArrowRight,
  Database
} from 'lucide-react';

interface SheetsOnboardingGuideProps {
  onClose: () => void;
  onConnectGoogle?: () => void;
  isConnected?: boolean;
  sheetLink?: string;
}

export const SheetsOnboardingGuide: React.FC<SheetsOnboardingGuideProps> = ({ 
  onClose,
  onConnectGoogle,
  isConnected = false,
  sheetLink
}) => {
  const [activeTab, setActiveTab] = useState<'oauth' | 'structure' | 'csv'>('oauth');

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col justify-end sm:justify-center items-center p-0 sm:p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-800 dark:text-slate-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Google Drive & Sheets Integration</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                  Automated OAuth
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Zero manual configuration · Seamless cloud synchronization</p>
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
            onClick={() => setActiveTab('oauth')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'oauth'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-200'
            }`}
          >
            <Cloud className="w-3.5 h-3.5" />
            <span>Automated Drive Sync</span>
          </button>
          
          <button
            onClick={() => setActiveTab('structure')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'structure'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Sheet Format & Columns</span>
          </button>

          <button
            onClick={() => setActiveTab('csv')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'csv'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>CSV Statement Import</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs sm:text-sm">
          {activeTab === 'oauth' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 space-y-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <h4 className="font-bold text-emerald-900 dark:text-emerald-200 text-sm">
                    No Manual Keys or IDs Required
                  </h4>
                </div>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-xs">
                  CrediTrack uses Google Drive & Google Sheets OAuth. You never have to copy spreadsheet IDs, configure Google Cloud projects, or deal with API keys.
                </p>
              </div>

              <div className="space-y-3">
                <h5 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                  How It Works in 3 Automatic Steps
                </h5>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0">
                    1
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white text-xs">Sign In with Google</p>
                    <p className="text-slate-600 dark:text-slate-400 text-xs mt-0.5">
                      Grant CrediTrack permission to manage files it creates in your Google Drive.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0">
                    2
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white text-xs">Automated Spreadsheet Creation</p>
                    <p className="text-slate-600 dark:text-slate-400 text-xs mt-0.5">
                      The app searches for <strong className="text-slate-900 dark:text-white">CrediTrack_Card_Manager</strong>. If not found, it automatically creates it in your Google Drive root with standard headers.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0">
                    3
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white text-xs">Instant Bi-Directional Cloud Sync</p>
                    <p className="text-slate-600 dark:text-slate-400 text-xs mt-0.5">
                      All your card transactions, balances, and categories are automatically mirrored to Google Drive.
                    </p>
                  </div>
                </div>
              </div>

              {isConnected && sheetLink && (
                <div className="pt-2 flex items-center justify-between p-3 rounded-2xl bg-emerald-50 dark:bg-slate-800 border border-emerald-200 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-semibold text-slate-900 dark:text-white">Your Google Sheet is connected!</span>
                  </div>
                  <a
                    href={sheetLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors"
                  >
                    <span>Open in Drive</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          )}

          {activeTab === 'structure' && (
            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider mb-2">
                  Dynamic Multi-Sheet (Tabs) Structure
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Your generated <strong className="text-slate-900 dark:text-white">CrediTrack_Card_Manager</strong> Google Sheet automatically saves data for <strong className="text-emerald-600 dark:text-emerald-400">each credit card into separate individual tabs</strong> (e.g., <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 font-mono text-xs">COMMERCIAL_BANK</code>, <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 font-mono text-xs">SAMPATH_BANK</code>).
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mt-1">
                  Each card tab independently holds its own standard 6 columns:
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {[
                  { col: 'Month', desc: 'e.g., 2026 Aug' },
                  { col: 'Date', desc: 'e.g., 8/11/2026' },
                  { col: 'Type', desc: 'Use / Pay / Interest/Fee' },
                  { col: 'Amount', desc: 'Transaction value' },
                  { col: 'Balance', desc: 'Running outstanding balance' },
                  { col: 'Description', desc: 'Vendor, note, or transaction details' },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1"
                  >
                    <span className="font-mono font-bold text-xs text-emerald-700 dark:text-emerald-400">
                      Col {i + 1}: {item.col}
                    </span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'csv' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Want to import past monthly bank statements? You can also upload a CSV or paste rows from any spreadsheet inside any card's detail view under <strong className="text-slate-900 dark:text-white">Import Sheet</strong>. The smart column detector will map the date, amount, and description fields automatically.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex justify-between items-center">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
          >
            Close Guide
          </button>

          {!isConnected && onConnectGoogle && (
            <button
              onClick={() => {
                onClose();
                onConnectGoogle();
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 cursor-pointer"
            >
              <span>Connect Google Drive</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
