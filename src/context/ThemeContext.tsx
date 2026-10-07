import React, { createContext, useContext, useEffect, useState } from 'react';

export type StudyTheme = 'slate' | 'dark' | 'warm' | 'paper';

interface ThemeContextType {
  theme: StudyTheme;
  setTheme: (theme: StudyTheme) => void;
  cycleTheme: () => void;
  themeLabel: string;
}

const THEME_NAMES: Record<StudyTheme, string> = {
  paper: 'White Theme (Default)',
  slate: 'Slate Dark',
  dark: 'Charcoal Dark',
  warm: 'Espresso Dark',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<StudyTheme>(() => {
    const saved = localStorage.getItem('study_theme') as StudyTheme;
    if (saved && ['paper', 'slate', 'dark', 'warm'].includes(saved)) {
      return saved;
    }
    return 'paper'; // White theme as default
  });

  useEffect(() => {
    localStorage.setItem('study_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'paper') {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  }, [theme]);

  const setTheme = (newTheme: StudyTheme) => {
    setThemeState(newTheme);
  };

  const cycleTheme = () => {
    const order: StudyTheme[] = ['slate', 'dark', 'warm', 'paper'];
    const next = order[(order.indexOf(theme) + 1) % order.length];
    setThemeState(next);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, cycleTheme, themeLabel: THEME_NAMES[theme] }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useStudyTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useStudyTheme must be used within ThemeProvider');
  }
  return ctx;
};
