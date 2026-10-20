import React from 'react';
import { ShieldCheck, HardDrive, FileSpreadsheet, Lock, CheckCircle2, X, ExternalLink } from 'lucide-react';

interface GoogleOAuthConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmConsent: () => void;
  isConnecting?: boolean;
}

export const GoogleOAuthConsentModal: React.FC<GoogleOAuthConsentModalProps> = ({
  isOpen,
  onClose,
  onConfirmConsent,
  isConnecting = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden animate-scaleUp">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 shadow-[0_0_12px_rgba(16,185,129,0.25)]">
              <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight drop-shadow-[0_0_6px_rgba(16,185,129,0.2)]">
                Google Drive Authorization
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Permission request for automated sheets sync
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isConnecting}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
            CrediTrack requests your permission to connect to your personal Google Drive to automatically create and manage your spreadsheet without manual setup.
          </p>

          <div className="space-y-3 bg-slate-50 dark:bg-slate-950/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                <HardDrive className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <strong className="text-slate-900 dark:text-white block font-bold">
                  Google Drive File Storage
                </strong>
                <span className="text-slate-500 dark:text-slate-400 text-[11px] leading-tight block mt-0.5">
                  Creates and manages the dedicated <code>CrediTrack_Card_Manager</code> file in your Drive.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <strong className="text-slate-900 dark:text-white block font-bold">
                  Google Sheets Tab Management
                </strong>
                <span className="text-slate-500 dark:text-slate-400 text-[11px] leading-tight block mt-0.5">
                  Synchronizes separate tabs for each card, transactions, and payment balances in real-time.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                <Lock className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <strong className="text-slate-900 dark:text-white block font-bold">
                  Strict Scoped Privacy
                </strong>
                <span className="text-slate-500 dark:text-slate-400 text-[11px] leading-tight block mt-0.5">
                  CrediTrack only has access to files it creates. It cannot view, edit, or delete any of your other Google Drive files or photos.
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300 text-[11px] font-semibold">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>Zero manual API keys or spreadsheet IDs required.</span>
          </div>

          {/* Action buttons with Neon Styling */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isConnecting}
              className="flex-1 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer active:scale-95"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirmConsent}
              disabled={isConnecting}
              className="flex-1 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black text-xs border border-emerald-400/80 shadow-[0_0_16px_rgba(16,185,129,0.5)] hover:shadow-[0_0_22px_rgba(16,185,129,0.7)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isConnecting ? (
                <span>Connecting...</span>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
                  <span>Allow & Connect</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
