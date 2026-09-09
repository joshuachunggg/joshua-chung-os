"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useOS } from "@/system/store";

/**
 * Snake, faithful to Google's browser snake game:
 * checkerboard green board, blue snake with eyes, red apple,
 * smooth sub-cell movement, dark-green score header.
 */

type Cell = { x: number; y: number };
type Dir = { x: number; y: number };
type Phase = "idle" | "playing" | "paused" | "dying" | "over";
type SpeedId = "slow" | "normal" | "fast";
type SizeId = "small" | "normal" | "large";

const SPEEDS: Record<SpeedId, { label: string; ms: number }> = {
  slow: { label: "Slow", ms: 190 },
  normal: { label: "Normal", ms: 130 },
  fast: { label: "Fast", ms: 88 },
};

const SIZES: Record<SizeId, { label: string; cols: number; rows: number }> = {
  small: { label: "Small", cols: 12, rows: 10 },
  normal: { label: "Normal", cols: 17, rows: 15 },
  large: { label: "Large", cols: 24, rows: 18 },
};

const COLOR = {
  header: "#4a752c",
  frame: "#578a34",
  boardA: "#aad751",
  boardB: "#a2d149",
  snake: "#4674e9",
  snakeDark: "#3b63cd",
  apple: "#e7471d",
  appleShine: "#ff7f50",
};

const DIRS: Record<string, Dir> = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  KeyW: { x: 0, y: -1 },
  KeyS: { x: 0, y: 1 },
  KeyA: { x: -1, y: 0 },
  KeyD: { x: 1, y: 0 },
};

const DYING_MS = 800;
const BEST_KEY = "snake-best-score";
/**
 * How far into a cell (0..1) a direction press may still redirect the
 * in-flight turn. Early redirects shift the head tip sideways by at most
 * ~0.35·√2 cells, which hides inside the snake's stroke width; later
 * presses wait for the next cell boundary so motion never visibly snaps.
 */
const TURN_GRACE = 0.35;

/** ease-out with a slight overshoot, for pop-in animations */
function easeOutBack(x: number): number {
  const c = 1.70158;
  const y = x - 1;
  return 1 + (c + 1) * y * y * y + c * y * y;
}

/* ---------- tiny synth so the game has sounds without audio assets ---------- */

let audioCtx: AudioContext | null = null;

function tone(freq: number, dur: number, type: OscillatorType, vol: number, delay = 0, glide = 0) {
  if (!useOS.getState().soundEnabled) return;
  try {
    audioCtx ??= new AudioContext();
    if (audioCtx.state === "suspended") void audioCtx.resume();
    const t0 = audioCtx.currentTime + delay;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (glide) osc.frequency.exponentialRampToValueAtTime(glide, t0 + dur);
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  } catch {
    /* no audio available */
  }
}

const sfx = {
  eat: () => {
    tone(520, 0.09, "sine", 0.16);
    tone(780, 0.12, "sine", 0.14, 0.05);
  },
  die: () => {
    tone(300, 0.5, "sawtooth", 0.1, 0, 70);
    tone(200, 0.55, "square", 0.05, 0.05, 55);
  },
  click: () => tone(660, 0.06, "sine", 0.1),
  turn: () => tone(340, 0.03, "sine", 0.04),
};

/* --------------------------------- game --------------------------------- */

