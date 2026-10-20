# CrediTrack — Complete Updated Source Code & Architecture

## Overview of Latest Additions & Enhancements

### 1. Neon Style Manual "Sync Now" Button
- **Placement**: Prominently positioned at the top header (`Header.tsx`) of the main dashboard screen, immediately visible across mobile and desktop.
- **Styling**: Styled with a striking neon look:
  - Neon blue border (`border: 2px solid #22d3ee` / `#38bdf8`)
  - Subtle pulse animation (`@keyframes neon-sync-pulse` with `neon-pulse-sync` class)
  - Multi-layer outer glow effect (`box-shadow: 0 0 16px rgba(6,182,212,0.45), 0 0 28px rgba(6,182,212,0.85)`)
  - Animated pulsing indicator dot and interactive spinning sync icon (`RefreshCw`).

### 2. Logic Retention & Auto-Load Integration
- **Auto-Load on Login**: Upon Gmail login or app initialization, Google Drive is scanned for the file `"CrediTrack_Card_Manager"`. If found, existing credit card profiles, dedicated sheet tabs, and transaction histories are automatically parsed and loaded into state.
- **Immediate Forced Sync**: Clicking the manual "Sync Now" button invokes `performFullManualSync`, which:
  1. Verifies/refreshes Google OAuth access token.
  2. Queries Google Drive for `"CrediTrack_Card_Manager"`. If not found, creates the tracking spreadsheet.
  3. Reads all existing sheet tabs and `_CONFIG_` metadata.
  4. Merges local and remote card configurations and transaction histories with deduplication.
  5. Strictly sorts all transactions chronologically by date and recalculates running balances.
  6. Explicitly writes back all updated card configurations to `_CONFIG_` and all transactions to their dedicated tabs.
- **Real-Time Background Sync**: Retained as a seamless secondary mechanism on any transaction add/edit/delete or card layout change.

### 3. Hollow Neon Charts
- Empty/transparent bar fills (`bg-transparent`) with vibrant glowing neon borders:
  - **Expense**: Neon Red (`#ef4444` / `border-red-500` with `shadow-[0_0_8px_rgba(239,68,68,0.45)]`)
  - **Interest/Fee**: Neon Yellow (`#facc15` / `border-yellow-400` with `shadow-[0_0_8px_rgba(250,204,21,0.45)]`)
  - **Payment/Settlement**: Neon Green (`#34d399` / `border-emerald-400` with `shadow-[0_0_8px_rgba(52,211,153,0.45)]`)

---

