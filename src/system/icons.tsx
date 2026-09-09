import type { AppId } from "./store";

/**
 * macOS Tahoe–style app icons: squircle base, vertical gradient,
 * glass inner-highlight, simple bold glyph.
 *
 * Glyphs are stored as raw SVG strings so each icon can be rendered
 * either as a React component (<AppIcon/>) or exported as a data URL
 * (iconDataUrl) for consumers that need an image src, like the dock.
 */

const SQUIRCLE =
  "M 50,0 C 11,0 0,11 0,50 C 0,89 11,100 50,100 C 89,100 100,89 100,50 C 100,11 89,0 50,0 Z";

interface IconTheme {
  from: string;
  to: string;
  glyph: string;
}

const THEMES: Partial<Record<AppId, IconTheme>> = {
  about: {
    from: "#4facfe",
    to: "#0a5cd6",
    glyph: `<g fill="#fff">
        <circle cx="50" cy="38" r="14.5" />
        <path d="M50 56 C 32 56 22 68 22 82 L 78 82 C 78 68 68 56 50 56 Z" />
      </g>`,
  },
  projects: {
    from: "#5ee7ff",
    to: "#0a84ff",
    glyph: `<g>
        <path d="M20 34 c0-3.3 2.7-6 6-6 h14 l6 7 h28 c3.3 0 6 2.7 6 6 v31 c0 3.3-2.7 6-6 6 H26 c-3.3 0-6-2.7-6-6 Z" fill="#fff" opacity="0.96" />
        <path d="M20 44 h60 v28 c0 3.3-2.7 6-6 6 H26 c-3.3 0-6-2.7-6-6 Z" fill="#dcefff" />
      </g>`,
  },
  experience: {
    from: "#ffd60a",
    to: "#ff9f0a",
    glyph: `<g>
        <rect x="24" y="36" width="52" height="38" rx="7" fill="#fff" />
        <path d="M40 36 v-5 c0-3.3 2.7-6 6-6 h8 c3.3 0 6 2.7 6 6 v5 h-6 v-4.5 h-8 V36 Z" fill="#fff" />
        <rect x="24" y="50" width="52" height="4" fill="#ff9f0a" opacity="0.55" />
      </g>`,
  },
  terminal: {
    from: "#3a3a44",
    to: "#101014",
    glyph: `<g fill="none" stroke="#3dfc85" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
        <path d="M28 36 L 44 50 L 28 64" />
        <path d="M52 66 L 72 66" stroke="#e8e8ee" />
      </g>`,
  },
  resume: {
    from: "#fdfdfe",
    to: "#d9dbe2",
    glyph: `<g>
        <path d="M30 18 h28 l14 14 v48 c0 3.3-2.7 6-6 6 H30 c-3.3 0-6-2.7-6-6 V24 c0-3.3 2.7-6 6-6 Z" fill="#fff" stroke="#c3c6cf" stroke-width="1.5" />
        <path d="M58 18 l14 14 h-11 c-1.7 0-3-1.3-3-3 Z" fill="#c9ccd6" />
        <g stroke="#ff453a" stroke-width="4" stroke-linecap="round">
          <path d="M33 44 h24" />
          <path d="M33 54 h34" stroke="#8e8e93" />
          <path d="M33 63 h34" stroke="#8e8e93" />
          <path d="M33 72 h22" stroke="#8e8e93" />
        </g>
      </g>`,
  },
  contact: {
    from: "#6ec8ff",
    to: "#0a84ff",
    glyph: `<g>
        <rect x="20" y="30" width="60" height="42" rx="7" fill="#fff" />
        <path d="M22 34 L 50 55 L 78 34" fill="none" stroke="#0a84ff" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" />
      </g>`,
  },
  snake: {
    from: "#8fdd63",
    to: "#3d9b2e",
    glyph: `<g>
        <path d="M30 74 C 18 68 20 54 36 52 C 52 50 60 50 60 41 C 60 32 50 30 42 34"
          fill="none" stroke="#fff" stroke-width="12.5" stroke-linecap="round" />
        <circle cx="41" cy="30.5" r="2.6" fill="#2f7d22" />
        <circle cx="46.5" cy="36.5" r="2.6" fill="#2f7d22" />
        <circle cx="72" cy="68" r="7.5" fill="#ff453a" />
        <rect x="71" y="56.5" width="2.2" height="5" rx="1.1" fill="#7a4a21" />
        <path d="M73.5 59 C 75 55.5 79 55 81 56.5 C 79.8 59.5 75.8 60.4 73.5 59 Z" fill="#cff0c2" />
      </g>`,
  },
  settings: {
    from: "#9c9ca4",
    to: "#55555e",
    glyph: `<g fill="#ececf2">
        <path d="M50 24 l5.2 0 2 8.1 a19 19 0 0 1 5.6 2.3 l7.2-4.2 3.7 3.7 -4.2 7.2 a19 19 0 0 1 2.3 5.6 l8.1 2 v5.2 l-8.1 2 a19 19 0 0 1 -2.3 5.6 l4.2 7.2 -3.7 3.7 -7.2-4.2 a19 19 0 0 1 -5.6 2.3 l-2 8.1 h-5.2 l-2-8.1 a19 19 0 0 1 -5.6-2.3 l-7.2 4.2 -3.7-3.7 4.2-7.2 a19 19 0 0 1 -2.3-5.6 l-8.1-2 v-5.2 l8.1-2 a19 19 0 0 1 2.3-5.6 l-4.2-7.2 3.7-3.7 7.2 4.2 a19 19 0 0 1 5.6-2.3 Z" />
        <circle cx="50" cy="51" r="10" fill="#55555e" />
      </g>`,
  },
};

