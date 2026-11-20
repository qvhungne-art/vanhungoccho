import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: "VANHUNG.XYZ — Hệ Sinh Thái Tài Nguyên MMO & AI Tự Động 24/7",
  description: "Cung cấp Via Facebook, Gmail Cổ, Tài khoản AI (ChatGPT, Claude, Cursor), Proxy sạch tốc độ cao. Nạp tiền tự động SePay 3s.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`dark ${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans bg-[#050811] text-slate-50 antialiased">
        {children}
      </body>
    </html>
  );
}
