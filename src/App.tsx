import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import { auth, onAuthStateChanged, signInAnonymously, type User } from './firebase/firebase';
import {
  loadUserAppDataFromFirestore,
  saveUserAppDataToFirestore,
  syncUserProfile,
} from './firebase/firestoreService';
import { Sidebar } from './components/Sidebar';
import { FirebaseAuthHeader } from './components/FirebaseAuthHeader';
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
import { UploadStudentsModal } from './components/modals/UploadStudentsModal';
import { TeacherModal } from './components/modals/TeacherModal';

export default function App() {
  const [data, setData] = useState<AppData>(() => loadAppData());
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Firebase Auth & Cloud Sync States
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline' | 'error'>('offline');
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialLoadRef = useRef(true);

  // Modal states
  const [isJournalModalOpen, setIsJournalModalOpen] = useState(false);
  const [editingJournal, setEditingJournal] = useState<TeachingJournal | null>(null);

  const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState<AssessmentItem | null>(null);

  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  const [isUploadStudentsModalOpen, setIsUploadStudentsModalOpen] = useState(false);
  const [uploadClassId, setUploadClassId] = useState<string>('');

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

  // Listen to Firebase Auth state (background auto-connection)
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (!auth.currentUser) {
          await signInAnonymously(auth);
        }
      } catch (e) {
        console.warn('Background Firebase auth notice:', e);
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);

      if (currentUser) {
        setSyncStatus('syncing');
        try {
          await syncUserProfile(currentUser);
          const cloudData = await loadUserAppDataFromFirestore(currentUser.uid);

          if (cloudData && (cloudData.classes.length > 0 || cloudData.students.length > 0 || cloudData.journals.length > 0)) {
            setData(cloudData);
            saveAppData(cloudData);
          } else {
            // First time or cloud empty: upload current local data to cloud
            await saveUserAppDataToFirestore(currentUser.uid, data);
          }
          setSyncStatus('synced');
        } catch (err) {
          console.error('Initial cloud sync error:', err);
          setSyncStatus('offline');
        }
      } else {
        setSyncStatus('offline');
      }
    });

    return () => unsubscribe();
  }, []);

  // Save to localStorage and auto-sync to Firebase Firestore when data changes
  useEffect(() => {
    saveAppData(data);

    if (!user) {
      setSyncStatus('offline');
      return;
    }

    // Skip cloud save on exact first render if needed
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      return;
    }

    setSyncStatus('syncing');
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = setTimeout(async () => {
      try {
        await saveUserAppDataToFirestore(user.uid, data);
        setSyncStatus('synced');
      } catch (err) {
        console.error('Error auto-syncing to Firestore:', err);
        setSyncStatus('error');
      }
    }, 1200);

    return () => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, [data, user]);

  // Manual sync function
  const handleManualSync = useCallback(async () => {
    if (!user) return;
    setSyncStatus('syncing');
    try {
      await saveUserAppDataToFirestore(user.uid, data);
      setSyncStatus('synced');
    } catch (err) {
      console.error('Manual sync error:', err);
      setSyncStatus('error');
    }
  }, [user, data]);

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
  };

  const handleDeleteJournal = (journalId: string) => {
    setData((prev) => ({
      ...prev,
      journals: prev.journals.filter((j) => j.id !== journalId),
      attendances: prev.attendances.filter((a) => a.journalId !== journalId),
    }));
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
  };

  const handleDeleteAssessment = (assessmentId: string) => {
    setData((prev) => ({
      ...prev,
      assessments: prev.assessments.filter((a) => a.id !== assessmentId),
    }));
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
  };

  const handleDeleteClass = (id: string) => {
    setData((prev) => ({
      ...prev,
      classes: prev.classes.filter((c) => c.id !== id),
    }));
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
  };

  const handleDeleteStudent = (id: string) => {
    setData((prev) => ({
      ...prev,
      students: prev.students.filter((s) => s.id !== id),
    }));
  };

  // Bulk student import per class
  const handleImportStudents = (
    targetClassId: string,
    newStudentsList: Omit<Student, 'id'>[],
    mode: 'append' | 'replace'
  ) => {
    const formattedWithIds: Student[] = newStudentsList.map((s, idx) => ({
      ...s,
      id: `std-${targetClassId}-${Date.now()}-${idx}`,
      classId: targetClassId,
      active: true,
    }));

    let updatedStudents: Student[] = [];
    if (mode === 'replace') {
      // Keep all students from other classes, replace target class
      updatedStudents = [
        ...data.students.filter((s) => s.classId !== targetClassId),
        ...formattedWithIds,
      ];
    } else {
      // Append to existing
      updatedStudents = [...data.students, ...formattedWithIds];
    }

    setData((prev) => ({
      ...prev,
      students: updatedStudents,
    }));
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
  };

  const handleDeleteTeacher = (teacherId: string) => {
    setData((prev) => ({
      ...prev,
      teachers: (prev.teachers || []).filter((t) => t.id !== teacherId),
    }));
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
  };

  const handleResetData = () => {
    const initial = getInitialAppData();
    setData(initial);
    saveAppData(initial);
  };

  const handleDeleteDatabase = () => {
    const empty = getEmptyAppData();
    setData(empty);
    saveAppData(empty);
  };

  const handleImportData = (imported: AppData) => {
    setData(imported);
    saveAppData(imported);
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

          <FirebaseAuthHeader
            syncStatus={syncStatus}
            onManualSync={handleManualSync}
          />
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
            />
          )}

          {activeTab === 'grades' && (
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
              selectedClassId={selectedStudentClassId}
              onSelectClassId={setSelectedStudentClassId}
              onAddStudent={() => {
                setEditingStudent(null);
                setIsStudentModalOpen(true);
              }}
              onEditStudent={(std) => {
                setEditingStudent(std);
                setIsStudentModalOpen(true);
              }}
              onDeleteStudent={handleDeleteStudent}
              onOpenUploadModal={(clsId) => {
                setUploadClassId(clsId || data.classes[0]?.id || '');
                setIsUploadStudentsModalOpen(true);
              }}
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
              onImportData={handleImportData}
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

      <UploadStudentsModal
        isOpen={isUploadStudentsModalOpen}
        onClose={() => setIsUploadStudentsModalOpen(false)}
        classes={data.classes}
        selectedClassId={uploadClassId}
        onImportStudents={handleImportStudents}
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
    </div>
  );
}
