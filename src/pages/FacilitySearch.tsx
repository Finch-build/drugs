import { useId, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { STATUS_COPY } from "../content/copy";
import { loadFacilities } from "../data/api";
import type { FacilitySummary } from "../data/types";
import { useResource } from "../data/useResource";
import { facilityHref, globeHref } from "../components/facility/FacilityCard";
import { Pagination } from "../components/search/Pagination";
import { useDocumentTitle } from "../components/search/useDocumentTitle";
import { ResourceView } from "../components/ui/States";
import { StatusBadge } from "../components/ui/StatusBadge";
import { formatDate, formatNumber, plural, titleCase } from "../components/ui/format";
import {
  DEFAULT_FACILITY_QUERY,
  FACILITY_SORTS,
  facilityFilterOptions,
  facilityLocation,
  readFacilityQuery,
  searchFacilities,
  writeFacilityQuery,
  type FacilityQuery,
} from "../search/facilities";
import { paginate } from "../search/pagination";
import "../components/search/search.css";
import "../components/facility/facility.css";

export const FACILITIES_PER_PAGE = 25;

export default function FacilitySearch() {
  useDocumentTitle("Facilities");
  const resource = useResource(loadFacilities, []);
  return (
    <div className="container page facility-search">
      <header>
        <p className="eyebrow">Facility search</p>
        <h1>Manufacturing facilities</h1>
        <p className="lede">
          Search the factories that make generic drugs sold in the U.S. and see what FDA inspectors found there. Filter by country, latest FDA action or the
          kind of work a facility does.
        </p>
      </header>
      <ResourceView resource={resource} label="Loading facilities">
        {(facilities) => <FacilityResults facilities={facilities} />}
      </ResourceView>
    </div>
  );
}

function FacilityResults({ facilities }: { facilities: FacilitySummary[] }) {
  const [params, setParams] = useSearchParams();
  const query = useMemo(() => readFacilityQuery(params), [params]);
  const options = useMemo(() => facilityFilterOptions(facilities), [facilities]);
  const results = useMemo(() => searchFacilities(facilities, query), [facilities, query]);
  const page = paginate(results, query.page, FACILITIES_PER_PAGE);
  const id = useId();

  const update = (patch: Partial<FacilityQuery>, replace = false) => setParams(writeFacilityQuery({ ...query, page: 1, ...patch }), { replace });
  const pageHref = (n: number) => {
    const search = writeFacilityQuery({ ...query, page: n }).toString();
    return search ? `/facilities?${search}` : "/facilities";
  };
  const filtered = writeFacilityQuery({ ...query, sort: "name", page: 1 }).toString() !== "";

  return (
    <>
      <form className="facility-filters card" role="search" aria-label="Filter facilities" onSubmit={(e) => e.preventDefault()}>
        <div className="field facility-filters__q">
          <label htmlFor={`${id}-q`}>Search facilities</label>
          <input
            id={`${id}-q`}
            className="input"
            type="search"
            value={query.q}
            onChange={(e) => update({ q: e.target.value }, true)}
            placeholder="Name, FEI, city or country"
            autoComplete="off"
          />
        </div>
        <div className="field">
          <label htmlFor={`${id}-country`}>Country</label>
          <select id={`${id}-country`} className="select" value={query.country} onChange={(e) => update({ country: e.target.value })}>
            <option value="">All countries</option>
            {options.countries.map((c) => (
              <option key={c.value} value={c.value}>
                {c.value} ({c.count})
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor={`${id}-status`}>Status</label>
          <select id={`${id}-status`} className="select" value={query.status} onChange={(e) => update({ status: e.target.value as FacilityQuery["status"] })}>
            <option value="">Any status</option>
            {options.statuses.map((s) => (
              <option key={s.value} value={s.value}>
                {STATUS_COPY[s.value].label} ({s.count})
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor={`${id}-operation`}>Operation</label>
          <select id={`${id}-operation`} className="select" value={query.operation} onChange={(e) => update({ operation: e.target.value })}>
            <option value="">Any operation</option>
            {options.operations.map((o) => (
              <option key={o.value} value={o.value}>
                {titleCase(o.value)} ({o.count})
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor={`${id}-sort`}>Sort by</label>
          <select id={`${id}-sort`} className="select" value={query.sort} onChange={(e) => update({ sort: e.target.value as FacilityQuery["sort"] })}>
            {FACILITY_SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        {filtered && (
          <button type="button" className="btn btn--ghost facility-filters__reset" onClick={() => setParams(writeFacilityQuery({ ...DEFAULT_FACILITY_QUERY, sort: query.sort }))}>
            Reset filters
          </button>
        )}
      </form>

      <p className="results-count" role="status" aria-live="polite">
        {plural(results.length, "facility", "facilities")}
        {results.length !== facilities.length && <span className="muted"> of {formatNumber(facilities.length)}</span>}
        {page.pageCount > 1 && (
          <span className="muted">
            {" "}
            · showing {page.start}–{page.end}
          </span>
        )}
      </p>

      {results.length === 0 ? (
        <p className="card">No facilities match. Try a shorter search or remove a filter.</p>
      ) : (
        <div className="table-scroll facility-table-wrap" tabIndex={0} role="region" aria-label="Facilities table">
          <table className="facility-table">
            <caption className="visually-hidden">Facilities matching your search, sorted by {FACILITY_SORTS.find((s) => s.value === query.sort)?.label}</caption>
            <thead>
              <tr>
                <th scope="col">Facility</th>
                <th scope="col">Latest FDA action</th>
                <th scope="col" className="num">
                  Inspections
                </th>
                <th scope="col" className="num">
                  OAI
                </th>
                <th scope="col" className="num">
                  Warning letters
                </th>
                <th scope="col" className="num">
                  Import alerts
                </th>
                <th scope="col" className="num">
                  Products
                </th>
              </tr>
            </thead>
            <tbody>
              {page.items.map((f) => (
                <tr key={f.fei}>
                  <th scope="row" data-label="Facility">
                    <Link to={facilityHref(f.fei)} className="facility-table__name">
                      {f.name}
                    </Link>
                    <span className="facility-table__place">{facilityLocation(f)}</span>
                    <span className="facility-table__fei">
                      FEI {f.fei} ·{" "}
                      <Link to={globeHref(f.fei)}>
                        globe<span className="visually-hidden"> view of {f.name}</span>
                      </Link>
                    </span>
                  </th>
                  <td data-label="Latest FDA action">
                    <StatusBadge status={f.status} />
                    <span className="facility-table__date">{formatDate(f.lastActionDate)}</span>
                    {f.seriousHistory && <span className="badge tone-bad">Serious history</span>}
                  </td>
                  <td className="num" data-label="Inspections">
                    {formatNumber(f.inspections)}
                  </td>
                  <td className="num" data-label="OAI">
                    {formatNumber(f.actions.OAI)}
                  </td>
                  <td className="num" data-label="Warning letters">
                    {formatNumber(f.warningLetters)}
                  </td>
                  <td className="num" data-label="Import alerts">
                    {formatNumber(f.importAlerts)}
                  </td>
                  <td className="num" data-label="Products">
                    {formatNumber(f.labels)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page.page} pageCount={page.pageCount} label="Facility pages" hrefFor={pageHref} />
    </>
  );
}
