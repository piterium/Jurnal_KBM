import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  writeBatch,
  onSnapshot,
  serverTimestamp,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  AppData,
  TeachingJournal,
  AttendanceRecord,
  AssessmentItem,
  ClassRoom,
  Student,
  Teacher,
  SchoolProfile,
} from '../types';
import firebaseConfig from '../../firebase-applet-config.json';

export const DEFAULT_SCHOOL_ID = 'main';

// Helper to sanitize Firestore object (remove undefined values)
export function cleanFirestoreObject<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  return JSON.parse(JSON.stringify(obj));
}

export function getFirebaseConfigSummary() {
  return {
    projectId: firebaseConfig.projectId,
    databaseId: firebaseConfig.firestoreDatabaseId,
    authDomain: firebaseConfig.authDomain,
  };
}

/**
 * Load full application data from Firestore for a specific school workspace
 */
export async function loadSchoolAppDataFromFirestore(
  schoolId: string = DEFAULT_SCHOOL_ID
): Promise<Partial<AppData> | null> {
  const cleanSchoolId = schoolId.trim() || DEFAULT_SCHOOL_ID;

  try {
    // 1. Fetch Profile
    const profileRef = doc(db, 'schools', cleanSchoolId, 'schoolData', 'profile');
    const profileSnap = await getDoc(profileRef);
    const profile: SchoolProfile | null = profileSnap.exists()
      ? (profileSnap.data() as SchoolProfile)
      : null;

    // 2. Fetch Classes
    const classesSnap = await getDocs(collection(db, 'schools', cleanSchoolId, 'classes'));
    const classes: ClassRoom[] = classesSnap.docs.map((d) => d.data() as ClassRoom);

    // 3. Fetch Students
    const studentsSnap = await getDocs(collection(db, 'schools', cleanSchoolId, 'students'));
    const students: Student[] = studentsSnap.docs.map((d) => d.data() as Student);

    // 4. Fetch Teachers
    const teachersSnap = await getDocs(collection(db, 'schools', cleanSchoolId, 'teachers'));
    const teachers: Teacher[] = teachersSnap.docs.map((d) => d.data() as Teacher);

    // 5. Fetch Journals
    const journalsSnap = await getDocs(collection(db, 'schools', cleanSchoolId, 'journals'));
    const journals: TeachingJournal[] = journalsSnap.docs.map((d) => d.data() as TeachingJournal);

    // 6. Fetch Attendances
    const attendancesSnap = await getDocs(collection(db, 'schools', cleanSchoolId, 'attendances'));
    const attendances: AttendanceRecord[] = attendancesSnap.docs.map((d) => d.data() as AttendanceRecord);

    // 7. Fetch Assessments
    const assessmentsSnap = await getDocs(collection(db, 'schools', cleanSchoolId, 'assessments'));
    const assessments: AssessmentItem[] = assessmentsSnap.docs.map((d) => d.data() as AssessmentItem);

    // Check if any cloud records exist
    const hasAnyData =
      profileSnap.exists() ||
      classes.length > 0 ||
      students.length > 0 ||
      teachers.length > 0 ||
      journals.length > 0 ||
      attendances.length > 0 ||
      assessments.length > 0;

    if (!hasAnyData) {
      return null;
    }

    return {
      ...(profile ? { profile } : {}),
      classes,
      students,
      teachers,
      journals,
      attendances,
      assessments,
    };
  } catch (error) {
    console.error('Error loading school data from Firestore:', error);
    throw error;
  }
}

/**
 * Save all school application data in batch to Firestore
 */