## 1. `src/index.css`
```css
@import "tailwindcss";

@layer base {
  :root {
    --background: 210 40% 98%;
    --foreground: 222.2 84% 4.9%;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
  }
}

/* ============================================================
   CYBER NEON BUTTON & GLOW STYLES
   ============================================================ */

/* Neon Emerald / Primary Buttons */
.neon-btn-emerald {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: #022c22;
  border: 1px solid rgba(52, 211, 153, 0.8);
  box-shadow: 0 0 16px rgba(16, 185, 129, 0.45), 0 2px 4px rgba(0, 0, 0, 0.08);
  font-weight: 800;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
.neon-btn-emerald:hover {
  background: linear-gradient(135deg, #34d399 0%, #10b981 100%);
  box-shadow: 0 0 24px rgba(16, 185, 129, 0.7), 0 4px 8px rgba(0, 0, 0, 0.12);
  transform: translateY(-1px);
}
.neon-btn-emerald:active {
  transform: scale(0.97);
}

/* Neon Cyan / Accent Buttons */
.neon-btn-cyan {
  background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
  color: #ffffff;
  border: 1px solid rgba(103, 232, 249, 0.6);
  box-shadow: 0 0 14px rgba(6, 182, 212, 0.4), 0 2px 4px rgba(0, 0, 0, 0.08);
  font-weight: 700;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
.neon-btn-cyan:hover {
  background: linear-gradient(135deg, #22d3ee 0%, #06b6d4 100%);
  box-shadow: 0 0 22px rgba(6, 182, 212, 0.65), 0 4px 8px rgba(0, 0, 0, 0.12);
  transform: translateY(-1px);
}
.neon-btn-cyan:active {
  transform: scale(0.97);
}

/* Neon Blue Manual Sync Button with Pulse and Glow */
@keyframes neon-sync-pulse {
  0%, 100% {
    box-shadow: 0 0 14px rgba(6, 182, 212, 0.45), inset 0 0 8px rgba(6, 182, 212, 0.12);
    border-color: #22d3ee;
  }
  50% {
    box-shadow: 0 0 24px rgba(6, 182, 212, 0.85), 0 0 35px rgba(6, 182, 212, 0.35), inset 0 0 14px rgba(6, 182, 212, 0.22);
    border-color: #06b6d4;
  }
}

.neon-btn-sync {
  background: rgba(6, 182, 212, 0.08);
  color: #0891b2;
  border: 2px solid #22d3ee;
  box-shadow: 0 0 16px rgba(6, 182, 212, 0.45), inset 0 0 10px rgba(6, 182, 212, 0.12);
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}
.dark .neon-btn-sync {
  background: rgba(6, 182, 212, 0.16);
  color: #67e8f9;
  border: 2px solid #38bdf8;
  box-shadow: 0 0 20px rgba(6, 182, 212, 0.6), inset 0 0 12px rgba(6, 182, 212, 0.2);
}
.neon-pulse-sync {
  animation: neon-sync-pulse 2.2s ease-in-out infinite;
}
.neon-btn-sync:hover {
  background: rgba(6, 182, 212, 0.22);
  border-color: #06b6d4;
  box-shadow: 0 0 28px rgba(6, 182, 212, 0.85), 0 0 45px rgba(6, 182, 212, 0.4), inset 0 0 14px rgba(6, 182, 212, 0.3);
  transform: translateY(-1px);
}
.neon-btn-sync:active {
  transform: scale(0.96);
}

/* Neon Rose / Danger Buttons */
.neon-btn-rose {
  background: linear-gradient(135deg, #f43f5e 0%, #e11d48 100%);
  color: #ffffff;
  border: 1px solid rgba(251, 113, 133, 0.6);
  box-shadow: 0 0 14px rgba(244, 63, 94, 0.4), 0 2px 4px rgba(0, 0, 0, 0.08);
  font-weight: 700;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
.neon-btn-rose:hover {
  background: linear-gradient(135deg, #fb7185 0%, #f43f5e 100%);
  box-shadow: 0 0 22px rgba(244, 63, 94, 0.65), 0 4px 8px rgba(0, 0, 0, 0.12);
  transform: translateY(-1px);
}
.neon-btn-rose:active {
  transform: scale(0.97);
}

/* Neon Amber / Warning Buttons */
.neon-btn-amber {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: #ffffff;
  border: 1px solid rgba(252, 211, 77, 0.6);
  box-shadow: 0 0 14px rgba(245, 158, 11, 0.4), 0 2px 4px rgba(0, 0, 0, 0.08);
  font-weight: 700;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
.neon-btn-amber:hover {
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  box-shadow: 0 0 22px rgba(245, 158, 11, 0.65), 0 4px 8px rgba(0, 0, 0, 0.12);
  transform: translateY(-1px);
}
.neon-btn-amber:active {
  transform: scale(0.97);
}

/* ============================================================
   HOLLOW NEON CHART BAR BORDER UTILITIES (EMPTY FILLS)
   ============================================================ */

.neon-chart-bar-expense {
  background-color: transparent !important;
  border: 2px solid #ef4444 !important;
  box-shadow: 0 0 8px rgba(239, 68, 68, 0.45);
}

.neon-chart-bar-interest {
  background-color: transparent !important;
  border: 2px solid #facc15 !important;
  box-shadow: 0 0 8px rgba(250, 204, 21, 0.45);
}

.neon-chart-bar-payment {
  background-color: transparent !important;
  border: 2px solid #34d399 !important;
  box-shadow: 0 0 8px rgba(52, 211, 153, 0.45);
}
```

---

## 2. `src/components/common/Header.tsx`
```tsx
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
          aria-label="Force immediate manual sync with Google Drive"
          title={
            isSyncing
              ? 'Synchronizing cards & transactions with Google Drive...'
              : hasGoogleUser
              ? 'Click to force an immediate read/write sync with CrediTrack_Card_Manager in Google Drive'
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
```

---

