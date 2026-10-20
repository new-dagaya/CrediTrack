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
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex flex-col justify-end sm:justify-center items-center p-0 sm:p-4 animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-t-3xl sm:rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-800 dark:text-slate-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200/90 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-400/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-[0_0_12px_rgba(16,185,129,0.25)]">
              <FileSpreadsheet className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white drop-shadow-[0_0_6px_rgba(16,185,129,0.2)]">
                  Google Drive & Sheets Integration
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 shadow-[0_0_8px_rgba(16,185,129,0.2)]">
                  Automated OAuth
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Zero manual configuration · Multi-sheet synchronization</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white flex items-center justify-center text-sm transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Tab switcher with Neon styling */}
        <div className="flex items-center border-b border-slate-200/90 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-2 gap-2">
          <button
            onClick={() => setActiveTab('oauth')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'oauth'
                ? 'bg-emerald-500 text-slate-950 shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-200'
            }`}
          >
            <Cloud className="w-3.5 h-3.5 stroke-[2.2]" />
            <span>Automated Drive Sync</span>
          </button>

          <button
            onClick={() => setActiveTab('structure')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'structure'
                ? 'bg-emerald-500 text-slate-950 shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5 stroke-[2.2]" />
            <span>Dedicated Sheet Tabs</span>
          </button>

          <button
            onClick={() => setActiveTab('csv')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'csv'
                ? 'bg-emerald-500 text-slate-950 shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-200'
            }`}
          >
            <Database className="w-3.5 h-3.5 stroke-[2.2]" />
            <span>CSV Import</span>
          </button>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'oauth' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800/40 text-xs text-slate-700 dark:text-slate-300 space-y-2">
                <h4 className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>How Automated Sync Works:</span>
                </h4>
                <p className="leading-relaxed">
                  When you sign in with your Google account, CrediTrack automatically searches your Google Drive for a file named <strong className="text-slate-900 dark:text-white">CrediTrack_Card_Manager</strong>. If it doesn't exist, CrediTrack creates it for you with separate tabs for every active card.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Key Benefits
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/90 dark:border-slate-800 space-y-1">
                    <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      Multi-Tab Architecture
                    </span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Each card has its own dedicated tab (e.g. COMMERCIAL_BANK, SAMPATH_BANK) with independent running balances.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/90 dark:border-slate-800 space-y-1">
                    <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      Dynamic Tab Deletion
                    </span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Deleting a card in the app automatically removes its dedicated tab from your Google Sheet file.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'structure' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                Each card tab maintains the standard 6-column financial ledger format:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {[
                  { col: 'Month', desc: 'e.g. 2026 Aug' },
                  { col: 'Date', desc: 'e.g. 8/25/2026' },
                  { col: 'Type', desc: 'Use, Pay, Interest/Fee' },
                  { col: 'Amount', desc: 'Numerical transaction value' },
                  { col: 'Balance', desc: 'Running statement balance' },
                  { col: 'Description', desc: 'Merchant or reference' },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/90 dark:border-slate-700/60 space-y-1 shadow-xs"
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
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                Want to import past monthly bank statements? You can also upload a CSV or paste rows from any spreadsheet inside any card's detail view under <strong className="text-slate-900 dark:text-white font-bold">Import Statement</strong>. The smart column detector will map the date, amount, and description fields automatically.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200/90 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex justify-between items-center">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer active:scale-95"
          >
            Close Guide
          </button>

          {!isConnected && onConnectGoogle && (
            <button
              onClick={() => {
                onClose();
                onConnectGoogle();
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black text-xs border border-emerald-400/80 shadow-[0_0_14px_rgba(16,185,129,0.45)] cursor-pointer transition-all"
            >
              <span>Connect Google Drive</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
