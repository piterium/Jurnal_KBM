import React from 'react';
import { AppData } from '../types';
import {
  BookOpen,
  CalendarCheck,
  GraduationCap,
  Clock,
  PlusCircle,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Users,
  CheckCircle2,
  FileDown,
} from 'lucide-react';
import {
  formatShortDateIndonesian,
  calculateStudentAttendanceSummary,
  calculateStudentFinalGrade,
  getJournalAttendanceInfo,
  MONTH_NAMES_ID,
} from '../utils/storage';

interface DashboardViewProps {
  data: AppData;
  onNavigate: (tab: string) => void;
  onOpenNewJournalModal: () => void;
  onOpenNewAttendance: (classId?: string) => void;
  onOpenNewAssessmentModal: () => void;
  onQuickDownloadPdf: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  data,
  onNavigate,
  onOpenNewJournalModal,
  onOpenNewAttendance,
  onOpenNewAssessmentModal,
  onQuickDownloadPdf,
}) => {
  const { profile, classes, students, journals, attendances, assessments } = data;

  const currentMonth = new Date().getMonth() + 1; // 1-12
  const currentYear = new Date().getFullYear();
  const currentMonthName = MONTH_NAMES_ID[currentMonth - 1];

  // Month journals
  const thisMonthJournals = journals.filter(j => {
    const d = new Date(j.date);
    return (d.getMonth() + 1) === currentMonth && d.getFullYear() === currentYear;
  });

  const totalJP = thisMonthJournals.reduce((acc, curr) => acc + (curr.hoursCount || 2), 0);

  // Overall attendance calculation
  let totalH = 0;
  let totalSlots = 0;
  attendances.forEach(att => {
    Object.values(att.records).forEach((rec: { status: 'H' | 'S' | 'I' | 'A'; note?: string }) => {
      totalSlots++;
      if (rec.status === 'H') totalH++;
    });
  });
  const overallAttendanceRate = totalSlots > 0 ? Math.round((totalH / totalSlots) * 100) : 100;

  // Grade averages
  let totalGradeSum = 0;
  let gradedStudentsCount = 0;
  let atRiskStudents: Array<{ name: string; className: string; average: number; attendancePercent: number }> = [];

  students.filter(s => s.active).forEach(std => {
    const cls = classes.find(c => c.id === std.classId);
    const clsAssessments = assessments.filter(a => a.classId === std.classId);
    const gradeSummary = calculateStudentFinalGrade(std.id, clsAssessments, cls?.kkm || 75);
    const attSummary = calculateStudentAttendanceSummary(std.id, attendances);

    if (gradeSummary.completedAssessments > 0) {
      totalGradeSum += gradeSummary.averageScore;
      gradedStudentsCount++;
    }

    if ((gradeSummary.completedAssessments > 0 && !gradeSummary.isPassed) || attSummary.percent < 80 || attSummary.A >= 2) {
      atRiskStudents.push({
        name: std.name,
        className: cls?.name || '-',
        average: gradeSummary.averageScore,
        attendancePercent: attSummary.percent,
      });
    }
  });

  const overallGradeAverage = gradedStudentsCount > 0 ? Math.round(totalGradeSum / gradedStudentsCount) : 0;

  // Recent 4 journals
  const recentJournals = [...journals]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A] p-6 sm:p-8 text-white border border-slate-800 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/15 text-blue-400 text-xs font-bold border border-blue-500/30 uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              Sistem Administrasi Guru Terintegrasi
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-wide">
              Selamat Mengajar, <span className="text-blue-400">{profile.teacherName}</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Kelola jurnal KBM, pantau kehadiran siswa, serta pembukuan nilai formatif & sumatif terpadu untuk {profile.schoolName}.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenNewJournalModal}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-95 cursor-pointer tracking-wide"
            >
              <PlusCircle className="w-4 h-4 text-white" />
              <span>Tambah Jurnal & Presensi</span>
            </button>

            <button
              onClick={onQuickDownloadPdf}
              className="inline-flex items-center gap-2 bg-[#0B1120] hover:bg-slate-800 text-white font-medium text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-slate-700 transition-all active:scale-95 cursor-pointer"
            >
              <FileDown className="w-4 h-4 text-blue-400" />
              <span>Laporan PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Jurnal Pertemuan */}
        <div className="bg-[#0F172A] p-5 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all shadow-md">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">
              Pertemuan Bulan Ini
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-blue-400">
              {thisMonthJournals.length}
            </span>
            <span className="text-xs text-slate-400 font-medium">Sesi KBM</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-300">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span>Total <strong className="text-white">{totalJP} JP</strong> di {currentMonthName}</span>
          </div>
        </div>

        {/* Card 2: Kehadiran Siswa */}
        <div className="bg-[#0F172A] p-5 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all shadow-md">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">
              Tingkat Kehadiran
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-emerald-400">
              {overallAttendanceRate}%
            </span>
            <span className="text-xs text-slate-400 font-medium">Rata-rata</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Dari {attendances.length} sesi presensi</span>
          </div>
        </div>

        {/* Card 3: Rata-rata Nilai */}
        <div className="bg-[#0F172A] p-5 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all shadow-md">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">
              Rata-rata Nilai
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">
              {overallGradeAverage}
            </span>
            <span className="text-xs text-slate-400 font-medium">/ 100</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-300">
            <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
            <span>{assessments.length} Asesmen tercatat</span>
          </div>
        </div>

        {/* Card 4: Kelas & Siswa Binaan */}
        <div className="bg-[#0F172A] p-5 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all shadow-md">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">
              Siswa Binaan
            </span>
            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">
              {students.filter(s => s.active).length}
            </span>
            <span className="text-xs text-slate-400 font-medium">Siswa Aktif</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-300">
            <span>Tersebar di <strong className="text-white">{classes.length} Rombel</strong></span>
          </div>
        </div>
      </div>

      {/* Grid: Recent Journals & Class Performance Roster */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Teaching Journals */}
        <div className="lg:col-span-2 bg-[#0F172A] rounded-2xl border border-slate-800 p-5 sm:p-6 shadow-xl flex flex-col">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
            <div>
              <h3 className="font-bold text-lg text-white">
                Jurnal Mengajar Terakhir
              </h3>
              <p className="text-xs text-slate-400">
                Aktivitas pembelajaran dan catatan refleksi guru terkini
              </p>
            </div>
            <button
              onClick={() => onNavigate('journal')}
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer transition-colors"
            >
              Lihat Semua
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {recentJournals.length > 0 ? (
              recentJournals.map((j) => {
                const cls = classes.find(c => c.id === j.classId);
                const attInfo = getJournalAttendanceInfo(j, attendances, students);
                return (
                  <div
                    key={j.id}
                    className="p-4 rounded-xl border border-slate-800 bg-[#0B1120] hover:border-slate-700 transition-all"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                          {cls?.name || j.classId}
                        </span>
                        <span className="text-xs font-medium text-slate-300">
                          Pertemuan Ke-{j.meetingNumber} • Jam Ke- {j.jamKe || '1, 2'} ({j.hoursCount || 2} JP)
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {formatShortDateIndonesian(j.date)}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-white mb-2">
                      {j.topic}
                    </h4>

                    <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <CalendarCheck className="w-3.5 h-3.5 text-blue-400" />
                        Presensi:{' '}
                        {attInfo.isNihil ? (
                          <strong className="text-emerald-400 font-bold">Nihil (Hadir Lengkap)</strong>
                        ) : (
                          <strong className="text-amber-400 font-bold bg-amber-500/15 px-1.5 py-0.5 rounded">
                            {attInfo.summaryText} (Hadir {attInfo.hadir}/{attInfo.total})
                          </strong>
                        )}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                        j.status === 'Terlaksana'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : j.status === 'Tertunda'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                      }`}>
                        {j.status || 'Terlaksana'}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-slate-400">
                Belum ada jurnal mengajar. Klik tombol di atas untuk mencatat.
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Quick Roster & At-Risk Alert */}
        <div className="space-y-6">
          {/* Per-Class Summary */}
          <div className="bg-[#0F172A] rounded-2xl border border-slate-800 p-5 shadow-xl">
            <h3 className="font-bold text-base text-white mb-3">
              Ringkasan Kelas Binaan
            </h3>
            <div className="space-y-2.5">
              {classes.length > 0 ? (
                classes.map(cls => {
                  const clsStudents = students.filter(s => s.classId === cls.id && s.active);
                  return (
                    <div
                      key={cls.id}
                      className="p-3 bg-[#0B1120] rounded-xl border border-slate-800 flex items-center justify-between hover:border-slate-700 transition-all"
                    >
                      <div>
                        <div className="text-xs font-bold text-white">{cls.name}</div>
                        <div className="text-[11px] text-slate-400">
                          {clsStudents.length} Siswa • KKM {cls.kkm}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onOpenNewAttendance(cls.id)}
                          className="px-2.5 py-1 text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-lg cursor-pointer transition-colors"
                          title="Buka Presensi Kelas Ini"
                        >
                          Presensi
                        </button>
                        <button
                          onClick={() => onNavigate('grades')}
                          className="px-2.5 py-1 text-[11px] font-semibold bg-blue-500/15 hover:bg-blue-500/25 text-blue-400 border border-blue-500/30 rounded-lg cursor-pointer transition-colors"
                          title="Buka Nilai Kelas Ini"
                        >
                          Nilai
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-4 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                  Belum ada kelas yang terdaftar. Tambahkan kelas di menu Pengaturan.
                </div>
              )}
            </div>
          </div>

          {/* At-Risk Warning Box */}
          <div className="bg-[#0F172A] border border-amber-500/30 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Perhatian Khusus Siswa ({atRiskStudents.length})</span>
            </div>
            <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">
              Siswa dengan kehadiran &lt;80% atau nilai di bawah KKM/KKTP:
            </p>
            {atRiskStudents.length > 0 ? (
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1 scrollbar-thin">
                {atRiskStudents.slice(0, 5).map((std, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-xs p-2 bg-[#0B1120] rounded-lg border border-slate-800"
                  >
                    <span className="font-semibold text-slate-200 truncate max-w-[130px]">
                      {std.name}
                    </span>
                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="text-slate-400">{std.className}</span>
                      <span className={`font-bold ${std.average < 75 ? 'text-rose-400' : 'text-slate-300'}`}>
                        {std.average > 0 ? `Nilai: ${std.average}` : ''}
                      </span>
                      <span className={`font-bold ${std.attendancePercent < 80 ? 'text-amber-400' : 'text-slate-400'}`}>
                        {std.attendancePercent}% Hadir
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-emerald-400 italic">
                Seluruh siswa memiliki tingkat kehadiran dan nilai yang baik.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
