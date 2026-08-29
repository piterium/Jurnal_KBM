import React, { useState } from 'react';
import { Teacher, ClassRoom } from '../../types';
import { UserCheck, X, CheckCircle2, GraduationCap, BookOpen, Layers } from 'lucide-react';

interface TeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
  classes: ClassRoom[];
  initialData?: Teacher | null;
  onSave: (teacherData: Omit<Teacher, 'id'>, teacherId?: string) => void;
}

export const TeacherModal: React.FC<TeacherModalProps> = ({
  isOpen,
  onClose,
  classes,
  initialData,
  onSave,
}) => {
  const [name, setName] = useState(initialData?.name || '');
  const [nip, setNip] = useState(initialData?.nip || '');
  const [subject, setSubject] = useState(initialData?.subject || 'Informatika');
  const [selectedClasses, setSelectedClasses] = useState<string[]>(
    initialData?.classesTaught || (classes[0] ? [classes[0].name] : [])
  );
  const [employmentStatus, setEmploymentStatus] = useState<
    'PNS' | 'PPPK' | 'GTT' | 'Guru Tetap Yayasan' | 'Honor Sekolah'
  >(initialData?.employmentStatus || 'PNS');
  const [gender, setGender] = useState<'L' | 'P'>(initialData?.gender || 'L');
  const [education, setEducation] = useState(initialData?.education || 'S1 Kependidikan');
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [email, setEmail] = useState(initialData?.email || '');
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [isHeadmaster, setIsHeadmaster] = useState(initialData?.isHeadmaster || false);

  if (!isOpen) return null;

  const handleToggleClass = (className: string) => {
    if (selectedClasses.includes(className)) {
      setSelectedClasses(selectedClasses.filter((c) => c !== className));
    } else {
      setSelectedClasses([...selectedClasses, className]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Nama guru wajib diisi.');
      return;
    }
    if (!subject.trim()) {
      alert('Mata pelajaran wajib diisi.');
      return;
    }

    onSave(
      {
        name: name.trim(),
        nip: nip.trim() || '-',
        subject: subject.trim(),
        classesTaught: selectedClasses,
        employmentStatus,
        gender,
        education: education.trim(),
        phone: phone.trim(),
        email: email.trim(),
        notes: notes.trim(),
        isHeadmaster,
      },
      initialData?.id
    );
    onClose();
  };

  const commonSubjects = [
    'Informatika',
    'Matematika',
    'Bahasa Indonesia',
    'Ilmu Pengetahuan Alam (IPA)',
    'Ilmu Pengetahuan Sosial (IPS)',
    'Bahasa Inggris',
    'Pendidikan Agama Islam & Budi Pekerti',
    'Pendidikan Agama Kristen',
    'Pendidikan Pancasila',
    'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)',
    'Seni Budaya & Prakarya',
    'Bimbingan dan Konseling (BK)',
    'Bahasa Daerah',
    'Prakarya & Kewirausahaan',
  ];

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
                {initialData ? 'Edit Data Guru & Mapel' : 'Tambah Guru & Mapel Baru'}
              </h3>
              <p className="text-xs text-slate-400">
                Lengkapi identitas tenaga pendidik, mata pelajaran, dan kelas ampuannya
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
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Nama Lengkap Guru beserta Gelar <span className="text-blue-400">*</span>
            </label>
            <input
              type="text"
              placeholder="Contoh: Dra. Hj. Siti Aminah, M.Pd."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 border border-slate-700 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-[#0B1120] text-white"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                NIP / NUPTK / NIK
              </label>
              <input
                type="text"
                placeholder="19880412 201502 2 003"
                value={nip}
                onChange={(e) => setNip(e.target.value)}
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 border border-slate-700 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-[#0B1120] text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Status Kepegawaian
              </label>
              <select
                value={employmentStatus}
                onChange={(e) => setEmploymentStatus(e.target.value as any)}
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 border border-slate-700 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-[#0B1120] text-white font-medium"
              >
                <option value="PNS">PNS (Pegawai Negeri Sipil)</option>
                <option value="PPPK">PPPK (Pegawai Pemerintah dg Perjanjian Kerja)</option>
                <option value="GTT">GTT / Guru Tidak Tetap</option>
                <option value="Guru Tetap Yayasan">Guru Tetap Yayasan</option>
                <option value="Honor Sekolah">Guru Honor Sekolah</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Mata Pelajaran yang Diampu <span className="text-blue-400">*</span>
              </label>
              <input
                type="text"
                list="subject-suggestions"
                placeholder="Ketik atau pilih mapel..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 border border-slate-700 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-[#0B1120] text-white font-semibold text-blue-400"
                required
              />
              <datalist id="subject-suggestions">
                {commonSubjects.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Jenis Kelamin
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as 'L' | 'P')}
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 border border-slate-700 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-[#0B1120] text-white"
              >
                <option value="L">Laki-laki (L)</option>
                <option value="P">Perempuan (P)</option>
              </select>
            </div>
          </div>

          {/* Classes Taught Multi-Select */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Kelas yang Diampu ({selectedClasses.length} Kelas Dipilih)</span>
              <span className="text-[11px] text-blue-400">Klik untuk memilih rombel</span>
            </label>
            <div className="p-3 bg-[#0B1120] border border-slate-800 rounded-xl flex flex-wrap gap-2">
              {classes.map((cls) => {
                const isSelected = selectedClasses.includes(cls.name);
                return (
                  <button
                    key={cls.id}
                    type="button"
                    onClick={() => handleToggleClass(cls.name)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/20 font-bold'
                        : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    {cls.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Pendidikan Terakhir
              </label>
              <input
                type="text"
                placeholder="Contoh: S1 Pendidikan Komputer"
                value={education}
                onChange={(e) => setEducation(e.target.value)}
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 border border-slate-700 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-[#0B1120] text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                No. WhatsApp / HP
              </label>
              <input
                type="text"
                placeholder="081234567890"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 border border-slate-700 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-[#0B1120] text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Email Akun Belajar / Dinas
              </label>
              <input
                type="email"
                placeholder="guru@smp.belajar.id"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 border border-slate-700 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-[#0B1120] text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Tugas Tambahan / Catatan Khusus
            </label>
            <input
              type="text"
              placeholder="Contoh: Wali Kelas VII-A / Waka Kurikulum / Pembina OSIS / Kepala Lab"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 border border-slate-700 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-[#0B1120] text-white"
            />
          </div>

          {/* Is Headmaster switch */}
          <div className="p-3 bg-[#0B1120] border border-slate-800 rounded-xl flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-white">Menjabat Sebagai Kepala Sekolah</div>
              <div className="text-[11px] text-slate-400">Tandai jika guru ini menjabat pimpinan instansi</div>
            </div>
            <input
              type="checkbox"
              id="chk-headmaster"
              checked={isHeadmaster}
              onChange={(e) => setIsHeadmaster(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-slate-700 bg-[#0B1120] focus:ring-blue-500 cursor-pointer"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs sm:text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-2.5 text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-95 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-white" />
              <span>{initialData ? 'Simpan Perubahan' : 'Simpan Data Guru'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
