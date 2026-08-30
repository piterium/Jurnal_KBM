import React, { useState, useEffect } from 'react';
import { AssessmentItem, AssessmentType, ClassRoom, Student } from '../../types';
import { X, GraduationCap, CheckCircle2 } from 'lucide-react';

interface AssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (assessment: AssessmentItem) => void;
  classes: ClassRoom[];
  students: Student[];
  initialData?: AssessmentItem | null;
  selectedClassId: string;
}

export const AssessmentModal: React.FC<AssessmentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  classes,
  students,
  initialData,
  selectedClassId,
}) => {
  const [classId, setClassId] = useState(selectedClassId || classes[0]?.id || '');
  const [title, setTitle] = useState('');
  const [type, setType] = useState<AssessmentType>('FORMATIF_TUGAS');
  const [date, setDate] = useState('');
  const [maxScore, setMaxScore] = useState(100);
  const [kkm, setKkm] = useState(75);
  const [weight, setWeight] = useState(1);
  const [scores, setScores] = useState<Record<string, number | null>>({});

  useEffect(() => {
    if (initialData) {
      setClassId(initialData.classId);
      setTitle(initialData.title);
      setType(initialData.type);
      setDate(initialData.date);
      setMaxScore(initialData.maxScore || 100);
      setKkm(initialData.kkm || 75);
      setWeight(initialData.weight || 1);
      setScores(initialData.scores || {});
    } else {
      const cls = classes.find(c => c.id === selectedClassId) || classes[0];
      setClassId(cls?.id || '');
      setTitle('');
      setType('FORMATIF_TUGAS');
      setDate(new Date().toISOString().split('T')[0]);
      setMaxScore(100);
      setKkm(cls?.kkm || 75);
      setWeight(1);
      setScores({});
    }
  }, [initialData, isOpen, selectedClassId, classes]);

  if (!isOpen) return null;

  const currentClassStudents = students.filter(s => s.classId === classId && s.active);

  const handleScoreChange = (studentId: string, val: string) => {
    if (val === '') {
      setScores(prev => ({ ...prev, [studentId]: null }));
    } else {
      const num = Math.min(maxScore, Math.max(0, Number(val)));
      setScores(prev => ({ ...prev, [studentId]: num }));
    }
  };

  const handleSetAllScores = (scoreVal: number) => {
    const newScores: Record<string, number> = {};
    currentClassStudents.forEach(s => {
      newScores[s.id] = scoreVal;
    });
    setScores(newScores);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !classId || !date) {
      alert('Mohon isi Judul Asesmen, Kelas, dan Tanggal.');
      return;
    }

    const currentClass = classes.find(c => c.id === classId);

    const asm: AssessmentItem = {
      id: initialData ? initialData.id : `asm-${Date.now()}`,
      title,
      type,
      classId,
      subject: currentClass?.subject || 'Mata Pelajaran',
      date,
      maxScore: Number(maxScore),
      kkm: Number(kkm),
      weight: Number(weight),
      scores,
    };

    onSave(asm);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#0F172A] border border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl my-8 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 bg-[#0B1120] border-b border-slate-800 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center border border-blue-500/20 flex-shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {initialData ? 'Edit Data Nilai Asesmen' : 'Tambah Nilai / Asesmen Baru'}
              </h3>
              <p className="text-xs text-slate-400">
                Formatif, Sumatif Harian, STS, SAS, dan Penugasan Siswa
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
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-slate-300">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Target Kelas <span className="text-blue-400">*</span>
              </label>
              <select
                value={classId}
                onChange={(e) => {
                  setClassId(e.target.value);
                  const cls = classes.find(c => c.id === e.target.value);
                  if (cls) setKkm(cls.kkm);
                }}
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 border border-slate-700 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-[#0B1120] text-white"
                required
              >
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} (KKM: {cls.kkm})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Kategori Asesmen <span className="text-blue-400">*</span>
              </label>
              <select
                value={type}
                onChange={(e) => {
                  const newType = e.target.value as AssessmentType;
                  setType(newType);
                  // Optional auto-title suggestion if title is empty
                  if (!title.trim() || title.startsWith('Ulangan Harian') || title.startsWith('UH')) {
                    if (newType === 'SUMATIF_UH1') setTitle('Ulangan Harian 1 (UH1)');
                    else if (newType === 'SUMATIF_UH2') setTitle('Ulangan Harian 2 (UH2)');
                    else if (newType === 'SUMATIF_UH3') setTitle('Ulangan Harian 3 (UH3)');
                    else if (newType === 'SUMATIF_UH4') setTitle('Ulangan Harian 4 (UH4)');
                    else if (newType === 'SUMATIF_UH5') setTitle('Ulangan Harian 5 (UH5)');
                  }
                }}
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 border border-slate-700 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-[#0B1120] text-white font-medium"
              >
                <optgroup label="Asesmen Sumatif Ulangan Harian">
                  <option value="SUMATIF_UH1">Sumatif: Ulangan Harian 1 (UH1)</option>
                  <option value="SUMATIF_UH2">Sumatif: Ulangan Harian 2 (UH2)</option>
                  <option value="SUMATIF_UH3">Sumatif: Ulangan Harian 3 (UH3)</option>
                  <option value="SUMATIF_UH4">Sumatif: Ulangan Harian 4 (UH4)</option>
                  <option value="SUMATIF_UH5">Sumatif: Ulangan Harian 5 (UH5)</option>
                  <option value="SUMATIF_UH">Sumatif: Ulangan Harian (UH Umum)</option>
                </optgroup>
                <optgroup label="Asesmen Formatif">
                  <option value="FORMATIF_TUGAS">Formatif: Tugas / PR</option>
                  <option value="FORMATIF_KUIS">Formatif: Kuis Singkat</option>
                  <option value="FORMATIF_PRAKTEK">Formatif: Praktik / Portofolio</option>
                </optgroup>
                <optgroup label="Sumatif Semester & Lainnya">
                  <option value="SUMATIF_STS">Sumatif: Tengah Semester (STS/UTS)</option>
                  <option value="SUMATIF_SAS">Sumatif: Akhir Semester (SAS/UAS)</option>
                  <option value="LAINNYA">Lainnya / Ekstra</option>
                </optgroup>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Judul / Keterangan Penilaian <span className="text-blue-400">*</span>
            </label>
            <input
              type="text"
              placeholder="Contoh: Tugas 1: Algoritma dan Pemrograman Sederhana"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 border border-slate-700 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-[#0B1120] text-white"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Tanggal Penilaian
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 border border-slate-700 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-[#0B1120] text-white"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                KKM / KKTP
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={kkm}
                onChange={(e) => setKkm(Number(e.target.value))}
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 border border-slate-700 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-[#0B1120] text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Bobot Nilai (1 - 5)
              </label>
              <input
                type="number"
                min="1"
                max="5"
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 border border-slate-700 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-[#0B1120] text-white"
              />
            </div>
          </div>

          {/* Student Scores Roster */}
          <div className="border border-slate-800 rounded-xl overflow-hidden bg-[#0B1120]">
            <div className="p-3 bg-[#0F172A] border-b border-slate-800 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Input Nilai Siswa Langsung ({currentClassStudents.length} Siswa)
                </h4>
                <p className="text-[11px] text-slate-400">Nilai dapat diedit langsung di bawah atau nanti di tabel leger.</p>
              </div>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => handleSetAllScores(85)}
                  className="text-[11px] px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg font-medium cursor-pointer transition-colors"
                >
                  Set 85 Semua
                </button>
              </div>
            </div>

            <div className="max-h-56 overflow-y-auto divide-y divide-slate-800">
              {currentClassStudents.map((std, idx) => {
                const curScore = scores[std.id];
                const isPass = curScore !== null && curScore !== undefined ? curScore >= kkm : true;
                return (
                  <div key={std.id} className="p-2.5 flex items-center justify-between bg-[#0F172A] hover:bg-slate-800/40">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-500 w-5">{idx + 1}.</span>
                      <div>
                        <div className="text-xs font-medium text-white">{std.name}</div>
                        <div className="text-[10px] text-slate-400">NISN: {std.nisn} ({std.gender})</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max={maxScore}
                        placeholder="Nilai"
                        value={curScore === null || curScore === undefined ? '' : curScore}
                        onChange={(e) => handleScoreChange(std.id, e.target.value)}
                        className={`w-18 text-center text-xs font-bold px-2 py-1.5 border rounded-lg outline-none ${
                          curScore !== null && curScore !== undefined
                            ? isPass
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                            : 'border-slate-700 bg-[#0B1120] text-white'
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-95 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-white" />
              <span>{initialData ? 'Simpan Perubahan' : 'Simpan Asesmen & Nilai'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
