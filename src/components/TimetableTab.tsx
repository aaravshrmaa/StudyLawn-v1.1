import React, { useState, useEffect } from 'react';
import {
  Clock,
  Plus,
  Edit2,
  Trash2,
  Calendar as CalendarIcon,
  Globe,
  CheckCircle2,
  Target,
  ChevronLeft,
  ChevronRight,
  Bookmark,
} from 'lucide-react';
import {
  useTimer,
  getLocalFormattedTime,
  getLocalFormattedDate,
  getSlotTimestamps,
  calculateSlotLiveProgress,
} from '../context/TimerContext';
import { useAuth } from '../context/AuthContext';
import { ScheduledStudySlot, StudyTask } from '../types';
import { SlotEditorModal } from './SlotEditorModal';
import { SlotTemplateModal } from './SlotTemplateModal';

const LiveTimetableClock: React.FC<{ userTimezone?: string; is24h: boolean; label: string }> = ({
  userTimezone,
  is24h,
  label,
}) => {
  const [timeStr, setTimeStr] = useState<string>(() =>
    getLocalFormattedTime(new Date(), is24h, userTimezone)
  );

  useEffect(() => {
    const update = () => {
      setTimeStr(getLocalFormattedTime(new Date(), is24h, userTimezone));
    };
    const interval = window.setInterval(update, 1000);
    return () => window.clearInterval(interval);
  }, [userTimezone, is24h]);

  return (
    <div className="px-2.5 py-1.5 bg-[var(--card-bg)] border border-[var(--border-strong)] text-[var(--ink)] flex items-center gap-2 shrink-0">
      <Globe className="w-3.5 h-3.5 text-[var(--accent)]" />
      <span className="text-[var(--muted)]">{label}:</span>
      <span className="font-bold text-[var(--accent)]">{timeStr}</span>
    </div>
  );
};

