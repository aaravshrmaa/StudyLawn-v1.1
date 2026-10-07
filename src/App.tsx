import React, { useEffect, useState, lazy, Suspense } from 'react';
import { ActiveTab } from './types';
import { TopHeader } from './components/TopHeader';
import { Sidebar } from './components/Sidebar';
import { OverviewDashboard } from './components/OverviewDashboard';
import { FullscreenTimerPage } from './components/FullscreenTimerPage';
import { TestsTab } from './components/TestsTab';
import { TimetableTab } from './components/TimetableTab';
import { CompletionTab } from './components/CompletionTab';
import { Footer } from './components/Footer';
import { AuthProvider } from './context/AuthContext';
import { TimerProvider } from './context/TimerContext';
import { ThemeProvider } from './context/ThemeContext';
import { PopoutTimer } from './components/PopoutTimer';
import { Analytics } from '@vercel/analytics/react';

// Lazy loaded auxiliary pages for fast initial bundle
const ProfilePage = lazy(() => import('./components/ProfilePage').then((m) => ({ default: m.ProfilePage })));
const TermsOfUsePage = lazy(() => import('./components/TermsOfUsePage').then((m) => ({ default: m.TermsOfUsePage })));
const PrivacyPolicyPage = lazy(() => import('./components/PrivacyPolicyPage').then((m) => ({ default: m.PrivacyPolicyPage })));
const AboutPage = lazy(() => import('./components/AboutPage').then((m) => ({ default: m.AboutPage })));

const TAB_TO_PATH: Record<ActiveTab, string> = {
  dashboard: '/',
  timetable: '/planner',
  completion: '/tasks',
  tests: '/vault',
  profile: '/settings',
  focus: '/focus',
  terms: '/terms',
  privacy: '/privacy',
  about: '/about',
};

const PATH_TO_TAB: Record<string, ActiveTab> = {
  '': 'dashboard',
  'overview': 'dashboard',
  'dashboard': 'dashboard',
  'planner': 'timetable',
  'timetable': 'timetable',
  'tasks': 'completion',
  'completion': 'completion',
  'vault': 'tests',
  'tests': 'tests',
  'settings': 'profile',
  'profile': 'profile',
  'focus': 'focus',
  'terms': 'terms',
  'privacy': 'privacy',
  'about': 'about',
  'about-us': 'about',
};

interface RouteInfo {
  tab: ActiveTab;
  isCanonicalPath: boolean;
  canonicalPath: string;
}

