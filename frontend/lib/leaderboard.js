import { db, auth } from './firebase';
import {
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  orderBy,
  limit as fsLimit,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';

// Updates/creates a user doc with latest score and ensures name/photoURL are stored
export async function updateUserScore(uid, newScore) {
  if (!uid) throw new Error('uid is required');

  const score = Number(newScore) || 0;
  let userRef = doc(db, 'users', uid);

  // Resolve the correct user document:
  // 1) If a doc with ID = uid exists, use it (email/password custom-token flow)
  // 2) Else, find doc where firebase_uid == uid (social auth flow)
  // 3) Else, create/merge at ID = uid
  let existing = null;
  try {
    const byId = await getDoc(userRef);
    if (byId.exists()) {
      existing = { id: byId.id, ...(byId.data() || {}) };
    } else {
      const q = query(collection(db, 'users'), where('firebase_uid', '==', uid), fsLimit(1));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const d = snap.docs[0];
        userRef = d.ref;
        existing = { id: d.id, ...(d.data() || {}) };
      }
    }
  } catch (_) {}

  // Preserve name/photo when possible, fallback to auth user
  let name = existing?.name || null;
  let photoURL = existing?.photoURL || null;
  const current = auth?.currentUser || null;
  if (current && current.uid === uid) {
    if (!name) name = current.displayName || (current.email ? current.email.split('@')[0] : '');
    if (!photoURL) photoURL = current.photoURL || null;
  }

  await setDoc(
    userRef,
    {
      // Keep a backlink for social-auth users if not present
      firebase_uid: existing?.firebase_uid || uid,
      name: name || null,
      photoURL: photoURL || null,
      score,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  return { id: userRef.id, name, photoURL, score };
}

// Fetches leaderboard ordered by score descending
export async function getLeaderboard(max = 50) {
  const q = query(
    collection(db, 'users'),
    where('score', '!=', null),
    orderBy('score', 'desc'),
    fsLimit(max)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() || {}) }));
}
