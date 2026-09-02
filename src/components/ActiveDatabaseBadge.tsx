import React, { useState, useRef, useEffect } from 'react';
import {
  BookOpen,
  CalendarCheck,
  GraduationCap,
  Users,
  School,
  ArrowRight,
  HardDrive,
  Database,
  ChevronDown,
} from 'lucide-react';
import { AppData } from '../types';

interface ActiveDatabaseBadgeProps {
  data: AppData;
  onNavigateToSettings?: () => void;
  currentSchoolId?: string;
}

export const ActiveDatabaseBadge: React.FC<ActiveDatabaseBadgeProps> = ({
  data,
  onNavigateToSettings,
  currentSchoolId = 'main',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const totalRecords =
    (data.journals?.length || 0) +
    (data.attendances?.length || 0) +
    (data.assessments?.length || 0) +
    (data.students?.length || 0) +
    (data.classes?.length || 0) +
    (data.teachers?.length || 0);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Active Database Header Button */}
      <button
        id="btn-active-database-badge"
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-emerald-500/30 hover:border-emerald-500/50 text-slate-200 text-xs font-semibold shadow-sm transition-all active:scale-95 cursor-pointer group"
        title="Klik untuk melihat ringkasan database"
      >
        {/* Active indicator dot */}
        <span className="relative flex h-2 w-2">
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>

        <div className="flex items-center gap-1.5">
          <Database className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-105 transition-transform" />
          <span className="text-slate-100 font-medium">Database</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            Aktif
          </span>
        </div>

        <span className="text-[11px] text-slate-400 hidden sm:inline-block font-mono">
          ({totalRecords} data)
        </span>

        <ChevronDown
          className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-emerald-400' : ''
          }`}
        />
      </button>

      {/* Active Database Summary Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-92 rounded-2xl bg-[#0F172A] border border-slate-700/80 shadow-2xl shadow-black/80 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 p-4 space-y-3.5">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  Database Cloud Firestore
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    ONLINE
                  </span>
                </h4>
                <p className="text-[10px] text-slate-400">
                  Penyimpanan data cloud aktif
                </p>
              </div>
            </div>
          </div>

          {/* Database Content Grid Stats */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 tracking-wider uppercase">
              <span>Rincian Data Tersimpan</span>
              <span className="text-emerald-400 font-mono lowercase">ruang: {currentSchoolId}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <BookOpen className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                  <span className="text-[11px] text-slate-300 truncate">Jurnal</span>
                </div>
                <span className="text-xs font-bold text-white font-mono">
                  {data.journals?.length || 0}
                </span>
              </div>

              <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <CalendarCheck className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  <span className="text-[11px] text-slate-300 truncate">Presensi</span>
                </div>
                <span className="text-xs font-bold text-white font-mono">
                  {data.attendances?.length || 0}
                </span>
              </div>

              <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <GraduationCap className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                  <span className="text-[11px] text-slate-300 truncate">Penilaian</span>
                </div>
                <span className="text-xs font-bold text-white font-mono">
                  {data.assessments?.length || 0}
                </span>
              </div>

              <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <Users className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span className="text-[11px] text-slate-300 truncate">Siswa</span>
                </div>
                <span className="text-xs font-bold text-white font-mono">
                  {data.students?.length || 0}
                </span>
              </div>

              <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <School className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                  <span className="text-[11px] text-slate-300 truncate">Kelas</span>
                </div>
                <span className="text-xs font-bold text-white font-mono">
                  {data.classes?.length || 0}
                </span>
              </div>

              <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <HardDrive className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                  <span className="text-[11px] text-slate-300 truncate">Total Data</span>
                </div>
                <span className="text-xs font-bold text-emerald-400 font-mono">
                  {totalRecords}
                </span>
              </div>
            </div>
          </div>

          {/* Action Links */}
          <div className="pt-2 border-t border-slate-800 flex flex-col gap-2">
            {onNavigateToSettings && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onNavigateToSettings();
                }}
                className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Kelola & Backup Database</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
