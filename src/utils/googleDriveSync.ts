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

// Standard columns for each card's dedicated tab:
// Month, Date, Type, Amount, Balance, Description
export const STANDARD_HEADERS = [
  'Month',
  'Date',
  'Type',
  'Amount',
  'Balance',
  'Description',
];

// Configuration columns for _CONFIG_ tab:
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

/**
 * Derives a standardized, clean Google Sheet tab name for a credit card.
 * Example:
 *  "Commercial Bank" -> "COMMERCIAL_BANK"
 *  "Sampath Bank"    -> "SAMPATH_BANK"
 *  "Seylan Platinum" -> "SEYLAN_PLATINUM"
 */
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

/**
 * Fetches all existing sheet tabs in the spreadsheet.
 */
export async function getSpreadsheetTabs(
  accessToken: string,
  spreadsheetId: string
): Promise<{ sheetId: number; title: string }[]> {
  const metaUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties(sheetId,title)`;
  const res = await fetch(metaUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(
      errorData?.error?.message || `Failed to fetch spreadsheet tabs: ${res.status}`
    );
  }

  const data = await res.json();
  return (data.sheets || []).map((s: any) => ({
    sheetId: s.properties.sheetId,
    title: s.properties.title,
  }));
}

/**
 * Checks Google Drive to determine if the "CrediTrack_Card_Manager" spreadsheet already exists.
 */
export async function checkSpreadsheetExists(
  accessToken: string
): Promise<{ exists: boolean; file?: { id: string; name: string; webViewLink: string } }> {
  if (!accessToken) {
    return { exists: false };
  }

  const query = encodeURIComponent(
    `name = '${SPREADSHEET_NAME}' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false`
  );
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,webViewLink)&pageSize=1`;

  const searchRes = await fetch(searchUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!searchRes.ok) {
    const errorData = await searchRes.json().catch(() => ({}));
    throw new Error(
      errorData?.error?.message || `Google Drive query failed (${searchRes.status})`
    );
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

/**
 * Reads and auto-loads all previously saved credit card configurations, structural tabs,
 * and logged transactions from an existing "CrediTrack_Card_Manager" Google Sheet file.
 * All transactions are returned sorted chronologically by date.
 */
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

  // 1. Fetch spreadsheet metadata to get all sheet tabs
  const metaUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=properties.title,sheets.properties(sheetId,title)`;
  const metaRes = await fetch(metaUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!metaRes.ok) {
    const errorData = await metaRes.json().catch(() => ({}));
    throw new Error(
      errorData?.error?.message || `Failed to fetch spreadsheet metadata: ${metaRes.status}`
    );
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

  // 2. Read Card Profiles from _CONFIG_ tab if present
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

        rows.forEach((row, idx) => {
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

  // 3. Fallback: If no cards were found in _CONFIG_, derive card configurations from structural tabs
  if (loadedCards.length === 0) {
    const palette: CardProfile['themeColor'][] = ['amber', 'emerald', 'cyan', 'purple', 'rose', 'blue'];
    cardTabs.forEach((tab, index) => {
      const title = tab.title;
      // Convert "COMMERCIAL_BANK" to "Commercial Bank"
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
    // Also associate any remaining card tabs that match by derived title
    loadedCards.forEach((c) => {
      const derived = getCardTabTitle(c).toUpperCase();
      tabToCardMap.set(derived, c);
    });
  }

  // 4. Batch read all transaction rows from all card tabs
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

  // If _CONFIG_ tab was missing, automatically create it and write metadata in the background
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

/**
 * Creates missing tabs for specified card tab titles in the spreadsheet.
 */
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
    throw new Error(
      errorData?.error?.message || `Failed to add sheet tabs: ${batchRes.status}`
    );
  }

  // Write headers for newly created tabs
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

/**
 * Persists all card profile configurations into the dedicated `_CONFIG_` sheet tab.
 */
export async function saveCardMetadataToGoogleSheet(
  accessToken: string,
  spreadsheetId: string,
  cards: CardProfile[]
): Promise<{ success: boolean; error?: string }> {
  if (!accessToken || !spreadsheetId) return { success: false, error: 'Missing credentials.' };

  try {
    await createTabsIfMissing(accessToken, spreadsheetId, [CONFIG_TAB_TITLE]);

    // Clear existing config rows
    const clearRange = encodeURIComponent(`'${CONFIG_TAB_TITLE}'!A2:I100`);
    const clearUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${clearRange}:clear`;
    await fetch(clearUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    // Write header
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

    // Write card metadata rows
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

/**
 * Creates a brand-new tracking spreadsheet structure in Google Drive with _CONFIG_ tab
 * and dedicated tabs for each credit card.
 */
export async function createTrackingSpreadsheet(
  accessToken: string,
  cards: CardProfile[] = [],
  transactionsByCard: Record<string, Transaction[]> = {}
): Promise<GoogleSpreadsheetInfo> {
  if (!accessToken) {
    throw new Error('Google OAuth access token is required.');
  }

  // Prepare initial tabs: _CONFIG_ + card tabs
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
    // If cards is empty, create an overview tab
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
    throw new Error(
      errorData?.error?.message || `Failed to create tracking spreadsheet: ${createRes.status}`
    );
  }

  const createData = await createRes.json();
  const newSheetId = createData.spreadsheetId;
  const webViewLink =
    createData.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${newSheetId}/edit`;

  // Write _CONFIG_ data
  await saveCardMetadataToGoogleSheet(accessToken, newSheetId, cards);

  // Write headers and transactions for each card tab
  for (const card of cards) {
    const tabTitle = getCardTabTitle(card);
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

/**
 * Real-Time Automatic Sync: Synchronizes a single credit card's transactions to its dedicated sheet tab.
 * Ensures transactions are sorted chronologically by date and running balances are recalculate-verified.
 */
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

    // Ensure transactions are chronologically sorted by date
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

    // 1. Clear existing rows from row 2 downward in this tab
    const clearRange = encodeURIComponent(`'${tabTitle}'!A2:Z1000`);
    const clearUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${clearRange}:clear`;
    await fetch(clearUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    // 2. Ensure row 1 has standard column headers
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

    // 3. Write all rows for this card
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

/**
 * Synchronizes all cards and transactions across the entire spreadsheet.
 */
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
 * Appends a newly logged transaction to the card's specific dedicated tab.
 */
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

/**
 * Ensures a dedicated tab exists for a newly created card.
 */
export async function ensureCardTabExists(
  accessToken: string,
  spreadsheetId: string,
  card: CardProfile
): Promise<string> {
  const tabTitle = getCardTabTitle(card);
  await createTabsIfMissing(accessToken, spreadsheetId, [tabTitle]);
  return tabTitle;
}

/**
 * Dynamically deletes a card's dedicated tab from the Google Sheet in Google Drive.
 */
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

    if (!targetTab) {
      return { success: true };
    }

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

/**
 * Renames an existing card tab when the user edits the card name.
 */
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

/**
 * FORCED IMMEDIATE MANUAL SYNCHRONIZATION:
 * Explicitly queries Google Drive for "CrediTrack_Card_Manager".
 * Reads all remote sheet tabs and configurations, merges card profiles and logged transactions,
 * sorts all transactions chronologically by date, recalculates running balances,
 * and writes/syncs all current card contexts and transaction history directly to Google Drive.
 * If the spreadsheet does not exist yet, creates it.
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

  // 1. Explicitly check if "CrediTrack_Card_Manager" exists on Google Drive
  const search = await checkSpreadsheetExists(accessToken);

  if (!search.exists || !search.file) {
    // Spreadsheet does not exist yet -> Create new tracking spreadsheet
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

  // 2. Read existing cards and transactions from Google Sheet
  const remoteData = await loadDataFromGoogleSpreadsheet(accessToken, sheetId);

  // 3. Merge Card Profiles:
  // Build lookup from remote cards, then overlay current app card context
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

  // 4. Merge and chronologically sort all transactions per card
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

    // Ensure all transactions remain sorted chronologically by date
    const sorted = Array.from(txMap.values()).sort((a, b) => {
      const timeA = parseTxDate(a.date, a.createdAt);
      const timeB = parseTxDate(b.date, b.createdAt);
      if (timeA !== timeB) return timeA - timeB;
      return (a.createdAt || 0) - (b.createdAt || 0);
    });

    mergedTxsByCard[card.id] = recalculateBalances(sorted);
  }

  // 5. Write and synchronize all card profiles and transactions into the Google Sheet file
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

