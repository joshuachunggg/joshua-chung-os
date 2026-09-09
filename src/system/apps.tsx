import type { ComponentType } from "react";
import type { AppId } from "./store";
import { AboutApp } from "@/apps/AboutApp";
import { ProjectsApp } from "@/apps/ProjectsApp";
import { ExperienceApp } from "@/apps/ExperienceApp";
import { TerminalApp } from "@/apps/TerminalApp";
import { ResumeApp } from "@/apps/ResumeApp";
import { ContactApp } from "@/apps/ContactApp";
import { SettingsApp } from "@/apps/SettingsApp";

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
