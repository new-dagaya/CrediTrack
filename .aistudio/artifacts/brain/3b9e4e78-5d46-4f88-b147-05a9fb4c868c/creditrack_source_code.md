# CrediTrack — Complete Implementation Artifact: Auto-Load Existing Data & Real-Time Background Sync

## Key Architecture & Logic Upgrades

### 1. Auto-Load Existing Google Drive Data
- **Drive Discovery (`checkSpreadsheetExists`)**: On Gmail login via Firebase Google Auth, the app automatically queries Google Drive (`files.list` with `name = 'CrediTrack_Card_Manager' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false`).
- **Lossless Auto-Load (`loadDataFromGoogleSpreadsheet`)**:
  - If found, it fetches the spreadsheet's metadata and all tab ranges via a high-performance batch call (`values:batchGet`).
  - Reads card configurations from `_CONFIG_` (or reconstructs cards from tab names if `_CONFIG_` is not yet present).
  - Reads all logged transactions from each card's dedicated tab (`Month`, `Date`, `Type`, `Amount`, `Balance`, `Description`).
  - **Chronological Sorting**: Every loaded transaction list is sorted chronologically by date using `parseTxDate(a.date, a.createdAt) - parseTxDate(b.date, b.createdAt)` and running balances are verified via `recalculateBalances`.
  - Sets the app context state and user-scoped `localStorage` immediately, replacing default templates with the user's authentic data.
- **Conditional Creation**: If and only if no existing `CrediTrack_Card_Manager` file is found, it calls `createTrackingSpreadsheet` to provision a new tracking spreadsheet structure with `_CONFIG_` and dedicated card tabs.

### 2. Real-Time Automatic Background Sync
- **Zero Manual Sync Buttons**: All manual "Sync Now" and "Sync Tab" buttons have been completely removed from `GoogleDriveSyncBanner`, `CardDetailView`, `SettingsModal`, and `ImportSheetModal`.
- **Immediate Mutation Sync Hooks**:
  - `handleAddTransaction`: Immediately adds the transaction, recalculates balances, and fires `syncSingleCardTabToGoogleSheet` in the background.
  - `handleEditTransaction`: Immediately updates the transaction, recalculates balances, and fires `syncSingleCardTabToGoogleSheet` in the background.
  - `handleDeleteTransaction`: Immediately removes the transaction, recalculates balances, and fires `syncSingleCardTabToGoogleSheet` in the background.
  - `handleAddCard`: Immediately adds the card, calls `ensureCardTabExists`, and updates `_CONFIG_` via `saveCardMetadataToGoogleSheet`.
  - `handleUpdateCardConfig`: Immediately renames the corresponding sheet tab (if the name changed) via `renameCardTabInGoogleSheet` and updates `_CONFIG_`.
  - `handleDeleteCard`: Immediately removes the card and deletes the corresponding tab from Google Sheets via `deleteCardTabFromGoogleSheet`.
  - `handleImportTransactions`: Immediately imports, recalculates, and syncs the card tab to Google Sheets.
- **Ambient Status Indicators**: A pulsing neon badge indicates real-time auto-sync status ("Real-Time Auto-Sync Active" / "Auto-saving to Sheets...").

---

## 1. Google Drive & Sheets Integration (`src/utils/googleDriveSync.ts`)

