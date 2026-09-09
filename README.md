<h1 align="center">pranavOS</h1>

<p align="center">
  A portfolio that boots like a Mac.<br>
  A macOS Tahoe–style desktop running in the browser — draggable windows, a magnifying dock,
  Spotlight, Control Center, and a working terminal.
</p>

<p align="center">
  <a href="https://cavaturu.com"><b>Live demo → cavaturu.com</b></a>
</p>

---

## What's in it

Instead of scrolling a page, visitors use a desktop. Every part of the portfolio is an app.

**The OS shell**

- **Boot screen** — Apple-style startup before the desktop appears
- **Window manager** — drag, resize, minimize-to-dock, maximize, fullscreen, z-order focus
- **Dock** — cosine-curve magnification on hover, running-app indicators
- **Menu bar** — live clock, working dropdown menus with keyboard shortcuts
- **Spotlight** (`⌘K`) — fuzzy search across every app
- **Control Center** — wallpaper switcher, dark mode, sound toggle
- **Liquid glass** — layered blur/saturation backdrops throughout
- **Click sounds** — real mechanical keyboard and mouse samples

**The apps**

| App | What it does |
| --- | --- |
| About | Profile card and bio |
| Projects | Finder-style browser for your work |
| Experience | Apple Notes clone — work history, skills, company logos |
| Terminal | Actually interactive: `help`, `projects`, `project <name>`, `neofetch`, `open <app>` |
| Resume | Embedded PDF viewer |
| Contact | Working email form (via Resend) |
| Calendar | Booking embed |
| Snake | Because every OS needs a game |
| Settings | Appearance and wallpaper |
| Web apps | Live sites embedded in Safari-style windows |
| Phone apps | Mobile apps running inside an iPhone frame on the desktop |

**Keyboard shortcuts:** `⌘K` Spotlight · `⌘W` close window · `⌘M` minimize · `⌘T` new terminal · `Esc` dismiss

---

## Quick start

Requires **Node.js 20+** (built on Node 24).

```bash
git clone https://github.com/ItsPranavC/portfolio.git my-os
cd my-os
npm install
npm run dev
```

Open <http://localhost:3000>. That's it — the desktop boots with no configuration.

Everything below is optional: the contact form, TTS, and calendar apps degrade gracefully when their keys are missing.

---

## Make it yours

This is the part that matters. Here's how to turn this into *your* OS, in rough order of impact.

### 1. Your name and details

Everything personal lives in one file: **`src/data/resume.ts`**.

```ts
export const profile = {
  name: "Your Name",
  role: "What you do",
  email: "you@example.com",
  linkedin: "https://linkedin.com/in/you",
  github: "https://github.com/you",
  education: { school: "…", degree: "…", grad: "…", location: "…" },
};
```

The same file exports three more arrays that drive whole apps:

- **`experience`** — each entry becomes a note in the Experience app (company, role, period, bullets, accent color, logo)
- **`projects`** — each entry becomes an item in the Projects (Finder) app
- **`skills`** — the skills section, grouped by category

Edit these and the About, Experience, Projects, Resume, and Terminal apps all update. No other file needs to change.

### 2. Swap the assets

| Replace | With |
| --- | --- |
| `public/profile.jpeg` | Your photo |
| `public/resume.pdf` | Your resume |
| `src/app/icon.png`, `src/app/apple-icon.png` | Your favicon / app icon |
| `public/icons/companies/*` | Logos for your jobs |
| `public/icons/skills/*` | Icons for your skills |
| `public/wallpapers/*` | Your wallpapers |

### 3. Add, remove, or rename apps

Adding an app takes three edits:

**a.** Add its id to the `AppId` union in `src/system/store.ts`:

```ts
export type AppId = "about" | "projects" | /* … */ | "myapp";
```

**b.** Write the component in `src/apps/MyApp.tsx` — it's just a React component; the window chrome is handled for you.

**c.** Register it in `src/system/apps.tsx`:

```ts
myapp: {
  id: "myapp",
  name: "My App",
  component: MyApp,
  minW: 600,
  minH: 400,
  keywords: ["my", "app"],   // powers Spotlight search
},
```

It now appears in the dock, in Spotlight, and can be opened from the Terminal with `open myapp`.

To **remove** an app, delete its entry from `APPS` and its id from `AppId`.

### 4. Embed your own live projects

Two helpers in `src/system/apps.tsx` let you mount real projects as apps:

