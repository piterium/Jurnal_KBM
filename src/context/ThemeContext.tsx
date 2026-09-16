import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeMode = 'gold' | 'dark';

export interface ThemeOption {
  id: ThemeMode;
  name: string;
  category: 'dark';
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
    id: 'gold',
    name: 'Obsidian Navigasi',
    category: 'dark',
    tagline: 'Warna latar halaman disamakan dengan warna navigasi (#0F1117)',
    description: 'Nuansa hitam obsidian matte (#0F1117) dengan kontainer elegan (#141722) dan aksen emas hangat (#F1B33B).',
    primaryColor: '#F1B33B',
    badgeBg: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
    badgeText: 'text-amber-400',
    previewBg: '#0F1117',
    previewBorder: '#262B3A',
    previewText: '#F1B33B',
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

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme] = useState<ThemeMode>('gold');

  const setTheme = () => {
    // Single unified theme locked
  };

  const toggleTheme = () => {
    // Single unified theme locked
  };

  const currentThemeMeta = THEME_OPTIONS[0];

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    // Clean any prior light or other mode classes
    const allClasses = [
      'light',
      'theme-light',
      'theme-sepia',
      'theme-emerald',
      'theme-ocean',
      'theme-purple',
    ];
    root.classList.remove(...allClasses);
    body.classList.remove(...allClasses);

    // Apply unified dark obsidian theme
    root.setAttribute('data-theme', 'gold');
    root.classList.add('dark', 'theme-gold');
    body.classList.add('dark', 'theme-gold');
    root.style.colorScheme = 'dark';
    body.style.backgroundColor = '#0F1117';
    body.style.color = '#F8FAFC';
  }, []);

  return (
    <ThemeContext.Provider
      value={{ theme, setTheme, toggleTheme, themeOptions: THEME_OPTIONS, currentThemeMeta }}
    >
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