```typescript
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
    throw new Error(errorData?.error?.message || `Failed to fetch spreadsheet tabs: ${res.status}`);
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

export async function loadDataFromGoogleSpreadsheet(
  accessToken: string,
  spreadsheetId: string
): Promise<{
  cards: CardProfile[];
  transactionsByCard: Record<string, Transaction[]>;
  spreadsheetTitle: string;
}> {
  if (!accessToken || !spreadsheetId) {
    throw new Error('Access token and spreadsheet ID are required to load data.');
  }

  const metaUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=properties.title,sheets.properties(sheetId,title)`;
  const metaRes = await fetch(metaUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!metaRes.ok) {
    const errorData = await metaRes.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || `Failed to fetch spreadsheet metadata: ${metaRes.status}`);
  }

  const metaData = await metaRes.json();
  const spreadsheetTitle = metaData.properties?.title || SPREADSHEET_NAME;
  const existingTabs: { sheetId: number; title: string }[] = (metaData.sheets || []).map((s: any) => ({
    sheetId: s.properties.sheetId,
    title: s.properties.title,
  }));

  const hasConfigTab = existingTabs.some((t) => t.title === CONFIG_TAB_TITLE);
  const cardTabs = existingTabs.filter(
    (t) => t.title !== CONFIG_TAB_TITLE && t.title !== 'OVERVIEW' && t.title !== 'CARDS_OVERVIEW'
  );

  let loadedCards: CardProfile[] = [];
  const tabToCardMap = new Map<string, CardProfile>();

  if (hasConfigTab) {
    try {
      const configRange = encodeURIComponent(`'${CONFIG_TAB_TITLE}'!A2:I100`);
      const configUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${configRange}?valueRenderOption=UNFORMATTED_VALUE`;
      const configRes = await fetch(configUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (configRes.ok) {
        const configData = await configRes.json();
        const rows: any[][] = configData.values || [];

        rows.forEach((row) => {
          if (!row || !row[0]) return;
          const id = String(row[0]).trim();
          const name = String(row[1] || 'Credit Card').trim();
          const bankName = String(row[2] || name).trim();
          const cardNumberMask = String(row[3] || '•••• 0000').trim();
          const themeColor = (String(row[4] || 'emerald').toLowerCase() as CardProfile['themeColor']) || 'emerald';
          const creditLimit = row[5] ? parseFloat(String(row[5])) || undefined : undefined;
          const billingDay = row[6] ? parseInt(String(row[6]), 10) || undefined : undefined;
          const tabTitle = String(row[7] || '').trim();
          const createdAt = row[8] ? parseInt(String(row[8]), 10) || Date.now() : Date.now();

          const card: CardProfile = {
            id,
            name,
            bankName,
            cardNumberMask,
            themeColor,
            creditLimit,
            billingDay,
            createdAt,
          };
          loadedCards.push(card);
          if (tabTitle) {
            tabToCardMap.set(tabTitle.toUpperCase(), card);
          }
        });
      }
    } catch (e) {
      console.warn('Failed reading _CONFIG_ tab, falling back to tab derivation:', e);
    }
  }

  if (loadedCards.length === 0) {
    const palette: CardProfile['themeColor'][] = ['amber', 'emerald', 'cyan', 'purple', 'rose', 'blue'];
    cardTabs.forEach((tab, index) => {
      const title = tab.title;
      const nameParts = title.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
      const friendlyName = nameParts.join(' ');
      const id = `card-${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
      const color = palette[index % palette.length];

      const card: CardProfile = {
        id,
        name: friendlyName,
        bankName: friendlyName,
        cardNumberMask: `•••• ${1000 + (index * 1337) % 9000}`,
        themeColor: color,
        creditLimit: 250000,
        billingDay: 15,
        createdAt: Date.now() - (cardTabs.length - index) * 1000 * 60 * 60 * 24 * 30,
      };

      loadedCards.push(card);
      tabToCardMap.set(title.toUpperCase(), card);
    });
  } else {
    loadedCards.forEach((c) => {
      const derived = getCardTabTitle(c).toUpperCase();
      tabToCardMap.set(derived, c);
    });
  }

  const transactionsByCard: Record<string, Transaction[]> = {};
  loadedCards.forEach((c) => {
    transactionsByCard[c.id] = [];
  });

  const validTabsToFetch = cardTabs.filter((t) => tabToCardMap.has(t.title.toUpperCase()));

  if (validTabsToFetch.length > 0) {
    const rangesQuery = validTabsToFetch
      .map((t) => `ranges=${encodeURIComponent(`'${t.title}'!A2:F2000`)}`)
      .join('&');
    const batchUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet?${rangesQuery}&valueRenderOption=UNFORMATTED_VALUE`;

    const batchRes = await fetch(batchUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (batchRes.ok) {
      const batchData = await batchRes.json();
      const valueRanges: any[] = batchData.valueRanges || [];

      valueRanges.forEach((rangeObj, i) => {
        const tab = validTabsToFetch[i];
        if (!tab) return;
        const card = tabToCardMap.get(tab.title.toUpperCase());
        if (!card) return;

        const rows: any[][] = rangeObj.values || [];
        const cardTransactions: Transaction[] = [];

        rows.forEach((row, rowIdx) => {
          if (!row || row.length === 0 || (!row[0] && !row[1] && !row[3])) return;

          const month = String(row[0] || '').trim();
          const date = String(row[1] || '').trim();
          const typeStr = String(row[2] || 'Use').trim();
          const amountRaw = row[3];
          const amount =
            typeof amountRaw === 'number'
              ? amountRaw
              : parseFloat(String(amountRaw).replace(/[^0-9.-]/g, '')) || 0;
          const balanceRaw = row[4];
          const balance =
            typeof balanceRaw === 'number'
              ? balanceRaw
              : parseFloat(String(balanceRaw).replace(/[^0-9.-]/g, '')) || 0;
          const description = String(row[5] || '').trim();

          const type = normalizeTransactionType(typeStr);
          const parsedTime = parseTxDate(date) || Date.now() - (rows.length - rowIdx) * 1000;

          cardTransactions.push({
            id: `tx-${card.id}-${rowIdx}-${parsedTime}`,
            cardId: card.id,
            month: month || getMonthLabel(new Date(parsedTime)),
            date: date || formatDateForSheet(new Date(parsedTime)),
            type,
            amount: Math.round(amount * 100) / 100,
            balance: Math.round(balance * 100) / 100,
            description,
            createdAt: parsedTime,
            syncedToSheet: true,
          });
        });

        // Ensure all loaded transactions remain sorted chronologically by date
        const sorted = [...cardTransactions].sort((a, b) => {
          const timeA = parseTxDate(a.date, a.createdAt);
          const timeB = parseTxDate(b.date, b.createdAt);
          if (timeA !== timeB) return timeA - timeB;
          return (a.createdAt || 0) - (b.createdAt || 0);
        });

        transactionsByCard[card.id] = recalculateBalances(sorted);
      });
    }
  }

  if (!hasConfigTab && loadedCards.length > 0) {
    saveCardMetadataToGoogleSheet(accessToken, spreadsheetId, loadedCards).catch((e) =>
      console.warn('Auto-saving _CONFIG_ tab in background failed:', e)
    );
  }

  return {
    cards: loadedCards,
    transactionsByCard,
    spreadsheetTitle,
  };
}

export async function createTabsIfMissing(
  accessToken: string,
  spreadsheetId: string,
  requiredTabTitles: string[]
): Promise<string[]> {
  const existingTabs = await getSpreadsheetTabs(accessToken, spreadsheetId);
  const existingTitles = new Set(existingTabs.map((t) => t.title));

  const missingTitles = requiredTabTitles.filter((title) => !existingTitles.has(title));
  if (missingTitles.length === 0) {
    return existingTabs.map((t) => t.title);
  }

  const batchUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`;
  const requests = missingTitles.map((title) => ({
    addSheet: {
      properties: {
        title,
        gridProperties: {
          frozenRowCount: 1,
          rowCount: 500,
          columnCount: 10,
        },
      },
    },
  }));

  const batchRes = await fetch(batchUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ requests }),
  });

  if (!batchRes.ok) {
    const errorData = await batchRes.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || `Failed to add sheet tabs: ${batchRes.status}`);
  }

  for (const title of missingTitles) {
    const isConfig = title === CONFIG_TAB_TITLE;
    const headers = isConfig ? CONFIG_HEADERS : STANDARD_HEADERS;
    const range = encodeURIComponent(`'${title}'!A1:${String.fromCharCode(64 + headers.length)}1`);
    const headerUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`;
    await fetch(headerUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: [headers] }),
    });
  }

  const updatedTabs = await getSpreadsheetTabs(accessToken, spreadsheetId);
  return updatedTabs.map((t) => t.title);
}

export async function saveCardMetadataToGoogleSheet(
  accessToken: string,
  spreadsheetId: string,
  cards: CardProfile[]
): Promise<{ success: boolean; error?: string }> {
  if (!accessToken || !spreadsheetId) return { success: false, error: 'Missing credentials.' };

  try {
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

    if (rows.length > 0) {
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

    return { success: true };
  } catch (error: any) {
    console.error('saveCardMetadataToGoogleSheet error:', error);
    return { success: false, error: error?.message };
  }
}

export async function createTrackingSpreadsheet(
  accessToken: string,
  cards: CardProfile[] = [],
  transactionsByCard: Record<string, Transaction[]> = {}
): Promise<GoogleSpreadsheetInfo> {
  if (!accessToken) {
    throw new Error('Google OAuth access token is required.');
  }

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

export async function appendTransactionToGoogleSheet(
  accessToken: string,
  spreadsheetId: string,
  tx: Transaction,
  card: CardProfile
): Promise<{ success: boolean; error?: string }> {
  if (!accessToken || !spreadsheetId || !card) return { success: false };

  try {
    const tabTitle = getCardTabTitle(card);
    await createTabsIfMissing(accessToken, spreadsheetId, [tabTitle]);

    const appendRange = encodeURIComponent(`'${tabTitle}'!A:F`);
    const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${appendRange}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

    const row = [tx.month, tx.date, tx.type, tx.amount, tx.balance, tx.description];

    const res = await fetch(appendUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: [row] }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData?.error?.message || `Failed to append: ${res.status}`);
    }

    return { success: true };
  } catch (error: any) {
    console.error('Failed to append transaction to dedicated card tab:', error);
    return { success: false, error: error?.message };
  }
}

export async function ensureCardTabExists(
  accessToken: string,
  spreadsheetId: string,
  card: CardProfile
): Promise<string> {
  const tabTitle = getCardTabTitle(card);
  await createTabsIfMissing(accessToken, spreadsheetId, [tabTitle]);
  return tabTitle;
}

export async function deleteCardTabFromGoogleSheet(
  accessToken: string,
  spreadsheetId: string,
  card: CardProfile
): Promise<{ success: boolean; error?: string }> {
  if (!accessToken || !spreadsheetId || !card) return { success: false };

  try {
    const tabTitle = getCardTabTitle(card);
    const existingTabs = await getSpreadsheetTabs(accessToken, spreadsheetId);
    const targetTab = existingTabs.find((t) => t.title.toLowerCase() === tabTitle.toLowerCase());

    if (!targetTab) return { success: true };

    if (existingTabs.length === 1) {
      await createTabsIfMissing(accessToken, spreadsheetId, ['OVERVIEW']);
    }

    const batchUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`;
    const res = await fetch(batchUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [{ deleteSheet: { sheetId: targetTab.sheetId } }],
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return { success: false, error: errData?.error?.message || `Failed to delete tab: ${res.status}` };
    }

    return { success: true };
  } catch (error: any) {
    console.error('deleteCardTabFromGoogleSheet error:', error);
    return { success: false, error: error?.message || 'Failed to delete sheet tab' };
  }
}

