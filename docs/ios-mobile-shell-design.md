# iOS 26 Mobile Shell — Design

**Date:** 2026-08-17
**Status:** Approved by Pranav (pending spec review)

## Goal

Phone visitors currently get the macOS Tahoe desktop squeezed into a small
viewport. Instead, phones should get an iOS 26 imitation of the same
portfolio — home screen, dock, full-screen apps — while desktops, laptops,
and tablets keep the existing macOS experience unchanged.

## Scope

**In scope**

- Client-side phone detection that mounts either the existing macOS shell or
  a new iOS shell.
- iOS shell: status bar, home-screen icon grid, liquid-glass dock,
  full-screen app hosting with open/close zoom animations and a home
  indicator to exit apps.
- iOS-native restyles of four key apps: About, Projects, Experience,
  Contact.
- All other apps reused as-is, rendered full-screen.

**Out of scope (YAGNI)**

- Lock screen, app switcher, home-screen paging/folders, widgets,
  notifications, landscape-specific layouts.

## Architecture

Approach chosen: **separate iOS shell with shared app content** (over
"one store, two skins" and "separate /ios route"). The macOS window store's
bounds/z-order logic is meaningless on iOS, so the iOS shell gets its own
minimal store. Aside from the top-level mount point and two one-line
`launchApp` import swaps (see "Bridging reused apps"), no macOS component
is modified, so the desktop experience carries near-zero regression risk.

### Device detection — `src/components/Device.tsx`

Client component replacing `<MacOS />` in `src/app/page.tsx`:

- Phone iff: (coarse pointer AND `min(screen.width, screen.height) < 700`)
  OR UA matches `/iPhone|Android.+Mobile/`.
- The 700px minor-axis threshold excludes all iPads (iPad mini portrait is
  744px) while including all phones (largest iPhones are ~440pt wide).
- Detection runs once at mount and is not re-evaluated on resize/rotation —
  all three signals (screen minor axis, pointer coarseness, UA) are stable
  for the lifetime of a page view.
- Renders a black full-screen div until mounted (one frame); both shells
  boot from dark so no flash is visible. Phones mount `<IPhone />`;
  everything else mounts `<MacOS />`.
- The existing `mobile` squeeze-mode in the macOS store remains untouched as
  the fallback for small non-phone viewports.

### iOS store — `src/system/ios-store.ts`

Small zustand store, independent of `useOS`:

```ts
interface IOSState {
  openApp: AppId | null;      // at most one app open
  phase: "home" | "opening" | "app" | "closing";
  open(id: AppId): void;      // home -> opening -> app
  close(): void;              // app -> closing -> home
}
```

No window bounds, no z-order, no minimize/maximize. **No `dark` or
`wallpaper` fields** — appearance state stays in `useOS` as the single
source of truth (see "Bridging reused apps" below), so the reused
SettingsApp and CalendarApp keep working unmodified.

### iOS shell components — `src/components/ios/`

- **`IPhone.tsx`** — root: wallpaper (reuses Tahoe wallpaper assets),
  StatusBar, HomeScreen, IOSDock, and AppHost when an app is open.
- **`StatusBar.tsx`** — time on the left; signal, Wi-Fi, battery glyphs on
  the right. Floats above home screen and apps.
- **`HomeScreen.tsx`** — 4-column grid of all 14 apps (minus the 4 dock
  apps, which appear only in the dock) using the existing `AppIcon`
  component from `src/system/icons.tsx` with labels beneath. Tap opens the
  app.
- **`IOSDock.tsx`** — liquid-glass rounded bar fixed at the bottom holding
  **Projects, About, Contact, Resume** (user-chosen).
- **`AppHost.tsx`** — full-screen container for the open app: zoom-from-icon
  open animation, zoom-out close animation (CSS transforms/opacity driven by
  store `phase`), rounded display corners, and a **home indicator** bar at
  the bottom; tap or swipe up returns to the home screen.

### App registry — `src/system/ios-apps.tsx`

Maps each `AppId` to its iOS presentation:

| App | Presentation |
| --- | --- |
| About | **Restyled** — Contacts-style profile: large avatar, name header, grouped inset info rows |
| Projects | **Restyled** — iOS list/cards with large "Projects" title (replaces Finder metaphor) |
| Experience | **Restyled** — Notes-style list with large title |
| Contact | **Restyled** — grouped inset form fields, iOS send button |
| Terminal, Resume, Snake, Calendar | Reused component, full-screen |
| Settings | Reused, full-screen; wallpaper picker and appearance toggle work on iOS (see below); the sound toggle stays visible since it also mutes SnakeApp's game sounds (the iOS shell itself plays no peripheral sounds) |
| Kubrick, Scripy, Echo | Existing iframe with an iOS-style top bar |
| B3VO, CAMPUS | Existing iframes edge-to-edge (they are iPhone apps already) |

Restyled apps live in `src/apps/ios/` (`IOSAboutApp.tsx`,
`IOSProjectsApp.tsx`, `IOSExperienceApp.tsx`, `IOSContactApp.tsx`). All use
the system font stack, iOS grouped-inset-list styling, iOS blue (#0A84FF)
accents, and read `useOS.dark` for light/dark mode. `IOSContactApp` keeps
the existing "schedule a call" affordance, routed through the platform
dispatcher below (opening the Calendar app in the iOS shell).

## Bridging reused apps to the iOS shell

Reused apps are coupled to the macOS store; the iOS shell satisfies those
couplings explicitly rather than pretending reuse is free:

- **Appearance:** `useOS.dark` and `useOS.wallpaper` remain the single
  source of truth. `IPhone.tsx` reads both — the home screen renders the
  selected wallpaper and dark mode applies everywhere — so SettingsApp and
  CalendarApp work unmodified.
- **`useOS.mobile`:** `IPhone.tsx` calls `useOS.setMobile(true)` on mount so
  apps that gate touch behavior on it (SnakeApp's touch controls) behave
  correctly.
- **`useOS.activeApp`:** the iOS store mirrors its `openApp` into
  `useOS.activeApp` (via `useOS.setState`) so SnakeApp's auto-pause
  (`activeApp !== "snake"`) doesn't fire while the game is front-most on
  iOS; `close()` resets it to `null`, so Snake correctly re-pauses when the
  user swipes home mid-game.
- **Cross-app opens:** a tiny platform dispatcher `src/system/os-bridge.ts`
  exposes `launchApp(id)`, routing to `useOS.openApp` on macOS and the iOS
  store's `open` on iOS (the active shell registers itself at mount).
  TerminalApp's `open <app>` command and the Contact app's calendar button
  switch to this one-line import; these are the only two edits to existing
  app components.

## Error handling

- Detection failure (no `matchMedia`, ancient browser): default to macOS
  shell — same behavior as today.
- Iframe apps keep their existing load/splash handling.

## Testing

Playwright (webapp-testing skill) against `next dev`:

1. iPhone viewport + touch emulation → iOS shell renders (status bar, grid,
   dock visible).
2. Tap an app icon → app opens full-screen; home indicator returns to home.
3. Dock apps open their restyled iOS versions.
4. Bridge behaviors: Terminal `open projects` opens Projects in the iOS
   shell; Settings appearance toggle flips dark mode on the iOS home
   screen.
5. Laptop viewport → macOS shell unchanged (menu bar + dock present).
6. `next build` passes.
