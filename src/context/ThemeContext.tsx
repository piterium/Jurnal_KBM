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
    name: 'Midnight Slate (Gelap Modern)',
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
  {
    id: 'light',
    name: 'Clean Paper (Terang Bersih)',
    category: 'light',
    tagline: 'Latar putih cerah kontras tinggi & siap cetak',
    description: 'Tampilan dokumen kertas putih bersih dengan teks hitam tegas.',
    primaryColor: '#2563EB',
    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-800',
    previewBg: '#FFFFFF',
    previewBorder: '#E2E8F0',
    previewText: '#0F172A',
  },
  {
    id: 'emerald',
    name: 'Emerald Madrasah (Hijau Edukasi)',
    category: 'dark',
    tagline: 'Nuansa hijau zamrud tenang & khas instansi',
    description: 'Sentuhan warna hijau emerald sejuk dengan aksen mint dan sage, sangat pas untuk madrasah / sekolah adiwiyata.',
    primaryColor: '#10B981',
    badgeBg: 'bg-emerald-500/20',
    badgeText: 'text-emerald-400',
    previewBg: '#06281E',
    previewBorder: '#064E3B',
    previewText: '#ECFDF5',
  },
  {
    id: 'ocean',
    name: 'Ocean Sapphire (Biru Akademik)',
    category: 'dark',
    tagline: 'Biru kobalt formal & dinamis khas kampus',
    description: 'Kombinasi biru laut dalam safir dengan aksen cyan terang, formal dan profesional.',
    primaryColor: '#0EA5E9',
    badgeBg: 'bg-cyan-500/20',
    badgeText: 'text-cyan-400',
    previewBg: '#082038',
    previewBorder: '#0C4A6E',
    previewText: '#F0F9FF',
  },
  {
    id: 'sepia',
    name: 'Warm Sepia (Kertas Buku & Nyaman)',
    category: 'light',
    tagline: 'Krem hangat ramah mata untuk durasi panjang',
    description: 'Latar kertas klasik warm alabaster dengan aksen cokelat tembaga amber, tidak menyilaukan mata.',
    primaryColor: '#D97706',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-800',
    previewBg: '#FEF3C7',
    previewBorder: '#FDE68A',
    previewText: '#78350F',
  },
  {
    id: 'purple',
    name: 'Royal Twilight (Ungu Elegan)',
    category: 'dark',
    tagline: 'Nuansa ungu indigo mewah & modern',
    description: 'Latar ungu malam berkelas dipadu aksen fuchsia dan emas lembut, estetis dan futuristik.',
    primaryColor: '#8B5CF6',
    badgeBg: 'bg-purple-500/20',
    badgeText: 'text-purple-400',
    previewBg: '#1E1035',
    previewBorder: '#4C1D95',
    previewText: '#FAF5FF',
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
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
      if (saved && THEME_OPTIONS.some((t) => t.id === saved)) {
        return saved;
      }
      // Check system preference if no saved preference
      if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        return 'light';
      }
    } catch (e) {
      console.warn('Could not read theme from localStorage:', e);
    }
    return 'dark'; // default to dark
  });

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch (e) {
      console.warn('Could not save theme to localStorage:', e);
    }
  };

  const toggleTheme = () => {
    // Cycles between dark and light or back to dark
    if (theme === 'dark') setTheme('light');
    else if (theme === 'light') setTheme('emerald');
    else if (theme === 'emerald') setTheme('ocean');
    else if (theme === 'ocean') setTheme('sepia');
    else if (theme === 'sepia') setTheme('purple');
    else setTheme('dark');
  };

  const currentThemeMeta = THEME_OPTIONS.find((t) => t.id === theme) || THEME_OPTIONS[0];

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    // Reset previous theme classes
    root.classList.remove(
      'dark',
      'light',
      'theme-dark',
      'theme-light',
      'theme-emerald',
      'theme-ocean',
      'theme-sepia',
      'theme-purple'
    );
    body.classList.remove(
      'theme-dark',
      'theme-light',
      'theme-emerald',
      'theme-ocean',
      'theme-sepia',
      'theme-purple'
    );

    root.setAttribute('data-theme', theme);
    root.classList.add(`theme-${theme}`);
    body.classList.add(`theme-${theme}`);

    if (theme === 'light' || theme === 'sepia') {
      root.classList.add('light');
    } else {
      root.classList.add('dark');
    }
  }, [theme]);

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
