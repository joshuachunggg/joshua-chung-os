import { create } from "zustand";

export type AppId =
  | "about"
  | "projects"
  | "experience"
  | "terminal"
  | "resume"
  | "contact"
  | "calendar"
  | "kubrick"
  | "scripy"
  | "b3vo"
  | "campus"
  | "echo"
  | "snake"
  | "settings";

export interface WindowBounds {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface OSWindow extends WindowBounds {
  appId: AppId;
  z: number;
  minimized: boolean;
  maximized: boolean;
  fullscreen: boolean;
  /** bounds to restore when un-maximizing */
  restore?: WindowBounds;
  /** bumped on every open to retrigger the open animation */
  openCount: number;
}

export type WallpaperId = "tahoe" | "tahoe-night" | "sunset" | "graphite";

interface OSState {
  booted: boolean;
  dark: boolean;
  mobile: boolean;
  soundEnabled: boolean;
  wallpaper: WallpaperId;
  windows: Partial<Record<AppId, OSWindow>>;
  order: AppId[]; // open windows, back-to-front derives from z
  activeApp: AppId | null;
  spotlightOpen: boolean;
  controlCenterOpen: boolean;
  openMenu: string | null; // menubar menu id currently open

  setBooted: (b: boolean) => void;
  setDark: (d: boolean) => void;
  setMobile: (m: boolean) => void;
  setSoundEnabled: (s: boolean) => void;
  setWallpaper: (w: WallpaperId) => void;
  setSpotlight: (open: boolean) => void;
  setControlCenter: (open: boolean) => void;
  setOpenMenu: (id: string | null) => void;

