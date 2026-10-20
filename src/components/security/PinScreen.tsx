import React, { useState, useEffect } from 'react';
import { Lock, ShieldCheck, KeyRound, ArrowLeft, AlertCircle, LogIn, Sparkles, UserCheck } from 'lucide-react';
import { hashPin, verifyPin } from '../../utils/security';
import { SecurityConfig } from '../../types';

interface PinScreenProps {
  securityConfig: SecurityConfig;
  onUnlockSuccess: () => void;
  onPinConfigured: (newConfig: SecurityConfig) => void;
  currentUser?: {
    uid?: string;
    displayName: string | null;
    email: string | null;
    photoURL: string | null;
  } | null;
  onSwitchOrSignInGoogle?: () => void;
  isConnectingGoogle?: boolean;
}

export const PinScreen: React.FC<PinScreenProps> = ({
  securityConfig,
  onUnlockSuccess,
  onPinConfigured,
  currentUser,
  onSwitchOrSignInGoogle,
  isConnectingGoogle = false,
}) => {
  const isFirstLaunch = !securityConfig.isPinSet;
  const [selectedLength, setSelectedLength] = useState<4 | 6>(securityConfig.pinLength || 4);
  const [setupStep, setSetupStep] = useState<'create' | 'confirm'>('create');
  const [tempFirstPin, setTempFirstPin] = useState<string>('');
  const [enteredPin, setEnteredPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [showForgotModal, setShowForgotModal] = useState<boolean>(false);

  const targetLength = isFirstLaunch ? selectedLength : securityConfig.pinLength;

  // Handle number click on tactile keypad
  const handleDigitPress = (digit: string) => {
    if (enteredPin.length < targetLength) {
      const nextPin = enteredPin + digit;
      setEnteredPin(nextPin);
      setErrorMsg('');

      // If user filled all digits
      if (nextPin.length === targetLength) {
        processCompletedPin(nextPin);
      }
    }
  };

  const handleDelete = () => {
    if (enteredPin.length > 0) {
      setEnteredPin((prev) => prev.slice(0, -1));
      setErrorMsg('');
    }
  };

  const handleClear = () => {
    setEnteredPin('');
    setErrorMsg('');
  };

  const triggerErrorShake = (msg: string) => {
    setErrorMsg(msg);
    setIsShaking(true);
    setTimeout(() => {
      setIsShaking(false);
      setEnteredPin('');
    }, 600);
  };

  const processCompletedPin = async (fullPin: string) => {
    if (isFirstLaunch) {
      if (setupStep === 'create') {
        setTempFirstPin(fullPin);
        setEnteredPin('');
        setSetupStep('confirm');
      } else {
        if (fullPin === tempFirstPin) {
          const hashed = await hashPin(fullPin);
          onPinConfigured({
            isPinSet: true,
            pinHash: hashed,
            pinLength: selectedLength,
            lockTimeoutMinutes: 5,
            lastActiveTimestamp: Date.now(),
            isLocked: false,
          });
          onUnlockSuccess();
        } else {
          triggerErrorShake('PINs did not match. Please try again.');
          setSetupStep('create');
          setTempFirstPin('');
        }
      }
    } else {
      if (!securityConfig.pinHash) {
        onUnlockSuccess();
        return;
      }

      const isValid = await verifyPin(fullPin, securityConfig.pinHash);
      if (isValid) {
        onUnlockSuccess();
      } else {
        triggerErrorShake('Incorrect PIN. Please re-enter.');
      }
    }
  };

  // Keyboard support for desktop testing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleDigitPress(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      } else if (e.key === 'Escape') {
        handleClear();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enteredPin, targetLength, setupStep, tempFirstPin, isFirstLaunch]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-between bg-white dark:bg-slate-950 text-slate-900 dark:text-white select-none px-6 py-6 md:py-10 transition-colors overflow-y-auto">
      {/* Top Branding & Status */}
      <div className="flex flex-col items-center text-center mt-2 max-w-sm mx-auto w-full">
        {/* User Identity Pill (if logged in via Google) */}
        {currentUser && (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-400/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold mb-4 shadow-[0_0_12px_rgba(16,185,129,0.25)]">
            {currentUser.photoURL ? (
              <img
                src={currentUser.photoURL}
                alt="Google avatar"
                className="w-5 h-5 rounded-full border border-emerald-500/50"
              />
            ) : (
              <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
            )}
            <span className="truncate max-w-[200px]">
              {currentUser.displayName || currentUser.email}
            </span>
          </div>
        )}

        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-400 via-teal-400 to-cyan-400 p-0.5 shadow-[0_0_20px_rgba(16,185,129,0.4)] mb-3 flex items-center justify-center">
          <div className="w-full h-full bg-white dark:bg-slate-950 rounded-[14px] flex items-center justify-center">
            {isFirstLaunch ? (
              <KeyRound className="w-7 h-7 text-emerald-600 dark:text-emerald-400 stroke-[2.2]" />
            ) : (
              <Lock className="w-7 h-7 text-emerald-600 dark:text-emerald-400 stroke-[2.2]" />
            )}
          </div>
        </div>

        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white mb-1.5 drop-shadow-[0_0_8px_rgba(16,185,129,0.25)]">
          {isFirstLaunch
            ? setupStep === 'create'
              ? currentUser
                ? 'Create Your Secure PIN'
                : 'Create Your Security PIN'
              : 'Confirm Your New PIN'
            : 'Enter Security PIN'}
        </h1>

        <p className="text-xs text-slate-600 dark:text-slate-400 max-w-xs leading-relaxed font-medium">
          {isFirstLaunch
            ? setupStep === 'create'
              ? currentUser
                ? `Welcome, ${currentUser.displayName || 'Google User'}! Establish your custom local PIN to secure your card logs on this device.`
                : 'Protect your credit cards, statements, and financial data with a secure PIN.'
              : 'Re-enter your PIN to confirm and activate security.'
            : currentUser
            ? `Welcome back, ${currentUser.displayName || 'Google User'}. Enter your PIN to access your cards.`
            : 'Enter your PIN to view and manage your credit cards.'}
        </p>

        {/* First Launch PIN Length Selector with Neon Buttons */}
        {isFirstLaunch && setupStep === 'create' && (
          <div className="flex items-center gap-2 mt-4 p-1 bg-slate-50 dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl shadow-xs">
            <button
              type="button"
              onClick={() => {
                setSelectedLength(4);
                setEnteredPin('');
              }}
              className={`px-3.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                selectedLength === 4
                  ? 'bg-emerald-500 text-slate-950 font-black shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              4 Digits
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedLength(6);
                setEnteredPin('');
              }}
              className={`px-3.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                selectedLength === 6
                  ? 'bg-emerald-500 text-slate-950 font-black shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              6 Digits
            </button>
          </div>
        )}
      </div>

      {/* Middle: PIN Dots Indicator with Neon Glow */}
      <div className="flex flex-col items-center my-4">
        <div
          className={`flex items-center justify-center gap-4 transition-transform duration-150 ${
            isShaking ? 'translate-x-2 -translate-x-2 animate-bounce text-rose-500' : ''
          }`}
        >
          {Array.from({ length: targetLength }).map((_, index) => {
            const isFilled = index < enteredPin.length;
            return (
              <div
                key={index}
                className={`w-4 h-4 rounded-full transition-all duration-200 border-2 ${
                  isFilled
                    ? 'bg-emerald-500 border-emerald-500 scale-110 shadow-[0_0_12px_rgba(16,185,129,0.7)]'
                    : 'bg-transparent border-slate-300 dark:border-slate-700'
                }`}
              />
            );
          })}
        </div>

        {errorMsg ? (
          <div className="flex items-center gap-1.5 mt-3 text-xs font-bold text-rose-600 dark:text-rose-400 animate-fadeIn drop-shadow-[0_0_8px_rgba(244,63,94,0.3)]">
            <AlertCircle className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>{errorMsg}</span>
          </div>
        ) : (
          <div className="h-5 mt-3" />
        )}
      </div>

      {/* Bottom: Tactile Number Pad with Neon Hover Touch */}
      <div className="w-full max-w-xs mx-auto pb-4">
        <div className="grid grid-cols-3 gap-3 sm:gap-3.5 mb-3">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleDigitPress(num.toString())}
              className="h-14 sm:h-16 rounded-2xl bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 active:bg-emerald-50 dark:active:bg-emerald-500/20 border border-slate-200/90 dark:border-slate-800 text-2xl font-black text-slate-800 dark:text-white flex items-center justify-center shadow-xs hover:border-emerald-500/50 hover:shadow-[0_0_14px_rgba(16,185,129,0.25)] transition-all active:scale-95 cursor-pointer"
            >
              {num}
            </button>
          ))}

          {/* Bottom row: Clear or Back, 0, Backspace */}
          <button
            type="button"
            onClick={
              isFirstLaunch && setupStep === 'confirm'
                ? () => {
                    setSetupStep('create');
                    setEnteredPin('');
                    setTempFirstPin('');
                  }
                : handleClear
            }
            className="h-14 sm:h-16 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900/60 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-center border border-slate-200/90 dark:border-slate-800/60 transition-all active:scale-95 cursor-pointer"
          >
            {isFirstLaunch && setupStep === 'confirm' ? 'Back' : 'Clear'}
          </button>

          <button
            type="button"
            onClick={() => handleDigitPress('0')}
            className="h-14 sm:h-16 rounded-2xl bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 active:bg-emerald-50 dark:active:bg-emerald-500/20 border border-slate-200/90 dark:border-slate-800 text-2xl font-black text-slate-800 dark:text-white flex items-center justify-center shadow-xs hover:border-emerald-500/50 hover:shadow-[0_0_14px_rgba(16,185,129,0.25)] transition-all active:scale-95 cursor-pointer"
          >
            0
          </button>

          <button
            type="button"
            onClick={handleDelete}
            className="h-14 sm:h-16 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900/60 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center border border-slate-200/90 dark:border-slate-800/60 transition-all active:scale-95 cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Security Reset & Switch Account options with Neon Style */}
        <div className="flex flex-col items-center gap-2 mt-2">
          {onSwitchOrSignInGoogle && (
            <button
              type="button"
              onClick={onSwitchOrSignInGoogle}
              disabled={isConnectingGoogle}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-white hover:bg-emerald-50 dark:bg-slate-900 dark:hover:bg-emerald-950/40 border border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.2)] transition-all disabled:opacity-50 active:scale-95 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5 stroke-[2.2]" />
              <span>
                {currentUser
                  ? 'Switch Google Account'
                  : 'New User? Sign in with Google'}
              </span>
            </button>
          )}

          {!isFirstLaunch && (
            <button
              type="button"
              onClick={() => setShowForgotModal(true)}
              className="text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors py-1 font-bold cursor-pointer"
            >
              Forgot PIN?
            </button>
          )}
        </div>
      </div>

      {/* Forgot PIN Confirmation Dialog */}
      {showForgotModal && (
        <div className="fixed inset-0 z-60 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl animate-scaleUp">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-3 shadow-[0_0_12px_rgba(245,158,11,0.3)]">
              <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Reset Security PIN?</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
              Resetting your PIN allows you to establish a new secure PIN immediately. Your card logs will remain securely preserved on your device.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer active:scale-95"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForgotModal(false);
                  onPinConfigured({
                    isPinSet: false,
                    pinHash: null,
                    pinLength: 4,
                    lockTimeoutMinutes: 5,
                    lastActiveTimestamp: Date.now(),
                    isLocked: false,
                  });
                }}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-bold text-xs shadow-[0_0_14px_rgba(16,185,129,0.45)] transition-all cursor-pointer"
              >
                Reset PIN
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
