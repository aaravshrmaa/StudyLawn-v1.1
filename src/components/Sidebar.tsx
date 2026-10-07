import React, { useEffect } from 'react';
import {
  X,
  LayoutDashboard,
  Calendar,
  ListTodo,
  FolderArchive,
  Settings,
  Sun,
  Moon,
} from 'lucide-react';
import { ActiveTab } from '../types';
import { useTimer, getLocalDateStr } from '../context/TimerContext';
import { useStudyTheme } from '../context/ThemeContext';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const NAV_ITEMS: {
  id: ActiveTab;
  label: string;
  icon: React.FC<{ className?: string }>;
}[] = [
  { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
  { id: 'timetable', label: 'Planner', icon: Calendar },
  { id: 'completion', label: 'Tasks', icon: ListTodo },
  { id: 'tests', label: 'Vault', icon: FolderArchive },
  { id: 'profile', label: 'Settings', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
}) => {
  const { completionTasks, todayStr } = useTimer();
  const { theme, cycleTheme, themeLabel } = useStudyTheme();
  const logoSrc = theme === 'paper' ? '/studylawnlogo.png' : '/studylawnlogo.png';
  const currentDayTaskCount = completionTasks.filter(
    (task) => (task.date || todayStr) === todayStr
  ).length;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMobileMenuOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setIsMobileMenuOpen]);

  const handleSelectTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* ─── Desktop Left Vertical Column (Fixed Below Top Header with Gap) ─── */}
      <aside
        className="hidden md:flex flex-col w-20 lg:w-22 shrink-0 select-none border-r border-[var(--border)] bg-[var(--surface-subtle)] fixed top-16 sm:top-18 left-0 bottom-0 z-40 overflow-y-auto pt-3"
        aria-label="Sidebar navigation"
      >
        <nav className="flex flex-col divide-y divide-[var(--border)] border-t border-b border-[var(--border)]">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => handleSelectTab(id)}
                aria-current={isActive ? 'page' : undefined}
                className={`relative py-4 px-1 flex flex-col items-center justify-center text-center transition-all cursor-pointer group ${
                  isActive
                    ? 'bg-[var(--accent-muted)] text-[var(--ink)] font-bold shadow-sm'
                    : 'bg-transparent text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--card-hover)]'
                }`}
              >
                {/* Active Indicator Line */}
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--accent)]" />
                )}

                {/* Icon with pending badge if applicable */}
                <div className="relative mb-1.5">
                  <Icon
                    className={`w-5 h-5 lg:w-5.5 lg:h-5.5 transition-transform group-hover:scale-105 ${
                      isActive ? 'text-[var(--ink)] stroke-[2.2]' : 'text-current'
                    }`}
                  />
                  {id === 'completion' && currentDayTaskCount > 0 && (
                    <span
                      className="absolute -top-1.5 -right-2.5 text-[8px] min-w-[14px] h-3.5 px-1 flex items-center justify-center font-mono font-bold tabular-nums rounded-none bg-[var(--color-timer)] text-white"
                      title={`${currentDayTaskCount} tasks for today`}
                    >
                      {currentDayTaskCount}
                    </span>
                  )}
                </div>

                {/* Column Label */}
                <span
                  className={`font-sans text-[11px] lg:text-xs font-semibold tracking-wide leading-tight ${
                    isActive ? 'text-[var(--ink)]' : 'text-current'
                  }`}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* ─── Mobile Slide-Over Drawer Navigation (Ultra-Smooth Hardware-Accelerated Transition) ─── */}
      <div
        className={`fixed inset-0 z-50 md:hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isMobileMenuOpen
            ? 'bg-black/60 backdrop-blur-xs opacity-100 pointer-events-auto'
            : 'bg-black/0 backdrop-blur-none opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
        aria-hidden={!isMobileMenuOpen}
      >
        <div
          className={`w-[82vw] max-w-xs h-full bg-[var(--card-bg)] border-r border-[var(--border)] p-5 flex flex-col justify-between shadow-2xl rounded-r-2xl transform-gpu transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform ${
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Drawer Header */}
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
              <div className="flex items-center gap-2">
                <img
                  src={logoSrc}
                  alt="StudyLawn Logo"
                  className="h-7 w-auto object-contain"
                />
                <span className="font-serif italic text-2xl font-semibold text-[var(--ink)]">
                  StudyLawn
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer rounded-lg transition-colors"
                title="Close Menu"
                aria-label="Close Menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Items */}
            <nav className="space-y-2 font-mono text-xs uppercase tracking-wider">
              {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
                const isActive = activeTab === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => handleSelectTab(id)}
                    className={`w-full flex items-center justify-between p-3.5 transition-all text-left cursor-pointer border rounded-xl ${
                      isActive
                        ? 'bg-[var(--accent)] text-[var(--accent-text)] border-[var(--accent)] font-bold shadow-xs'
                        : 'bg-[var(--surface-subtle)]/60 text-[var(--ink)] border-[var(--border)] hover:bg-[var(--surface-subtle)] hover:border-[var(--border-strong)]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-5 h-5 ${isActive ? 'text-[var(--accent-text)]' : 'text-[var(--muted)]'}`} />
                      <span>{label}</span>
                    </div>

                    {id === 'completion' && currentDayTaskCount > 0 && (
                      <span
                        className={`text-[10px] px-2 py-0.5 font-bold tabular-nums rounded-full ${
                          isActive
                            ? 'bg-[var(--accent-text)] text-[var(--accent)]'
                            : 'bg-[var(--color-timer)] text-white'
                        }`}
                      >
                        {currentDayTaskCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Additional Mobile Actions */}
            <div className="pt-2 border-t border-[var(--border)] space-y-2">
              <button
                type="button"
                onClick={cycleTheme}
                className="w-full flex items-center justify-between p-3 text-left font-mono text-xs uppercase tracking-wider text-[var(--muted)] hover:text-[var(--ink)] bg-[var(--surface-subtle)] border border-[var(--border)] cursor-pointer rounded-xl"
              >
                <div className="flex items-center gap-3">
                  {theme === 'paper' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                  <span>Theme</span>
                </div>
                <span className="text-[10px] text-[var(--ink)] font-bold">{themeLabel}</span>
              </button>
            </div>
          </div>

          {/* Drawer Footer */}
          <div className="border-t border-[var(--border)] pt-4 font-mono text-[10px] text-[var(--muted)] flex items-center justify-between">
            <span>Deep Work &bull; Focus</span>
            <span className="text-[var(--accent)] font-bold">STUDYLAWN</span>
          </div>
        </div>
      </div>
    </>
  );
};
