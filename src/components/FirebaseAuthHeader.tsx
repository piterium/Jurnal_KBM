import React from 'react';
import { CloudCheck, CloudOff, RefreshCw, CheckCircle2, Flame, Activity } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

interface FirebaseAuthHeaderProps {
  syncStatus: 'synced' | 'syncing' | 'offline' | 'error';
  onManualSync: () => void;
  lastSyncTime?: Date | null;
  onOpenFirebaseLiveModal?: () => void;
}

export const FirebaseAuthHeader: React.FC<FirebaseAuthHeaderProps> = ({
  syncStatus,
  onManualSync,
  onOpenFirebaseLiveModal,
}) => {
  return (
    <div className="flex items-center gap-2.5">
      {/* Theme Switcher Toggle (Terang / Gelap) */}
      <ThemeToggle variant="pill" />

      {/* Firebase Live Real-Time Beacon Badge */}
      <button
        id="btn-firebase-live-indicator"
        type="button"
        onClick={onOpenFirebaseLiveModal}
        title="Klik untuk melihat Status & Telemetri Firebase Live"
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-slate-900 border border-amber-500/30 hover:border-amber-400/60 text-xs text-white transition-all cursor-pointer shadow-sm group hover:scale-[1.02] active:scale-95"
      >
        <div className="relative flex items-center justify-center">
          <Flame className="w-4 h-4 text-amber-400 group-hover:text-amber-300 transition-colors" />
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500"></span>
        </div>
        <div className="flex items-center gap-1.5 font-bold tracking-tight">
          <span className="text-amber-400 font-extrabold">Firebase</span>
          <span className="text-emerald-400">Live</span>
        </div>
        <div className="hidden lg:flex items-center gap-1 text-[10px] text-slate-400 font-normal pl-1 border-l border-slate-700/80">
          <Activity className="w-3 h-3 text-emerald-400" />
          <span>Realtime</span>
        </div>
      </button>

      {/* Cloud Persistence State Badge */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
        {syncStatus === 'syncing' && (
          <div className="flex items-center gap-1.5 text-blue-400">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span className="font-medium">Menyinkronkan...</span>
          </div>
        )}
        {syncStatus === 'synced' && (
          <div className="flex items-center gap-1.5 text-emerald-400">
            <CloudCheck className="w-3.5 h-3.5" />
            <span className="font-medium">Tersimpan di Cloud</span>
          </div>
        )}
        {syncStatus === 'offline' && (
          <div className="flex items-center gap-1.5 text-emerald-400">
            <CloudCheck className="w-3.5 h-3.5" />
            <span className="font-medium">Tersimpan di Cloud</span>
          </div>
        )}
        {syncStatus === 'error' && (
          <div className="flex items-center gap-1.5 text-amber-400">
            <CloudOff className="w-3.5 h-3.5" />
            <span className="font-medium">Penyimpanan Lokal Aktif</span>
          </div>
        )}

        <button
          onClick={onManualSync}
          title="Sinkronkan & Simpan Sekarang"
          className="ml-1 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

