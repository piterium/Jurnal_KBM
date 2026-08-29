import React, { useState, useEffect } from 'react';
import { Student, ClassRoom } from '../../types';
import { X, UserPlus, CheckCircle2 } from 'lucide-react';

interface StudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (student: Student) => void;
  classes: ClassRoom[];
  initialData?: Student | null;
  selectedClassId: string;
}

export const StudentModal: React.FC<StudentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  classes,
  initialData,
  selectedClassId,
}) => {
  const [attendanceNo, setAttendanceNo] = useState<string>('');
  const [name, setName] = useState('');
  const [nisn, setNisn] = useState('');
  const [gender, setGender] = useState<'L' | 'P'>('L');
  const [classId, setClassId] = useState('');

  useEffect(() => {
    if (initialData) {
      setAttendanceNo(initialData.attendanceNo !== undefined ? String(initialData.attendanceNo) : '');
      setName(initialData.name || '');
      setNisn(initialData.nisn || '');
      setGender(initialData.gender || 'L');
      setClassId(initialData.classId || (selectedClassId && selectedClassId !== 'ALL' ? selectedClassId : classes[0]?.id || ''));
    } else {
      // Clean, completely empty form for new student
      setAttendanceNo('');
      setName('');
      setNisn('');
      setGender('L');
      setClassId(selectedClassId && selectedClassId !== 'ALL' ? selectedClassId : classes[0]?.id || '');
    }
  }, [initialData, isOpen, selectedClassId, classes]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Mohon isi nama lengkap siswa.');
      return;
    }
    if (!classId) {
      alert('Mohon pilih kelas untuk siswa.');
      return;
    }

    const student: Student = {
      id: initialData ? initialData.id : `std-${Date.now()}`,
      attendanceNo: attendanceNo.trim() ? Number(attendanceNo) || attendanceNo.trim() : undefined,
      name: name.trim(),
      nisn: nisn.trim(),
      gender,
      classId,
      active: true,
    };

    onSave(student);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[#0F172A] border border-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4.5 bg-[#0B1120] border-b border-slate-800 text-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center border border-blue-500/20 flex-shrink-0">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {initialData ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}
              </h3>
              <p className="text-xs text-slate-400">
                {initialData ? 'Perbarui data siswa' : 'Isi formulir data siswa baru'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-slate-200 text-xs sm:text-sm">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <label className="block font-semibold text-slate-300 mb-1.5">No. Absen</label>
              <input
                type="number"
                min="1"
                placeholder="Contoh: 1"
                value={attendanceNo}
                onChange={(e) => setAttendanceNo(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-700 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-[#0B1120] text-white"
              />
            </div>
            <div className="col-span-2">
              <label className="block font-semibold text-slate-300 mb-1.5">
                Kelas <span className="text-blue-400">*</span>
              </label>
              <select
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-700 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-[#0B1120] text-white font-medium cursor-pointer"
                required
              >
                <option value="" disabled>Pilih Kelas</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">
              Nama Lengkap Siswa <span className="text-blue-400">*</span>
            </label>
            <input
              type="text"
              placeholder="Contoh: Muhammad Rizky Pratama"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-700 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-[#0B1120] text-white"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">NISN (10 Digit)</label>
              <input
                type="text"
                placeholder="Contoh: 0081234567"
                value={nisn}
                onChange={(e) => setNisn(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-700 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-[#0B1120] text-white font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">Jenis Kelamin</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as 'L' | 'P')}
                className="w-full px-3.5 py-2.5 border border-slate-700 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-[#0B1120] text-white font-medium cursor-pointer"
              >
                <option value="L">Laki-laki (L)</option>
                <option value="P">Perempuan (P)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-lg shadow-blue-600/30 transition-all active:scale-95 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-white" />
              <span>Simpan Data</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

