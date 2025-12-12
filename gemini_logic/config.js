// Firebase Configuration
const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "YOUR_FIREBASE_AUTH_DOMAIN",
  projectId: "YOUR_FIREBASE_PROJECT_ID",
  storageBucket: "YOUR_FIREBASE_STORAGE_BUCKET",
  messagingSenderId: "YOUR_FIREBASE_MESSAGING_SENDER_ID",
  appId: "YOUR_FIREBASE_APP_ID",
  measurementId: "YOUR_FIREBASE_MEASUREMENT_ID" // Optional, if using Analytics
};

// OpenWeatherMap API Key
const OPENWEATHER_API_KEY = "YOUR_OPENWEATHER_API_KEY";

// IQAir API Key
const IQAIR_API_KEY = "YOUR_IQAIR_API_KEY";

// Mapbox API Key (or Leaflet won't need one unless using a specific tile provider)
const MAPBOX_API_KEY = "YOUR_MAPBOX_API_KEY"; // Required if using Mapbox GL JS or certain Leaflet tile providers

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

export { auth, db, OPENWEATHER_API_KEY, IQAIR_API_KEY, MAPBOX_API_KEY };