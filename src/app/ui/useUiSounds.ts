"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type SoundKey = "hover" | "click";

export type UiSoundOptions = {
  hoverSrc: string; // e.g. "/sfx/card-hover.wav"
  clickSrc: string; // e.g. "/sfx/card-click.wav"
  hoverVolume?: number; // 0..1
  clickVolume?: number; // 0..1
};

export function useUiSounds(opts: UiSoundOptions, enabled: boolean) {
  const hoverRef = useRef<HTMLAudioElement | null>(null);
  const clickRef = useRef<HTMLAudioElement | null>(null);

  const unlockedRef = useRef(false);
  const [unlocked, setUnlocked] = useState(false);

  // Create Audio elements once.
  useEffect(() => {
    const hover = new Audio(opts.hoverSrc);
    const click = new Audio(opts.clickSrc);

    hover.preload = "auto";
    click.preload = "auto";

    hover.volume = clamp01(opts.hoverVolume ?? 0.22);
    click.volume = clamp01(opts.clickVolume ?? 0.28);

    (hover as any).playsInline = true;
    (click as any).playsInline = true;

    hoverRef.current = hover;
    clickRef.current = click;

    return () => {
      hoverRef.current = null;
      clickRef.current = null;
      unlockedRef.current = false;
      setUnlocked(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Call this from a REAL user gesture (speaker click) to unlock audio.
  const unlock = useCallback(async () => {
    if (unlockedRef.current) return true;

    const a = clickRef.current;
    if (!a) return false;

    const prevMuted = a.muted;
    const prevVol = a.volume;

    try {
      a.muted = true;
      a.volume = 0;
      a.currentTime = 0;

      await a.play();

      // Success: we are unlocked for future plays.
      unlockedRef.current = true;
      setUnlocked(true);

      a.pause();
      a.currentTime = 0;
      a.muted = prevMuted;
      a.volume = prevVol;

      return true;
    } catch {
      // Still locked.
      try {
        a.pause();
        a.currentTime = 0;
        a.muted = prevMuted;
        a.volume = prevVol;
      } catch {
        // ignore
      }
      return false;
    }
  }, []);

  const play = useCallback(
    (key: SoundKey) => {
      // Important: do NOT even try if user has not enabled sound.
      if (!enabled) return;
      if (!unlockedRef.current) return;

      const el = key === "hover" ? hoverRef.current : clickRef.current;
      if (!el) return;

      try {
        el.currentTime = 0;
        const p = el.play();
        if (p && typeof (p as any).catch === "function") {
          (p as Promise<void>).catch(() => {
            // ignore to avoid console spam
          });
        }
      } catch {
        // ignore
      }
    },
    [enabled]
  );

  return { play, unlock, unlocked };
}

function clamp01(v: number) {
  if (v < 0) return 0;
  if (v > 1) return 1;
  return v;
}
