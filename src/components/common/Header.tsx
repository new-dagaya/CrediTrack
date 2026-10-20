import React from 'react';
import { CreditCard, Lock, HelpCircle, Sun, Moon, ShieldCheck, Sparkles, RefreshCw } from 'lucide-react';

interface HeaderProps {
  onLockApp: () => void;
  onOpenGuide: () => void;
  onOpenSettings: () => void;
  onNavigateHome: () => void;
  activeView: 'dashboard' | 'tracker' | 'settings';
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onManualSync: () => void;
  isSyncing?: boolean;
  hasGoogleUser?: boolean;
  lastSyncedAt?: number;
}

export const Header: React.FC<HeaderProps> = ({
  onLockApp,
  onOpenGuide,
  onOpenSettings,
  onNavigateHome,
  activeView,
  theme,
  onToggleTheme,
  onManualSync,
  isSyncing = false,
  hasGoogleUser = false,
  lastSyncedAt,
}) => {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-3 sm:gap-4 px-3 sm:px-8 py-2.5 sm:py-3 bg-white/95 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200/90 dark:border-slate-800 transition-colors shadow-xs">
      {/* Zone 1: Wordmark with Neon Glow */}
      <button
        onClick={onNavigateHome}
        className="flex items-center gap-2 sm:gap-2.5 text-left whitespace-nowrap shrink-0 group focus:outline-none cursor-pointer"
      >
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-400 via-teal-400 to-cyan-400 flex items-center justify-center text-slate-950 font-bold shadow-[0_0_16px_rgba(16,185,129,0.5)] group-hover:scale-105 transition-transform">
          <CreditCard className="w-4 h-4 text-slate-950 stroke-[2.5]" />
        </div>
        <span className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
          Credi<span className="text-emerald-600 dark:text-emerald-400 font-black drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]">Track</span>
        </span>
      </button>

      {/* Zone 2: Navigation Links for larger screens with Neon glow */}
      <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600 dark:text-slate-400">
        <button
          onClick={onNavigateHome}
          className={`transition-all whitespace-nowrap shrink-0 cursor-pointer ${
            activeView === 'dashboard'
              ? 'text-emerald-600 dark:text-emerald-400 font-bold drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]'
              : 'hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Dashboard
        </button>
        <button
          onClick={onNavigateHome}
          className="hover:text-slate-900 dark:hover:text-white transition-all whitespace-nowrap shrink-0 cursor-pointer"
        >
          Cards
        </button>
        <button
          onClick={onOpenGuide}
          className="hover:text-slate-900 dark:hover:text-white transition-all whitespace-nowrap shrink-0 cursor-pointer"
        >
          Sheets Guide
        </button>
        <button
          onClick={onOpenSettings}
          className={`transition-all whitespace-nowrap shrink-0 cursor-pointer ${
            activeView === 'settings'
              ? 'text-emerald-600 dark:text-emerald-400 font-bold drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]'
              : 'hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          PIN Security
        </button>
      </nav>

      {/* Zone 3: Actions - Neon Blue Manual Sync Button, Theme Toggle, Lock App */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        {/* Prominent Neon Blue Manual Sync Button */}
        <button
          onClick={onManualSync}
          disabled={isSyncing}
          type="button"
          aria-label="Force immediate one-way write sync to Google Drive"
          title={
            isSyncing
              ? 'Pushing current cards & transactions to Google Drive...'
              : hasGoogleUser
              ? 'Click to overwrite CrediTrack_Card_Manager in Google Drive with current app data (One-Way Write)'
              : 'Sign in & Sync with Google Drive'
          }
          className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 rounded-xl text-xs font-black transition-all whitespace-nowrap shrink-0 active:scale-95 cursor-pointer disabled:cursor-wait neon-btn-sync neon-pulse-sync group"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 text-cyan-600 dark:text-cyan-300 stroke-[2.6] transition-transform ${
              isSyncing ? 'animate-spin text-cyan-500' : 'group-hover:rotate-180 transition-transform duration-500'
            }`}
          />
          <span className="tracking-tight text-cyan-700 dark:text-cyan-300">
            {isSyncing ? 'Syncing...' : 'Sync Now'}
          </span>
          {/* Subtle neon pulse indicator dot */}
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.9)]"></span>
          </span>
        </button>

        {/* Neon Theme Toggle Button */}
        <button
          onClick={onToggleTheme}
          type="button"
          aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 active:scale-95 cursor-pointer ${
            theme === 'dark'
              ? 'bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.3)] hover:shadow-[0_0_18px_rgba(245,158,11,0.55)]'
              : 'bg-white hover:bg-cyan-50/80 text-cyan-700 border border-cyan-400/60 shadow-[0_0_12px_rgba(6,182,212,0.3)] hover:shadow-[0_0_18px_rgba(6,182,212,0.55)]'
          }`}
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-400 stroke-[2.5]" />
              <span className="hidden sm:inline">Light</span>
            </>
          ) : (
            <>
              <Moon className="w-3.5 h-3.5 text-cyan-600 stroke-[2.5]" />
              <span className="hidden sm:inline">Dark</span>
            </>
          )}
        </button>

        {/* Neon Lock App Button */}
        <button
          onClick={onLockApp}
          type="button"
          title="Lock App with PIN"
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-extrabold text-xs border border-emerald-400/80 shadow-[0_0_14px_rgba(16,185,129,0.45)] hover:shadow-[0_0_20px_rgba(16,185,129,0.65)] transition-all whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Lock className="w-3.5 h-3.5 text-slate-950 stroke-[2.5]" />
          <span className="hidden sm:inline">Lock</span>
        </button>
      </div>
    </header>
  );
};
