"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";

type Props = {
  soundEnabled?: boolean;
  onToggleSound?: () => void;
  showSoundHint?: boolean;
  dismissHint?: () => void;
};

function SpeakerIcon({ muted }: { muted: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
      <path
        d="M11 5L7.5 8H5a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h2.5L11 19V5z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {!muted ? (
        <>
          <path
            d="M15 9a4 4 0 0 1 0 6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M17 7a7 7 0 0 1 0 10"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </>
      ) : (
        <path
          d="M14.5 9.5l5 5m0-5l-5 5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

type HintPos = { top: number; left: number } | null;

export default function Navbar({
  soundEnabled = false,
  onToggleSound,
  showSoundHint = false,
  dismissHint,
}: Props) {
  const speakerBtnRef = useRef<HTMLButtonElement | null>(null);
  const [hintPos, setHintPos] = useState<HintPos>(null);

  // Compute hint position relative to the speaker button (client-only).
  const computeHintPos = () => {
    const el = speakerBtnRef.current;
    if (!el) return;

    const r = el.getBoundingClientRect();

    // Place the hint slightly below and to the left of the button,
    // so it feels like it points "at" the speaker.
    const top = Math.round(r.bottom + 10);
    const left = Math.round(r.left - 6);

    setHintPos({ top, left });
  };

  useEffect(() => {
    if (!showSoundHint) return;

    computeHintPos();

    // Keep it aligned on resize (and on font/layout changes).
    window.addEventListener("resize", computeHintPos);
    return () => window.removeEventListener("resize", computeHintPos);
  }, [showSoundHint]);

  // If the hint is enabled and the button ref appears after first render, recalc.
  useLayoutEffect(() => {
    if (!showSoundHint) return;
    computeHintPos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showSoundHint, speakerBtnRef.current]);

  return (
    <>
      {/* Overlay + hint (only when showSoundHint true) */}
      {showSoundHint ? (
        <div
          className="fixed inset-0 z-[90] bg-black/55 backdrop-blur-[1px]"
          onPointerDown={() => {
            if (dismissHint) dismissHint();
          }}
        >
          {/* Hint bubble positioned near the speaker button */}
          {hintPos ? (
            <div
              className="pointer-events-none fixed z-[91]"
              style={{ top: hintPos.top, left: hintPos.left }}
            >
              <div className="w-max rounded-xl border border-white/10 bg-zinc-950/85 px-4 py-3 text-sm text-zinc-200 shadow-lg">
                <div className="font-medium text-white">Better with sound</div>
                <div className="mt-1 text-zinc-400">
                  Click the speaker to enable.
                </div>
                <div className="mt-2 text-xs text-zinc-500">
                  Click anywhere else to stay muted.
                </div>
              </div>

              {/* little arrow pointing up-ish */}
              <div className="ml-6 h-0 w-0 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-zinc-950/85" />
            </div>
          ) : null}
        </div>
      ) : null}

      <nav className="flex h-16 items-center justify-between text-sm text-zinc-400">
        <div className="flex items-center gap-2">
          <span className="font-medium text-white">PM</span>

          <button
            ref={speakerBtnRef}
            type="button"
            aria-label={soundEnabled ? "Disable sound" : "Enable sound"}
            className="relative z-[100] grid h-7 w-7 place-items-center rounded-md border border-white/10 bg-white/5 text-zinc-200 hover:bg-white/10"
            onPointerDown={(e) => {
              // stop overlay click from dismissing when we click the speaker
              e.stopPropagation();
              if (onToggleSound) onToggleSound();
            }}
          >
            <SpeakerIcon muted={!soundEnabled} />
          </button>
        </div>

        <div className="flex gap-6">
          <a className="hover:text-white" href="#">
            About
          </a>
          <a className="hover:text-white" href="#">
            Contact
          </a>
        </div>
      </nav>
    </>
  );
}
