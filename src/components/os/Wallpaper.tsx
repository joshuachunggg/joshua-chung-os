"use client";

import { useOS, type WallpaperId } from "@/system/store";

interface WallpaperSpec {
  name: string;
  /** CSS gradient: the full wallpaper for gradient specs, and the
   *  instant-paint fallback behind `image` while it loads. */
  base: string;
  image?: string;
  blobs?: { color: string; size: string; x: string; y: string; anim: string }[];
}

export const WALLPAPERS: Record<WallpaperId, WallpaperSpec> = {
  tahoe: {
    name: "Tahoe Day",
    base: "linear-gradient(165deg, #1e6fc0 0%, #4f9fd8 40%, #ecdfb8 68%, #2b6fb8 100%)",
    image: "/wallpapers/tahoe-day.jpg",
  },
  "tahoe-night": {
    name: "Tahoe Night",
    base: "linear-gradient(165deg, #05060f 0%, #201a56 45%, #2a3fa8 75%, #10123a 100%)",
    image: "/wallpapers/tahoe-night.jpg",
  },
  sunset: {
    name: "Golden Hour",
    base: "linear-gradient(170deg, #2b1055 0%, #7b2f68 40%, #e0562f 75%, #f7b733 100%)",
    blobs: [
      { color: "rgba(255, 210, 100, 0.6)", size: "56vw", x: "50%", y: "80%", anim: "wallpaper-blob-b" },
      { color: "rgba(255, 90, 60, 0.45)", size: "44vw", x: "78%", y: "50%", anim: "wallpaper-blob-a" },
      { color: "rgba(160, 80, 255, 0.35)", size: "46vw", x: "16%", y: "26%", anim: "wallpaper-blob-c" },
    ],
  },
  graphite: {
    name: "Graphite",
    base: "linear-gradient(165deg, #0c0c10 0%, #1c1c24 45%, #2e2e3a 75%, #4a4a5c 100%)",
    blobs: [
      { color: "rgba(110, 110, 140, 0.5)", size: "52vw", x: "68%", y: "62%", anim: "wallpaper-blob-a" },
      { color: "rgba(70, 90, 140, 0.4)", size: "46vw", x: "20%", y: "30%", anim: "wallpaper-blob-b" },
      { color: "rgba(150, 130, 180, 0.25)", size: "38vw", x: "84%", y: "16%", anim: "wallpaper-blob-c" },
    ],
  },
};

/** CSS background shorthand for previews (Control Center, Settings). */
export function wallpaperPreview(id: WallpaperId): string {
  const spec = WALLPAPERS[id];
  return spec.image ? `url(${spec.image}) center / cover no-repeat` : spec.base;
}

export function Wallpaper() {
  const wallpaper = useOS((s) => s.wallpaper);
  const spec = WALLPAPERS[wallpaper];
  return (
    <div
      className="absolute inset-0 overflow-hidden transition-[background] duration-700"
      style={{ background: spec.base }}
    >
      {spec.image && (
        <div
          key={wallpaper}
          className="anim-fade-in absolute inset-0"
          style={{
            background: `url(${spec.image}) center / cover no-repeat`,
          }}
        />
      )}
      {spec.blobs?.map((b, i) => (
        <div
          key={`${wallpaper}-${i}`}
          className={b.anim}
          style={{
            position: "absolute",
            width: b.size,
            height: b.size,
            left: b.x,
            top: b.y,
            marginLeft: `calc(${b.size} / -2)`,
            marginTop: `calc(${b.size} / -2)`,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${b.color} 0%, transparent 68%)`,
            filter: "blur(40px)",
          }}
        />
      ))}
      {/* fine grain so the glass has something to refract (gradients only;
          the photo wallpapers carry their own texture) */}
      {!spec.image && (
        <div
          className="absolute inset-0 opacity-[0.05] mix-blend-overlay"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)' opacity='0.7'/%3E%3C/svg%3E\")",
          }}
        />
      )}
    </div>
  );
}
