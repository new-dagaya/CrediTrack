import React from 'react';
import { 
  FileSpreadsheet, 
  ExternalLink, 
  RefreshCw, 
  CheckCircle2, 
  LogOut, 
  Cloud,
  Zap
} from 'lucide-react';
import { GoogleSpreadsheetInfo } from '../../utils/googleDriveSync';

interface GoogleDriveSyncBannerProps {
  user: {
    displayName: string | null;
    email: string | null;
    photoURL: string | null;
  } | null;
  sheetInfo: GoogleSpreadsheetInfo | null;
  isConnecting: boolean;
  isSyncing: boolean;
  onSignIn: () => void;
  onSignOut: () => void;
  className?: string;
  compact?: boolean;
}

export const GoogleDriveSyncBanner: React.FC<GoogleDriveSyncBannerProps> = ({
  user,
  sheetInfo,
  isConnecting,
  isSyncing,
  onSignIn,
  onSignOut,
  className = '',
}) => {
  // Official Google Sign-In button SVG
  const GoogleGIcon = () => (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );

  if (!user) {
    return (
      <div
        className={`p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-cyan-500/10 dark:from-emerald-950/30 dark:via-teal-950/20 dark:to-slate-900 border border-emerald-500/30 dark:border-emerald-500/30 shadow-xs ${className}`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-800 shadow-[0_0_12px_rgba(16,185,129,0.25)] border border-emerald-400/50 flex items-center justify-center shrink-0 text-emerald-600 dark:text-emerald-400">
              <Cloud className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white drop-shadow-[0_0_6px_rgba(16,185,129,0.2)]">
                  Automated Google Drive & Sheets Sync
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-400/50 shadow-[0_0_8px_rgba(16,185,129,0.2)]">
                  Real-Time Background Sync
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-xl leading-relaxed">
                Sign in with Google once. CrediTrack will automatically auto-load your existing{' '}
                <strong className="text-slate-900 dark:text-white font-bold">
                  CrediTrack_Card_Manager
                </strong>{' '}
                spreadsheet or create a new one, keeping all card records continuously synced in real time.
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-center">
            {/* Neon Google Sign In Button */}
            <button
              onClick={onSignIn}
              disabled={isConnecting}
              type="button"
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white hover:bg-cyan-50/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white border border-cyan-400/60 font-bold text-xs transition-all shadow-[0_0_12px_rgba(6,182,212,0.25)] hover:shadow-[0_0_18px_rgba(6,182,212,0.45)] active:scale-95 disabled:opacity-60 cursor-pointer"
            >
              {isConnecting ? (
                <RefreshCw className="w-4 h-4 animate-spin text-cyan-600" />
              ) : (
                <GoogleGIcon />
              )}
              <span>{isConnecting ? 'Connecting...' : 'Sign in with Google'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs transition-colors ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left: User & Sheet status */}
        <div className="flex items-center gap-3">
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName || 'User'}
              className="w-10 h-10 rounded-full border border-emerald-500/50 object-cover shadow-[0_0_10px_rgba(16,185,129,0.25)]"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-emerald-500 text-slate-950 font-black text-sm flex items-center justify-center shadow-[0_0_10px_rgba(16,185,129,0.35)]">
              {(user.displayName || user.email || 'G')[0].toUpperCase()}
            </div>
          )}

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                {user.displayName || user.email}
              </span>
              <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-400/50 px-2 py-0.5 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.2)]">
                <span className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-cyan-400 animate-spin' : 'bg-emerald-500 animate-pulse'}`} />
                <span>{isSyncing ? 'Auto-saving to Sheets...' : 'Real-Time Auto-Sync Active'}</span>
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex-wrap">
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="font-mono text-slate-800 dark:text-slate-200 font-semibold">
                {sheetInfo?.title || 'CrediTrack_Card_Manager'}
              </span>
              {sheetInfo?.lastSyncedAt && (
                <>
                  <span>•</span>
                  <span>
                    Auto-saved {new Date(sheetInfo.lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right: Actions (No manual sync button needed) */}
        <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
          {sheetInfo?.webViewLink && (
            <a
              href={sheetInfo.webViewLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-50/80 dark:bg-slate-800 dark:hover:bg-slate-700 border border-emerald-400/50 text-xs font-bold text-emerald-700 dark:text-emerald-300 transition-all shadow-[0_0_10px_rgba(16,185,129,0.2)] hover:shadow-[0_0_16px_rgba(16,185,129,0.4)] active:scale-95"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open in Google Sheets</span>
            </a>
          )}

          <button
            type="button"
            onClick={onSignOut}
            title="Sign out from Google Drive"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
