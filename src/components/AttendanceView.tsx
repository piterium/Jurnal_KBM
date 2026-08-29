import React, { useState, useEffect } from 'react';
import { AttendanceRecord, AttendanceStatus, ClassRoom, Student, TeachingJournal } from '../types';
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
} from 'lucide-react';
import {
  formatDateIndonesian,
  formatShortDateIndonesian,
  calculateStudentAttendanceSummary,
  MONTH_NAMES_ID,
} from '../utils/storage';

interface AttendanceViewProps {
  attendances: AttendanceRecord[];
  classes: ClassRoom[];
  students: Student[];
  journals: TeachingJournal[];
  onSaveAttendance: (record: AttendanceRecord) => void;
  initialClassId?: string;
  initialDate?: string;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({
  attendances,
  classes,
  students,
  journals,
  onSaveAttendance,
  initialClassId,
  initialDate,
}) => {
  const [activeTab, setActiveTab] = useState<'INPUT' | 'RECAP'>('INPUT');
  const [selectedClassId, setSelectedClassId] = useState<string>(initialClassId || classes[0]?.id || '');
  const [selectedDate, setSelectedDate] = useState<string>(initialDate || new Date().toISOString().split('T')[0]);
  const [currentRecords, setCurrentRecords] = useState<Record<string, { status: AttendanceStatus; note?: string }>>({});
  const [recapMonth, setRecapMonth] = useState<number>(new Date().getMonth() + 1);
  const [recapYear, setRecapYear] = useState<number>(new Date().getFullYear());
  const [isSavedRecently, setIsSavedRecently] = useState(false);

  // Sync selectedClassId if props change
  useEffect(() => {
    if (initialClassId) setSelectedClassId(initialClassId);
    if (initialDate) setSelectedDate(initialDate);
  }, [initialClassId, initialDate]);

  // Load existing records for class and date
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
  const classStudents = students.filter((s) => s.classId === selectedClassId && s.active);

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

  // Count current statistics
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

  // Monthly Recap calculations for RECAP view
  const monthlyAttendances = attendances.filter((a) => {
    const d = new Date(a.date);
    return (
      a.classId === selectedClassId &&
      d.getMonth() + 1 === recapMonth &&
      d.getFullYear() === recapYear
    );
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="space-y-6">
      {/* Header View */}
      <div className="bg-[#0F172A] p-5 sm:p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center border border-emerald-500/20 flex-shrink-0">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-wide">
                Presensi & Absensi Kehadiran Siswa
              </h2>
              <p className="text-xs text-slate-400">
                Pencatatan kehadiran harian otomatis terintegrasi dengan jurnal dan laporan bulanan
              </p>
            </div>
          </div>
        </div>

        {/* View Switcher: Input Harian vs Rekap Bulanan */}
        <div className="inline-flex p-1 bg-[#0B1120] rounded-xl border border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('INPUT')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'INPUT'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Input Presensi Harian
          </button>
          <button
            onClick={() => setActiveTab('RECAP')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'RECAP'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Matriks Rekap Bulanan
          </button>
        </div>
      </div>

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
                <span className="text-xs px-3 py-1 bg-blue-500/15 text-blue-400 border border-blue-500/30 rounded-lg font-medium">
                  Terhubung: Jurnal Pertemuan Ke-{linkedJournal.meetingNumber} ({linkedJournal.topic})
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
              Presensi berhasil disimpan dan otomatis terintegrasi ke jurnal & laporan bulanan!
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
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            rec.status === 'H'
                              ? 'bg-emerald-500 text-white shadow-sm ring-2 ring-emerald-400'
                              : 'bg-slate-800 text-slate-400 hover:bg-emerald-500/20 hover:text-emerald-400'
                          }`}
                        >
                          H (Hadir)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(std.id, 'S')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            rec.status === 'S'
                              ? 'bg-amber-500 text-white shadow-sm ring-2 ring-amber-400'
                              : 'bg-slate-800 text-slate-400 hover:bg-amber-500/20 hover:text-amber-400'
                          }`}
                        >
                          S (Sakit)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(std.id, 'I')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            rec.status === 'I'
                              ? 'bg-sky-500 text-white shadow-sm ring-2 ring-sky-400'
                              : 'bg-slate-800 text-slate-400 hover:bg-sky-500/20 hover:text-sky-400'
                          }`}
                        >
                          I (Izin)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(std.id, 'A')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            rec.status === 'A'
                              ? 'bg-rose-500 text-white shadow-sm ring-2 ring-rose-400'
                              : 'bg-slate-800 text-slate-400 hover:bg-rose-500/20 hover:text-rose-400'
                          }`}
                        >
                          A (Alpa)
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
        /* RECAP MATRIX VIEW */
        <div className="space-y-4">
          <div className="bg-[#0F172A] p-4 rounded-2xl border border-slate-800 shadow-xl flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-300">Kelas:</span>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="text-xs font-semibold px-3 py-1.5 border border-slate-700 rounded-lg bg-[#0B1120] text-white focus:border-blue-500"
                >
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-300">Bulan:</span>
                <select
                  value={recapMonth}
                  onChange={(e) => setRecapMonth(Number(e.target.value))}
                  className="text-xs font-semibold px-3 py-1.5 border border-slate-700 rounded-lg bg-[#0B1120] text-white focus:border-blue-500"
                >
                  {MONTH_NAMES_ID.map((name, idx) => (
                    <option key={idx + 1} value={idx + 1}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-300">Tahun:</span>
                <input
                  type="number"
                  value={recapYear}
                  onChange={(e) => setRecapYear(Number(e.target.value))}
                  className="w-24 text-xs font-semibold px-3 py-1.5 border border-slate-700 rounded-lg bg-[#0B1120] text-white focus:border-blue-500"
                />
              </div>
            </div>

            <div className="text-xs text-slate-300 font-medium">
              Total Sesi Presensi Bulan Ini: <strong className="text-blue-400">{monthlyAttendances.length} Pertemuan</strong>
            </div>
          </div>

          {/* Matrix Table */}
          <div className="bg-[#0F172A] rounded-2xl border border-slate-800 shadow-xl overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#0B1120] text-slate-400 border-b border-slate-800">
                  <th className="p-3 text-center w-10 text-slate-500">No</th>
                  <th className="p-3">NISN</th>
                  <th className="p-3 min-w-[180px]">Nama Lengkap Siswa</th>
                  <th className="p-3 text-center w-12">L/P</th>
                  {monthlyAttendances.map((att) => {
                    const parts = att.date.split('-');
                    return (
                      <th key={att.id} className="p-2 text-center border-l border-slate-800 min-w-[40px] text-slate-300 font-mono" title={att.date}>
                        {parts[2]}/{parts[1]}
                      </th>
                    );
                  })}
                  <th className="p-3 text-center bg-emerald-950/60 text-emerald-400 w-10 font-bold border-l border-slate-800">H</th>
                  <th className="p-3 text-center bg-amber-950/60 text-amber-400 w-10 font-bold">S</th>
                  <th className="p-3 text-center bg-sky-950/60 text-sky-400 w-10 font-bold">I</th>
                  <th className="p-3 text-center bg-rose-950/60 text-rose-400 w-10 font-bold">A</th>
                  <th className="p-3 text-center bg-slate-800 text-blue-400 min-w-[70px] font-bold">% Hadir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {classStudents.map((std, idx) => {
                  const summary = calculateStudentAttendanceSummary(std.id, monthlyAttendances);
                  return (
                    <tr key={std.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-2.5 text-center font-bold text-slate-500">{idx + 1}</td>
                      <td className="p-2.5 font-mono text-[11px] text-slate-400">{std.nisn}</td>
                      <td className="p-2.5 font-medium text-white">{std.name}</td>
                      <td className="p-2.5 text-center text-slate-400">{std.gender}</td>
                      {monthlyAttendances.map((att) => {
                        const status = att.records[std.id]?.status || '-';
                        let bgBadge = 'text-slate-600';
                        if (status === 'H') bgBadge = 'text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20';
                        else if (status === 'S') bgBadge = 'text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20';
                        else if (status === 'I') bgBadge = 'text-sky-400 font-bold bg-sky-500/10 border border-sky-500/20';
                        else if (status === 'A') bgBadge = 'text-rose-400 font-bold bg-rose-500/10 border border-rose-500/20';

                        return (
                          <td key={att.id} className="p-2 text-center border-l border-slate-800">
                            <span className={`inline-block w-6 py-0.5 rounded text-[11px] ${bgBadge}`}>
                              {status}
                            </span>
                          </td>
                        );
                      })}
                      <td className="p-2.5 text-center font-bold text-emerald-400 bg-emerald-950/20 border-l border-slate-800">{summary.H}</td>
                      <td className="p-2.5 text-center font-bold text-amber-400 bg-amber-950/20">{summary.S}</td>
                      <td className="p-2.5 text-center font-bold text-sky-400 bg-sky-950/20">{summary.I}</td>
                      <td className="p-2.5 text-center font-bold text-rose-400 bg-rose-950/20">{summary.A}</td>
                      <td className="p-2.5 text-center font-bold bg-slate-800/60">
                        <span className={summary.percent < 80 ? 'text-rose-400' : 'text-emerald-400'}>
                          {summary.percent}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