## 3. `src/utils/googleDriveSync.ts` (Forced Manual Sync & Auto-Load Logic)
```ts
import { CardProfile, Transaction } from '../types';
import { parseTxDate, normalizeTransactionType, getMonthLabel, formatDateForSheet } from './formatters';
import { recalculateBalances } from '../data/initialData';

export interface GoogleSpreadsheetInfo {
  spreadsheetId: string;
  webViewLink: string;
  title: string;
  lastSyncedAt?: number;
  lastSyncStatus?: 'idle' | 'syncing' | 'success' | 'error';
  lastError?: string;
  syncedTabs?: string[];
}

export const SPREADSHEET_NAME = 'CrediTrack_Card_Manager';
export const CONFIG_TAB_TITLE = '_CONFIG_';

export const STANDARD_HEADERS = [
  'Month',
  'Date',
  'Type',
  'Amount',
  'Balance',
  'Description',
];

export const CONFIG_HEADERS = [
  'ID',
  'Name',
  'BankName',
  'CardMask',
  'ThemeColor',
  'CreditLimit',
  'BillingDay',
  'TabTitle',
  'CreatedAt',
];

export function getCardTabTitle(card: CardProfile): string {
  const base = card.name || card.bankName || 'CARD';
  let sanitized = base
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');

  if (!sanitized) {
    sanitized = `CARD_${card.id.replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase()}`;
  }
  return sanitized.slice(0, 50);
}

export async function checkSpreadsheetExists(
  accessToken: string
): Promise<{ exists: boolean; file?: { id: string; name: string; webViewLink: string } }> {
  if (!accessToken) return { exists: false };

  const query = encodeURIComponent(
    `name = '${SPREADSHEET_NAME}' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false`
  );
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,webViewLink)&pageSize=1`;

  const searchRes = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!searchRes.ok) {
    const errorData = await searchRes.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || `Google Drive query failed (${searchRes.status})`);
  }

  const searchData = await searchRes.json();
  if (searchData.files && searchData.files.length > 0) {
    const existing = searchData.files[0];
    return {
      exists: true,
      file: {
        id: existing.id,
        name: existing.name,
        webViewLink: existing.webViewLink || `https://docs.google.com/spreadsheets/d/${existing.id}/edit`,
      },
    };
  }
  return { exists: false };
}

/**
 * FORCED IMMEDIATE MANUAL SYNCHRONIZATION:
 * Explicitly queries Google Drive for "CrediTrack_Card_Manager".
 * Reads all remote sheet tabs and configurations, merges card profiles and logged transactions,
 * sorts all transactions chronologically by date, recalculates running balances,
 * and writes/syncs all current card contexts and transaction history directly to Google Drive.
 */
