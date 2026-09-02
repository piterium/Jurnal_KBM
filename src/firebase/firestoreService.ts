import {
  db,
  auth,
  doc,
  collection,
  getDocs,
  setDoc,
  deleteDoc,
  writeBatch,
  onSnapshot,
  handleFirestoreError,
  OperationType,
  User,
} from './firebase';
import {
  AppData,
  SchoolProfile,
  ClassRoom,
  Student,
  Teacher,
  TeachingJournal,
  AttendanceRecord,
  AssessmentItem,
} from '../types';
import { defaultProfile } from '../utils/initialData';
import firebaseConfig from '../../firebase-applet-config.json';

export const DEFAULT_SCHOOL_ID = 'main';

export interface FirebaseLiveStats {
  projectId: string;
  databaseId: string;
  authDomain: string;
  isConnected: boolean;
  latencyMs: number;
  lastChecked: string;
  schoolId: string;
  counts: {
    classes: number;
    students: number;
    teachers: number;
    journals: number;
    attendances: number;
    assessments: number;
  };
}

export function getFirebaseConfigSummary() {
  return {
    projectId: firebaseConfig.projectId,
    databaseId: firebaseConfig.firestoreDatabaseId,
    authDomain: firebaseConfig.authDomain,
  };
}

export async function testFirebaseLiveConnection(
  schoolId: string = DEFAULT_SCHOOL_ID
): Promise<{ isConnected: boolean; latencyMs: number }> {
  const start = performance.now();
  try {
    const path = `schools/${schoolId}/schoolData`;
    await getDocs(collection(db, path));
    const latency = Math.round(performance.now() - start);
    return { isConnected: true, latencyMs: latency };
  } catch (err) {
    const latency = Math.round(performance.now() - start);
    return { isConnected: false, latencyMs: latency };
  }
}

