import { geoGraticule10, geoOrthographic, geoPath, type GeoProjection } from "d3-geo";
import type { FeatureCollection, MultiPolygon, Polygon } from "geojson";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import landTopology from "world-atlas/land-110m.json";
import { isVisible, luminanceToChar, type Rotation, type ScreenPoint, type Tone } from "./geometry";
import type { PlottedFacility } from "./facilityIndex";

const topology = landTopology as unknown as Topology<{ land: GeometryCollection }>;
const LAND = feature(topology, topology.objects.land) as FeatureCollection<Polygon | MultiPolygon>;
const GRATICULE = geoGraticule10();
const SPHERE = { type: "Sphere" } as const;
const LAND_RAMP = " .:-=+*#%@";
const OCEAN_RAMP = "  ..·";

export interface Palette {
  key: string;
  ocean: string;
  land: string;
  landStroke: string;
  graticule: string;
  border: string;
  text: string;
  muted: string;
  bg: string;
  accent: string;
  accent2: string;
  mono: string;
  tones: Record<Tone, string>;
}

const FALLBACK: Omit<Palette, "key"> = {
  ocean: "#e9f0f7",
  land: "#cfd6de",
  landStroke: "#ffffff",
  graticule: "rgba(14, 90, 167, 0.12)",
  border: "#d4d4d0",
  text: "#111111",
  muted: "#555555",
  bg: "#ffffff",
  accent: "#0e5aa7",
  accent2: "#c8102e",
  mono: "ui-monospace, monospace",
  tones: { good: "#1b7a3a", caution: "#9a5600", bad: "#c8102e", neutral: "#6b6b6b" },
};

let cachedPalette: Palette | null = null;

export function readPalette(): Palette {
  const root = document.documentElement;
  const key = root.dataset.theme ?? "standard";
  if (cachedPalette?.key === key) return cachedPalette;
  const style = getComputedStyle(root);
  const read = (name: string, fallback: string) => style.getPropertyValue(name).trim() || fallback;
  cachedPalette = {
    key,
    ocean: read("--ocean", FALLBACK.ocean),
    land: read("--land", FALLBACK.land),
    landStroke: read("--land-stroke", FALLBACK.landStroke),
    graticule: read("--graticule", FALLBACK.graticule),
    border: read("--border", FALLBACK.border),
    text: read("--text", FALLBACK.text),
    muted: read("--muted", FALLBACK.muted),
    bg: read("--bg", FALLBACK.bg),
    accent: read("--accent", FALLBACK.accent),
    accent2: read("--accent-2", FALLBACK.accent2),
    mono: read("--font-mono", FALLBACK.mono),
    tones: {
      good: read("--good", FALLBACK.tones.good),
      caution: read("--caution", FALLBACK.tones.caution),
      bad: read("--bad", FALLBACK.tones.bad),
      neutral: read("--neutral", FALLBACK.tones.neutral),
    },
  };
  return cachedPalette;
}

export interface Scene {
  width: number;
  height: number;
  dpr: number;
  rotation: Rotation;
  zoom: number;
  points: PlottedFacility[];
  radius: (labels: number) => number;
  hidden: ReadonlySet<Tone>;
  selectedFei: string | null;
  time: number;
  pulse: boolean;
  /** Vertical centre of the globe in CSS pixels; defaults to the middle of the canvas. */
  centerY?: number;
}

export function makeProjection(scene: Pick<Scene, "width" | "height" | "rotation" | "zoom" | "centerY">): GeoProjection {
  const base = Math.max(40, Math.min(scene.width, scene.height) / 2 - 10);
  return geoOrthographic()
    .clipAngle(90)
    .translate([scene.width / 2, scene.centerY ?? scene.height / 2])
    .scale(base * scene.zoom)
    .rotate([scene.rotation[0], scene.rotation[1], 0])
    .precision(0.5);
}

function drawMarker(ctx: CanvasRenderingContext2D, tone: Tone, x: number, y: number, r: number) {
  ctx.beginPath();
  if (tone === "caution") {
    const h = r * 1.15;
    ctx.moveTo(x, y - h);
    ctx.lineTo(x + h, y + h * 0.8);
    ctx.lineTo(x - h, y + h * 0.8);
    ctx.closePath();
  } else if (tone === "bad") {
    ctx.rect(x - r * 0.9, y - r * 0.9, r * 1.8, r * 1.8);
  } else {
    ctx.arc(x, y, r, 0, Math.PI * 2);
  }
}