export async function performFullManualSync(
  accessToken: string,
  currentCards: CardProfile[],
  currentTransactions: Record<string, Transaction[]>
): Promise<{
  success: boolean;
  cards: CardProfile[];
  transactionsByCard: Record<string, Transaction[]>;
  spreadsheetInfo: GoogleSpreadsheetInfo;
  error?: string;
}> {
  if (!accessToken) {
    throw new Error('Google OAuth access token is required for manual synchronization.');
  }

  const search = await checkSpreadsheetExists(accessToken);

  if (!search.exists || !search.file) {
    const createdInfo = await createTrackingSpreadsheet(accessToken, currentCards, currentTransactions);
    return {
      success: true,
      cards: currentCards,
      transactionsByCard: currentTransactions,
      spreadsheetInfo: createdInfo,
    };
  }

  const sheetId = search.file.id;
  const webViewLink =
    search.file.webViewLink || `https://docs.google.com/spreadsheets/d/${sheetId}/edit`;

  const remoteData = await loadDataFromGoogleSpreadsheet(accessToken, sheetId);

  const cardMap = new Map<string, CardProfile>();
  remoteData.cards.forEach((rc) => {
    cardMap.set(rc.id, rc);
  });
  currentCards.forEach((cc) => {
    cardMap.set(cc.id, {
      ...(cardMap.get(cc.id) || {}),
      ...cc,
    });
  });
  const mergedCards = Array.from(cardMap.values());

  const mergedTxsByCard: Record<string, Transaction[]> = {};
  for (const card of mergedCards) {
    const localTxs = currentTransactions[card.id] || [];
    const remoteTxs = remoteData.transactionsByCard[card.id] || [];

    const txMap = new Map<string, Transaction>();
    const seenSignatures = new Set<string>();

    const addTx = (tx: Transaction) => {
      const sig = `${tx.date}_${tx.type}_${tx.amount}_${(tx.description || '').trim()}`;
      if (!seenSignatures.has(sig)) {
        seenSignatures.add(sig);
        txMap.set(tx.id, tx);
      }
    };

    remoteTxs.forEach(addTx);
    localTxs.forEach(addTx);

    const sorted = Array.from(txMap.values()).sort((a, b) => {
      const timeA = parseTxDate(a.date, a.createdAt);
      const timeB = parseTxDate(b.date, b.createdAt);
      if (timeA !== timeB) return timeA - timeB;
      return (a.createdAt || 0) - (b.createdAt || 0);
    });

    mergedTxsByCard[card.id] = recalculateBalances(sorted);
  }

  await syncAllCardsToGoogleSheet(accessToken, sheetId, mergedCards, mergedTxsByCard);

  const updatedSpreadsheetInfo: GoogleSpreadsheetInfo = {
    spreadsheetId: sheetId,
    webViewLink,
    title: search.file.name || SPREADSHEET_NAME,
    lastSyncedAt: Date.now(),
    lastSyncStatus: 'success',
    syncedTabs: mergedCards.map(getCardTabTitle),
  };

  return {
    success: true,
    cards: mergedCards,
    transactionsByCard: mergedTxsByCard,
    spreadsheetInfo: updatedSpreadsheetInfo,
  };
}
```

---

## 4. `src/App.tsx` (Auto-load, Forced Manual Sync & Background Mutations)
```tsx
import React, { useState, useEffect, useCallback } from 'react';
import { CardProfile, Transaction, SecurityConfig } from './types';
import { 
  INITIAL_CARDS, 
  INITIAL_COMMERCIAL_TRANSACTIONS, 
  INITIAL_SAMPATH_TRANSACTIONS, 
  recalculateBalances 
} from './data/initialData';
import { Header } from './components/common/Header';
import { BottomNav } from './components/common/BottomNav';
import { PinScreen } from './components/security/PinScreen';
import { Dashboard } from './components/dashboard/Dashboard';
import { CardDetailView } from './components/tracker/CardDetailView';
import { SheetsOnboardingGuide } from './components/sheets/SheetsOnboardingGuide';
import { SettingsModal } from './components/settings/SettingsModal';
import { GoogleOAuthConsentModal } from './components/common/GoogleOAuthConsentModal';
import { 
  initAuth, 
  googleSignIn, 
  googleSignOut, 
  getAccessToken 
} from './utils/googleAuth';
import { 
  checkSpreadsheetExists,
  loadDataFromGoogleSpreadsheet,
  createTrackingSpreadsheet,
  syncSingleCardTabToGoogleSheet,
  syncAllCardsToGoogleSheet,
  saveCardMetadataToGoogleSheet,
  ensureCardTabExists,
  deleteCardTabFromGoogleSheet,
  renameCardTabInGoogleSheet,
  getCardTabTitle,
  performFullManualSync,
  SPREADSHEET_NAME,
  GoogleSpreadsheetInfo 
} from './utils/googleDriveSync';

