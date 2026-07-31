/**
 * scripts/setAdmin.js
 * Script CLI để nâng cấp một User thường thành Admin bằng UID, chạy độc lập với server.
 *
 * Cách dùng:
 *   node scripts/setAdmin.js <UID>
 *   hoặc: npm run set-admin -- <UID>
 *
 * Yêu cầu: đã cấu hình .env với GOOGLE_APPLICATION_CREDENTIALS hoặc FIREBASE_SERVICE_ACCOUNT_JSON
 */

require("dotenv").config();
const { auth, db } = require("../config/firebase");

async function main() {
  const targetUid = process.argv[2];

  if (!targetUid) {
    console.error("❌ Thiếu UID. Cách dùng: node scripts/setAdmin.js <UID>");
    process.exit(1);
  }

  try {
    // 1) Kiểm tra user có tồn tại trên Firebase Auth không
    const userRecord = await auth.getUser(targetUid);
    console.log(`🔎 Tìm thấy user: ${userRecord.email || userRecord.uid}`);

    // 2) Gán Custom Claim { admin: true }
    await auth.setCustomUserClaims(targetUid, { admin: true });
    console.log("✅ Đã gán Custom Claim { admin: true } trên Firebase Auth.");

    // 3) Đồng bộ Firestore field role="admin"
    const ref = db.collection("users").doc(targetUid);
    const doc = await ref.get();

    if (doc.exists) {
      await ref.update({ role: "admin" });
    } else {
      await ref.set({
        email: userRecord.email || null,
        fullName: userRecord.displayName || "",
        role: "admin",
        createdAt: new Date().toISOString(),
        favoriteLocations: [],
      });
    }

    console.log(`🎉 Hoàn tất! User ${targetUid} giờ đã là Admin.`);
    console.log("⚠️  Lưu ý: User cần đăng xuất/đăng nhập lại (hoặc refresh ID token) để claim có hiệu lực.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Lỗi khi gán quyền Admin:", err.message);
    process.exit(1);
  }
}

main();