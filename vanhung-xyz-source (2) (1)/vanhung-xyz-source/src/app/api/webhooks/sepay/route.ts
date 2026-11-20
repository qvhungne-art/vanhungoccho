import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const expectedSecret = process.env.SEPAY_WEBHOOK_SECRET;

    if (expectedSecret && authHeader !== `Apikey ${expectedSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, transferType, transferAmount, content } = body;

    if (transferType !== "in" || !transferAmount || transferAmount <= 0) {
      return NextResponse.json({ success: true, message: "Ignored outgoing/invalid tx" });
    }

    const sepayId = String(id);
    const existingTx = await prisma.transaction.findUnique({ where: { sepayId } });
    if (existingTx) {
      return NextResponse.json({ success: true, message: "Duplicate transaction ignored" });
    }

    const match = String(content || "").toUpperCase().match(/NAP\s+VH(\d+)/);
    if (!match) {
      return NextResponse.json({ success: true, message: "No deposit code matched" });
    }

    const depositCode = `NAP VH${match[1]}`;
    const user = await prisma.user.findUnique({ where: { depositCode } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const amount = Math.floor(Number(transferAmount));
    const newTotalDeposit = user.totalDeposit + amount;
    const newRole =
      user.role === "ADMIN"
        ? "ADMIN"
        : newTotalDeposit >= 2000000
        ? "CTV"
        : "USER";

    await prisma.$transaction([
      prisma.transaction.create({
        data: {
          sepayId,
          userId: user.id,
          amount,
          content: String(content || ""),
        },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: {
          balance: { increment: amount },
          totalDeposit: newTotalDeposit,
          role: newRole,
        },
      }),
    ]);

    return NextResponse.json({ success: true, credited: amount, user: user.username });
  } catch (err) {
    console.error("SePay webhook error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
