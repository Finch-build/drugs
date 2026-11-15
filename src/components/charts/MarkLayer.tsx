import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";

export interface Mark {
  key: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  detail: ReactNode;
}

export interface MarkLayerProps {
  marks: Mark[];
  width: number;
  height: number;
  name: string;
  activeKey?: string | null;
  onActiveChange?: (key: string | null) => void;
}

const MIN_TARGET = 24;

export function MarkLayer({ marks, width, height, name, activeKey, onActiveChange }: MarkLayerProps) {
  const [internalActive, setInternalActive] = useState<string | null>(null);
  const [rovingKey, setRovingKey] = useState<string | null>(null);
  const buttons = useRef(new Map<string, HTMLButtonElement>());
  const active = activeKey !== undefined ? activeKey : internalActive;
  const setActive = (key: string | null) => {
    setInternalActive(key);
    onActiveChange?.(key);
  };
  const tabStop = rovingKey && marks.some((m) => m.key === rovingKey) ? rovingKey : marks[0]?.key;

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const moves: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1, Home: -Infinity, End: Infinity };
    if (event.key === "Escape") {
      setActive(null);
      return;
    }
    const move = moves[event.key];
    if (move === undefined) return;
    event.preventDefault();
    const next = Math.max(0, Math.min(marks.length - 1, Number.isFinite(move) ? index + move : move > 0 ? marks.length - 1 : 0));
    const key = marks[next].key;
    setRovingKey(key);
    buttons.current.get(key)?.focus();
  };

  const activeMark = marks.find((m) => m.key === active);

  return (
    <div className="marks" role="group" aria-label={`${name} data points`} style={{ width, height }}>
      {marks.map((mark, index) => {
        const w = Math.max(MIN_TARGET, mark.width);
        const h = Math.max(MIN_TARGET, mark.height);
        return (
          <button
            key={mark.key}
            ref={(node) => {
              if (node) buttons.current.set(mark.key, node);
              else buttons.current.delete(mark.key);
            }}
            type="button"
            className={`marks__target ${active === mark.key ? "is-active" : ""}`}
            tabIndex={mark.key === tabStop ? 0 : -1}
            aria-label={mark.label}
            style={{ left: mark.x + mark.width / 2 - w / 2, top: mark.y + mark.height / 2 - h / 2, width: w, height: h }}
            onPointerEnter={() => setActive(mark.key)}
            onPointerLeave={() => setActive(null)}
            onFocus={() => {
              setRovingKey(mark.key);
              setActive(mark.key);
            }}
            onBlur={() => setActive(null)}
            onClick={() => setActive(active === mark.key ? null : mark.key)}
            onKeyDown={(event) => onKeyDown(event, index)}
          />
        );
      })}
      {activeMark && <Tooltip mark={activeMark} width={width} />}
    </div>
  );
}

function Tooltip({ mark, width }: { mark: Mark; width: number }) {
  const tipWidth = Math.min(240, width);
  const center = mark.x + mark.width / 2;
  const left = Math.max(0, Math.min(width - tipWidth, center - tipWidth / 2));
  const above = mark.y > 56;
  return (
    <div
      className={`chart-tooltip ${above ? "chart-tooltip--above" : "chart-tooltip--below"}`}
      aria-hidden="true"
      style={{ left, width: tipWidth, top: above ? mark.y : mark.y + mark.height }}
    >
      {mark.detail}
    </div>
  );
}
