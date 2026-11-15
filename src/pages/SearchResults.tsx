import { useMemo, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { SEARCH_COPY } from "../content/copy";
import { useResource } from "../data/useResource";
import { AdvancedSearchForm, AdvancedSearchHelp } from "../components/search/AdvancedSearch";
import { Disclosure } from "../components/search/Disclosure";
import { FacetPanel } from "../components/search/FacetPanel";
import { Pagination } from "../components/search/Pagination";
import { ResultCard } from "../components/search/ResultCard";
import { DrugSearchForm, NdcSearchForm } from "../components/search/SearchForms";
import { useDocumentTitle } from "../components/search/useDocumentTitle";
import { ResourceView } from "../components/ui/States";
import { plural } from "../components/ui/format";
import { loadLabelIndex, type LabelStore } from "../search/labelStore";
import { applyFilters, buildFacets, sameFacilities, searchLabels, type FacetKey } from "../search/labels";
import { paginate } from "../search/pagination";
import { describeSearch, hasSearch, readLabelSearch, toggleFilterValue, writeLabelSearch, type LabelSearchState } from "../search/searchParams";
import "../components/search/search.css";

export const RESULTS_PER_PAGE = 24;
const MANY_RESULTS = 12;

export default function SearchResults() {
  const [params] = useSearchParams();
  const state = useMemo(() => readLabelSearch(params), [params]);
  const description = describeSearch(state);
  const searching = hasSearch(state);
  const store = useResource(loadLabelIndex, []);
  useDocumentTitle(searching ? description : state.advanced ? "Advanced search" : "Search");

  return (
    <div className="container page results-page">
      <header className="results-page__header">
        <p className="eyebrow">{state.advanced ? "Advanced search" : "Search results"}</p>
        <h1>{searching ? <>Results for {description}</> : state.advanced ? "Advanced search" : "Search drug labels"}</h1>
      </header>

      {state.advanced ? (
        <section className="advanced card" aria-label="Query builder">
          <AdvancedSearchForm key={state.q} initialQuery={state.q} />
          <Disclosure summary="How to use advanced search" defaultOpen={!searching}>
            <AdvancedSearchHelp />
          </Disclosure>
        </section>
      ) : (
        <Disclosure summary={searching ? "Edit your search" : "Search by drug name, company or NDC"} defaultOpen={!searching} className="edit-search card">
          <div className="edit-search__forms">
            <DrugSearchForm key={`${state.name}|${state.labeler}`} initialName={state.name} initialLabeler={state.labeler} compact />
            <NdcSearchForm key={state.ndc} initialNdc={state.ndc} compact />
          </div>
          <p>
            <Link to="/search?advanced=true">Advanced search</Link> · <Link to="/guided-search">Guided search</Link>
          </p>
        </Disclosure>
      )}

      {searching && (
        <ResourceView resource={store} label="Loading drug labels (this can take a moment)">
          {(data) => <Results store={data} state={state} />}
        </ResourceView>
      )}
    </div>
  );
}

function Results({ store, state }: { store: LabelStore; state: LabelSearchState }) {
  const [, setParams] = useSearchParams();
  const listTop = useRef<HTMLHeadingElement>(null);
  const { name, labeler, ndc, q } = state;
  const matches = useMemo(() => searchLabels(store.index, { name, labeler, ndc, q }), [store, name, labeler, ndc, q]);
  const facets = useMemo(() => buildFacets(matches), [matches]);
  const filtered = useMemo(() => applyFilters(matches, state.filters), [matches, state.filters]);
  const page = paginate(filtered, state.page, RESULTS_PER_PAGE);
  const description = describeSearch(state);

  const update = (patch: Partial<LabelSearchState>) => setParams(writeLabelSearch({ ...state, page: 1, ...patch }));
  const toggle = (key: FacetKey, value: string) => update({ filters: toggleFilterValue(state.filters, key, value) });
  const pageHref = (n: number) => `/search?${writeLabelSearch({ ...state, page: n }).toString()}`;

  if (!matches.length) {
    return (
      <section className="no-results card" aria-labelledby="no-results-heading">
        <p role="status" className="visually-hidden">
          0 results for {description}
        </p>
        <h2 id="no-results-heading">{SEARCH_COPY.noResults}</h2>
        <ul className="tick-list">
          <li>Check the spelling of the drug name. Try only the first word, such as “metformin” instead of “metformin HCl ER”.</li>
          <li>Try searching by NDC — the number formatted like 12345-6789-01 on your label.</li>
          <li>If you have two company names on the bottle, try the other one. The first word or two of the company name should be enough.</li>
          <li>Leave the company blank and narrow the results on the next page.</li>
        </ul>
        <p>
          <Link to="/guided-search">Start a new guided search</Link>
        </p>
      </section>
    );
  }

  return (
    <div className="results-layout">
      <aside className="results-layout__facets">
        <FacetPanel facets={facets} filters={state.filters} onToggle={toggle} onClear={() => update({ filters: {} })}
          footer={<p className="dosage-note">{SEARCH_COPY.dosageNote}</p>}
        />
      </aside>
      <section className="results-layout__main" aria-labelledby="results-heading">
        <h2 id="results-heading" ref={listTop} tabIndex={-1} className="visually-hidden">
          Matching drug labels
        </h2>
        <p className="results-count" role="status" aria-live="polite">
          {plural(filtered.length, "result")} for {description}
          {filtered.length !== matches.length && <span className="muted"> (filtered from {matches.length})</span>}
          {page.pageCount > 1 && (
            <span className="muted">
              {" "}
              · showing {page.start}–{page.end}
            </span>
          )}
        </p>
        <p className="chatter">{SEARCH_COPY.resultsChatter}</p>
        {filtered.length > MANY_RESULTS && <p className="note">{SEARCH_COPY.manyResults}</p>}
        {sameFacilities(filtered) && <p className="note note--good">{SEARCH_COPY.sameFactory}</p>}
        {filtered.length === 0 ? (
          <p className="card">No results match these filters. Try removing one.</p>
        ) : (
          <ul className="result-grid" aria-label="Search results">
            {page.items.map((label, i) => (
              <ResultCard key={label.id} label={label} index={i} />
            ))}
          </ul>
        )}
        <Pagination page={page.page} pageCount={page.pageCount} label="Results pages" hrefFor={pageHref} />
      </section>
    </div>
  );
}
