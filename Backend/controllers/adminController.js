/**
 * controllers/adminController.js
 * Các thao tác quản trị: liệt kê user, gán quyền admin cho user khác.
 */

const { db, auth } = require("../config/firebase");

// GET /api/admin/users
async function listUsers(req, res) {
  try {
    const snapshot = await db.collection("users").get();
    const users = snapshot.docs.map((doc) => ({ uid: doc.id, ...doc.data() }));

    return res.status(200).json({ success: true, count: users.length, data: users });
  } catch (err) {
    console.error("[adminController.listUsers]", err.message);
    return res.status(500).json({ success: false, message: "Lỗi khi lấy danh sách người dùng." });
  }
}

// POST /api/admin/set-admin  Body: { targetUid: string }
async function setAdmin(req, res) {
  try {
    const { targetUid } = req.body;

    if (!targetUid) {
      return res.status(400).json({ success: false, message: "Cần cung cấp 'targetUid'." });
    }

    // 1) Gán Custom Claim { admin: true } trên Firebase Auth
    await auth.setCustomUserClaims(targetUid, { admin: true });

    // 2) Đồng bộ field role trên Firestore
    const ref = db.collection("users").doc(targetUid);
    const doc = await ref.get();

    if (doc.exists) {
      await ref.update({ role: "admin" });
    } else {
      await ref.set({
        role: "admin",
        createdAt: new Date().toISOString(),
        favoriteLocations: [],
      });
    }

    return res.status(200).json({
      success: true,
      message: `Đã gán quyền Admin cho user ${targetUid}. Người dùng cần đăng nhập lại (refresh token) để claim có hiệu lực.`,
    });
  } catch (err) {
    console.error("[adminController.setAdmin]", err.message);
    return res.status(500).json({ success: false, message: "Lỗi khi gán quyền Admin." });
  }
}

module.exports = { listUsers, setAdmin };