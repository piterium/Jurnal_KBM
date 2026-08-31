import React, { useState, useEffect } from 'react';
import { TeachingJournal, ClassRoom } from '../../types';
import { X, BookOpen, CheckCircle2, UserCheck, Clock, Sparkles, Layers, RotateCcw } from 'lucide-react';

interface JournalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (journal: TeachingJournal, autoCreateAttendance: boolean) => void;
  classes: ClassRoom[];
  initialData?: TeachingJournal | null;
  defaultSubject: string;
}

export const JournalModal: React.FC<JournalModalProps> = ({
  isOpen,
  onClose,
  onSave,
  classes,
  initialData,
  defaultSubject,
}) => {
  const [classId, setClassId] = useState('');
  const [date, setDate] = useState('');
  const [meetingNumber, setMeetingNumber] = useState(1);
  const [jamKe, setJamKe] = useState('1, 2');
  const [hoursCount, setHoursCount] = useState(2);
  const [subject, setSubject] = useState(defaultSubject);
  const [topic, setTopic] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [status, setStatus] = useState<'Terlaksana' | 'Tertunda' | 'Diganti'>('Terlaksana');
  const [autoCreateAttendance, setAutoCreateAttendance] = useState(true);

  useEffect(() => {
    if (initialData) {
      setClassId(initialData.classId);
      setDate(initialData.date);
      setMeetingNumber(initialData.meetingNumber);
      setJamKe(initialData.jamKe || '1, 2');
      setHoursCount(initialData.hoursCount || 2);
      setSubject(initialData.subject || defaultSubject || 'Informatika');
      setTopic(initialData.topic || '');
      setKeterangan(initialData.keterangan || initialData.notes || '');
      setStatus(initialData.status || 'Terlaksana');
      setAutoCreateAttendance(false); // existing journal
    } else {
      const today = new Date().toISOString().split('T')[0];
      setDate(today);
      const firstClass = classes[0];
      setClassId(firstClass?.id || '');
      setMeetingNumber(1);
      setJamKe('1, 2');
      setHoursCount(2);
      // Automatically pull subject from profile setting (or fallback to class subject)
      const activeSubject = defaultSubject?.trim() || firstClass?.subject?.trim() || 'Informatika';
      setSubject(activeSubject);
      setTopic('');
      setKeterangan('');
      setStatus('Terlaksana');
      setAutoCreateAttendance(true);
    }
  }, [initialData, isOpen, classes, defaultSubject]);

  if (!isOpen) return null;

  const handleClassSelectChange = (newClassId: string) => {
    setClassId(newClassId);
    // If user is recording a new journal, ensure subject syncs with profile setting or class setting
    if (!initialData) {
      const selectedCls = classes.find((c) => c.id === newClassId);
      const activeSubject = defaultSubject?.trim() || selectedCls?.subject?.trim() || '';
      if (activeSubject) {
        setSubject(activeSubject);
      }
    }
  };

  const handleResetToProfileSubject = () => {
    if (defaultSubject?.trim()) {
      setSubject(defaultSubject.trim());
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!classId || !date || !topic) {
      alert('Mohon lengkapi Kelas, Tanggal, dan Materi Pokok.');
      return;
    }

    const journal: TeachingJournal = {
      id: initialData ? initialData.id : `jrn-${Date.now()}`,
      classId,
      date,
      meetingNumber: Number(meetingNumber),
      jamKe: jamKe.trim() || '1, 2',
      hoursCount: Number(hoursCount) || 2,
      subject: subject.trim() || defaultSubject || 'Mata Pelajaran',
      topic: topic.trim(),
      keterangan: keterangan.trim(),
      notes: keterangan.trim(),
      status,
      attendanceSessionId: initialData?.attendanceSessionId,
      studentsPresentCount: initialData?.studentsPresentCount,
      studentsTotalCount: initialData?.studentsTotalCount,
    };

    onSave(journal, autoCreateAttendance);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#0F172A] border border-slate-800 rounded-2xl shadow-2xl w-full max-w-xl my-8 overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4.5 bg-[#0B1120] border-b border-slate-800 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center border border-blue-500/20 flex-shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {initialData ? 'Edit Jurnal Mengajar' : 'Catat Jurnal Mengajar Baru'}
              </h3>
              <p className="text-xs text-slate-400">
                Target kelas dan mata pelajaran terhubung langsung dengan Pengaturan Profil
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

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-slate-300">
          {/* Target Kelas & Mata Pelajaran */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Target Kelas <span className="text-blue-400">*</span>
                </label>
                <span className="text-[10px] text-slate-400">Data Master Kelas</span>
              </div>
              <select
                value={classId}
                onChange={(e) => handleClassSelectChange(e.target.value)}
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 border border-slate-700 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-[#0B1120] text-white"
                required
              >
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} ({cls.subject || defaultSubject || 'Mapel'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Mata Pelajaran <span className="text-blue-400">*</span>
                </label>
                {defaultSubject ? (
                  <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                    Otomatis dari Profil
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400">Mapel Pengampu</span>
                )}
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Contoh: Informatika"
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 border border-slate-700 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-[#0B1120] text-white font-medium pr-8"
                  required
                />
                {defaultSubject && subject !== defaultSubject && (
                  <button
                    type="button"
                    onClick={handleResetToProfileSubject}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded transition-colors"
                    title={`Reset ke Mata Pelajaran Profil: ${defaultSubject}`}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Tanggal Pelaksanaan <span className="text-blue-400">*</span>
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
                Status Pembelajaran
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 border border-slate-700 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-[#0B1120] text-white font-medium"
              >
                <option value="Terlaksana">Terlaksana</option>
                <option value="Tertunda">Tertunda</option>
                <option value="Diganti">Diganti</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Pertemuan Ke- <span className="text-blue-400">*</span>
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={meetingNumber}
                onChange={(e) => setMeetingNumber(Number(e.target.value))}
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 border border-slate-700 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-[#0B1120] text-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Jam Ke- <span className="text-blue-400">*</span>
              </label>
              <input
                type="text"
                placeholder="Contoh: 1, 2, 3 atau 1-2"
                value={jamKe}
                onChange={(e) => setJamKe(e.target.value)}
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 border border-slate-700 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-[#0B1120] text-white font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Jumlah Jam (JP)
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={hoursCount}
                onChange={(e) => setHoursCount(Number(e.target.value))}
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 border border-slate-700 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-[#0B1120] text-white"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Materi Pokok / Pokok Bahasan <span className="text-blue-400">*</span>
            </label>
            <input
              type="text"
              placeholder="Contoh: Berpikir Komputasional & Pengenalan Algoritma Sederhana"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 border border-slate-700 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-[#0B1120] text-white font-medium"
              required
            />
          </div>

          {/* KETERANGAN / KET FORM FIELD */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Keterangan (Ket.) / Catatan KBM
              </label>
              <span className="text-[11px] text-slate-400">Opsional</span>
            </div>
            <textarea
              rows={2}
              placeholder="Contoh: Praktik di Lab Komputer, diskusi kelompok berjalan lancar, remedial 2 siswa, atau KBM selesai tepat waktu"
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 border border-slate-700 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-[#0B1120] text-white font-medium resize-none"
            />
            {/* Quick Suggestions Chips */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="text-[10px] text-slate-400 font-semibold">Rekomendasi Cepat:</span>
              {[
                'Tuntas Sesuai Jadwal',
                'Praktik di Lab',
                'Diskusi & Presentasi',
                'Penilaian Harian',
                'Remedial & Pengayaan',
                'Tugas Kelompok',
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => {
                    if (keterangan) {
                      if (!keterangan.includes(suggestion)) {
                        setKeterangan(`${keterangan}, ${suggestion}`);
                      }
                    } else {
                      setKeterangan(suggestion);
                    }
                  }}
                  className="px-2 py-0.5 text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-md border border-slate-700/80 transition-colors cursor-pointer"
                >
                  + {suggestion}
                </button>
              ))}
            </div>
          </div>

          {/* Integrated Attendance Option */}
          {!initialData && (
            <div className="p-3.5 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-start gap-3">
              <input
                type="checkbox"
                id="check-auto-att"
                checked={autoCreateAttendance}
                onChange={(e) => setAutoCreateAttendance(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-blue-600 rounded border-slate-700 bg-[#0B1120] focus:ring-blue-500 cursor-pointer"
              />
              <label htmlFor="check-auto-att" className="text-xs text-slate-200 cursor-pointer">
                <span className="font-bold flex items-center gap-1.5 text-blue-400">
                  <UserCheck className="w-3.5 h-3.5" />
                  Integrasikan Presensi Otomatis (Default: Nihil / Hadir Semua)
                </span>
                <span className="text-slate-400 block mt-0.5">
                  Otomatis menandai semua siswa hadir (Presensi: Nihil). Jika ada siswa Sakit, Izin, atau Alpa, jumlah ketidakhadiran akan otomatis terhitung dan tercatat di jurnal.
                </span>
              </label>
            </div>
          )}

          {/* Footer Buttons */}
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
              <span>{initialData ? 'Simpan Perubahan' : 'Simpan Jurnal Mengajar'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
