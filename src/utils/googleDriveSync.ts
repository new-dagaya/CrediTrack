import { CardProfile, Transaction } from '../types';
import { parseTxDate } from './formatters';

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
  // Google Sheets tab length max is 100 characters; keep it under 50
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

  // Create missing tabs using batchUpdate
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

  // Write standard column headers into row 1 of each newly created sheet
  for (const title of missingTitles) {
    const range = encodeURIComponent(`'${title}'!A1:F1`);
    const headerUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`;
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
  }

  const updatedTabs = await getSpreadsheetTabs(accessToken, spreadsheetId);
  return updatedTabs.map((t) => t.title);
}

/**
 * Searches user's Google Drive for existing 'CrediTrack_Card_Manager' spreadsheet,
 * or automatically creates a new one with separate tabs for EACH credit card!
 */
export async function findOrCreateSpreadsheet(
  accessToken: string,
  cards: CardProfile[] = []
): Promise<{ spreadsheetId: string; webViewLink: string; isNew: boolean; createdTabs: string[] }> {
  if (!accessToken) {
    throw new Error('Google OAuth access token is required.');
  }

  // 1. Search Google Drive using files.list
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
    const sheetId = existing.id;
    const webViewLink =
      existing.webViewLink ||
      `https://docs.google.com/spreadsheets/d/${sheetId}/edit`;

    // Ensure all currently registered cards have their individual tabs created
    const cardTabTitles = cards.map(getCardTabTitle);
    const existingTabs = await createTabsIfMissing(accessToken, sheetId, cardTabTitles);

    return {
      spreadsheetId: sheetId,
      webViewLink,
      isNew: false,
      createdTabs: existingTabs,
    };
  }

  // 2. Not found: Create new Google Sheet directly via Google Sheets API with individual card tabs
  const initialTabs = cards.length > 0 
    ? cards.map((c) => ({
        properties: {
          title: getCardTabTitle(c),
          gridProperties: {
            frozenRowCount: 1,
            rowCount: 500,
            columnCount: 10,
          },
        },
      }))
    : [
        {
          properties: {
            title: 'CARDS_OVERVIEW',
            gridProperties: {
              frozenRowCount: 1,
              rowCount: 500,
              columnCount: 10,
            },
          },
        },
      ];

  const createUrl = 'https://sheets.googleapis.com/v4/spreadsheets';
  const createPayload = {
    properties: {
      title: SPREADSHEET_NAME,
    },
    sheets: initialTabs,
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

  // 3. Populate row 1 of each card tab with standard column headers:
  // Month, Date, Type, Amount, Balance, Description
  const createdTabs = (createData.sheets || []).map((s: any) => s.properties.title as string);
  for (const tabTitle of createdTabs) {
    const range = encodeURIComponent(`'${tabTitle}'!A1:F1`);
    const headerUrl = `https://sheets.googleapis.com/v4/spreadsheets/${newSheetId}/values/${range}?valueInputOption=USER_ENTERED`;
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
  }

  return {
    spreadsheetId: newSheetId,
    webViewLink,
    isNew: true,
    createdTabs,
  };
}

/**
 * Synchronizes each credit card into its own dedicated sheet (tab)
 * within the 'CrediTrack_Card_Manager' spreadsheet.
 * Each tab independently holds: Month, Date, Type, Amount, Balance, Description.
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
    // 1. Ensure all card tabs exist
    const requiredTabTitles = cards.map(getCardTabTitle);
    await createTabsIfMissing(accessToken, spreadsheetId, requiredTabTitles);

    let totalRowCount = 0;
    const syncedTabs: string[] = [];

    // 2. Write transactions for each card to its dedicated tab
    for (const card of cards) {
      const tabTitle = getCardTabTitle(card);
      syncedTabs.push(tabTitle);

      const cardTxs = transactionsByCard[card.id] || [];
      // Sort chronologically by transaction date
      const sortedTxs = [...cardTxs].sort((a, b) => {
        const timeA = parseTxDate(a.date, a.createdAt);
        const timeB = parseTxDate(b.date, b.createdAt);
        if (timeA !== timeB) return timeA - timeB;
        return (a.createdAt || 0) - (b.createdAt || 0);
      });

      const rows: (string | number)[][] = sortedTxs.map((tx) => [
        tx.month,
        tx.date,
        tx.type,
        tx.amount,
        tx.balance,
        tx.description,
      ]);

      // A. Clear existing rows from row 2 downward in this tab
      const clearRange = encodeURIComponent(`'${tabTitle}'!A2:Z1000`);
      const clearUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${clearRange}:clear`;
      await fetch(clearUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      // B. Ensure row 1 has standard headers: Month, Date, Type, Amount, Balance, Description
      const headerRange = encodeURIComponent(`'${tabTitle}'!A1:F1`);
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

      // C. Populate rows for this card
      if (rows.length > 0) {
        const writeRange = encodeURIComponent(`'${tabTitle}'!A2`);
        const writeUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${writeRange}?valueInputOption=USER_ENTERED`;
        const writeRes = await fetch(writeUrl, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            values: rows,
          }),
        });

        if (!writeRes.ok) {
          const errData = await writeRes.json().catch(() => ({}));
          console.warn(`Failed writing to tab ${tabTitle}:`, errData);
        } else {
          totalRowCount += rows.length;
        }
      }
    }

    return {
      success: true,
      count: totalRowCount,
      tabs: syncedTabs,
    };
  } catch (error: any) {
    console.error('Dynamic Multi-Sheet Sync error:', error);
    return {
      success: false,
      count: 0,
      tabs: [],
      error: error?.message || 'Multi-sheet sync failed',
    };
  }
}

/**
 * Appends a newly logged transaction to the card's specific dedicated tab
 * with columns: Month, Date, Type, Amount, Balance, Description.
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

    // Ensure tab exists
    await createTabsIfMissing(accessToken, spreadsheetId, [tabTitle]);

    const appendRange = encodeURIComponent(`'${tabTitle}'!A:F`);
    const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${appendRange}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

    const row = [
      tx.month,
      tx.date,
      tx.type,
      tx.amount,
      tx.balance,
      tx.description,
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
 * Handles single-tab constraint by ensuring an overview tab exists if deleting the last tab.
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
      return { success: true }; // Tab already doesn't exist
    }

    // Google Sheets requires at least one sheet tab in a spreadsheet.
    // If this is the only tab left, create an OVERVIEW placeholder first so deletion succeeds.
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
        requests: [
          {
            deleteSheet: {
              sheetId: targetTab.sheetId,
            },
          },
        ],
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      console.warn('Failed to delete tab from Google Sheet:', errData);
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
      // If old tab not found, just create the new tab
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

