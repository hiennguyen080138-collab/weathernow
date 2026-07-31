/**
 * controllers/favoriteController.js
 * CRUD cho danh sách địa điểm yêu thích, lưu trong field `favoriteLocations`
 * của document users/{uid} trên Firestore (theo đúng schema đã mô tả).
 */

const { db, admin } = require("../config/firebase");

const usersCollection = () => db.collection("users");

/**
 * Đảm bảo document user tồn tại (tạo mới nếu chưa có, ví dụ user vừa đăng ký lần đầu)
 */
async function ensureUserDoc(uid, email) {
  const ref = usersCollection().doc(uid);
  const doc = await ref.get();
  if (!doc.exists) {
    await ref.set({
      email: email || null,
      fullName: "",
      role: "user",
      createdAt: new Date().toISOString(),
      favoriteLocations: [],
    });
  }
  return ref;
}

// GET /api/favorites
async function getFavorites(req, res) {
  try {
    const { uid, email } = req.user;
    const ref = await ensureUserDoc(uid, email);
    const doc = await ref.get();
    const favorites = doc.data().favoriteLocations || [];

    return res.status(200).json({ success: true, data: favorites });
  } catch (err) {
    console.error("[favoriteController.getFavorites]", err.message);
    return res.status(500).json({ success: false, message: "Lỗi khi lấy danh sách yêu thích." });
  }
}

// POST /api/favorites
async function addFavorite(req, res) {
  try {
    const { uid, email } = req.user;
    const { cityName, lat, lon } = req.body;

    if (!cityName || lat === undefined || lon === undefined) {
      return res.status(400).json({
        success: false,
        message: "Cần cung cấp 'cityName', 'lat' và 'lon'.",
      });
    }

    const ref = await ensureUserDoc(uid, email);

    const newLocation = {
      id: Date.now().toString(),
      cityName,
      lat: parseFloat(lat),
      lon: parseFloat(lon),
      addedAt: new Date().toISOString(),
    };

    await ref.update({
      favoriteLocations: admin.firestore.FieldValue.arrayUnion(newLocation),
    });

    return res.status(201).json({ success: true, data: newLocation });
  } catch (err) {
    console.error("[favoriteController.addFavorite]", err.message);
    return res.status(500).json({ success: false, message: "Lỗi khi thêm địa điểm yêu thích." });
  }
}

// DELETE /api/favorites/:locationId
async function deleteFavorite(req, res) {
  try {
    const { uid } = req.user;
    const { locationId } = req.params;

    const ref = usersCollection().doc(uid);
    const doc = await ref.get();

    if (!doc.exists) {
      return res.status(404).json({ success: false, message: "Không tìm thấy người dùng." });
    }

    const favorites = doc.data().favoriteLocations || [];
    const target = favorites.find((f) => f.id === locationId);

    if (!target) {
      return res.status(404).json({ success: false, message: "Không tìm thấy địa điểm yêu thích." });
    }

    await ref.update({
      favoriteLocations: admin.firestore.FieldValue.arrayRemove(target),
    });

    return res.status(200).json({ success: true, message: "Đã xóa địa điểm khỏi danh sách yêu thích." });
  } catch (err) {
    console.error("[favoriteController.deleteFavorite]", err.message);
    return res.status(500).json({ success: false, message: "Lỗi khi xóa địa điểm yêu thích." });
  }
}

module.exports = { getFavorites, addFavorite, deleteFavorite };