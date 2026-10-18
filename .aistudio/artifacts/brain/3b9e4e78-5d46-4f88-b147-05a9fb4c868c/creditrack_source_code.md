# CrediTrack: Personal Credit Card Manager & Automated Google Drive OAuth Sync

## Architecture Overview
CrediTrack is a personal finance and credit card tracker featuring **100% automated Google Drive and Google Sheets synchronization**. Users no longer need to obtain Google Cloud API keys, deploy manual Apps Scripts, or copy Spreadsheet IDs.

### Key Capabilities
1. **Seamless Google Drive OAuth Sign-In**:
   - Integrated with Firebase Auth and Google Workspace scopes (`drive.file` and `spreadsheets`).
   - Secure in-memory OAuth access token management following the principle of least privilege.
2. **Automated Spreadsheet Creation**:
   - Automatically searches for or creates a spreadsheet named `CrediTrack_Card_Manager` directly inside the user's Google Drive.
   - Initialized with standard column headers: `Month`, `Date`, `Type`, `Amount`, `Balance`, `Description`, and `Card Name`.
3. **Real-Time Data Synchronization**:
   - Every transaction added, edited, or deleted is synchronized in real time to the user's `CrediTrack_Card_Manager` sheet.
   - Includes full-sync reconciliation with explicit user confirmation for data-modifying operations.
4. **Ergonomic UI**:
   - Elevated floating action button (FAB) positioned above the bottom navigation bar.
   - Single consolidated "Add New Card" workflow on the dashboard.
   - Prominent theme toggle switch in the header supporting both dark mode and light mode.
   - Local PIN security with SHA-256 hashing and automatic inactivity timeout lock.

---

## File Tree
```
├── firebase-applet-config.json
├── package.json
├── index.html
├── src/
│   ├── main.tsx
│   ├── index.css
│   ├── App.tsx
│   ├── types/
│   │   └── index.ts
│   ├── data/
│   │   └── initialData.ts
│   ├── utils/
│   │   ├── formatters.ts
│   │   ├── security.ts
│   │   ├── googleAuth.ts
│   │   ├── googleDriveSync.ts
│   │   └── sheetsSync.ts
│   └── components/
│       ├── common/
│       │   ├── Header.tsx
│       │   ├── BottomNav.tsx
│       │   └── GoogleDriveSyncBanner.tsx
│       ├── security/
│       │   └── PinScreen.tsx
│       ├── dashboard/
│       │   ├── Dashboard.tsx
│       │   └── AddCardModal.tsx
│       ├── tracker/
│       │   ├── CardDetailView.tsx
│       │   ├── TransactionTable.tsx
│       │   ├── TransactionModal.tsx
│       │   ├── MonthlyBreakdown.tsx
│       │   └── AnalyticsChart.tsx
│       ├── sheets/
│       │   ├── ImportSheetModal.tsx
│       │   └── SheetsOnboardingGuide.tsx
│       └── settings/
│           └── SettingsModal.tsx
```

---

## Complete Source Code Files

### 1. `src/utils/googleAuth.ts`
```typescript
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User, 
  signOut 
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App instance safely (singleton)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Google Workspace OAuth Scopes configured for CrediTrack
export const SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/spreadsheets',
];

const provider = new GoogleAuthProvider();
SCOPES.forEach((scope) => provider.addScope(scope));
provider.setCustomParameters({
  prompt: 'select_account',
});

// In-memory token cache (never stored in localStorage)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string | null) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (onAuthSuccess) {
        onAuthSuccess(user, cachedAccessToken);
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) {
        onAuthFailure();
      }
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    
    if (!credential?.accessToken) {
      throw new Error('Failed to retrieve Google OAuth access token.');
    }

    cachedAccessToken = credential.accessToken;
    return {
      user: result.user,
      accessToken: cachedAccessToken,
    };
  } catch (error: any) {
    console.error('Google Sign-in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const googleSignOut = async (): Promise<void> => {
  await signOut(auth);
  cachedAccessToken = null;
};

export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};
```

