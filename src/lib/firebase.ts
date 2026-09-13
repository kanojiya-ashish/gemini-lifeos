import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  Firestore,
} from 'firebase/firestore';
import { InteractionDoc, GoalDoc, InsightDoc, UserProfile } from '../types';
import firebaseConfigJson from '../../firebase-applet-config.json';

// Client-side Firebase configuration using automatically provisioned Firebase project configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfigJson.apiKey || 'AIzaSyDemoPreviewKey1234567890abcdefghij',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigJson.authDomain || 'idyllic-formula-jt8c4.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfigJson.projectId || 'idyllic-formula-jt8c4',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfigJson.storageBucket || 'idyllic-formula-jt8c4.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigJson.messagingSenderId || '383248254977',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfigJson.appId || '1:383248254977:web:fe6f3015ac13ac951f9800',
};

let app: ReturnType<typeof initializeApp>;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

export const auth = getAuth(app);
const customDbId = firebaseConfigJson.firestoreDatabaseId;
export const db: Firestore = (customDbId && customDbId !== '(default)') 
  ? getFirestore(app, customDbId) 
  : getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Local Storage Fallback Cache Key for offline / preview demo resilience
const LOCAL_STORAGE_PREFIX = 'gemini_lifeos_';

/**
 * Strips any undefined fields defensively to ensure Firestore and JSON write safety.
 */
export function sanitizePayload<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj, (_, value) => (value === undefined ? null : value)));
}

// ---------------- AUTHENTICATION HELPERS ----------------

export async function loginWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function logoutUser(): Promise<void> {
  try {
    await fbSignOut(auth);
  } catch (err) {
    console.warn('[GeminiLifeOS] Firebase signOut notice:', err);
  }
}

export function subscribeToAuthChanges(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export async function getUserAuthToken(user: User): Promise<string> {
  try {
    return await user.getIdToken();
  } catch {
    return 'bearer_token_' + user.uid;
  }
}

// ---------------- USER PROFILE PERSISTENCE ----------------

export async function syncUserProfile(user: User): Promise<void> {
  const profile: UserProfile = {
    uid: user.uid,
    email: user.email || null,
    displayName: user.displayName || 'Journaler',
    photoURL: user.photoURL || null,
    createdAt: Date.now(),
    lastLoginAt: Date.now(),
  };

  try {
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, sanitizePayload(profile), { merge: true });
  } catch (e) {
    console.warn('[GeminiLifeOS] Firestore syncUserProfile fallback:', e);
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}profile_${user.uid}`, JSON.stringify(profile));
  }
}

// ---------------- INTERACTIONS / JOURNAL CRUD ----------------

export async function saveInteraction(userId: string, interaction: InteractionDoc): Promise<void> {
  const cleanData = sanitizePayload(interaction);
  try {
    const docRef = doc(db, 'users', userId, 'interactions', interaction.id);
    await setDoc(docRef, cleanData, { merge: true });
  } catch (e) {
    console.warn('[GeminiLifeOS] Firestore write interaction fallback to local cache:', e);
    const existing = getLocalInteractions(userId);
    const filtered = existing.filter((i) => i.id !== interaction.id);
    localStorage.setItem(
      `${LOCAL_STORAGE_PREFIX}interactions_${userId}`,
      JSON.stringify([cleanData, ...filtered])
    );
  }
}

export async function fetchInteractions(userId: string): Promise<InteractionDoc[]> {
  try {
    const colRef = collection(db, 'users', userId, 'interactions');
    const q = query(colRef, orderBy('updatedAt', 'desc'));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      return snapshot.docs.map((d) => d.data() as InteractionDoc);
    }
  } catch (e) {
    console.warn('[GeminiLifeOS] Firestore fetchInteractions fallback to local cache:', e);
  }
  return getLocalInteractions(userId);
}

export async function deleteInteraction(userId: string, interactionId: string): Promise<void> {
  try {
    const docRef = doc(db, 'users', userId, 'interactions', interactionId);
    await deleteDoc(docRef);
  } catch (e) {
    console.warn('[GeminiLifeOS] Firestore deleteInteraction fallback:', e);
  }
  const existing = getLocalInteractions(userId);
  const updated = existing.filter((i) => i.id !== interactionId);
  localStorage.setItem(`${LOCAL_STORAGE_PREFIX}interactions_${userId}`, JSON.stringify(updated));
}

function getLocalInteractions(userId: string): InteractionDoc[] {
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}interactions_${userId}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error(e);
  }
  return [];
}

// ---------------- GOALS CRUD ----------------

export async function saveGoal(userId: string, goal: GoalDoc): Promise<void> {
  const cleanData = sanitizePayload(goal);
  try {
    const docRef = doc(db, 'users', userId, 'goals', goal.id);
    await setDoc(docRef, cleanData, { merge: true });
  } catch (e) {
    console.warn('[GeminiLifeOS] Firestore saveGoal fallback:', e);
    const existing = getLocalGoals(userId);
    const filtered = existing.filter((g) => g.id !== goal.id);
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}goals_${userId}`, JSON.stringify([cleanData, ...filtered]));
  }
}

export async function fetchGoals(userId: string): Promise<GoalDoc[]> {
  try {
    const colRef = collection(db, 'users', userId, 'goals');
    const snapshot = await getDocs(colRef);
    if (!snapshot.empty) {
      return snapshot.docs.map((d) => d.data() as GoalDoc);
    }
  } catch (e) {
    console.warn('[GeminiLifeOS] Firestore fetchGoals fallback:', e);
  }
  return getLocalGoals(userId);
}

export async function deleteGoal(userId: string, goalId: string): Promise<void> {
  try {
    const docRef = doc(db, 'users', userId, 'goals', goalId);
    await deleteDoc(docRef);
  } catch (e) {
    console.warn('[GeminiLifeOS] Firestore deleteGoal fallback:', e);
  }
  const existing = getLocalGoals(userId);
  const updated = existing.filter((g) => g.id !== goalId);
  localStorage.setItem(`${LOCAL_STORAGE_PREFIX}goals_${userId}`, JSON.stringify(updated));
}

function getLocalGoals(userId: string): GoalDoc[] {
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}goals_${userId}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error(e);
  }
  return [];
}

// ---------------- INSIGHTS CRUD ----------------

export async function saveInsight(userId: string, insight: InsightDoc): Promise<void> {
  const cleanData = sanitizePayload(insight);
  try {
    const docRef = doc(db, 'users', userId, 'insights', insight.id);
    await setDoc(docRef, cleanData, { merge: true });
  } catch (e) {
    console.warn('[GeminiLifeOS] Firestore saveInsight fallback:', e);
    const existing = getLocalInsights(userId);
    const filtered = existing.filter((i) => i.id !== insight.id);
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}insights_${userId}`, JSON.stringify([cleanData, ...filtered]));
  }
}

export async function fetchInsights(userId: string): Promise<InsightDoc[]> {
  try {
    const colRef = collection(db, 'users', userId, 'insights');
    const q = query(colRef, orderBy('generatedAt', 'desc'));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      return snapshot.docs.map((d) => d.data() as InsightDoc);
    }
  } catch (e) {
    console.warn('[GeminiLifeOS] Firestore fetchInsights fallback:', e);
  }
  return getLocalInsights(userId);
}

function getLocalInsights(userId: string): InsightDoc[] {
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}insights_${userId}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error(e);
  }
  return [];
}
