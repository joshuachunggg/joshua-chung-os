"use client";

import { useState } from "react";

interface WebAppConfig {
  name: string;
  url: string;
  logo: string;
  /** true while the site's headers (X-Frame-Options / frame-ancestors) forbid embedding */
  frameBlocked?: boolean;
  splashBg?: string;
  splashColor?: string;
}

/** Factory for apps that are live websites opened inside an OS window. */
export function makeWebApp(config: WebAppConfig) {
  const host = new URL(config.url).host;

  return function WebApp() {
    const [reloadKey, setReloadKey] = useState(0);
    const [loaded, setLoaded] = useState(false);

    return (
      <div className="flex h-full flex-col" style={{ background: "var(--content-bg)" }}>
        {/* Safari-style toolbar */}
        <div
          className="flex flex-none items-center gap-2 border-b px-3 py-2"
          style={{ borderColor: "var(--divider)" }}
        >
          <button
            aria-label="Reload"
            className="flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-black/5 dark:hover:bg-white/10"
            onClick={() => {
              setLoaded(false);
              setReloadKey((k) => k + 1);
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2.2" strokeLinecap="round">
              <path d="M20 12 a8 8 0 1 1 -2.34-5.66" />
              <path d="M20 3 v4.5 h-4.5" />
            </svg>
          </button>
          <div
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-[12.5px]"
            style={{ background: "var(--sidebar-bg)", color: "var(--text-secondary)" }}
          >
            <svg width="10" height="12" viewBox="0 0 12 14" fill="var(--text-tertiary)">
              <rect x="1" y="6" width="10" height="7" rx="1.5" />
              <path d="M3.5 6 V4.5 a2.5 2.5 0 0 1 5 0 V6" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.5" />
            </svg>
            {host}
          </div>
          <a
            href={config.url}
            target="_blank"
            rel="noreferrer"
            aria-label={`Open ${host} in a new tab`}
            className="flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-black/5 dark:hover:bg-white/10"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 4 h6 v6 M20 4 L10 14" />
              <path d="M18 13 v6 a1.5 1.5 0 0 1 -1.5 1.5 h-11 A1.5 1.5 0 0 1 4 19 V8 a1.5 1.5 0 0 1 1.5 -1.5 H11" />
            </svg>
          </a>
        </div>

        {/* Site */}
        <div className="relative min-h-0 flex-1">
          {config.frameBlocked ? (
            <div
              className="flex h-full flex-col items-center justify-center gap-4 px-8 text-center"
              style={{ background: config.splashBg ?? "var(--content-bg)" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={config.logo} alt="" width={88} height={88} draggable={false} />
              <div>
                <div className="text-[19px] font-bold" style={{ color: config.splashColor ?? "var(--text-primary)" }}>
                  {config.name}
                </div>
                <p className="mt-1 max-w-sm text-[13px]" style={{ color: config.splashColor ?? "var(--text-secondary)", opacity: 0.7 }}>
                  {host} currently blocks running inside other sites, so it opens in its own tab.
                </p>
              </div>
              <a
                href={config.url}
                target="_blank"
                rel="noreferrer"
                className="rounded-full px-5 py-2 text-[13.5px] font-semibold text-white transition-transform active:scale-95"
                style={{
                  background: "linear-gradient(#3395ff, #0a84ff)",
                  boxShadow: "0 2px 10px rgba(10,132,255,0.45), inset 0 1px 0 rgba(255,255,255,0.35)",
                }}
              >
                Open {host} ↗
              </a>
            </div>
          ) : (
            <>
              {!loaded && (
                <div className="absolute inset-0 flex items-center justify-center" style={{ background: "var(--content-bg)" }}>
                  <div className="flex flex-col items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={config.logo} alt="" width={56} height={56} draggable={false} className="animate-pulse" />
                    <span className="text-[12.5px]" style={{ color: "var(--text-tertiary)" }}>
                      Loading {host}…
                    </span>
                  </div>
                </div>
              )}
              <iframe
                key={reloadKey}
                src={config.url}
                title={config.name}
                className="h-full w-full border-0"
                style={{ opacity: loaded ? 1 : 0, transition: "opacity 0.3s ease", background: "#fff" }}
                onLoad={() => setLoaded(true)}
                allow="fullscreen; clipboard-write"
              />
            </>
          )}
        </div>
      </div>
    );
  };
}
