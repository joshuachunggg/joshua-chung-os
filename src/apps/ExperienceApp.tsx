"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { experience, skills } from "@/data/resume";
import { useOS } from "@/system/store";

/** Experience, styled and behaving like the real macOS Notes app. Session-only. */

interface Note {
  id: string;
  folderId: string;
  updatedAt: number;
  body: string;
  deletedAt?: number;
  logo?: string;
  /** Portfolio seed notes: show structured title / subtitle / bullets */
  locked?: boolean;
  subtitle?: string;
  lines?: string[];
  /** Shown in the list instead of a clock time (e.g. "May 2026") */
  dateLabel?: string;
  /** Custom-rendered note bodies (skills grid with tech logos) */
  kind?: "skills";
}

interface Folder {
  id: string;
  name: string;
  system?: boolean;
}

const FOLDERS: Folder[] = [
  { id: "all", name: "All iCloud" },
  { id: "notes", name: "Notes" },
  { id: "experience", name: "Experience" },
  { id: "skills", name: "Skills" },
  { id: "deleted", name: "Recently Deleted", system: true },
];

/** skill name → logo file in /icons/skills, or an emoji for concepts */
const SKILL_ICONS: Record<string, { img?: string; emoji?: string }> = {
  Python: { img: "python.svg" },
  Java: { img: "openjdk.svg" },
  "C/C++": { img: "cplusplus.svg" },
  TypeScript: { img: "typescript.svg" },
  JavaScript: { img: "javascript.svg" },
  SQL: { img: "postgresql.svg" },
  "HTML/CSS": { img: "html5.svg" },
  React: { img: "react.svg" },
  "React Native": { img: "react.svg" },
  Expo: { img: "expo.svg" },
  "Next.js": { img: "nextdotjs.svg" },
  "Node.js": { img: "nodedotjs.svg" },
  FastAPI: { img: "fastapi.svg" },
  PyTorch: { img: "pytorch.svg" },
  Transformers: { img: "huggingface.svg" },
  "Tailwind CSS": { img: "tailwindcss.svg" },
  "Three.js": { img: "threedotjs.svg" },
  "AWS (S3)": { img: "aws.svg" },
  "Cloudflare R2": { img: "cloudflare.svg" },
  Modal: { img: "modal.svg" },
  Docker: { img: "docker.svg" },
  "CI/CD": { img: "githubactions.svg" },
  Convex: { img: "convex.svg" },
  Git: { img: "git.svg" },
  Stripe: { img: "stripe.svg" },
  Clerk: { img: "clerk.svg" },
  "REST APIs": { img: "openapiinitiative.svg" },
  "Data Structures & Algorithms": { emoji: "🧮" },
  "Distributed Systems": { emoji: "🕸️" },
  "Unit Testing": { emoji: "🧪" },
  "Vision-Language Models": { emoji: "👁️" },
  "LLM Prompting": { emoji: "✨" },
};

const SKILL_COUNT = Object.values(skills).reduce((n, items) => n + items.length, 0);

const KUBRICK_LINES = [
  "Audience engagement prediction through neural analysis using our multimodal inference model (Kubrick Monolith).",
  "AI script coverage & script breakdowns.",
  "Enabled filmmakers to score trailers for predicted audience attention by engineering and deploying a system that forecasts per-shot viewer neural response to video, built on top of the Tribe V2 model.",
  "Powered model inference by building an end-to-end pipeline that segments video with ffmpeg, transcribes speech with WhisperX, and extracts audio features for feature-level prediction.",
  "Cut infrastructure overhead by deploying the model as a serverless endpoint on Modal, securing webhooks with HMAC authentication to sanitize incoming jobs and persist outputs.",
];

