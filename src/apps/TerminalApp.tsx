"use client";

import { useEffect, useRef, useState } from "react";
import { useOS, type AppId } from "@/system/store";
import { profile, projects, experience, skills } from "@/data/resume";

type Line = { text: string; color?: string };

const PROMPT = "joshua@systems ~ %";

const NEOFETCH = String.raw`
                    'c.          ${profile.name}
                 ,xNMM.          ─────────────────────────
               .OMMMMo           OS:       joshuaOS Tahoe 26.0
               OMMM0,            Host:     Portfolio (2026)
     .;loddo:' loolloddol;.      Kernel:   next.js 16 / react 19
   cKMMMMMMMMMMNWMMMMMMMMMM0:    Shell:    zsh (simulated)
 .KMMMMMMMMMMMMMMMMMMMMMMMWd.    School:   UT Austin · Accounting + PPE
 XMMMMMMMMMMMMMMMMMMMMMMMX.      Role:     AI systems, finance & energy
;MMMMMMMMMMMMMMMMMMMMMMMM:       Stack:    TS · Python · React · SQL
:MMMMMMMMMMMMMMMMMMMMMMMM:       Focus:    operational systems
.MMMMMMMMMMMMMMMMMMMMMMMMX.      Email:    ${profile.email}
 kMMMMMMMMMMMMMMMMMMMMMMMMWd.
 .XMMMMMMMMMMMMMMMMMMMMMMMMMMk
  .XMMMMMMMMMMMMMMMMMMMMMMMMK.
    kMMMMMMMMMMMMMMMMMMMMMMd
     ;KMMMMMMMWXXWMMMMMMMk.
       .cooc,.    .,coo:.
`;

export function TerminalApp() {
  const [lines, setLines] = useState<Line[]>([
    { text: "Last login: " + new Date().toDateString() + " on ttys001" },
    { text: "Type `help` to see available commands.", color: "#8e8e93" },
  ]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const openApp = useOS((s) => s.openApp);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [lines]);

  const print = (out: Line[]) => setLines((l) => [...l, ...out]);

  const run = (raw: string) => {
    const cmd = raw.trim();
    print([{ text: `${PROMPT} ${raw}`, color: "#e8e8ee" }]);
    if (!cmd) return;
    setHistory((h) => [cmd, ...h]);
    setHistIdx(-1);

    const [name, ...args] = cmd.split(/\s+/);
    const arg = args.join(" ").toLowerCase();

    switch (name.toLowerCase()) {
      case "help":
        print(
          [
            ["help", "show this list"],
            ["about", "who is joshua?"],
            ["projects", "list projects"],
            ["project <name>", "project details (e.g. `project sitegraph`)"],
            ["experience", "work history"],
            ["skills", "technical skills"],
            ["contact", "how to reach me"],
            ["open <app>", "open an app (about, projects, resume, contact…)"],
            ["neofetch", "system info"],
            ["clear", "clear the screen"],
          ].map(([c, d]) => ({
            text: `  ${c.padEnd(18)} ${d}`,
            color: "#3dfc85",
          }))
        );
        break;
      case "about":
      case "whoami":
        print([
          { text: `${profile.name}: ${profile.role}` },
          { text: `${profile.education.school} · ${profile.education.degree} · ${profile.education.grad}`, color: "#8e8e93" },
        ]);
        break;
      case "projects":
      case "ls":
        print(
          projects.map((p) => ({
            text: `  ${p.name.padEnd(12)} ${p.year}  ${p.summary.slice(0, 64)}…`,
            color: "#5ac8fa",
          }))
        );
        break;
      case "project":
      case "cat": {
        const p = projects.find((x) => x.id.includes(arg) || x.name.toLowerCase().includes(arg));
        if (!p) {
          print([{ text: `project not found: ${arg || "(none)"}. Try \`projects\``, color: "#ff6b6b" }]);
        } else {
          print([
            { text: `${p.name} (${p.year})`, color: "#5ac8fa" },
            { text: `stack: ${p.stack.join(", ")}`, color: "#8e8e93" },
            ...p.bullets.map((b) => ({ text: `  • ${b}` })),
          ]);
        }
        break;
      }
      case "experience":
        print(
          experience.flatMap((e) => [
            { text: `${e.company}: ${e.role}`, color: "#ffd60a" },
            { text: `  ${e.period} · ${e.location}`, color: "#8e8e93" },
          ])
        );
        break;
      case "skills":
        print(
          Object.entries(skills).map(([g, items]) => ({
            text: `  ${g.padEnd(18)} ${items.join(", ")}`,
          }))
        );
        break;
      case "contact":
        print([
          { text: `  email     ${profile.email}`, color: "#5ac8fa" },
          { text: `  linkedin  ${profile.linkedin}`, color: "#5ac8fa" },
          { text: `  github    ${profile.github}`, color: "#5ac8fa" },
        ]);
        break;
      case "open": {
        const valid: AppId[] = ["about", "projects", "experience", "terminal", "contact", "settings"];
        const target = valid.find((v) => v === arg);
        if (target) {
          openApp(target);
          print([{ text: `opening ${target}…`, color: "#3dfc85" }]);
        } else {
          print([{ text: `unknown app: ${arg}. try: ${valid.join(", ")}`, color: "#ff6b6b" }]);
        }
        break;
      }
      case "neofetch":
        print(NEOFETCH.split("\n").map((t) => ({ text: t, color: "#3dfc85" })));
        break;
      case "clear":
        setLines([]);
        break;
      case "sudo":
        print([{ text: "joshua is not in the sudoers file. This incident will be reported.", color: "#ff6b6b" }]);
        break;
      case "echo":
        print([{ text: args.join(" ") }]);
        break;
      case "pwd":
        print([{ text: "/Users/joshua/portfolio" }]);
        break;
      case "exit":
        print([{ text: "Nice try. Use the red traffic light 🙂", color: "#8e8e93" }]);
        break;
      default:
        print([{ text: `zsh: command not found: ${name}. Try \`help\``, color: "#ff6b6b" }]);
    }
  };

  return (
    <div
      className="flex h-full flex-col px-3 pb-3 pt-1"
      style={{ fontFamily: "var(--font-mono)", fontSize: 12.5, color: "#e8e8ee" }}
      onClick={() => inputRef.current?.focus()}
    >
      <div ref={scrollRef} className="macos-scroll min-h-0 flex-1 whitespace-pre-wrap leading-[1.5]">
        {lines.map((l, i) => (
          <div key={i} style={{ color: l.color }}>
            {l.text || " "}
          </div>
        ))}
        <div className="relative flex items-center">
          <span style={{ color: "#3dfc85" }}>{PROMPT}&nbsp;</span>
          <span>{input}</span>
          <span
            className="anim-cursor-blink inline-block"
            style={{ width: 8, height: 16, background: "#e8e8ee", marginLeft: 1 }}
          />
          <input
            ref={inputRef}
            className="absolute inset-0 h-full w-full cursor-text opacity-0 outline-none"
            value={input}
            autoFocus
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                run(input);
                setInput("");
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                const ni = Math.min(histIdx + 1, history.length - 1);
                if (history[ni]) {
                  setHistIdx(ni);
                  setInput(history[ni]);
                }
              } else if (e.key === "ArrowDown") {
                e.preventDefault();
                const ni = histIdx - 1;
                setHistIdx(Math.max(ni, -1));
                setInput(ni >= 0 ? history[ni] : "");
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
