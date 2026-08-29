import React, { useState, useEffect } from 'react';
import { ClassRoom } from '../../types';
import { X, Layers, CheckCircle2 } from 'lucide-react';

interface ClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (classRoom: ClassRoom) => void;
  initialData?: ClassRoom | null;
  defaultSubject: string;
  defaultAcademicYear: string;
}

const GRADE_LEVELS = ['VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
const CLASS_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

export const ClassModal: React.FC<ClassModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  defaultSubject,
  defaultAcademicYear,
}) => {
  const [gradeLevel, setGradeLevel] = useState('VII');
  const [classLetter, setClassLetter] = useState('A');

  useEffect(() => {
    if (initialData) {
      // Find matching grade level
      const foundGrade = GRADE_LEVELS.find((g) => g === initialData.gradeLevel) || 'VII';
      setGradeLevel(foundGrade);

      // Extract letter from name (e.g. "Kelas VII-A" -> "A", "7B" -> "B")
      let foundLetter = 'A';
      const cleanName = initialData.name.toUpperCase();
      for (const letter of CLASS_LETTERS) {
        if (cleanName.endsWith(`-${letter}`) || cleanName.endsWith(` ${letter}`) || cleanName.endsWith(letter)) {
          foundLetter = letter;
          break;
        }
      }
      setClassLetter(foundLetter);
    } else {
      setGradeLevel('VII');
      setClassLetter('A');
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const generatedClassName = `Kelas ${gradeLevel}-${classLetter}`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const cls: ClassRoom = {
      id: initialData ? initialData.id : `cls-${Date.now()}`,
      name: generatedClassName,
      gradeLevel,
      academicYear: initialData?.academicYear || defaultAcademicYear || '2025/2026',
      subject: initialData?.subject || defaultSubject || 'Informatika',
      kkm: initialData?.kkm || 75,
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
                {initialData ? 'Edit Data Kelas' : 'Tambah Kelas Baru'}
              </h3>
              <p className="text-xs text-slate-400">
                Pilih tingkat jenjang dan huruf rombel kelas
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
          <div className="grid grid-cols-2 gap-4">
            {/* Tingkat Dropdown */}
            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">
                Tingkat <span className="text-blue-400">*</span>
              </label>
              <select
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-700 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-[#0B1120] text-white font-medium cursor-pointer"
                required
              >
                <option value="VII">VII (Kelas 7)</option>
                <option value="VIII">VIII (Kelas 8)</option>
                <option value="IX">IX (Kelas 9)</option>
                <option value="X">X (Kelas 10)</option>
                <option value="XI">XI (Kelas 11)</option>
                <option value="XII">XII (Kelas 12)</option>
              </select>
            </div>

            {/* Nama Kelas / Rombel Dropdown */}
            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">
                Nama Kelas <span className="text-blue-400">*</span>
              </label>
              <select
                value={classLetter}
                onChange={(e) => setClassLetter(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-700 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-[#0B1120] text-white font-medium cursor-pointer"
                required
              >
                {CLASS_LETTERS.map((letter) => (
                  <option key={letter} value={letter}>
                    Kelas {letter}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Preview Box */}
          <div className="bg-[#0B1120] p-4 rounded-xl border border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Nama Rombel yang Dibuat:</span>
            <span className="px-3 py-1 bg-blue-500/10 text-blue-400 font-bold rounded-lg border border-blue-500/20 text-sm">
              {generatedClassName}
            </span>
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
              <span>Simpan Kelas</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

