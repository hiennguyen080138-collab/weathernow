// src/config/firebase.js
// Khởi tạo Firebase Auth phía Client (dùng chung project với Backend).
// Lấy các giá trị bên dưới tại: Firebase Console > Project Settings > General > Your apps > SDK setup and configuration

import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyC9-fWYIZMuTNpS_U1_NYvJQ674dranFQY",
  authDomain: "weathernow-21762.firebaseapp.com",
  projectId: "weathernow-21762",
  storageBucket: "weathernow-21762.firebasestorage.app",
  messagingSenderId: "564099418696",
  appId: "1:564099418696:web:39d213ffd4d9e61c3f667d",
  measurementId: "G-8Y976HL7GH"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export default app;