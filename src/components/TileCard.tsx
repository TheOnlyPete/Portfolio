"use client";

import React, { useMemo, useRef, useState } from "react";
import Image from "next/image";

type TileCardProps = {
  title: string;
  description: string;
  iconSrc?: string;
  iconAlt?: string;
  href?: string;
  onClick?: () => void;
  className?: string;
};

export default function TileCard({
  title,
  description,
  iconSrc,
  iconAlt = "",
  href = "#",
  onClick,
  className,
}: TileCardProps) {
  const ref = useRef<HTMLAnchorElement | null>(null);

  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const [pressed, setPressed] = useState(false);

  const maxTilt = 6;
  const pressTilt = 10;

  const hasIcon = typeof iconSrc === "string" && iconSrc.length > 0;

  const hoverLightSize = 320;

  const hoverLightStyle = useMemo(
    () => ({
      background: `radial-gradient(${hoverLightSize}px circle at var(--mx, 50%) var(--my, 50%),
        rgba(255, 235, 200, 0.14),
        rgba(180, 220, 255, 0.06) 32%,
        transparent 68%)`,
      mixBlendMode: "screen" as const,
      WebkitMaskImage:
        "radial-gradient(130% 115% at 50% 50%, rgba(0,0,0,1) 52%, rgba(0,0,0,0) 86%)",
      maskImage:
        "radial-gradient(130% 115% at 50% 50%, rgba(0,0,0,1) 52%, rgba(0,0,0,0) 86%)",
    }),
    []
  );

  function setVarsFromEvent(e: React.PointerEvent<HTMLAnchorElement>) {
    const el = ref.current;
    if (!el) return;

    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;

    el.style.setProperty("--mx", `${Math.round(px * 100)}%`);
    el.style.setProperty("--my", `${Math.round(py * 100)}%`);

    setTilt({ rx: -(py - 0.5) * maxTilt, ry: (px - 0.5) * maxTilt });
  }

  function resetVars() {
    const el = ref.current;
    if (!el) return;

    el.style.setProperty("--mx", "50%");
    el.style.setProperty("--my", "50%");
    setTilt({ rx: 0, ry: 0 });
    setPressed(false);
  }

  function onPointerDown(e: React.PointerEvent<HTMLAnchorElement>) {
    const el = ref.current;
    if (!el) return;

    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;

    setPressed(true);
    setTilt({ rx: -(py - 0.5) * pressTilt, ry: (px - 0.5) * pressTilt });
  }

  return (
    <a
      ref={ref}
      href={href}
      onClick={(e) => {
        if (onClick) {
          e.preventDefault();
          onClick();
        }
      }}
      onPointerMove={setVarsFromEvent}
      onPointerLeave={resetVars}
      onPointerDown={onPointerDown}
      onPointerUp={() => setPressed(false)}
      onPointerCancel={resetVars}
      className={[
        "tile-slab-reset group relative block w-full cursor-pointer select-none bg-transparent",
        className ?? "",
      ].join(" ")}
      style={{
        isolation: "isolate",
        transform: `perspective(900px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) scale(${
          pressed ? 0.985 : 1
        })`,
        transitionProperty: "transform",
        transitionDuration: pressed ? "60ms" : "220ms",
        transitionTimingFunction: pressed ? "linear" : "cubic-bezier(0.2, 0.8, 0.2, 1)",
        willChange: "transform",
      }}
    >
      <div className="relative">
        {/* Ground shadow (soft contact) */}
        <div
          className="pointer-events-none absolute left-1/2 top-[66%] -z-10"
          style={{
            width: "90%",
            height: "36%",
            transform: "translateX(-50%)",
            background:
              "radial-gradient(closest-side, rgba(0,0,0,0.38), rgba(0,0,0,0.0) 72%)",
            filter: "blur(14px)",
            opacity: 0.42,
          }}
        />

        {/* Silhouette shadow (masked) */}
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            transform: "translateY(6px) scale(1.02)",
            filter: "blur(14px)",
            opacity: 0.30,
            background: "rgba(0,0,0,1)",
            WebkitMaskImage: 'url("/Backgrounds/TileCards/stone-face.png")',
            maskImage: 'url("/Backgrounds/TileCards/stone-face.png")',
            WebkitMaskRepeat: "no-repeat",
            maskRepeat: "no-repeat",
            WebkitMaskPosition: "center",
            maskPosition: "center",
            WebkitMaskSize: "100% 100%",
            maskSize: "100% 100%",
          }}
        />

        {/* Tight contact AO (masked) */}
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            transform: "translateY(2px) scale(1.008)",
            filter: "blur(6px)",
            opacity: 0.22,
            background: "rgba(0,0,0,1)",
            WebkitMaskImage: 'url("/Backgrounds/TileCards/stone-face.png")',
            maskImage: 'url("/Backgrounds/TileCards/stone-face.png")',
            WebkitMaskRepeat: "no-repeat",
            maskRepeat: "no-repeat",
            WebkitMaskPosition: "center",
            maskPosition: "center",
            WebkitMaskSize: "100% 100%",
            maskSize: "100% 100%",
          }}
        />

        {/* Backlight strip behind slab (thin band only) */}
        <div
          className="pointer-events-none absolute left-0 right-0 top-0 h-[44px] -z-20"
          style={{
            transform: "translateY(-10px) scaleX(1.03)",
            filter: "blur(10px)",
            opacity: 0.22,
            background:
              "radial-gradient(70% 120% at 50% 100%, rgba(255,235,200,0.85), rgba(255,235,200,0.0) 72%)",
            WebkitMaskImage: 'url("/Backgrounds/TileCards/stone-face.png")',
            maskImage: 'url("/Backgrounds/TileCards/stone-face.png")',
            WebkitMaskRepeat: "no-repeat",
            maskRepeat: "no-repeat",
            WebkitMaskPosition: "center top",
            maskPosition: "center top",
            WebkitMaskSize: "100% 100%",
            maskSize: "100% 100%",
          }}
        />

        {/* Slab container */}
        <div className="relative overflow-hidden rounded-[14px] bg-transparent">
          <div className="relative h-[250px] md:h-[260px]">
            {/* MASKED STONE + EFFECTS */}
            <div
              className="absolute inset-0"
              style={{
                WebkitMaskImage: 'url("/Backgrounds/TileCards/stone-face.png")',
                maskImage: 'url("/Backgrounds/TileCards/stone-face.png")',
                WebkitMaskRepeat: "no-repeat",
                maskRepeat: "no-repeat",
                WebkitMaskPosition: "center",
                maskPosition: "center",
                WebkitMaskSize: "100% 100%",
                maskSize: "100% 100%",
              }}
            >
              {/* Base stone */}
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: 'url("/Backgrounds/TileCards/stone-face.png")',
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "center",
                  backgroundSize: "100% 100%",
                  filter: "saturate(0.70) contrast(0.98) brightness(0.94)",
                }}
              />

              {/* IMPORTANT: reduce crush so highlights can actually show */}
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "radial-gradient(140% 120% at 50% 50%, transparent 58%, rgba(0,0,0,0.78) 100%)",
                  mixBlendMode: "multiply",
                  opacity: 0.55,
                }}
              />

              {/* Bottom weight (reduced slightly) */}
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  boxShadow: "inset 0 -18px 28px rgba(0,0,0,0.46)",
                }}
              />

              {/* Moss tint pass */}
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  backgroundImage: `
                    radial-gradient(140% 90% at 50% 0%, rgba(70,105,70,0.26), transparent 55%),
                    radial-gradient(120% 80% at 10% 0%, rgba(70,105,70,0.18), transparent 60%),
                    radial-gradient(120% 80% at 90% 0%, rgba(70,105,70,0.18), transparent 60%)
                  `,
                  mixBlendMode: "multiply",
                  opacity: 0.78,
                }}
              />

              {/* Micro grain */}
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.10]"
                style={{
                  mixBlendMode: "overlay",
                  backgroundImage:
                    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.55' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='220' height='220' filter='url(%23n)' opacity='.55'/%3E%3C/svg%3E\")",
                }}
              />

              {/* INNER BEVEL (visible, reference-like) */}
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  boxShadow: `
                    inset 0 0 0 1px rgba(255,255,255,0.18),
                    inset 0 18px 28px rgba(255,235,200,0.08),
                    inset 0 -20px 32px rgba(0,0,0,0.44)
                  `,
                }}
              />

              {/* TOP EDGE HIGHLIGHT LINE (this is the "reference" tell) */}
              <div
                className="pointer-events-none absolute left-0 right-0 top-0"
                style={{
                  height: "14px",
                  background:
                    "linear-gradient(180deg, rgba(255,245,230,0.22), rgba(255,245,230,0.0) 80%)",
                  mixBlendMode: "screen",
                  opacity: 1,
                }}
              />

              {/* TOP SHEEN (more obvious) */}
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "radial-gradient(120% 70% at 50% 0%, rgba(255,245,230,0.18), rgba(255,245,230,0) 58%)",
                  mixBlendMode: "screen",
                  opacity: 1,
                }}
              />

              {/* Mouse-follow light (hover only) */}
              <div
                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-150 group-hover:opacity-100"
                style={hoverLightStyle}
              />

              {/* Magical glint (hover only) */}
              <div
                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                style={{
                  backgroundImage: `
                    radial-gradient(120% 70% at 50% 0%,
                      rgba(255, 235, 200, 0.18),
                      transparent 60%),
                    linear-gradient(180deg,
                      rgba(255, 235, 200, 0.12),
                      transparent 42%)
                  `,
                  mixBlendMode: "screen",
                  WebkitMaskImage:
                    "radial-gradient(140% 120% at 50% 50%, rgba(0,0,0,1) 62%, rgba(0,0,0,0) 95%)",
                  maskImage:
                    "radial-gradient(140% 120% at 50% 50%, rgba(0,0,0,1) 62%, rgba(0,0,0,0) 95%)",
                }}
              />

              {/* Broken shimmer (hover only) */}
              <div
                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                style={{
                  backgroundImage: `
                    radial-gradient(120% 70% at 50% 0%, rgba(255,235,200,0.09), transparent 65%),
                    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='220' height='220' filter='url(%23n)' opacity='.55'/%3E%3C/svg%3E")
                  `,
                  mixBlendMode: "overlay",
                  opacity: 0.08,
                  WebkitMaskImage:
                    "radial-gradient(120% 70% at 50% 0%, rgba(0,0,0,1) 42%, rgba(0,0,0,0) 74%)",
                  maskImage:
                    "radial-gradient(120% 70% at 50% 0%, rgba(0,0,0,1) 42%, rgba(0,0,0,0) 74%)",
                }}
              />
            </div>

            {/* ICON (not masked) */}
            {hasIcon && (
              <div className="pointer-events-none absolute left-1/2 top-[18px] -translate-x-1/2">
                {/* Stronger moss bed + highlight so it reads */}
                <div
                  className="absolute left-1/2 top-[44px] h-[58px] w-[230px] -translate-x-1/2"
                  style={{
                    background: `
                      radial-gradient(closest-side, rgba(26,42,26,0.78), rgba(26,42,26,0.0) 74%),
                      radial-gradient(closest-side, rgba(0,0,0,0.60), rgba(0,0,0,0.0) 70%)
                    `,
                    filter: "blur(1.3px)",
                    opacity: 0.95,
                  }}
                />
                <div
                  className="absolute left-1/2 top-[48px] h-[22px] w-[170px] -translate-x-1/2"
                  style={{
                    background:
                      "radial-gradient(closest-side, rgba(255,235,200,0.18), rgba(255,235,200,0.0) 72%)",
                    filter: "blur(6px)",
                    opacity: 0.9,
                    mixBlendMode: "screen",
                  }}
                />

                <div className="relative h-[102px] w-[180px]">
                  <Image
                    src={iconSrc as string}
                    alt={iconAlt}
                    fill
                    sizes="180px"
                    className="object-contain drop-shadow-[0_14px_26px_rgba(0,0,0,0.60)]"
                    priority={false}
                  />
                </div>
              </div>
            )}

            {/* TEXT (not masked) */}
            <div className="relative flex h-full flex-col items-center justify-end px-10 pb-10 pt-24 text-center">
              <div className="font-serif text-2xl tracking-wide text-white/88 drop-shadow-[0_2px_10px_rgba(0,0,0,0.65)]">
                {title}
              </div>
              <div className="mt-3 max-w-[30ch] text-sm leading-relaxed text-white/60">
                {description}
              </div>
            </div>
          </div>
        </div>
      </div>
    </a>
  );
}
