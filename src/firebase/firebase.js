import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD4NjvkS_W1sLTcHGlI7osTE4YdKhAmedo",
  authDomain: "advanced-task-tracker-bbfa8.firebaseapp.com",
  projectId: "advanced-task-tracker-bbfa8",
  storageBucket: "advanced-task-tracker-bbfa8.firebasestorage.app",
  messagingSenderId: "186545544973",
  appId: "1:186545544973:web:f7a908e4c85cb7928d1a44",
  measurementId: "G-RD2FMW7EGY"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
