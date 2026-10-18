export type TransactionType = 'Use' | 'Pay' | 'Interest/Fee';

export interface Transaction {
  id: string;
  cardId: string;
  month: string; // e.g. "2026 Aug"
  date: string;  // e.g. "8/11/2026" or "2026-08-11"
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
  cardNumberMask: string; // e.g. "•••• 4892"
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
