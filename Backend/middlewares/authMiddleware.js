/**
 * middlewares/authMiddleware.js
 * Xử lý xác thực Firebase ID Token theo 2 chế độ:
 *  - optionalAuth: KHÔNG bắt buộc có token (dùng cho endpoint Guest/User dùng chung, vd /api/weather)
 *  - requireAuth:  BẮT BUỘC có token hợp lệ (dùng cho /api/favorites, ...)
 *
 * Cả 2 middleware đều gắn req.user = { uid, email, role, isAdmin, ... } nếu xác thực thành công.
 */

const { auth, db } = require("../config/firebase");

function extractToken(req) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");
  if (scheme === "Bearer" && token) return token;
  return null;
}

/**
 * Giải mã token, đồng thời tra role trong Firestore (nếu có)
 * để hỗ trợ cả 2 cơ chế phân quyền: Custom Claim { admin: true } HOẶC field role="admin" trên Firestore.
 */
async function resolveUserFromToken(idToken) {
  const decoded = await auth.verifyIdToken(idToken);

  let role = "user";
  let isAdmin = decoded.admin === true; // Custom Claim

  // Đối chiếu thêm với Firestore (đề phòng trường hợp chưa set Custom Claim
  // nhưng đã set role="admin" thủ công trên Firestore)
  try {
    const userDoc = await db.collection("users").doc(decoded.uid).get();
    if (userDoc.exists) {
      const data = userDoc.data();
      if (data.role) role = data.role;
      if (data.role === "admin") isAdmin = true;
    }
  } catch (err) {
    console.warn("[authMiddleware] Không thể đọc Firestore user doc:", err.message);
  }

  if (isAdmin) role = "admin";

  return {
    uid: decoded.uid,
    email: decoded.email || null,
    role,
    isAdmin,
  };
}

/**
 * optionalAuth:
 * - Không có token / token sai -> req.user = null, coi như Guest, KHÔNG throw lỗi.
 * - Có token hợp lệ -> req.user = { uid, email, role, isAdmin }
 */
async function optionalAuth(req, res, next) {
  const token = extractToken(req);

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    req.user = await resolveUserFromToken(token);
  } catch (err) {
    // Token không hợp lệ/hết hạn -> vẫn xử lý như Guest, không chặn request
    console.warn("[optionalAuth] Token không hợp lệ:", err.message);
    req.user = null;
  }

  next();
}

/**
 * requireAuth:
 * - Bắt buộc phải có token hợp lệ, nếu không trả về 401.
 */
async function requireAuth(req, res, next) {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Yêu cầu đăng nhập. Vui lòng gửi kèm Authorization: Bearer <idToken>.",
    });
  }

  try {
    req.user = await resolveUserFromToken(token);
    next();
  } catch (err) {
    console.warn("[requireAuth] Token không hợp lệ:", err.message);
    return res.status(401).json({
      success: false,
      message: "Token không hợp lệ hoặc đã hết hạn.",
    });
  }
}

module.exports = { optionalAuth, requireAuth };