export async function saveSchoolAppDataToFirestore(
  schoolId: string = DEFAULT_SCHOOL_ID,
  data: AppData
): Promise<void> {
  const cleanSchoolId = schoolId.trim() || DEFAULT_SCHOOL_ID;

  try {
    const batch = writeBatch(db);

    // 1. School Root meta
    const schoolRootRef = doc(db, 'schools', cleanSchoolId);
    batch.set(
      schoolRootRef,
      {
        id: cleanSchoolId,
        schoolName: data.profile?.schoolName || 'Sekolah',
        lastUpdated: serverTimestamp(),
      },
      { merge: true }
    );

    // 2. Profile
    if (data.profile) {
      const profileRef = doc(db, 'schools', cleanSchoolId, 'schoolData', 'profile');
      batch.set(profileRef, cleanFirestoreObject(data.profile), { merge: true });
    }

    // 3. Classes
    data.classes.forEach((c) => {
      if (c.id) {
        const ref = doc(db, 'schools', cleanSchoolId, 'classes', c.id);
        batch.set(ref, cleanFirestoreObject(c), { merge: true });
      }
    });

    // 4. Students
    data.students.forEach((s) => {
      if (s.id) {
        const ref = doc(db, 'schools', cleanSchoolId, 'students', s.id);
        batch.set(ref, cleanFirestoreObject(s), { merge: true });
      }
    });

    // 5. Teachers
    if (data.teachers && data.teachers.length > 0) {
      data.teachers.forEach((t) => {
        if (t.id) {
          const ref = doc(db, 'schools', cleanSchoolId, 'teachers', t.id);
          batch.set(ref, cleanFirestoreObject(t), { merge: true });
        }
      });
    }

    // 6. Journals
    data.journals.forEach((j) => {
      if (j.id) {
        const ref = doc(db, 'schools', cleanSchoolId, 'journals', j.id);
        batch.set(ref, cleanFirestoreObject(j), { merge: true });
      }
    });

    // 7. Attendances
    data.attendances.forEach((a) => {
      if (a.id) {
        const ref = doc(db, 'schools', cleanSchoolId, 'attendances', a.id);
        batch.set(ref, cleanFirestoreObject(a), { merge: true });
      }
    });

    // 8. Assessments
    data.assessments.forEach((asmt) => {
      if (asmt.id) {
        const ref = doc(db, 'schools', cleanSchoolId, 'assessments', asmt.id);
        batch.set(ref, cleanFirestoreObject(asmt), { merge: true });
      }
    });

    await batch.commit();
  } catch (error) {
    console.error('Error saving school data to Firestore:', error);
    throw error;
  }
}

/**
 * Granular Realtime Listener for multi-device sync
 */
export function subscribeToSchoolRealtime(
  schoolId: string = DEFAULT_SCHOOL_ID,
  callbacks: {
    onJournalsUpdate?: (journals: TeachingJournal[]) => void;
    onAttendancesUpdate?: (attendances: AttendanceRecord[]) => void;
    onAssessmentsUpdate?: (assessments: AssessmentItem[]) => void;
    onClassesUpdate?: (classes: ClassRoom[]) => void;
    onStudentsUpdate?: (students: Student[]) => void;
    onTeachersUpdate?: (teachers: Teacher[]) => void;
    onProfileUpdate?: (profile: SchoolProfile) => void;
    onError?: (err: Error) => void;
  }
): Unsubscribe {
  const cleanSchoolId = schoolId.trim() || DEFAULT_SCHOOL_ID;
  const unsubscribes: Unsubscribe[] = [];

  try {
    // 1. Listen to journals
    if (callbacks.onJournalsUpdate) {
      const q = collection(db, 'schools', cleanSchoolId, 'journals');
      const un = onSnapshot(
        q,
        (snap) => {
          const list: TeachingJournal[] = [];
          snap.forEach((docSnap) => {
            list.push(docSnap.data() as TeachingJournal);
          });
          callbacks.onJournalsUpdate?.(list);
        },
        (err) => {
          console.warn('Journals realtime subscription notice:', err.message);
          callbacks.onError?.(err);
        }
      );
      unsubscribes.push(un);
    }

    // 2. Listen to attendances
    if (callbacks.onAttendancesUpdate) {
      const q = collection(db, 'schools', cleanSchoolId, 'attendances');
      const un = onSnapshot(
        q,
        (snap) => {
          const list: AttendanceRecord[] = [];
          snap.forEach((docSnap) => {
            list.push(docSnap.data() as AttendanceRecord);
          });
          callbacks.onAttendancesUpdate?.(list);
        },
        (err) => callbacks.onError?.(err)
      );
      unsubscribes.push(un);
    }

    // 3. Listen to assessments
    if (callbacks.onAssessmentsUpdate) {
      const q = collection(db, 'schools', cleanSchoolId, 'assessments');
      const un = onSnapshot(
        q,
        (snap) => {
          const list: AssessmentItem[] = [];
          snap.forEach((docSnap) => {
            list.push(docSnap.data() as AssessmentItem);
          });
          callbacks.onAssessmentsUpdate?.(list);
        },
        (err) => callbacks.onError?.(err)
      );
      unsubscribes.push(un);
    }

    // 4. Listen to classes
    if (callbacks.onClassesUpdate) {
      const q = collection(db, 'schools', cleanSchoolId, 'classes');
      const un = onSnapshot(
        q,
        (snap) => {
          const list: ClassRoom[] = [];
          snap.forEach((docSnap) => {
            list.push(docSnap.data() as ClassRoom);
          });
          callbacks.onClassesUpdate?.(list);
        },
        (err) => callbacks.onError?.(err)
      );
      unsubscribes.push(un);
    }

    // 5. Listen to students
    if (callbacks.onStudentsUpdate) {
      const q = collection(db, 'schools', cleanSchoolId, 'students');
      const un = onSnapshot(
        q,
        (snap) => {
          const list: Student[] = [];
          snap.forEach((docSnap) => {
            list.push(docSnap.data() as Student);
          });
          callbacks.onStudentsUpdate?.(list);
        },
        (err) => callbacks.onError?.(err)
      );
      unsubscribes.push(un);
    }

    // 6. Listen to teachers
    if (callbacks.onTeachersUpdate) {
      const q = collection(db, 'schools', cleanSchoolId, 'teachers');
      const un = onSnapshot(
        q,
        (snap) => {
          const list: Teacher[] = [];
          snap.forEach((docSnap) => {
            list.push(docSnap.data() as Teacher);
          });
          callbacks.onTeachersUpdate?.(list);
        },
        (err) => callbacks.onError?.(err)
      );
      unsubscribes.push(un);
    }

    // 7. Listen to Profile
    if (callbacks.onProfileUpdate) {
      const docRef = doc(db, 'schools', cleanSchoolId, 'schoolData', 'profile');
      const un = onSnapshot(
        docRef,
        (docSnap) => {
          if (docSnap.exists()) {
            callbacks.onProfileUpdate?.(docSnap.data() as SchoolProfile);
          }
        },
        (err) => callbacks.onError?.(err)
      );
      unsubscribes.push(un);
    }
  } catch (err) {
    console.warn('Realtime subscription error:', err);
  }

  return () => {
    unsubscribes.forEach((un) => {
      try {
        un();
      } catch (e) {
        // ignore cleanup error
      }
    });
  };
}