function iconMarkup(id: AppId, uid: string): string {
  const t = THEMES[id]!;
  return `<defs>
      <linearGradient id="bg-${uid}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${t.from}" />
        <stop offset="100%" stop-color="${t.to}" />
      </linearGradient>
      <linearGradient id="gloss-${uid}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="rgba(255,255,255,0.5)" />
        <stop offset="45%" stop-color="rgba(255,255,255,0.08)" />
        <stop offset="100%" stop-color="rgba(255,255,255,0)" />
      </linearGradient>
      <clipPath id="clip-${uid}"><path d="${SQUIRCLE}" /></clipPath>
    </defs>
    <g clip-path="url(#clip-${uid})">
      <rect width="100" height="100" fill="url(#bg-${uid})" />
      ${t.glyph}
      <rect width="100" height="52" fill="url(#gloss-${uid})" />
    </g>
    <path d="${SQUIRCLE}" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="1" />`;
}

/**
 * Real Apple macOS app icons (downloaded from macosicongallery.com's CDN).
 * Every app uses one except Snake, which keeps its custom SVG.
 */
export const APPLE_ICONS: Partial<Record<AppId, string>> = {
  about: "/icons/apple/contacts.png",
  projects: "/icons/apple/finder.png",
  experience: "/icons/apple/notes.png",
  terminal: "/icons/apple/terminal.png",
  resume: "/icons/apple/preview.png",
  contact: "/icons/apple/mail.png",
  calendar: "/icons/apple/calendar.png",
  settings: "/icons/apple/settings.png",
  // Project apps use their real product logos (squircle-wrapped SVGs)
  kubrick: "/icons/kubrick.svg",
  scripy: "/icons/scripy.svg",
  b3vo: "/icons/b3vo.svg",
  campus: "/icons/campus.svg",
  echo: "/icons/echo.svg",
};

// Apple's .icns renders keep the squircle at ~79% of the canvas; the custom
// SVG uses the same margin so Snake sits at the same visual size.
const SVG_VIEWBOX = "-13.3 -13.3 126.6 126.6";

const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

/**
 * Calendar renders like the real macOS Calendar icon: white squircle with the
 * red weekday and today's date, generated at runtime so it's always current.
 * (Only rendered client-side — the OS UI mounts after boot — so there's no
 * SSR/client date mismatch.)
 */
function calendarIconMarkup(uid: string): string {
  const now = new Date();
  return `<defs>
      <linearGradient id="cal-bg-${uid}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#ffffff" />
        <stop offset="100%" stop-color="#e9e9ee" />
      </linearGradient>
      <clipPath id="cal-clip-${uid}"><path d="${SQUIRCLE}" /></clipPath>
    </defs>
    <g clip-path="url(#cal-clip-${uid})">
      <rect width="100" height="100" fill="url(#cal-bg-${uid})" />
      <text x="50" y="30" text-anchor="middle" fill="#ff453a"
        font-family="-apple-system, 'Helvetica Neue', Arial, sans-serif"
        font-size="15" font-weight="600" letter-spacing="1.5">${WEEKDAYS[now.getDay()]}</text>
      <text x="50" y="76" text-anchor="middle" fill="#1c1c1e"
        font-family="-apple-system, 'Helvetica Neue', Arial, sans-serif"
        font-size="46" font-weight="300">${now.getDate()}</text>
    </g>
    <path d="${SQUIRCLE}" fill="none" stroke="rgba(0,0,0,0.12)" stroke-width="1" />`;
}

export function AppIcon({
  id,
  size = 48,
  className,
}: {
  id: AppId;
  size?: number;
  className?: string;
}) {
  const apple = APPLE_ICONS[id];
  if (apple) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={apple}
        alt=""
        width={size}
        height={size}
        className={className}
        style={{ display: "block" }}
        draggable={false}
      />
    );
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox={SVG_VIEWBOX}
      className={className}
      style={{ display: "block" }}
      dangerouslySetInnerHTML={{
        __html: id === "calendar" ? calendarIconMarkup(id) : iconMarkup(id, id),
      }}
    />
  );
}

const dataUrlCache: Partial<Record<AppId, string>> = {};

/** The same icon as a standalone image src (for <img>-based consumers like the dock). */
export function iconDataUrl(id: AppId): string {
  const apple = APPLE_ICONS[id];
  if (apple) return apple;
  if (id === "calendar") {
    // not cached: the glyph is today's date, which must stay current
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${SVG_VIEWBOX}">${calendarIconMarkup("dock-calendar")}</svg>`;
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
  }
  if (!dataUrlCache[id]) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${SVG_VIEWBOX}">${iconMarkup(id, `dock-${id}`)}</svg>`;
    dataUrlCache[id] = `data:image/svg+xml,${encodeURIComponent(svg)}`;
  }
  return dataUrlCache[id]!;
}
