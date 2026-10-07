import React, { useEffect } from 'react';
import { ArrowLeft, Linkedin, ExternalLink } from 'lucide-react';

interface AboutPageProps {
  onNavigateHome: () => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigateHome }) => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-12 space-y-8 text-[var(--ink)] animate-fadeIn">
      {/* Back navigation button */}
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
      <div className="space-y-2 border-b border-[var(--border)] pb-6">
        <div className="text-[11px] font-mono tracking-[0.2em] text-[var(--accent)] uppercase font-bold">
          CREATOR &bull; STORY
        </div>
        <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-[var(--ink)] tracking-tight">
          About us
        </h1>
        <p className="font-serif text-base sm:text-lg text-[var(--muted)] italic">
          The story and mission behind StudyLawn.
        </p>
      </div>

      {/* Main Content Card */}
      <div className="editorial-card p-6 sm:p-10 border border-[var(--border)] bg-[var(--card-bg)] space-y-6 shadow-sm">
        <div className="space-y-4 font-sans text-base sm:text-lg leading-relaxed text-[var(--ink)]">
          <p className="font-medium text-xl sm:text-2xl font-serif text-[var(--ink)]">
            Hi, I’m Aarav Sharma, the creator of StudyLawn.
          </p>

          <p className="text-[var(--muted)] leading-relaxed text-base sm:text-lg">
            I built StudyLawn as a simple workspace to help students plan, focus, and track their studies.
          </p>
        </div>

        {/* Connect with me Section */}
        <div className="pt-6 border-t border-[var(--border)] space-y-3 font-mono">
          <div className="text-xs uppercase tracking-wider text-[var(--muted)] font-bold">
            Connect with me:
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <span className="text-sm text-[var(--ink)] font-sans">LinkedIn:</span>
            <a
              href="https://www.linkedin.com/in/aarav-sharma5/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 border border-[var(--border-strong)] bg-[var(--surface-subtle)] text-[var(--accent)] hover:text-[var(--ink)] hover:border-[var(--accent)] transition-all font-mono text-xs sm:text-sm group shadow-xs cursor-pointer"
            >
              <Linkedin className="w-4 h-4 text-[#0077b5] group-hover:scale-110 transition-transform" />
              <span>https://www.linkedin.com/in/aarav-sharma5/</span>
              <ExternalLink className="w-3.5 h-3.5 text-[var(--muted)] group-hover:text-[var(--ink)]" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
