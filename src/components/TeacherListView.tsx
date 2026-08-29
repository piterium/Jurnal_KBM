import React, { useState, useMemo } from 'react';
import { Teacher, ClassRoom, SchoolProfile } from '../types';
import {
  GraduationCap,
  Search,
  Plus,
  Edit2,
  Trash2,
  Download,
  BookOpen,
  Phone,
  Mail,
  Award,
  Layers,
  Briefcase,
  CheckCircle2,
  UserCheck,
  Building,
  Printer,
  Sparkles,
} from 'lucide-react';

interface TeacherListViewProps {
  teachers: Teacher[];
  classes: ClassRoom[];
  profile: SchoolProfile;
  onAddTeacher: () => void;
  onEditTeacher: (teacher: Teacher) => void;
  onDeleteTeacher: (teacherId: string) => void;
  onSetAsActiveProfileTeacher?: (teacher: Teacher) => void;
}

export const TeacherListView: React.FC<TeacherListViewProps> = ({
  teachers,
  classes,
  profile,
  onAddTeacher,
  onEditTeacher,
  onDeleteTeacher,
  onSetAsActiveProfileTeacher,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Extract unique subjects for filter
  const subjectsList = useMemo(() => {
    const set = new Set<string>();
    teachers.forEach((t) => {
      if (t.subject) set.add(t.subject);
    });
    return Array.from(set).sort();
  }, [teachers]);

  const filteredTeachers = useMemo(() => {
    return teachers.filter((tch) => {
      // Subject filter
      if (selectedSubject !== 'ALL' && tch.subject !== selectedSubject) {
        return false;
      }
      // Employment status filter
      if (selectedStatus !== 'ALL' && tch.employmentStatus !== selectedStatus) {
        return false;
      }
      // Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = tch.name.toLowerCase().includes(query);
        const matchNip = tch.nip.toLowerCase().includes(query);
        const matchSubj = tch.subject.toLowerCase().includes(query);
        const matchNotes = tch.notes?.toLowerCase().includes(query) || false;
        const matchClasses = tch.classesTaught?.some((c) => c.toLowerCase().includes(query)) || false;
        return matchName || matchNip || matchSubj || matchNotes || matchClasses;
      }
      return true;
    });
  }, [teachers, selectedSubject, selectedStatus, searchQuery]);

  // Statistics
  const totalTeachers = teachers.length;
  const pnsCount = teachers.filter((t) => t.employmentStatus === 'PNS').length;
  const pppkCount = teachers.filter((t) => t.employmentStatus === 'PPPK').length;
  const uniqueSubjectsCount = subjectsList.length;

  const handleExportCsv = () => {
    const headers =
      'No,Nama Lengkap Guru,NIP,Mata Pelajaran,Kelas yang Diampu,Status Kepegawaian,Jenis Kelamin,Pendidikan Terakhir,No Telepon,Email,Tugas Tambahan\n';
    const rows = filteredTeachers
      .map((t, idx) => {
        const classesStr = t.classesTaught ? t.classesTaught.join('; ') : '-';
        return `${idx + 1},"${t.name}","${t.nip}","${t.subject}","${classesStr}","${
          t.employmentStatus || '-'
        }","${t.gender || '-'}","${t.education || '-'}","${t.phone || '-'}","${t.email || '-'}","${
          t.notes || '-'
        }"`;
      })
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `daftar_guru_dan_mapel_${profile.schoolName.replace(/[^a-zA-Z0-9]/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Bar Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-wide">
              Daftar Guru & Mata Pelajaran
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {filteredTeachers.length} Tenaga Pendidik
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Daftar profil dewan guru, mata pelajaran yang diampu, dan distribusi rombel pengajaran
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            id="btn-add-teacher"
            onClick={onAddTeacher}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-lg shadow-blue-600/20 transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>Tambah Guru & Mapel</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-3.5 py-2.5 rounded-xl font-medium text-xs sm:text-sm border border-slate-700 transition-colors cursor-pointer"
            title="Ekspor ke Berkas CSV"
          >
            <Download className="w-4 h-4" />
            <span>Ekspor CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-3.5 py-2.5 rounded-xl font-medium text-xs sm:text-sm border border-slate-700 transition-colors cursor-pointer"
            title="Cetak Dokumen"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-[#0F172A] border border-slate-800 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 flex-shrink-0">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
              Total Guru & Tendik
            </div>
            <div className="text-xl font-bold text-white mt-0.5">{totalTeachers} <span className="text-xs text-slate-400 font-normal">Orang</span></div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0F172A] border border-slate-800 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 flex-shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
              Guru PNS
            </div>
            <div className="text-xl font-bold text-sky-400 mt-0.5">{pnsCount} <span className="text-xs text-slate-400 font-normal">Guru</span></div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0F172A] border border-slate-800 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
              Guru PPPK & Honor
            </div>
            <div className="text-xl font-bold text-emerald-400 mt-0.5">{totalTeachers - pnsCount} <span className="text-xs text-slate-400 font-normal">Guru</span></div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0F172A] border border-slate-800 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 flex-shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
              Mata Pelajaran Aktif
            </div>
            <div className="text-xl font-bold text-indigo-400 mt-0.5">{uniqueSubjectsCount} <span className="text-xs text-slate-400 font-normal">Mapel</span></div>
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="p-4 rounded-2xl bg-[#0F172A] border border-slate-800 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="md:col-span-2">
            <label className="block text-[11px] font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Cari Nama Guru / NIP / Mapel / Rombel
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Ketik nama pendidik, NIP, atau mata pelajaran..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs sm:text-sm pl-9 pr-3.5 py-2.5 border border-slate-700 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-[#0B1120] text-white"
              />
            </div>
          </div>

          {/* Subject Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Mata Pelajaran
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 border border-slate-700 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-[#0B1120] text-white"
            >
              <option value="ALL">Semua Mata Pelajaran ({teachers.length})</option>
              {subjectsList.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Employment Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Status Kepegawaian
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 border border-slate-700 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-[#0B1120] text-white"
            >
              <option value="ALL">Semua Status</option>
              <option value="PNS">PNS</option>
              <option value="PPPK">PPPK</option>
              <option value="GTT">GTT</option>
              <option value="Guru Tetap Yayasan">Guru Tetap Yayasan</option>
              <option value="Honor Sekolah">Honor Sekolah</option>
            </select>
          </div>
        </div>

        {/* View Toggle (Grid / Table) */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs text-slate-400">
          <span>Menampilkan <strong>{filteredTeachers.length}</strong> guru pengampu</span>
          <div className="flex items-center gap-1 bg-[#0B1120] p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Kartu (Grid)
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Tabel (List)
            </button>
          </div>
        </div>
      </div>

      {/* Grid Mode View */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTeachers.length > 0 ? (
            filteredTeachers.map((tch) => {
              const isCurrentActiveUser = profile.teacherName === tch.name;
              return (
                <div
                  key={tch.id}
                  className={`p-5 rounded-2xl bg-[#0F172A] border transition-all hover:border-slate-700 flex flex-col justify-between group ${
                    isCurrentActiveUser
                      ? 'border-blue-500 shadow-lg shadow-blue-500/10'
                      : 'border-slate-800'
                  }`}
                >
                  <div>
                    {/* Top Row: Avatar & Status */}
                    <div className="flex items-start justify-between gap-3 mb-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-lg flex-shrink-0">
                          {tch.gender === 'P' ? '👩‍🏫' : '👨‍🏫'}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-1">
                              {tch.name}
                            </h3>
                            {tch.isHeadmaster && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                KS
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                            NIP: {tch.nip || '-'}
                          </div>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex-shrink-0 ${
                          tch.employmentStatus === 'PNS'
                            ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                            : tch.employmentStatus === 'PPPK'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}
                      >
                        {tch.employmentStatus || 'Guru'}
                      </span>
                    </div>

                    {/* Subject Pill */}
                    <div className="mb-3">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs font-bold text-blue-400">
                        <BookOpen className="w-3.5 h-3.5" />
                        {tch.subject}
                      </span>
                    </div>

                    {/* Classes Taught Chips */}
                    <div className="space-y-1 mb-3">
                      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Rombel / Kelas yang Diampu:
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {tch.classesTaught && tch.classesTaught.length > 0 ? (
                          tch.classesTaught.map((cName, cIdx) => (
                            <span
                              key={cIdx}
                              className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-200 font-medium"
                            >
                              {cName}
                            </span>
                          ))
                        ) : (
                          <span className="text-[11px] text-slate-500 italic">
                            Belum ditentukan
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Additional Notes or Duties */}
                    {tch.notes && (
                      <div className="text-xs text-slate-300 bg-[#0B1120] p-2.5 rounded-xl border border-slate-800 mb-3 line-clamp-2">
                        <span className="text-slate-400 font-semibold">Tugas: </span>
                        {tch.notes}
                      </div>
                    )}

                    {/* Contact details */}
                    <div className="space-y-1 text-[11px] text-slate-400 mb-3">
                      {tch.education && (
                        <div className="flex items-center gap-1.5 truncate">
                          <GraduationCap className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                          <span>{tch.education}</span>
                        </div>
                      )}
                      {tch.phone && (
                        <div className="flex items-center gap-1.5 truncate">
                          <Phone className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                          <span>{tch.phone}</span>
                        </div>
                      )}
                      {tch.email && (
                        <div className="flex items-center gap-1.5 truncate">
                          <Mail className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                          <span>{tch.email}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Bottom Actions */}
                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                    {onSetAsActiveProfileTeacher && (
                      <button
                        onClick={() => onSetAsActiveProfileTeacher(tch)}
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                          isCurrentActiveUser
                            ? 'bg-blue-600/20 text-blue-400 border-blue-500/40'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700'
                        }`}
                        title="Jadikan profil aktif dalam jurnal & administrasi"
                      >
                        {isCurrentActiveUser ? '★ Profil Pengguna Aktif' : 'Pilih sbg Profil Saya'}
                      </button>
                    )}

                    <div className="flex items-center gap-1 ml-auto">
                      <button
                        onClick={() => onEditTeacher(tch)}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        title="Edit Data Guru"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Apakah Anda yakin ingin menghapus data guru "${tch.name}"?`)) {
                            onDeleteTeacher(tch.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                        title="Hapus Guru"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-12 text-center text-slate-500 bg-[#0F172A] rounded-2xl border border-slate-800">
              <GraduationCap className="w-12 h-12 mx-auto mb-3 text-slate-600" />
              <p className="text-base font-bold text-slate-300">
                Tidak ada data guru yang cocok
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Silakan sesuaikan filter pencarian atau tambahkan guru baru.
              </p>
              <button
                onClick={onAddTeacher}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/20 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Guru Baru</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Table Mode View */
        <div className="rounded-2xl bg-[#0F172A] border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#0B1120] border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px] font-semibold">
                <tr>
                  <th className="py-3.5 px-4 w-12 text-center">No</th>
                  <th className="py-3.5 px-4">Nama Lengkap & NIP</th>
                  <th className="py-3.5 px-4">Mata Pelajaran</th>
                  <th className="py-3.5 px-4">Kelas yang Diampu</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4">Kontak & Email</th>
                  <th className="py-3.5 px-4">Tugas Tambahan</th>
                  <th className="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredTeachers.length > 0 ? (
                  filteredTeachers.map((tch, idx) => (
                    <tr key={tch.id} className="hover:bg-slate-800/30 transition-colors group">
                      <td className="py-3 px-4 text-center font-mono text-slate-500">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                          {tch.name}
                        </div>
                        <div className="text-[11px] font-mono text-slate-400">
                          NIP: {tch.nip || '-'}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-blue-400">
                          {tch.subject}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {tch.classesTaught && tch.classesTaught.length > 0 ? (
                            tch.classesTaught.map((c, i) => (
                              <span
                                key={i}
                                className="text-[10px] px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-200"
                              >
                                {c}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-500 italic">-</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                            tch.employmentStatus === 'PNS'
                              ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                              : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          }`}
                        >
                          {tch.employmentStatus || 'PNS'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-300">
                        <div>{tch.phone || '-'}</div>
                        <div className="text-[11px] text-slate-400">{tch.email || '-'}</div>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-300">
                        {tch.notes || '-'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onEditTeacher(tch)}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            title="Edit Guru"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Hapus data guru "${tch.name}"?`)) {
                                onDeleteTeacher(tch.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                            title="Hapus Guru"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500">
                      Tidak ada data guru ditemukan
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
