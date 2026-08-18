"use client";

import React, { useRef } from "react";

type Props = {
  onHoverSound: () => void;
  onClickSound: () => void;
  children: React.ReactNode;
};

export function Soundable({ onHoverSound, onClickSound, children }: Props) {
  const hoverArmedRef = useRef(true);

  return (
    <div
      onPointerEnter={() => {
        // Only fire once per hover-in to avoid machine-gun noise.
        if (!hoverArmedRef.current) return;
        hoverArmedRef.current = false;
        onHoverSound();
      }}
      onPointerLeave={() => {
        hoverArmedRef.current = true;
      }}
      onPointerDown={() => {
        // Click is always a real gesture. Great place for click sfx.
        onClickSound();
      }}
      onKeyDown={(e) => {
        // Keyboard click support (Enter/Space)
        if (e.key === "Enter" || e.key === " ") onClickSound();
      }}
    >
      {children}
    </div>
  );
}
