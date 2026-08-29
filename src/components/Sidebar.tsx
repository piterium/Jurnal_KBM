import React, { useState } from 'react';
import { SchoolProfile } from '../types';
import {
  BookOpen,
  CalendarCheck,
  GraduationCap,
  FileText,
  Settings,
  LayoutDashboard,
  FileDown,
  School,
  Menu,
  X,
  User,
  ChevronRight,
  ShieldCheck,
  Users,
  UserCheck,
  CloudCheck,
  CloudOff,
  RefreshCw,
  LogIn,
  LogOut,
} from 'lucide-react';
import { auth, googleProvider, signInWithPopup, signOut, type User as FirebaseUser } from '../firebase/firebase';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  profile: SchoolProfile;
  classesCount: number;
  studentsCount: number;
  teachersCount?: number;
  user: FirebaseUser | null;
  isAuthLoading: boolean;
  syncStatus: 'synced' | 'syncing' | 'offline' | 'error';
  onManualSync: () => void;
  onQuickDownloadPdf: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  profile,
  classesCount,
  studentsCount,
  teachersCount = 11,
  user,
  isAuthLoading,
  syncStatus,
  onManualSync,
  onQuickDownloadPdf,
}) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleSignIn = async () => {
    setIsLoggingIn(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error('Sign in error:', err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      description: 'Ringkasan & Statistik',
    },
    {
      id: 'journal',
      label: 'Jurnal Mengajar',
      icon: BookOpen,
      description: 'Agenda & Refleksi KBM',
    },
    {
      id: 'attendance',
      label: 'Presensi Siswa',
      icon: CalendarCheck,
      description: 'Rekap Kehadiran Harian',
    },
    {
      id: 'grades',
      label: 'Daftar Nilai',
      icon: GraduationCap,
      description: 'Leger & Asesmen Siswa',
    },
    {
      id: 'students',
      label: 'Daftar Siswa',
      icon: Users,
      description: 'Data & Upload Per Kelas',
    },
    {
      id: 'teachers',
      label: 'Daftar Guru & Mapel',
      icon: UserCheck,
      description: 'Tenaga Pendidik & Pengampu',
    },
    {
      id: 'report',
      label: 'Laporan Bulanan & PDF',
      icon: FileText,
      description: 'Ekspor Dokumen Kedinasan',
    },
    {
      id: 'settings',
      label: 'Data Master & Profil',
      icon: Settings,
      description: 'Sekolah, Logo, Kelas & Siswa',
    },
  ];

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    setIsMobileOpen(false);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#0F172A] text-[#E2E8F0] border-r border-slate-800 select-none">
      {/* Brand & School Header */}
      <div className="p-5 border-b border-slate-800">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20 flex-shrink-0 overflow-hidden p-1">
            {profile.logoUrl ? (
              <img
                src={profile.logoUrl}
                alt="Logo"
                className="w-full h-full object-contain"
              />
            ) : (
              <School className="w-6 h-6 text-white" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-sm sm:text-base font-bold text-white tracking-wide truncate" title={profile.schoolName}>
              {profile.schoolName}
            </h1>
            <p className="text-[11px] text-slate-400 truncate">
              NPSN: {profile.npsn || '30101234'}
            </p>
          </div>
        </div>

        {/* Academic Period Badge */}
        <div className="mt-3.5 flex items-center justify-between px-3 py-1.5 rounded-lg bg-[#0B1120] border border-slate-800 text-[11px]">
          <span className="text-slate-400 font-medium">Tahun Ajaran</span>
          <span className="font-bold text-blue-400">
            {profile.academicYear} • {profile.semester}
          </span>
        </div>
      </div>

      {/* Teacher Profile Card */}
      <div className="px-4 py-3 border-b border-slate-800 bg-[#0B1120]/60">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 flex-shrink-0">
            <User className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-white truncate" title={profile.teacherName}>
              {profile.teacherName}
            </div>
            <div className="text-[11px] text-blue-400 truncate font-medium">
              Mapel: {profile.subject}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 scrollbar-thin">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Menu Utama Guru
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`sidebar-tab-${item.id}`}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-left text-xs sm:text-sm transition-all group cursor-pointer ${
                isActive
                  ? 'bg-blue-600/15 text-white font-bold border-l-3 border-blue-500 shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white font-medium'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors flex-shrink-0 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                      : 'bg-slate-800/80 text-slate-400 group-hover:text-white group-hover:bg-slate-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className={`truncate ${isActive ? 'text-blue-400' : 'text-white'}`}>
                    {item.label}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate font-normal group-hover:text-slate-300">
                    {item.description}
                  </div>
                </div>
              </div>
              <ChevronRight
                className={`w-4 h-4 transition-transform flex-shrink-0 ${
                  isActive
                    ? 'text-blue-400 translate-x-0.5'
                    : 'text-slate-600 group-hover:text-slate-400'
                }`}
              />
            </button>
          );
        })}
      </div>

      {/* Quick Action & Stats Footer */}
      <div className="p-4 border-t border-slate-800 bg-[#0B1120]/90 space-y-3">
        {/* Firebase Cloud Sync Card */}
        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'User'}
                className="w-7 h-7 rounded-full object-cover border border-blue-500/30 flex-shrink-0"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center flex-shrink-0">
                <User className="w-3.5 h-3.5" />
              </div>
            )}
            <div className="min-w-0">
              <div className="text-[11px] font-bold text-white truncate">
                {user ? user.displayName || user.email : 'Belum Login Cloud'}
              </div>
              <div className="flex items-center gap-1 text-[10px]">
                {syncStatus === 'syncing' && (
                  <span className="text-blue-400 flex items-center gap-1">
                    <RefreshCw className="w-2.5 h-2.5 animate-spin" /> Menyimpan...
                  </span>
                )}
                {syncStatus === 'synced' && (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CloudCheck className="w-2.5 h-2.5" /> Cloud Aktif
                  </span>
                )}
                {syncStatus === 'offline' && (
                  <span className="text-slate-400 flex items-center gap-1">
                    <CloudOff className="w-2.5 h-2.5" /> Mode Lokal
                  </span>
                )}
                {syncStatus === 'error' && (
                  <span className="text-rose-400 flex items-center gap-1">
                    <CloudOff className="w-2.5 h-2.5" /> Gagal Sync
                  </span>
                )}
              </div>
            </div>
          </div>

          <div>
            {isAuthLoading ? (
              <span className="text-[10px] text-slate-500">...</span>
            ) : user ? (
              <button
                onClick={handleSignOut}
                title="Keluar dari akun Google"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={handleSignIn}
                disabled={isLoggingIn}
                title="Login dengan Akun Google untuk sinkronisasi Firebase"
                className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all disabled:opacity-50"
              >
                <LogIn className="w-3 h-3" />
                <span>{isLoggingIn ? '...' : 'Login'}</span>
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="p-2 rounded-lg bg-slate-800/40 border border-slate-800">
            <div className="text-[10px] text-slate-400">Kelas Binaan</div>
            <div className="text-sm font-bold text-white">{classesCount} Kelas</div>
          </div>
          <div className="p-2 rounded-lg bg-slate-800/40 border border-slate-800">
            <div className="text-[10px] text-slate-400">Total Siswa</div>
            <div className="text-sm font-bold text-white">{studentsCount} Siswa</div>
          </div>
        </div>

        <button
          id="btn-sidebar-quick-pdf"
          onClick={() => {
            onQuickDownloadPdf();
            setIsMobileOpen(false);
          }}
          className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2.5 px-3.5 rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-95 cursor-pointer tracking-wide"
          title="Unduh Laporan Bulanan Resmi PDF"
        >
          <FileDown className="w-4 h-4 text-white" />
          <span>Cetak / Unduh PDF</span>
        </button>

        <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 text-center">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
          <span>Sistem Administrasi Guru Resmi • Firebase</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Top App Bar with Menu Button */}
      <div className="md:hidden bg-[#0F172A] text-white border-b border-slate-800 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3 min-w-0">
          <button
            id="btn-mobile-menu-toggle"
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700 cursor-pointer"
            aria-label="Buka Menu Navigasi"
          >
            {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-white truncate">
              {profile.schoolName}
            </h1>
            <p className="text-[11px] text-blue-400 font-medium truncate">
              {profile.teacherName} • {profile.subject}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!user && (
            <button
              onClick={handleSignIn}
              disabled={isLoggingIn}
              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold cursor-pointer"
            >
              Login
            </button>
          )}
          <button
            onClick={onQuickDownloadPdf}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer flex-shrink-0"
          >
            <FileDown className="w-3.5 h-3.5 text-white" />
            <span>PDF</span>
          </button>
        </div>
      </div>

      {/* Desktop Persistent Left Sidebar */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 flex-shrink-0 h-screen sticky top-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer (Slide-Over with Backdrop) */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileOpen(false)}
          />
          {/* Drawer Container */}
          <div className="relative flex-1 flex flex-col max-w-xs w-full h-full z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
