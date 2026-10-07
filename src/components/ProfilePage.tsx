import React, { useState } from 'react';
import {
  Palette,
  Clock3,
  Target,
  Save,
  Download,
  Upload,
  Globe,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTimer, getDeviceTimezone } from '../context/TimerContext';
import { useStudyTheme, StudyTheme } from '../context/ThemeContext';
import { localStore } from '../lib/storage';

const THEME_OPTIONS: { id: StudyTheme; name: string; icon: string; desc: string }[] = [
  { id: 'paper', name: 'White Theme', icon: '📄', desc: 'Minimal clean light mode' },
  { id: 'slate', name: 'Slate Dark', icon: '🪨', desc: 'Twilight slate tone' },
  { id: 'dark', name: 'Charcoal Dark', icon: '🌙', desc: 'High-contrast obsidian black' },
  { id: 'warm', name: 'Espresso Dark', icon: '🪵', desc: 'Warm roasted espresso tone' },
];

export const TIMEZONE_GROUPS = [
  {
    region: 'Automatic / Device Time',
    timezones: [
      { id: 'auto', label: '⚡ Automatic (Sync with Device Timezone)' },
    ],
  },
  {
    region: 'United States',
    timezones: [
      { id: 'America/New_York', label: 'US Eastern Time (ET) - New York, Washington DC, Miami' },
      { id: 'America/Chicago', label: 'US Central Time (CT) - Chicago, Dallas, Houston' },
      { id: 'America/Denver', label: 'US Mountain Time (MT) - Denver, Phoenix, Salt Lake City' },
      { id: 'America/Los_Angeles', label: 'US Pacific Time (PT) - Los Angeles, San Francisco, Seattle' },
      { id: 'America/Anchorage', label: 'US Alaska Time (AKT) - Anchorage' },
      { id: 'Pacific/Honolulu', label: 'US Hawaii Time (HST) - Honolulu' },
    ],
  },
  {
    region: 'United Kingdom',
    timezones: [
      { id: 'Europe/London', label: 'UK (GMT / BST) - London, Edinburgh, Belfast, Cardiff' },
    ],
  },
  {
    region: 'Australia',
    timezones: [
      { id: 'Australia/Sydney', label: 'Australia Eastern (AEST/AEDT) - Sydney, Melbourne, Canberra' },
      { id: 'Australia/Brisbane', label: 'Australia Queensland (AEST) - Brisbane' },
      { id: 'Australia/Adelaide', label: 'Australia Central (ACST/ACDT) - Adelaide' },
      { id: 'Australia/Darwin', label: 'Australia Northern Territory (ACST) - Darwin' },
      { id: 'Australia/Perth', label: 'Australia Western (AWST) - Perth' },
    ],
  },
  {
    region: 'Canada',
    timezones: [
      { id: 'America/Toronto', label: 'Canada Eastern (ET) - Toronto, Montreal, Ottawa' },
      { id: 'America/Vancouver', label: 'Canada Pacific (PT) - Vancouver, Victoria' },
      { id: 'America/Winnipeg', label: 'Canada Central (CT) - Winnipeg' },
      { id: 'America/Edmonton', label: 'Canada Mountain (MT) - Calgary, Edmonton' },
      { id: 'America/Halifax', label: 'Canada Atlantic (AT) - Halifax' },
      { id: 'America/St_Johns', label: 'Canada Newfoundland (NT) - St. John’s' },
    ],
  },
  {
    region: 'India',
    timezones: [
      { id: 'Asia/Kolkata', label: 'India Standard Time (IST) - New Delhi, Mumbai, Bengaluru, Kolkata' },
    ],
  },
  {
    region: 'Global / Other Regions',
    timezones: [
      { id: 'UTC', label: 'Coordinated Universal Time (UTC)' },
      { id: 'Europe/Paris', label: 'Central European (CET/CEST) - Paris, Berlin, Rome, Madrid' },
      { id: 'Asia/Dubai', label: 'Gulf Standard Time (GST) - Dubai, Abu Dhabi' },
      { id: 'Asia/Singapore', label: 'Singapore / Hong Kong (SGT/HKT)' },
      { id: 'Asia/Tokyo', label: 'Japan Standard Time (JST) - Tokyo' },
      { id: 'Pacific/Auckland', label: 'New Zealand (NZST/NZDT) - Auckland' },
    ],
  },
];

