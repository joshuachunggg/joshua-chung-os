"use client";

import type { ReactNode } from "react";

interface DockApp {
  id: string;
  name: string;
  icon: string;
}

interface MacOSDockProps {
  apps: DockApp[];
  onAppClick: (appId: string) => void;
  openApps?: string[];
  className?: string;
  trailing?: (iconSize: number) => ReactNode;
}

export default function MacOSDock({
  apps,
  onAppClick,
  openApps = [],
  className = "",
  trailing,
}: MacOSDockProps) {
  const iconSize = 64;

  return (
    <div className={`rounded-[26px] border border-white/30 bg-white/20 p-2 shadow-[0_6px_26px_rgba(0,0,0,0.35)] backdrop-blur-2xl ${className}`}>
      <div className="flex items-end gap-1">
        {apps.map((app) => (
          <button
            key={app.id}
            type="button"
            aria-label={`Open ${app.name}`}
            className="group relative flex h-16 w-16 items-end justify-center rounded-xl transition-transform duration-150 hover:-translate-y-2 hover:scale-125 focus-visible:-translate-y-2 focus-visible:scale-125 focus-visible:outline-none"
            onClick={() => onAppClick(app.id)}
          >
            <span className="pointer-events-none absolute bottom-[calc(100%+10px)] hidden whitespace-nowrap rounded-lg border border-white/25 bg-black/65 px-2.5 py-1 text-[13px] text-white shadow-lg backdrop-blur-md group-hover:block group-focus-visible:block">
              {app.name}
            </span>
            <img
              src={app.icon}
              alt=""
              width={iconSize}
              height={iconSize}
              className="h-16 w-16 object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]"
            />
            {openApps.includes(app.id) && <span className="absolute -bottom-1 h-1 w-1 rounded-full bg-white shadow" />}
          </button>
        ))}
        {trailing?.(iconSize)}
      </div>
    </div>
  );
}
