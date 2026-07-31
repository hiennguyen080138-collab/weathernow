// src/components/UserSettingsModal.jsx
import React, { useEffect, useState } from "react";
import { X, Pencil, Check, LogOut, Loader2, KeyRound, Eye, EyeOff } from "lucide-react";
import {
  getAuth,
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import { useAuth } from "../context/AuthContext";

export default function UserSettingsModal({ open, onClose }) {
  const { currentUser, logout } = useAuth();

  const [displayName, setDisplayName] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // State cho khối Đổi mật khẩu
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  // Tài khoản đăng nhập bằng Google (hoặc provider ngoài) sẽ không có mật khẩu để đổi tại đây
  const hasPasswordProvider = (currentUser?.providerData || []).some(
    (p) => p.providerId === "password"
  );

  // Đồng bộ lại state mỗi khi Modal được mở
  useEffect(() => {
    if (open) {
      setDisplayName(currentUser?.displayName || "");
      setIsEditing(false);
      setError("");
      setSuccessMsg("");
      setIsChangingPassword(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswords(false);
      setPasswordError("");
      setPasswordSuccess("");
    }
  }, [open, currentUser]);

  if (!open) return null;

  const email = currentUser?.email || "—";
  const avatarLetter = (currentUser?.displayName || currentUser?.email || "U")[0].toUpperCase();

  const handleSave = async () => {
    const trimmed = displayName.trim();
    if (!trimmed) {
      setError("Tên hiển thị không được để trống.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccessMsg("");
    try {
      const auth = getAuth();
      if (!auth.currentUser) throw new Error("Không tìm thấy phiên đăng nhập.");
      await updateProfile(auth.currentUser, { displayName: trimmed });
      setSuccessMsg("Đã cập nhật tên hiển thị thành công!");
      setIsEditing(false);
    } catch (err) {
      setError(err.message || "Không thể cập nhật tên hiển thị. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setDisplayName(currentUser?.displayName || "");
    setIsEditing(false);
    setError("");
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("Vui lòng điền đầy đủ các trường.");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("Mật khẩu mới phải có ít nhất 6 ký tự.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Mật khẩu xác nhận không khớp.");
      return;
    }
    if (newPassword === currentPassword) {
      setPasswordError("Mật khẩu mới phải khác mật khẩu hiện tại.");
      return;
    }

    setPasswordSaving(true);
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user || !user.email) throw new Error("Không tìm thấy phiên đăng nhập.");

      // Firebase yêu cầu xác thực lại (reauthenticate) trước khi đổi mật khẩu
      // vì đây là thao tác nhạy cảm, tránh trường hợp phiên đăng nhập cũ bị chiếm dụng.
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      await updatePassword(user, newPassword);

      setPasswordSuccess("Đã đổi mật khẩu thành công!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setIsChangingPassword(false);
    } catch (err) {
      setPasswordError(translatePasswordError(err.code, err.message));
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleCancelChangePassword = () => {
    setIsChangingPassword(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordError("");
  };

  const handleLogout = async () => {
    try {
      await logout();
      onClose();
    } catch (err) {
      setError(err.message || "Không thể đăng xuất. Vui lòng thử lại.");
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass-panel animate-rise w-full max-w-sm bg-ink-light p-6"
      >
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-cloud">Cài đặt tài khoản</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-mist transition hover:text-warn"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Avatar */}
        <div className="mb-6 flex flex-col items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-signal/20 font-data text-2xl font-semibold text-signal">
            {avatarLetter}
          </div>
        </div>

        {/* Email (readonly) */}
        <div className="mb-4">
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-mist">
            Email
          </label>
          <input
            type="email"
            value={email}
            readOnly
            disabled
            className="w-full cursor-not-allowed rounded-lg border border-slate-border/70 bg-ink/30 px-3 py-2.5 text-sm text-mist"
          />
        </div>

        {/* Display Name (editable) */}
        <div className="mb-2">
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-mist">
            Tên hiển thị
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              readOnly={!isEditing}
              placeholder="Nhập tên hiển thị của bạn"
              className={`w-full rounded-lg border px-3 py-2.5 text-sm text-cloud placeholder:text-mist transition ${
                isEditing
                  ? "border-signal/60 bg-ink/50"
                  : "cursor-default border-slate-border/70 bg-ink/30"
              }`}
            />
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                title="Chỉnh sửa tên hiển thị"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-border/70 text-mist transition hover:border-signal/60 hover:text-signal"
              >
                <Pencil className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={handleSave}
                disabled={saving}
                title="Lưu tên hiển thị"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-signal/60 text-signal transition hover:bg-signal/10 disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              </button>
            )}
          </div>
          {isEditing && (
            <button
              onClick={handleCancelEdit}
              disabled={saving}
              className="mt-2 text-xs text-mist transition hover:text-warn disabled:opacity-50"
            >
              Hủy chỉnh sửa
            </button>
          )}
        </div>

        {error && (
          <p className="mt-3 rounded-lg border border-warn/40 bg-warn/10 px-3 py-2 text-xs text-warn">
            {error}
          </p>
        )}
        {successMsg && (
          <p className="mt-3 rounded-lg border border-signal/40 bg-signal/10 px-3 py-2 text-xs text-signal">
            {successMsg}
          </p>
        )}

        {/* Đổi mật khẩu */}
        <div className="mt-6 border-t border-slate-border/50 pt-5">
          {!hasPasswordProvider ? (
            <p className="rounded-lg border border-slate-border/50 bg-ink/30 px-3 py-2.5 text-xs text-mist">
              Tài khoản của bạn đăng nhập qua Google, không có mật khẩu để đổi tại đây.
            </p>
          ) : !isChangingPassword ? (
            <button
              onClick={() => setIsChangingPassword(true)}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-border/70 py-2.5 text-sm font-medium text-cloud transition hover:border-signal/60 hover:text-signal"
            >
              <KeyRound className="h-4 w-4" />
              Đổi mật khẩu
            </button>
          ) : (
            <form onSubmit={handleChangePassword} className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-sm font-semibold text-cloud">Đổi mật khẩu</h3>
                <button
                  type="button"
                  onClick={() => setShowPasswords((prev) => !prev)}
                  title={showPasswords ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  className="flex h-7 w-7 items-center justify-center rounded-full text-mist transition hover:text-signal"
                >
                  {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              <input
                type={showPasswords ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Mật khẩu hiện tại"
                autoComplete="current-password"
                className="w-full rounded-lg border border-slate-border/70 bg-ink/50 px-3 py-2.5 text-sm text-cloud placeholder:text-mist focus:border-signal/60"
              />
              <input
                type={showPasswords ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mật khẩu mới (tối thiểu 6 ký tự)"
                autoComplete="new-password"
                className="w-full rounded-lg border border-slate-border/70 bg-ink/50 px-3 py-2.5 text-sm text-cloud placeholder:text-mist focus:border-signal/60"
              />
              <input
                type={showPasswords ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Xác nhận mật khẩu mới"
                autoComplete="new-password"
                className="w-full rounded-lg border border-slate-border/70 bg-ink/50 px-3 py-2.5 text-sm text-cloud placeholder:text-mist focus:border-signal/60"
              />

              {passwordError && (
                <p className="rounded-lg border border-warn/40 bg-warn/10 px-3 py-2 text-xs text-warn">
                  {passwordError}
                </p>
              )}
              {passwordSuccess && (
                <p className="rounded-lg border border-signal/40 bg-signal/10 px-3 py-2 text-xs text-signal">
                  {passwordSuccess}
                </p>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCancelChangePassword}
                  disabled={passwordSaving}
                  className="flex-1 rounded-lg border border-slate-border/70 py-2.5 text-sm font-medium text-mist transition hover:text-cloud disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={passwordSaving}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-amber py-2.5 text-sm font-semibold text-ink transition hover:bg-amber-soft disabled:opacity-60"
                >
                  {passwordSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                  Lưu mật khẩu mới
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Logout */}
        <div className="mt-4 border-t border-slate-border/50 pt-5">
          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-warn/40 py-2.5 text-sm font-semibold text-warn transition hover:bg-warn/10"
          >
            <LogOut className="h-4 w-4" />
            Đăng xuất
          </button>
        </div>
      </div>
    </div>
  );
}
function translatePasswordError(code = "", fallbackMsg = "") {
  switch (code) {
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Mật khẩu hiện tại không đúng.";
    case "auth/weak-password":
      return "Mật khẩu mới quá yếu (tối thiểu 6 ký tự).";
    case "auth/too-many-requests":
      return "Bạn đã thử quá nhiều lần. Vui lòng thử lại sau ít phút.";
    case "auth/requires-recent-login":
      return "Phiên đăng nhập đã cũ, vui lòng đăng xuất và đăng nhập lại trước khi đổi mật khẩu.";
    case "auth/user-mismatch":
    case "auth/user-not-found":
      return "Không xác thực được tài khoản. Vui lòng đăng nhập lại.";
    default:
      return fallbackMsg || "Không thể đổi mật khẩu. Vui lòng thử lại.";
  }
}