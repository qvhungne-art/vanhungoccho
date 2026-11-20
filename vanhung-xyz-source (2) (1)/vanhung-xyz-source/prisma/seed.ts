import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

async function main() {
  const count = await prisma.product.count();
  if (count === 0) {
    const initialProducts = [
      { cat: "AI", name: "ChatGPT Plus Private (Cấp riêng 1 Tháng - Bảo hành Full)", price: 145000, stock: 84, badge: "HOT", country: "US", warranty: "30 ngày", format: "email|pass|2fa" },
      { cat: "AI", name: "Claude Pro 3.7 Sonnet (Tài khoản chính chủ, không chung)", price: 320000, stock: 26, badge: "VIP", country: "US", warranty: "30 ngày", format: "email|pass" },
      { cat: "AI", name: "Cursor Pro 14 Ngày / 1 Tháng (Fast Request Full)", price: 110000, stock: 52, badge: "NEW", country: "US", warranty: "14 ngày", format: "email|pass" },
      { cat: "FB", name: "Via Việt XMDT Cổ 2015-2020 (Đã bật 2FA, bao đổi pass)", price: 75000, stock: 310, badge: "HOT", country: "VN", warranty: "24h Login", format: "uid|pass|2fa|mail|passmail" },
      { cat: "FB", name: "Via Phi Kháng 902 Limit 5m8 (Chạy Ads siêu khỏe)", price: 165000, stock: 95, badge: "ADS", country: "PH", warranty: "24h Login", format: "uid|pass|2fa|cookie" },
      { cat: "FB", name: "Clone Việt NVR Tương Tác Thật (Reg Phone sạch)", price: 6500, stock: 2450, badge: "", country: "VN", warranty: "Check Live", format: "uid|pass|2fa" },
      { cat: "MAIL", name: "Gmail Cổ 2014-2018 (Trust cao, đã ngâm IP sạch)", price: 18000, stock: 1280, badge: "HOT", country: "US", warranty: "48h Login", format: "mail|pass|recovery" },
      { cat: "MAIL", name: "Hotmail / Outlook Live (Mở sẵn IMAP/POP3 đọc OTP)", price: 1200, stock: 6800, badge: "", country: "GL", warranty: "Check Live", format: "mail|pass|refresh_token" },
      { cat: "PROXY", name: "Proxy Dân Cư Việt Nam Private (IPv4 Tĩnh 30 Ngày)", price: 35000, stock: 420, badge: "FAST", country: "VN", warranty: "30 ngày", format: "ip:port:user:pass" },
      { cat: "PROXY", name: "Proxy ISP US Tĩnh (Sạch 100% nuôi Ebay / Etsy / TikTok)", price: 55000, stock: 190, badge: "CLEAN", country: "US", warranty: "30 ngày", format: "ip:port:user:pass" },
    ];
    await prisma.product.createMany({ data: initialProducts });
  }

  await prisma.user.upsert({
    where: { username: "admin_vanhung" },
    update: {},
    create: {
      username: "admin_vanhung",
      email: "admin@vanhung.xyz",
      passwordHash: hashPassword("Admin@123"),
      role: "ADMIN",
      balance: 1250000,
      depositCode: "NAP VH102",
    },
  });

  console.log("Seeded VANHUNG.XYZ database! Admin: admin_vanhung / Admin@123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
