import React, { useState, useEffect } from 'react';
import {
  Flame,
  X,
  RefreshCw,
  Database,
  CloudCheck,
  CloudOff,
  ShieldCheck,
  Zap,
  Activity,
  Layers,
  Users,
  UserCheck,
  BookOpen,
  CalendarCheck,
  GraduationCap,
  Copy,
  Check,
  ArrowDownToLine,
  Download,
} from 'lucide-react';
import { AppData } from '../types';
import {
  getFirebaseConfigSummary,
  testFirebaseLiveConnection,
  saveUserAppDataToFirestore,
  loadUserAppDataFromFirestore,
} from '../firebase/firestoreService';
import { auth, User } from '../firebase/firebase';
import { exportBackup } from '../utils/storage';

interface FirebaseLiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  syncStatus: 'synced' | 'syncing' | 'offline' | 'error';
  data: AppData;
  user: User | null;
  onManualSync: () => void;
  onDataReloaded?: (newData: AppData) => void;
}

export const FirebaseLiveModal: React.FC<FirebaseLiveModalProps> = ({
  isOpen,
  onClose,
  syncStatus,
  data,
  user,
  onManualSync,
  onDataReloaded,
}) => {
  const [latency, setLatency] = useState<number | null>(null);
  const [isPinging, setIsPinging] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isReloading, setIsReloading] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>(new Date().toLocaleTimeString('id-ID'));

  const config = getFirebaseConfigSummary();

  const handlePing = async () => {
    setIsPinging(true);
    const res = await testFirebaseLiveConnection(user?.uid);
    setLatency(res.latencyMs);
    setIsPinging(false);
    setLastSyncTime(new Date().toLocaleTimeString('id-ID'));
  };

  useEffect(() => {
    if (isOpen) {
      handlePing();
    }
  }, [isOpen, user]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleForceCloudReload = async () => {
    if (!user) {
      alert('Sesi Firebase belum aktif. Menggunakan penyimpanan lokal.');
      return;
    }
    if (
      !window.confirm(
        'Muat ulang data langsung dari Firebase Cloud? Data di layar akan disinkronkan dengan data terbaru di server Firestore.'
      )
    ) {
      return;
    }
    setIsReloading(true);
    try {
      const cloudData = await loadUserAppDataFromFirestore(user.uid);
      if (cloudData) {
        if (onDataReloaded) onDataReloaded(cloudData);
        alert('Data berhasil dimuat ulang dari Firebase Firestore!');
      } else {
        alert('Tidak ada data cloud ditemukan atau belum pernah disimpan ke cloud.');
      }
    } catch (err) {
      console.error(err);
      alert('Gagal memuat ulang data dari Firebase.');
    } finally {
      setIsReloading(false);
    }
  };

  if (!isOpen) return null;

  const totalDocuments =
    1 + // Profile
    data.classes.length +
    data.students.length +
    (data.teachers?.length || 0) +
    data.journals.length +
    data.attendances.length +
    data.assessments.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-[#0F172A] border border-slate-700/80 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-[#0B1120] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  Status Firebase Firestore Live
                </h3>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  LIVE CONNECTED
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Pusat monitoring basis data cloud Firestore & sinkronisasi real-time
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Main Status Hero Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-[#0B1120] to-[#131E32] border border-slate-800 shadow-inner">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Status Sinkronisasi Saat Ini
                </span>
                <div className="flex items-center gap-2">
                  {syncStatus === 'synced' && (
                    <>
                      <CloudCheck className="w-5 h-5 text-emerald-400" />
                      <span className="text-lg font-bold text-emerald-400">
                        Tersinkronisasi Penuh ke Cloud
                      </span>
                    </>
                  )}
                  {syncStatus === 'syncing' && (
                    <>
                      <RefreshCw className="w-5 h-5 text-blue-400 animate-spin" />
                      <span className="text-lg font-bold text-blue-400">
                        Sedang Mengunggah / Menyinkronkan...
                      </span>
                    </>
                  )}
                  {syncStatus === 'offline' && (
                    <>
                      <CloudCheck className="w-5 h-5 text-emerald-400" />
                      <span className="text-lg font-bold text-white">
                        Lokal Aktif (Siap Terhubung)
                      </span>
                    </>
                  )}
                  {syncStatus === 'error' && (
                    <>
                      <CloudOff className="w-5 h-5 text-amber-400" />
                      <span className="text-lg font-bold text-amber-400">
                        Penyimpanan Lokal Aktif
                      </span>
                    </>
                  )}
                </div>
                <p className="text-xs text-slate-400">
                  Setiap perubahan data jurnal, presensi, & nilai disimpan otomatis ke Firestore.
                </p>
              </div>

              {/* Ping / Latency metric */}
              <div className="flex items-center gap-3 self-start sm:self-auto bg-slate-900/80 px-4 py-2.5 rounded-xl border border-slate-800">
                <div>
                  <div className="text-[10px] text-slate-400">Respon Cloud (Latency)</div>
                  <div className="text-sm font-bold text-white flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-blue-400" />
                    <span>{latency !== null ? `${latency} ms` : 'Mengukur...'}</span>
                  </div>
                </div>
                <button
                  onClick={handlePing}
                  disabled={isPinging}
                  title="Test Ping ke Firebase"
                  className="p-1.5 rounded-lg bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Cloud Database Config Info */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-400" />
              <span>Identitas & Konfigurasi Basis Data Cloud</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Project ID */}
              <div className="p-3.5 rounded-xl bg-[#0B1120] border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block">Firebase Project ID</span>
                  <span className="font-mono font-bold text-white select-all">
                    {config.projectId}
                  </span>
                </div>
                <button
                  onClick={() => copyToClipboard(config.projectId, 'proj')}
                  className="p-1 text-slate-400 hover:text-white"
                  title="Salin Project ID"
                >
                  {copiedKey === 'proj' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Firestore Database ID */}
              <div className="p-3.5 rounded-xl bg-[#0B1120] border border-slate-800 flex items-center justify-between">
                <div className="min-w-0 pr-2">
                  <span className="text-[10px] text-slate-400 block">Firestore Database ID</span>
                  <span className="font-mono font-bold text-blue-400 truncate block select-all" title={config.databaseId}>
                    {config.databaseId}
                  </span>
                </div>
                <button
                  onClick={() => copyToClipboard(config.databaseId, 'db')}
                  className="p-1 text-slate-400 hover:text-white flex-shrink-0"
                  title="Salin Database ID"
                >
                  {copiedKey === 'db' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Auth User UID */}
              <div className="p-3.5 rounded-xl bg-[#0B1120] border border-slate-800 flex items-center justify-between">
                <div className="min-w-0 pr-2">
                  <span className="text-[10px] text-slate-400 block">Auth User UID</span>
                  <span className="font-mono text-slate-300 truncate block select-all" title={user?.uid || 'Anonim / Sesi Lokal'}>
                    {user?.uid || 'Anonymous'}
                  </span>
                </div>
                {user?.uid && (
                  <button
                    onClick={() => copyToClipboard(user.uid, 'uid')}
                    className="p-1 text-slate-400 hover:text-white flex-shrink-0"
                    title="Salin UID"
                  >
                    {copiedKey === 'uid' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>

              {/* Auth Mode & Region */}
              <div className="p-3.5 rounded-xl bg-[#0B1120] border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block">Metode Autentikasi</span>
                  <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {user?.email || 'Google AI Studio Auth (Live)'}
                  </span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  asia-southeast1
                </span>
              </div>
            </div>
          </div>

          {/* Collection & Document Stats */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-400" />
                <span>Dokumen Tersimpan di Firebase ({totalDocuments} Total)</span>
              </h4>
              <span className="text-[11px] text-slate-400">
                Pembaruan Terakhir: {lastSyncTime}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <div className="p-3 rounded-xl bg-[#0B1120] border border-slate-800/80 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-xs">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Kelas / Rombel</span>
                  <span className="text-sm font-bold text-white">{data.classes.length} Dokumen</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#0B1120] border border-slate-800/80 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xs">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Data Siswa</span>
                  <span className="text-sm font-bold text-white">{data.students.length} Dokumen</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#0B1120] border border-slate-800/80 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-xs">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Jurnal Mengajar</span>
                  <span className="text-sm font-bold text-white">{data.journals.length} Dokumen</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#0B1120] border border-slate-800/80 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-xs">
                  <CalendarCheck className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Presensi Sesi</span>
                  <span className="text-sm font-bold text-white">{data.attendances.length} Dokumen</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#0B1120] border border-slate-800/80 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold text-xs">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Buku Penilaian</span>
                  <span className="text-sm font-bold text-white">{data.assessments.length} Dokumen</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#0B1120] border border-slate-800/80 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold text-xs">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Data Guru</span>
                  <span className="text-sm font-bold text-white">{data.teachers?.length || 0} Dokumen</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="p-4 rounded-xl bg-[#0B1120] border border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onManualSync();
                  handlePing();
                }}
                disabled={syncStatus === 'syncing'}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
                <span>Sinkronkan ke Cloud Sekarang</span>
              </button>

              <button
                type="button"
                onClick={handleForceCloudReload}
                disabled={isReloading}
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 transition-all cursor-pointer disabled:opacity-50"
              >
                <ArrowDownToLine className={`w-3.5 h-3.5 ${isReloading ? 'animate-bounce' : ''}`} />
                <span>Tarik Data Cloud</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => exportBackup(data)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-semibold border border-slate-700/60 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span>Cadangkan JSON</span>
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-[#0B1120] flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Real-time listener aktif via Firebase Firestore SDK</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold cursor-pointer transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
