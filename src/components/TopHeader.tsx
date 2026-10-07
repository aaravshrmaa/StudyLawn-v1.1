import React, { useState } from 'react';
import { Menu, X, Sun, Moon, Settings, Maximize2, Minimize2 } from 'lucide-react';
import { ActiveTab } from '../types';
import { useStudyTheme } from '../context/ThemeContext';

interface TopHeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  setActiveTab,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
}) => {
  const { theme, cycleTheme, themeLabel } = useStudyTheme();
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const logoSrc = theme === 'paper' ? '/studylawnlogo.png' : '/studylawnlogo.png';

  return (
    <header className="w-full bg-[var(--surface-subtle)]/95 backdrop-blur-md border-b border-[var(--border)] h-14 sm:h-16 flex items-center justify-between px-3 sm:px-6 fixed top-0 left-0 right-0 z-50 select-none">
      {/* Mobile Left: 3-Line Corner Hamburger Menu */}
      <div className="flex md:hidden items-center w-10">
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen((prev) => !prev)}
          className="p-2 text-[var(--ink)] bg-[var(--card-bg)] border border-[var(--border)] hover:border-[var(--accent)] transition-all cursor-pointer rounded-lg active:scale-95 shadow-2xs"
          title="Toggle Navigation Menu"
          aria-label="Toggle Navigation Menu"
          aria-expanded={isMobileMenuOpen}
        >
          {isMobileMenuOpen ? (
            <X className="w-4 h-4 text-[var(--accent)]" />
          ) : (
            <Menu className="w-4 h-4 text-[var(--ink)]" />
          )}
        </button>
      </div>

      {/* Desktop Brand Logo on the Left / Mobile Centered Brand Logo */}
      <div className="flex-1 md:flex-initial flex items-center justify-center md:justify-start">
        <button
          type="button"
          onClick={() => setActiveTab('dashboard')}
          className="flex items-center gap-2 sm:gap-2.5 text-center md:text-left cursor-pointer group"
          title="StudyLawn Home"
        >
          <img
            src={logoSrc}
            alt="StudyLawn Logo"
            className="h-7 sm:h-9 w-auto object-contain transition-transform group-hover:scale-105"
          />
          <span className="font-serif italic text-xl sm:text-3xl font-bold tracking-tight text-[var(--ink)] group-hover:opacity-85 transition-opacity leading-none">
            StudyLawn
          </span>
        </button>
      </div>

      {/* Spacious / Empty Middle Section on Desktop */}
      <div className="hidden md:flex flex-1" />

      {/* Right Controls */}
      <div className="flex items-center justify-end w-10 md:w-auto gap-1.5 sm:gap-3 text-[var(--muted)]">
        {/* Fullscreen Toggle (Hidden on mobile) */}
        <button
          type="button"
          onClick={toggleFullscreen}
          className="hidden md:flex p-2 hover:text-[var(--ink)] hover:bg-[var(--card-hover)] transition-colors cursor-pointer"
          title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          aria-label="Toggle Fullscreen"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>

        {/* Theme Switcher */}
        <button
          type="button"
          onClick={cycleTheme}
          className="flex p-2 hover:text-[var(--ink)] hover:bg-[var(--card-hover)] transition-colors cursor-pointer"
          title={`Current Theme: ${themeLabel} (Click to cycle)`}
          aria-label="Cycle Color Theme"
        >
          {theme === 'paper' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>

        {/* Settings Quick Access (Hidden on mobile header) */}
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className="hidden md:flex p-2 hover:text-[var(--ink)] hover:bg-[var(--card-hover)] transition-colors cursor-pointer"
          title="Open Settings"
          aria-label="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};

