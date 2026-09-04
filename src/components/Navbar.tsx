import React from 'react';
import { SchoolProfile } from '../types';
import {
  BookOpen,
  CalendarCheck,
  GraduationCap,
  FileText,
  Settings,
  LayoutDashboard,
  School,
  Users,
  UserCheck,
  CalendarDays,
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  profile: SchoolProfile;
  onQuickDownloadPdf?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  profile,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'schedule', label: 'Jadwal Mengajar', icon: CalendarDays },
    { id: 'journal', label: 'Jurnal Mengajar', icon: BookOpen },
    { id: 'attendance', label: 'Presensi Siswa', icon: CalendarCheck },
    { id: 'grades', label: 'Daftar Penilaian', icon: GraduationCap },
    { id: 'students', label: 'Daftar Siswa', icon: Users },
    { id: 'report', label: 'Laporan Bulanan & PDF', icon: FileText },
    { id: 'settings', label: 'Data Master & Profil', icon: Settings },
  ];

  return (
    <header className="bg-[#0F172A] text-[#E2E8F0] border-b border-slate-800 sticky top-0 z-40">
      {/* Top Bar with School & Teacher Info */}
      <div className="border-b border-slate-800 px-4 py-3 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20 flex-shrink-0 overflow-hidden p-1">
              {profile.logoUrl ? (
                <img
                  src={profile.logoUrl}
                  alt="Logo"
                  className="w-full h-full object-contain"
                />
              ) : (
                <School className="w-5 h-5 text-white" />
              )}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-white tracking-wide">
                  {profile.schoolName}
                </h1>
                <span className="text-[10px] uppercase px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30 font-bold tracking-wider">
                  T.A {profile.academicYear} • Sem. {profile.semester}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Guru: <span className="text-white font-medium">{profile.teacherName}</span> (NIP: {profile.teacherNip || '-'}) • Mapel: <span className="text-blue-400 font-medium">{profile.subject}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-tab-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white font-bold shadow-sm'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white font-medium'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
