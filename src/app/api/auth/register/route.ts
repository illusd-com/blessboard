import { NextRequest, NextResponse } from "next/server";
import { createUserWithPassword } from "@/lib/users";
import { verifyTurnstile } from "@/lib/turnstile";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, name, turnstileToken } = body;

    const ip =
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-forwarded-for") ||
      undefined;

    const captcha = await verifyTurnstile(turnstileToken, ip);
    if (!captcha.success) {
      return NextResponse.json(
        { error: captcha.error || "人機驗證失敗" },
        { status: 400 }
      );
    }

    if (!email || !password) {
      return NextResponse.json(
        { error: "請填寫 Email 與密碼" },
        { status: 400 }
      );
    }

    const user = await createUserWithPassword({ email, password, name });
    return NextResponse.json({ ok: true, user: { id: user.id, email: user.email } });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "註冊失敗" },
      { status: 400 }
    );
  }
}
