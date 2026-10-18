/**
 * Formats a number with comma separators and 2 decimal places.
 * Example: 114925.34 -> "114,925.34"
 */
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

/**
 * Parses user input amount string (stripping commas, spaces, currency symbols)
 */
export function parseAmount(value: string | number): number {
  if (typeof value === 'number') return isNaN(value) ? 0 : value;
  if (!value) return 0;
  const clean = value.toString().replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(clean);
  return isNaN(parsed) ? 0 : Math.round(parsed * 100) / 100;
}

/**
 * Formats a Date object or ISO string into "M/D/YYYY" matching the sheet
 */
export function formatDateForSheet(dateStrOrObj: string | Date): string {
  if (!dateStrOrObj) return '';
  const date = typeof dateStrOrObj === 'string' ? new Date(dateStrOrObj) : dateStrOrObj;
  if (isNaN(date.getTime())) return typeof dateStrOrObj === 'string' ? dateStrOrObj : '';
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const y = date.getFullYear();
  return `${m}/${d}/${y}`;
}

/**
 * Returns month label in the format "2026 Aug"
 */
export function getMonthLabel(dateStrOrObj: string | Date): string {
  const date = typeof dateStrOrObj === 'string' ? new Date(dateStrOrObj) : dateStrOrObj;
  if (isNaN(date.getTime())) return '';
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${date.getFullYear()} ${monthNames[date.getMonth()]}`;
}

/**
 * Normalizes transaction type string to 'Use' | 'Pay' | 'Interest/Fee'
 */
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
