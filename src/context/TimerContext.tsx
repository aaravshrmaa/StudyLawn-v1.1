import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { StudyTask, ScheduledStudySlot, SlotTemplate, SlotTemplateItem } from '../types';
import { localStore } from '../lib/storage';
import { useAuth } from './AuthContext';

export interface ActiveSlotProgressInfo {
  status: 'upcoming' | 'active' | 'completed' | 'past';
  elapsedSeconds: number;
  remainingSeconds: number;
  totalSeconds: number;
  progressPercent: number;
  formattedRemaining: string;
  formattedElapsed: string;
}

interface TimerContextType {
  timerMinutes: number;
  setTimerMinutes: React.Dispatch<React.SetStateAction<number>>;
  customHoursInput: string;
  setCustomHoursInput: (val: string) => void;
  customMinutesInput: string;
  setCustomMinutesInput: (val: string) => void;
  timeLeft: number;
  isTimerRunning: boolean;
  completedSessionsToday: number;
  setCompletedSessionsToday: React.Dispatch<React.SetStateAction<number>>;
  studyHours: number;
  setStudyHours: React.Dispatch<React.SetStateAction<number>>;
  streakDays: number;
  setStreakDays: React.Dispatch<React.SetStateAction<number>>;
  studyTarget: number;
  setStudyTarget: (target: number) => void;
  toggleTimer: () => void;
  syncTimer: () => void;
  resetTimer: () => void;
  handleSetCustomTimer: (mins: number) => void;
  handleSetCustomTimerWithHours: (hours: number, mins: number) => void;
  formatTimer: (seconds: number) => string;
  formatDurationLabel: (totalMins: number) => string;
  isMainTimerInView: boolean;
  setIsMainTimerInView: (inView: boolean) => void;
  mainTimerRef: React.RefObject<HTMLDivElement | null>;
  isPopoutMinimized: boolean;
  setIsPopoutMinimized: React.Dispatch<React.SetStateAction<boolean>>;
  recordStudyProgress: (hoursToAdd: number, sessionsToAdd?: number) => void;
  liveStudyHours: number;
  dailyLogs: Record<string, number>;
  updateLogForDate: (dateStr: string, hours: number) => void;
  // --- Calendar Date & Timezone Sync ---
  userTimezone: string;
  currentTimezoneLabel: string;
  todayStr: string;
  tomorrowStr: string;
  selectedCalendarDate: string;
  setSelectedCalendarDate: (date: string) => void;
  // --- Task Collections & Date Synchronization ---
  dailyTasks: Record<string, StudyTask[]>;
  tasks: StudyTask[];
  setTasks: (newTasksOrFn: StudyTask[] | ((prev: StudyTask[]) => StudyTask[])) => void;
  completionTasks: StudyTask[];
  tasksForSelectedDate: StudyTask[];
  getTasksForDate: (targetDate: string) => StudyTask[];
  addCompletionTask: (task: Omit<StudyTask, 'id' | 'createdAt'>) => StudyTask;
  updateCompletionTask: (id: string, updates: Partial<StudyTask>) => void;
  deleteCompletionTask: (id: string) => void;
  toggleCompletionTask: (id: string) => void;
  reorderCompletionTasks: (orderedTasks: StudyTask[]) => void;
  allocateTasksToTimetableSlots: (
    targetSlots: ScheduledStudySlot[],
    tasksToUse?: StudyTask[],
    targetDate?: string
  ) => Promise<{ allocatedSlots: ScheduledStudySlot[]; strategy: string }>;
  // --- Scheduled Study Timetable Slots ---
  scheduledSlots: ScheduledStudySlot[];
  setScheduledSlots: React.Dispatch<React.SetStateAction<ScheduledStudySlot[]>>;
  activeScheduledSlot: ScheduledStudySlot | null;
  activeSlotProgress: ActiveSlotProgressInfo | null;
  addScheduledSlot: (slot: Omit<ScheduledStudySlot, 'id'>) => void;
  updateScheduledSlot: (id: string, updated: Partial<ScheduledStudySlot>) => void;
  deleteScheduledSlot: (id: string) => void;
  toggleScheduledSlotEnabled: (id: string) => void;
  toggleMarkSlotComplete: (id: string) => void;
  resetToDefaultSlots: () => void;
  autonomousSlotStudyHoursToday: number;
  repeatSlotsEveryday: boolean;
  setRepeatSlotsEveryday: (val: boolean) => void;
  // --- Default Routine & Multi-Day Persistence ---
  autoApplyDefaultRoutine: boolean;
  setAutoApplyDefaultRoutine: (val: boolean) => void;
  applyDefaultRoutine: (targetDate: string, mode?: 'replace' | 'fillIfEmpty') => void;
  getSlotsForDate: (targetDate: string) => ScheduledStudySlot[];
  stepDate: (baseDateStr: string, offsetDays: number) => string;
  formatDisplayDate: (dateStr: string) => string;
  // --- Slot Templates ---
  slotTemplates: SlotTemplate[];
  saveSlotTemplate: (title: string, slotsToSave?: ScheduledStudySlot[]) => SlotTemplate;
  loadSlotTemplate: (templateId: string, targetDate?: string, mode?: 'replace' | 'append') => void;
  deleteSlotTemplate: (templateId: string) => void;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export const formatDurationLabel = (totalMins: number) => {
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
};

export const formatSecondsToHms = (totalSeconds: number): string => {
  const total = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) {
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

// ─── Universal Timezone Engine ───
export const getDeviceTimezone = (): string => {
  try {
    if (typeof Intl !== 'undefined' && Intl.DateTimeFormat) {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz) return tz;
    }
  } catch {}
  return 'UTC';
};

export const getUserTimezone = (overrideTz?: string): string => {
  if (overrideTz && overrideTz !== 'auto') return overrideTz;
  try {
    const profile = localStore.getSync<any>('user_profile', null);
    if (profile?.timezone && profile.timezone !== 'auto') return profile.timezone;
  } catch {}
  return getDeviceTimezone();
};

export const getTimezoneDateComponents = (d: Date = new Date(), timeZone?: string) => {
  const tz = getUserTimezone(timeZone);
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: false,
    });
    const parts = formatter.formatToParts(d);
    let year = d.getFullYear();
    let month = d.getMonth() + 1;
    let day = d.getDate();
    let hour = d.getHours();
    let minute = d.getMinutes();
    let second = d.getSeconds();

    for (const part of parts) {
      if (part.type === 'year') year = parseInt(part.value, 10);
      else if (part.type === 'month') month = parseInt(part.value, 10);
      else if (part.type === 'day') day = parseInt(part.value, 10);
      else if (part.type === 'hour') {
        const h = parseInt(part.value, 10);
        hour = h === 24 ? 0 : h;
      } else if (part.type === 'minute') minute = parseInt(part.value, 10);
      else if (part.type === 'second') second = parseInt(part.value, 10);
    }

    return { year, month, day, hour, minute, second, timeZone: tz };
  } catch (err) {
    return {
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      day: d.getDate(),
      hour: d.getHours(),
      minute: d.getMinutes(),
      second: d.getSeconds(),
      timeZone: tz,
    };
  }
};

