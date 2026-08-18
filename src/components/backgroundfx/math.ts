/**
 * math.ts
 * Small, reusable helpers used by BackgroundFX.
 */

/**
 * SEEDED RANDOM
 * Deterministic pseudo-random generator so particle layouts are stable across renders.
 */
export function rand(seed: { v: number }) {
  seed.v = (seed.v * 1664525 + 1013904223) >>> 0;
  return seed.v / 4294967296;
}

/**
 * WRAP NORMALIZED VALUE
 * Keeps normalized 0..1 coordinates wrapping cleanly across screen edges.
 */
export function wrap01(v: number) {
  if (v < 0) return v + 1;
  if (v >= 1) return v - 1;
  return v;
}

/**
 * CLAMP 0..1
 * Used for masks/falloffs so we never produce invalid alpha values.
 */
export function clamp01(v: number) {
  if (v < 0) return 0;
  if (v > 1) return 1;
  return v;
}

/**
 * SMOOTHSTEP
 * Classic smooth interpolation curve used for coherent noise.
 */
export function smoothstep(t: number) {
  return t * t * (3 - 2 * t);
}

/**
 * LERP
 * Linear interpolation utility.
 */
export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}
