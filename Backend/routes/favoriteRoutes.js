/**
 * routes/favoriteRoutes.js
 * Toàn bộ route yêu cầu đăng nhập (requireAuth) vì gắn với dữ liệu riêng của User.
 */

const express = require("express");
const router = express.Router();

const { getFavorites, addFavorite, deleteFavorite } = require("../controllers/favoriteController");
const { requireAuth } = require("../middlewares/authMiddleware");

router.get("/", requireAuth, getFavorites);
router.post("/", requireAuth, addFavorite);
router.delete("/:locationId", requireAuth, deleteFavorite);

module.exports = router;