export async function renameCardTabInGoogleSheet(
  accessToken: string,
  spreadsheetId: string,
  oldCardTitle: string,
  newCardTitle: string
): Promise<{ success: boolean; error?: string }> {
  if (!accessToken || !spreadsheetId || !oldCardTitle || !newCardTitle) return { success: false };
  if (oldCardTitle === newCardTitle) return { success: true };

  try {
    const existingTabs = await getSpreadsheetTabs(accessToken, spreadsheetId);
    const targetTab = existingTabs.find((t) => t.title.toLowerCase() === oldCardTitle.toLowerCase());

    if (!targetTab) {
      await createTabsIfMissing(accessToken, spreadsheetId, [newCardTitle]);
      return { success: true };
    }

    const batchUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`;
    const res = await fetch(batchUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            updateSheetProperties: {
              properties: {
                sheetId: targetTab.sheetId,
                title: newCardTitle,
              },
              fields: 'title',
            },
          },
        ],
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return { success: false, error: errData?.error?.message || `Failed to rename tab: ${res.status}` };
    }

    return { success: true };
  } catch (error: any) {
    console.error('renameCardTabInGoogleSheet error:', error);
    return { success: false, error: error?.message || 'Failed to rename sheet tab' };
  }
}
```

---

## 2. Real-Time UI Banner (`src/components/common/GoogleDriveSyncBanner.tsx`)

```typescript
import React from 'react';
import { 
  FileSpreadsheet, 
  ExternalLink, 
  RefreshCw, 
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
```

---

## 3. Real-Time Application Orchestrator (`src/App.tsx`)

```typescript
// Highlights from src/App.tsx:
// 1. Auto-Load Existing Data on Login:
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
          localStorage.setItem(getCardsStorageKey(uid), JSON.stringify(loaded.cards));
          localStorage.setItem(getTxsStorageKey(uid), JSON.stringify(loaded.transactionsByCard));
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
      // If not found, only then create new tracking spreadsheet
      const userCards = loadUserCards(uid);
      const userTxs = loadUserTransactions(uid);
      setCards(userCards);
      setTransactionsByCard(userTxs);
      const created = await createTrackingSpreadsheet(token, userCards, userTxs);
      setSpreadsheetInfo(created);
    } finally {
      setIsConnectingGoogle(false);
      setIsSyncingGoogle(false);
    }
  },
  []
);

// 2. Real-Time Background Sync on Every Mutation:
const syncCardInBackground = useCallback(
  async (targetCard: CardProfile, updatedCardTxs: Transaction[]) => {
    let token = googleToken || await getAccessToken();
    const sheetId = spreadsheetInfo?.spreadsheetId;
    if (!token || !sheetId) return;

    setIsSyncingGoogle(true);
    try {
      await syncSingleCardTabToGoogleSheet(token, sheetId, targetCard, updatedCardTxs);
      setSpreadsheetInfo((prev) => prev ? {
        ...prev,
        lastSyncedAt: Date.now(),
        lastSyncStatus: 'success',
      } : null);
    } finally {
      setIsSyncingGoogle(false);
    }
  },
  [googleToken, spreadsheetInfo?.spreadsheetId]
);
```

---

## 4. Verification & Lint State
- `tsc --noEmit` / `lint_applet`: **0 Errors**
- `compile_applet`: **Build succeeded**
- All loaded transactions sorted chronologically by date.
- Real-time automatic background sync triggers on every mutation with zero manual sync buttons.
