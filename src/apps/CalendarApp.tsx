"use client";

import { useState } from "react";
import { useOS } from "@/system/store";

/**
 * Calendar — books calls and video meetings with Pranav through a self-hosted
 * Cal.diy instance (cloned from github.com/calcom/cal.diy, running separately).
 *
 * The instance base URL is configurable so production can point at a hosted
 * deployment while dev uses the local server.
 */
const CAL_BASE = process.env.NEXT_PUBLIC_CAL_URL ?? "http://localhost:3002";
const CAL_USER = process.env.NEXT_PUBLIC_CAL_USERNAME ?? "pranav";

type ViewId = "all" | "phone-call" | "video-meeting";

const VIEWS: { id: ViewId; label: string; icon: string }[] = [
  { id: "all", label: "All", icon: "📅" },
  { id: "phone-call", label: "Phone Call · 15 min", icon: "📞" },
  { id: "video-meeting", label: "Video Meeting · 30 min", icon: "🎥" },
];

export function CalendarApp() {
  const dark = useOS((s) => s.dark);
  const [view, setView] = useState<ViewId>("all");
  const [loaded, setLoaded] = useState(false);

  const path = view === "all" ? CAL_USER : `${CAL_USER}/${view}`;
  const src = `${CAL_BASE}/${path}?theme=${dark ? "dark" : "light"}`;

  return (
    <div className="flex h-full flex-col" style={{ background: "var(--content-bg)" }}>
      {/* toolbar */}
      <div
        className="flex flex-none items-center justify-between gap-2 border-b px-3 py-2"
        style={{ borderColor: "var(--divider)" }}
      >
        <div
          className="flex rounded-lg p-0.5"
          style={{ background: "var(--sidebar-bg)" }}
        >
          {VIEWS.map((v) => (
            <button
              key={v.id}
              onClick={() => {
                if (v.id === view) return;
                setLoaded(false);
                setView(v.id);
              }}
              className="rounded-md px-3 py-1 text-[12.5px] font-medium transition-colors"
              style={
                view === v.id
                  ? {
                      background: "var(--content-bg)",
                      color: "var(--text-primary)",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
                    }
                  : { color: "var(--text-secondary)" }
              }
            >
              <span className="mr-1">{v.icon}</span>
              {v.label}
            </button>
          ))}
        </div>
        <span className="hidden text-[12px] sm:block" style={{ color: "var(--text-tertiary)" }}>
          Schedule time with Pranav
        </span>
      </div>

      {/* booking page */}
      <div className="relative min-h-0 flex-1">
        {!loaded && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-3"
            style={{ background: "var(--content-bg)" }}
          >
            <div
              className="h-8 w-8 animate-spin rounded-full border-[3px] border-t-transparent"
              style={{ borderColor: "var(--text-tertiary)", borderTopColor: "transparent" }}
            />
            <span className="text-[12.5px]" style={{ color: "var(--text-tertiary)" }}>
              Loading calendar…
            </span>
          </div>
        )}
        <iframe
          key={src}
          src={src}
          title="Book time with Pranav"
          className="h-full w-full border-0"
          style={{ opacity: loaded ? 1 : 0, transition: "opacity 0.3s ease" }}
          onLoad={() => setLoaded(true)}
          allow="camera; microphone; fullscreen; clipboard-write"
        />
      </div>
    </div>
  );
}
