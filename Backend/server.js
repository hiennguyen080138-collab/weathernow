/**
 * server.js
 * Entry point khởi chạy HTTP Server.
 */

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const weatherRoutes = require("./routes/weatherRoutes");
const favoriteRoutes = require("./routes/favoriteRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// ==== Middlewares chung ====
app.use(helmet());
app.use(
  cors({
    origin: [
      "https://weathernow-frontend.vercel.app", // Thay bằng domain Vercel thực tế của bạn
      "http://localhost:5173",
      "http://localhost:3000",
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// ==== Health check ====
app.get("/health", (req, res) => {
  res.status(200).json({ success: true, message: "Weather backend đang hoạt động." });
});

// ==== Routes chính ====
app.use("/api/weather", weatherRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/admin", adminRoutes);

// ==== 404 handler ====
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Không tìm thấy route." });
});

// ==== Global error handler ====
app.use((err, req, res, next) => {
  console.error("[Global Error Handler]", err);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Lỗi hệ thống không xác định.",
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Weather backend đang chạy tại http://localhost:${PORT}`);
});