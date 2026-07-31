/**
 * routes/weatherRoutes.js
 * GET /api/weather - dùng optionalAuth vì cả Guest lẫn User/Admin đều được truy cập,
 * chỉ khác nhau về LƯỢNG dữ liệu trả về (xử lý trong controller).
 */

const express = require("express");
const router = express.Router();

const { getWeather } = require("../controllers/weatherController");
const { optionalAuth } = require("../middlewares/authMiddleware");

router.get("/", optionalAuth, getWeather);

module.exports = router;