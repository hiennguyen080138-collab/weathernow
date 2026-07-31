// src/components/AuthModal.jsx
import React, { useState, useEffect } from "react";
import { X, Mail, Lock, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function AuthModal({ open, initialTab = "login", onClose }) {
  const { login, register, loginWithGoogle } = useAuth();
  const [tab, setTab] = useState(initialTab);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setTab(initialTab);
      setEmail("");
      setPassword("");
      setError("");
    }
  }, [open, initialTab]);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (tab === "login") {
        await login(email, password);
      } else {
        await register(email, password);
      }
      onClose();
    } catch (err) {
      // Truyền trực tiếp đối tượng err vào hàm dịch lỗi chi tiết
      setError(translateFirebaseError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    setLoading(true);
    try {
      await loginWithGoogle();
      onClose();
    } catch (err) {
      setError(translateFirebaseError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="glass-panel animate-rise w-full max-w-sm bg-ink-light p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-cloud">
            {tab === "login" ? "Đăng nhập" : "Tạo tài khoản"}
          </h2>
          <button onClick={onClose} className="text-mist hover:text-warn">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="mb-5 flex rounded-full border border-slate-border/60 p-1">
          <button
            onClick={() => setTab("login")}
            className={`flex-1 rounded-full py-1.5 text-sm font-medium transition ${
              tab === "login" ? "bg-signal/20 text-signal" : "text-mist"
            }`}
          >
            Đăng nhập
          </button>
          <button
            onClick={() => setTab("register")}
            className={`flex-1 rounded-full py-1.5 text-sm font-medium transition ${
              tab === "register" ? "bg-signal/20 text-signal" : "text-mist"
            }`}
          >
            Đăng ký
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mist" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full rounded-lg border border-slate-border/70 bg-ink/50 py-2.5 pl-9 pr-3 text-sm text-cloud placeholder:text-mist focus:border-signal/60"
            />
          </div>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mist" />
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mật khẩu (tối thiểu 6 ký tự)"
              className="w-full rounded-lg border border-slate-border/70 bg-ink/50 py-2.5 pl-9 pr-3 text-sm text-cloud placeholder:text-mist focus:border-signal/60"
            />
          </div>

          {error && (
            <p className="rounded-lg border border-warn/40 bg-warn/10 px-3 py-2 text-xs text-warn">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 flex items-center justify-center gap-2 rounded-lg bg-amber py-2.5 text-sm font-semibold text-ink transition hover:bg-amber-soft disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {tab === "login" ? "Đăng nhập" : "Tạo tài khoản"}
          </button>
        </form>

        <div className="my-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-border/60" />
          <span className="text-xs text-mist">hoặc</span>
          <div className="h-px flex-1 bg-slate-border/60" />
        </div>

        <button
          onClick={handleGoogle}
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-border/70 bg-cloud py-2.5 text-sm font-medium text-ink transition hover:bg-white disabled:opacity-60"
        >
          <GoogleIcon className="h-4 w-4" />
          Tiếp tục với Google
        </button>
      </div>
    </div>
  );
}

function GoogleIcon(props) {
  return (
    <svg viewBox="0 0 48 48" {...props}>
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="m6.3 14.7 6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.4 0 10.3-2.1 14-5.5l-6.5-5.5C29.4 34.8 26.8 36 24 36c-5.3 0-9.7-3.1-11.3-7.5l-6.5 5C9.6 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.7l6.5 5.5C39.9 37 44 31 44 24c0-1.3-.1-2.7-.4-3.5z"
      />
    </svg>
  );
}

// Cập nhật hàm lọc mã lỗi để nhận chính xác từ đối tượng err thay vì chỉ đọc string cụ thể
function translateFirebaseError(err) {
  const errStr = String(err?.code || err?.message || err || "");

  if (errStr.includes("auth/email-already-in-use")) {
    return "Email này đã được đăng ký. Vui lòng chuyển sang tab Đăng nhập!";
  }
  if (errStr.includes("auth/invalid-credential") || errStr.includes("auth/wrong-password")) {
    return "Email hoặc mật khẩu không đúng.";
  }
  if (errStr.includes("auth/user-not-found")) {
    return "Tài khoản không tồn tại.";
  }
  if (errStr.includes("auth/weak-password")) {
    return "Mật khẩu quá yếu (tối thiểu 6 ký tự).";
  }
  if (errStr.includes("auth/invalid-email")) {
    return "Email không hợp lệ.";
  }
  if (errStr.includes("auth/popup-closed-by-user")) {
    return "Bạn đã đóng cửa sổ đăng nhập Google.";
  }
  
  return err?.message || "Đã có lỗi xảy ra, vui lòng thử lại.";
}