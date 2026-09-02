import React, { useState, useRef, useEffect } from 'react';
import { Database, CheckCircle2, ChevronDown, Layers, BookOpen, CalendarCheck, GraduationCap, Users, School, ArrowRight, HardDrive } from 'lucide-react';
import { AppData } from '../types';

interface ActiveDatabaseBadgeProps {
  data: AppData;
  onNavigateToSettings?: () => void;
}

export const ActiveDatabaseBadge: React.FC<ActiveDatabaseBadgeProps> = ({
  data,
  onNavigateToSettings,
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
        title="Klik untuk melihat ringkasan database aktif"
      >
        {/* Pulsing Green Online Indicator */}
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>

        <Database className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />

        <div className="flex items-center gap-1.5">
          <span className="text-slate-100 font-medium">Database</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            Aktif
          </span>
        </div>

        <span className="text-[11px] text-slate-400 hidden sm:inline-block font-mono">
          ({totalRecords} data)
        </span>

        <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-emerald-400' : ''}`} />
      </button>

      {/* Active Database Summary Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-88 rounded-2xl bg-[#0F172A] border border-slate-700/80 shadow-2xl shadow-black/80 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 p-4 space-y-3.5">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  Status Database
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    AKTIF
                  </span>
                </h4>
                <p className="text-[10px] text-slate-400">
                  Tersimpan di browser & siap digunakan
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20">
              <CheckCircle2 className="w-3 h-3" />
              <span>Normal</span>
            </div>
          </div>

          {/* Database Content Grid Stats */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
              Rincian Rekaman Aktif
            </span>
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

          {/* Action Link to Settings/Backup */}
          {onNavigateToSettings && (
            <div className="pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onNavigateToSettings();
                }}
                className="w-full py-2 px-3 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 hover:text-blue-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Kelola & Backup Database</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
