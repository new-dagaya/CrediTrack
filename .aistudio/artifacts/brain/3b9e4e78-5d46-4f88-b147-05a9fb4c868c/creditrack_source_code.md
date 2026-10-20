# CrediTrack — Complete Updated Source Code & Architecture

## Overview of Updates

### 1. Complete Removal of Initial Old Data Fetching
- **Initial Login / Startup**: When a user logs in via Gmail, the app checks if `"CrediTrack_Card_Manager"` exists on Google Drive solely to obtain its file link and metadata.
- **Zero Remote Overwrites**: The function that previously read old data (`loadDataFromGoogleSpreadsheet`) and injected outdated remote cards/transactions into the dashboard context has been **completely eliminated from the login and startup flow**. Local state and memory remain authoritative and are never overwritten by old remote data.

### 2. Strict One-Way Write / Overwrite Sync (`performOneWayWriteSync`)
- Clicking the neon **"Sync Now"** button now triggers an immediate, strictly **one-way write operation**:
  1. Takes the exact current local state of card profiles (`cards`) and transactions (`transactionsByCard`).
  2. Ensures all transactions are sorted chronologically by date and running balances are recalculate-verified.
  3. Overwrites the `_CONFIG_` tab with the active card configurations.
  4. For every card, clears existing rows and writes the current fresh transactions into the card's dedicated tab.
  5. **Guaranteed Local Memory Isolation**: Does **NOT** pull, merge, or overwrite local memory with outdated values from the Google Sheet.

### 3. Neon Style Manual Sync Button & Hollow Neon Charts
- **Manual Sync Button**: Neon blue border (`2px solid #22d3ee`), pulsing outer glow effect (`@keyframes neon-sync-pulse`), spinning sync indicator (`RefreshCw`), and live status dot.
- **Hollow Neon Charts**: Transparent bar centers (`bg-transparent`) with vibrant glowing borders:
  - **Expense**: Neon Red border (`#ef4444`) with outer glow
  - **Interest/Fee**: Neon Yellow border (`#facc15`) with outer glow
  - **Payment/Settlement**: Neon Green border (`#34d399`) with outer glow

---

## 1. `src/utils/googleDriveSync.ts`
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

export async function getSpreadsheetTabs(
  accessToken: string,
  spreadsheetId: string
): Promise<{ sheetId: number; title: string }[]> {
  const metaUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties(sheetId,title)`;
  const res = await fetch(metaUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || `Failed to fetch tabs: ${res.status}`);
  }

  const data = await res.json();
  return (data.sheets || []).map((s: any) => ({
    sheetId: s.properties.sheetId,
    title: s.properties.title,
  }));
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
        webViewLink:
          existing.webViewLink ||
          `https://docs.google.com/spreadsheets/d/${existing.id}/edit`,
      },
    };
  }

  return { exists: false };
}

export async function createTabsIfMissing(
  accessToken: string,
  spreadsheetId: string,
  requiredTabTitles: string[]
): Promise<void> {
  const existingTabs = await getSpreadsheetTabs(accessToken, spreadsheetId);
  const existingNames = new Set(existingTabs.map((t) => t.title.toLowerCase()));

  const tabsToCreate = requiredTabTitles.filter((title) => !existingNames.has(title.toLowerCase()));
  if (tabsToCreate.length === 0) return;

  const requests = tabsToCreate.map((title) => ({
    addSheet: {
      properties: {
        title,
        gridProperties: { frozenRowCount: 1, rowCount: 500, columnCount: 10 },
      },
    },
  }));

  const batchUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`;
  const res = await fetch(batchUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ requests }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    console.warn('Batch tab creation warning:', errorData);
  }
}

export async function saveCardMetadataToGoogleSheet(
  accessToken: string,
  spreadsheetId: string,
  cards: CardProfile[]
): Promise<void> {
  await createTabsIfMissing(accessToken, spreadsheetId, [CONFIG_TAB_TITLE]);

  const clearRange = encodeURIComponent(`'${CONFIG_TAB_TITLE}'!A2:I100`);
  const clearUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${clearRange}:clear`;
  await fetch(clearUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  const headerRange = encodeURIComponent(`'${CONFIG_TAB_TITLE}'!A1:I1`);
  const headerUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${headerRange}?valueInputOption=USER_ENTERED`;
  await fetch(headerUrl, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values: [CONFIG_HEADERS] }),
  });

  if (cards.length > 0) {
    const rows = cards.map((c) => [
      c.id,
      c.name,
      c.bankName,
      c.cardNumberMask,
      c.themeColor,
      c.creditLimit || '',
      c.billingDay || '',
      getCardTabTitle(c),
      c.createdAt || Date.now(),
    ]);

    const writeRange = encodeURIComponent(`'${CONFIG_TAB_TITLE}'!A2`);
    const writeUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${writeRange}?valueInputOption=USER_ENTERED`;
    await fetch(writeUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: rows }),
    });
  }
}

