import React, { useState, useEffect } from 'react';
import {
  Check,
  Plus,
  Trash2,
  GripVertical,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Zap,
  Edit2,
  X,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { useTimer, getLocalDateStr } from '../context/TimerContext';
import { StudyTask, CompletionCategory } from '../types';

interface CompletionColumnProps {
  onScheduleTaskIntoSlot?: (task: StudyTask) => void;
}

const DURATION_OPTIONS = [
  { label: '30 mins', value: 30 },
  { label: '45 mins', value: 45 },
  { label: '1.0 hr (60m)', value: 60 },
  { label: '1.5 hrs (90m)', value: 90 },
  { label: '2.0 hrs (120m)', value: 120 },
  { label: '2.5 hrs (150m)', value: 150 },
  { label: '3.0 hrs (180m)', value: 180 },
  { label: '4.0 hrs (240m)', value: 240 },
  { label: '5.0 hrs (300m)', value: 300 },
];

export const CompletionColumn: React.FC<CompletionColumnProps> = ({
  onScheduleTaskIntoSlot,
}) => {
  const {
    completionTasks,
    addCompletionTask,
    updateCompletionTask,
    deleteCompletionTask,
    toggleCompletionTask,
    reorderCompletionTasks,
    selectedCalendarDate,
    setSelectedCalendarDate,
    todayStr,
    tomorrowStr,
    stepDate,
    formatDisplayDate,
  } = useTimer();

  const [activeDate, setActiveDate] = useState<string>(() => selectedCalendarDate || todayStr);
  const [dateScope, setDateScope] = useState<'day' | 'all'>('day');
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<CompletionCategory>('Deep Work');
  const [newPriority, setNewPriority] = useState<'High' | 'Medium' | 'Low'>('High');
  const [newMinutes, setNewMinutes] = useState<number>(60);
  const [newTaskDate, setNewTaskDate] = useState<string>(selectedCalendarDate || todayStr);
  const [filterTab, setFilterTab] = useState<'all' | 'pending' | 'completed'>('all');
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null);

  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState<CompletionCategory>('Deep Work');
  const [editPriority, setEditPriority] = useState<'High' | 'Medium' | 'Low'>('High');
  const [editMinutes, setEditMinutes] = useState<number>(60);
  const [editDate, setEditDate] = useState<string>(todayStr);

  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  // Synchronize when selectedCalendarDate updates externally or on midnight day change
  useEffect(() => {
    if (selectedCalendarDate) {
      setActiveDate(selectedCalendarDate);
      setNewTaskDate(selectedCalendarDate);
    }
  }, [selectedCalendarDate]);

  const sortedTasks = [...completionTasks].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const handleSelectDate = (dateStr: string) => {
    setActiveDate(dateStr);
    setDateScope('day');
    setSelectedCalendarDate(dateStr);
    setNewTaskDate(dateStr);
  };

  const handlePrevDay = () => {
    const prev = stepDate(activeDate, -1);
    handleSelectDate(prev);
  };

  const handleNextDay = () => {
    const next = stepDate(activeDate, 1);
    handleSelectDate(next);
  };

  const todayCount = sortedTasks.filter((t) => t.date === todayStr).length;
  const tomorrowCount = sortedTasks.filter((t) => t.date === tomorrowStr).length;
  const totalCount = sortedTasks.length;

  const scopeFilteredTasks = sortedTasks.filter((t) => {
    if (dateScope === 'all') return true;
    return t.date === activeDate;
  });

  const pendingTasks = scopeFilteredTasks.filter((t) => !t.completed);
  const completedTasks = scopeFilteredTasks.filter((t) => t.completed);

  const finalTasks = scopeFilteredTasks.filter((t) => {
    if (filterTab === 'pending') return !t.completed;
    if (filterTab === 'completed') return t.completed;
    return true;
  });

  const totalPendingMinutes = pendingTasks.reduce(
    (acc, t) => acc + (t.estimatedMinutes || 60),
    0
  );
  const totalPendingHours = (totalPendingMinutes / 60).toFixed(1);

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    addCompletionTask({
      title: newTitle.trim(),
      category: newCategory,
      priority: newPriority,
      estimatedMinutes: newMinutes,
      completed: false,
      date: newTaskDate || activeDate,
    });

    setNewTitle('');
    setIsAddingTask(false);
  };

  const moveTask = (sourceTaskId: string, targetTaskId: string) => {
    if (sourceTaskId === targetTaskId) return;

    const sourceIdx = sortedTasks.findIndex((t) => t.id === sourceTaskId);
    const targetIdx = sortedTasks.findIndex((t) => t.id === targetTaskId);
    if (sourceIdx === -1 || targetIdx === -1) return;

    const reordered = [...sortedTasks];
    const [movedItem] = reordered.splice(sourceIdx, 1);
    reordered.splice(targetIdx, 0, movedItem);

    const withOrder = reordered.map((t, idx) => ({ ...t, order: idx }));
    reorderCompletionTasks(withOrder);
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDragOver = (e: React.DragEvent, taskId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverTaskId !== taskId) {
      setDragOverTaskId(taskId);
    }
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverTaskId(null);
  };

  const handleDrop = (e: React.DragEvent, targetTaskId: string) => {
    e.preventDefault();
    const sourceTaskId = draggedTaskId || e.dataTransfer.getData('text/plain');
    if (sourceTaskId && sourceTaskId !== targetTaskId) {
      moveTask(sourceTaskId, targetTaskId);
    }
    setDraggedTaskId(null);
    setDragOverTaskId(null);
  };

  const handleMoveUp = (visibleIndex: number) => {
    if (visibleIndex <= 0) return;
    const currentTask = finalTasks[visibleIndex];
    const prevTask = finalTasks[visibleIndex - 1];
    moveTask(currentTask.id, prevTask.id);
  };

  const handleMoveDown = (visibleIndex: number) => {
    if (visibleIndex >= finalTasks.length - 1) return;
    const currentTask = finalTasks[visibleIndex];
    const nextTask = finalTasks[visibleIndex + 1];
    moveTask(currentTask.id, nextTask.id);
  };

  const handleStartEdit = (task: StudyTask) => {
    setEditingTaskId(task.id);
    setEditTitle(task.title);
    setEditCategory(task.category || 'General');
    setEditPriority(task.priority);
    setEditMinutes(task.estimatedMinutes || 60);
    setEditDate(task.date || todayStr);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTaskId || !editTitle.trim()) return;

    updateCompletionTask(editingTaskId, {
      title: editTitle.trim(),
      category: editCategory,
      priority: editPriority,
      estimatedMinutes: editMinutes,
      date: editDate,
    });

    setEditingTaskId(null);
  };

  return (
    <div className="editorial-card p-3 sm:p-8 space-y-4 sm:space-y-6 shadow-2xs">
      {/* Top Header */}
      <div className="editorial-heading pb-3 flex items-center justify-between border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <span>Completion Queue</span>
          <span className="text-[10px] text-[var(--muted)] font-normal tabular-nums">
            // {pendingTasks.length} PENDING ({totalPendingHours}H)
          </span>
        </div>

        <button
          onClick={() => {
            setNewTaskDate(activeDate);
            setIsAddingTask((prev) => !prev);
          }}
          className="font-mono text-xs uppercase tracking-widest text-[var(--ink)] hover:text-[var(--accent)] transition-colors cursor-pointer font-bold px-1.5 py-0.5"
        >
          {isAddingTask ? '[ CLOSE ]' : '[ + ADD ITEM ]'}
        </button>
      </div>

      {/* Date Scope Filter Bar with smooth horizontal scrolling for small screens */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 border-b border-[var(--border)] pb-3 font-sans text-xs tabular-nums">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none max-w-full py-0.5">
          {/* Small Left & Right Arrows for Date Toggle */}
          <div className="inline-flex items-center bg-[var(--surface-subtle)] border border-[var(--border)] p-0.5 shadow-2xs shrink-0">
            <button
              type="button"
              onClick={handlePrevDay}
              className="p-1 sm:p-1.5 hover:bg-[var(--card-bg)] text-[var(--ink)] cursor-pointer transition-colors"
              title="Previous Day"
              aria-label="Previous Day"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <span className="px-2 py-0.5 font-mono text-[11px] font-bold text-[var(--ink)] border-x border-[var(--border)] select-none">
              {formatDisplayDate(activeDate)}
            </span>

            <button
              type="button"
              onClick={handleNextDay}
              className="p-1 sm:p-1.5 hover:bg-[var(--card-bg)] text-[var(--ink)] cursor-pointer transition-colors"
              title="Next Day"
              aria-label="Next Day"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => handleSelectDate(todayStr)}
            className={`cursor-pointer transition-colors shrink-0 px-2 py-1 ${
              dateScope === 'day' && activeDate === todayStr
                ? 'text-[var(--accent)] font-bold border-b border-[var(--accent)]'
                : 'text-[var(--muted)] hover:text-[var(--ink)]'
            }`}
          >
            Today ({todayCount})
          </button>
          <span className="text-[var(--border-strong)] shrink-0">/</span>
          <button
            type="button"
            onClick={() => handleSelectDate(tomorrowStr)}
            className={`cursor-pointer transition-colors shrink-0 px-2 py-1 ${
              dateScope === 'day' && activeDate === tomorrowStr
                ? 'text-[var(--accent)] font-bold border-b border-[var(--accent)]'
                : 'text-[var(--muted)] hover:text-[var(--ink)]'
            }`}
          >
            Tomorrow ({tomorrowCount})
          </button>
          <span className="text-[var(--border-strong)] shrink-0">/</span>
          <button
            type="button"
            onClick={() => setDateScope('all')}
            className={`cursor-pointer transition-colors shrink-0 px-2 py-1 ${
              dateScope === 'all'
                ? 'text-[var(--accent)] font-bold border-b border-[var(--accent)]'
                : 'text-[var(--muted)] hover:text-[var(--ink)]'
            }`}
          >
            All ({totalCount})
          </button>
          <span className="text-[var(--border-strong)] shrink-0">/</span>
          <input
            type="date"
            value={activeDate}
            onChange={(e) => {
              if (e.target.value) handleSelectDate(e.target.value);
            }}
            className="bg-[var(--surface-subtle)] border border-[var(--border)] px-2 py-1 text-[var(--ink)] text-xs outline-none cursor-pointer shrink-0 font-mono"
            title="Filter tasks by custom date"
          />
        </div>

        <div className="flex items-center gap-2.5 shrink-0 pt-1 sm:pt-0">
          <button
            onClick={() => setFilterTab('all')}
            className={`cursor-pointer transition-colors px-1 py-0.5 ${
              filterTab === 'all' ? 'text-[var(--ink)] font-bold' : 'text-[var(--muted)]'
            }`}
          >
            All
          </button>
          <span className="text-[var(--border-strong)]">/</span>
          <button
            onClick={() => setFilterTab('pending')}
            className={`cursor-pointer transition-colors px-1 py-0.5 ${
              filterTab === 'pending' ? 'text-[var(--accent)] font-bold' : 'text-[var(--muted)]'
            }`}
          >
            Pending ({pendingTasks.length})
          </button>
          <span className="text-[var(--border-strong)]">/</span>
          <button
            onClick={() => setFilterTab('completed')}
            className={`cursor-pointer transition-colors px-1 py-0.5 ${
              filterTab === 'completed' ? 'text-[var(--ink)] font-bold' : 'text-[var(--muted)]'
            }`}
          >
            Done ({completedTasks.length})
          </button>
        </div>
      </div>

      {/* Add Task Form */}
      {isAddingTask && (
        <form
          onSubmit={handleCreateTask}
          className="p-4 sm:p-5 bg-[var(--surface-subtle)] border border-[var(--border-strong)] space-y-4 animate-fadeIn"
        >
          <div className="editorial-label">Add Entry to Schedule</div>

          <input
            type="text"
            required
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="e.g. Chapter 4 Organic Chemistry Reactions & Mechanisms"
            className="w-full bg-[var(--card-bg)] border border-[var(--border-strong)] p-3 text-base sm:text-sm text-[var(--ink)] placeholder:text-[var(--muted)] outline-none font-sans"
            autoFocus
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
            <div>
              <label className="editorial-label block mb-1">Category</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as CompletionCategory)}
                className="w-full bg-[var(--card-bg)] border border-[var(--border-strong)] p-2.5 sm:p-2 text-[var(--ink)] outline-none"
              >
                <option value="Deep Work">Deep Work</option>
                <option value="Research">Research</option>
                <option value="Project">Project</option>
                <option value="Writing">Writing</option>
                <option value="Review">Review</option>
                <option value="Practice">Practice</option>
                <option value="Strategy">Strategy</option>
                <option value="Reading">Reading</option>
                <option value="General">General</option>
              </select>
            </div>

            <div>
              <label className="editorial-label block mb-1">Duration</label>
              <select
                value={newMinutes}
                onChange={(e) => setNewMinutes(Number(e.target.value))}
                className="w-full bg-[var(--card-bg)] border border-[var(--border-strong)] p-2.5 sm:p-2 text-[var(--ink)] outline-none"
              >
                {DURATION_OPTIONS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="editorial-label block mb-1">Scheduled Date</label>
              <input
                type="date"
                value={newTaskDate}
                onChange={(e) => setNewTaskDate(e.target.value)}
                className="w-full bg-[var(--card-bg)] border border-[var(--border-strong)] p-2.5 sm:p-2 text-[var(--ink)] outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAddingTask(false)}
              className="px-4 py-2 font-mono text-xs text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[var(--accent)] text-[var(--accent-text)] font-bold font-mono text-xs uppercase tracking-wider hover:opacity-90 cursor-pointer"
            >
              Save Objective
            </button>
          </div>
        </form>
      )}

      {/* Task Rows List */}
      <div className="divide-y divide-[var(--border)] min-h-[240px] max-h-[580px] overflow-y-auto pr-1">
        {finalTasks.length === 0 ? (
          <div className="font-sans text-sm text-[var(--muted)] text-center py-14">
            No objectives listed for this interval.
          </div>
        ) : (
          finalTasks.map((task, visibleIndex) => {
            const isEditing = editingTaskId === task.id;
            const isDragging = draggedTaskId === task.id;
            const isDragOver = dragOverTaskId === task.id && draggedTaskId !== task.id;

            if (isEditing) {
              return (
                <form
                  key={task.id}
                  onSubmit={handleSaveEdit}
                  className="p-4 bg-[var(--surface-subtle)] border border-[var(--border-strong)] space-y-3"
                >
                  <input
                    type="text"
                    required
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full bg-[var(--card-bg)] border border-[var(--border-strong)] p-2.5 font-sans text-base sm:text-sm text-[var(--ink)]"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-xs">
                    <select
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value as any)}
                      className="bg-[var(--card-bg)] border border-[var(--border-strong)] p-2 text-[var(--ink)]"
                    >
                      <option value="Deep Work">Deep Work</option>
                      <option value="Research">Research</option>
                      <option value="Project">Project</option>
                      <option value="Writing">Writing</option>
                      <option value="Review">Review</option>
                      <option value="Practice">Practice</option>
                      <option value="Strategy">Strategy</option>
                      <option value="Reading">Reading</option>
                      <option value="General">General</option>
                    </select>

                    <select
                      value={editMinutes}
                      onChange={(e) => setEditMinutes(Number(e.target.value))}
                      className="bg-[var(--card-bg)] border border-[var(--border-strong)] p-2 text-[var(--ink)]"
                    >
                      {DURATION_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>

                    <input
                      type="date"
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      className="bg-[var(--card-bg)] border border-[var(--border-strong)] p-2 text-[var(--ink)]"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingTaskId(null)}
                      className="px-3 py-1.5 font-mono text-xs text-[var(--muted)]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-[var(--accent)] text-[var(--accent-text)] font-bold font-mono text-xs uppercase"
                    >
                      Update
                    </button>
                  </div>
                </form>
              );
            }

            return (
              <div
                key={task.id}
                draggable={!task.completed}
                onDragStart={(e) => handleDragStart(e, task.id)}
                onDragOver={(e) => handleDragOver(e, task.id)}
                onDragEnd={handleDragEnd}
                onDrop={(e) => handleDrop(e, task.id)}
                className={`p-2 sm:p-2.5 border transition-all flex items-center gap-2 sm:gap-3 group select-none ${
                  isDragging
                    ? 'opacity-30 border-dashed border-[var(--accent)] bg-[var(--surface-subtle)]'
                    : task.completed
                    ? 'bg-[var(--surface-subtle)]/60 border-[var(--border)] opacity-75'
                    : 'bg-[var(--card-bg)] border-[var(--border)] hover:border-[var(--border-strong)]'
                } ${
                  isDragOver ? 'border-t-2 border-t-[var(--accent)] bg-[var(--surface-subtle)]/70' : ''
                }`}
              >
                {!task.completed && (
                  <div className="flex items-center gap-0.5 text-[var(--muted)] shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveUp(visibleIndex);
                      }}
                      disabled={visibleIndex === 0}
                      className="hover:text-[var(--ink)] disabled:opacity-20 cursor-pointer p-1"
                      title="Move up"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <div
                      className="cursor-grab active:cursor-grabbing p-1 hover:text-[var(--ink)] hidden sm:block"
                      title="Drag to reorder"
                    >
                      <GripVertical className="w-3.5 h-3.5 pointer-events-none" />
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveDown(visibleIndex);
                      }}
                      disabled={visibleIndex === finalTasks.length - 1}
                      className="hover:text-[var(--ink)] disabled:opacity-20 cursor-pointer p-1"
                      title="Move down"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <span className="font-mono text-[11px] sm:text-xs text-[var(--muted)] shrink-0 select-none tabular-nums">
                  {String(visibleIndex + 1).padStart(2, '0')}
                </span>

                <button
                  type="button"
                  onClick={() => toggleCompletionTask(task.id)}
                  className={`w-5 h-5 sm:w-4 sm:h-4 border flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
                    task.completed
                      ? 'bg-[var(--accent)] border-[var(--accent)] text-[var(--accent-text)]'
                      : 'border-[var(--border-strong)] hover:border-[var(--accent)]'
                  }`}
                  title={task.completed ? 'Mark incomplete' : 'Mark complete'}
                >
                  {task.completed && <Check className="w-3 h-3 stroke-[3]" />}
                </button>

                {/* Title & Container */}
                <div className="flex-1 min-w-0">
                  <h4
                    onClick={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)}
                    className={`font-sans font-medium text-sm sm:text-base leading-snug cursor-pointer hover:text-[var(--accent)] transition-colors select-text ${
                      task.completed ? 'line-through text-[var(--muted)]' : 'text-[var(--ink)]'
                    }`}
                    title="Click to toggle details"
                  >
                    {task.title}
                  </h4>

                  {/* Properties shown upon click in simple light faded text with NO boxes */}
                  {expandedTaskId === task.id && (
                    <div className="mt-1.5 pt-1 font-mono text-[11px] text-[var(--muted)] flex flex-wrap items-center gap-2 animate-fadeIn">
                      <span>Category: {task.category || 'General'}</span>
                      <span>&bull;</span>
                      <span>
                        Duration:{' '}
                        {(() => {
                          const mins = task.estimatedMinutes || 60;
                          if (mins >= 60) {
                            const hrs = mins / 60;
                            return Number.isInteger(hrs) ? `${hrs}.0 hr` : `${hrs.toFixed(1)} hrs`;
                          }
                          return `${mins} mins`;
                        })()}
                      </span>
                      {task.date && (
                        <>
                          <span>&bull;</span>
                          <span>Date: {task.date}</span>
                        </>
                      )}
                      {!task.completed && onScheduleTaskIntoSlot && (
                        <>
                          <span>&bull;</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onScheduleTaskIntoSlot(task);
                            }}
                            className="text-[var(--accent)] hover:underline cursor-pointer font-medium"
                          >
                            + Schedule into Timetable
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Right Action Icons */}
                <div className="flex items-center gap-1 sm:gap-2 shrink-0 font-mono text-xs">
                  <button
                    type="button"
                    onClick={() => handleStartEdit(task)}
                    className="text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer p-1.5"
                    title="Edit objective"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteCompletionTask(task.id)}
                    className="text-[var(--muted)] hover:text-[#f87171] cursor-pointer p-1.5"
                    title="Delete objective"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between font-mono text-[10px] text-[var(--muted)] uppercase tracking-wider">
        <span>Select any date to filter</span>
        <span>
          {completedTasks.length} / {scopeFilteredTasks.length} Completed
        </span>
      </div>
    </div>
  );
};