function visibleScreenPoints(scene: Scene, projection: GeoProjection) {
  const result: Array<{ p: PlottedFacility; x: number; y: number; r: number }> = [];
  const zoomFactor = Math.sqrt(scene.zoom);
  for (const p of scene.points) {
    if (scene.hidden.has(p.tone)) continue;
    if (!isVisible(p.lon, p.lat, scene.rotation)) continue;
    const xy = projection([p.lon, p.lat]);
    if (!xy) continue;
    result.push({ p, x: xy[0], y: xy[1], r: scene.radius(p.facility.labels) * zoomFactor });
  }
  return result;
}

export function drawStandard(ctx: CanvasRenderingContext2D, scene: Scene): ScreenPoint[] {
  const palette = readPalette();
  const projection = makeProjection(scene);
  const path = geoPath(projection, ctx);
  ctx.setTransform(scene.dpr, 0, 0, scene.dpr, 0, 0);
  ctx.clearRect(0, 0, scene.width, scene.height);

  ctx.beginPath();
  path(SPHERE);
  ctx.fillStyle = palette.ocean;
  ctx.fill();

  ctx.beginPath();
  path(GRATICULE);
  ctx.strokeStyle = palette.graticule;
  ctx.lineWidth = 0.75;
  ctx.stroke();

  ctx.beginPath();
  path(LAND);
  ctx.fillStyle = palette.land;
  ctx.fill();
  ctx.strokeStyle = palette.landStroke;
  ctx.lineWidth = 0.6;
  ctx.stroke();

  ctx.beginPath();
  path(SPHERE);
  ctx.strokeStyle = palette.border;
  ctx.lineWidth = 1.25;
  ctx.stroke();

  const visible = visibleScreenPoints(scene, projection);
  const phase = (scene.time % 1600) / 1600;
  const picks: ScreenPoint[] = [];
  for (const { p, x, y, r } of visible) {
    if (scene.pulse && p.flagged) {
      const ringPhase = (phase + (Number(p.facility.fei.slice(-2)) || 0) / 100) % 1;
      ctx.beginPath();
      ctx.arc(x, y, r + 2 + ringPhase * 12, 0, Math.PI * 2);
      ctx.strokeStyle = palette.tones.bad;
      ctx.globalAlpha = 0.7 * (1 - ringPhase);
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    ctx.globalAlpha = p.tone === "good" ? 0.75 : 0.9;
    drawMarker(ctx, p.tone, x, y, r);
    if (p.tone === "neutral") {
      ctx.strokeStyle = palette.tones.neutral;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else {
      ctx.fillStyle = palette.tones[p.tone];
      ctx.fill();
      ctx.strokeStyle = palette.bg;
      ctx.lineWidth = 0.75;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    picks.push({ id: p.facility.fei, x, y });
  }

  const selected = visible.find((v) => v.p.facility.fei === scene.selectedFei);
  if (selected) {
    ctx.beginPath();
    ctx.arc(selected.x, selected.y, selected.r + 6, 0, Math.PI * 2);
    ctx.strokeStyle = palette.text;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(selected.x, selected.y, selected.r + 9, 0, Math.PI * 2);
    ctx.strokeStyle = palette.bg;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  return picks;
}

export interface AsciiBuffer {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
}

export function createAsciiBuffer(): AsciiBuffer | null {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  return ctx ? { canvas, ctx } : null;
}

export function drawAscii(ctx: CanvasRenderingContext2D, buffer: AsciiBuffer, scene: Scene): ScreenPoint[] {
  const palette = readPalette();
  const fontSize = scene.width < 480 ? 9 : 11;
  ctx.setTransform(scene.dpr, 0, 0, scene.dpr, 0, 0);
  ctx.font = `${fontSize}px ${palette.mono}`;
  const cellWidth = Math.max(4, ctx.measureText("M").width);
  const cellHeight = Math.round(fontSize * 1.15);
  const cols = Math.max(1, Math.floor(scene.width / cellWidth));
  const rows = Math.max(1, Math.floor(scene.height / cellHeight));
  const offsetX = (scene.width - cols * cellWidth) / 2;
  const offsetY = (scene.height - rows * cellHeight) / 2;

  const projection = makeProjection(scene);
  const b = buffer.ctx;
  if (buffer.canvas.width !== cols || buffer.canvas.height !== rows) {
    buffer.canvas.width = cols;
    buffer.canvas.height = rows;
  }
  b.setTransform(1, 0, 0, 1, 0, 0);
  b.clearRect(0, 0, cols, rows);
  b.setTransform(1 / cellWidth, 0, 0, 1 / cellHeight, -offsetX / cellWidth, -offsetY / cellHeight);
  const path = geoPath(projection, b);
  const [cx, cy] = projection.translate();
  const r = projection.scale();
  const light = b.createRadialGradient(cx - r * 0.35, cy - r * 0.4, r * 0.05, cx, cy, r * 1.05);
  light.addColorStop(0, "rgb(0,255,0)");
  light.addColorStop(1, "rgb(0,70,0)");
  const sea = b.createRadialGradient(cx - r * 0.35, cy - r * 0.4, r * 0.05, cx, cy, r * 1.05);
  sea.addColorStop(0, "rgb(0,0,255)");
  sea.addColorStop(1, "rgb(0,0,60)");
  b.beginPath();
  path(SPHERE);
  b.fillStyle = sea;
  b.fill();
  b.beginPath();
  path(LAND);
  b.fillStyle = light;
  b.fill();
  b.beginPath();
  path(SPHERE);
  b.strokeStyle = "rgb(255,0,0)";
  b.lineWidth = cellWidth * 0.9;
  b.stroke();

  const pixels = b.getImageData(0, 0, cols, rows).data;
  ctx.clearRect(0, 0, scene.width, scene.height);
  ctx.textBaseline = "top";
  const rim: string[] = [];
  const land: string[] = [];
  const sea2: string[] = [];
  for (let row = 0; row < rows; row++) {
    let rimLine = "";
    let landLine = "";
    let seaLine = "";
    for (let col = 0; col < cols; col++) {
      const i = (row * cols + col) * 4;
      const [red, green, blue] = [pixels[i], pixels[i + 1], pixels[i + 2]];
      if (red > 90 && red >= green) {
        rimLine += red > 170 ? "o" : ".";
        landLine += " ";
        seaLine += " ";
      } else if (green > 24 && green >= blue * 0.6) {
        rimLine += " ";
        landLine += luminanceToChar(green / 255, LAND_RAMP);
        seaLine += " ";
      } else {
        rimLine += " ";
        landLine += " ";
        seaLine += luminanceToChar(blue / 255, OCEAN_RAMP);
      }
    }
    rim.push(rimLine);
    land.push(landLine);
    sea2.push(seaLine);
  }
  const drawLines = (lines: string[], color: string, alpha: number) => {
    ctx.fillStyle = color;
    ctx.globalAlpha = alpha;
    lines.forEach((line, row) => {
      if (line.trim()) ctx.fillText(line, offsetX, offsetY + row * cellHeight);
    });
    ctx.globalAlpha = 1;
  };
  drawLines(sea2, palette.accent, 0.45);
  drawLines(rim, palette.accent, 0.8);
  drawLines(land, palette.text, 0.85);

  const visible = visibleScreenPoints(scene, projection);
  const blink = Math.floor(scene.time / 400) % 2 === 0;
  const picks: ScreenPoint[] = [];
  ctx.font = `bold ${fontSize + 2}px ${palette.mono}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (const { p, x, y } of visible) {
    const glyph = p.flagged ? (scene.pulse && !blink ? "*" : "@") : p.tone === "caution" ? "+" : p.tone === "neutral" ? "o" : "•";
    const col = Math.floor((x - offsetX) / cellWidth);
    const row = Math.floor((y - offsetY) / cellHeight);
    const gx = offsetX + (col + 0.5) * cellWidth;
    const gy = offsetY + (row + 0.5) * cellHeight;
    ctx.fillStyle = palette.bg;
    ctx.fillRect(gx - cellWidth / 2, gy - cellHeight / 2, cellWidth, cellHeight);
    ctx.fillStyle = palette.tones[p.tone];
    ctx.fillText(glyph, gx, gy);
    picks.push({ id: p.facility.fei, x: gx, y: gy });
  }
  const selected = picks.find((pick) => pick.id === scene.selectedFei);
  if (selected) {
    ctx.fillStyle = palette.accent2;
    ctx.fillText("[", selected.x - cellWidth, selected.y);
    ctx.fillText("]", selected.x + cellWidth, selected.y);
  }
  ctx.textAlign = "start";
  return picks;
}