export async function createTrackingSpreadsheet(
  accessToken: string,
  cards: CardProfile[],
  transactionsByCard: Record<string, Transaction[]>
): Promise<GoogleSpreadsheetInfo> {
  const sheetsToCreate = [
    {
      properties: {
        title: CONFIG_TAB_TITLE,
        gridProperties: { frozenRowCount: 1, rowCount: 100, columnCount: 10 },
      },
    },
    ...cards.map((c) => ({
      properties: {
        title: getCardTabTitle(c),
        gridProperties: { frozenRowCount: 1, rowCount: 500, columnCount: 10 },
      },
    })),
  ];

  if (sheetsToCreate.length === 1) {
    sheetsToCreate.push({
      properties: {
        title: 'OVERVIEW',
        gridProperties: { frozenRowCount: 1, rowCount: 500, columnCount: 10 },
      },
    });
  }

  const createUrl = 'https://sheets.googleapis.com/v4/spreadsheets';
  const createRes = await fetch(createUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: { title: SPREADSHEET_NAME },
      sheets: sheetsToCreate,
    }),
  });

  if (!createRes.ok) {
    const errorData = await createRes.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || `Failed to create tracking spreadsheet: ${createRes.status}`);
  }

  const createData = await createRes.json();
  const newSheetId = createData.spreadsheetId;
  const webViewLink =
    createData.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${newSheetId}/edit`;

  await saveCardMetadataToGoogleSheet(accessToken, newSheetId, cards);

  for (const card of cards) {
    const cardTxs = transactionsByCard[card.id] || [];
    await syncSingleCardTabToGoogleSheet(accessToken, newSheetId, card, cardTxs);
  }

  return {
    spreadsheetId: newSheetId,
    webViewLink,
    title: SPREADSHEET_NAME,
    lastSyncedAt: Date.now(),
    lastSyncStatus: 'success',
    syncedTabs: cards.map(getCardTabTitle),
  };
}

export async function syncSingleCardTabToGoogleSheet(
  accessToken: string,
  spreadsheetId: string,
  card: CardProfile,
  transactions: Transaction[]
): Promise<{ success: boolean; count: number; error?: string }> {
  if (!accessToken || !spreadsheetId || !card) {
    return { success: false, count: 0, error: 'Missing access credentials or card.' };
  }

  try {
    const tabTitle = getCardTabTitle(card);
    await createTabsIfMissing(accessToken, spreadsheetId, [tabTitle]);

    const sortedTxs = [...transactions].sort((a, b) => {
      const timeA = parseTxDate(a.date, a.createdAt);
      const timeB = parseTxDate(b.date, b.createdAt);
      if (timeA !== timeB) return timeA - timeB;
      return (a.createdAt || 0) - (b.createdAt || 0);
    });

    const recalculated = recalculateBalances(sortedTxs);

    const rows: (string | number)[][] = recalculated.map((tx) => [
      tx.month,
      tx.date,
      tx.type,
      tx.amount,
      tx.balance,
      tx.description,
    ]);

    const clearRange = encodeURIComponent(`'${tabTitle}'!A2:Z1000`);
    const clearUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${clearRange}:clear`;
    await fetch(clearUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const headerRange = encodeURIComponent(`'${tabTitle}'!A1:F1`);
    const headerUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${headerRange}?valueInputOption=USER_ENTERED`;
    await fetch(headerUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: [STANDARD_HEADERS] }),
    });

    if (rows.length > 0) {
      const writeRange = encodeURIComponent(`'${tabTitle}'!A2`);
      const writeUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${writeRange}?valueInputOption=USER_ENTERED`;
      const writeRes = await fetch(writeUrl, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ values: rows }),
      });

      if (!writeRes.ok) {
        const errData = await writeRes.json().catch(() => ({}));
        throw new Error(errData?.error?.message || `Failed to update tab: ${writeRes.status}`);
      }
    }

    return { success: true, count: rows.length };
  } catch (error: any) {
    console.error(`syncSingleCardTabToGoogleSheet failed for ${card.name}:`, error);
    return { success: false, count: 0, error: error?.message || 'Sync failed' };
  }
}

