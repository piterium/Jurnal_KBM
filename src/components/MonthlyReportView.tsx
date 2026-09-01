import React, { useState } from 'react';
import { AppData } from '../types';
import {
  FileText,
  FileDown,
  Printer,
  Calendar,
  Layers,
  CheckCircle2,
  School,
  Sparkles,
  BookOpen,
  CalendarCheck,
  GraduationCap,
} from 'lucide-react';
import {
  generateMonthlyReportPdf,
  GeneratePdfOptions,
} from '../utils/pdfGenerator';
import {
  MONTH_NAMES_ID,
  formatDateIndonesian,
  formatShortDateIndonesian,
  calculateStudentAttendanceSummary,
  calculateStudentFinalGrade,
  getJournalAttendanceInfo,
} from '../utils/storage';

interface MonthlyReportViewProps {
  data: AppData;
}

export const MonthlyReportView: React.FC<MonthlyReportViewProps> = ({ data }) => {
  const { profile, classes, students, journals, attendances, assessments } = data;

  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1); // 1-12
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedClassId, setSelectedClassId] = useState<string>('ALL');
  const [reportType, setReportType] = useState<'FULL' | 'JOURNAL' | 'ATTENDANCE' | 'GRADES'>('FULL');
  const [attendanceMatrixMode, setAttendanceMatrixMode] = useState<'CALENDAR' | 'SESSIONS'>('CALENDAR');
  const [signatureCity, setSignatureCity] = useState<string>(profile.districtCity || 'Kota Nusantara');
  const [signatureDate, setSignatureDate] = useState<string>(
    formatShortDateIndonesian(new Date().toISOString().split('T')[0])
  );
  const [isGenerating, setIsGenerating] = useState(false);

  const monthName = MONTH_NAMES_ID[selectedMonth - 1];
  const targetClass = selectedClassId !== 'ALL' ? classes.find((c) => c.id === selectedClassId) : null;
  const filteredClasses = targetClass ? [targetClass] : classes;

  // Filter journals for live preview
  const monthlyJournals = journals.filter((j) => {
    const d = new Date(j.date);
    const matchesMonth = d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedYear;
    const matchesClass = targetClass ? j.classId === targetClass.id : true;
    return matchesMonth && matchesClass;
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Trigger PDF Download
  const handleDownloadPdf = () => {
    setIsGenerating(true);
    try {
      const options: GeneratePdfOptions = {
        month: selectedMonth,
        year: selectedYear,
        classId: selectedClassId,
        reportType,
        signatureCity,
        signatureDate,
        attendanceMatrixMode,
      };

      const doc = generateMonthlyReportPdf(data, options);
      const safeClassName = targetClass ? `_${targetClass.name.replace(/\s+/g, '_')}` : '_Semua_Kelas';
      const modeSuffix = reportType === 'ATTENDANCE' ? (attendanceMatrixMode === 'SESSIONS' ? '_Sesi' : '_Kalender') : '';
      const fileName = `Laporan_${reportType}${modeSuffix}_${monthName}_${selectedYear}${safeClassName}.pdf`;
      doc.save(fileName);
    } catch (err) {
      console.error('Error generating PDF', err);
      alert('Terjadi kesalahan saat membuat file PDF. Silakan periksa kembali data.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Trigger Print / New Window
  const handlePrintPreview = () => {
    try {
      const options: GeneratePdfOptions = {
        month: selectedMonth,
        year: selectedYear,
        classId: selectedClassId,
        reportType,
        signatureCity,
        signatureDate,
        attendanceMatrixMode,
      };
      const doc = generateMonthlyReportPdf(data, options);
      const blob = doc.output('blob');
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, '_blank');
    } catch (err) {
      console.error('Error previewing PDF', err);
      alert('Tidak dapat membuka preview di tab baru. Anda dapat mengunduh langsung via tombol Unduh PDF.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Heading */}
      <div className="bg-[#0F172A] p-5 sm:p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center border border-blue-500/20 flex-shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-wide">
                Pusat Laporan Bulanan & Unduh PDF Resmi
              </h2>
              <p className="text-xs text-slate-400">
                Format standar kedinasan dengan Kop Surat resmi, data terintegrasi, dan tanda tangan digital
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handlePrintPreview}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-700 rounded-xl transition-colors cursor-pointer"
            title="Buka PDF di tab baru untuk cetak"
          >
            <Printer className="w-4 h-4 text-slate-400" />
            <span>Cetak / Preview</span>
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={isGenerating}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-95 cursor-pointer disabled:opacity-50 tracking-wide"
          >
            <FileDown className="w-4 h-4 text-white" />
            <span>{isGenerating ? 'Membuat PDF...' : 'Unduh Laporan PDF Resmi'}</span>
          </button>
        </div>
      </div>

      {/* Configuration Controls Card */}
      <div className="bg-[#0F172A] p-5 rounded-2xl border border-slate-800 shadow-xl space-y-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Pengaturan Laporan yang Diterbitkan
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Format Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Jenis Format Laporan:
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as any)}
              className="w-full text-xs font-bold px-3 py-2 border border-slate-700 rounded-lg bg-[#0B1120] text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="FULL">1. Laporan Lengkap Terpadu (All-in-One)</option>
              <option value="JOURNAL">2. Rekap Jurnal Mengajar & Agenda KBM</option>
              <option value="ATTENDANCE">3. Rekapitulasi Presensi / Kehadiran Siswa</option>
              <option value="GRADES">4. Leger Daftar Nilai & Ketuntasan Siswa</option>
            </select>
            {reportType === 'ATTENDANCE' && (
              <div className="mt-2 flex items-center gap-1.5 p-1 bg-[#080E1A] rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => setAttendanceMatrixMode('CALENDAR')}
                  className={`flex-1 py-1 px-2 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                    attendanceMatrixMode === 'CALENDAR'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Kalender (1-31)
                </button>
                <button
                  type="button"
                  onClick={() => setAttendanceMatrixMode('SESSIONS')}
                  className={`flex-1 py-1 px-2 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                    attendanceMatrixMode === 'SESSIONS'
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Sesi Terlaksana
                </button>
              </div>
            )}
          </div>

          {/* Month & Year */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Bulan:</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="w-full text-xs font-semibold px-2.5 py-2 border border-slate-700 rounded-lg bg-[#0B1120] text-white focus:border-blue-500"
              >
                {MONTH_NAMES_ID.map((name, idx) => (
                  <option key={idx + 1} value={idx + 1}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Tahun:</label>
              <input
                type="number"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="w-full text-xs font-semibold px-2.5 py-2 border border-slate-700 rounded-lg bg-[#0B1120] text-white focus:border-blue-500"
              />
            </div>
          </div>

          {/* Target Class */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Filter Kelas Binaan:
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full text-xs font-semibold px-3 py-2 border border-slate-700 rounded-lg bg-[#0B1120] text-white focus:border-blue-500"
            >
              <option value="ALL">Semua Kelas ({classes.length} Rombel)</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sign location */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Tempat & Tanggal Pengesahan:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={signatureCity}
                onChange={(e) => setSignatureCity(e.target.value)}
                placeholder="Kota"
                className="w-1/2 text-xs px-2.5 py-2 border border-slate-700 rounded-lg bg-[#0B1120] text-white focus:border-blue-500"
              />
              <input
                type="text"
                value={signatureDate}
                onChange={(e) => setSignatureDate(e.target.value)}
                placeholder="Tgl Pengesahan"
                className="w-1/2 text-xs px-2.5 py-2 border border-slate-700 rounded-lg bg-[#0B1120] text-white focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Live Paper Document Preview */}
      <div className="bg-[#080E1A] p-4 sm:p-8 rounded-2xl border border-slate-800 shadow-2xl flex flex-col items-center">
        <div className="mb-4 text-xs font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
          <Sparkles className="w-4 h-4 text-blue-400" />
          <span>Pratinjau Dokumen Cetak (Live Paper Preview)</span>
        </div>

        {/* Paper Container (White Sheet) */}
        <div className="bg-white text-slate-900 shadow-2xl rounded-sm p-6 sm:p-10 w-full max-w-4xl border border-slate-300 space-y-6 text-xs leading-relaxed">
          {/* KOP SURAT */}
          <div className="relative flex items-center justify-between border-b-[3px] border-double border-slate-900 pb-3.5 gap-4">
            {profile.logoUrl && (
              <div className="w-20 h-20 flex-shrink-0 flex items-center justify-center">
                <img
                  src={profile.logoUrl}
                  alt="Logo Sekolah"
                  className="max-h-20 max-w-20 object-contain"
                />
              </div>
            )}
            <div className="flex-1 text-center">
              <div className="font-bold text-xs sm:text-sm uppercase tracking-wider text-slate-800">
                {profile.letterHeaderOffice ? (
                  profile.letterHeaderOffice.split('\n').map((l, i) => <div key={i}>{l}</div>)
                ) : (
                  <>
                    <div>PEMERINTAH KOTA / KABUPATEN</div>
                    <div>DINAS PENDIDIKAN DAN KEBUDAYAAN</div>
                  </>
                )}
              </div>
              <h1 className="text-base sm:text-lg font-black uppercase text-slate-950 mt-1 leading-snug">
                {profile.schoolName}
              </h1>
              <p className="text-[11px] text-slate-600 mt-1">
                {profile.schoolAddress} | NPSN: {profile.npsn} | {profile.districtCity}, {profile.province}
              </p>
            </div>
            {profile.logoUrl && <div className="w-20 flex-shrink-0 hidden sm:block"></div>}
          </div>

          {/* DOCUMENT TITLE */}
          <div className="text-center space-y-1">
            <h2 className="text-sm sm:text-base font-black uppercase tracking-wide text-slate-950 underline decoration-slate-400 underline-offset-4">
              {reportType === 'FULL' && 'LAPORAN BULANAN KEGIATAN BELAJAR MENGAJAR & KINERJA GURU'}
              {reportType === 'JOURNAL' && 'BUKU REKAPITULASI JURNAL MENGAJAR & AGENDA GURU'}
              {reportType === 'ATTENDANCE' && 'REKAPITULASI PRESENSI / KEHADIRAN SISWA BULANAN'}
              {reportType === 'GRADES' && 'LEGER DAFTAR NILAI DAN KETUNTASAN ASESMEN SISWA'}
            </h2>
            <div className="text-[11px] text-slate-600 font-medium">
              Bulan: <strong>{monthName} {selectedYear}</strong> • Mapel: <strong>{profile.subject}</strong> • Kelas: <strong>{targetClass ? targetClass.name : 'Semua Kelas Binaan'}</strong> • T.A: <strong>{profile.academicYear} (Semester {profile.semester})</strong>
            </div>
          </div>

          {/* PREVIEW: SECTION 1 JURNAL */}
          {(reportType === 'FULL' || reportType === 'JOURNAL') && (
            <div className="space-y-2">
              <h3 className="font-bold text-xs text-slate-900 uppercase">
                I. Catatan Jurnal & Pelaksanaan Pembelajaran ({monthlyJournals.length} Pertemuan)
              </h3>
              <div className="overflow-x-auto border border-slate-300">
                <table className="w-full text-left border-collapse text-[10px]">
                  <thead>
                    <tr className="bg-slate-100 text-slate-900 border-b border-slate-300 font-bold">
                      <th className="p-1.5 text-center border-r border-slate-300 w-6">No</th>
                      <th className="p-1.5 border-r border-slate-300 w-18">Tanggal</th>
                      <th className="p-1.5 border-r border-slate-300 w-16">Kelas</th>
                      <th className="p-1.5 border-r border-slate-300 w-12 text-center">Pert.</th>
                      <th className="p-1.5 border-r border-slate-300 w-20 text-center">Jam Ke-</th>
                      <th className="p-1.5 border-r border-slate-300">Materi Pokok / Bahasan</th>
                      <th className="p-1.5 border-r border-slate-300 min-w-[120px] text-center">Presensi</th>
                      <th className="p-1.5 border-r border-slate-300 w-18 text-center">Status</th>
                      <th className="p-1.5 w-24">Ket.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {monthlyJournals.length > 0 ? (
                      monthlyJournals.map((j, idx) => {
                        const cls = classes.find((c) => c.id === j.classId);
                        const attInfo = getJournalAttendanceInfo(j, attendances, students);
                        return (
                          <tr key={j.id}>
                            <td className="p-1.5 text-center border-r border-slate-200 font-bold">{idx + 1}</td>
                            <td className="p-1.5 border-r border-slate-200 whitespace-nowrap">{formatShortDateIndonesian(j.date)}</td>
                            <td className="p-1.5 border-r border-slate-200 font-medium">{cls?.name || j.classId}</td>
                            <td className="p-1.5 border-r border-slate-200 text-center">Ke-{j.meetingNumber}</td>
                            <td className="p-1.5 border-r border-slate-200 text-center font-medium">Jam {j.jamKe || '1, 2'} ({j.hoursCount || 2}JP)</td>
                            <td className="p-1.5 border-r border-slate-200 font-semibold text-slate-900">{j.topic}</td>
                            <td className="p-1.5 border-r border-slate-200 text-center font-bold">
                              {attInfo.isNihil ? (
                                <span className="inline-block text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 text-[10px]">
                                  Nihil
                                </span>
                              ) : (
                                <div className="inline-flex flex-col gap-0.5 text-[10px] text-amber-900 bg-amber-50 px-1.5 py-1 rounded border border-amber-200 font-semibold">
                                  {attInfo.sakitDetails.length > 0 && (
                                    <span>S: {attInfo.sakitDetails.length} (No. {attInfo.sakitDetails.map(s => s.attendanceNo).join(', ')})</span>
                                  )}
                                  {attInfo.izinDetails.length > 0 && (
                                    <span>I: {attInfo.izinDetails.length} (No. {attInfo.izinDetails.map(s => s.attendanceNo).join(', ')})</span>
                                  )}
                                  {attInfo.alpaDetails.length > 0 && (
                                    <span>A: {attInfo.alpaDetails.length} (No. {attInfo.alpaDetails.map(s => s.attendanceNo).join(', ')})</span>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="p-1.5 border-r border-slate-200 text-center font-medium text-slate-700">{j.status || 'Terlaksana'}</td>
                            <td className="p-1.5 text-[10px] text-slate-600 italic">{j.keterangan || j.notes || '-'}</td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={9} className="p-3 text-center text-slate-400 italic">
                          Tidak ada catatan jurnal mengajar pada periode bulan ini.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* PREVIEW: SECTION 2 PRESENSI */}
          {(reportType === 'FULL' || reportType === 'ATTENDANCE') && (
            <div className="space-y-4">
              {filteredClasses.map((cls) => {
                const clsStudents = students.filter((s) => s.classId === cls.id && s.active);
                const clsAttendances = attendances.filter((a) => {
                  const d = new Date(a.date);
                  return a.classId === cls.id && d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedYear;
                });

                return (
                  <div key={cls.id} className="space-y-2">
                    <h3 className="font-bold text-xs text-slate-900 uppercase">
                      {reportType === 'FULL' ? 'II.' : 'I.'} Rekapitulasi Presensi Siswa - {cls.name}
                    </h3>
                    <div className="overflow-x-auto border border-slate-300">
                      <table className="w-full text-left border-collapse text-[10px]">
                        <thead>
                          <tr className="bg-slate-100 text-slate-900 border-b border-slate-300 font-bold">
                            <th className="p-1.5 text-center border-r border-slate-300 w-6">No</th>
                            <th className="p-1.5 border-r border-slate-300 w-20">NISN</th>
                            <th className="p-1.5 border-r border-slate-300 min-w-[140px]">Nama Lengkap Siswa</th>
                            <th className="p-1.5 border-r border-slate-300 text-center w-6">L/P</th>
                            <th className="p-1.5 border-r border-slate-300 text-center w-8 bg-emerald-50">H</th>
                            <th className="p-1.5 border-r border-slate-300 text-center w-8 bg-amber-50">S</th>
                            <th className="p-1.5 border-r border-slate-300 text-center w-8 bg-blue-50">I</th>
                            <th className="p-1.5 border-r border-slate-300 text-center w-8 bg-red-50">A</th>
                            <th className="p-1.5 text-center w-14 font-black bg-slate-50">% Hadir</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {clsStudents.map((std, idx) => {
                            const sum = calculateStudentAttendanceSummary(std.id, clsAttendances);
                            return (
                              <tr key={std.id}>
                                <td className="p-1 text-center border-r border-slate-200 font-bold">{idx + 1}</td>
                                <td className="p-1 border-r border-slate-200 font-mono">{std.nisn}</td>
                                <td className="p-1 border-r border-slate-200 font-semibold">{std.name}</td>
                                <td className="p-1 border-r border-slate-200 text-center">{std.gender}</td>
                                <td className="p-1 border-r border-slate-200 text-center font-bold text-emerald-700">{sum.H}</td>
                                <td className="p-1 border-r border-slate-200 text-center font-bold text-amber-700">{sum.S}</td>
                                <td className="p-1 border-r border-slate-200 text-center font-bold text-blue-700">{sum.I}</td>
                                <td className="p-1 border-r border-slate-200 text-center font-bold text-red-700">{sum.A}</td>
                                <td className="p-1 text-center font-bold bg-slate-50">
                                  <span className={sum.percent < 80 ? 'text-red-600' : 'text-emerald-700'}>
                                    {sum.percent}%
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* PREVIEW: SECTION 3 NILAI */}
          {(reportType === 'FULL' || reportType === 'GRADES') && (
            <div className="space-y-4">
              {filteredClasses.map((cls) => {
                const clsStudents = students.filter((s) => s.classId === cls.id && s.active);
                const clsAssessments = assessments.filter((a) => a.classId === cls.id);

                return (
                  <div key={cls.id} className="space-y-2">
                    <h3 className="font-bold text-xs text-slate-900 uppercase">
                      {reportType === 'FULL' ? 'III.' : 'I.'} Leger Nilai & Ketuntasan Siswa (KKM: {cls.kkm || 75}) - {cls.name}
                    </h3>
                    <div className="overflow-x-auto border border-slate-300">
                      <table className="w-full text-left border-collapse text-[10px]">
                        <thead>
                          <tr className="bg-slate-100 text-slate-900 border-b border-slate-300 font-bold">
                            <th className="p-1.5 text-center border-r border-slate-300 w-6">No</th>
                            <th className="p-1.5 border-r border-slate-300 w-20">NISN</th>
                            <th className="p-1.5 border-r border-slate-300 min-w-[140px]">Nama Lengkap Siswa</th>
                            <th className="p-1.5 border-r border-slate-300 text-center w-6">L/P</th>
                            {clsAssessments.map((a) => (
                              <th key={a.id} className="p-1.5 border-r border-slate-300 text-center">
                                {a.title.split(':')[0]}
                              </th>
                            ))}
                            <th className="p-1.5 text-center border-r border-slate-300 bg-indigo-50 font-black">NA</th>
                            <th className="p-1.5 text-center border-r border-slate-300 w-10">Pred.</th>
                            <th className="p-1.5 text-center w-20">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {clsStudents.map((std, idx) => {
                            const res = calculateStudentFinalGrade(std.id, clsAssessments, cls.kkm || 75);
                            return (
                              <tr key={std.id}>
                                <td className="p-1 text-center border-r border-slate-200 font-bold">{idx + 1}</td>
                                <td className="p-1 border-r border-slate-200 font-mono">{std.nisn}</td>
                                <td className="p-1 border-r border-slate-200 font-semibold">{std.name}</td>
                                <td className="p-1 border-r border-slate-200 text-center">{std.gender}</td>
                                {clsAssessments.map((a) => {
                                  const sc = res.scoresMap[a.id];
                                  return (
                                    <td key={a.id} className="p-1 border-r border-slate-200 text-center font-bold">
                                      {sc !== null && sc !== undefined ? sc : '-'}
                                    </td>
                                  );
                                })}
                                <td className="p-1 border-r border-slate-200 text-center font-black bg-indigo-50 text-indigo-900">
                                  {res.averageScore}
                                </td>
                                <td className="p-1 border-r border-slate-200 text-center font-bold">{res.predicate}</td>
                                <td className="p-1 text-center font-bold">
                                  <span className={res.isPassed ? 'text-emerald-700' : 'text-red-700'}>
                                    {res.isPassed ? 'Tuntas' : 'Remedial'}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* SIGNATURE BLOCK */}
          <div className="pt-8 grid grid-cols-2 text-center text-xs">
            <div className="space-y-1">
              <div>Mengetahui,</div>
              <div className="font-semibold">Kepala Sekolah</div>
              <div className="h-16"></div>
              <div className="font-bold underline uppercase">{profile.headmasterName}</div>
              <div className="text-[11px] text-slate-600">NIP. {profile.headmasterNip || '-'}</div>
            </div>

            <div className="space-y-1">
              <div>{signatureCity}, {signatureDate}</div>
              <div className="font-semibold">Guru Mata Pelajaran {profile.subject}</div>
              <div className="h-16"></div>
              <div className="font-bold underline uppercase">{profile.teacherName}</div>
              <div className="text-[11px] text-slate-600">NIP. {profile.teacherNip || '-'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
