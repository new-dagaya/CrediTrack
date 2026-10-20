import React, { useState } from 'react';
import { Smartphone, Zap, Plus, Copy, Check, Info, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { CardProfile } from '../../types';

interface AndroidWidgetPanelProps {
  cards: CardProfile[];
  onQuickAddForCard: (card: CardProfile) => void;
}

export const AndroidWidgetPanel: React.FC<AndroidWidgetPanelProps> = ({
  cards,
  onQuickAddForCard,
}) => {
  const [copiedCardId, setCopiedCardId] = useState<string | null>(null);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  const handleCopyLink = (cardId: string) => {
    const url = `${window.location.origin}/?action=add_tx&cardId=${encodeURIComponent(cardId)}`;
    navigator.clipboard?.writeText(url).then(() => {
      setCopiedCardId(cardId);
      setTimeout(() => setCopiedCardId(null), 2000);
    }).catch(() => {});
  };

  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-cyan-500/30 dark:border-cyan-500/40 text-slate-900 dark:text-white shadow-md dark:shadow-2xl relative overflow-hidden transition-colors">
      {/* Ambient background glow */}
      <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-50 dark:bg-cyan-950/80 border border-cyan-500/40 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(6,182,212,0.25)]">
            <Smartphone className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight drop-shadow-[0_0_6px_rgba(6,182,212,0.2)]">
                Android 15 Home Screen Widgets & Shortcuts
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-50 dark:bg-cyan-950/80 text-cyan-700 dark:text-cyan-300 border border-cyan-400/50 shadow-[0_0_10px_rgba(6,182,212,0.2)] flex items-center gap-1">
                <Zap className="w-2.5 h-2.5 fill-cyan-500 dark:fill-cyan-400 text-cyan-500 dark:text-cyan-400" />
                <span>One-Tap Add</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Launch directly into any card's transaction input form from your home screen
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsGuideOpen(!isGuideOpen)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 border border-cyan-500/30 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white shadow-[0_0_10px_rgba(6,182,212,0.15)] transition-all cursor-pointer self-start sm:self-auto active:scale-95"
        >
          <Info className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
          <span>{isGuideOpen ? 'Hide Setup' : 'How it works'}</span>
          {isGuideOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Expandable Android 15 Setup Guide */}
      {isGuideOpen && (
        <div className="mb-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 space-y-2 animate-fadeIn transition-colors">
          <h4 className="font-bold text-cyan-700 dark:text-cyan-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400" />
            <span>How to pin widgets on Android 15 & Pixel Launcher:</span>
          </h4>
          <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
            <li>Install CrediTrack as a PWA on your Android device (tap <strong>Add to Home screen</strong> in Chrome).</li>
            <li>On your home screen, <strong>long-press the CrediTrack app icon</strong> to reveal the quick shortcuts menu.</li>
            <li>Press and drag any card shortcut directly to your home screen grid as an instant 1x1 Quick Widget.</li>
            <li>Tap the widget any time to instantly open the transaction modal for that card!</li>
          </ol>
        </div>
      )}

      {/* Widget Card Quick Launch Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
        {cards.map((card) => {
          const isCopied = copiedCardId === card.id;

          return (
            <div
              key={card.id}
              className="p-3 rounded-2xl bg-slate-50 hover:bg-slate-100/80 dark:bg-slate-950/70 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800/80 hover:border-cyan-500/40 transition-all flex items-center justify-between gap-2.5 group shadow-xs"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-500 dark:bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.6)]" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white truncate block">
                    {card.name}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono block pl-3.5">
                  {card.cardNumberMask}
                </span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => handleCopyLink(card.id)}
                  title="Copy widget launch URL"
                  className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white shadow-2xs hover:shadow-[0_0_10px_rgba(6,182,212,0.2)] transition-all cursor-pointer active:scale-95"
                >
                  {isCopied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => onQuickAddForCard(card)}
                  title={`Launch transaction form for ${card.name}`}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs border border-cyan-300 dark:border-cyan-400 shadow-[0_0_14px_rgba(6,182,212,0.35)] hover:shadow-[0_0_20px_rgba(6,182,212,0.55)] active:scale-95 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Log Tx</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
