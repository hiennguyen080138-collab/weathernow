// src/utils/sky.js
// Ánh xạ mã/description thời tiết (kiểu OpenWeather) sang icon key nội bộ
// dùng chung cho CurrentWeather, HourlyForecast, DailyForecast.

/**
 * @param {string} description  Mô tả thời tiết (vd: "clear sky", "light rain"...)
 * @param {string} icon         Icon code trả về từ API (vd: "01d", "10n"...)
 * @returns {"sun"|"cloud"|"rain"|"snow"|"fog"|"night"}
 */
export function mapWeatherToIconKey(description = "", icon = "") {
  const isNight = icon.endsWith("n");
  const text = description.toLowerCase();

  if (text.includes("thunder") || text.includes("rain") || text.includes("drizzle")) {
    return "rain";
  }
  if (text.includes("snow") || text.includes("sleet")) {
    return "snow";
  }
  if (text.includes("fog") || text.includes("mist") || text.includes("haze") || text.includes("smoke")) {
    return "fog";
  }
  if (text.includes("cloud")) {
    return "cloud";
  }
  if (isNight) {
    return "night";
  }
  return "sun";
}

/**
 * Trả về nhãn buổi trong ngày theo giờ hiện tại của trình duyệt.
 * @returns {string}
 */
export function getDayPeriodLabel() {
  const hour = new Date().getHours();
  if (hour < 5) return "Đêm khuya";
  if (hour < 11) return "Buổi sáng";
  if (hour < 13) return "Buổi trưa";
  if (hour < 18) return "Buổi chiều";
  if (hour < 22) return "Buổi tối";
  return "Đêm khuya";
}