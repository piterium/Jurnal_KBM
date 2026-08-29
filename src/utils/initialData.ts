import { ClassRoom, Student, Teacher, TeachingJournal, AttendanceRecord, AssessmentItem, SchoolProfile } from '../types';

export const defaultTeachers: Teacher[] = [];

export const defaultProfile: SchoolProfile = {
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
};

export const defaultClasses: ClassRoom[] = [];

export const defaultStudents: Student[] = [];

export const defaultJournals: TeachingJournal[] = [];

export const defaultAttendances: AttendanceRecord[] = [];

export const defaultAssessments: AssessmentItem[] = [];
