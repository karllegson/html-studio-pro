// Import the functions you need from the SDKs you need
import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getAuth, Auth, setPersistence, browserLocalPersistence } from "firebase/auth";

/**
 * Firebase configuration object
 * All values are loaded from environment variables
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

/**
 * Initialize Firebase only if it hasn't been initialized already
 * This prevents multiple initializations in development
 */
let app: FirebaseApp;
if (!getApps().length) {
  try {
    app = initializeApp(firebaseConfig);
  } catch (error) {
    console.error('Error initializing Firebase:', error);
    throw error;
  }
} else {
  app = getApps()[0];
}

/**
 * Initialize and export Firebase services
 */
export const db: Firestore = getFirestore(app);
export const storage: FirebaseStorage = getStorage(app);
export const auth: Auth = getAuth(app);

// Set authentication persistence to localStorage (persists across app restarts)
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error('Error setting auth persistence:', error);
});

/**
 * Helper function to check if Firebase is properly initialized
 */
export const isFirebaseInitialized = (): boolean => {
  return !!app && !!db && !!storage && !!auth;
};