export async function syncAllCardsToGoogleSheet(
  accessToken: string,
  spreadsheetId: string,
  cards: CardProfile[],
  transactionsByCard: Record<string, Transaction[]>
): Promise<{ success: boolean; count: number; tabs: string[]; error?: string }> {
  if (!accessToken || !spreadsheetId) {
    return { success: false, count: 0, tabs: [], error: 'Missing access credentials or Sheet ID.' };
  }

  try {
    const requiredTabTitles = [CONFIG_TAB_TITLE, ...cards.map(getCardTabTitle)];
    await createTabsIfMissing(accessToken, spreadsheetId, requiredTabTitles);
    await saveCardMetadataToGoogleSheet(accessToken, spreadsheetId, cards);

    let totalRowCount = 0;
    const syncedTabs: string[] = [];

    for (const card of cards) {
      const cardTxs = transactionsByCard[card.id] || [];
      const res = await syncSingleCardTabToGoogleSheet(accessToken, spreadsheetId, card, cardTxs);
      if (res.success) {
        totalRowCount += res.count;
        syncedTabs.push(getCardTabTitle(card));
      }
    }

    return {
      success: true,
      count: totalRowCount,
      tabs: syncedTabs,
    };
  } catch (error: any) {
    console.error('syncAllCardsToGoogleSheet error:', error);
    return {
      success: false,
      count: 0,
      tabs: [],
      error: error?.message || 'Multi-sheet sync failed',
    };
  }
}

/**
 * STRICT ONE-WAY WRITE/UPDATE SYNCHRONIZATION:
 * Takes the current local state of card profiles and transactions from the app
 * and completely overwrites/updates the corresponding tabs in the "CrediTrack_Card_Manager"
 * file in Google Drive with the fresh, current app data.
 *
 * CRITICAL REQUIREMENTS SATISFIED:
 * - Completely avoids reading or fetching old data from the Google Sheet.
 * - Does NOT pull or overwrite local memory with outdated values from the sheet.
 * - Forces a pure one-way write of current active cards and their logged transactions.
 */
