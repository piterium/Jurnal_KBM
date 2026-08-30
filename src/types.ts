export type AttendanceStatus = 'H' | 'S' | 'I' | 'A'; // Hadir, Sakit, Izin, Alpa

export type AssessmentType =
  | 'FORMATIF_TUGAS'
  | 'FORMATIF_KUIS'
  | 'FORMATIF_PRAKTEK'
  | 'SUMATIF_UH'
  | 'SUMATIF_UH1'
  | 'SUMATIF_UH2'
  | 'SUMATIF_UH3'
  | 'SUMATIF_UH4'
  | 'SUMATIF_UH5'
  | 'SUMATIF_STS'
  | 'SUMATIF_SAS'
  | 'LAINNYA';

export interface Student {
  id: string;
  attendanceNo?: number | string; // Nomor Absen / Presensi
  nisn: string;
  nis?: string;
  name: string;
  gender: 'L' | 'P';
  classId: string;
  active: boolean;
}

export interface ClassRoom {
  id: string;
  name: string; // e.g. "VII-A", "VIII-B", "X-IPA 1"
  gradeLevel: string; // e.g. "VII", "VIII", "IX", "X", "XI", "XII"
  academicYear: string; // e.g. "2025/2026"
  subject: string; // e.g. "Informatika", "Matematika", "Bahasa Indonesia"
  kkm: number; // e.g. 75
}

export interface TeachingJournal {
  id: string;
  date: string; // YYYY-MM-DD
  classId: string;
  subject: string;
  meetingNumber: number; // Pertemuan ke-
  jamKe: string; // Jam ke- misal "1, 2", "1 - 3", "3, 4, 5"
  timeStart?: string; // Optional (legacy)
  timeEnd?: string; // Optional (legacy)
  hoursCount: number; // Jumlah jam pelajaran (JP), e.g. 2
  learningObjective?: string; // Optional (legacy)
  topic: string; // Materi Pokok / Bahasan
  activities?: string; // Optional (legacy)
  assessmentNotes?: string; // Optional (legacy)
  reflection?: string; // Optional (legacy)
  keterangan?: string; // Keterangan / Catatan KBM (Ket.)
  notes?: string; // Catatan tambahan
  attendanceSessionId?: string; // ID sesi absensi terkait
  studentsPresentCount?: number;
  studentsTotalCount?: number;
  status: 'Terlaksana' | 'Tertunda' | 'Diganti';
}

export interface AttendanceRecord {
  id: string;
  date: string; // YYYY-MM-DD
  classId: string;
  journalId?: string;
  records: Record<string, {
    status: AttendanceStatus;
    note?: string;
  }>; // studentId -> { status, note }
}

export interface AssessmentItem {
  id: string;
  title: string; // e.g. "Tugas 1: Algoritma", "UH 1: Pemrograman Dasar"
  type: AssessmentType;
  classId: string;
  subject: string;
  date: string; // YYYY-MM-DD
  maxScore: number; // default 100
  kkm: number; // default 75
  weight: number; // bobot nilai
  scores: Record<string, number | null>; // studentId -> score
}

export interface SchoolProfile {
  schoolName: string;
  npsn: string;
  logoUrl?: string; // Logo sekolah (Base64 data URL atau URL gambar)
  schoolAddress: string;
  districtCity: string;
  province: string;
  postalCode?: string;
  headmasterName: string;
  headmasterNip: string;
  teacherName: string;
  teacherNip: string;
  subject: string;
  academicYear: string;
  semester: 'Ganjil' | 'Genap';
  letterHeaderOffice: string; // e.g. "DINAS PENDIDIKAN DAN KEBUDAYAAN KABUPATEN..."
}

export interface Teacher {
  id: string;
  name: string;
  nip: string;
  subject: string; // Mapel yang diampu
  classesTaught: string[]; // e.g. ["Kelas VII-A", "Kelas VII-B", "Kelas VIII-A"]
  phone?: string;
  email?: string;
  employmentStatus?: 'PNS' | 'PPPK' | 'GTT' | 'Guru Tetap Yayasan' | 'Honor Sekolah';
  gender?: 'L' | 'P';
  education?: string; // e.g. "S1 Pendidikan Informatika"
  notes?: string;
  isHeadmaster?: boolean;
}

export interface AppData {
  profile: SchoolProfile;
  classes: ClassRoom[];
  students: Student[];
  teachers: Teacher[];
  journals: TeachingJournal[];
  attendances: AttendanceRecord[];
  assessments: AssessmentItem[];
}