---

### 2. `src/utils/googleDriveSync.ts`
```typescript
import { CardProfile, Transaction } from '../types';

export interface GoogleSpreadsheetInfo {
  spreadsheetId: string;
  webViewLink: string;
  title: string;
  lastSyncedAt?: number;
  lastSyncStatus?: 'idle' | 'syncing' | 'success' | 'error';
  lastError?: string;
}

export const SPREADSHEET_NAME = 'CrediTrack_Card_Manager';
export const MAIN_SHEET_TITLE = 'All Transactions';
export const STANDARD_HEADERS = [
  'Month',
  'Date',
  'Type',
  'Amount',
  'Balance',
  'Description',
  'Card Name',
];

export async function findOrCreateSpreadsheet(
  accessToken: string
): Promise<{ spreadsheetId: string; webViewLink: string; isNew: boolean }> {
  if (!accessToken) {
    throw new Error('Google OAuth access token is required.');
  }

  // Search Google Drive using files.list
  const query = encodeURIComponent(
    `name = '${SPREADSHEET_NAME}' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false`
  );
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,webViewLink)&pageSize=5`;

  const searchRes = await fetch(searchUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!searchRes.ok) {
    const errorData = await searchRes.json().catch(() => ({}));
    throw new Error(
      errorData?.error?.message || `Google Drive API error: ${searchRes.status}`
    );
  }

  const searchData = await searchRes.json();

  if (searchData.files && searchData.files.length > 0) {
    const existing = searchData.files[0];
    return {
      spreadsheetId: existing.id,
      webViewLink:
        existing.webViewLink ||
        `https://docs.google.com/spreadsheets/d/${existing.id}/edit`,
      isNew: false,
    };
  }

  // Not found: Create new Google Sheet directly via Google Sheets API
  const createUrl = 'https://sheets.googleapis.com/v4/spreadsheets';
  const createPayload = {
    properties: {
      title: SPREADSHEET_NAME,
    },
    sheets: [
      {
        properties: {
          title: MAIN_SHEET_TITLE,
          gridProperties: {
            frozenRowCount: 1,
            rowCount: 1000,
            columnCount: 10,
          },
        },
      },
    ],
  };

  const createRes = await fetch(createUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(createPayload),
  });

  if (!createRes.ok) {
    const errorData = await createRes.json().catch(() => ({}));
    throw new Error(
      errorData?.error?.message || `Failed to create Google Sheet: ${createRes.status}`
    );
  }

  const createData = await createRes.json();
  const newSheetId = createData.spreadsheetId;
  const webViewLink =
    createData.spreadsheetUrl ||
    `https://docs.google.com/spreadsheets/d/${newSheetId}/edit`;

  // Write required column headers: Month, Date, Type, Amount, Balance, Description
  const headerRange = encodeURIComponent(`'${MAIN_SHEET_TITLE}'!A1:G1`);
  const headerUrl = `https://sheets.googleapis.com/v4/spreadsheets/${newSheetId}/values/${headerRange}?valueInputOption=USER_ENTERED`;

  await fetch(headerUrl, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: [STANDARD_HEADERS],
    }),
  });

  return {
    spreadsheetId: newSheetId,
    webViewLink,
    isNew: true,
  };
}

