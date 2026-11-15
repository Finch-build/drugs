import { useState } from "react";
import { Link } from "react-router-dom";
import type { FacilitySummary } from "../../data/types";
import { useReducedMotion } from "../../theme/useReducedMotion";
import { formatDate } from "../ui/format";
import { StatusBadge } from "../ui/StatusBadge";
import { formatLocation } from "../globe/facilityIndex";

export function FlaggedTicker({ facilities }: { facilities: FacilitySummary[] }) {
  const reduced = useReducedMotion();
  const [paused, setPaused] = useState(false);
  const moving = !reduced && facilities.length > 1;
  if (facilities.length === 0) return <p className="muted">No facilities currently flagged.</p>;

  return (
    <div className={`ticker ${moving ? "ticker--moving" : "ticker--static"} ${paused ? "is-paused" : ""}`}>
      {moving && (
        <button type="button" className="ticker__pause" aria-pressed={paused} onClick={() => setPaused((p) => !p)}>
          <span aria-hidden="true">{paused ? "▶" : "❚❚"}</span> Pause ticker
        </button>
      )}
      <div className="ticker__viewport">
        <div className="ticker__track" style={{ animationDuration: `${Math.max(30, facilities.length * 6)}s` }}>
          <ul className="ticker__list" aria-label="Recently flagged facilities">
            {facilities.map((f) => (
              <li key={f.fei} className="ticker__item">
                <StatusBadge status={f.status} />
                <Link to={`/?fei=${encodeURIComponent(f.fei)}`} className="ticker__name">
                  {f.name}
                </Link>
                <span className="ticker__meta">
                  {formatLocation(f)} · {formatDate(f.lastActionDate)}
                </span>
              </li>
            ))}
          </ul>
          {moving && (
            <ul className="ticker__list" aria-hidden="true">
              {facilities.map((f) => (
                <li key={f.fei} className="ticker__item">
                  <StatusBadge status={f.status} />
                  <span className="ticker__name">{f.name}</span>
                  <span className="ticker__meta">
                    {formatLocation(f)} · {formatDate(f.lastActionDate)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