export function App() {
  // ... state declarations ...
  const [cards, setCards] = useState<CardProfile[]>(() => loadUserCards(null));
  const [transactionsByCard, setTransactionsByCard] = useState<Record<string, Transaction[]>>(() => loadUserTransactions(null));
  const [spreadsheetInfo, setSpreadsheetInfo] = useState<GoogleSpreadsheetInfo | null>(() => loadUserSheetInfo(null));
  const [googleUser, setGoogleUser] = useState<GoogleUserInfo | null>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [isSyncingGoogle, setIsSyncingGoogle] = useState(false);

  // AUTO-LOAD OR INITIALIZE GOOGLE DRIVE DATA UPON GMAIL LOGIN
  const handleAutoLoadOrInitDrive = useCallback(
    async (token: string, uid?: string | null) => {
      setIsConnectingGoogle(true);
      setIsSyncingGoogle(true);
      try {
        const search = await checkSpreadsheetExists(token);
        if (search.exists && search.file) {
          const loaded = await loadDataFromGoogleSpreadsheet(token, search.file.id);
          if (loaded.cards && loaded.cards.length > 0) {
            setCards(loaded.cards);
            setTransactionsByCard(loaded.transactionsByCard);
            setSpreadsheetInfo({
              spreadsheetId: search.file.id,
              webViewLink: search.file.webViewLink,
              title: search.file.name || SPREADSHEET_NAME,
              lastSyncedAt: Date.now(),
              lastSyncStatus: 'success',
              syncedTabs: loaded.cards.map(getCardTabTitle),
            });
            return;
          }
        }
        const userCards = loadUserCards(uid);
        const userTxs = loadUserTransactions(uid);
        setCards(userCards);
        setTransactionsByCard(userTxs);
        const created = await createTrackingSpreadsheet(token, userCards, userTxs);
        setSpreadsheetInfo(created);
      } catch (err: any) {
        console.error('Google Drive auto-load failed:', err);
      } finally {
        setIsConnectingGoogle(false);
        setIsSyncingGoogle(false);
      }
    },
    []
  );

  // FORCED IMMEDIATE MANUAL SYNCHRONIZATION WITH GOOGLE DRIVE
  const handleManualSyncNow = async () => {
    let token = googleToken;
    if (!token) {
      try {
        token = await getAccessToken();
      } catch (e) {
        console.warn('Could not retrieve existing token:', e);
      }
    }

    if (!token) {
      handleRequestSignInGoogle();
      return;
    }

    setIsSyncingGoogle(true);
    try {
      const syncResult = await performFullManualSync(token, cards, transactionsByCard);
      if (syncResult.success) {
        setCards(syncResult.cards);
        setTransactionsByCard(syncResult.transactionsByCard);
        setSpreadsheetInfo(syncResult.spreadsheetInfo);
      }
    } catch (err: any) {
      console.error('Manual synchronization failed:', err);
    } finally {
      setIsSyncingGoogle(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      <Header
        onLockApp={handleManualLock}
        onOpenGuide={() => setIsGuideOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onNavigateHome={() => setSelectedCardId(null)}
        activeView={activeViewName}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onManualSync={handleManualSyncNow}
        isSyncing={isSyncingGoogle}
        hasGoogleUser={Boolean(googleUser)}
        lastSyncedAt={spreadsheetInfo?.lastSyncedAt}
      />
      {/* ... Dashboard / CardDetailView ... */}
    </div>
  );
}
```

---

## 5. `src/components/dashboard/NeonChart.tsx` (Hollow Neon Chart Bars)
```tsx
import React, { useState, useMemo } from 'react';
import { BarChart3, AlignLeft, LayoutGrid, Calendar } from 'lucide-react';
import { CardProfile, Transaction } from '../../types';
import { COMMERCIAL_BANK_MONTHLY_HISTORY } from '../../data/initialData';
import { formatCurrency, getMonthLabel } from '../../utils/formatters';

export const NeonChart: React.FC<NeonChartProps> = ({ cards, transactionsByCard }) => {
  // ... metrics calculation ...

  return (
    <div className="p-5 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-[0_4px_24px_rgba(16,185,129,0.06)] dark:shadow-2xl relative overflow-hidden transition-colors">
      {/* Legend Styled as Hollow Neon Outlines */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
          <span className="w-3.5 h-3.5 rounded-sm bg-transparent border-2 border-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
          <span>Expense</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
          <span className="w-3.5 h-3.5 rounded-sm bg-transparent border-2 border-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.5)]" />
          <span>Interest</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
          <span className="w-3.5 h-3.5 rounded-sm bg-transparent border-2 border-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
          <span>Payment</span>
        </div>
      </div>

      {/* Hollow Neon Bars with empty transparent fills */}
      {/* Expense Bar */}
      <div
        style={{ width: `${expensePct}%` }}
        className="h-full bg-transparent border-2 border-red-500 dark:border-red-400 shadow-[0_0_8px_rgba(239,68,68,0.45)] rounded-lg transition-all duration-500"
      />
      {/* Interest Bar */}
      <div
        style={{ width: `${interestPct}%` }}
        className="h-full bg-transparent border-2 border-yellow-400 dark:border-yellow-300 shadow-[0_0_8px_rgba(250,204,21,0.45)] rounded-lg transition-all duration-500"
      />
      {/* Payment Bar */}
      <div
        style={{ width: `${paymentPct}%` }}
        className="h-full bg-transparent border-2 border-emerald-400 dark:border-emerald-300 shadow-[0_0_8px_rgba(52,211,153,0.45)] rounded-lg transition-all duration-500"
      />
    </div>
  );
};
```
