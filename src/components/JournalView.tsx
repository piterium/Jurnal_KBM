import React, { useState } from 'react';
import { TeachingJournal, ClassRoom, Student, AttendanceRecord } from '../types';
import {
  BookOpen,
  Plus,
  Filter,
  Search,
  Calendar,
  Clock,
  Edit2,
  Trash2,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
  Eye,
} from 'lucide-react';
import { formatDateIndonesian, formatShortDateIndonesian, MONTH_NAMES_ID, getJournalAttendanceInfo } from '../utils/storage';

interface JournalViewProps {
  journals: TeachingJournal[];
  classes: ClassRoom[];
  students: Student[];
  attendances: AttendanceRecord[];
  onAddJournal: () => void;
  onEditJournal: (journal: TeachingJournal) => void;
  onDeleteJournal: (id: string) => void;
  onOpenAttendanceForJournal: (journal: TeachingJournal) => void;
}

export const JournalView: React.FC<JournalViewProps> = ({
  journals,
  classes,
  students,
  attendances,
  onAddJournal,
  onEditJournal,
  onDeleteJournal,
  onOpenAttendanceForJournal,
}) => {
  const [selectedClassId, setSelectedClassId] = useState<string>('ALL');
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL'); // 1-12 or ALL
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedJournalId, setExpandedJournalId] = useState<string | null>(null);

  // Filter journals
  const filteredJournals = journals.filter((j) => {
    if (selectedClassId !== 'ALL' && j.classId !== selectedClassId) return false;
    if (selectedMonth !== 'ALL') {
      const d = new Date(j.date);
      if (d.getMonth() + 1 !== Number(selectedMonth)) return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTopic = j.topic?.toLowerCase().includes(q);
      const matchJam = j.jamKe?.toLowerCase().includes(q);
      const matchKet = (j.keterangan || j.notes)?.toLowerCase().includes(q);
      if (!matchTopic && !matchJam && !matchKet) return false;
    }
    return true;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalJP = filteredJournals.reduce((acc, curr) => acc + (curr.hoursCount || 2), 0);

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0F172A] p-5 sm:p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center border border-blue-500/20 flex-shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-wide">
                Jurnal Mengajar & Agenda KBM Guru
              </h2>
              <p className="text-xs text-slate-400">
                Catatan terstruktur pertemuan, jam ke-, materi pokok KBM, serta kehadiran siswa
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={onAddJournal}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-95 cursor-pointer tracking-wide"
        >
          <Plus className="w-4 h-4 text-white" />
          <span>Tambah Jurnal Mengajar</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-[#0F172A] p-4 rounded-2xl border border-slate-800 shadow-xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          {/* Class Filter */}
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
            <Filter className="w-3.5 h-3.5 text-blue-400" />
            <span>Kelas:</span>
          </div>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="text-xs font-medium px-3 py-1.5 border border-slate-700 rounded-lg bg-[#0B1120] text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            <option value="ALL">Semua Kelas</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>

          {/* Month Filter */}
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 ml-2">
            <Calendar className="w-3.5 h-3.5 text-blue-400" />
            <span>Bulan:</span>
          </div>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="text-xs font-medium px-3 py-1.5 border border-slate-700 rounded-lg bg-[#0B1120] text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            <option value="ALL">Semua Bulan</option>
            {MONTH_NAMES_ID.map((name, idx) => (
              <option key={idx + 1} value={idx + 1}>
                {name}
              </option>
            ))}
          </select>

          {/* Search Input */}
          <div className="relative flex-1 min-w-[180px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Cari materi atau kegiatan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-700 rounded-lg bg-[#0B1120] text-white placeholder:text-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Quick Stats Pill */}
        <div className="flex items-center gap-3 text-xs font-medium text-slate-300 bg-[#0B1120] px-3 py-1.5 rounded-lg border border-slate-800">
          <span>Ditemukan: <strong className="text-white">{filteredJournals.length} Jurnal</strong></span>
          <span>•</span>
          <span>Total: <strong className="text-blue-400">{totalJP} JP</strong></span>
        </div>
      </div>

      {/* Journal Cards List */}
      <div className="space-y-4">
        {filteredJournals.length > 0 ? (
          filteredJournals.map((j) => {
            const cls = classes.find((c) => c.id === j.classId);
            const isExpanded = expandedJournalId === j.id;
            const clsStudents = students.filter((s) => s.classId === j.classId && s.active);

            const attInfo = getJournalAttendanceInfo(j, attendances, students);

            return (
              <div
                key={j.id}
                className="bg-[#0F172A] rounded-2xl border border-slate-800 shadow-xl hover:border-slate-700 transition-all overflow-hidden"
              >
                <div className="p-5 sm:p-6">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                        {cls?.name || j.classId}
                      </span>
                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-800 text-slate-200 border border-slate-700">
                        Pertemuan Ke-{j.meetingNumber}
                      </span>
                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-500/10 text-blue-300 border border-blue-500/20 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-blue-400" />
                        Jam Ke- {j.jamKe || '1, 2'} ({j.hoursCount || 2} JP)
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-slate-400 font-mono">
                        {formatDateIndonesian(j.date)}
                      </span>
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                          j.status === 'Terlaksana'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : j.status === 'Tertunda'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        }`}
                      >
                        {j.status || 'Terlaksana'}
                      </span>
                    </div>
                  </div>

                  {/* Main Topic */}
                  <div className="mt-2">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      Materi Pokok / Bahasan
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">
                      {j.topic}
                    </h3>
                  </div>

                  {/* Keterangan / Ket Badge/Note */}
                  {(j.keterangan || j.notes) && (
                    <div className="mt-2.5 flex items-start gap-2 bg-[#0B1120] px-3 py-2 rounded-xl border border-slate-800 text-xs">
                      <span className="px-1.5 py-0.5 text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded flex-shrink-0">
                        Ket.
                      </span>
                      <p className="text-slate-300 font-medium">
                        {j.keterangan || j.notes}
                      </p>
                    </div>
                  )}

                  {/* Optional legacy objective or activities if existing */}
                  {(j.learningObjective || j.activities || j.assessmentNotes || j.reflection) && isExpanded && (
                    <div className="mt-4 pt-4 border-t border-slate-800 space-y-2.5 bg-[#0B1120] p-4 rounded-xl border border-slate-800 text-xs">
                      {j.learningObjective && (
                        <div>
                          <strong className="text-blue-400 font-semibold">Tujuan / CP:</strong>
                          <p className="text-slate-300 mt-0.5">{j.learningObjective}</p>
                        </div>
                      )}
                      {j.activities && (
                        <div>
                          <strong className="text-white font-semibold">Kegiatan KBM:</strong>
                          <p className="text-slate-300 mt-0.5 whitespace-pre-line">{j.activities}</p>
                        </div>
                      )}
                      {j.assessmentNotes && (
                        <div>
                          <strong className="text-white font-semibold">Penilaian / Evaluasi:</strong>
                          <p className="mt-0.5 text-slate-400">{j.assessmentNotes}</p>
                        </div>
                      )}
                      {j.reflection && (
                        <div>
                          <strong className="text-white font-semibold">Catatan / Refleksi Guru:</strong>
                          <p className="mt-0.5 text-slate-400 italic">"{j.reflection}"</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Footer Actions & Integrated Attendance Link */}
                  <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
                    {/* Attendance Info */}
                    <div className="flex items-center gap-2">
                      {attInfo.hasRecord ? (
                        attInfo.isNihil ? (
                          <button
                            onClick={() => onOpenAttendanceForJournal(j)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-lg border border-emerald-500/20 transition-colors cursor-pointer"
                            title="Klik untuk melihat atau mengedit presensi siswa"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Presensi: <strong className="text-emerald-300 font-bold">Nihil</strong> (Hadir Lengkap {attInfo.total} Siswa)</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => onOpenAttendanceForJournal(j)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs font-semibold rounded-lg border border-amber-500/20 transition-colors cursor-pointer"
                            title="Klik untuk melihat atau mengedit presensi siswa"
                          >
                            <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                            <span>Ketidakhadiran: <strong className="text-amber-300 font-bold bg-amber-500/20 px-1.5 py-0.5 rounded">{attInfo.summaryText}</strong> • Hadir: {attInfo.hadir}/{attInfo.total}</span>
                          </button>
                        )
                      ) : (
                        <button
                          onClick={() => onOpenAttendanceForJournal(j)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg border border-slate-700 transition-colors cursor-pointer"
                        >
                          <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                          <span>Presensi Belum Diinput (Klik untuk Isi)</span>
                        </button>
                      )}
                    </div>

                    {/* Edit, Delete, Toggle details */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setExpandedJournalId(isExpanded ? null : j.id)}
                        className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      >
                        {isExpanded ? 'Tutup Detail' : 'Lihat Detail'}
                      </button>
                      <button
                        onClick={() => onEditJournal(j)}
                        className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        title="Edit Jurnal"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Hapus jurnal pertemuan ke-${j.meetingNumber} materi "${j.topic}"?`)) {
                            onDeleteJournal(j.id);
                          }
                        }}
                        className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                        title="Hapus Jurnal"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-[#0F172A] rounded-2xl border border-slate-800 p-12 text-center shadow-xl">
            <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h4 className="font-bold text-lg text-white mb-1">
              Tidak Ada Jurnal Mengajar
            </h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mb-5 leading-relaxed">
              Belum ada data jurnal yang sesuai dengan filter kelas atau bulan yang dipilih.
            </p>
            <button
              onClick={onAddJournal}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/20 cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4 text-white" />
              <span>Tambah Jurnal Sekarang</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
