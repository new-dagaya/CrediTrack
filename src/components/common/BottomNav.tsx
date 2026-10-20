import React from 'react';
import { Home, CreditCard, FileSpreadsheet, ShieldCheck } from 'lucide-react';

interface BottomNavProps {
  currentTab: 'dashboard' | 'cards' | 'guide' | 'settings';
  onSelectTab: (tab: 'dashboard' | 'cards' | 'guide' | 'settings') => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onSelectTab }) => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'cards', label: 'Cards', icon: CreditCard },
    { id: 'guide', label: 'Sheets Sync', icon: FileSpreadsheet },
    { id: 'settings', label: 'Security', icon: ShieldCheck },
  ] as const;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-t border-slate-200/90 dark:border-slate-800 pb-safe transition-colors">
      <div className="grid grid-cols-4 items-center h-16 max-w-md mx-auto px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`min-h-[48px] min-w-[48px] flex flex-col items-center justify-center transition-all cursor-pointer relative ${
                isActive
                  ? 'text-emerald-600 dark:text-emerald-400 font-bold drop-shadow-[0_0_10px_rgba(16,185,129,0.6)]'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {isActive && (
                <div className="absolute top-1 w-8 h-1 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
              )}
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
              <span className="text-[10px] font-semibold tracking-tight mt-1">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
