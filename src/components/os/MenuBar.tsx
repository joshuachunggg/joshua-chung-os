"use client";

import { useEffect, useState } from "react";
import { useOS, type AppId } from "@/system/store";
import { APPS } from "@/system/apps";
import { profile } from "@/data/resume";

interface MenuItem {
  label: string;
  action?: () => void;
  divider?: boolean;
  shortcut?: string;
  disabled?: boolean;
}

function useClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

export function MenuBar({ hidden }: { hidden?: boolean }) {
  const activeApp = useOS((s) => s.activeApp);
  const mobile = useOS((s) => s.mobile);
  const openMenu = useOS((s) => s.openMenu);
  const { setOpenMenu, openApp, closeApp, minimizeApp, toggleMaximize, setSpotlight, setControlCenter } =
    useOS.getState();
  const controlCenterOpen = useOS((s) => s.controlCenterOpen);
  const now = useClock();

  const appName = activeApp ? APPS[activeApp].name : "Finder";

  const allMenus: { id: string; label: string; bold?: boolean; items: MenuItem[] }[] = [
    {
      id: "apple",
      label: "",
      items: [
        { label: "About This Portfolio", action: () => openApp("about") },
        { label: "System Settings…", action: () => openApp("settings") },
        { label: "", divider: true },
        { label: "GitHub…", action: () => window.open(profile.github, "_blank") },
        { label: "LinkedIn…", action: () => window.open(profile.linkedin, "_blank") },
        { label: "", divider: true },
        { label: "Restart…", action: () => location.reload() },
      ],
    },
    {
      id: "app",
      label: appName,
      bold: true,
      items: [
        {
          label: `About ${appName}`,
          action: activeApp ? () => openApp("about") : undefined,
        },
        { label: "", divider: true },
        {
          label: `Quit ${appName}`,
          shortcut: "⌘Q",
          action: activeApp ? () => closeApp(activeApp) : undefined,
          disabled: !activeApp,
        },
      ],
    },
    {
      id: "file",
      label: "File",
      items: [
        { label: "New Terminal Window", shortcut: "⌘T", action: () => openApp("terminal") },
        { label: "Open Resume", action: () => openApp("resume") },
        { label: "", divider: true },
        {
          label: "Close Window",
          shortcut: "⌘W",
          action: activeApp ? () => closeApp(activeApp) : undefined,
          disabled: !activeApp,
        },
      ],
    },
    {
      id: "window",
      label: "Window",
      items: [
        {
          label: "Minimize",
          shortcut: "⌘M",
          action: activeApp ? () => minimizeApp(activeApp) : undefined,
          disabled: !activeApp,
        },
        {
          label: "Zoom",
          action: activeApp ? () => toggleMaximize(activeApp) : undefined,
          disabled: !activeApp,
        },
      ],
    },
    {
      id: "help",
      label: "Help",
      items: [
        { label: "Contact Joshua", action: () => openApp("contact") },
        { label: "Spotlight", shortcut: "⌘K", action: () => setSpotlight(true) },
      ],
    },
  ];

  const menus = mobile ? allMenus.filter((m) => m.id === "apple" || m.id === "app") : allMenus;

  return (
    <div
      className="absolute inset-x-0 top-0 z-[5000] flex h-[30px] items-center px-2 text-[13px] leading-none"
      style={{
        color: "rgba(255,255,255,0.95)",
        textShadow: "0 1px 4px rgba(0,0,0,0.35)",
        background: "linear-gradient(rgba(0,0,0,0.22), rgba(0,0,0,0.05) 70%, transparent)",
        transition: "transform 0.3s ease, opacity 0.3s ease",
        transform: hidden ? "translateY(-110%)" : "translateY(0)",
        opacity: hidden ? 0 : 1,
        pointerEvents: hidden ? "none" : "auto",
      }}
    >
      {/* Left: menus */}
      <div className="flex h-full items-center">
        {menus.map((m) => (
          <div key={m.id} className="relative flex h-full items-center">
            <button
              className="flex h-[22px] items-center rounded-[5px] px-2.5 transition-colors"
              style={{
                fontWeight: m.bold ? 600 : m.id === "apple" ? 500 : 400,
                background: openMenu === m.id ? "rgba(255,255,255,0.22)" : "transparent",
              }}
              onClick={() => setOpenMenu(openMenu === m.id ? null : m.id)}
              onMouseEnter={() => {
                if (openMenu && openMenu !== m.id) setOpenMenu(m.id);
              }}
            >
              {m.id === "apple" ? <AppleLogo /> : m.label}
            </button>
            {openMenu === m.id && <Dropdown items={m.items} onClose={() => setOpenMenu(null)} />}
          </div>
        ))}
      </div>

      <div className="flex-1" />

      {/* Right: status items */}
      <div className="flex h-full items-center gap-1">
        <StatusButton label="Spotlight" onClick={() => setSpotlight(true)}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <circle cx="7" cy="7" r="4.6" />
            <path d="M10.5 10.5 L 13.6 13.6" />
          </svg>
        </StatusButton>
        <StatusButton
          label="Control Center"
          onClick={() => setControlCenter(!controlCenterOpen)}
        >
          <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor">
            <rect x="1" y="2.5" width="14" height="4.6" rx="2.3" opacity="0.9" />
            <circle cx="4.5" cy="4.8" r="1.7" fill="#1c1c22" />
            <rect x="1" y="8.9" width="14" height="4.6" rx="2.3" opacity="0.9" />
            <circle cx="11.5" cy="11.2" r="1.7" fill="#1c1c22" />
          </svg>
        </StatusButton>
        <div className="px-2 tabular-nums tracking-tight" suppressHydrationWarning>
          {now
            ? (mobile
                ? ""
                : now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) +
                  "  ") + now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
            : ""}
        </div>
      </div>
    </div>
  );
}

