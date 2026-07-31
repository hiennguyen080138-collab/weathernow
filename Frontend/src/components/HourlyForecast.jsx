// src/components/HourlyForecast.jsx
import React, { useMemo } from "react";
import { Sun, Cloud, CloudRain, CloudSnow, CloudFog, Moon, Droplet } from "lucide-react";
import { mapWeatherToIconKey } from "../utils/sky";

const ICONS = { sun: Sun, cloud: Cloud, rain: CloudRain, snow: CloudSnow, fog: CloudFog, night: Moon };

function formatHour(dt) {
  const d = new Date(dt * 1000);
  return d.getHours().toString().padStart(2, "0") + "h";
}

export default function HourlyForecast({ hourly, unit = "C", convertTemp }) {
  const toDisplayTemp = convertTemp || ((c) => Math.round(c));

  // Hiển thị chuỗi mốc giờ liên tục trong 24h tới (tối đa 24 điểm dữ liệu)
  const points = useMemo(() => {
    if (!hourly || hourly.length === 0) return [];
    return hourly.slice(0, 24);
  }, [hourly]);

  const tracePath = useMemo(() => {
    if (points.length < 2) return "";
    const temps = points.map((p) => p.temp);
    const min = Math.min(...temps);
    const max = Math.max(...temps);
    const range = max - min || 1;

    const stepX = 100 / (points.length - 1);
    const coords = temps.map((t, i) => {
      const x = i * stepX;
      const y = 32 - ((t - min) / range) * 28 - 2; // vùng vẽ cao 32, chừa lề
      return [x, y];
    });

    return coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  }, [points]);

  if (points.length === 0) return null;

  return (
    <div className="glass-panel animate-rise p-6">
      <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-mist">
        Dự báo {points.length} giờ tới
      </h3>

      {/* Barometer trace signature */}
      <div className="relative mt-4 h-8 w-full">
        <svg viewBox="0 0 100 32" preserveAspectRatio="none" className="h-full w-full overflow-visible">
          <path d={tracePath} fill="none" stroke="#49C6B9" strokeWidth="0.6" vectorEffect="non-scaling-stroke" />
        </svg>
      </div>

      <div className="hourly-scroll mt-2 flex gap-2 overflow-x-auto scroll-smooth pb-3">
        {points.map((p, idx) => {
          const iconKey = mapWeatherToIconKey(p.description, p.icon);
          const Icon = ICONS[iconKey] || Sun;
          return (
            <div
              key={p.dt ?? idx}
              className="flex min-w-[76px] shrink-0 flex-col items-center gap-2 rounded-xl border border-slate-border/50 bg-ink/30 px-3 py-4 snap-start"
            >
              <span className="font-data text-xs text-mist">{formatHour(p.dt)}</span>
              <Icon className="h-6 w-6 text-amber" strokeWidth={1.5} />
              <span className="font-data text-lg text-cloud">
                {toDisplayTemp(p.temp)}°{unit}
              </span>
              <span className="flex items-center gap-1 text-[11px] text-signal">
                <Droplet className="h-3 w-3" />
                {Math.round((p.pop ?? 0) * 100)}%
              </span>
            </div>
          );
        })}
      </div>

      {/* Scrollbar gọn gàng cho cả Mobile & Desktop */}
      <style>{`
        .hourly-scroll {
          scroll-snap-type: x proximity;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: thin;
          scrollbar-color: rgba(148, 163, 184, 0.4) transparent;
        }
        .hourly-scroll::-webkit-scrollbar {
          height: 6px;
        }
        .hourly-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .hourly-scroll::-webkit-scrollbar-thumb {
          background-color: rgba(148, 163, 184, 0.35);
          border-radius: 9999px;
        }
        .hourly-scroll::-webkit-scrollbar-thumb:hover {
          background-color: rgba(148, 163, 184, 0.55);
        }
      `}</style>
    </div>
  );
}