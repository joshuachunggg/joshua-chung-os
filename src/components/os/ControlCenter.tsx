"use client";

import { useState } from "react";
import { useOS, type WallpaperId } from "@/system/store";
import { WALLPAPERS, wallpaperPreview } from "./Wallpaper";

export function ControlCenter() {
  const open = useOS((s) => s.controlCenterOpen);
  const dark = useOS((s) => s.dark);
  const wallpaper = useOS((s) => s.wallpaper);
  const soundEnabled = useOS((s) => s.soundEnabled);
  const { setDark, setWallpaper, setControlCenter, setSoundEnabled } = useOS.getState();
  const [brightness, setBrightness] = useState(100);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-[6000]" onClick={() => setControlCenter(false)} />
      <div
        className="liquid-glass-strong glass-sheen anim-menu-pop absolute right-2 top-[34px] z-[6001] w-[min(320px,calc(100vw-16px))] rounded-[20px] p-3"
        style={{ transformOrigin: "top right", color: "var(--text-primary)" }}
      >
        <div className="relative z-10 grid grid-cols-2 gap-3">
          {/* Appearance toggle */}
          <button
            className="col-span-1 flex flex-col justify-between rounded-2xl p-3 text-left"
            style={{
              background: dark ? "rgba(10,132,255,0.9)" : "rgba(255,255,255,0.4)",
              color: dark ? "#fff" : "var(--text-primary)",
              minHeight: 92,
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)",
            }}
            onClick={() => setDark(!dark)}
          >
            {dark ? <MoonIcon /> : <SunIcon />}
            <div>
              <div className="text-[13px] font-semibold">Appearance</div>
              <div className="text-[12px] opacity-70">{dark ? "Dark" : "Light"}</div>
            </div>
          </button>

          {/* Sound toggle */}
          <button
            className="col-span-1 flex flex-col justify-between rounded-2xl p-3 text-left"
            style={{
              background: soundEnabled ? "rgba(10,132,255,0.9)" : "rgba(255,255,255,0.4)",
              color: soundEnabled ? "#fff" : "var(--text-primary)",
              minHeight: 92,
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)",
            }}
            onClick={() => setSoundEnabled(!soundEnabled)}
          >
            <SpeakerIcon muted={!soundEnabled} />
            <div>
              <div className="text-[13px] font-semibold">Sound Effects</div>
              <div className="text-[12px] opacity-70">{soundEnabled ? "On" : "Off"}</div>
            </div>
          </button>

          {/* Brightness */}
          <div
            className="col-span-2 rounded-2xl p-3"
            style={{ background: "rgba(255,255,255,0.35)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)" }}
          >
            <div className="mb-2 text-[13px] font-semibold">Display</div>
            <input
              type="range"
              min={40}
              max={100}
              value={brightness}
              onChange={(e) => {
                const v = Number(e.target.value);
                setBrightness(v);
                document.getElementById("os-root")!.style.filter = `brightness(${v / 100})`;
              }}
              className="w-full accent-white"
            />
          </div>

          {/* Wallpapers */}
          <div
            className="col-span-2 rounded-2xl p-3"
            style={{ background: "rgba(255,255,255,0.35)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)" }}
          >
            <div className="mb-2 text-[13px] font-semibold">Wallpaper</div>
            <div className="flex gap-2">
              {(Object.keys(WALLPAPERS) as WallpaperId[]).map((id) => (
                <button
                  key={id}
                  title={WALLPAPERS[id].name}
                  className="h-10 flex-1 rounded-lg transition-transform hover:scale-105"
                  style={{
                    background: wallpaperPreview(id),
                    outline: wallpaper === id ? "2px solid var(--accent)" : "1px solid rgba(255,255,255,0.4)",
                    outlineOffset: 2,
                  }}
                  onClick={() => setWallpaper(id)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function SunIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="4.4" fill="currentColor" />
      <path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.5 14.6A8.8 8.8 0 0 1 9.4 3.5a8.8 8.8 0 1 0 11.1 11.1z" />
    </svg>
  );
}

function SpeakerIcon({ muted }: { muted: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <path d="M4 9.5 v5 h3.5 L13 19 V5 L7.5 9.5 Z" />
      {muted ? (
        <path d="M16 9 l5 6 M21 9 l-5 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      ) : (
        <path
          d="M16 8.5 a5 5 0 0 1 0 7 M18.5 6 a8.5 8.5 0 0 1 0 12"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          fill="none"
        />
      )}
    </svg>
  );
}