export function SnakeApp() {
  const mobile = useOS((s) => s.mobile);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const arenaRef = useRef<HTMLDivElement>(null);

  const [phase, setPhase] = useState<Phase>("idle");
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [speedId, setSpeedId] = useState<SpeedId>("normal");
  const [sizeId, setSizeId] = useState<SizeId>("normal");
  const [board, setBoard] = useState({ w: 0, h: 0 });

  // Mutable game state lives in refs: the rAF loop reads these every frame.
  const g = useRef({
    phase: "idle" as Phase,
    snake: [] as Cell[],
    /** direction of the last committed step */
    dir: { x: 1, y: 0 } as Dir,
    /** direction locked for the next step: the head visibly moves toward it */
    nextDir: { x: 1, y: 0 } as Dir,
    /** one buffered turn beyond nextDir (quick double-taps) */
    pendingDir: null as Dir | null,
    food: { x: 0, y: 0 } as Cell,
    /** when the current apple appeared, for its pop-in animation */
    foodSpawnAt: 0,
    /** swallowed apples gliding down the body; d = arc-length (in cells) behind the head */
    swallows: [] as { d: number; at: number }[],
    /** previous rAF timestamp, for per-frame swallow advancement */
    lastFrameAt: 0,
    lastTick: 0,
    /** tick progress frozen while paused, so resume doesn't rewind */
    frozenT: 0,
    tickMs: SPEEDS.normal.ms,
    cols: SIZES.normal.cols,
    rows: SIZES.normal.rows,
    diedAt: 0,
    score: 0,
  });

  const setPhaseBoth = useCallback((p: Phase) => {
    g.current.phase = p;
    setPhase(p);
  }, []);

  /* ------------------------------ lifecycle ------------------------------ */

  useEffect(() => {
    setBest(Number(localStorage.getItem(BEST_KEY)) || 0);
  }, []);

  const spawnFood = useCallback(() => {
    const s = g.current;
    const free: Cell[] = [];
    for (let y = 0; y < s.rows; y++)
      for (let x = 0; x < s.cols; x++)
        if (!s.snake.some((c) => c.x === x && c.y === y)) free.push({ x, y });
    s.food = free[Math.floor(Math.random() * free.length)] ?? { x: 0, y: 0 };
    s.foodSpawnAt = performance.now();
  }, []);

  const start = useCallback(() => {
    const s = g.current;
    s.cols = SIZES[sizeId].cols;
    s.rows = SIZES[sizeId].rows;
    s.tickMs = SPEEDS[speedId].ms;
    const y = Math.floor(s.rows / 2);
    const x = Math.floor(s.cols / 4);
    s.snake = [{ x, y }, { x: x - 1, y }, { x: x - 2, y }, { x: x - 3, y }];
    s.dir = { x: 1, y: 0 };
    s.nextDir = { x: 1, y: 0 };
    s.pendingDir = null;
    s.score = 0;
    s.lastTick = performance.now();
    s.frozenT = 0;
    s.swallows = [];
    setScore(0);
    // Google places the first apple straight ahead of the snake
    s.food = { x: Math.min(s.cols - 2, x + Math.floor(s.cols / 2)), y };
    s.foodSpawnAt = performance.now();
    sfx.click();
    setPhaseBoth("playing");
  }, [sizeId, speedId, spawnFood, setPhaseBoth]);

  const die = useCallback(() => {
    const s = g.current;
    s.diedAt = performance.now();
    sfx.die();
    setPhaseBoth("dying");
    setBest((b) => {
      const nb = Math.max(b, s.score);
      localStorage.setItem(BEST_KEY, String(nb));
      return nb;
    });
    window.setTimeout(() => {
      if (g.current.phase === "dying") setPhaseBoth("over");
    }, DYING_MS);
  }, [setPhaseBoth]);

  const step = useCallback(() => {
    const s = g.current;
    s.dir = s.nextDir;
    const head = { x: s.snake[0].x + s.dir.x, y: s.snake[0].y + s.dir.y };

    const hitWall = head.x < 0 || head.y < 0 || head.x >= s.cols || head.y >= s.rows;
    const hitSelf = s.snake.some(
      // tail cell is vacated this tick, so it doesn't count
      (c, i) => i < s.snake.length - 1 && c.x === head.x && c.y === head.y,
    );
    if (hitWall || hitSelf) {
      die();
      return;
    }

    // lock the turn for the tick that just began
    s.nextDir = s.pendingDir ?? s.dir;
    s.pendingDir = null;

    const ate = head.x === s.food.x && head.y === s.food.y;
    s.snake = ate ? [head, ...s.snake] : [head, ...s.snake.slice(0, -1)];
    if (ate) {
      s.score += 1;
      s.swallows.push({ d: 0, at: performance.now() });
      setScore(s.score);
      sfx.eat();
      spawnFood();
    }
  }, [die, spawnFood]);

  const pushDir = useCallback((d: Dir) => {
    const s = g.current;
    if (s.phase !== "playing") return;
    const same = (a: Dir, b: Dir) => a.x === b.x && a.y === b.y;
    const reverse = (a: Dir, b: Dir) => a.x === -b.x && a.y === -b.y;

    // Early in the cell the in-flight turn can still be redirected without a
    // visible snap; after that the press waits for the next cell boundary.
    const t = Math.min(1, (performance.now() - s.lastTick) / s.tickMs);
    if (s.pendingDir === null && t < TURN_GRACE && !same(d, s.nextDir) && !reverse(d, s.dir)) {
      s.nextDir = d;
      sfx.turn();
      return;
    }
    const base = s.pendingDir ?? s.nextDir;
    if (same(d, base) || reverse(d, base)) return;
    s.pendingDir = d;
    sfx.turn();
  }, []);

  const togglePause = useCallback(() => {
    const s = g.current;
    if (s.phase === "playing") {
      sfx.click();
      // freeze mid-cell progress so resuming doesn't rewind the snake
      s.frozenT = Math.min(1, (performance.now() - s.lastTick) / s.tickMs);
      setPhaseBoth("paused");
    } else if (s.phase === "paused") {
      sfx.click();
      s.lastTick = performance.now() - s.frozenT * s.tickMs;
      setPhaseBoth("playing");
    }
  }, [setPhaseBoth]);

  /* ------------------------------- keyboard ------------------------------ */

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const os = useOS.getState();
      if (os.activeApp !== "snake" || os.spotlightOpen || e.metaKey || e.ctrlKey) return;
      const s = g.current;
      const dir = DIRS[e.code];
      if (dir) {
        e.preventDefault();
        if (s.phase === "idle" || s.phase === "over") start();
        else if (s.phase === "paused") togglePause();
        pushDir(dir);
        return;
      }
      if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
        if (s.phase === "idle" || s.phase === "over") start();
        else togglePause();
      } else if (e.code === "Escape" || e.code === "KeyP") {
        if (s.phase === "playing" || s.phase === "paused") {
          e.preventDefault();
          togglePause();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [start, pushDir, togglePause]);

  // auto-pause when the window loses focus or the tab is hidden
  useEffect(() => {
    const pauseIfBg = () => {
      const s = g.current;
      if (s.phase === "playing" && (document.hidden || useOS.getState().activeApp !== "snake")) {
        s.frozenT = Math.min(1, (performance.now() - s.lastTick) / s.tickMs);
        setPhaseBoth("paused");
      }
    };
    document.addEventListener("visibilitychange", pauseIfBg);
    const unsub = useOS.subscribe(pauseIfBg);
    return () => {
      document.removeEventListener("visibilitychange", pauseIfBg);
      unsub();
    };
  }, [setPhaseBoth]);

  /* -------------------------------- swipe -------------------------------- */

  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const onPointerDown = (e: React.PointerEvent) => {
    touchStart.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const t = touchStart.current;
    touchStart.current = null;
    if (!t) return;
    const dx = e.clientX - t.x;
    const dy = e.clientY - t.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
    pushDir(Math.abs(dx) > Math.abs(dy) ? { x: Math.sign(dx), y: 0 } : { x: 0, y: Math.sign(dy) });
  };

  /* ------------------------------- sizing -------------------------------- */

  useEffect(() => {
    const arena = arenaRef.current;
    if (!arena) return;
    const ro = new ResizeObserver(() => {
      const s = g.current;
      const pad = 16;
      const availW = arena.clientWidth - pad;
      const availH = arena.clientHeight - pad;
      const cell = Math.max(8, Math.min(availW / s.cols, availH / s.rows));
      setBoard({ w: Math.floor(cell * s.cols), h: Math.floor(cell * s.rows) });
    });
    ro.observe(arena);
    return () => ro.disconnect();
  }, [sizeId, phase]);

  /* ------------------------------ render loop ---------------------------- */

  useEffect(() => {
    let raf = 0;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const s = g.current;
      const canvas = canvasRef.current;
      if (!canvas || !board.w) return;

      const dpr = window.devicePixelRatio || 1;
      const pw = Math.round(board.w * dpr);
      const ph = Math.round(board.h * dpr);
      if (canvas.width !== pw || canvas.height !== ph) {
        canvas.width = pw;
        canvas.height = ph;
      }
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (s.phase === "playing") {
        // after a stalled frame (tab hidden, window drag) run one step, not a burst
        if (now - s.lastTick > s.tickMs * 4) s.lastTick = now - s.tickMs;
        while (now - s.lastTick >= s.tickMs) {
          s.lastTick += s.tickMs;
          step();
          if (g.current.phase !== "playing") break;
        }
      }

      // swallowed lumps glide down the body a little every frame — the head
      // outruns them (1 cell/tick vs 0.6), so they recede smoothly toward the tail
      const frameDt = Math.min(100, now - (s.lastFrameAt || now));
      s.lastFrameAt = now;
      if (s.phase === "playing") {
        for (const sw of s.swallows) sw.d += (frameDt / s.tickMs) * 0.6;
      }

      const cell = board.w / s.cols;
      drawBoard(ctx, s.cols, s.rows, cell);
      if (s.phase !== "idle") {
        const t =
          s.phase === "playing"
            ? Math.min(1, (now - s.lastTick) / s.tickMs)
            : s.phase === "paused"
              ? s.frozenT
              : 0;
        // apple pops in when spawned, and shrinks into the mouth while the
        // head is closing in on it (so eating reads as one continuous motion)
        const nextHead = { x: s.snake[0]?.x + s.nextDir.x, y: s.snake[0]?.y + s.nextDir.y };
        const approaching =
          (s.phase === "playing" || s.phase === "paused") &&
          nextHead.x === s.food.x &&
          nextHead.y === s.food.y;
        const spawnPop = easeOutBack(Math.min(1, (now - s.foodSpawnAt) / 240));
        const appleScale = spawnPop * (approaching ? 1 - t * 0.75 : 1);
        drawApple(ctx, s.food, cell, now, appleScale);
        const blink = s.phase === "dying" || s.phase === "over" ? Math.floor((now - s.diedAt) / 130) % 2 === 0 : true;
        if (blink && !(s.phase === "over" && now - s.diedAt > DYING_MS + 400)) {
          drawSnake(ctx, s, cell, t, s.phase === "playing" || s.phase === "paused", now);
        }
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [board, step]);

  /* --------------------------------- ui ---------------------------------- */

  const showMenu = phase === "idle" || phase === "over";

  return (
    <div className="flex h-full flex-col select-none" style={{ background: COLOR.frame }}>
      {/* score header */}
      <div
        className="flex flex-none items-center justify-between px-4 py-2"
        style={{ background: COLOR.header }}
      >
        <style>{`@keyframes snake-score-pop { from { transform: scale(1.55); } to { transform: scale(1); } }`}</style>
        <div className="flex items-center gap-4 text-[15px] font-bold text-white">
          <span className="flex items-center gap-1.5">
            <AppleGlyph size={18} />
            <span
              key={score}
              className="inline-block"
              style={score > 0 ? { animation: "snake-score-pop 220ms cubic-bezier(0.34,1.56,0.64,1)" } : undefined}
            >
              {score}
            </span>
          </span>
          <span className="flex items-center gap-1.5 opacity-90">
            <TrophyGlyph size={18} />
            {best}
          </span>
        </div>
        {(phase === "playing" || phase === "paused") && (
          <button
            onClick={togglePause}
            className="rounded-full px-3 py-1 text-[13px] font-semibold text-white transition hover:bg-white/15 active:scale-95"
            style={{ background: "rgba(255,255,255,0.08)" }}
          >
            {phase === "paused" ? "▶ Resume" : "❙❙ Pause"}
          </button>
        )}
      </div>

      {/* board */}
      <div ref={arenaRef} className="relative min-h-0 flex-1">
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{ width: board.w, height: board.h }}
        >
          <canvas
            ref={canvasRef}
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            className="h-full w-full rounded-[4px]"
            style={{ touchAction: "none" }}
          />

          {/* start / game-over card */}
          {showMenu && (
            <div className="absolute inset-0 flex items-center justify-center rounded-[4px] bg-black/25 p-3 backdrop-blur-[2px]">
              <div className="flex w-[min(320px,92%)] flex-col items-center gap-3 rounded-2xl bg-white p-5 shadow-2xl">
                {phase === "over" ? (
                  <>
                    <div className="text-[22px] font-extrabold" style={{ color: COLOR.header }}>
                      Game over
                    </div>
                    <div className="flex items-center gap-4 text-[16px] font-bold text-neutral-700">
                      <span className="flex items-center gap-1.5">
                        <AppleGlyph size={20} /> {score}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <TrophyGlyph size={20} /> {best}
                      </span>
                    </div>
                    {score > 0 && score >= best && (
                      <div className="text-[13px] font-semibold" style={{ color: COLOR.apple }}>
                        New high score! 🎉
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <SnakeLogo />
                    <div className="text-[22px] font-extrabold tracking-tight" style={{ color: COLOR.header }}>
                      Snake
                    </div>
                  </>
                )}

                <OptionRow
                  label="Speed"
                  options={Object.entries(SPEEDS).map(([id, v]) => [id, v.label] as const)}
                  value={speedId}
                  onChange={(v) => {
                    sfx.click();
                    setSpeedId(v as SpeedId);
                  }}
                />
                <OptionRow
                  label="Board"
                  options={Object.entries(SIZES).map(([id, v]) => [id, v.label] as const)}
                  value={sizeId}
                  onChange={(v) => {
                    sfx.click();
                    setSizeId(v as SizeId);
                  }}
                />

                <button
                  onClick={start}
                  className="mt-1 w-full rounded-full py-2.5 text-[16px] font-bold text-white transition hover:brightness-110 active:scale-[0.98]"
                  style={{ background: COLOR.snake }}
                >
                  {phase === "over" ? "Play again" : "Play"}
                </button>
                <div className="text-center text-[11px] leading-relaxed text-neutral-400">
                  {mobile ? "Swipe or use the arrows to steer" : "Arrow keys / WASD to steer · Space to pause"}
                </div>
              </div>
            </div>
          )}

          {/* paused veil */}
          {phase === "paused" && (
            <button
              onClick={togglePause}
              className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-[4px] bg-black/35 backdrop-blur-[2px]"
            >
              <div className="text-[26px] font-extrabold text-white drop-shadow">Paused</div>
              <div className="text-[13px] font-medium text-white/85">
                {mobile ? "Tap to resume" : "Press space to resume"}
              </div>
            </button>
          )}
        </div>

        {/* mobile d-pad */}
        {mobile && (phase === "playing" || phase === "paused") && (
          <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
            <div className="pointer-events-auto grid grid-cols-3 gap-1.5">
              <span />
              <DPadButton label="▲" onPress={() => pushDir({ x: 0, y: -1 })} />
              <span />
              <DPadButton label="◀" onPress={() => pushDir({ x: -1, y: 0 })} />
              <DPadButton label="▼" onPress={() => pushDir({ x: 0, y: 1 })} />
              <DPadButton label="▶" onPress={() => pushDir({ x: 1, y: 0 })} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------ ui helpers ------------------------------ */

function OptionRow({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: ReadonlyArray<readonly [string, string]>;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex w-full items-center justify-between gap-2">
      <span className="text-[12px] font-semibold uppercase tracking-wide text-neutral-400">{label}</span>
      <div className="flex rounded-full bg-neutral-100 p-0.5">
        {options.map(([id, name]) => (
          <button
            key={id}
            onClick={() => onChange(id)}
            className="rounded-full px-3 py-1 text-[12px] font-semibold transition"
            style={
              value === id
                ? { background: COLOR.header, color: "#fff" }
                : { color: "#6b7280" }
            }
          >
            {name}
          </button>
        ))}
      </div>
    </div>
  );
}

function DPadButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <button
      className="flex h-12 w-12 items-center justify-center rounded-2xl text-[18px] text-white active:scale-90"
      style={{ background: "rgba(0,0,0,0.28)", backdropFilter: "blur(6px)" }}
      onPointerDown={(e) => {
        e.preventDefault();
        onPress();
      }}
    >
      {label}
    </button>
  );
}

function AppleGlyph({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path
        d="M12 7.5 C 7.5 4.5 3 7.5 3 12.5 C 3 18 8 21.5 12 21.5 C 16 21.5 21 18 21 12.5 C 21 7.5 16.5 4.5 12 7.5 Z"
        fill={COLOR.apple}
      />
      <rect x="11.1" y="3.4" width="1.8" height="4.4" rx="0.9" fill="#7a4a21" />
      <path d="M12.6 4.6 C 14 2.4 16.6 2.2 18 3.4 C 17 5.4 14.2 5.8 12.6 4.6 Z" fill="#4caf50" />
    </svg>
  );
}

function TrophyGlyph({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#ffd94d">
      <path d="M6 3 h12 v2 h3 v3 c0 2.8-2 5-4.6 5.4 A6 6 0 0 1 13 16.7 V19 h3 v2 H8 v-2 h3 v-2.3 a6 6 0 0 1 -3.4-3.3 C5 13 3 10.8 3 8 V5 h3 Z M6 7 H5 v1 c0 1.4 .8 2.6 2 3.2 A9 9 0 0 1 6 7 Z M19 7 h-1 a9 9 0 0 1 -1 4.2 c1.2-.6 2-1.8 2-3.2 Z" />
    </svg>
  );
}

function SnakeLogo() {
  return (
    <svg width="72" height="44" viewBox="0 0 72 44">
      <path
        d="M8 34 C 8 22 22 22 32 26 C 44 31 54 30 56 20 C 57.5 13 52 8 44 10"
        fill="none"
        stroke={COLOR.snake}
        strokeWidth="11"
        strokeLinecap="round"
      />
      <circle cx="45" cy="7" r="2.2" fill="#fff" />
      <circle cx="45.6" cy="6.6" r="1.1" fill="#111" />
      <circle cx="64" cy="34" r="6" fill={COLOR.apple} />
      <rect x="63.2" y="25.5" width="1.6" height="4" rx="0.8" fill="#7a4a21" />
    </svg>
  );
}

/* ------------------------------- drawing -------------------------------- */

function drawBoard(ctx: CanvasRenderingContext2D, cols: number, rows: number, cell: number) {
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      ctx.fillStyle = (x + y) % 2 === 0 ? COLOR.boardA : COLOR.boardB;
      ctx.fillRect(x * cell, y * cell, cell + 1, cell + 1);
    }
  }
}

function drawApple(
  ctx: CanvasRenderingContext2D,
  food: Cell,
  cell: number,
  now: number,
  scale = 1,
) {
  if (scale <= 0.02) return;
  const cx = (food.x + 0.5) * cell;
  const cy = (food.y + 0.5) * cell;
  const pulse = 1 + 0.06 * Math.sin(now / 220);
  const r = cell * 0.34 * pulse * scale;

  // shadow
  ctx.fillStyle = "rgba(0,0,0,0.12)";
  ctx.beginPath();
  ctx.ellipse(cx, cy + r * 0.95, r * 0.8, r * 0.28, 0, 0, Math.PI * 2);
  ctx.fill();
  // body
  ctx.fillStyle = COLOR.apple;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  // shine
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.beginPath();
  ctx.arc(cx - r * 0.35, cy - r * 0.38, r * 0.22, 0, Math.PI * 2);
  ctx.fill();
  // stem + leaf
  ctx.strokeStyle = "#7a4a21";
  ctx.lineWidth = Math.max(1.5, cell * 0.06);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(cx, cy - r * 0.9);
  ctx.quadraticCurveTo(cx + r * 0.15, cy - r * 1.3, cx + r * 0.05, cy - r * 1.5);
  ctx.stroke();
  ctx.fillStyle = "#4caf50";
  ctx.beginPath();
  ctx.ellipse(cx + r * 0.45, cy - r * 1.35, r * 0.42, r * 0.2, -0.5, 0, Math.PI * 2);
  ctx.fill();
}

interface SnakeState {
  snake: Cell[];
  dir: Dir;
  nextDir: Dir;
  pendingDir: Dir | null;
  food: Cell;
  swallows: { d: number; at: number }[];
}

/**
 * Renders the snake mid-tick by interpolating each segment *toward* where the
 * next step will put it (head → next cell, body → segment ahead). `nextDir` is
 * locked per tick, so the head's path is continuous: turns happen at cell
 * boundaries, never as mid-cell snaps.
 */
function drawSnake(
  ctx: CanvasRenderingContext2D,
  s: SnakeState,
  cell: number,
  t: number,
  extrapolate: boolean,
  now: number,
) {
  if (!s.snake.length) return;

  const nextDir = s.nextDir;
  const nextHead = { x: s.snake[0].x + nextDir.x, y: s.snake[0].y + nextDir.y };
  const willGrow = nextHead.x === s.food.x && nextHead.y === s.food.y;
  const last = s.snake.length - 1;

  const pts = s.snake.map((c, i) => {
    let target = c;
    if (extrapolate) {
      if (i === 0) target = nextHead;
      else if (i < last || !willGrow) target = s.snake[i - 1];
      // tail stays put on a growing tick
    }
    return {
      x: (c.x + (target.x - c.x) * t + 0.5) * cell,
      y: (c.y + (target.y - c.y) * t + 0.5) * cell,
    };
  });

  const width = cell * 0.82;

  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.strokeStyle = COLOR.snake;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  if (pts.length === 1) ctx.lineTo(pts[0].x + 0.01, pts[0].y);
  ctx.stroke();

  // Swallow bulges. Each lump lives at an arc-length `d` behind the head and
  // glides along the body polyline a few pixels every frame — through corners,
  // with no cell snapping — popping in at the head and melting away at the tail.
  if (s.swallows.length && pts.length > 1) {
    // cumulative arc length from the head along the drawn body
    const cum = [0];
    for (let i = 1; i < pts.length; i++) {
      cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
    }
    const total = cum[cum.length - 1];
    ctx.fillStyle = COLOR.snake;
    for (let k = s.swallows.length - 1; k >= 0; k--) {
      const sw = s.swallows[k];
      const dPx = sw.d * cell;
      if (dPx >= total) {
        s.swallows.splice(k, 1);
        continue;
      }
      // locate the polyline point at distance dPx from the head
      let i = 1;
      while (i < cum.length - 1 && cum[i] < dPx) i++;
      const segLen = cum[i] - cum[i - 1];
      const u = segLen > 0 ? (dPx - cum[i - 1]) / segLen : 0;
      const x = pts[i - 1].x + (pts[i].x - pts[i - 1].x) * u;
      const y = pts[i - 1].y + (pts[i].y - pts[i - 1].y) * u;

      const popIn = easeOutBack(Math.min(1, (now - sw.at) / 180));
      // melt away over the last ~0.7 cells before the tail
      const fadeZone = cell * 0.7;
      const absorb = Math.min(1, (total - dPx) / fadeZone);
      const scale = popIn * absorb * absorb * (3 - 2 * absorb); // smoothstep out
      if (scale <= 0.02) continue;
      ctx.beginPath();
      ctx.arc(x, y, width * 0.6 * scale, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // head + eyes: eyes dart toward the buffered turn immediately, which reads
  // as instant response even while the body waits for the cell boundary
  const head = pts[0];
  const d = extrapolate ? s.pendingDir ?? nextDir : s.dir;
  ctx.fillStyle = COLOR.snake;
  ctx.beginPath();
  ctx.arc(head.x, head.y, width * 0.56, 0, Math.PI * 2);
  ctx.fill();

  const px = -d.y; // perpendicular
  const py = d.x;
  const eyeOff = cell * 0.19;
  const fwd = cell * 0.1;
  const eyeR = Math.max(2, cell * 0.13);
  const pupilR = Math.max(1, cell * 0.065);
  for (const side of [-1, 1]) {
    const ex = head.x + d.x * fwd + px * eyeOff * side;
    const ey = head.y + d.y * fwd + py * eyeOff * side;
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(ex, ey, eyeR, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#111";
    ctx.beginPath();
    ctx.arc(ex + d.x * eyeR * 0.35, ey + d.y * eyeR * 0.35, pupilR, 0, Math.PI * 2);
    ctx.fill();
  }
}
