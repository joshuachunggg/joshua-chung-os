"use client";

import { useEffect, useState } from "react";
import { useOS } from "@/system/store";

export function BootScreen() {
  const setBooted = useOS((s) => s.setBooted);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setLeaving(true), 2300);
    const t2 = setTimeout(() => setBooted(true), 2900);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [setBooted]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black transition-opacity duration-500"
      style={{ opacity: leaving ? 0 : 1 }}
    >
      <svg width="72" height="72" viewBox="0 0 24 24" fill="#f5f5f7" aria-label="Boot logo">
        <path d="M17.05 12.54c-.03-2.71 2.21-4.01 2.31-4.07-1.26-1.84-3.22-2.09-3.92-2.12-1.66-.17-3.25.98-4.09.98-.85 0-2.15-.96-3.54-.93-1.82.03-3.5 1.06-4.44 2.69-1.9 3.29-.49 8.14 1.36 10.81.9 1.31 1.98 2.77 3.39 2.72 1.36-.05 1.88-.88 3.52-.88 1.65 0 2.11.88 3.55.85 1.47-.02 2.4-1.33 3.29-2.64 1.04-1.51 1.46-2.98 1.49-3.05-.03-.02-2.86-1.1-2.92-4.36zM14.36 4.6c.75-.91 1.25-2.17 1.11-3.43-1.08.04-2.38.72-3.16 1.63-.69.8-1.3 2.09-1.14 3.32 1.2.09 2.44-.61 3.19-1.52z" />
      </svg>
      <div className="mt-14 h-[5px] w-52 overflow-hidden rounded-full bg-white/15">
        <div
          className="h-full rounded-full bg-white/90"
          style={{ animation: "boot-bar 2.1s cubic-bezier(0.3, 0.6, 0.4, 1) forwards" }}
        />
      </div>
    </div>
  );
}
