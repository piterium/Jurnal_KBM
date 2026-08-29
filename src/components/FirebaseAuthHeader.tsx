import React from 'react';
import { CloudCheck, CloudOff, RefreshCw, CheckCircle2 } from 'lucide-react';

interface FirebaseAuthHeaderProps {
  syncStatus: 'synced' | 'syncing' | 'offline' | 'error';
  onManualSync: () => void;
  lastSyncTime?: Date | null;
}

export const FirebaseAuthHeader: React.FC<FirebaseAuthHeaderProps> = ({
  syncStatus,
  onManualSync,
  lastSyncTime,
}) => {
  return (
    <div className="flex items-center gap-2.5">
      {/* Cloud & Local Persistence Status Indicator */}
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
          <div className="flex items-center gap-1.5 text-slate-400">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-medium">Tersimpan di Perangkat</span>
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
