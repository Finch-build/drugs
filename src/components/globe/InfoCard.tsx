import { Link } from "react-router-dom";
import type { FacilitySummary } from "../../data/types";
import { formatDate, formatNumber } from "../ui/format";
import { StatusBadge } from "../ui/StatusBadge";
import { formatLocation } from "./facilityIndex";

export function InfoCard({ facility, onClose }: { facility: FacilitySummary; onClose: () => void }) {
  const stats: Array<[string, number]> = [
    ["Drug labels", facility.labels],
    ["Inspections", facility.inspections],
    ["Official action (OAI)", facility.actions.OAI],
    ["Form 483s", facility.letter483s],
    ["Warning letters", facility.warningLetters],
    ["Import alerts", facility.importAlerts],
  ];

  return (
    <article
      className="globe-card card"
      aria-labelledby={`globe-card-${facility.fei}`}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.stopPropagation();
          onClose();
        }
      }}
    >
      <div className="globe-card__head">
        <h3 id={`globe-card-${facility.fei}`} className="globe-card__title">
          {facility.name}
        </h3>
        <button type="button" className="globe-card__close" onClick={onClose} aria-label={`Close details for ${facility.name}`}>
          <span aria-hidden="true">×</span>
        </button>
      </div>
      <p className="globe-card__where">{formatLocation(facility) || "Location unknown"}</p>
      <div className="globe-card__meta">
        <StatusBadge status={facility.status} />
        {facility.lastActionDate && <p className="globe-card__date muted">Latest action {formatDate(facility.lastActionDate)}</p>}
      </div>
      <dl className="globe-card__stats">
        {stats.map(([term, value]) => (
          <div key={term} className={value > 0 && term !== "Drug labels" && term !== "Inspections" ? "is-notable" : undefined}>
            <dt>{term}</dt>
            <dd>{formatNumber(value)}</dd>
          </div>
        ))}
      </dl>
      <Link className="btn globe-card__link" to={`/facilities/${encodeURIComponent(facility.fei)}`}>
        Facility record<span className="visually-hidden">: {facility.name}</span>
      </Link>
    </article>
  );
}