const getRouteFromUrl = (): RouteInfo => {
  const path = window.location.pathname.replace(/^\/+/, '');
  const parts = path.split('/').filter(Boolean);

  const rawPath = parts[0] || '';
  if (PATH_TO_TAB[rawPath] !== undefined) {
    const tab = PATH_TO_TAB[rawPath];
    const canonical = TAB_TO_PATH[tab];
    return {
      tab,
      isCanonicalPath: window.location.pathname === canonical || (rawPath === '' && canonical === '/'),
      canonicalPath: canonical,
    };
  }

  // Fallback to hash if someone loaded a link with hash (e.g. /#planner)
  const hash = window.location.hash.replace(/^#\/?/, '');
  const hashParts = hash.split('/').filter(Boolean);
  const hashRaw = hashParts[0] || '';
  if (PATH_TO_TAB[hashRaw] !== undefined) {
    const tab = PATH_TO_TAB[hashRaw];
    return {
      tab,
      isCanonicalPath: false,
      canonicalPath: TAB_TO_PATH[tab],
    };
  }

  return {
    tab: 'dashboard',
    isCanonicalPath: window.location.pathname === '/',
    canonicalPath: '/',
  };
};

const AppContent: React.FC = () => {
  const initialRoute = getRouteFromUrl();
  const [activeTab, setActiveTab] = useState<ActiveTab>(initialRoute.tab);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigateTo = (tab: ActiveTab) => {
    setActiveTab(tab);
    const targetPath = TAB_TO_PATH[tab] || '/';

    if (window.location.pathname !== targetPath || window.location.hash) {
      window.history.pushState(null, '', targetPath);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handlePopState = () => {
      const route = getRouteFromUrl();
      setActiveTab(route.tab);
    };

    // If initial page load had a hash or non-canonical alias (e.g. /timetable -> /planner), normalize immediately
    const route = getRouteFromUrl();
    if (!route.isCanonicalPath || window.location.hash) {
      window.history.replaceState(null, '', route.canonicalPath);
    }

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    let pageTitle = 'StudyLawn – Distraction-Free Daily Study Workspace';
    let canonicalUrl = 'https://studylawn.vercel.app/';

    if (activeTab === 'timetable') {
      pageTitle = 'Study Planner & Timetable Maker | StudyLawn';
      canonicalUrl = 'https://studylawn.vercel.app/planner';
    } else if (activeTab === 'completion') {
      pageTitle = 'Study Tasks & Task Priority Planner | StudyLawn';
      canonicalUrl = 'https://studylawn.vercel.app/tasks';
    } else if (activeTab === 'tests') {
      pageTitle = 'Vault & Knowledge File Storage | StudyLawn';
      canonicalUrl = 'https://studylawn.vercel.app/vault';
    } else if (activeTab === 'profile') {
      pageTitle = 'Settings & Study Preferences | StudyLawn';
      canonicalUrl = 'https://studylawn.vercel.app/settings';
    } else if (activeTab === 'focus') {
      pageTitle = 'Productivity Timer & Focus Clock | StudyLawn';
      canonicalUrl = 'https://studylawn.vercel.app/focus';
    } else if (activeTab === 'terms') {
      pageTitle = 'Terms of Use | StudyLawn';
      canonicalUrl = 'https://studylawn.vercel.app/terms';
    } else if (activeTab === 'privacy') {
      pageTitle = 'Privacy Policy | StudyLawn';
      canonicalUrl = 'https://studylawn.vercel.app/privacy';
    } else if (activeTab === 'about') {
      pageTitle = 'About Us | StudyLawn';
      canonicalUrl = 'https://studylawn.vercel.app/about';
    }

    document.title = pageTitle;

    const canonicalEl = document.querySelector('link[rel="canonical"]');
    if (canonicalEl) {
      canonicalEl.setAttribute('href', canonicalUrl);
    }
  }, [activeTab]);

  // When on the dedicated fullscreen focus timer, render ONLY the full-screen timer without header/sidebar/footer distraction
  if (activeTab === 'focus') {
    return (
      <FullscreenTimerPage
        onBackToDashboard={() => navigateTo('dashboard')}
        onNavigateTab={navigateTo}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] flex flex-col font-sans selection:bg-[#f59b2a] selection:text-[#0f1013] transition-colors duration-200">
      {/* Top Header Bar */}
      <TopHeader
        activeTab={activeTab}
        setActiveTab={navigateTo}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      {/* Main Body Layout: Left Column Navigation + Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pt-16 sm:pt-20">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={navigateTo}
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
        />

        <div className="flex-1 flex flex-col min-w-0 md:pl-28 lg:pl-32">
          <main className="flex-1 w-full max-w-7xl px-2.5 sm:px-8 lg:px-12 py-5 sm:py-10" id="main-content">
            <Suspense
              fallback={
                <div className="py-20 flex flex-col items-center justify-center space-y-3 font-mono text-xs text-[var(--muted)]">
                  <div className="w-6 h-6 border-2 border-[var(--accent)] border-t-transparent animate-spin" />
                  <span>Loading StudyLawn...</span>
                </div>
              }
            >
              {activeTab === 'dashboard' && <OverviewDashboard onNavigateTab={navigateTo} />}
              {activeTab === 'timetable' && <TimetableTab />}
              {activeTab === 'completion' && <CompletionTab onNavigateToTimetable={() => navigateTo('timetable')} />}
              {activeTab === 'tests' && <TestsTab />}
              {activeTab === 'profile' && <ProfilePage />}
              {activeTab === 'terms' && <TermsOfUsePage onNavigateHome={() => navigateTo('dashboard')} />}
              {activeTab === 'privacy' && <PrivacyPolicyPage onNavigateHome={() => navigateTo('dashboard')} />}
              {activeTab === 'about' && <AboutPage onNavigateHome={() => navigateTo('dashboard')} />}
            </Suspense>
          </main>
          <Footer onNavigate={navigateTo} />
        </div>
      </div>

      <PopoutTimer activeTab={activeTab} setActiveTab={navigateTo} />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <TimerProvider>
          <AppContent />
          <Analytics />
        </TimerProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
