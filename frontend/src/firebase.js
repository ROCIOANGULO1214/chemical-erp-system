// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDhA543vGBpYXlLp1jTD0wOVR29VA14aiA",
  authDomain: "erp-trazabilidad.firebaseapp.com",
  projectId: "erp-trazabilidad",
  storageBucket: "erp-trazabilidad.firebasestorage.app",
  messagingSenderId: "926503889417",
  appId: "1:926503889417:web:99a56cf7e38a3aa2cb66d8",
  measurementId: "G-12S88X9F8D"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

console.log('🔥 Firebase inicializado correctamente:', app.name);
console.log('🔥 Firestore db disponible:', db);

export { app, analytics, db };