  openApp: (id: AppId, bounds?: Partial<WindowBounds>) => void;
  closeApp: (id: AppId) => void;
  focusApp: (id: AppId) => void;
  minimizeApp: (id: AppId) => void;
  toggleMaximize: (id: AppId) => void;
  toggleFullscreen: (id: AppId) => void;
  setBounds: (id: AppId, bounds: Partial<WindowBounds>) => void;
}

let zCounter = 10;

const DEFAULT_BOUNDS: Record<AppId, WindowBounds> = {
  about: { x: 180, y: 80, w: 720, h: 590 },
  projects: { x: 140, y: 80, w: 920, h: 600 },
  experience: { x: 200, y: 70, w: 1020, h: 640 },
  terminal: { x: 260, y: 140, w: 680, h: 460 },
  resume: { x: 300, y: 60, w: 760, h: 680 },
  contact: { x: 340, y: 150, w: 620, h: 480 },
  calendar: { x: 180, y: 60, w: 1000, h: 700 },
  kubrick: { x: 120, y: 60, w: 1120, h: 740 },
  scripy: { x: 160, y: 80, w: 1120, h: 740 },
  b3vo: { x: 420, y: 44, w: 460, h: 830 },
  campus: { x: 460, y: 44, w: 460, h: 830 },
  echo: { x: 200, y: 100, w: 1120, h: 740 },
  snake: { x: 300, y: 70, w: 680, h: 640 },
  settings: { x: 380, y: 110, w: 700, h: 520 },
};

/** Full-bleed bounds used for every window on mobile (between menu bar and dock). */
export function mobileBounds(): WindowBounds {
  const vw = typeof window === "undefined" ? 400 : window.innerWidth;
  const vh = typeof window === "undefined" ? 800 : window.innerHeight;
  return { x: 6, y: 36, w: vw - 12, h: vh - 36 - 88 };
}

function centeredBounds(id: AppId): WindowBounds {
  const d = DEFAULT_BOUNDS[id];
  if (typeof window === "undefined") return d;
  if (useOS.getState().mobile) return mobileBounds();
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const w = Math.min(d.w, vw - 32);
  const h = Math.min(d.h, vh - 120);
  // cascade slightly per open app so windows don't stack exactly
  const openCount = Object.keys(useOS.getState().windows).length;
  const offset = (openCount % 5) * 28;
  return {
    w,
    h,
    x: Math.max(8, Math.round((vw - w) / 2) + offset - 56),
    y: Math.max(34, Math.round((vh - h) / 2.4) + offset - 40),
  };
}

export const useOS = create<OSState>((set, get) => ({
  booted: false,
  dark: false,
  mobile: false,
  soundEnabled: true,
  wallpaper: "tahoe",
  windows: {},
  order: [],
  activeApp: null,
  spotlightOpen: false,
  controlCenterOpen: false,
  openMenu: null,

  setBooted: (booted) => set({ booted }),
  setMobile: (mobile) => set({ mobile }),
  setSoundEnabled: (soundEnabled) => set({ soundEnabled }),
  setDark: (dark) => {
    document.documentElement.classList.toggle("dark", dark);
    // Tahoe behaves like a macOS dynamic wallpaper: appearance flips day/night
    const w = get().wallpaper;
    if (dark && w === "tahoe") set({ dark, wallpaper: "tahoe-night" });
    else if (!dark && w === "tahoe-night") set({ dark, wallpaper: "tahoe" });
    else set({ dark });
  },
  setWallpaper: (wallpaper) => set({ wallpaper }),
  setSpotlight: (spotlightOpen) =>
    set({ spotlightOpen, controlCenterOpen: false, openMenu: null }),
  setControlCenter: (controlCenterOpen) =>
    set({ controlCenterOpen, openMenu: null }),
  setOpenMenu: (openMenu) => set({ openMenu, controlCenterOpen: false }),

  openApp: (id, bounds) => {
    const { windows } = get();
    const existing = windows[id];
    if (existing) {
      set({
        windows: {
          ...windows,
          [id]: { ...existing, minimized: false, z: ++zCounter },
        },
        activeApp: id,
        spotlightOpen: false,
      });
      return;
    }
    const b = { ...centeredBounds(id), ...bounds };
    set({
      windows: {
        ...windows,
        [id]: {
          appId: id,
          ...b,
          z: ++zCounter,
          minimized: false,
          maximized: false,
          fullscreen: false,
          openCount: 1,
        },
      },
      order: [...get().order, id],
      activeApp: id,
      spotlightOpen: false,
    });
  },

  closeApp: (id) => {
    const windows = { ...get().windows };
    delete windows[id];
    const order = get().order.filter((a) => a !== id);
    // focus the next-topmost window
    let next: AppId | null = null;
    let bestZ = -1;
    for (const a of order) {
      const w = windows[a];
      if (w && !w.minimized && w.z > bestZ) {
        bestZ = w.z;
        next = a;
      }
    }
    set({ windows, order, activeApp: next });
  },

  focusApp: (id) => {
    const { windows, activeApp } = get();
    const w = windows[id];
    if (!w) return;
    if (activeApp === id && !w.minimized && w.z === zCounter) return;
    set({
      windows: { ...windows, [id]: { ...w, minimized: false, z: ++zCounter } },
      activeApp: id,
    });
  },

  minimizeApp: (id) => {
    const { windows, order } = get();
    const w = windows[id];
    if (!w) return;
    let next: AppId | null = null;
    let bestZ = -1;
    for (const a of order) {
      const other = windows[a];
      if (a !== id && other && !other.minimized && other.z > bestZ) {
        bestZ = other.z;
        next = a;
      }
    }
    set({
      windows: { ...windows, [id]: { ...w, minimized: true } },
      activeApp: next,
    });
  },

  toggleMaximize: (id) => {
    const { windows } = get();
    const w = windows[id];
    if (!w) return;
    if (w.maximized && w.restore) {
      set({
        windows: {
          ...windows,
          [id]: { ...w, ...w.restore, maximized: false, restore: undefined, z: ++zCounter },
        },
        activeApp: id,
      });
    } else {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      set({
        windows: {
          ...windows,
          [id]: {
            ...w,
            restore: { x: w.x, y: w.y, w: w.w, h: w.h },
            x: 10,
            y: 36,
            w: vw - 20,
            h: vh - 46,
            maximized: true,
            z: ++zCounter,
          },
        },
        activeApp: id,
      });
    }
  },

  toggleFullscreen: (id) => {
    const { windows } = get();
    const w = windows[id];
    if (!w) return;
    if (w.fullscreen && w.restore) {
      set({
        windows: {
          ...windows,
          [id]: { ...w, ...w.restore, fullscreen: false, restore: undefined, z: ++zCounter },
        },
        activeApp: id,
      });
    } else {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      set({
        windows: {
          ...windows,
          [id]: {
            ...w,
            restore: { x: w.x, y: w.y, w: w.w, h: w.h },
            x: 0,
            y: 0,
            w: vw,
            h: vh,
            fullscreen: true,
            maximized: false,
            z: ++zCounter,
          },
        },
        activeApp: id,
      });
    }
  },

  setBounds: (id, bounds) => {
    const { windows } = get();
    const w = windows[id];
    if (!w) return;
    set({ windows: { ...windows, [id]: { ...w, ...bounds } } });
  },
}));
