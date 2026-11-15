import { STATUS_COPY } from "../../content/copy";
import type { FacilityStatus } from "../../data/types";

export type Rotation = [number, number];
export type Tone = "good" | "caution" | "bad" | "neutral";

const RADIANS = Math.PI / 180;

export const FLAGGED_STATUSES: ReadonlySet<FacilityStatus> = new Set(["oai", "warning_letter", "import_alert"]);
export const ASCII_RAMP = " .:-=+*#%@";

export function toneOf(status: FacilityStatus): Tone {
  return STATUS_COPY[status].tone;
}

export function isVisible(lon: number, lat: number, rotation: Rotation): boolean {
  const [centerLon, centerLat] = centerOf(rotation);
  const phi = lat * RADIANS;
  const phi0 = centerLat * RADIANS;
  const cosC = Math.sin(phi0) * Math.sin(phi) + Math.cos(phi0) * Math.cos(phi) * Math.cos((lon - centerLon) * RADIANS);
  return cosC > 0;
}

export function rotationFor(lon: number, lat: number): Rotation {
  return [-lon, -lat];
}

export function centerOf(rotation: Rotation): [number, number] {
  return [-rotation[0] || 0, -rotation[1] || 0];
}

export function wrapLongitude(lon: number): number {
  return ((((lon + 180) % 360) + 360) % 360) - 180;
}

export function angleDelta(from: number, to: number): number {
  return wrapLongitude(to - from);
}

export function interpolateRotation(from: Rotation, to: Rotation, t: number): Rotation {
  const k = Math.min(1, Math.max(0, t));
  return [from[0] + angleDelta(from[0], to[0]) * k, from[1] + (to[1] - from[1]) * k];
}

export function easeInOutCubic(t: number): number {
  const k = Math.min(1, Math.max(0, t));
  return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
}

export function clampZoom(zoom: number, min = 0.8, max = 8): number {
  if (!Number.isFinite(zoom)) return 1;
  return Math.min(max, Math.max(min, zoom));
}

export function radiusScale(maxValue: number, [minRadius, maxRadius]: [number, number]): (value: number) => number {
  const rootMax = Math.sqrt(Math.max(0, maxValue));
  return (value: number) => {
    if (rootMax === 0) return minRadius;
    const k = Math.min(1, Math.sqrt(Math.max(0, value)) / rootMax);
    return minRadius + (maxRadius - minRadius) * k;
  };
}

export interface ScreenPoint {
  id: string;
  x: number;
  y: number;
}

export function pickNearest(points: readonly ScreenPoint[], x: number, y: number, maxDistance: number): string | null {
  let best: string | null = null;
  let bestDistance = maxDistance * maxDistance;
  for (const point of points) {
    const distance = (point.x - x) ** 2 + (point.y - y) ** 2;
    if (distance <= bestDistance) {
      bestDistance = distance;
      best = point.id;
    }
  }
  return best;
}

export function luminanceToChar(luminance: number, ramp = ASCII_RAMP): string {
  const k = Math.min(1, Math.max(0, luminance));
  return ramp[Math.min(ramp.length - 1, Math.floor(k * (ramp.length - 1) + 0.0001))];
}