export const TimetableTab: React.FC = () => {
  const { profile } = useAuth();
  const {
    scheduledSlots,
    setScheduledSlots,
    addScheduledSlot,
    updateScheduledSlot,
    deleteScheduledSlot,
    toggleScheduledSlotEnabled,
    toggleMarkSlotComplete,
    slotTemplates,
    userTimezone,
    currentTimezoneLabel,
    todayStr,
    tomorrowStr,
    selectedCalendarDate,
    setSelectedCalendarDate,
    getSlotsForDate,
    stepDate,
    formatDisplayDate,
    repeatSlotsEveryday,
    setRepeatSlotsEveryday,
  } = useTimer();

  const is24h = profile?.timeFormat === '24h';
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<ScheduledStudySlot | null>(null);
  const [prefilledTaskForSlot, setPrefilledTaskForSlot] = useState<StudyTask | null>(null);

  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [templateModalMode, setTemplateModalMode] = useState<'save' | 'load'>('load');
  const [scheduleNotice, setScheduleNotice] = useState<string | null>(null);

  // Active date filter (defaults to selected calendar date or today)
  const [activeDate, setActiveDate] = useState<string>(() => selectedCalendarDate || todayStr);
  const [viewScope, setViewScope] = useState<'day' | 'all'>('day');
  const [expandedSlotId, setExpandedSlotId] = useState<string | null>(null);

  // Synchronize when selectedCalendarDate updates externally
  useEffect(() => {
    if (selectedCalendarDate) {
      setActiveDate(selectedCalendarDate);
    }
  }, [selectedCalendarDate]);

  const handleSelectDate = (dateStr: string) => {
    setActiveDate(dateStr);
    setViewScope('day');
    setSelectedCalendarDate(dateStr);
  };

  const handlePrevDay = () => {
    const prev = stepDate(activeDate, -1);
    handleSelectDate(prev);
  };

  const handleNextDay = () => {
    const next = stepDate(activeDate, 1);
    handleSelectDate(next);
  };

  const handleOpenAdd = () => {
    setEditingSlot(null);
    setPrefilledTaskForSlot(null);
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (slot: ScheduledStudySlot) => {
    setEditingSlot(slot);
    setPrefilledTaskForSlot(null);
    setIsEditorOpen(true);
  };

  const handleSaveSlot = (slotData: Omit<ScheduledStudySlot, 'id'>) => {
    if (editingSlot) {
      updateScheduledSlot(editingSlot.id, { ...slotData, date: slotData.date || activeDate });
    } else {
      addScheduledSlot({ ...slotData, date: slotData.date || activeDate });
    }
    setIsEditorOpen(false);
    setEditingSlot(null);
    setPrefilledTaskForSlot(null);
  };

  const handleClearCurrentDay = () => {
    if (window.confirm(`Clear all slots for ${formatDisplayDate(activeDate)}?`)) {
      setScheduledSlots((prev) => prev.filter((s) => (s.date || todayStr) !== activeDate));
    }
  };

  const handleOpenSaveTemplate = () => {
    setTemplateModalMode('save');
    setIsTemplateModalOpen(true);
  };

  const handleOpenLoadTemplate = () => {
    setTemplateModalMode('load');
    setIsTemplateModalOpen(true);
  };

  const handlePopulateEverydayBlocks = () => {
    // Find blocks from today or the most recent scheduled date
    const todayBlocks = scheduledSlots.filter((s) => (s.date ? s.date === todayStr : true));
    let sourceBlocks = todayBlocks;
    if (sourceBlocks.length === 0) {
      const allDates = Array.from(new Set(scheduledSlots.map((s) => s.date).filter(Boolean) as string[])).sort();
      if (allDates.length > 0) {
        const latest = allDates[allDates.length - 1];
        sourceBlocks = scheduledSlots.filter((s) => s.date === latest);
      }
    }
    if (sourceBlocks.length === 0) return;

    const newBlocks: ScheduledStudySlot[] = sourceBlocks.map((s, idx) => ({
      ...s,
      id: `slot-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
      date: activeDate,
      markedComplete: false,
      createdWhenPast: false,
      repeatEveryday: true,
    }));
    setScheduledSlots((prev) => {
      const otherDates = prev.filter((s) => (s.date ? s.date !== activeDate : todayStr !== activeDate));
      return [...otherDates, ...newBlocks];
    });
  };

  // Filter slots for current view
  const currentDaySlots = getSlotsForDate(activeDate);

  const filteredSlots = (
    viewScope === 'all'
      ? scheduledSlots
      : scheduledSlots.filter((slot) => (slot.date ? slot.date === activeDate : todayStr === activeDate))
  ).sort((a, b) => a.startTime.localeCompare(b.startTime));

  const displaySlots =
    viewScope === 'day' && filteredSlots.length === 0 && currentDaySlots.length > 0
      ? currentDaySlots
      : filteredSlots;

  const enabledSlots = displaySlots.filter((s) => s.enabled);
  const totalPlannedMinutes = enabledSlots.reduce((acc, slot) => {
    const { totalSeconds } = getSlotTimestamps(
      slot.startTime,
      slot.endTime,
      new Date(),
      slot.date || activeDate,
      userTimezone
    );
    return acc + Math.floor(totalSeconds / 60);
  }, 0);
  const totalPlannedHours = (totalPlannedMinutes / 60).toFixed(1);

  const nowMs = Date.now();
  const completedSlotsCount = displaySlots.filter((s) => {
    const slotDateStr = s.date || activeDate;
    const liveProg = calculateSlotLiveProgress(
      s.startTime,
      s.endTime,
      nowMs,
      slotDateStr,
      s.createdWhenPast,
      userTimezone
    );
    const isPastSlot =
      liveProg.status === 'past' || liveProg.status === 'completed' || !!s.createdWhenPast;
    return s.markedComplete === true || (isPastSlot && s.unmarkedByUser !== true);
  }).length;

  const todayCount = scheduledSlots.filter((s) => (s.date ? s.date === todayStr : false)).length;
  const tomorrowCount = scheduledSlots.filter((s) => s.date === tomorrowStr).length;

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn pb-12 font-sans text-[var(--ink)]">
      {/* Editorial Header Strip */}
      <section className="border-b border-[var(--border)] pb-5 sm:pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6">
        <div>
          <div className="editorial-label mb-1">Schedule &bull; Routine Architecture</div>
          <h1 className="font-serif text-3xl sm:text-5xl font-semibold text-[var(--ink)] tracking-tight">
            Study Planner
          </h1>
          <p className="font-serif text-sm sm:text-lg text-[var(--muted)] italic mt-1">
            Daily timetable synchronized with your tasks and study routine.
          </p>
        </div>

        {/* Live Clock & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 font-mono text-xs">
          <LiveTimetableClock userTimezone={userTimezone} is24h={is24h} label={currentTimezoneLabel} />

          <button
            onClick={() => handleOpenAdd()}
            className="btn-editorial py-2 px-3.5 sm:px-4 cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Slot</span>
          </button>

          <button
            onClick={handleOpenLoadTemplate}
            className="btn-editorial-outline py-2 px-3 sm:px-3.5 cursor-pointer flex items-center gap-1.5 shrink-0"
            title="Browse and load routine templates"
          >
            <Bookmark className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>Templates ({slotTemplates.length})</span>
          </button>

          <button
            onClick={handleOpenSaveTemplate}
            disabled={displaySlots.length === 0}
            className="btn-editorial-outline py-2 px-3 cursor-pointer disabled:opacity-40 hidden sm:inline-flex items-center gap-1.5 shrink-0"
            title="Save listed slots as a custom template"
          >
            <span>Save Template</span>
          </button>

          {displaySlots.length > 0 && (
            <button
              onClick={handleClearCurrentDay}
              className="text-[var(--muted)] hover:text-[#f87171] p-1.5 cursor-pointer uppercase tracking-wider text-[10px] shrink-0"
              title="Clear slots for this day"
            >
              [ Clear Day ]
            </button>
          )}
        </div>
      </section>

      {/* Schedule Notice Banner */}
      {scheduleNotice && (
        <div className="editorial-card p-3 sm:p-4 border border-[var(--border)] flex items-start gap-3 bg-[var(--card-bg)]">
          <div className="p-1 bg-[var(--surface-subtle)] text-[var(--accent)] shrink-0 mt-0.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
          <div className="flex-1 text-xs font-mono text-[var(--ink)] space-y-0.5">
            <div className="font-bold uppercase tracking-wider text-[var(--ink)]">Planner Notice</div>
            <p className="text-[var(--muted)]">{scheduleNotice}</p>
          </div>
          <button
            onClick={() => setScheduleNotice(null)}
            className="text-[var(--muted)] hover:text-[var(--ink)] font-mono text-xs cursor-pointer p-1"
          >
            [ Dismiss ]
          </button>
        </div>
      )}

      {/* Timetable Slots Management */}
      <div className="editorial-card p-3 sm:p-8 space-y-4 sm:space-y-6 w-full shadow-2xs">
        {/* ─── DATE NAVIGATION TOOLBAR (MOBILE OPTIMIZED) ─── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 border-b border-[var(--border)] pb-3 sm:pb-4 font-sans text-xs">
          <div className="space-y-1">
            <div className="editorial-label">STUDY PLANNER &bull; SCHEDULE MAKER</div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-serif text-xl sm:text-2xl font-semibold text-[var(--ink)]">
                {viewScope === 'all' ? 'All Scheduled Blocks' : formatDisplayDate(activeDate)}
              </h3>
              {viewScope === 'day' && activeDate !== todayStr && (
                <button
                  onClick={() => handleSelectDate(todayStr)}
                  className="font-mono text-[10px] text-[var(--accent)] hover:underline uppercase tracking-wider bg-[var(--surface-subtle)] px-2 py-0.5 border border-[var(--border)] cursor-pointer"
                >
                  Jump to Today
                </button>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2.5 text-[11px] text-[var(--muted)]">
              <span>{displaySlots.length} blocks &bull; {totalPlannedHours} hrs scheduled</span>
              <span>&bull;</span>
              <label
                className="inline-flex items-center gap-1.5 cursor-pointer select-none font-normal text-xs text-[var(--muted)] hover:text-[var(--ink)]"
                title="When checked, blocks created in planner will repeat every day at midnight"
              >
                <input
                  type="checkbox"
                  checked={repeatSlotsEveryday}
                  onChange={(e) => setRepeatSlotsEveryday(e.target.checked)}
                  className="w-3.5 h-3.5 accent-[var(--accent)] cursor-pointer"
                />
                <span className="font-normal">set for everyday</span>
              </label>
            </div>
          </div>

          {/* Date Toggle with Touch-Friendly Left and Right Arrows */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1 max-w-full">
            {/* Small Left & Right Arrows */}
            <div className="inline-flex items-center bg-[var(--surface-subtle)] border border-[var(--border)] p-0.5 shadow-2xs shrink-0">
              <button
                type="button"
                onClick={handlePrevDay}
                className="p-1.5 hover:bg-[var(--card-bg)] text-[var(--ink)] cursor-pointer transition-colors"
                title="Previous Day"
                aria-label="Previous Day"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="px-2.5 py-0.5 font-mono text-xs font-bold text-[var(--ink)] border-x border-[var(--border)] select-none">
                {formatDisplayDate(activeDate)}
              </span>

              <button
                type="button"
                onClick={handleNextDay}
                className="p-1.5 hover:bg-[var(--card-bg)] text-[var(--ink)] cursor-pointer transition-colors"
                title="Next Day"
                aria-label="Next Day"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Scope Tabs */}
            <div className="flex items-center gap-1 font-mono text-xs shrink-0">
              <button
                type="button"
                onClick={() => handleSelectDate(todayStr)}
                className={`px-2.5 py-1 border transition-colors cursor-pointer uppercase tracking-wider shrink-0 ${
                  viewScope === 'day' && activeDate === todayStr
                    ? 'bg-[var(--accent)] text-[var(--accent-text)] border-[var(--accent)] font-bold'
                    : 'bg-[var(--surface-subtle)] text-[var(--ink)] border-[var(--border)] hover:border-[var(--border-strong)]'
                }`}
              >
                Today ({todayCount})
              </button>

              <button
                type="button"
                onClick={() => handleSelectDate(tomorrowStr)}
                className={`px-2.5 py-1 border transition-colors cursor-pointer uppercase tracking-wider shrink-0 ${
                  viewScope === 'day' && activeDate === tomorrowStr
                    ? 'bg-[var(--accent)] text-[var(--accent-text)] border-[var(--accent)] font-bold'
                    : 'bg-[var(--surface-subtle)] text-[var(--ink)] border-[var(--border)] hover:border-[var(--border-strong)]'
                }`}
              >
                Tomorrow ({tomorrowCount})
              </button>

              <button
                type="button"
                onClick={() => setViewScope('all')}
                className={`px-2.5 py-1 border transition-colors cursor-pointer uppercase tracking-wider shrink-0 ${
                  viewScope === 'all'
                    ? 'bg-[var(--accent)] text-[var(--accent-text)] border-[var(--accent)] font-bold'
                    : 'bg-[var(--surface-subtle)] text-[var(--ink)] border-[var(--border)] hover:border-[var(--border-strong)]'
                }`}
              >
                All ({scheduledSlots.length})
              </button>

              {/* Simple Checkbox of Everyday */}
              <label
                className="inline-flex items-center gap-1.5 px-2 py-1 bg-[var(--surface-subtle)] border border-[var(--border)] hover:border-[var(--accent)] text-xs font-normal text-[var(--ink)] cursor-pointer select-none shrink-0"
                title="Repeat user-scheduled blocks everyday at midnight"
              >
                <input
                  type="checkbox"
                  checked={repeatSlotsEveryday}
                  onChange={(e) => setRepeatSlotsEveryday(e.target.checked)}
                  className="w-3.5 h-3.5 accent-[var(--accent)] cursor-pointer"
                />
                <span className="font-normal">set for everyday</span>
              </label>

              {/* Custom Date Input */}
              <input
                type="date"
                value={activeDate}
                onChange={(e) => {
                  if (e.target.value) handleSelectDate(e.target.value);
                }}
                className="bg-[var(--surface-subtle)] border border-[var(--border)] px-2 py-1 text-[var(--ink)] text-xs font-mono outline-none cursor-pointer shrink-0"
                title="Choose custom date"
              />
            </div>
          </div>
        </div>

        {/* Slots List or Empty State */}
        {displaySlots.length === 0 ? (
          <div className="text-center py-10 sm:py-14 px-4 space-y-4">
            <div className="font-serif italic text-lg sm:text-xl text-[var(--muted)]">
              No study slots scheduled for {formatDisplayDate(activeDate)}.
            </div>
            <p className="font-sans text-xs sm:text-sm text-[var(--muted)] max-w-md mx-auto">
              Add individual study blocks or choose from saved routine templates.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2 font-mono text-xs">
              <button
                onClick={() => handleOpenAdd()}
                className="btn-editorial py-2 px-5 cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Custom Slot</span>
              </button>
              <button
                onClick={handleOpenLoadTemplate}
                className="btn-editorial-outline py-2 px-4 cursor-pointer flex items-center gap-1.5"
              >
                <Bookmark className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span>Browse Templates ({slotTemplates.length})</span>
              </button>
            </div>

            {repeatSlotsEveryday && scheduledSlots.length > 0 && activeDate !== todayStr && (
              <div className="pt-3 max-w-sm mx-auto">
                <button
                  type="button"
                  onClick={handlePopulateEverydayBlocks}
                  className="w-full py-2 px-3 bg-[var(--surface-subtle)] border border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-[var(--accent-text)] transition font-mono text-xs font-bold cursor-pointer"
                >
                  &rarr; Duplicate Everyday Blocks to This Day Now
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3 w-full">
            {displaySlots.map((slot) => {
              const slotDateStr = slot.date || activeDate;
              const liveProg = calculateSlotLiveProgress(
                slot.startTime,
                slot.endTime,
                nowMs,
                slotDateStr,
                slot.createdWhenPast,
                userTimezone
              );
              const { totalSeconds } = getSlotTimestamps(
                slot.startTime,
                slot.endTime,
                new Date(),
                slotDateStr,
                userTimezone
              );
              const durationHours = (totalSeconds / 3600).toFixed(1);

              const isPastSlot =
                liveProg.status === 'past' || liveProg.status === 'completed' || !!slot.createdWhenPast;
              const isCompleted = slot.markedComplete === true || (isPastSlot && slot.unmarkedByUser !== true);
              const isActive =
                liveProg.status === 'active' && slot.enabled && !isCompleted && slotDateStr === todayStr;
              const isUpcoming = liveProg.status === 'upcoming' && slot.enabled && !isCompleted;
              const isExpanded = expandedSlotId === slot.id;

              return (
                <div
                  key={slot.id}
                  className={`p-3 sm:p-4 border transition-all font-mono w-full ${
                    !slot.enabled
                      ? 'bg-[var(--surface-subtle)]/40 border-[var(--border)] opacity-60'
                      : isActive
                      ? 'bg-[var(--card-bg)] border-2 border-[var(--accent)] shadow-md'
                      : isCompleted
                      ? 'bg-[var(--surface-subtle)] border-[var(--border)] opacity-80'
                      : 'bg-[var(--card-bg)] border-[var(--border)] hover:border-[var(--border-strong)]'
                  }`}
                >
                  {/* Primary Row: Responsive Mobile & Desktop */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 w-full min-w-0">
                    <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 flex-1 min-w-0">
                      {/* Checkbox for completed, past, or active slots */}
                      {(isPastSlot || isCompleted || isActive) && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleMarkSlotComplete(slot.id);
                          }}
                          className={`w-5 h-5 border flex items-center justify-center shrink-0 cursor-pointer transition-colors mt-0.5 sm:mt-0 ${
                            isCompleted
                              ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-text)]'
                              : 'border-[var(--border-strong)] hover:border-[var(--accent)] bg-transparent'
                          }`}
                          title={isCompleted ? 'Mark incomplete' : 'Mark block as complete'}
                        >
                          {isCompleted && <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />}
                        </button>
                      )}

                      {/* Time & Duration (Inline, unboxed, exactly like reference image) */}
                      <div className="flex items-center gap-1.5 shrink-0 select-none">
                        <span className="font-mono font-bold text-xs sm:text-sm text-[var(--ink)] tabular-nums">
                          {slot.startTime} – {slot.endTime}
                        </span>
                        <span className="font-mono text-[11px] text-[var(--muted)] font-normal tabular-nums">
                          ({durationHours}H)
                        </span>
                      </div>

                      {/* Title & Target Objective */}
                      <div
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => setExpandedSlotId(isExpanded ? null : slot.id)}
                      >
                        <h4
                          className={`font-sans font-medium text-sm sm:text-base leading-snug truncate min-w-0 hover:text-[var(--accent)] transition-colors select-text ${
                            isCompleted ? 'line-through text-[var(--muted)]' : 'text-[var(--ink)]'
                          }`}
                          title="Click to toggle details"
                        >
                          {slot.title}
                        </h4>
                        {slot.targetTopics && (
                          <div className="font-sans text-[11px] text-[var(--muted)] truncate leading-tight mt-0.5 flex items-center gap-1">
                            <Target className="w-3 h-3 text-[var(--accent)] shrink-0" />
                            <span className="truncate">{slot.targetTopics}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Quick Right Action Icons (Edit & Delete) + Live Progress on Mobile */}
                    <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-[var(--border)]/40">
                      {isActive && (
                        <div className="font-mono text-[10px] text-[var(--accent)] font-bold bg-[var(--accent)]/10 px-2 py-0.5">
                          {liveProg.formattedRemaining} left
                        </div>
                      )}

                      <div className="flex items-center gap-1.5 ml-auto sm:ml-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEdit(slot);
                          }}
                          className="p-1.5 text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer transition"
                          title="Edit study block"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteScheduledSlot(slot.id);
                          }}
                          className="p-1.5 text-[var(--muted)] hover:text-[#f87171] cursor-pointer transition"
                          title="Delete study block"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Inline Active Progress Bar */}
                  {isActive && (
                    <div className="mt-2.5 w-full animate-fadeIn space-y-1">
                      <div className="w-full h-1.5 bg-[var(--surface-subtle)] border border-[var(--border)] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[var(--color-timer)] transition-all duration-300 rounded-full"
                          style={{ width: `${liveProg.progressPercent}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Properties expanded upon click */}
                  {isExpanded && (
                    <div className="mt-2.5 pt-2 border-t border-[var(--border)]/50 font-mono text-[11px] text-[var(--muted)] space-y-1.5 animate-fadeIn select-text">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span>
                          Status:{' '}
                          <strong
                            className={
                              isActive
                                ? 'text-[var(--accent)]'
                                : isCompleted
                                ? 'text-[var(--accent)]'
                                : 'text-[var(--ink)]'
                            }
                          >
                            {!slot.enabled
                              ? 'Paused'
                              : isActive
                              ? 'Active'
                              : isCompleted
                              ? 'Completed'
                              : isUpcoming
                              ? 'Upcoming'
                              : 'Past'}
                          </strong>
                        </span>

                        <span>&bull;</span>
                        <span>Date: {slot.date || activeDate}</span>

                        <span>&bull;</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleScheduledSlotEnabled(slot.id);
                          }}
                          className="text-[var(--accent)] hover:underline cursor-pointer font-medium"
                        >
                          {slot.enabled ? 'Pause Block' : 'Enable Block'}
                        </button>

                        {(isPastSlot || isCompleted || isActive) && (
                          <>
                            <span>&bull;</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleMarkSlotComplete(slot.id);
                              }}
                              className="text-[var(--accent)] hover:underline cursor-pointer font-medium"
                            >
                              {isCompleted ? 'Mark Incomplete' : 'Mark Completed'}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="editorial-card p-4 sm:p-5 space-y-1">
          <div className="editorial-label">TOTAL SCHEDULED</div>
          <div className="font-cinzel text-2xl sm:text-3xl font-bold text-[var(--ink)] tabular-nums">
            {totalPlannedHours} Hours
          </div>
          <div className="font-mono text-xs text-[var(--muted)]">
            {enabledSlots.length} active slots planned for {formatDisplayDate(activeDate)}
          </div>
        </div>

        <div className="editorial-card p-4 sm:p-5 space-y-1">
          <div className="editorial-label">COMPLETED SESSIONS</div>
          <div className="font-cinzel text-2xl sm:text-3xl font-bold text-[var(--accent)] tabular-nums">
            {completedSlotsCount} / {enabledSlots.length}
          </div>
          <div className="font-mono text-xs text-[var(--muted)]">
            {enabledSlots.length > 0
              ? `${Math.round((completedSlotsCount / enabledSlots.length) * 100)}% of daily schedule finished`
              : 'No slots scheduled'}
          </div>
        </div>
      </div>

      {/* Modals */}
      <SlotEditorModal
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false);
          setEditingSlot(null);
          setPrefilledTaskForSlot(null);
        }}
        onSave={handleSaveSlot}
        initialSlot={editingSlot}
        prefilledTask={prefilledTaskForSlot}
        defaultDate={activeDate}
      />

      <SlotTemplateModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        initialMode={templateModalMode}
        activeSlots={displaySlots}
        targetDate={activeDate}
      />
    </div>
  );
};
