import React, { useState, useEffect } from 'react';
import {
  Flame,
  Activity,
  Radio,
  CheckCircle2,
  RefreshCw,
  Copy,
  Check,
  Globe,
  Share2,
  X,
  Database,
  Smartphone,
  Laptop,
  Wifi,
  Users,
  Layers,
  BookOpen,
  UserCheck,
  FileCheck,
} from 'lucide-react';
import { AppData } from '../types';
import {
  getFirebaseConfigSummary,
  testFirebaseLiveConnection,
  DEFAULT_SCHOOL_ID,
} from '../firebase/firestoreService';

interface FirebaseLiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  data?: AppData;
  syncStatus: 'synced' | 'syncing' | 'offline' | 'error';
  onManualSync?: () => void;
  onForceSync?: () => void;
  currentSchoolId: string;
  onSwitchSchoolId?: (newSchoolId: string) => void;
  onSchoolIdChange?: (newSchoolId: string) => void;
  isRealtimeActive?: boolean;
  stats?: {
    journalsCount?: number;
    attendancesCount?: number;
    assessmentsCount?: number;
    classesCount?: number;
    studentsCount?: number;
    teachersCount?: number;
  };
}

export const FirebaseLiveModal: React.FC<FirebaseLiveModalProps> = ({
  isOpen,
  onClose,
  data,
  syncStatus,
  onManualSync,
  onForceSync,
  currentSchoolId,
  onSwitchSchoolId,
  onSchoolIdChange,
  isRealtimeActive = true,
  stats,
}) => {
  const [latency, setLatency] = useState<number | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [customSchoolInput, setCustomSchoolInput] = useState(currentSchoolId);

  const firebaseInfo = getFirebaseConfigSummary();

  const handleManualSyncAction = () => {
    if (onManualSync) {
      onManualSync();
    } else if (onForceSync) {
      onForceSync();
    }
  };

  const handleSwitchSchoolAction = (newId: string) => {
    if (onSwitchSchoolId) {
      onSwitchSchoolId(newId);
    } else if (onSchoolIdChange) {
      onSchoolIdChange(newId);
    }
  };

  const handleTestPing = async () => {
    setIsTesting(true);
    const res = await testFirebaseLiveConnection(currentSchoolId);
    setLatency(res.latencyMs);
    setIsTesting(false);
  };

  useEffect(() => {
    if (isOpen) {
      handleTestPing();
      setCustomSchoolInput(currentSchoolId);
    }
  }, [isOpen, currentSchoolId]);

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentSchoolId);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleApplySchoolCode = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = customSchoolInput.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    if (clean) {
      handleSwitchSchoolAction(clean);
    }
  };

  const journalsCount = stats?.journalsCount ?? data?.journals?.length ?? 0;
  const attendancesCount = stats?.attendancesCount ?? data?.attendances?.length ?? 0;
  const assessmentsCount = stats?.assessmentsCount ?? data?.assessments?.length ?? 0;
  const studentsCount = stats?.studentsCount ?? data?.students?.length ?? 0;
  const classesCount = stats?.classesCount ?? data?.classes?.length ?? 0;
  const teachersCount = stats?.teachersCount ?? data?.teachers?.length ?? 0;

  const totalRecords =
    journalsCount + attendancesCount + assessmentsCount + studentsCount + classesCount + teachersCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl bg-slate-900 border border-amber-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Flame Banner */}
        <div className="relative p-5 sm:p-6 bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-slate-900 border-b border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/30">
              <Flame className="w-7 h-7 fill-slate-950 text-slate-950 animate-pulse" />
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-slate-900 animate-ping" />
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-slate-900" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-extrabold text-white tracking-tight">
                  Firebase Live Multi-Perangkat
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  LIVE REALTIME
                </span>
              </div>
              <p className="text-xs text-amber-200/80">
                Terhubung otomatis antar semua perangkat & beda jaringan internet
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto custom-scrollbar">
          {/* Real-time Status Card */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Status 1: Database Link */}
            <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Status Koneksi</span>
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                <span className="text-sm font-bold text-emerald-400">
                  {syncStatus === 'syncing' ? 'Menyinkronkan...' : 'Terhubung Live'}
                </span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1 font-mono">
                {isRealtimeActive ? 'Real-time WebSocket Aktif' : 'Polling Active'}
              </div>
            </div>

            {/* Status 2: Ping Latency */}
            <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Latensi Firestore</span>
                <Activity className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">
                  {latency !== null ? `${latency} ms` : 'Mengukur...'}
                </span>
                <button
                  type="button"
                  onClick={handleTestPing}
                  disabled={isTesting}
                  title="Uji Ulang Latensi"
                  className="p-1 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors ml-auto"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin text-amber-400' : ''}`} />
                </button>
              </div>
              <div className="text-[10px] text-emerald-400 mt-1">
                asia-southeast1 (Jakarta/SG)
              </div>
            </div>

            {/* Status 3: Total Synced Docs */}
            <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Data Tersinkron</span>
                <Database className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <div className="text-sm font-bold text-white">
                {totalRecords} Dokumen Live
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                {journalsCount} Jurnal • {attendancesCount} Absensi
              </div>
            </div>
          </div>

          {/* Cross-device / Different Network Feature Highlight */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-slate-800/60 to-orange-500/10 border border-amber-500/20 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
              <Globe className="w-4 h-4 text-amber-400" />
              <span>Akses Multi-Perangkat Lintas Jaringan Internet</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Aplikasi ini terhubung langsung ke basis data <strong>Firebase Firestore Cloud</strong>. Anda dapat membuka link aplikasi ini di <strong>HP (Android/iOS)</strong> menggunakan paket data 4G/5G, dan di <strong>Laptop/PC</strong> menggunakan Wi-Fi sekolah atau rumah — semua data otomatis tersinkronisasi langsung secara <em>real-time</em>!
            </p>
            <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-400 flex-wrap">
              <span className="flex items-center gap-1">
                <Smartphone className="w-3.5 h-3.5 text-amber-400" /> Smartphone
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Laptop className="w-3.5 h-3.5 text-blue-400" /> Laptop / PC
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Wifi className="w-3.5 h-3.5 text-emerald-400" /> Beda Jaringan (Wi-Fi/4G/5G)
              </span>
            </div>
          </div>

          {/* Shareable Link & Sync Code */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-slate-200 flex items-center justify-between">
              <span>Buka di Perangkat Lain</span>
              <span className="text-[11px] font-normal text-slate-400">Bagikan tautan ini ke HP / Guru Lain</span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={currentUrl}
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono text-slate-300 select-all outline-none focus:border-amber-500"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95 flex-shrink-0"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-4 h-4 text-slate-950" />
                    <span>Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Salin Link</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Live School Database ID Workspace */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  <span>Kode Database Sekolah (Workspace ID)</span>
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Semua perangkat yang menggunakan kode ini berbagi database real-time yang sama.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-xs font-bold">
                {currentSchoolId}
              </span>
            </div>

            <form onSubmit={handleApplySchoolCode} className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={customSchoolInput}
                onChange={(e) => setCustomSchoolInput(e.target.value)}
                placeholder="misal: smpn1-bontomarannu"
                className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 font-mono outline-none focus:border-amber-500"
              />
              <button
                type="submit"
                disabled={customSchoolInput.trim() === currentSchoolId}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-xs font-bold text-white border border-slate-700 transition-colors"
              >
                Ganti Kode
              </button>
            </form>
          </div>

          {/* Data Breakdown in Firestore */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center gap-2.5">
              <BookOpen className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <div>
                <div className="text-xs font-bold text-white">{journalsCount}</div>
                <div className="text-[10px] text-slate-400">Jurnal Guru</div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center gap-2.5">
              <UserCheck className="w-4 h-4 text-blue-400 flex-shrink-0" />
              <div>
                <div className="text-xs font-bold text-white">{attendancesCount}</div>
                <div className="text-[10px] text-slate-400">Presensi Kelas</div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center gap-2.5">
              <FileCheck className="w-4 h-4 text-purple-400 flex-shrink-0" />
              <div>
                <div className="text-xs font-bold text-white">{assessmentsCount}</div>
                <div className="text-[10px] text-slate-400">Penilaian</div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center gap-2.5">
              <Users className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <div>
                <div className="text-xs font-bold text-white">{studentsCount}</div>
                <div className="text-[10px] text-slate-400">Siswa Aktif</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-950/90 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Sinkronisasi otomatis aktif di latar belakang saat ada perubahan.</span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleManualSyncAction}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
              <span>Sinkronkan Sekarang</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
