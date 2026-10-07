import React, { useState } from 'react';
import { useTimer } from '../context/TimerContext';
import { CompletionColumn } from './CompletionColumn';
import { SlotEditorModal } from './SlotEditorModal';
import { ScheduledStudySlot, StudyTask } from '../types';

interface CompletionTabProps {
  onNavigateToTimetable?: () => void;
}

export const CompletionTab: React.FC<CompletionTabProps> = ({ onNavigateToTimetable }) => {
  const { completionTasks, addScheduledSlot } = useTimer();
  const [selectedTaskForSlot, setSelectedTaskForSlot] = useState<StudyTask | null>(null);
  const [isSlotEditorOpen, setIsSlotEditorOpen] = useState(false);

  const pendingTasks = completionTasks.filter((t) => !t.completed);
  const totalMinutes = pendingTasks.reduce((acc, t) => acc + (t.estimatedMinutes || 60), 0);
  const totalHours = (totalMinutes / 60).toFixed(1);

  const handleScheduleTask = (task: StudyTask) => {
    setSelectedTaskForSlot(task);
    setIsSlotEditorOpen(true);
  };

  const handleSaveSlot = (slotData: Omit<ScheduledStudySlot, 'id'>) => {
    addScheduledSlot(slotData);
    setIsSlotEditorOpen(false);
    setSelectedTaskForSlot(null);
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-12 font-sans text-[var(--ink)]">
      {/* Editorial Header Strip */}
      <section className="border-b border-[var(--border)] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="editorial-label mb-1">Tasks &bull; Priority Queue</div>
          <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-[var(--ink)] tracking-tight">
            Study Tasks &amp; Objectives
          </h1>
          <p className="font-serif text-lg text-[var(--muted)] italic mt-1">
            Break down your syllabus, prioritize daily goals, and schedule focused study sessions.
          </p>
        </div>

        <div className="flex items-baseline gap-8 border-t md:border-t-0 md:border-l border-[var(--border)] pt-4 md:pt-0 md:pl-8">
          <div>
            <div className="editorial-label">Workload</div>
            <div className="font-cinzel text-3xl sm:text-4xl font-bold text-[var(--ink)] leading-none tabular-nums mt-1">
              {totalHours}h
            </div>
          </div>
          <div>
            <div className="editorial-label">Pending</div>
            <div className="font-cinzel text-3xl sm:text-4xl font-bold text-[var(--accent)] leading-none tabular-nums mt-1">
              {pendingTasks.length}
            </div>
          </div>
        </div>
      </section>

      {/* Main Task Column */}
      <div className="max-w-4xl mx-auto">
        <CompletionColumn onScheduleTaskIntoSlot={handleScheduleTask} />
      </div>

      <SlotEditorModal
        isOpen={isSlotEditorOpen}
        onClose={() => {
          setIsSlotEditorOpen(false);
          setSelectedTaskForSlot(null);
        }}
        onSave={handleSaveSlot}
        prefilledTask={selectedTaskForSlot}
      />
    </div>
  );
};
