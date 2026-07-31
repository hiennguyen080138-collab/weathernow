/**
 * services/weatherService.js
 * Gọi OpenWeatherMap API (CHỈ dùng các endpoint /data/2.5 free tier), có cache để giảm số lượt gọi.
 */

const axios = require("axios");
const cache = require("../config/cache");

const AQI_LABELS = {
  1: "Tốt",
  2: "Khá",
  3: "Trung bình",
  4: "Kém",
  5: "Rất kém",
};

// Helper lấy API_KEY và Base URL động để tránh lỗi undefined khi load module
function getEnvConfig() {
  const apiKey = process.env.OPENWEATHER_API_KEY || "0d53a807bcb713c73117b90ab278a5e1";
  const baseUrl = process.env.OPENWEATHER_BASE_URL || "https://api.openweathermap.org/data/2.5";
  const geoUrl = process.env.OPENWEATHER_GEO_URL || "https://api.openweathermap.org/geo/1.0";
  const ttl = parseInt(process.env.CACHE_TTL_SECONDS, 10) || 900;

  return { apiKey, baseUrl, geoUrl, ttl };
}

/**
 * Chuyển tên thành phố sang lat/lon bằng Geocoding API
 */
async function geocodeCity(cityName) {
  const { apiKey, geoUrl } = getEnvConfig();
  // Xử lý thay dấu '+' bằng khoảng trắng nếu có
  const cleanCityName = cityName.replace(/\+/g, " ").trim();
  const cacheKey = `geo_${cleanCityName.toLowerCase()}`;
  
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const { data } = await axios.get(`${geoUrl}/direct`, {
    params: { q: cleanCityName, limit: 1, appid: apiKey },
  });

  if (!data || data.length === 0) {
    const err = new Error(`Không tìm thấy thành phố: ${cleanCityName}`);
    err.statusCode = 404;
    throw err;
  }

  const result = { lat: data[0].lat, lon: data[0].lon, name: data[0].name, country: data[0].country };
  cache.set(cacheKey, result, 60 * 60 * 24); // cache 24h
  return result;
}

/**
 * Chuẩn hoá object current weather
 */
function mapCurrentPayload(data) {
  return {
    temp: data.main?.temp,
    feelsLike: data.main?.feels_like,
    humidity: data.main?.humidity,
    pressure: data.main?.pressure,
    windSpeed: data.wind?.speed,
    visibility: data.visibility != null ? Math.round((data.visibility / 1000) * 10) / 10 : null,
    sunrise: data.sys?.sunrise ?? null,
    sunset: data.sys?.sunset ?? null,
    description: data.weather?.[0]?.description,
    icon: data.weather?.[0]?.icon,
    dt: data.dt,
  };
}

/**
 * Lấy dữ liệu thời tiết hiện tại
 */
async function getCurrentWeather(lat, lon) {
  const { apiKey, baseUrl } = getEnvConfig();
  const { data } = await axios.get(`${baseUrl}/weather`, {
    params: { lat, lon, appid: apiKey, units: "metric", lang: "vi" },
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
 * Lấy chỉ số AQI
 */
async function getAirQuality(lat, lon) {
  const { apiKey, baseUrl } = getEnvConfig();
  const { data } = await axios.get(`${baseUrl}/air_pollution`, {
    params: { lat, lon, appid: apiKey },
  });

  const item = data?.list?.[0];
  if (!item) return null;

  const aqi = item.main?.aqi ?? null;

  return {
    aqi,
    aqiLabel: aqi != null ? AQI_LABELS[aqi] || null : null,
    components: item.components,
  };
}

/**
 * Lấy dự báo 24h + 5-7 ngày
 */
async function getForecast(lat, lon) {
  const { apiKey, baseUrl } = getEnvConfig();
  const { data } = await axios.get(`${baseUrl}/forecast`, {
    params: { lat, lon, appid: apiKey, units: "metric", lang: "vi" },
  });

  const list = data.list || [];

  const hourly24h = list.slice(0, 8).map((item) => ({
    dt: item.dt,
    temp: item.main?.temp,
    feelsLike: item.main?.feels_like,
    humidity: item.main?.humidity,
    pop: item.pop,
    description: item.weather?.[0]?.description,
    icon: item.weather?.[0]?.icon,
  }));

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
 * Lấy dữ liệu chi tiết
 */
async function getDetailedWeather(lat, lon) {
  const { apiKey, baseUrl } = getEnvConfig();
  const [currentRes, forecast, airQuality] = await Promise.all([
    axios.get(`${baseUrl}/weather`, {
      params: { lat, lon, appid: apiKey, units: "metric", lang: "vi" },
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
 * Hàm tổng hợp chính
 */
async function getWeatherData({ city, lat, lon, detailed }) {
  const { ttl } = getEnvConfig();
  let coords = { lat, lon };
  let resolvedCityName = city;

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
    result = await getCurrentWeather(coords.lat, coords.lon);
    if (resolvedCityName) result.location.name = resolvedCityName;
  } else {
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

  cache.set(cacheKey, result, ttl);
  return { ...result, fromCache: false };
}

module.exports = {
  geocodeCity,
  getCurrentWeather,
  getDetailedWeather,
  getAirQuality,
  getWeatherData,
};