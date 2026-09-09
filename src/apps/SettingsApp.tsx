"use client";

import { useOS, type WallpaperId } from "@/system/store";
import { WALLPAPERS, wallpaperPreview } from "@/components/os/Wallpaper";

export function SettingsApp() {
  const dark = useOS((s) => s.dark);
  const wallpaper = useOS((s) => s.wallpaper);
  const { setDark, setWallpaper } = useOS.getState();

  return (
    <div className="macos-scroll h-full px-8 py-6" style={{ background: "var(--content-bg)" }}>
      <h2 className="text-[20px] font-bold tracking-tight">Appearance</h2>

      <Section title="Theme">
        <div className="flex gap-3">
          {[false, true].map((d) => (
            <button
              key={String(d)}
              className="flex-1 rounded-xl p-3 text-left"
              style={{
                background: d ? "#1c1c22" : "#f2f2f7",
                color: d ? "#fff" : "#1c1c22",
                outline: dark === d ? "2.5px solid var(--accent)" : "1px solid var(--divider)",
                outlineOffset: 2,
              }}
              onClick={() => setDark(d)}
            >
              <div
                className="mb-2 h-14 rounded-lg"
                style={{
                  background: d
                    ? "linear-gradient(160deg, #2c2c34, #101014)"
                    : "linear-gradient(160deg, #ffffff, #dfe3ea)",
                  border: "1px solid rgba(128,128,140,0.25)",
                }}
              />
              <div className="text-[13px] font-semibold">{d ? "Dark" : "Light"}</div>
            </button>
          ))}
        </div>
      </Section>

      <Section title="Wallpaper">
        <div className="grid grid-cols-2 gap-3">
          {(Object.keys(WALLPAPERS) as WallpaperId[]).map((id) => (
            <button
              key={id}
              className="rounded-xl p-2 text-left"
              style={{
                outline: wallpaper === id ? "2.5px solid var(--accent)" : "1px solid var(--divider)",
                outlineOffset: 2,
              }}
              onClick={() => setWallpaper(id)}
            >
              <div className="h-20 rounded-lg" style={{ background: wallpaperPreview(id) }} />
              <div className="mt-1.5 px-1 text-[13px] font-medium">{WALLPAPERS[id].name}</div>
            </button>
          ))}
        </div>
      </Section>

      <Section title="About this site">
        <p className="text-[13px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          Built by Joshua Chung with Next.js, React, TypeScript, Tailwind CSS, and zustand.
          Source resume and project data drive every app you see.
        </p>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-6">
      <div
        className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em]"
        style={{ color: "var(--text-tertiary)" }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}
