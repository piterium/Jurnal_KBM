import React from 'react';
import { RefreshCw, Flame, Activity, Database, CheckCircle2 } from 'lucide-react';
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

      {/* Direct Firebase Database Live Indicator */}
      <div className="flex items-center gap-1.5 p-0.5 rounded-xl bg-slate-900/90 border border-slate-800 shadow-sm">
        <button
          id="btn-firebase-live-indicator"
          type="button"
          onClick={onOpenFirebaseLiveModal}
          title="Klik untuk melihat Status & Telemetri Database Firebase Firestore Langsung"
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-transparent hover:bg-amber-500/15 text-xs text-white transition-all cursor-pointer group hover:scale-[1.01] active:scale-95"
        >
          <div className="relative flex items-center justify-center">
            <Flame className="w-4 h-4 text-amber-400 group-hover:text-amber-300 transition-colors" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500"></span>
          </div>
          <div className="flex items-center gap-1.5 font-bold tracking-tight">
            <span className="text-amber-400 font-bold">Firebase</span>
            <span className="text-emerald-400 font-semibold">
              {syncStatus === 'syncing' ? 'Menyimpan...' : 'Database'}
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-1 text-[10px] text-slate-400 font-normal pl-1.5 border-l border-slate-800">
            {syncStatus === 'syncing' ? (
              <RefreshCw className="w-3 h-3 text-blue-400 animate-spin" />
            ) : (
              <Activity className="w-3 h-3 text-emerald-400" />
            )}
            <span className="text-slate-300">
              {syncStatus === 'syncing' ? 'Sync' : 'Direct'}
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={onManualSync}
          title="Sinkronkan Langsung ke Firebase Firestore"
          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${syncStatus === 'syncing' ? 'animate-spin text-amber-400' : ''}`} />
        </button>
      </div>
    </div>
  );
};


