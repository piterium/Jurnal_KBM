import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Palette, Check, Sparkles } from 'lucide-react';
import { useTheme, ThemeMode } from '../context/ThemeContext';

interface ThemeToggleProps {
  variant?: 'pill' | 'icon' | 'compact' | 'selector';
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ variant = 'pill', className = '' }) => {
  const { theme, setTheme, toggleTheme, themeOptions, currentThemeMeta } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isLightMode = theme === 'light' || theme === 'sepia';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  if (variant === 'icon') {
    return (
      <div className="relative inline-block" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Pilih Tema Tampilan"
          title={`Tema: ${currentThemeMeta.name}`}
          className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center relative ${
            !isLightMode
              ? 'bg-slate-800/80 border-slate-700 text-amber-400 hover:bg-slate-700 hover:text-amber-300'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900 shadow-sm'
          } ${className}`}
        >
          <Palette className="w-4 h-4" />
          <span
            className="w-2 h-2 rounded-full absolute top-1.5 right-1.5 border border-slate-900 ring-1 ring-white/20"
            style={{ backgroundColor: currentThemeMeta.primaryColor }}
          />
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-64 p-2 bg-[#0F172A] border border-slate-800 rounded-2xl shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100">
            <div className="px-3 py-2 border-b border-slate-800 flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                Pilihan Tema Tampilan
              </span>
            </div>
            <div className="space-y-1">
              {themeOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => {
                    setTheme(opt.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center justify-between cursor-pointer ${
                    theme === opt.id
                      ? 'bg-blue-600/20 text-white font-bold border border-blue-500/30'
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-3 h-3 rounded-full border border-white/20 shadow-sm flex-shrink-0"
                      style={{ backgroundColor: opt.primaryColor }}
                    />
                    <div>
                      <div className="leading-tight">{opt.name.split(' (')[0]}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{opt.tagline.split(' &')[0]}</div>
                    </div>
                  </div>
                  {theme === opt.id && <Check className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className="relative inline-block" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Ganti Tema Tampilan"
          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
            !isLightMode
              ? 'bg-slate-800/90 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900 shadow-sm'
          } ${className}`}
        >
          <span
            className="w-2.5 h-2.5 rounded-full border border-white/20"
            style={{ backgroundColor: currentThemeMeta.primaryColor }}
          />
          <span className="hidden sm:inline">{currentThemeMeta.name.split(' (')[0]}</span>
          <Palette className="w-3.5 h-3.5 text-slate-400" />
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-64 p-2 bg-[#0F172A] border border-slate-800 rounded-2xl shadow-2xl z-50">
            <div className="px-3 py-1.5 border-b border-slate-800 text-xs font-bold text-white mb-1">
              Pilih Tema Warna
            </div>
            <div className="space-y-1">
              {themeOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => {
                    setTheme(opt.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center justify-between cursor-pointer ${
                    theme === opt.id
                      ? 'bg-blue-600/20 text-white font-bold border border-blue-500/30'
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full border border-white/20"
                      style={{ backgroundColor: opt.primaryColor }}
                    />
                    <span>{opt.name.split(' (')[0]}</span>
                  </div>
                  {theme === opt.id && <Check className="w-3.5 h-3.5 text-blue-400" />}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Default 'pill' variant with theme cycle / menu
  return (
    <div className="relative inline-flex items-center gap-1" ref={dropdownRef}>
      <div
        className={`inline-flex items-center p-1 rounded-xl border transition-all ${
          !isLightMode ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-100 border-slate-200'
        } ${className}`}
      >
        <button
          type="button"
          onClick={() => setTheme('light')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            theme === 'light'
              ? 'bg-white text-blue-600 shadow-sm border border-slate-200/60'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Mode Terang (Clean Paper)"
        >
          <Sun className={`w-3.5 h-3.5 ${theme === 'light' ? 'text-amber-500 fill-amber-500/20' : 'text-slate-400'}`} />
          <span className="hidden sm:inline">Terang</span>
        </button>

        <button
          type="button"
          onClick={() => setTheme('dark')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            theme === 'dark'
              ? 'bg-slate-800 text-blue-400 shadow-sm border border-slate-700/80'
              : 'text-slate-600 hover:text-slate-900'
          }`}
          title="Mode Gelap (Midnight Slate)"
        >
          <Moon className={`w-3.5 h-3.5 ${theme === 'dark' ? 'text-blue-400 fill-blue-400/20' : 'text-slate-500'}`} />
          <span className="hidden sm:inline">Gelap</span>
        </button>

        {/* Menu for full themes palette */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            theme !== 'light' && theme !== 'dark'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Pilih Tema Warna Tambahan (Hijau Madrasah, Biru Laut, Sepia, Twilight)"
        >
          <Palette className="w-3.5 h-3.5" />
          <span
            className="w-2 h-2 rounded-full border border-white/40"
            style={{ backgroundColor: currentThemeMeta.primaryColor }}
          />
        </button>
      </div>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 p-2 bg-[#0F172A] border border-slate-800 rounded-2xl shadow-2xl z-50 animate-in fade-in zoom-in-95">
          <div className="px-3 py-2 border-b border-slate-800 flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              Pilihan Tema Aplikasi
            </span>
          </div>
          <div className="space-y-1">
            {themeOptions.map((opt) => (
              <button
                key={opt.id}
                onClick={() => {
                  setTheme(opt.id);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center justify-between cursor-pointer ${
                  theme === opt.id
                    ? 'bg-blue-600/20 text-white font-bold border border-blue-500/30'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-sm flex-shrink-0"
                    style={{ backgroundColor: opt.primaryColor }}
                  />
                  <div>
                    <div className="leading-tight">{opt.name.split(' (')[0]}</div>
                    <div className="text-[10px] text-slate-400 font-normal">{opt.tagline.split(' &')[0]}</div>
                  </div>
                </div>
                {theme === opt.id && <Check className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
