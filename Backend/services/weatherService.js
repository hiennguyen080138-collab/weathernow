/**
 * services/weatherService.js
 * Gọi OpenWeatherMap API (CHỈ dùng các endpoint /data/2.5 free tier), có cache để giảm số lượt gọi.
 *
 * Các endpoint OpenWeatherMap sử dụng:
 * - /data/2.5/weather        -> thời tiết hiện tại (kèm sẵn visibility, sys.sunrise/sunset)
 * - /data/2.5/forecast       -> dự báo 3h/5 ngày (list) -> dùng cho hourly24h + daily7d
 * - /data/2.5/air_pollution  -> chỉ số AQI (thang riêng của OpenWeatherMap: 1-5)
 * - /geo/1.0/direct          -> chuyển tên thành phố -> lat/lon
 *
 * LƯU Ý VỀ UV INDEX: OpenWeatherMap đã khai tử hoàn toàn /data/2.5/uvi từ 1/4/2021.
 * Từ thời điểm đó, chỉ số UV real-time CHỈ còn nằm trong One Call API (yêu cầu subscription
 * riêng, không phải free tier /2.5). Vì dự án này chỉ dùng free tier /2.5, service này
 * KHÔNG trả trường UV Index nữa (frontend cũng đã bỏ card UV khỏi UI) thay vì hiển thị
 * "Không có dữ liệu" vĩnh viễn một cách vô nghĩa.
 */

const axios = require("axios");
const cache = require("../config/cache");

const API_KEY = process.env.OPENWEATHER_API_KEY;
const BASE_URL = process.env.OPENWEATHER_BASE_URL || "https://api.openweathermap.org/data/2.5";
const GEO_URL = process.env.OPENWEATHER_GEO_URL || "https://api.openweathermap.org/geo/1.0";

const CACHE_TTL = parseInt(process.env.CACHE_TTL_SECONDS, 10) || 900;

// Thang AQI của OpenWeatherMap là 1 (Tốt) -> 5 (Rất xấu). Map sang nhãn tiếng Việt
// để backend trả về sẵn label thống nhất, tránh frontend phải tự đoán thang đo.
const AQI_LABELS = {
  1: "Tốt",
  2: "Khá",
  3: "Trung bình",
  4: "Kém",
  5: "Rất kém",
};

/**
 * Chuyển tên thành phố sang lat/lon bằng Geocoding API
 */
