"use client";

import { useMemo, useRef, useState } from "react";
import { projects, type Project } from "@/data/resume";
import { useOS, type AppId } from "@/system/store";
import { APPS } from "@/system/apps";

/* ── helpers ───────────────────────────────────────────── */

const GLYPHS: Record<Project["icon"], string> = {
  film: "🎬",
  heart: "🫶",
  map: "🗺️",
  pen: "✍️",
};

type Filter = "all" | "web" | "apps";

function kindOf(p: Project): string {
  if (p.id === "b3vo" || p.id === "campus") return "iOS Application";
  if (p.id === "echo") return "macOS Application";
  return "Web Application";
}

function isApp(p: Project) {
  return kindOf(p) !== "Web Application";
}

function openProject(p: Project) {
  if (APPS[p.id as AppId]) {
    useOS.getState().openApp(p.id as AppId);
  } else if (p.url) {
    window.open(p.url, "_blank", "noopener");
  }
}

function ProjectGlyph({ project, size, radius = size * 0.22 }: { project: Project; size: number; radius?: number }) {
  if (project.image) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={project.image} alt="" width={size} height={size} draggable={false} />;
  }
  return (
    <span
      className="flex flex-none items-center justify-center"
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        fontSize: size * 0.46,
        background: `linear-gradient(160deg, ${project.color}, ${project.color}cc)`,
        boxShadow: `0 ${size * 0.1}px ${size * 0.28}px ${project.color}45, inset 0 1px 2px rgba(255,255,255,0.5)`,
      }}
    >
      {GLYPHS[project.icon]}
    </span>
  );
}

/* ── SF-symbol-ish inline icons ────────────────────────── */

