import React, { useState, useEffect } from 'react';
import { X, Target, Calendar, Clock, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTimer, getDeviceTimezone } from '../context/TimerContext';

const EXAM_PRESETS = [
  'Deep Work & Daily Focus',
  'Project & Skill Mastery',
  'Reading & Writing Routine',
  'Exam Preparation',
  'Certification & Assessment',
  'University / Coursework',
  'Personal Growth & Learning',
  'Custom Goal',
];

import { TIMEZONE_GROUPS } from './ProfilePage';

export const UserProfileModal: React.FC = () => {
  const { profile, updateProfile, isProfileModalOpen, setIsProfileModalOpen } = useAuth();
  const { setStudyTarget } = useTimer();

  const deviceTz = getDeviceTimezone();
  const [name, setName] = useState(profile?.name || 'User');
  const [examGoal, setExamGoal] = useState(
    EXAM_PRESETS.includes(profile?.examGoal || '') ? profile?.examGoal || 'Deep Work & Daily Focus' : 'Custom Goal'
  );
  const [customGoal, setCustomGoal] = useState(
    EXAM_PRESETS.includes(profile?.examGoal || '') ? '' : profile?.examGoal || ''
  );
  const [targetDate, setTargetDate] = useState(profile?.targetDate || '2026-06-01');
  const [targetDailyHours, setTargetDailyHours] = useState(profile?.targetDailyHours || 8);
  const [timezone, setTimezone] = useState(profile?.timezone || 'auto');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name || 'User');
      if (EXAM_PRESETS.includes(profile.examGoal)) {
        setExamGoal(profile.examGoal);
        setCustomGoal('');
      } else {
        setExamGoal('Custom Goal');
        setCustomGoal(profile.examGoal);
      }
      setTargetDate(profile.targetDate || '2026-06-01');
      setTargetDailyHours(profile.targetDailyHours || 8);
      setTimezone(profile.timezone || 'auto');
    }
  }, [profile]);

  if (!isProfileModalOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    const finalGoal = examGoal === 'Custom Goal' ? (customGoal.trim() || 'My Focus Goal') : examGoal;

    await updateProfile({
      name: name.trim() || 'User',
      examGoal: finalGoal,
      targetDate: targetDate || undefined,
      targetDailyHours: Number(targetDailyHours) || 8,
      timezone,
    });

    setStudyTarget(Number(targetDailyHours) || 8);

    setSaving(false);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      setIsProfileModalOpen(false);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1c1c1c]/50 backdrop-blur-sm animate-fadeIn">
      <div className="editorial-card w-full max-w-md p-6 sm:p-8 space-y-6 text-[#1c1c1c]">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#1c1c1c]/10 pb-4">
          <div>
            <div className="editorial-label">Student Profile</div>
            <h3 className="font-serif text-3xl font-semibold text-[#1c1c1c]">Objective &amp; Settings</h3>
          </div>
          <button
            onClick={() => setIsProfileModalOpen(false)}
            className="text-[#8d8d8d] hover:text-[#1c1c1c] cursor-pointer p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="space-y-4 font-mono text-xs">
          <div className="space-y-1">
            <label className="editorial-label block">Display Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Alex"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#f8f7f4] border border-[#1c1c1c]/20 p-2.5 font-serif text-base text-[#1c1c1c] outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="editorial-label block">Target Objective / Project / Exam</label>
            <select
              value={examGoal}
              onChange={(e) => setExamGoal(e.target.value)}
              className="w-full bg-[#f8f7f4] border border-[#1c1c1c]/20 p-2 font-serif text-base text-[#1c1c1c] outline-none"
            >
              {EXAM_PRESETS.map((preset) => (
                <option key={preset} value={preset}>
                  {preset}
                </option>
              ))}
            </select>

            {examGoal === 'Custom Goal' && (
              <input
                type="text"
                placeholder="Enter custom objective or project..."
                value={customGoal}
                onChange={(e) => setCustomGoal(e.target.value)}
                className="w-full bg-[#f8f7f4] border border-[#1c1c1c]/20 p-2 font-serif text-base text-[#1c1c1c] outline-none mt-2"
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="editorial-label block">Target Deadline</label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full bg-[#f8f7f4] border border-[#1c1c1c]/20 p-2 text-[#1c1c1c] outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="editorial-label block">Daily Target Hours</label>
              <input
                type="number"
                min="0.5"
                max="24"
                step="0.5"
                value={targetDailyHours}
                onChange={(e) => setTargetDailyHours(Number(e.target.value))}
                className="w-full bg-[#f8f7f4] border border-[#1c1c1c]/20 p-2 text-[#1c1c1c] outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="editorial-label block">Timezone (Automatic / US / UK / AU / CA / IN / Global)</label>
              <button
                type="button"
                onClick={() => setTimezone('auto')}
                className={`text-[10px] uppercase font-bold tracking-wider cursor-pointer ${
                  timezone === 'auto' ? 'text-[var(--accent)]' : 'text-[#8d8d8d] hover:text-[#1c1c1c]'
                }`}
              >
                ⚡ Match Device ({deviceTz.split('/').pop()?.replace(/_/g, ' ')})
              </button>
            </div>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full bg-[#f8f7f4] border border-[#1c1c1c]/20 p-2 text-[#1c1c1c] outline-none font-sans text-xs font-medium"
            >
              {TIMEZONE_GROUPS.map((group) => (
                <optgroup key={group.region} label={group.region}>
                  {group.timezones.map((tz) => (
                    <option key={tz.id} value={tz.id}>
                      {tz.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div className="pt-3 border-t border-[#1c1c1c]/10 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setIsProfileModalOpen(false)}
              className="text-[#8d8d8d] hover:text-[#1c1c1c] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-editorial py-2.5 px-6"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{savedSuccess ? 'Saved!' : saving ? 'Saving…' : 'Save Settings'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
