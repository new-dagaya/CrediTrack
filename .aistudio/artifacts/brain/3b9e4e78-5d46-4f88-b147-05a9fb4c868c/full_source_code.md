# CrediTrack — Personal Credit Card Manager & Google Sheets Sync
## Full Source Code Bundle & Implementation Plan

### Implementation Plan & Updates Summary
- **Delete Card Feature**:
  - Implemented card deletion with modal confirmation on both the **Dashboard** card widget (via direct trash action button) and the **Card Detail Screen** top action bar.
  - Safely deletes the card profile and cleans up all associated itemized transactions from memory and `localStorage`.
  - Automatically redirects back to the Portfolio Dashboard if the currently open card is deleted.
- **Dark Mode & Light Mode Toggle Switch**:
  - Prominent dual-state toggle switch added at the very top of the Dashboard (`Light` / `Dark`).
  - Synced top bar header toggle with icon animation (Sun for Light mode, Moon for Dark mode).
  - Configured class-based dark variant in `src/index.css` (`@variant dark (&:where(.dark, .dark *));`) with persistent user preference storage in `localStorage`.
- **Comprehensive Verification**:
  - Zero compiler errors (`compile_applet` passed).
  - Zero linter/TypeScript errors (`lint_applet` passed).

---

### Project File Structure

```
creditrack/
├── .env.example
├── index.html
├── metadata.json
├── package.json
├── tsconfig.json
├── vite.config.ts
└── src/
    ├── index.css
    ├── main.tsx
    ├── App.tsx
    ├── types/
    │   └── index.ts
    ├── utils/
    │   ├── formatters.ts
    │   ├── security.ts
    │   └── sheetsSync.ts
    ├── data/
    │   └── initialData.ts
    └── components/
        ├── common/
        │   ├── Header.tsx
        │   └── BottomNav.tsx
        ├── security/
        │   └── PinScreen.tsx
        ├── dashboard/
        │   ├── Dashboard.tsx
        │   └── AddCardModal.tsx
        ├── tracker/
        │   ├── CardDetailView.tsx
        │   ├── TransactionTable.tsx
        │   ├── MonthlyBreakdown.tsx
        │   ├── AnalyticsChart.tsx
        │   └── TransactionModal.tsx
        ├── sheets/
        │   ├── ImportSheetModal.tsx
        │   └── SheetsOnboardingGuide.tsx
        └── settings/
            └── SettingsModal.tsx
```

---

### Full Source Code

#### 1. `package.json`
```json
{
  "name": "creditrack",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite --port=3000 --host=0.0.0.0",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "tsc --noEmit"
  },
  "dependencies": {
    "@tailwindcss/vite": "^4.3.3",
    "@vitejs/plugin-react": "^6.1.1",
    "lucide-react": "^0.546.0",
    "react": "^19.0.1",
    "react-dom": "^19.0.1",
    "vite": "^8.3.0"
  },
  "devDependencies": {
    "@types/node": "^22.14.0",
    "@types/react": "^19.3.0",
    "@types/react-dom": "^19.3.0",
    "tailwindcss": "^4.3.3",
    "typescript": "^7.0.2"
  }
}
```

#### 2. `vite.config.ts`
```typescript
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 3000,
    },
  };
});
```

#### 3. `tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "experimentalDecorators": true,
    "useDefineForClassFields": false,
    "module": "ESNext",
    "types": ["vite/client"],
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "isolatedModules": true,
    "moduleDetection": "force",
    "allowJs": true,
    "jsx": "react-jsx",
    "paths": {
      "@/*": ["./*"]
    },
    "allowImportingTsExtensions": true,
    "noEmit": true
  }
}
```

#### 4. `index.html`
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <title>CrediTrack - Personal Credit Card Manager & Sheets Sync</title>
    <meta name="description" content="Mobile-optimized personal credit card manager with PIN security, dynamic card trackers, Google Sheets two-way sync, and payment analytics." />
    <meta property="og:title" content="CrediTrack - Personal Credit Card Manager & Sheets Sync" />
    <meta property="og:description" content="Mobile-optimized personal credit card manager with PIN security, dynamic card trackers, Google Sheets two-way sync, and payment analytics." />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary_large_image" />
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

#### 5. `src/index.css`
```css
@import "tailwindcss";

@variant dark (&:where(.dark, .dark *));

@layer base {
  :root {
    color-scheme: light dark;
  }

  body {
    font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    -webkit-tap-highlight-color: transparent;
    user-select: none;
    -webkit-user-select: none;
    transition: background-color 0.2s ease, color 0.2s ease;
  }

  input, textarea, select {
    user-select: auto;
    -webkit-user-select: auto;
  }

  .font-mono {
    font-family: 'JetBrains Mono', monospace;
  }
}

/* Custom scrollbars for tables and drawers */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.4);
  border-radius: 9999px;
}
::-webkit-scrollbar-thumb:hover {
  background: rgba(100, 116, 139, 0.6);
}

.pb-safe {
  padding-bottom: env(safe-area-inset-bottom, 1rem);
}
.pt-safe {
  padding-top: env(safe-area-inset-top, 0.5rem);
}
```

#### 6. `src/main.tsx`
```typescript
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(<App />);
```

#### 7. `src/types/index.ts`
```typescript
export type TransactionType = 'Use' | 'Pay' | 'Interest/Fee';

export interface Transaction {
  id: string;
  cardId: string;
  month: string;
  date: string;
  type: TransactionType;
  amount: number;
  balance: number;
  description: string;
  syncedToSheet?: boolean;
  createdAt: number;
  updatedAt?: number;
}

export interface CardProfile {
  id: string;
  name: string;
  bankName: string;
  cardNumberMask: string;
  themeColor: 'emerald' | 'amber' | 'blue' | 'purple' | 'rose' | 'slate' | 'cyan';
  creditLimit?: number;
  billingDay?: number;
  sheetConfig?: CardSheetConfig;
  createdAt: number;
}

export interface CardSheetConfig {
  enabled: boolean;
  syncType: 'webhook' | 'sheets_api' | 'csv_import';
  sheetId?: string;
  sheetName?: string;
  webhookUrl?: string;
  apiKey?: string;
  lastSyncedAt?: number;
  lastSyncStatus?: 'success' | 'error' | 'syncing' | 'idle';
  lastSyncMessage?: string;
}

export interface MonthlyBreakdownRow {
  month: string;
  totalUse: number;
  totalInterestFee: number;
  totalPay: number;
  netChange: number;
  endingBalance: number;
  transactionCount: number;
}

export interface SecurityConfig {
  isPinSet: boolean;
  pinHash: string | null;
  pinLength: 4 | 6;
  lockTimeoutMinutes: number;
  lastActiveTimestamp: number;
  isLocked: boolean;
}