export const ProfilePage: React.FC = () => {
  const { profile, updateProfile } = useAuth();
  const { studyTarget, setStudyTarget, liveStudyHours, streakDays, completedSessionsToday } = useTimer();
  const { theme, setTheme } = useStudyTheme();

  const deviceTz = getDeviceTimezone();
  const [dailyGoal, setDailyGoal] = useState(profile?.targetDailyHours || studyTarget || 8);
  const [timeFormat, setTimeFormat] = useState<'12h' | '24h'>(profile?.timeFormat || '12h');
  const [timezone, setTimezone] = useState(profile?.timezone || 'auto');

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStudyTarget(dailyGoal);
    updateProfile({
      name: 'Student',
      targetDailyHours: dailyGoal,
      timeFormat,
      timezone,
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleExportData = async () => {
    const backupStr = await localStore.exportAllData();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(backupStr);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `study_tracker_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const success = await localStore.importAllData(text);
        if (success) {
          setImportStatus('Backup restored successfully. Reloading...');
          setTimeout(() => window.location.reload(), 1000);
        } else {
          setImportStatus('Invalid backup file structure.');
        }
      } catch (err) {
        setImportStatus('Invalid JSON backup file.');
      }
    };
    reader.readAsText(file);
  };

  const handleClearAllData = async () => {
    if (window.confirm('Clear all study records, logs, and scheduled slots? This will reset your tracker.')) {
      await localStore.clearAll();
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12 font-sans text-[var(--ink)] max-w-4xl mx-auto p-4 sm:p-6">
      {/* Workspace Settings Header */}
      <div className="border-b border-[var(--border)] pb-4">
        <h1 className="font-sans text-2xl font-bold text-[var(--ink)]">
          Settings
        </h1>
        <p className="font-sans text-xs text-[var(--muted)] mt-0.5">
          Manage your personal study targets, interface themes, time preferences, and local data backups.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6 font-sans">
        {/* 1. Theme Selection - Boring list/grid */}
        <div className="p-4 bg-[var(--card-bg)] border border-[var(--border)] space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-[var(--ink)]">
            Appearance / Theme
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {THEME_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setTheme(opt.id)}
                className={`p-3 text-left border flex items-center justify-between text-xs cursor-pointer ${
                  theme === opt.id
                    ? 'border-[var(--ink)] bg-[var(--surface-subtle)] font-bold'
                    : 'border-[var(--border)] bg-[var(--card-bg)] text-[var(--muted)] hover:text-[var(--ink)]'
                }`}
              >
                <span>{opt.icon} {opt.name}</span>
                {theme === opt.id && <span className="text-[10px] text-[var(--accent)]">[Active]</span>}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Daily Study Target */}
        <div className="p-4 bg-[var(--card-bg)] border border-[var(--border)] space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-[var(--ink)]">
            Daily Study Target (Hours)
          </label>
          <input
            type="number"
            min="0.5"
            max="24"
            step="0.5"
            value={dailyGoal}
            onChange={(e) => setDailyGoal(Number(e.target.value))}
            className="w-full bg-[var(--input-bg)] border border-[var(--border)] p-2 text-xs text-[var(--ink)] outline-none font-sans"
          />
          <div className="flex gap-2 text-xs">
            {[4, 6, 8, 10, 12].map((hrs) => (
              <button
                key={hrs}
                type="button"
                onClick={() => setDailyGoal(hrs)}
                className={`px-3 py-1 border text-xs cursor-pointer ${
                  dailyGoal === hrs ? 'bg-[var(--border)] font-bold text-[var(--ink)]' : 'border-[var(--border)] text-[var(--muted)]'
                }`}
              >
                {hrs}h
              </button>
            ))}
          </div>
        </div>

        {/* 3. Time Format & Timezone */}
        <div className="p-4 bg-[var(--card-bg)] border border-[var(--border)] space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--ink)] mb-2">
              Time Format
            </label>
            <div className="flex gap-4 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="timeFormat"
                  checked={timeFormat === '12h'}
                  onChange={() => setTimeFormat('12h')}
                />
                <span>12-Hour (AM / PM)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="timeFormat"
                  checked={timeFormat === '24h'}
                  onChange={() => setTimeFormat('24h')}
                />
                <span>24-Hour</span>
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--ink)]">
                Timezone (Automatic / US / UK / Australia / Canada / India / Global)
              </label>
              <span className="font-mono text-[10px] text-[var(--muted)]">
                {timezone === 'auto' ? `⚡ Auto: ${deviceTz}` : `Current: ${timezone}`}
              </span>
            </div>

            {/* Quick Region Buttons */}
            <div className="flex flex-wrap gap-1.5 text-[11px] font-mono">
              <button
                type="button"
                onClick={() => setTimezone('auto')}
                className={`px-2.5 py-1 border transition-colors cursor-pointer flex items-center gap-1 ${
                  timezone === 'auto' || timezone === deviceTz
                    ? 'bg-[var(--accent)] text-[var(--accent-text)] font-bold border-[var(--accent)]'
                    : 'border-[var(--border)] bg-[var(--card-bg)] text-[var(--muted)] hover:text-[var(--ink)]'
                }`}
                title={`Automatically match device timezone (${deviceTz})`}
              >
                <span>⚡ Auto (Device: {deviceTz.split('/').pop()?.replace(/_/g, ' ')})</span>
              </button>
              <button
                type="button"
                onClick={() => setTimezone('America/New_York')}
                className={`px-2.5 py-1 border transition-colors cursor-pointer ${
                  timezone.startsWith('America/') && timezone !== 'America/Toronto' && timezone !== 'America/Vancouver' && timezone !== 'America/Winnipeg' && timezone !== 'America/Edmonton' && timezone !== 'America/Halifax' && timezone !== 'America/St_Johns'
                    ? 'bg-[var(--accent)] text-[var(--accent-text)] font-bold border-[var(--accent)]'
                    : 'border-[var(--border)] bg-[var(--card-bg)] text-[var(--muted)] hover:text-[var(--ink)]'
                }`}
              >
                🇺🇸 US (ET)
              </button>
              <button
                type="button"
                onClick={() => setTimezone('America/Los_Angeles')}
                className={`px-2.5 py-1 border transition-colors cursor-pointer ${
                  timezone === 'America/Los_Angeles'
                    ? 'bg-[var(--accent)] text-[var(--accent-text)] font-bold border-[var(--accent)]'
                    : 'border-[var(--border)] bg-[var(--card-bg)] text-[var(--muted)] hover:text-[var(--ink)]'
                }`}
              >
                🇺🇸 US (PT)
              </button>
              <button
                type="button"
                onClick={() => setTimezone('Europe/London')}
                className={`px-2.5 py-1 border transition-colors cursor-pointer ${
                  timezone === 'Europe/London'
                    ? 'bg-[var(--accent)] text-[var(--accent-text)] font-bold border-[var(--accent)]'
                    : 'border-[var(--border)] bg-[var(--card-bg)] text-[var(--muted)] hover:text-[var(--ink)]'
                }`}
              >
                🇬🇧 UK (GMT/BST)
              </button>
              <button
                type="button"
                onClick={() => setTimezone('Australia/Sydney')}
                className={`px-2.5 py-1 border transition-colors cursor-pointer ${
                  timezone.startsWith('Australia/')
                    ? 'bg-[var(--accent)] text-[var(--accent-text)] font-bold border-[var(--accent)]'
                    : 'border-[var(--border)] bg-[var(--card-bg)] text-[var(--muted)] hover:text-[var(--ink)]'
                }`}
              >
                🇦🇺 AU (Sydney)
              </button>
              <button
                type="button"
                onClick={() => setTimezone('America/Toronto')}
                className={`px-2.5 py-1 border transition-colors cursor-pointer ${
                  timezone === 'America/Toronto' || timezone === 'America/Vancouver' || timezone === 'America/Winnipeg' || timezone === 'America/Edmonton' || timezone === 'America/Halifax' || timezone === 'America/St_Johns'
                    ? 'bg-[var(--accent)] text-[var(--accent-text)] font-bold border-[var(--accent)]'
                    : 'border-[var(--border)] bg-[var(--card-bg)] text-[var(--muted)] hover:text-[var(--ink)]'
                }`}
              >
                🇨🇦 CA (Toronto)
              </button>
              <button
                type="button"
                onClick={() => setTimezone('Asia/Kolkata')}
                className={`px-2.5 py-1 border transition-colors cursor-pointer ${
                  timezone === 'Asia/Kolkata'
                    ? 'bg-[var(--accent)] text-[var(--accent-text)] font-bold border-[var(--accent)]'
                    : 'border-[var(--border)] bg-[var(--card-bg)] text-[var(--muted)] hover:text-[var(--ink)]'
                }`}
              >
                🇮🇳 IN (IST)
              </button>
            </div>

            {/* Structured Select Dropdown */}
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full bg-[var(--surface-subtle)] border border-[var(--border-strong)] p-2.5 text-xs text-[var(--ink)] outline-none font-sans font-medium"
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
        </div>

        {/* Save Preferences Button */}
        <div>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 border border-[var(--border)] bg-[var(--card-bg)] text-[var(--ink)] text-xs font-bold uppercase tracking-wider cursor-pointer hover:bg-[var(--border)] transition-colors"
          >
            {saved ? 'Saved Successfully' : saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>

      {/* 4. Data Backup & Reset */}
      <div className="p-4 bg-[var(--card-bg)] border border-[var(--border)] space-y-4 font-sans text-xs">
        <div className="font-bold uppercase tracking-wider text-[var(--ink)] border-b border-[var(--border)] pb-2">
          Data &amp; Local Storage Management
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={handleExportData}
            className="p-3 border border-[var(--border)] text-left hover:bg-[var(--surface-subtle)] cursor-pointer space-y-1"
          >
            <div className="font-bold">Export JSON Backup</div>
            <div className="text-[11px] text-[var(--muted)]">Download local study logs &amp; tasks</div>
          </button>

          <label className="p-3 border border-[var(--border)] text-left hover:bg-[var(--surface-subtle)] cursor-pointer space-y-1 block">
            <div className="font-bold">Restore Backup File</div>
            <div className="text-[11px] text-[var(--muted)]">Upload JSON to restore records</div>
            <input type="file" accept=".json" onChange={handleImportFile} className="hidden" />
          </label>

          <button
            onClick={handleClearAllData}
            className="p-3 border border-[#f87171] text-[#f87171] text-left hover:bg-[#f87171]/10 cursor-pointer space-y-1"
          >
            <div className="font-bold">Clear All Data</div>
            <div className="text-[11px] opacity-80">Reset tracker storage</div>
          </button>
        </div>
        {importStatus && <div className="text-[11px] text-[var(--accent)] font-bold">{importStatus}</div>}
      </div>
    </div>
  );
};
