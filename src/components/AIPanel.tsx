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

function snap(n: number, grid = 20) {
  return Math.round(n / grid) * grid;
}

export default function AIPanel({ editor, isOpen, onClose }: AIPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "你好，我是 Blessas v1。\n白板就是我的記憶：你叫我寫的東西會實際出現在格子上。\n試試：「寫三項今日待辦」或「目前白板有什麼？」",
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
      if (type === "text" || type === "geo") {
        const text = (shape as any).props?.text || "";
        return `- [${id}] ${type} @ (${x}, ${y}) : "${String(text).slice(0, 120)}"`;
      }
      if (type === "image") return `- [${id}] image @ (${x}, ${y})`;
      return `- [${id}] ${type} @ (${x}, ${y})`;
    });
    return `共 ${shapes.length} 個物件：\n` + summary.join("\n");
  }

  /** 找一塊空白區域放新內容（簡易） */
  function nextEmptySpot() {
    if (!editor) return { x: 100, y: 100 };
    const shapes = editor.getCurrentPageShapes();
    if (!shapes.length) return { x: 100, y: 100 };
    let maxY = 0;
    for (const s of shapes) {
      maxY = Math.max(maxY, s.y + 80);
    }
    return { x: 100, y: snap(maxY + 40) };
  }

  async function executeToolCalls(toolCalls: any[]) {
    if (!editor || !toolCalls?.length) return 0;
    let count = 0;
    let autoY: number | null = null;

    for (const tc of toolCalls) {
      const name = tc.function?.name || tc.name;
      let args: any = {};
      try {
        const raw = tc.function?.arguments ?? tc.arguments ?? "{}";
        args = typeof raw === "string" ? JSON.parse(raw || "{}") : raw;
      } catch {
        continue;
      }

      try {
        switch (name) {
          case "get_canvas_state": {
            // 狀態已注入，略
            break;
          }
          case "add_text": {
            const spot = nextEmptySpot();
            let x = args.x != null ? snap(Number(args.x)) : spot.x;
            let y =
              args.y != null
                ? snap(Number(args.y))
                : autoY != null
                  ? autoY
                  : spot.y;
            if (autoY == null) autoY = y;
            else if (args.y == null) {
              y = autoY;
            }
            autoY = y + 100;

            editor.createShape({
              type: "text",
              x,
              y,
              props: {
                text: String(args.text || "新文字"),
                size: "m",
                color: "black",
                font: "sans",
                textAlign: "start",
                autoSize: true,
                w: args.width || 320,
              },
            });
            count++;
            break;
          }
          case "update_text": {
            if (args.shapeId) {
              const shape = editor.getShape(args.shapeId as any);
              if (shape && (shape.type === "text" || shape.type === "geo")) {
                editor.updateShape({
                  id: shape.id,
                  type: shape.type as any,
                  props: {
                    ...(shape as any).props,
                    text: args.text ?? (shape as any).props.text,
                  },
                });
                count++;
              }
            }
            break;
          }
          case "delete_shapes": {
            if (args.shapeIds?.length) {
              editor.deleteShapes(args.shapeIds as any);
              count++;
            }
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
                    x: snap(shape.x + dx),
                    y: snap(shape.y + dy),
                  });
                }
              }
              count++;
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
                  x: snap(cursorX),
                  y: snap(cursorY),
                });
                cursorX += colWidth + gap;
              } else if (args.layout === "column") {
                editor.updateShape({
                  id: shape.id,
                  type: shape.type,
                  x: snap(cursorX),
                  y: snap(cursorY),
                });
                cursorY += 80 + gap;
              } else {
                const col = i % 2;
                const row = Math.floor(i / 2);
                editor.updateShape({
                  id: shape.id,
                  type: shape.type,
                  x: snap(100 + col * (colWidth + gap)),
                  y: snap(100 + row * (80 + gap)),
                });
              }
            });
            count++;
            break;
          }
          default:
            break;
        }
      } catch (err) {
        console.error("Tool execution error:", name, err);
      }
    }
    return count;
  }

  async function handleSend() {
    if (!input.trim() || loading) return;
    if (!editor) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "畫布還沒準備好，請稍候再試。" },
      ]);
      return;
    }

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
            .slice(-12)
            .map((m) => ({ role: m.role, content: m.content })),
          canvasState,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI 請求失敗");

      const assistantMsg = data.message;
      let content = assistantMsg?.content || "";
      const toolCalls = assistantMsg?.tool_calls || [];
      const executed = await executeToolCalls(toolCalls);

      if (!content) {
        content =
          executed > 0
            ? `已在白板上完成 ${executed} 個操作。`
            : "（模型沒有回傳內容，也沒有可執行的操作）";
      } else if (executed > 0) {
        content = content + `\n\n✓ 已寫入白板（${executed}）`;
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content, toolCalls },
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
          <span>白板即記憶 · 格子模式</span>
        </div>
        <button className="ai-close" onClick={onClose} aria-label="關閉">
          ×
        </button>
      </div>

      <div className="ai-messages">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`msg ${m.role === "user" ? "user" : "assistant"}`}
          >
            {m.content}
          </div>
        ))}
        {loading && <div className="ai-loading">Blessas 思考並寫入白板中...</div>}
        <div ref={bottomRef} />
      </div>

      <div className="ai-input-row">
        <input
          className="input"
          placeholder="例如：寫三項今日待辦"
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
        <button
          className="btn"
          onClick={handleSend}
          disabled={loading || !input.trim()}
        >
          送出
        </button>
      </div>
    </div>
  );
}