function seedNotes(): Note[] {
  const now = Date.now();
  return [
    {
      id: "kubrick-note",
      folderId: "notes",
      updatedAt: now - 5 * 3_600_000,
      logo: "/icons/kubrick.svg",
      locked: true,
      subtitle: "AI Native Film Suite for serious filmmakers",
      dateLabel: "2026",
      lines: KUBRICK_LINES,
      body: ["Kubrick", "AI Native Film Suite for serious filmmakers", "", ...KUBRICK_LINES].join("\n"),
    },
    ...experience.map((e, i) => ({
      id: e.id,
      folderId: "experience",
      updatedAt: now - (i + 1) * 86_400_000,
      logo: e.logo,
      locked: true,
      subtitle: `${e.role} · ${e.location}`,
      lines: e.bullets,
      dateLabel: e.period,
      body: [e.company, `${e.role} · ${e.location}`, "", ...e.bullets].join("\n"),
    })),
    {
      id: "skills",
      folderId: "skills",
      // sits between the newest experience notes and Education in "All iCloud"
      updatedAt: now - 6 * 86_400_000,
      locked: true,
      kind: "skills" as const,
      subtitle: Object.keys(skills).join(" · "),
      dateLabel: `${SKILL_COUNT} skills`,
      body: [
        "Technical Skills",
        ...Object.entries(skills).map(([g, items]) => `${g}: ${items.join(", ")}`),
      ].join("\n"),
    },
  ];
}

function noteTitle(body: string) {
  const line = body.split("\n")[0]?.trim() ?? "";
  return line || "New Note";
}

function notePreview(body: string) {
  const lines = body.split("\n").slice(1);
  const preview = lines.map((l) => l.trim()).find(Boolean) ?? "No additional text";
  return preview;
}

