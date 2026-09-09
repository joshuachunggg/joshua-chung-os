"use client";

import { useEffect, useRef, useState } from "react";
import { useOS, type OSWindow, type WindowBounds } from "@/system/store";
import { APPS } from "@/system/apps";

const MENUBAR_H = 30;
const GEOM_TRANSITION =
  "left 0.38s cubic-bezier(0.32, 0.72, 0.22, 1), top 0.38s cubic-bezier(0.32, 0.72, 0.22, 1), width 0.38s cubic-bezier(0.32, 0.72, 0.22, 1), height 0.38s cubic-bezier(0.32, 0.72, 0.22, 1), border-radius 0.38s ease";

type ResizeDir = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

const RESIZE_HANDLES: { dir: ResizeDir; style: React.CSSProperties }[] = [
  { dir: "n", style: { top: -4, left: 12, right: 12, height: 8, cursor: "ns-resize" } },
  { dir: "s", style: { bottom: -4, left: 12, right: 12, height: 8, cursor: "ns-resize" } },
  { dir: "e", style: { right: -4, top: 12, bottom: 12, width: 8, cursor: "ew-resize" } },
  { dir: "w", style: { left: -4, top: 12, bottom: 12, width: 8, cursor: "ew-resize" } },
  { dir: "ne", style: { top: -5, right: -5, width: 14, height: 14, cursor: "nesw-resize" } },
  { dir: "nw", style: { top: -5, left: -5, width: 14, height: 14, cursor: "nwse-resize" } },
  { dir: "se", style: { bottom: -5, right: -5, width: 14, height: 14, cursor: "nwse-resize" } },
  { dir: "sw", style: { bottom: -5, left: -5, width: 14, height: 14, cursor: "nesw-resize" } },
];

/** Where minimized windows fly to: the anchor span at the right end of the dock. */
function dockTarget(): { x: number; y: number } {
  const anchor = document.getElementById("dock-min-anchor");
  if (anchor) {
    const r = anchor.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }
  return { x: window.innerWidth / 2, y: window.innerHeight - 40 };
}

