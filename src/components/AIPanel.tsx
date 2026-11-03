"use client";

import { useState, useRef, useEffect } from "react";
import type { Editor } from "tldraw";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  toolCalls?: any[];
}

interface AIPanelProps {
  editor: Editor | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function AIPanel({ editor, isOpen, onClose }: AIPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "你好，我是 Blessas v1。我可以直接操作這張白板。\n試試說：「在中間寫今天的待辦事項」或「目前白板有什麼？」",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function getCanvasStateSummary(): string {
    if (!editor) return "（畫布尚未就緒）";
    const shapes = editor.getCurrentPageShapes();
    if (shapes.length === 0) return "目前白板是空的。";
    const summary = shapes.map((shape) => {
      const id = shape.id;
      const type = shape.type;
      const x = Math.round(shape.x);
      const y = Math.round(shape.y);
      if (type === "text") {
        const text = (shape as any).props?.text || "";
        return `- [${id}] text @ (${x}, ${y}) : "${String(text).slice(0, 100)}"`;
      }
      if (type === "image") return `- [${id}] image @ (${x}, ${y})`;
      if (type === "geo") {
        const text = (shape as any).props?.text || "";
        return `- [${id}] geo @ (${x}, ${y}) : "${String(text).slice(0, 60)}"`;
      }
      return `- [${id}] ${type} @ (${x}, ${y})`;
    });
    return `共 ${shapes.length} 個物件：\n` + summary.join("\n");
  }

  async function executeToolCalls(toolCalls: any[]) {
    if (!editor || !toolCalls?.length) return;
    for (const tc of toolCalls) {
      const name = tc.function?.name;
      let args: any = {};
      try {
        args = JSON.parse(tc.function?.arguments || "{}");
      } catch {
        continue;
      }
      try {
        switch (name) {
          case "add_text": {
            editor.createShape({
              type: "text",
              x: args.x ?? 100,
              y: args.y ?? 100,
              props: {
                text: args.text || "新文字",
                size: "m",
                color: "black",
                font: "draw",
                textAlign: "start",
                autoSize: true,
                w: args.width || 200,
              },
            });
            break;
          }
          case "update_text": {
            if (args.shapeId) {
              const shape = editor.getShape(args.shapeId as any);
              if (shape && shape.type === "text") {
                editor.updateShape({
                  id: shape.id,
                  type: "text",
                  props: {
                    ...(shape as any).props,
                    text: args.text ?? (shape as any).props.text,
                  },
                });
              }
            }
            break;
          }
          case "delete_shapes": {
            if (args.shapeIds?.length) editor.deleteShapes(args.shapeIds as any);
            break;
          }
          case "move_shapes": {
            if (args.shapeIds?.length) {
              const dx = args.dx || 0;
              const dy = args.dy || 0;
              for (const id of args.shapeIds) {
                const shape = editor.getShape(id as any);
                if (shape) {
                  editor.updateShape({
                    id: shape.id,
                    type: shape.type,
                    x: shape.x + dx,
                    y: shape.y + dy,
                  });
                }
              }
            }
            break;
          }
          case "arrange_shapes": {
            const ids = args.shapeIds?.length
              ? args.shapeIds
              : editor.getSelectedShapeIds();
            if (!ids.length) break;
            const gap = args.gap ?? 24;
            let cursorX = 100;
            let cursorY = 100;
            const colWidth = 220;
            ids.forEach((id: string, i: number) => {
              const shape = editor.getShape(id as any);
              if (!shape) return;
              if (args.layout === "row") {
                editor.updateShape({
                  id: shape.id,
                  type: shape.type,
                  x: cursorX,
                  y: cursorY,
                });
                cursorX += colWidth + gap;
              } else if (args.layout === "column") {
                editor.updateShape({
                  id: shape.id,
                  type: shape.type,
                  x: cursorX,
                  y: cursorY,
                });
                cursorY += 80 + gap;
              } else {
                const col = i % 2;
                const row = Math.floor(i / 2);
                editor.updateShape({
                  id: shape.id,
                  type: shape.type,
                  x: 100 + col * (colWidth + gap),
                  y: 100 + row * (80 + gap),
                });
              }
            });
            break;
          }
          default:
            break;
        }
      } catch (err) {
        console.error("Tool execution error:", name, err);
      }
    }
  }

  async function handleSend() {
    if (!input.trim() || loading) return;
    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);
    try {
      const canvasState = getCanvasStateSummary();
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          history: messages
            .filter((m) => m.role !== "system")
            .map((m) => ({ role: m.role, content: m.content })),
          canvasState,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI 請求失敗");
      const assistantMsg = data.message;
      const content = assistantMsg?.content || "（無文字回覆）";
      const toolCalls = assistantMsg?.tool_calls || [];
      if (toolCalls.length > 0) await executeToolCalls(toolCalls);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            content +
            (toolCalls.length ? `\n\n（已執行 ${toolCalls.length} 個操作）` : ""),
          toolCalls,
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `發生錯誤：${err.message}` },
      ]);
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="ai-panel">
      <div className="ai-header">
        <div>
          <strong>Blessas v1</strong>
          <span>nvidia/nemotron-3.5-super-vl-120b-a12b</span>
        </div>
        <button className="ai-close" onClick={onClose} aria-label="關閉">
          ×
        </button>
      </div>

      <div className="ai-messages">
        {messages.map((m, i) => (
          <div key={i} className={`msg ${m.role === "user" ? "user" : "assistant"}`}>
            {m.content}
          </div>
        ))}
        {loading && <div className="ai-loading">Blessas 思考中...</div>}
        <div ref={bottomRef} />
      </div>

      <div className="ai-input-row">
        <input
          className="input"
          placeholder="輸入指令，例如：在左上角寫待辦事項"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          disabled={loading}
        />
        <button className="btn" onClick={handleSend} disabled={loading || !input.trim()}>
          送出
        </button>
      </div>
    </div>
  );
}
