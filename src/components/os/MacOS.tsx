"use client";

import { useEffect, useState } from "react";
import { useOS, mobileBounds, type AppId } from "@/system/store";
import { Wallpaper } from "./Wallpaper";
import { MenuBar } from "./MenuBar";
import { Dock } from "./Dock";
import { WindowFrame } from "./Window";
import { Spotlight } from "./Spotlight";
import { ControlCenter } from "./ControlCenter";
import { PeripheralSounds } from "./PeripheralSounds";
import { AppIcon } from "@/system/icons";

const MOBILE_QUERY = "(max-width: 820px)";

export function MacOS() {
  const windows = useOS((s) => s.windows);
  const order = useOS((s) => s.order);
  const mobile = useOS((s) => s.mobile);

  // A focused, non-minimized fullscreen window hides the menu bar and dock…
  const fullscreenActive = useOS((s) => {
    const a = s.activeApp ? s.windows[s.activeApp] : null;
    return !!a && a.fullscreen && !a.minimized;
  });
  // …unless the pointer peeks at the screen edges (like macOS auto-reveal).
  const [peekTop, setPeekTop] = useState(false);
  const [peekBottom, setPeekBottom] = useState(false);

  // Mobile detection
  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY);
    const apply = () => useOS.getState().setMobile(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  // Re-clamp window bounds on viewport resize / rotation
  useEffect(() => {
    const onResize = () => {
      const os = useOS.getState();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      for (const id of os.order) {
        const w = os.windows[id];
        if (!w) continue;
        if (w.fullscreen) os.setBounds(id, { x: 0, y: 0, w: vw, h: vh });
        else if (os.mobile) os.setBounds(id, mobileBounds());
        else
          os.setBounds(id, {
            x: Math.min(w.x, Math.max(8, vw - 80)),
            y: Math.min(Math.max(24, w.y), Math.max(24, vh - 60)),
          });
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Global keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const os = useOS.getState();
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === " ")) {
        e.preventDefault();
        os.setSpotlight(!os.spotlightOpen);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "w" && os.activeApp) {
        e.preventDefault();
        os.closeApp(os.activeApp);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "m" && os.activeApp) {
        e.preventDefault();
        os.minimizeApp(os.activeApp);
      }
      if (e.key === "Escape") {
        if (os.spotlightOpen) {
          os.setSpotlight(false);
        } else if (os.activeApp && os.windows[os.activeApp]?.fullscreen) {
          os.toggleFullscreen(os.activeApp);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Edge peek while fullscreen
  useEffect(() => {
    if (!fullscreenActive) {
      setPeekTop(false);
      setPeekBottom(false);
      return;
    }
    const onMove = (e: PointerEvent) => {
      const vh = window.innerHeight;
      setPeekTop((p) => (p ? e.clientY < 34 : e.clientY < 4));
      setPeekBottom((p) => (p ? e.clientY > vh - 110 : e.clientY > vh - 4));
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [fullscreenActive]);

  // Open the profile immediately; the desktop is the landing page.
  useEffect(() => {
    const t = setTimeout(() => useOS.getState().openApp("about"), 120);
    return () => clearTimeout(t);
  }, []);

  const menuBarHidden = fullscreenActive && !peekTop;
  const dockHidden = fullscreenActive && !peekBottom;

  return (
    <div id="os-root" className="fixed inset-0 overflow-hidden">
      <Wallpaper />
      <PeripheralSounds />

      <>
          {/* Desktop icons */}
          <div
            className={`absolute right-5 z-[10] flex flex-col items-center gap-5 ${
              mobile ? "top-10" : "top-12"
            }`}
          >
            <DesktopIcon label="Contact Joshua" appId="contact" />
            <DesktopIcon label="Projects" appId="projects" />
          </div>

          {/* Windows */}
          {order.map((id) => {
            const w = windows[id];
            return w ? <WindowFrame key={id} win={w} /> : null;
          })}

          <MenuBar hidden={menuBarHidden} />
          <ControlCenter />
          <Dock hidden={dockHidden} />
          <Spotlight />

          <HintPill mobile={mobile} />
      </>
    </div>
  );
}

function DesktopIcon({ label, appId }: { label: string; appId: AppId }) {
  const openApp = useOS((s) => s.openApp);
  const mobile = useOS((s) => s.mobile);
  return (
    <button
      className="group flex w-[84px] flex-col items-center gap-1 rounded-lg p-1.5"
      onClick={() => openApp(appId)}
    >
      <span className="rounded-xl p-0.5 transition-colors group-focus:bg-white/20">
        <AppIcon id={appId} size={mobile ? 44 : 52} className="drop-shadow-[0_5px_10px_rgba(0,0,0,0.35)]" />
      </span>
      <span
        className="rounded-[5px] px-1.5 py-px text-[12px] font-medium text-white group-focus:bg-[#0a84ff]"
        style={{ textShadow: "0 1px 3px rgba(0,0,0,0.6)" }}
      >
        {label}
      </span>
    </button>
  );
}

function HintPill({ mobile }: { mobile: boolean }) {
  const anyWindow = useOS((s) => s.order.length > 1);
  if (anyWindow) return null;
  return (
    <div
      className="anim-fade-in pointer-events-none absolute bottom-24 left-1/2 z-[100] w-max -translate-x-1/2 rounded-full px-4 py-1.5 text-[12.5px] text-white/85"
      style={{
        background: "rgba(0,0,0,0.3)",
        backdropFilter: "blur(20px)",
        textShadow: "0 1px 2px rgba(0,0,0,0.4)",
        opacity: 0,
        animationDelay: "2.5s",
        animationFillMode: "forwards",
      }}
    >
      {mobile ? "Tap an app in the dock to explore" : "Press ⌘K for Spotlight · Explore the dock below"}
    </div>
  );
}
