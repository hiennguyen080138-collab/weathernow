/**
 * routes/adminRoutes.js
 * Toàn bộ route yêu cầu requireAuth + requireAdmin (2 lớp bảo vệ).
 */

const express = require("express");
const router = express.Router();

const { listUsers, setAdmin } = require("../controllers/adminController");
const { requireAuth } = require("../middlewares/authMiddleware");
const { requireAdmin } = require("../middlewares/adminMiddleware");

router.get("/users", requireAuth, requireAdmin, listUsers);
router.post("/set-admin", requireAuth, requireAdmin, setAdmin);

module.exports = router;