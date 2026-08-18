/**
 * glow.ts
 * Contains the organic glow system:
 * - coherent noise generation (value-noise style)
 * - thresholded alpha mask with soft edges
 * - stamping glow sprites onto main canvas
 */

import { clamp01, lerp, smoothstep } from "./math";

export type GlowConfig = {
  glowSize: number;
  noiseSize: number;
  noiseScale: number;
  noiseScrollSpeedX: number;
  noiseScrollSpeedY: number;
  cutThreshold: number;
  cutFeather: number;
  tintR: number;
  tintG: number;
  tintB: number;
};

export const defaultGlowConfig: GlowConfig = {
  glowSize: 160,
  noiseSize: 256,
  noiseScale: 0.016,
  noiseScrollSpeedX: 0.10,
  noiseScrollSpeedY: 0.10,
  cutThreshold: 0.62,
  cutFeather: 0.15,
  tintR: 205,
  tintG: 225,
  tintB: 255,
};

function createNoiseGrid(size: number, seed: number) {
  const grid = new Float32Array(size * size);

  let s = seed >>> 0;
  const r01 = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };

  for (let i = 0; i < grid.length; i++) grid[i] = r01();
  return grid;
}

function sampleValueNoise(grid: Float32Array, size: number, x: number, y: number) {
  const xf = x - Math.floor(x);
  const yf = y - Math.floor(y);

  const xi0 = ((Math.floor(x) % size) + size) % size;
  const yi0 = ((Math.floor(y) % size) + size) % size;
  const xi1 = (xi0 + 1) % size;
  const yi1 = (yi0 + 1) % size;

  const tx = smoothstep(xf);
  const ty = smoothstep(yf);

  const a = grid[yi0 * size + xi0];
  const b = grid[yi0 * size + xi1];
  const c = grid[yi1 * size + xi0];
  const d = grid[yi1 * size + xi1];

  const ab = lerp(a, b, tx);
  const cd = lerp(c, d, tx);
  return lerp(ab, cd, ty);
}

