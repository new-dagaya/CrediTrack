import { ColumnMapping, Transaction, TransactionType } from '../types';
import { formatDateForSheet, getMonthLabel, normalizeTransactionType, parseAmount } from './formatters';

export interface ParseResult {
  headers: string[];
  sampleRows: string[][];
  rawRows: string[][];
  detectedMapping: ColumnMapping;
}

/**
 * Parses raw text (CSV or TSV pasted from Google Sheets)
 */
export function parseDelimitedText(text: string): { headers: string[]; rows: string[][] } {
  if (!text || !text.trim()) {
    return { headers: [], rows: [] };
  }

  const lines = text.trim().split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };

  // Detect delimiter: tab or comma
  const firstLine = lines[0];
  const tabCount = (firstLine.match(/\t/g) || []).length;
  const commaCount = (firstLine.match(/,/g) || []).length;
  const delimiter = tabCount >= commaCount && tabCount > 0 ? '\t' : ',';

  const parseRow = (line: string): string[] => {
    if (delimiter === '\t') {
      return line.split('\t').map(c => c.trim().replace(/^["']|["']$/g, ''));
    }
    // Simple CSV parser supporting quotes
    const result: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"' || char === "'") {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(cur.trim().replace(/^["']|["']$/g, ''));
        cur = '';
      } else {
        cur += char;
      }
    }
    result.push(cur.trim().replace(/^["']|["']$/g, ''));
    return result;
  };

  const parsedLines = lines.map(parseRow);
  const headers = parsedLines[0];
  const rows = parsedLines.slice(1);

  return { headers, rows };
}

/**
 * Intelligently auto-maps detected column headers to the expected fields
 */
export function autoDetectColumnMapping(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {
    monthCol: '',
    dateCol: '',
    typeCol: '',
    amountCol: '',
    balanceCol: '',
    descriptionCol: '',
  };

  const lowerHeaders = headers.map(h => (h || '').toLowerCase().trim());

  lowerHeaders.forEach((header, idx) => {
    const raw = headers[idx];
    if (!mapping.monthCol && (header.includes('month') || header === 'period' || header.includes('mnth'))) {
      mapping.monthCol = raw;
    } else if (!mapping.dateCol && (header.includes('date') || header === 'day' || header.includes('time') || header === 'dt')) {
      mapping.dateCol = raw;
    } else if (!mapping.typeCol && (header.includes('type') || header === 'category' || header.includes('action') || header === 'trx')) {
      mapping.typeCol = raw;
    } else if (!mapping.amountCol && (header.includes('amount') || header.includes('value') || header.includes('lkr') || header.includes('rs') || header === 'amt')) {
      mapping.amountCol = raw;
    } else if (!mapping.balanceCol && (header.includes('balance') || header.includes('bal') || header.includes('outstanding') || header.includes('running'))) {
      mapping.balanceCol = raw;
    } else if (!mapping.descriptionCol && (header.includes('desc') || header.includes('detail') || header.includes('narration') || header.includes('remark') || header.includes('note') || header.includes('particulars'))) {
      mapping.descriptionCol = raw;
    }
  });

  // Fallbacks by standard positional index if not identified
  if (!mapping.monthCol && headers.length > 0) mapping.monthCol = headers[0];
  if (!mapping.dateCol && headers.length > 1) mapping.dateCol = headers[1];
  if (!mapping.typeCol && headers.length > 2) mapping.typeCol = headers[2];
  if (!mapping.amountCol && headers.length > 3) mapping.amountCol = headers[3];
  if (!mapping.balanceCol && headers.length > 4) mapping.balanceCol = headers[4];
  if (!mapping.descriptionCol && headers.length > 5) mapping.descriptionCol = headers[5];

  return mapping;
}

/**
 * Transforms parsed rows into Transaction objects using mapping
 */
export function transformRowsToTransactions(
  headers: string[],
  rows: string[][],
  mapping: ColumnMapping,
  cardId: string
): Transaction[] {
  const monthIdx = headers.indexOf(mapping.monthCol);
  const dateIdx = headers.indexOf(mapping.dateCol);
  const typeIdx = headers.indexOf(mapping.typeCol);
  const amountIdx = headers.indexOf(mapping.amountCol);
  const balanceIdx = headers.indexOf(mapping.balanceCol);
  const descIdx = headers.indexOf(mapping.descriptionCol);

  const transactions: Transaction[] = [];

  rows.forEach((row, idx) => {
    const rawDate = dateIdx >= 0 ? row[dateIdx] : '';
    const rawAmount = amountIdx >= 0 ? row[amountIdx] : '0';
    const rawType = typeIdx >= 0 ? row[typeIdx] : 'Use';
    const rawMonth = monthIdx >= 0 ? row[monthIdx] : '';
    const rawBalance = balanceIdx >= 0 ? row[balanceIdx] : '0';
    const rawDesc = descIdx >= 0 ? row[descIdx] : '';

    const amount = parseAmount(rawAmount);
    if (amount <= 0 && !rawDesc) return; // skip empty lines

    const type: TransactionType = normalizeTransactionType(rawType);
    const dateFormatted = rawDate ? formatDateForSheet(rawDate) : formatDateForSheet(new Date());
    const monthFormatted = rawMonth || getMonthLabel(rawDate ? new Date(rawDate) : new Date());

    transactions.push({
      id: `imported-${Date.now()}-${idx}`,
      cardId,
      month: monthFormatted,
      date: dateFormatted,
      type,
      amount,
      balance: parseAmount(rawBalance),
      description: rawDesc || 'Transaction',
      syncedToSheet: true,
      createdAt: Date.now() - (rows.length - idx) * 1000 * 60,
    });
  });

  return transactions;
}

/**
 * Ready-to-copy Google Apps Script template for zero-friction sync
 */
export function getAppsScriptTemplate(): string {
  return `/**
 * CrediTrack Google Sheet Sync Bridge
 * Instructions:
 * 1. Open your Google Sheet
 * 2. In the menu, click Extensions > Apps Script
 * 3. Delete any code in the editor, paste this entire file, and click Save (disk icon)
 * 4. Click 'Deploy' (top right blue button) > 'New deployment'
 * 5. Select type: 'Web app'
 * 6. Set Description: "CrediTrack Sync"
 * 7. Set 'Execute as': "Me"
 * 8. Set 'Who has access': "Anyone" (crucial so CrediTrack can sync without OAuth login errors)
 * 9. Click 'Deploy', authorize access if prompted, and copy the Web App URL!
 * 10. Paste the Web App URL into CrediTrack Card Settings.
 */

function doGet(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    return ContentService.createTextOutput(JSON.stringify({ success: true, headers: [], rows: [] }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  var headers = data[0];
  var rows = data.slice(1);
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    headers: headers,
    rows: rows
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);
  
  try {
    var contents = JSON.parse(e.postData.contents);
    var action = contents.action;
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Ensure header row exists
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["Month", "Date", "Type", "Amount", "Balance", "Description"]);
    }
    
    if (action === "add") {
      var tx = contents.transaction;
      sheet.appendRow([
        tx.month,
        tx.date,
        tx.type,
        tx.amount,
        tx.balance,
        tx.description
      ]);
      return ContentService.createTextOutput(JSON.stringify({ success: true, message: "Transaction added" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    if (action === "syncAll") {
      var txList = contents.transactions || [];
      // Clear data starting from row 2
      if (sheet.getLastRow() > 1) {
        sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).clearContent();
      }
      var rowsToAppend = txList.map(function(t) {
        return [t.month, t.date, t.type, t.amount, t.balance, t.description];
      });
      if (rowsToAppend.length > 0) {
        sheet.getRange(2, 1, rowsToAppend.length, 6).setValues(rowsToAppend);
      }
      return ContentService.createTextOutput(JSON.stringify({ success: true, count: rowsToAppend.length }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (action === "delete") {
      var tx = contents.transaction;
      var data = sheet.getDataRange().getValues();
      for (var i = 1; i < data.length; i++) {
        // match by date, description, amount
        if (data[i][1] == tx.date && Math.abs(data[i][3] - tx.amount) < 0.01 && data[i][5] == tx.description) {
          sheet.deleteRow(i + 1);
          break;
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ success: true, message: "Row deleted" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}`;
}

/**
 * Triggers sync to Google Sheets via Webhook
 */
export async function syncTransactionToWebhook(
  webhookUrl: string,
  action: 'add' | 'edit' | 'delete' | 'syncAll',
  payload: { transaction?: Transaction; transactions?: Transaction[]; cardName: string }
): Promise<{ success: boolean; message: string }> {
  if (!webhookUrl || !webhookUrl.startsWith('http')) {
    return { success: false, message: 'Invalid Google Sheets Webhook URL' };
  }

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8', // Apps script handles text/plain cleanly without CORS preflight blocks
      },
      body: JSON.stringify({
        action,
        cardName: payload.cardName,
        transaction: payload.transaction,
        transactions: payload.transactions,
        timestamp: Date.now(),
      }),
    });

    if (!res.ok) {
      throw new Error(`Server returned HTTP ${res.status}`);
    }

    const data = await res.json().catch(() => ({ success: true }));
    return {
      success: data.success !== false,
      message: data.message || 'Synced successfully to Google Sheets',
    };
  } catch (error: any) {
    console.error('Sheets sync error:', error);
    return {
      success: false,
      message: error?.message || 'Failed to connect to Google Sheets',
    };
  }
}