function formatListDate(ts: number) {
  const d = new Date(ts);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfThat = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const dayMs = 86_400_000;
  const diff = startOfToday - startOfThat;

  if (diff === 0) {
    return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  }
  if (diff === dayMs) return "Yesterday";
  if (diff < 7 * dayMs) return d.toLocaleDateString(undefined, { weekday: "long" });
  if (d.getFullYear() === now.getFullYear()) {
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function formatEditorDate(ts: number) {
  return new Date(ts).toLocaleString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function uid() {
  return `note-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function ExperienceApp() {
  const [notes, setNotes] = useState<Note[]>(seedNotes);
  const [folderId, setFolderId] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(experience[0]?.id ?? "skills");
  const [query, setQuery] = useState("");
  const titleRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const shouldFocus = useRef(false);

  const visibleNotes = useMemo(() => {
    const q = query.trim().toLowerCase();
    return notes
      .filter((n) => {
        if (folderId === "deleted") return !!n.deletedAt;
        if (n.deletedAt) return false;
        if (folderId === "all") return true;
        return n.folderId === folderId;
      })
      .filter((n) => {
        if (!q) return true;
        return n.body.toLowerCase().includes(q);
      })
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }, [notes, folderId, query]);

  const selected = notes.find((n) => n.id === selectedId) ?? null;

  // Keep selection valid when the list changes
  useEffect(() => {
    if (selectedId && visibleNotes.some((n) => n.id === selectedId)) return;
    setSelectedId(visibleNotes[0]?.id ?? null);
  }, [visibleNotes, selectedId]);

  useEffect(() => {
    if (shouldFocus.current && titleRef.current) {
      titleRef.current.focus();
      shouldFocus.current = false;
    }
  }, [selectedId]);

  const folderCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: 0,
      notes: 0,
      experience: 0,
      skills: 0,
      deleted: 0,
    };
    for (const n of notes) {
      if (n.deletedAt) {
        counts.deleted += 1;
      } else {
        counts.all += 1;
        if (n.folderId in counts) counts[n.folderId] += 1;
      }
    }
    return counts;
  }, [notes]);

  const createNote = () => {
    const dest =
      folderId === "deleted" || folderId === "all" ? "notes" : folderId;
    if (folderId === "deleted") setFolderId("notes");
    const note: Note = {
      id: uid(),
      folderId: dest,
      updatedAt: Date.now(),
      body: "",
    };
    setNotes((prev) => [note, ...prev]);
    setSelectedId(note.id);
    shouldFocus.current = true;
  };

  const updateBody = (body: string) => {
    if (!selected || selected.deletedAt) return;
    setNotes((prev) =>
      prev.map((n) => (n.id === selected.id ? { ...n, body, updatedAt: Date.now() } : n))
    );
  };

  const deleteSelected = () => {
    if (!selected) return;
    if (selected.deletedAt) {
      setNotes((prev) => prev.filter((n) => n.id !== selected.id));
      setSelectedId(null);
      return;
    }
    setNotes((prev) =>
      prev.map((n) =>
        n.id === selected.id ? { ...n, deletedAt: Date.now(), updatedAt: Date.now() } : n
      )
    );
  };

  const restoreSelected = () => {
    if (!selected?.deletedAt) return;
    setNotes((prev) =>
      prev.map((n) =>
        n.id === selected.id
          ? { ...n, deletedAt: undefined, folderId: n.folderId || "notes", updatedAt: Date.now() }
          : n
      )
    );
    setFolderId(selected.folderId || "notes");
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "n") {
        const active = useOS.getState().activeApp;
        if (active !== "experience") return;
        e.preventDefault();
        createNote();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [folderId]);

  return (
    <div
      className="flex h-full flex-col"
      style={{ fontFamily: "var(--font-system)", background: "var(--content-bg)" }}
    >
      {/* Toolbar */}
      <div
        className="flex h-11 flex-none items-center gap-1 border-b px-3"
        style={{ borderColor: "var(--divider)", background: "var(--window-chrome)" }}
      >
        <ToolbarButton label="New Note" onClick={createNote}>
          <NewNoteIcon />
        </ToolbarButton>
        <ToolbarButton
          label={folderId === "deleted" ? "Delete Forever" : "Delete"}
          onClick={deleteSelected}
          disabled={!selected}
        >
          <TrashIcon />
        </ToolbarButton>
        {folderId === "deleted" && selected && (
          <button
            onClick={restoreSelected}
            className="ml-1 rounded-md px-2 py-1 text-[12px] font-medium"
            style={{ color: "var(--accent)" }}
          >
            Recover
          </button>
        )}
        <div className="flex-1" />
        <div
          className="flex h-7 w-[200px] items-center gap-1.5 rounded-md px-2"
          style={{ background: "var(--sidebar-bg)", border: "0.5px solid var(--divider)" }}
        >
          <SearchIcon />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
            className="min-w-0 flex-1 bg-transparent text-[12.5px] outline-none"
            style={{ color: "var(--text-primary)" }}
          />
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* Folders sidebar */}
        <div
          className="macos-scroll w-[168px] flex-none border-r px-2 py-2"
          style={{ background: "var(--sidebar-bg)", borderColor: "var(--divider)" }}
        >
          <div
            className="px-2 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-[0.04em]"
            style={{ color: "var(--text-tertiary)" }}
          >
            iCloud
          </div>
          {FOLDERS.filter((f) => !f.system).map((f) => (
            <FolderRow
              key={f.id}
              name={f.name}
              count={folderCounts[f.id] ?? 0}
              active={folderId === f.id}
              onClick={() => setFolderId(f.id)}
            />
          ))}
          {(folderCounts.deleted ?? 0) > 0 && (
            <>
              <div
                className="mt-3 px-2 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-[0.04em]"
                style={{ color: "var(--text-tertiary)" }}
              >
                On My Mac
              </div>
              {FOLDERS.filter((f) => f.system).map((f) => (
                <FolderRow
                  key={f.id}
                  name={f.name}
                  count={folderCounts[f.id] ?? 0}
                  active={folderId === f.id}
                  onClick={() => setFolderId(f.id)}
                />
              ))}
            </>
          )}
        </div>

        {/* Notes list */}
        <div
          className="macos-scroll w-[260px] flex-none border-r"
          style={{ background: "var(--content-bg)", borderColor: "var(--divider)" }}
        >
          <div
            className="sticky top-0 z-10 border-b px-3 py-2 text-[12px] font-semibold"
            style={{
              background: "var(--content-bg)",
              borderColor: "var(--divider)",
              color: "var(--text-secondary)",
            }}
          >
            {FOLDERS.find((f) => f.id === folderId)?.name ?? "Notes"}
            <span className="ml-1 font-normal" style={{ color: "var(--text-tertiary)" }}>
              ({visibleNotes.length})
            </span>
          </div>

          {visibleNotes.length === 0 ? (
            <div
              className="px-4 py-10 text-center text-[13px]"
              style={{ color: "var(--text-tertiary)" }}
            >
              No Notes
            </div>
          ) : (
            visibleNotes.map((n, i, arr) => {
              const active = n.id === selectedId;
              const showSep =
                i < arr.length - 1 && n.id !== selectedId && arr[i + 1].id !== selectedId;
              return (
                <div key={n.id}>
                  <button
                    className="w-full px-3 py-2.5 text-left"
                    style={{
                      background: active ? "rgba(255, 204, 0, 0.45)" : "transparent",
                    }}
                    onClick={() => setSelectedId(n.id)}
                  >
                    <div className="truncate text-[13px] font-semibold leading-snug">
                      {noteTitle(n.body)}
                    </div>
                    <div
                      className="mt-0.5 flex gap-1.5 text-[12px] leading-snug"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      <span className="flex-none">
                        {n.dateLabel
                          ? n.dateLabel.split("–")[0].trim()
                          : formatListDate(n.updatedAt)}
                      </span>
                      <span className="truncate" style={{ color: "var(--text-tertiary)" }}>
                        {n.subtitle || notePreview(n.body)}
                      </span>
                    </div>
                  </button>
                  {showSep && (
                    <div className="mx-3 h-px" style={{ background: "var(--divider)" }} />
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Editor */}
        <div className="flex min-w-0 flex-1 flex-col" style={{ background: "var(--content-bg)" }}>
          {selected ? (
            <>
              <div
                className="flex-none pt-3 text-center text-[11.5px]"
                style={{ color: "var(--text-tertiary)" }}
              >
                {selected.dateLabel || formatEditorDate(selected.updatedAt)}
              </div>
              <div className="macos-scroll min-h-0 flex-1 px-10 pb-8 pt-4">
                {selected.locked ? (
                  <>
                    <div className="flex items-center gap-3.5">
                      {selected.logo && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={selected.logo}
                          alt=""
                          width={46}
                          height={46}
                          draggable={false}
                          className="flex-none rounded-[10px]"
                          style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.18)" }}
                        />
                      )}
                      <div className="min-w-0">
                        <h1 className="text-[23px] font-bold leading-tight tracking-[-0.02em]">
                          {noteTitle(selected.body)}
                        </h1>
                        {selected.subtitle && (
                          <div
                            className="text-[13px]"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            {selected.subtitle}
                          </div>
                        )}
                      </div>
                    </div>
                    {selected.kind === "skills" ? (
                      <SkillsBody />
                    ) : (
                      <div className="mt-5 space-y-[9px] text-[13.5px] leading-[1.55]">
                        {(selected.lines ?? []).map((line, i) => (
                          <div key={i} className="flex gap-2">
                            <span
                              className="flex-none"
                              style={{ color: "var(--text-secondary)" }}
                            >
                              -
                            </span>
                            <span>{line}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex items-start gap-3.5">
                    {selected.logo && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={selected.logo}
                        alt=""
                        width={46}
                        height={46}
                        draggable={false}
                        className="mt-0.5 flex-none rounded-[10px]"
                        style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.18)" }}
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <input
                        ref={titleRef}
                        value={selected.body.split("\n")[0] ?? ""}
                        onChange={(e) => {
                          const lines = selected.body.split("\n");
                          lines[0] = e.target.value;
                          updateBody(lines.join("\n"));
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            editorRef.current?.focus();
                          }
                        }}
                        readOnly={!!selected.deletedAt}
                        placeholder="New Note"
                        className="w-full bg-transparent text-[22px] font-bold leading-tight tracking-[-0.02em] outline-none"
                        style={{ color: "var(--text-primary)", caretColor: "var(--accent)" }}
                      />
                      <textarea
                        ref={editorRef}
                        value={
                          selected.body.includes("\n")
                            ? selected.body.slice(selected.body.indexOf("\n") + 1)
                            : ""
                        }
                        onChange={(e) => {
                          const title = selected.body.split("\n")[0] ?? "";
                          updateBody(`${title}\n${e.target.value}`);
                        }}
                        readOnly={!!selected.deletedAt}
                        placeholder="Start writing…"
                        spellCheck
                        className="mt-2 min-h-[60%] w-full flex-1 resize-none bg-transparent text-[15px] leading-[1.47] outline-none placeholder:opacity-40"
                        style={{
                          color: "var(--text-primary)",
                          caretColor: "var(--accent)",
                          height: "calc(100% - 40px)",
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div
              className="flex flex-1 items-center justify-center text-[15px]"
              style={{ color: "var(--text-tertiary)" }}
            >
              No Note Selected
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SkillRow({ name }: { name: string }) {
  const icon = SKILL_ICONS[name];
  return (
    <div className="flex w-1/2 min-w-[210px] items-center gap-2.5 py-[5px] pr-3">
      <span
        className="flex h-[26px] w-[26px] flex-none items-center justify-center rounded-[7px]"
        style={{
          background: "#fff",
          border: "0.5px solid rgba(0,0,0,0.12)",
          boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
          fontSize: 14,
        }}
      >
        {icon?.img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`/icons/skills/${icon.img}`} alt="" width={16} height={16} draggable={false} />
        ) : (
          icon?.emoji ?? "•"
        )}
      </span>
      <span className="truncate text-[13px]">{name}</span>
    </div>
  );
}

function SkillsBody() {
  return (
    <div className="mt-4">
      {Object.entries(skills).map(([group, items]) => (
        <div key={group} className="mb-4">
          <div
            className="mb-1 text-[11px] font-bold uppercase tracking-[0.06em]"
            style={{ color: "var(--text-tertiary)" }}
          >
            {group}
          </div>
          <div className="flex flex-wrap">
            {items.map((s) => (
              <SkillRow key={s} name={s} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function FolderRow({
  name,
  count,
  active,
  onClick,
}: {
  name: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-2 rounded-md px-2 py-[5px] text-left text-[13px]"
      style={{
        background: active ? "var(--accent)" : "transparent",
        color: active ? "#fff" : "var(--text-primary)",
      }}
    >
      <FolderIcon active={active} />
      <span className="min-w-0 flex-1 truncate font-medium">{name}</span>
      <span
        className="text-[12px] tabular-nums"
        style={{ color: active ? "rgba(255,255,255,0.75)" : "var(--text-tertiary)" }}
      >
        {count}
      </span>
    </button>
  );
}

function ToolbarButton({
  children,
  onClick,
  disabled,
  label,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className="flex h-7 w-8 items-center justify-center rounded-md transition-colors disabled:opacity-35"
      style={{ color: "var(--text-secondary)" }}
      onMouseEnter={(e) => {
        if (!disabled) e.currentTarget.style.background = "var(--divider)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
      }}
    >
      {children}
    </button>
  );
}

function NewNoteIcon() {
  // Closest match to iOS Notes compose (square.and.pencil) toolbar glyph
  return (
    <svg width="19" height="19" viewBox="0 0 19 19" fill="none">
      <path
        d="M11.6 3.15H5.85A2.35 2.35 0 0 0 3.5 5.5v7.65A2.35 2.35 0 0 0 5.85 15.5h7.65a2.35 2.35 0 0 0 2.35-2.35V7.55"
        stroke="currentColor"
        strokeWidth="1.45"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.2 9.05L15.05 4.2"
        stroke="currentColor"
        strokeWidth="1.55"
        strokeLinecap="round"
      />
      <circle cx="15.55" cy="3.7" r="1.2" fill="currentColor" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
      <path
        d="M3.5 4.5h10M6.5 4.5V3.2a.7.7 0 0 1 .7-.7h2.6a.7.7 0 0 1 .7.7v1.3M5 4.5l.6 9.2a1 1 0 0 0 1 .9h3.8a1 1 0 0 0 1-.9l.6-9.2"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ color: "var(--text-tertiary)" }}>
      <circle cx="5.2" cy="5.2" r="3.4" stroke="currentColor" strokeWidth="1.2" />
      <path d="M7.7 7.7L10.2 10.2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function FolderIcon({ active }: { active: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="flex-none">
      <path
        d="M1.5 3.8A1.3 1.3 0 0 1 2.8 2.5h2.3l1.2 1.3h5a1.3 1.3 0 0 1 1.3 1.3v5.6a1.3 1.3 0 0 1-1.3 1.3H2.8A1.3 1.3 0 0 1 1.5 10.7V3.8z"
        fill={active ? "rgba(255,255,255,0.95)" : "#FFD60A"}
        stroke={active ? "rgba(255,255,255,0.4)" : "#F5A623"}
        strokeWidth="0.6"
      />
    </svg>
  );
}
