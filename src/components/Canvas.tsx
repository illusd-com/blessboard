"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Tldraw,
  Editor,
  createTLStore,
  getSnapshot,
  loadSnapshot,
  defaultShapeUtils,
  defaultBindingUtils,
} from "tldraw";
import "tldraw/tldraw.css";

interface CanvasProps {
  slug: string;
  initialSnapshot?: any;
  onEditorReady?: (editor: Editor) => void;
  ownerToken?: string;
}

export default function Canvas({
  slug,
  initialSnapshot,
  onEditorReady,
  ownerToken,
}: CanvasProps) {
  const store = useMemo(
    () =>
      createTLStore({
        shapeUtils: defaultShapeUtils,
        bindingUtils: defaultBindingUtils,
      }),
    []
  );

  const [ready, setReady] = useState(false);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (
      initialSnapshot &&
      (initialSnapshot.document || Object.keys(initialSnapshot).length > 0)
    ) {
      try {
        loadSnapshot(store, initialSnapshot);
      } catch (e) {
        console.warn("Failed to load snapshot", e);
      }
    }
    setReady(true);
  }, [initialSnapshot, store]);

  const scheduleSave = useCallback(
    (editor: Editor) => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(async () => {
        try {
          const snapshot = getSnapshot(editor.store);
          await fetch(`/api/boards/${slug}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ snapshot, ownerToken }),
          });
        } catch (err) {
          console.error("Auto-save failed", err);
        }
      }, 1500);
    },
    [slug, ownerToken]
  );

  const handleMount = useCallback(
    (editor: Editor) => {
      // 開啟格子模式（一格一格）
      try {
        editor.updateInstanceState({ isGridMode: true });
        editor.user.updateUserPreferences({ isSnapMode: true });
      } catch (e) {
        console.warn("grid mode setup", e);
      }

      onEditorReady?.(editor);

      const unsub = editor.store.listen(
        () => scheduleSave(editor),
        { source: "user", scope: "document" }
      );
      return () => {
        unsub();
        if (saveTimeout.current) clearTimeout(saveTimeout.current);
      };
    },
    [onEditorReady, scheduleSave]
  );

  if (!ready) {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#fff",
          color: "#a3a3a3",
          fontSize: 14,
        }}
      >
        載入白板中...
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: "100%", background: "#fff" }}>
      <Tldraw
        store={store}
        onMount={handleMount}
        // 白底格子感
        inferDarkMode={false}
      />
    </div>
  );
}
