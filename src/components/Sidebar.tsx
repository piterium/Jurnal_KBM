import React, { useState } from 'react';
import { SchoolProfile } from '../types';
import { ThemeToggle } from './ThemeToggle';
import { useTheme } from '../context/ThemeContext';
import {
  BookOpen,
  CalendarCheck,
  GraduationCap,
  FileText,
  Settings,
  LayoutDashboard,
  School,
  Menu,
  X,
  User,
  ChevronRight,
  ShieldCheck,
  Users,
  CalendarDays,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  profile: SchoolProfile;
  classesCount: number;
  studentsCount: number;
  onQuickDownloadPdf?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  profile,
  classesCount,
  studentsCount,
  onQuickDownloadPdf,
}) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      description: 'Ringkasan & Aktivitas',
    },
    {
      id: 'schedule',
      label: 'Jadwal Mengajar',
      icon: CalendarDays,
      description: 'Hari, Jam, Mapel & Kelas',
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
    <div
      className={`flex flex-col h-full select-none transition-colors ${
        isLight
          ? 'bg-white border-r border-slate-200'
          : 'bg-[#0F172A] border-r border-slate-800'
      }`}
    >
      {/* Top Accent Stripe in Light Theme */}
      {isLight && (
        <div className="h-1.5 w-full bg-gradient-to-r from-emerald-600 via-green-500 to-yellow-400 flex-shrink-0" />
      )}

      {/* Brand Header */}
      <div
        className={`p-5 border-b transition-all duration-200 ${
          isLight
            ? 'bg-gradient-to-br from-emerald-600 via-green-600 to-yellow-500 border-emerald-700/30 text-white shadow-sm'
            : 'bg-gradient-to-br from-blue-950/40 to-slate-900 border-slate-800'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0 transition-all ${
              isLight
                ? 'bg-white/20 border border-white/30 shadow-md backdrop-blur-xs'
                : 'bg-blue-600 shadow-lg shadow-blue-600/30'
            }`}
          >
            <School className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-bold text-white tracking-tight truncate">
              {profile.schoolName || 'Sistem Jurnal'}
            </h2>
            <p
              className={`text-xs font-medium truncate ${
                isLight ? 'text-yellow-100' : 'text-blue-400'
              }`}
            >
              Administrasi Guru Mandiri
            </p>
          </div>
        </div>

        {/* Teacher Mini Profile Card */}
        <div
          className={`mt-4 p-3 rounded-xl flex items-center gap-2.5 transition-all ${
            isLight
              ? 'bg-black/15 border border-white/20 text-white backdrop-blur-xs shadow-inner'
              : 'bg-slate-900/90 border border-slate-800/80'
          }`}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${
              isLight
                ? 'bg-white/25 text-white border border-white/30'
                : 'bg-slate-800 text-blue-400 border border-slate-700'
            }`}
          >
            {profile.teacherName ? profile.teacherName.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
          </div>
          <div className="min-w-0 flex-1">
            <div
              className={`text-xs font-semibold truncate ${
                isLight ? 'text-white' : 'text-slate-200'
              }`}
            >
              {profile.teacherName || 'Nama Guru'}
            </div>
            <div
              className={`text-[11px] truncate ${
                isLight ? 'text-yellow-100' : 'text-slate-400'
              }`}
            >
              {profile.subject || 'Mata Pelajaran'} • {profile.academicYear}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        <div
          className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider flex items-center justify-between ${
            isLight ? 'text-emerald-800' : 'text-slate-400'
          }`}
        >
          <span>Menu Administrasi</span>
          {isLight && (
            <span className="h-1.5 w-6 rounded-full bg-gradient-to-r from-emerald-500 to-yellow-400" />
          )}
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          let btnClass = '';
          if (isActive) {
            btnClass = isLight
              ? 'bg-gradient-to-r from-emerald-600 via-green-600 to-yellow-500 text-white shadow-md shadow-emerald-700/25 font-bold border-l-4 border-yellow-300'
              : 'bg-blue-600 text-white shadow-md shadow-blue-600/20 font-semibold';
          } else {
            btnClass = isLight
              ? 'text-slate-700 hover:bg-emerald-50/90 hover:text-emerald-900 hover:border-l-4 hover:border-emerald-400/80'
              : 'text-slate-300 hover:bg-slate-800/80 hover:text-white';
          }

          return (
            <button
              key={item.id}
              id={`nav-item-${item.id}`}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all duration-150 group cursor-pointer ${btnClass}`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon
                  className={`w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-110 ${
                    isActive
                      ? isLight
                        ? 'text-yellow-200'
                        : 'text-white'
                      : isLight
                      ? 'text-slate-500 group-hover:text-emerald-600'
                      : 'text-slate-400 group-hover:text-blue-400'
                  }`}
                />
                <div className="min-w-0">
                  <div className="text-xs leading-none truncate">{item.label}</div>
                  <div
                    className={`text-[10px] mt-1 truncate ${
                      isActive
                        ? isLight
                          ? 'text-yellow-100/90'
                          : 'text-blue-100'
                        : isLight
                        ? 'text-slate-500 group-hover:text-emerald-700'
                        : 'text-slate-400'
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
                        ? isLight
                          ? 'bg-white/25 text-white border border-white/30'
                          : 'bg-blue-700 text-white'
                        : isLight
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
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
                        ? isLight
                          ? 'bg-white/25 text-white font-bold'
                          : 'bg-blue-700 text-white'
                        : isLight
                        ? 'bg-slate-100 text-slate-700 border border-slate-200'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {item.count}
                  </span>
                )}
                {isActive && (
                  <ChevronRight
                    className={`w-3.5 h-3.5 ${
                      isLight ? 'text-yellow-200' : 'text-blue-200'
                    }`}
                  />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Quick Action & Stats Footer */}
      <div
        className={`p-4 border-t space-y-3 transition-colors ${
          isLight
            ? 'border-slate-200 bg-slate-50/80'
            : 'border-slate-800 bg-[#0B1120]/90'
        }`}
      >
        <div
          className={`flex items-center justify-between gap-2 p-1.5 rounded-xl border ${
            isLight
              ? 'bg-white border-slate-200 shadow-xs'
              : 'bg-slate-800/40 border-slate-800'
          }`}
        >
          <span
            className={`text-[11px] font-semibold pl-2 ${
              isLight ? 'text-slate-600' : 'text-slate-400'
            }`}
          >
            Tema Tampilan
          </span>
          <ThemeToggle variant="pill" showPaletteMenu={false} />
        </div>

        <div className="grid grid-cols-2 gap-2 text-center">
          <div
            className={`p-2 rounded-lg border ${
              isLight
                ? 'bg-white border-slate-200 shadow-xs'
                : 'bg-slate-800/40 border-slate-800'
            }`}
          >
            <div
              className={`text-[10px] ${
                isLight ? 'text-slate-500' : 'text-slate-400'
              }`}
            >
              Kelas Binaan
            </div>
            <div
              className={`text-sm font-bold ${
                isLight ? 'text-emerald-700' : 'text-white'
              }`}
            >
              {classesCount} Kelas
            </div>
          </div>
          <div
            className={`p-2 rounded-lg border ${
              isLight
                ? 'bg-white border-slate-200 shadow-xs'
                : 'bg-slate-800/40 border-slate-800'
            }`}
          >
            <div
              className={`text-[10px] ${
                isLight ? 'text-slate-500' : 'text-slate-400'
              }`}
            >
              Total Siswa
            </div>
            <div
              className={`text-sm font-bold ${
                isLight ? 'text-emerald-700' : 'text-white'
              }`}
            >
              {studentsCount} Siswa
            </div>
          </div>
        </div>

        <div
          className={`flex items-center justify-center gap-1.5 text-[10px] text-center pt-1 ${
            isLight ? 'text-emerald-800 font-medium' : 'text-slate-400'
          }`}
        >
          <ShieldCheck
            className={`w-3.5 h-3.5 ${
              isLight ? 'text-emerald-600' : 'text-blue-400'
            }`}
          />
          <span>Sistem Administrasi Guru Resmi</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Top App Bar with Hamburger */}
      <div
        className={`md:hidden flex items-center justify-between p-3.5 sticky top-0 z-40 transition-colors ${
          isLight
            ? 'bg-gradient-to-r from-emerald-700 via-green-600 to-yellow-500 text-white shadow-md border-b border-emerald-800/30'
            : 'bg-[#0F172A] border-b border-slate-800'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <button
            id="btn-mobile-menu-toggle"
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className={`p-2 rounded-xl cursor-pointer transition-colors ${
              isLight
                ? 'bg-black/15 text-white hover:bg-black/25 border border-white/20'
                : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700'
            }`}
            aria-label="Buka Menu Navigasi"
          >
            {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-white truncate">
              {profile.schoolName || 'Administrasi Guru'}
            </h1>
            <p
              className={`text-[11px] font-medium truncate ${
                isLight ? 'text-yellow-100' : 'text-blue-400'
              }`}
            >
              {profile.teacherName} • {profile.subject}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <ThemeToggle variant="compact" showPaletteMenu={false} />
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
            className={`w-72 max-w-[85vw] h-full shadow-2xl animate-in slide-in-from-left duration-200 ${
              isLight ? 'bg-white' : 'bg-[#0F172A]'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {SidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
