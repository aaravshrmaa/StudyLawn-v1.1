import React, { useState, useEffect } from 'react';
import {
  Minus,
  Plus,
  Maximize,
  Minimize,
  X,
  Share2,
  Play,
  Pause,
  RotateCcw,
  Clock,
} from 'lucide-react';
import { useTimer } from '../context/TimerContext';
import { useStudyTheme } from '../context/ThemeContext';
import { ActiveTab } from '../types';

interface FullscreenTimerPageProps {
  onBackToDashboard: () => void;
  onNavigateTab: (tab: ActiveTab) => void;
}

export const FullscreenTimerPage: React.FC<FullscreenTimerPageProps> = ({
  onBackToDashboard,
}) => {
  const { theme } = useStudyTheme();
  const {
    timerMinutes,
    timeLeft,
    isTimerRunning,
    toggleTimer,
    resetTimer,
    handleSetCustomTimerWithHours,
  } = useTimer();

  const [zoomScale, setZoomScale] = useState<number>(() => {
    const saved = localStorage.getItem('study_fs_zoom');
    return saved ? parseFloat(saved) || 0.8 : 0.8;
  });

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editHours, setEditHours] = useState(() => Math.floor(timerMinutes / 60));
  const [editMinutes, setEditMinutes] = useState(() => timerMinutes % 60);

  const [isNativeFullscreen, setIsNativeFullscreen] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);

  // Zoom controls (bounded between 0.6x and 1.5x)
  const handleZoomIn = () => {
    setZoomScale((prev) => {
      const next = Math.min(1.5, Math.round((prev + 0.1) * 100) / 100);
      localStorage.setItem('study_fs_zoom', next.toString());
      return next;
    });
  };

  const handleZoomOut = () => {
    setZoomScale((prev) => {
      const next = Math.max(0.6, Math.round((prev - 0.1) * 100) / 100);
      localStorage.setItem('study_fs_zoom', next.toString());
      return next;
    });
  };

  const toggleNativeFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsNativeFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsNativeFullscreen(false);
    }
  };

  const handleShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2000);
  };

  // Keyboard controls: Space to Start/Pause, Esc to Exit, R to Reset, + / - to Zoom
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        toggleTimer();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
        onBackToDashboard();
      } else if (e.key.toLowerCase() === 'r') {
        e.preventDefault();
        resetTimer();
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        handleZoomIn();
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        handleZoomOut();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleTimer, resetTimer, onBackToDashboard]);

  // Format timeLeft to HH:MM:SS or MM:SS
  const formatTimerDisplay = (totalSeconds: number): string => {
    const total = Math.max(0, Math.floor(totalSeconds));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    if (h > 0 || timerMinutes >= 60) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleApplyCustomTime = (e: React.FormEvent) => {
    e.preventDefault();
    handleSetCustomTimerWithHours(editHours, editMinutes);
    setIsEditModalOpen(false);
  };

  const logoSrc = theme === 'paper' ? '/studylawnlogo.png' : '/studylawnlogo.png';

  return (
    <div className="fixed inset-0 z-[9999] w-screen h-screen bg-[var(--bg)] text-[var(--ink)] flex flex-col justify-between items-center select-none overflow-hidden font-sans transition-colors duration-200">
      {/* ─── Top Header Bar ─── */}
      <div className="w-full flex justify-between items-center p-4 sm:p-6 z-50">
        <div className="flex items-center gap-2">
          <img
            src={logoSrc}
            alt="StudyLawn Logo"
            className="h-7 w-auto object-contain"
          />
          <span className="font-serif italic text-2xl font-bold tracking-tight text-[var(--ink)]">
            StudyLawn
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 text-[var(--muted)] bg-[var(--card-bg)]/80 backdrop-blur-md border border-[var(--border)] p-1.5 transition-colors">
          <button
            onClick={handleShareLink}
            className="p-1.5 hover:text-[var(--ink)] hover:bg-[var(--surface-subtle)] transition cursor-pointer"
            title="Share Timer Link"
            aria-label="Share Timer Link"
          >
            <Share2 className="w-4 h-4" />
          </button>

          <button
            onClick={handleZoomOut}
            className="p-1.5 hover:text-[var(--ink)] hover:bg-[var(--surface-subtle)] transition cursor-pointer"
            title="Zoom Out (-)"
            aria-label="Zoom Out"
          >
            <Minus className="w-4 h-4" />
          </button>

          <button
            onClick={handleZoomIn}
            className="p-1.5 hover:text-[var(--ink)] hover:bg-[var(--surface-subtle)] transition cursor-pointer"
            title="Zoom In (+)"
            aria-label="Zoom In"
          >
            <Plus className="w-4 h-4" />
          </button>

          <button
            onClick={toggleNativeFullscreen}
            className="p-1.5 hover:text-[var(--ink)] hover:bg-[var(--surface-subtle)] transition cursor-pointer"
            title="Toggle Native Browser Fullscreen"
            aria-label="Toggle Fullscreen"
          >
            {isNativeFullscreen ? (
              <Minimize className="w-4 h-4" />
            ) : (
              <Maximize className="w-4 h-4" />
            )}
          </button>

          <button
            onClick={onBackToDashboard}
            className="p-1.5 text-[var(--muted)] hover:text-[#f87171] hover:bg-[#f87171]/10 transition cursor-pointer ml-1"
            title="Exit Focus View (Esc)"
            aria-label="Close Focus View"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* Copy Toast Notification */}
      {copiedToast && (
        <div className="absolute top-16 right-6 bg-[var(--card-bg)] border border-[var(--border-strong)] text-[var(--ink)] font-mono text-xs px-3.5 py-2 animate-fadeIn z-50 shadow-xl">
          Link copied to clipboard
        </div>
      )}

      {/* ─── Center Display: Prestigious Editorial Numerals ─── */}
      <div
        className="flex-1 flex flex-col items-center justify-center w-full px-2 sm:px-8 max-w-full overflow-hidden"
        onClick={toggleTimer}
        title="Click to Start / Pause (Spacebar)"
      >
        {(() => {
          const displayStr = formatTimerDisplay(timeLeft);
          const isLongFormat = displayStr.length > 5; // e.g. 01:00:00 (8 chars)
          const minFontSize = isLongFormat ? '1.75rem' : '3.2rem';
          const vwFontSize = isLongFormat ? '8.2vw' : '13.5vw';

          return (
            <div
              className="fullscreen-timer-display cursor-pointer transition-transform duration-100 ease-out tabular-nums drop-shadow-sm hover:opacity-95 max-w-full whitespace-nowrap tracking-tight text-[var(--color-timer)]"
              style={{
                fontSize: `calc(clamp(${minFontSize}, ${vwFontSize}, 11rem) * ${zoomScale})`,
              }}
            >
              {displayStr}
            </div>
          );
        })()}
      </div>

      {/* ─── Bottom Theme-Synchronized Control Buttons ─── */}
      <div className="w-full flex justify-center items-center pb-8 sm:pb-12 z-50 px-4">
        <div className="flex items-center gap-3 sm:gap-4 font-mono text-xs uppercase tracking-wider">
          {/* Edit Timer Button */}
          <button
            onClick={() => {
              setEditHours(Math.floor(timerMinutes / 60));
              setEditMinutes(timerMinutes % 60);
              setIsEditModalOpen(true);
            }}
            className="btn-editorial-outline py-2.5 px-5 sm:px-6"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Set Duration</span>
          </button>

          {/* Reset Button */}
          <button
            onClick={resetTimer}
            className="btn-editorial-outline py-2.5 px-5 sm:px-6"
            title="Reset timer (R)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          {/* Start / Pause Button */}
          <button
            onClick={toggleTimer}
            className="btn-editorial py-2.5 px-7 sm:px-8"
          >
            {isTimerRunning ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Start</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ─── Set Duration Modal ─── */}
      {isEditModalOpen && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
          onClick={() => setIsEditModalOpen(false)}
        >
          <div
            className="editorial-card w-full max-w-sm p-6 sm:p-7 space-y-5 text-[var(--ink)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div>
                <div className="editorial-label">Timer Duration</div>
                <h3 className="font-serif font-semibold text-2xl text-[var(--ink)]">Set Focus Block</h3>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApplyCustomTime} className="space-y-4 font-mono text-xs">
              {/* Hours / Minutes Inputs */}
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="space-y-1">
                  <label className="editorial-label block">Hours</label>
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={editHours}
                    onChange={(e) => setEditHours(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-full bg-[var(--surface-subtle)] border border-[var(--border-strong)] p-2.5 text-center text-xl font-timer text-[var(--ink)] outline-none focus:border-[var(--accent)]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="editorial-label block">Minutes</label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={editMinutes}
                    onChange={(e) => setEditMinutes(Math.max(0, Math.min(59, parseInt(e.target.value, 10) || 0)))}
                    className="w-full bg-[var(--surface-subtle)] border border-[var(--border-strong)] p-2.5 text-center text-xl font-timer text-[var(--ink)] outline-none focus:border-[var(--accent)]"
                  />
                </div>
              </div>

              {/* Quick Presets */}
              <div className="pt-2 border-t border-[var(--border)]">
                <div className="editorial-label mb-2">
                  Quick Presets:
                </div>
                <div className="grid grid-cols-5 gap-1.5 font-mono text-xs">
                  {[15, 25, 45, 60, 90].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => {
                        setEditHours(Math.floor(mins / 60));
                        setEditMinutes(mins % 60);
                      }}
                      className="py-1.5 bg-[var(--surface-subtle)] hover:bg-[var(--card-hover)] text-[var(--ink)] text-center border border-[var(--border)] cursor-pointer"
                    >
                      {mins >= 60 ? `${mins / 60}h` : `${mins}m`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-xs text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-editorial py-2 px-5 text-xs"
                >
                  Apply Duration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
