import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

interface FirebaseAuthHeaderProps {}

export const FirebaseAuthHeader: React.FC<FirebaseAuthHeaderProps> = () => {
  return (
    <div className="flex items-center gap-3">
      {/* Theme Switcher Toggle (Terang / Gelap) */}
      <ThemeToggle variant="pill" />

      {/* Clean Auto-Save Indicator */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
        <span className="font-medium text-slate-300">Auto-Save Aktif</span>
      </div>
    </div>
  );
};