export function WindowFrame({ win }: { win: OSWindow }) {
  const def = APPS[win.appId];
  const ref = useRef<HTMLDivElement>(null);
  const focused = useOS((s) => s.activeApp === win.appId);
  const mobile = useOS((s) => s.mobile);
  const { focusApp, closeApp, minimizeApp, toggleMaximize, toggleFullscreen, setBounds } =
    useOS.getState();
  const [closing, setClosing] = useState(false);
  const [minimizing, setMinimizing] = useState(false);
  const [geomAnimating, setGeomAnimating] = useState(false);
  const prevMinimized = useRef(win.minimized);
  const boundsRef = useRef<WindowBounds>({ x: win.x, y: win.y, w: win.w, h: win.h });
  boundsRef.current = { x: win.x, y: win.y, w: win.w, h: win.h };

  /* ---- minimize / restore: fly to and from the dock (macOS scale effect) ---- */

  const handleMinimize = () => {
    if (win.fullscreen || minimizing) return;
    const el = ref.current;
    if (!el) return;
    setMinimizing(true);
    const rect = el.getBoundingClientRect();
    const t = dockTarget();
    const s = 0.05;
    const tx = t.x - rect.left - (rect.width * s) / 2;
    const ty = t.y - rect.top - (rect.height * s) / 2;
    el.style.transformOrigin = "0 0";
    el.style.transition =
      "transform 0.4s cubic-bezier(0.5, 0.05, 0.7, 0.5), opacity 0.4s cubic-bezier(0.7, 0, 1, 1)";
    el.style.transform = `translate(${tx}px, ${ty}px) scale(${s})`;
    el.style.opacity = "0";
    setTimeout(() => {
      minimizeApp(win.appId);
      setMinimizing(false);
      // keep the element hidden (visibility) but reset its transform state
      el.style.transition = "";
      el.style.transform = "";
      el.style.opacity = "";
    }, 400);
  };

  // Restore animation when minimized goes true -> false
  useEffect(() => {
    const el = ref.current;
    if (prevMinimized.current && !win.minimized && el) {
      const rect = el.getBoundingClientRect();
      const t = dockTarget();
      const s = 0.05;
      const tx = t.x - rect.left - (rect.width * s) / 2;
      const ty = t.y - rect.top - (rect.height * s) / 2;
      el.style.transformOrigin = "0 0";
      el.style.transition = "none";
      el.style.transform = `translate(${tx}px, ${ty}px) scale(${s})`;
      el.style.opacity = "0";
      void el.getBoundingClientRect(); // force reflow
      el.style.transition =
        "transform 0.4s cubic-bezier(0.2, 0.6, 0.25, 1), opacity 0.3s ease-out";
      el.style.transform = "";
      el.style.opacity = "";
      const timer = setTimeout(() => {
        el.style.transition = "";
      }, 450);
      prevMinimized.current = win.minimized;
      return () => clearTimeout(timer);
    }
    prevMinimized.current = win.minimized;
  }, [win.minimized]);

  /* ---- close: quick macOS fade/scale out ---- */

  const handleClose = () => {
    if (closing) return;
    setClosing(true);
    setTimeout(() => closeApp(win.appId), 170);
  };

  /* ---- fullscreen (green) and zoom (option-green / double-click) ---- */

  const animateGeometry = (fn: () => void) => {
    setGeomAnimating(true);
    fn();
    setTimeout(() => setGeomAnimating(false), 420);
  };

  const handleGreen = (e: React.MouseEvent) => {
    if (mobile) {
      animateGeometry(() => toggleFullscreen(win.appId));
      return;
    }
    if (e.altKey && !win.fullscreen) {
      animateGeometry(() => toggleMaximize(win.appId)); // ⌥-click = zoom, like macOS
    } else {
      animateGeometry(() => toggleFullscreen(win.appId));
    }
  };

  const handleTitlebarDoubleClick = () => {
    if (win.fullscreen || mobile) return;
    animateGeometry(() => toggleMaximize(win.appId)); // double-click title bar = zoom
  };

  /* ---- drag / resize (desktop only) ---- */

  const applyStyle = (b: WindowBounds) => {
    const el = ref.current;
    if (!el) return;
    el.style.left = `${b.x}px`;
    el.style.top = `${b.y}px`;
    el.style.width = `${b.w}px`;
    el.style.height = `${b.h}px`;
  };

  const startDrag = (e: React.PointerEvent) => {
    if (win.maximized || win.fullscreen || mobile) return;
    if ((e.target as HTMLElement).closest("[data-nodrag]")) return;
    e.preventDefault();
    focusApp(win.appId);
    const startX = e.clientX;
    const startY = e.clientY;
    const orig = { ...boundsRef.current };
    let latest = orig;
    let raf = 0;

    const onMove = (ev: PointerEvent) => {
      const nx = orig.x + (ev.clientX - startX);
      const ny = Math.max(MENUBAR_H - 6, orig.y + (ev.clientY - startY));
      latest = { ...orig, x: nx, y: ny };
      if (!raf)
        raf = requestAnimationFrame(() => {
          applyStyle(latest);
          raf = 0;
        });
    };
    const onUp = () => {
      cancelAnimationFrame(raf);
      applyStyle(latest);
      setBounds(win.appId, { x: latest.x, y: latest.y });
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const startResize = (e: React.PointerEvent, dir: ResizeDir) => {
    if (win.maximized || win.fullscreen || mobile) return;
    e.preventDefault();
    e.stopPropagation();
    focusApp(win.appId);
    const startX = e.clientX;
    const startY = e.clientY;
    const orig = { ...boundsRef.current };
    let latest = orig;
    let raf = 0;

    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      let { x, y, w, h } = orig;
      if (dir.includes("e")) w = Math.max(def.minW, orig.w + dx);
      if (dir.includes("s")) h = Math.max(def.minH, orig.h + dy);
      if (dir.includes("w")) {
        w = Math.max(def.minW, orig.w - dx);
        x = orig.x + (orig.w - w);
      }
      if (dir.includes("n")) {
        h = Math.max(def.minH, orig.h - dy);
        y = Math.max(MENUBAR_H - 6, orig.y + (orig.h - h));
      }
      latest = { x, y, w, h };
      if (!raf)
        raf = requestAnimationFrame(() => {
          applyStyle(latest);
          raf = 0;
        });
    };
    const onUp = () => {
      cancelAnimationFrame(raf);
      applyStyle(latest);
      setBounds(win.appId, latest);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const Content = def.component;
  const dark = def.transparent;
  const radius = win.fullscreen ? 0 : mobile ? 16 : 20;
  const hidden = win.minimized && !minimizing;

  return (
    <div
      ref={ref}
      className={`absolute flex flex-col ${closing ? "anim-window-close" : "anim-window-open"}`}
      style={{
        left: win.x,
        top: win.y,
        width: win.w,
        height: win.h,
        zIndex: win.z + (win.fullscreen ? 6000 : 0),
        borderRadius: radius,
        visibility: hidden ? "hidden" : "visible",
        pointerEvents: hidden || closing ? "none" : "auto",
        ...(geomAnimating ? { transition: GEOM_TRANSITION } : {}),
      }}
      onPointerDown={() => focusApp(win.appId)}
    >
      <div
        className="flex h-full w-full flex-col overflow-hidden"
        style={{
          borderRadius: radius,
          transition: geomAnimating ? "border-radius 0.38s ease" : undefined,
          ...(dark
            ? {
                background: "rgb(24, 24, 30)",
                border: "0.5px solid rgba(255,255,255,0.18)",
                boxShadow:
                  "inset 0 1px 0 rgba(255,255,255,0.12), 0 24px 70px rgba(0,0,0,0.5), 0 4px 16px rgba(0,0,0,0.3)",
              }
            : {
                background: "var(--window-chrome)",
                border: "0.5px solid var(--glass-border)",
                boxShadow: "inset 0 1px 0 var(--glass-highlight), var(--glass-shadow)",
              }),
          ...(focused ? {} : { filter: "brightness(0.985)", opacity: 0.985 }),
        }}
      >
        {/* Title bar */}
        <div
          className="relative z-10 flex h-11 flex-none items-center px-3"
          onPointerDown={startDrag}
          onDoubleClick={handleTitlebarDoubleClick}
          style={{ touchAction: "none" }}
        >
          <div className="traffic-lights flex items-center gap-2" data-nodrag>
            <TrafficLight
              color={focused ? "#ff5f57" : "rgba(140,140,145,0.5)"}
              onClick={handleClose}
              label="Close"
            >
              <svg viewBox="0 0 12 12" className="tl-symbol h-full w-full">
                <path d="M3.5 3.5 L8.5 8.5 M8.5 3.5 L3.5 8.5" stroke="rgba(77,0,0,0.7)" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
            </TrafficLight>
            <TrafficLight
              color={
                win.fullscreen
                  ? "rgba(140,140,145,0.5)"
                  : focused
                    ? "#febc2e"
                    : "rgba(140,140,145,0.5)"
              }
              onClick={win.fullscreen ? undefined : handleMinimize}
              label="Minimize"
              disabled={win.fullscreen}
            >
              <svg viewBox="0 0 12 12" className="tl-symbol h-full w-full">
                <path d="M2.8 6 H9.2" stroke="rgba(90,60,0,0.75)" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            </TrafficLight>
            <TrafficLight
              color={focused ? "#28c840" : "rgba(140,140,145,0.5)"}
              onClick={handleGreen}
              label={win.fullscreen ? "Exit Full Screen" : "Enter Full Screen"}
            >
              {win.fullscreen ? (
                /* arrows pointing inward */
                <svg viewBox="0 0 12 12" className="tl-symbol h-full w-full">
                  <path d="M5.4 5.4 L5.4 2.2 L2.2 5.4 Z" fill="rgba(0,70,0,0.72)" transform="rotate(180 3.8 3.8)" />
                  <path d="M6.6 6.6 L6.6 9.8 L9.8 6.6 Z" fill="rgba(0,70,0,0.72)" transform="rotate(180 8.2 8.2)" />
                </svg>
              ) : (
                /* arrows pointing outward */
                <svg viewBox="0 0 12 12" className="tl-symbol h-full w-full">
                  <path d="M5.2 2.4 L2.4 2.4 L2.4 5.2 Z M2.4 2.4 L5.4 5.4 Z" fill="rgba(0,70,0,0.72)" />
                  <path d="M6.8 9.6 L9.6 9.6 L9.6 6.8 Z" fill="rgba(0,70,0,0.72)" />
                </svg>
              )}
            </TrafficLight>
          </div>
          <div
            className="pointer-events-none absolute inset-x-0 text-center text-[13px] font-semibold tracking-[-0.01em]"
            style={{ color: dark ? "rgba(235,235,245,0.75)" : "var(--text-secondary)" }}
          >
            {def.name}
          </div>
        </div>

        {/* App content */}
        <div className="relative z-10 min-h-0 flex-1">
          <Content />
          {/* Unfocused windows: catch clicks (esp. over iframes) so we focus instead of selecting text */}
          {!focused && (
            <div
              className="absolute inset-0 z-50"
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                focusApp(win.appId);
              }}
            />
          )}
        </div>
      </div>

      {/* Resize handles */}
      {!win.maximized && !win.fullscreen && !mobile &&
        RESIZE_HANDLES.map((h) => (
          <div
            key={h.dir}
            className="absolute"
            style={{ ...h.style, zIndex: 20, touchAction: "none" }}
            onPointerDown={(e) => startResize(e, h.dir)}
          />
        ))}
    </div>
  );
}

function TrafficLight({
  color,
  onClick,
  label,
  disabled,
  children,
}: {
  color: string;
  onClick?: (e: React.MouseEvent) => void;
  label: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      onPointerDown={(e) => e.stopPropagation()}
      className="flex h-3 w-3 items-center justify-center rounded-full"
      style={{
        background: color,
        boxShadow: "inset 0 0 1px rgba(0,0,0,0.25), inset 0 1px 1px rgba(255,255,255,0.3)",
        cursor: disabled ? "default" : "pointer",
      }}
    >
      {disabled ? null : children}
    </button>
  );
}
