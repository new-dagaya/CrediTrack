import React, { useState } from 'react';
import { 
  KeyRound, 
  ShieldCheck, 
  Clock, 
  RotateCcw, 
  Download, 
  Upload, 
  CheckCircle2, 
  AlertCircle,
  X,
  FileSpreadsheet,
  ExternalLink,
  RefreshCw,
  LogOut,
  Cloud
} from 'lucide-react';
import { CardProfile, SecurityConfig, Transaction } from '../../types';
import { hashPin } from '../../utils/security';
import { GoogleSpreadsheetInfo } from '../../utils/googleDriveSync';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  securityConfig: SecurityConfig;
  onUpdateSecurity: (newConfig: SecurityConfig) => void;
  cards: CardProfile[];
  transactionsByCard: Record<string, Transaction[]>;
  onRestoreAllData: (cards: CardProfile[], txs: Record<string, Transaction[]>) => void;
  onResetToDefault: () => void;
  // Google Drive & Sheets Integration
  googleUser?: {
    displayName: string | null;
    email: string | null;
    photoURL: string | null;
  } | null;
  spreadsheetInfo?: GoogleSpreadsheetInfo | null;
  isConnectingGoogle?: boolean;
  isSyncingGoogle?: boolean;
  onSignInGoogle?: () => void;
  onSignOutGoogle?: () => void;
  onSyncGoogleNow?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  securityConfig,
  onUpdateSecurity,
  cards,
  transactionsByCard,
  onRestoreAllData,
  onResetToDefault,
  googleUser,
  spreadsheetInfo,
  isConnectingGoogle = false,
  isSyncingGoogle = false,
  onSignInGoogle,
  onSignOutGoogle,
  onSyncGoogleNow,
}) => {
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [selectedPinLength, setSelectedPinLength] = useState<4 | 6>(securityConfig.pinLength || 4);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  if (!isOpen) return null;

  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    // If a PIN is currently configured, verify current PIN first
    if (securityConfig.isPinSet && securityConfig.pinHash) {
      const currentHashed = await hashPin(currentPinInput);
      if (currentHashed !== securityConfig.pinHash) {
        setFeedback({ type: 'error', message: 'Current PIN is incorrect.' });
        return;
      }
    }

    if (newPinInput.length !== selectedPinLength) {
      setFeedback({ type: 'error', message: `New PIN must be exactly ${selectedPinLength} digits.` });
      return;
    }

    if (newPinInput !== confirmPinInput) {
      setFeedback({ type: 'error', message: 'New PIN and confirmation do not match.' });
      return;
    }

    const newHashed = await hashPin(newPinInput);
    onUpdateSecurity({
      ...securityConfig,
      isPinSet: true,
      pinHash: newHashed,
      pinLength: selectedPinLength,
    });

    setFeedback({ type: 'success', message: 'Security PIN updated successfully!' });
    setCurrentPinInput('');
    setNewPinInput('');
    setConfirmPinInput('');
  };

  const handleExportBackup = () => {
    const data = {
      version: 1,
      timestamp: Date.now(),
      cards,
      transactionsByCard,
    };
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `creditrack-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setFeedback({ type: 'success', message: 'Backup file exported successfully!' });
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.cards && parsed.transactionsByCard) {
          onRestoreAllData(parsed.cards, parsed.transactionsByCard);
          setFeedback({ type: 'success', message: 'Data backup restored successfully!' });
        } else {
          setFeedback({ type: 'error', message: 'Invalid backup file structure.' });
        }
      } catch (err) {
        setFeedback({ type: 'error', message: 'Failed to read backup JSON file.' });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-800 dark:text-slate-200 transition-colors">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Security & Cloud Sync</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Google Drive sync and PIN protection</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-800 dark:text-slate-200">
          
          {feedback && (
            <div
              className={`p-3 rounded-2xl flex items-center gap-2.5 text-xs font-medium ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                  : 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Section 1: Google Drive & Sheets Sync (Zero manual config) */}
          <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Cloud className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">Google Drive & Sheets Integration</h4>
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/40 px-2 py-0.5 rounded-full ml-auto">
                Automated
              </span>
            </div>

            {googleUser ? (
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    {googleUser.photoURL ? (
                      <img
                        src={googleUser.photoURL}
                        alt="User"
                        className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                        {(googleUser.displayName || googleUser.email || 'G')[0].toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">
                        {googleUser.displayName || googleUser.email}
                      </p>
                      <p className="text-[11px] text-slate-500 font-mono">
                        {spreadsheetInfo?.title || 'CrediTrack_Card_Manager'}
                      </p>
                    </div>
                  </div>

                  {spreadsheetInfo?.webViewLink && (
                    <a
                      href={spreadsheetInfo.webViewLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Open Sheet</span>
                    </a>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onSyncGoogleNow}
                    disabled={isSyncingGoogle}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncingGoogle ? 'animate-spin' : ''}`} />
                    <span>{isSyncingGoogle ? 'Syncing...' : 'Sync All Cards Now'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={onSignOutGoogle}
                    className="px-3 py-2.5 rounded-xl bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2 pt-1">
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Connect your Google account to automatically generate your{' '}
                  <strong className="text-slate-900 dark:text-white">CrediTrack_Card_Manager</strong>{' '}
                  spreadsheet in Google Drive. No manual API keys or sheet IDs needed.
                </p>
                <button
                  type="button"
                  onClick={onSignInGoogle}
                  disabled={isConnectingGoogle}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
                >
                  <Cloud className="w-4 h-4" />
                  <span>{isConnectingGoogle ? 'Connecting...' : 'Connect Google Drive & Sheets'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Section 2: Change PIN */}
          <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">Change Security PIN</h4>
            </div>

            <form onSubmit={handleChangePin} className="space-y-3 pt-1">
              {/* Length choice */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-400 font-medium">PIN Length:</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSelectedPinLength(4)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      selectedPinLength === 4
                        ? 'bg-emerald-500 text-slate-950 font-bold shadow-xs'
                        : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    4 Digits
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPinLength(6)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      selectedPinLength === 6
                        ? 'bg-emerald-500 text-slate-950 font-bold shadow-xs'
                        : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    6 Digits
                  </button>
                </div>
              </div>

              {securityConfig.isPinSet && (
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Current PIN</label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    value={currentPinInput}
                    onChange={(e) => setCurrentPinInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter current PIN"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 shadow-2xs"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">New PIN</label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={selectedPinLength}
                    value={newPinInput}
                    onChange={(e) => setNewPinInput(e.target.value.replace(/\D/g, ''))}
                    placeholder={`${selectedPinLength} digits`}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 shadow-2xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Confirm New PIN</label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={selectedPinLength}
                    value={confirmPinInput}
                    onChange={(e) => setConfirmPinInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="Re-enter"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 shadow-2xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors shadow-2xs cursor-pointer"
              >
                Update Security PIN
              </button>
            </form>
          </div>

          {/* Section 3: Auto-Lock Inactivity */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">Auto-Lock Inactivity Timeout</h4>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Lock CrediTrack automatically after inactivity:
            </p>
            <div className="grid grid-cols-4 gap-2">
              {[1, 5, 15, 60].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() =>
                    onUpdateSecurity({
                      ...securityConfig,
                      lockTimeoutMinutes: mins,
                    })
                  }
                  className={`py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                    securityConfig.lockTimeoutMinutes === mins
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow-xs'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {mins === 60 ? '1 hour' : `${mins} min`}
                </button>
              ))}
            </div>
          </div>

          {/* Section 4: Data Backup & Reset */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">Local Data Management & JSON Backup</h4>
            
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleExportBackup}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors shadow-2xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Export JSON</span>
              </button>

              <label className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer shadow-2xs">
                <Upload className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Restore JSON</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportBackup}
                  className="hidden"
                />
              </label>
            </div>

            <div className="pt-2">
              {!showResetConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(true)}
                  className="text-xs text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1.5 font-medium cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset All Cards to Initial Data</span>
                </button>
              ) : (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 rounded-xl space-y-2">
                  <p className="text-xs text-rose-800 dark:text-rose-300">
                    Are you sure? This restores the original Commercial Bank and Sampath Bank demo profiles and transactions.
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowResetConfirm(false)}
                      className="px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onResetToDefault();
                        setShowResetConfirm(false);
                        setFeedback({ type: 'success', message: 'Reset to initial cards completed!' });
                      }}
                      className="px-3 py-1 bg-rose-600 text-white font-semibold rounded-lg text-xs cursor-pointer"
                    >
                      Confirm Reset
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-white transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
