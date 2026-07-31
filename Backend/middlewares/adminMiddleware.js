/**
 * middlewares/adminMiddleware.js
 * Phải dùng SAU requireAuth (req.user đã tồn tại).
 * Chặn request nếu user không có quyền admin.
 */

function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Yêu cầu đăng nhập.",
    });
  }

  if (!req.user.isAdmin && req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Bạn không có quyền truy cập tài nguyên này (yêu cầu quyền Admin).",
    });
  }

  next();
}

module.exports = { requireAdmin };