async function geocodeCity(cityName) {
  const cacheKey = `geo_${cityName.toLowerCase()}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const { data } = await axios.get(`${GEO_URL}/direct`, {
    params: { q: cityName, limit: 1, appid: API_KEY },
  });

  if (!data || data.length === 0) {
    const err = new Error(`Không tìm thấy thành phố: ${cityName}`);
    err.statusCode = 404;
    throw err;
  }

  const result = { lat: data[0].lat, lon: data[0].lon, name: data[0].name, country: data[0].country };
  cache.set(cacheKey, result, 60 * 60 * 24); // cache địa lý 24h vì hiếm khi đổi
  return result;
}

/**
 * Chuẩn hoá 1 object "current weather" thô từ /data/2.5/weather thành field
 * đúng tên mà frontend (CurrentWeather.jsx) đang đọc.
 */
function mapCurrentPayload(data) {
  return {
    temp: data.main?.temp,
    feelsLike: data.main?.feels_like,
    humidity: data.main?.humidity,
    pressure: data.main?.pressure,
    windSpeed: data.wind?.speed,
    // OpenWeatherMap trả visibility theo mét -> đổi sang km cho khớp UI
    visibility: data.visibility != null ? Math.round((data.visibility / 1000) * 10) / 10 : null,
    // sunrise/sunset nằm trong data.sys, không phải top-level -> đây chính là lỗi "sai tên thuộc tính"
    sunrise: data.sys?.sunrise ?? null,
    sunset: data.sys?.sunset ?? null,
    description: data.weather?.[0]?.description,
    icon: data.weather?.[0]?.icon,
    dt: data.dt,
  };
}

/**
 * Lấy dữ liệu thời tiết hiện tại (dùng cho Guest)
 */
async function getCurrentWeather(lat, lon) {
  const { data } = await axios.get(`${BASE_URL}/weather`, {
    params: { lat, lon, appid: API_KEY, units: "metric", lang: "vi" },
  });

  return {
    location: {
      name: data.name,
      country: data.sys?.country,
      lat: data.coord?.lat,
      lon: data.coord?.lon,
    },
    current: mapCurrentPayload(data),
  };
}

/**
 * Lấy chỉ số chất lượng không khí AQI
 */
async function getAirQuality(lat, lon) {
  const { data } = await axios.get(`${BASE_URL}/air_pollution`, {
    params: { lat, lon, appid: API_KEY },
  });

  const item = data?.list?.[0];
  if (!item) return null;

  const aqi = item.main?.aqi ?? null; // 1 (Tốt) -> 5 (Rất xấu)

  return {
    aqi,
    aqiLabel: aqi != null ? AQI_LABELS[aqi] || null : null,
    components: item.components,
  };
}

/**
 * Lấy dự báo 24h + 5-7 ngày từ /data/2.5/forecast (free tier, response dạng { list: [...] })
 */
async function getForecast(lat, lon) {
  const { data } = await axios.get(`${BASE_URL}/forecast`, {
    params: { lat, lon, appid: API_KEY, units: "metric", lang: "vi" },
  });

  const list = data.list || [];

  // Lấy 8 mốc tiếp theo (mỗi mốc cách nhau 3h => ~24h)
  const hourly24h = list.slice(0, 8).map((item) => ({
    dt: item.dt,
    temp: item.main?.temp,
    feelsLike: item.main?.feels_like,
    humidity: item.main?.humidity,
    pop: item.pop,
    description: item.weather?.[0]?.description,
    icon: item.weather?.[0]?.icon,
  }));

  // Gom theo ngày: lấy tempMin/tempMax thật sự trong ngày thay vì chỉ 1 mốc mỗi 24h
  const dailyMap = new Map();
  for (const item of list) {
    const dayKey = new Date(item.dt * 1000).toISOString().slice(0, 10);
    if (!dailyMap.has(dayKey)) {
      dailyMap.set(dayKey, {
        dt: item.dt,
        tempMin: item.main?.temp_min,
        tempMax: item.main?.temp_max,
        humidity: item.main?.humidity,
        pop: item.pop,
        description: item.weather?.[0]?.description,
        icon: item.weather?.[0]?.icon,
      });
    } else {
      const entry = dailyMap.get(dayKey);
      entry.tempMin = Math.min(entry.tempMin, item.main?.temp_min ?? entry.tempMin);
      entry.tempMax = Math.max(entry.tempMax, item.main?.temp_max ?? entry.tempMax);
      entry.pop = Math.max(entry.pop ?? 0, item.pop ?? 0);
    }
  }
  const daily7d = Array.from(dailyMap.values()).slice(0, 7);

  return { hourly24h, daily7d };
}

/**
 * Lấy dữ liệu chi tiết: hiện tại + 24h + 5-7 ngày + AQI + UV (dùng cho User/Admin)
 */
async function getDetailedWeather(lat, lon) {
  const [currentRes, forecast, airQuality] = await Promise.all([
    axios.get(`${BASE_URL}/weather`, {
      params: { lat, lon, appid: API_KEY, units: "metric", lang: "vi" },
    }),
    getForecast(lat, lon),
    getAirQuality(lat, lon).catch(() => null),
  ]);

  const current = {
    ...mapCurrentPayload(currentRes.data),
    aqi: airQuality?.aqi ?? null,
    aqiLabel: airQuality?.aqiLabel ?? null,
  };

  return {
    current,
    hourly24h: forecast.hourly24h,
    daily7d: forecast.daily7d,
  };
}

/**
 * Hàm tổng hợp chính: xử lý cache + gọi các API cần thiết tuỳ theo cấp độ truy cập
 *
 * @param {Object} params
 * @param {string} [params.city] - tên thành phố (nếu không có lat/lon)
 * @param {number} [params.lat]
 * @param {number} [params.lon]
 * @param {boolean} params.detailed - true nếu là User/Admin (lấy full dữ liệu)
 */
async function getWeatherData({ city, lat, lon, detailed }) {
  if (!API_KEY) {
    const err = new Error("Thiếu OPENWEATHER_API_KEY trong biến môi trường.");
    err.statusCode = 500;
    throw err;
  }

  let coords = { lat, lon };
  let resolvedCityName = city;

  // Nếu chỉ có tên thành phố, geocode để lấy lat/lon
  if ((!lat || !lon) && city) {
    const geo = await geocodeCity(city);
    coords = { lat: geo.lat, lon: geo.lon };
    resolvedCityName = geo.name;
  }

  if (!coords.lat || !coords.lon) {
    const err = new Error("Cần cung cấp 'city' hoặc cả 'lat' và 'lon'.");
    err.statusCode = 400;
    throw err;
  }

  const cacheKey = city
    ? `weather_${city.toLowerCase()}_${detailed ? "full" : "basic"}`
    : `weather_${coords.lat}_${coords.lon}_${detailed ? "full" : "basic"}`;

  const cached = cache.get(cacheKey);
  if (cached) {
    return { ...cached, fromCache: true };
  }

  let result;

  if (!detailed) {
    // Guest: chỉ thời tiết hôm nay (kèm sẵn visibility, sunrise, sunset)
    result = await getCurrentWeather(coords.lat, coords.lon);
    if (resolvedCityName) result.location.name = resolvedCityName;
  } else {
    // User/Admin: full dữ liệu (hiện tại, 24h, 7 ngày, AQI, UV)
    const detailedWeather = await getDetailedWeather(coords.lat, coords.lon);

    result = {
      location: {
        name: resolvedCityName || null,
        lat: coords.lat,
        lon: coords.lon,
      },
      ...detailedWeather,
    };
  }

  cache.set(cacheKey, result, CACHE_TTL);
  return { ...result, fromCache: false };
}

module.exports = {
  geocodeCity,
  getCurrentWeather,
  getDetailedWeather,
  getAirQuality,
  getWeatherData,
};