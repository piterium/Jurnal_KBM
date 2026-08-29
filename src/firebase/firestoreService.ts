import {
  db,
  auth,
  doc,
  collection,
  getDocs,
  setDoc,
  deleteDoc,
  writeBatch,
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

export async function loadUserAppDataFromFirestore(userId: string): Promise<AppData | null> {
  try {
    // 1. Profile
    const profilePath = `users/${userId}/schoolData/profile`;
    let profile: SchoolProfile = { ...defaultProfile };
    try {
      const profileDocs = await getDocs(collection(db, `users/${userId}/schoolData`));
      profileDocs.forEach(d => {
        if (d.id === 'profile') {
          profile = { ...defaultProfile, ...(d.data() as SchoolProfile) };
        }
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, profilePath);
    }

    // 2. Classes
    const classesPath = `users/${userId}/classes`;
    const classes: ClassRoom[] = [];
    try {
      const classSnap = await getDocs(collection(db, classesPath));
      classSnap.forEach(d => {
        const item = d.data() as ClassRoom;
        classes.push({ ...item, id: d.id });
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, classesPath);
    }

    // 3. Students
    const studentsPath = `users/${userId}/students`;
    const students: Student[] = [];
    try {
      const studentSnap = await getDocs(collection(db, studentsPath));
      studentSnap.forEach(d => {
        const item = d.data() as Student;
        students.push({ ...item, id: d.id });
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, studentsPath);
    }

    // 4. Teachers
    const teachersPath = `users/${userId}/teachers`;
    const teachers: Teacher[] = [];
    try {
      const teacherSnap = await getDocs(collection(db, teachersPath));
      teacherSnap.forEach(d => {
        const item = d.data() as Teacher;
        teachers.push({ ...item, id: d.id });
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, teachersPath);
    }

    // 5. Journals
    const journalsPath = `users/${userId}/journals`;
    const journals: TeachingJournal[] = [];
    try {
      const journalSnap = await getDocs(collection(db, journalsPath));
      journalSnap.forEach(d => {
        const item = d.data() as TeachingJournal;
        journals.push({ ...item, id: d.id });
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, journalsPath);
    }

    // 6. Attendances
    const attendancesPath = `users/${userId}/attendances`;
    const attendances: AttendanceRecord[] = [];
    try {
      const attSnap = await getDocs(collection(db, attendancesPath));
      attSnap.forEach(d => {
        const item = d.data() as AttendanceRecord;
        attendances.push({ ...item, id: d.id });
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, attendancesPath);
    }

    // 7. Assessments
    const assessmentsPath = `users/${userId}/assessments`;
    const assessments: AssessmentItem[] = [];
    try {
      const asmSnap = await getDocs(collection(db, assessmentsPath));
      asmSnap.forEach(d => {
        const item = d.data() as AssessmentItem;
        assessments.push({ ...item, id: d.id });
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, assessmentsPath);
    }

    // Return combined app data
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
    console.error('Error loading data from Firestore:', err);
    return null;
  }
}

export async function saveUserAppDataToFirestore(userId: string, data: AppData): Promise<void> {
  const basePath = `users/${userId}`;
  try {
    // 1. Profile
    const profileRef = doc(db, `users/${userId}/schoolData`, 'profile');
    await setDoc(profileRef, {
      ...data.profile,
      userId,
      updatedAt: new Date().toISOString(),
    });

    // We can use batch for atomic updates or sync collections
    // Classes
    for (const cls of data.classes) {
      const ref = doc(db, `users/${userId}/classes`, cls.id);
      await setDoc(ref, { ...cls, userId });
    }

    // Students
    for (const std of data.students) {
      const ref = doc(db, `users/${userId}/students`, std.id);
      await setDoc(ref, { ...std, userId });
    }

    // Teachers
    for (const tch of data.teachers) {
      const ref = doc(db, `users/${userId}/teachers`, tch.id);
      await setDoc(ref, { ...tch, userId });
    }

    // Journals
    for (const jnl of data.journals) {
      const ref = doc(db, `users/${userId}/journals`, jnl.id);
      await setDoc(ref, { ...jnl, userId });
    }

    // Attendances
    for (const att of data.attendances) {
      const ref = doc(db, `users/${userId}/attendances`, att.id);
      await setDoc(ref, { ...att, userId });
    }

    // Assessments
    for (const asm of data.assessments) {
      const ref = doc(db, `users/${userId}/assessments`, asm.id);
      await setDoc(ref, { ...asm, userId });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, basePath);
  }
}

export async function deleteFirestoreDocument(
  userId: string,
  collectionName: 'classes' | 'students' | 'teachers' | 'journals' | 'attendances' | 'assessments',
  docId: string
): Promise<void> {
  const path = `users/${userId}/${collectionName}/${docId}`;
  try {
    const docRef = doc(db, `users/${userId}/${collectionName}`, docId);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}
