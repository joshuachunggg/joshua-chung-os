"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Runs an Expo web export inside an iPhone-shaped frame.
 * The app is pure client-side JS (react-native-web), so there's no
 * simulator, no streaming, and no server compute — it's just a web app
 * wearing an iPhone costume.
 */

const SCREEN_W = 390;
const SCREEN_H = 844;
const BEZEL = 11;
const FRAME_W = SCREEN_W + BEZEL * 2;
const FRAME_H = SCREEN_H + BEZEL * 2;

export function makePhoneApp({ name, src, logo }: { name: string; src: string; logo: string }) {
  return function PhoneApp() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(0.8);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
      const el = containerRef.current;
      if (!el) return;
      const compute = () => {
        const pad = 44; // generous margin so the bezel never kisses the window edge
        const s = Math.min(
          (el.clientWidth - pad) / FRAME_W,
          (el.clientHeight - pad) / FRAME_H,
          1
        );
        setScale(Math.max(0.3, s));
      };
      const ro = new ResizeObserver(compute);
      ro.observe(el);
      window.addEventListener("resize", compute);
      // re-measure after the window's open/zoom animations settle
      const t1 = setTimeout(compute, 350);
      const t2 = setTimeout(compute, 800);
      compute();
      return () => {
        ro.disconnect();
        window.removeEventListener("resize", compute);
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }, []);

    return (
      <div
        ref={containerRef}
        className="flex h-full w-full items-center justify-center"
        style={{
          background:
            "radial-gradient(120% 100% at 50% 0%, rgba(120,130,160,0.18) 0%, transparent 60%), var(--content-bg)",
        }}
      >
        <div style={{ width: FRAME_W * scale, height: FRAME_H * scale, flex: "none" }}>
          <div
            style={{
              width: FRAME_W,
              height: FRAME_H,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
              position: "relative",
              borderRadius: 58,
              background: "linear-gradient(160deg, #3a3a40, #17171b 60%, #2c2c32)",
              boxShadow:
                "0 30px 80px rgba(0,0,0,0.45), 0 6px 20px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.25), inset 0 0 2px 2px rgba(0,0,0,0.6)",
            }}
          >
            {/* side buttons */}
            <div style={{ position: "absolute", left: -2.5, top: 170, width: 3, height: 32, borderRadius: 2, background: "#26262b" }} />
            <div style={{ position: "absolute", left: -2.5, top: 220, width: 3, height: 56, borderRadius: 2, background: "#26262b" }} />
            <div style={{ position: "absolute", left: -2.5, top: 290, width: 3, height: 56, borderRadius: 2, background: "#26262b" }} />
            <div style={{ position: "absolute", right: -2.5, top: 230, width: 3, height: 84, borderRadius: 2, background: "#26262b" }} />

            {/* screen */}
            <div
              style={{
                position: "absolute",
                inset: BEZEL,
                borderRadius: 48,
                overflow: "hidden",
                background: "#F5F0EB",
              }}
            >
              {!loaded && (
                <div
                  className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3"
                  style={{ background: "#F5F0EB" }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={logo} alt="" width={72} height={72} draggable={false} className="animate-pulse" />
                  <span className="text-[12px]" style={{ color: "rgba(60,50,40,0.5)" }}>
                    Booting {name}…
                  </span>
                </div>
              )}
              <iframe
                src={src}
                title={name}
                onLoad={() => setLoaded(true)}
                style={{
                  width: SCREEN_W,
                  height: SCREEN_H,
                  border: 0,
                  display: "block",
                  background: "#F5F0EB",
                }}
                allow="autoplay; microphone; clipboard-write"
              />
              {/* dynamic island */}
              <div
                style={{
                  position: "absolute",
                  top: 11,
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: 118,
                  height: 34,
                  borderRadius: 20,
                  background: "#060608",
                  zIndex: 20,
                  boxShadow: "inset 0 0 2px rgba(255,255,255,0.08)",
                }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  };
}
