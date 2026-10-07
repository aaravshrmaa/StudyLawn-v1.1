import React, { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';

interface PrivacyPolicyPageProps {
  onNavigateHome: () => void;
}

export const PrivacyPolicyPage: React.FC<PrivacyPolicyPageProps> = ({ onNavigateHome }) => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8 text-[var(--ink)] animate-fadeIn">
      {/* Back navigation link */}
      <div>
        <button
          onClick={onNavigateHome}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-mono text-[var(--muted)] hover:text-[var(--ink)] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to My Study Dashboard</span>
        </button>
      </div>

      {/* Hero Header */}
      <div className="space-y-1">
        <div className="text-[11px] font-mono tracking-[0.2em] text-[var(--muted)] uppercase font-semibold">
          LEGAL
        </div>
        <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-[var(--ink)] tracking-tight">
          Privacy Policy
        </h1>
        <p className="font-serif text-sm sm:text-base text-[var(--muted)] italic">
          Last updated: 27 September 2026
        </p>
      </div>

      {/* Main Content */}
      <div className="space-y-8 font-sans text-sm sm:text-base leading-relaxed text-[var(--ink)]">
        {/* Section 1 */}
        <section className="space-y-3">
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-[var(--ink)]">
            1. Who we are
          </h2>
          <p className="text-[var(--muted)]">
            StudyLawn (“we”, “us”, “our”) is a personal study-tracking and daily planning application operated by <strong>StudyLawn</strong>, the data controller for the purposes of user privacy, digital accessibility, and general data protection.
          </p>
        </section>

        {/* Section 2 */}
        <section className="space-y-3">
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-[var(--ink)]">
            2. What data we collect
          </h2>
          <ul className="space-y-2 text-[var(--muted)] pl-1">
            <li>
              &bull; <strong className="text-[var(--ink)]">Account data:</strong> email address and a hashed password (only if you choose to register an optional account for synchronization).
            </li>
            <li>
              &bull; <strong className="text-[var(--ink)]">Study data:</strong> subject blocks, objectives, target hours, session timestamps, and revision review notes that you schedule.
            </li>
            <li>
              &bull; <strong className="text-[var(--ink)]">Technical data:</strong> standard browser storage records and basic logs (such as timezone alignment and local browser storage cache configurations).
            </li>
          </ul>
          <p className="text-[var(--muted)]">
            We do <strong>not</strong> collect special-category personal data, credit card information, or sell your records to third-party behavioral advertising agencies.
          </p>
        </section>

        {/* Section 3 */}
        <section className="space-y-3">
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-[var(--ink)]">
            3. Local Storage Policy
          </h2>
          <p className="text-[var(--muted)]">
            By default, StudyLawn is designed to respect your hardware sandbox. Your daily schedules, timetables, active study tasks, and revision logs are stored directly on your own browser utilizing LocalStorage and IndexedDB. You are free to export or wipe all stored local records at any time using the backup tools in your Settings panel.
          </p>
        </section>

        {/* Section 4 */}
        <section className="space-y-3">
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-[var(--ink)]">
            4. Analytics &amp; Cookies Policy
          </h2>
          <p className="text-[var(--muted)]">
            StudyLawn uses standard functional web storage to maintain your study timer sessions and interface preferences. Privacy-focused analytics are utilized solely to monitor site performance, uptime, and app stability. You can configure your browser preferences to decline all non-essential cookies without interrupting your core study planner and focus tools.
          </p>
        </section>

        {/* Section 5 */}
        <section className="space-y-3">
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-[var(--ink)]">
            5. Your Rights &amp; Control
          </h2>
          <p className="text-[var(--muted)]">
            You hold total rights of data portability, correction, and erasure. At any time, you can instantly export a structured JSON file of your study history, or fully delete your entire database forever by navigating to your Settings page and selecting the Reset options.
          </p>
        </section>
      </div>
    </div>
  );
};
