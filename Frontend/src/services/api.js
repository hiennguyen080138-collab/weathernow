// src/services/api.js
// Axios instance dùng chung toàn app.
// Request Interceptor: nếu đang đăng nhập (Firebase currentUser tồn tại),
// tự động lấy idToken mới nhất và gắn vào header Authorization.

import axios from "axios";
import { auth } from "../config/firebase";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
  timeout: 15000,
});

api.interceptors.request.use(
  async (config) => {
    const user = auth.currentUser;
    if (user) {
      try {
        const idToken = await user.getIdToken(true);
        config.headers.Authorization = `Bearer ${idToken}`;
      } catch (err) {
        // Nếu lấy token thất bại, vẫn cho request đi tiếp như Guest
        console.warn("[api] Không lấy được idToken:", err.message);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: chuẩn hoá thông báo lỗi để component dễ hiển thị
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      "Đã có lỗi xảy ra, vui lòng thử lại.";
    return Promise.reject(new Error(message));
  }
);

export default api;