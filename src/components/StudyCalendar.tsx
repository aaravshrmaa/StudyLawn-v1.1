import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Target,
} from 'lucide-react';
import {
  useTimer,
  getLocalDateStr,
  getLocalFormattedDate,
  getLocalFormattedTime,
  getTimezoneDateComponents,
} from '../context/TimerContext';
import { EditGoalModal } from './EditGoalModal';

export const StudyCalendar: React.FC = () => {
  const {
    dailyLogs,
    updateLogForDate,
    studyTarget,
    liveStudyHours,
    selectedCalendarDate,
    setSelectedCalendarDate,
    completionTasks,
    addCompletionTask,
    userTimezone,
    currentTimezoneLabel,
    todayStr,
  } = useTimer();

  const todayKey = todayStr;
  const selectedDateKey = selectedCalendarDate || todayKey;
  
  const [viewDate, setViewDate] = useState<Date>(() => {
    const { year, month, day } = getTimezoneDateComponents(new Date(), userTimezone);
    return new Date(year, month - 1, day);
  });

  // When user switches timezone in settings or midnight arrives, keep calendar view aligned to present day
  useEffect(() => {
    const { year, month, day } = getTimezoneDateComponents(new Date(), userTimezone);
    setViewDate(new Date(year, month - 1, day));
  }, [userTimezone, todayStr]);

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editHoursInput, setEditHoursInput] = useState<string>('');
  const [isGoalModalOpen, setIsGoalModalOpen] = useState<boolean>(false);

  const [isAddingTask, setIsAddingTask] = useState<boolean>(false);
  const [quickTaskTitle, setQuickTaskTitle] = useState<string>('');

  const selTasks = completionTasks.filter(
    (t) => t.date === selectedDateKey
  );

  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();

  const handlePrevMonth = () => {
    setViewDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleGoToToday = () => {
    const { year, month, day } = getTimezoneDateComponents(new Date(), userTimezone);
    setViewDate(new Date(year, month - 1, day));
    setSelectedCalendarDate(todayStr);
  };

  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const monthName = new Date(currentYear, currentMonth, 1).toLocaleString(undefined, {
    month: 'long',
  });

  const selectedLoggedHours =
    selectedDateKey === todayKey ? liveStudyHours : (dailyLogs[selectedDateKey] || 0);

  const formatHoursToHms = (hrs: number) => {
    const safeHrs = isNaN(hrs) || hrs < 0 ? 0 : hrs;
    const totalSecs = Math.round(safeHrs * 3600);
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    return { h, m, s, totalSecs };
  };

  const { h: selH, m: selM, s: selS } = formatHoursToHms(selectedLoggedHours);

  const handleSaveHours = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(editHoursInput);
    if (!isNaN(parsed) && parsed >= 0) {
      updateLogForDate(selectedDateKey, parsed);
      setIsEditing(false);
    }
  };

  const handleAddQuickTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTaskTitle.trim()) return;
    addCompletionTask({
      title: quickTaskTitle.trim(),
      category: 'Practice',
      priority: 'High',
      estimatedMinutes: 60,
      completed: false,
      date: selectedDateKey,
    });
    setQuickTaskTitle('');
    setIsAddingTask(false);
  };

  const getFormattedSelectedDate = (dateKey: string) => {
    const [y, m, d] = dateKey.split('-').map(Number);
    if (!y || !m || !d) return dateKey;
    const dateObj = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
    try {
      return dateObj.toLocaleDateString(undefined, {
        timeZone: userTimezone,
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return dateObj.toLocaleDateString(undefined, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    }
  };

  return (
    <div className="editorial-card p-3.5 sm:p-8 space-y-4 sm:space-y-6">
      {/* Calendar Heading Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border-strong)] font-mono text-xs uppercase tracking-wider">
        <div className="flex items-center gap-2">
          <span className="font-bold text-[var(--ink)] text-sm sm:text-base">{monthName} Study Map</span>
          <span className="text-[10px] text-[var(--muted)] font-normal">// {currentYear} &bull; {currentTimezoneLabel}</span>
        </div>

        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 font-mono text-xs w-full sm:w-auto">
          <button
            onClick={() => setIsGoalModalOpen(true)}
            className="inline-flex items-center gap-1 px-2 py-1 bg-[var(--surface-subtle)] border border-[var(--border-strong)] hover:border-[var(--accent)] text-[var(--accent)] hover:text-[var(--ink)] font-sans text-[11px] font-semibold transition-all cursor-pointer shadow-xs"
            title="Change Daily Target Hours"
          >
            <Target className="w-3 h-3" />
            <span>Target: {studyTarget}h</span>
          </button>

          <div className="flex items-center gap-1">
            <button
              onClick={handlePrevMonth}
              className="p-1 hover:text-[var(--accent)] transition-colors cursor-pointer"
              title="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="min-w-[65px] text-center font-bold text-[var(--ink)] text-xs">
              {monthName.slice(0, 3).toUpperCase()} {currentYear}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1 hover:text-[var(--accent)] transition-colors cursor-pointer"
              title="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={handleGoToToday}
              className="text-[10px] uppercase tracking-wider text-[var(--accent)] hover:underline cursor-pointer ml-1 font-bold"
            >
              [ TODAY ]
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        {/* Left Column: Calendar Days Matrix */}
        <div className="lg:col-span-8 space-y-2 sm:space-y-3">
          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-px text-center font-mono text-[9px] sm:text-[10px] text-[var(--muted)] uppercase tracking-wider pb-1.5 border-b border-[var(--border)]">
            <span className="text-[#f87171]">Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-7 gap-px bg-[var(--border)] border border-[var(--border)]">
            {Array.from({ length: firstDayOfMonth }).map((_, idx) => (
              <div key={`empty-${idx}`} className="h-11 sm:h-20 bg-[var(--surface-subtle)]/40" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(
                dayNum
              ).padStart(2, '0')}`;
              const isToday = dateKey === todayKey;
              const isSelected = dateKey === selectedDateKey;

              const dayHours = dateKey === todayKey ? liveStudyHours : (dailyLogs[dateKey] || 0);
              const hasHours = dayHours > 0;
              const isTargetMet = dayHours >= studyTarget;
              const dayTasksCount = completionTasks.filter(
                (t) => (t.date || todayKey) === dateKey
              ).length;

              return (
                <button
                  key={dateKey}
                  onClick={() => {
                    setSelectedCalendarDate(dateKey);
                    setIsEditing(false);
                  }}
                  className={`h-11 sm:h-20 p-1 sm:p-2 text-left flex flex-col justify-between transition-colors cursor-pointer relative ${
                    isToday
                      ? 'bg-[var(--accent)] text-[var(--accent-text)] font-bold'
                      : isSelected
                      ? 'bg-[var(--card-hover)] ring-2 ring-inset ring-[var(--accent)] text-[var(--ink)]'
                      : 'bg-[var(--card-bg)] hover:bg-[var(--card-hover)] text-[var(--ink)]'
                  }`}
                >
                  <div className="flex items-center justify-between w-full font-mono text-[10px] sm:text-xs leading-none">
                    <span className={isToday ? 'text-[var(--accent-text)] font-bold' : isSelected ? 'text-[var(--accent)] font-bold' : 'text-[var(--ink)]'}>
                      {dayNum}
                    </span>
                    {dayTasksCount > 0 && (
                      <span className={`text-[8px] sm:text-[9px] font-mono ${isToday ? 'text-[var(--accent-text)] font-bold' : 'text-[var(--muted)]'}`}>
                        {dayTasksCount}t
                      </span>
                    )}
                  </div>

                  <div className="font-mono text-[9px] sm:text-[10px] leading-none mt-auto">
                    {hasHours ? (
                      <span className={isTargetMet ? (isToday ? 'text-emerald-300 font-bold underline' : 'text-emerald-600 dark:text-emerald-400 font-bold underline') : isToday ? 'text-[var(--accent-text)] font-bold' : 'text-[var(--muted)]'}>
                        {dayHours.toFixed(1)}h
                      </span>
                    ) : (
                      <span className="opacity-0">-</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between font-mono text-[10px] text-[var(--muted)] pt-2">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 font-semibold text-[var(--ink)]">
                <span className="w-2.5 h-2.5 bg-[var(--accent)] inline-block" /> Present Day (Today)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 border border-[var(--accent)] inline-block" /> Selected
              </span>
            </div>
            <span>Daily Focus Map</span>
          </div>
        </div>

        {/* Right Column: Selected Date Inspector */}
        <div className="lg:col-span-4 bg-[var(--surface-subtle)] border border-[var(--border)] p-5 space-y-4">
          <div>
            <div className="editorial-label mb-1">Date Inspector</div>
            <h4 className="font-serif text-2xl font-semibold text-[var(--ink)] leading-tight">
              {getFormattedSelectedDate(selectedDateKey)}
            </h4>
          </div>

          <div className="border-t border-[var(--border)] pt-3">
            <div className="flex items-baseline justify-between">
              <div className="font-cinzel text-3xl font-semibold text-[var(--ink)] tabular-nums">
                {selH}h {selM}m
              </div>
              <div className="font-mono text-xs text-[var(--muted)] tabular-nums">
                {Math.round((selectedLoggedHours / studyTarget) * 100)}% of Goal
              </div>
            </div>

            <div className="w-full bg-[var(--border-strong)] h-1 mt-2">
              <div
                className="bg-[var(--color-timer)] h-1 transition-all"
                style={{
                  width: `${Math.min(100, Math.round((selectedLoggedHours / studyTarget) * 100))}%`,
                }}
              />
            </div>
          </div>

          {/* Manual Adjust Hours */}
          <div className="border-t border-[var(--border)] pt-3">
            <div className="flex items-center justify-between font-mono text-xs text-[var(--muted)] mb-2">
              <span>Manual Entry</span>
              <button
                onClick={() => {
                  setIsEditing(!isEditing);
                  setEditHoursInput(selectedLoggedHours.toString());
                }}
                className="text-[var(--ink)] hover:text-[var(--accent)] cursor-pointer"
              >
                {isEditing ? '[ Cancel ]' : '[ Edit ]'}
              </button>
            </div>

            {isEditing && (
              <form onSubmit={handleSaveHours} className="flex gap-2">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="24"
                  value={editHoursInput}
                  onChange={(e) => setEditHoursInput(e.target.value)}
                  className="w-24 bg-[var(--card-bg)] border border-[var(--border-strong)] px-2 py-1 font-mono text-xs text-[var(--ink)] outline-none"
                />
                <button
                  type="submit"
                  className="px-3 py-1 bg-[var(--accent)] text-[var(--accent-text)] font-mono text-[10px] uppercase tracking-wider font-bold"
                >
                  Save
                </button>
              </form>
            )}
          </div>

          {/* Tasks for this day */}
          <div className="border-t border-[var(--border)] pt-3 space-y-3">
            <div className="flex items-center justify-between font-mono text-xs text-[var(--ink)]">
              <span>OBJECTIVES ({selTasks.length})</span>
              <button
                onClick={() => setIsAddingTask(!isAddingTask)}
                className="text-[10px] uppercase tracking-wider text-[var(--accent)] hover:underline cursor-pointer font-bold"
              >
                {isAddingTask ? '[-] Close' : '[+] Add'}
              </button>
            </div>

            {isAddingTask && (
              <form onSubmit={handleAddQuickTask} className="space-y-2 bg-[var(--card-bg)] p-3 border border-[var(--border)]">
                <input
                  type="text"
                  value={quickTaskTitle}
                  onChange={(e) => setQuickTaskTitle(e.target.value)}
                  placeholder="Objective title..."
                  className="w-full border-b border-[var(--border-strong)] p-1 font-serif italic text-sm text-[var(--ink)] outline-none bg-transparent"
                  autoFocus
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-3 py-1 bg-[var(--accent)] text-[var(--accent-text)] font-mono text-[10px] uppercase tracking-wider font-bold"
                  >
                    Add
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
              {selTasks.length === 0 ? (
                <div className="font-serif italic text-sm text-[var(--muted)] py-3 text-center">
                  No objectives logged for this date.
                </div>
              ) : (
                selTasks.map((t) => (
                  <div
                    key={t.id}
                    className="w-full p-2 bg-[var(--card-bg)] border border-[var(--border)] flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="w-3.5 h-3.5 border border-[var(--border-strong)] flex items-center justify-center shrink-0">
                        {t.completed && <Check className="w-3 h-3 text-[var(--accent)]" />}
                      </div>
                      <span className={`text-xs truncate ${t.completed ? 'line-through text-[var(--muted)]' : 'text-[var(--ink)]'}`}>
                        {t.title}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <EditGoalModal isOpen={isGoalModalOpen} onClose={() => setIsGoalModalOpen(false)} />
    </div>
  );
};
