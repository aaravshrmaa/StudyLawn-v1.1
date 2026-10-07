import React, { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';

interface TermsOfUsePageProps {
  onNavigateHome: () => void;
}

export const TermsOfUsePage: React.FC<TermsOfUsePageProps> = ({ onNavigateHome }) => {
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
          Terms of Use
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
            1. Agreement to Terms
          </h2>
          <p className="text-[var(--muted)]">
            By visiting, accessing, or using any part of StudyLawn, you agree to be legally bound by these Terms of Use and our accompanying Privacy Policy. If you do not agree to these terms, please discontinue your use of the website.
          </p>
        </section>

        {/* Section 2 */}
        <section className="space-y-3">
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-[var(--ink)]">
            2. Permitted Use of the Service
          </h2>
          <p className="text-[var(--muted)]">
            StudyLawn provides a daily study planner, productivity timer, task lists, and revision log folders. You are granted a personal, non-commercial, revocable license to use our web app to manage your educational targets and self-study blocks.
          </p>
          <p className="text-[var(--muted)]">
            You agree not to attempt to disrupt the performance of our servers, scrape code/assets, or upload malicious files to our storage sandboxes.
          </p>
        </section>

        {/* Section 3 */}
        <section className="space-y-3">
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-[var(--ink)]">
            3. Disclaimer &amp; Liability
          </h2>
          <p className="text-[var(--muted)]">
            StudyLawn is a tool built to help you track habits and plan your timetable. We provide the application on an “as is” basis without warranties of academic success, examination performance, or guaranteed grades. All outcomes are the result of your individual effort.
          </p>
          <p className="text-[var(--muted)]">
            We are not liable for accidental data loss resulting from device cache cleaning, private browser logs, or browser database resets. Please utilize the Export Backup feature in your Settings panel regularly.
          </p>
        </section>

        {/* Section 4 */}
        <section className="space-y-3">
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-[var(--ink)]">
            4. Content Ownership
          </h2>
          <p className="text-[var(--muted)]">
            Your notes, scheduled timetables, checklists, and uploaded files belong completely to you. We hold zero claims of ownership over your stored content.
          </p>
        </section>

        {/* Section 5 */}
        <section className="space-y-3">
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-[var(--ink)]">
            5. Intellectual Property
          </h2>
          <p className="text-[var(--muted)]">
            All designs, custom brand iconography, styling, algorithms, and interface layouts of StudyLawn are protected by copyright and intellectual property rights. Copying or redistribution without written approval is prohibited.
          </p>
        </section>
      </div>
    </div>
  );
};
