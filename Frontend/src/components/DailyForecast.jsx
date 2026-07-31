// src/components/DailyForecast.jsx
import React from "react";
import { Sun, Cloud, CloudRain, CloudSnow, CloudFog, Moon, Droplet } from "lucide-react";
import { mapWeatherToIconKey } from "../utils/sky";

const ICONS = { sun: Sun, cloud: Cloud, rain: CloudRain, snow: CloudSnow, fog: CloudFog, night: Moon };

const WEEKDAYS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

function formatDay(dt, idx) {
  if (idx === 0) return "Hôm nay";
  const d = new Date(dt * 1000);
  return WEEKDAYS[d.getDay()];
}

export default function DailyForecast({ daily, unit = "C", convertTemp }) {
  if (!daily || daily.length === 0) return null;

  const toDisplayTemp = convertTemp || ((c) => Math.round(c));

  const globalMin = Math.min(...daily.map((d) => d.tempMin));
  const globalMax = Math.max(...daily.map((d) => d.tempMax));
  const globalRange = globalMax - globalMin || 1;

  return (
    <div className="glass-panel animate-rise p-6">
      <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-mist">
        Dự báo {daily.length} ngày tới
      </h3>

      <div className="mt-4 flex flex-col divide-y divide-slate-border/40">
        {daily.map((d, idx) => {
          const iconKey = mapWeatherToIconKey(d.description, d.icon);
          const Icon = ICONS[iconKey] || Sun;

          const leftPct = ((d.tempMin - globalMin) / globalRange) * 100;
          const widthPct = ((d.tempMax - d.tempMin) / globalRange) * 100;

          return (
            <div
              key={d.dt ?? idx}
              className="flex items-center justify-between gap-3 py-3 text-sm"
            >
              {/* Cột 1: Thứ & Icon */}
              <div className="flex items-center gap-3 w-28 shrink-0">
                <span className="font-data w-16 text-cloud truncate">{formatDay(d.dt, idx)}</span>
                <Icon className="h-5 w-5 text-amber shrink-0" strokeWidth={1.5} />
              </div>

              {/* Cột 2: Nhiệt độ Min + Thanh Bar + Nhiệt độ Max (Tự co giãn ở giữa) */}
              <div className="flex items-center gap-2 flex-1 max-w-md mx-2">
                <span className="w-9 text-right font-data text-xs text-mist shrink-0">
                  {toDisplayTemp(d.tempMin)}°{unit}
                </span>
                <div className="relative h-1.5 flex-1 rounded-full bg-ink/60 overflow-hidden">
                  <div
                    className="absolute h-1.5 rounded-full bg-gradient-to-r from-rain to-amber"
                    style={{
                      left: `${leftPct}%`,
                      width: `${Math.max(widthPct, 8)}%`,
                    }}
                  />
                </div>
                <span className="w-9 font-data text-xs text-cloud shrink-0">
                  {toDisplayTemp(d.tempMax)}°{unit}
                </span>
              </div>

              {/* Cột 3: Tỷ lệ mưa */}
              <div className="flex items-center justify-end gap-1 w-14 shrink-0 text-xs text-signal">
                <Droplet className="h-3 w-3 shrink-0" />
                <span>{Math.round((d.pop ?? 0) * 100)}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}