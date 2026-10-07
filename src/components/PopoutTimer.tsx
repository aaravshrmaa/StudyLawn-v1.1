import React, { useState, useEffect, useRef } from 'react';
import { useTimer } from '../context/TimerContext';
import { Play, Pause, RotateCcw, Maximize2, Minimize2, GripHorizontal } from 'lucide-react';
import { ActiveTab } from '../types';

interface PopoutTimerProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

export const PopoutTimer: React.FC<PopoutTimerProps> = ({ activeTab, setActiveTab }) => {
  const {
    timeLeft,
    isTimerRunning,
    timerMinutes,
    toggleTimer,
    resetTimer,
    formatTimer,
    isMainTimerInView,
    mainTimerRef,
    isPopoutMinimized,
    setIsPopoutMinimized,
  } = useTimer();

  // Floating coordinates state (defaulting to bottom right)
  const [position, setPosition] = useState<{ x: number; y: number }>({
    x: window.innerWidth - 300,
    y: window.innerHeight - 200,
  });

  const [isDragging, setIsDragging] = useState(false);
  const dragStartOffset = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Update initial position on screen size changes or first render so it is safely in the bottom right corner
  useEffect(() => {
    const handleResize = () => {
      // Keep it within bounds if screen sizes shift
      setPosition((prev) => {
        const width = isPopoutMinimized ? 180 : 280;
        const height = isPopoutMinimized ? 48 : 220;
        const x = Math.max(16, Math.min(window.innerWidth - width - 24, prev.x));
        const y = Math.max(16, Math.min(window.innerHeight - height - 24, prev.y));
        return { x, y };
      });
    };

    window.addEventListener('resize', handleResize);
    // Initialize positioning cleanly
    const width = isPopoutMinimized ? 180 : 280;
    const height = isPopoutMinimized ? 48 : 220;
    setPosition({
      x: window.innerWidth - width - 24,
      y: window.innerHeight - height - 24,
    });

    return () => window.removeEventListener('resize', handleResize);
  }, [isPopoutMinimized]);

  // Window-level dragging event listeners for 100% bulletproof smooth movement
  useEffect(() => {
    if (!isDragging) return;

    const handlePointerMove = (e: PointerEvent) => {
      const width = isPopoutMinimized ? 180 : 280;
      const height = isPopoutMinimized ? 48 : 220;
      
      // Calculate new position
      let newX = e.clientX - dragStartOffset.current.x;
      let newY = e.clientY - dragStartOffset.current.y;

      // Restrict within viewport boundaries with 16px padding
      newX = Math.max(16, Math.min(window.innerWidth - width - 16, newX));
      newY = Math.max(16, Math.min(window.innerHeight - height - 16, newY));

      setPosition({ x: newX, y: newY });
    };

    const handlePointerUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDragging, isPopoutMinimized]);

  const startDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return; // left click/primary touches only
    e.preventDefault();
    
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      dragStartOffset.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
      setIsDragging(true);
    }
  };

  // Decide if we should render the floating timer widget at all
  const shouldShowPopout =
    (isTimerRunning || timeLeft < timerMinutes * 60) &&
    activeTab !== 'focus' &&
    (activeTab !== 'dashboard' || !isMainTimerInView);

  if (!shouldShowPopout) return null;

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 9999,
        touchAction: 'none',
      }}
      className={`select-none transition-shadow duration-200 ${
        isDragging ? 'shadow-2xl scale-[1.02]' : 'shadow-xl'
      }`}
    >
      {isPopoutMinimized ? (
        /* ─── THEME-AWARE MINI WIDGET STATE ─── */
        <div 
          className="flex items-center gap-2.5 bg-[var(--card-bg)]/95 backdrop-blur-md border border-[var(--border-strong)] text-[var(--ink)] rounded-lg px-3 py-2 cursor-grab active:cursor-grabbing font-mono text-xs shadow-lg"
          onPointerDown={startDrag}
        >
          {/* Elegant Grip Handle */}
          <GripHorizontal className="w-3.5 h-3.5 text-[var(--muted)] hover:text-[var(--ink)] shrink-0" />
          
          {/* Live pulsing state */}
          <div className="relative flex h-1.5 w-1.5 shrink-0">
            {isTimerRunning && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-timer)] opacity-75"></span>
            )}
            <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${isTimerRunning ? 'bg-[var(--color-timer)]' : 'bg-[var(--muted)]'}`} />
          </div>

          <span className="font-serif text-base font-semibold text-[var(--color-timer)] tracking-tight leading-none tabular-nums">
            {formatTimer(timeLeft)}
          </span>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsPopoutMinimized(false);
            }}
            className="ml-1 p-1 text-[var(--muted)] hover:text-[var(--ink)] transition rounded-md hover:bg-[var(--card-hover)] cursor-pointer"
            title="Expand timer"
          >
            <Maximize2 className="w-3 h-3" />
          </button>
        </div>
      ) : (
        /* ─── THEME-AWARE EXPANDED STATE (Mac-like floating widget) ─── */
        <div className="w-[280px] bg-[var(--card-bg)]/95 backdrop-blur-md border border-[var(--border-strong)] text-[var(--ink)] rounded-xl p-3.5 flex flex-col gap-3 shadow-2xl">
          
          {/* Premium Widget Header Area / Drag Area */}
          <div 
            className="flex items-center justify-between pb-2 border-b border-[var(--border)] cursor-grab active:cursor-grabbing"
            onPointerDown={startDrag}
            title="Drag widget from here"
          >
            <div className="flex items-center gap-1.5 text-[var(--muted)]">
              <GripHorizontal className="w-4 h-4 text-[var(--muted)]" />
              <span className="font-mono text-[10px] uppercase tracking-wider font-bold text-[var(--ink)]">Focus Timer</span>
            </div>
            
            {/* Window control circles (Mac style) */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  setActiveTab('focus');
                  setIsPopoutMinimized(false);
                }}
                className="p-1 text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--card-hover)] rounded transition cursor-pointer"
                title="Enter Dedicated Fullscreen Focus Timer"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsPopoutMinimized(true)}
                className="p-1 text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--card-hover)] rounded transition cursor-pointer"
                title="Minimize"
              >
                <Minimize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* High-End Clock Screen Display */}
          <div className="bg-[var(--surface-subtle)] border border-[var(--border)] rounded-lg py-4 text-center select-none shadow-inner">
            <div className="text-4xl font-serif font-bold tracking-tight text-[var(--color-timer)] leading-none tabular-nums">
              {formatTimer(timeLeft)}
            </div>
            <div className="text-[10px] uppercase font-mono tracking-widest text-[var(--muted)] mt-1.5">
              Session Interval
            </div>
          </div>

          {/* Precise Controls Grid */}
          <div className="grid grid-cols-3 gap-2 font-mono text-xs">
            <button
              onClick={toggleTimer}
              className="col-span-2 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 font-bold transition duration-200 cursor-pointer bg-[var(--color-timer)] hover:opacity-90 text-white"
            >
              {isTimerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>{isTimerRunning ? 'Pause' : 'Start'}</span>
            </button>
            <button
              onClick={resetTimer}
              className="py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 border border-[var(--border-strong)] hover:bg-[var(--card-hover)] text-[var(--ink)] transition cursor-pointer"
              title="Reset Timer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