function StatusButton({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      onClick={onClick}
      className="flex h-6 items-center rounded-[5px] px-2 transition-colors hover:bg-white/20"
    >
      {children}
    </button>
  );
}

function Dropdown({ items, onClose }: { items: MenuItem[]; onClose: () => void }) {
  return (
    <>
      <div className="fixed inset-0 z-[5001]" onClick={onClose} />
      <div
        className="liquid-glass-strong anim-menu-pop absolute left-0 top-[30px] z-[5002] min-w-56 rounded-xl p-[5px]"
        style={{ color: "var(--text-primary)", textShadow: "none" }}
      >
        {items.map((item, i) =>
          item.divider ? (
            <div key={i} className="mx-2 my-1 h-px" style={{ background: "var(--divider)" }} />
          ) : (
            <button
              key={i}
              disabled={item.disabled}
              className="group flex w-full items-center justify-between rounded-[8px] px-2.5 py-[5px] text-left text-[13px] disabled:opacity-40"
              style={{ transition: "background 0.08s" }}
              onMouseEnter={(e) => {
                if (!item.disabled) {
                  e.currentTarget.style.background = "var(--menu-hover)";
                  e.currentTarget.style.color = "#fff";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "inherit";
              }}
              onClick={() => {
                item.action?.();
                onClose();
              }}
            >
              <span>{item.label}</span>
              {item.shortcut && (
                <span className="ml-6 text-[12px] opacity-45 group-hover:opacity-80">{item.shortcut}</span>
              )}
            </button>
          )
        )}
      </div>
    </>
  );
}

function AppleLogo() {
  return (
    <svg width="13" height="15" viewBox="0 0 24 24" fill="currentColor" className="block">
      <path d="M17.05 12.54c-.03-2.71 2.21-4.01 2.31-4.07-1.26-1.84-3.22-2.09-3.92-2.12-1.66-.17-3.25.98-4.09.98-.85 0-2.15-.96-3.54-.93-1.82.03-3.5 1.06-4.44 2.69-1.9 3.29-.49 8.14 1.36 10.81.9 1.31 1.98 2.77 3.39 2.72 1.36-.05 1.88-.88 3.52-.88 1.65 0 2.11.88 3.55.85 1.47-.02 2.4-1.33 3.29-2.64 1.04-1.51 1.46-2.98 1.49-3.05-.03-.02-2.86-1.1-2.92-4.36zM14.36 4.6c.75-.91 1.25-2.17 1.11-3.43-1.08.04-2.38.72-3.16 1.63-.69.8-1.3 2.09-1.14 3.32 1.2.09 2.44-.61 3.19-1.52z" />
    </svg>
  );
}
