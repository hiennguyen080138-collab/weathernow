/**
 * config/firebase.js
 * Khởi tạo Firebase Admin SDK (Auth + Firestore)
 */

const admin = require("firebase-admin");
const path = require("path");
const fs = require("fs");

function loadServiceAccount() {
  // 1. Ưu tiên biến môi trường JSON string (khi deploy)
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
      return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    } catch (err) {
      console.error("[Firebase] Lỗi parse JSON môi trường:", err.message);
    }
  }

  // 2. Tìm file serviceAccountKey.json ở thư mục gốc Backend (ngang hàng package.json)
  const rootKeyPath = path.join(__dirname, "../serviceAccountKey.json");
  if (fs.existsSync(rootKeyPath)) {
    return require(rootKeyPath);
  }

  // 3. Dự phòng nếu file nằm ngay trong thư mục config
  const configKeyPath = path.join(__dirname, "serviceAccountKey.json");
  if (fs.existsSync(configKeyPath)) {
    return require(configKeyPath);
  }

  return null;
}

let app;

if (!admin.apps.length) {
  const serviceAccount = loadServiceAccount();

  if (serviceAccount) {
    app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id || "weathernow-21762",
    });
    console.log("[Firebase] Admin SDK đã khởi tạo thành công với cert.");
  } else {
    app = admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID || "weathernow-21762",
    });
    console.log("[Firebase] Admin SDK khởi tạo dạng fallback.");
  }
} else {
  app = admin.app();
}

const auth = admin.auth();
const db = admin.firestore();

// Bỏ qua các thuộc tính undefined khi lưu Firestore
db.settings({ ignoreUndefinedProperties: true });

module.exports = { admin, auth, db };