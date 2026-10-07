import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useTimer } from '../context/TimerContext';
import { useAuth } from '../context/AuthContext';

interface EditGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_GOALS = [4, 6, 8, 10, 12];

export const EditGoalModal: React.FC<EditGoalModalProps> = ({ isOpen, onClose }) => {
  const { studyTarget, setStudyTarget, liveStudyHours } = useTimer();
  const { updateProfile } = useAuth();
  const [targetInput, setTargetInput] = useState<string>(studyTarget.toString());
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentNum = parseFloat(targetInput) || studyTarget;
  const progressPercent = Math.min(100, Math.round((liveStudyHours / Math.max(0.1, currentNum)) * 100));

  const saveTarget = async (val: number) => {
    setStudyTarget(val);
    await updateProfile({ targetDailyHours: val });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 500);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(targetInput);
    if (!isNaN(val) && val >= 0.5 && val <= 24) {
      saveTarget(val);
    }
  };

  const handlePresetSelect = (hrs: number) => {
    setTargetInput(hrs.toString());
    saveTarget(hrs);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="editorial-card w-full max-w-md p-6 sm:p-8 space-y-6 text-[var(--ink)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[var(--border)] pb-4">
          <div>
            <div className="editorial-label">Daily Standard</div>
            <h3 className="font-serif text-3xl font-semibold text-[var(--ink)]">Daily Study Target</h3>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Preview */}
        <div className="p-4 bg-[var(--surface-subtle)] border border-[var(--border)] space-y-2">
          <div className="flex items-baseline justify-between font-mono text-xs">
            <span className="text-[var(--muted)]">Logged Today:</span>
            <span className="font-bold text-[var(--ink)]">{liveStudyHours.toFixed(1)} hrs</span>
          </div>
          <div className="flex items-baseline justify-between font-mono text-xs">
            <span className="text-[var(--muted)]">New Target:</span>
            <span className="font-bold text-[var(--accent)]">{currentNum.toFixed(1)} hrs / day</span>
          </div>

          <div className="w-full bg-[var(--border)] h-1.5 mt-2">
            <div
              className="h-1.5 bg-[var(--accent)] transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="text-right font-mono text-[10px] text-[var(--muted)]">
            {progressPercent}% toward goal
          </div>
        </div>

        {/* Presets */}
        <div className="space-y-2 font-mono text-xs">
          <div className="editorial-label">Quick Presets:</div>
          <div className="grid grid-cols-5 gap-2">
            {PRESET_GOALS.map((hrs) => (
              <button
                key={hrs}
                type="button"
                onClick={() => handlePresetSelect(hrs)}
                className={`py-2 px-1 text-center border transition-colors cursor-pointer ${
                  parseFloat(targetInput) === hrs
                    ? 'bg-[var(--accent)] text-[var(--accent-text)] border-[var(--accent)] font-bold'
                    : 'bg-[var(--surface-subtle)] border-[var(--border)] text-[var(--ink)] hover:border-[var(--accent)]'
                }`}
              >
                {hrs}h
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="space-y-4 font-mono text-xs">
          <div>
            <label className="editorial-label block mb-1">Custom Target (Hours)</label>
            <input
              type="number"
              step="0.5"
              min="0.5"
              max="24"
              value={targetInput}
              onChange={(e) => setTargetInput(e.target.value)}
              className="w-full bg-[var(--surface-subtle)] border border-[var(--border-strong)] p-2 text-base text-[var(--ink)] outline-none"
              autoFocus
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border)]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-editorial py-2 px-5"
            >
              {savedSuccess ? 'Saved!' : 'Apply Target'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
