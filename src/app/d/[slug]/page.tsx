"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import type { Editor } from "tldraw";
import Canvas from "@/components/Canvas";
import AIPanel from "@/components/AIPanel";

export default function BoardPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [boardData, setBoardData] = useState<any>(null);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [aiOpen, setAiOpen] = useState(true);
  const [ownerToken, setOwnerToken] = useState<string | undefined>();

  useEffect(() => {
    const token = localStorage.getItem(`blessboard_owner_${slug}`);
    if (token) setOwnerToken(token);

    async function load() {
      try {
        const res = await fetch(`/api/boards/${slug}`);
        if (!res.ok) {
          setError(res.status === 404 ? "找不到這張白板" : "載入失敗");
          return;
        }
        const data = await res.json();
        setBoardData(data);
      } catch {
        setError("網路錯誤");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  const handleEditorReady = useCallback((ed: Editor) => {
    setEditor(ed);
  }, []);

  if (loading) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-white">
        <div className="text-[14px] text-neutral-400">載入 BlessBoard…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-white gap-4">
        <div className="text-[18px] text-neutral-700">{error}</div>
        <a href="/" className="text-[14px] text-blue-600 hover:underline underline-offset-2">
          回到首頁建立新白板
        </a>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen relative overflow-hidden bg-white">
      <div className="absolute top-0 left-0 right-0 z-40 flex items-center justify-between px-4 h-11 bg-white/90 backdrop-blur-md border-b border-neutral-100">
        <div className="flex items-center gap-2.5">
          <span className="text-[13px] font-semibold tracking-tight text-neutral-900">
            BlessBoard
          </span>
          <span className="text-[12px] text-neutral-400">/d/{slug}</span>
        </div>
        <button
          onClick={() => setAiOpen((v) => !v)}
          className={`text-[12px] px-3 py-1 rounded-full border transition active:scale-[0.97] ${
            aiOpen
              ? "bg-neutral-900 text-white border-neutral-900"
              : "bg-white text-neutral-700 border-neutral-200 hover:border-neutral-300"
          }`}
        >
          {aiOpen ? "關閉 AI" : "Blessas"}
        </button>
      </div>

      <div className="absolute inset-0 pt-11">
        <Canvas
          slug={slug}
          initialSnapshot={boardData?.snapshot}
          onEditorReady={handleEditorReady}
          ownerToken={ownerToken}
        />
      </div>

      <AIPanel editor={editor} isOpen={aiOpen} onClose={() => setAiOpen(false)} />
    </div>
  );
}
