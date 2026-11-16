import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";
import type { FacilitySummary } from "../../data/types";
import { useTheme } from "../../theme/ThemeContext";
import { useReducedMotion } from "../../theme/useReducedMotion";
import { formatNumber, plural } from "../ui/format";
import { CountryTable } from "./CountryTable";
import { FacilityBrowser } from "./FacilityBrowser";
import { formatLocation, plottable, TONE_COPY, TONES } from "./facilityIndex";
import { clampZoom, easeInOutCubic, interpolateRotation, pickNearest, radiusScale, rotationFor, type Rotation, type ScreenPoint, type Tone } from "./geometry";
import { InfoCard } from "./InfoCard";
import { createAsciiBuffer, drawAscii, drawStandard, type AsciiBuffer } from "./renderer";
import "./Globe.css";

export interface GlobeProps {
  facilities: FacilitySummary[];
  focusFei?: string | null;
  onSelect?: (fei: string | null) => void;
  label?: string;
  className?: string;
}

interface Flight {
  from: Rotation;
  to: Rotation;
  start: number;
  duration: number;
}

const DEGREES_PER_MS = 0.006;
const KEY_STEP = 10;
const ZOOM_STEP = 1.35;
const INITIAL_ROTATION: Rotation = [-40, -20];

export function Globe({ facilities, focusFei = null, onSelect, label = "Facility globe", className = "" }: GlobeProps) {
  const { theme } = useTheme();
  const reduced = useReducedMotion();
  const helpId = useId();
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const points = useMemo(() => plottable(facilities), [facilities]);
  const radius = useMemo(() => radiusScale(Math.max(1, ...points.map((p) => p.facility.labels)), [2.2, 9]), [points]);
  const byFei = useMemo(() => new Map(facilities.map((f) => [f.fei, f])), [facilities]);

  const [playing, setPlaying] = useState(!reduced);
  const [hidden, setHidden] = useState<ReadonlySet<Tone>>(new Set());
  const [selectedFei, setSelectedFei] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [announcement, setAnnouncement] = useState("");

  const rotation = useRef<Rotation>(INITIAL_ROTATION);
  const zoomRef = useRef(1);
  const size = useRef({ width: 0, height: 0, dpr: 1 });
  // Shifts the globe up while a full-width card covers the bottom of the canvas (phones).
  const shift = useRef({ current: 0, target: 0 });
  const viewportRef = useRef<HTMLDivElement>(null);
  const updateShift = useRef(() => {});
  updateShift.current = () => {
    const card = viewportRef.current?.querySelector<HTMLElement>(".globe-card");
    const { width, height } = size.current;
    // Only a card spanning most of the width hides the centre; a corner card leaves it clear.
    const covering = card && width > 0 && card.offsetWidth > width * 0.7;
    shift.current.target = covering ? Math.min(0, card.offsetTop / 2 - height / 2) : 0;
  };
  const flight = useRef<Flight | null>(null);
  const interaction = useRef({ hover: false, drag: false, focus: false });
  const visible = useRef({ onscreen: true, page: true });
  const picks = useRef<ScreenPoint[]>([]);
  const frame = useRef(0);
  const lastTime = useRef(0);
  const ascii = useRef<AsciiBuffer | null>(null);
  const live = useRef({ playing, reduced, hidden, selectedFei, theme, points, radius });
  live.current = { playing, reduced, hidden, selectedFei, theme, points, radius };

  const autoRotating = () => {
    const s = live.current;
    const i = interaction.current;
    return s.playing && !s.reduced && !s.selectedFei && !i.hover && !i.drag && !i.focus;
  };

  const draw = useCallback((time: number): boolean => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || size.current.width === 0) return false;
    const s = live.current;
    const scene = {
      ...size.current,
      rotation: rotation.current,
      zoom: zoomRef.current,
      points: s.points,
      radius: s.radius,
      hidden: s.hidden,
      selectedFei: s.selectedFei,
      time,
      pulse: !s.reduced,
      centerY: size.current.height / 2 + shift.current.current,
    };
    if (s.theme === "ascii") {
      ascii.current ??= createAsciiBuffer();
      picks.current = ascii.current ? drawAscii(ctx, ascii.current, scene) : drawStandard(ctx, scene);
    } else {
      picks.current = drawStandard(ctx, scene);
    }
    return true;
  }, []);

  const tick = useCallback(
    (time: number) => {
      frame.current = 0;
      const dt = Math.min(64, lastTime.current ? time - lastTime.current : 16);
      lastTime.current = time;
      const f = flight.current;
      if (f) {
        const k = (time - f.start) / f.duration;
        rotation.current = interpolateRotation(f.from, f.to, easeInOutCubic(k));
        if (k >= 1) flight.current = null;
      } else if (autoRotating()) {
        rotation.current = [rotation.current[0] + dt * DEGREES_PER_MS, rotation.current[1]];
      }
      const sh = shift.current;
      const shifting = Math.abs(sh.target - sh.current) > 0.5;
      sh.current = shifting && !live.current.reduced ? sh.current + (sh.target - sh.current) * Math.min(1, dt / 90) : sh.target;
      const drawn = draw(time);
      const shouldContinue = drawn && visible.current.onscreen && visible.current.page && (flight.current !== null || shifting || !live.current.reduced);
      if (shouldContinue) frame.current = requestAnimationFrame(tick);
      else lastTime.current = 0;
    },
    [draw],
  );

  const requestFrame = useCallback(() => {
    if (!frame.current) frame.current = requestAnimationFrame(tick);
  }, [tick]);

  useEffect(() => {
    requestFrame();
  }, [playing, reduced, hidden, selectedFei, theme, points, radius, zoom, requestFrame]);

  useEffect(() => {
    if (reduced) setPlaying(false);
  }, [reduced]);

  useEffect(() => {
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
      frame.current = 0;
    };
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!stage || !canvas) return;
    const resize = (width: number) => {
      const w = Math.max(200, Math.round(width));
      // Phones get a taller canvas so the on-globe card leaves room for the globe above it.
      const h = Math.round(
        w < 600 ? Math.max(Math.min(w, 620), Math.min(600, window.innerHeight * 0.7)) : Math.min(w, 620, Math.max(300, window.innerHeight * 0.72)),
      );
      const dpr = Math.min(2.5, window.devicePixelRatio || 1);
      size.current = { width: w, height: h, dpr };
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.height = `${h}px`;
      updateShift.current();
      requestFrame();
    };
    resize(stage.getBoundingClientRect().width || 600);
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver((entries) => resize(entries[0].contentRect.width)) : null;
    observer?.observe(stage);

    const onVisibility = () => {
      visible.current.page = document.visibilityState !== "hidden";
      if (visible.current.page) requestFrame();
    };
    document.addEventListener("visibilitychange", onVisibility);
    const intersection =
      typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver((entries) => {
            visible.current.onscreen = entries.some((e) => e.isIntersecting);
            if (visible.current.onscreen) requestFrame();
          })
        : null;
    intersection?.observe(stage);

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      applyZoom(zoomRef.current * Math.exp(-event.deltaY * 0.0015));
    };
    canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      observer?.disconnect();
      intersection?.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("wheel", onWheel);
    };
  }, [requestFrame]);

  function applyZoom(next: number) {
    zoomRef.current = clampZoom(next);
    setZoom(zoomRef.current);
    requestFrame();
  }

  const flyTo = useCallback(
    (facility: FacilitySummary) => {
      if (facility.lat == null || facility.lon == null) return;
      const target = rotationFor(facility.lon, facility.lat);
      if (live.current.reduced) {
        flight.current = null;
        rotation.current = target;
      } else {
        flight.current = { from: rotation.current, to: target, start: performance.now(), duration: 1400 };
      }
      requestFrame();
    },
    [requestFrame],
  );

  const select = useCallback(
    (fei: string | null, fly: boolean) => {
      setSelectedFei(fei);
      onSelect?.(fei);
      const facility = fei ? byFei.get(fei) : undefined;
      if (!facility) {
        setAnnouncement(fei === null ? "Selection cleared." : "");
        return;
      }
      if (fly) flyTo(facility);
      const where = formatLocation(facility);
      setAnnouncement(
        `Selected ${facility.name}${where ? `, ${where}` : ""}. ${TONE_COPY[live.current.points.find((p) => p.facility.fei === fei)?.tone ?? "neutral"].label}.${
          facility.lat == null ? " This facility has no map location." : ""
        }`,
      );
    },
    [byFei, flyTo, onSelect],
  );

  useLayoutEffect(() => {
    updateShift.current();
    requestFrame();
  }, [selectedFei, requestFrame]);

  useEffect(() => {
    if (focusFei && byFei.has(focusFei)) select(focusFei, true);
  }, [focusFei, byFei, select]);

  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{ startX: number; startY: number; rotation: Rotation; moved: boolean; pinchDistance: number; pinchZoom: number } | null>(null);

  const localPoint = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const pinchDistance = () => {
    const [a, b] = [...pointers.current.values()];
    return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0;
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    event.currentTarget.setPointerCapture?.(event.pointerId);
    const point = localPoint(event);
    pointers.current.set(event.pointerId, point);
    flight.current = null;
    gesture.current = {
      startX: point.x,
      startY: point.y,
      rotation: rotation.current,
      moved: pointers.current.size > 1,
      pinchDistance: pinchDistance(),
      pinchZoom: zoomRef.current,
    };
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!pointers.current.has(event.pointerId) || !gesture.current) return;
    const point = localPoint(event);
    pointers.current.set(event.pointerId, point);
    const g = gesture.current;
    if (pointers.current.size >= 2) {
      const distance = pinchDistance();
      if (g.pinchDistance > 0) applyZoom((g.pinchZoom * distance) / g.pinchDistance);
      return;
    }
    const dx = point.x - g.startX;
    const dy = point.y - g.startY;
    if (!g.moved && Math.hypot(dx, dy) < 4) return;
    g.moved = true;
    interaction.current.drag = true;
    const degreesPerPixel = 90 / Math.max(60, (Math.min(size.current.width, size.current.height) / 2) * zoomRef.current);
    rotation.current = [g.rotation[0] + dx * degreesPerPixel, Math.max(-85, Math.min(85, g.rotation[1] - dy * degreesPerPixel))];
    requestFrame();
  };

  const onPointerUp = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const g = gesture.current;
    if (pointers.current.size === 1 && g && !g.moved) {
      const point = localPoint(event);
      const tolerance = event.pointerType === "touch" ? 24 : 14;
      const fei = pickNearest(picks.current, point.x, point.y, tolerance);
      // Fly the tapped dot to the centre so the on-globe card never covers it.
      select(fei, true);
    }
    pointers.current.delete(event.pointerId);
    if (pointers.current.size === 0) {
      gesture.current = null;
      interaction.current.drag = false;
      requestFrame();
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLCanvasElement>) => {
    const [lambda, phi] = rotation.current;
    const moves: Record<string, Rotation> = {
      ArrowLeft: [lambda + KEY_STEP, phi],
      ArrowRight: [lambda - KEY_STEP, phi],
      ArrowUp: [lambda, Math.max(-85, phi - KEY_STEP)],
      ArrowDown: [lambda, Math.min(85, phi + KEY_STEP)],
    };
    if (moves[event.key]) {
      event.preventDefault();
      flight.current = null;
      rotation.current = moves[event.key];
      requestFrame();
    } else if (event.key === "+" || event.key === "=") {
      event.preventDefault();
      applyZoom(zoomRef.current * ZOOM_STEP);
    } else if (event.key === "-" || event.key === "_") {
      event.preventDefault();
      applyZoom(zoomRef.current / ZOOM_STEP);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      const { width, height } = size.current;
      select(pickNearest(picks.current, width / 2, height / 2, Math.max(40, width / 6)), false);
    } else if (event.key === "Escape") {
      select(null, false);
    }
  };

  const setInteraction = (key: "hover" | "focus", value: boolean) => {
    interaction.current[key] = value;
    requestFrame();
  };

  const toggleTone = (tone: Tone) => {
    setHidden((current) => {
      const next = new Set(current);
      if (next.has(tone)) next.delete(tone);
      else next.add(tone);
      return next;
    });
  };

  const toneCounts = useMemo(() => {
    const counts: Record<Tone, number> = { good: 0, caution: 0, bad: 0, neutral: 0 };
    for (const p of points) counts[p.tone] += 1;
    return counts;
  }, [points]);

  const shownPoints = points.filter((p) => !hidden.has(p.tone));
  const countries = new Set(shownPoints.map((p) => p.facility.country)).size;
  const serious = shownPoints.filter((p) => p.flagged).length;
  const motionState = reduced && !playing ? "Rotation is off because reduced motion is preferred" : playing ? "Auto-rotating" : "Rotation paused";
  const canvasLabel = `Globe showing ${plural(shownPoints.length, "facility", "facilities")} in ${plural(countries, "country", "countries")}, ${formatNumber(serious)} with a serious latest action. ${motionState}.`;
  const selected = selectedFei ? byFei.get(selectedFei) ?? null : null;

  const closeCard = () => {
    select(null, false);
    canvasRef.current?.focus({ preventScroll: true });
  };

  // On narrow screens the browser sits below the globe, so bring the card into view.
  const pickFromBrowser = (fei: string) => {
    select(fei, true);
    stageRef.current?.scrollIntoView?.({ block: "nearest", behavior: reduced ? "auto" : "smooth" });
  };

  return (
    <div className={`globe ${theme === "ascii" ? "globe--ascii" : ""} ${className}`}>
      <div className="globe__layout">
        <div className="globe__stage" ref={stageRef}>
          <div className="globe__viewport" ref={viewportRef}>
          <canvas
            ref={canvasRef}
            className="globe__canvas"
            role="img"
            aria-label={canvasLabel}
            aria-describedby={helpId}
            tabIndex={0}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onPointerEnter={(e) => e.pointerType === "mouse" && setInteraction("hover", true)}
            onPointerLeave={() => setInteraction("hover", false)}
            onFocus={() => setInteraction("focus", true)}
            onBlur={() => setInteraction("focus", false)}
            onKeyDown={onKeyDown}
          />
          {selected && <InfoCard key={selected.fei} facility={selected} onClose={() => closeCard()} />}
          </div>
          <div className="globe__controls" role="group" aria-label="Globe controls">
            <button type="button" className="globe__control globe__control--wide" aria-pressed={!playing} onClick={() => setPlaying((p) => !p)}>
              <span aria-hidden="true">{playing ? "❚❚" : "▶"}</span> Pause rotation
            </button>
            <button type="button" className="globe__control" aria-label="Zoom in" disabled={zoom >= 8} onClick={() => applyZoom(zoomRef.current * ZOOM_STEP)}>
              +
            </button>
            <button type="button" className="globe__control" aria-label="Zoom out" disabled={zoom <= 0.8} onClick={() => applyZoom(zoomRef.current / ZOOM_STEP)}>
              −
            </button>
          </div>
          <p id={helpId} className="globe__help">
            Drag to spin, pinch or scroll to zoom, tap a dot for details. With the globe focused, arrow keys rotate, + and − zoom, Enter selects the facility nearest the center.
          </p>
        </div>
        <div className="globe__side">
          <fieldset className="globe__legend">
            <legend>Show facilities by latest action</legend>
            <div className="globe__legend-items">
              {TONES.map((tone) => (
                <button key={tone} type="button" className={`globe__tone tone-${tone}`} aria-pressed={!hidden.has(tone)} onClick={() => toggleTone(tone)}>
                  <span className="globe__tone-icon" aria-hidden="true">
                    {TONE_COPY[tone].icon}
                  </span>
                  <span className="globe__tone-label">{TONE_COPY[tone].label}</span>
                  <span className="globe__tone-count">{formatNumber(toneCounts[tone])}</span>
                </button>
              ))}
            </div>
          </fieldset>
          {!selected && <p className="globe__hint muted">Select a dot or use the facility browser below to see inspection details.</p>}
          <FacilityBrowser facilities={facilities} selectedFei={selectedFei} onPick={pickFromBrowser} />
        </div>
      </div>
      <div className="visually-hidden" aria-live="polite" role="status" aria-label={`${label} announcements`}>
        {announcement}
      </div>
      <CountryTable facilities={facilities} />
    </div>
  );
}
