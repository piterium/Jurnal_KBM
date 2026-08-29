import { AppData, Student, AttendanceRecord, AssessmentItem, TeachingJournal, Teacher } from '../types';
import { defaultProfile, defaultClasses, defaultStudents, defaultTeachers, defaultJournals, defaultAttendances, defaultAssessments } from './initialData';

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
  };
}

export function getEmptyAppData(): AppData {
  return {
    profile: {
      ...defaultProfile,
      schoolName: '',
      npsn: '',
      logoUrl: '',
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

export interface JournalAttendanceInfo {
  hasRecord: boolean;
  isNihil: boolean;
  hadir: number;
  sakit: number;
  izin: number;
  alpa: number;
  total: number;
  summaryText: string; // "Nihil" or e.g. "S: 1, I: 2, A: 1"
  badgeText: string;
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
    return {
      hasRecord: false,
      isNihil: total > 0 && hadir === total,
      hadir,
      sakit: 0,
      izin: 0,
      alpa: 0,
      total,
      summaryText: hadir === total && total > 0 ? 'Nihil' : '-',
      badgeText: 'Presensi Belum Diinput',
    };
  }

  let hadir = 0;
  let sakit = 0;
  let izin = 0;
  let alpa = 0;
  let total = 0;

  Object.values(linkedAtt.records).forEach((r) => {
    total++;
    if (r.status === 'H') hadir++;
    else if (r.status === 'S') sakit++;
    else if (r.status === 'I') izin++;
    else if (r.status === 'A') alpa++;
  });

  const isNihil = sakit === 0 && izin === 0 && alpa === 0;

  let summaryText = 'Nihil';
  if (!isNihil) {
    const parts: string[] = [];
    if (sakit > 0) parts.push(`S: ${sakit}`);
    if (izin > 0) parts.push(`I: ${izin}`);
    if (alpa > 0) parts.push(`A: ${alpa}`);
    summaryText = parts.length > 0 ? parts.join(', ') : 'Nihil';
  }

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
    badgeText,
  };
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
