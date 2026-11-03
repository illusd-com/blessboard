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
                  setSlug(
                    e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "")
                  )
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
