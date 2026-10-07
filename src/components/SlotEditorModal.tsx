import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, Calendar as CalendarIcon, Target, Check } from 'lucide-react';
import { ScheduledStudySlot, StudyTask } from '../types';
import {
  getSlotTimestamps,
  getLocalDateStr,
  getTimezoneDateComponents,
  useTimer,
} from '../context/TimerContext';

interface SlotEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (slot: Omit<ScheduledStudySlot, 'id'>) => void;
  initialSlot?: ScheduledStudySlot | null;
  prefilledTask?: StudyTask | null;
  defaultDate?: string;
}

const getPresentTimeRange = (customMinutes?: number, timeZone?: string) => {
  const { hour: nowH, minute: nowM } = getTimezoneDateComponents(new Date(), timeZone);

  const startFormatted = `${nowH.toString().padStart(2, '0')}:${nowM.toString().padStart(2, '0')}`;
  const durationMin = customMinutes || 120;
  const totalEndMin = (nowH * 60 + nowM + durationMin) % (24 * 60);
  const endH = Math.floor(totalEndMin / 60);
  const endM = totalEndMin % 60;
  const endFormatted = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;

  return { startTime: startFormatted, endTime: endFormatted };
};

export const SlotEditorModal: React.FC<SlotEditorModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialSlot,
  prefilledTask,
  defaultDate,
}) => {
  const { completionTasks, userTimezone, todayStr, tomorrowStr } = useTimer();
  const [title, setTitle] = useState('');
  const [slotDate, setSlotDate] = useState<string>(() => todayStr);
  const [startTime, setStartTime] = useState('06:00');
  const [endTime, setEndTime] = useState('08:30');
  const [targetTopics, setTargetTopics] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [markedComplete, setMarkedComplete] = useState(false);
  const [repeatEveryday, setRepeatEveryday] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const pendingTasks = completionTasks
    .filter((t) => !t.completed)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  useEffect(() => {
    if (initialSlot) {
      setTitle(initialSlot.title || '');
      setSlotDate(initialSlot.date || defaultDate || todayStr);
      setStartTime(initialSlot.startTime || '06:00');
      setEndTime(initialSlot.endTime || '08:30');
      setTargetTopics(initialSlot.targetTopics || '');
      setEnabled(initialSlot.enabled !== undefined ? initialSlot.enabled : true);
      setMarkedComplete(!!initialSlot.markedComplete);
      setRepeatEveryday(initialSlot.repeatEveryday !== undefined ? initialSlot.repeatEveryday : true);
      setSelectedTaskId(initialSlot.allocatedTaskId || null);
    } else if (prefilledTask) {
      const { startTime: presentStart, endTime: presentEnd } = getPresentTimeRange(prefilledTask.estimatedMinutes, userTimezone);
      setTitle(prefilledTask.title);
      setSlotDate(defaultDate || todayStr);
      setStartTime(presentStart);
      setEndTime(presentEnd);
      setTargetTopics(prefilledTask.targetTopics || prefilledTask.title);
      setEnabled(true);
      setMarkedComplete(false);
      setRepeatEveryday(true);
      setSelectedTaskId(prefilledTask.id);
    } else {
      const defaultMinutes = 120;
      const { startTime: presentStart, endTime: presentEnd } = getPresentTimeRange(defaultMinutes, userTimezone);

      setTitle('Study Session');
      setTargetTopics('');
      setSelectedTaskId(null);
      setSlotDate(defaultDate || todayStr);
      setStartTime(presentStart);
      setEndTime(presentEnd);
      setEnabled(true);
      setMarkedComplete(false);
      setRepeatEveryday(true);
    }
  }, [initialSlot, prefilledTask, defaultDate, isOpen, userTimezone, todayStr]);

  if (!isOpen) return null;

  const { totalSeconds } = getSlotTimestamps(startTime, endTime, new Date(), slotDate, userTimezone);
  const durationHours = (totalSeconds / 3600).toFixed(1);

  const handleAssignTopicOnly = (task: StudyTask) => {
    const taskTopicName = task.targetTopics || task.title;
    if (!targetTopics.trim()) {
      setTargetTopics(taskTopicName);
      setSelectedTaskId(task.id);
    } else if (targetTopics.includes(taskTopicName)) {
      const parts = targetTopics.split(' + ').map((p) => p.trim()).filter((p) => p !== taskTopicName);
      setTargetTopics(parts.join(' + '));
      if (parts.length === 0) setSelectedTaskId(null);
    } else {
      setTargetTopics(`${targetTopics} + ${taskTopicName}`);
      setSelectedTaskId(task.id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalTitle = title.trim() || 'Study Session';

    onSave({
      title: finalTitle,
      startTime,
      endTime,
      date: slotDate || todayStr,
      targetTopics: targetTopics.trim() || undefined,
      allocatedTaskId: selectedTaskId || undefined,
      enabled,
      markedComplete,
      unmarkedByUser: initialSlot ? !markedComplete : false,
      repeatEveryday,
    });
    onClose();
  };

  return ReactDOM.createPortal(
    <div className="fixed inset-0 w-screen h-screen z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn font-sans">
      <div
        className="editorial-card w-full max-w-lg shadow-2xl overflow-hidden relative max-h-[90vh] flex flex-col text-[var(--ink)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-[var(--border)] bg-[var(--card-bg)] shrink-0">
          <div>
            <div className="editorial-label">Planner Workspace</div>
            <h3 className="font-serif text-2xl font-semibold text-[var(--ink)]">
              {initialSlot ? 'Edit Study Slot' : 'Create Study Slot'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[var(--muted)] hover:text-[var(--ink)] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 font-mono text-xs overflow-y-auto bg-[var(--card-bg)]">
          <div className="space-y-1.5 p-3.5 bg-[var(--surface-subtle)] border border-[var(--border)]">
            <div className="flex items-center justify-between">
              <label className="editorial-label flex items-center gap-1.5">
                <CalendarIcon className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span>Slot Date</span>
              </label>
              <button
                type="button"
                onClick={() => setSlotDate(todayStr)}
                className={`px-2 py-0.5 text-[10px] uppercase font-bold transition cursor-pointer ${
                  slotDate === todayStr
                    ? 'bg-[var(--accent)] text-[var(--accent-text)]'
                    : 'text-[var(--muted)] hover:text-[var(--ink)]'
                }`}
              >
                [ TODAY ]
              </button>
            </div>
            <input
              type="date"
              value={slotDate}
              onChange={(e) => setSlotDate(e.target.value)}
              className="w-full bg-[var(--card-bg)] border border-[var(--border-strong)] p-2 text-[var(--ink)] outline-none text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="editorial-label block">Slot Title / Routine Block</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Deep Practice, Calculus Analysis..."
              className="w-full bg-[var(--surface-subtle)] border border-[var(--border-strong)] p-2.5 font-serif text-base text-[var(--ink)] outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="editorial-label block">Start Time</label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-[var(--surface-subtle)] border border-[var(--border-strong)] p-2 text-[var(--ink)] outline-none font-mono text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="editorial-label block">End Time</label>
              <input
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full bg-[var(--surface-subtle)] border border-[var(--border-strong)] p-2 text-[var(--ink)] outline-none font-mono text-xs"
              />
            </div>
          </div>

          <div className="text-right font-mono text-[11px] text-[var(--muted)]">
            Duration: <span className="text-[var(--accent)] font-bold">{durationHours}h</span>
          </div>

          <div className="space-y-1">
            <label className="editorial-label block">Focus Concept / Chapters</label>
            <input
              type="text"
              value={targetTopics}
              onChange={(e) => setTargetTopics(e.target.value)}
              placeholder="e.g. Thermodynamics formulas, Chapter 4..."
              className="w-full bg-[var(--surface-subtle)] border border-[var(--border-strong)] p-2 text-[var(--ink)] outline-none font-sans text-xs"
            />
          </div>

          {pendingTasks.length > 0 && (
            <div className="space-y-2 p-3 bg-[var(--surface-subtle)] border border-[var(--border)]">
              <div className="editorial-label">Assign from Pending Objectives:</div>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                {pendingTasks.slice(0, 8).map((task) => (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => handleAssignTopicOnly(task)}
                    className={`px-2 py-1 border text-[10px] text-left truncate max-w-full cursor-pointer transition ${
                      targetTopics.includes(task.title)
                        ? 'bg-[var(--accent)] text-[var(--accent-text)] border-[var(--accent)] font-bold'
                        : 'bg-[var(--card-bg)] border-[var(--border)] text-[var(--ink)] hover:border-[var(--accent)]'
                    }`}
                  >
                    + {task.title}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Repeat Everyday Checkbox */}
          <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-normal text-[var(--ink)] select-none">
              <input
                type="checkbox"
                checked={repeatEveryday}
                onChange={(e) => setRepeatEveryday(e.target.checked)}
                className="w-3.5 h-3.5 accent-[var(--accent)] cursor-pointer"
              />
              <span>set for everyday</span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border)]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-editorial py-2 px-6"
            >
              {initialSlot ? 'Update Slot' : 'Save Slot'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
