import React, { useState, useEffect, useMemo } from 'react';
import { AttendanceRecord, AttendanceStatus, ClassRoom, Student, TeachingJournal, AppData } from '../types';
import {
  CalendarCheck,
  CheckCircle2,
  Users,
  Calendar,
  Layers,
  Save,
  CheckCheck,
  HelpCircle,
  Clock,
  Sparkles,
  Download,
  Printer,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  FileSpreadsheet,
  AlertTriangle,
  Award,
  Eye,
  CalendarDays,
  PlusCircle,
  Table as TableIcon,
  FileText,
} from 'lucide-react';
import {
  formatDateIndonesian,
  formatShortDateIndonesian,
  calculateStudentAttendanceSummary,
  MONTH_NAMES_ID,
  loadAppData,
} from '../utils/storage';
import { generateMonthlyReportPdf } from '../utils/pdfGenerator';

interface AttendanceViewProps {
  attendances: AttendanceRecord[];
  classes: ClassRoom[];
  students: Student[];
  journals: TeachingJournal[];
  onSaveAttendance: (record: AttendanceRecord) => void;
  initialClassId?: string;
  initialDate?: string;
  appData?: AppData;
}

const DAY_NAMES_SHORT = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

export const AttendanceView: React.FC<AttendanceViewProps> = ({
  attendances,
  classes,
  students,
  journals,
  onSaveAttendance,
  initialClassId,
  initialDate,
  appData,
}) => {
  const [activeTab, setActiveTab] = useState<'INPUT' | 'RECAP'>('INPUT');
  const [selectedClassId, setSelectedClassId] = useState<string>(initialClassId || classes[0]?.id || '');
  const [selectedDate, setSelectedDate] = useState<string>(initialDate || new Date().toISOString().split('T')[0]);
  const [currentRecords, setCurrentRecords] = useState<Record<string, { status: AttendanceStatus; note?: string }>>({});
  const [recapMonth, setRecapMonth] = useState<number>(new Date().getMonth() + 1);
  const [recapYear, setRecapYear] = useState<number>(new Date().getFullYear());
  const [isSavedRecently, setIsSavedRecently] = useState(false);

  // Filter & Options for Monthly Recap Table
  const [tableModel, setTableModel] = useState<'CALENDAR' | 'SESSIONS'>('CALENDAR');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [genderFilter, setGenderFilter] = useState<'ALL' | 'L' | 'P'>('ALL');
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // Sync selectedClassId if props change
  useEffect(() => {
    if (initialClassId) setSelectedClassId(initialClassId);
    if (initialDate) setSelectedDate(initialDate);
  }, [initialClassId, initialDate]);

  // Load existing records for class and date in INPUT mode
  useEffect(() => {
    const existing = attendances.find(
      (a) => a.classId === selectedClassId && a.date === selectedDate
    );

    const classStudents = students.filter((s) => s.classId === selectedClassId && s.active);
    const initialMap: Record<string, { status: AttendanceStatus; note?: string }> = {};

    if (existing) {
      classStudents.forEach((s) => {
        initialMap[s.id] = existing.records[s.id] || { status: 'H', note: '' };
      });
    } else {
      // Default all Hadir
      classStudents.forEach((s) => {
        initialMap[s.id] = { status: 'H', note: '' };
      });
    }

    setCurrentRecords(initialMap);
  }, [selectedClassId, selectedDate, attendances, students]);

  const currentClass = classes.find((c) => c.id === selectedClassId);
  const classStudents = useMemo(() => {
    return students
      .filter((s) => s.classId === selectedClassId && s.active)
      .sort((a, b) => {
        const noA = a.attendanceNo ?? 999;
        const noB = b.attendanceNo ?? 999;
        if (noA !== noB) return noA - noB;
        return a.name.localeCompare(b.name);
      });
  }, [students, selectedClassId]);

  // Filtered students for recap view
  const filteredStudents = useMemo(() => {
    return classStudents.filter((s) => {
      const matchSearch =
        searchQuery === '' ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.nisn && s.nisn.includes(searchQuery));
      const matchGender = genderFilter === 'ALL' || s.gender === genderFilter;
      return matchSearch && matchGender;
    });
  }, [classStudents, searchQuery, genderFilter]);

  // Find linked journal if any
  const linkedJournal = journals.find(
    (j) => j.classId === selectedClassId && j.date === selectedDate
  );

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setCurrentRecords((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        status,
      },
    }));
    setIsSavedRecently(false);
  };

  const handleNoteChange = (studentId: string, note: string) => {
    setCurrentRecords((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { status: 'H' }),
        note,
      },
    }));
    setIsSavedRecently(false);
  };

  const handleMarkAllHadir = () => {
    const updated: Record<string, { status: AttendanceStatus; note?: string }> = {};
    classStudents.forEach((s) => {
      updated[s.id] = { status: 'H', note: '' };
    });
    setCurrentRecords(updated);
    setIsSavedRecently(false);
  };

  const handleSave = () => {
    const existing = attendances.find(
      (a) => a.classId === selectedClassId && a.date === selectedDate
    );

    const newRecord: AttendanceRecord = {
      id: existing ? existing.id : `att-${Date.now()}`,
      classId: selectedClassId,
      date: selectedDate,
      journalId: linkedJournal?.id,
      records: currentRecords,
    };

    onSaveAttendance(newRecord);
    setIsSavedRecently(true);
    setTimeout(() => setIsSavedRecently(false), 3000);
  };

  // Count current statistics in input tab
  let countH = 0;
  let countS = 0;
  let countI = 0;
  let countA = 0;

  Object.values(currentRecords).forEach((r: { status: AttendanceStatus; note?: string }) => {
    if (r.status === 'H') countH++;
    else if (r.status === 'S') countS++;
    else if (r.status === 'I') countI++;
    else if (r.status === 'A') countA++;
  });

  const totalActive = classStudents.length;
  const attendanceRate = totalActive > 0 ? Math.round((countH / totalActive) * 100) : 100;

  // Monthly Attendances filtered
  const monthlyAttendances = useMemo(() => {
    return attendances
      .filter((a) => {
        const d = new Date(a.date);
        return (
          a.classId === selectedClassId &&
          d.getMonth() + 1 === recapMonth &&
          d.getFullYear() === recapYear
        );
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [attendances, selectedClassId, recapMonth, recapYear]);

  // Days in selected Month
  const daysInMonth = useMemo(() => {
    return new Date(recapYear, recapMonth, 0).getDate();
  }, [recapYear, recapMonth]);

  // Calendar columns definition
  interface DateColumn {
    dayNumber: number;
    dateString: string;
    dayName: string;
    isSunday: boolean;
    isSaturday: boolean;
    hasSession: boolean;
    sessionRecord?: AttendanceRecord;
  }

  const dateColumns: DateColumn[] = useMemo(() => {
    if (tableModel === 'SESSIONS') {
      // Only recorded session dates
      return monthlyAttendances.map((att) => {
        const d = new Date(att.date);
        const dayNumber = d.getDate();
        const dayIdx = d.getDay();
        return {
          dayNumber,
          dateString: att.date,
          dayName: DAY_NAMES_SHORT[dayIdx],
          isSunday: dayIdx === 0,
          isSaturday: dayIdx === 6,
          hasSession: true,
          sessionRecord: att,
        };
      });
    }

    // Full 1 to daysInMonth calendar
    const cols: DateColumn[] = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = `${recapYear}-${String(recapMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const d = new Date(recapYear, recapMonth - 1, day);
      const dayIdx = d.getDay();
      const sessionRecord = monthlyAttendances.find((a) => a.date === dateString);

      cols.push({
        dayNumber: day,
        dateString,
        dayName: DAY_NAMES_SHORT[dayIdx],
        isSunday: dayIdx === 0,
        isSaturday: dayIdx === 6,
        hasSession: Boolean(sessionRecord),
        sessionRecord,
      });
    }
    return cols;
  }, [tableModel, daysInMonth, recapYear, recapMonth, monthlyAttendances]);

  // Monthly Overview Analytics
  const monthlyStats = useMemo(() => {
    let totalH = 0;
    let totalS = 0;
    let totalI = 0;
    let totalA = 0;
    let totalPossible = 0;

    classStudents.forEach((std) => {
      const sum = calculateStudentAttendanceSummary(std.id, monthlyAttendances);
      totalH += sum.H;
      totalS += sum.S;
      totalI += sum.I;
      totalA += sum.A;
      totalPossible += sum.totalSessions;
    });

    const averagePercent = totalPossible > 0 ? Math.round((totalH / totalPossible) * 100) : 100;

    let perfectStudentsCount = 0;
    let warningStudentsCount = 0;

    classStudents.forEach((std) => {
      const sum = calculateStudentAttendanceSummary(std.id, monthlyAttendances);
      if (sum.totalSessions > 0) {
        if (sum.H === sum.totalSessions) {
          perfectStudentsCount++;
        }
        if (sum.A > 0 || sum.percent < 80) {
          warningStudentsCount++;
        }
      }
    });

    return {
      totalH,
      totalS,
      totalI,
      totalA,
      averagePercent,
      perfectStudentsCount,
      warningStudentsCount,
      totalSessions: monthlyAttendances.length,
    };
  }, [classStudents, monthlyAttendances]);

  // Navigation handlers
  const handlePrevMonth = () => {
    if (recapMonth === 1) {
      setRecapMonth(12);
      setRecapYear((prev) => prev - 1);
    } else {
      setRecapMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (recapMonth === 12) {
      setRecapMonth(1);
      setRecapYear((prev) => prev + 1);
    } else {
      setRecapMonth((prev) => prev + 1);
    }
  };

  const handleSetCurrentMonth = () => {
    const now = new Date();
    setRecapMonth(now.getMonth() + 1);
    setRecapYear(now.getFullYear());
  };

  // Jump to specific date in Input tab
  const handleJumpToDateInput = (dateStr: string) => {
    setSelectedDate(dateStr);
    setActiveTab('INPUT');
  };

  // Export PDF Handler
  const handleExportPdf = (modeOverride?: 'CALENDAR' | 'SESSIONS') => {
    const targetMode = modeOverride || tableModel;
    setIsExportingPdf(true);
    try {
      const fullData = appData || loadAppData();
      const doc = generateMonthlyReportPdf(fullData, {
        month: recapMonth,
        year: recapYear,
        classId: selectedClassId,
        reportType: 'ATTENDANCE',
        attendanceMatrixMode: targetMode,
      });
      const monthName = MONTH_NAMES_ID[recapMonth - 1];
      const className = currentClass ? currentClass.name.replace(/\s+/g, '_') : 'Semua';
      const suffix = targetMode === 'SESSIONS' ? 'Sesi_Terlaksana' : 'Kalender_Bulanan';
      doc.save(`Rekap_Presensi_${className}_${monthName}_${recapYear}_${suffix}.pdf`);
    } catch (e) {
      console.error('Error generating PDF:', e);
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Export CSV Handler
  const handleExportCsv = () => {
    const monthName = MONTH_NAMES_ID[recapMonth - 1];
    const headerLine = [
      'No',
      'NISN',
      'Nama Siswa',
      'L/P',
      ...dateColumns.map((col) => `"${col.dayNumber} (${col.dayName})"`),
      'Total H',
      'Total S',
      'Total I',
      'Total A',
      '% Kehadiran',
    ].join(',');

    const rows = filteredStudents.map((std, idx) => {
      const summary = calculateStudentAttendanceSummary(std.id, monthlyAttendances);
      const statuses = dateColumns.map((col) => {
        if (col.isSunday) return '"L"';
        const rec = col.sessionRecord?.records[std.id];
        return `"${rec ? rec.status : '-'}"`;
      });

      return [
        std.attendanceNo !== undefined ? std.attendanceNo : idx + 1,
        `"${std.nisn || ''}"`,
        `"${std.name}"`,
        `"${std.gender}"`,
        ...statuses,
        summary.H,
        summary.S,
        summary.I,
        summary.A,
        `"${summary.percent}%"`,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headerLine, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const className = currentClass ? currentClass.name.replace(/\s+/g, '_') : 'Semua';
    link.setAttribute('download', `Rekap_Presensi_${className}_${monthName}_${recapYear}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-[#0F172A] p-5 sm:p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center border border-emerald-500/20 flex-shrink-0 shadow-inner">
            <CalendarCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-wide flex items-center gap-2">
              <span>Presensi & Absensi Siswa</span>
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                {currentClass?.name || 'Pilih Kelas'}
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Pencatatan presensi harian terpadu dan matriks tabel rekap bulanan kalender per tanggal
            </p>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="inline-flex p-1 bg-[#0B1120] rounded-xl border border-slate-800 self-start sm:self-auto shadow-inner">
          <button
            onClick={() => setActiveTab('INPUT')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'INPUT'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Input Presensi Harian</span>
          </button>
          <button
            onClick={() => setActiveTab('RECAP')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'RECAP'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span>Tabel Rekap Bulanan (Per Tanggal)</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: INPUT PRESENSI HARIAN                                             */}
      {/* ========================================================================= */}
      {activeTab === 'INPUT' ? (
        <div className="space-y-5">
          {/* Controls Bar: Class & Date selector */}
          <div className="bg-[#0F172A] p-4 rounded-2xl border border-slate-800 shadow-xl flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-semibold text-slate-300">Pilih Kelas:</span>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="text-xs font-semibold px-3 py-1.5 border border-slate-700 rounded-lg bg-[#0B1120] text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-semibold text-slate-300">Tanggal:</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="text-xs font-semibold px-3 py-1.5 border border-slate-700 rounded-lg bg-[#0B1120] text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {linkedJournal && (
                <span className="text-xs px-3 py-1 bg-blue-500/15 text-blue-400 border border-blue-500/30 rounded-lg font-medium flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Terhubung: Jurnal Pertemuan Ke-{linkedJournal.meetingNumber} ({linkedJournal.topic})</span>
                </span>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleMarkAllHadir}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-xl border border-slate-700 transition-colors cursor-pointer"
              >
                <CheckCheck className="w-4 h-4 text-emerald-400" />
                <span>Tandai Semua Hadir</span>
              </button>

              <button
                type="button"
                onClick={handleSave}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-95 cursor-pointer tracking-wide"
              >
                <Save className="w-4 h-4 text-white" />
                <span>Simpan Presensi</span>
              </button>
            </div>
          </div>

          {/* Quick Counter Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-[#0F172A] p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hadir (H)</div>
                <div className="text-2xl font-bold text-emerald-400 mt-0.5">{countH}</div>
              </div>
              <span className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-xs font-bold">H</span>
            </div>

            <div className="bg-[#0F172A] p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sakit (S)</div>
                <div className="text-2xl font-bold text-amber-400 mt-0.5">{countS}</div>
              </div>
              <span className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center text-xs font-bold">S</span>
            </div>

            <div className="bg-[#0F172A] p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Izin (I)</div>
                <div className="text-2xl font-bold text-sky-400 mt-0.5">{countI}</div>
              </div>
              <span className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center text-xs font-bold">I</span>
            </div>

            <div className="bg-[#0F172A] p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Alpa (A)</div>
                <div className="text-2xl font-bold text-rose-400 mt-0.5">{countA}</div>
              </div>
              <span className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center text-xs font-bold">A</span>
            </div>

            <div className="col-span-2 sm:col-span-1 bg-[#0F172A] p-3.5 rounded-xl border border-emerald-500/20 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold text-emerald-400/80 uppercase tracking-wider">% Kehadiran</div>
                <div className="text-2xl font-bold text-emerald-400 mt-0.5">{attendanceRate}%</div>
              </div>
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
          </div>

          {isSavedRecently && (
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Presensi berhasil disimpan dan otomatis terintegrasi ke jurnal & rekap bulanan!
            </div>
          )}

          {/* Student Roster Table */}
          <div className="bg-[#0F172A] rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
            <div className="px-5 py-4 bg-[#0B1120] border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Daftar Presensi: <span className="text-blue-400">{currentClass?.name}</span> ({formatDateIndonesian(selectedDate)})
              </h3>
              <span className="text-xs text-slate-400">{classStudents.length} Siswa Terdaftar</span>
            </div>

            <div className="divide-y divide-slate-800">
              {classStudents.length > 0 ? (
                classStudents.map((std, idx) => {
                  const rec = currentRecords[std.id] || { status: 'H', note: '' };
                  return (
                    <div
                      key={std.id}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-800/30 transition-colors"
                    >
                      {/* Student Info */}
                      <div className="flex items-center gap-3 min-w-[220px]">
                        <span className="text-xs font-bold text-slate-500 w-6">
                          {std.attendanceNo !== undefined ? `${std.attendanceNo}.` : `${idx + 1}.`}
                        </span>
                        <div>
                          <div className="text-sm font-semibold text-white">{std.name}</div>
                          <div className="text-xs text-slate-400">
                            {std.nisn ? `NISN: ${std.nisn} • ` : ''}{std.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                          </div>
                        </div>
                      </div>

                      {/* Status Buttons */}
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleStatusChange(std.id, 'H')}
                          title="Hadir (H)"
                          className={`w-8 h-8 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center justify-center ${
                            rec.status === 'H'
                              ? 'bg-emerald-500 text-white shadow-sm ring-2 ring-emerald-400'
                              : 'bg-slate-800 text-slate-400 hover:bg-emerald-500/20 hover:text-emerald-400'
                          }`}
                        >
                          H
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(std.id, 'S')}
                          title="Sakit (S)"
                          className={`w-8 h-8 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center justify-center ${
                            rec.status === 'S'
                              ? 'bg-amber-500 text-white shadow-sm ring-2 ring-amber-400'
                              : 'bg-slate-800 text-slate-400 hover:bg-amber-500/20 hover:text-amber-400'
                          }`}
                        >
                          S
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(std.id, 'I')}
                          title="Izin (I)"
                          className={`w-8 h-8 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center justify-center ${
                            rec.status === 'I'
                              ? 'bg-sky-500 text-white shadow-sm ring-2 ring-sky-400'
                              : 'bg-slate-800 text-slate-400 hover:bg-sky-500/20 hover:text-sky-400'
                          }`}
                        >
                          I
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(std.id, 'A')}
                          title="Alpa (A)"
                          className={`w-8 h-8 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center justify-center ${
                            rec.status === 'A'
                              ? 'bg-rose-500 text-white shadow-sm ring-2 ring-rose-400'
                              : 'bg-slate-800 text-slate-400 hover:bg-rose-500/20 hover:text-rose-400'
                          }`}
                        >
                          A
                        </button>
                      </div>

                      {/* Note Input */}
                      <div className="sm:w-56">
                        <input
                          type="text"
                          placeholder="Catatan / keterangan..."
                          value={rec.note || ''}
                          onChange={(e) => handleNoteChange(std.id, e.target.value)}
                          className="w-full text-xs px-3 py-1.5 border border-slate-700 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-[#0B1120] text-white placeholder:text-slate-500"
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-xs text-slate-400">
                  Belum ada siswa terdaftar di kelas ini. Tambahkan siswa di menu Kelola Siswa.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* TAB 2: MODEL TABEL REKAP BULANAN (PER TANGGAL 1 - 31)                     */
        /* ========================================================================= */
        <div className="space-y-5">
          {/* Top Period Selector & Filter Bar */}
          <div className="bg-[#0F172A] p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-xl space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Class & Month Selectors */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Select Class */}
                <div className="flex items-center gap-1.5 bg-[#0B1120] px-3 py-1.5 rounded-xl border border-slate-700">
                  <Layers className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-semibold text-slate-300">Kelas:</span>
                  <select
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    className="text-xs font-bold bg-transparent text-white focus:outline-none cursor-pointer"
                  >
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id} className="bg-[#0F172A] text-white">
                        {cls.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Month Navigator */}
                <div className="flex items-center gap-1 bg-[#0B1120] p-1 rounded-xl border border-slate-700">
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    title="Bulan Sebelumnya"
                    className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <select
                    value={recapMonth}
                    onChange={(e) => setRecapMonth(Number(e.target.value))}
                    className="text-xs font-bold px-2 py-1 bg-transparent text-white focus:outline-none cursor-pointer"
                  >
                    {MONTH_NAMES_ID.map((name, idx) => (
                      <option key={idx + 1} value={idx + 1} className="bg-[#0F172A] text-white">
                        {name}
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    value={recapYear}
                    onChange={(e) => setRecapYear(Number(e.target.value))}
                    className="w-16 text-xs font-bold px-1.5 py-1 bg-transparent text-white border-l border-slate-700 focus:outline-none"
                  />

                  <button
                    type="button"
                    onClick={handleNextMonth}
                    title="Bulan Berikutnya"
                    className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Button Reset to This Month */}
                <button
                  type="button"
                  onClick={handleSetCurrentMonth}
                  className="px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
                >
                  Bulan Ini
                </button>
              </div>

              {/* Action Buttons: Mode Toggle & Exports */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Table Model Toggle */}
                <div className="inline-flex p-1 bg-[#0B1120] rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setTableModel('CALENDAR')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      tableModel === 'CALENDAR'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="Menampilkan seluruh tanggal 1 s/d akhir bulan (format kalender resmi)"
                  >
                    <CalendarDays className="w-3.5 h-3.5" />
                    <span>Kalender (1 s/d {daysInMonth})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTableModel('SESSIONS')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      tableModel === 'SESSIONS'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="Menampilkan hanya tanggal yang ada sesi presensi KBM"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Sesi Terlaksana ({monthlyAttendances.length})</span>
                  </button>
                </div>

                {/* CSV Export */}
                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-xl border border-slate-700 transition-all cursor-pointer"
                  title="Unduh format spreadsheet CSV / Excel"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <span className="hidden sm:inline">Excel/CSV</span>
                </button>

                {/* PDF Export Sesi Terlaksana Button */}
                <button
                  type="button"
                  onClick={() => handleExportPdf('SESSIONS')}
                  disabled={isExportingPdf || monthlyAttendances.length === 0}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/40 rounded-xl shadow-lg shadow-emerald-950/30 transition-all cursor-pointer active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Cetak khusus Rekap Sesi KBM Terlaksana (format matriks sesi terlaksana)"
                >
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <span>Cetak PDF Sesi Terlaksana</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-extrabold border border-emerald-500/30">
                    {monthlyAttendances.length}
                  </span>
                </button>

                {/* PDF Export Kalender (1-31) Button */}
                <button
                  type="button"
                  onClick={() => handleExportPdf('CALENDAR')}
                  disabled={isExportingPdf}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-lg shadow-blue-600/20 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                  title="Cetak Rekap Presensi Format Kalender Lengkap (1 s/d akhir bulan)"
                >
                  <Printer className="w-4 h-4" />
                  <span>{isExportingPdf ? 'Membuat PDF...' : 'Cetak PDF Kalender'}</span>
                </button>
              </div>
            </div>

            {/* Search & Gender Filters */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
              <div className="flex items-center gap-2 flex-1 max-w-sm">
                <div className="relative w-full">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Cari nama siswa atau NISN..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#0B1120] text-xs text-white pl-9 pr-3 py-1.5 rounded-xl border border-slate-700 focus:outline-none focus:border-blue-500 placeholder:text-slate-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Gender:</span>
                <select
                  value={genderFilter}
                  onChange={(e) => setGenderFilter(e.target.value as any)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-700 bg-[#0B1120] text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="ALL">Semua Siswa</option>
                  <option value="L">Laki-laki (L)</option>
                  <option value="P">Perempuan (P)</option>
                </select>

                <span className="text-xs font-semibold text-slate-400 ml-2">
                  Menampilkan: <strong className="text-blue-400">{filteredStudents.length} Siswa</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Monthly Analytic Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* 1. Avg Percentage */}
            <div className="bg-[#0F172A] p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rata-Rata Hadir</div>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-black text-emerald-400">{monthlyStats.averagePercent}%</span>
                <CheckCircle2 className="w-5 h-5 text-emerald-400 opacity-60" />
              </div>
            </div>

            {/* 2. Total Sessions */}
            <div className="bg-[#0F172A] p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sesi KBM Terdata</div>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-black text-blue-400">{monthlyStats.totalSessions}</span>
                <CalendarCheck className="w-5 h-5 text-blue-400 opacity-60" />
              </div>
            </div>

            {/* 3. Total Hadir (H) */}
            <div className="bg-[#0F172A] p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Hadir (H)</div>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-black text-emerald-400">{monthlyStats.totalH}</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400">Siswa</span>
              </div>
            </div>

            {/* 4. Total Sakit & Izin (S+I) */}
            <div className="bg-[#0F172A] p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sakit (S) / Izin (I)</div>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-black text-amber-400">{monthlyStats.totalS} <span className="text-xs text-sky-400 font-normal">/ {monthlyStats.totalI}</span></span>
                <Clock className="w-5 h-5 text-amber-400 opacity-60" />
              </div>
            </div>

            {/* 5. Total Alpa (A) */}
            <div className="bg-[#0F172A] p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Alpa (A)</div>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-black text-rose-400">{monthlyStats.totalA}</span>
                <AlertTriangle className="w-5 h-5 text-rose-400 opacity-60" />
              </div>
            </div>

            {/* 6. Disiplin 100% */}
            <div className="bg-[#0F172A] p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Siswa 100% Hadir</div>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-black text-purple-400">{monthlyStats.perfectStudentsCount}</span>
                <Award className="w-5 h-5 text-purple-400 opacity-60" />
              </div>
            </div>
          </div>

          {/* Guide / Instruction Note */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-300">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-blue-400 flex-shrink-0" />
              <span>
                <strong>Petunjuk:</strong> Klik nomor tanggal pada kolom tabel untuk langsung membuka form input / edit presensi pada tanggal tersebut.
              </span>
            </div>
            {/* Status Color Legend */}
            <div className="flex items-center gap-2 flex-wrap text-[11px]">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                H = Hadir
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30">
                S = Sakit
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-sky-500/20 text-sky-400 font-bold border border-sky-500/30">
                I = Izin
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 font-bold border border-rose-500/30">
                A = Alpa
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-semibold border border-slate-700">
                L = Libur
              </span>
            </div>
          </div>

          {/* MAIN TABLE: MONTHLY CALENDAR ATTENDANCE MATRIX */}
          <div className="bg-[#0F172A] rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
            <div className="overflow-x-auto max-h-[620px] scrollbar-thin scrollbar-thumb-slate-700">
              <table className="w-full text-left border-collapse text-xs">
                {/* TABLE HEADER */}
                <thead className="sticky top-0 z-20 bg-[#0B1120] text-slate-300 shadow-md">
                  <tr className="border-b border-slate-800 text-[11px]">
                    {/* Sticky Columns Left */}
                    <th className="p-3 text-center w-10 text-slate-400 font-bold sticky left-0 z-30 bg-[#0B1120] border-r border-slate-800">
                      No
                    </th>
                    <th className="p-3 w-28 text-slate-400 font-bold sticky left-10 z-30 bg-[#0B1120] border-r border-slate-800">
                      NISN
                    </th>
                    <th className="p-3 min-w-[200px] text-white font-bold sticky left-38 z-30 bg-[#0B1120] border-r border-slate-800">
                      Nama Lengkap Siswa
                    </th>
                    <th className="p-3 text-center w-12 text-slate-400 font-bold border-r border-slate-800">
                      L/P
                    </th>

                    {/* Dynamic Date Columns */}
                    {dateColumns.map((col) => {
                      const isSunday = col.isSunday;
                      const hasSession = col.hasSession;
                      return (
                        <th
                          key={col.dateString}
                          onClick={() => handleJumpToDateInput(col.dateString)}
                          className={`p-1.5 text-center min-w-[34px] border-r border-slate-800 cursor-pointer transition-colors group select-none ${
                            isSunday
                              ? 'bg-rose-950/30 text-rose-300'
                              : hasSession
                              ? 'bg-blue-950/40 text-blue-300 hover:bg-blue-900/60'
                              : 'text-slate-400 hover:bg-slate-800'
                          }`}
                          title={`Tanggal: ${formatDateIndonesian(col.dateString)} - Klik untuk catat presensi`}
                        >
                          <div className="flex flex-col items-center">
                            <span className={`text-[11px] font-bold ${isSunday ? 'text-rose-400' : hasSession ? 'text-blue-400 font-black' : 'text-slate-300'}`}>
                              {col.dayNumber}
                            </span>
                            <span className={`text-[9px] font-semibold uppercase ${isSunday ? 'text-rose-500' : 'text-slate-500'}`}>
                              {col.dayName}
                            </span>
                            {hasSession && (
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-0.5 animate-pulse" />
                            )}
                          </div>
                        </th>
                      );
                    })}

                    {/* Summary Columns Right */}
                    <th className="p-2.5 text-center bg-emerald-950/60 text-emerald-400 w-11 font-bold border-l border-r border-slate-800" title="Total Hadir">
                      H
                    </th>
                    <th className="p-2.5 text-center bg-amber-950/60 text-amber-400 w-11 font-bold border-r border-slate-800" title="Total Sakit">
                      S
                    </th>
                    <th className="p-2.5 text-center bg-sky-950/60 text-sky-400 w-11 font-bold border-r border-slate-800" title="Total Izin">
                      I
                    </th>
                    <th className="p-2.5 text-center bg-rose-950/60 text-rose-400 w-11 font-bold border-r border-slate-800" title="Total Alpa">
                      A
                    </th>
                    <th className="p-2.5 text-center bg-slate-900 text-blue-400 min-w-[76px] font-bold" title="Persentase Kehadiran">
                      % Hadir
                    </th>
                  </tr>
                </thead>

                {/* TABLE BODY (STUDENTS ROWS) */}
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map((std, idx) => {
                      const summary = calculateStudentAttendanceSummary(std.id, monthlyAttendances);

                      return (
                        <tr key={std.id} className="hover:bg-slate-800/40 transition-colors group">
                          {/* Sticky No */}
                          <td className="p-2.5 text-center font-bold text-slate-500 sticky left-0 z-10 bg-[#0F172A] group-hover:bg-slate-800/90 border-r border-slate-800">
                            {std.attendanceNo !== undefined ? std.attendanceNo : idx + 1}
                          </td>

                          {/* Sticky NISN */}
                          <td className="p-2.5 font-mono text-[11px] text-slate-400 sticky left-10 z-10 bg-[#0F172A] group-hover:bg-slate-800/90 border-r border-slate-800">
                            {std.nisn || '-'}
                          </td>

                          {/* Sticky Student Name */}
                          <td className="p-2.5 font-medium text-white sticky left-38 z-10 bg-[#0F172A] group-hover:bg-slate-800/90 border-r border-slate-800">
                            <div className="flex items-center justify-between gap-2">
                              <span className="truncate">{std.name}</span>
                            </div>
                          </td>

                          {/* Gender */}
                          <td className="p-2.5 text-center text-slate-400 font-semibold border-r border-slate-800">
                            {std.gender}
                          </td>

                          {/* Date Cells */}
                          {dateColumns.map((col) => {
                            if (col.isSunday) {
                              return (
                                <td
                                  key={col.dateString}
                                  className="p-1 text-center border-r border-slate-800 bg-rose-950/20 text-rose-400/60 font-mono text-[10px]"
                                >
                                  L
                                </td>
                              );
                            }

                            const rec = col.sessionRecord?.records[std.id];
                            const status = rec ? rec.status : '-';

                            let cellStyle = 'text-slate-600';
                            let badgeContent = status;

                            if (status === 'H') {
                              cellStyle = 'bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/30';
                            } else if (status === 'S') {
                              cellStyle = 'bg-amber-500/15 text-amber-400 font-bold border border-amber-500/30';
                            } else if (status === 'I') {
                              cellStyle = 'bg-sky-500/15 text-sky-400 font-bold border border-sky-500/30';
                            } else if (status === 'A') {
                              cellStyle = 'bg-rose-500/15 text-rose-400 font-bold border border-rose-500/30';
                            }

                            return (
                              <td
                                key={col.dateString}
                                onClick={() => handleJumpToDateInput(col.dateString)}
                                className="p-1 text-center border-r border-slate-800 cursor-pointer hover:bg-blue-500/10 transition-colors"
                                title={`${std.name} (${col.dayNumber} ${MONTH_NAMES_ID[recapMonth - 1]}): ${
                                  status === 'H'
                                    ? 'Hadir'
                                    : status === 'S'
                                    ? 'Sakit'
                                    : status === 'I'
                                    ? 'Izin'
                                    : status === 'A'
                                    ? 'Alpa'
                                    : 'Tidak Ada Data'
                                }${rec?.note ? ` - Catatan: ${rec.note}` : ''}`}
                              >
                                <span
                                  className={`inline-flex items-center justify-center w-6 h-6 rounded-md text-[11px] ${cellStyle}`}
                                >
                                  {badgeContent}
                                </span>
                              </td>
                            );
                          })}

                          {/* Summary Cells */}
                          <td className="p-2.5 text-center font-bold text-emerald-400 bg-emerald-950/20 border-l border-r border-slate-800">
                            {summary.H}
                          </td>
                          <td className="p-2.5 text-center font-bold text-amber-400 bg-amber-950/20 border-r border-slate-800">
                            {summary.S}
                          </td>
                          <td className="p-2.5 text-center font-bold text-sky-400 bg-sky-950/20 border-r border-slate-800">
                            {summary.I}
                          </td>
                          <td className="p-2.5 text-center font-bold text-rose-400 bg-rose-950/20 border-r border-slate-800">
                            {summary.A}
                          </td>
                          <td className="p-2.5 text-center font-bold bg-slate-900/60">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                summary.percent >= 85
                                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                  : summary.percent >= 75
                                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                  : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                              }`}
                            >
                              {summary.percent}%
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={dateColumns.length + 9}
                        className="p-12 text-center text-xs text-slate-400"
                      >
                        Tidak ada siswa yang sesuai dengan filter pencarian.
                      </td>
                    </tr>
                  )}
                </tbody>

                {/* TABLE FOOTER (DAILY TOTALS & SUMMARY) */}
                <tfoot className="sticky bottom-0 z-20 bg-[#0B1120] text-slate-300 font-bold border-t-2 border-slate-700 shadow-2xl">
                  {/* Row: Total Hadir (H) */}
                  <tr className="border-b border-slate-800/80 text-[11px]">
                    <td
                      colSpan={4}
                      className="p-2.5 text-right font-bold text-emerald-400 sticky left-0 z-30 bg-[#0B1120] border-r border-slate-800"
                    >
                      Jumlah Hadir (H):
                    </td>
                    {dateColumns.map((col) => {
                      if (col.isSunday) {
                        return <td key={col.dateString} className="p-1.5 text-center border-r border-slate-800 text-slate-600">-</td>;
                      }
                      if (!col.sessionRecord) {
                        return <td key={col.dateString} className="p-1.5 text-center border-r border-slate-800 text-slate-600">-</td>;
                      }
                      let count = 0;
                      classStudents.forEach((s) => {
                        if (col.sessionRecord?.records[s.id]?.status === 'H') count++;
                      });
                      return (
                        <td key={col.dateString} className="p-1.5 text-center border-r border-slate-800 text-emerald-400 font-bold">
                          {count}
                        </td>
                      );
                    })}
                    <td className="p-2 text-center font-black text-emerald-400 bg-emerald-950/40 border-l border-r border-slate-800">
                      {monthlyStats.totalH}
                    </td>
                    <td colSpan={4} className="p-2 text-center text-slate-500 bg-slate-900/60">-</td>
                  </tr>

                  {/* Row: Total Sakit (S) */}
                  <tr className="border-b border-slate-800/80 text-[11px]">
                    <td
                      colSpan={4}
                      className="p-2.5 text-right font-bold text-amber-400 sticky left-0 z-30 bg-[#0B1120] border-r border-slate-800"
                    >
                      Jumlah Sakit (S):
                    </td>
                    {dateColumns.map((col) => {
                      if (col.isSunday || !col.sessionRecord) {
                        return <td key={col.dateString} className="p-1.5 text-center border-r border-slate-800 text-slate-600">-</td>;
                      }
                      let count = 0;
                      classStudents.forEach((s) => {
                        if (col.sessionRecord?.records[s.id]?.status === 'S') count++;
                      });
                      return (
                        <td key={col.dateString} className="p-1.5 text-center border-r border-slate-800 text-amber-400 font-bold">
                          {count}
                        </td>
                      );
                    })}
                    <td className="p-2 text-center text-slate-500 bg-slate-900/60 border-l border-r border-slate-800">-</td>
                    <td className="p-2 text-center font-black text-amber-400 bg-amber-950/40 border-r border-slate-800">
                      {monthlyStats.totalS}
                    </td>
                    <td colSpan={3} className="p-2 text-center text-slate-500 bg-slate-900/60">-</td>
                  </tr>

                  {/* Row: Total Izin (I) */}
                  <tr className="border-b border-slate-800/80 text-[11px]">
                    <td
                      colSpan={4}
                      className="p-2.5 text-right font-bold text-sky-400 sticky left-0 z-30 bg-[#0B1120] border-r border-slate-800"
                    >
                      Jumlah Izin (I):
                    </td>
                    {dateColumns.map((col) => {
                      if (col.isSunday || !col.sessionRecord) {
                        return <td key={col.dateString} className="p-1.5 text-center border-r border-slate-800 text-slate-600">-</td>;
                      }
                      let count = 0;
                      classStudents.forEach((s) => {
                        if (col.sessionRecord?.records[s.id]?.status === 'I') count++;
                      });
                      return (
                        <td key={col.dateString} className="p-1.5 text-center border-r border-slate-800 text-sky-400 font-bold">
                          {count}
                        </td>
                      );
                    })}
                    <td colSpan={2} className="p-2 text-center text-slate-500 bg-slate-900/60 border-l border-r border-slate-800">-</td>
                    <td className="p-2 text-center font-black text-sky-400 bg-sky-950/40 border-r border-slate-800">
                      {monthlyStats.totalI}
                    </td>
                    <td colSpan={2} className="p-2 text-center text-slate-500 bg-slate-900/60">-</td>
                  </tr>

                  {/* Row: Total Alpa (A) */}
                  <tr className="border-b border-slate-800/80 text-[11px]">
                    <td
                      colSpan={4}
                      className="p-2.5 text-right font-bold text-rose-400 sticky left-0 z-30 bg-[#0B1120] border-r border-slate-800"
                    >
                      Jumlah Alpa (A):
                    </td>
                    {dateColumns.map((col) => {
                      if (col.isSunday || !col.sessionRecord) {
                        return <td key={col.dateString} className="p-1.5 text-center border-r border-slate-800 text-slate-600">-</td>;
                      }
                      let count = 0;
                      classStudents.forEach((s) => {
                        if (col.sessionRecord?.records[s.id]?.status === 'A') count++;
                      });
                      return (
                        <td key={col.dateString} className="p-1.5 text-center border-r border-slate-800 text-rose-400 font-bold">
                          {count}
                        </td>
                      );
                    })}
                    <td colSpan={3} className="p-2 text-center text-slate-500 bg-slate-900/60 border-l border-r border-slate-800">-</td>
                    <td className="p-2 text-center font-black text-rose-400 bg-rose-950/40 border-r border-slate-800">
                      {monthlyStats.totalA}
                    </td>
                    <td className="p-2 text-center font-black text-blue-400 bg-blue-950/40">
                      {monthlyStats.averagePercent}%
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
