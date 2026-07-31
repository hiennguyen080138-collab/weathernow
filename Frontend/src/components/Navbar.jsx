// src/components/Navbar.jsx
import React, { useState } from "react";
import { Search, LocateFixed, Heart, ShieldCheck, CloudSun } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Navbar({
  onSearch,
  onUseGeolocation,
  onOpenAuth,
  onOpenFavorites,
  onOpenAdmin,
  onOpenUserSettings,
  unit,
  onToggleUnit,
}) {
  const { currentUser, userRole, isAuthenticated } = useAuth();
  const [query, setQuery] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) onSearch(query.trim());
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-border/50 bg-ink/70 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3 sm:gap-6 sm:px-6">
        {/* Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <CloudSun className="h-6 w-6 text-amber" strokeWidth={1.75} />
          <span className="font-display text-lg font-semibold tracking-tight text-cloud">
            WeatherCast
          </span>
        </div>

        {/* Search */}
        <form onSubmit={handleSubmit} className="flex min-w-[200px] flex-1 items-center gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mist" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              type="text"
              placeholder="Tìm thành phố (vd: Hồ Chí Minh)"
              className="w-full rounded-full border border-slate-border/70 bg-slate-surface/60 py-2 pl-9 pr-3 text-sm text-cloud placeholder:text-mist focus:border-signal/60"
            />
          </div>
          <button
            type="button"
            onClick={onUseGeolocation}
            title="Dùng vị trí hiện tại"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-border/70 bg-slate-surface/60 text-mist transition hover:text-signal"
          >
            <LocateFixed className="h-4 w-4" />
          </button>
        </form>

        {/* Right actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Bộ chuyển đổi đơn vị °C / °F */}
          <div className="flex items-center rounded-full border border-slate-border/70 bg-slate-surface/60 p-0.5 text-xs font-semibold">
            <button
              type="button"
              onClick={() => unit !== "C" && onToggleUnit()}
              title="Độ C"
              className={`rounded-full px-2.5 py-1.5 transition ${
                unit === "C" ? "bg-amber text-ink" : "text-mist hover:text-cloud"
              }`}
            >
              °C
            </button>
            <button
              type="button"
              onClick={() => unit !== "F" && onToggleUnit()}
              title="Độ F"
              className={`rounded-full px-2.5 py-1.5 transition ${
                unit === "F" ? "bg-amber text-ink" : "text-mist hover:text-cloud"
              }`}
            >
              °F
            </button>
          </div>

          {!isAuthenticated && (
            <>
              <button
                onClick={() => onOpenAuth("login")}
                className="rounded-full px-4 py-2 text-sm font-medium text-cloud transition hover:text-signal"
              >
                Đăng nhập
              </button>
              <button
                onClick={() => onOpenAuth("register")}
                className="rounded-full bg-amber px-4 py-2 text-sm font-semibold text-ink transition hover:bg-amber-soft"
              >
                Đăng ký
              </button>
            </>
          )}

          {isAuthenticated && (
            <>
              {/* Chỉ hiển thị nút Admin Panel khi userRole === 'admin' */}
              {userRole === "admin" && (
                <button
                  onClick={onOpenAdmin}
                  title="Quản trị"
                  className="flex items-center gap-1.5 rounded-full border border-slate-border/70 px-3 py-2 text-sm text-cloud transition hover:border-signal/60 hover:text-signal"
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span className="hidden sm:inline">Quản trị</span>
                </button>
              )}

              <button
                onClick={onOpenFavorites}
                title="Địa điểm yêu thích"
                className="flex items-center gap-1.5 rounded-full border border-slate-border/70 px-3 py-2 text-sm text-cloud transition hover:border-warn/60 hover:text-warn"
              >
                <Heart className="h-4 w-4" />
                <span className="hidden sm:inline">Yêu thích</span>
              </button>

              {/* Avatar / Email -> mở UserSettingsModal */}
              <button
                onClick={onOpenUserSettings}
                title="Cài đặt tài khoản"
                className="hidden items-center gap-2 rounded-full border border-slate-border/70 px-3 py-1.5 transition hover:border-signal/60 sm:flex"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-signal/20 font-data text-xs text-signal">
                  {(currentUser?.displayName || currentUser?.email || "U")[0].toUpperCase()}
                </div>
                <span className="max-w-[140px] truncate font-data text-xs text-mist">
                  {currentUser?.displayName || currentUser?.email}
                </span>
                {userRole === "admin" && (
                  <span className="rounded-full bg-amber/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber">
                    Admin
                  </span>
                )}
              </button>

              {/* Avatar rút gọn cho mobile */}
              <button
                onClick={onOpenUserSettings}
                title="Cài đặt tài khoản"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-border/70 bg-signal/20 font-data text-xs text-signal transition hover:border-signal/60 sm:hidden"
              >
                {(currentUser?.displayName || currentUser?.email || "U")[0].toUpperCase()}
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}