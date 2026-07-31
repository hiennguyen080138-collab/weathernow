// src/components/CurrentWeather.jsx
import React, { useState } from "react";
import {
  Heart,
  Droplets,
  Wind,
  Gauge,
  Eye,
  Sunrise,
  Sunset,
  Sun,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudFog,
  Moon,
  Loader2,
} from "lucide-react";
import { mapWeatherToIconKey, getDayPeriodLabel } from "../utils/sky";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const ICONS = {
  sun: Sun,
  cloud: Cloud,
  rain: CloudRain,
  snow: CloudSnow,
  fog: CloudFog,
  night: Moon,
};

// Phân loại mức AQI theo đúng thang của OpenWeatherMap (1 = Tốt -> 5 = Rất kém)
// Lưu ý: KHÔNG dùng thang US AQI (0-500) vì /data/2.5/air_pollution của OpenWeatherMap
// trả về thang riêng 1-5, quy đổi sai thang sẽ khiến mọi mức AQI bị hiển thị nhầm.
const AQI_LEVELS = {
  1: { label: "Tốt", color: "text-emerald-300", bg: "bg-emerald-500/15", ring: "border-emerald-500/40" },
  2: { label: "Khá", color: "text-lime-300", bg: "bg-lime-500/15", ring: "border-lime-500/40" },
  3: { label: "Trung bình", color: "text-amber-300", bg: "bg-amber-500/15", ring: "border-amber-500/40" },
  4: { label: "Kém", color: "text-orange-300", bg: "bg-orange-500/15", ring: "border-orange-500/40" },
  5: { label: "Rất kém", color: "text-red-300", bg: "bg-red-500/15", ring: "border-red-500/40" },
};

function getAqiInfo(aqi, aqiLabel) {
  const level = AQI_LEVELS[aqi];
  if (!level) {
    return { label: "Không có dữ liệu", color: "text-mist", bg: "bg-slate-border/30", ring: "border-slate-border/60" };
  }
  // Ưu tiên label backend trả về (aqiLabel), fallback về bảng map cục bộ nếu thiếu
  return { ...level, label: aqiLabel || level.label };
}

function formatClockTime(unixSeconds) {
  if (!unixSeconds) return "—";
  const d = new Date(unixSeconds * 1000);
  return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

export default function CurrentWeather({
  weather,
  isFavorite,
  onToggleFavorite,
  favoriteLoading,
  unit = "C",
  convertTemp,
}) {
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false); // State loading nội bộ cho nút trái tim

  if (!weather) return null;

  const { location, current } = weather;
  const iconKey = mapWeatherToIconKey(current.description, current.icon);
  const Icon = ICONS[iconKey] || Sun;

  // Hàm quy đổi mặc định nếu không được truyền từ App.jsx
  const toDisplayTemp = convertTemp || ((c) => Math.round(c));

  const aqiInfo = getAqiInfo(current.aqi, current.aqiLabel);

  const handleFavoriteClick = async () => {
    if (loading || favoriteLoading) return;
    setLoading(true);

    try {
      if (isFavorite) {
        const res = await api.get("/favorites");
        const favList = res.data?.data || [];
        const currentFav = favList.find(
          (item) => item.cityName?.toLowerCase() === location?.name?.toLowerCase()
        );

        if (currentFav?.id) {
          await api.delete(`/favorites/${currentFav.id}`);
        }
      } else {
        await api.post("/favorites", {
          cityName: location.name,
          lat: location.lat,
          lon: location.lon,
        });
      }

      if (onToggleFavorite) {
        onToggleFavorite();
      }
    } catch (error) {
      console.error("Lỗi cập nhật danh sách yêu thích:", error);
      alert(error.message || "Không thể cập nhật danh sách yêu thích!");
    } finally {
      setLoading(false);
    }
  };

  const isBtnDisabled = loading || favoriteLoading;

  return (
    <div className="glass-panel animate-rise relative overflow-hidden p-6 sm:p-8">
      {/* Ambient icon decoration */}
      <Icon
        className="pointer-events-none absolute -right-6 -top-6 h-40 w-40 text-cloud/5 animate-drift"
        strokeWidth={1}
      />

      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-display text-2xl font-semibold text-cloud sm:text-3xl">
              {location?.name || "—"}
              {location?.country ? `, ${location.country}` : ""}
            </p>
            {isAuthenticated && (
              <button
                onClick={handleFavoriteClick}
                disabled={isBtnDisabled}
                title={isFavorite ? "Bỏ khỏi yêu thích" : "Thêm vào yêu thích"}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-border/70 transition hover:border-warn/60 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-warn" />
                ) : (
                  <Heart
                    className={`h-4 w-4 transition ${
                      isFavorite ? "fill-warn text-warn" : "text-mist"
                    }`}
                  />
                )}
              </button>
            )}
          </div>
          <p className="mt-1 text-sm text-mist">
            {getDayPeriodLabel()} · {current.description}
          </p>

          <div className="mt-6 flex items-end gap-3">
            <span className="font-data text-6xl font-medium tabular-nums text-cloud sm:text-7xl">
              {toDisplayTemp(current.temp)}°{unit}
            </span>
            <span className="mb-2 font-data text-sm text-mist">
              Cảm giác như {toDisplayTemp(current.feelsLike)}°{unit}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-center rounded-xl border border-slate-border/60 bg-ink/40 p-6">
          <Icon className="h-16 w-16 text-amber" strokeWidth={1.25} />
        </div>
      </div>

      {/* Thẻ AQI (bỏ thẻ UV vì free tier /data/2.5 không có nguồn UV thật) */}
      <div className="relative mt-6">
        <div className={`flex items-center justify-between gap-3 rounded-xl border ${aqiInfo.ring} ${aqiInfo.bg} px-4 py-3`}>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-mist">Chất lượng không khí</p>
            <p className={`mt-0.5 font-display text-lg font-semibold ${aqiInfo.color}`}>
              {aqiInfo.label}
            </p>
          </div>
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border ${aqiInfo.ring} font-data text-sm font-semibold ${aqiInfo.color}`}>
            {current.aqi ?? "—"}
          </div>
        </div>
      </div>

      {/* Lưới 6 thông số chi tiết */}
      <div className="relative mt-6 grid grid-cols-2 gap-3 border-t border-slate-border/50 pt-6 sm:grid-cols-3">
        <StatItem icon={Droplets} label="Độ ẩm" value={`${current.humidity ?? "—"}%`} />
        <StatItem icon={Wind} label="Tốc độ gió" value={`${current.windSpeed ?? "—"} m/s`} />
        <StatItem icon={Gauge} label="Áp suất" value={`${current.pressure ?? "—"} hPa`} />
        <StatItem icon={Eye} label="Tầm nhìn xa" value={current.visibility != null ? `${current.visibility} km` : "—"} />
        <StatItem icon={Sunrise} label="Mặt trời mọc" value={formatClockTime(current.sunrise)} />
        <StatItem icon={Sunset} label="Mặt trời lặn" value={formatClockTime(current.sunset)} />
      </div>
    </div>
  );
}

function StatItem({ icon: Icon, label, value }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl border border-slate-border/40 bg-ink/20 py-3 text-center sm:flex-row sm:justify-center sm:gap-2 sm:bg-transparent sm:border-none sm:py-0">
      <Icon className="h-4 w-4 text-signal" strokeWidth={1.75} />
      <div className="flex flex-col items-center sm:items-start sm:flex-row sm:gap-1.5">
        <span className="font-data text-sm text-cloud">{value}</span>
        <span className="text-xs text-mist">{label}</span>
      </div>
    </div>
  );
}