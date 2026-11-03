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
        setBoardData(await res.json());
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
    return <div className="center-msg">載入 BlessBoard…</div>;
  }

  if (error) {
    return (
      <div className="center-msg">
        <div style={{ fontSize: 18, color: "#404040" }}>{error}</div>
        <a href="/">回到首頁建立新白板</a>
      </div>
    );
  }

  return (
    <div className="board-root">
      <div className="board-topbar">
        <div className="board-topbar-left">
          <div className="logo-sm">B</div>
          <span className="board-title">BlessBoard</span>
          <span className="board-slug">/d/{slug}</span>
        </div>
        <button
          className={`chip-btn${aiOpen ? " active" : ""}`}
          onClick={() => setAiOpen((v) => !v)}
        >
          {aiOpen ? "關閉 AI" : "Blessas"}
        </button>
      </div>

      <div className="board-canvas">
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
