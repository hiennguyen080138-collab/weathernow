/**
 * config/cache.js
 * Khởi tạo In-Memory Cache (node-cache) dùng chung cho toàn bộ ứng dụng.
 *
 * Ghi chú: Nếu sau này muốn scale nhiều instance backend (load-balancing),
 * nên thay thế NodeCache bằng Redis để cache được chia sẻ giữa các process.
 * Vì kiến trúc (interface get/set/del) tương tự, việc thay thế khá dễ dàng.
 */

const NodeCache = require("node-cache");

const DEFAULT_TTL = parseInt(process.env.CACHE_TTL_SECONDS, 10) || 900; // 15 phút

const cache = new NodeCache({
  stdTTL: DEFAULT_TTL,
  checkperiod: 120, // dọn cache hết hạn mỗi 2 phút
  useClones: false,
});

module.exports = cache;