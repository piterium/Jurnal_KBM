import React, { useState } from 'react';
import { AssessmentItem, ClassRoom, Student } from '../types';
import {
  GraduationCap,
  Plus,
  Edit2,
  Trash2,
  TrendingUp,
  Award,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { calculateStudentFinalGrade, formatShortDateIndonesian, sortStudentsByAttendanceNo } from '../utils/storage';

interface GradebookViewProps {
  assessments: AssessmentItem[];
  classes: ClassRoom[];
  students: Student[];
  onAddAssessment: () => void;
  onEditAssessment: (assessment: AssessmentItem) => void;
  onDeleteAssessment: (id: string) => void;
  onUpdateScore: (assessmentId: string, studentId: string, score: number | null) => void;
  selectedClassId: string;
  onSelectClassId: (classId: string) => void;
}

export const GradebookView: React.FC<GradebookViewProps> = ({
  assessments,
  classes,
  students,
  onAddAssessment,
  onEditAssessment,
  onDeleteAssessment,
  onUpdateScore,
  selectedClassId,
  onSelectClassId,
}) => {
  const currentClass = classes.find((c) => c.id === selectedClassId) || classes[0];
  const classStudents = React.useMemo(() => {
    return sortStudentsByAttendanceNo(
      students.filter((s) => s.classId === selectedClassId && s.active)
    );
  }, [students, selectedClassId]);

  // Filter assessments for this class
  const classAssessments = assessments
    .filter((a) => a.classId === selectedClassId)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Statistics
  let totalScoreSum = 0;
  let maxClassScore = 0;
  let minClassScore = 100;
  let passedCount = 0;
  let validStudentsCount = 0;

  classStudents.forEach((std) => {
    const res = calculateStudentFinalGrade(std.id, classAssessments, currentClass?.kkm || 75);
    if (res.completedAssessments > 0) {
      validStudentsCount++;
      totalScoreSum += res.averageScore;
      if (res.averageScore > maxClassScore) maxClassScore = res.averageScore;
      if (res.averageScore < minClassScore) minClassScore = res.averageScore;
      if (res.isPassed) passedCount++;
    }
  });

  const classAverage = validStudentsCount > 0 ? Math.round(totalScoreSum / validStudentsCount) : 0;
  const passRate = validStudentsCount > 0 ? Math.round((passedCount / validStudentsCount) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-[#0F172A] p-5 sm:p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center border border-blue-500/20 flex-shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-wide">
                Daftar Penilaian & Leger Asesmen Siswa
              </h2>
              <p className="text-xs text-slate-400">
                Perhitungan otomatis Nilai Akhir (NA), Predikat, dan Ketercapaian KKM/KKTP
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={onAddAssessment}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-95 cursor-pointer tracking-wide"
        >
          <Plus className="w-4 h-4 text-white" />
          <span>Tambah Asesmen / Nilai Baru</span>
        </button>
      </div>

      {/* Class Selector & KKM Indicator */}
      <div className="bg-[#0F172A] p-4 rounded-2xl border border-slate-800 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-semibold text-slate-300">Pilih Kelas:</span>
          <div className="flex flex-wrap gap-1.5">
            {classes.map((cls) => (
              <button
                key={cls.id}
                onClick={() => onSelectClassId(cls.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  cls.id === selectedClassId
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700'
                }`}
              >
                {cls.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-medium">
          <span className="px-3 py-1 bg-blue-500/15 text-blue-400 border border-blue-500/30 rounded-lg font-bold">
            KKM / KKTP: {currentClass?.kkm || 75}
          </span>
          <span className="px-3 py-1 bg-slate-800 text-slate-300 border border-slate-700 rounded-lg font-bold">
            {classAssessments.length} Jenis Asesmen
          </span>
        </div>
      </div>

      {/* Class Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#0F172A] p-4 rounded-xl border border-slate-800 shadow-md">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rata-rata Kelas</div>
          <div className="text-2xl sm:text-3xl font-bold text-blue-400 mt-1">{classAverage}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Dari {validStudentsCount} siswa dinilai</div>
        </div>

        <div className="bg-[#0F172A] p-4 rounded-xl border border-slate-800 shadow-md">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ketuntasan Belajar</div>
          <div className="text-2xl sm:text-3xl font-bold text-emerald-400 mt-1">{passRate}%</div>
          <div className="text-[11px] text-slate-500 mt-0.5">{passedCount} dari {validStudentsCount} siswa tuntas</div>
        </div>

        <div className="bg-[#0F172A] p-4 rounded-xl border border-slate-800 shadow-md">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nilai Tertinggi</div>
          <div className="text-2xl sm:text-3xl font-bold text-sky-400 mt-1">{validStudentsCount > 0 ? maxClassScore : '-'}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Skor maksimal kelas</div>
        </div>

        <div className="bg-[#0F172A] p-4 rounded-xl border border-slate-800 shadow-md">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nilai Terendah</div>
          <div className="text-2xl sm:text-3xl font-bold text-amber-400 mt-1">{validStudentsCount > 0 ? minClassScore : '-'}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Perlu perhatian & bimbingan</div>
        </div>
      </div>

      {/* Grade Ledger Table */}
      <div className="bg-[#0F172A] rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        <div className="px-5 py-4 bg-[#0B1120] border-b border-slate-800 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Leger Nilai: <span className="text-blue-400">{currentClass?.name}</span> ({currentClass?.subject})
          </h3>
          <span className="text-xs text-slate-400">
            Nilai dapat diedit langsung pada kotak angka di setiap kolom
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#0B1120] text-slate-400 border-b border-slate-800">
                <th className="p-3 text-center w-10 text-slate-500">No</th>
                <th className="p-3">NISN</th>
                <th className="p-3 min-w-[180px]">Nama Lengkap Siswa</th>
                <th className="p-3 text-center w-10">L/P</th>

                {/* Dynamic Assessment Columns */}
                {classAssessments.map((asm) => {
                  let badgeColor = 'bg-sky-500/10 text-sky-400 border border-sky-500/20';
                  if (asm.type.startsWith('SUMATIF')) badgeColor = 'bg-purple-500/10 text-purple-400 border border-purple-500/20';

                  const getBadgeLabel = (t: string) => {
                    switch (t) {
                      case 'SUMATIF_UH1': return 'UH 1';
                      case 'SUMATIF_UH2': return 'UH 2';
                      case 'SUMATIF_UH3': return 'UH 3';
                      case 'SUMATIF_UH4': return 'UH 4';
                      case 'SUMATIF_UH5': return 'UH 5';
                      case 'SUMATIF_UH': return 'UH';
                      case 'SUMATIF_STS': return 'STS';
                      case 'SUMATIF_SAS': return 'SAS';
                      case 'FORMATIF_TUGAS': return 'TUGAS';
                      case 'FORMATIF_KUIS': return 'KUIS';
                      case 'FORMATIF_PRAKTEK': return 'PRAKTIK';
                      default: return t.replace('FORMATIF_', '').replace('SUMATIF_', '');
                    }
                  };

                  return (
                    <th
                      key={asm.id}
                      className="p-2.5 text-center border-l border-slate-800 min-w-[110px] bg-slate-900/30"
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${badgeColor}`}>
                          {getBadgeLabel(asm.type)}
                        </span>
                        <div className="flex items-center gap-0.5">
                          <button
                            onClick={() => onEditAssessment(asm)}
                            className="p-1 text-slate-500 hover:text-blue-400 rounded transition-colors cursor-pointer"
                            title="Edit Asesmen"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Hapus kolom penilaian "${asm.title}"?`)) {
                                onDeleteAssessment(asm.id);
                              }
                            }}
                            className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors cursor-pointer"
                            title="Hapus Kolom"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <div className="font-semibold text-white truncate text-[11px]" title={asm.title}>
                        {asm.title}
                      </div>
                      <div className="text-[10px] text-slate-400 font-normal">
                        Bobot: {asm.weight || 1} • {formatShortDateIndonesian(asm.date)}
                      </div>
                    </th>
                  );
                })}

                <th className="p-3 text-center bg-blue-500/15 text-blue-400 min-w-[80px] font-bold border-l border-slate-800">
                  Nilai Akhir
                </th>
                <th className="p-3 text-center bg-slate-800 text-slate-300 w-16 font-bold">
                  Predikat
                </th>
                <th className="p-3 text-center bg-[#0B1120] text-slate-300 min-w-[100px] font-bold">
                  Status KKM
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800 text-slate-300">
              {classStudents.length > 0 ? (
                classStudents.map((std, idx) => {
                  const gradeSummary = calculateStudentFinalGrade(
                    std.id,
                    classAssessments,
                    currentClass?.kkm || 75
                  );

                  return (
                    <tr key={std.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-2.5 text-center font-bold text-slate-500">
                        {std.attendanceNo !== undefined && std.attendanceNo !== null && String(std.attendanceNo).trim() !== ''
                          ? String(std.attendanceNo)
                          : idx + 1}
                      </td>
                      <td className="p-2.5 font-mono text-[11px] text-slate-400">{std.nisn || '-'}</td>
                      <td className="p-2.5 font-medium text-white">{std.name}</td>
                      <td className="p-2.5 text-center text-slate-400">{std.gender}</td>

                      {/* Inline Score inputs per assessment */}
                      {classAssessments.map((asm) => {
                        const scoreVal = asm.scores[std.id];
                        const isBelowKkm = scoreVal !== null && scoreVal !== undefined && scoreVal < asm.kkm;

                        return (
                          <td key={asm.id} className="p-1.5 text-center border-l border-slate-800">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              placeholder="-"
                              value={scoreVal === null || scoreVal === undefined ? '' : scoreVal}
                              onChange={(e) => {
                                const val = e.target.value === '' ? null : Number(e.target.value);
                                onUpdateScore(asm.id, std.id, val);
                              }}
                              className={`w-14 text-center text-xs font-bold py-1 px-1 rounded-lg border outline-none transition-colors ${
                                scoreVal !== null && scoreVal !== undefined
                                  ? isBelowKkm
                                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 focus:border-rose-400'
                                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 focus:border-emerald-400'
                                  : 'bg-[#0B1120] text-slate-500 border-dashed border-slate-700 focus:border-blue-500'
                              }`}
                            />
                          </td>
                        );
                      })}

                      {/* Final Weighted Score */}
                      <td className="p-2.5 text-center font-bold bg-blue-500/5 text-blue-400 border-l border-slate-800 text-sm">
                        {gradeSummary.completedAssessments > 0 ? gradeSummary.averageScore : '-'}
                      </td>

                      {/* Predicate */}
                      <td className="p-2.5 text-center bg-slate-800/30">
                        <span
                          className={`inline-block w-6 py-0.5 rounded text-xs font-bold ${
                            gradeSummary.predicate === 'A'
                              ? 'bg-blue-600 text-white'
                              : gradeSummary.predicate === 'B'
                              ? 'bg-emerald-500 text-white'
                              : gradeSummary.predicate === 'C'
                              ? 'bg-amber-500 text-white'
                              : 'bg-rose-500 text-white'
                          }`}
                        >
                          {gradeSummary.completedAssessments > 0 ? gradeSummary.predicate : '-'}
                        </span>
                      </td>

                      {/* Completion Status Badge */}
                      <td className="p-2.5 text-center bg-slate-900/20">
                        {gradeSummary.completedAssessments > 0 ? (
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              gradeSummary.isPassed
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                                : 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                            }`}
                          >
                            {gradeSummary.isPassed ? (
                              <>
                                <CheckCircle className="w-3 h-3 text-emerald-400" />
                                <span>Tuntas</span>
                              </>
                            ) : (
                              <>
                                <AlertCircle className="w-3 h-3 text-rose-400" />
                                <span>Remedial</span>
                              </>
                            )}
                          </span>
                        ) : (
                          <span className="text-slate-600 text-[11px]">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7 + classAssessments.length} className="p-8 text-center text-xs text-slate-400">
                    Belum ada siswa terdaftar pada kelas ini. Silakan tambahkan siswa di menu Kelola Siswa.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
