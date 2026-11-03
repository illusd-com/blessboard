import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import bcrypt from "bcryptjs";
import { db, users } from "./db";

export async function findUserByEmail(email: string) {
  const rows = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase().trim()))
    .limit(1);
  return rows[0] || null;
}

export async function createUserWithPassword(options: {
  email: string;
  password: string;
  name?: string;
}) {
  const email = options.email.toLowerCase().trim();
  const existing = await findUserByEmail(email);
  if (existing) {
    throw new Error("此 Email 已被註冊");
  }
  if (options.password.length < 8) {
    throw new Error("密碼至少 8 個字元");
  }

  const id = nanoid();
  const passwordHash = await bcrypt.hash(options.password, 12);
  const now = new Date();

  await db.insert(users).values({
    id,
    email,
    passwordHash,
    name: options.name || email.split("@")[0],
    emailVerified: false,
    createdAt: now,
  });

  return { id, email };
}

export async function verifyPassword(email: string, password: string) {
  const user = await findUserByEmail(email);
  if (!user || !user.passwordHash) return null;
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return null;
  return user;
}
