import React, { useState, useMemo, useRef } from 'react';
import { Student, ClassRoom, AttendanceRecord, AssessmentItem, SchoolProfile } from '../types';
import {
  Users,
  Search,
  UploadCloud,
  Edit2,
  Trash2,
  Download,
  CheckCircle2,
  XCircle,
  Plus,
  X,
} from 'lucide-react';

interface StudentListViewProps {
  students: Student[];
  classes: ClassRoom[];
  attendances: AttendanceRecord[];
  assessments: AssessmentItem[];
  profile?: SchoolProfile;
  onSaveClass?: (cls: ClassRoom) => void;
  onSaveStudent?: (student: Student) => void;
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
  profile,
  onSaveClass,
  onSaveStudent,
  onAddStudent,
  onEditStudent,
  onDeleteStudent,
  onOpenUploadModal,
  selectedClassId: controlledClassId,
  onSelectClassId,
}) => {
  // If controlledClassId is provided and not empty, use it. Otherwise internal state
  const [internalClassId, setInternalClassId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const formRef = useRef<HTMLDivElement>(null);

  // Form State for quick inline creation / editing matching the user requirement
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [formAttendanceNo, setFormAttendanceNo] = useState<string>('');
  const [formNisn, setFormNisn] = useState<string>('');
  const [formName, setFormName] = useState<string>('');
  const [formClassName, setFormClassName] = useState<string>('');
  const [formGender, setFormGender] = useState<'L' | 'P'>('L');

  const activeClassId = controlledClassId !== undefined ? controlledClassId : internalClassId;

  // Sync initial or selected class into manual input field if user has selected a specific class
  React.useEffect(() => {
    if (activeClassId && activeClassId !== 'ALL') {
      const cls = classes.find((c) => c.id === activeClassId);
      if (cls && !editingStudentId) {
        setFormClassName(cls.name);
      }
    }
  }, [activeClassId, classes, editingStudentId]);

  const handleClassChange = (newClassId: string) => {
    if (onSelectClassId) {
      onSelectClassId(newClassId);
    } else {
      setInternalClassId(newClassId);
    }
  };

  const handleStartEdit = (std: Student) => {
    setEditingStudentId(std.id);
    setFormAttendanceNo(std.attendanceNo !== undefined ? String(std.attendanceNo) : '');
    setFormNisn(std.nisn || '');
    setFormName(std.name || '');
    const stdClass = classes.find((c) => c.id === std.classId);
    setFormClassName(stdClass ? stdClass.name : '');
    setFormGender(std.gender || 'L');

    // Scroll smoothly to form
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleCancelEdit = () => {
    setEditingStudentId(null);
    setFormAttendanceNo('');
    setFormNisn('');
    setFormName('');
    if (activeClassId && activeClassId !== 'ALL') {
      const cls = classes.find((c) => c.id === activeClassId);
      setFormClassName(cls?.name || '');
    } else {
      setFormClassName('');
    }
    setFormGender('L');
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      alert('Silakan masukkan Nama Lengkap siswa.');
      return;
    }
    if (!formClassName.trim()) {
      alert('Silakan masukkan Kelas (contoh: VII A).');
      return;
    }

    const trimmedClassName = formClassName.trim();
    let targetClass = classes.find(
      (c) => c.name.trim().toLowerCase() === trimmedClassName.toLowerCase()
    );

    let targetClassId = targetClass?.id;

    // If the typed class does not exist yet, auto-create the class room
    if (!targetClass) {
      const newClassId = `cls_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const newClass: ClassRoom = {
        id: newClassId,
        name: trimmedClassName,
        gradeLevel: trimmedClassName.replace(/[^0-9]/g, '') || 'VII',
        subject: profile?.subject || 'Mata Pelajaran',
        academicYear: profile?.academicYear || '2024/2025',
        kkm: 75,
      };
      if (onSaveClass) {
        onSaveClass(newClass);
      }
      targetClassId = newClassId;
    }

    const parsedAttendanceNo = formAttendanceNo.trim()
      ? isNaN(Number(formAttendanceNo.trim()))
        ? formAttendanceNo.trim()
        : parseInt(formAttendanceNo.trim(), 10)
      : undefined;

    const studentData: Student = {
      id: editingStudentId || `std_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      attendanceNo: parsedAttendanceNo,
      nisn: formNisn.trim() || '-',
      name: formName.trim(),
      gender: formGender,
      classId: targetClassId!,
      active: true,
    };

    if (onSaveStudent) {
      onSaveStudent(studentData);
    } else {
      onEditStudent(studentData);
    }

    // Reset form
    handleCancelEdit();
  };

  const handleDownloadTemplate = () => {
    const targetCls = classes.find((c) => c.id === activeClassId) || classes[0];
    const classNameStr = targetCls?.name || 'VII A';
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'No Absen,NISN,Nama Lengkap,Jenis Kelamin (L/P),Kelas\n' +
      `1,0098765401,Ahmad Rizky Pratama,L,${classNameStr}\n` +
      `2,0098765402,Annisa Rahmawati,P,${classNameStr}\n` +
      `3,0098765403,Bagas Dwi Santoso,L,${classNameStr}\n` +
      `4,0098765404,Cantika Putri Permata,P,${classNameStr}\n` +
      `5,0098765405,Daffa Arya Maulana,L,${classNameStr}`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `template_siswa_${classNameStr.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredStudents = useMemo(() => {
    // If no class is selected and no search query, return empty list (to trigger empty state matching screenshot)
    if (!activeClassId && !searchQuery.trim()) {
      return [];
    }

    const list = students.filter((std) => {
      // Class filter
      if (activeClassId && activeClassId !== 'ALL' && std.classId !== activeClassId) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = std.name.toLowerCase().includes(query);
        const matchNisn = std.nisn.toLowerCase().includes(query);
        const matchAbsen =
          std.attendanceNo !== undefined && String(std.attendanceNo).includes(query);
        return matchName || matchNisn || matchAbsen;
      }
      return true;
    });

    return list.sort((a, b) => {
      const numA =
        a.attendanceNo !== undefined && a.attendanceNo !== ''
          ? Number(a.attendanceNo)
          : 9999;
      const numB =
        b.attendanceNo !== undefined && b.attendanceNo !== ''
          ? Number(b.attendanceNo)
          : 9999;
      if (numA !== numB) return numA - numB;
      return a.name.localeCompare(b.name);
    });
  }, [students, activeClassId, searchQuery]);

  const currentClass = classes.find((c) => c.id === activeClassId);

  return (
    <div className="space-y-6">
      {/* 1. Header with Title & Action Buttons (Matching Screenshot) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white tracking-tight">
              Kelola Master Data Siswa
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Kelola daftar seluruh siswa, NISN, dan kelas untuk administrasi guru.
            </p>
          </div>
        </div>

        {/* Action Buttons: Download Template & Import Excel */}
        <div className="flex items-center gap-3">
          <button
            id="btn-download-template-csv"
            type="button"
            onClick={handleDownloadTemplate}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1E293B] hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span>Download Template</span>
          </button>

          <button
            id="btn-import-excel-modal"
            type="button"
            onClick={() =>
              onOpenUploadModal(activeClassId && activeClassId !== 'ALL' ? activeClassId : classes[0]?.id)
            }
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold shadow-md shadow-blue-600/20 transition-all active:scale-95 cursor-pointer"
          >
            <UploadCloud className="w-4 h-4 text-white" />
            <span>Import Excel</span>
          </button>
        </div>
      </div>

      {/* 2. Form Tambah / Edit Siswa Card (Exact Model as Uploaded Image + No Absen) */}
      <div
        ref={formRef}
        className="rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          {editingStudentId && (
            <div className="flex items-center justify-between p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-500 mb-2">
              <span className="font-semibold">Mode Edit Siswa: Mengubah data siswa yang dipilih</span>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="text-slate-400 hover:text-white flex items-center gap-1 font-medium cursor-pointer"
              >
                <X className="w-3.5 h-3.5" /> Batal Edit
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5 items-end">
            {/* No Absen */}
            <div className="lg:col-span-2">
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                NO. ABSEN *
              </label>
              <input
                type="number"
                min="1"
                placeholder="Contoh: 1"
                value={formAttendanceNo}
                onChange={(e) => setFormAttendanceNo(e.target.value)}
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-slate-50 dark:bg-[#0B1120] text-slate-800 dark:text-white placeholder:text-slate-400"
              />
            </div>

            {/* NISN */}
            <div className="lg:col-span-3">
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                NISN *
              </label>
              <input
                type="text"
                placeholder="Contoh: 0012345678"
                value={formNisn}
                onChange={(e) => setFormNisn(e.target.value)}
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-slate-50 dark:bg-[#0B1120] text-slate-800 dark:text-white placeholder:text-slate-400 font-mono"
              />
            </div>

            {/* Nama Lengkap */}
            <div className="lg:col-span-4">
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                NAMA LENGKAP *
              </label>
              <input
                type="text"
                required
                placeholder="Nama lengkap siswa"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-slate-50 dark:bg-[#0B1120] text-slate-800 dark:text-white placeholder:text-slate-400 font-medium"
              />
            </div>

            {/* Kelas (Manual text input) */}
            <div className="lg:col-span-2">
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                KELAS *
              </label>
              <input
                type="text"
                required
                list="classes-datalist"
                placeholder="Contoh: VII A"
                value={formClassName}
                onChange={(e) => setFormClassName(e.target.value)}
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-slate-50 dark:bg-[#0B1120] text-slate-800 dark:text-white placeholder:text-slate-400 font-medium"
              />
              <datalist id="classes-datalist">
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.name} />
                ))}
              </datalist>
            </div>

            {/* Simpan Button */}
            <div className="lg:col-span-1">
              <button
                type="submit"
                id="btn-save-student-inline"
                className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-blue-600/20 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-4 h-4 text-white stroke-[2.5]" />
                <span>{editingStudentId ? 'Simpan' : 'Simpan'}</span>
              </button>
            </div>
          </div>

          {/* Optional Quick Gender Selection */}
          <div className="flex items-center gap-4 pt-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Jenis Kelamin:
            </span>
            <div className="flex items-center gap-3 text-xs">
              <label className="inline-flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300">
                <input
                  type="radio"
                  name="gender"
                  checked={formGender === 'L'}
                  onChange={() => setFormGender('L')}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span>Laki-laki (L)</span>
              </label>
              <label className="inline-flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300">
                <input
                  type="radio"
                  name="gender"
                  checked={formGender === 'P'}
                  onChange={() => setFormGender('P')}
                  className="text-pink-600 focus:ring-pink-500"
                />
                <span>Perempuan (P)</span>
              </label>
            </div>
          </div>
        </form>
      </div>

      {/* 3. Lower Card: Filter, Search & Table (Exact Layout & Empty State) */}
      <div className="rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-4">
        {/* Top Controls: Search (Left) & Dropdown Kelas (Right) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari NISN atau Nama..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs sm:text-sm pl-9 pr-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-slate-50 dark:bg-[#0B1120] text-slate-800 dark:text-white placeholder:text-slate-400"
            />
          </div>

          {/* Class Dropdown Filter */}
          <div className="min-w-[260px]">
            <select
              value={activeClassId}
              onChange={(e) => handleClassChange(e.target.value)}
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-slate-50 dark:bg-[#0B1120] text-blue-600 dark:text-blue-400 font-semibold cursor-pointer"
            >
              <option value="">-- Pilih Kelas untuk Melihat Siswa --</option>
              <option value="ALL">-- Tampilkan Semua Kelas ({students.length} Siswa) --</option>
              {classes.map((cls) => {
                const count = students.filter((s) => s.classId === cls.id).length;
                return (
                  <option key={cls.id} value={cls.id}>
                    Kelas {cls.name} ({count} Siswa)
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Table Content */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 dark:bg-[#0B1120] border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px] font-bold">
                <tr>
                  <th className="py-3 px-4 w-16 text-center">NO</th>
                  <th className="py-3 px-4 w-32">NISN</th>
                  <th className="py-3 px-4">NAMA LENGKAP</th>
                  <th className="py-3 px-4 w-32">KELAS</th>
                  <th className="py-3 px-4 w-28 text-center">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 bg-white dark:bg-[#0F172A]">
                {/* Case 1: No Class Selected and No Search Query -> Exact Empty State in Image */}
                {!activeClassId && !searchQuery.trim() ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                          <Users className="w-8 h-8" />
                        </div>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                          Silakan pilih kelas pada dropdown filter di atas untuk menampilkan daftar siswa.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : filteredStudents.length > 0 ? (
                  /* Case 2: Displaying Students */
                  filteredStudents.map((std, idx) => {
                    const studentClass = classes.find((c) => c.id === std.classId);
                    const displayNo =
                      std.attendanceNo !== undefined && std.attendanceNo !== ''
                        ? std.attendanceNo
                        : idx + 1;

                    return (
                      <tr
                        key={std.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                      >
                        {/* NO */}
                        <td className="py-3.5 px-4 text-center font-bold font-mono text-slate-700 dark:text-slate-300">
                          {displayNo}
                        </td>

                        {/* NISN */}
                        <td className="py-3.5 px-4 font-mono text-xs text-slate-600 dark:text-slate-300 font-medium">
                          {std.nisn || '-'}
                        </td>

                        {/* NAMA LENGKAP */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-800 dark:text-white group-hover:text-blue-500 transition-colors">
                              {std.name}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                                std.gender === 'L'
                                  ? 'bg-blue-500/15 text-blue-500'
                                  : 'bg-pink-500/15 text-pink-500'
                              }`}
                            >
                              {std.gender}
                            </span>
                          </div>
                        </td>

                        {/* KELAS */}
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                            {studentClass?.name || 'Tanpa Kelas'}
                          </span>
                        </td>

                        {/* AKSI */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleStartEdit(std)}
                              className="p-1.5 text-slate-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                              title="Edit Siswa"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (
                                  confirm(
                                    `Apakah Anda yakin ingin menghapus data siswa "${std.name}"?`
                                  )
                                ) {
                                  onDeleteStudent(std.id);
                                }
                              }}
                              className="p-1.5 text-slate-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
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
                  /* Case 3: Filter / Class selected but 0 students found */
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      <Users className="w-10 h-10 mx-auto mb-2.5 text-slate-400 dark:text-slate-600" />
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                        Tidak ada data siswa ditemukan
                      </p>
                      <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                        {searchQuery
                          ? 'Coba ubah kata kunci pencarian.'
                          : `Belum ada siswa di kelas ${currentClass?.name || ''}. Tambahkan siswa melalui form di atas atau tombol Import Excel.`}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