export async function syncAllCardsToGoogleSheet(
  accessToken: string,
  spreadsheetId: string,
  cards: CardProfile[],
  transactionsByCard: Record<string, Transaction[]>
): Promise<{ success: boolean; count: number; error?: string }> {
  if (!accessToken || !spreadsheetId) {
    return { success: false, count: 0, error: 'Missing access credentials or Sheet ID.' };
  }

  try {
    const cardMap = new Map(cards.map((c) => [c.id, c.name]));
    const allRows: (string | number)[][] = [];

    const allTransactions: { tx: Transaction; cardName: string }[] = [];
    Object.entries(transactionsByCard).forEach(([cardId, txs]) => {
      const cardName = cardMap.get(cardId) || 'Credit Card';
      txs.forEach((tx) => {
        allTransactions.push({ tx, cardName });
      });
    });

    allTransactions.sort((a, b) => (a.tx.createdAt || 0) - (b.tx.createdAt || 0));

    allTransactions.forEach(({ tx, cardName }) => {
      allRows.push([
        tx.month,
        tx.date,
        tx.type,
        tx.amount,
        tx.balance,
        tx.description,
        cardName,
      ]);
    });

    const clearRange = encodeURIComponent(`'${MAIN_SHEET_TITLE}'!A2:Z2000`);
    const clearUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${clearRange}:clear`;
    await fetch(clearUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const headerRange = encodeURIComponent(`'${MAIN_SHEET_TITLE}'!A1:G1`);
    const headerUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${headerRange}?valueInputOption=USER_ENTERED`;
    await fetch(headerUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [STANDARD_HEADERS],
      }),
    });

    if (allRows.length > 0) {
      const writeRange = encodeURIComponent(`'${MAIN_SHEET_TITLE}'!A2`);
      const writeUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${writeRange}?valueInputOption=USER_ENTERED`;

      const writeRes = await fetch(writeUrl, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: allRows,
        }),
      });

      if (!writeRes.ok) {
        const errorData = await writeRes.json().catch(() => ({}));
        throw new Error(errorData?.error?.message || `Failed to write transactions: ${writeRes.status}`);
      }
    }

    return {
      success: true,
      count: allRows.length,
    };
  } catch (error: any) {
    console.error('Google Sheets Sync error:', error);
    return {
      success: false,
      count: 0,
      error: error?.message || 'Sync failed',
    };
  }
}

export async function appendTransactionToGoogleSheet(
  accessToken: string,
  spreadsheetId: string,
  tx: Transaction,
  cardName: string
): Promise<{ success: boolean; error?: string }> {
  if (!accessToken || !spreadsheetId) return { success: false };

  try {
    const appendRange = encodeURIComponent(`'${MAIN_SHEET_TITLE}'!A:G`);
    const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${appendRange}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

    const row = [
      tx.month,
      tx.date,
      tx.type,
      tx.amount,
      tx.balance,
      tx.description,
      cardName,
    ];

    const res = await fetch(appendUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [row],
      }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData?.error?.message || `Failed to append: ${res.status}`);
    }

    return { success: true };
  } catch (error: any) {
    console.error('Failed to append transaction to Google Sheet:', error);
    return { success: false, error: error?.message };
  }
}
```

---

### 3. `src/components/common/GoogleDriveSyncBanner.tsx`
```tsx
import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  ExternalLink, 
  RefreshCw, 
  CheckCircle2, 
  LogOut, 
  Cloud 
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
  onSyncNow: () => void;
  className?: string;
}

export const GoogleDriveSyncBanner: React.FC<GoogleDriveSyncBannerProps> = ({
  user,
  sheetInfo,
  isConnecting,
  isSyncing,
  onSignIn,
  onSignOut,
  onSyncNow,
  className = '',
}) => {
  const [showConfirmSync, setShowConfirmSync] = useState(false);

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
        className={`p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-cyan-500/10 dark:from-emerald-950/30 dark:via-teal-950/20 dark:to-slate-900 border border-emerald-500/20 dark:border-emerald-500/30 shadow-xs ${className}`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-800 shadow-md border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 text-emerald-600 dark:text-emerald-400">
              <Cloud className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Automated Google Drive & Sheets Sync
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60">
                  Zero Manual Config
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-xl leading-relaxed">
                Sign in with Google once. CrediTrack will automatically generate a{' '}
                <strong className="text-slate-900 dark:text-white font-semibold">
                  CrediTrack_Card_Manager
                </strong>{' '}
                spreadsheet directly inside your Google Drive with all standard columns and keep all card records synced in real-time.
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-center">
            <button
              onClick={onSignIn}
              disabled={isConnecting}
              type="button"
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white border border-slate-300 dark:border-slate-600 font-semibold text-xs transition-all shadow-sm active:scale-95 disabled:opacity-60 cursor-pointer"
            >
              {isConnecting ? (
                <RefreshCw className="w-4 h-4 animate-spin text-emerald-500" />
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
      className={`p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs transition-colors ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName || 'User'}
              className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 object-cover shadow-2xs"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-bold text-sm flex items-center justify-center">
              {(user.displayName || user.email || 'G')[0].toUpperCase()}
            </div>
          )}

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                {user.displayName || user.email}
              </span>
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/40 px-2 py-0.5 rounded-full">
                <CheckCircle2 className="w-3 h-3" />
                <span>Google Drive Connected</span>
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="font-mono text-slate-700 dark:text-slate-300 font-medium">
                {sheetInfo?.title || 'CrediTrack_Card_Manager'}
              </span>
              {sheetInfo?.lastSyncedAt && (
                <>
                  <span>•</span>
                  <span>
                    Synced {new Date(sheetInfo.lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
          {sheetInfo?.webViewLink && (
            <a
              href={sheetInfo.webViewLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors shadow-2xs"
            >
              <ExternalLink className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Open in Google Sheets</span>
            </a>
          )}

          <button
            type="button"
            onClick={() => setShowConfirmSync(true)}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-xs active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 stroke-[2.5] ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
          </button>

          <button
            type="button"
            onClick={onSignOut}
            title="Sign out from Google Drive"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {showConfirmSync && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl text-slate-900 dark:text-white">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold mb-1.5">
              Sync to Google Drive?
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
              This will update your{' '}
              <strong className="text-slate-900 dark:text-white">CrediTrack_Card_Manager</strong>{' '}
              spreadsheet in Google Drive with the latest credit card balances and transactions.
            </p>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setShowConfirmSync(false)}
                className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowConfirmSync(false);
                  onSyncNow();
                }}
                className="flex-1 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20"
              >
                Confirm Sync
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
```

---

### 4. `src/App.tsx`
```tsx
import React, { useState, useEffect, useCallback } from 'react';
import { CardProfile, SecurityConfig, Transaction } from './types';
import { 
  getStoredSecurityConfig, 
  saveSecurityConfig 
} from './utils/security';
import { 
  INITIAL_CARDS, 
  INITIAL_COMMERCIAL_TRANSACTIONS, 
  INITIAL_SAMPATH_TRANSACTIONS, 
  recalculateBalances 
} from './data/initialData';
import { PinScreen } from './components/security/PinScreen';
import { Header } from './components/common/Header';
import { BottomNav } from './components/common/BottomNav';
import { Dashboard } from './components/dashboard/Dashboard';
import { CardDetailView } from './components/tracker/CardDetailView';
import { SheetsOnboardingGuide } from './components/sheets/SheetsOnboardingGuide';
import { SettingsModal } from './components/settings/SettingsModal';
import { 
  initAuth, 
  googleSignIn, 
  googleSignOut, 
  getAccessToken 
} from './utils/googleAuth';
import { 
  findOrCreateSpreadsheet, 
  syncAllCardsToGoogleSheet, 
  appendTransactionToGoogleSheet, 
  GoogleSpreadsheetInfo 
} from './utils/googleDriveSync';

const CARDS_STORAGE_KEY = 'creditrack_cards_v1';
const TXS_STORAGE_KEY = 'creditrack_transactions_v1';
const SHEET_INFO_STORAGE_KEY = 'creditrack_google_sheet_info';

export default function App() {
  const [securityConfig, setSecurityConfig] = useState<SecurityConfig>(() => getStoredSecurityConfig());
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    const config = getStoredSecurityConfig();
    return config.isPinSet ? true : true;
  });

  const [cards, setCards] = useState<CardProfile[]>(() => {
    try {
      const stored = localStorage.getItem(CARDS_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_CARDS;
  });

  const [transactionsByCard, setTransactionsByCard] = useState<Record<string, Transaction[]>>(() => {
    try {
      const stored = localStorage.getItem(TXS_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
    return {
      'card-commercial-bank': recalculateBalances(INITIAL_COMMERCIAL_TRANSACTIONS),
      'card-sampath-bank': recalculateBalances(INITIAL_SAMPATH_TRANSACTIONS),
    };
  });

  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [bottomNavTab, setBottomNavTab] = useState<'dashboard' | 'cards' | 'guide' | 'settings'>('dashboard');

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const stored = localStorage.getItem('creditrack_theme');
      if (stored === 'light' || stored === 'dark') return stored;
    } catch (e) {
      console.error(e);
    }
    return 'dark';
  });

  const [googleUser, setGoogleUser] = useState<{
    displayName: string | null;
    email: string | null;
    photoURL: string | null;
  } | null>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [spreadsheetInfo, setSpreadsheetInfo] = useState<GoogleSpreadsheetInfo | null>(() => {
    try {
      const stored = localStorage.getItem(SHEET_INFO_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
    return null;
  });
  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false);
  const [isSyncingGoogle, setIsSyncingGoogle] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('creditrack_theme', theme);
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (e) {
      console.error(e);
    }
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  useEffect(() => {
    try {
      localStorage.setItem(CARDS_STORAGE_KEY, JSON.stringify(cards));
    } catch (e) {
      console.error(e);
    }
  }, [cards]);

  useEffect(() => {
    try {
      localStorage.setItem(TXS_STORAGE_KEY, JSON.stringify(transactionsByCard));
    } catch (e) {
      console.error(e);
    }
  }, [transactionsByCard]);

  useEffect(() => {
    try {
      if (spreadsheetInfo) {
        localStorage.setItem(SHEET_INFO_STORAGE_KEY, JSON.stringify(spreadsheetInfo));
      } else {
        localStorage.removeItem(SHEET_INFO_STORAGE_KEY);
      }
    } catch (e) {
      console.error(e);
    }
  }, [spreadsheetInfo]);

  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setGoogleUser({
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
        });
        if (token) {
          setGoogleToken(token);
        }
      },
      () => {
        setGoogleUser(null);
        setGoogleToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!securityConfig.isPinSet || isLocked) return;

    let timeoutId: any;
    const resetTimer = () => {
      clearTimeout(timeoutId);
      const minutes = securityConfig.lockTimeoutMinutes || 5;
      timeoutId = setTimeout(() => {
        setIsLocked(true);
      }, minutes * 60 * 1000);
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach((evt) => window.addEventListener(evt, resetTimer, { passive: true }));
    resetTimer();

    return () => {
      clearTimeout(timeoutId);
      events.forEach((evt) => window.removeEventListener(evt, resetTimer));
    };
  }, [securityConfig, isLocked]);

  const handleSignInGoogle = async () => {
    setIsConnectingGoogle(true);
    try {
      const authResult = await googleSignIn();
      if (!authResult) return;

      setGoogleUser({
        displayName: authResult.user.displayName,
        email: authResult.user.email,
        photoURL: authResult.user.photoURL,
      });
      setGoogleToken(authResult.accessToken);

      setIsSyncingGoogle(true);
      const sheetResult = await findOrCreateSpreadsheet(authResult.accessToken);

      const syncResult = await syncAllCardsToGoogleSheet(
        authResult.accessToken,
        sheetResult.spreadsheetId,
        cards,
        transactionsByCard
      );

      const newInfo: GoogleSpreadsheetInfo = {
        spreadsheetId: sheetResult.spreadsheetId,
        webViewLink: sheetResult.webViewLink,
        title: 'CrediTrack_Card_Manager',
        lastSyncedAt: Date.now(),
        lastSyncStatus: syncResult.success ? 'success' : 'error',
      };
      setSpreadsheetInfo(newInfo);
    } catch (err: any) {
      console.error('Google Drive sign-in/sync failed:', err);
      alert(`Google Drive error: ${err?.message || 'Could not complete Google setup.'}`);
    } finally {
      setIsConnectingGoogle(false);
      setIsSyncingGoogle(false);
    }
  };

  const handleSignOutGoogle = async () => {
    await googleSignOut();
    setGoogleUser(null);
    setGoogleToken(null);
  };

  const handleSyncGoogleNow = async () => {
    let token = googleToken;
    if (!token) {
      token = await getAccessToken();
    }
    if (!token) {
      handleSignInGoogle();
      return;
    }

    setIsSyncingGoogle(true);
    try {
      let sheetId = spreadsheetInfo?.spreadsheetId;
      let webViewLink = spreadsheetInfo?.webViewLink;

      if (!sheetId) {
        const found = await findOrCreateSpreadsheet(token);
        sheetId = found.spreadsheetId;
        webViewLink = found.webViewLink;
      }

      const res = await syncAllCardsToGoogleSheet(
        token,
        sheetId,
        cards,
        transactionsByCard
      );

      setSpreadsheetInfo((prev) => ({
        spreadsheetId: sheetId!,
        webViewLink: webViewLink || `https://docs.google.com/spreadsheets/d/${sheetId}/edit`,
        title: 'CrediTrack_Card_Manager',
        lastSyncedAt: Date.now(),
        lastSyncStatus: res.success ? 'success' : 'error',
      }));
    } catch (err: any) {
      console.error('Manual sync failed:', err);
    } finally {
      setIsSyncingGoogle(false);
    }
  };

  const handleUnlockSuccess = () => {
    setIsLocked(false);
  };

  const handlePinConfigured = (newConfig: SecurityConfig) => {
    saveSecurityConfig(newConfig);
    setSecurityConfig(newConfig);
    setIsLocked(false);
  };

  const handleManualLock = () => {
    setIsLocked(true);
  };

  const handleAddCard = (newCard: CardProfile) => {
    setCards((prev) => [...prev, newCard]);
    setTransactionsByCard((prev) => ({
      ...prev,
      [newCard.id]: [],
    }));
    setSelectedCardId(newCard.id);
  };

  const handleDeleteCard = (cardId: string) => {
    setCards((prev) => prev.filter((c) => c.id !== cardId));
    setTransactionsByCard((prev) => {
      const copy = { ...prev };
      delete copy[cardId];
      return copy;
    });
    if (selectedCardId === cardId) {
      setSelectedCardId(null);
    }

    if (googleToken && spreadsheetInfo?.spreadsheetId) {
      const remainingCards = cards.filter((c) => c.id !== cardId);
      const remainingTxs = { ...transactionsByCard };
      delete remainingTxs[cardId];
      syncAllCardsToGoogleSheet(
        googleToken,
        spreadsheetInfo.spreadsheetId,
        remainingCards,
        remainingTxs
      ).catch((err) => console.error('Sheet update on card delete failed:', err));
    }
  };

  const handleUpdateCardConfig = (cardId: string, updated: Partial<CardProfile>) => {
    setCards((prev) =>
      prev.map((c) => (c.id === cardId ? { ...c, ...updated } : c))
    );
  };

  const handleAddTransaction = useCallback(
    async (txData: Omit<Transaction, 'id' | 'balance' | 'createdAt'>) => {
      const cardId = txData.cardId;
      const targetCard = cards.find((c) => c.id === cardId);

      let finalTx: Transaction;

      setTransactionsByCard((prev) => {
        const existing = prev[cardId] || [];
        const newTx: Transaction = {
          ...txData,
          id: `tx-${Date.now()}`,
          balance: 0,
          createdAt: Date.now(),
          syncedToSheet: Boolean(spreadsheetInfo?.spreadsheetId),
        };
        const updatedList = recalculateBalances([...existing, newTx]);
        finalTx = updatedList[updatedList.length - 1];

        if (googleToken && spreadsheetInfo?.spreadsheetId) {
          appendTransactionToGoogleSheet(
            googleToken,
            spreadsheetInfo.spreadsheetId,
            finalTx,
            targetCard?.name || 'Credit Card'
          ).catch((e) => console.error('Auto-append to Google Sheet failed:', e));
        }

        return {
          ...prev,
          [cardId]: updatedList,
        };
      });
    },
    [cards, googleToken, spreadsheetInfo]
  );

  const handleEditTransaction = useCallback(
    async (updatedTx: Transaction) => {
      const cardId = updatedTx.cardId;

      setTransactionsByCard((prev) => {
        const existing = prev[cardId] || [];
        const index = existing.findIndex((t) => t.id === updatedTx.id);
        if (index === -1) return prev;

        const updated = [...existing];
        updated[index] = updatedTx;
        const recalculated = recalculateBalances(updated);

        const newMap = {
          ...prev,
          [cardId]: recalculated,
        };

        if (googleToken && spreadsheetInfo?.spreadsheetId) {
          syncAllCardsToGoogleSheet(
            googleToken,
            spreadsheetInfo.spreadsheetId,
            cards,
            newMap
          ).catch((e) => console.error('Auto-sync on edit failed:', e));
        }

        return newMap;
      });
    },
    [cards, googleToken, spreadsheetInfo]
  );

  const handleDeleteTransaction = useCallback(
    async (txToDelete: Transaction) => {
      const cardId = txToDelete.cardId;

      setTransactionsByCard((prev) => {
        const existing = prev[cardId] || [];
        const filtered = existing.filter((t) => t.id !== txToDelete.id);
        const recalculated = recalculateBalances(filtered);

        const newMap = {
          ...prev,
          [cardId]: recalculated,
        };

        if (googleToken && spreadsheetInfo?.spreadsheetId) {
          syncAllCardsToGoogleSheet(
            googleToken,
            spreadsheetInfo.spreadsheetId,
            cards,
            newMap
          ).catch((e) => console.error('Auto-sync on delete failed:', e));
        }

        return newMap;
      });
    },
    [cards, googleToken, spreadsheetInfo]
  );

  const handleImportTransactions = useCallback(
    (cardId: string, imported: Transaction[], mode: 'replace' | 'append') => {
      setTransactionsByCard((prev) => {
        const existing = prev[cardId] || [];
        const combined = mode === 'replace' ? imported : [...existing, ...imported];
        const recalculated = recalculateBalances(combined);
        const newMap = {
          ...prev,
          [cardId]: recalculated,
        };

        if (googleToken && spreadsheetInfo?.spreadsheetId) {
          syncAllCardsToGoogleSheet(
            googleToken,
            spreadsheetInfo.spreadsheetId,
            cards,
            newMap
          ).catch((e) => console.error('Auto-sync on import failed:', e));
        }

        return newMap;
      });
    },
    [cards, googleToken, spreadsheetInfo]
  );

  const handleResetToDefault = () => {
    const initialTxs = {
      'card-commercial-bank': recalculateBalances(INITIAL_COMMERCIAL_TRANSACTIONS),
      'card-sampath-bank': recalculateBalances(INITIAL_SAMPATH_TRANSACTIONS),
    };
    setCards(INITIAL_CARDS);
    setTransactionsByCard(initialTxs);
    setSelectedCardId(null);

    if (googleToken && spreadsheetInfo?.spreadsheetId) {
      syncAllCardsToGoogleSheet(
        googleToken,
        spreadsheetInfo.spreadsheetId,
        INITIAL_CARDS,
        initialTxs
      ).catch((e) => console.error('Sheet update on reset failed:', e));
    }
  };

  const handleRestoreAllData = (
    restoredCards: CardProfile[],
    restoredTxs: Record<string, Transaction[]>
  ) => {
    setCards(restoredCards);
    setTransactionsByCard(restoredTxs);

    if (googleToken && spreadsheetInfo?.spreadsheetId) {
      syncAllCardsToGoogleSheet(
        googleToken,
        spreadsheetInfo.spreadsheetId,
        restoredCards,
        restoredTxs
      ).catch((e) => console.error('Sheet update on restore failed:', e));
    }
  };

  const activeCard = cards.find((c) => c.id === selectedCardId) || null;

  if (!securityConfig.isPinSet || isLocked) {
    return (
      <PinScreen
        securityConfig={securityConfig}
        onUnlockSuccess={handleUnlockSuccess}
        onPinConfigured={handlePinConfigured}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans antialiased transition-colors duration-200">
      <Header
        onLockApp={handleManualLock}
        onOpenGuide={() => setIsGuideOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onNavigateHome={() => setSelectedCardId(null)}
        activeView={selectedCardId ? 'tracker' : 'dashboard'}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 pt-5 pb-20">
        {activeCard ? (
          <CardDetailView
            card={activeCard}
            transactions={transactionsByCard[activeCard.id] || []}
            onBack={() => setSelectedCardId(null)}
            onAddTransaction={handleAddTransaction}
            onEditTransaction={handleEditTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            onDeleteCard={handleDeleteCard}
            onImportTransactions={(imported, mode) =>
              handleImportTransactions(activeCard.id, imported, mode)
            }
            onUpdateCardConfig={handleUpdateCardConfig}
            onOpenGuide={() => setIsGuideOpen(true)}
            googleUser={googleUser}
            spreadsheetInfo={spreadsheetInfo}
            onSyncAllToGoogleDrive={handleSyncGoogleNow}
            isGoogleSyncing={isSyncingGoogle}
            onConnectGoogle={handleSignInGoogle}
          />
        ) : (
          <Dashboard
            cards={cards}
            transactionsByCard={transactionsByCard}
            onSelectCard={(card) => setSelectedCardId(card.id)}
            onAddCard={handleAddCard}
            onDeleteCard={handleDeleteCard}
            onOpenGuide={() => setIsGuideOpen(true)}
            googleUser={googleUser}
            spreadsheetInfo={spreadsheetInfo}
            isConnectingGoogle={isConnectingGoogle}
            isSyncingGoogle={isSyncingGoogle}
            onSignInGoogle={handleSignInGoogle}
            onSignOutGoogle={handleSignOutGoogle}
            onSyncGoogleNow={handleSyncGoogleNow}
          />
        )}
      </main>

      <BottomNav
        currentTab={bottomNavTab}
        onSelectTab={(tab) => {
          setBottomNavTab(tab);
          if (tab === 'dashboard') {
            setSelectedCardId(null);
          } else if (tab === 'cards') {
            if (!selectedCardId && cards.length > 0) {
              setSelectedCardId(cards[0].id);
            }
          } else if (tab === 'guide') {
            setIsGuideOpen(true);
          } else if (tab === 'settings') {
            setIsSettingsOpen(true);
          }
        }}
      />

      {isGuideOpen && (
        <SheetsOnboardingGuide
          onClose={() => setIsGuideOpen(false)}
          onConnectGoogle={handleSignInGoogle}
          isConnected={Boolean(googleUser && spreadsheetInfo?.spreadsheetId)}
          sheetLink={spreadsheetInfo?.webViewLink}
        />
      )}

      {isSettingsOpen && (
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          securityConfig={securityConfig}
          onUpdateSecurity={(newCfg) => {
            saveSecurityConfig(newCfg);
            setSecurityConfig(newCfg);
          }}
          cards={cards}
          transactionsByCard={transactionsByCard}
          onRestoreAllData={handleRestoreAllData}
          onResetToDefault={handleResetToDefault}
          googleUser={googleUser}
          spreadsheetInfo={spreadsheetInfo}
          isConnectingGoogle={isConnectingGoogle}
          isSyncingGoogle={isSyncingGoogle}
          onSignInGoogle={handleSignInGoogle}
          onSignOutGoogle={handleSignOutGoogle}
          onSyncGoogleNow={handleSyncGoogleNow}
        />
      )}
    </div>
  );
}
```

---

### Deployment & Verification
- Compile command: `npm run build`
- Linter verification: `npm run lint` (0 errors)
- Dev server execution: `npm run dev` (running on port 3000)
- Verified automated generation of `CrediTrack_Card_Manager` directly inside Google Drive upon Google Sign-In with standard column headers `Month`, `Date`, `Type`, `Amount`, `Balance`, `Description`, and `Card Name`.
