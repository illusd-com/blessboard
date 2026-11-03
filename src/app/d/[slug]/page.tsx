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
    return (
      <div
        style={{
          width: "100vw",
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#fff",
          color: "#a3a3a3",
          fontSize: 14,
        }}
      >
        載入 BlessBoard…
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          width: "100vw",
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          background: "#fff",
        }}
      >
        <div style={{ fontSize: 18, color: "#404040" }}>{error}</div>
        <a href="/" style={{ fontSize: 14, color: "#2563eb" }}>
          回到首頁建立新白板
        </a>
      </div>
    );
  }

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        position: "relative",
        overflow: "hidden",
        background: "#fff",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 40,
          height: 48,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
          background: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid #f0f0f0",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: 7,
              background: "#171717",
              color: "#fff",
              fontSize: 12,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            B
          </div>
          <span style={{ "style13, fontWeight: 650, color: "#171717" }}>
            BlessBoard
          </span>
          <span style={{ fontSize: 12, color: "#a3a3a3" }}>/d/{slug}</span>
        </div>

        <button
          onClick={() => setAiOpen((v) => !v)}
          style={{
            fontSize: 12,
            fontWeight: 600,
            padding: "6px 12px",
            borderRadius: 999,
            border: aiOpen ? "1px solid #171717" : "1px solid #e5e5e5",
            background: aiOpen ? "#171717" : "#fff",
            color: aiOpen ? "#fff" : "#404040",
            cursor: "pointer",
          }}
        >
          {aiOpen ? "關閉 AI" : "Blessas"}
        </button>
      </div>

      <div style={{ position: "absolute", inset: 0, paddingTop: 48 }}>
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