function Sf({ d, size = 15, sw = 1.8, color = "currentColor" }: { d: string; size?: number; sw?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d={d} stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const PATHS = {
  chevronLeft: "M10 3 L5.5 8 L10 13",
  chevronRight: "M6 3 L10.5 8 L6 13",
  search: "M7 12 A5 5 0 1 0 7 2 A5 5 0 0 0 7 12 Z M10.6 10.6 L14 14",
  folder: "M1.5 4.5 a1 1 0 0 1 1-1 h3 l1.5 1.5 h6 a1 1 0 0 1 1 1 v6 a1 1 0 0 1 -1 1 h-10.5 a1 1 0 0 1 -1-1 Z",
  globe: "M8 14 A6 6 0 1 0 8 2 A6 6 0 0 0 8 14 Z M2 8 h12 M8 2 c-4.5 3.5 -4.5 8.5 0 12 M8 2 c4.5 3.5 4.5 8.5 0 12",
  phone: "M5 1.5 h6 a1 1 0 0 1 1 1 v11 a1 1 0 0 1 -1 1 h-6 a1 1 0 0 1 -1 -1 v-11 a1 1 0 0 1 1 -1 Z M7 12.5 h2",
};

function GridGlyph({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden>
      {[1, 9].flatMap((x) =>
        [1, 9].map((y) => (
          <rect key={`${x}${y}`} x={x} y={y} width="6" height="6" rx="1.6" stroke="currentColor" strokeWidth="1.6" />
        )),
      )}
    </svg>
  );
}

function ListGlyph({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden>
      {[3, 8, 13].map((y) => (
        <g key={y}>
          <circle cx="2.2" cy={y} r="1.1" fill="currentColor" />
          <path d={`M5.5 ${y} H14`} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </g>
      ))}
    </svg>
  );
}

/* ── main app ──────────────────────────────────────────── */

const SIDEBAR_FILTERS: { id: Filter; label: string; icon: keyof typeof PATHS }[] = [
  { id: "all", label: "All Projects", icon: "folder" },
  { id: "web", label: "Web Apps", icon: "globe" },
  { id: "apps", label: "iOS & macOS", icon: "phone" },
];

export function ProjectsApp() {
  const [filter, setFilter] = useState<Filter>("all");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(projects[0].id);
  // selection history for the back/forward chevrons
  const history = useRef<{ stack: string[]; i: number }>({ stack: [projects[0].id], i: 0 });
  const [, bump] = useState(0);

  const visible = useMemo(() => {
    let list = projects;
    if (filter === "web") list = list.filter((p) => !isApp(p));
    if (filter === "apps") list = list.filter(isApp);
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.summary.toLowerCase().includes(q) ||
          p.stack.some((t) => t.toLowerCase().includes(q)),
      );
    }
    return list;
  }, [filter, query]);

  const selected = projects.find((p) => p.id === selectedId) ?? null;
  const h = history.current;

  function select(id: string | null, pushHistory = true) {
    setSelectedId(id);
    if (id && pushHistory && h.stack[h.i] !== id) {
      h.stack = [...h.stack.slice(0, h.i + 1), id];
      h.i = h.stack.length - 1;
      bump((n) => n + 1);
    }
  }

  function goBack() {
    if (h.i > 0) {
      h.i -= 1;
      setSelectedId(h.stack[h.i]);
      bump((n) => n + 1);
    }
  }

  function goForward() {
    if (h.i < h.stack.length - 1) {
      h.i += 1;
      setSelectedId(h.stack[h.i]);
      bump((n) => n + 1);
    }
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!visible.length) return;
    const idx = visible.findIndex((p) => p.id === selectedId);
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      select(visible[Math.min(idx + 1, visible.length - 1)]?.id ?? visible[0].id);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      select(visible[Math.max(idx - 1, 0)]?.id ?? visible[0].id);
    } else if (e.key === "Enter" && selected) {
      openProject(selected);
    }
  }

  const filterLabel = SIDEBAR_FILTERS.find((f) => f.id === filter)!.label;

  return (
    <div className="@container flex h-full text-[13px]" style={{ background: "var(--content-bg)" }}>
      {/* ── sidebar ── */}
      <div
        className="@max-2xl:hidden w-[186px] flex-none overflow-y-auto border-r px-2 py-2.5"
        style={{ background: "var(--sidebar-bg)", borderColor: "var(--divider)" }}
      >
        <div className="px-2 pb-1 text-[11px] font-semibold" style={{ color: "var(--text-tertiary)" }}>
          Favorites
        </div>
        {SIDEBAR_FILTERS.map((f) => (
          <button
            key={f.id}
            className="mb-px flex w-full items-center gap-2 rounded-[7px] px-2 py-[5px] text-left font-normal"
            style={{
              background: filter === f.id ? "rgba(120,120,128,0.18)" : "transparent",
              color: "var(--text-primary)",
            }}
            onClick={() => setFilter(f.id)}
          >
            <Sf d={PATHS[f.icon]} size={15} color="var(--accent)" />
            <span className="truncate">{f.label}</span>
          </button>
        ))}

        <div className="mt-4 px-2 pb-1 text-[11px] font-semibold" style={{ color: "var(--text-tertiary)" }}>
          Tags
        </div>
        {projects.map((p) => (
          <button
            key={p.id}
            className="mb-px flex w-full items-center gap-2 rounded-[7px] px-2 py-[5px] text-left"
            style={{
              background: selectedId === p.id ? "rgba(120,120,128,0.18)" : "transparent",
              color: "var(--text-primary)",
            }}
            onClick={() => {
              setFilter("all");
              setQuery("");
              select(p.id);
            }}
          >
            <span
              className="h-[11px] w-[11px] flex-none rounded-full"
              style={{ background: p.color, boxShadow: "inset 0 0 0 0.5px rgba(0,0,0,0.15)" }}
            />
            <span className="truncate">{p.name}</span>
          </button>
        ))}
      </div>

      {/* ── main column ── */}
      <div className="relative flex min-w-0 flex-1 flex-col">
        {/* toolbar */}
        <div
          className="flex h-[46px] flex-none items-center gap-1.5 border-b px-3"
          style={{ borderColor: "var(--divider)" }}
        >
          <button
            className="flex h-7 w-7 items-center justify-center rounded-md"
            style={{ color: h.i > 0 ? "var(--text-secondary)" : "var(--text-tertiary)" }}
            onClick={goBack}
            disabled={h.i === 0}
            aria-label="Back"
          >
            <Sf d={PATHS.chevronLeft} size={17} sw={2} />
          </button>
          <button
            className="flex h-7 w-7 items-center justify-center rounded-md"
            style={{ color: h.i < h.stack.length - 1 ? "var(--text-secondary)" : "var(--text-tertiary)" }}
            onClick={goForward}
            disabled={h.i >= h.stack.length - 1}
            aria-label="Forward"
          >
            <Sf d={PATHS.chevronRight} size={17} sw={2} />
          </button>
          <span className="ml-1 truncate text-[14px] font-semibold">{filterLabel}</span>

          <div className="flex-1" />

          {/* view switcher */}
          <div
            className="flex rounded-[7px] p-0.5"
            style={{ background: "rgba(120,120,128,0.14)" }}
          >
            {(
              [
                ["grid", <GridGlyph key="g" />],
                ["list", <ListGlyph key="l" />],
              ] as const
            ).map(([v, glyph]) => (
              <button
                key={v}
                className="flex h-6 w-8 items-center justify-center rounded-md"
                style={{
                  background: view === v ? "var(--content-bg)" : "transparent",
                  boxShadow: view === v ? "0 1px 3px rgba(0,0,0,0.16)" : "none",
                  color: view === v ? "var(--accent)" : "var(--text-secondary)",
                }}
                onClick={() => setView(v)}
                aria-label={`${v} view`}
              >
                {glyph}
              </button>
            ))}
          </div>

          {/* search */}
          <div
            className="@max-lg:hidden ml-1.5 flex h-7 w-[150px] items-center gap-1.5 rounded-[8px] px-2"
            style={{ background: "rgba(120,120,128,0.14)", color: "var(--text-tertiary)" }}
          >
            <Sf d={PATHS.search} size={12} sw={1.6} />
            <input
              className="w-full bg-transparent text-[12.5px] outline-none placeholder:text-[var(--text-tertiary)]"
              style={{ color: "var(--text-primary)" }}
              placeholder="Search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        {/* content + preview */}
        <div className="flex min-h-0 flex-1">
          {/* browser */}
          <div
            className="macos-scroll min-w-0 flex-1 overflow-y-auto outline-none"
            tabIndex={0}
            onKeyDown={onKeyDown}
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) select(null, false);
            }}
          >
            {view === "grid" ? (
              <div
                className="grid gap-x-2 gap-y-4 p-4"
                style={{ gridTemplateColumns: "repeat(auto-fill, minmax(104px, 1fr))" }}
                onMouseDown={(e) => {
                  if (e.target === e.currentTarget) select(null, false);
                }}
              >
                {visible.map((p) => {
                  const sel = p.id === selectedId;
                  return (
                    <button
                      key={p.id}
                      className="flex flex-col items-center gap-1.5"
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={() => select(p.id)}
                      onDoubleClick={() => openProject(p)}
                    >
                      <span
                        className="flex h-[76px] w-[76px] items-center justify-center rounded-[12px]"
                        style={{ background: sel ? "rgba(120,120,128,0.2)" : "transparent" }}
                      >
                        <ProjectGlyph project={p} size={62} />
                      </span>
                      <span
                        className="max-w-full truncate rounded-[5px] px-1.5 py-px text-[12.5px] leading-tight"
                        style={{
                          background: sel ? "var(--accent)" : "transparent",
                          color: sel ? "#fff" : "var(--text-primary)",
                        }}
                      >
                        {p.name}
                      </span>
                      <span className="text-[10.5px] leading-none" style={{ color: "var(--text-tertiary)" }}>
                        {p.year}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr
                    className="text-left text-[11px] font-medium"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    {["Name", "Kind", "Year", "Stack"].map((c, i) => (
                      <th
                        key={c}
                        className={`border-b px-3 py-1.5 font-medium ${i > 1 ? "@max-lg:hidden" : ""}`}
                        style={{ borderColor: "var(--divider)" }}
                      >
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visible.map((p, i) => {
                    const sel = p.id === selectedId;
                    return (
                      <tr
                        key={p.id}
                        className="cursor-default select-none"
                        style={{
                          background: sel
                            ? "var(--accent)"
                            : i % 2
                              ? "rgba(120,120,128,0.06)"
                              : "transparent",
                          color: sel ? "#fff" : "var(--text-primary)",
                        }}
                        onClick={() => select(p.id)}
                        onDoubleClick={() => openProject(p)}
                      >
                        <td className="px-3 py-[5px]">
                          <span className="flex items-center gap-2">
                            <ProjectGlyph project={p} size={20} />
                            <span className="truncate font-medium">{p.name}</span>
                          </span>
                        </td>
                        <td className="px-3 py-[5px] text-[12px]" style={{ color: sel ? "rgba(255,255,255,0.85)" : "var(--text-secondary)" }}>
                          {kindOf(p)}
                        </td>
                        <td className="@max-lg:hidden px-3 py-[5px] text-[12px]" style={{ color: sel ? "rgba(255,255,255,0.85)" : "var(--text-secondary)" }}>
                          {p.year}
                        </td>
                        <td className="@max-lg:hidden max-w-0 truncate px-3 py-[5px] text-[12px]" style={{ color: sel ? "rgba(255,255,255,0.85)" : "var(--text-secondary)" }}>
                          {p.stack.join(" · ")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* preview pane */}
          {selected && (
            <div
              className="macos-scroll @max-3xl:absolute @max-3xl:inset-0 @max-3xl:top-[46px] @max-3xl:w-auto @max-3xl:border-l-0 w-[264px] flex-none overflow-y-auto border-l"
              style={{ background: "var(--content-bg)", borderColor: "var(--divider)" }}
            >
              {/* narrow-window back row */}
              <button
                className="@3xl:hidden mt-2 ml-2 flex items-center gap-1 rounded-md px-2 py-1 text-[13px]"
                style={{ color: "var(--accent)" }}
                onClick={() => select(null, false)}
              >
                <Sf d={PATHS.chevronLeft} size={14} sw={2} /> Back
              </button>

              <div className="flex flex-col items-center px-5 pt-6 pb-3 text-center">
                <ProjectGlyph project={selected} size={92} />
                <div className="mt-3 text-[15px] font-semibold">{selected.name}</div>
                <div className="text-[12px]" style={{ color: "var(--text-tertiary)" }}>
                  {kindOf(selected)} · {selected.year}
                </div>
                <button
                  className="mt-3 rounded-[8px] px-4 py-[5px] text-[12.5px] font-semibold text-white active:opacity-80"
                  style={{ background: "var(--accent)" }}
                  onClick={() => openProject(selected)}
                >
                  Open
                </button>
              </div>

              <div className="mx-4 border-t pt-3" style={{ borderColor: "var(--divider)" }}>
                <p className="text-[12.5px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  {selected.summary}
                </p>
              </div>

              <div className="mx-4 mt-3 border-t pt-3" style={{ borderColor: "var(--divider)" }}>
                <div className="pb-1.5 text-[11px] font-semibold" style={{ color: "var(--text-tertiary)" }}>
                  Information
                </div>
                {(
                  [
                    ["Kind", kindOf(selected)],
                    ["Created", selected.year],
                    ["Where", selected.url ? selected.url.replace("https://", "") : "pranavOS"],
                  ] as const
                ).map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-3 py-[3px] text-[12px]">
                    <span style={{ color: "var(--text-tertiary)" }}>{k}</span>
                    <span className="truncate text-right" style={{ color: "var(--text-secondary)" }}>
                      {v}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between gap-3 py-[3px] text-[12px]">
                  <span style={{ color: "var(--text-tertiary)" }}>Stack</span>
                  <span className="text-right leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    {selected.stack.join(", ")}
                  </span>
                </div>
              </div>

              <div className="mx-4 mt-3 mb-4 border-t pt-3" style={{ borderColor: "var(--divider)" }}>
                <div className="pb-1.5 text-[11px] font-semibold" style={{ color: "var(--text-tertiary)" }}>
                  Highlights
                </div>
                <ul className="space-y-2.5 pb-1">
                  {selected.bullets.map((b, i) => (
                    <li key={i} className="flex gap-2 text-[12px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                      <span
                        className="mt-[6px] h-[5px] w-[5px] flex-none rounded-full"
                        style={{ background: selected.color }}
                      />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* path + status bar */}
        <div
          className="flex h-[25px] flex-none items-center gap-1 border-t px-3 text-[11px]"
          style={{ borderColor: "var(--divider)", color: "var(--text-tertiary)", background: "var(--sidebar-bg)" }}
        >
          <Sf d={PATHS.folder} size={12} sw={1.4} />
          <span>Projects</span>
          {selected && (
            <>
              <Sf d={PATHS.chevronRight} size={9} sw={2} />
              <ProjectGlyph project={selected} size={12} />
              <span style={{ color: "var(--text-secondary)" }}>{selected.name}</span>
            </>
          )}
          <div className="flex-1" />
          <span>
            {visible.length} item{visible.length === 1 ? "" : "s"}
            {query || filter !== "all" ? ` of ${projects.length}` : ""}
          </span>
        </div>
      </div>
    </div>
  );
}
