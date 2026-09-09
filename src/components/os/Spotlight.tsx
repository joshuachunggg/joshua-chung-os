"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useOS, type AppId } from "@/system/store";
import { APPS, DOCK_APPS } from "@/system/apps";
import { AppIcon } from "@/system/icons";
import { projects } from "@/data/resume";

interface Result {
  key: string;
  title: string;
  subtitle: string;
  appId: AppId;
  icon: AppId;
  /** overrides the app icon (e.g. a project's product logo) */
  image?: string;
}

export function Spotlight() {
  const open = useOS((s) => s.spotlightOpen);
  const { setSpotlight, openApp } = useOS.getState();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  const results = useMemo<Result[]>(() => {
    const q = query.trim().toLowerCase();
    const apps: Result[] = DOCK_APPS.map((id) => APPS[id]).map((a) => ({
      key: `app-${a.id}`,
      title: a.name,
      subtitle: "Application",
      appId: a.id,
      icon: a.id,
    }));
    const projs: Result[] = projects.map((p) => ({
      key: `proj-${p.id}`,
      title: p.name,
      subtitle: `Project: ${p.summary.slice(0, 60)}…`,
      appId: "projects" as AppId,
      icon: "projects" as AppId,
      image: p.image,
    }));
    if (!q) return apps;
    return [...apps, ...projs].filter((r) => {
      const hay = `${r.title} ${r.subtitle} ${APPS[r.appId].keywords.join(" ")}`.toLowerCase();
      return q.split(/\s+/).every((part) => hay.includes(part));
    });
  }, [query]);

  if (!open) return null;

  const run = (r: Result | undefined) => {
    if (!r) return;
    openApp(r.appId);
  };

  return (
    <div
      className="fixed inset-0 z-[8000] flex justify-center pt-[18vh]"
      onClick={() => setSpotlight(false)}
    >
      <div
        className="liquid-glass-strong glass-sheen anim-spotlight-pop h-fit w-[640px] max-w-[92vw] overflow-hidden rounded-[22px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative z-10 flex items-center gap-3 px-5 py-4">
          <svg width="22" height="22" viewBox="0 0 16 16" fill="none" stroke="var(--text-secondary)" strokeWidth="1.6" strokeLinecap="round">
            <circle cx="7" cy="7" r="4.6" />
            <path d="M10.5 10.5 L 13.6 13.6" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelected(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") setSpotlight(false);
              if (e.key === "Enter") run(results[selected]);
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setSelected((s) => Math.min(s + 1, results.length - 1));
              }
              if (e.key === "ArrowUp") {
                e.preventDefault();
                setSelected((s) => Math.max(s - 1, 0));
              }
            }}
            placeholder="Spotlight Search"
            className="w-full bg-transparent text-[22px] font-light outline-none placeholder:text-[var(--text-tertiary)]"
            style={{ color: "var(--text-primary)" }}
          />
        </div>
        {results.length > 0 && (
          <div className="relative z-10 border-t px-2 pb-2 pt-1" style={{ borderColor: "var(--divider)" }}>
            <div className="macos-scroll max-h-[320px]">
              {results.map((r, i) => (
                <button
                  key={r.key}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left"
                  style={{
                    background: i === selected ? "var(--menu-hover)" : "transparent",
                    color: i === selected ? "#fff" : "var(--text-primary)",
                  }}
                  onMouseEnter={() => setSelected(i)}
                  onClick={() => run(r)}
                >
                  {r.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.image} alt="" width={30} height={30} draggable={false} />
                  ) : (
                    <AppIcon id={r.icon} size={30} />
                  )}
                  <div className="min-w-0">
                    <div className="truncate text-[14px] font-medium">{r.title}</div>
                    <div
                      className="truncate text-[12px]"
                      style={{ color: i === selected ? "rgba(255,255,255,0.75)" : "var(--text-secondary)" }}
                    >
                      {r.subtitle}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