export interface ColumnMapping {
  monthCol: string;
  dateCol: string;
  typeCol: string;
  amountCol: string;
  balanceCol: string;
  descriptionCol: string;
}
```

#### 8. `src/utils/formatters.ts`
```typescript
export function formatCurrency(amount: number, showCurrency = false, currencyCode = 'Rs.'): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '0.00';
  }
  const formatted = Math.abs(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const prefix = amount < 0 ? '-' : '';
  if (showCurrency) {
    return `${prefix}${currencyCode} ${formatted}`;
  }
  return `${prefix}${formatted}`;
}

export function parseAmount(value: string | number): number {
  if (typeof value === 'number') return isNaN(value) ? 0 : value;
  if (!value) return 0;
  const clean = value.toString().replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(clean);
  return isNaN(parsed) ? 0 : Math.round(parsed * 100) / 100;
}

export function formatDateForSheet(dateStrOrObj: string | Date): string {
  if (!dateStrOrObj) return '';
  const date = typeof dateStrOrObj === 'string' ? new Date(dateStrOrObj) : dateStrOrObj;
  if (isNaN(date.getTime())) return typeof dateStrOrObj === 'string' ? dateStrOrObj : '';
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const y = date.getFullYear();
  return `${m}/${d}/${y}`;
}

