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
  RefreshCw,
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  profile: SchoolProfile;
  classesCount: number;
  studentsCount: number;
  teachersCount?: number;
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
  syncStatus,
  onManualSync,
  onQuickDownloadPdf,
}) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      description: 'Ringkasan & Aktivitas',
    },
    {
      id: 'journal',
      label: 'Jurnal Mengajar',
      icon: BookOpen,
      badge: 'Utama',
      description: 'Agenda & Materi Harian',
    },
    {
      id: 'attendance',
      label: 'Presensi Siswa',
      icon: CalendarCheck,
      description: 'H / S / I / A Harian',
    },
    {
      id: 'gradebook',
      label: 'Buku Nilai',
      icon: GraduationCap,
      description: 'TP, STS, SAS & KKM',
    },
    {
      id: 'students',
      label: 'Kelola Siswa',
      icon: Users,
      count: studentsCount,
      description: 'Data Induk & NISN',
    },
    {
      id: 'teachers',
      label: 'Data Guru',
      icon: UserCheck,
      count: teachersCount,
      description: 'Pendidik & Tenaga Kependidikan',
    },
    {
      id: 'report',
      label: 'Laporan Bulanan',
      icon: FileText,
      description: 'Rekap Presensi & Jam Mengajar',
    },
    {
      id: 'settings',
      label: 'Pengaturan & Profil',
      icon: Settings,
      description: 'Identitas Sekolah & Backup Data',
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#0F172A] border-r border-slate-800 text-slate-200">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800/80 bg-slate-900/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-400 p-0.5 shadow-lg shadow-blue-500/20 flex-shrink-0 flex items-center justify-center">
            {profile.logoUrl ? (
              <img
                src={profile.logoUrl}
                alt="Logo Sekolah"
                className="w-full h-full object-contain rounded-[10px] bg-slate-950/80"
              />
            ) : (
              <div className="w-full h-full rounded-[10px] bg-slate-950/80 flex items-center justify-center text-blue-400">
                <School className="w-5 h-5" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-bold text-white tracking-tight truncate">
              {profile.schoolName || 'Sistem Administrasi Guru'}
            </h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] text-slate-400 font-medium truncate">
                {profile.academicYear} • {profile.semester}
              </span>
            </div>
          </div>
        </div>

        {/* Teacher Mini Badge */}
        <div className="mt-3 p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/60 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0 font-bold text-xs">
            <User className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-white truncate">
              {profile.teacherName || 'Guru Mata Pelajaran'}
            </p>
            <p className="text-[10px] text-blue-300 font-medium truncate">
              {profile.subject || 'Mapel Belum Diisi'} {profile.teacherNip && `• NIP. ${profile.teacherNip}`}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1 custom-scrollbar">
        <div className="px-3 py-1 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
          Menu Administrasi
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-item-${item.id}`}
              onClick={() => {
                setActiveTab(item.id);
                setIsMobileOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all group cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon
                  className={`w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-110 ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'
                  }`}
                />
                <div className="text-left min-w-0">
                  <div className="truncate">{item.label}</div>
                  <div
                    className={`text-[10px] truncate hidden sm:block ${
                      isActive ? 'text-blue-100 opacity-90' : 'text-slate-400'
                    }`}
                  >
                    {item.description}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 ml-2 flex-shrink-0">
                {item.badge && (
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
                {item.count !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
                      isActive
                        ? 'bg-blue-700 text-white'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {item.count}
                  </span>
                )}
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-blue-200" />}
              </div>
            </button>
          );
        })}
      </div>

      {/* Quick Action & Stats Footer */}
      <div className="p-4 border-t border-slate-800 bg-[#0B1120]/90 space-y-3">
        {/* Persistence & Theme Row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 p-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center flex-shrink-0">
                <CloudCheck className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-bold text-white truncate">
                  Penyimpanan
                </div>
                <div className="text-[10px] text-emerald-400 truncate">
                  {syncStatus === 'syncing' ? 'Menyimpan...' : 'Otomatis'}
                </div>
              </div>
            </div>
            <button
              onClick={onManualSync}
              title="Simpan & Sinkronkan"
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>

          {/* Compact Theme Switcher for Sidebar */}
          <ThemeToggle variant="compact" />
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
          className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all active:scale-[0.98] cursor-pointer"
        >
          <FileDown className="w-4 h-4 text-white" />
          <span>Unduh Laporan PDF</span>
        </button>

        <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 text-center">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
          <span>Sistem Administrasi Guru Resmi</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Top App Bar with Hamburger & Theme Switcher */}
      <div className="md:hidden flex items-center justify-between p-3.5 bg-[#0F172A] border-b border-slate-800 sticky top-0 z-40">
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
              {profile.schoolName || 'Administrasi Guru'}
            </h1>
            <p className="text-[11px] text-blue-400 font-medium truncate">
              {profile.teacherName} • {profile.subject}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle variant="icon" />
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
