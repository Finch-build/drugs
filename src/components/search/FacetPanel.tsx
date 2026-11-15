import { useId, useState, type ReactNode } from "react";
import { FACET_KEYS, type FacetKey, type Facets, type Filters } from "../../search/labels";

export const FACET_LABELS: Record<FacetKey, string> = {
  doses: "Dosage",
  forms: "Form",
  shapes: "Shape",
  colors: "Color",
  imprints: "Imprint",
  flavors: "Flavor",
  ndcs: "Product NDC",
  labelers: "Company",
};

const VISIBLE = 8;

interface FacetPanelProps {
  facets: Facets;
  filters: Filters;
  onToggle: (key: FacetKey, value: string) => void;
  onClear: () => void;
  footer?: ReactNode;
}

export function FacetPanel({ facets, filters, onToggle, onClear, footer }: FacetPanelProps) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const activeCount = FACET_KEYS.reduce((n, k) => n + (filters[k]?.length ?? 0), 0);
  const groups = FACET_KEYS.filter((k) => facets[k].length > 1 || (filters[k]?.length ?? 0) > 0);

  return (
    <section className={`facets ${open ? "is-open" : ""}`} aria-labelledby={`${id}-heading`}>
      <div className="facets__header">
        <h2 id={`${id}-heading`} className="facets__heading">
          Narrow your results
        </h2>
        <button type="button" className="btn btn--ghost facets__toggle" aria-expanded={open} aria-controls={`${id}-body`} onClick={() => setOpen((o) => !o)}>
          {open ? "Hide" : "Filters"}
          {activeCount > 0 && ` (${activeCount} active)`}
        </button>
      </div>
      <div id={`${id}-body`} className="facets__body">
        {activeCount > 0 && (
          <button type="button" className="btn btn--ghost facets__clear" onClick={onClear}>
            Clear filters
          </button>
        )}
        {groups.length === 0 && <p className="muted">No filters available for these results.</p>}
        {groups.map((key) => (
          <FacetGroup key={key} facetKey={key} values={facets[key]} selected={filters[key] ?? []} onToggle={onToggle} />
        ))}
        {footer}
      </div>
    </section>
  );
}

interface FacetGroupProps {
  facetKey: FacetKey;
  values: Facets[FacetKey];
  selected: string[];
  onToggle: (key: FacetKey, value: string) => void;
}

function FacetGroup({ facetKey, values, selected, onToggle }: FacetGroupProps) {
  const [expanded, setExpanded] = useState(false);
  const missingSelected = selected.filter((s) => !values.some((v) => v.value === s)).map((value) => ({ value, count: 0 }));
  const all = [...values, ...missingSelected];
  const shown = expanded ? all : all.filter((v, i) => i < VISIBLE || selected.includes(v.value));
  return (
    <fieldset className="facet">
      <legend>{FACET_LABELS[facetKey]}</legend>
      <ul>
        {shown.map((v) => (
          <li key={v.value}>
            <label className="check">
              <input type="checkbox" checked={selected.includes(v.value)} onChange={() => onToggle(facetKey, v.value)} />
              <span className="check__text">
                {v.value} <span className="check__count">({v.count})</span>
              </span>
            </label>
          </li>
        ))}
      </ul>
      {all.length > VISIBLE && (
        <button type="button" className="link-button" aria-expanded={expanded} onClick={() => setExpanded((e) => !e)}>
          {expanded ? "Show fewer" : `Show all ${all.length}`}
          <span className="visually-hidden"> {FACET_LABELS[facetKey].toLowerCase()} options</span>
        </button>
      )}
    </fieldset>
  );
}
