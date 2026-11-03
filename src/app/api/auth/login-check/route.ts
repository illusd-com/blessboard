import { NextRequest, NextResponse } from "next/server";
import { verifyTurnstile } from "@/lib/turnstile";

/** 登入前先驗證 Turnstile，通過後前端再呼叫 signIn */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { turnstileToken } = body;
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
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "驗證失敗" }, { status: 400 });
  }
}
