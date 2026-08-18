/**
 * particles.ts
 * All particle types and the deterministic layer generator live here.
 */

import { rand, clamp01, lerp } from "./math";

/**
 * STAR PARTICLE
 */
export type Star = {
  x: number;
  y: number;
  r: number;
  a: number;
  glow: number;
  vx: number;
  vy: number;
  d: number;

  cr: number;
  cg: number;
  cb: number;
};

export type Dust = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  a: number;
};

export type ParticleLayers = {
  farStars: Star[];
  midStars: Star[];
  nearGlints: Star[];
  dust: Dust[];
};

function mixRGB(
  ar: number,
  ag: number,
  ab: number,
  br: number,
  bg: number,
  bb: number,
  t: number
) {
  return {
    r: lerp(ar, br, t),
    g: lerp(ag, bg, t),
    b: lerp(ab, bb, t),
  };
}

function mixTowardWhite(r: number, g: number, b: number, t: number) {
  const k = clamp01(t);
  return {
    r: lerp(r, 1, k),
    g: lerp(g, 1, k),
    b: lerp(b, 1, k),
  };
}

/**
 * CREATE STAR LAYER
 *
 * Visual intent:
 * - Far: cool blue
 * - Mid: neutral
 * - Near: warm orange (NOT yellow)
 * - Subtle variation, more visible on near stars
 */
function makeStars(
  seed: { v: number },
  count: number,
  rMin: number,
  rMax: number,
  aMin: number,
  aMax: number,
  glowChance: number,
  speedMin: number,
  speedMax: number,
  forceGlowMin: number,
  layerTempBias: number
) {
  const stars: Star[] = [];

  // Stronger separation:
  // Blue far, white near
  const FAR = { r: 0.55, g: 0.72, b: 1.00 };
  const NEAR = { r: 1, g: 1.00, b: 1 };

  for (let i = 0; i < count; i++) {
    const x = rand(seed);
    const y = rand(seed);

    const r = rMin + rand(seed) * (rMax - rMin);

    // DIM ALL STARS SLIGHTLY (global brightness control)
    const a =
      (aMin + rand(seed) * (aMax - aMin)) *
      0.5; // <-- master dimmer

    let glow = 0;
    if (rand(seed) < glowChance) {
      glow = forceGlowMin + rand(seed) * (1 - forceGlowMin);
    }

    const d = clamp01((r - rMin) / Math.max(0.0001, rMax - rMin));

    const ang = rand(seed) * Math.PI * 2;
    const sp = speedMin + (speedMax - speedMin) * d;
    const vx = Math.cos(ang) * sp;
    const vy = Math.sin(ang) * sp;

    // Depth gradient
    const base = mixRGB(FAR.r, FAR.g, FAR.b, NEAR.r, NEAR.g, NEAR.b, d);

    // Temperature variation
    const jitter = (rand(seed) - 0.5) * 0.20;
    const varStrength = 0.30 + d * 0.70;
    const temp = (jitter + layerTempBias) * varStrength;

    // Apply warm/cool shift
    let tr = clamp01(base.r + temp * 1.10);
    let tg = clamp01(base.g + temp * 0.15);
    let tb = clamp01(base.b - temp * 1.30);

    // Far stars more white, near stars more saturated
    const whiten = (1 - d) * 0.60 + d * 0.22;
    const tinted = mixTowardWhite(tr, tg, tb, whiten);

    const grey = 0.82 - d * 0.25; // slightly darker for near stars

    stars.push({
      x,
      y,
      r,
      a,
      glow,
      vx,
      vy,
      d,
      cr: grey,
      cg: grey,
      cb: grey,
    });
  }

  return stars;
}

function makeDust(seed: { v: number }, count: number) {
  const dust: Dust[] = [];

  for (let i = 0; i < count; i++) {
    dust.push({
      x: rand(seed),
      y: rand(seed),
      vx: (rand(seed) - 0.5) * 0.0012,
      vy: (rand(seed) - 0.5) * 0.0012,
      r: 0.6 + rand(seed) * 1.3,
      a: (0.02 + rand(seed) * 0.06) * 0.75,
    });
  }

  return dust;
}

export function buildLayers(): ParticleLayers {
  const seed = { v: 123456789 };

  const farStars = makeStars(
    seed,
    520,
    0.35,
    0.95,
    0.05,
    0.16,
    0.02,
    0.00002,
    0.00010,
    0.35,
    -0.12
  );

  const midStars = makeStars(
    seed,
    220,
    0.6,
    1.5,
    0.08,
    0.22,
    0.05,
    0.00005,
    0.00020,
    0.40,
    0.00
  );

const nearGlints = makeStars(
  seed,
  46,
  1.2,
  3.2,
  0.10,
  0.25,
  0.65,
  0.00008,
  0.00035,
  0.55,
  -0.28
);



  const dust = makeDust(seed, 34);

  return { farStars, midStars, nearGlints, dust };
}