export function createGlowSystem(config: GlowConfig) {
  const glowCanvas = document.createElement("canvas");
  glowCanvas.width = config.glowSize;
  glowCanvas.height = config.glowSize;
  const glowCtx = glowCanvas.getContext("2d");

  const maskCanvas = document.createElement("canvas");
  maskCanvas.width = config.glowSize;
  maskCanvas.height = config.glowSize;
  const maskCtx = maskCanvas.getContext("2d");

  const noiseCanvas = document.createElement("canvas");
  noiseCanvas.width = config.noiseSize;
  noiseCanvas.height = config.noiseSize;
  const noiseCtx = noiseCanvas.getContext("2d");

  const grid = createNoiseGrid(config.noiseSize, 987654321);
  const noiseImg = noiseCtx ? noiseCtx.createImageData(config.noiseSize, config.noiseSize) : null;

  /**
   * UPDATE NOISE MASK
   * Writes a tileable alpha mask into noiseCanvas.
   * Call once per frame.
   */
  function updateNoiseMask(t: number) {
    if (!noiseCtx || !noiseImg) return;

    const s = config.noiseSize;
    const data = noiseImg.data;

    const ox = t * config.noiseScrollSpeedX;
    const oy = t * config.noiseScrollSpeedY;

    // Inverse scale: lower noiseScale => larger blobs.
    const scale = 1 / Math.max(0.00001, config.noiseScale);

    // Softness knobs
    const EDGE_GAMMA = 0.1; // lower = softer, higher = harsher
    const MIN_MASK = 0.5; // prevents full wipeout

    for (let y = 0; y < s; y++) {
      for (let x = 0; x < s; x++) {
        const nx = (x + ox * s) / scale;
        const ny = (y + oy * s) / scale;

        // Multi-octave fbm
        const n1 = sampleValueNoise(grid, s, nx, ny);
        const n2 = sampleValueNoise(grid, s, nx * 2.0 + 17.3, ny * 2.0 + 9.1);
        const n3 = sampleValueNoise(grid, s, nx * 4.0 + 3.7, ny * 4.0 + 11.8);
        const n = 0.62 * n1 + 0.26 * n2 + 0.12 * n3;

        // Soft band threshold into 0..1
        const th = config.cutThreshold;
        const fe = Math.max(0.00001, config.cutFeather);
        const lo = th - fe;
        const hi = th + fe;

        let a = clamp01((n - lo) / (hi - lo));

        // Soft edge shaping (this is what removes the "shit" jaggies)
        a = Math.pow(a, EDGE_GAMMA);

        // Keep some punch but avoid binary popping
        a = clamp01(a);

        // Prevent total wipeout
        a = MIN_MASK + a * (1 - MIN_MASK);

        const idx = (y * s + x) * 4;
        data[idx + 0] = 255;
        data[idx + 1] = 255;
        data[idx + 2] = 255;
        data[idx + 3] = Math.floor(a * 255);
      }
    }

    noiseCtx.putImageData(noiseImg, 0, 0);
  }

  /**
   * DRAW ORGANIC GLOW
   * 1) Render radial glow
   * 2) Copy wrapped noise patch into mask stamp
   * 3) destination-in mask onto glow stamp
   * 4) screen-blend stamp onto main canvas
   */
  function drawOrganicGlow(
    mainCtx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    alpha: number,
    t: number,
    starSeed: number
  ) {
    if (!glowCtx || !maskCtx) return;

    const stampS = config.glowSize;
    const cx = stampS * 0.5;
    const cy = stampS * 0.5;

    glowCtx.clearRect(0, 0, stampS, stampS);

    // Base radial glow
    const g = glowCtx.createRadialGradient(cx, cy, 0, cx, cy, stampS * 0.5);
    g.addColorStop(0, `rgba(${config.tintR},${config.tintG},${config.tintB},${alpha})`);
    g.addColorStop(1, `rgba(${config.tintR},${config.tintG},${config.tintB},0)`);
    glowCtx.fillStyle = g;
    glowCtx.fillRect(0, 0, stampS, stampS);

    // Wrapped noise patch -> maskCanvas
    if (noiseCanvas) {
      const nS = config.noiseSize;

      // Stable per-star offset (time motion comes from updateNoiseMask)
      const offX = ((starSeed * 97.31 + x * 0.25) % nS + nS) % nS;
      const offY = ((starSeed * 53.77 + y * 0.25) % nS + nS) % nS;

      const sx0 = Math.floor(offX);
      const sy0 = Math.floor(offY);

      const w0 = Math.min(stampS, nS - sx0);
      const h0 = Math.min(stampS, nS - sy0);

      maskCtx.clearRect(0, 0, stampS, stampS);

      // TL
      maskCtx.drawImage(noiseCanvas, sx0, sy0, w0, h0, 0, 0, w0, h0);

      // TR
      if (w0 < stampS) {
        const w1 = stampS - w0;
        maskCtx.drawImage(noiseCanvas, 0, sy0, w1, h0, w0, 0, w1, h0);
      }

      // BL
      if (h0 < stampS) {
        const h1 = stampS - h0;
        maskCtx.drawImage(noiseCanvas, sx0, 0, w0, h1, 0, h0, w0, h1);

        // BR
        if (w0 < stampS) {
          const w1 = stampS - w0;
          maskCtx.drawImage(noiseCanvas, 0, 0, w1, h1, w0, h0, w1, h1);
        }
      }

      // Apply mask onto glow stamp
      glowCtx.save();
      glowCtx.globalCompositeOperation = "destination-in";
      glowCtx.drawImage(maskCanvas, 0, 0);
      glowCtx.restore();
    }

    // Stamp to main
    mainCtx.save();
    mainCtx.globalCompositeOperation = "screen";
    mainCtx.globalAlpha = 1;

    const scale = (radius * 2) / stampS;
    const w = stampS * scale;
    const h = stampS * scale;

    mainCtx.drawImage(glowCanvas, x - w * 0.5, y - h * 0.5, w, h);
    mainCtx.restore();
  }

  return {
    glowCanvas,
    noiseCanvas,
    updateNoiseMask,
    drawOrganicGlow,
  };
}
