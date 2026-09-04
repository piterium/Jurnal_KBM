import { AppData, Student, AttendanceRecord, AssessmentItem, TeachingJournal, Teacher, TeachingSchedule } from '../types';
import { defaultProfile, defaultClasses, defaultStudents, defaultTeachers, defaultJournals, defaultAttendances, defaultAssessments, defaultSchedules } from './initialData';

const STORAGE_KEY = 'jurnal_guru_app_data_v2';

export function getInitialAppData(): AppData {
  return {
    profile: defaultProfile,
    classes: defaultClasses,
    students: defaultStudents,
    teachers: defaultTeachers,
    journals: defaultJournals,
    attendances: defaultAttendances,
    assessments: defaultAssessments,
    schedules: defaultSchedules,
  };
}

export function getEmptyAppData(): AppData {
  return {
    profile: {
      ...defaultProfile,
      schoolName: '',
      npsn: '',
      logoUrl: '',
      kopSuratUrl: '',
      schoolAddress: '',
      districtCity: '',
      province: '',
      postalCode: '',
      headmasterName: '',
      headmasterNip: '',
      teacherName: '',
      teacherNip: '',
      subject: '',
      academicYear: '2025/2026',
      semester: 'Ganjil',
      letterHeaderOffice: '',
    },
    classes: [],
    students: [],
    teachers: [],
    journals: [],
    attendances: [],
    assessments: [],
    schedules: [],
  };
}

export function loadAppData(): AppData {
  try {
    // Clear legacy dummy cache if present
    if (localStorage.getItem('jurnal_guru_app_data_v1')) {
      localStorage.removeItem('jurnal_guru_app_data_v1');
    }

    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = getEmptyAppData();
      saveAppData(initial);
      return initial;
    }
    const parsed = JSON.parse(raw) as AppData;

    // If parsed data contains sample identifiers from old model, clean it
    const hasSampleIds = parsed.classes?.some(c => c.id === 'cls-7a' || c.id === 'cls-7b') ||
      parsed.teachers?.some(t => t.id === 'tch-01');

    if (hasSampleIds) {
      const clean = getEmptyAppData();
      saveAppData(clean);
      return clean;
    }

    return {
      profile: { ...defaultProfile, ...(parsed.profile || {}) },
      classes: parsed.classes || [],
      students: parsed.students || [],
      teachers: parsed.teachers || [],
      journals: parsed.journals || [],
      attendances: parsed.attendances || [],
      assessments: parsed.assessments || [],
      schedules: parsed.schedules || [],
    };
  } catch (err) {
    console.error('Error loading app data from localStorage', err);
    return getEmptyAppData();
  }
}

export function saveAppData(data: AppData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Error saving app data to localStorage', err);
  }
}

