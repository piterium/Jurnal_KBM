import React, { useState, useMemo } from 'react';
import { Student, ClassRoom, AttendanceRecord, AssessmentItem } from '../types';
import {
  Users,
  Search,
  Filter,
  UploadCloud,
  UserPlus,
  Edit2,
  Trash2,
  Download,
  CheckCircle2,
  XCircle,
  GraduationCap,
  CalendarCheck,
  Layers,
  Sparkles,
  Hash,
} from 'lucide-react';
import { calculateStudentAttendanceSummary, calculateStudentFinalGrade } from '../utils/storage';

interface StudentListViewProps {
  students: Student[];
  classes: ClassRoom[];
  attendances: AttendanceRecord[];
  assessments: AssessmentItem[];
  onAddStudent: () => void;
  onEditStudent: (student: Student) => void;
  onDeleteStudent: (studentId: string) => void;
  onOpenUploadModal: (classId?: string) => void;
  selectedClassId?: string;
  onSelectClassId?: (classId: string) => void;
}

export const StudentListView: React.FC<StudentListViewProps> = ({
  students,
  classes,
  attendances,
  assessments,
  onAddStudent,
  onEditStudent,
  onDeleteStudent,
  onOpenUploadModal,
  selectedClassId: controlledClassId,
  onSelectClassId,
}) => {
  const [internalClassId, setInternalClassId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [genderFilter, setGenderFilter] = useState<'ALL' | 'L' | 'P'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [sortBy, setSortBy] = useState<'ABSEN' | 'NAME' | 'NISN'>('ABSEN');

  const activeClassId = controlledClassId !== undefined ? controlledClassId : internalClassId;

  const handleClassChange = (newClassId: string) => {
    if (onSelectClassId) {
      onSelectClassId(newClassId);
    } else {
      setInternalClassId(newClassId);
    }
  };

  const filteredStudents = useMemo(() => {
    const list = students.filter((std) => {
      // Class filter
      if (activeClassId !== 'ALL' && std.classId !== activeClassId) {
        return false;
      }
      // Gender filter
      if (genderFilter !== 'ALL' && std.gender !== genderFilter) {
        return false;
      }
      // Status filter
      if (statusFilter === 'ACTIVE' && !std.active) return false;
      if (statusFilter === 'INACTIVE' && std.active) return false;
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = std.name.toLowerCase().includes(query);
        const matchNisn = std.nisn.toLowerCase().includes(query);
        const matchAbsen = std.attendanceNo !== undefined && String(std.attendanceNo).includes(query);
        return matchName || matchNisn || matchAbsen;
      }
      return true;
    });

    return list.sort((a, b) => {
      if (sortBy === 'ABSEN') {
        const numA = a.attendanceNo !== undefined && a.attendanceNo !== '' ? Number(a.attendanceNo) : 9999;
        const numB = b.attendanceNo !== undefined && b.attendanceNo !== '' ? Number(b.attendanceNo) : 9999;
        if (numA !== numB) return numA - numB;
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'NAME') {
        return a.name.localeCompare(b.name);
      } else {
        return a.nisn.localeCompare(b.nisn);
      }
    });
  }, [students, activeClassId, genderFilter, statusFilter, searchQuery, sortBy]);

  // Statistics
  const totalStudents = students.length;
  const activeStudents = students.filter((s) => s.active).length;
  const lCount = students.filter((s) => s.gender === 'L' && s.active).length;
  const pCount = students.filter((s) => s.gender === 'P' && s.active).length;

  const currentClass = classes.find((c) => c.id === activeClassId);

  const handleExportCsv = () => {
    const headers = 'No,No Absen,NISN,Nama Lengkap,Jenis Kelamin,Kelas,Status\n';
    const rows = filteredStudents
      .map((std, idx) => {
        const cls = classes.find((c) => c.id === std.classId)?.name || '-';
        return `${idx + 1},"${std.attendanceNo || idx + 1}","${std.nisn || '-'}","${std.name}","${
          std.gender === 'L' ? 'Laki-laki' : 'Perempuan'
        }","${cls}","${std.active ? 'Aktif' : 'Non-Aktif'}"`;
      })
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `daftar_siswa_${activeClassId === 'ALL' ? 'semua_kelas' : currentClass?.name || 'kelas'}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-wide">
              Daftar Siswa & Rombel
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {filteredStudents.length} Siswa
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Kelola pangkalan data peserta didik, nomor absen, mutasi, dan impor berkas siswa per rombongan belajar
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            id="btn-upload-students-modal"
            onClick={() => onOpenUploadModal(activeClassId !== 'ALL' ? activeClassId : classes[0]?.id)}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-lg shadow-blue-600/20 transition-all active:scale-95 cursor-pointer"
          >
            <UploadCloud className="w-4 h-4 text-white" />
            <span>Unggah Siswa Per Kelas</span>
          </button>

          <button
            id="btn-add-single-student"
            onClick={onAddStudent}
            className="inline-flex items-center gap-2 bg-[#1E293B] hover:bg-slate-700 text-white px-3.5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm border border-slate-700 transition-all active:scale-95 cursor-pointer"
          >
            <UserPlus className="w-4 h-4 text-blue-400" />
            <span>Tambah Siswa</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-2 bg-[#1E293B]/70 hover:bg-slate-700 text-slate-300 hover:text-white px-3.5 py-2.5 rounded-xl font-medium text-xs sm:text-sm border border-slate-700 transition-colors cursor-pointer"
            title="Ekspor Data ke Format CSV"
          >
            <Download className="w-4 h-4" />
            <span>Ekspor CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-[#0F172A] border border-slate-800 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 flex-shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
              Total Siswa
            </div>
            <div className="text-xl font-bold text-white mt-0.5">{totalStudents} <span className="text-xs text-slate-400 font-normal">Anak</span></div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0F172A] border border-slate-800 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 flex-shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
              Siswa Laki-laki (L)
            </div>
            <div className="text-xl font-bold text-sky-400 mt-0.5">{lCount} <span className="text-xs text-slate-400 font-normal">Siswa</span></div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0F172A] border border-slate-800 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 flex-shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
              Siswa Perempuan (P)
            </div>
            <div className="text-xl font-bold text-pink-400 mt-0.5">{pCount} <span className="text-xs text-slate-400 font-normal">Siswi</span></div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0F172A] border border-slate-800 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
              Rombel / Kelas Aktif
            </div>
            <div className="text-xl font-bold text-emerald-400 mt-0.5">{classes.length} <span className="text-xs text-slate-400 font-normal">Kelas</span></div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-[#0F172A] border border-slate-800 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {/* Class Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Pilih Rombel (Kelas)
            </label>
            <select
              value={activeClassId}
              onChange={(e) => handleClassChange(e.target.value)}
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 border border-slate-700 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-[#0B1120] text-white font-medium"
            >
              <option value="ALL">Semua Kelas ({students.length} Siswa)</option>
              {classes.map((cls) => {
                const count = students.filter((s) => s.classId === cls.id).length;
                return (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} ({count} Siswa)
                  </option>
                );
              })}
            </select>
          </div>

          {/* Search Box */}
          <div className="md:col-span-2">
            <label className="block text-[11px] font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Cari Nama / No Absen / NISN
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Ketik nama siswa, nomor absen, atau NISN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs sm:text-sm pl-9 pr-3.5 py-2.5 border border-slate-700 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-[#0B1120] text-white"
              />
            </div>
          </div>

          {/* Gender Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Jenis Kelamin
            </label>
            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value as any)}
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 border border-slate-700 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-[#0B1120] text-white"
            >
              <option value="ALL">Semua Gender</option>
              <option value="L">Laki-laki (L)</option>
              <option value="P">Perempuan (P)</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Urutkan Berdasarkan
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 border border-slate-700 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-[#0B1120] text-white"
            >
              <option value="ABSEN">No. Absen</option>
              <option value="NAME">Nama Siswa (A-Z)</option>
              <option value="NISN">Nomor NISN</option>
            </select>
          </div>
        </div>

        {/* Active Class Highlight Banner with 1-click upload */}
        {currentClass && (
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs text-slate-200">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-400" />
              <span>
                Menampilkan data <strong>{currentClass.name}</strong> • Mapel: <strong>{currentClass.subject}</strong> • KKM: <strong>{currentClass.kkm}</strong>
              </span>
            </div>
            <button
              onClick={() => onOpenUploadModal(currentClass.id)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-400 hover:text-blue-300 underline cursor-pointer"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Unggah / Impor Data Siswa {currentClass.name}</span>
            </button>
          </div>
        )}
      </div>

      {/* Student Data Table */}
      <div className="rounded-2xl bg-[#0F172A] border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-[#0B1120] border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px] font-semibold">
              <tr>
                <th className="py-3.5 px-3 w-12 text-center">No</th>
                <th className="py-3.5 px-3 w-20 text-center">No Absen</th>
                <th className="py-3.5 px-4">Nama Peserta Didik</th>
                <th className="py-3.5 px-4">NISN</th>
                <th className="py-3.5 px-3 text-center">JK</th>
                <th className="py-3.5 px-4">Kelas</th>
                <th className="py-3.5 px-4 text-center">Kehadiran</th>
                <th className="py-3.5 px-4 text-center">Rata-Rata Nilai</th>
                <th className="py-3.5 px-3 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((std, idx) => {
                  const studentClass = classes.find((c) => c.id === std.classId);
                  const attSummary = calculateStudentAttendanceSummary(std.id, attendances);
                  const classAssessments = assessments.filter((a) => a.classId === std.classId);
                  const gradeSummary = calculateStudentFinalGrade(
                    std.id,
                    classAssessments,
                    studentClass?.kkm || 75
                  );

                  return (
                    <tr
                      key={std.id}
                      className="hover:bg-slate-800/40 transition-colors group"
                    >
                      <td className="py-3 px-3 text-center font-mono text-slate-500">
                        {idx + 1}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold font-mono text-xs">
                          {std.attendanceNo !== undefined && std.attendanceNo !== '' ? std.attendanceNo : idx + 1}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                          {std.name}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          ID: {std.id}
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono text-xs text-slate-300">
                        {std.nisn || '-'}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                            std.gender === 'L'
                              ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                              : 'bg-pink-500/15 text-pink-400 border border-pink-500/30'
                          }`}
                        >
                          {std.gender === 'L' ? 'L' : 'P'}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-[#1E293B] border border-slate-700 text-white">
                          <Layers className="w-3 h-3 text-blue-400" />
                          {studentClass?.name || 'Tanpa Kelas'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center gap-1">
                          <span
                            className={`font-bold ${
                              attSummary.percent >= 90
                                ? 'text-emerald-400'
                                : attSummary.percent >= 75
                                ? 'text-amber-400'
                                : 'text-rose-400'
                            }`}
                          >
                            {attSummary.percent}%
                          </span>
                          <span className="text-[10px] text-slate-500">
                            ({attSummary.H}/{attSummary.totalSessions})
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center">
                        {gradeSummary.totalAssessments > 0 ? (
                          <div className="inline-flex items-center gap-1.5">
                            <span
                              className={`font-bold text-xs ${
                                gradeSummary.isPassed ? 'text-emerald-400' : 'text-rose-400'
                              }`}
                            >
                              {gradeSummary.averageScore}
                            </span>
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                                gradeSummary.predicate === 'A'
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : gradeSummary.predicate === 'B'
                                  ? 'bg-blue-500/20 text-blue-300'
                                  : gradeSummary.predicate === 'C'
                                  ? 'bg-amber-500/20 text-amber-300'
                                  : 'bg-rose-500/20 text-rose-300'
                              }`}
                            >
                              {gradeSummary.predicate}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-600">-</span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center">
                        {std.active ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" />
                            Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-400 px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30">
                            <XCircle className="w-3 h-3" />
                            Non-Aktif
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onEditStudent(std)}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                            title="Edit Siswa"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Apakah Anda yakin ingin menghapus data siswa "${std.name}"?`)) {
                                onDeleteStudent(std.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                            title="Hapus Siswa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <Users className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                    <p className="text-base font-bold text-slate-300">
                      Tidak ada data siswa ditemukan
                    </p>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      {searchQuery
                        ? 'Coba ubah kata kunci pencarian atau filter kelas yang dipilih.'
                        : 'Belum ada siswa yang ditambahkan ke dalam kelas ini.'}
                    </p>
                    <div className="mt-4 flex items-center justify-center gap-3">
                      <button
                        onClick={() => onOpenUploadModal(activeClassId !== 'ALL' ? activeClassId : classes[0]?.id)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow cursor-pointer"
                      >
                        <UploadCloud className="w-4 h-4" />
                        <span>Unggah Siswa CSV Sekarang</span>
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
