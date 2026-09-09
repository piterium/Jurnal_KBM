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
    id: 'light',
    name: 'Tema Terang (Light Mode)',
    category: 'light',
    tagline: 'Latar putih jernih & bersih, nyaman di siang hari',
    description: 'Tampilan terang modern dengan kontras tinggi, teks hitam tajam, dan serasi dengan lembar cetak dokumen.',
    primaryColor: '#2563EB',
    badgeBg: 'bg-blue-100 text-blue-800 border border-blue-200',
    badgeText: 'text-blue-600',
    previewBg: '#F8FAFC',
    previewBorder: '#E2E8F0',
    previewText: '#0F172A',
  },
  {
    id: 'dark',
    name: 'Tema Gelap (Dark Mode)',
    category: 'dark',
    tagline: 'Latar gelap elegan & teduh, hemat baterai',
    description: 'Nuansa abu-abu biru gelap slate dengan aksen warna tajam, ramah bagi mata di malam hari atau ruangan redup.',
    primaryColor: '#3B82F6',
    badgeBg: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
    badgeText: 'text-blue-400',
    previewBg: '#0B1120',
    previewBorder: '#1E293B',
    previewText: '#FFFFFF',
  },
  {
    id: 'emerald',
    name: 'Hijau Edukasi / Madrasah',
    category: 'dark',
    tagline: 'Nuansa hijau islami/madrasah bernuansa teduh',
    description: 'Tema bernuansa hijau zamrud pendidikan yang menenangkan dan teduh di mata.',
    primaryColor: '#10B981',
    badgeBg: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    badgeText: 'text-emerald-400',
    previewBg: '#041D15',
    previewBorder: '#0D4E3C',
    previewText: '#ECFDF5',
  },
  {
    id: 'ocean',
    name: 'Biru Samudra (Ocean Sapphire)',
    category: 'dark',
    tagline: 'Kesan akademis profesional & berwibawa',
    description: 'Nuansa biru laut dalam dengan aksen biru safir yang tegas dan rapi.',
    primaryColor: '#0EA5E9',
    badgeBg: 'bg-sky-500/20 text-sky-400 border border-sky-500/30',
    badgeText: 'text-sky-400',
    previewBg: '#051626',
    previewBorder: '#0F4574',
    previewText: '#F0F9FF',
  },
  {
    id: 'sepia',
    name: 'Kertas Klasik (Warm Sepia)',
    category: 'light',
    tagline: 'Kertas buku hangat & bebas silau',
    description: 'Kombinasi warna krem hangat dan tinta cokelat buku cetak klasik yang sangat nyaman untuk membaca.',
    primaryColor: '#D97706',
    badgeBg: 'bg-amber-100 text-amber-800 border border-amber-200',
    badgeText: 'text-amber-700',
    previewBg: '#FAF6EE',
    previewBorder: '#E8DCBE',
    previewText: '#2A1F16',
  },
  {
    id: 'purple',
    name: 'Royal Twilight',
    category: 'dark',
    tagline: 'Ungu modern berkelas & artistik',
    description: 'Kombinasi ungu gelap royal dengan aksen lavender yang futuristik.',
    primaryColor: '#A855F7',
    badgeBg: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
    badgeText: 'text-purple-400',
    previewBg: '#130924',
    previewBorder: '#442274',
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
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode;
        if (
          saved &&
          ['dark', 'light', 'emerald', 'ocean', 'sepia', 'purple'].includes(saved)
        ) {
          return saved;
        }
      } catch (e) {
        console.warn('Could not read theme from localStorage:', e);
      }
    }
    return 'dark'; // default theme
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
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const currentThemeMeta =
    THEME_OPTIONS.find((opt) => opt.id === theme) || THEME_OPTIONS[0];

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    // Remove all previous theme classes
    const allClasses = [
      'dark',
      'light',
      'theme-dark',
      'theme-light',
      'theme-emerald',
      'theme-ocean',
      'theme-sepia',
      'theme-purple',
    ];

    root.classList.remove(...allClasses);
    body.classList.remove(...allClasses);

    // Apply attribute and classes based on selected theme
    root.setAttribute('data-theme', theme);

    if (theme === 'light') {
      root.classList.add('light', 'theme-light');
      body.classList.add('light', 'theme-light');
      root.style.colorScheme = 'light';
    } else if (theme === 'sepia') {
      root.classList.add('light', 'theme-sepia');
      body.classList.add('light', 'theme-sepia');
      root.style.colorScheme = 'light';
    } else if (theme === 'emerald') {
      root.classList.add('dark', 'theme-emerald');
      body.classList.add('dark', 'theme-emerald');
      root.style.colorScheme = 'dark';
    } else if (theme === 'ocean') {
      root.classList.add('dark', 'theme-ocean');
      body.classList.add('dark', 'theme-ocean');
      root.style.colorScheme = 'dark';
    } else if (theme === 'purple') {
      root.classList.add('dark', 'theme-purple');
      body.classList.add('dark', 'theme-purple');
      root.style.colorScheme = 'dark';
    } else {
      // dark
      root.classList.add('dark', 'theme-dark');
      body.classList.add('dark', 'theme-dark');
      root.style.colorScheme = 'dark';
    }
  }, [theme]);

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
