import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  AppData,
  TeachingJournal,
  AttendanceRecord,
  AssessmentItem,
  SchoolProfile,
  ClassRoom,
  Student,
  Teacher,
} from './types';
import { loadAppData, saveAppData, getInitialAppData, getEmptyAppData } from './utils/storage';
import { generateMonthlyReportPdf } from './utils/pdfGenerator';
import { Sidebar } from './components/Sidebar';
import { ThemeToggle } from './components/ThemeToggle';
import { ActiveDatabaseBadge } from './components/ActiveDatabaseBadge';
import { FirebaseLiveModal } from './components/FirebaseLiveModal';
import { DashboardView } from './components/DashboardView';
import { JournalView } from './components/JournalView';
import { AttendanceView } from './components/AttendanceView';
import { GradebookView } from './components/GradebookView';
import { StudentListView } from './components/StudentListView';
import { TeacherListView } from './components/TeacherListView';
import { MonthlyReportView } from './components/MonthlyReportView';
import { SettingsView } from './components/SettingsView';
import { JournalModal } from './components/modals/JournalModal';
import { AssessmentModal } from './components/modals/AssessmentModal';
import { StudentModal } from './components/modals/StudentModal';
import { ClassModal } from './components/modals/ClassModal';
import { TeacherModal } from './components/modals/TeacherModal';
import { SaveSuccessModal } from './components/SaveSuccessModal';
import {
  DEFAULT_SCHOOL_ID,
  loadSchoolAppDataFromFirestore,
  saveSchoolAppDataToFirestore,
  subscribeToSchoolRealtime,
  saveJournalToFirestore,
  deleteJournalFromFirestore,
  saveAttendanceToFirestore,
  deleteAttendanceFromFirestore,
  saveAssessmentToFirestore,
  deleteAssessmentFromFirestore,
} from './firebase/firestoreService';
import { auth, signInAnonymously } from './firebase/firebase';

