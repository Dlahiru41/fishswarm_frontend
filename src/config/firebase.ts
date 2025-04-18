// src/config/firebase.ts
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
// Replace these with your actual Firebase project config
const firebaseConfig = {
    apiKey: "AIzaSyC8XwskIDqeZYJowl8x8vSM7gBBRT8mqMk",
    authDomain: "fish-detection-86201.firebaseapp.com",
    databaseURL: "https://fish-detection-86201-default-rtdb.firebaseio.com",
    projectId: "fish-detection-86201",
    storageBucket: "fish-detection-86201.firebasestorage.app",
    messagingSenderId: "961396911335",
    appId: "1:961396911335:web:2d1342618bda9f546c4642",
    measurementId: "G-9GMVSX4YF4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore and Storage
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;