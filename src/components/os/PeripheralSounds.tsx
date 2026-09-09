"use client";

import { useEffect, useRef } from "react";
import { useOS } from "@/system/store";

/**
 * Mechanical mouse + keyboard sounds on every click and keypress,
 * adapted from Joey de Ruiter's Portfolio-next PeripheralSounds.
 * Sound assets © their original recording; credit: github.com/0xJ0EY/Portfolio-next
 */

type AudioFragment = { onDown?: string; onUp?: string };

const SPACE: AudioFragment[] = [1, 2, 3].map((i) => ({
  onDown: `/sounds/space_down_${i}.mp3`,
  onUp: `/sounds/space_up_${i}.mp3`,
}));
const SHIFT: AudioFragment[] = [{ onDown: "/sounds/shift_down.mp3", onUp: "/sounds/shift_up.mp3" }];
const KEYS: AudioFragment[] = [1, 2].map((i) => ({ onDown: `/sounds/key_down_${i}.mp3` }));
const LEFT_MOUSE: AudioFragment[] = [1, 2, 3].map((i) => ({
  onDown: `/sounds/left_mouse_down_${i}.mp3`,
  onUp: `/sounds/left_mouse_up_${i}.mp3`,
}));
const RIGHT_MOUSE: AudioFragment[] = [1, 2, 3].map((i) => ({
  onDown: `/sounds/right_mouse_down_${i}.mp3`,
  onUp: `/sounds/right_mouse_up_${i}.mp3`,
}));

const pick = (f: AudioFragment[]) => f[Math.floor(Math.random() * f.length)];

function keyFragment(code: string): AudioFragment {
  switch (code) {
    case "Space":
      return pick(SPACE);
    case "ShiftLeft":
    case "ShiftRight":
      return pick(SHIFT);
    default:
      return pick(KEYS);
  }
}

function isSafari(): boolean {
  const ua = navigator.userAgent;
  return ua.includes("Safari") && !ua.includes("Chrome") && !ua.includes("Chromium");
}

export function PeripheralSounds() {
  const cache = useRef<Record<string, HTMLAudioElement>>({});
  const active = useRef<Record<string, AudioFragment>>({});

  useEffect(() => {
    // Safari's audio playback lags far behind the input event (same issue the
    // reference implementation hit), so peripheral sounds stay off there.
    if (isSafari()) return;

    const audioFor = (src: string) => {
      if (!cache.current[src]) cache.current[src] = new Audio(src);
      return cache.current[src];
    };

    const play = (src: string | undefined, volume: number) => {
      if (!src || !useOS.getState().soundEnabled) return;
      const audio = audioFor(src);
      audio.volume = volume;
      audio.currentTime = 0;
      audio.play().catch(() => {});
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      active.current[e.code] = keyFragment(e.code);
      play(active.current[e.code].onDown, 0.6);
    };
    const onKeyUp = (e: KeyboardEvent) => {
      const frag = active.current[e.code];
      if (frag) play(frag.onUp, 0.6);
    };
    const onPointerDown = (e: PointerEvent) => {
      const key = e.button === 0 ? "mouse-l" : "mouse-r";
      active.current[key] = pick(e.button === 0 ? LEFT_MOUSE : RIGHT_MOUSE);
      play(active.current[key].onDown, 1.0);
    };
    const onPointerUp = (e: PointerEvent) => {
      const frag = active.current[e.button === 0 ? "mouse-l" : "mouse-r"];
      if (frag) play(frag.onUp, 1.0);
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, []);

  return null;
}
