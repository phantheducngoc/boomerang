// Bake lighting into the body silhouette, preserving holes and transparent edges.
import { bodyProjection } from './turning.js';

const surfaces = new Map();
const SIZE = 112;
const ORIGIN_X = 56;
const ORIGIN_Y = 72;

function canvas() {
  const surface = document.createElement('canvas');
  surface.width = SIZE;
  surface.height = SIZE;
  return surface;
}

function createSurface(draw) {
  const face = canvas();
  const ctx = face.getContext('2d');
  ctx.translate(ORIGIN_X, ORIGIN_Y);
  draw(ctx);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = 'source-atop';

  // Fixed upper-left light: bright crown, round midtones, shaded lower-right edge.
  const shade = ctx.createLinearGradient(20, 15, 88, 93);
  shade.addColorStop(0, 'rgba(255,255,235,0.25)');
  shade.addColorStop(0.38, 'rgba(255,255,235,0)');
  shade.addColorStop(0.7, 'rgba(35,20,55,0.12)');
  shade.addColorStop(1, 'rgba(24,15,42,0.48)');
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, SIZE, SIZE);

  const roundness = ctx.createRadialGradient(43, 39, 10, 53, 44, 49);
  roundness.addColorStop(0, 'rgba(255,255,255,0.08)');
  roundness.addColorStop(0.55, 'rgba(35,20,55,0)');
  roundness.addColorStop(1, 'rgba(35,20,55,0.3)');
  ctx.fillStyle = roundness;
  ctx.fillRect(0, 0, SIZE, SIZE);

  const shine = ctx.createRadialGradient(42, 30, 1, 44, 34, 21);
  shine.addColorStop(0, 'rgba(255,255,235,0.38)');
  shine.addColorStop(1, 'rgba(255,255,235,0)');
  ctx.fillStyle = shine;
  ctx.fillRect(0, 0, SIZE, SIZE);

  const edge = canvas();
  const side = edge.getContext('2d');
  side.drawImage(face, 0, 0);
  side.globalCompositeOperation = 'source-atop';
  side.fillStyle = 'rgba(30,18,45,0.24)';
  side.fillRect(0, 0, SIZE, SIZE);
  return { face, edge };
}

export function drawBodyVolume(ctx, key, draw) {
  if (!surfaces.has(key)) surfaces.set(key, createSurface(draw));
  const { face, edge } = surfaces.get(key);
  // The small extruded edge gives the silhouette thickness, including donut holes.
  ctx.drawImage(edge, -ORIGIN_X + 3, -ORIGIN_Y + 3);
  ctx.drawImage(edge, -ORIGIN_X + 1.5, -ORIGIN_Y + 1.5);
  ctx.drawImage(face, -ORIGIN_X, -ORIGIN_Y);
}

export function drawTurningVolume(ctx, key, draw, angle, thickness) {
  for (const back of [true, false]) {
    const surfaceKey = `${key}:${back}`;
    if (!surfaces.has(surfaceKey)) surfaces.set(surfaceKey, createSurface(surface => draw(surface, back)));
  }
  const view = bodyProjection(angle, thickness);
  const { face } = surfaces.get(`${key}:${view.back}`);
  const { edge } = surfaces.get(`${key}:true`);
  const width = Math.max(0.035, view.width);
  const halfDepth = Math.abs(view.depth) / 2;
  // Taper the ends of the side wall into a rounded shoulder instead of a flat slab.
  const slices = Math.max(1, Math.ceil(halfDepth * 4));
  const rounding = 0.16 * Math.abs(Math.cos(angle));
  for (let i = 0; i <= slices; i++) {
    const position = i / slices * 2 - 1;
    const offset = halfDepth * position;
    const height = 1 - rounding * (1 - Math.sqrt(Math.max(0, 1 - position * position)));
    const top = -20 + (-ORIGIN_Y + 20) * height;
    ctx.drawImage(edge, offset - ORIGIN_X * width, top, SIZE * width, SIZE * height);
  }
  if (view.width > 0.001) {
    const faceOffset = view.faceX * (view.back ? -1 : 1);
    const height = 1 - rounding;
    const top = -20 + (-ORIGIN_Y + 20) * height;
    ctx.drawImage(face, faceOffset - ORIGIN_X * view.width, top,
      SIZE * view.width, SIZE * height);
  }
}