export function exportBackup(data: AppData): void {
  const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', jsonString);
  const dateStr = new Date().toISOString().split('T')[0];
  downloadAnchor.setAttribute('download', `backup_jurnal_mengajar_${dateStr}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export interface AbsentStudentDetail {
  studentId: string;
  name: string;
  attendanceNo: string | number;
  status: 'S' | 'I' | 'A';
  note?: string;
}

export interface JournalAttendanceInfo {
  hasRecord: boolean;
  isNihil: boolean;
  hadir: number;
  sakit: number;
  izin: number;
  alpa: number;
  total: number;
  summaryText: string; // e.g. "Nihil" or "S: 1 (No. 4), I: 2 (No. 7, 12)"
  pdfSummaryText: string; // e.g. "Nihil" or "S: 1 (No. 4)\nI: 2 (No. 7, 12)"
  badgeText: string;
  sakitDetails: AbsentStudentDetail[];
  izinDetails: AbsentStudentDetail[];
  alpaDetails: AbsentStudentDetail[];
}

export function getJournalAttendanceInfo(
  journal: TeachingJournal,
  attendances: AttendanceRecord[],
  students?: Student[]
): JournalAttendanceInfo {
  const linkedAtt = attendances.find(
    (a) => a.id === journal.attendanceSessionId || (a.classId === journal.classId && a.date === journal.date)
  );

  if (!linkedAtt) {
    const total = journal.studentsTotalCount || (students ? students.filter(s => s.classId === journal.classId && s.active).length : 0);
    const hadir = journal.studentsPresentCount !== undefined ? journal.studentsPresentCount : total;
    const isNihil = total > 0 && hadir === total;
    return {
      hasRecord: false,
      isNihil,
      hadir,
      sakit: 0,
      izin: 0,
      alpa: 0,
      total,
      summaryText: isNihil ? 'Nihil' : '-',
      pdfSummaryText: isNihil ? 'Nihil' : '-',
      badgeText: 'Presensi Belum Diinput',
      sakitDetails: [],
      izinDetails: [],
      alpaDetails: [],
    };
  }

  // Pre-calculate student roster mapping with roll numbers
  const classStudents = (students || [])
    .filter((s) => s.classId === journal.classId && s.active)
    .sort((a, b) => {
      const noA = (a.attendanceNo !== undefined && a.attendanceNo !== null && a.attendanceNo !== '') ? Number(a.attendanceNo) : 999;
      const noB = (b.attendanceNo !== undefined && b.attendanceNo !== null && b.attendanceNo !== '') ? Number(b.attendanceNo) : 999;
      if (noA !== noB) return noA - noB;
      return a.name.localeCompare(b.name);
    });

  const studentMap = new Map<string, { name: string; rollNo: string | number }>();
  classStudents.forEach((st, idx) => {
    const rollNo = (st.attendanceNo !== undefined && st.attendanceNo !== null && st.attendanceNo !== '')
      ? st.attendanceNo
      : (idx + 1);
    studentMap.set(st.id, { name: st.name, rollNo });
  });

  const getStudentInfo = (sId: string) => {
    if (studentMap.has(sId)) return studentMap.get(sId)!;
    const fallback = students?.find(s => s.id === sId);
    if (fallback) {
      return {
        name: fallback.name,
        rollNo: (fallback.attendanceNo !== undefined && fallback.attendanceNo !== null && fallback.attendanceNo !== '') ? fallback.attendanceNo : '-',
      };
    }
    return { name: 'Siswa', rollNo: '-' };
  };

  let hadir = 0;
  let sakit = 0;
  let izin = 0;
  let alpa = 0;
  let total = 0;

  const sakitDetails: AbsentStudentDetail[] = [];
  const izinDetails: AbsentStudentDetail[] = [];
  const alpaDetails: AbsentStudentDetail[] = [];

  Object.entries(linkedAtt.records).forEach(([studentId, r]) => {
    total++;
    const sInfo = getStudentInfo(studentId);

    if (r.status === 'H') {
      hadir++;
    } else if (r.status === 'S') {
      sakit++;
      sakitDetails.push({
        studentId,
        name: sInfo.name,
        attendanceNo: sInfo.rollNo,
        status: 'S',
        note: r.note,
      });
    } else if (r.status === 'I') {
      izin++;
      izinDetails.push({
        studentId,
        name: sInfo.name,
        attendanceNo: sInfo.rollNo,
        status: 'I',
        note: r.note,
      });
    } else if (r.status === 'A') {
      alpa++;
      alpaDetails.push({
        studentId,
        name: sInfo.name,
        attendanceNo: sInfo.rollNo,
        status: 'A',
        note: r.note,
      });
    }
  });

  // Sort absent details by roll number
  const sortByRoll = (a: AbsentStudentDetail, b: AbsentStudentDetail) => {
    const numA = Number(a.attendanceNo);
    const numB = Number(b.attendanceNo);
    if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
    return String(a.attendanceNo).localeCompare(String(b.attendanceNo));
  };

  sakitDetails.sort(sortByRoll);
  izinDetails.sort(sortByRoll);
  alpaDetails.sort(sortByRoll);

  const isNihil = sakit === 0 && izin === 0 && alpa === 0;

  const formatGroup = (prefix: 'S' | 'I' | 'A', list: AbsentStudentDetail[]) => {
    if (list.length === 0) return '';
    const rollNos = list.map((item) => item.attendanceNo).join(', ');
    return `${prefix}: ${list.length} (No. ${rollNos})`;
  };

  const parts: string[] = [];
  if (sakitDetails.length > 0) parts.push(formatGroup('S', sakitDetails));
  if (izinDetails.length > 0) parts.push(formatGroup('I', izinDetails));
  if (alpaDetails.length > 0) parts.push(formatGroup('A', alpaDetails));

  const summaryText = isNihil ? 'Nihil' : (parts.length > 0 ? parts.join(', ') : 'Nihil');
  const pdfSummaryText = isNihil ? 'Nihil' : (parts.length > 0 ? parts.join('\n') : 'Nihil');

  const badgeText = isNihil
    ? `Presensi: Nihil (Hadir Semua ${total} Siswa)`
    : `Ketidakhadiran: ${summaryText} (Hadir: ${hadir}/${total})`;

  return {
    hasRecord: true,
    isNihil,
    hadir,
    sakit,
    izin,
    alpa,
    total,
    summaryText,
    pdfSummaryText,
    badgeText,
    sakitDetails,
    izinDetails,
    alpaDetails,
  };
}

export function sortStudentsByAttendanceNo(students: Student[]): Student[] {
  return [...students].sort((a, b) => {
    const parseNo = (val?: number | string | null): number | null => {
      if (val === undefined || val === null) return null;
      const str = String(val).trim();
      if (!str) return null;
      const num = Number(str);
      return !isNaN(num) ? num : null;
    };

    const numA = parseNo(a.attendanceNo);
    const numB = parseNo(b.attendanceNo);

    // If both have valid numeric attendance numbers
    if (numA !== null && numB !== null) {
      if (numA !== numB) return numA - numB;
    } else if (numA !== null) {
      return -1; // students with attendance number come first
    } else if (numB !== null) {
      return 1; // students without attendance number come after
    } else if (a.attendanceNo && b.attendanceNo) {
      const cmp = String(a.attendanceNo).localeCompare(String(b.attendanceNo), undefined, { numeric: true });
      if (cmp !== 0) return cmp;
    }

    // Fallback: alphabetical by student name (A-Z)
    return (a.name || '').localeCompare(b.name || '', 'id', { sensitivity: 'base' });
  });
}

export function calculateStudentAttendanceSummary(
  studentId: string,
  attendances: AttendanceRecord[],
  month?: number, // 1-12
  year?: number
) {
  let filtered = attendances;
  if (month && year) {
    filtered = attendances.filter(att => {
      const d = new Date(att.date);
      return (d.getMonth() + 1) === month && d.getFullYear() === year;
    });
  }

  let H = 0;
  let S = 0;
  let I = 0;
  let A = 0;
  let totalSessions = 0;

  filtered.forEach(att => {
    const rec = att.records[studentId];
    if (rec) {
      totalSessions++;
      if (rec.status === 'H') H++;
      else if (rec.status === 'S') S++;
      else if (rec.status === 'I') I++;
      else if (rec.status === 'A') A++;
    }
  });

  const percent = totalSessions > 0 ? Math.round((H / totalSessions) * 100) : 100;

  return { H, S, I, A, totalSessions, percent };
}

export function calculateStudentFinalGrade(
  studentId: string,
  assessments: AssessmentItem[],
  classKkm: number = 75
) {
  if (assessments.length === 0) {
    return {
      averageScore: 0,
      weightedScore: 0,
      totalAssessments: 0,
      completedAssessments: 0,
      predicate: 'D',
      isPassed: false,
      scoresMap: {} as Record<string, number | null>,
    };
  }

  let totalWeightedScore = 0;
  let totalWeight = 0;
  let completedCount = 0;
  const scoresMap: Record<string, number | null> = {};

  assessments.forEach(asm => {
    const score = asm.scores[studentId];
    scoresMap[asm.id] = score !== undefined ? score : null;
    if (score !== undefined && score !== null) {
      const weight = asm.weight || 1;
      totalWeightedScore += score * weight;
      totalWeight += weight;
      completedCount++;
    }
  });

  const finalScore = totalWeight > 0 ? Math.round(totalWeightedScore / totalWeight) : 0;

  let predicate: 'A' | 'B' | 'C' | 'D' = 'D';
  if (finalScore >= 90) predicate = 'A';
  else if (finalScore >= 80) predicate = 'B';
  else if (finalScore >= classKkm) predicate = 'C';
  else predicate = 'D';

  const isPassed = finalScore >= classKkm;

  return {
    averageScore: finalScore,
    weightedScore: finalScore,
    totalAssessments: assessments.length,
    completedAssessments: completedCount,
    predicate,
    isPassed,
    scoresMap,
  };
}

export const MONTH_NAMES_ID = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

export function formatDateIndonesian(dateString: string): string {
  if (!dateString) return '-';
  const parts = dateString.split('-');
  if (parts.length !== 3) return dateString;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  const dateObj = new Date(year, month, day);
  const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const dayName = dayNames[dateObj.getDay()];

  return `${dayName}, ${day} ${MONTH_NAMES_ID[month]} ${year}`;
}

export function formatShortDateIndonesian(dateString: string): string {
  if (!dateString) return '-';
  const parts = dateString.split('-');
  if (parts.length !== 3) return dateString;
  const year = parts[0];
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  return `${day} ${MONTH_NAMES_ID[month]} ${year}`;
}
