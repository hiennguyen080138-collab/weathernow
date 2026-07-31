// src/components/AdminPanel.jsx
import React, { useEffect, useState, useCallback } from "react";
import { X, ShieldCheck, Loader2, Search } from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function AdminPanel({ open, onClose }) {
  const { refreshToken } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [targetUid, setTargetUid] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [filter, setFilter] = useState("");

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/admin/users");
      setUsers(data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) fetchUsers();
  }, [open, fetchUsers]);

  const handleSetAdmin = async (e) => {
    e.preventDefault();
    if (!targetUid.trim()) return;
    setSubmitting(true);
    setError("");
    setSuccessMsg("");
    try {
      await api.post("/admin/set-admin", { targetUid: targetUid.trim() });
      setSuccessMsg(`Đã cấp quyền Admin cho UID: ${targetUid.trim()}`);
      setTargetUid("");
      fetchUsers();
      // Nếu admin vừa tự cấp quyền cho chính mình, làm mới token ngay
      refreshToken();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  const filteredUsers = users.filter(
    (u) =>
      !filter ||
      u.uid?.toLowerCase().includes(filter.toLowerCase()) ||
      u.email?.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="glass-panel animate-rise flex max-h-[85vh] w-full max-w-3xl flex-col bg-ink-light p-6">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-amber" />
            <h2 className="font-display text-lg font-semibold text-cloud">Bảng quản trị</h2>
          </div>
          <button onClick={onClose} className="text-mist hover:text-warn">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Cấp quyền admin */}
        <form onSubmit={handleSetAdmin} className="mb-5 flex flex-col gap-2 sm:flex-row">
          <input
            value={targetUid}
            onChange={(e) => setTargetUid(e.target.value)}
            placeholder="Nhập Target UID cần cấp quyền Admin"
            className="flex-1 rounded-lg border border-slate-border/70 bg-ink/50 px-3 py-2.5 text-sm text-cloud placeholder:text-mist focus:border-signal/60"
          />
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center justify-center gap-2 rounded-lg bg-amber px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-amber-soft disabled:opacity-60"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Cấp quyền Admin
          </button>
        </form>

        {successMsg && (
          <p className="mb-3 rounded-lg border border-signal/40 bg-signal/10 px-3 py-2 text-xs text-signal">
            {successMsg}
          </p>
        )}
        {error && (
          <p className="mb-3 rounded-lg border border-warn/40 bg-warn/10 px-3 py-2 text-xs text-warn">
            {error}
          </p>
        )}

        {/* Filter */}
        <div className="relative mb-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mist" />
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Lọc theo UID hoặc email..."
            className="w-full rounded-lg border border-slate-border/70 bg-ink/50 py-2 pl-9 pr-3 text-sm text-cloud placeholder:text-mist focus:border-signal/60"
          />
        </div>

        {/* Bảng users */}
        <div className="flex-1 overflow-auto rounded-lg border border-slate-border/50">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-mist">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Đang tải danh sách người dùng...</span>
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-slate-surface text-xs uppercase tracking-wide text-mist">
                <tr>
                  <th className="px-4 py-2.5 font-medium">UID</th>
                  <th className="px-4 py-2.5 font-medium">Email</th>
                  <th className="px-4 py-2.5 font-medium">Vai trò</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-border/40">
                {filteredUsers.map((u) => (
                  <tr key={u.uid} className="hover:bg-ink/30">
                    <td className="px-4 py-2.5 font-data text-xs text-mist">
                      <button
                        onClick={() => setTargetUid(u.uid)}
                        title="Bấm để điền UID vào ô cấp quyền"
                        className="truncate hover:text-signal"
                      >
                        {u.uid}
                      </button>
                    </td>
                    <td className="px-4 py-2.5 text-cloud">{u.email || "—"}</td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
                          u.role === "admin"
                            ? "bg-amber/20 text-amber"
                            : "bg-signal/10 text-signal"
                        }`}
                      >
                        {u.role || "user"}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-sm text-mist">
                      Không có người dùng nào khớp.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}