// Single item mutations
export async function saveJournalToFirestore(schoolId: string, journal: TeachingJournal): Promise<void> {
  const cleanSchoolId = schoolId.trim() || DEFAULT_SCHOOL_ID;
  const ref = doc(db, 'schools', cleanSchoolId, 'journals', journal.id);
  await setDoc(ref, cleanFirestoreObject(journal), { merge: true });
}

export async function deleteJournalFromFirestore(schoolId: string, journalId: string): Promise<void> {
  const cleanSchoolId = schoolId.trim() || DEFAULT_SCHOOL_ID;
  const ref = doc(db, 'schools', cleanSchoolId, 'journals', journalId);
  await deleteDoc(ref);
}

export async function saveAttendanceToFirestore(schoolId: string, attendance: AttendanceRecord): Promise<void> {
  const cleanSchoolId = schoolId.trim() || DEFAULT_SCHOOL_ID;
  const ref = doc(db, 'schools', cleanSchoolId, 'attendances', attendance.id);
  await setDoc(ref, cleanFirestoreObject(attendance), { merge: true });
}

export async function deleteAttendanceFromFirestore(schoolId: string, attendanceId: string): Promise<void> {
  const cleanSchoolId = schoolId.trim() || DEFAULT_SCHOOL_ID;
  const ref = doc(db, 'schools', cleanSchoolId, 'attendances', attendanceId);
  await deleteDoc(ref);
}

export async function saveAssessmentToFirestore(schoolId: string, assessment: AssessmentItem): Promise<void> {
  const cleanSchoolId = schoolId.trim() || DEFAULT_SCHOOL_ID;
  const ref = doc(db, 'schools', cleanSchoolId, 'assessments', assessment.id);
  await setDoc(ref, cleanFirestoreObject(assessment), { merge: true });
}

export async function deleteAssessmentFromFirestore(schoolId: string, assessmentId: string): Promise<void> {
  const cleanSchoolId = schoolId.trim() || DEFAULT_SCHOOL_ID;
  const ref = doc(db, 'schools', cleanSchoolId, 'assessments', assessmentId);
  await deleteDoc(ref);
}

/**
 * Completely wipe all school data (classes, students, teachers, journals, attendances, assessments) from Firestore
 */
export async function clearSchoolAppDataFromFirestore(schoolId: string = DEFAULT_SCHOOL_ID): Promise<void> {
  const cleanSchoolId = schoolId.trim() || DEFAULT_SCHOOL_ID;

  try {
    const collectionsToClear = ['classes', 'students', 'teachers', 'journals', 'attendances', 'assessments'];
    const batch = writeBatch(db);

    for (const collName of collectionsToClear) {
      const snap = await getDocs(collection(db, 'schools', cleanSchoolId, collName));
      snap.docs.forEach((d) => {
        batch.delete(d.ref);
      });
    }

    // Also reset profile document
    const profileRef = doc(db, 'schools', cleanSchoolId, 'schoolData', 'profile');
    batch.delete(profileRef);

    await batch.commit();
  } catch (error) {
    console.error('Error clearing school data from Firestore:', error);
    throw error;
  }
}