export function getMonthLabel(dateStrOrObj: string | Date): string {
  const date = typeof dateStrOrObj === 'string' ? new Date(dateStrOrObj) : dateStrOrObj;
  if (isNaN(date.getTime())) return '';
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${date.getFullYear()} ${monthNames[date.getMonth()]}`;
}

export function normalizeTransactionType(typeStr: string): 'Use' | 'Pay' | 'Interest/Fee' {
  const lower = (typeStr || '').toLowerCase().trim();
  if (lower === 'pay' || lower.includes('payment') || lower.includes('credit')) {
    return 'Pay';
  }
  if (lower.includes('int') || lower.includes('fee') || lower.includes('interest')) {
    return 'Interest/Fee';
  }
  return 'Use';
}
```

#### 9. `src/utils/security.ts`
```typescript
import { SecurityConfig } from '../types';

const SECURITY_STORAGE_KEY = 'creditrack_security_config';

export async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + '_creditrack_salt_v1');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function getStoredSecurityConfig(): SecurityConfig {
  try {
    const raw = localStorage.getItem(SECURITY_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...parsed,
        isLocked: parsed.isPinSet ? true : false,
        lastActiveTimestamp: Date.now(),
      };
    }
  } catch (e) {
    console.error('Failed to parse security config from localStorage', e);
  }

  return {
    isPinSet: false,
    pinHash: null,
    pinLength: 4,
    lockTimeoutMinutes: 5,
    lastActiveTimestamp: Date.now(),
    isLocked: false,
  };
}

export function saveSecurityConfig(config: SecurityConfig): void {
  try {
    localStorage.setItem(SECURITY_STORAGE_KEY, JSON.stringify({
      isPinSet: config.isPinSet,
      pinHash: config.pinHash,
      pinLength: config.pinLength,
      lockTimeoutMinutes: config.lockTimeoutMinutes,
      lastActiveTimestamp: Date.now(),
    }));
  } catch (e) {
    console.error('Failed to save security config', e);
  }
}

export async function verifyPin(enteredPin: string, storedHash: string | null): Promise<boolean> {
  if (!storedHash) return false;
  const hash = await hashPin(enteredPin);
  return hash === storedHash;
}

export function clearSecurityConfig(): void {
  localStorage.removeItem(SECURITY_STORAGE_KEY);
}
```

#### 10. `src/utils/sheetsSync.ts`
```typescript
import { ColumnMapping, Transaction, TransactionType } from '../types';
import { formatDateForSheet, getMonthLabel, normalizeTransactionType, parseAmount } from './formatters';

export function parseDelimitedText(text: string): { headers: string[]; rows: string[][] } {
  if (!text || !text.trim()) {
    return { headers: [], rows: [] };
  }

  const lines = text.trim().split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };

  const firstLine = lines[0];
  const tabCount = (firstLine.match(/\t/g) || []).length;
  const commaCount = (firstLine.match(/,/g) || []).length;
  const delimiter = tabCount >= commaCount && tabCount > 0 ? '\t' : ',';

  const parseRow = (line: string): string[] => {
    if (delimiter === '\t') {
      return line.split('\t').map(c => c.trim().replace(/^["']|["']$/g, ''));
    }
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

  if (!mapping.monthCol && headers.length > 0) mapping.monthCol = headers[0];
  if (!mapping.dateCol && headers.length > 1) mapping.dateCol = headers[1];
  if (!mapping.typeCol && headers.length > 2) mapping.typeCol = headers[2];
  if (!mapping.amountCol && headers.length > 3) mapping.amountCol = headers[3];
  if (!mapping.balanceCol && headers.length > 4) mapping.balanceCol = headers[4];
  if (!mapping.descriptionCol && headers.length > 5) mapping.descriptionCol = headers[5];

  return mapping;
}

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
    if (amount <= 0 && !rawDesc) return;

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
        'Content-Type': 'text/plain;charset=utf-8',
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
```

#### 11. `src/data/initialData.ts`
```typescript
import { CardProfile, Transaction } from '../types';

export const INITIAL_CARDS: CardProfile[] = [
  {
    id: 'card-commercial-bank',
    name: 'Commercial Bank Mastercard',
    bankName: 'Commercial Bank',
    cardNumberMask: '•••• 7719',
    themeColor: 'amber',
    creditLimit: 300000,
    billingDay: 15,
    sheetConfig: {
      enabled: false,
      syncType: 'webhook',
      sheetName: 'Transactions',
      lastSyncStatus: 'idle',
    },
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 365,
  },
  {
    id: 'card-sampath-bank',
    name: 'Sampath Bank Visa Platinum',
    bankName: 'Sampath Bank',
    cardNumberMask: '•••• 3840',
    themeColor: 'emerald',
    creditLimit: 250000,
    billingDay: 28,
    sheetConfig: {
      enabled: false,
      syncType: 'webhook',
      sheetName: 'Sheet1',
      lastSyncStatus: 'idle',
    },
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 180,
  },
];

export function recalculateBalances(transactions: Transaction[], startingBalance = 0): Transaction[] {
  let running = startingBalance;
  return transactions.map((t) => {
    if (t.type === 'Pay') {
      running = Math.round((running - t.amount) * 100) / 100;
    } else {
      running = Math.round((running + t.amount) * 100) / 100;
    }
    return {
      ...t,
      balance: running,
    };
  });
}

export const COMMERCIAL_BANK_MONTHLY_HISTORY = [
  { month: '2025 Jul', use: 0, intFee: 2500.00, pay: 2500.00 },
  { month: '2025 Aug', use: 9845.00, intFee: 0, pay: 9845.00 },
  { month: '2025 Sep', use: 36999.18, intFee: 0, pay: 25624.18 },
  { month: '2025 Oct', use: 38197.13, intFee: 0, pay: 44292.13 },
  { month: '2025 Nov', use: 52008.66, intFee: 0, pay: 37648.00 },
  { month: '2025 Dec', use: 36366.56, intFee: 0, pay: 34212.66 },
  { month: '2026 Jan', use: 39046.16, intFee: 0, pay: 34894.56 },
  { month: '2026 Feb', use: 47700.28, intFee: 0, pay: 41923.28 },
  { month: '2026 Mar', use: 57169.83, intFee: 0, pay: 44189.16 },
  { month: '2026 Apr', use: 24314.78, intFee: 0, pay: 26550.00 },
  { month: '2026 May', use: 42765.84, intFee: 0, pay: 51488.36 },
  { month: '2026 June', use: 52720.81, intFee: 0, pay: 53042.00 },
  { month: '2026 July', use: 174984.46, intFee: 2500.00, pay: 147400.90 },
  { month: '2026 Aug', use: 177296.02, intFee: 0, pay: 189345.88 },
  { month: '2026 Sep', use: 67921.50, intFee: 0, pay: 71120.00 },
  { month: '2026 Oct', use: 64146.89, intFee: 0, pay: 84800.00 },
];

export const INITIAL_COMMERCIAL_TRANSACTIONS: Transaction[] = [
  { id: 'tx-407', cardId: 'card-commercial-bank', month: '2026 Aug', date: '8/11/2026', type: 'Use', amount: 4024.00, balance: 114925.34, description: 'Dominos pizza', createdAt: 1786440000000 },
  { id: 'tx-408', cardId: 'card-commercial-bank', month: '2026 Aug', date: '8/11/2026', type: 'Pay', amount: 8550.00, balance: 106375.34, description: 'paid', createdAt: 1786443600000 },
  { id: 'tx-409', cardId: 'card-commercial-bank', month: '2026 Aug', date: '8/12/2026', type: 'Pay', amount: 30000.00, balance: 76375.34, description: 'paid', createdAt: 1786526400000 },
  { id: 'tx-410', cardId: 'card-commercial-bank', month: '2026 Aug', date: '8/12/2026', type: 'Pay', amount: 8000.00, balance: 68375.34, description: 'paid', createdAt: 1786530000000 },
  { id: 'tx-411', cardId: 'card-commercial-bank', month: '2026 Aug', date: '8/12/2026', type: 'Use', amount: 2800.00, balance: 71175.34, description: 'ceb care', createdAt: 1786533600000 },
  { id: 'tx-412', cardId: 'card-commercial-bank', month: '2026 Aug', date: '8/12/2026', type: 'Use', amount: 302.55, balance: 71477.89, description: 'water board', createdAt: 1786537200000 },
  { id: 'tx-413', cardId: 'card-commercial-bank', month: '2026 Aug', date: '8/15/2026', type: 'Use', amount: 2310.00, balance: 73787.89, description: 'al mass', createdAt: 1786790400000 },
  { id: 'tx-414', cardId: 'card-commercial-bank', month: '2026 Aug', date: '8/15/2026', type: 'Use', amount: 300.00, balance: 74087.89, description: 'crib', createdAt: 1786794000000 },
  { id: 'tx-415', cardId: 'card-commercial-bank', month: '2026 Aug', date: '8/16/2026', type: 'Use', amount: 298.00, balance: 74385.89, description: 'reload amma', createdAt: 1786876800000 },
  { id: 'tx-416', cardId: 'card-commercial-bank', month: '2026 Aug', date: '8/16/2026', type: 'Use', amount: 121.00, balance: 74506.89, description: 'reload acchi', createdAt: 1786880400000 },
  { id: 'tx-417', cardId: 'card-commercial-bank', month: '2026 Aug', date: '8/16/2026', type: 'Pay', amount: 1600.00, balance: 72906.89, description: 'paid', createdAt: 1786884000000 },
  { id: 'tx-418', cardId: 'card-commercial-bank', month: '2026 Aug', date: '8/17/2026', type: 'Use', amount: 836.00, balance: 73742.89, description: 'relaod mahesha', createdAt: 1786963200000 },
  { id: 'tx-419', cardId: 'card-commercial-bank', month: '2026 Aug', date: '8/18/2026', type: 'Use', amount: 5000.00, balance: 78742.89, description: 'qr', createdAt: 1787049600000 },
  { id: 'tx-420', cardId: 'card-commercial-bank', month: '2026 Aug', date: '8/18/2026', type: 'Use', amount: 225.00, balance: 78967.89, description: 'relaod amalka', createdAt: 1787053200000 },
  { id: 'tx-421', cardId: 'card-commercial-bank', month: '2026 Aug', date: '8/18/2026', type: 'Use', amount: 6000.00, balance: 84967.89, description: 'qr', createdAt: 1787056800000 },
  { id: 'tx-422', cardId: 'card-commercial-bank', month: '2026 Aug', date: '8/18/2026', type: 'Pay', amount: 4000.00, balance: 80967.89, description: 'paid', createdAt: 1787060400000 },
  { id: 'tx-423', cardId: 'card-commercial-bank', month: '2026 Aug', date: '8/19/2026', type: 'Use', amount: 9000.00, balance: 89967.89, description: 'qr', createdAt: 1787136000000 },
  { id: 'tx-424', cardId: 'card-commercial-bank', month: '2026 Aug', date: '8/19/2026', type: 'Pay', amount: 7200.00, balance: 82767.89, description: 'paid', createdAt: 1787139600000 },
  { id: 'tx-425', cardId: 'card-commercial-bank', month: '2026 Aug', date: '8/20/2026', type: 'Pay', amount: 25000.00, balance: 57767.89, description: 'paid', createdAt: 1787222400000 },
  { id: 'tx-426', cardId: 'card-commercial-bank', month: '2026 Aug', date: '8/21/2026', type: 'Use', amount: 59.00, balance: 57826.89, description: 'reload mahesha', createdAt: 1787308800000 },
  { id: 'tx-427', cardId: 'card-commercial-bank', month: '2026 Aug', date: '8/21/2026', type: 'Use', amount: 486.00, balance: 58312.89, description: 'relaod Appachchi', createdAt: 1787312400000 },
  { id: 'tx-428', cardId: 'card-commercial-bank', month: '2026 Aug', date: '8/22/2026', type: 'Use', amount: 2250.00, balance: 60562.89, description: 'jeelan bag shop', createdAt: 1787395200000 },
  { id: 'tx-429', cardId: 'card-commercial-bank', month: '2026 Aug', date: '8/23/2026', type: 'Use', amount: 531.00, balance: 61093.89, description: 'watwr board', createdAt: 1787481600000 },
  { id: 'tx-430', cardId: 'card-commercial-bank', month: '2026 Aug', date: '8/23/2026', type: 'Use', amount: 65377.00, balance: 126470.89, description: 'redmi mobile', createdAt: 1787485200000 },
  { id: 'tx-431', cardId: 'card-commercial-bank', month: '2026 Aug', date: '8/24/2026', type: 'Use', amount: 159.00, balance: 126629.89, description: 'reload Isuru ayya', createdAt: 1787568000000 },
  { id: 'tx-432', cardId: 'card-commercial-bank', month: '2026 Aug', date: '8/24/2026', type: 'Use', amount: 5000.00, balance: 131629.89, description: 'qr', createdAt: 1787571600000 },
  { id: 'tx-433', cardId: 'card-commercial-bank', month: '2026 Aug', date: '8/25/2026', type: 'Pay', amount: 15000.00, balance: 116629.89, description: 'paid', createdAt: 1787654400000 },
  { id: 'tx-434', cardId: 'card-commercial-bank', month: '2026 Aug', date: '8/25/2026', type: 'Use', amount: 12000.00, balance: 128629.89, description: 'qr', createdAt: 1787658000000 },
  { id: 'tx-435', cardId: 'card-commercial-bank', month: '2026 Aug', date: '8/25/2026', type: 'Pay', amount: 12400.00, balance: 116229.89, description: 'paid', createdAt: 1787661600000 },
  { id: 'tx-436', cardId: 'card-commercial-bank', month: '2026 Aug', date: '8/26/2026', type: 'Use', amount: 888.00, balance: 117117.89, description: 'koko', createdAt: 1787740800000 },
  { id: 'tx-437', cardId: 'card-commercial-bank', month: '2026 Aug', date: '8/26/2026', type: 'Use', amount: 1826.43, balance: 118944.32, description: 'pizza hut', createdAt: 1787744400000 },
  { id: 'tx-438', cardId: 'card-commercial-bank', month: '2026 Aug', date: '8/26/2026', type: 'Pay', amount: 4500.00, balance: 114444.32, description: 'paid', createdAt: 1787748000000 },
  { id: 'tx-439', cardId: 'card-commercial-bank', month: '2026 Aug', date: '8/30/2026', type: 'Pay', amount: 4318.88, balance: 110125.44, description: 'paid', createdAt: 1788093600000 },
  { id: 'tx-440', cardId: 'card-commercial-bank', month: '2026 Aug', date: '8/30/2026', type: 'Pay', amount: 65377.00, balance: 44748.44, description: 'convert plan redmi mobile', createdAt: 1788097200000 },
  { id: 'tx-441', cardId: 'card-commercial-bank', month: '2026 Aug', date: '8/30/2026', type: 'Use', amount: 240.00, balance: 44988.44, description: "People's baker", createdAt: 1788100800000 },
  { id: 'tx-442', cardId: 'card-commercial-bank', month: '2026 Aug', date: '8/30/2026', type: 'Use', amount: 1249.00, balance: 46237.44, description: 'reload dhanushka ayya', createdAt: 1788104400000 },
  { id: 'tx-443', cardId: 'card-commercial-bank', month: '2026 Aug', date: '8/30/2026', type: 'Use', amount: 4996.16, balance: 51233.60, description: 'my phone p/plan 10 inst', createdAt: 1788108000000 },
  { id: 'tx-444', cardId: 'card-commercial-bank', month: '2026 Aug', date: '8/31/2026', type: 'Use', amount: 225.00, balance: 51458.60, description: 'reload pawani', createdAt: 1788180000000 },

  { id: 'tx-445', cardId: 'card-commercial-bank', month: '2026 Sep', date: '9/1/2026', type: 'Use', amount: 1590.00, balance: 53048.60, description: 'kfc', createdAt: 1788266400000 },
  { id: 'tx-446', cardId: 'card-commercial-bank', month: '2026 Sep', date: '9/1/2026', type: 'Use', amount: 797.00, balance: 53845.60, description: 'reload amma', createdAt: 1788270000000 },
  { id: 'tx-447', cardId: 'card-commercial-bank', month: '2026 Sep', date: '9/2/2026', type: 'Pay', amount: 2000.00, balance: 51845.60, description: 'paid', createdAt: 1788352800000 },
  { id: 'tx-448', cardId: 'card-commercial-bank', month: '2026 Sep', date: '9/2/2026', type: 'Use', amount: 1195.50, balance: 53041.10, description: 'payzy', createdAt: 1788356400000 },
  { id: 'tx-449', cardId: 'card-commercial-bank', month: '2026 Sep', date: '9/2/2026', type: 'Use', amount: 5000.00, balance: 58041.10, description: 'qr', createdAt: 1788360000000 },
  { id: 'tx-450', cardId: 'card-commercial-bank', month: '2026 Sep', date: '9/2/2026', type: 'Use', amount: 255.00, balance: 58296.10, description: 'reload amalka', createdAt: 1788363600000 },
  { id: 'tx-451', cardId: 'card-commercial-bank', month: '2026 Sep', date: '9/3/2026', type: 'Use', amount: 1598.00, balance: 59894.10, description: 'reload lakshika', createdAt: 1788439200000 },
  { id: 'tx-452', cardId: 'card-commercial-bank', month: '2026 Sep', date: '9/3/2026', type: 'Use', amount: 5448.05, balance: 65342.15, description: 'redmi 1 instalment', createdAt: 1788442800000 },
  { id: 'tx-453', cardId: 'card-commercial-bank', month: '2026 Sep', date: '9/4/2026', type: 'Use', amount: 800.00, balance: 66142.15, description: 'reload tv', createdAt: 1788525600000 },
  { id: 'tx-454', cardId: 'card-commercial-bank', month: '2026 Sep', date: '9/4/2026', type: 'Use', amount: 900.00, balance: 67042.15, description: 'MasterChef', createdAt: 1788529200000 },
  { id: 'tx-455', cardId: 'card-commercial-bank', month: '2026 Sep', date: '9/4/2026', type: 'Use', amount: 5000.00, balance: 72042.15, description: 'qr', createdAt: 1788532800000 },
  { id: 'tx-456', cardId: 'card-commercial-bank', month: '2026 Sep', date: '9/4/2026', type: 'Use', amount: 3000.00, balance: 75042.15, description: 'qr', createdAt: 1788536400000 },
  { id: 'tx-457', cardId: 'card-commercial-bank', month: '2026 Sep', date: '9/4/2026', type: 'Use', amount: 59.00, balance: 75101.15, description: 'reload mahesha', createdAt: 1788540000000 },
  { id: 'tx-458', cardId: 'card-commercial-bank', month: '2026 Sep', date: '9/5/2026', type: 'Use', amount: 488.00, balance: 75589.15, description: 'relaod nilupa', createdAt: 1788612000000 },
  { id: 'tx-459', cardId: 'card-commercial-bank', month: '2026 Sep', date: '9/5/2026', type: 'Use', amount: 50.00, balance: 75639.15, description: 'reload my hutch', createdAt: 1788615600000 },
  { id: 'tx-460', cardId: 'card-commercial-bank', month: '2026 Sep', date: '9/5/2026', type: 'Use', amount: 720.00, balance: 76359.15, description: 'daraz', createdAt: 1788619200000 },
  { id: 'tx-461', cardId: 'card-commercial-bank', month: '2026 Sep', date: '9/6/2026', type: 'Use', amount: 197.00, balance: 76556.15, description: 'reload mahesha', createdAt: 1788698400000 },
  { id: 'tx-462', cardId: 'card-commercial-bank', month: '2026 Sep', date: '9/6/2026', type: 'Pay', amount: 5700.00, balance: 70856.15, description: 'paid', createdAt: 1788702000000 },
  { id: 'tx-463', cardId: 'card-commercial-bank', month: '2026 Sep', date: '9/7/2026', type: 'Use', amount: 198.00, balance: 71054.15, description: 'reload mahesha', createdAt: 1788784800000 },
  { id: 'tx-464', cardId: 'card-commercial-bank', month: '2026 Sep', date: '9/7/2026', type: 'Use', amount: 4405.00, balance: 75459.15, description: 'qr mahesha', createdAt: 1788788400000 },
  { id: 'tx-465', cardId: 'card-commercial-bank', month: '2026 Oct', date: '10/2/2026', type: 'Use', amount: 18200.00, balance: 93659.15, description: 'Supermarket Groceries', createdAt: 1790944800000 },
  { id: 'tx-466', cardId: 'card-commercial-bank', month: '2026 Oct', date: '10/5/2026', type: 'Pay', amount: 50000.00, balance: 43659.15, description: 'Online Bill Settlement', createdAt: 1791204000000 },
  { id: 'tx-467', cardId: 'card-commercial-bank', month: '2026 Oct', date: '10/12/2026', type: 'Use', amount: 45946.89, balance: 89606.04, description: 'Electronics & Travel', createdAt: 1791808800000 },
  { id: 'tx-468', cardId: 'card-commercial-bank', month: '2026 Oct', date: '10/15/2026', type: 'Pay', amount: 34800.00, balance: 54806.04, description: 'Card Payment via CDM', createdAt: 1792068000000 },
];

export const INITIAL_SAMPATH_TRANSACTIONS: Transaction[] = [
  { id: 'tx-sp-101', cardId: 'card-sampath-bank', month: '2026 Sep', date: '9/5/2026', type: 'Use', amount: 15400.00, balance: 15400.00, description: 'Fuel & Highway Tolls', createdAt: 1788612000000 },
  { id: 'tx-sp-102', cardId: 'card-sampath-bank', month: '2026 Sep', date: '9/14/2026', type: 'Use', amount: 8250.00, balance: 23650.00, description: 'Dining out at Cinnamon', createdAt: 1789389600000 },
  { id: 'tx-sp-103', cardId: 'card-sampath-bank', month: '2026 Sep', date: '9/25/2026', type: 'Pay', amount: 20000.00, balance: 3650.00, description: 'Sampath Vishwa Transfer', createdAt: 1790340000000 },
  { id: 'tx-sp-104', cardId: 'card-sampath-bank', month: '2026 Oct', date: '10/3/2026', type: 'Use', amount: 12500.00, balance: 16150.00, description: 'Insurance Premium', createdAt: 1791031200000 },
  { id: 'tx-sp-105', cardId: 'card-sampath-bank', month: '2026 Oct', date: '10/10/2026', type: 'Interest/Fee', amount: 1200.00, balance: 17350.00, description: 'Annual Card Stamp Duty', createdAt: 1791636000000 },
];
```

#### 12. `src/App.tsx`
```typescript
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
import { syncTransactionToWebhook } from './utils/sheetsSync';

const CARDS_STORAGE_KEY = 'creditrack_cards_v1';
const TXS_STORAGE_KEY = 'creditrack_transactions_v1';

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

      setTransactionsByCard((prev) => {
        const existing = prev[cardId] || [];
        const newTx: Transaction = {
          ...txData,
          id: `tx-${Date.now()}`,
          balance: 0,
          createdAt: Date.now(),
          syncedToSheet: Boolean(targetCard?.sheetConfig?.webhookUrl),
        };
        const updatedList = recalculateBalances([...existing, newTx]);

        if (targetCard?.sheetConfig?.webhookUrl) {
          const finalTx = updatedList[updatedList.length - 1];
          syncTransactionToWebhook(targetCard.sheetConfig.webhookUrl, 'add', {
            transaction: finalTx,
            cardName: targetCard.name,
          });
        }

        return {
          ...prev,
          [cardId]: updatedList,
        };
      });
    },
    [cards]
  );

  const handleEditTransaction = useCallback(
    async (updatedTx: Transaction) => {
      const cardId = updatedTx.cardId;
      const targetCard = cards.find((c) => c.id === cardId);

      setTransactionsByCard((prev) => {
        const existing = prev[cardId] || [];
        const index = existing.findIndex((t) => t.id === updatedTx.id);
        if (index === -1) return prev;

        const updated = [...existing];
        updated[index] = updatedTx;
        const recalculated = recalculateBalances(updated);

        if (targetCard?.sheetConfig?.webhookUrl) {
          syncTransactionToWebhook(targetCard.sheetConfig.webhookUrl, 'syncAll', {
            transactions: recalculated,
            cardName: targetCard.name,
          });
        }

        return {
          ...prev,
          [cardId]: recalculated,
        };
      });
    },
    [cards]
  );

  const handleDeleteTransaction = useCallback(
    async (txToDelete: Transaction) => {
      const cardId = txToDelete.cardId;
      const targetCard = cards.find((c) => c.id === cardId);

      setTransactionsByCard((prev) => {
        const existing = prev[cardId] || [];
        const filtered = existing.filter((t) => t.id !== txToDelete.id);
        const recalculated = recalculateBalances(filtered);

        if (targetCard?.sheetConfig?.webhookUrl) {
          syncTransactionToWebhook(targetCard.sheetConfig.webhookUrl, 'delete', {
            transaction: txToDelete,
            cardName: targetCard.name,
          });
        }

        return {
          ...prev,
          [cardId]: recalculated,
        };
      });
    },
    [cards]
  );

  const handleImportTransactions = useCallback(
    (cardId: string, imported: Transaction[], mode: 'replace' | 'append') => {
      setTransactionsByCard((prev) => {
        const existing = prev[cardId] || [];
        const combined = mode === 'replace' ? imported : [...existing, ...imported];
        const recalculated = recalculateBalances(combined);
        return {
          ...prev,
          [cardId]: recalculated,
        };
      });
    },
    []
  );

  const handleResetToDefault = () => {
    setCards(INITIAL_CARDS);
    setTransactionsByCard({
      'card-commercial-bank': recalculateBalances(INITIAL_COMMERCIAL_TRANSACTIONS),
      'card-sampath-bank': recalculateBalances(INITIAL_SAMPATH_TRANSACTIONS),
    });
    setSelectedCardId(null);
  };

  const handleRestoreAllData = (
    restoredCards: CardProfile[],
    restoredTxs: Record<string, Transaction[]>
  ) => {
    setCards(restoredCards);
    setTransactionsByCard(restoredTxs);
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
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans antialiased transition-colors duration-200">
      <Header
        onLockApp={handleManualLock}
        onOpenGuide={() => setIsGuideOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onNavigateHome={() => setSelectedCardId(null)}
        activeView={selectedCardId ? 'tracker' : 'dashboard'}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 pt-5 pb-16">
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
          />
        ) : (
          <Dashboard
            cards={cards}
            transactionsByCard={transactionsByCard}
            onSelectCard={(card) => setSelectedCardId(card.id)}
            onAddCard={handleAddCard}
            onDeleteCard={handleDeleteCard}
            onOpenGuide={() => setIsGuideOpen(true)}
            theme={theme}
            onToggleTheme={handleToggleTheme}
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
        />
      )}
    </div>
  );
}
```

#### 13. `src/components/dashboard/Dashboard.tsx`
```typescript
import React, { useState, useMemo } from 'react';
import { 
  CreditCard, 
  Plus, 
  FileSpreadsheet, 
  TrendingUp, 
  TrendingDown, 
  ShieldCheck, 
  Sparkles, 
  ChevronRight, 
  CheckCircle2, 
  HelpCircle,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  PieChart,
  Trash2,
  AlertTriangle,
  Sun,
  Moon
} from 'lucide-react';
import { CardProfile, Transaction } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { AddCardModal } from './AddCardModal';

interface DashboardProps {
  cards: CardProfile[];
  transactionsByCard: Record<string, Transaction[]>;
  onSelectCard: (card: CardProfile) => void;
  onAddCard: (newCard: CardProfile) => void;
  onDeleteCard: (cardId: string) => void;
  onOpenGuide: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  cards,
  transactionsByCard,
  onSelectCard,
  onAddCard,
  onDeleteCard,
  onOpenGuide,
  theme,
  onToggleTheme,
}) => {
  const [isAddCardOpen, setIsAddCardOpen] = useState(false);
  const [cardToDelete, setCardToDelete] = useState<CardProfile | null>(null);

  const cardBalances = useMemo(() => {
    const balances: Record<string, number> = {};
    cards.forEach((card) => {
      const txs = transactionsByCard[card.id] || [];
      if (txs.length > 0) {
        balances[card.id] = txs[txs.length - 1].balance;
      } else {
        balances[card.id] = 0;
      }
    });
    return balances;
  }, [cards, transactionsByCard]);

  const totalOutstanding = useMemo(() => {
    return Object.values(cardBalances).reduce((acc, curr) => acc + curr, 0);
  }, [cardBalances]);

  const totalCreditLimit = useMemo(() => {
    return cards.reduce((acc, card) => acc + (card.creditLimit || 0), 0);
  }, [cards]);

  const getCardVisuals = (color: CardProfile['themeColor']) => {
    switch (color) {
      case 'amber':
        return {
          gradient: 'from-amber-600 via-amber-700 to-amber-900',
          accent: 'border-amber-400/30 shadow-amber-500/10',
          badge: 'bg-amber-400/20 text-amber-200',
        };
      case 'emerald':
        return {
          gradient: 'from-emerald-600 via-teal-700 to-emerald-900',
          accent: 'border-emerald-400/30 shadow-emerald-500/10',
          badge: 'bg-emerald-400/20 text-emerald-200',
        };
      case 'blue':
        return {
          gradient: 'from-blue-600 via-indigo-700 to-slate-900',
          accent: 'border-blue-400/30 shadow-blue-500/10',
          badge: 'bg-blue-400/20 text-blue-200',
        };
      case 'purple':
        return {
          gradient: 'from-purple-600 via-purple-700 to-indigo-950',
          accent: 'border-purple-400/30 shadow-purple-500/10',
          badge: 'bg-purple-400/20 text-purple-200',
        };
      case 'rose':
        return {
          gradient: 'from-rose-600 via-rose-700 to-rose-950',
          accent: 'border-rose-400/30 shadow-rose-500/10',
          badge: 'bg-rose-400/20 text-rose-200',
        };
      case 'cyan':
        return {
          gradient: 'from-cyan-600 via-cyan-700 to-slate-900',
          accent: 'border-cyan-400/30 shadow-cyan-500/10',
          badge: 'bg-cyan-400/20 text-cyan-200',
        };
      default:
        return {
          gradient: 'from-slate-700 via-slate-800 to-slate-950',
          accent: 'border-slate-500/30 shadow-slate-500/10',
          badge: 'bg-slate-400/20 text-slate-200',
        };
    }
  };

  return (
    <div className="space-y-6 pb-20">
      
      {/* Top Controls: Dark Mode / Light Mode Switch */}
      <div className="flex items-center justify-between px-1">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Portfolio Overview
          </span>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-200 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl shadow-sm">
          <button
            onClick={() => { if (theme !== 'light') onToggleTheme(); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              theme === 'light'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sun className="w-3.5 h-3.5 text-amber-500" />
            <span>Light</span>
          </button>
          <button
            onClick={() => { if (theme !== 'dark') onToggleTheme(); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              theme === 'dark'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Moon className="w-3.5 h-3.5 text-indigo-400" />
            <span>Dark</span>
          </button>
        </div>
      </div>

      {/* Combined Total Balance */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 border border-slate-200 dark:border-slate-800 shadow-xl dark:shadow-2xl relative overflow-hidden transition-colors">
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">
                Total Combined Outstanding Balance
              </span>
              <span className="text-[11px] text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800/40 px-2.5 py-0.5 rounded-full font-bold">
                {cards.length} Active Cards
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight">
              Rs. {formatCurrency(totalOutstanding)}
            </h1>

            {totalCreditLimit > 0 && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                Total Credit Limit: <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold">Rs. {formatCurrency(totalCreditLimit)}</span>
                <span className="text-slate-400 dark:text-slate-600"> · </span>
                Available Credit: <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">Rs. {formatCurrency(Math.max(totalCreditLimit - totalOutstanding, 0))}</span>
              </p>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsAddCardOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add New Card</span>
            </button>

            <button
              onClick={onOpenGuide}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-semibold transition-colors"
            >
              <HelpCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Sheets Setup</span>
            </button>
          </div>
        </div>
      </div>

      {/* Credit Cards Section Header */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Your Credit Cards</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Tap any card to open its dedicated tracker and spreadsheet sync</p>
        </div>

        <button
          onClick={() => setIsAddCardOpen(true)}
          className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Card</span>
        </button>
      </div>

      {/* Credit Cards Interactive Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cards.map((card) => {
          const balance = cardBalances[card.id] || 0;
          const visuals = getCardVisuals(card.themeColor);
          const txCount = (transactionsByCard[card.id] || []).length;
          const limit = card.creditLimit;
          const utilPct = limit ? Math.min(Math.round((balance / limit) * 100), 100) : null;

          return (
            <div
              key={card.id}
              onClick={() => onSelectCard(card)}
              className={`group relative p-5 sm:p-6 rounded-3xl bg-gradient-to-br ${visuals.gradient} border ${visuals.accent} shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer active:scale-[0.99] flex flex-col justify-between overflow-hidden`}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-7 rounded-md bg-amber-200/90 border border-amber-300/80 shadow-inner flex items-center justify-center">
                    <div className="w-6 h-4 border border-amber-500/50 rounded-sm" />
                  </div>
                  <span className="text-xs font-mono tracking-widest text-white/80">
                    {card.cardNumberMask}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${visuals.badge} tracking-wider uppercase`}>
                    {card.bankName}
                  </span>

                  {/* Delete Card Trigger */}
                  <button
                    type="button"
                    title="Delete this card"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCardToDelete(card);
                    }}
                    className="w-7 h-7 rounded-full bg-black/30 hover:bg-rose-600/80 text-white/70 hover:text-white flex items-center justify-center transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="space-y-1 mb-4">
                <h3 className="text-lg font-bold text-white group-hover:text-emerald-200 transition-colors">
                  {card.name}
                </h3>
                <div className="flex items-baseline justify-between pt-1">
                  <span className="text-xs text-white/70">Outstanding:</span>
                  <span className="text-xl font-extrabold text-white font-mono">
                    Rs. {formatCurrency(balance)}
                  </span>
                </div>
              </div>

              {limit && (
                <div className="space-y-1 pt-1 mb-3">
                  <div className="flex justify-between text-[11px] text-white/70">
                    <span>Limit: Rs. {formatCurrency(limit)}</span>
                    <span>{utilPct}% used</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-black/40 overflow-hidden">
                    <div
                      style={{ width: `${utilPct}%` }}
                      className="h-full bg-white/90 rounded-full"
                    />
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-white/80">
                <div className="flex items-center gap-2">
                  <span>{txCount} logged transactions</span>
                  {card.sheetConfig?.webhookUrl && (
                    <span className="flex items-center gap-1 text-[10px] text-emerald-300 font-semibold">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Sync Enabled</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 font-semibold group-hover:translate-x-1 transition-transform">
                  <span>View Tracker</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div
        onClick={() => setIsAddCardOpen(true)}
        className="p-4 sm:p-5 rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-800 hover:border-emerald-500/50 bg-slate-50 dark:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-900/80 transition-all cursor-pointer flex items-center justify-center gap-3 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
      >
        <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
          <Plus className="w-5 h-5" />
        </div>
        <div className="text-left">
          <p className="text-xs font-bold text-slate-900 dark:text-white">Add Another Bank Card</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Create a tracker for HNB, Seylan, HSBC, or any other bank</p>
        </div>
      </div>

      <AddCardModal
        isOpen={isAddCardOpen}
        onClose={() => setIsAddCardOpen(false)}
        onAddCard={onAddCard}
      />

      {/* Delete Card Confirmation Modal */}
      {cardToDelete && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl animate-scaleUp">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              Delete {cardToDelete.name}?
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
              This will permanently delete this card profile along with its entire transaction log (
              <strong className="text-slate-900 dark:text-white">
                {(transactionsByCard[cardToDelete.id] || []).length} records
              </strong>
              ). This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setCardToDelete(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteCard(cardToDelete.id);
                  setCardToDelete(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-semibold text-white shadow-lg shadow-rose-600/30"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
```

#### 14. `src/components/tracker/CardDetailView.tsx`
```typescript
import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, 
  Plus, 
  FileSpreadsheet, 
  BarChart3, 
  ListFilter, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Settings, 
  Sparkles,
  Layers,
  HelpCircle,
  TrendingDown,
  TrendingUp,
  CreditCard,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { CardProfile, Transaction } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { TransactionTable } from './TransactionTable';
import { MonthlyBreakdown } from './MonthlyBreakdown';
import { AnalyticsChart } from './AnalyticsChart';
import { TransactionModal } from './TransactionModal';
import { ImportSheetModal } from '../sheets/ImportSheetModal';
import { syncTransactionToWebhook } from '../../utils/sheetsSync';

interface CardDetailViewProps {
  card: CardProfile;
  transactions: Transaction[];
  onBack: () => void;
  onAddTransaction: (tx: Omit<Transaction, 'id' | 'balance' | 'createdAt'>) => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (tx: Transaction) => void;
  onDeleteCard: (cardId: string) => void;
  onImportTransactions: (imported: Transaction[], mode: 'replace' | 'append') => void;
  onUpdateCardConfig: (cardId: string, updatedConfig: Partial<CardProfile>) => void;
  onOpenGuide: () => void;
}

export const CardDetailView: React.FC<CardDetailViewProps> = ({
  card,
  transactions,
  onBack,
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction,
  onDeleteCard,
  onImportTransactions,
  onUpdateCardConfig,
  onOpenGuide,
}) => {
  const [activeTab, setActiveTab] = useState<'transactions' | 'monthly' | 'analytics'>('transactions');
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);
  const [isSyncingLive, setIsSyncingLive] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const currentOutstanding = useMemo(() => {
    if (transactions.length === 0) return 0;
    const last = transactions[transactions.length - 1];
    return last ? last.balance : 0;
  }, [transactions]);

  const utilizationPct = card.creditLimit
    ? Math.min(Math.round((currentOutstanding / card.creditLimit) * 100), 100)
    : null;

  const handleOpenAddTx = () => {
    setEditingTx(null);
    setIsTxModalOpen(true);
  };

  const handleOpenEditTx = (tx: Transaction) => {
    setEditingTx(tx);
    setIsTxModalOpen(true);
  };

  const handleSaveTx = async (txData: Omit<Transaction, 'id' | 'balance' | 'createdAt'>) => {
    if (editingTx) {
      onEditTransaction({
        ...editingTx,
        ...txData,
        updatedAt: Date.now(),
      });
    } else {
      onAddTransaction(txData);
    }
  };

  const handleSyncAllToSheet = async () => {
    if (!card.sheetConfig?.webhookUrl) {
      setIsImportModalOpen(true);
      return;
    }
    setIsSyncingLive(true);
    setSyncStatusMsg('Syncing to Google Sheet...');
    const res = await syncTransactionToWebhook(card.sheetConfig.webhookUrl, 'syncAll', {
      transactions,
      cardName: card.name,
    });
    setIsSyncingLive(false);
    if (res.success) {
      setSyncStatusMsg('All records synced to Google Sheet!');
      onUpdateCardConfig(card.id, {
        sheetConfig: {
          ...card.sheetConfig,
          lastSyncedAt: Date.now(),
          lastSyncStatus: 'success',
        },
      });
      setTimeout(() => setSyncStatusMsg(null), 3000);
    } else {
      setSyncStatusMsg(`Sync error: ${res.message}`);
      setTimeout(() => setSyncStatusMsg(null), 4000);
    }
  };

  const getThemeGradient = (color: CardProfile['themeColor']) => {
    switch (color) {
      case 'amber':
        return 'from-amber-600/30 via-slate-900 to-slate-950 border-amber-500/30';
      case 'emerald':
        return 'from-emerald-600/30 via-slate-900 to-slate-950 border-emerald-500/30';
      case 'blue':
        return 'from-blue-600/30 via-slate-900 to-slate-950 border-blue-500/30';
      case 'purple':
        return 'from-purple-600/30 via-slate-900 to-slate-950 border-purple-500/30';
      case 'rose':
        return 'from-rose-600/30 via-slate-900 to-slate-950 border-rose-500/30';
      case 'cyan':
        return 'from-cyan-600/30 via-slate-900 to-slate-950 border-cyan-500/30';
      default:
        return 'from-slate-700/30 via-slate-900 to-slate-950 border-slate-700/40';
    }
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Top Navigation & Breadcrumb */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-xs font-semibold">All Cards</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Import Sheet Action */}
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-emerald-600 dark:text-emerald-400 transition-colors shadow-sm"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Import Sheet</span>
          </button>

          {/* Sync Button */}
          <button
            onClick={handleSyncAllToSheet}
            disabled={isSyncingLive}
            title={card.sheetConfig?.webhookUrl ? 'Sync with connected Google Sheet' : 'Configure Google Sheet'}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingLive ? 'animate-spin text-emerald-500' : ''}`} />
            <span className="hidden sm:inline">
              {card.sheetConfig?.webhookUrl ? 'Sync Sheet' : 'Connect Sheet'}
            </span>
          </button>

          {/* Guide */}
          <button
            onClick={onOpenGuide}
            title="Google Sheets & API Keys Guide"
            className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors shadow-sm"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* Delete Card */}
          <button
            onClick={() => setShowDeleteConfirm(true)}
            title="Delete this credit card"
            className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors shadow-sm"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Sync Status Banner */}
      {syncStatusMsg && (
        <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 animate-fadeIn shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{syncStatusMsg}</span>
          </div>
        </div>
      )}

      {/* Card Detail Hero Header */}
      <div
        className={`p-6 rounded-3xl bg-gradient-to-br ${getThemeGradient(
          card.themeColor
        )} border shadow-2xl relative overflow-hidden`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
                {card.bankName}
              </span>
              <span className="text-xs text-slate-500 font-mono">
                {card.cardNumberMask}
              </span>
              {card.sheetConfig?.enabled && (
                <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded-full font-medium">
                  <CheckCircle2 className="w-2.5 h-2.5" />
                  <span>Sheet Connected</span>
                </span>
              )}
            </div>

            <h1 className="text-2xl font-bold text-white tracking-tight mt-1">
              {card.name}
            </h1>
          </div>

          <div className="sm:text-right">
            <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">
              Current Outstanding Balance
            </p>
            <p className="text-2xl sm:text-3xl font-extrabold text-white font-mono mt-0.5">
              Rs. {formatCurrency(currentOutstanding)}
            </p>
          </div>
        </div>

        {card.creditLimit && (
          <div className="mt-5 pt-4 border-t border-slate-800/60 space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">
                Limit: <strong className="text-slate-200 font-mono">Rs. {formatCurrency(card.creditLimit)}</strong>
              </span>
              <span className="text-slate-400">
                Available: <strong className="text-emerald-400 font-mono">Rs. {formatCurrency(card.creditLimit - currentOutstanding)}</strong> ({100 - (utilizationPct || 0)}%)
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden">
              <div
                style={{ width: `${utilizationPct}%` }}
                className={`h-full transition-all duration-500 ${
                  (utilizationPct || 0) > 80
                    ? 'bg-rose-500'
                    : (utilizationPct || 0) > 50
                    ? 'bg-amber-400'
                    : 'bg-emerald-500'
                }`}
              />
            </div>
          </div>
        )}
      </div>

      {/* Main View Segmented Switcher */}
      <div className="flex items-center p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl gap-1 shadow-sm">
        <button
          onClick={() => setActiveTab('transactions')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'transactions'
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <ListFilter className="w-3.5 h-3.5" />
          <span>Transactions ({transactions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('monthly')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'monthly'
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Monthly Breakdown</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'analytics'
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Analytics Chart</span>
        </button>
      </div>

      {/* Active Tab Content */}
      {activeTab === 'transactions' && (
        <TransactionTable
          transactions={transactions}
          onEdit={handleOpenEditTx}
          onDelete={onDeleteTransaction}
        />
      )}

      {activeTab === 'monthly' && (
        <MonthlyBreakdown
          cardId={card.id}
          transactions={transactions}
        />
      )}

      {activeTab === 'analytics' && (
        <AnalyticsChart
          cardId={card.id}
          transactions={transactions}
        />
      )}

      {/* Floating Action Button (FAB) */}
      <button
        onClick={handleOpenAddTx}
        title="Add New Transaction"
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 shadow-xl shadow-emerald-500/40 flex items-center justify-center transition-all duration-200"
      >
        <Plus className="w-7 h-7 stroke-[2.5]" />
      </button>

      {/* Modals */}
      <TransactionModal
        card={card}
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        onSave={handleSaveTx}
        editingTransaction={editingTx}
        currentBalance={currentOutstanding}
      />

      <ImportSheetModal
        card={card}
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportComplete={onImportTransactions}
        onUpdateCardConfig={onUpdateCardConfig}
        onOpenGuide={onOpenGuide}
      />

      {/* Delete Card Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl animate-scaleUp">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              Delete {card.name}?
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
              Are you sure you want to delete this card and its entire transaction ledger (
              <strong className="text-slate-900 dark:text-white">
                {transactions.length} records
              </strong>
              )? This action is permanent and cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  onDeleteCard(card.id);
                  onBack();
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-semibold text-white shadow-lg shadow-rose-600/30"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
```
