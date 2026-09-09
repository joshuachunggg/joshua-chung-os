import type { ComponentType } from "react";
import type { AppId } from "./store";
import { AboutApp } from "@/apps/AboutApp";
import { ProjectsApp } from "@/apps/ProjectsApp";
import { ExperienceApp } from "@/apps/ExperienceApp";
import { TerminalApp } from "@/apps/TerminalApp";
import { ResumeApp } from "@/apps/ResumeApp";
import { ContactApp } from "@/apps/ContactApp";
import { SettingsApp } from "@/apps/SettingsApp";
import { SnakeApp } from "@/apps/SnakeApp";
import { CalendarApp } from "@/apps/CalendarApp";
import { makeWebApp } from "@/apps/WebApp";
import { makePhoneApp } from "@/apps/PhoneApp";

const ScripyApp = makeWebApp({
  name: "Scripy",
  url: "https://scripy.io",
  logo: "/icons/scripy.svg",
});

const EchoApp = makeWebApp({
  name: "Echo",
  url: "https://echotexts.vercel.app",
  logo: "/icons/echo.svg",
});

const B3voApp = makePhoneApp({
  name: "B3VO",
  src: "/b3vo",
  logo: "/icons/b3vo.svg",
});

const CampusApp = makePhoneApp({
  name: "CAMPUS",
  src: "/campus",
  logo: "/icons/campus.svg",
});

export interface AppDefinition {
  id: AppId;
  name: string;
  component: ComponentType;
  minW: number;
  minH: number;
  /** window content manages its own chrome background (e.g. terminal) */
  transparent?: boolean;
  keywords: string[];
}

export const APPS: Record<AppId, AppDefinition> = {
  about: {
    id: "about",
    name: "About Joshua",
    component: AboutApp,
    minW: 560,
    minH: 420,
    keywords: ["about", "profile", "bio", "joshua", "ut austin"],
  },
  projects: {
    id: "projects",
    name: "Projects",
    component: ProjectsApp,
    minW: 700,
    minH: 440,
    keywords: ["projects", "sitegraph", "automation", "energy", "kbh", "finance", "finder"],
  },
  experience: {
    id: "experience",
    name: "Experience",
    component: ExperienceApp,
    minW: 720,
    minH: 480,
    keywords: ["experience", "work", "jobs", "dobotai", "partners", "givepower", "sj design"],
  },
  terminal: {
    id: "terminal",
    name: "Terminal",
    component: TerminalApp,
    minW: 480,
    minH: 320,
    transparent: true,
    keywords: ["terminal", "shell", "cli", "console", "zsh"],
  },
  resume: {
    id: "resume",
    name: "Resume",
    component: ResumeApp,
    minW: 480,
    minH: 400,
    keywords: ["resume", "cv", "pdf", "preview"],
  },
  contact: {
    id: "contact",
    name: "Contact",
    component: ContactApp,
    minW: 480,
    minH: 380,
    keywords: ["contact", "mail", "email", "linkedin", "github", "reach"],
  },
  calendar: {
    id: "calendar",
    name: "Schedule a Call",
    component: CalendarApp,
    minW: 700,
    minH: 520,
    keywords: ["calendar", "schedule", "book", "booking", "meeting", "call", "video", "cal", "time", "appointment"],
  },
  scripy: {
    id: "scripy",
    name: "Scripy",
    component: ScripyApp,
    minW: 600,
    minH: 420,
    keywords: ["scripy", "screenwriting", "screenplay", "fountain", "coverage", "site", "browser"],
  },
  b3vo: {
    id: "b3vo",
    name: "B3VO",
    component: B3voApp,
    minW: 340,
    minH: 560,
    keywords: ["b3vo", "bevo", "mental health", "ios", "iphone", "app", "companion"],
  },
  campus: {
    id: "campus",
    name: "CAMPUS",
    component: CampusApp,
    minW: 340,
    minH: 560,
    keywords: ["campus", "ut", "events", "marketplace", "buzz", "ios", "iphone", "app", "social"],
  },
  echo: {
    id: "echo",
    name: "Echo",
    component: EchoApp,
    minW: 600,
    minH: 420,
    keywords: ["echo", "imessage", "chatbot", "contacts", "imitate", "macos", "open source", "site"],
  },
  snake: {
    id: "snake",
    name: "Snake",
    component: SnakeApp,
    minW: 420,
    minH: 420,
    keywords: ["snake", "game", "play", "arcade", "google", "fun"],
  },
  settings: {
    id: "settings",
    name: "System Settings",
    component: SettingsApp,
    minW: 560,
    minH: 420,
    keywords: ["settings", "preferences", "wallpaper", "appearance", "dark mode"],
  },
};

export const DOCK_APPS: AppId[] = [
  "projects",
  "about",
  "experience",
  "terminal",
  "contact",
  "settings",
];
