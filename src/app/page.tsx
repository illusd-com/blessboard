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

      if (!res.ok) {
        throw new Error(data.error || "建立失敗");
      }

      localStorage.setItem(`blessboard_owner_${data.slug}`, data.ownerToken);
      router.push(`/d/${data.slug}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
      <div className="max-w-[420px] w-full space-y-10">
        <div className="text-center space-y-3">
          <h1 className="text-[40px] font-semibold tracking-tight text-neutral-900 leading-none">
            BlessBoard
          </h1>
          <p className="text-[15px] text-neutral-500 leading-relaxed">
            白色無邊際格子白板
            <br />
            內建 Blessas AI，直接操作畫布
          </p>
        </div>

        <form
          onSubmit={handleCreate}
          className="bg-white border border-neutral-200 rounded-2xl p-6 space-y-5 shadow-sm"
        >
          <div className="space-y-1.5">
            <label className="block text-[13px] font-medium text-neutral-700">
              自訂網址
              <span className="text-neutral-400 font-normal ml-1">（選填）</span>
            </label>
            <div className="flex items-center gap-0 text-[14px]">
              <span className="text-neutral-400 select-none shrink-0">
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
                className="flex-1 min-w-0 border border-neutral-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition"
                maxLength={40}
                autoComplete="off"
              />
            </div>
            <p className="text-[12px] text-neutral-400">
              小寫英文、數字、連字號
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[13px] font-medium text-neutral-700">
              標題
              <span className="text-neutral-400 font-normal ml-1">（選填）</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="未命名白板"
              className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition"
            />
          </div>

          {error && (
            <div className="text-[13px] text-red-600 bg-red-50 px-3 py-2 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-neutral-900 hover:bg-neutral-800 active:scale-[0.98] text-white font-medium text-[14px] py-2.5 rounded-lg transition disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? "建立中…" : "建立新白板"}
          </button>
        </form>

        <p className="text-center text-[12px] text-neutral-400">
          Powered by Blessas v1 · NVIDIA Nemotron
        </p>
      </div>
    </div>
  );
}
