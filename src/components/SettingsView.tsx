import React, { useState, useRef } from 'react';
import { SchoolProfile, ClassRoom, Student, AppData } from '../types';
import {
  Settings,
  Layers,
  Save,
  RotateCcw,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Image as ImageIcon,
  X,
  Database,
  Palette,
  Search,
  BookOpen,
  Calendar,
  Award,
  School,
  Upload,
  User,
  Users,
  Sun,
  Moon,
} from 'lucide-react';
import { useTheme, THEME_OPTIONS } from '../context/ThemeContext';

interface SettingsViewProps {
  data: AppData;
  onUpdateProfile: (profile: SchoolProfile) => void;
  onAddClass: () => void;
  onEditClass: (cls: ClassRoom) => void;
  onDeleteClass: (id: string) => void;
  onAddStudent: () => void;
  onEditStudent: (std: Student) => void;
  onDeleteStudent: (id: string) => void;
  onResetData: () => void;
  onDeleteDatabase?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  data,
  onUpdateProfile,
  onAddClass,
  onEditClass,
  onDeleteClass,
  onAddStudent,
  onEditStudent,
  onDeleteStudent,
  onResetData,
  onDeleteDatabase,
}) => {
  const { profile, classes, students } = data;

  const { theme, setTheme } = useTheme();

  const [activeSection, setActiveSection] = useState<'PROFILE' | 'CLASSES' | 'THEME' | 'DATABASE'>('PROFILE');
  const [formData, setFormData] = useState<SchoolProfile>({ ...profile });
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [classSearch, setClassSearch] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (max 2MB for base64 safety)
    if (file.size > 2 * 1024 * 1024) {
      alert('Ukuran file logo maksimal 2 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        setFormData((prev) => ({ ...prev, logoUrl: base64 }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmDeleteDatabase = () => {
    if (onDeleteDatabase) {
      onDeleteDatabase();
    } else {
      onResetData();
    }
    setIsDeleteModalOpen(false);
    setDeleteConfirmationText('');
    alert('Database aplikasi berhasil dikosongkan.');
  };

  const filteredClasses = classes.filter((cls) => {
    if (!classSearch.trim()) return true;
    const q = classSearch.toLowerCase();
    return (
      cls.name.toLowerCase().includes(q) ||
      (cls.gradeLevel && cls.gradeLevel.toLowerCase().includes(q)) ||
      (cls.subject && cls.subject.toLowerCase().includes(q))
    );
  });

  const totalStudentsInClasses = students.filter((s) => s.active).length;
  const avgKKM = classes.length
    ? Math.round(classes.reduce((acc, c) => acc + (c.kkm || 75), 0) / classes.length)
    : 75;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#0F172A] p-5 sm:p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center border border-blue-500/20 flex-shrink-0">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-wide">
                Pengaturan Sistem & Data Master
              </h2>
              <p className="text-xs text-slate-400">
                Kelola identitas sekolah, setting kelas/rombel, profil guru, tema tampilan, dan pencadangan database
              </p>
            </div>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="inline-flex p-1 bg-[#0B1120] rounded-xl border border-slate-800 self-start sm:self-auto overflow-x-auto gap-1">
          <button
            onClick={() => setActiveSection('PROFILE')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeSection === 'PROFILE' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Profil & Logo Sekolah
          </button>
          <button
            onClick={() => setActiveSection('CLASSES')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeSection === 'CLASSES' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Setting Kelas ({classes.length})</span>
          </button>
          <button
            onClick={() => setActiveSection('THEME')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeSection === 'THEME' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Tema Tampilan</span>
          </button>
          <button
            onClick={() => setActiveSection('DATABASE')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeSection === 'DATABASE' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Database & Reset</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: PROFIL & LOGO FORM */}
      {activeSection === 'PROFILE' && (
        <form onSubmit={handleProfileSubmit} className="bg-[#0F172A] p-6 sm:p-8 rounded-2xl border border-slate-800 shadow-xl space-y-6">
          {savedSuccess && (
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Profil sekolah, logo, dan data guru berhasil diperbarui!
            </div>
          )}

          {/* Upload Logo Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <ImageIcon className="w-4 h-4 text-blue-400" />
              <span>Logo Sekolah / Madrasah (Tampil pada Kop Surat PDF)</span>
            </h3>

            <div className="p-4 rounded-xl bg-[#0B1120] border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <div className="relative group">
                <div className="w-24 h-24 rounded-2xl bg-[#0F172A] border-2 border-dashed border-slate-700 flex items-center justify-center overflow-hidden p-1.5">
                  {formData.logoUrl ? (
                    <img
                      src={formData.logoUrl}
                      alt="Logo Sekolah"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="text-center text-slate-500">
                      <School className="w-8 h-8 mx-auto mb-1 text-slate-600" />
                      <span className="text-[10px]">Tanpa Logo</span>
                    </div>
                  )}
                </div>
                {formData.logoUrl && (
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, logoUrl: '' }))}
                    className="absolute -top-2 -right-2 p-1 bg-rose-500 text-white rounded-full shadow hover:bg-rose-600 transition-colors"
                    title="Hapus Logo"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml,image/webp"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Unggah Berkas Logo (PNG/JPG)</span>
                  </button>

                  {formData.logoUrl && (
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, logoUrl: '' }))}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                      <span>Hapus Logo</span>
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-400">
                  Logo akan otomatis dicetak pada bagian kiri Kop Surat di semua lembar ekspor PDF (Presensi, Jurnal, dan Nilai). Format yang disarankan: PNG transparan atau JPG, ukuran &lt; 2 MB.
                </p>
                <div className="pt-1">
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Atau masukkan tautan URL Logo secara langsung:
                  </label>
                  <input
                    type="url"
                    placeholder="https://example.com/logo-sekolah.png"
                    value={formData.logoUrl || ''}
                    onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-700 rounded-lg outline-none focus:border-blue-500 bg-[#0F172A] text-white"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <School className="w-4 h-4 text-blue-400" />
              <span>Identitas Satuan Pendidikan & Kop Surat</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Nama Sekolah / Madrasah *</label>
                <input
                  type="text"
                  value={formData.schoolName}
                  onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 border border-slate-700 rounded-xl outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-[#0B1120] text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">NPSN Sekolah *</label>
                <input
                  type="text"
                  value={formData.npsn}
                  onChange={(e) => setFormData({ ...formData, npsn: e.target.value })}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 border border-slate-700 rounded-xl outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-[#0B1120] text-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Alamat Lengkap Sekolah *</label>
              <input
                type="text"
                value={formData.schoolAddress}
                onChange={(e) => setFormData({ ...formData, schoolAddress: e.target.value })}
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 border border-slate-700 rounded-xl outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-[#0B1120] text-white"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Kota / Kabupaten *</label>
                <input
                  type="text"
                  value={formData.districtCity}
                  onChange={(e) => setFormData({ ...formData, districtCity: e.target.value })}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 border border-slate-700 rounded-xl outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-[#0B1120] text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Provinsi</label>
                <input
                  type="text"
                  value={formData.province}
                  onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 border border-slate-700 rounded-xl outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-[#0B1120] text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Kode Pos</label>
                <input
                  type="text"
                  value={formData.postalCode || ''}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 border border-slate-700 rounded-xl outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-[#0B1120] text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Teks Header Kantor / Dinas (Tampil di baris paling atas Kop Surat PDF)
              </label>
              <textarea
                rows={2}
                value={formData.letterHeaderOffice}
                onChange={(e) => setFormData({ ...formData, letterHeaderOffice: e.target.value })}
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 border border-slate-700 rounded-xl outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-[#0B1120] text-white font-mono"
              />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <User className="w-4 h-4 text-blue-400" />
              <span>Data Guru Pengampu & Kepala Sekolah (Penandatangan)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Nama Lengkap Guru (Gelar) *</label>
                <input
                  type="text"
                  value={formData.teacherName}
                  onChange={(e) => setFormData({ ...formData, teacherName: e.target.value })}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 border border-slate-700 rounded-xl outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-[#0B1120] text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">NIP / NUPTK Guru</label>
                <input
                  type="text"
                  value={formData.teacherNip}
                  onChange={(e) => setFormData({ ...formData, teacherNip: e.target.value })}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 border border-slate-700 rounded-xl outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-[#0B1120] text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Nama Kepala Sekolah (Gelar) *</label>
                <input
                  type="text"
                  value={formData.headmasterName}
                  onChange={(e) => setFormData({ ...formData, headmasterName: e.target.value })}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 border border-slate-700 rounded-xl outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-[#0B1120] text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">NIP Kepala Sekolah</label>
                <input
                  type="text"
                  value={formData.headmasterNip}
                  onChange={(e) => setFormData({ ...formData, headmasterNip: e.target.value })}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 border border-slate-700 rounded-xl outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-[#0B1120] text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Mata Pelajaran Utama</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 border border-slate-700 rounded-xl outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-[#0B1120] text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Tahun Ajaran</label>
                <input
                  type="text"
                  value={formData.academicYear}
                  onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 border border-slate-700 rounded-xl outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-[#0B1120] text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Semester Aktif</label>
                <select
                  value={formData.semester}
                  onChange={(e) => setFormData({ ...formData, semester: e.target.value as any })}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 border border-slate-700 rounded-xl outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-[#0B1120] text-white font-medium"
                >
                  <option value="Ganjil">Semester Ganjil (1)</option>
                  <option value="Genap">Semester Genap (2)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-800">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg transition-all active:scale-95 cursor-pointer tracking-wide"
            >
              <Save className="w-4 h-4 text-white" />
              <span>Simpan Profil & Logo</span>
            </button>
          </div>
        </form>
      )}

      {/* SECTION 2: SETTING KELAS / ROMBEL */}
      {activeSection === 'CLASSES' && (
        <div className="bg-[#0F172A] p-6 sm:p-8 rounded-2xl border border-slate-800 shadow-xl space-y-6">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-400" />
                <span>Pengaturan & Daftar Kelas (Rombel)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Kelola rombongan belajar, tingkat jenjang, KKM target per kelas, dan alokasi siswa
              </p>
            </div>

            <button
              id="btn-add-class-settings"
              type="button"
              onClick={onAddClass}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold shadow-md shadow-blue-600/20 transition-all active:scale-95 cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4 text-white" />
              <span>Tambah Kelas Baru</span>
            </button>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-[#0B1120] border border-slate-800 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-medium text-slate-400 block">Total Kelas Aktif</span>
                <span className="text-lg font-bold text-white">{classes.length} Rombel</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#0B1120] border border-slate-800 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-medium text-slate-400 block">Total Siswa Terdaftar</span>
                <span className="text-lg font-bold text-white">{totalStudentsInClasses} Siswa</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#0B1120] border border-slate-800 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-medium text-slate-400 block">Rata-Rata KKM Kelas</span>
                <span className="text-lg font-bold text-white">{avgKKM}</span>
              </div>
            </div>
          </div>

          {/* Search Filter */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={classSearch}
              onChange={(e) => setClassSearch(e.target.value)}
              placeholder="Cari nama kelas, tingkat, atau mata pelajaran..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#0B1120] border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Class List Cards */}
          {filteredClasses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredClasses.map((cls) => {
                const classStudents = students.filter((s) => s.classId === cls.id && s.active);
                return (
                  <div
                    key={cls.id}
                    className="p-5 bg-[#0B1120] border border-slate-800 hover:border-slate-700 rounded-2xl flex flex-col justify-between transition-all group shadow-sm hover:shadow-md"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0 font-bold text-sm">
                            {cls.name.replace(/[^0-9A-Za-z]/g, '').substring(0, 3) || 'KL'}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
                              {cls.name}
                            </h4>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                Tingkat {cls.gradeLevel || 'VII'}
                              </span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                KKM: {cls.kkm || 75}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1.5 py-3 border-t border-b border-slate-800/80 text-xs text-slate-300">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 flex items-center gap-1.5">
                            <BookOpen className="w-3.5 h-3.5 text-slate-500" />
                            Mata Pelajaran:
                          </span>
                          <span className="font-semibold text-white">
                            {cls.subject || profile.subject || 'Informatika'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-500" />
                            Tahun Pelajaran:
                          </span>
                          <span className="font-semibold text-slate-300">
                            {cls.academicYear || profile.academicYear || '2025/2026'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-slate-500" />
                            Jumlah Siswa:
                          </span>
                          <span className="font-bold text-blue-400">
                            {classStudents.length} Siswa
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center justify-end gap-2 pt-3 mt-1">
                      <button
                        type="button"
                        onClick={() => onEditClass(cls)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-semibold transition-all cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-blue-400" />
                        <span>Edit Kelas</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (
                            window.confirm(
                              `Apakah Anda yakin ingin menghapus kelas "${cls.name}"? Siswa di kelas ini tetap tersimpan namun kelasnya akan dihapus.`
                            )
                          ) {
                            onDeleteClass(cls.id);
                          }
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg text-xs font-semibold border border-rose-500/20 transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                        <span>Hapus</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-10 rounded-2xl bg-[#0B1120] border border-slate-800 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto">
                <Layers className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-white">
                {classSearch.trim() ? 'Tidak Ada Kelas yang Cocok' : 'Belum Ada Kelas yang Ditambahkan'}
              </h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                {classSearch.trim()
                  ? `Tidak ditemukan rombel dengan kata kunci "${classSearch}". Silakan periksa kembali kata kunci pencarian Anda.`
                  : 'Tambahkan rombongan belajar pertama Anda untuk mulai mengisi jurnal mengajar, presensi, dan buku nilai siswa.'}
              </p>
              {!classSearch.trim() && (
                <button
                  type="button"
                  onClick={onAddClass}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all active:scale-95"
                >
                  <Plus className="w-4 h-4 text-white" />
                  <span>Tambah Kelas Pertama</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* SECTION: TEMA TAMPILAN (LIGHT & DARK) */}
      {activeSection === 'THEME' && (
        <div className="bg-[#0F172A] p-6 sm:p-8 rounded-2xl border border-slate-800 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Palette className="w-4 h-4 text-blue-400" />
                <span>Pilihan Tema & Nuansa Visual Aplikasi</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Pilih palet warna yang paling nyaman di mata Anda saat mengelola data presensi, jurnal mengajar, dan buku nilai.
              </p>
            </div>

            <div className="px-3.5 py-1.5 rounded-xl bg-blue-500/10 text-blue-400 text-xs font-bold border border-blue-500/20 flex items-center gap-2 self-start sm:self-auto">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse" />
              <span>Tema Aktif: {THEME_OPTIONS.find((t) => t.id === theme)?.name || theme}</span>
            </div>
          </div>

          {/* All 6 Theme Option Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {THEME_OPTIONS.map((opt) => {
              const isActive = theme === opt.id;
              return (
                <div
                  key={opt.id}
                  onClick={() => setTheme(opt.id)}
                  className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden group hover:shadow-lg ${
                    isActive
                      ? 'border-blue-500 bg-[#0B1120] shadow-xl ring-2 ring-blue-500/20'
                      : 'border-slate-800 bg-[#0B1120]/60 hover:border-slate-700'
                  }`}
                >
                  {isActive && (
                    <div className="absolute top-3.5 right-3.5 flex items-center gap-1 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Aktif</span>
                    </div>
                  )}

                  <div className="space-y-3.5">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 shadow-sm"
                        style={{
                          backgroundColor: `${opt.primaryColor}20`,
                          borderColor: `${opt.primaryColor}40`,
                          color: opt.primaryColor,
                        }}
                      >
                        {opt.category === 'light' ? (
                          <Sun className="w-5 h-5" />
                        ) : (
                          <Moon className="w-5 h-5" />
                        )}
                      </div>
                      <div className="pr-12">
                        <h4 className="text-sm font-bold text-white leading-snug">{opt.name}</h4>
                        <span className="text-[10px] font-semibold text-slate-400 block">{opt.tagline}</span>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                      {opt.description}
                    </p>

                    {/* Visual Mini Preview Box */}
                    <div
                      className="p-3 rounded-xl border space-y-1.5 transition-all shadow-inner"
                      style={{
                        backgroundColor: opt.previewBg,
                        borderColor: opt.previewBorder,
                        color: opt.previewText,
                      }}
                    >
                      <div className="flex items-center justify-between border-b pb-1.5" style={{ borderColor: opt.previewBorder }}>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: opt.primaryColor }} />
                          <span className="text-[10px] font-bold">Jurnal Guru Terpadu</span>
                        </div>
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${opt.badgeBg} ${opt.badgeText}`}>
                          Kelas VII-A
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 text-[9px]">
                        <div className="p-1.5 rounded border opacity-90" style={{ borderColor: opt.previewBorder }}>
                          <span className="opacity-70 block text-[8px]">Kehadiran</span>
                          <strong>98% Hadir</strong>
                        </div>
                        <div className="p-1.5 rounded border opacity-90" style={{ borderColor: opt.previewBorder }}>
                          <span className="opacity-70 block text-[8px]">Rata-Rata</span>
                          <strong>88.5 / 100</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 capitalize">Kategori: {opt.category === 'light' ? 'Mode Terang' : 'Mode Gelap'}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setTheme(opt.id);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
                      }`}
                    >
                      {isActive ? 'Sedang Digunakan' : 'Terapkan Tema'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-300 flex items-start gap-2.5">
            <Palette className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
            <p>
              Pilihan tema Anda akan otomatis tersimpan di peramban ini dan diterapkan secara menyeluruh ke seluruh modul (Dashboard, Jurnal Mengajar, Presensi Siswa, Rekap Nilai, Guru, dan Laporan Bulanan).
            </p>
          </div>
        </div>
      )}

      {/* SECTION: DATABASE & RESET */}
      {activeSection === 'DATABASE' && (
        <div className="bg-[#0F172A] p-6 rounded-2xl border border-slate-800 shadow-xl space-y-6">
          <div>
            <h3 className="text-base font-bold text-white">Pengelolaan & Hapus Database</h3>
            <p className="text-xs text-slate-400">
              Kelola status data aplikasi, kosongkan data isian, atau hapus seluruh database secara permanen
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Reset / Kosongkan Data */}
            <div className="p-5 bg-[#0B1120] rounded-xl border border-slate-800 flex flex-col justify-between shadow-md">
              <div>
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-3">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-amber-400 mb-1">Kosongkan Semua Data</h4>
                <p className="text-[11px] text-slate-400 mb-4">
                  Mengosongkan seluruh isian jurnal mengajar, presensi kelas, dan nilai siswa.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (confirm('Apakah Anda yakin ingin mengosongkan seluruh data isian aplikasi?')) {
                    onResetData();
                  }
                }}
                className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-bold rounded-xl shadow-md cursor-pointer transition-all active:scale-95"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Kosongkan Data</span>
              </button>
            </div>

            {/* Hapus Database (Complete Wipe) */}
            <div className="p-5 bg-rose-950/20 rounded-xl border border-rose-500/30 flex flex-col justify-between shadow-md">
              <div>
                <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center mb-3">
                  <Database className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-rose-400 mb-1">Hapus Seluruh Database</h4>
                <p className="text-[11px] text-rose-200/60 mb-4">
                  Mengosongkan semua data siswa, kelas, jurnal mengajar, presensi, dan nilai secara permanen.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(true)}
                className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer transition-all active:scale-95"
              >
                <Trash2 className="w-4 h-4" />
                <span>Hapus Database</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Delete Database */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0F172A] border border-rose-500/40 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 text-white">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-rose-400">
                  Konfirmasi Hapus Database
                </h3>
                <p className="text-xs text-slate-400">
                  Tindakan ini akan mengosongkan seluruh pangkalan data
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-rose-950/40 border border-rose-500/20 rounded-xl text-xs text-rose-200 space-y-2">
              <p className="font-semibold">Perhatian:</p>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-rose-200/80">
                <li>Semua data siswa ({students.length} siswa) akan dihapus</li>
                <li>Semua rombel/kelas ({classes.length} kelas) akan dikosongkan</li>
                <li>Seluruh riwayat presensi, jurnal mengajar, dan buku nilai akan terhapus bersih</li>
              </ul>
              <p className="text-[11px] text-rose-300/90 pt-1">
                Disarankan untuk mengunduh berkas Backup (JSON) terlebih dahulu sebelum menghapus database.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Ketik <span className="font-mono text-rose-400 font-bold">HAPUS</span> untuk konfirmasi:
              </label>
              <input
                type="text"
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                placeholder="Ketik HAPUS di sini..."
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 border border-rose-500/40 rounded-xl outline-none focus:border-rose-400 bg-[#0B1120] text-white font-mono"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeleteConfirmationText('');
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={deleteConfirmationText.trim().toUpperCase() !== 'HAPUS'}
                onClick={handleConfirmDeleteDatabase}
                className={`inline-flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-xl transition-all ${
                  deleteConfirmationText.trim().toUpperCase() === 'HAPUS'
                    ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-lg cursor-pointer active:scale-95'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <Trash2 className="w-4 h-4" />
                <span>Hapus Database Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
