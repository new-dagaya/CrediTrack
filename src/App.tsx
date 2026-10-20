import React, { useState, useEffect, useCallback } from 'react';
import { CardProfile, SecurityConfig, Transaction } from './types';
import { 
  getStoredSecurityConfig, 
  saveSecurityConfig,
  hasUserConfiguredPin,
  recordLeaveTimestamp,
  shouldAutoLockOnReturn,
  clearLeaveTimestamp
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
import { GoogleOAuthConsentModal } from './components/common/GoogleOAuthConsentModal';
import { 
  initAuth, 
  googleSignIn, 
  googleSignOut, 
  getAccessToken 
} from './utils/googleAuth';
import { 
  checkSpreadsheetExists,
  loadDataFromGoogleSpreadsheet,
  createTrackingSpreadsheet,
  syncSingleCardTabToGoogleSheet,
  saveCardMetadataToGoogleSheet,
  ensureCardTabExists,
  deleteCardTabFromGoogleSheet,
  renameCardTabInGoogleSheet,
  getCardTabTitle,
  performFullManualSync,
  SPREADSHEET_NAME,
  GoogleSpreadsheetInfo 
} from './utils/googleDriveSync';

export interface GoogleUserInfo {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

// User-scoped storage key helpers
const getCardsStorageKey = (uid?: string | null) => `creditrack_cards_${uid || 'guest'}`;
const getTxsStorageKey = (uid?: string | null) => `creditrack_transactions_${uid || 'guest'}`;
const getSheetInfoStorageKey = (uid?: string | null) => `creditrack_sheet_info_${uid || 'guest'}`;

function loadUserCards(uid?: string | null): CardProfile[] {
  try {
    const stored = localStorage.getItem(getCardsStorageKey(uid));
    if (stored) return JSON.parse(stored);
    if (!uid) {
      const legacy = localStorage.getItem('creditrack_cards_v1');
      if (legacy) return JSON.parse(legacy);
    }
  } catch (e) {
    console.error('Failed to load user cards', e);
  }
  return INITIAL_CARDS;
}

function loadUserTransactions(uid?: string | null): Record<string, Transaction[]> {
  try {
    const stored = localStorage.getItem(getTxsStorageKey(uid));
    if (stored) return JSON.parse(stored);
    if (!uid) {
      const legacy = localStorage.getItem('creditrack_transactions_v1');
      if (legacy) return JSON.parse(legacy);
    }
  } catch (e) {
    console.error('Failed to load user transactions', e);
  }
  return {
    'card-commercial-bank': recalculateBalances(INITIAL_COMMERCIAL_TRANSACTIONS),
    'card-sampath-bank': recalculateBalances(INITIAL_SAMPATH_TRANSACTIONS),
  };
}

function loadUserSheetInfo(uid?: string | null): GoogleSpreadsheetInfo | null {
  try {
    const stored = localStorage.getItem(getSheetInfoStorageKey(uid));
    if (stored) return JSON.parse(stored);
    if (!uid) {
      const legacy = localStorage.getItem('creditrack_google_sheet_info');
      if (legacy) return JSON.parse(legacy);
    }
  } catch (e) {
    console.error('Failed to load sheet info', e);
  }
  return null;
}

export default function App() {
  // 1. Google Drive & User Identity State
  const [googleUser, setGoogleUser] = useState<GoogleUserInfo | null>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [spreadsheetInfo, setSpreadsheetInfo] = useState<GoogleSpreadsheetInfo | null>(() => loadUserSheetInfo(null));
  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false);
  const [isSyncingGoogle, setIsSyncingGoogle] = useState(false);

  // 2. Security & Lock State (per user)
  const [securityConfig, setSecurityConfig] = useState<SecurityConfig>(() => getStoredSecurityConfig(null));
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    const config = getStoredSecurityConfig(null);
    return config.isPinSet ? true : true;
  });

  // 3. Credit Cards & Transactions State
  const [cards, setCards] = useState<CardProfile[]>(() => loadUserCards(null));
  const [transactionsByCard, setTransactionsByCard] = useState<Record<string, Transaction[]>>(() => loadUserTransactions(null));

  // 4. View Navigation State
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [bottomNavTab, setBottomNavTab] = useState<'dashboard' | 'cards' | 'guide' | 'settings'>('dashboard');

  // 5. Google Drive OAuth Consent Prompt State
  const [isConsentModalOpen, setIsConsentModalOpen] = useState(false);

  // 6. Android 15 Widget Shortcut Auto-Trigger
  const [autoOpenTxCardId, setAutoOpenTxCardId] = useState<string | null>(null);

  // Android 15 Home Screen Widget Shortcut deep link handling (?action=add_tx&cardId=...)
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const action = urlParams.get('action');
      const targetCardId = urlParams.get('cardId');
      if (action === 'add_tx' && targetCardId) {
        setSelectedCardId(targetCardId);
        setAutoOpenTxCardId(targetCardId);
        window.history.replaceState({}, '', window.location.pathname);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // 7. Theme State (Dark / Light Mode)
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const stored = localStorage.getItem('creditrack_theme');
      if (stored === 'light' || stored === 'dark') return stored;
    } catch (e) {
      console.error(e);
    }
    return 'light';
  });

  // Apply theme class to <html>
  useEffect(() => {
    try {
      localStorage.setItem('creditrack_theme', theme);
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
      }
    } catch (e) {
      console.error(e);
    }
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Sync state to user-scoped local storage
  useEffect(() => {
    try {
      localStorage.setItem(getCardsStorageKey(googleUser?.uid), JSON.stringify(cards));
    } catch (e) {
      console.error(e);
    }
  }, [cards, googleUser?.uid]);

  useEffect(() => {
    try {
      localStorage.setItem(getTxsStorageKey(googleUser?.uid), JSON.stringify(transactionsByCard));
    } catch (e) {
      console.error(e);
    }
  }, [transactionsByCard, googleUser?.uid]);

  useEffect(() => {
    try {
      const key = getSheetInfoStorageKey(googleUser?.uid);
      if (spreadsheetInfo) {
        localStorage.setItem(key, JSON.stringify(spreadsheetInfo));
      } else {
        localStorage.removeItem(key);
      }
    } catch (e) {
      console.error(e);
    }
  }, [spreadsheetInfo, googleUser?.uid]);

  // AUTO-LOAD OR INITIALIZE GOOGLE DRIVE DATA
  const handleAutoLoadOrInitDrive = useCallback(
    async (token: string, uid?: string | null) => {
      setIsConnectingGoogle(true);
      setIsSyncingGoogle(true);
      try {
        // 1. Scan Google Drive to check if "CrediTrack_Card_Manager" already exists
        const search = await checkSpreadsheetExists(token);

        if (search.exists && search.file) {
          // If found, automatically read and load all previously saved credit card configurations,
          // structural tabs, and logged transactions into the app dashboard context
          const loaded = await loadDataFromGoogleSpreadsheet(token, search.file.id);

          if (loaded.cards && loaded.cards.length > 0) {
            setCards(loaded.cards);
            setTransactionsByCard(loaded.transactionsByCard);

            try {
              localStorage.setItem(getCardsStorageKey(uid), JSON.stringify(loaded.cards));
              localStorage.setItem(getTxsStorageKey(uid), JSON.stringify(loaded.transactionsByCard));
            } catch (e) {
              console.error('Failed caching loaded cards locally:', e);
            }

            const info: GoogleSpreadsheetInfo = {
              spreadsheetId: search.file.id,
              webViewLink: search.file.webViewLink,
              title: search.file.name || SPREADSHEET_NAME,
              lastSyncedAt: Date.now(),
              lastSyncStatus: 'success',
              syncedTabs: loaded.cards.map(getCardTabTitle),
            };
            setSpreadsheetInfo(info);
            return;
          }
        }

        // If it does not exist, only then create a new tracking spreadsheet structure
        const userCards = loadUserCards(uid);
        const userTxs = loadUserTransactions(uid);
        setCards(userCards);
        setTransactionsByCard(userTxs);

        const created = await createTrackingSpreadsheet(token, userCards, userTxs);
        setSpreadsheetInfo(created);
      } catch (err: any) {
        console.error('Google Drive auto-load/initialization failed:', err);
        setSpreadsheetInfo((prev) =>
          prev
            ? { ...prev, lastSyncStatus: 'error', lastError: err?.message }
            : null
        );
      } finally {
        setIsConnectingGoogle(false);
        setIsSyncingGoogle(false);
      }
    },
    []
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
        if (token) {
          setGoogleToken(token);
        }

        const hasPin = hasUserConfiguredPin(user.uid);
        const userSec = getStoredSecurityConfig(user.uid);
        setSecurityConfig(userSec);

        // Load isolated user cached data initially
        setCards(loadUserCards(user.uid));
        setTransactionsByCard(loadUserTransactions(user.uid));
        setSpreadsheetInfo(loadUserSheetInfo(user.uid));

        if (!hasPin) {
          setIsLocked(true);
        } else {
          setIsLocked(userSec.isPinSet ? true : false);
        }

        // Automatically scan Google Drive and load existing spreadsheet or create if needed
        if (token) {
          await handleAutoLoadOrInitDrive(token, user.uid);
        }
      },
      () => {
        setGoogleUser(null);
        setGoogleToken(null);
      }
    );
    return () => unsubscribe();
  }, [handleAutoLoadOrInitDrive]);

  // Delayed Auto-Lock when leaving or minimizing the app
  useEffect(() => {
    if (!securityConfig.isPinSet || isLocked) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        recordLeaveTimestamp();
      } else if (document.visibilityState === 'visible') {
        const timeout = securityConfig.lockTimeoutMinutes || 2;
        if (shouldAutoLockOnReturn(timeout)) {
          setIsLocked(true);
        }
        clearLeaveTimestamp();
      }
    };

    const handleWindowBlur = () => {
      recordLeaveTimestamp();
    };

    const handleWindowFocus = () => {
      const timeout = securityConfig.lockTimeoutMinutes || 2;
      if (shouldAutoLockOnReturn(timeout)) {
        setIsLocked(true);
      }
      clearLeaveTimestamp();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [securityConfig, isLocked]);

  // Delayed Inactivity Timer
  useEffect(() => {
    if (!securityConfig.isPinSet || isLocked) return;

    let timeoutId: any;
    const resetTimer = () => {
      clearTimeout(timeoutId);
      const minutes = securityConfig.lockTimeoutMinutes || 2;
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

  // Google Sign-In Consent Gate
  const handleRequestSignInGoogle = () => {
    setIsConsentModalOpen(true);
  };

  const handleConfirmConsentAndSignIn = async () => {
    setIsConsentModalOpen(false);
    await handleSignInGoogle();
  };

  // Google Sign In handler
  const handleSignInGoogle = async () => {
    setIsConnectingGoogle(true);
    try {
      const authResult = await googleSignIn();
      if (!authResult) return;

      const user = authResult.user;
      const token = authResult.accessToken;

      const userInfo: GoogleUserInfo = {
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
      };
      setGoogleUser(userInfo);
      setGoogleToken(token);

      const hasPin = hasUserConfiguredPin(user.uid);
      const userSec = getStoredSecurityConfig(user.uid);
      setSecurityConfig(userSec);

      if (!hasPin) {
        setIsLocked(true);
      }

      // Automatically scan Google Drive and auto-load existing data or create new
      await handleAutoLoadOrInitDrive(token, user.uid);
    } catch (err: any) {
      console.error('Google Sign-In failed:', err);
      alert(`Google Drive error: ${err?.message || 'Could not complete Google setup.'}`);
    } finally {
      setIsConnectingGoogle(false);
    }
  };

  const handleSignOutGoogle = async () => {
    await googleSignOut();
    setGoogleUser(null);
    setGoogleToken(null);
    setSpreadsheetInfo(null);
    const guestSec = getStoredSecurityConfig(null);
    setSecurityConfig(guestSec);
    setIsLocked(guestSec.isPinSet ? true : false);
    setCards(loadUserCards(null));
    setTransactionsByCard(loadUserTransactions(null));
  };

  // REAL-TIME AUTOMATIC BACKGROUND SYNC HELPERS
  const syncCardInBackground = useCallback(
    async (targetCard: CardProfile, updatedCardTxs: Transaction[]) => {
      let token = googleToken;
      if (!token) {
        token = await getAccessToken();
      }
      const sheetId = spreadsheetInfo?.spreadsheetId;
      if (!token || !sheetId) return;

      setIsSyncingGoogle(true);
      try {
        await syncSingleCardTabToGoogleSheet(token, sheetId, targetCard, updatedCardTxs);
        setSpreadsheetInfo((prev) =>
          prev
            ? {
                ...prev,
                lastSyncedAt: Date.now(),
                lastSyncStatus: 'success',
              }
            : null
        );
      } catch (err: any) {
        console.error('Real-time background sync failed for card:', targetCard.name, err);
        setSpreadsheetInfo((prev) =>
          prev
            ? {
                ...prev,
                lastSyncStatus: 'error',
                lastError: err?.message,
              }
            : null
        );
      } finally {
        setIsSyncingGoogle(false);
      }
    },
    [googleToken, spreadsheetInfo?.spreadsheetId]
  );

  const syncStructureInBackground = useCallback(
    async (
      action: 'add' | 'edit' | 'delete',
      card: CardProfile,
      allCards: CardProfile[],
      oldTitle?: string
    ) => {
      let token = googleToken;
      if (!token) {
        token = await getAccessToken();
      }
      const sheetId = spreadsheetInfo?.spreadsheetId;
      if (!token || !sheetId) return;

      setIsSyncingGoogle(true);
      try {
        if (action === 'add') {
          await ensureCardTabExists(token, sheetId, card);
          await saveCardMetadataToGoogleSheet(token, sheetId, allCards);
        } else if (action === 'delete') {
          await deleteCardTabFromGoogleSheet(token, sheetId, card);
          await saveCardMetadataToGoogleSheet(token, sheetId, allCards);
        } else if (action === 'edit') {
          if (oldTitle && oldTitle !== getCardTabTitle(card)) {
            await renameCardTabInGoogleSheet(token, sheetId, oldTitle, getCardTabTitle(card));
          }
          await saveCardMetadataToGoogleSheet(token, sheetId, allCards);
        }
        setSpreadsheetInfo((prev) =>
          prev
            ? {
                ...prev,
                lastSyncedAt: Date.now(),
                lastSyncStatus: 'success',
                syncedTabs: allCards.map(getCardTabTitle),
              }
            : null
        );
      } catch (err: any) {
        console.error('Real-time background structure sync failed:', err);
        setSpreadsheetInfo((prev) =>
          prev
            ? {
                ...prev,
                lastSyncStatus: 'error',
                lastError: err?.message,
              }
            : null
        );
      } finally {
        setIsSyncingGoogle(false);
      }
    },
    [googleToken, spreadsheetInfo?.spreadsheetId]
  );

  // FORCED IMMEDIATE MANUAL SYNCHRONIZATION WITH GOOGLE DRIVE
  const handleManualSyncNow = async () => {
    let token = googleToken;
    if (!token) {
      try {
        token = await getAccessToken();
      } catch (e) {
        console.warn('Could not retrieve existing token:', e);
      }
    }

    if (!token) {
      // If user has not connected Google account yet, trigger Google OAuth flow
      handleRequestSignInGoogle();
      return;
    }

    setIsSyncingGoogle(true);
    try {
      const syncResult = await performFullManualSync(token, cards, transactionsByCard);
      if (syncResult.success) {
        setCards(syncResult.cards);
        setTransactionsByCard(syncResult.transactionsByCard);
        setSpreadsheetInfo(syncResult.spreadsheetInfo);

        // Cache locally for isolated user session
        try {
          localStorage.setItem(getCardsStorageKey(googleUser?.uid), JSON.stringify(syncResult.cards));
          localStorage.setItem(getTxsStorageKey(googleUser?.uid), JSON.stringify(syncResult.transactionsByCard));
          localStorage.setItem(getSheetInfoStorageKey(googleUser?.uid), JSON.stringify(syncResult.spreadsheetInfo));
        } catch (storageErr) {
          console.warn('Failed caching updated cards after manual sync:', storageErr);
        }
      }
    } catch (err: any) {
      console.error('Manual synchronization failed:', err);
      setSpreadsheetInfo((prev) =>
        prev
          ? { ...prev, lastSyncStatus: 'error', lastError: err?.message || 'Manual synchronization failed' }
          : null
      );
    } finally {
      setIsSyncingGoogle(false);
    }
  };

  // PIN security unlock handlers
  const handleUnlockSuccess = () => {
    setIsLocked(false);
  };

  const handlePinConfigured = (newConfig: SecurityConfig) => {
    saveSecurityConfig(newConfig, googleUser?.uid);
    setSecurityConfig(newConfig);
    setIsLocked(false);
  };

  const handleManualLock = () => {
    setIsLocked(true);
  };

  // Card Management handlers with real-time automatic background sync
  const handleAddCard = async (newCard: CardProfile) => {
    const updatedCards = [...cards, newCard];
    setCards(updatedCards);
    setTransactionsByCard((prev) => ({
      ...prev,
      [newCard.id]: [],
    }));
    setSelectedCardId(newCard.id);
    syncStructureInBackground('add', newCard, updatedCards);
  };

  const handleDeleteCard = async (cardId: string) => {
    const cardToDelete = cards.find((c) => c.id === cardId);
    if (!cardToDelete) return;
    const remainingCards = cards.filter((c) => c.id !== cardId);
    setCards(remainingCards);
    setTransactionsByCard((prev) => {
      const copy = { ...prev };
      delete copy[cardId];
      return copy;
    });
    if (selectedCardId === cardId) {
      setSelectedCardId(null);
    }
    syncStructureInBackground('delete', cardToDelete, remainingCards);
  };

  const handleUpdateCardConfig = async (cardId: string, updated: Partial<CardProfile>) => {
    const oldCard = cards.find((c) => c.id === cardId);
    if (!oldCard) return;
    const oldTitle = getCardTabTitle(oldCard);
    const updatedCards = cards.map((c) => (c.id === cardId ? { ...c, ...updated } : c));
    const updatedCard = updatedCards.find((c) => c.id === cardId)!;
    setCards(updatedCards);
    syncStructureInBackground('edit', updatedCard, updatedCards, oldTitle);
  };

  // Transaction mutations with automatic chronological balance recalculation and real-time background sync
  const handleAddTransaction = useCallback(
    async (txData: Omit<Transaction, 'id' | 'balance' | 'createdAt'>) => {
      const cardId = txData.cardId;
      const targetCard = cards.find((c) => c.id === cardId);
      if (!targetCard) return;

      const existing = transactionsByCard[cardId] || [];
      const newTx: Transaction = {
        ...txData,
        id: `tx-${Date.now()}`,
        balance: 0,
        createdAt: Date.now(),
        syncedToSheet: Boolean(spreadsheetInfo?.spreadsheetId),
      };
      const updatedList = recalculateBalances([...existing, newTx]);

      setTransactionsByCard((prev) => ({
        ...prev,
        [cardId]: updatedList,
      }));

      // Real-time automatic background sync
      syncCardInBackground(targetCard, updatedList);
    },
    [cards, transactionsByCard, syncCardInBackground, spreadsheetInfo?.spreadsheetId]
  );

  const handleEditTransaction = useCallback(
    async (updatedTx: Transaction) => {
      const cardId = updatedTx.cardId;
      const targetCard = cards.find((c) => c.id === cardId);
      if (!targetCard) return;

      const existing = transactionsByCard[cardId] || [];
      const index = existing.findIndex((t) => t.id === updatedTx.id);
      if (index === -1) return;

      const updated = [...existing];
      updated[index] = updatedTx;
      const recalculated = recalculateBalances(updated);

      setTransactionsByCard((prev) => ({
        ...prev,
        [cardId]: recalculated,
      }));

      // Real-time automatic background sync
      syncCardInBackground(targetCard, recalculated);
    },
    [cards, transactionsByCard, syncCardInBackground]
  );

  const handleDeleteTransaction = useCallback(
    async (target: string | Transaction) => {
      const txId = typeof target === 'string' ? target : target.id;
      let cardId = typeof target === 'object' ? target.cardId : '';
      if (!cardId) {
        for (const [cId, txs] of Object.entries(transactionsByCard)) {
          if (txs.some((t) => t.id === txId)) {
            cardId = cId;
            break;
          }
        }
      }
      if (!cardId) return;
      const targetCard = cards.find((c) => c.id === cardId);
      if (!targetCard) return;

      const existing = transactionsByCard[cardId] || [];
      const filtered = existing.filter((t) => t.id !== txId);
      const recalculated = recalculateBalances(filtered);

      setTransactionsByCard((prev) => ({
        ...prev,
        [cardId]: recalculated,
      }));

      // Real-time automatic background sync
      syncCardInBackground(targetCard, recalculated);
    },
    [cards, transactionsByCard, syncCardInBackground]
  );

  const handleImportTransactions = useCallback(
    (cardId: string, imported: (Transaction | Omit<Transaction, 'id' | 'balance' | 'createdAt'>)[], mode: 'replace' | 'append') => {
      const targetCard = cards.find((c) => c.id === cardId);
      if (!targetCard) return;

      const preparedTransactions: Transaction[] = imported.map((item, idx) => ({
        ...item,
        id: ('id' in item && item.id) ? item.id : `tx-imp-${Date.now()}-${idx}`,
        balance: ('balance' in item && typeof item.balance === 'number') ? item.balance : 0,
        createdAt: ('createdAt' in item && typeof item.createdAt === 'number') ? item.createdAt : Date.now() + idx,
      }));

      const existing = transactionsByCard[cardId] || [];
      const combined = mode === 'replace' ? preparedTransactions : [...existing, ...preparedTransactions];
      const recalculated = recalculateBalances(combined);

      setTransactionsByCard((prev) => ({
        ...prev,
        [cardId]: recalculated,
      }));

      // Real-time automatic background sync
      syncCardInBackground(targetCard, recalculated);
    },
    [cards, transactionsByCard, syncCardInBackground]
  );

  const handleRestoreAllData = (newCards: CardProfile[], newTxs: Record<string, Transaction[]>) => {
    setCards(newCards);
    setTransactionsByCard(newTxs);
    if (googleToken && spreadsheetInfo?.spreadsheetId) {
      saveCardMetadataToGoogleSheet(googleToken, spreadsheetInfo.spreadsheetId, newCards);
      for (const card of newCards) {
        syncSingleCardTabToGoogleSheet(googleToken, spreadsheetInfo.spreadsheetId, card, newTxs[card.id] || []);
      }
    }
  };

  const handleResetToDefault = () => {
    if (window.confirm('Reset all cards and transactions to initial defaults?')) {
      const defaultTxs: Record<string, Transaction[]> = {
        'card-commercial-bank': recalculateBalances(INITIAL_COMMERCIAL_TRANSACTIONS),
        'card-sampath-bank': recalculateBalances(INITIAL_SAMPATH_TRANSACTIONS),
      };
      setCards(INITIAL_CARDS);
      setTransactionsByCard(defaultTxs);
      setSelectedCardId(null);
      if (googleToken && spreadsheetInfo?.spreadsheetId) {
        saveCardMetadataToGoogleSheet(googleToken, spreadsheetInfo.spreadsheetId, INITIAL_CARDS);
        for (const card of INITIAL_CARDS) {
          syncSingleCardTabToGoogleSheet(googleToken, spreadsheetInfo.spreadsheetId, card, defaultTxs[card.id] || []);
        }
      }
    }
  };

  // Selected card reference
  const selectedCard = cards.find((c) => c.id === selectedCardId);

  // If locked, render PIN Security Screen
  if (isLocked) {
    return (
      <PinScreen
        securityConfig={securityConfig}
        onUnlockSuccess={handleUnlockSuccess}
        onPinConfigured={handlePinConfigured}
        currentUser={googleUser}
        onSwitchOrSignInGoogle={handleRequestSignInGoogle}
        isConnectingGoogle={isConnectingGoogle}
      />
    );
  }

  const activeViewName: 'dashboard' | 'tracker' | 'settings' = isSettingsOpen 
    ? 'settings' 
    : selectedCard 
    ? 'tracker' 
    : 'dashboard';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Top Header */}
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

      {/* Main View Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 pb-28 md:pb-16">
        {selectedCard ? (
          <CardDetailView
            card={selectedCard}
            transactions={transactionsByCard[selectedCard.id] || []}
            onBack={() => setSelectedCardId(null)}
            onAddTransaction={handleAddTransaction}
            onEditTransaction={handleEditTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            onImportTransactions={(imported, mode) =>
              handleImportTransactions(selectedCard.id, imported, mode)
            }
            onDeleteCard={handleDeleteCard}
            onUpdateCardConfig={handleUpdateCardConfig}
            onOpenGuide={() => setIsGuideOpen(true)}
            googleUser={googleUser}
            spreadsheetInfo={spreadsheetInfo}
            isGoogleSyncing={isSyncingGoogle}
            onConnectGoogle={handleRequestSignInGoogle}
            initialOpenTxModal={autoOpenTxCardId === selectedCard.id}
          />
        ) : (
          <Dashboard
            cards={cards}
            transactionsByCard={transactionsByCard}
            onSelectCard={(card) => {
              setSelectedCardId(card.id);
              setAutoOpenTxCardId(null);
            }}
            onAddCard={handleAddCard}
            onEditCard={handleUpdateCardConfig}
            onDeleteCard={handleDeleteCard}
            onOpenGuide={() => setIsGuideOpen(true)}
            onQuickAddForCard={(card) => {
              setSelectedCardId(card.id);
              setAutoOpenTxCardId(card.id);
            }}
            googleUser={googleUser}
            spreadsheetInfo={spreadsheetInfo}
            isConnectingGoogle={isConnectingGoogle}
            isSyncingGoogle={isSyncingGoogle}
            onSignInGoogle={handleRequestSignInGoogle}
            onSignOutGoogle={handleSignOutGoogle}
            onManualSync={handleManualSyncNow}
          />
        )}
      </main>

      {/* Persistent Bottom Mobile Navigation Bar */}
      <BottomNav
        currentTab={bottomNavTab}
        onSelectTab={(tab) => {
          setBottomNavTab(tab);
          if (tab === 'dashboard') {
            setSelectedCardId(null);
            setAutoOpenTxCardId(null);
          } else if (tab === 'cards') {
            if (cards.length > 0) {
              setSelectedCardId(cards[0].id);
              setAutoOpenTxCardId(null);
            }
          } else if (tab === 'guide') {
            setIsGuideOpen(true);
          } else if (tab === 'settings') {
            setIsSettingsOpen(true);
          }
        }}
      />

      {/* Sheets Onboarding & Reference Guide Modal */}
      {isGuideOpen && (
        <SheetsOnboardingGuide
          onClose={() => setIsGuideOpen(false)}
          sheetLink={spreadsheetInfo?.webViewLink}
          isConnected={Boolean(googleUser && spreadsheetInfo?.spreadsheetId)}
          onConnectGoogle={handleRequestSignInGoogle}
        />
      )}

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        securityConfig={securityConfig}
        onUpdateSecurity={handlePinConfigured}
        cards={cards}
        transactionsByCard={transactionsByCard}
        onRestoreAllData={handleRestoreAllData}
        onResetToDefault={handleResetToDefault}
        googleUser={googleUser}
        spreadsheetInfo={spreadsheetInfo}
        isConnectingGoogle={isConnectingGoogle}
        isSyncingGoogle={isSyncingGoogle}
        onSignInGoogle={handleRequestSignInGoogle}
        onSignOutGoogle={handleSignOutGoogle}
      />

      {/* First-time Google OAuth Permission Consent Prompt */}
      <GoogleOAuthConsentModal
        isOpen={isConsentModalOpen}
        onClose={() => setIsConsentModalOpen(false)}
        onConfirmConsent={handleConfirmConsentAndSignIn}
        isConnecting={isConnectingGoogle}
      />
    </div>
  );
}
