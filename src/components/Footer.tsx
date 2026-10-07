import React from 'react';
import { useStudyTheme } from '../context/ThemeContext';
import { useTimer, getLocalFormattedDate, getLocalFormattedTime } from '../context/TimerContext';
import { ActiveTab } from '../types';
import { Globe, Clock } from 'lucide-react';

interface FooterProps {
  onNavigate?: (tab: ActiveTab) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const { theme, themeLabel } = useStudyTheme();
  const { userTimezone, currentTimezoneLabel } = useTimer();

  const logoSrc = theme === 'paper' ? '/studylawnlogo.png' : '/studylawnlogo.png';
  const todayDateStr = getLocalFormattedDate(new Date(), userTimezone);
  const currentTimeStr = getLocalFormattedTime(new Date(), false, userTimezone);

  const handleNavigate = (tab: ActiveTab) => {
    if (onNavigate) {
      onNavigate(tab);
    } else {
      const pathMap: Record<ActiveTab, string> = {
        dashboard: '/',
        timetable: '/planner',
        completion: '/tasks',
        tests: '/vault',
        profile: '/settings',
        focus: '/focus',
        terms: '/terms',
        privacy: '/privacy',
        about: '/about',
      };
      const targetPath = pathMap[tab] || '/';
      window.history.pushState(null, '', targetPath);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="w-full border-t border-[var(--border)] bg-[var(--surface-subtle)] text-[var(--ink)] pt-12 pb-8 px-4 sm:px-8 lg:px-12 mt-auto transition-colors font-sans select-none">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* ─── Main Footer Grid (3 Columns) ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 text-xs">
          {/* Column 1: Brand & Timezone */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <img
                src={logoSrc}
                alt="StudyLawn Logo"
                className="h-7 w-auto object-contain"
              />
              <span className="font-serif italic text-2xl font-bold tracking-tight text-[var(--ink)]">
                StudyLawn
              </span>
            </div>

            <p className="text-xs text-[var(--muted)] leading-relaxed">
              StudyLawn is your distraction-free daily study workspace. Clock honest study hours, organize schedules, prioritize tasks, and keep your revision notes in one place.
            </p>

            <div className="flex flex-col gap-1.5 font-mono text-[11px] text-[var(--muted)] pt-1">
              <div className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
                <span>Timezone: <strong className="text-[var(--ink)]">{currentTimezoneLabel}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
                <span>{currentTimeStr} &bull; {todayDateStr}</span>
              </div>
            </div>
          </div>

          {/* Column 2: Workspace Tools */}
          <div className="space-y-2.5">
            <div className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--ink)] border-b border-[var(--border)] pb-1.5">
              Workspace Tools
            </div>
            <ul className="space-y-2 text-xs text-[var(--muted)]">
              <li>
                <button
                  type="button"
                  onClick={() => handleNavigate('dashboard')}
                  className="hover:text-[var(--accent)] hover:underline cursor-pointer transition-colors text-left"
                >
                  Study Tracker &bull; Overview &amp; Timer
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleNavigate('timetable')}
                  className="hover:text-[var(--accent)] hover:underline cursor-pointer transition-colors text-left"
                >
                  Study Planner &bull; Daily Schedule
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleNavigate('completion')}
                  className="hover:text-[var(--accent)] hover:underline cursor-pointer transition-colors text-left"
                >
                  Tasks &bull; Priority &amp; Syllabus
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleNavigate('tests')}
                  className="hover:text-[var(--accent)] hover:underline cursor-pointer transition-colors text-left"
                >
                  Vault &bull; Revision &amp; Documents
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleNavigate('focus')}
                  className="hover:text-[var(--accent)] hover:underline cursor-pointer transition-colors text-left"
                >
                  Focus Clock &bull; Fullscreen Mode
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Information & Settings */}
          <div className="space-y-2.5">
            <div className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--ink)] border-b border-[var(--border)] pb-1.5">
              Information
            </div>
            <ul className="space-y-2 text-xs text-[var(--muted)]">
              <li>
                <button
                  type="button"
                  onClick={() => handleNavigate('profile')}
                  className="hover:text-[var(--accent)] hover:underline cursor-pointer transition-colors text-left"
                >
                  Settings &amp; Backup
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleNavigate('about')}
                  className="hover:text-[var(--accent)] hover:underline cursor-pointer transition-colors text-left"
                >
                  About StudyLawn
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleNavigate('terms')}
                  className="hover:text-[var(--accent)] hover:underline cursor-pointer transition-colors text-left"
                >
                  Terms of Use
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleNavigate('privacy')}
                  className="hover:text-[var(--accent)] hover:underline cursor-pointer transition-colors text-left"
                >
                  Privacy Policy
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* ─── Bottom Bar ─── */}
        <div className="pt-4 border-t border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-3 font-mono text-[11px] text-[var(--muted)]">
          <div>
            &copy; 2026 StudyLawn &bull; Distraction-Free Daily Study Workspace
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => handleNavigate('about')}
              className="hover:text-[var(--accent)] hover:underline cursor-pointer transition-colors"
            >
              About
            </button>
            <span>&bull;</span>
            <button
              onClick={() => handleNavigate('terms')}
              className="hover:text-[var(--accent)] hover:underline cursor-pointer transition-colors"
            >
              Terms
            </button>
            <span>&bull;</span>
            <button
              onClick={() => handleNavigate('privacy')}
              className="hover:text-[var(--accent)] hover:underline cursor-pointer transition-colors"
            >
              Privacy
            </button>
            <span>&bull;</span>
            <button
              onClick={() => handleNavigate('profile')}
              className="hover:text-[var(--accent)] hover:underline cursor-pointer transition-colors"
            >
              Theme: {themeLabel}
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