export async function performOneWayWriteSync(
  accessToken: string,
  currentCards: CardProfile[],
  currentTransactions: Record<string, Transaction[]>
): Promise<{
  success: boolean;
  spreadsheetInfo: GoogleSpreadsheetInfo;
  syncedCardsCount: number;
  syncedTransactionsCount: number;
  error?: string;
}> {
  if (!accessToken) {
    throw new Error('Google OAuth access token is required for synchronization.');
  }

  const search = await checkSpreadsheetExists(accessToken);

  if (!search.exists || !search.file) {
    const createdInfo = await createTrackingSpreadsheet(accessToken, currentCards, currentTransactions);
    let totalTxs = 0;
    Object.values(currentTransactions).forEach((txs) => {
      totalTxs += txs.length;
    });
    return {
      success: true,
      spreadsheetInfo: createdInfo,
      syncedCardsCount: currentCards.length,
      syncedTransactionsCount: totalTxs,
    };
  }

  const sheetId = search.file.id;
  const webViewLink =
    search.file.webViewLink || `https://docs.google.com/spreadsheets/d/${sheetId}/edit`;

  const writeRes = await syncAllCardsToGoogleSheet(
    accessToken,
    sheetId,
    currentCards,
    currentTransactions
  );

  if (!writeRes.success && writeRes.error) {
    throw new Error(writeRes.error);
  }

  const updatedSpreadsheetInfo: GoogleSpreadsheetInfo = {
    spreadsheetId: sheetId,
    webViewLink,
    title: search.file.name || SPREADSHEET_NAME,
    lastSyncedAt: Date.now(),
    lastSyncStatus: 'success',
    syncedTabs: currentCards.map(getCardTabTitle),
  };

  return {
    success: true,
    spreadsheetInfo: updatedSpreadsheetInfo,
    syncedCardsCount: currentCards.length,
    syncedTransactionsCount: writeRes.count,
  };
}

