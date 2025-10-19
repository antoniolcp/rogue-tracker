// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Your web app's Firebase configuration
// For Firebase JS SDK v9 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD7UX-cTWYYzR7ILdZYHg2FgXnhTeyrFF8",
  authDomain: "rogue-tracker.firebaseapp.com",
  projectId: "rogue-tracker",
  storageBucket: "rogue-tracker.firebasestorage.app",
  messagingSenderId: "724317204749",
  appId: "1:724317204749:web:9f0ccaebaf54c0e4a3c044",
  measurementId: "G-BB2M5JBVNS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Auth
export const auth = getAuth(app);

export default app;
