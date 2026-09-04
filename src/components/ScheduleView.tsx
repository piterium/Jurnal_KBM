import React, { useState, useMemo } from 'react';
import { TeachingSchedule, DayOfWeek, ClassRoom, SchoolProfile } from '../types';
import {
  CalendarDays,
  Clock,
  Plus,
  Edit2,
  Trash2,
  Printer,
  Calendar,
  BookOpen,
  CheckCircle2,
  Layers,
  MapPin,
  FileText,
  Search,
  Filter,
  ArrowRight,
  UserCheck,
  AlertCircle,
  X,
  Sparkles,
} from 'lucide-react';

export const DAYS_OF_WEEK: DayOfWeek[] = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

export function getTodayDayOfWeek(): DayOfWeek {
  const dayIndex = new Date().getDay();
  const map: Record<number, DayOfWeek> = {
    0: 'Minggu',
    1: 'Senin',
    2: 'Selasa',
    3: 'Rabu',
    4: 'Kamis',
    5: 'Jumat',
    6: 'Sabtu',
  };
  return map[dayIndex] || 'Senin';
}

interface ScheduleViewProps {
  schedules: TeachingSchedule[];
  classes: ClassRoom[];
  profile: SchoolProfile;
  onSaveSchedule: (schedule: TeachingSchedule) => void;
  onDeleteSchedule: (id: string) => void;
  onOpenAttendance?: (classId: string) => void;
  onOpenNewJournal?: (params: { classId: string; subject: string; hoursCount: number; jamKe: string }) => void;
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({
  schedules,
  classes,
  profile,
  onSaveSchedule,
  onDeleteSchedule,
  onOpenAttendance,
  onOpenNewJournal,
}) => {
  const todayDay = useMemo(() => getTodayDayOfWeek(), []);
  const [selectedDayFilter, setSelectedDayFilter] = useState<string>('Semua');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<TeachingSchedule | null>(null);
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState<{
    day: DayOfWeek;
    jamKe: string;
    timeStart: string;
    timeEnd: string;
    totalHours: number;
    subject: string;
    classId: string;
    className: string;
    room: string;
    notes: string;
  }>({
    day: 'Senin',
    jamKe: '1 - 2',
    timeStart: '07:30',
    timeEnd: '08:50',
    totalHours: 2,
    subject: profile.subject || '',
    classId: classes[0]?.id || '',
    className: classes[0]?.name || '',
    room: '',
    notes: '',
  });

  const handleOpenAddModal = (defaultDay?: DayOfWeek) => {
    const initialClass = classes[0];
    setEditingSchedule(null);
    setFormData({
      day: defaultDay || 'Senin',
      jamKe: '1 - 2',
      timeStart: '07:30',
      timeEnd: '08:50',
      totalHours: 2,
      subject: profile.subject || initialClass?.subject || 'Informatika',
      classId: initialClass?.id || '',
      className: initialClass?.name || '',
      room: '',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (schedule: TeachingSchedule) => {
    setEditingSchedule(schedule);
    setFormData({
      day: schedule.day,
      jamKe: schedule.jamKe,
      timeStart: schedule.timeStart,
      timeEnd: schedule.timeEnd,
      totalHours: schedule.totalHours || 2,
      subject: schedule.subject,
      classId: schedule.classId,
      className: schedule.className,
      room: schedule.room || '',
      notes: schedule.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleClassChange = (selectedClassId: string) => {
    const found = classes.find((c) => c.id === selectedClassId);
    if (found) {
      setFormData((prev) => ({
        ...prev,
        classId: found.id,
        className: found.name,
        subject: prev.subject || found.subject || profile.subject || '',
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        classId: selectedClassId,
        className: selectedClassId,
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.day || !formData.jamKe || !formData.subject.trim() || !formData.className.trim()) {
      alert('Mohon lengkapi hari, jam mengajar, mata pelajaran, dan kelas!');
      return;
    }

    const scheduleItem: TeachingSchedule = {
      id: editingSchedule?.id || `sch-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      day: formData.day,
      jamKe: formData.jamKe.trim(),
      timeStart: formData.timeStart.trim(),
      timeEnd: formData.timeEnd.trim(),
      totalHours: Number(formData.totalHours) || 2,
      subject: formData.subject.trim(),
      classId: formData.classId || `custom-${formData.className.trim()}`,
      className: formData.className.trim(),
      room: formData.room.trim(),
      notes: formData.notes.trim(),
    };

    onSaveSchedule(scheduleItem);
    setIsModalOpen(false);
  };

  // Filtered schedules
  const filteredSchedules = useMemo(() => {
    return schedules.filter((sch) => {
      if (selectedDayFilter !== 'Semua' && sch.day !== selectedDayFilter) return false;
      if (selectedClassFilter !== 'Semua' && sch.className !== selectedClassFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchSubject = sch.subject?.toLowerCase().includes(q);
        const matchClass = sch.className?.toLowerCase().includes(q);
        const matchJam = sch.jamKe?.toLowerCase().includes(q);
        const matchRoom = sch.room?.toLowerCase().includes(q);
        if (!matchSubject && !matchClass && !matchJam && !matchRoom) return false;
      }
      return true;
    });
  }, [schedules, selectedDayFilter, selectedClassFilter, searchQuery]);

  // Statistics
  const totalWeeklyJP = useMemo(() => {
    return schedules.reduce((sum, item) => sum + (item.totalHours || 2), 0);
  }, [schedules]);

  const uniqueTeachingDaysCount = useMemo(() => {
    const days = new Set(schedules.map((s) => s.day));
    return days.size;
  }, [schedules]);

  const todaySchedules = useMemo(() => {
    return schedules.filter((s) => s.day === todayDay);
  }, [schedules, todayDay]);

  // Group schedules by Day for card view
  const schedulesByDay = useMemo(() => {
    const grouped: Record<DayOfWeek, TeachingSchedule[]> = {
      Senin: [],
      Selasa: [],
      Rabu: [],
      Kamis: [],
      Jumat: [],
      Sabtu: [],
      Minggu: [],
    };

    filteredSchedules.forEach((sch) => {
      if (grouped[sch.day]) {
        grouped[sch.day].push(sch);
      }
    });

    // Sort within day by timeStart or jamKe
    Object.keys(grouped).forEach((d) => {
      const dayKey = d as DayOfWeek;
      grouped[dayKey].sort((a, b) => (a.timeStart || '').localeCompare(b.timeStart || ''));
    });

    return grouped;
  }, [filteredSchedules]);

  // Preset time helpers
  const jamPresets = [
    { label: 'Jam 1 - 2', jamKe: '1 - 2', start: '07:15', end: '08:35', jp: 2 },
    { label: 'Jam 3 - 4', jamKe: '3 - 4', start: '08:35', end: '09:55', jp: 2 },
    { label: 'Jam 5 - 6', jamKe: '5 - 6', start: '10:15', end: '11:35', jp: 2 },
    { label: 'Jam 7 - 8', jamKe: '7 - 8', start: '12:15', end: '13:35', jp: 2 },
    { label: 'Jam 1 - 3 (3 JP)', jamKe: '1 - 3', start: '07:15', end: '09:15', jp: 3 },
    { label: 'Jam 4 - 6 (3 JP)', jamKe: '4 - 6', start: '09:35', end: '11:35', jp: 3 },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0F172A] p-5 sm:p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Jadwal Mengajar Guru Mandiri
              </h1>
              <p className="text-xs sm:text-sm text-slate-400">
                Kelola jadwal tatap muka mingguan, alokasi jam mengajar, mata pelajaran, dan kelas binaan.
              </p>
            </div>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsPrintPreviewOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-sm hover:text-white"
          >
            <Printer className="w-4 h-4 text-blue-400" />
            <span>Cetak / PDF Jadwal</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenAddModal()}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-blue-600/25"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Jadwal Baru</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl bg-[#0F172A] border border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Total Beban Mengajar</div>
            <div className="text-lg sm:text-xl font-bold text-white">{totalWeeklyJP} <span className="text-xs font-normal text-slate-400">JP / Minggu</span></div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0F172A] border border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Hari Aktif Mengajar</div>
            <div className="text-lg sm:text-xl font-bold text-emerald-400">{uniqueTeachingDaysCount} <span className="text-xs font-normal text-slate-400">Hari</span></div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0F172A] border border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Total Sesi Pertemuan</div>
            <div className="text-lg sm:text-xl font-bold text-white">{schedules.length} <span className="text-xs font-normal text-slate-400">Sesi</span></div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0F172A] border border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Jadwal Hari Ini ({todayDay})</div>
            <div className="text-lg sm:text-xl font-bold text-amber-400">
              {todaySchedules.length} <span className="text-xs font-normal text-slate-400">Sesi Kelas</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and View Mode Switcher */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-[#0F172A] p-4 rounded-xl border border-slate-800">
        {/* Search and Dropdown Filter */}
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari mapel, kelas, ruang..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs"
              >
                ×
              </button>
            )}
          </div>

          {/* Filter Hari */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span>Hari:</span>
            <select
              value={selectedDayFilter}
              onChange={(e) => setSelectedDayFilter(e.target.value)}
              className="py-1 px-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="Semua">Semua Hari</option>
              {DAYS_OF_WEEK.map((day) => (
                <option key={day} value={day}>
                  {day} {day === todayDay ? '(Hari Ini)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Kelas */}
          {classes.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span>Kelas:</span>
              <select
                value={selectedClassFilter}
                onChange={(e) => setSelectedClassFilter(e.target.value)}
                className="py-1 px-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="Semua">Semua Kelas</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.name}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-lg border border-slate-800 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('cards')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
              viewMode === 'cards'
                ? 'bg-blue-600 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Tampilan Hari
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
              viewMode === 'table'
                ? 'bg-blue-600 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Tampilan Tabel
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {schedules.length === 0 ? (
        /* Empty State */
        <div className="p-12 text-center bg-[#0F172A] rounded-2xl border border-slate-800 space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-600/10 text-blue-400 border border-blue-500/20 flex items-center justify-center">
            <CalendarDays className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-base font-bold text-white">Belum Ada Jadwal Mengajar</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Tambahkan data jadwal tatap muka mingguan mandiri Anda berdasarkan hari mengajar, jam mengajar, mata pelajaran, dan kelas.
            </p>
          </div>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => handleOpenAddModal()}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold inline-flex items-center gap-2 shadow-lg shadow-blue-600/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Jadwal Mengajar Pertama</span>
            </button>
          </div>
        </div>
      ) : viewMode === 'cards' ? (
        /* CARDS / DAYS VIEW */
        <div className="space-y-6">
          {/* Day Columns */}
          {DAYS_OF_WEEK.filter(
            (day) => selectedDayFilter === 'Semua' || selectedDayFilter === day
          ).map((day) => {
            const daySchedules = schedulesByDay[day] || [];
            const isToday = day === todayDay;
            const dayTotalJP = daySchedules.reduce((acc, curr) => acc + (curr.totalHours || 2), 0);

            return (
              <div
                key={day}
                className={`rounded-2xl border transition-all ${
                  isToday
                    ? 'bg-[#0F172A] border-blue-500/50 shadow-lg shadow-blue-500/5'
                    : 'bg-[#0F172A] border-slate-800'
                }`}
              >
                {/* Day Header */}
                <div className="px-5 py-3.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                        isToday
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {day.substring(0, 3)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white tracking-wide">{day}</span>
                        {isToday && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            Hari Ini
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {daySchedules.length} Sesi Pertemuan • {dayTotalJP} Jam Pelajaran (JP)
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenAddModal(day)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-blue-400" />
                    <span>Tambah di {day}</span>
                  </button>
                </div>

                {/* Schedules list inside Day */}
                <div className="p-4 sm:p-5">
                  {daySchedules.length === 0 ? (
                    <div className="text-center py-6 text-xs text-slate-500 italic">
                      Tidak ada jadwal mengajar pada hari {day}.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                      {daySchedules.map((sch) => (
                        <div
                          key={sch.id}
                          className="rounded-xl bg-slate-900/90 border border-slate-800/90 hover:border-slate-700 p-4 transition-all duration-150 flex flex-col justify-between group shadow-sm"
                        >
                          <div>
                            {/* Time and JP badge */}
                            <div className="flex items-center justify-between gap-2 mb-2.5">
                              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400">
                                <Clock className="w-3.5 h-3.5 text-blue-400" />
                                <span>Jam ke-{sch.jamKe}</span>
                                {sch.timeStart && sch.timeEnd && (
                                  <span className="text-slate-400 font-normal">
                                    • {sch.timeStart} - {sch.timeEnd}
                                  </span>
                                )}
                              </div>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                {sch.totalHours || 2} JP
                              </span>
                            </div>

                            {/* Class and Subject */}
                            <div className="space-y-1 mb-3">
                              <div className="flex items-center gap-2">
                                <span className="text-base font-bold text-white tracking-tight">
                                  {sch.className}
                                </span>
                                {sch.room && (
                                  <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded">
                                    <MapPin className="w-3 h-3 text-slate-400" />
                                    {sch.room}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                                <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                                <span>{sch.subject}</span>
                              </div>
                            </div>

                            {/* Notes */}
                            {sch.notes && (
                              <div className="text-[11px] text-slate-400 bg-slate-950/60 p-2 rounded-lg border border-slate-800/60 mb-3 line-clamp-2">
                                {sch.notes}
                              </div>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2 mt-2">
                            {/* Quick Attendance / Journal Buttons */}
                            <div className="flex items-center gap-1.5">
                              {onOpenAttendance && (
                                <button
                                  type="button"
                                  title="Buka Presensi Kelas Ini"
                                  onClick={() => onOpenAttendance(sch.classId)}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                                >
                                  <UserCheck className="w-3 h-3" />
                                  <span>Presensi</span>
                                </button>
                              )}

                              {onOpenNewJournal && (
                                <button
                                  type="button"
                                  title="Tulis Jurnal Mengajar untuk Kelas Ini"
                                  onClick={() =>
                                    onOpenNewJournal({
                                      classId: sch.classId,
                                      subject: sch.subject,
                                      hoursCount: sch.totalHours || 2,
                                      jamKe: sch.jamKe,
                                    })
                                  }
                                  className="px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                                >
                                  <FileText className="w-3 h-3" />
                                  <span>Jurnal</span>
                                </button>
                              )}
                            </div>

                            {/* Edit / Delete */}
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                title="Edit Jadwal"
                                onClick={() => handleOpenEditModal(sch)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                title="Hapus Jadwal"
                                onClick={() => {
                                  if (confirm(`Hapus jadwal mengajar kelas ${sch.className} (${sch.day}, Jam ke-${sch.jamKe})?`)) {
                                    onDeleteSchedule(sch.id);
                                  }
                                }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-[#0F172A] rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/90 text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-800 font-semibold">
                <tr>
                  <th className="px-4 py-3.5 text-center w-12">No</th>
                  <th className="px-4 py-3.5">Hari</th>
                  <th className="px-4 py-3.5">Jam Mengajar / Waktu</th>
                  <th className="px-4 py-3.5">Kelas</th>
                  <th className="px-4 py-3.5">Mata Pelajaran</th>
                  <th className="px-4 py-3.5 text-center">Beban (JP)</th>
                  <th className="px-4 py-3.5">Ruang</th>
                  <th className="px-4 py-3.5">Catatan</th>
                  <th className="px-4 py-3.5 text-center w-36">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredSchedules.map((sch, idx) => {
                  const isToday = sch.day === todayDay;
                  return (
                    <tr
                      key={sch.id}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        isToday ? 'bg-blue-500/5' : ''
                      }`}
                    >
                      <td className="px-4 py-3.5 text-center text-slate-500 font-mono">
                        {idx + 1}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="font-bold text-white">{sch.day}</span>
                        {isToday && (
                          <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            Hari Ini
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="font-semibold text-blue-400">Jam ke-{sch.jamKe}</div>
                        {sch.timeStart && sch.timeEnd && (
                          <div className="text-[11px] text-slate-400">
                            {sch.timeStart} - {sch.timeEnd}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap font-bold text-white">
                        {sch.className}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-slate-200">
                        {sch.subject}
                      </td>
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          {sch.totalHours || 2} JP
                        </span>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-slate-400">
                        {sch.room || '-'}
                      </td>
                      <td className="px-4 py-3.5 text-slate-400 max-w-xs truncate">
                        {sch.notes || '-'}
                      </td>
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {onOpenAttendance && (
                            <button
                              type="button"
                              title="Buka Presensi"
                              onClick={() => onOpenAttendance(sch.classId)}
                              className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/15 transition-colors cursor-pointer"
                            >
                              <UserCheck className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            title="Edit Jadwal"
                            onClick={() => handleOpenEditModal(sch)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            title="Hapus Jadwal"
                            onClick={() => {
                              if (confirm(`Hapus jadwal mengajar kelas ${sch.className} (${sch.day})?`)) {
                                onDeleteSchedule(sch.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH / EDIT JADWAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg bg-[#0F172A] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold">
                  <CalendarDays className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-white">
                  {editingSchedule ? 'Edit Jadwal Mengajar' : 'Tambah Jadwal Mengajar Baru'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Hari Mengajar */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Hari Mengajar <span className="text-rose-400">*</span>
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                  {DAYS_OF_WEEK.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, day: d }))}
                      className={`py-2 px-1 text-center rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        formData.day === d
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                          : 'bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preset Jam Cepat */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Pilih Cepat Sesi / Preset Jam
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {jamPresets.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          jamKe: preset.jamKe,
                          timeStart: preset.start,
                          timeEnd: preset.end,
                          totalHours: preset.jp,
                        }));
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 hover:text-white transition-colors cursor-pointer"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Jam Ke & Beban JP */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Jam Ke- <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.jamKe}
                    onChange={(e) => setFormData((prev) => ({ ...prev, jamKe: e.target.value }))}
                    placeholder="misal: 1 - 2 atau 3, 4"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Beban Jam Pelajaran (JP) <span className="text-rose-400">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, totalHours: num }))}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          formData.totalHours === num
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        {num} JP
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Jam Waktu (Mulai & Selesai) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Waktu Mulai (HH:MM)
                  </label>
                  <input
                    type="time"
                    value={formData.timeStart}
                    onChange={(e) => setFormData((prev) => ({ ...prev, timeStart: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Waktu Selesai (HH:MM)
                  </label>
                  <input
                    type="time"
                    value={formData.timeEnd}
                    onChange={(e) => setFormData((prev) => ({ ...prev, timeEnd: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Kelas */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nama Kelas <span className="text-rose-400">*</span>
                </label>
                {classes.length > 0 ? (
                  <div className="space-y-2">
                    <select
                      value={formData.classId}
                      onChange={(e) => handleClassChange(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="">-- Pilih Kelas Binaan --</option>
                      {classes.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          {cls.name} (Tingkat {cls.level})
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Atau ketik nama kelas langsung jika tidak ada di daftar..."
                      value={formData.className}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          className: e.target.value,
                          classId: prev.classId || `custom-${e.target.value}`,
                        }))
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                ) : (
                  <input
                    type="text"
                    required
                    placeholder="misal: VII-A, VIII-B, IX-C"
                    value={formData.className}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        className: e.target.value,
                        classId: `custom-${e.target.value}`,
                      }))
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                )}
              </div>

              {/* Mata Pelajaran */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nama Mata Pelajaran <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="misal: Informatika, Matematika, Bahasa Indonesia"
                  value={formData.subject}
                  onChange={(e) => setFormData((prev) => ({ ...prev, subject: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Ruang / Lab (Opsional) */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Ruang Kelas / Laboratorium (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="misal: Lab Komputer 1, R. 7A, Ruang Teori"
                  value={formData.room}
                  onChange={(e) => setFormData((prev) => ({ ...prev, room: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Catatan Tambahan (Opsional) */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Catatan / Keterangan (Opsional)
                </label>
                <textarea
                  rows={2}
                  placeholder="misal: Mengajar di lab multimedia, bawa modul pegangan..."
                  value={formData.notes}
                  onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              {/* Buttons */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all shadow-lg shadow-blue-600/25 cursor-pointer"
                >
                  {editingSchedule ? 'Simpan Perubahan' : 'Tambah Jadwal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CETAK / PDF JADWAL MENGAJAR GURU */}
      {isPrintPreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-4xl bg-white text-slate-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Action Bar (Not Printed) */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-blue-400" />
                <h3 className="text-sm font-bold">Pratinjau Cetak Jadwal Mengajar Guru Mandiri</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak / Simpan PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPrintPreviewOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Document Paper */}
            <div className="p-8 sm:p-12 overflow-y-auto font-serif space-y-6">
              {/* Kop Surat if uploaded */}
              {profile.kopSuratUrl ? (
                <div className="w-full border-b-2 border-black pb-3 mb-6">
                  <img
                    src={profile.kopSuratUrl}
                    alt="Kop Surat Resmi"
                    className="w-full max-h-36 object-contain mx-auto"
                  />
                </div>
              ) : (
                <div className="border-b-2 border-black pb-4 text-center">
                  <h2 className="text-xl font-bold uppercase tracking-wider">
                    {profile.schoolName || 'PEMERINTAH DAERAH DINAS PENDIDIKAN'}
                  </h2>
                  <p className="text-xs text-slate-600 mt-1">
                    {profile.schoolAddress || 'Alamat Sekolah'} • {profile.districtCity || 'Kabupaten/Kota'}
                  </p>
                </div>
              )}

              {/* Title */}
              <div className="text-center space-y-1">
                <h1 className="text-base sm:text-lg font-bold uppercase underline tracking-wide">
                  JADWAL MENGAJAR GURU MANDIRI
                </h1>
                <p className="text-xs text-slate-700">
                  Tahun Ajaran {profile.academicYear || '2025/2026'} - Semester {profile.semester || 'Ganjil'}
                </p>
              </div>

              {/* Teacher Info Table */}
              <div className="text-xs space-y-1 max-w-md">
                <div className="grid grid-cols-3">
                  <span className="font-semibold text-slate-700">Nama Guru</span>
                  <span className="col-span-2">: {profile.teacherName || '-'}</span>
                </div>
                <div className="grid grid-cols-3">
                  <span className="font-semibold text-slate-700">NIP / NUPTK</span>
                  <span className="col-span-2">: {profile.teacherNip || '-'}</span>
                </div>
                <div className="grid grid-cols-3">
                  <span className="font-semibold text-slate-700">Mata Pelajaran</span>
                  <span className="col-span-2">: {profile.subject || '-'}</span>
                </div>
                <div className="grid grid-cols-3">
                  <span className="font-semibold text-slate-700">Total Beban Tatap Muka</span>
                  <span className="col-span-2 font-bold">: {totalWeeklyJP} JP / Minggu</span>
                </div>
              </div>

              {/* Schedule Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse border border-slate-900">
                  <thead className="bg-slate-100 font-bold text-slate-900 text-center">
                    <tr>
                      <th className="border border-slate-900 px-2 py-2 w-10">No</th>
                      <th className="border border-slate-900 px-3 py-2 w-24">Hari</th>
                      <th className="border border-slate-900 px-3 py-2 w-32">Jam Ke / Waktu</th>
                      <th className="border border-slate-900 px-3 py-2 w-24">Kelas</th>
                      <th className="border border-slate-900 px-3 py-2">Mata Pelajaran</th>
                      <th className="border border-slate-900 px-2 py-2 w-16">JP</th>
                      <th className="border border-slate-900 px-3 py-2 w-28">Ruang</th>
                      <th className="border border-slate-900 px-3 py-2">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schedules.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="border border-slate-900 p-4 text-center italic text-slate-500">
                          Belum ada data jadwal mengajar.
                        </td>
                      </tr>
                    ) : (
                      schedules
                        .sort((a, b) => {
                          const dayOrder = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
                          const dayDiff = dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);
                          if (dayDiff !== 0) return dayDiff;
                          return (a.timeStart || '').localeCompare(b.timeStart || '');
                        })
                        .map((item, index) => (
                          <tr key={item.id}>
                            <td className="border border-slate-900 px-2 py-1.5 text-center">{index + 1}</td>
                            <td className="border border-slate-900 px-3 py-1.5 font-semibold">{item.day}</td>
                            <td className="border border-slate-900 px-3 py-1.5 text-center">
                              Jam ke-{item.jamKe}
                              {item.timeStart && item.timeEnd && (
                                <span className="block text-[10px] text-slate-600">
                                  ({item.timeStart} - {item.timeEnd})
                                </span>
                              )}
                            </td>
                            <td className="border border-slate-900 px-3 py-1.5 text-center font-bold">
                              {item.className}
                            </td>
                            <td className="border border-slate-900 px-3 py-1.5">{item.subject}</td>
                            <td className="border border-slate-900 px-2 py-1.5 text-center font-semibold">
                              {item.totalHours || 2}
                            </td>
                            <td className="border border-slate-900 px-3 py-1.5 text-center">{item.room || '-'}</td>
                            <td className="border border-slate-900 px-3 py-1.5 text-slate-600">{item.notes || '-'}</td>
                          </tr>
                        ))
                    )}
                  </tbody>
                  <tfoot className="bg-slate-50 font-bold">
                    <tr>
                      <td colSpan={5} className="border border-slate-900 px-3 py-2 text-right">
                        TOTAL BEBAN MENGAJAR (JP / MINGGU) :
                      </td>
                      <td className="border border-slate-900 px-2 py-2 text-center text-blue-900">
                        {totalWeeklyJP} JP
                      </td>
                      <td colSpan={2} className="border border-slate-900 px-3 py-2"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Signatures */}
              <div className="pt-8 grid grid-cols-2 text-xs text-center">
                <div className="space-y-16">
                  <p>
                    Mengetahui,
                    <br />
                    Kepala Sekolah
                  </p>
                  <div>
                    <p className="font-bold underline">{profile.headmasterName || '(................................................)'}</p>
                    <p className="text-slate-600">NIP. {profile.headmasterNip || '....................................'}</p>
                  </div>
                </div>

                <div className="space-y-16">
                  <p>
                    {profile.districtCity ? `${profile.districtCity}, ` : ''}
                    {new Date().toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                    <br />
                    Guru Mata Pelajaran
                  </p>
                  <div>
                    <p className="font-bold underline">{profile.teacherName || '(................................................)'}</p>
                    <p className="text-slate-600">NIP. {profile.teacherNip || '....................................'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