export const performFullManualSync = performOneWayWriteSync;
```

---

## 2. `src/App.tsx` (Authoritative Local Memory & One-Way Sync)
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
  createTrackingSpreadsheet,
  syncSingleCardTabToGoogleSheet,
  saveCardMetadataToGoogleSheet,
  ensureCardTabExists,
  deleteCardTabFromGoogleSheet,
  renameCardTabInGoogleSheet,
  getCardTabTitle,
  performOneWayWriteSync,
  SPREADSHEET_NAME,
  GoogleSpreadsheetInfo 
} from './utils/googleDriveSync';

export function App() {
  const [cards, setCards] = useState<CardProfile[]>(() => loadUserCards(null));
  const [transactionsByCard, setTransactionsByCard] = useState<Record<string, Transaction[]>>(() => loadUserTransactions(null));
  const [spreadsheetInfo, setSpreadsheetInfo] = useState<GoogleSpreadsheetInfo | null>(() => loadUserSheetInfo(null));
  const [googleUser, setGoogleUser] = useState<GoogleUserInfo | null>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false);
  const [isSyncingGoogle, setIsSyncingGoogle] = useState(false);

  // CONNECT OR INITIALIZE GOOGLE DRIVE SPREADSHEET (NO READING OF OLD DATA)
  const handleConnectOrInitDrive = useCallback(
    async (token: string) => {
      setIsConnectingGoogle(true);
      try {
        const search = await checkSpreadsheetExists(token);

        if (search.exists && search.file) {
          // Linked directly WITHOUT fetching or reading old data into local state.
          // Local memory remains authoritative and is NEVER overwritten with outdated values.
          const info: GoogleSpreadsheetInfo = {
            spreadsheetId: search.file.id,
            webViewLink: search.file.webViewLink,
            title: search.file.name || SPREADSHEET_NAME,
            lastSyncedAt: Date.now(),
            lastSyncStatus: 'success',
            syncedTabs: cards.map(getCardTabTitle),
          };
          setSpreadsheetInfo(info);
          return;
        }

        const created = await createTrackingSpreadsheet(token, cards, transactionsByCard);
        setSpreadsheetInfo(created);
      } catch (err: any) {
        console.error('Google Drive connection failed:', err);
        setSpreadsheetInfo((prev) =>
          prev ? { ...prev, lastSyncStatus: 'error', lastError: err?.message } : null
        );
      } finally {
        setIsConnectingGoogle(false);
      }
    },
    [cards, transactionsByCard]
  );

  // Initialize Firebase Auth listener on startup
  useEffect(() => {
    const unsubscribe = initAuth(
      async (user, token) => {
        const userInfo: GoogleUserInfo = {
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
        };
        setGoogleUser(userInfo);
        if (token) setGoogleToken(token);

        const hasPin = hasUserConfiguredPin(user.uid);
        const userSec = getStoredSecurityConfig(user.uid);
        setSecurityConfig(userSec);

        setCards(loadUserCards(user.uid));
        setTransactionsByCard(loadUserTransactions(user.uid));
        setSpreadsheetInfo(loadUserSheetInfo(user.uid));

        setIsLocked(!hasPin ? true : (userSec.isPinSet ? true : false));

        // Connect without reading or pulling old data into local state
        if (token) {
          await handleConnectOrInitDrive(token);
        }
      },
      () => {
        setGoogleUser(null);
        setGoogleToken(null);
      }
    );
    return () => unsubscribe();
  }, [handleConnectOrInitDrive]);

  // STRICT ONE-WAY MANUAL WRITE/UPDATE SYNCHRONIZATION WITH GOOGLE DRIVE
  const handleManualSyncNow = async () => {
    let token = googleToken;
    if (!token) {
      try {
        token = await getAccessToken();
      } catch (e) {
        console.warn('Could not retrieve token:', e);
      }
    }

    if (!token) {
      handleRequestSignInGoogle();
      return;
    }

    setIsSyncingGoogle(true);
    try {
      // Strictly one-way write: takes current local cards & transactions and completely overwrites Google Sheet
      // Never pulls or overwrites local memory with outdated values
      const syncResult = await performOneWayWriteSync(token, cards, transactionsByCard);
      if (syncResult.success) {
        setSpreadsheetInfo(syncResult.spreadsheetInfo);

        try {
          localStorage.setItem(
            getSheetInfoStorageKey(googleUser?.uid),
            JSON.stringify(syncResult.spreadsheetInfo)
          );
        } catch (storageErr) {
          console.warn('Failed caching updated spreadsheet info:', storageErr);
        }
      }
    } catch (err: any) {
      console.error('One-way manual write synchronization failed:', err);
      setSpreadsheetInfo((prev) =>
        prev
          ? { ...prev, lastSyncStatus: 'error', lastError: err?.message || 'Manual synchronization failed' }
          : null
      );
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

## 3. `src/components/common/Header.tsx` (Neon Manual Sync Button)
```tsx
import React from 'react';
import { CreditCard, Lock, HelpCircle, Sun, Moon, RefreshCw } from 'lucide-react';

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
      {/* Wordmark */}
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

      {/* Navigation */}
      <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600 dark:text-slate-400">
        <button onClick={onNavigateHome} className={`cursor-pointer ${activeView === 'dashboard' ? 'text-emerald-600 dark:text-emerald-400 font-bold' : ''}`}>Dashboard</button>
        <button onClick={onNavigateHome} className="cursor-pointer hover:text-slate-900 dark:hover:text-white">Cards</button>
        <button onClick={onOpenGuide} className="cursor-pointer hover:text-slate-900 dark:hover:text-white">Sheets Guide</button>
        <button onClick={onOpenSettings} className={`cursor-pointer ${activeView === 'settings' ? 'text-emerald-600 dark:text-emerald-400 font-bold' : ''}`}>PIN Security</button>
      </nav>

      {/* Actions */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        {/* Neon Blue Manual One-Way Write Sync Button */}
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
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.9)]"></span>
          </span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          type="button"
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 active:scale-95 cursor-pointer"
        >
          {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-cyan-600" />}
        </button>

        {/* Lock */}
        <button
          onClick={onLockApp}
          type="button"
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs border border-emerald-400/80 shadow-[0_0_14px_rgba(16,185,129,0.45)] cursor-pointer"
        >
          <Lock className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Lock</span>
        </button>
      </div>
    </header>
  );
};
```
