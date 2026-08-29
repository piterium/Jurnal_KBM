import React, { useState, useEffect } from 'react';
import { ClassRoom } from '../../types';
import { X, Layers, CheckCircle2, BookOpen, Calendar, Award } from 'lucide-react';

interface ClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (classRoom: ClassRoom) => void;
  initialData?: ClassRoom | null;
  defaultSubject: string;
  defaultAcademicYear: string;
}

const GRADE_LEVELS = ['VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

export const ClassModal: React.FC<ClassModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  defaultSubject,
  defaultAcademicYear,
}) => {
  const [name, setName] = useState('');
  const [gradeLevel, setGradeLevel] = useState('VII');
  const [subject, setSubject] = useState('');
  const [kkm, setKkm] = useState<number>(75);
  const [academicYear, setAcademicYear] = useState('');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setGradeLevel(initialData.gradeLevel || 'VII');
      setSubject(initialData.subject || defaultSubject || 'Informatika');
      setKkm(initialData.kkm || 75);
      setAcademicYear(initialData.academicYear || defaultAcademicYear || '2025/2026');
    } else {
      setName('Kelas VII-A');
      setGradeLevel('VII');
      setSubject(defaultSubject || 'Informatika');
      setKkm(75);
      setAcademicYear(defaultAcademicYear || '2025/2026');
    }
  }, [initialData, isOpen, defaultSubject, defaultAcademicYear]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Silakan masukkan nama kelas / rombel.');
      return;
    }

    const cls: ClassRoom = {
      id: initialData ? initialData.id : `cls-${Date.now()}`,
      name: name.trim(),
      gradeLevel: gradeLevel || 'VII',
      academicYear: academicYear.trim() || defaultAcademicYear || '2025/2026',
      subject: subject.trim() || defaultSubject || 'Mata Pelajaran',
      kkm: Number(kkm) || 75,
    };

    onSave(cls);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[#0F172A] border border-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4.5 bg-[#0B1120] border-b border-slate-800 text-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center border border-blue-500/20 flex-shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {initialData ? 'Edit Pengaturan Kelas' : 'Tambah Kelas Baru'}
              </h3>
              <p className="text-xs text-slate-400">
                Atur nama rombel, tingkat jenjang, dan target KKM
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-slate-300 text-xs sm:text-sm">
          {/* Nama Kelas */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">
              Nama Kelas / Rombel <span className="text-blue-400">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: VII A atau Kelas 7-A"
              className="w-full px-3.5 py-2.5 border border-slate-700 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-[#0B1120] text-white font-medium placeholder:text-slate-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Tingkat Dropdown */}
            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">
                Tingkat / Jenjang <span className="text-blue-400">*</span>
              </label>
              <select
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-700 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-[#0B1120] text-white font-medium cursor-pointer"
                required
              >
                {GRADE_LEVELS.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    Tingkat {lvl}
                  </option>
                ))}
              </select>
            </div>

            {/* KKM */}
            <div>
              <label className="block font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-blue-400" />
                <span>KKM Target</span>
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={kkm}
                onChange={(e) => setKkm(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 border border-slate-700 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-[#0B1120] text-white font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Mata Pelajaran */}
            <div>
              <label className="block font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                <span>Mata Pelajaran</span>
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Mata Pelajaran"
                className="w-full px-3.5 py-2.5 border border-slate-700 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-[#0B1120] text-white font-medium placeholder:text-slate-500"
              />
            </div>

            {/* Tahun Pelajaran */}
            <div>
              <label className="block font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                <span>Tahun Ajaran</span>
              </label>
              <input
                type="text"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                placeholder="2025/2026"
                className="w-full px-3.5 py-2.5 border border-slate-700 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-[#0B1120] text-white font-medium placeholder:text-slate-500"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-95 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-white" />
              <span>Simpan Pengaturan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

