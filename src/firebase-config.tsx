// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD0JgvCkGs0ox57yttp-sWdzHxriSaFwyA",
  authDomain: "team-bee---cos420.firebaseapp.com",
  projectId: "team-bee---cos420",
  storageBucket: "team-bee---cos420.firebasestorage.app",
  messagingSenderId: "713747455348",
  appId: "1:713747455348:web:037cc2eededaa03a346021",
  measurementId: "G-S62HEYF88F"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
if (window.location.hostname === "localhost") {
    connectFirestoreEmulator(db, "localhost", 8080);
}

export {app, db};