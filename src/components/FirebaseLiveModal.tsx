import React, { useState, useEffect } from 'react';
import {
  Flame,
  CheckCircle2,
  RefreshCw,
  X,
  Copy,
  ExternalLink,
  ShieldCheck,
  Smartphone,
  Laptop,
  Layers,
  Database,
  QrCode,
  Share2,
} from 'lucide-react';
import { AppData } from '../types';
import {
  getFirebaseConfigSummary,
  DEFAULT_SCHOOL_ID,
} from '../firebase/firestoreService';

interface FirebaseLiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: AppData;
  syncStatus: 'synced' | 'syncing' | 'offline' | 'error';
  onManualSync: () => void;
  currentSchoolId: string;
  onSwitchSchoolId: (newId: string) => void;
}

export const FirebaseLiveModal: React.FC<FirebaseLiveModalProps> = ({
  isOpen,
  onClose,
  data,
  syncStatus,
  onManualSync,
  currentSchoolId,
  onSwitchSchoolId,
}) => {
  const [workspaceInput, setWorkspaceInput] = useState(currentSchoolId);
  const [copied, setCopied] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    setWorkspaceInput(currentSchoolId);
  }, [currentSchoolId]);

  if (!isOpen) return null;

  const firebaseInfo = getFirebaseConfigSummary();
  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}?school=${encodeURIComponent(currentSchoolId)}`
    : '';

  const handleCopyLink = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopySchoolId = () => {
    navigator.clipboard.writeText(currentSchoolId);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleApplyWorkspace = (e: React.FormEvent) => {
    e.preventDefault();
    if (workspaceInput.trim()) {
      onSwitchSchoolId(workspaceInput.trim());
    }
  };

  const totalRecords =
    (data.journals?.length || 0) +
    (data.attendances?.length || 0) +
    (data.assessments?.length || 0) +
    (data.students?.length || 0) +
    (data.classes?.length || 0) +
    (data.teachers?.length || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-2xl bg-[#0F172A] border border-slate-700/80 shadow-2xl text-slate-100 overflow-hidden">
        {/* Header Ribbon */}
        <div className="p-5 border-b border-slate-800 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 flex-shrink-0 shadow-inner">
              <Flame className="w-5 h-5 fill-amber-400/20 text-amber-400 animate-pulse" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  Firebase Cloud Terhubung
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  ONLINE
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Sinkronisasi multi-perangkat otomatis via Google Cloud Firestore
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Status Card */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Status Koneksi Real-Time
              </div>
              <div className="flex items-center gap-2 mt-1">
                {syncStatus === 'syncing' ? (
                  <>
                    <RefreshCw className="w-4 h-4 text-amber-400 animate-spin" />
                    <span className="text-sm font-bold text-amber-400">
                      Menyinkronkan ke Cloud...
                    </span>
                  </>
                ) : syncStatus === 'error' ? (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                    <span className="text-sm font-bold text-rose-400">
                      Kendala Jaringan (Tersimpan Lokal)
                    </span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm font-bold text-emerald-400">
                      Sinkron & Terhubung Aktif
                    </span>
                  </>
                )}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Total rekaman cloud:{' '}
                <span className="font-semibold text-white font-mono">{totalRecords} entri</span>{' '}
                (Jurnal, Presensi, Nilai, Siswa)
              </div>
            </div>

            <button
              onClick={onManualSync}
              disabled={syncStatus === 'syncing'}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 text-xs font-bold transition-all shadow-md shadow-amber-500/20 cursor-pointer whitespace-nowrap active:scale-95"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
              <span>Sinkronkan Sekarang</span>
            </button>
          </div>

          {/* Multi Device Info */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-blue-900/20 to-indigo-900/20 border border-blue-500/30 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-300">
              <Smartphone className="w-4 h-4 text-blue-400" />
              <span>Akses Multi-Perangkat (HP, Tablet, Laptop)</span>
              <Laptop className="w-4 h-4 text-indigo-400 ml-1" />
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Buka aplikasi ini di HP atau laptop lain menggunakan tautan atau ID Ruang yang sama. Perubahan data jurnal dan presensi akan langsung muncul secara seketika (*real-time*).
            </p>

            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Tautan Disalin!' : 'Salin Tautan Akses HP'}</span>
              </button>
            </div>
          </div>

          {/* Workspace Switcher */}
          <form onSubmit={handleApplyWorkspace} className="space-y-3 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300">
                ID Ruang Data Sekolah (Workspace ID)
              </label>
              <button
                type="button"
                onClick={handleCopySchoolId}
                className="text-[11px] text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Copy className="w-3 h-3" />
                <span>{copiedCode ? 'Disalin' : 'Salin ID'}</span>
              </button>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={workspaceInput}
                onChange={(e) => setWorkspaceInput(e.target.value)}
                placeholder="cth: sman1-jkt atau nama-guru"
                className="flex-1 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Ganti Ruang
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              ID Ruang aktif:{' '}
              <span className="text-amber-400 font-mono font-semibold">{currentSchoolId}</span>. Masukkan ID yang sama di perangkat lain untuk berbagi data.
            </p>
          </form>

          {/* Cloud Config Details */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 text-[11px] font-mono text-slate-400 space-y-1">
            <div className="flex justify-between">
              <span>Project ID:</span>
              <span className="text-slate-200">{firebaseInfo.projectId}</span>
            </div>
            <div className="flex justify-between">
              <span>Database ID:</span>
              <span className="text-slate-200 truncate max-w-[240px]">{firebaseInfo.databaseId}</span>
            </div>
            <div className="flex justify-between">
              <span>Auth Domain:</span>
              <span className="text-slate-200">{firebaseInfo.authDomain}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
