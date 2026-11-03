"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        background:
          "radial-gradient(1200px 600px at 50% -10%, #f5f5f5 0%, #fafafa 45%, #ffffff 100%)",
      }}
    >
      <div style={{ width: "100%", maxWidth: 440 }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 48,
              height: 48,
              borderRadius: 14,
              background: "#171717",
              color: "#fff",
              fontWeight: 700,
              fontSize: 18,
              letterSpacing: "-0.02em",
              marginBottom: 18,
            }}
          >
            B
          </div>
          <h1
            style={{
              margin: 0,
              fontSize: 36,
              fontWeight: 650,
              letterSpacing: "-0.03em",
              color: "#111",
              lineHeight: 1.1,
            }}
          >
            BlessBoard
          </h1>
          <p
            style={{
              margin: "12px 0 0",
              fontSize: 15,
              lineHeight: 1.6,
              color: "#737373",
            }}
          >
            白色無邊際格子白板
            <br />
            內建 Blessas AI，直接操作畫布
          </p>
        </div>

        <form
          onSubmit={handleCreate}
          className="bb-card"
          style={{
            background: "#fff",
            border: "1px solid #e5e5e5",
            borderRadius: 16,
            padding: 24,
            boxShadow:
              "0 1px 2px rgba(0,0,0,0.04), 0 12px 32px rgba(0,0,0,0.06)",
          }}
        >
          <div style={{ marginBottom: 18 }}>
            <label
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 600,
                color: "#404040",
                marginBottom: 8,
              }}
            >
              自訂網址{" "}
              <span style={{ fontWeight: 400, color: "#a3a3a3" }}>（選填）</span>
            </label>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 14,
              }}
            >
              <span style={{ color: "#a3a3a3", whiteSpace: "nowrap" }}>
                blbd.huhm.cc/d/
              </span>
              <input
                type="text"
                value={slug}
                onChange={(e) =>
                  setSlug(
                    e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "")
                  )
                }
                placeholder="my-board"
                maxLength={40}
                autoComplete="off"
                className="bb-input"
                style={{ flex: 1, minWidth: 0 }}
              />
            </div>
            <p style={{ margin: "8px 0 0", fontSize: 12, color: "#a3a3a3" }}>
              小寫英文、數字、連字號
            </p>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 600,
                color: "#404040",
                marginBottom: 8,
              }}
            >
              標題{" "}
              <span style={{ fontWeight: 400, color: "#a3a3a3" }}>（選填）</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="未命名白板"
              className="bb-input"
            />
          </div>

          {error && (
            <div
              style={{
                marginBottom: 16,
                fontSize: 13,
                color: "#dc2626",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: 10,
                padding: "10px 12px",
              }}
            >
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="bb-btn">
            {loading ? "建立中…" : "建立新白板"}
          </button>
        </form>

        <p
          style={{
            marginTop: 28,
            textAlign: "center",
            fontSize: 12,
            color: "#a3a3a3",
          }}
        >
          Powered by Blessas v1 · NVIDIA Nemotron
        </p>
      </div>
    </div>
  );
}
