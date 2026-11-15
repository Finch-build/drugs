import { useId, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import type { Label } from "../../data/types";
import { useResource } from "../../data/useResource";
import { loadLabelsById } from "../../search/labelStore";
import { paginate } from "../../search/pagination";
import { compileQuery, toHaystack } from "../../search/query";
import { Pagination } from "../search/Pagination";
import { labelHref } from "../search/ResultCard";
import { ResourceView } from "../ui/States";
import { plural, titleCase } from "../ui/format";

export const DRUGS_PER_PAGE = 20;

export function FacilityDrugs({ fei, labelIds }: { fei: string; labelIds: number[] }) {
  const resource = useResource(loadLabelsById, []);
  return (
    <section className="facility-drugs" aria-labelledby="drugs-heading">
      <h2 id="drugs-heading">Drugs linked to this facility</h2>
      {labelIds.length === 0 ? (
        <p className="card">No drug labels in this snapshot are linked to this facility.</p>
      ) : (
        <ResourceView resource={resource} label="Loading linked drugs">
          {(byId) => <DrugList fei={fei} labels={labelIds.map((id) => byId.get(id)).filter((l): l is Label => Boolean(l))} />}
        </ResourceView>
      )}
    </section>
  );
}

function DrugList({ fei, labels }: { fei: string; labels: Label[] }) {
  const [params, setParams] = useSearchParams();
  const filter = params.get("drugs") ?? "";
  const pageNumber = Number.parseInt(params.get("drugPage") ?? "1", 10);
  const id = useId();
  const sorted = useMemo(() => [...labels].sort((a, b) => a.name.localeCompare(b.name) || a.labeler.localeCompare(b.labeler)), [labels]);
  const matches = useMemo(() => {
    const matcher = filter.trim() ? compileQuery(filter) : null;
    return matcher ? sorted.filter((l) => matcher(toHaystack([l.name, l.ingredients, l.labeler, l.dose, l.form, l.productNdc]))) : sorted;
  }, [sorted, filter]);
  const page = paginate(matches, pageNumber, DRUGS_PER_PAGE);

  const hrefFor = (n: number) => {
    const next = new URLSearchParams(params);
    if (n > 1) next.set("drugPage", String(n));
    else next.delete("drugPage");
    const search = next.toString();
    return `/facilities/${encodeURIComponent(fei)}${search ? `?${search}` : ""}`;
  };

  const setFilter = (value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set("drugs", value);
    else next.delete("drugs");
    next.delete("drugPage");
    setParams(next, { replace: true, preventScrollReset: true });
  };

  return (
    <>
      <div className="field drug-filter">
        <label htmlFor={`${id}-filter`}>Filter drugs</label>
        <input id={`${id}-filter`} className="input" type="search" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Drug name, company or NDC" />
      </div>
      <p className="results-count" role="status" aria-live="polite">
        {plural(matches.length, "drug")}
        {matches.length !== labels.length && <span className="muted"> of {labels.length}</span>}
        {page.pageCount > 1 && (
          <span className="muted">
            {" "}
            · showing {page.start}–{page.end}
          </span>
        )}
      </p>
      {page.items.length > 0 && (
        <ul className="drug-list">
          {page.items.map((label) => (
            <li key={label.id}>
              <Link to={labelHref(label)}>
                {titleCase(label.name)} {label.dose}
              </Link>
              <span className="drug-list__meta">
                {[titleCase(label.form), label.labeler, label.productNdc ? `NDC ${label.productNdc}` : ""].filter(Boolean).join(" · ")}
              </span>
            </li>
          ))}
        </ul>
      )}
      <Pagination page={page.page} pageCount={page.pageCount} label="Linked drug pages" hrefFor={hrefFor} />
    </>
  );
}
