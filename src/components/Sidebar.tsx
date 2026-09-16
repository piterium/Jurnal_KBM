import React, { useState } from 'react';
import { SchoolProfile } from '../types';
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
  Download,
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

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      description: 'Ringkasan & Statistik',
    },
    {
      id: 'schedule',
      label: 'Jadwal Mengajar',
      icon: CalendarDays,
      description: 'Agenda Mingguan Guru',
    },
    {
      id: 'journal',
      label: 'Jurnal Mengajar',
      icon: BookOpen,
      description: 'Catatan KBM Harian',
    },
    {
      id: 'attendance',
      label: 'Presensi Siswa',
      icon: CalendarCheck,
      description: 'Daftar Hadir Harian',
    },
    {
      id: 'gradebook',
      label: 'Buku Nilai',
      icon: GraduationCap,
      description: 'Daftar Nilai & KKM',
    },
    {
      id: 'reports',
      label: 'Cetak Laporan',
      icon: FileText,
      description: 'Ekspor PDF & Cetak',
    },
    {
      id: 'students',
      label: 'Data Siswa',
      icon: Users,
      description: 'Database Siswa Per Kelas',
      count: studentsCount,
    },
    {
      id: 'settings',
      label: 'Pengaturan',
      icon: Settings,
      description: 'Profil Sekolah & Kelas',
    },
  ];

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    setIsMobileOpen(false);
  };

  const SidebarContent = (
    <div className="flex flex-col h-full select-none bg-[#0F1117] border-r border-slate-800/80">
      {/* Brand Header */}
      <div className="p-4 border-b bg-[#141722] border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-[#F1B33B] text-slate-950 shadow-md shadow-amber-500/20">
            <School className="w-5 h-5 text-slate-950" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-bold text-white tracking-tight truncate">
              {profile.schoolName || 'SMP NEGERI 1 NUSANTARA'}
            </h2>
            <p className="text-xs font-mono truncate text-slate-400">
              NPSN: {profile.npsn || '20108921'}
            </p>
          </div>
        </div>

        {/* Academic Year Row */}
        <div className="mt-3 flex items-center justify-between text-xs px-1">
          <span className="text-slate-400 font-medium">Tahun Ajaran</span>
          <span className="font-semibold px-2.5 py-0.5 rounded-full text-[11px] bg-[#1C202C] text-[#F1B33B] border border-amber-500/20">
            {profile.academicYear || '2025/2026'} • {profile.semester || 'Ganjil'}
          </span>
        </div>

        {/* Teacher Mini Profile Card */}
        <div className="mt-3 p-2.5 rounded-xl flex items-center gap-3 bg-[#181B26] border border-slate-800">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 bg-[#1C202D] border border-amber-500/30 text-[#F1B33B]">
            <User className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold truncate text-white">
              {profile.teacherName || 'Siti Rahmawati, S.Pd., Gr.'}
            </div>
            <div className="text-[11px] font-semibold truncate text-[#F1B33B]">
              Mapel: {profile.subject || 'Informatika'}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          <span>MENU UTAMA GURU</span>
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          const btnClass = isActive
            ? 'bg-[#181C28] border border-amber-500/30 text-white shadow-md shadow-amber-500/5 font-semibold'
            : 'text-slate-300 hover:bg-[#181C28]/70 hover:text-white';
          const iconBoxClass = isActive
            ? 'bg-[#F1B33B] text-slate-950 shadow-sm'
            : 'bg-[#181B26] border border-slate-700/60 text-slate-400 group-hover:border-amber-400/40 group-hover:text-[#F1B33B]';

          return (
            <button
              key={item.id}
              id={`nav-item-${item.id}`}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all duration-150 group cursor-pointer ${btnClass}`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105 ${iconBoxClass}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className={`text-xs leading-none truncate ${isActive ? 'text-[#F1B33B] font-bold' : 'text-white font-medium'}`}>
                    {item.label}
                  </div>
                  <div className="text-[10px] mt-0.5 truncate text-slate-400">
                    {item.description}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 ml-2 flex-shrink-0">
                {typeof item.count === 'number' && item.count > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                    isActive
                      ? 'bg-[#F1B33B] text-slate-950 font-bold'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}>
                    {item.count}
                  </span>
                )}
                <ChevronRight className={`w-3.5 h-3.5 ${isActive ? 'text-[#F1B33B]' : 'text-slate-600 group-hover:text-slate-400'}`} />
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer / Quick Info & PDF Button */}
      <div className="p-3.5 border-t border-slate-800 bg-[#141722] space-y-3 flex-shrink-0">
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="p-2 rounded-xl border border-slate-800/80 bg-[#0F1117]/80">
            <div className="text-[10px] text-slate-400">Total Kelas</div>
            <div className="text-sm font-bold text-white">{classesCount} Kelas</div>
          </div>
          <div className="p-2 rounded-xl border border-slate-800/80 bg-[#0F1117]/80">
            <div className="text-[10px] text-slate-400">Total Siswa</div>
            <div className="text-sm font-bold text-white">{studentsCount} Siswa</div>
          </div>
        </div>

        {/* Primary Download / Print PDF CTA Button */}
        <button
          type="button"
          onClick={onQuickDownloadPdf}
          className="w-full py-2.5 px-4 rounded-xl font-bold text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 bg-[#F1B33B] hover:bg-[#E0A22B] text-slate-950"
        >
          <Download className="w-4 h-4 text-inherit" />
          <span>Cetak / Unduh PDF</span>
        </button>

        <div className="flex items-center justify-center gap-1.5 text-[10px] text-center pt-0.5 text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Sistem Administrasi Guru Resmi</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Top App Bar with Hamburger */}
      <div className="md:hidden flex items-center justify-between p-3.5 sticky top-0 z-40 bg-[#0F1117] border-b border-slate-800">
        <div className="flex items-center gap-3 min-w-0">
          <button
            id="btn-mobile-menu-toggle"
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="p-2 rounded-xl cursor-pointer transition-colors bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700"
            aria-label="Buka Menu Navigasi"
          >
            {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="min-w-0">
            <h1 className="text-sm font-bold truncate text-white">
              {profile.schoolName || 'Administrasi Guru'}
            </h1>
            <p className="text-[11px] font-medium truncate text-blue-400">
              {profile.teacherName} • {profile.subject}
            </p>
          </div>
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
            className="w-72 max-w-[85vw] h-full shadow-2xl animate-in slide-in-from-left duration-200 bg-[#0F1117]"
            onClick={(e) => e.stopPropagation()}
          >
            {SidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
