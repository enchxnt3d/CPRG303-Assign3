import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase connection for Sacbé
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "cprg303-sacbe-firebase.firebaseapp.com",
  projectId: "cprg303-sacbe-firebase",
  storageBucket: "cprg303-sacbe-firebase.firebasestorage.app",
  messagingSenderId: "489364353453",
  appId: "1:489364353453:web:...",
};

// Prevent Firebase from initializing twice during Expo reloads
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };

