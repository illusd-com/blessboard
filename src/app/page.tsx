"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";
import Turnstile from "@/components/Turnstile";

type AuthTab = "login" | "register";

export default function HomePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [authTab, setAuthTab] = useState<AuthTab>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authOk, setAuthOk] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const onTurnstile = useCallback((token: string | null) => {
    setTurnstileToken(token);
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/boards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: slug.trim() || undefined,
          title: title.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "建立失敗");
      localStorage.setItem(`blessboard_owner_${data.slug}`, data.ownerToken);
      router.push(`/d/${data.slug}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError("");
    setAuthOk("");
    try {
      if (!turnstileToken) throw new Error("請先完成人機驗證");
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          name: name || undefined,
          turnstileToken,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "註冊失敗");

      // 註冊成功後自動登入
      const loginRes = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (loginRes?.error) {
        setAuthOk("註冊成功，請登入");
        setAuthTab("login");
      } else {
        setAuthOk("註冊並登入成功");
      }
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError("");
    setAuthOk("");
    try {
      if (!turnstileToken) throw new Error("請先完成人機驗證");

      const check = await fetch("/api/auth/login-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ turnstileToken }),
      });
      const checkData = await check.json();
      if (!check.ok) throw new Error(checkData.error || "人機驗證失敗");

      const loginRes = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (loginRes?.error) throw new Error("Email 或密碼錯誤");
      setAuthOk("登入成功");
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  }

  return (
    <div className="home">
      <div className="home-inner">
        <div className="home-brand">
          <div className="logo">B</div>
          <h1>BlessBoard</h1>
          <p>
            白色無邊際格子白板
            <br />
            內建 Blessas AI，直接操作畫布
          </p>
        </div>

        {/* Auth card */}
        <div className="card" style={{ marginBottom: 16 }}>
          {status === "loading" ? (
            <p className="hint" style={{ margin: 0 }}>
              檢查登入狀態…
            </p>
          ) : session?.user ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <div style={{ fontSize: 14 }}>
                已登入：
                <strong>{session.user.name || session.user.email}</strong>
              </div>
              <button type="button" className="chip-btn" onClick={() => signOut()}>
                登出
              </button>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                <button
                  type="button"
                  className={`chip-btn${authTab === "login" ? " active" : ""}`}
                  onClick={() => {
                    setAuthTab("login");
                    setAuthError("");
                    setAuthOk("");
                  }}
                >
                  登入
                </button>
                <button
                  type="button"
                  className={`chip-btn${authTab === "register" ? " active" : ""}`}
                  onClick={() => {
                    setAuthTab("register");
                    setAuthError("");
                    setAuthOk("");
                  }}
                >
                  註冊
                </button>
              </div>

              <button
                type="button"
                className="btn"
                style={{ marginBottom: 12, background: "#fff", color: "#171717", border: "1px solid #e5e5e5" }}
                onClick={() => signIn("google")}
              >
                使用 Google 繼續
              </button>

              <div
                style={{
                  textAlign: "center",
                  fontSize: 12,
                  color: "#a3a3a3",
                  margin: "12px 0",
                }}
              >
                或使用 Email
              </div>

              <form onSubmit={authTab === "login" ? handleLogin : handleRegister}>
                {authTab === "register" && (
                  <div className="field">
                    <label>名稱 <span>（選填）</span></label>
                    <input
                      className="input"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="你的名字"
                    />
                  </div>
                )}
                <div className="field">
                  <label>Email</label>
                  <input
                    className="input"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </div>
                <div className="field">
                  <label>密碼</label>
                  <input
                    className="input"
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={authTab === "register" ? "至少 8 個字元" : "密碼"}
                    autoComplete={
                      authTab === "login" ? "current-password" : "new-password"
                    }
                  />
                </div>

                <Turnstile onToken={onTurnstile} />

                {authError && <div className="error">{authError}</div>}
                {authOk && (
                  <div
                    className="error"
                    style={{
                      color: "#166534",
                      background: "#f0fdf4",
                      borderColor: "#bbf7d0",
                    }}
                  >
                    {authOk}
                  </div>
                )}

                <button className="btn" type="submit" disabled={authLoading}>
                  {authLoading
                    ? "處理中…"
                    : authTab === "login"
                      ? "登入"
                      : "註冊"}
                </button>
              </form>
            </>
          )}
        </div>

        {/* Create board */}
        <form className="card" onSubmit={handleCreate}>
          <div className="field">
            <label>
              自訂網址 <span>（選填）</span>
            </label>
            <div className="slug-row">
              <span className="slug-prefix">blbd.huhm.cc/d/</span>
              <input
                className="input"
                type="text"
                value={slug}
                onChange={(e) =>
                  setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
                }
                placeholder="my-board"
                maxLength={40}
                autoComplete="off"
              />
            </div>
            <p className="hint">小寫英文、數字、連字號</p>
          </div>

          <div className="field">
            <label>
              標題 <span>（選填）</span>
            </label>
            <input
              className="input"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="未命名白板"
            />
          </div>

          {error && <div className="error">{error}</div>}

          <button className="btn" type="submit" disabled={loading}>
            {loading ? "建立中…" : "建立新白板"}
          </button>
        </form>

        <p className="footer-note">Powered by Blessas v1 · NVIDIA Nemotron</p>
      </div>
    </div>
  );
}
