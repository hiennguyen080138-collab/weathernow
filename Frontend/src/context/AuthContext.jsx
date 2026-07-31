// src/context/AuthContext.jsx
// Quản lý trạng thái đăng nhập toàn cục: currentUser, userRole, token, loading.
// userRole được xác định qua Custom Claims trong idTokenResult (đồng bộ với Backend:
// Backend gán { admin: true } claim khi nâng cấp Admin).

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signOut as firebaseSignOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { auth, googleProvider } from "../config/firebase";

const AuthContext = createContext(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth phải được dùng bên trong AuthProvider");
  return ctx;
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState("guest"); // 'guest' | 'user' | 'admin'
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const idTokenResult = await user.getIdTokenResult();
          const isAdmin = idTokenResult.claims.admin === true;

          setCurrentUser(user);
          setToken(idTokenResult.token);
          setUserRole(isAdmin ? "admin" : "user");
        } catch (err) {
          console.error("[AuthContext] Lỗi khi lấy idTokenResult:", err.message);
          setCurrentUser(user);
          setUserRole("user");
        }
      } else {
        setCurrentUser(null);
        setToken(null);
        setUserRole("guest");
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = (email, password) => signInWithEmailAndPassword(auth, email, password);

  const register = (email, password) => createUserWithEmailAndPassword(auth, email, password);

  const loginWithGoogle = () => signInWithPopup(auth, googleProvider);

  const logout = () => firebaseSignOut(auth);

  /**
   * Buộc làm mới token (dùng ngay sau khi Admin vừa được cấp quyền,
   * để claim { admin: true } có hiệu lực mà không cần đăng xuất/đăng nhập lại).
   */
  const refreshToken = async () => {
    if (!auth.currentUser) return;
    const idTokenResult = await auth.currentUser.getIdTokenResult(true);
    setToken(idTokenResult.token);
    setUserRole(idTokenResult.claims.admin === true ? "admin" : "user");
  };

  const value = {
    currentUser,
    userRole,
    token,
    loading,
    isAuthenticated: !!currentUser,
    isAdmin: userRole === "admin",
    login,
    register,
    loginWithGoogle,
    logout,
    refreshToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}