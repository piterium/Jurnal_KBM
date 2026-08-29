# Security Specification: Jurnal Mengajar & Administrasi Guru

## 1. Data Invariants
1. A user can only access, read, create, update, or delete data within their own namespace `/users/{userId}`.
2. The `userId` in path `/users/{userId}` MUST match `request.auth.uid`.
3. All resource documents created must have valid IDs (alphanumeric, dash, underscore, <= 128 characters).
4. No unauthenticated read/write access is permitted on any collection.
5. School profile, classes, students, teachers, journals, attendances, and assessments are scoped strictly to the authenticated teacher/admin.

## 2. The Dirty Dozen Payloads (Negative Test Vectors)
1. **Unauthenticated Read**: Anonymous user reading `/users/user123/classes/cls-1` -> DENIED.
2. **Cross-User Snooping**: User A reading `/users/userB/students/std-1` -> DENIED.
3. **Cross-User Write**: User A updating `/users/userB/schoolData/profile` -> DENIED.
4. **Spoofed User ID**: User A writing a student document with `userId: "userB"` into `/users/userA/students/std-1` -> DENIED (must enforce ownership consistency).
5. **Junk ID Injection**: Writing to `/users/userA/classes/{10kb_string_with_symbols}` -> DENIED (`isValidId` check).
6. **Massive Payload Attack**: Writing a journal with `topic` length > 20,000 characters -> DENIED (size check).
7. **Cross-User Class Deletion**: User A deleting `/users/userB/classes/cls-1` -> DENIED.
8. **Malicious Student Update**: User A altering another user's student attendance records -> DENIED.
9. **Blanket Collection Listing**: User A executing a query on `/users` root without scoping to own UID -> DENIED.
10. **Corrupted Timestamp / Data Type**: Writing integer for student name or date -> DENIED.
11. **Negative Grade Score Attack**: Setting score to out of range or malformed type -> DENIED.
12. **Ghost Subcollection Pollution**: Attempting to write arbitrary collections under root -> DENIED.
