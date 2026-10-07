import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { X, Play, Trash2, Check, ListOrdered, Plus, Bookmark } from 'lucide-react';
import { useTimer } from '../context/TimerContext';
import { ScheduledStudySlot, SlotTemplate } from '../types';

interface SlotTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'save' | 'load';
  targetDate?: string;
  activeSlots: ScheduledStudySlot[];
}

export const SlotTemplateModal: React.FC<SlotTemplateModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'load',
  targetDate,
  activeSlots,
}) => {
  const {
    slotTemplates,
    saveSlotTemplate,
    loadSlotTemplate,
    deleteSlotTemplate,
    completionTasks,
    allocateTasksToTimetableSlots,
    selectedCalendarDate,
    todayStr,
    tomorrowStr,
    formatDisplayDate,
  } = useTimer();
  const [mode, setMode] = useState<'save' | 'load'>(initialMode);
  const [templateTitle, setTemplateTitle] = useState('');
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [isApplyingTemplate, setIsApplyingTemplate] = useState(false);

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const effectiveDate = targetDate || selectedCalendarDate || todayStr;

  React.useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setTemplateTitle('');
      setSuccessToast(null);
      setConfirmDeleteId(null);
      setIsApplyingTemplate(false);
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => {
      setSuccessToast(null);
    }, 3000);
  };

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalTitle = templateTitle.trim() || `Routine Template (${new Date().toLocaleDateString()})`;
    const slotsToSave = activeSlots.length > 0 ? activeSlots : [];
    if (slotsToSave.length === 0) {
      showToast('No slots to save. Please add slots first.');
      return;
    }

    saveSlotTemplate(finalTitle, slotsToSave);
    showToast(`Template "${finalTitle}" saved.`);
    setTemplateTitle('');
    setTimeout(() => {
      setMode('load');
    }, 500);
  };

  const handleApplyTemplate = (template: SlotTemplate) => {
    loadSlotTemplate(template.id, effectiveDate, 'replace');
    showToast(`Loaded "${template.title}" for ${formatDisplayDate(effectiveDate, todayStr, tomorrowStr)}.`);
    setTimeout(() => {
      onClose();
    }, 600);
  };

  const handleApplyTemplateWithTasks = async (template: SlotTemplate) => {
    const pendingTasks = completionTasks.filter((t) => !t.completed);
    if (pendingTasks.length === 0) {
      handleApplyTemplate(template);
      return;
    }

    setIsApplyingTemplate(true);
    showToast('Distributing tasks to template slots...');

    try {
      const templateSlots: ScheduledStudySlot[] = template.slots.map((s, idx) => ({
        ...s,
        id: `slot-tpl-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
        date: effectiveDate,
        enabled: s.enabled !== undefined ? s.enabled : true,
      }));

      await allocateTasksToTimetableSlots(templateSlots, pendingTasks, effectiveDate);
      showToast(`Applied "${template.title}" with tasks for ${formatDisplayDate(effectiveDate, todayStr, tomorrowStr)}.`);
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (e) {
      handleApplyTemplate(template);
    } finally {
      setIsApplyingTemplate(false);
    }
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteSlotTemplate(id);
    setConfirmDeleteId(null);
    showToast('Template deleted.');
  };

  return ReactDOM.createPortal(
    <div className="fixed inset-0 w-screen h-screen z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn font-sans">
      <div
        className="editorial-card w-full max-w-xl shadow-2xl overflow-hidden relative max-h-[90vh] flex flex-col text-[var(--ink)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-[var(--border)] bg-[var(--card-bg)] shrink-0">
          <div>
            <div className="editorial-label">Planner Architecture</div>
            <h3 className="font-serif text-2xl font-semibold text-[var(--ink)]">
              Routine Templates
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[var(--muted)] hover:text-[var(--ink)] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[var(--border)] px-6 pt-3 gap-6 font-mono text-xs uppercase tracking-wider bg-[var(--surface-subtle)]">
          <button
            type="button"
            onClick={() => setMode('load')}
            className={`pb-2.5 transition border-b-2 cursor-pointer flex items-center gap-1.5 ${
              mode === 'load'
                ? 'border-[var(--accent)] text-[var(--ink)] font-bold'
                : 'border-transparent text-[var(--muted)] hover:text-[var(--ink)]'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>Saved Routines ({slotTemplates.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('save')}
            className={`pb-2.5 transition border-b-2 cursor-pointer flex items-center gap-1.5 ${
              mode === 'save'
                ? 'border-[var(--accent)] text-[var(--ink)] font-bold'
                : 'border-transparent text-[var(--muted)] hover:text-[var(--ink)]'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Save Current ({activeSlots.length} Slots)</span>
          </button>
        </div>

        {/* Active Target Date Indicator */}
        <div className="bg-[var(--surface-subtle)]/70 border-b border-[var(--border)] px-6 py-2 text-[11px] font-mono flex items-center justify-between text-[var(--muted)]">
          <span>Target Date: <strong className="text-[var(--ink)]">{formatDisplayDate(effectiveDate, todayStr, tomorrowStr)}</strong> ({effectiveDate})</span>
          <span className="text-[10px] text-[var(--muted)]">Preserves all other days</span>
        </div>

        {/* Feedback notification toast */}
        {successToast && (
          <div className="bg-[var(--surface-subtle)] border-b border-[var(--border)] text-[var(--ink)] px-6 py-2.5 font-mono text-xs flex items-center gap-2 animate-fadeIn">
            <Check className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
            <span>{successToast}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 bg-[var(--card-bg)]">
          {mode === 'save' ? (
            <form onSubmit={handleSaveSubmit} className="space-y-4 font-mono text-xs">
              <div className="space-y-1.5">
                <label className="editorial-label">Template Title</label>
                <input
                  type="text"
                  required
                  value={templateTitle}
                  onChange={(e) => setTemplateTitle(e.target.value)}
                  placeholder="e.g. 4-Block Focus Day, Weekend Deep Work Routine"
                  className="w-full bg-[var(--surface-subtle)] border border-[var(--border-strong)] px-3.5 py-2.5 text-[var(--ink)] font-serif text-base outline-none"
                  autoFocus
                />
              </div>

              {/* Slots Preview */}
              <div className="space-y-2 pt-2 border-t border-[var(--border)]">
                <div className="flex items-center justify-between">
                  <span className="editorial-label">
                    Slots to Save ({activeSlots.length})
                  </span>
                  {targetDate && (
                    <span className="text-[var(--muted)] text-[10px]">
                      Date: {targetDate}
                    </span>
                  )}
                </div>

                {activeSlots.length === 0 ? (
                  <div className="bg-[var(--surface-subtle)] border border-[var(--border)] p-6 text-center text-xs text-[var(--muted)]">
                    No study slots are currently listed.
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {activeSlots.map((slot, idx) => (
                      <div
                        key={slot.id || idx}
                        className="bg-[var(--surface-subtle)] border border-[var(--border)] p-3 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="font-mono text-[var(--muted)] text-[11px]">
                            0{idx + 1}
                          </span>
                          <div className="truncate">
                            <div className="text-[var(--ink)] font-medium truncate">{slot.title}</div>
                            {slot.targetTopics && (
                              <div className="text-[10px] text-[var(--muted)] truncate">{slot.targetTopics}</div>
                            )}
                          </div>
                        </div>
                        <div className="font-mono text-[var(--accent)] text-xs font-bold shrink-0 ml-2">
                          {slot.startTime} &ndash; {slot.endTime}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-[var(--muted)] hover:text-[var(--ink)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={activeSlots.length === 0}
                  className="btn-editorial py-2 px-6 disabled:opacity-40"
                >
                  Save Template
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-3 font-mono text-xs">
              {slotTemplates.length === 0 ? (
                <div className="bg-[var(--surface-subtle)] border border-[var(--border)] p-8 text-center space-y-3">
                  <div className="font-serif italic text-xl text-[var(--muted)]">
                    No routine templates saved yet.
                  </div>
                  <button
                    onClick={() => setMode('save')}
                    className="btn-editorial py-2 px-4 text-xs"
                  >
                    Save Current Day as Template
                  </button>
                </div>
              ) : (
                <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
                  {slotTemplates.map((template) => (
                    <div
                      key={template.id}
                      className="bg-[var(--surface-subtle)] border border-[var(--border)] hover:border-[var(--border-strong)] p-4 transition space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-serif text-lg sm:text-xl font-semibold text-[var(--ink)]">
                              {template.title}
                            </h4>
                            {template.id === 'default-study-routine' && (
                              <span className="px-1.5 py-0.5 bg-[var(--accent)]/10 text-[var(--accent)] font-mono text-[9px] uppercase font-bold tracking-wider border border-[var(--accent)]/20">
                                Default
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-[var(--muted)] mt-0.5">
                            {template.slots.length} Study Blocks (06:00 to 23:30)
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {template.id !== 'default-study-routine' && (
                            confirmDeleteId === template.id ? (
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={(e) => handleDelete(template.id, e)}
                                  className="px-2 py-1 bg-[#f87171] text-[#0f1013] font-bold text-[10px]"
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="text-[var(--muted)] hover:text-[var(--ink)] text-[10px] px-1"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setConfirmDeleteId(template.id)}
                                className="p-1.5 text-[var(--muted)] hover:text-[#f87171] transition cursor-pointer"
                                title="Delete template"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {template.slots.slice(0, 4).map((s, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-[var(--card-bg)] border border-[var(--border)] text-[10px] text-[var(--muted)] truncate max-w-[140px]"
                          >
                            {s.startTime}-{s.endTime} {s.title}
                          </span>
                        ))}
                        {template.slots.length > 4 && (
                          <span className="text-[10px] text-[var(--muted)]">
                            +{template.slots.length - 4} more
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
                        <button
                          onClick={() => handleApplyTemplate(template)}
                          className="btn-editorial-outline py-1.5 px-3 text-[11px]"
                        >
                          <Play className="w-3 h-3" />
                          <span>Load Routine</span>
                        </button>
                        <button
                          onClick={() => handleApplyTemplateWithTasks(template)}
                          disabled={isApplyingTemplate}
                          className="btn-editorial py-1.5 px-3 text-[11px]"
                        >
                          <ListOrdered className="w-3 h-3" />
                          <span>Fill from Tasks</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
