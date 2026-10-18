import React from 'react';
import { CreditCard, Lock, ShieldCheck, HelpCircle, Sun, Moon } from 'lucide-react';

interface HeaderProps {
  onLockApp: () => void;
  onOpenGuide: () => void;
  onOpenSettings: () => void;
  onNavigateHome: () => void;
  activeView: 'dashboard' | 'tracker' | 'settings';
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onLockApp,
  onOpenGuide,
  onOpenSettings,
  onNavigateHome,
  activeView,
  theme,
  onToggleTheme,
}) => {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 px-4 sm:px-8 py-3 bg-white/95 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors shadow-xs">
      {/* Zone 1: Single text element wordmark */}
      <button
        onClick={onNavigateHome}
        className="flex items-center gap-2.5 text-left whitespace-nowrap shrink-0 group focus:outline-none"
      >
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-emerald-500/25 group-hover:scale-105 transition-transform">
          <CreditCard className="w-4 h-4 text-slate-950 stroke-[2.5]" />
        </div>
        <span className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
          CrediTrack
        </span>
      </button>

      {/* Zone 2: Navigation Links for larger screens */}
      <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600 dark:text-slate-400">
        <button
          onClick={onNavigateHome}
          className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 ${
            activeView === 'dashboard' ? 'text-emerald-600 dark:text-emerald-400 font-bold' : ''
          }`}
        >
          Dashboard
        </button>
        <button
          onClick={onNavigateHome}
          className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
        >
          Cards
        </button>
        <button
          onClick={onOpenGuide}
          className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
        >
          Sheets Guide
        </button>
        <button
          onClick={onOpenSettings}
          className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 ${
            activeView === 'settings' ? 'text-emerald-600 dark:text-emerald-400 font-bold' : ''
          }`}
        >
          PIN Security
        </button>
      </nav>

      {/* Zone 3: Actions - Single Prominent Theme Toggle & Quick Lock */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Single Prominent Dark/Light Mode Switch with animated icons & badge */}
        <button
          onClick={onToggleTheme}
          type="button"
          aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 transition-all whitespace-nowrap shrink-0 active:scale-95 shadow-xs"
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-4 h-4 text-amber-400 stroke-[2.5]" />
              <span className="text-xs font-semibold text-amber-300">Light</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-indigo-600 stroke-[2.5]" />
              <span className="text-xs font-semibold text-indigo-900">Dark</span>
            </>
          )}
        </button>

        {/* Lock button */}
        <button
          onClick={onLockApp}
          type="button"
          title="Lock App with PIN"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors whitespace-nowrap shrink-0 active:scale-95"
        >
          <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span className="hidden sm:inline">Lock</span>
        </button>
      </div>
    </header>
  );
};
