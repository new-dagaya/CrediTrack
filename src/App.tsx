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
  findOrCreateSpreadsheet, 
  syncAllCardsToGoogleSheet, 
  appendTransactionToGoogleSheet, 
  ensureCardTabExists,
  deleteCardTabFromGoogleSheet,
  renameCardTabInGoogleSheet,
  getCardTabTitle,
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
    // Legacy storage key fallback for guest
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
    // Legacy storage key fallback for guest
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
    return config.isPinSet ? true : true; // First launch prompts setup, subsequent prompts PIN
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
    return 'light'; // Default to light mode with vibrant neon accents
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

  // Initialize Firebase Auth listener on startup
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
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

        // Detect if this Google user has configured a custom PIN on this device:
        const hasPin = hasUserConfiguredPin(user.uid);
        const userSec = getStoredSecurityConfig(user.uid);
        setSecurityConfig(userSec);

        // Load isolated user data
        setCards(loadUserCards(user.uid));
        setTransactionsByCard(loadUserTransactions(user.uid));
        setSpreadsheetInfo(loadUserSheetInfo(user.uid));

        // If new user on this device without PIN, force lock to show "Create Your Secure PIN"
        if (!hasPin) {
          setIsLocked(true);
        } else {
          setIsLocked(userSec.isPinSet ? true : false);
        }
      },
      () => {
        setGoogleUser(null);
        setGoogleToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // Delayed Auto-Lock when leaving or minimizing the app (does not lock immediately)
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

  // Google Drive & Sheets: Sign in and automatic multi-sheet spreadsheet generation + initial sync
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

      // 1. Detect if this user is new to this device or already has a PIN
      const hasPin = hasUserConfiguredPin(user.uid);
      const userSec = getStoredSecurityConfig(user.uid);
      setSecurityConfig(userSec);

      // Load user cards and transactions
      const userCards = loadUserCards(user.uid);
      const userTxs = loadUserTransactions(user.uid);
      setCards(userCards);
      setTransactionsByCard(userTxs);

      // If new user on this device, prompt them with "Create Your Secure PIN"
      if (!hasPin) {
        setIsLocked(true);
      }

      // 2. Automatically find or create 'CrediTrack_Card_Manager' directly in Google Drive
      // with separate tabs for EACH credit card!
      setIsSyncingGoogle(true);
      const sheetResult = await findOrCreateSpreadsheet(token, userCards);

      // 3. Automatically sync each card's data into its dedicated tab
      const syncResult = await syncAllCardsToGoogleSheet(
        token,
        sheetResult.spreadsheetId,
        userCards,
        userTxs
      );

      const newInfo: GoogleSpreadsheetInfo = {
        spreadsheetId: sheetResult.spreadsheetId,
        webViewLink: sheetResult.webViewLink,
        title: 'CrediTrack_Card_Manager',
        lastSyncedAt: Date.now(),
        lastSyncStatus: syncResult.success ? 'success' : 'error',
        syncedTabs: syncResult.tabs,
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
    setSpreadsheetInfo(null);
    // Switch back to guest data
    const guestSec = getStoredSecurityConfig(null);
    setSecurityConfig(guestSec);
    setIsLocked(guestSec.isPinSet ? true : false);
    setCards(loadUserCards(null));
    setTransactionsByCard(loadUserTransactions(null));
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
        const found = await findOrCreateSpreadsheet(token, cards);
        sheetId = found.spreadsheetId;
        webViewLink = found.webViewLink;
      }

      // Perform dynamic multi-sheet synchronization
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
        syncedTabs: res.tabs,
      }));
    } catch (err: any) {
      console.error('Manual multi-sheet sync failed:', err);
    } finally {
      setIsSyncingGoogle(false);
    }
  };

  // PIN security unlock handlers (scoped to current user)
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

  // Card Management handlers
  const handleAddCard = async (newCard: CardProfile) => {
    setCards((prev) => [...prev, newCard]);
    setTransactionsByCard((prev) => ({
      ...prev,
      [newCard.id]: [],
    }));
    // Instantly navigate to the newly created dedicated tracker page!
    setSelectedCardId(newCard.id);

    // Dynamically create a separate dedicated tab in Google Sheet for this card!
    if (googleToken && spreadsheetInfo?.spreadsheetId) {
      try {
        await ensureCardTabExists(googleToken, spreadsheetInfo.spreadsheetId, newCard);
      } catch (err) {
        console.error('Failed to create tab for new card in Google Sheet:', err);
      }
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    const cardToDelete = cards.find((c) => c.id === cardId);
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

    // Automatically delete the corresponding individual sheet/tab from the Google Sheet file in their Google Drive as well!
    if (googleToken && spreadsheetInfo?.spreadsheetId && cardToDelete) {
      try {
        await deleteCardTabFromGoogleSheet(
          googleToken,
          spreadsheetInfo.spreadsheetId,
          cardToDelete
        );
      } catch (err) {
        console.error('Failed to delete tab from Google Sheet on card deletion:', err);
      }
    }
  };

  const handleUpdateCardConfig = async (cardId: string, updated: Partial<CardProfile>) => {
    const oldCard = cards.find((c) => c.id === cardId);
    setCards((prev) =>
      prev.map((c) => (c.id === cardId ? { ...c, ...updated } : c))
    );

    // If card name was changed, rename its dedicated tab in the Google Sheet!
    if (
      googleToken && 
      spreadsheetInfo?.spreadsheetId && 
      oldCard && 
      updated.name && 
      updated.name !== oldCard.name
    ) {
      const oldTitle = getCardTabTitle(oldCard);
      const newTitle = getCardTabTitle({ ...oldCard, ...updated });
      try {
        await renameCardTabInGoogleSheet(
          googleToken,
          spreadsheetInfo.spreadsheetId,
          oldTitle,
          newTitle
        );
      } catch (err) {
        console.error('Failed to rename tab in Google Sheet on edit:', err);
      }
    }
  };

  // Transaction mutations with automatic sequential balance recalculation and live Google Drive multi-sheet sync!
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
          syncedToSheet: Boolean(spreadsheetInfo?.spreadsheetId),
        };
        const updatedList = recalculateBalances([...existing, newTx]);
        
        const newMap = {
          ...prev,
          [cardId]: updatedList,
        };

        // Real-time synchronization to connected Google Sheet
        if (googleToken && spreadsheetInfo?.spreadsheetId && targetCard) {
          syncAllCardsToGoogleSheet(
            googleToken,
            spreadsheetInfo.spreadsheetId,
            cards,
            newMap
          ).catch((e) => console.error('Real-time sheet sync failed:', e));
        }

        return newMap;
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

        // Background sync to live Google Sheet multi-sheet tabs if connected
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
    async (target: string | Transaction) => {
      const txId = typeof target === 'string' ? target : target.id;

      setTransactionsByCard((prev) => {
        let cardId = typeof target === 'object' ? target.cardId : '';
        if (!cardId) {
          for (const [cId, txs] of Object.entries(prev)) {
            if (txs.some((t) => t.id === txId)) {
              cardId = cId;
              break;
            }
          }
        }
        if (!cardId) return prev;

        const existing = prev[cardId] || [];
        const filtered = existing.filter((t) => t.id !== txId);
        const recalculated = recalculateBalances(filtered);

        const newMap = {
          ...prev,
          [cardId]: recalculated,
        };

        // Background sync to live Google Sheet multi-sheet tabs if connected
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
    (cardId: string, imported: (Transaction | Omit<Transaction, 'id' | 'balance' | 'createdAt'>)[], mode: 'replace' | 'append') => {
      const preparedTransactions: Transaction[] = imported.map((item, idx) => ({
        ...item,
        id: ('id' in item && item.id) ? item.id : `tx-imp-${Date.now()}-${idx}`,
        balance: ('balance' in item && typeof item.balance === 'number') ? item.balance : 0,
        createdAt: ('createdAt' in item && typeof item.createdAt === 'number') ? item.createdAt : Date.now() + idx,
      }));

      setTransactionsByCard((prev) => {
        const existing = prev[cardId] || [];
        const combined = mode === 'replace' ? preparedTransactions : [...existing, ...preparedTransactions];
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

  const handleRestoreAllData = (newCards: CardProfile[], newTxs: Record<string, Transaction[]>) => {
    setCards(newCards);
    setTransactionsByCard(newTxs);
    if (googleToken && spreadsheetInfo?.spreadsheetId) {
      syncAllCardsToGoogleSheet(googleToken, spreadsheetInfo.spreadsheetId, newCards, newTxs);
    }
  };

  const handleResetToDefault = () => {
    if (window.confirm('Reset all cards and transactions to initial defaults?')) {
      const defaultTxs = {
        'card-commercial-bank': recalculateBalances(INITIAL_COMMERCIAL_TRANSACTIONS),
        'card-sampath-bank': recalculateBalances(INITIAL_SAMPATH_TRANSACTIONS),
      };
      setCards(INITIAL_CARDS);
      setTransactionsByCard(defaultTxs);
      setSelectedCardId(null);
      if (googleToken && spreadsheetInfo?.spreadsheetId) {
        syncAllCardsToGoogleSheet(googleToken, spreadsheetInfo.spreadsheetId, INITIAL_CARDS, defaultTxs);
      }
    }
  };

  // Selected card reference
  const selectedCard = cards.find((c) => c.id === selectedCardId);

  // If locked, render PIN Security Screen with user awareness and new user PIN creation
  if (isLocked) {
    return (
      <PinScreen
        securityConfig={securityConfig}
        onUnlockSuccess={handleUnlockSuccess}
        onPinConfigured={handlePinConfigured}
        currentUser={googleUser}
        onSwitchOrSignInGoogle={handleSignInGoogle}
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
            onSyncAllToGoogleDrive={handleSyncGoogleNow}
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
            onSyncGoogleNow={handleSyncGoogleNow}
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
        onSyncGoogleNow={handleSyncGoogleNow}
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
