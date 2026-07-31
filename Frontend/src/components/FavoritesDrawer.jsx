// src/components/FavoritesDrawer.jsx
import React, { useEffect, useState, useCallback } from "react";
import { X, MapPin, Trash2, Loader2 } from "lucide-react";
import api from "../services/api";

export default function FavoritesDrawer({ open, onClose, onSelectCity, refreshKey }) {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  const fetchFavorites = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/favorites");
      setFavorites(data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) fetchFavorites();
  }, [open, refreshKey, fetchFavorites]);

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await api.delete(`/favorites/${id}`);
      setFavorites((prev) => prev.filter((f) => f.id !== id));
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Panel */}
      <aside
        className={`fixed right-0 top-0 z-50 h-full w-full max-w-sm border-l border-slate-border/60 bg-ink-light shadow-glass transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-border/50 px-5 py-4">
          <h2 className="font-display text-lg font-semibold text-cloud">Địa điểm yêu thích</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-mist hover:text-warn"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="h-[calc(100%-64px)] overflow-y-auto px-5 py-4">
          {loading && (
            <div className="flex items-center justify-center gap-2 py-10 text-mist">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Đang tải...</span>
            </div>
          )}

          {!loading && error && (
            <p className="rounded-lg border border-warn/40 bg-warn/10 px-3 py-2 text-sm text-warn">
              {error}
            </p>
          )}

          {!loading && !error && favorites.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-14 text-center text-mist">
              <MapPin className="h-8 w-8 opacity-40" />
              <p className="text-sm">Chưa có địa điểm yêu thích nào.</p>
              <p className="text-xs">Nhấn biểu tượng trái tim ở màn hình chính để lưu.</p>
            </div>
          )}

          <ul className="flex flex-col gap-2">
            {favorites.map((fav) => (
              <li
                key={fav.id}
                className="group flex items-center justify-between rounded-xl border border-slate-border/50 bg-slate-surface/40 px-4 py-3 transition hover:border-signal/50"
              >
                <button
                  onClick={() => {
                    onSelectCity(fav);
                    onClose();
                  }}
                  className="flex flex-1 items-center gap-2 text-left"
                >
                  <MapPin className="h-4 w-4 shrink-0 text-signal" />
                  <span className="truncate text-sm text-cloud">{fav.cityName}</span>
                </button>
                <button
                  onClick={() => handleDelete(fav.id)}
                  disabled={deletingId === fav.id}
                  title="Xóa khỏi yêu thích"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-mist opacity-0 transition group-hover:opacity-100 hover:text-warn disabled:opacity-50"
                >
                  {deletingId === fav.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </>
  );
}