```ts
// A live website, in a Safari-style browser window
const MySiteApp = makeWebApp({
  name: "My Site",
  url: "https://example.com",
  logo: "/icons/mysite.svg",
});

// A mobile app, rendered inside an iPhone frame
const MyMobileApp = makePhoneApp({
  name: "My App",
  src: "/myapp",          // an Expo web export in public/myapp
  logo: "/icons/myapp.svg",
});
```

> **Note:** sites that send `X-Frame-Options: DENY` or a restrictive `frame-ancestors` CSP can't be embedded — that's the site's choice, not a bug here. Your own deployments usually can be.

For mobile apps, drop an Expo web export into `public/<name>/` and add a rewrite in `next.config.ts` so the SPA resolves at its base path:

```ts
{ source: "/myapp", destination: "/myapp/index.html" }
```

### 5. Wallpapers

Wallpapers are defined in `src/components/os/Wallpaper.tsx`. Each one is either an image or a pure-CSS gradient with animated blobs:

```ts
mytheme: {
  name: "My Theme",
  base: "linear-gradient(165deg, #1e6fc0 0%, #4f9fd8 100%)",
  image: "/wallpapers/mine.jpg",   // optional; `base` shows while it loads
},
```

Add the key to the `WallpaperId` type in `src/system/store.ts` and it shows up in Settings and Control Center automatically.

### 6. Optional integrations

Copy `.env.example` to `.env.local` and fill in only what you want:

```bash
cp .env.example .env.local
```

| Variable | Powers | Without it |
| --- | --- | --- |
| `RESEND_API_KEY` | Contact form email ([resend.com](https://resend.com)) | Form returns a friendly error |
| `CONTACT_TO` | Where contact mail is delivered | Falls back to a default address |
| `ELEVENLABS_API_KEY` | Text-to-speech proxy at `/api/tts` | Route returns an error |
| `NEXT_PUBLIC_CAL_URL` | Calendar app booking embed | Falls back to `localhost:3002` |
| `NEXT_PUBLIC_CAL_USERNAME` | Which calendar to show | Falls back to a default |

**If you use the contact form,** also change the hardcoded sender in `src/app/api/contact/route.ts` — Resend requires it to be an address on a domain you've verified:

```ts
from: "Your Portfolio <contact@yourdomain.com>",
```

---

## Deploy

Built for [Vercel](https://vercel.com), but it's a stock Next.js app and runs anywhere Node does.

```bash
npm i -g vercel
vercel
```

Add your environment variables in the Vercel dashboard (or `vercel env add`), then `vercel --prod`.

For any other host:

```bash
npm run build
npm start
```

---

## How it works

```
src/
├── app/
│   ├── page.tsx           # renders <MacOS />
│   ├── layout.tsx         # fonts, metadata
│   ├── globals.css        # liquid-glass utilities, animations
│   └── api/               # contact (Resend) + tts (ElevenLabs) routes
├── system/
│   ├── store.ts           # Zustand store — the whole OS state
│   ├── apps.tsx           # app registry
│   └── icons.tsx          # app icon rendering
├── components/os/         # the shell: MacOS, Window, Dock, MenuBar,
│                          # Spotlight, ControlCenter, Wallpaper, BootScreen
└── apps/                  # one file per app
```

**The state model.** A single Zustand store (`src/system/store.ts`) holds every open window as `{ x, y, w, h, z, minimized, maximized, fullscreen }`, plus the focus order, dark mode, wallpaper, and which overlays are open. Window chrome, the dock, and the menu bar all read from it, so any component can open, focus, or close an app with one call — `useOS.getState().openApp("projects")`.

**Windows are absolutely positioned divs.** `Window.tsx` handles pointer-driven drag and eight-way resize, clamps bounds to the viewport, and animates open/close. Apps inside it don't know or care that they're in a window.

**Glass is CSS, not images.** Layered `backdrop-filter: blur() saturate()` with a translucent tint and inset highlight borders — defined once in `globals.css` and reused everywhere.

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · Zustand

---

## A note on assets

The code here is yours to reuse. The assets are not all mine to give:

- **Wallpapers** are Apple's macOS Tahoe wallpapers — replace them with your own before deploying publicly.
- **Sound effects** are third-party mechanical keyboard/mouse samples.
- **Company, project, and skill logos** belong to their respective owners.
- **Photo and resume** are mine — swap them out (step 2 above).

If you fork this, ship it with your own assets.

---

## License

MIT — see [LICENSE](LICENSE). Attribution is appreciated but not required.

Built by [Pranav Cavaturu](https://cavaturu.com).
