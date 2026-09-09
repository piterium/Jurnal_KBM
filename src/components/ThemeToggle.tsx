import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Palette, Check, Sparkles } from 'lucide-react';
import { useTheme, ThemeMode } from '../context/ThemeContext';

interface ThemeToggleProps {
  variant?: 'pill' | 'icon' | 'compact' | 'selector';
  className?: string;
  showPaletteMenu?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  variant = 'pill',
  className = '',
  showPaletteMenu = true,
}) => {
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

  // Variant 1: Compact 1-click toggle button with Sun / Moon icon
  if (variant === 'compact') {
    return (
      <div className="relative inline-flex items-center gap-1.5" ref={dropdownRef}>
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={`Ganti ke Tema ${isLightMode ? 'Gelap' : 'Terang'}`}
          title={`Tema aktif: ${currentThemeMeta.name}. Klik untuk beralih ke Mode ${isLightMode ? 'Gelap' : 'Terang'}.`}
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer shadow-sm ${
            !isLightMode
              ? 'bg-slate-800/90 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white'
              : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50 hover:text-slate-950'
          } ${className}`}
        >
          {isLightMode ? (
            <Sun className="w-4 h-4 text-amber-500 fill-amber-500/20 flex-shrink-0" />
          ) : (
            <Moon className="w-4 h-4 text-blue-400 fill-blue-400/20 flex-shrink-0" />
          )}
          <span className="font-bold">
            {isLightMode ? 'Tema Terang' : 'Tema Gelap'}
          </span>
        </button>

        {showPaletteMenu && (
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Pilihan Tema Warna Lainnya"
            title="Pilih tema warna lain (Madrasah, Samudra, Sepia, Twilight)"
            className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
              !isLightMode
                ? 'bg-slate-800/90 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700'
                : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 shadow-sm'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
          </button>
        )}

        {isOpen && (
          <div
            className={`absolute right-0 top-full mt-2 w-64 p-2 rounded-2xl shadow-2xl z-50 border animate-in fade-in zoom-in-95 ${
              isLightMode
                ? 'bg-white border-slate-200 text-slate-800 shadow-slate-900/10'
                : 'bg-[#0F172A] border-slate-800 text-white shadow-black/60'
            }`}
          >
            <div
              className={`px-3 py-2 border-b flex items-center justify-between mb-1 ${
                isLightMode ? 'border-slate-100 text-slate-700' : 'border-slate-800 text-white'
              }`}
            >
              <span className="text-xs font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-500" />
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
                      ? 'bg-blue-600/15 text-blue-600 dark:text-blue-400 font-bold border border-blue-500/30'
                      : isLightMode
                      ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-black/10 dark:border-white/20 shadow-sm flex-shrink-0"
                      style={{ backgroundColor: opt.primaryColor }}
                    />
                    <div>
                      <div className="leading-tight font-semibold">{opt.name.split(' (')[0]}</div>
                      <div className={`text-[10px] ${isLightMode ? 'text-slate-400' : 'text-slate-400'}`}>
                        {opt.tagline.split(' &')[0]}
                      </div>
                    </div>
                  </div>
                  {theme === opt.id && <Check className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Variant 2: Icon Only
  if (variant === 'icon') {
    return (
      <div className="relative inline-block" ref={dropdownRef}>
        <button
          onClick={toggleTheme}
          aria-label={`Ganti Tema (${isLightMode ? 'Terang' : 'Gelap'})`}
          title={`Tema: ${currentThemeMeta.name}. Klik untuk beralih.`}
          className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center relative ${
            !isLightMode
              ? 'bg-slate-800/80 border-slate-700 text-amber-400 hover:bg-slate-700 hover:text-amber-300'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900 shadow-sm'
          } ${className}`}
        >
          {isLightMode ? (
            <Sun className="w-4 h-4 text-amber-500 fill-amber-500/20" />
          ) : (
            <Moon className="w-4 h-4 text-blue-400 fill-blue-400/20" />
          )}
        </button>
      </div>
    );
  }

  // Variant 3: Card Selector (Used in SettingsView for rich visual selection)
  if (variant === 'selector') {
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 ${className}`}>
        {themeOptions.map((opt) => {
          const isSelected = theme === opt.id;
          const isDarkOpt = opt.category === 'dark';

          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setTheme(opt.id)}
              className={`p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between cursor-pointer group ${
                isSelected
                  ? 'border-blue-500 ring-2 ring-blue-500/30 bg-blue-500/5 shadow-md'
                  : isLightMode
                  ? 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 shadow-sm'
                  : 'border-slate-800 hover:border-slate-700 bg-slate-900/60 hover:bg-slate-900'
              }`}
            >
              {/* Badge for Current Theme */}
              {isSelected && (
                <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center gap-1 shadow-sm">
                  <Check className="w-3 h-3" />
                  Aktif
                </span>
              )}

              <div>
                {/* Visual Preview Box */}
                <div
                  className="w-full h-16 rounded-xl border p-2 mb-3 flex flex-col justify-between shadow-inner relative overflow-hidden"
                  style={{
                    backgroundColor: opt.previewBg,
                    borderColor: opt.previewBorder,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: opt.primaryColor }}
                      />
                      <span
                        className="text-[11px] font-bold"
                        style={{ color: opt.previewText }}
                      >
                        {opt.id === 'light' ? 'Mode Terang' : opt.id === 'dark' ? 'Mode Gelap' : opt.name}
                      </span>
                    </div>
                    {opt.category === 'light' ? (
                      <Sun className="w-3.5 h-3.5 text-amber-500" />
                    ) : (
                      <Moon className="w-3.5 h-3.5 text-blue-400" />
                    )}
                  </div>
                  <div className="flex gap-1 items-center">
                    {opt.id === 'light' ? (
                      <div className="h-2.5 rounded w-full bg-gradient-to-r from-emerald-600 via-green-500 to-yellow-400 shadow-xs" />
                    ) : (
                      <>
                        <div
                          className="h-2 rounded w-1/3 opacity-80"
                          style={{ backgroundColor: opt.primaryColor }}
                        />
                        <div
                          className="h-2 rounded w-1/2 opacity-40"
                          style={{ backgroundColor: opt.previewText }}
                        />
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0 border border-black/10"
                    style={{ backgroundColor: opt.primaryColor }}
                  />
                  <h4
                    className={`text-sm font-bold ${
                      isSelected
                        ? 'text-blue-600 dark:text-blue-400'
                        : isLightMode
                        ? 'text-slate-900'
                        : 'text-white'
                    }`}
                  >
                    {opt.name}
                  </h4>
                </div>

                <p
                  className={`text-xs mt-1 leading-relaxed ${
                    isLightMode ? 'text-slate-500' : 'text-slate-400'
                  }`}
                >
                  {opt.description}
                </p>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px]">
                <span
                  className={`font-semibold px-2 py-0.5 rounded-md ${
                    isDarkOpt
                      ? 'bg-slate-800 text-slate-300'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {isDarkOpt ? 'Gelap' : 'Terang'}
                </span>
                <span
                  className={`font-medium ${
                    isSelected ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-400'
                  }`}
                >
                  {isSelected ? 'Sedang Dipakai' : 'Pilih Tema'}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  // Variant 4: Default 'pill' variant [ ☀️ Terang | 🌙 Gelap | 🎨 Menu ]
  return (
    <div className="relative inline-flex items-center gap-1" ref={dropdownRef}>
      <div
        className={`inline-flex items-center p-1 rounded-xl border transition-all ${
          !isLightMode
            ? 'bg-slate-900/90 border-slate-800'
            : 'bg-slate-200/80 border-slate-300/80 shadow-inner'
        } ${className}`}
      >
        {/* Tombol Tema Terang */}
        <button
          type="button"
          onClick={() => setTheme('light')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            theme === 'light'
              ? 'bg-white text-blue-700 shadow-sm border border-slate-200/80'
              : isLightMode
              ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
          title="Beralih ke Mode Terang (Light Mode - Latar Putih Bersih)"
        >
          <Sun
            className={`w-3.5 h-3.5 ${
              theme === 'light' ? 'text-amber-500 fill-amber-500/30' : 'text-slate-400'
            }`}
          />
          <span className="tracking-wide">Terang</span>
        </button>

        {/* Tombol Tema Gelap */}
        <button
          type="button"
          onClick={() => setTheme('dark')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            theme === 'dark'
              ? 'bg-slate-800 text-blue-400 shadow-sm border border-slate-700/80'
              : isLightMode
              ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
          title="Beralih ke Mode Gelap (Dark Mode - Latar Slate Gelap)"
        >
          <Moon
            className={`w-3.5 h-3.5 ${
              theme === 'dark' ? 'text-blue-400 fill-blue-400/30' : 'text-slate-400'
            }`}
          />
          <span className="tracking-wide">Gelap</span>
        </button>

        {/* Menu Pilihan Tema Tambahan (Palette) */}
        {showPaletteMenu && (
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              theme !== 'light' && theme !== 'dark'
                ? 'bg-blue-600 text-white shadow-sm'
                : isLightMode
                ? 'text-slate-500 hover:text-slate-800'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Pilih tema warna lainnya (Madrasah, Samudra, Sepia, Twilight)"
          >
            <Palette className="w-3.5 h-3.5" />
            <span
              className="w-2 h-2 rounded-full border border-white/40 shadow-xs"
              style={{ backgroundColor: currentThemeMeta.primaryColor }}
            />
          </button>
        )}
      </div>

      {isOpen && showPaletteMenu && (
        <div
          className={`absolute right-0 top-full mt-2 w-64 p-2 rounded-2xl shadow-2xl z-50 border animate-in fade-in zoom-in-95 ${
            isLightMode
              ? 'bg-white border-slate-200 text-slate-800 shadow-slate-900/10'
              : 'bg-[#0F172A] border-slate-800 text-white shadow-black/60'
          }`}
        >
          <div
            className={`px-3 py-2 border-b flex items-center justify-between mb-1 ${
              isLightMode ? 'border-slate-100 text-slate-700' : 'border-slate-800 text-white'
            }`}
          >
            <span className="text-xs font-bold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
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
                    ? 'bg-blue-600/15 text-blue-600 dark:text-blue-400 font-bold border border-blue-500/30'
                    : isLightMode
                    ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-black/10 dark:border-white/20 shadow-sm flex-shrink-0"
                    style={{ backgroundColor: opt.primaryColor }}
                  />
                  <div>
                    <div className="leading-tight font-semibold">{opt.name.split(' (')[0]}</div>
                    <div className={`text-[10px] ${isLightMode ? 'text-slate-400' : 'text-slate-400'}`}>
                      {opt.tagline.split(' &')[0]}
                    </div>
                  </div>
                </div>
                {theme === opt.id && <Check className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
