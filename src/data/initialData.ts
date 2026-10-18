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

// Helper to calculate running balances chronologically
export function recalculateBalances(transactions: Transaction[], startingBalance = 0): Transaction[] {
  let running = startingBalance;
  return transactions.map((t) => {
    if (t.type === 'Pay') {
      running = Math.round((running - t.amount) * 100) / 100;
    } else {
      // Use or Interest/Fee adds to debt
      running = Math.round((running + t.amount) * 100) / 100;
    }
    return {
      ...t,
      balance: running,
    };
  });
}

// Monthly history data matching Image 2 exactly
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
  // 2026 Aug transactions matching user's Image 1
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

  // 2026 Sep transactions matching user's Image 1
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

  // 2026 Oct sample ongoing transactions
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
