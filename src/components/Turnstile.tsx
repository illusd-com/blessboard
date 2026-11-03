"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        opts: {
          sitekey: string;
          callback?: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
        }
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
    onTurnstileLoad?: () => void;
  }
}

const SITE_KEY =
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "0x4AAAAAAFyLaSuEYzRAQdLn";

export default function Turnstile({
  onToken,
}: {
  onToken: (token: string | null) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    function render() {
      if (cancelled || !ref.current || !window.turnstile) return;
      if (widgetId.current) {
        try {
          window.turnstile.remove(widgetId.current);
        } catch {}
      }
      widgetId.current = window.turnstile.render(ref.current, {
        sitekey: SITE_KEY,
        callback: (token) => onToken(token),
        "expired-callback": () => onToken(null),
        "error-callback": () => onToken(null),
        theme: "light",
      });
    }

    if (window.turnstile) {
      render();
    } else {
      const existing = document.querySelector(
        'script[src*="challenges.cloudflare.com/turnstile"]'
      );
      if (!existing) {
        const s = document.createElement("script");
        s.src =
          "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
        s.async = true;
        s.onload = () => render();
        document.body.appendChild(s);
      } else {
        const t = setInterval(() => {
          if (window.turnstile) {
            clearInterval(t);
            render();
          }
        }, 50);
        return () => {
          cancelled = true;
          clearInterval(t);
        };
      }
    }

    return () => {
      cancelled = true;
      if (widgetId.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetId.current);
        } catch {}
      }
    };
  }, [onToken]);

  return <div ref={ref} style={{ margin: "12px 0" }} />;
}
