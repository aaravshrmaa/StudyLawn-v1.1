import React, { useState, useEffect } from 'react';
import {
  RotateCcw,
  RefreshCw,
  Target,
  Play,
  Pause,
  Maximize2,
  Check,
  Trash2,
  Edit2,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  Plus,
  ArrowRight,
  ListTodo,
  Bookmark,
} from 'lucide-react';
import { ActiveTab, CompletionCategory, StudyTask } from '../types';
import {
  useTimer,
  getLocalDateStr,
  calculateSlotLiveProgress,
} from '../context/TimerContext';
import { useAuth } from '../context/AuthContext';
import { StudyCalendar } from './StudyCalendar';
import { EditGoalModal } from './EditGoalModal';
import { SlotEditorModal } from './SlotEditorModal';
import { SlotTemplateModal } from './SlotTemplateModal';

interface OverviewDashboardProps {
  onNavigateTab: (tab: ActiveTab) => void;
}

const CATEGORIES: CompletionCategory[] = [
  'Deep Work',
  'Research',
  'Project',
  'Writing',
  'Review',
  'Practice',
  'Strategy',
  'Reading',
  'General',
];

interface DailyReminderTask {
  id: string;
  title: string;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({ onNavigateTab }) => {
  const { profile } = useAuth();

  const {
    timerMinutes,
    customHoursInput,
    setCustomHoursInput,
    customMinutesInput,
    setCustomMinutesInput,
    timeLeft,
    isTimerRunning,
    completedSessionsToday,
    setCompletedSessionsToday,
    liveStudyHours,
    setStudyHours,
    toggleTimer,
    resetTimer,
    handleSetCustomTimer,
    handleSetCustomTimerWithHours,
    formatTimer,
    formatDurationLabel,
    mainTimerRef,
    streakDays,
    studyTarget,
    syncTimer,
    completionTasks,
    addCompletionTask,
    updateCompletionTask,
    deleteCompletionTask,
    toggleCompletionTask,
    reorderCompletionTasks,
    selectedCalendarDate,
    setSelectedCalendarDate,
    scheduledSlots,
    addScheduledSlot,
    toggleMarkSlotComplete,
    userTimezone,
    currentTimezoneLabel,
    todayStr,
    tomorrowStr,
    stepDate,
    formatDisplayDate,
  } = useTimer();

  const [isAddSlotOpen, setIsAddSlotOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);

  // Daily Schedule Box View Toggle: 'schedule' vs 'tasks'
  const [scheduleWidgetView, setScheduleWidgetView] = useState<'schedule' | 'tasks'>('schedule');
  const [dailyReminderTasks, setDailyReminderTasks] = useState<DailyReminderTask[]>(() => {
    try {
      const saved = localStorage.getItem('studylawn_daily_reminder_tasks');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Remove any mock data that was previously saved
          return parsed
            .filter((t: any) => t && t.id && !t.id.startsWith('daily-task-') && t.title)
            .map((t: any) => ({
              id: t.id,
              title: t.title,
            }));
        }
      }
    } catch (e) {
      console.error('Error loading daily reminder tasks:', e);
    }
    return [];
  });

  const [isEditingDailyTasks, setIsEditingDailyTasks] = useState(false);
  const [newDailyTitle, setNewDailyTitle] = useState('');
  const [draggedDailyTaskId, setDraggedDailyTaskId] = useState<string | null>(null);
  const [dragOverDailyTaskId, setDragOverDailyTaskId] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('studylawn_daily_reminder_tasks', JSON.stringify(dailyReminderTasks));
    } catch (e) {
      console.error('Error saving daily reminder tasks:', e);
    }
  }, [dailyReminderTasks]);

  const handleAddDailyTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDailyTitle.trim()) return;
    const newTask: DailyReminderTask = {
      id: 'daily-' + Date.now(),
      title: newDailyTitle.trim(),
    };
    setDailyReminderTasks((prev) => [...prev, newTask]);
    setNewDailyTitle('');
  };

  const handleDeleteDailyTask = (id: string) => {
    setDailyReminderTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const handleDailyDragStart = (e: React.DragEvent, id: string) => {
    setDraggedDailyTaskId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDailyDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverDailyTaskId !== id) {
      setDragOverDailyTaskId(id);
    }
  };

  const handleDailyDragEnd = () => {
    setDraggedDailyTaskId(null);
    setDragOverDailyTaskId(null);
  };

  const handleDailyDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const sourceId = draggedDailyTaskId || e.dataTransfer.getData('text/plain');
    if (sourceId && sourceId !== targetId) {
      setDailyReminderTasks((prev) => {
        const sourceIdx = prev.findIndex((t) => t.id === sourceId);
        const targetIdx = prev.findIndex((t) => t.id === targetId);
        if (sourceIdx === -1 || targetIdx === -1) return prev;
        const reordered = [...prev];
        const [moved] = reordered.splice(sourceIdx, 1);
        reordered.splice(targetIdx, 0, moved);
        return reordered;
      });
    }
    setDraggedDailyTaskId(null);
    setDragOverDailyTaskId(null);
  };

  // Active date filter (synced with selectedCalendarDate or today)
  const [activeDate, setActiveDate] = useState<string>(() => selectedCalendarDate || todayStr);
  const [overviewTaskScope, setOverviewTaskScope] = useState<'today' | 'tomorrow' | 'custom' | 'all'>('today');

  // Keep activeDate in sync with external calendar date or today updates
  useEffect(() => {
    if (selectedCalendarDate) {
      setActiveDate(selectedCalendarDate);
      if (selectedCalendarDate === todayStr) {
        setOverviewTaskScope('today');
      } else if (selectedCalendarDate === tomorrowStr) {
        setOverviewTaskScope('tomorrow');
      } else {
        setOverviewTaskScope('custom');
      }
    }
  }, [selectedCalendarDate, todayStr, tomorrowStr]);

  const handleSelectDate = (dateStr: string, scopeMode?: 'today' | 'tomorrow' | 'custom') => {
    setActiveDate(dateStr);
    if (scopeMode) {
      setOverviewTaskScope(scopeMode);
    } else if (dateStr === todayStr) {
      setOverviewTaskScope('today');
    } else if (dateStr === tomorrowStr) {
      setOverviewTaskScope('tomorrow');
    } else {
      setOverviewTaskScope('custom');
    }
    setSelectedCalendarDate(dateStr);
  };

  const handlePrevDay = () => {
    const prev = stepDate(activeDate, -1);
    handleSelectDate(prev, prev === todayStr ? 'today' : prev === tomorrowStr ? 'tomorrow' : 'custom');
  };

  const handleNextDay = () => {
    const next = stepDate(activeDate, 1);
    handleSelectDate(next, next === todayStr ? 'today' : next === tomorrowStr ? 'tomorrow' : 'custom');
  };

  // New Objective form state
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<CompletionCategory>('Deep Work');
  const [newPriority, setNewPriority] = useState<'High' | 'Medium' | 'Low'>('High');
  const [newMinutes, setNewMinutes] = useState(45);
  const [isAddingTaskExpanded, setIsAddingTaskExpanded] = useState(false);

  // Inline editing state
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [editingMinutes, setEditingMinutes] = useState(45);

  // Filter state for tasks
  const [taskFilter, setTaskFilter] = useState<'all' | 'pending' | 'completed'>('all');

  const [showCustomDuration, setShowCustomDuration] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);

  // Routine Checklist State (resets cleanly each day)
  const [envChecklist, setEnvChecklist] = useState<{ [key: string]: boolean }>(() => {
    const saved = localStorage.getItem(`study_readiness_checklist_${todayStr}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      deskClean: false,
      distractionFree: false,
      formulasRevised: false,
      problemsSolved: false,
      hydrationOk: false,
      notesLogged: false,
    };
  });

  // Automatically reset/sync checklist when midnight passes and todayStr changes
  useEffect(() => {
    const saved = localStorage.getItem(`study_readiness_checklist_${todayStr}`);
    if (saved) {
      try {
        setEnvChecklist(JSON.parse(saved));
        return;
      } catch (e) {}
    }
    setEnvChecklist({
      deskClean: false,
      distractionFree: false,
      formulasRevised: false,
      problemsSolved: false,
      hydrationOk: false,
      notesLogged: false,
    });
  }, [todayStr]);

  const toggleEnvCheck = (key: string) => {
    const updated = { ...envChecklist, [key]: !envChecklist[key] };
    setEnvChecklist(updated);
    localStorage.setItem(`study_readiness_checklist_${todayStr}`, JSON.stringify(updated));
  };

  const handleResetDashboardToZero = () => {
    if (!window.confirm('Reset today’s study session timer and logged hours to zero?')) return;
    setStudyHours(0.0);
    setCompletedSessionsToday(0);
    resetTimer();
  };

  // Date and Scheduled Slots for today (synced with user timezone)
  const todaySlots = scheduledSlots
    .filter((s) => (s.date || todayStr) === todayStr && s.enabled !== false)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const nowMs = Date.now();
  const currentSlot = todaySlots.find((s) => {
    const prog = calculateSlotLiveProgress(s.startTime, s.endTime, nowMs, todayStr, s.createdWhenPast, userTimezone);
    const isPast = prog.status === 'past' || prog.status === 'completed' || !!s.createdWhenPast;
    const isDone = s.markedComplete === true || (isPast && s.unmarkedByUser !== true);
    return prog.status === 'active' && !isDone;
  });

  const activeSlotProgress = currentSlot
    ? calculateSlotLiveProgress(currentSlot.startTime, currentSlot.endTime, nowMs, todayStr, currentSlot.createdWhenPast, userTimezone)
    : null;

  // Task filtering and ordering based on activeDate
  const activeDateTasks = completionTasks.filter((t) => {
    if (overviewTaskScope === 'all') return true;
    return t.date === activeDate;
  });

  const filteredTasks = activeDateTasks.filter((t) => {
    if (taskFilter === 'pending') return !t.completed;
    if (taskFilter === 'completed') return t.completed;
    return true;
  });

  const totalTasks = activeDateTasks.length;
  const completedTasksCount = activeDateTasks.filter((t) => t.completed).length;
  const taskCompletionPercentage = totalTasks > 0 ? Math.round((completedTasksCount / totalTasks) * 100) : 0;

  const totalSecondsStudied = Math.round(liveStudyHours * 3600);
  const displayH = Math.floor(totalSecondsStudied / 3600);
  const displayM = Math.floor((totalSecondsStudied % 3600) / 60);
  const displayS = totalSecondsStudied % 60;
  const activeDailyTarget = profile?.targetDailyHours || studyTarget || 8;

  // Add Task Handler
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const targetTaskDate = overviewTaskScope === 'all' ? (selectedCalendarDate || todayStr) : activeDate;
    addCompletionTask({
      title: newTitle.trim(),
      category: newCategory,
      priority: newPriority,
      estimatedMinutes: newMinutes,
      completed: false,
      date: targetTaskDate,
    });
    setNewTitle('');
    setIsAddingTaskExpanded(false);
  };

  // Inline Edit Handlers
  const startEditing = (task: StudyTask) => {
    setEditingTaskId(task.id);
    setEditingTitle(task.title);
    setEditingMinutes(task.estimatedMinutes || 45);
  };

  const saveEditing = (taskId: string) => {
    if (editingTitle.trim()) {
      updateCompletionTask(taskId, {
        title: editingTitle.trim(),
        estimatedMinutes: editingMinutes,
      });
    }
    setEditingTaskId(null);
  };

  // Move task up/down in order
  const handleMoveTask = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= filteredTasks.length) return;

    const newOrdered = [...completionTasks];
    const taskA = filteredTasks[index];
    const taskB = filteredTasks[targetIndex];

    const idxA = newOrdered.findIndex((t) => t.id === taskA.id);
    const idxB = newOrdered.findIndex((t) => t.id === taskB.id);

    if (idxA !== -1 && idxB !== -1) {
      const temp = newOrdered[idxA];
      newOrdered[idxA] = newOrdered[idxB];
      newOrdered[idxB] = temp;
      reorderCompletionTasks(newOrdered);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 12) {
      return 'Good morning.';
    } else if (hour >= 12 && hour < 17) {
      return 'Good afternoon.';
    } else if (hour >= 17 && hour < 22) {
      return 'Good evening.';
    } else {
      return 'Good night.';
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn pb-12 font-sans text-[var(--ink)]">
      {/* ─── Hero Section ─── */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 pt-0.5 border-b border-[var(--border)] pb-4 sm:pb-6">
        {/* Left Column: Metrics */}
        <div className="lg:col-span-7 space-y-3">
          <h2 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-semibold leading-[0.9] tracking-tight text-[var(--ink)]">
            StudyLawn
          </h2>
          <p className="font-sans text-xs sm:text-sm text-[var(--muted)] max-w-2xl">
            Set your daily target below, pick a timer mode, and start clocking honest hours. All features are completely free, private, and ready to use instantly.
          </p>
 
          <div className="grid grid-cols-3 gap-3 sm:gap-6 border-t border-[var(--border)] pt-3 sm:pt-4 mt-3 sm:mt-4">
            <div>
              <div className="editorial-label text-xs sm:text-xs font-semibold tracking-wider text-[var(--muted)] mb-1">Study Hours</div>
              <div className="font-cinzel text-3xl sm:text-4xl lg:text-4xl font-bold text-[var(--ink)] leading-none tabular-nums py-0.5">
                {displayH}h {displayM}m
              </div>
              <div className="font-mono text-[10px] sm:text-xs text-[var(--muted)] mt-1.5">
                Target: {activeDailyTarget}h &bull; {Math.round((liveStudyHours / activeDailyTarget) * 100)}%
              </div>
            </div>

            <div>
              <div className="editorial-label text-xs sm:text-xs font-semibold tracking-wider text-[var(--muted)] mb-1">Task Yield</div>
              <div className="font-cinzel text-3xl sm:text-4xl lg:text-4xl font-bold text-[var(--ink)] leading-none tabular-nums py-0.5">
                {taskCompletionPercentage}%
              </div>
              <div className="font-mono text-[10px] sm:text-xs text-[var(--muted)] mt-1.5">
                {completedTasksCount} of {totalTasks} done
              </div>
            </div>

            <div>
              <div className="editorial-label text-xs sm:text-xs font-semibold tracking-wider text-[var(--muted)] mb-1">Daily Streak</div>
              <div className="font-cinzel text-3xl sm:text-4xl lg:text-4xl font-bold text-[var(--ink)] leading-none tabular-nums py-0.5">
                {streakDays} <span className="text-xs text-[var(--muted)]">days</span>
              </div>
              <div className="font-mono text-[10px] sm:text-xs text-[var(--muted)] mt-1.5">
                {completedSessionsToday} sessions
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Focus Message & Quick Actions & Minimized Aeroplane TV Schedule Widget */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-3 pt-0.5 lg:pl-4">
          <div className="space-y-3">
            <p className="font-serif text-base leading-relaxed text-[var(--ink)]">
              Build sustainable study momentum with deep, distraction-free work intervals and daily task execution.
            </p>

            {/* Schedule Monitor Widget */}
            <div className="editorial-card p-4 space-y-3 border border-[var(--border-strong)] bg-[var(--card-bg)] shadow-sm">
              {scheduleWidgetView === 'schedule' ? (
                /* Header: Daily Schedule */
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
                  <div className="flex items-center gap-2 font-mono text-[11px] font-bold text-[var(--accent)] uppercase tracking-wider">
                    <Clock className="w-3.5 h-3.5 text-[var(--accent)]" />
                    <span>Daily Schedule</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={() => onNavigateTab('timetable')}
                      className="text-[10px] text-[var(--muted)] hover:text-[var(--accent)] transition-colors uppercase tracking-wider flex items-center gap-1 cursor-pointer font-bold"
                    >
                      <span>Planner</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setScheduleWidgetView('tasks')}
                      className="text-[var(--muted)] hover:text-[var(--ink)] font-mono text-sm sm:text-base font-bold leading-none cursor-pointer transition-colors p-0 select-none"
                      title="Daily Tasks"
                      aria-label="View Daily Tasks"
                    >
                      &gt;
                    </button>
                  </div>
                </div>
              ) : (
                /* Header: Daily Tasks */
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setScheduleWidgetView('schedule')}
                      className="text-[var(--muted)] hover:text-[var(--ink)] font-mono text-sm sm:text-base font-bold leading-none cursor-pointer transition-colors p-0 select-none"
                      title="Daily Schedule"
                      aria-label="Back to Daily Schedule"
                    >
                      &lt;
                    </button>
                    <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-[var(--accent)] uppercase tracking-wider">
                      <ListTodo className="w-3.5 h-3.5 text-[var(--accent)]" />
                      <span>Daily Tasks</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => setIsEditingDailyTasks((prev) => !prev)}
                      className={`cursor-pointer p-0.5 transition-colors flex items-center gap-1 text-[11px] font-mono ${
                        isEditingDailyTasks
                          ? 'text-[var(--accent)] font-bold'
                          : 'text-[var(--muted)] hover:text-[var(--ink)]'
                      }`}
                      title={isEditingDailyTasks ? 'Done Editing' : 'Add or delete daily tasks'}
                      aria-label={isEditingDailyTasks ? 'Done Editing' : 'Add or delete daily tasks'}
                    >
                      <Edit2 className="w-3 h-3" />
                      <span className="text-[10px]">{isEditingDailyTasks ? 'Done' : 'Edit'}</span>
                    </button>
                    <button
                      onClick={() => onNavigateTab('completion')}
                      className="text-[10px] text-[var(--muted)] hover:text-[var(--accent)] transition-colors uppercase tracking-wider flex items-center gap-1 cursor-pointer font-bold"
                    >
                      <span>Tasks</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}

              {/* View 1: Daily Tasks */}
              {scheduleWidgetView === 'tasks' ? (
                <div className="space-y-2.5">
                  {/* Pencil Edit Mode: Add New Daily Task Form */}
                  {isEditingDailyTasks && (
                    <form
                      onSubmit={handleAddDailyTask}
                      className="p-2.5 bg-[var(--surface-subtle)] border border-[var(--border-strong)] space-y-2 animate-fadeIn"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          required
                          value={newDailyTitle}
                          onChange={(e) => setNewDailyTitle(e.target.value)}
                          placeholder="Type a daily task and press Enter..."
                          className="flex-1 bg-[var(--card-bg)] border border-[var(--border-strong)] px-2.5 py-1.5 font-sans text-xs sm:text-sm text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)]"
                          autoFocus
                        />
                        <button
                          type="submit"
                          className="btn-editorial py-1.5 px-3 text-[11px] font-mono flex items-center gap-1 cursor-pointer font-bold uppercase shadow-xs shrink-0"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add</span>
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Daily Tasks List */}
                  {dailyReminderTasks.length === 0 ? (
                    <div className="py-6 px-3 border border-dashed border-[var(--border)] bg-[var(--surface-subtle)]/50 flex flex-col items-center justify-center text-center space-y-2 my-1">
                      <div className="flex items-center gap-1.5 text-xs text-[var(--muted)] font-mono">
                        <ListTodo className="w-3.5 h-3.5 text-[var(--muted)]" />
                        <span>No daily tasks scheduled</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsEditingDailyTasks(true)}
                        className="btn-editorial py-1 px-2.5 text-[11px] font-mono flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Daily Task</span>
                      </button>
                    </div>
                  ) : (
                    <div className="max-h-48 overflow-y-auto pr-1 space-y-1.5">
                      {dailyReminderTasks.map((task) => (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={(e) => handleDailyDragStart(e, task.id)}
                          onDragOver={(e) => handleDailyDragOver(e, task.id)}
                          onDragEnd={handleDailyDragEnd}
                          onDrop={(e) => handleDailyDrop(e, task.id)}
                          className={`p-2 sm:p-2.5 border transition-all flex items-center justify-between gap-2 group cursor-grab active:cursor-grabbing select-none ${
                            draggedDailyTaskId === task.id
                              ? 'opacity-40 border-dashed border-[var(--accent)] bg-[var(--surface-subtle)]'
                              : 'bg-[var(--card-bg)] border-[var(--border)] hover:border-[var(--border-strong)]'
                          } ${
                            dragOverDailyTaskId === task.id
                              ? 'border-t-2 border-t-[var(--accent)] bg-[var(--surface-subtle)]/70'
                              : ''
                          }`}
                          title="Drag up or down to reorder"
                        >
                          <div className="min-w-0 flex-1">
                            <span className="font-sans font-medium text-sm sm:text-base leading-snug truncate block text-[var(--ink)]">
                              {task.title}
                            </span>
                          </div>

                          {/* When pencil is clicked: delete option */}
                          {isEditingDailyTasks && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteDailyTask(task.id);
                              }}
                              className="text-[var(--muted)] hover:text-[#f87171] cursor-pointer p-1 transition-colors shrink-0"
                              title="Delete daily task"
                              aria-label={`Delete ${task.title}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between font-mono text-[10px] text-[var(--muted)]">
                    <span>{dailyReminderTasks.length} daily {dailyReminderTasks.length === 1 ? 'task' : 'tasks'}</span>
                    <span className="italic">Everyday workspace</span>
                  </div>
                </div>
              ) : (
                /* View 2: Daily Schedule (Original) */
                <>

              {/* When no blocks are scheduled, show clean professional centered block with Add Slot and Use Template buttons */}
              {todaySlots.length === 0 ? (
                <div className="py-6 px-3 border border-dashed border-[var(--border)] bg-[var(--surface-subtle)]/50 flex flex-col items-center justify-center text-center space-y-2.5 my-1">
                  <div className="flex items-center gap-1.5 text-xs text-[var(--muted)] font-mono">
                    <Clock className="w-3.5 h-3.5 text-[var(--muted)]" />
                    <span>No blocks scheduled for today</span>
                  </div>
                  <div className="flex items-center justify-center gap-2 pt-0.5">
                    <button
                      type="button"
                      onClick={() => setIsAddSlotOpen(true)}
                      className="btn-editorial py-1.5 px-3 text-[11px] font-mono flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Slot</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsTemplateModalOpen(true)}
                      className="btn-editorial-outline py-1.5 px-3 text-[11px] font-mono flex items-center gap-1.5 cursor-pointer bg-[var(--card-bg)]"
                    >
                      <Bookmark className="w-3 h-3 text-[var(--accent)]" />
                      <span>Use Template</span>
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Ongoing / Active Slot Banner */}
                  {currentSlot && activeSlotProgress ? (
                    <div className="p-3 bg-[var(--surface-subtle)] border border-[var(--border-strong)] space-y-1.5">
                      <div className="flex items-center justify-between font-mono text-[10px]">
                        <span className="font-bold text-[var(--color-timer)]">ONGOING BLOCK</span>
                        <span className="text-[var(--ink)] font-bold">{currentSlot.startTime} &ndash; {currentSlot.endTime}</span>
                      </div>
                      <div className="font-sans font-semibold text-sm text-[var(--ink)] truncate">
                        {currentSlot.title}
                      </div>
                      {currentSlot.targetTopics && (
                        <div className="font-sans text-[11px] text-[var(--muted)] truncate">
                          Focus: {currentSlot.targetTopics}
                        </div>
                      )}
                      <div className="w-full bg-[var(--border-strong)] h-1 overflow-hidden mt-1">
                        <div
                          className="h-full bg-[var(--color-timer)] transition-all"
                          style={{ width: `${activeSlotProgress.progressPercent}%` }}
                        />
                      </div>
                      <div className="flex justify-between font-mono text-[9px] text-[var(--muted)]">
                        <span>{activeSlotProgress.formattedElapsed} elapsed</span>
                        <span>{activeSlotProgress.formattedRemaining} left</span>
                      </div>
                    </div>
                  ) : (
                    <div className="py-2 text-center font-mono text-xs text-[var(--muted)] italic">
                      No active study block right now.
                    </div>
                  )}

                  {/* Scroller for today's blocks */}
                  <div className="max-h-40 overflow-y-auto pr-1 space-y-1.5 divide-y divide-[var(--border)]">
                    {todaySlots.map((slot, idx) => {
                      const prog = calculateSlotLiveProgress(slot.startTime, slot.endTime, nowMs, todayStr, slot.createdWhenPast, userTimezone);
                      const isPast = prog.status === 'past' || prog.status === 'completed' || !!slot.createdWhenPast;
                      const isDone = slot.markedComplete === true || (isPast && slot.unmarkedByUser !== true);
                      const isCurrent = prog.status === 'active' && !isDone;

                      return (
                        <div key={slot.id || idx} className="pt-2 flex items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            {isDone ? (
                              <button
                                type="button"
                                onClick={() => toggleMarkSlotComplete(slot.id)}
                                className="w-3.5 h-3.5 border border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-text)] flex items-center justify-center shrink-0 cursor-pointer transition-colors"
                                title="Mark as incomplete"
                              >
                                <Check className="w-2.5 h-2.5 stroke-[3]" />
                              </button>
                            ) : isCurrent ? (
                              <button
                                type="button"
                                onClick={() => toggleMarkSlotComplete(slot.id)}
                                className="relative flex h-3.5 w-3.5 shrink-0 items-center justify-center cursor-pointer group"
                                title="Currently active slot - click to mark complete"
                              >
                                <span className="animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 group-hover:hidden"></span>
                                <span className="hidden group-hover:inline-flex w-3.5 h-3.5 border border-[var(--accent)] items-center justify-center bg-[var(--card-bg)] text-[var(--accent)]">
                                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                                </span>
                              </button>
                            ) : isPast ? (
                              <button
                                type="button"
                                onClick={() => toggleMarkSlotComplete(slot.id)}
                                className="w-3.5 h-3.5 border border-[var(--border-strong)] hover:border-[var(--accent)] flex items-center justify-center shrink-0 cursor-pointer transition-colors"
                                title="Mark as completed"
                              />
                            ) : (
                              <span
                                className="w-1.5 h-1.5 rounded-full bg-[var(--muted)]/40 shrink-0 ml-1 mr-1"
                                title="Upcoming scheduled slot"
                              />
                            )}
                            <div className="flex flex-col min-w-0 flex-1">
                              <span className={`font-sans truncate ${isDone ? 'line-through text-[var(--muted)]' : isCurrent ? 'font-bold text-[var(--accent)]' : 'text-[var(--ink)]'}`}>
                                {slot.title}
                              </span>
                              {slot.targetTopics && (
                                <span className="font-sans text-[10px] text-[var(--muted)] truncate leading-tight">
                                  {slot.targetTopics}
                                </span>
                              )}
                            </div>
                          </div>
                          <span className={`font-mono text-[10px] shrink-0 ${isDone ? 'text-[var(--muted)] line-through' : 'text-[var(--muted)]'}`}>
                            {slot.startTime}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </>
          )}
        </div>
          </div>
        </div>
      </section>

      {/* ─── Main Grid: Timer & Tasks Side-by-Side ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start w-full" ref={mainTimerRef}>
        {/* Left Column: Focus Session Timer (Manual Timer) */}
        <section className="lg:col-span-5 space-y-4">
          <div className="editorial-heading">
            <span>Focus Session</span>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-[var(--muted)]">
                {isTimerRunning ? '● RUNNING' : 'IDLE'}
              </span>
              <button
                onClick={() => onNavigateTab('focus')}
                className="text-[var(--muted)] hover:text-[var(--accent)] transition-colors cursor-pointer p-0.5"
                title="Open Dedicated Fullscreen Focus Timer"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="editorial-card p-6 sm:p-10 text-center relative shadow-2xs">
            <div className="editorial-label">
              Session Status: {isTimerRunning ? 'Active' : 'Standby'}
            </div>

            <div className="w-full max-w-full overflow-hidden flex items-center justify-center my-4 sm:my-6">
              <div className="editorial-timer-display select-none tabular-nums text-[var(--color-timer)]">
                {formatTimer(timeLeft)}
              </div>
            </div>

            <div className="editorial-label mb-6">
              Target: {formatDurationLabel(timerMinutes)}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={toggleTimer}
                className="btn-editorial w-full sm:w-auto"
              >
                {isTimerRunning ? (
                  <>
                    <Pause className="w-3.5 h-3.5" />
                    <span>Pause Session</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Start Session</span>
                  </>
                )}
              </button>

              <button
                onClick={resetTimer}
                className="btn-editorial-outline w-full sm:w-auto px-4"
                title="Reset session timer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>

            {/* Quick Duration Presets */}
            <div className="mt-8 pt-6 border-t border-[var(--border)] flex flex-wrap items-center justify-center gap-3 font-mono text-xs text-[var(--muted)]">
              {[15, 25, 45, 60, 90].map((mins) => (
                <button
                  key={mins}
                  onClick={() => handleSetCustomTimer(mins)}
                  className={`hover:text-[var(--ink)] transition-colors cursor-pointer px-2 py-1 ${
                    timerMinutes === mins ? 'text-[var(--color-timer)] font-bold border-b border-[var(--color-timer)]' : ''
                  }`}
                >
                  {mins >= 60 ? `${mins / 60}H` : `${mins}M`}
                </button>
              ))}
              <button
                onClick={() => setShowCustomDuration(!showCustomDuration)}
                className="hover:text-[var(--ink)] transition-colors cursor-pointer text-[10px] uppercase tracking-wider text-[var(--color-timer)] ml-1"
              >
                {showCustomDuration ? '[-] Close' : '[+] Custom'}
              </button>
            </div>

            {showCustomDuration && (
              <div className="mt-4 pt-4 border-t border-[var(--border)] flex items-center justify-center gap-2 font-mono text-xs animate-fadeIn">
                <input
                  type="number"
                  min="0"
                  max="12"
                  value={customHoursInput}
                  onChange={(e) => setCustomHoursInput(e.target.value)}
                  className="w-12 text-center bg-[var(--surface-subtle)] border border-[var(--border-strong)] py-1 text-[var(--ink)] outline-none"
                  placeholder="0"
                />
                <span className="text-[var(--muted)]">h</span>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={customMinutesInput}
                  onChange={(e) => setCustomMinutesInput(e.target.value)}
                  className="w-12 text-center bg-[var(--surface-subtle)] border border-[var(--border-strong)] py-1 text-[var(--ink)] outline-none"
                  placeholder="25"
                />
                <span className="text-[var(--muted)]">m</span>
                <button
                  onClick={() => {
                    handleSetCustomTimerWithHours(
                      parseInt(customHoursInput, 10) || 0,
                      parseInt(customMinutesInput, 10) || 0
                    );
                    setShowCustomDuration(false);
                  }}
                  className="px-3 py-1 bg-[var(--accent)] text-[var(--accent-text)] font-bold text-[10px] uppercase tracking-wider hover:opacity-90"
                >
                  Apply
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Right Column: Tasks & Objectives */}
        <section className="lg:col-span-7 space-y-4">
          <div className="editorial-heading flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ListTodo className="w-4 h-4 text-[var(--accent)]" />
              <span>
                {overviewTaskScope === 'all'
                  ? 'All Tasks & Objectives'
                  : `${formatDisplayDate(activeDate)} Tasks & Objectives`}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase">
              {/* Small Left & Right Arrows for Date Navigation */}
              <div className="inline-flex items-center bg-[var(--surface-subtle)] border border-[var(--border)] p-0.5 shadow-2xs">
                <button
                  type="button"
                  onClick={handlePrevDay}
                  className="p-1 hover:bg-[var(--card-bg)] text-[var(--ink)] cursor-pointer transition-colors"
                  title="Previous Day"
                  aria-label="Previous Day"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                <span className="px-2 py-0.5 font-mono text-[10px] font-bold text-[var(--ink)] border-x border-[var(--border)] select-none">
                  {formatDisplayDate(activeDate)}
                </span>

                <button
                  type="button"
                  onClick={handleNextDay}
                  className="p-1 hover:bg-[var(--card-bg)] text-[var(--ink)] cursor-pointer transition-colors"
                  title="Next Day"
                  aria-label="Next Day"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Scope Toggle: Today / Tomorrow / All */}
              <button
                type="button"
                onClick={() => handleSelectDate(todayStr, 'today')}
                className={`px-2 py-1 border cursor-pointer transition ${
                  overviewTaskScope === 'today' && activeDate === todayStr
                    ? 'bg-[var(--accent)] text-[var(--accent-text)] border-[var(--accent)] font-bold'
                    : 'bg-[var(--surface-subtle)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--ink)]'
                }`}
              >
                Today
              </button>

              <button
                type="button"
                onClick={() => handleSelectDate(tomorrowStr, 'tomorrow')}
                className={`px-2 py-1 border cursor-pointer transition ${
                  overviewTaskScope === 'tomorrow' && activeDate === tomorrowStr
                    ? 'bg-[var(--accent)] text-[var(--accent-text)] border-[var(--accent)] font-bold'
                    : 'bg-[var(--surface-subtle)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--ink)]'
                }`}
              >
                Tomorrow
              </button>

              <button
                type="button"
                onClick={() => setOverviewTaskScope('all')}
                className={`px-2 py-1 border cursor-pointer transition ${
                  overviewTaskScope === 'all'
                    ? 'bg-[var(--accent)] text-[var(--accent-text)] border-[var(--accent)] font-bold'
                    : 'bg-[var(--surface-subtle)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--ink)]'
                }`}
              >
                All
              </button>

              {/* Custom Date Input for past/future toggle */}
              <input
                type="date"
                value={activeDate}
                onChange={(e) => {
                  if (e.target.value) handleSelectDate(e.target.value, 'custom');
                }}
                className="bg-[var(--surface-subtle)] border border-[var(--border)] px-1.5 py-0.5 text-[var(--ink)] text-[10px] font-mono outline-none cursor-pointer"
                title="Choose custom date"
              />

              {/* Filter Chips: all / pending / completed */}
              <div className="flex items-center gap-1 border-l border-[var(--border)] pl-2 ml-1">
                {(['all', 'pending', 'completed'] as const).map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setTaskFilter(filter)}
                    className={`px-1.5 py-0.5 border cursor-pointer transition ${
                      taskFilter === filter
                        ? 'bg-[var(--ink)] text-[var(--card-bg)] border-[var(--ink)] font-bold'
                        : 'bg-[var(--surface-subtle)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--ink)]'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="editorial-card p-6 sm:p-8 space-y-6 shadow-2xs">
            {/* Quick Task Creation Bar */}
            <form onSubmit={handleAddTask} className="space-y-3 bg-[var(--surface-subtle)] p-4 border border-[var(--border)]">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Type a new objective and press Enter..."
                  className="flex-1 bg-[var(--card-bg)] border border-[var(--border-strong)] px-3 py-2 text-sm sm:text-base text-[var(--ink)] placeholder:text-[var(--muted)] outline-none font-sans"
                />

                <button
                  type="submit"
                  disabled={!newTitle.trim()}
                  className="btn-editorial py-2 px-5 text-xs disabled:opacity-40 flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Task</span>
                </button>
              </div>

              {/* Expanded Options - Hidden on mobile per user request */}
              <div className="hidden sm:flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[var(--border)] font-mono text-xs text-[var(--muted)]">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span>Category:</span>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value as CompletionCategory)}
                      className="bg-[var(--card-bg)] border border-[var(--border-strong)] p-1 text-[11px] text-[var(--ink)] outline-none"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span>Duration:</span>
                    <select
                      value={newMinutes}
                      onChange={(e) => setNewMinutes(Number(e.target.value))}
                      className="bg-[var(--card-bg)] border border-[var(--border-strong)] p-1 text-[11px] text-[var(--ink)] outline-none tabular-nums"
                    >
                      <option value={15}>15m</option>
                      <option value={30}>30m</option>
                      <option value={45}>45m</option>
                      <option value={60}>60m</option>
                      <option value={90}>90m</option>
                      <option value={120}>2h</option>
                    </select>
                  </div>
                </div>

                <div className="text-[10px] tabular-nums font-mono">
                  Date: {formatDisplayDate(activeDate)}
                </div>
              </div>
            </form>

            {/* Refined Task List with In-Place Edit and Ordering */}
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {filteredTasks.length === 0 ? (
                <div className="font-serif italic text-lg text-[var(--muted)] text-center py-10">
                  No tasks found under &apos;{taskFilter}&apos;. Add a task above to begin.
                </div>
              ) : (
                filteredTasks.map((task, index) => {
                  const isEditing = editingTaskId === task.id;

                  return (
                    <div
                      key={task.id}
                      className={`p-2 sm:p-3 border transition-all flex items-center justify-between gap-1.5 sm:gap-3 ${
                        task.completed
                          ? 'bg-[var(--surface-subtle)]/60 border-[var(--border)] opacity-75'
                          : 'bg-[var(--card-bg)] border-[var(--border)] hover:border-[var(--border-strong)]'
                      }`}
                    >
                      {/* Left: Checkbox & Info */}
                      <div className="flex items-center gap-1.5 sm:gap-3 flex-1 min-w-0">
                        {/* Reorder Buttons */}
                        <div className="flex items-center gap-0.5 shrink-0 text-[var(--muted)]">
                          <button
                            type="button"
                            onClick={() => handleMoveTask(index, 'up')}
                            disabled={index === 0}
                            className="hover:text-[var(--ink)] disabled:opacity-20 cursor-pointer p-0.5"
                            title="Move priority up"
                          >
                            <ChevronUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveTask(index, 'down')}
                            disabled={index === filteredTasks.length - 1}
                            className="hover:text-[var(--ink)] disabled:opacity-20 cursor-pointer p-0.5"
                            title="Move priority down"
                          >
                            <ChevronDown className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Number Index */}
                        <span className="font-mono text-[11px] sm:text-xs text-[var(--muted)] shrink-0 select-none tabular-nums">
                          {String(index + 1).padStart(2, '0')}
                        </span>

                        {/* Checkbox */}
                        <button
                          type="button"
                          onClick={() => toggleCompletionTask(task.id)}
                          className={`w-4 h-4 border flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                            task.completed
                              ? 'bg-[var(--accent)] border-[var(--accent)] text-[var(--accent-text)]'
                              : 'border-[var(--border-strong)] hover:border-[var(--accent)]'
                          }`}
                          title="Mark complete"
                        >
                          {task.completed && <Check className="w-3 h-3 stroke-[3]" />}
                        </button>

                        {/* Title or Inline Edit Form */}
                        {isEditing ? (
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <input
                              type="text"
                              value={editingTitle}
                              onChange={(e) => setEditingTitle(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveEditing(task.id);
                                if (e.key === 'Escape') setEditingTaskId(null);
                              }}
                              className="flex-1 bg-[var(--surface-subtle)] border border-[var(--accent)] px-2 py-1 text-xs sm:text-sm text-[var(--ink)] outline-none font-sans min-w-0"
                              autoFocus
                            />
                            <select
                              value={editingMinutes}
                              onChange={(e) => setEditingMinutes(Number(e.target.value))}
                              className="bg-[var(--surface-subtle)] border border-[var(--border-strong)] p-1 text-[10px] text-[var(--ink)] outline-none font-mono tabular-nums"
                            >
                              <option value={15}>15m</option>
                              <option value={30}>30m</option>
                              <option value={45}>45m</option>
                              <option value={60}>60m</option>
                              <option value={90}>90m</option>
                              <option value={120}>2h</option>
                            </select>
                            <button
                              type="button"
                              onClick={() => saveEditing(task.id)}
                              className="px-2 py-0.5 bg-[var(--accent)] text-[var(--accent-text)] font-mono text-[10px] uppercase font-bold"
                            >
                              Save
                            </button>
                          </div>
                        ) : (
                          <div className="min-w-0 flex-1">
                            <span
                              onClick={() => startEditing(task)}
                              className={`font-sans font-medium text-sm sm:text-lg leading-snug block truncate cursor-pointer hover:text-[var(--accent)] transition-colors py-0.5 ${
                                task.completed
                                  ? 'line-through text-[var(--muted)]'
                                  : 'text-[var(--ink)]'
                              }`}
                              title={task.title}
                            >
                              {task.title}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Right: Action Buttons (Category, duration, and time hidden per user request) */}
                      {!isEditing && (
                        <div className="flex items-center gap-2 shrink-0 font-mono text-[10px] tabular-nums">
                          {/* Edit Button */}
                          <button
                            type="button"
                            onClick={() => startEditing(task)}
                            className="p-1 text-[var(--muted)] hover:text-[var(--ink)] transition cursor-pointer"
                            title="Edit task"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => deleteCompletionTask(task.id)}
                            className="p-1 text-[var(--muted)] hover:text-[#f87171] transition cursor-pointer"
                            title="Delete task"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between font-mono text-[10px] text-[var(--muted)] uppercase tracking-wider">
              <span>
                Showing {filteredTasks.length} tasks &bull; {completedTasksCount} Completed
              </span>
              <button
                onClick={() => onNavigateTab('completion')}
                className="hover:text-[var(--ink)] transition-colors cursor-pointer text-[var(--accent)] font-bold"
              >
                Open Full Task Board &rarr;
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* ─── Interactive Study Calendar & Daily Log ─── */}
      <section className="space-y-4">
        <StudyCalendar />
      </section>

      {/* Target Goal Modal */}
      <EditGoalModal isOpen={isGoalModalOpen} onClose={() => setIsGoalModalOpen(false)} />

      {/* Add Slot Modal from Overview */}
      <SlotEditorModal
        isOpen={isAddSlotOpen}
        onClose={() => setIsAddSlotOpen(false)}
        onSave={(slotData) => {
          addScheduledSlot({ ...slotData, date: todayStr });
          setIsAddSlotOpen(false);
        }}
        defaultDate={todayStr}
      />

      {/* Routine Templates Modal from Overview */}
      <SlotTemplateModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        initialMode="load"
        targetDate={activeDate || todayStr}
        activeSlots={todaySlots}
      />
    </div>
  );
};
