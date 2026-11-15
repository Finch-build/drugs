import { Link, useParams } from "react-router-dom";
import { loadFacility } from "../data/api";
import type { FacilityDetail as FacilityDetailData } from "../data/types";
import { useResource } from "../data/useResource";
import { globeHref } from "../components/facility/FacilityCard";
import { FacilityDrugs } from "../components/facility/FacilityDrugs";
import { formatAddress, Registrations } from "../components/facility/Registrations";
import { FacilityTimeline, Glossary } from "../components/facility/Timeline";
import { useDocumentTitle } from "../components/search/useDocumentTitle";
import { ErrorState, Loading } from "../components/ui/States";
import { StatusBadge } from "../components/ui/StatusBadge";
import { formatDate, formatNumber, titleCase } from "../components/ui/format";
import { facilityLocation } from "../search/facilities";
import "../components/search/search.css";
import "../components/facility/facility.css";

export default function FacilityDetail() {
  const { fei = "" } = useParams();
  const resource = useResource(() => loadFacility(fei), [fei]);
  return (
    <div className="container page facility-page">
      {resource.status === "loading" && <Loading label="Loading facility" />}
      {resource.status === "error" && (/\(404\)/.test(resource.error.message) ? <FacilityNotFound fei={fei} /> : <ErrorState error={resource.error} />)}
      {resource.status === "ready" && <FacilityView detail={resource.data} />}
    </div>
  );
}

function FacilityNotFound({ fei }: { fei: string }) {
  useDocumentTitle("Facility not found");
  return (
    <>
      <h1>Facility not found</h1>
      <p>There is no facility with FEI number “{fei}” in this snapshot of the data.</p>
      <p>
        <Link className="btn" to="/facilities">
          Search facilities
        </Link>
      </p>
    </>
  );
}

function FacilityView({ detail }: { detail: FacilityDetailData }) {
  const { summary } = detail;
  useDocumentTitle(summary.name);
  const address = detail.addresses[0] ? formatAddress(detail.addresses[0]) : facilityLocation(summary);
  const stats: Array<[string, number]> = [
    ["Inspections", summary.inspections],
    ["No action (NAI)", summary.actions.NAI],
    ["Voluntary action (VAI)", summary.actions.VAI],
    ["Official action (OAI)", summary.actions.OAI],
    ["Citations", summary.citations],
    ["Form 483s", summary.letter483s],
    ["Warning letters", summary.warningLetters],
    ["Import alerts", summary.importAlerts],
    ["Linked drugs", summary.labels],
  ];

  return (
    <>
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <ol>
          <li>
            <Link to="/facilities">Facilities</Link>
          </li>
          <li aria-current="page">FEI {summary.fei}</li>
        </ol>
      </nav>
      <header className="facility-header">
        <p className="eyebrow">Manufacturing facility</p>
        <h1>{summary.name}</h1>
        <p className="facility-header__ids">
          <span className="mono">FEI {summary.fei}</span>
          {summary.registrant && summary.registrant !== summary.name && <span> · Registrant: {summary.registrant}</span>}
        </p>
        <address className="facility-header__address">{address}</address>
        <p className="facility-header__badges">
          <StatusBadge status={summary.status} />
          {summary.seriousHistory && (
            <span className="badge tone-bad">
              <span aria-hidden="true">!</span> Serious finding in history
            </span>
          )}
        </p>
        <p className="facility-header__meta">
          Last FDA action: {formatDate(summary.lastActionDate)} · Operations: {summary.operations.map(titleCase).join(", ") || "—"}
        </p>
        <p>
          <Link className="btn btn--ghost" to={globeHref(summary.fei)}>
            <span aria-hidden="true">◍</span> Show on globe
          </Link>
        </p>
      </header>

      <section aria-label="Summary statistics">
        <dl className="stat-strip">
          {stats.map(([label, value]) => (
            <div key={label} className="stat-strip__item">
              <dt>{label}</dt>
              <dd>{formatNumber(value)}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="facility-layout">
        <FacilityTimeline detail={detail} />
        <Glossary />
      </div>
      <Registrations addresses={detail.addresses} />
      <FacilityDrugs fei={summary.fei} labelIds={detail.labelIds} />
    </>
  );
}
