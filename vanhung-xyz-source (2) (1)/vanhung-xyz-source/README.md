# VANHUNG.XYZ — Fullstack Next.js + Prisma + SePay

## Tính năng đã tích hợp đầy đủ
- **Xác thực tài khoản thật** (`/login`, `/register`, `/api/auth/*`): Mã hóa mật khẩu bằng `crypto.scrypt` và lưu phiên đăng nhập bằng HttpOnly Cookie ký HMAC-SHA256.
- **Phân quyền tự động (`USER` / `CTV` / `ADMIN`)**: Tự động nâng cấp lên `CTV` khi tổng nạp đạt 2,000,000đ.
- **Webhook SePay** (`/api/webhooks/sepay`): Tự động tách mã nạp `NAP VH...`, chống cộng trùng giao dịch và cộng thẳng số dư vào PostgreSQL.

## Biến môi trường cần thiết trên Vercel
- `DATABASE_URL`: Chuỗi kết nối PostgreSQL (Neon)
- `AUTH_SECRET`: Chuỗi bí mật bất kỳ (dùng ký Cookie đăng nhập)
- `SEPAY_WEBHOOK_SECRET`: API Key cấu hình trên SePay

## Khởi tạo Database
```bash
npx prisma db push
npm run db:seed
```
Tài khoản Admin mặc định sau khi seed: `admin_vanhung` / `Admin@123`.
