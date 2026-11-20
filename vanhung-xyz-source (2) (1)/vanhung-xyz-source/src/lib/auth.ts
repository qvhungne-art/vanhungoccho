import crypto from "crypto";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

export const SESSION_COOKIE_NAME = "vh_session";
const SECRET = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "vanhung-xyz-change-this-secret-2026";

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(":");
  if (parts.length !== 2) return false;
  const [salt, keyHex] = parts;
  const derived = crypto.scryptSync(password, salt, 64);
  const keyBuf = Buffer.from(keyHex, "hex");
  if (derived.length !== keyBuf.length) return false;
  return crypto.timingSafeEqual(derived, keyBuf);
}

export function signSessionToken(userId: number): string {
  const exp = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 ngày
  const payload = Buffer.from(JSON.stringify({ userId, exp })).toString("base64url");
  const sig = crypto.createHmac("sha256", SECRET).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifySessionToken(token: string): { userId: number } | null {
  try {
    const [payload, sig] = token.split(".");
    if (!payload || !sig) return null;
    const expectedSig = crypto.createHmac("sha256", SECRET).update(payload).digest("base64url");
    if (sig !== expectedSig) return null;
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!decoded.userId || Date.now() > decoded.exp) return null;
    return { userId: Number(decoded.userId) };
  } catch {
    return null;
  }
}

export async function getSessionUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const verified = verifySessionToken(token);
  if (!verified) return null;

  const user = await prisma.user.findUnique({
    where: { id: verified.userId },
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

  return user;
}
