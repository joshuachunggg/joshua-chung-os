"use client";

import { useMemo } from "react";
import { useOS, type AppId } from "@/system/store";
import { APPS, DOCK_APPS } from "@/system/apps";
import { AppIcon, iconDataUrl } from "@/system/icons";
import MacOSDock from "@/components/ui/mac-os-dock";

export function Dock({ hidden }: { hidden?: boolean }) {
  const windows = useOS((s) => s.windows);
  const mobile = useOS((s) => s.mobile);
  const openApp = useOS((s) => s.openApp);

  const apps = useMemo(
    () =>
      DOCK_APPS.map((id) => ({
        id,
        name: APPS[id].name,
        icon: iconDataUrl(id),
      })),
    []
  );

  const openApps = DOCK_APPS.filter((id) => windows[id]);
  const minimized = DOCK_APPS.filter((id) => windows[id]?.minimized);

  return (
    <div
      className="pointer-events-none absolute inset-x-0 bottom-2 z-[4000] flex justify-center"
      style={{
        transition: "transform 0.3s ease, opacity 0.3s ease",
        transform: hidden ? "translateY(110%)" : "translateY(0)",
        opacity: hidden ? 0 : 1,
      }}
    >
      <div
        className="pointer-events-auto"
        style={
          // Never constrain overflow on desktop: magnified icons must be free
          // to grow beyond the dock pill. Mobile (no magnification) may scroll.
          mobile
            ? { maxWidth: "calc(100vw - 12px)", overflowX: "auto", scrollbarWidth: "none" }
            : undefined
        }
      >
        <MacOSDock
          apps={apps}
          openApps={openApps}
          onAppClick={(id) => openApp(id as AppId)}
          trailing={(iconSize) =>
            minimized.length > 0 ? (
              <>
                <div
                  className="flex-none self-stretch"
                  style={{ width: 1, background: "rgba(128,128,140,0.35)" }}
                />
                {minimized.map((id) => (
                  <button
                    key={`min-${id}`}
                    className="group relative flex flex-none items-center justify-center rounded-xl"
                    style={{
                      width: iconSize,
                      height: iconSize,
                      background:
                        "linear-gradient(160deg, rgba(255,255,255,0.55), rgba(200,205,220,0.45))",
                      border: "0.5px solid rgba(255,255,255,0.5)",
                      boxShadow:
                        "inset 0 1px 0 rgba(255,255,255,0.5), 0 3px 8px rgba(0,0,0,0.18)",
                    }}
                    onClick={() => openApp(id)}
                    aria-label={`Restore ${APPS[id].name}`}
                  >
                    <span
                      className="pointer-events-none absolute left-1/2 -translate-x-1/2 whitespace-nowrap opacity-0 transition-opacity duration-75 group-hover:opacity-100"
                      style={{
                        bottom: "calc(100% + 10px)",
                        padding: "3px 11px",
                        borderRadius: 8,
                        fontSize: 13.5,
                        fontWeight: 500,
                        letterSpacing: "-0.01em",
                        color: "var(--text-primary)",
                        background: "var(--glass-bg-strong)",
                        backdropFilter: "blur(30px) saturate(180%)",
                        WebkitBackdropFilter: "blur(30px) saturate(180%)",
                        border: "0.5px solid var(--glass-border)",
                        boxShadow:
                          "0 4px 14px rgba(0,0,0,0.22), inset 0 1px 0 var(--glass-highlight)",
                      }}
                    >
                      {APPS[id].name}
                    </span>
                    <AppIcon
                      id={id}
                      size={iconSize * 0.62}
                      className="drop-shadow-[0_3px_6px_rgba(0,0,0,0.25)]"
                    />
                  </button>
                ))}
                <span id="dock-min-anchor" className="h-full w-0 flex-none self-center" />
              </>
            ) : (
              <span id="dock-min-anchor" className="h-full w-0 flex-none self-center" />
            )
          }
        />
      </div>
    </div>
  );
}
