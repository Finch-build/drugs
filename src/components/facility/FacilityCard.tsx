import { Link } from "react-router-dom";
import type { FacilitySummary } from "../../data/types";
import { facilityLocation } from "../../search/facilities";
import { StatusBadge } from "../ui/StatusBadge";
import { formatDate, formatNumber } from "../ui/format";

export function facilityHref(fei: string): string {
  return `/facilities/${encodeURIComponent(fei)}`;
}

export function globeHref(fei: string): string {
  return `/?fei=${encodeURIComponent(fei)}`;
}

export function FacilityStats({ facility }: { facility: FacilitySummary }) {
  const stats: Array<[string, number, boolean]> = [
    ["Inspections", facility.inspections, false],
    ["Official action (OAI)", facility.actions.OAI, facility.actions.OAI > 0],
    ["Warning letters", facility.warningLetters, facility.warningLetters > 0],
    ["Form 483s", facility.letter483s, false],
    ["Import alerts", facility.importAlerts, facility.importAlerts > 0],
  ];
  return (
    <dl className="facility-stats">
      {stats.map(([label, value, flagged]) => (
        <div key={label} className={flagged ? "is-flagged" : undefined}>
          <dt>{label}</dt>
          <dd>{formatNumber(value)}</dd>
        </div>
      ))}
    </dl>
  );
}

interface FacilityCardProps {
  facility: FacilitySummary;
  headingLevel?: 2 | 3 | 4;
  activeIngredientOnly?: boolean;
}

export function FacilityCard({ facility, headingLevel = 3, activeIngredientOnly = false }: FacilityCardProps) {
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";
  const headingId = `facility-${facility.fei}`;
  return (
    <article className="facility-card card" aria-labelledby={headingId}>
      <Heading id={headingId} className="facility-card__name">
        <Link to={facilityHref(facility.fei)}>{facility.name}</Link>
      </Heading>
      <p className="facility-card__place">
        {facilityLocation(facility)} <span className="muted">· FEI {facility.fei}</span>
      </p>
      <p className="facility-card__status">
        <StatusBadge status={facility.status} />
        {facility.seriousHistory && <span className="badge tone-bad">Serious finding in history</span>}
        {activeIngredientOnly && <span className="badge tone-neutral">Active ingredient (API) maker</span>}
      </p>
      <p className="facility-card__date muted">Last inspection: {formatDate(facility.lastInspectionDate)}</p>
      <FacilityStats facility={facility} />
      <p className="facility-card__links">
        <Link to={facilityHref(facility.fei)}>
          Inspection history<span className="visually-hidden"> for {facility.name}</span>
        </Link>
        <Link to={globeHref(facility.fei)}>
          <span aria-hidden="true">◍ </span>Show on globe<span className="visually-hidden"> ({facility.name})</span>
        </Link>
      </p>
    </article>
  );
}
