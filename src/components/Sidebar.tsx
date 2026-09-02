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
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  profile: SchoolProfile;
  classesCount: number;
  studentsCount: number;
  teachersCount?: number;
  onQuickDownloadPdf: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  profile,
  classesCount,
  studentsCount,
  teachersCount = 0,
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
      description: 'Hadir, Izin, Sakit, Alpa',
    },
    {
      id: 'gradebook',
      label: 'Daftar Nilai',
      icon: GraduationCap,
      description: 'Formatif & Sumatif',
    },
    {
      id: 'students',
      label: 'Data Siswa & Kelas',
      icon: Users,
      count: studentsCount,
      description: 'Daftar & Status Siswa',
    },
    {
      id: 'teachers',
      label: 'Data Guru Pengajar',
      icon: UserCheck,
      count: teachersCount,
      description: 'Direktori Pendidik & Mapel',
    },
    {
      id: 'report',
      label: 'Rekap & Ekspor PDF',
      icon: FileText,
      description: 'Cetak Laporan Bulanan',
    },
    {
      id: 'settings',
      label: 'Pengaturan Sekolah',
      icon: Settings,
      description: 'Profil Guru & Database',
    },
  ];

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    setIsMobileOpen(false);
  };

  const SidebarContent = (
    <div className="flex flex-col h-full bg-[#0F172A] border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 bg-gradient-to-br from-blue-950/40 to-slate-900">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/30 flex-shrink-0">
            <School className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-bold text-white tracking-tight truncate">
              {profile.schoolName || 'Sistem Jurnal'}
            </h2>
            <p className="text-xs text-blue-400 font-medium truncate">
              Administrasi Guru Mandiri
            </p>
          </div>
        </div>

        {/* Teacher Mini Profile Card */}
        <div className="mt-4 p-3 rounded-xl bg-slate-900/90 border border-slate-800/80 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-blue-400 font-bold text-xs flex-shrink-0 border border-slate-700">
            {profile.teacherName ? profile.teacherName.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold text-slate-200 truncate">
              {profile.teacherName || 'Nama Guru'}
            </div>
            <div className="text-[11px] text-slate-400 truncate">
              {profile.subject || 'Mata Pelajaran'} • {profile.academicYear}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Menu Administrasi
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              id={`nav-item-${item.id}`}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all duration-150 group cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20 font-semibold'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon
                  className={`w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-110 ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'
                  }`}
                />
                <div className="min-w-0">
                  <div className="text-xs leading-none truncate">{item.label}</div>
                  <div
                    className={`text-[10px] mt-1 truncate ${
                      isActive ? 'text-blue-100' : 'text-slate-400'
                    }`}
                  >
                    {item.description}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 ml-2 flex-shrink-0">
                {item.badge && (
                  <span
                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                      isActive
                        ? 'bg-blue-700 text-white'
                        : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
                {typeof item.count === 'number' && item.count > 0 && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
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
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-slate-400">Tema Tampilan</span>
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

        <div className="flex items-center gap-1.5 sm:gap-2">
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

      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:block w-64 lg:w-72 h-screen sticky top-0 z-30 flex-shrink-0">
        {SidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        >
          <div
            className="w-72 max-w-[85vw] h-full bg-[#0F172A] shadow-2xl animate-in slide-in-from-left duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {SidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
