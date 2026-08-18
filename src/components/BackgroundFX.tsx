"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { buildLayers } from "./backgroundfx/particles";
import type { Star } from "./backgroundfx/particles";
import { wrap01 } from "./backgroundfx/math";
import { createGlowSystem, defaultGlowConfig } from "./backgroundfx/glow";

export default function BackgroundFX() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  /**
   * PARTICLE LAYERS
   * Built once, deterministic. No re-roll on each render.
   */
  const layers = useMemo(() => buildLayers(), []);

  useEffect(() => {
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;

    const ctx = canvasEl.getContext("2d");
    if (!ctx) return;

    let raf = 0;

    /**
     * GLOW SYSTEM
     * Manages coherent noise mask + stamping the cut glow shapes.
     */
    const glow = createGlowSystem(defaultGlowConfig);

    /**
     * MOUSE PARALLAX STATE
     * mouseTarget: instantaneous pointer position (-1..1)
     * mouseCurrent: smoothed version for gentle motion.
     */
    const mouseTarget = { x: 0, y: 0 };
    const mouseCurrent = { x: 0, y: 0 };

    /**
     * POINTER MOVE HANDLER
     * Converts screen coords into -1..1 normalized space.
     */
    const onMove = (e: PointerEvent) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      mouseTarget.x = nx;
      mouseTarget.y = ny;
    };

    /**
     * POINTER LEAVE HANDLER
     * Resets target to center so parallax eases back to neutral.
     */
    const onLeave = () => {
      mouseTarget.x = 0;
      mouseTarget.y = 0;
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerleave", onLeave);

    /**
     * RESIZE CANVAS
     * Handles DPR scaling, capped at 2 to avoid huge cost.
     */
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth;
      const h = window.innerHeight;

      canvasEl.width = Math.floor(w * dpr);
      canvasEl.height = Math.floor(h * dpr);
      canvasEl.style.width = w + "px";
      canvasEl.style.height = h + "px";

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    /**
     * DRAW STAR LAYER
     * Updates drift, applies mouse parallax, draws optional glow, then star core.
     */
    const drawStarLayer = (
      stars: Star[],
      w: number,
      h: number,
      camX: number,
      camY: number,
      parallaxBase: number,
      t: number
    ) => {
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];

        // Independent drift.
        s.x = wrap01(s.x + s.vx);
        s.y = wrap01(s.y + s.vy);

        // Near stars react more than far stars.
        const depthScale = 0.15 + s.d * 0.85;

        // Mouse parallax strength (keep this stable for "gentle").
        const strength = parallaxBase * 0.00115;

        // Parallax offset (move opposite camera).
        const px = -camX * strength * depthScale;
        const py = -camY * strength * depthScale;

        const xx = ((s.x * w + px) % w + w) % w;
        const yy = ((s.y * h + py) % h + h) % h;

        // Organic glow with harsh-cut coherent mask.
        if (s.glow > 0) {
          const glowRadius = s.r * (2.8 + 3.4 * s.glow);
          const glowAlpha = Math.min(0.12, s.a * (0.55 + 0.30 * s.glow));

          const prevR = defaultGlowConfig.tintR;
          const prevG = defaultGlowConfig.tintG;
          const prevB = defaultGlowConfig.tintB;

          const tTint = 0.35;

          const baseR = prevR / 255;
          const baseG = prevG / 255;
          const baseB = prevB / 255;

          const mixR = baseR * (1 - tTint) + s.cr * tTint;
          const mixG = baseG * (1 - tTint) + s.cg * tTint;
          const mixB = baseB * (1 - tTint) + s.cb * tTint;

          defaultGlowConfig.tintR = Math.round(mixR * 255);
          defaultGlowConfig.tintG = Math.round(mixG * 255);
          defaultGlowConfig.tintB = Math.round(mixB * 255);

          glow.drawOrganicGlow(ctx, xx, yy, glowRadius, glowAlpha, t, i);

          defaultGlowConfig.tintR = prevR;
          defaultGlowConfig.tintG = prevG;
          defaultGlowConfig.tintB = prevB;
        }

        // Star core (USE PER-STAR TINT)
        const rr = Math.round(255 * s.cr);
        const gg = Math.round(255 * s.cg);
        const bb = Math.round(255 * s.cb);
        ctx.fillStyle = `rgba(${rr},${gg},${bb},${Math.min(1, s.a * 5).toFixed(4)})`; /*s.a * 3.5 is the brightness higher value = brighter */
        ctx.beginPath();
        ctx.arc(xx, yy, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    /**
     * MAIN ANIMATION LOOP
     * - smooth mouse
     * - update noise mask
     * - clear (transparent)
     * - draw stars + dust only
     */
    const step = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const t = performance.now() * 0.001;

      glow.updateNoiseMask(t);

      // Mouse smoothing (this is the "gentle" knob).
      const k = 0.05;
      mouseCurrent.x += (mouseTarget.x - mouseCurrent.x) * k;
      mouseCurrent.y += (mouseTarget.y - mouseCurrent.y) * k;

      // Camera offset in pixels.
      const camX = mouseCurrent.x * (w * 0.5);
      const camY = mouseCurrent.y * (h * 0.5);

      // Clear to transparent so CSS/body background shows through.
      ctx.clearRect(0, 0, w, h);

      // Stars (parallaxBase controls response per layer).
      drawStarLayer(layers.farStars, w, h, camX, camY, 10, t);
      drawStarLayer(layers.midStars, w, h, camX, camY, 18, t);
      drawStarLayer(layers.nearGlints, w, h, camX, camY, 28, t);

      // Dust (faint specks).
      for (let i = 0; i < layers.dust.length; i++) {
        const p = layers.dust[i];

        p.x = wrap01(p.x + p.vx);
        p.y = wrap01(p.y + p.vy);

        const depth = 0.35 + p.r * 0.45;

        const x = p.x * w - camX * 0.03 * depth;
        const y = p.y * h - camY * 0.03 * depth;

        const xx = ((x % w) + w) % w;
        const yy = ((y % h) + h) % h;

        ctx.beginPath();
        ctx.arc(xx, yy, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(90,140,95,${(p.a * 4).toFixed(4)})`;
        ctx.fill();
      }


      raf = window.requestAnimationFrame(step);
    };

    // Startup.
    resize();
    window.addEventListener("resize", resize, { passive: true });
    raf = window.requestAnimationFrame(step);

    // Cleanup.
    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
      window.cancelAnimationFrame(raf);
    };
  }, [layers]);

  return (
    <div className="pointer-events-none fixed inset-0 z-[1] overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 opacity-100" />

      {/* GRAIN OVERLAY (kills banding, adds texture) */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='.35'/%3E%3C/svg%3E\")",
        }}
      />
    </div>
  );
}
