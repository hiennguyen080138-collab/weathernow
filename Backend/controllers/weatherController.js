/**
 * controllers/weatherController.js
 * Xử lý GET /api/weather?city={cityName}&lat={lat}&lon={lon}
 * Phân cấp dữ liệu trả về theo req.user (được gắn bởi optionalAuth middleware).
 */

const weatherService = require("../services/weatherService");

async function getWeather(req, res) {
  try {
    const { city, lat, lon } = req.query;

    if (!city && (!lat || !lon)) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp query param 'city' hoặc cả 'lat' và 'lon'.",
      });
    }

    const isAuthenticated = !!req.user; // User hoặc Admin
    const detailed = isAuthenticated;

    const data = await weatherService.getWeatherData({
      city,
      lat: lat ? parseFloat(lat) : undefined,
      lon: lon ? parseFloat(lon) : undefined,
      detailed,
    });

    const response = {
      success: true,
      accessLevel: isAuthenticated ? req.user.role : "guest",
      data,
    };

    if (!isAuthenticated) {
      response.notice =
        "Bạn đang xem ở chế độ Khách, chỉ hiển thị thời tiết hôm nay. Đăng nhập để xem dự báo 24h, 7 ngày, chỉ số AQI/UV và nhiều hơn nữa.";
    }

    return res.status(200).json(response);
  } catch (err) {
    console.error("[weatherController.getWeather]", err.message);
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || "Lỗi khi lấy dữ liệu thời tiết.",
    });
  }
}

module.exports = { getWeather };