import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeMode = 'dark' | 'light' | 'emerald' | 'ocean' | 'sepia' | 'purple';

export interface ThemeOption {
  id: ThemeMode;
  name: string;
  category: 'dark' | 'light';
  tagline: string;
  description: string;
  primaryColor: string;
  badgeBg: string;
  badgeText: string;
  previewBg: string;
  previewBorder: string;
  previewText: string;
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'dark',
    name: 'Midnight Slate',
    category: 'dark',
    tagline: 'Latar gelap elegan, hemat baterai & teduh',
    description: 'Nuansa abu-abu biru gelap slate dengan aksen neon blue beresolusi tinggi.',
    primaryColor: '#3B82F6',
    badgeBg: 'bg-blue-500/20',
    badgeText: 'text-blue-400',
    previewBg: '#0B1120',
    previewBorder: '#1E293B',
    previewText: '#FFFFFF',
  },
];

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  themeOptions: ThemeOption[];
  currentThemeMeta: ThemeOption;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'jurnal_guru_app_theme';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Permanently locked to Midnight Slate (dark)
  const theme: ThemeMode = 'dark';
  const setTheme = (_newTheme: ThemeMode) => {};
  const toggleTheme = () => {};

  const currentThemeMeta = THEME_OPTIONS[0];

  useEffect(() => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    } catch (e) {
      console.warn('Could not save theme to localStorage:', e);
    }

    const root = document.documentElement;
    const body = document.body;

    // Remove any previous alternate themes
    root.classList.remove(
      'light',
      'theme-light',
      'theme-emerald',
      'theme-ocean',
      'theme-sepia',
      'theme-purple'
    );
    body.classList.remove(
      'light',
      'theme-light',
      'theme-emerald',
      'theme-ocean',
      'theme-sepia',
      'theme-purple'
    );

    root.setAttribute('data-theme', 'dark');
    root.classList.add('dark', 'theme-dark');
    body.classList.add('dark', 'theme-dark');
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, themeOptions: THEME_OPTIONS, currentThemeMeta }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
