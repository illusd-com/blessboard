export async function verifyTurnstile(
  token: string | undefined | null,
  remoteip?: string
): Promise<{ success: boolean; error?: string }> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    console.warn("TURNSTILE_SECRET_KEY not set");
    return { success: false, error: "伺服器未設定驗證金鑰" };
  }
  if (!token || typeof token !== "string") {
    return { success: false, error: "請完成人機驗證" };
  }

  try {
    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret,
          response: token,
          remoteip,
        }),
      }
    );
    const data = await res.json();
    if (!data.success) {
      return {
        success: false,
        error: "人機驗證失敗，請重試",
      };
    }
    return { success: true };
  } catch (e) {
    console.error("Turnstile error", e);
    return { success: false, error: "驗證服務暫時無法使用" };
  }
}