export const getLocalDateStr = (d: Date = new Date(), timeZone?: string): string => {
  const { year, month, day } = getTimezoneDateComponents(d, timeZone);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

export const getOffsetDateStr = (baseDateStr: string, offsetDays: number): string => {
  try {
    const [year, month, day] = baseDateStr.split('-').map(Number);
    if (!year || !month || !day) return baseDateStr;
    const d = new Date(Date.UTC(year, month - 1, day + offsetDays, 12, 0, 0));
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const da = String(d.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${da}`;
  } catch {
    return baseDateStr;
  }
};

export const formatDisplayDate = (
  dateStr: string,
  todayStr: string,
  tomorrowStr: string
): string => {
  if (dateStr === todayStr) return 'Today';
  if (dateStr === tomorrowStr) return 'Tomorrow';
  const yesterdayStr = getOffsetDateStr(todayStr, -1);
  if (dateStr === yesterdayStr) return 'Yesterday';

  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const d = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    return d.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    });
  } catch {
    return dateStr;
  }
};

export const getTomorrowDateStr = (d: Date = new Date(), timeZone?: string): string => {
  const tz = getUserTimezone(timeZone);
  const nowComps = getTimezoneDateComponents(d, tz);
  const nextDate = new Date(Date.UTC(nowComps.year, nowComps.month - 1, nowComps.day + 1, 12, 0, 0));
  const nextComps = getTimezoneDateComponents(nextDate, tz);
  return `${nextComps.year}-${String(nextComps.month).padStart(2, '0')}-${String(nextComps.day).padStart(2, '0')}`;
};

export const getLocalFormattedDate = (d: Date = new Date(), timeZone?: string): string => {
  const tz = getUserTimezone(timeZone);
  try {
    return d.toLocaleDateString(undefined, {
      timeZone: tz,
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return d.toLocaleDateString(undefined, {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }
};

export const getLocalFormattedTime = (d: Date = new Date(), is24h = false, timeZone?: string): string => {
  const tz = getUserTimezone(timeZone);
  try {
    return d.toLocaleTimeString(undefined, {
      timeZone: tz,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: !is24h,
    });
  } catch {
    return d.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: !is24h,
    });
  }
};

export const getTimezoneShortLabel = (timeZone?: string): string => {
  const tz = getUserTimezone(timeZone);
  if (tz === 'America/New_York') return 'ET (US)';
  if (tz === 'America/Chicago') return 'CT (US)';
  if (tz === 'America/Denver') return 'MT (US)';
  if (tz === 'America/Los_Angeles') return 'PT (US)';
  if (tz === 'America/Anchorage') return 'AKT (US)';
  if (tz === 'Pacific/Honolulu') return 'HST (US)';
  if (tz === 'Europe/London') return 'GMT / BST (UK)';
  if (tz === 'Australia/Sydney' || tz === 'Australia/Melbourne' || tz === 'Australia/Brisbane') return 'AEST (AU)';
  if (tz === 'Australia/Adelaide' || tz === 'Australia/Darwin') return 'ACST (AU)';
  if (tz === 'Australia/Perth') return 'AWST (AU)';
  if (tz === 'America/Toronto' || tz === 'America/Montreal') return 'ET (CA)';
  if (tz === 'America/Vancouver') return 'PT (CA)';
  if (tz === 'Asia/Kolkata') return 'IST (IN)';
  if (tz === 'UTC') return 'UTC';
  try {
    const d = new Date();
    const str = d.toLocaleTimeString('en-US', { timeZone: tz, timeZoneName: 'short' });
    const match = str.split(' ').pop();
    if (match && match.length <= 6) return match;
  } catch {}
  return tz.split('/').pop()?.replace(/_/g, ' ') || tz;
};

// Aliases for compatibility
export const getISTDateStr = (d = new Date(), tz?: string): string => getLocalDateStr(d, tz);
export const getISTFormattedDate = (d = new Date(), tz?: string): string => getLocalFormattedDate(d, tz);
export const getISTFormattedTime = (d = new Date(), tz?: string): string => getLocalFormattedTime(d, false, tz);
export const getISTFormattedTime24 = (d = new Date(), tz?: string): string => getLocalFormattedTime(d, true, tz);

export const getSlotTimestamps = (
  startTimeStr: string,
  endTimeStr: string,
  referenceDate: Date | string = new Date(),
  slotDateStr?: string,
  timeZone?: string
): { startMs: number; endMs: number; totalSeconds: number } => {
  const tz = getUserTimezone(timeZone);
  const targetDateStr = slotDateStr || (typeof referenceDate === 'string' ? referenceDate : getLocalDateStr(referenceDate, tz));

  const [startHour, startMin] = (startTimeStr || '06:00').split(':').map(Number);
  const [endHour, endMin] = (endTimeStr || '08:30').split(':').map(Number);

  let startSecOfDay = (startHour || 0) * 3600 + (startMin || 0) * 60;
  let endSecOfDay = (endHour || 0) * 3600 + (endMin || 0) * 60;
  if (endSecOfDay <= startSecOfDay) {
    endSecOfDay += 24 * 3600;
  }
  const totalSeconds = Math.max(0, endSecOfDay - startSecOfDay);

  return {
    startMs: startSecOfDay * 1000,
    endMs: endSecOfDay * 1000,
    totalSeconds,
  };
};

export const getISTSlotTimestamps = (
  startTimeStr: string,
  endTimeStr: string,
  referenceDate: Date | string = new Date(),
  slotDateStr?: string,
  timeZone?: string
) => getSlotTimestamps(startTimeStr, endTimeStr, referenceDate, slotDateStr, timeZone);

export const calculateConsecutiveStreak = (logs: Record<string, number>, timeZone?: string): number => {
  if (!logs || Object.keys(logs).length === 0) return 0;

  const tz = getUserTimezone(timeZone);
  const todayStr = getLocalDateStr(new Date(), tz);
  const [year, month, day] = todayStr.split('-').map(Number);
  if (!year || !month || !day) return 0;

  const curr = new Date(year, month - 1, day);
  let streak = 0;

  const formatDateStr = (d: Date): string => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${da}`;
  };

  const todayHours = logs[todayStr] || 0;
  if (todayHours > 0) {
    streak++;
    curr.setDate(curr.getDate() - 1);
  } else {
    curr.setDate(curr.getDate() - 1);
    const yesterdayStr = formatDateStr(curr);
    const yesterdayHours = logs[yesterdayStr] || 0;
    if (yesterdayHours <= 0) {
      return 0;
    }
  }

  let safetyCounter = 0;
  while (safetyCounter < 365) {
    safetyCounter++;
    const dateKey = formatDateStr(curr);
    const hours = logs[dateKey] || 0;
    if (hours > 0) {
      streak++;
      curr.setDate(curr.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
};

export const calculateSlotLiveProgress = (
  startTime: string,
  endTime: string,
  nowMs = Date.now(),
  slotDateStr?: string,
  createdWhenPast = false,
  timeZone?: string
): ActiveSlotProgressInfo => {
  const tz = getUserTimezone(timeZone);
  const todayStr = getLocalDateStr(new Date(nowMs), tz);
  const targetDate = slotDateStr || todayStr;

  const [startHour, startMin] = (startTime || '09:00').split(':').map(Number);
  const [endHour, endMin] = (endTime || '11:00').split(':').map(Number);

  let startSecOfDay = (startHour || 0) * 3600 + (startMin || 0) * 60;
  let endSecOfDay = (endHour || 0) * 3600 + (endMin || 0) * 60;
  if (endSecOfDay <= startSecOfDay) {
    endSecOfDay += 24 * 3600;
  }
  const totalSeconds = Math.max(0, endSecOfDay - startSecOfDay);

  // If slot is scheduled for a past date
  if (targetDate < todayStr) {
    return {
      status: createdWhenPast ? 'past' : 'completed',
      elapsedSeconds: totalSeconds,
      remainingSeconds: 0,
      totalSeconds,
      progressPercent: 100,
      formattedRemaining: '00:00:00',
      formattedElapsed: formatSecondsToHms(totalSeconds),
    };
  }

  // If slot is scheduled for a future date
  if (targetDate > todayStr) {
    return {
      status: 'upcoming',
      elapsedSeconds: 0,
      remainingSeconds: totalSeconds,
      totalSeconds,
      progressPercent: 0,
      formattedRemaining: formatSecondsToHms(totalSeconds),
      formattedElapsed: '00:00:00',
    };
  }

  // Slot is for Today: compute against current time in selected timezone
  const nowComps = getTimezoneDateComponents(new Date(nowMs), tz);
  const currentSecOfDay = nowComps.hour * 3600 + nowComps.minute * 60 + nowComps.second;

  if (currentSecOfDay < startSecOfDay) {
    const secondsUntil = startSecOfDay - currentSecOfDay;
    return {
      status: 'upcoming',
      elapsedSeconds: 0,
      remainingSeconds: secondsUntil,
      totalSeconds,
      progressPercent: 0,
      formattedRemaining: formatSecondsToHms(secondsUntil),
      formattedElapsed: '00:00:00',
    };
  }

  if (currentSecOfDay >= endSecOfDay) {
    return {
      status: createdWhenPast ? 'past' : 'completed',
      elapsedSeconds: totalSeconds,
      remainingSeconds: 0,
      totalSeconds,
      progressPercent: 100,
      formattedRemaining: '00:00:00',
      formattedElapsed: formatSecondsToHms(totalSeconds),
    };
  }

  const elapsed = Math.max(0, currentSecOfDay - startSecOfDay);
  const remaining = Math.max(0, endSecOfDay - currentSecOfDay);
  const progressPercent = totalSeconds > 0 ? Math.min(100, (elapsed / totalSeconds) * 100) : 0;

  return {
    status: 'active',
    elapsedSeconds: elapsed,
    remainingSeconds: remaining,
    totalSeconds,
    progressPercent,
    formattedRemaining: formatSecondsToHms(remaining),
    formattedElapsed: formatSecondsToHms(elapsed),
  };
};

export const DEFAULT_ROUTINE_SLOTS_DEF: SlotTemplateItem[] = [
  {
    title: 'Morning Slot 1',
    startTime: '06:00',
    endTime: '10:00',
    enabled: true,
  },
  {
    title: 'Post Morning 2',
    startTime: '10:00',
    endTime: '13:00',
    enabled: true,
  },
  {
    title: 'Afternoon Slot 3',
    startTime: '13:00',
    endTime: '17:00',
    enabled: true,
  },
  {
    title: 'Evening Slot 4',
    startTime: '17:00',
    endTime: '20:00',
    enabled: true,
  },
  {
    title: 'Night Last slot 5',
    startTime: '20:00',
    endTime: '23:30',
    enabled: true,
  },
];

export const DEFAULT_ROUTINE_TEMPLATE: SlotTemplate = {
  id: 'default-study-routine',
  title: 'Default Daily Routine (5 Slots)',
  createdAt: '2026-09-28T00:00:00.000Z',
  slots: DEFAULT_ROUTINE_SLOTS_DEF,
};

export const createDefaultSlotsForDate = (dateStr: string): ScheduledStudySlot[] => {
  return DEFAULT_ROUTINE_SLOTS_DEF.map((item, idx) => ({
    id: `slot-${dateStr}-routine-${idx}-${Date.now()}`,
    title: item.title,
    startTime: item.startTime,
    endTime: item.endTime,
    date: dateStr,
    enabled: true,
  }));
};

export const DEFAULT_SCHEDULED_SLOTS: ScheduledStudySlot[] = [];
export const DEFAULT_SLOT_TEMPLATES: SlotTemplate[] = [DEFAULT_ROUTINE_TEMPLATE];

export const TimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile } = useAuth();
  const userTimezone = profile?.timezone || getUserTimezone();
  const is24hFormat = profile?.timeFormat === '24h';
  const currentTimezoneLabel = getTimezoneShortLabel(userTimezone);

  const [todayStr, setTodayStr] = useState<string>(() => getLocalDateStr(new Date(), userTimezone));
  const [tomorrowStr, setTomorrowStr] = useState<string>(() => getTomorrowDateStr(new Date(), userTimezone));

  // Calendar selection synchronization
  const [selectedCalendarDate, setSelectedCalendarDateState] = useState<string>(() => {
    return localStore.getSync<string>('selected_calendar_date', getLocalDateStr(new Date(), userTimezone));
  });

  const setSelectedCalendarDate = (date: string) => {
    setSelectedCalendarDateState(date);
    localStore.set('selected_calendar_date', date);
  };

  // Default routine auto-apply preference
  const [autoApplyDefaultRoutine, setAutoApplyDefaultRoutineState] = useState<boolean>(() => {
    return localStore.getSync<boolean>('study_auto_apply_default_routine', true);
  });

  const setAutoApplyDefaultRoutine = (val: boolean) => {
    setAutoApplyDefaultRoutineState(val);
    localStore.set('study_auto_apply_default_routine', val);
  };

  // Repeat schedule blocks everyday setting
  const [repeatSlotsEveryday, setRepeatSlotsEverydayState] = useState<boolean>(() => {
    return localStore.getSync<boolean>('study_repeat_slots_everyday', true);
  });

  const setRepeatSlotsEveryday = (val: boolean) => {
    setRepeatSlotsEverydayState(val);
    localStore.set('study_repeat_slots_everyday', val);
  };

  // Timer inputs and settings
  const [timerMinutes, setTimerMinutes] = useState<number>(() => {
    return localStore.getSync<number>('study_timer_minutes', 25);
  });
  const [customHoursInput, setCustomHoursInput] = useState<string>(() => {
    return localStore.getSync<string>('study_custom_h_input', '0');
  });
  const [customMinutesInput, setCustomMinutesInput] = useState<string>(() => {
    return localStore.getSync<string>('study_custom_m_input', '25');
  });

  // Target end timestamp for live resume across page reloads
  const [timeLeft, setTimeLeft] = useState<number>(() => {
    const isRunning = localStore.getSync<boolean>('study_is_timer_running', false);
    const targetEnd = localStore.getSync<number | null>('study_timer_target_end', null);
    if (isRunning && targetEnd) {
      const remaining = Math.max(0, Math.ceil((targetEnd - Date.now()) / 1000));
      return isNaN(remaining) ? 25 * 60 : remaining;
    }
    return localStore.getSync<number>('study_time_left', 25 * 60);
  });

  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(() => {
    const isRunning = localStore.getSync<boolean>('study_is_timer_running', false);
    const targetEnd = localStore.getSync<number | null>('study_timer_target_end', null);
    if (isRunning && targetEnd) {
      return Date.now() < targetEnd;
    }
    return false;
  });

  const [isPopoutMinimized, setIsPopoutMinimized] = useState<boolean>(false);

  const [studyTarget, setStudyTargetState] = useState<number>(() => {
    return localStore.getSync<number>('study_target_daily_hours', 8.0);
  });

  const setStudyTarget = (target: number) => {
    const valid = Math.max(0.5, Math.min(24, isNaN(target) ? 8.0 : parseFloat(target.toFixed(1))));
    setStudyTargetState(valid);
    localStore.set('study_target_daily_hours', valid);
  };

  const [streakDays, setStreakDays] = useState<number>(() => {
    return localStore.getSync<number>('study_streak_days', 1);
  });

  // Scheduled Timetable Slots - only user-scheduled or explicitly applied slots
  const [scheduledSlots, setScheduledSlotsState] = useState<ScheduledStudySlot[]>(() => {
    const saved = localStore.getSync<ScheduledStudySlot[]>('study_scheduled_slots', []);
    return Array.isArray(saved) ? saved : [];
  });

  const setScheduledSlots: React.Dispatch<React.SetStateAction<ScheduledStudySlot[]>> = (valOrFn) => {
    setScheduledSlotsState((prev) => {
      const next = typeof valOrFn === 'function' ? valOrFn(prev) : valOrFn;
      localStore.set('study_scheduled_slots', next);
      return next;
    });
  };

  const applyDefaultRoutine = useCallback((targetDate: string, mode: 'replace' | 'fillIfEmpty' = 'replace') => {
    const target = targetDate || todayStr;
    setScheduledSlotsState((prev) => {
      const existingForDate = prev.filter((s) => (s.date || todayStr) === target);
      if (mode === 'fillIfEmpty' && existingForDate.length > 0) {
        return prev;
      }
      const filteredOtherDates = prev.filter((s) => (s.date || todayStr) !== target);
      const newSlots = createDefaultSlotsForDate(target);
      const next = [...filteredOtherDates, ...newSlots];
      localStore.set('study_scheduled_slots', next);
      return next;
    });
  }, [todayStr]);

  const getSlotsForDate = useCallback((targetDate: string): ScheduledStudySlot[] => {
    const target = targetDate || todayStr;
    return scheduledSlots.filter((s) => (s.date || todayStr) === target);
  }, [scheduledSlots, todayStr]);

  const stepDate = useCallback((baseDateStr: string, offsetDays: number): string => {
    return getOffsetDateStr(baseDateStr || todayStr, offsetDays);
  }, [todayStr]);

  const formatDisplayDateBound = useCallback((dateStr: string): string => {
    return formatDisplayDate(dateStr, todayStr, tomorrowStr);
  }, [todayStr, tomorrowStr]);

  const [activeScheduledSlot, setActiveScheduledSlot] = useState<ScheduledStudySlot | null>(null);
  const [activeSlotProgress, setActiveSlotProgress] = useState<ActiveSlotProgressInfo | null>(null);
  const activeScheduledSlotRef = useRef(activeScheduledSlot);
  useEffect(() => {
    activeScheduledSlotRef.current = activeScheduledSlot;
  }, [activeScheduledSlot]);
  const [autonomousSlotStudyHoursToday] = useState<number>(0);

  // Slot Templates - Ensure default 5-slot routine is always available in templates
  const [slotTemplates, setSlotTemplatesState] = useState<SlotTemplate[]>(() => {
    const saved = localStore.getSync<SlotTemplate[]>('study_slot_templates', DEFAULT_SLOT_TEMPLATES);
    if (!saved || saved.length === 0) return DEFAULT_SLOT_TEMPLATES;
    if (!saved.some((t) => t.id === DEFAULT_ROUTINE_TEMPLATE.id)) {
      return [DEFAULT_ROUTINE_TEMPLATE, ...saved];
    }
    return saved;
  });

  const setSlotTemplates = (templates: SlotTemplate[]) => {
    const withDefault = templates.some((t) => t.id === DEFAULT_ROUTINE_TEMPLATE.id)
      ? templates
      : [DEFAULT_ROUTINE_TEMPLATE, ...templates];
    setSlotTemplatesState(withDefault);
    localStore.set('study_slot_templates', withDefault);
  };

  // Daily Logs
  const [dailyLogs, setDailyLogsState] = useState<Record<string, number>>(() => {
    return localStore.getSync<Record<string, number>>('study_daily_logs', {});
  });

  const setDailyLogs = (logs: Record<string, number>) => {
    setDailyLogsState(logs);
    localStore.set('study_daily_logs', logs);
  };

  // Re-calculate streak whenever daily logs or timezone update
  useEffect(() => {
    const computedStreak = calculateConsecutiveStreak(dailyLogs, userTimezone);
    setStreakDays(computedStreak);
    localStore.set('study_streak_days', computedStreak);

    // Sync baseStudyHours with dailyLogs only when timer is NOT actively running
    if (!isTimerRunning) {
      const currentToday = getLocalDateStr(new Date(), userTimezone);
      setBaseStudyHours(dailyLogs[currentToday] || 0.0);
    }
  }, [dailyLogs, userTimezone, isTimerRunning]);

  // Base study hours completed today before the current active timer session
  const [baseStudyHours, setBaseStudyHours] = useState<number>(() => {
    const currentToday = getLocalDateStr(new Date(), userTimezone);
    const lastDate = localStore.getSync<string>('study_last_active_date', currentToday);
    if (lastDate !== currentToday) {
      const logs = localStore.getSync<Record<string, number>>('study_daily_logs', {});
      return logs[currentToday] || 0.0;
    }
    const savedBase = localStore.getSync<number | null>('study_base_hours_today', null);
    if (savedBase !== null && !isNaN(savedBase)) return savedBase;
    const logs = localStore.getSync<Record<string, number>>('study_daily_logs', {});
    return logs[currentToday] || 0.0;
  });

  // Current session elapsed seconds (for live dashboard & calendar hours sync)
  const [activeSessionElapsedSeconds, setActiveSessionElapsedSeconds] = useState<number>(() => {
    const isRunning = localStore.getSync<boolean>('study_is_timer_running', false);
    const targetEnd = localStore.getSync<number | null>('study_timer_target_end', null);
    const sessionSecsAtStart = localStore.getSync<number>('study_session_sec_at_start', 25 * 60);
    if (isRunning && targetEnd && Date.now() < targetEnd) {
      const remaining = Math.max(0, Math.ceil((targetEnd - Date.now()) / 1000));
      return Math.max(0, sessionSecsAtStart - remaining);
    }
    return 0;
  });

  // Completion Tasks Queue with strict date isolation
  const [completionTasks, setCompletionTasksState] = useState<StudyTask[]>(() => {
    const raw = localStore.getSync<StudyTask[]>('study_completion_tasks', []);
    const currentToday = getLocalDateStr(new Date(), userTimezone);
    let changed = false;
    const sanitized = (raw || []).map((t) => {
      if (!t.date || t.date.trim() === '') {
        changed = true;
        const fromCreated = t.createdAt ? t.createdAt.slice(0, 10) : currentToday;
        return { ...t, date: /^\d{4}-\d{2}-\d{2}$/.test(fromCreated) ? fromCreated : currentToday };
      }
      return t;
    });
    if (changed) {
      localStore.set('study_completion_tasks', sanitized);
    }
    return sanitized;
  });

  // Daily Tasks map (date -> tasks) for localized day persistence
  const [dailyTasks, setDailyTasksState] = useState<Record<string, StudyTask[]>>(() => {
    const savedMap = localStore.getSync<Record<string, StudyTask[]>>('study_daily_tasks', {});
    return savedMap || {};
  });

  const setCompletionTasks = (tasksList: StudyTask[]) => {
    const currentToday = getLocalDateStr(new Date(), userTimezone);
    const sanitized = tasksList.map((t) => {
      if (!t.date || t.date.trim() === '') {
        const fromCreated = t.createdAt ? t.createdAt.slice(0, 10) : currentToday;
        return { ...t, date: /^\d{4}-\d{2}-\d{2}$/.test(fromCreated) ? fromCreated : currentToday };
      }
      return t;
    });

    setCompletionTasksState(sanitized);
    localStore.set('study_completion_tasks', sanitized);

    // Keep partitioned per-day tasks synchronized
    const map: Record<string, StudyTask[]> = {};
    sanitized.forEach((t) => {
      const d = t.date || currentToday;
      if (!map[d]) map[d] = [];
      map[d].push(t);
    });
    setDailyTasksState(map);
    localStore.set('study_daily_tasks', map);
  };

  const getTasksForDate = useCallback((targetDate: string): StudyTask[] => {
    const target = targetDate || todayStr;
    return completionTasks.filter((t) => t.date === target);
  }, [completionTasks, todayStr]);

  const [completedSessionsToday, setCompletedSessionsTodayState] = useState<number>(() => {
    const currentToday = getLocalDateStr(new Date(), userTimezone);
    const lastDate = localStore.getSync<string>('study_last_active_date', currentToday);
    if (lastDate !== currentToday) return 0;
    return localStore.getSync<number>('study_completed_sessions_today', 0);
  });

  const setCompletedSessionsToday: React.Dispatch<React.SetStateAction<number>> = (valOrFn) => {
    setCompletedSessionsTodayState((prev) => {
      const next = typeof valOrFn === 'function' ? valOrFn(prev) : valOrFn;
      localStore.set('study_completed_sessions_today', next);
      return next;
    });
  };

  // Live Study Hours = Base Hours + Current Live Elapsed Seconds / 3600
  const liveStudyHours = parseFloat((baseStudyHours + activeSessionElapsedSeconds / 3600).toFixed(3));
  const studyHours = liveStudyHours;

  const setStudyHours: React.Dispatch<React.SetStateAction<number>> = (valOrFn) => {
    setBaseStudyHours((prev) => {
      const next = typeof valOrFn === 'function' ? valOrFn(prev) : valOrFn;
      setActiveSessionElapsedSeconds(0);
      localStore.set('study_base_hours_today', next);
      const currentToday = getLocalDateStr(new Date(), userTimezone);
      setDailyLogsState((currentLogs) => {
        const updated = { ...currentLogs, [currentToday]: next };
        localStore.set('study_daily_logs', updated);
        return updated;
      });
      return next;
    });
  };

  const [isMainTimerInView, setIsMainTimerInView] = useState<boolean>(true);
  const mainTimerRef = useRef<HTMLDivElement>(null);

  // Background hydration from IndexedDB on initial mount
  useEffect(() => {
    localStore.get<ScheduledStudySlot[]>('study_scheduled_slots', []).then((slots) => {
      if (slots && slots.length > 0) setScheduledSlotsState(slots);
    });
    localStore.get<SlotTemplate[]>('study_slot_templates', DEFAULT_SLOT_TEMPLATES).then((templates) => {
      if (templates && templates.length > 0) setSlotTemplatesState(templates);
    });
    localStore.get<Record<string, number>>('study_daily_logs', {}).then((logs) => {
      if (logs && Object.keys(logs).length > 0) setDailyLogsState(logs);
    });
    localStore.get<StudyTask[]>('study_completion_tasks', []).then((tasksList) => {
      if (tasksList && tasksList.length > 0) {
        const currentToday = getLocalDateStr(new Date(), userTimezone);
        const sanitized = tasksList.map((t) => {
          if (!t.date || t.date.trim() === '') {
            const fromCreated = t.createdAt ? t.createdAt.slice(0, 10) : currentToday;
            return { ...t, date: /^\d{4}-\d{2}-\d{2}$/.test(fromCreated) ? fromCreated : currentToday };
          }
          return t;
        });
        setCompletionTasksState(sanitized);
      }
    });
  }, [userTimezone]);

  // Sync tasks for currently selected date with strict date equality
  const tasksForSelectedDate = completionTasks.filter(
    (t) => t.date === (selectedCalendarDate || todayStr)
  );

  // Active state synchronization refs for clean midnight transitions
  const isTimerRunningRef = useRef(isTimerRunning);
  const timerMinutesRef = useRef(timerMinutes);
  const timeLeftRef = useRef(timeLeft);
  const baseStudyHoursRef = useRef(baseStudyHours);
  const dailyLogsRef = useRef(dailyLogs);
  const completionTasksRef = useRef(completionTasks);
  const scheduledSlotsRef = useRef(scheduledSlots);
  const todayStrRef = useRef(todayStr);
  const selectedCalendarDateRef = useRef(selectedCalendarDate);
  const userTimezoneRef = useRef(userTimezone);
  const repeatSlotsEverydayRef = useRef(repeatSlotsEveryday);

  useEffect(() => { isTimerRunningRef.current = isTimerRunning; }, [isTimerRunning]);
  useEffect(() => { timerMinutesRef.current = timerMinutes; }, [timerMinutes]);
  useEffect(() => { timeLeftRef.current = timeLeft; }, [timeLeft]);
  useEffect(() => { baseStudyHoursRef.current = baseStudyHours; }, [baseStudyHours]);
  useEffect(() => { dailyLogsRef.current = dailyLogs; }, [dailyLogs]);
  useEffect(() => { completionTasksRef.current = completionTasks; }, [completionTasks]);
  useEffect(() => { scheduledSlotsRef.current = scheduledSlots; }, [scheduledSlots]);
  useEffect(() => { todayStrRef.current = todayStr; }, [todayStr]);
  useEffect(() => { selectedCalendarDateRef.current = selectedCalendarDate; }, [selectedCalendarDate]);
  useEffect(() => { userTimezoneRef.current = userTimezone; }, [userTimezone]);
  useEffect(() => { repeatSlotsEverydayRef.current = repeatSlotsEveryday; }, [repeatSlotsEveryday]);

  // Master Midnight Rollover Handler:
  // 1. Archives yesterday's study hours into dailyLogs[prevDay]
  // 2. Resets today's study hours log to 0.0
  // 3. Resets completed sessions today to 0
  // 4. Advances todayStr and tomorrowStr
  // 5. Schedules uncompleted tasks forward to today so they don't get lost
  // 6. Prepares timetable schedule for today with fresh incomplete status
  // 7. Auto-advances active calendar view to today
  const handleMidnightTransition = useCallback((prevDay: string, nextDay: string) => {
    // 1. Accrue any pending timer session seconds from prevDay
    let prevDayExtraHours = 0;
    if (isTimerRunningRef.current) {
      const targetEnd = localStore.getSync<number | null>('study_timer_target_end', null);
      const sessionSecsAtStart = localStore.getSync<number>('study_session_sec_at_start', timerMinutesRef.current * 60);
      if (targetEnd) {
        const remainingSecs = Math.max(0, Math.ceil((targetEnd - Date.now()) / 1000));
        const newlyAccruedSecs = Math.max(0, sessionSecsAtStart - remainingSecs);
        prevDayExtraHours = newlyAccruedSecs / 3600;
      }
    }

    // 2. Finalize and archive yesterday's log in dailyLogs
    const prevBase = baseStudyHoursRef.current || 0;
    const currentPrevTotal = dailyLogsRef.current[prevDay] ?? prevBase;
    const finalPrevHours = parseFloat((currentPrevTotal + prevDayExtraHours).toFixed(4));
    const nextDayExistingHours = dailyLogsRef.current[nextDay] || 0.0;

    const updatedLogs: Record<string, number> = {
      ...dailyLogsRef.current,
      [prevDay]: finalPrevHours,
      [nextDay]: nextDayExistingHours,
    };
    dailyLogsRef.current = updatedLogs;
    setDailyLogsState(updatedLogs);
    localStore.set('study_daily_logs', updatedLogs);

    // 3. Reset today's study hours log to 0.0 (or nextDay existing if pre-logged)
    setBaseStudyHours(nextDayExistingHours);
    localStore.set('study_base_hours_today', nextDayExistingHours);
    setActiveSessionElapsedSeconds(0);

    // If timer was running across midnight, reset the active session baseline for nextDay so it starts from 0
    if (isTimerRunningRef.current) {
      const remainingSecs = timeLeftRef.current;
      localStore.set('study_session_sec_at_start', remainingSecs);
      localStore.set('study_timer_target_end', Date.now() + remainingSecs * 1000);
    }

    // 4. Reset completed sessions for today
    setCompletedSessionsTodayState(0);
    localStore.set('study_completed_sessions_today', 0);
    localStore.set('study_last_active_date', nextDay);

    // 5. Update todayStr and tomorrowStr
    setTodayStr(nextDay);
    const newTomorrow = getTomorrowDateStr(new Date(), userTimezoneRef.current);
    setTomorrowStr(newTomorrow);

    // 6. Auto-advance selected calendar date if user was viewing previous day or today
    setSelectedCalendarDateState((prevSel) => {
      if (!prevSel || prevSel === prevDay) {
        localStore.set('selected_calendar_date', nextDay);
        return nextDay;
      }
      return prevSel;
    });

    // 7. Auto-repeat user planner blocks for nextDay if repeatSlotsEveryday is active:
    // Enables everyday repetition so user-made study blocks get repeated at midnight and created for the new day
    if (repeatSlotsEverydayRef.current) {
      const allSlots = scheduledSlotsRef.current || [];
      const hasSlotsOnNextDay = allSlots.some((s) => s.date === nextDay);
      if (!hasSlotsOnNextDay) {
        // Carry forward blocks from prevDay (or any slots with repeatEveryday !== false)
        const prevSlots = allSlots.filter((s) => (s.date ? s.date === prevDay : true));
        let blocksToRepeat = prevSlots.filter((s) => s.repeatEveryday !== false && s.enabled !== false);
        if (blocksToRepeat.length === 0) {
          // If no blocks on prevDay, find user blocks from the most recent date
          const allDates = Array.from(new Set(allSlots.map((s) => s.date).filter(Boolean) as string[])).sort();
          for (let i = allDates.length - 1; i >= 0; i--) {
            const candidateDate = allDates[i];
            if (candidateDate < nextDay) {
              const candidateSlots = allSlots.filter((s) => s.date === candidateDate && s.repeatEveryday !== false && s.enabled !== false);
              if (candidateSlots.length > 0) {
                blocksToRepeat = candidateSlots;
                break;
              }
            }
          }
        }
        if (blocksToRepeat.length > 0) {
          const nextDaySlots: ScheduledStudySlot[] = blocksToRepeat.map((slot, idx) => ({
            ...slot,
            id: `slot-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
            date: nextDay,
            markedComplete: false,
            createdWhenPast: false,
            repeatEveryday: true,
          }));
          const updatedSlots = [...allSlots, ...nextDaySlots];
          scheduledSlotsRef.current = updatedSlots;
          setScheduledSlotsState(updatedSlots);
          localStore.set('study_scheduled_slots', updatedSlots);
        }
      }
    }

    // 8. Recalculate streak
    const newStreak = calculateConsecutiveStreak(updatedLogs, userTimezoneRef.current);
    setStreakDays(newStreak);
    localStore.set('study_streak_days', newStreak);
  }, []);

  // Continuous Midnight Checker & Tab Focus / Visibility Synchronization (Checked every 15s to eliminate mobile lag)
  useEffect(() => {
    const checkMidnight = () => {
      const currentToday = getLocalDateStr(new Date(), userTimezone);
      const lastActiveDate = localStore.getSync<string>('study_last_active_date', todayStr);

      if (currentToday !== todayStr || currentToday !== lastActiveDate) {
        handleMidnightTransition(lastActiveDate || todayStr, currentToday);
      }
    };

    checkMidnight();
    const interval = setInterval(checkMidnight, 15000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkMidnight();
      }
    };

    window.addEventListener('focus', checkMidnight);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', checkMidnight);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [userTimezone, todayStr, handleMidnightTransition]);

  // Optimized Continuous Slot Progress and Status Tracking Loop
  useEffect(() => {
    const checkActiveSlots = () => {
      const currentToday = getLocalDateStr(new Date(), userTimezone);
      const nowMs = Date.now();

      // Auto-mark any study slot whose scheduled time has passed/completed
      setScheduledSlotsState((prevSlots) => {
        let changed = false;
        const updated = prevSlots.map((slot) => {
          const slotDate = slot.date || currentToday;
          // Only check enabled slots that are not already marked complete and not manually unmarked
          if (slot.enabled !== false && !slot.markedComplete && !slot.unmarkedByUser) {
            const progress = calculateSlotLiveProgress(
              slot.startTime,
              slot.endTime,
              nowMs,
              slotDate,
              slot.createdWhenPast,
              userTimezone
            );
            if (progress.status === 'completed' || progress.status === 'past') {
              changed = true;
              return { ...slot, markedComplete: true };
            }
          }
          return slot;
        });

        if (changed) {
          localStore.set('study_scheduled_slots', updated);
          scheduledSlotsRef.current = updated;
          return updated;
        }
        return prevSlots;
      });

      const currentSlots = scheduledSlotsRef.current || [];
      const todayEnabled = currentSlots.filter(
        (s) => (s.date || currentToday) === currentToday && s.enabled !== false
      );

      if (todayEnabled.length === 0) {
        setActiveScheduledSlot((prev) => (prev ? null : prev));
        setActiveSlotProgress((prev) => (prev ? null : prev));
        return;
      }

      const currentActive = todayEnabled.find((slot) => {
        const progress = calculateSlotLiveProgress(
          slot.startTime,
          slot.endTime,
          nowMs,
          currentToday,
          slot.createdWhenPast,
          userTimezone
        );
        return progress.status === 'active' && !slot.markedComplete;
      });

      if (currentActive) {
        const progress = calculateSlotLiveProgress(
          currentActive.startTime,
          currentActive.endTime,
          nowMs,
          currentToday,
          currentActive.createdWhenPast,
          userTimezone
        );
        setActiveScheduledSlot((prev) => (prev?.id === currentActive.id ? prev : currentActive));
        setActiveSlotProgress((prev) => {
          if (
            prev &&
            prev.formattedRemaining === progress.formattedRemaining &&
            prev.status === progress.status &&
            Math.abs(prev.progressPercent - progress.progressPercent) < 0.2
          ) {
            return prev;
          }
          return progress;
        });
      } else {
        setActiveScheduledSlot((prev) => (prev ? null : prev));
        setActiveSlotProgress((prev) => (prev ? null : prev));
      }
    };

    checkActiveSlots();
    const interval = setInterval(checkActiveSlots, 2000);
    return () => clearInterval(interval);
  }, [userTimezone]);

  // Real-Time Browser Tab Title Synchronization
  useEffect(() => {
    if (isTimerRunning) {
      const formatted = formatSecondsToHms(timeLeft);
      document.title = `${formatted} - Focus | StudyLawn`;
    } else if (activeScheduledSlot && activeSlotProgress && activeSlotProgress.status === 'active') {
      document.title = `${activeSlotProgress.formattedRemaining} - ${activeScheduledSlot.title} | StudyLawn`;
    } else {
      document.title = 'StudyLawn - Focus & Study Workspace';
    }
  }, [isTimerRunning, timeLeft, activeScheduledSlot, activeSlotProgress]);

  const tasks = completionTasks;
  const setTasks = (newTasksOrFn: StudyTask[] | ((prev: StudyTask[]) => StudyTask[])) => {
    setCompletionTasksState((prev) => {
      const next = typeof newTasksOrFn === 'function' ? newTasksOrFn(prev) : newTasksOrFn;
      localStore.set('study_completion_tasks', next);
      return next;
    });
  };

  // Main Live Timer Tick Interval
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        const targetEnd = localStore.getSync<number | null>('study_timer_target_end', null);
        const sessionSecsAtStart = localStore.getSync<number>('study_session_sec_at_start', timerMinutes * 60);
        const now = Date.now();

        if (targetEnd) {
          const remaining = Math.max(0, Math.ceil((targetEnd - now) / 1000));
          const elapsed = Math.max(0, sessionSecsAtStart - remaining);

          setTimeLeft(remaining);
          localStore.set('study_time_left', remaining);
          setActiveSessionElapsedSeconds(elapsed);

          if (remaining <= 0) {
            // Session Complete
            setIsTimerRunning(false);
            localStore.set('study_is_timer_running', false);
            localStore.set('study_timer_target_end', null);

            const sessionHours = sessionSecsAtStart / 3600;
            const newBase = parseFloat((baseStudyHours + sessionHours).toFixed(3));
            const currentToday = getLocalDateStr(new Date(), userTimezone);

            setBaseStudyHours(newBase);
            setActiveSessionElapsedSeconds(0);
            localStore.set('study_base_hours_today', newBase);

            setDailyLogsState((logs) => {
              const updated = { ...logs, [currentToday]: newBase };
              localStore.set('study_daily_logs', updated);
              return updated;
            });

            setCompletedSessionsTodayState((prev) => {
              const next = prev + 1;
              localStore.set('study_completed_sessions_today', next);
              return next;
            });
            localStore.set('study_last_active_date', currentToday);

            // Auto-mark the active study block as complete when the focus timer completes
            if (activeScheduledSlotRef.current) {
              const currentSlotId = activeScheduledSlotRef.current.id;
              setScheduledSlotsState((prev) => {
                const next = prev.map((s) =>
                  s.id === currentSlotId ? { ...s, markedComplete: true, unmarkedByUser: false } : s
                );
                localStore.set('study_scheduled_slots', next);
                scheduledSlotsRef.current = next;
                return next;
              });
            }

            const defaultNextSecs = timerMinutes * 60;
            setTimeLeft(defaultNextSecs);
            localStore.set('study_time_left', defaultNextSecs);
          }
        }
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerMinutes, baseStudyHours, userTimezone]);

  const toggleTimer = () => {
    if (!isTimerRunning) {
      // Start / Resume Timer
      const currentSecondsLeft = timeLeft > 0 ? timeLeft : timerMinutes * 60;
      const now = Date.now();
      const targetEndTimestamp = now + currentSecondsLeft * 1000;

      localStore.set('study_session_sec_at_start', currentSecondsLeft);
      localStore.set('study_timer_target_end', targetEndTimestamp);
      localStore.set('study_is_timer_running', true);

      setActiveSessionElapsedSeconds(0);
      setTimeLeft(currentSecondsLeft);
      setIsTimerRunning(true);
    } else {
      // Pause Timer
      const targetEnd = localStore.getSync<number | null>('study_timer_target_end', null);
      const sessionSecsAtStart = localStore.getSync<number>('study_session_sec_at_start', timerMinutes * 60);
      const now = Date.now();

      let newlyAccruedSecs = 0;
      let remainingSecs = 0;

      if (targetEnd) {
        remainingSecs = Math.max(0, Math.ceil((targetEnd - now) / 1000));
        newlyAccruedSecs = Math.max(0, sessionSecsAtStart - remainingSecs);
      } else {
        remainingSecs = timeLeft;
      }

      const currentToday = getLocalDateStr(new Date(), userTimezone);
      const newBase = parseFloat((baseStudyHours + newlyAccruedSecs / 3600).toFixed(4));

      setBaseStudyHours(newBase);
      localStore.set('study_base_hours_today', newBase);
      setActiveSessionElapsedSeconds(0);

      setDailyLogsState((logs) => {
        const updated = { ...logs, [currentToday]: newBase };
        localStore.set('study_daily_logs', updated);
        return updated;
      });

      localStore.set('study_is_timer_running', false);
      localStore.set('study_timer_target_end', null);
      localStore.set('study_time_left', remainingSecs);

      setTimeLeft(remainingSecs);
      setIsTimerRunning(false);
    }
  };

  const resetTimer = () => {
    // If timer was running, accrue the elapsed time during this run to base
    if (isTimerRunning) {
      const targetEnd = localStore.getSync<number | null>('study_timer_target_end', null);
      const sessionSecsAtStart = localStore.getSync<number>('study_session_sec_at_start', timerMinutes * 60);
      let newlyAccruedSecs = 0;
      if (targetEnd) {
        const remainingSecs = Math.max(0, Math.ceil((targetEnd - Date.now()) / 1000));
        newlyAccruedSecs = Math.max(0, sessionSecsAtStart - remainingSecs);
      }
      if (newlyAccruedSecs > 0) {
        const newBase = parseFloat((baseStudyHours + newlyAccruedSecs / 3600).toFixed(4));
        setBaseStudyHours(newBase);
        localStore.set('study_base_hours_today', newBase);
        const currentToday = getLocalDateStr(new Date(), userTimezone);
        setDailyLogsState((logs) => {
          const updated = { ...logs, [currentToday]: newBase };
          localStore.set('study_daily_logs', updated);
          return updated;
        });
      }
    }

    setIsTimerRunning(false);
    localStore.set('study_is_timer_running', false);
    localStore.set('study_timer_target_end', null);
    setActiveSessionElapsedSeconds(0);

    const defaultSecs = timerMinutes * 60;
    setTimeLeft(defaultSecs);
    localStore.set('study_time_left', defaultSecs);
  };

  const syncTimer = () => {
    const isRunning = localStore.getSync<boolean>('study_is_timer_running', false);
    const targetEnd = localStore.getSync<number | null>('study_timer_target_end', null);
    if (isRunning && targetEnd) {
      const remaining = Math.max(0, Math.ceil((targetEnd - Date.now()) / 1000));
      setTimeLeft(remaining);
      setIsTimerRunning(remaining > 0);
    }
  };

  const handleSetCustomTimer = (mins: number) => {
    if (isTimerRunning) {
      const targetEnd = localStore.getSync<number | null>('study_timer_target_end', null);
      const sessionSecsAtStart = localStore.getSync<number>('study_session_sec_at_start', timerMinutes * 60);
      let newlyAccruedSecs = 0;
      if (targetEnd) {
        const remainingSecs = Math.max(0, Math.ceil((targetEnd - Date.now()) / 1000));
        newlyAccruedSecs = Math.max(0, sessionSecsAtStart - remainingSecs);
      }
      if (newlyAccruedSecs > 0) {
        const newBase = parseFloat((baseStudyHours + newlyAccruedSecs / 3600).toFixed(4));
        setBaseStudyHours(newBase);
        localStore.set('study_base_hours_today', newBase);
        const currentToday = getLocalDateStr(new Date(), userTimezone);
        setDailyLogsState((logs) => {
          const updated = { ...logs, [currentToday]: newBase };
          localStore.set('study_daily_logs', updated);
          return updated;
        });
      }
    }

    setIsTimerRunning(false);
    localStore.set('study_is_timer_running', false);
    localStore.set('study_timer_target_end', null);
    setActiveSessionElapsedSeconds(0);

    setTimerMinutes(mins);
    localStore.set('study_timer_minutes', mins);

    const secs = mins * 60;
    setTimeLeft(secs);
    localStore.set('study_time_left', secs);
  };

  const handleSetCustomTimerWithHours = (hours: number, mins: number) => {
    const totalMins = hours * 60 + mins;
    handleSetCustomTimer(totalMins);
  };

  const formatTimer = (seconds: number): string => {
    return formatSecondsToHms(seconds);
  };

  const recordStudyProgress = (hoursToAdd: number, sessionsToAdd = 1) => {
    const currentToday = getLocalDateStr(new Date(), userTimezone);
    setBaseStudyHours((prev) => {
      const next = parseFloat((prev + hoursToAdd).toFixed(2));
      localStore.set('study_base_hours_today', next);
      setDailyLogsState((logs) => {
        const updated = { ...logs, [currentToday]: next };
        localStore.set('study_daily_logs', updated);
        return updated;
      });
      return next;
    });
    setCompletedSessionsToday((prev) => {
      const next = prev + sessionsToAdd;
      localStore.set('study_completed_sessions_today', next);
      return next;
    });
    localStore.set('study_last_active_date', currentToday);
  };

  const updateLogForDate = (dateStr: string, hours: number) => {
    const safeHours = Math.max(0, parseFloat(hours.toFixed(2)));
    setDailyLogsState((logs) => {
      const updated = { ...logs, [dateStr]: safeHours };
      localStore.set('study_daily_logs', updated);
      return updated;
    });
    const currentToday = getLocalDateStr(new Date(), userTimezone);
    if (dateStr === currentToday) {
      setBaseStudyHours(safeHours);
      setActiveSessionElapsedSeconds(0);
      localStore.set('study_base_hours_today', safeHours);

      // If timer is running, align session baseline so accrued elapsed restarts from 0
      if (isTimerRunning) {
        const now = Date.now();
        localStore.set('study_session_sec_at_start', timeLeft);
        localStore.set('study_timer_target_end', now + timeLeft * 1000);
      }
    }
  };

  // --- Task Methods ---
  const addCompletionTask = (task: Omit<StudyTask, 'id' | 'createdAt'>): StudyTask => {
    const dateToUse = task.date || selectedCalendarDate || todayStr;
    const newTask: StudyTask = {
      ...task,
      id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      date: dateToUse,
      order: completionTasks.length,
    };
    const updated = [newTask, ...completionTasks];
    setCompletionTasks(updated);
    return newTask;
  };

  const updateCompletionTask = (id: string, updates: Partial<StudyTask>) => {
    const updated = completionTasks.map((t) => (t.id === id ? { ...t, ...updates } : t));
    setCompletionTasks(updated);
  };

  const deleteCompletionTask = (id: string) => {
    const updated = completionTasks.filter((t) => t.id !== id);
    setCompletionTasks(updated);
  };

  const toggleCompletionTask = (id: string) => {
    const updated = completionTasks.map((t) => {
      if (t.id === id) {
        const nextCompleted = !t.completed;
        return {
          ...t,
          completed: nextCompleted,
          completedAt: nextCompleted ? new Date().toISOString() : undefined,
        };
      }
      return t;
    });
    setCompletionTasks(updated);
  };

  const reorderCompletionTasks = (orderedTasks: StudyTask[]) => {
    const withOrder = orderedTasks.map((t, idx) => ({ ...t, order: idx }));
    setCompletionTasks(withOrder);
  };

  const allocateTasksToTimetableSlots = async (
    targetSlots: ScheduledStudySlot[],
    tasksToUse?: StudyTask[],
    targetDate?: string
  ): Promise<{ allocatedSlots: ScheduledStudySlot[]; strategy: string }> => {
    const unassignedTasks = (tasksToUse || completionTasks).filter((t) => !t.completed);
    const dateToAssign = targetDate || todayStr;

    if (unassignedTasks.length === 0) {
      return {
        allocatedSlots: targetSlots,
        strategy: 'No pending tasks found to allocate.',
      };
    }

    const priorityScore: Record<string, number> = { High: 3, Medium: 2, Low: 1 };
    const sortedTasks = [...unassignedTasks].sort((a, b) => {
      const pDiff = (priorityScore[b.priority] || 2) - (priorityScore[a.priority] || 2);
      if (pDiff !== 0) return pDiff;
      return (b.estimatedMinutes || 45) - (a.estimatedMinutes || 45);
    });

    let taskIdx = 0;
    const allocated = targetSlots.map((slot) => {
      if (slot.targetTopics && slot.targetTopics.trim().length > 0) {
        return slot;
      }
      if (taskIdx >= sortedTasks.length) {
        return slot;
      }

      const assignedTask = sortedTasks[taskIdx];
      taskIdx++;
      return {
        ...slot,
        date: dateToAssign,
        title: slot.title || `${assignedTask.category || 'Focus'}: ${assignedTask.title}`,
        targetTopics: assignedTask.title,
        allocationReason: `Auto-allocated based on ${assignedTask.priority} priority`,
      };
    });

    setScheduledSlots((prev) => {
      const otherDatesSlots = prev.filter((s) => (s.date ? s.date !== dateToAssign : todayStr !== dateToAssign));
      return [...otherDatesSlots, ...allocated];
    });
    return {
      allocatedSlots: allocated,
      strategy: `Successfully assigned ${Math.min(taskIdx, sortedTasks.length)} high-priority tasks to study slots.`,
    };
  };

  // --- Scheduled Slots Operations ---
  const addScheduledSlot = (slot: Omit<ScheduledStudySlot, 'id'>) => {
    const dateToUse = slot.date || selectedCalendarDate || todayStr;
    const newSlot: ScheduledStudySlot = {
      ...slot,
      id: `slot-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      date: dateToUse,
      repeatEveryday: slot.repeatEveryday !== undefined ? slot.repeatEveryday : repeatSlotsEveryday,
    };
    setScheduledSlots((prev) => [...prev, newSlot]);
  };

  const updateScheduledSlot = (id: string, updated: Partial<ScheduledStudySlot>) => {
    setScheduledSlots((prev) => prev.map((s) => (s.id === id ? { ...s, ...updated } : s)));
  };

  const deleteScheduledSlot = (id: string) => {
    setScheduledSlots((prev) => prev.filter((s) => s.id !== id));
  };

  const toggleScheduledSlotEnabled = (id: string) => {
    setScheduledSlots((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  };

  const toggleMarkSlotComplete = (id: string) => {
    setScheduledSlots((prev) => {
      const slot = prev.find((s) => s.id === id);
      if (!slot) return prev;

      const slotDateStr = slot.date || todayStr;
      const liveProg = calculateSlotLiveProgress(slot.startTime, slot.endTime, Date.now(), slotDateStr, slot.createdWhenPast, userTimezone);
      const isPastSlot = liveProg.status === 'past' || liveProg.status === 'completed' || !!slot.createdWhenPast;

      const isCurrentlyComplete = slot.markedComplete === true || (isPastSlot && slot.unmarkedByUser !== true);

      const next = prev.map((s) => {
        if (s.id !== id) return s;
        if (isCurrentlyComplete) {
          // User explicitly marks incomplete
          return { ...s, markedComplete: false, unmarkedByUser: true };
        } else {
          // User marks complete
          return { ...s, markedComplete: true, unmarkedByUser: false };
        }
      });
      localStore.set('study_scheduled_slots', next);
      scheduledSlotsRef.current = next;
      return next;
    });
  };

  const resetToDefaultSlots = () => {
    setScheduledSlots([]);
  };

  // Slot Templates Operations
  const saveSlotTemplate = (title: string, slotsToSave?: ScheduledStudySlot[]): SlotTemplate => {
    const currentList = slotsToSave || scheduledSlots;
    const templateSlots: SlotTemplateItem[] = currentList.map((s) => ({
      title: s.title,
      startTime: s.startTime,
      endTime: s.endTime,
      targetTopics: s.targetTopics,
      notes: s.notes,
      enabled: s.enabled,
    }));

    const newTemplate: SlotTemplate = {
      id: `template-${Date.now()}`,
      title: title.trim() || 'My Routine Template',
      createdAt: new Date().toISOString(),
      slots: templateSlots,
    };

    const updated = [newTemplate, ...slotTemplates];
    setSlotTemplates(updated);
    return newTemplate;
  };

  const loadSlotTemplate = (templateId: string, targetDate?: string, mode: 'replace' | 'append' = 'replace') => {
    const template = slotTemplates.find((t) => t.id === templateId);
    if (!template) return;

    const dateToUse = targetDate || selectedCalendarDate || todayStr;
    const newSlots: ScheduledStudySlot[] = template.slots.map((item, idx) => ({
      id: `slot-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
      title: item.title,
      startTime: item.startTime,
      endTime: item.endTime,
      date: dateToUse,
      targetTopics: item.targetTopics,
      notes: item.notes,
      enabled: item.enabled !== false,
      markedComplete: false,
      createdWhenPast: false,
    }));

    setScheduledSlots((prev) => {
      if (mode === 'replace') {
        // Keep all slots from previous and other days! Only replace the slots for dateToUse
        const otherDatesSlots = prev.filter((s) => (s.date ? s.date !== dateToUse : todayStr !== dateToUse));
        return [...otherDatesSlots, ...newSlots];
      } else {
        return [...prev, ...newSlots];
      }
    });
  };

  const deleteSlotTemplate = (templateId: string) => {
    const updated = slotTemplates.filter((t) => t.id !== templateId);
    setSlotTemplates(updated);
  };

  return (
    <TimerContext.Provider
      value={{
        timerMinutes,
        setTimerMinutes,
        customHoursInput,
        setCustomHoursInput,
        customMinutesInput,
        setCustomMinutesInput,
        timeLeft,
        isTimerRunning,
        completedSessionsToday,
        setCompletedSessionsToday,
        studyHours,
        setStudyHours,
        streakDays,
        setStreakDays,
        studyTarget,
        setStudyTarget,
        toggleTimer,
        syncTimer,
        resetTimer,
        handleSetCustomTimer,
        handleSetCustomTimerWithHours,
        formatTimer,
        formatDurationLabel,
        isMainTimerInView,
        setIsMainTimerInView,
        mainTimerRef,
        isPopoutMinimized,
        setIsPopoutMinimized,
        recordStudyProgress,
        liveStudyHours,
        dailyLogs,
        updateLogForDate,
        userTimezone,
        currentTimezoneLabel,
        todayStr,
        tomorrowStr,
        selectedCalendarDate,
        setSelectedCalendarDate,
        dailyTasks,
        tasks,
        setTasks,
        completionTasks,
        tasksForSelectedDate,
        getTasksForDate,
        addCompletionTask,
        updateCompletionTask,
        deleteCompletionTask,
        toggleCompletionTask,
        reorderCompletionTasks,
        allocateTasksToTimetableSlots,
        scheduledSlots,
        setScheduledSlots,
        activeScheduledSlot,
        activeSlotProgress,
        addScheduledSlot,
        updateScheduledSlot,
        deleteScheduledSlot,
        toggleScheduledSlotEnabled,
        toggleMarkSlotComplete,
        resetToDefaultSlots,
        autonomousSlotStudyHoursToday,
        repeatSlotsEveryday,
        setRepeatSlotsEveryday,
        autoApplyDefaultRoutine,
        setAutoApplyDefaultRoutine,
        applyDefaultRoutine,
        getSlotsForDate,
        stepDate,
        formatDisplayDate: formatDisplayDateBound,
        slotTemplates,
        saveSlotTemplate,
        loadSlotTemplate,
        deleteSlotTemplate,
      }}
    >
      {children}
    </TimerContext.Provider>
  );
};

export const useTimer = () => {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
};
