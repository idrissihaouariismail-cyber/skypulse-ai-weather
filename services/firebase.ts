import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID as string,
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export const OPENWEATHER_API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY as string;
console.log("DEBUG OPENWEATHER KEY =", OPENWEATHER_API_KEY);
export const IQAIR_API_KEY = import.meta.env.VITE_IQAIR_API_KEY as string;
export const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;