export async function syncUserProfile(user: User): Promise<void> {
  const path = `users/${user.uid}`;
  try {
    const userRef = doc(db, 'users', user.uid);
    await setDoc(
      userRef,
      {
        id: user.uid,
        email: user.email || '',
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

/**
 * Load complete shared school data from Firestore (cross-device)
 */
export async function loadSchoolAppDataFromFirestore(
  schoolId: string = DEFAULT_SCHOOL_ID
): Promise<AppData | null> {
  try {
    // 1. Profile
    let profile: SchoolProfile = { ...defaultProfile };
    try {
      const profileDocs = await getDocs(collection(db, `schools/${schoolId}/schoolData`));
      profileDocs.forEach((d) => {
        if (d.id === 'profile') {
          profile = { ...defaultProfile, ...(d.data() as SchoolProfile) };
        }
      });
    } catch (err) {
      console.warn('Error reading school profile:', err);
    }

    // 2. Classes
    const classes: ClassRoom[] = [];
    try {
      const classSnap = await getDocs(collection(db, `schools/${schoolId}/classes`));
      classSnap.forEach((d) => {
        const item = d.data() as ClassRoom;
        classes.push({ ...item, id: d.id });
      });
    } catch (err) {
      console.warn('Error reading classes:', err);
    }

    // 3. Students
    const students: Student[] = [];
    try {
      const studentSnap = await getDocs(collection(db, `schools/${schoolId}/students`));
      studentSnap.forEach((d) => {
        const item = d.data() as Student;
        students.push({ ...item, id: d.id });
      });
    } catch (err) {
      console.warn('Error reading students:', err);
    }

    // 4. Teachers
    const teachers: Teacher[] = [];
    try {
      const teacherSnap = await getDocs(collection(db, `schools/${schoolId}/teachers`));
      teacherSnap.forEach((d) => {
        const item = d.data() as Teacher;
        teachers.push({ ...item, id: d.id });
      });
    } catch (err) {
      console.warn('Error reading teachers:', err);
    }

    // 5. Journals
    const journals: TeachingJournal[] = [];
    try {
      const journalSnap = await getDocs(collection(db, `schools/${schoolId}/journals`));
      journalSnap.forEach((d) => {
        const item = d.data() as TeachingJournal;
        journals.push({ ...item, id: d.id });
      });
    } catch (err) {
      console.warn('Error reading journals:', err);
    }

    // 6. Attendances
    const attendances: AttendanceRecord[] = [];
    try {
      const attSnap = await getDocs(collection(db, `schools/${schoolId}/attendances`));
      attSnap.forEach((d) => {
        const item = d.data() as AttendanceRecord;
        attendances.push({ ...item, id: d.id });
      });
    } catch (err) {
      console.warn('Error reading attendances:', err);
    }

    // 7. Assessments
    const assessments: AssessmentItem[] = [];
    try {
      const asmSnap = await getDocs(collection(db, `schools/${schoolId}/assessments`));
      asmSnap.forEach((d) => {
        const item = d.data() as AssessmentItem;
        assessments.push({ ...item, id: d.id });
      });
    } catch (err) {
      console.warn('Error reading assessments:', err);
    }

    const hasData =
      classes.length > 0 ||
      students.length > 0 ||
      journals.length > 0 ||
      attendances.length > 0 ||
      assessments.length > 0 ||
      teachers.length > 0;

    if (!hasData) {
      return null;
    }

    return {
      profile,
      classes,
      students,
      teachers,
      journals,
      attendances,
      assessments,
    };
  } catch (err) {
    console.error('Error loading school data from Firestore:', err);
    return null;
  }
}

/**
 * Save complete application state to shared school Firestore collection
 */
export async function saveSchoolAppDataToFirestore(
  schoolId: string = DEFAULT_SCHOOL_ID,
  data: AppData
): Promise<void> {
  const basePath = `schools/${schoolId}`;
  try {
    // 1. Profile
    const profileRef = doc(db, `schools/${schoolId}/schoolData`, 'profile');
    await setDoc(profileRef, {
      ...data.profile,
      schoolId,
      updatedAt: new Date().toISOString(),
    });

    // 2. Classes
    for (const cls of data.classes) {
      const ref = doc(db, `schools/${schoolId}/classes`, cls.id);
      await setDoc(ref, { ...cls, schoolId }, { merge: true });
    }

    // 3. Students
    for (const std of data.students) {
      const ref = doc(db, `schools/${schoolId}/students`, std.id);
      await setDoc(ref, { ...std, schoolId }, { merge: true });
    }

    // 4. Teachers
    if (data.teachers && data.teachers.length > 0) {
      for (const tch of data.teachers) {
        const ref = doc(db, `schools/${schoolId}/teachers`, tch.id);
        await setDoc(ref, { ...tch, schoolId }, { merge: true });
      }
    }

    // 5. Journals
    for (const jnl of data.journals) {
      const ref = doc(db, `schools/${schoolId}/journals`, jnl.id);
      await setDoc(ref, { ...jnl, schoolId }, { merge: true });
    }

    // 6. Attendances
    for (const att of data.attendances) {
      const ref = doc(db, `schools/${schoolId}/attendances`, att.id);
      await setDoc(ref, { ...att, schoolId }, { merge: true });
    }

    // 7. Assessments
    for (const asm of data.assessments) {
      const ref = doc(db, `schools/${schoolId}/assessments`, asm.id);
      await setDoc(ref, { ...asm, schoolId }, { merge: true });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, basePath);
  }
}

/**
 * Save single document to school Firestore collection in real-time
 */
export async function saveSingleDocumentToFirestore(
  schoolId: string = DEFAULT_SCHOOL_ID,
  collectionName: 'classes' | 'students' | 'teachers' | 'journals' | 'attendances' | 'assessments' | 'schoolData',
  docId: string,
  docData: any
): Promise<void> {
  const path = `schools/${schoolId}/${collectionName}/${docId}`;
  try {
    const docRef = doc(db, `schools/${schoolId}/${collectionName}`, docId);
    await setDoc(docRef, { ...docData, schoolId, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

/**
 * Delete single document from school Firestore collection
 */
export async function deleteSchoolDocumentFromFirestore(
  schoolId: string = DEFAULT_SCHOOL_ID,
  collectionName: 'classes' | 'students' | 'teachers' | 'journals' | 'attendances' | 'assessments',
  docId: string
): Promise<void> {
  const path = `schools/${schoolId}/${collectionName}/${docId}`;
  try {
    const docRef = doc(db, `schools/${schoolId}/${collectionName}`, docId);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

/**
 * Subscribe to all live realtime changes across all devices and networks
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
  }
): () => void {
  const unsubscribers: (() => void)[] = [];

  // 1. Profile listener
  if (callbacks.onProfileUpdate) {
    const unsub = onSnapshot(
      collection(db, `schools/${schoolId}/schoolData`),
      (snap) => {
        snap.forEach((d) => {
          if (d.id === 'profile') {
            callbacks.onProfileUpdate?.({ ...defaultProfile, ...(d.data() as SchoolProfile) });
          }
        });
      },
      (err) => console.warn('Profile realtime listener notice:', err)
    );
    unsubscribers.push(unsub);
  }

  // 2. Classes listener
  if (callbacks.onClassesUpdate) {
    const unsub = onSnapshot(
      collection(db, `schools/${schoolId}/classes`),
      (snap) => {
        const items: ClassRoom[] = [];
        snap.forEach((d) => items.push({ ...(d.data() as ClassRoom), id: d.id }));
        if (items.length > 0) callbacks.onClassesUpdate?.(items);
      },
      (err) => console.warn('Classes realtime listener notice:', err)
    );
    unsubscribers.push(unsub);
  }

  // 3. Students listener
  if (callbacks.onStudentsUpdate) {
    const unsub = onSnapshot(
      collection(db, `schools/${schoolId}/students`),
      (snap) => {
        const items: Student[] = [];
        snap.forEach((d) => items.push({ ...(d.data() as Student), id: d.id }));
        if (items.length > 0) callbacks.onStudentsUpdate?.(items);
      },
      (err) => console.warn('Students realtime listener notice:', err)
    );
    unsubscribers.push(unsub);
  }

  // 4. Teachers listener
  if (callbacks.onTeachersUpdate) {
    const unsub = onSnapshot(
      collection(db, `schools/${schoolId}/teachers`),
      (snap) => {
        const items: Teacher[] = [];
        snap.forEach((d) => items.push({ ...(d.data() as Teacher), id: d.id }));
        if (items.length > 0) callbacks.onTeachersUpdate?.(items);
      },
      (err) => console.warn('Teachers realtime listener notice:', err)
    );
    unsubscribers.push(unsub);
  }

  // 5. Journals listener
  if (callbacks.onJournalsUpdate) {
    const unsub = onSnapshot(
      collection(db, `schools/${schoolId}/journals`),
      (snap) => {
        const items: TeachingJournal[] = [];
        snap.forEach((d) => items.push({ ...(d.data() as TeachingJournal), id: d.id }));
        callbacks.onJournalsUpdate?.(items);
      },
      (err) => console.warn('Journals realtime listener notice:', err)
    );
    unsubscribers.push(unsub);
  }

  // 6. Attendances listener
  if (callbacks.onAttendancesUpdate) {
    const unsub = onSnapshot(
      collection(db, `schools/${schoolId}/attendances`),
      (snap) => {
        const items: AttendanceRecord[] = [];
        snap.forEach((d) => items.push({ ...(d.data() as AttendanceRecord), id: d.id }));
        callbacks.onAttendancesUpdate?.(items);
      },
      (err) => console.warn('Attendances realtime listener notice:', err)
    );
    unsubscribers.push(unsub);
  }

  // 7. Assessments listener
  if (callbacks.onAssessmentsUpdate) {
    const unsub = onSnapshot(
      collection(db, `schools/${schoolId}/assessments`),
      (snap) => {
        const items: AssessmentItem[] = [];
        snap.forEach((d) => items.push({ ...(d.data() as AssessmentItem), id: d.id }));
        callbacks.onAssessmentsUpdate?.(items);
      },
      (err) => console.warn('Assessments realtime listener notice:', err)
    );
    unsubscribers.push(unsub);
  }

  // Return unsubscribe all function
  return () => {
    unsubscribers.forEach((unsub) => unsub());
  };
}

