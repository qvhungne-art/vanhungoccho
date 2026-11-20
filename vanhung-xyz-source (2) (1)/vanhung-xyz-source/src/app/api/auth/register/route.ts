import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, signSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const username = String(body.username || "").trim().toLowerCase();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!/^[a-z0-9_]{4,24}$/.test(username)) {
      return NextResponse.json(
        { error: "Tên đăng nhập phải từ 4-24 ký tự (chữ thường, số, dấu gạch dưới)." },
        { status: 400 }
      );
    }
    if (!email.includes("@")) {
      return NextResponse.json({ error: "Email không hợp lệ." }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Mật khẩu phải có ít nhất 6 ký tự." }, { status: 400 });
    }

    const existing = await prisma.user.findFirst({
      where: { OR: [{ username }, { email }] },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Tên đăng nhập hoặc Email đã tồn tại trên hệ thống." },
        { status: 409 }
      );
    }

    const randomCode = Math.floor(100000 + Math.random() * 900000);
    const depositCode = `NAP VH${randomCode}`;

    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash: hashPassword(password),
        role: "USER",
        balance: 0,
        depositCode,
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        balance: true,
        totalDeposit: true,
        depositCode: true,
      },
    });

    const token = signSessionToken(user.id);
    const res = NextResponse.json({ success: true, user });
    res.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });
    return res;
  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json({ error: "Lỗi máy chủ khi đăng ký." }, { status: 500 });
  }
}