export default function App() {
  const [data, setData] = useState<AppData>(() => loadAppData());
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Firebase Live State & Workspace management
  const [schoolId, setSchoolId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlSchool = params.get('school');
      if (urlSchool && urlSchool.trim()) return urlSchool.trim();
      const savedSchool = localStorage.getItem('school_workspace_id');
      if (savedSchool && savedSchool.trim()) return savedSchool.trim();
    }
    return DEFAULT_SCHOOL_ID;
  });

  const [isFirebaseLiveModalOpen, setIsFirebaseLiveModalOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline' | 'error'>('synced');
  const isInitialCloudLoadRef = useRef(false);
  const isInternalUpdateRef = useRef(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Success and Delete Notification state (as requested in user specifications)
  const [notification, setNotification] = useState<{
    isOpen: boolean;
    type: 'success' | 'delete' | 'info' | 'warning';
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: 'success',
    title: 'Berhasil Disimpan!',
    message: 'Data berhasil disimpan!',
  });

  const triggerSaveNotification = useCallback((title: string, message: string) => {
    setNotification({
      isOpen: true,
      type: 'success',
      title: title || 'Berhasil Disimpan!',
      message,
    });
  }, []);

  const triggerDeleteNotification = useCallback((title: string, message: string) => {
    setNotification({
      isOpen: true,
      type: 'delete',
      title: title || 'Berhasil Dihapus!',
      message,
    });
  }, []);

  // Modal states
  const [isJournalModalOpen, setIsJournalModalOpen] = useState(false);
  const [editingJournal, setEditingJournal] = useState<TeachingJournal | null>(null);

  const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState<AssessmentItem | null>(null);

  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);

  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassRoom | null>(null);

  // Contextual params
  const [selectedGradeClassId, setSelectedGradeClassId] = useState<string>(
    data.classes[0]?.id || ''
  );
  const [selectedStudentClassId, setSelectedStudentClassId] = useState<string>('ALL');
  const [attendanceContext, setAttendanceContext] = useState<{
    classId?: string;
    date?: string;
  }>({});

  // Ensure Firebase Auth is signed in anonymously so security rules pass seamlessly across devices
  useEffect(() => {
    const ensureAuth = async () => {
      try {
        if (!auth.currentUser) {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.warn('Firebase anonymous auth auto-init:', err);
      }
    };
    ensureAuth();
  }, []);

  // Initial cloud fetch & Realtime subscriptions across all devices and networks
  useEffect(() => {
    let isMounted = true;

    // 1. Initial full fetch from Firestore
    const initCloudData = async () => {
      setSyncStatus('syncing');
      try {
        const cloudData = await loadSchoolAppDataFromFirestore(schoolId);
        if (cloudData && isMounted) {
          isInternalUpdateRef.current = true;
          setData((prev) => ({
            ...prev,
            ...cloudData,
            profile: cloudData.profile || prev.profile,
            classes: cloudData.classes?.length ? cloudData.classes : prev.classes,
            students: cloudData.students?.length ? cloudData.students : prev.students,
            teachers: cloudData.teachers?.length ? cloudData.teachers : prev.teachers,
            journals: cloudData.journals || prev.journals,
            attendances: cloudData.attendances || prev.attendances,
            assessments: cloudData.assessments || prev.assessments,
          }));
          saveAppData({
            ...data,
            ...cloudData,
          });
          setSyncStatus('synced');
        } else if (isMounted) {
          // If cloud is brand new, seed it with current data
          await saveSchoolAppDataToFirestore(schoolId, data);
          setSyncStatus('synced');
        }
      } catch (error) {
        console.error('Error initializing Firebase cloud data:', error);
        if (isMounted) setSyncStatus('synced');
      } finally {
        isInitialCloudLoadRef.current = true;
      }
    };

    initCloudData();

    // 2. Realtime listener for live multi-device syncing
    const unsubscribe = subscribeToSchoolRealtime(schoolId, {
      onJournalsUpdate: (journals) => {
        if (!isMounted) return;
        isInternalUpdateRef.current = true;
        setData((prev) => ({ ...prev, journals }));
      },
      onAttendancesUpdate: (attendances) => {
        if (!isMounted) return;
        isInternalUpdateRef.current = true;
        setData((prev) => ({ ...prev, attendances }));
      },
      onAssessmentsUpdate: (assessments) => {
        if (!isMounted) return;
        isInternalUpdateRef.current = true;
        setData((prev) => ({ ...prev, assessments }));
      },
      onClassesUpdate: (classes) => {
        if (!isMounted || !classes.length) return;
        isInternalUpdateRef.current = true;
        setData((prev) => ({ ...prev, classes }));
      },
      onStudentsUpdate: (students) => {
        if (!isMounted || !students.length) return;
        isInternalUpdateRef.current = true;
        setData((prev) => ({ ...prev, students }));
      },
      onTeachersUpdate: (teachers) => {
        if (!isMounted || !teachers.length) return;
        isInternalUpdateRef.current = true;
        setData((prev) => ({ ...prev, teachers }));
      },
      onProfileUpdate: (profile) => {
        if (!isMounted || !profile) return;
        isInternalUpdateRef.current = true;
        setData((prev) => ({ ...prev, profile }));
      },
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [schoolId]);

  // Auto-save data locally and to Firebase Cloud (debounced)
  useEffect(() => {
    saveAppData(data);

    if (isInternalUpdateRef.current) {
      isInternalUpdateRef.current = false;
      return;
    }

    if (!isInitialCloudLoadRef.current) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    setSyncStatus('syncing');
    debounceTimerRef.current = setTimeout(async () => {
      try {
        await saveSchoolAppDataToFirestore(schoolId, data);
        setSyncStatus('synced');
      } catch (err) {
        console.error('Debounce sync error to Firebase Firestore:', err);
        setSyncStatus('error');
      }
    }, 1200);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [data, schoolId]);

  // Manual Instant Cloud Sync
  const handleManualSync = async () => {
    setSyncStatus('syncing');
    try {
      await saveSchoolAppDataToFirestore(schoolId, data);
      setSyncStatus('synced');
      triggerSaveNotification(
        'Sinkronisasi Berhasil!',
        'Data Anda telah berhasil disinkronkan ke Firebase Cloud Firestore.'
      );
    } catch (err) {
      console.error('Manual sync error:', err);
      setSyncStatus('error');
    }
  };

  // Change School/Workspace ID handler
  const handleSchoolIdChange = (newSchoolId: string) => {
    const cleanId = newSchoolId.trim() || DEFAULT_SCHOOL_ID;
    setSchoolId(cleanId);
    if (typeof window !== 'undefined') {
      localStorage.setItem('school_workspace_id', cleanId);
    }
  };

  // Keep selectedGradeClassId valid if classes change
  useEffect(() => {
    if (!data.classes.some((c) => c.id === selectedGradeClassId) && data.classes.length > 0) {
      setSelectedGradeClassId(data.classes[0].id);
    }
  }, [data.classes, selectedGradeClassId]);

  // Quick 1-click Download PDF Handler
  const handleQuickDownloadPdf = () => {
    try {
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      const doc = generateMonthlyReportPdf(data, {
        month: currentMonth,
        year: currentYear,
        classId: 'ALL',
        reportType: 'FULL',
      });
      doc.save(`Laporan_Bulanan_Guru_${currentMonth}_${currentYear}.pdf`);
    } catch (err) {
      console.error(err);
      setActiveTab('report');
    }
  };


  // --- JOURNAL HANDLERS ---
  const handleSaveJournal = (journal: TeachingJournal, autoCreateAttendance: boolean) => {
    let updatedJournals = [...data.journals];
    const existingIndex = updatedJournals.findIndex((j) => j.id === journal.id);

    let updatedAttendances = [...data.attendances];

    // If new journal with auto attendance
    if (autoCreateAttendance && existingIndex === -1) {
      const classStudents = data.students.filter((s) => s.classId === journal.classId && s.active);
      const attId = `att-${Date.now()}`;
      const defaultRecords: Record<string, { status: 'H'; note?: string }> = {};
      classStudents.forEach((s) => {
        defaultRecords[s.id] = { status: 'H' };
      });

      const newAtt: AttendanceRecord = {
        id: attId,
        date: journal.date,
        classId: journal.classId,
        journalId: journal.id,
        records: defaultRecords,
      };

      updatedAttendances.push(newAtt);
      journal.attendanceSessionId = attId;
      journal.studentsPresentCount = classStudents.length;
      journal.studentsTotalCount = classStudents.length;
    }

    if (existingIndex >= 0) {
      updatedJournals[existingIndex] = journal;
    } else {
      updatedJournals.push(journal);
    }

    setData((prev) => ({
      ...prev,
      journals: updatedJournals,
      attendances: updatedAttendances,
    }));

    const cls = data.classes.find((c) => c.id === journal.classId);
    triggerSaveNotification(
      'Berhasil Disimpan!',
      `Jurnal mengajar kelas ${cls?.name || 'terpilih'} (Pertemuan ke-${journal.meetingNumber}) tersimpan!`
    );
  };

  const handleDeleteJournal = (journalId: string) => {
    const targetJournal = data.journals.find((j) => j.id === journalId);
    const cls = data.classes.find((c) => c.id === targetJournal?.classId);
    setData((prev) => ({
      ...prev,
      journals: prev.journals.filter((j) => j.id !== journalId),
      attendances: prev.attendances.filter((a) => a.journalId !== journalId),
    }));
    triggerDeleteNotification(
      'Berhasil Dihapus!',
      `Jurnal mengajar ${cls?.name ? `kelas ${cls.name}` : ''} (Pertemuan ke-${targetJournal?.meetingNumber || ''}) berhasil dihapus.`
    );
  };

  const handleOpenAttendanceForJournal = (classId: string, date: string) => {
    setAttendanceContext({ classId, date });
    setActiveTab('attendance');
  };

  // --- ATTENDANCE HANDLERS ---
  const handleSaveAttendance = (record: AttendanceRecord) => {
    let updated = [...data.attendances];
    const existingIndex = updated.findIndex((a) => a.id === record.id);
    if (existingIndex >= 0) {
      updated[existingIndex] = record;
    } else {
      updated.push(record);
    }

    // Sync journal present count if linked
    let updatedJournals = [...data.journals];
    if (record.journalId) {
      const jIdx = updatedJournals.findIndex((j) => j.id === record.journalId);
      if (jIdx >= 0) {
        let presentCount = 0;
        let totalCount = 0;
        Object.values(record.records).forEach((r) => {
          totalCount++;
          if (r.status === 'H') presentCount++;
        });
        updatedJournals[jIdx] = {
          ...updatedJournals[jIdx],
          studentsPresentCount: presentCount,
          studentsTotalCount: totalCount,
          attendanceSessionId: record.id,
        };
      }
    }

    setData((prev) => ({
      ...prev,
      attendances: updated,
      journals: updatedJournals,
    }));

    const cls = data.classes.find((c) => c.id === record.classId);
    const count = Object.keys(record.records || {}).length;
    triggerSaveNotification(
      'Berhasil Disimpan!',
      `Absensi kelas ${cls?.name || 'terpilih'} (${count} siswa) tersimpan!`
    );
  };

  // --- ASSESSMENT & GRADE HANDLERS ---
  const handleSaveAssessment = (assessment: AssessmentItem) => {
    let updated = [...data.assessments];
    const existingIndex = updated.findIndex((a) => a.id === assessment.id);
    if (existingIndex >= 0) {
      updated[existingIndex] = assessment;
    } else {
      updated.push(assessment);
    }
    setData((prev) => ({
      ...prev,
      assessments: updated,
    }));

    const cls = data.classes.find((c) => c.id === assessment.classId);
    triggerSaveNotification(
      'Berhasil Disimpan!',
      `Penilaian "${assessment.title}" (${cls?.name || ''}) tersimpan!`
    );
  };

  const handleDeleteAssessment = (assessmentId: string) => {
    const asm = data.assessments.find((a) => a.id === assessmentId);
    setData((prev) => ({
      ...prev,
      assessments: prev.assessments.filter((a) => a.id !== assessmentId),
    }));
    triggerDeleteNotification(
      'Berhasil Dihapus!',
      `Data penilaian "${asm?.title || ''}" berhasil dihapus.`
    );
  };

  const handleUpdateScore = (assessmentId: string, studentId: string, score: number | null) => {
    setData((prev) => ({
      ...prev,
      assessments: prev.assessments.map((asm) => {
        if (asm.id === assessmentId) {
          return {
            ...asm,
            scores: {
              ...asm.scores,
              [studentId]: score,
            },
          };
        }
        return asm;
      }),
    }));
  };

  // --- MASTER DATA HANDLERS ---
  const handleUpdateProfile = (profile: SchoolProfile) => {
    setData((prev) => ({ ...prev, profile }));
    triggerSaveNotification(
      'Berhasil Disimpan!',
      `Profil sekolah & konfigurasi guru tersimpan!`
    );
  };

  const handleSaveClass = (cls: ClassRoom) => {
    const updated = [...data.classes];
    const existingIndex = updated.findIndex((c) => c.id === cls.id);
    if (existingIndex >= 0) {
      updated[existingIndex] = cls;
    } else {
      updated.push(cls);
    }
    setData((prev) => ({ ...prev, classes: updated }));
    triggerSaveNotification(
      'Berhasil Disimpan!',
      `Data kelas ${cls.name} tersimpan!`
    );
  };

  const handleDeleteClass = (id: string) => {
    const cls = data.classes.find((c) => c.id === id);
    setData((prev) => ({
      ...prev,
      classes: prev.classes.filter((c) => c.id !== id),
      students: prev.students.filter((s) => s.classId !== id),
    }));
    triggerDeleteNotification(
      'Berhasil Dihapus!',
      `Data kelas ${cls?.name || ''} beserta siswanya berhasil dihapus.`
    );
  };

  const handleSaveStudent = (std: Student) => {
    const updated = [...data.students];
    const existingIndex = updated.findIndex((s) => s.id === std.id);
    if (existingIndex >= 0) {
      updated[existingIndex] = std;
    } else {
      updated.push(std);
    }
    setData((prev) => ({ ...prev, students: updated }));
    const cls = data.classes.find((c) => c.id === std.classId);
    triggerSaveNotification(
      'Berhasil Disimpan!',
      `Data siswa ${std.name} (${cls?.name || ''}) tersimpan!`
    );
  };

  const handleDeleteStudent = (id: string) => {
    const std = data.students.find((s) => s.id === id);
    setData((prev) => ({
      ...prev,
      students: prev.students.filter((s) => s.id !== id),
    }));
    triggerDeleteNotification(
      'Berhasil Dihapus!',
      `Data siswa ${std?.name || ''} berhasil dihapus.`
    );
  };

  // Bulk student import (directly from uploaded template CSV/file)
  const handleBatchImportStudents = (
    newStudents: Student[],
    newClasses: ClassRoom[] = [],
    successMessage?: string
  ) => {
    // Add any new classes that don't exist
    const currentClasses = [...data.classes];
    newClasses.forEach((nCls) => {
      if (!currentClasses.some((c) => c.id === nCls.id || c.name.toLowerCase() === nCls.name.toLowerCase())) {
        currentClasses.push(nCls);
      }
    });

    // Merge students
    const currentStudents = [...data.students];
    newStudents.forEach((newStd) => {
      const existingIdx = currentStudents.findIndex(
        (s) => s.id === newStd.id || (s.nisn && s.nisn !== '-' && s.nisn === newStd.nisn)
      );
      if (existingIdx >= 0) {
        currentStudents[existingIdx] = newStd;
      } else {
        currentStudents.push(newStd);
      }
    });

    setData((prev) => ({
      ...prev,
      classes: currentClasses,
      students: currentStudents,
    }));

    triggerSaveNotification(
      'Berhasil Disimpan!',
      successMessage || `Sebanyak ${newStudents.length} data siswa berhasil diimpor dan tersimpan!`
    );
  };

  // --- TEACHER HANDLERS ---
  const handleSaveTeacher = (teacherData: Omit<Teacher, 'id'>, teacherId?: string) => {
    const updated = [...(data.teachers || [])];
    if (teacherId) {
      const idx = updated.findIndex((t) => t.id === teacherId);
      if (idx >= 0) {
        updated[idx] = { ...teacherData, id: teacherId };
      }
    } else {
      const newTeacher: Teacher = {
        ...teacherData,
        id: `tch-${Date.now()}`,
      };
      updated.push(newTeacher);
    }

    setData((prev) => ({
      ...prev,
      teachers: updated,
    }));

    triggerSaveNotification(
      'Berhasil Disimpan!',
      `Data guru ${teacherData.name} tersimpan!`
    );
  };

  const handleDeleteTeacher = (teacherId: string) => {
    const tch = (data.teachers || []).find((t) => t.id === teacherId);
    setData((prev) => ({
      ...prev,
      teachers: (prev.teachers || []).filter((t) => t.id !== teacherId),
    }));
    triggerDeleteNotification(
      'Berhasil Dihapus!',
      `Data guru ${tch?.name || ''} berhasil dihapus.`
    );
  };

  const handleSetAsActiveProfileTeacher = (teacher: Teacher) => {
    setData((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        teacherName: teacher.name,
        teacherNip: teacher.nip || prev.profile.teacherNip,
        subject: teacher.subject || prev.profile.subject,
      },
    }));
    triggerSaveNotification(
      'Berhasil Disimpan!',
      `Guru aktif ${teacher.name} tersimpan!`
    );
  };

  const handleResetData = () => {
    const initial = getInitialAppData();
    setData(initial);
    saveAppData(initial);
    triggerSaveNotification(
      'Berhasil Direset!',
      'Data contoh berhasil dimuat ulang ke aplikasi!'
    );
  };

  const handleDeleteDatabase = () => {
    const empty = getEmptyAppData();
    setData(empty);
    saveAppData(empty);
    triggerDeleteNotification(
      'Database Dikosongkan!',
      'Semua data berhasil dibersihkan dari penyimpanan.'
    );
  };

  const handleImportData = (imported: AppData) => {
    setData(imported);
    saveAppData(imported);
    triggerSaveNotification(
      'Berhasil Disimpan!',
      'Berkas backup berhasil dipulihkan dan tersimpan!'
    );
  };

  return (
    <div className="min-h-screen bg-[#0B1120] text-[#E2E8F0] flex flex-col md:flex-row font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* Left Sidebar Menu */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        profile={data.profile}
        classesCount={data.classes.length}
        studentsCount={data.students.filter((s) => s.active).length}
        teachersCount={data.teachers?.length || 0}
        syncStatus={syncStatus}
        onManualSync={handleManualSync}
        onQuickDownloadPdf={handleQuickDownloadPdf}
        onOpenFirebaseLiveModal={() => setIsFirebaseLiveModalOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        {/* Top Header Bar with Status controls */}
        <header className="hidden md:flex items-center justify-between px-6 lg:px-8 py-3.5 bg-[#0F172A]/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-400">
              {data.profile.schoolName || 'Sistem Administrasi Guru'}
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs text-blue-400 font-medium">
              {data.profile.academicYear} ({data.profile.semester})
            </span>
          </div>

          <div className="flex items-center gap-3">
            <ActiveDatabaseBadge
              data={data}
              syncStatus={syncStatus}
              onManualSync={handleManualSync}
              onOpenFirebaseModal={() => setIsFirebaseLiveModalOpen(true)}
              onNavigateToSettings={() => setActiveTab('settings')}
              currentSchoolId={schoolId}
            />
            <ThemeToggle variant="pill" />
          </div>
        </header>

        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          {activeTab === 'dashboard' && (
            <DashboardView
              data={data}
              onNavigate={setActiveTab}
              onOpenNewJournalModal={() => {
                setEditingJournal(null);
                setIsJournalModalOpen(true);
              }}
              onOpenNewAttendance={(classId) => {
                if (classId) setAttendanceContext({ classId });
                setActiveTab('attendance');
              }}
              onOpenNewAssessmentModal={() => {
                setEditingAssessment(null);
                setIsAssessmentModalOpen(true);
              }}
              onQuickDownloadPdf={handleQuickDownloadPdf}
            />
          )}

          {activeTab === 'journal' && (
            <JournalView
              journals={data.journals}
              classes={data.classes}
              students={data.students}
              attendances={data.attendances}
              onAddJournal={() => {
                setEditingJournal(null);
                setIsJournalModalOpen(true);
              }}
              onEditJournal={(j) => {
                setEditingJournal(j);
                setIsJournalModalOpen(true);
              }}
              onDeleteJournal={handleDeleteJournal}
              onOpenAttendanceForJournal={handleOpenAttendanceForJournal}
            />
          )}

          {activeTab === 'attendance' && (
            <AttendanceView
              attendances={data.attendances}
              classes={data.classes}
              students={data.students}
              journals={data.journals}
              onSaveAttendance={handleSaveAttendance}
              initialClassId={attendanceContext.classId}
              initialDate={attendanceContext.date}
              appData={data}
            />
          )}

          {(activeTab === 'grades' || activeTab === 'gradebook') && (
            <GradebookView
              assessments={data.assessments}
              classes={data.classes}
              students={data.students}
              onAddAssessment={() => {
                setEditingAssessment(null);
                setIsAssessmentModalOpen(true);
              }}
              onEditAssessment={(asm) => {
                setEditingAssessment(asm);
                setIsAssessmentModalOpen(true);
              }}
              onDeleteAssessment={handleDeleteAssessment}
              onUpdateScore={handleUpdateScore}
              selectedClassId={selectedGradeClassId}
              onSelectClassId={setSelectedGradeClassId}
            />
          )}

          {activeTab === 'students' && (
            <StudentListView
              students={data.students}
              classes={data.classes}
              attendances={data.attendances}
              assessments={data.assessments}
              profile={data.profile}
              onSaveClass={handleSaveClass}
              selectedClassId={selectedStudentClassId}
              onSelectClassId={setSelectedStudentClassId}
              onSaveStudent={handleSaveStudent}
              onBatchImportStudents={handleBatchImportStudents}
              onAddStudent={() => {
                setEditingStudent(null);
                setIsStudentModalOpen(true);
              }}
              onEditStudent={(std) => {
                setEditingStudent(std);
                setIsStudentModalOpen(true);
              }}
              onDeleteStudent={handleDeleteStudent}
            />
          )}

          {activeTab === 'teachers' && (
            <TeacherListView
              teachers={data.teachers || []}
              classes={data.classes}
              profile={data.profile}
              onAddTeacher={() => {
                setEditingTeacher(null);
                setIsTeacherModalOpen(true);
              }}
              onEditTeacher={(tch) => {
                setEditingTeacher(tch);
                setIsTeacherModalOpen(true);
              }}
              onDeleteTeacher={handleDeleteTeacher}
              onSetAsActiveProfileTeacher={handleSetAsActiveProfileTeacher}
            />
          )}

          {activeTab === 'report' && <MonthlyReportView data={data} />}

          {activeTab === 'settings' && (
            <SettingsView
              data={data}
              onUpdateProfile={handleUpdateProfile}
              onAddClass={() => {
                setEditingClass(null);
                setIsClassModalOpen(true);
              }}
              onEditClass={(cls) => {
                setEditingClass(cls);
                setIsClassModalOpen(true);
              }}
              onDeleteClass={handleDeleteClass}
              onAddStudent={() => {
                setEditingStudent(null);
                setIsStudentModalOpen(true);
              }}
              onEditStudent={(std) => {
                setEditingStudent(std);
                setIsStudentModalOpen(true);
              }}
              onDeleteStudent={handleDeleteStudent}
              onResetData={handleResetData}
              onDeleteDatabase={handleDeleteDatabase}
            />
          )}
        </main>
      </div>

      {/* MODALS */}
      <JournalModal
        isOpen={isJournalModalOpen}
        onClose={() => setIsJournalModalOpen(false)}
        onSave={handleSaveJournal}
        classes={data.classes}
        initialData={editingJournal}
        defaultSubject={data.profile.subject}
      />

      <AssessmentModal
        isOpen={isAssessmentModalOpen}
        onClose={() => setIsAssessmentModalOpen(false)}
        onSave={handleSaveAssessment}
        classes={data.classes}
        students={data.students}
        initialData={editingAssessment}
        selectedClassId={selectedGradeClassId}
      />

      <StudentModal
        isOpen={isStudentModalOpen}
        onClose={() => setIsStudentModalOpen(false)}
        onSave={handleSaveStudent}
        classes={data.classes}
        initialData={editingStudent}
        selectedClassId={
          selectedStudentClassId !== 'ALL'
            ? selectedStudentClassId
            : selectedGradeClassId || data.classes[0]?.id || ''
        }
      />

      <TeacherModal
        isOpen={isTeacherModalOpen}
        onClose={() => setIsTeacherModalOpen(false)}
        classes={data.classes}
        initialData={editingTeacher}
        onSave={handleSaveTeacher}
      />

      <ClassModal
        isOpen={isClassModalOpen}
        onClose={() => setIsClassModalOpen(false)}
        onSave={handleSaveClass}
        initialData={editingClass}
        defaultSubject={data.profile.subject}
        defaultAcademicYear={data.profile.academicYear}
      />

      {/* Success and Delete Notification Modal (matching user reference specification) */}
      <SaveSuccessModal
        isOpen={notification.isOpen}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        onClose={() => setNotification((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Firebase Live Cloud Status & Device Sync Modal */}
      <FirebaseLiveModal
        isOpen={isFirebaseLiveModalOpen}
        onClose={() => setIsFirebaseLiveModalOpen(false)}
        data={data}
        syncStatus={syncStatus}
        onManualSync={handleManualSync}
        currentSchoolId={schoolId}
        onSwitchSchoolId={handleSchoolIdChange}
      />
    </div>
  );
}
