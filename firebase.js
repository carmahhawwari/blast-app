// firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAdVBP-_8m4P5ea8E1TQBBuaVYGvyrtWE0",
  authDomain: "blast-app-ecfab.firebaseapp.com",
  projectId: "blast-app-ecfab",
  storageBucket: "blast-app-ecfab.appspot.com",
  messagingSenderId: "586516780576",
  appId: "1:586516780576:web:8e80c51c021c62fc2dce45",
  measurementId: "G-628LZRMWF1"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app); 

export { db, auth };
