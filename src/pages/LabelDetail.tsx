import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { SEARCH_COPY } from "../content/copy";
import { loadFacilities, loadLabels } from "../data/api";
import type { FacilitySummary, Label } from "../data/types";
import { useResource } from "../data/useResource";
import { FacilityCard } from "../components/facility/FacilityCard";
import { useDocumentTitle } from "../components/search/useDocumentTitle";
import { ResourceView } from "../components/ui/States";
import { titleCase } from "../components/ui/format";
import { isRepackaged, productsFor } from "../search/timeline";
import "../components/search/search.css";
import "../components/facility/facility.css";

const loadLabelPage = () => Promise.all([loadLabels(), loadFacilities()]);

export function dailyMedUrl(documentId: string): string {
  return `https://dailymed.nlm.nih.gov/dailymed/lookup.cfm?setid=${encodeURIComponent(documentId)}`;
}

export default function LabelDetail() {
  const { documentId = "", ndc = "" } = useParams();
  const resource = useResource(loadLabelPage, []);
  return (
    <div className="container page label-page">
      <ResourceView resource={resource} label="Loading drug label">
        {([labels, facilities]) => <LabelProduct labels={labels} facilities={facilities} documentId={documentId} ndc={ndc} />}
      </ResourceView>
    </div>
  );
}

export function LabelNotFound() {
  useDocumentTitle("Label not found");
  return (
    <>
      <h1>Label not found</h1>
      <p>We couldn’t find that drug label in this snapshot of the data.</p>
      <p>
        <Link to="/guided-search" className="btn">
          Search for your drug
        </Link>
      </p>
    </>
  );
}

interface LabelProductProps {
  labels: Label[];
  facilities: FacilitySummary[];
  documentId: string;
  ndc: string;
}

function LabelProduct({ labels, facilities, documentId, ndc }: LabelProductProps) {
  const products = useMemo(() => productsFor(labels, documentId, ndc), [labels, documentId, ndc]);
  const siblings = useMemo(() => productsFor(labels, documentId), [labels, documentId]);
  const label = products[0];
  useDocumentTitle(label ? titleCase(label.name) : null);
  if (!label) return <LabelNotFound />;

  const unique = (values: Array<string | null>) => [...new Set(values.filter((v): v is string => Boolean(v)))];
  const packageNdcs = unique(products.flatMap((p) => p.ndcs));
  const feis = unique(products.flatMap((p) => p.feis));
  const byFei = new Map(facilities.map((f) => [f.fei, f]));
  const repack = isRepackaged(label);
  const repackNdcs = unique(products.map((p) => p.repackNdc));
  const colors = label.colorsLong.length ? label.colorsLong : label.colors;
  const application = [label.anda, label.nda, label.bla].filter(Boolean).join(", ");

  const facts: Array<[string, string | null]> = [
    ["Active ingredients", titleCase(label.ingredients)],
    ["Dosage", label.dose],
    ["Form", titleCase(label.form)],
    ["Route", titleCase(label.route)],
    ["Package", [titleCase(label.package), label.packageAmount ? `(${label.packageAmount})` : ""].filter(Boolean).join(" ")],
    ["Colors", colors.map(titleCase).join(", ")],
    ["Shapes", label.shapes.map(titleCase).join(", ")],
    ["Imprints", label.imprints.join(", ")],
    ["Flavors", label.flavors.map(titleCase).join(", ")],
    ["Application number", application],
    ["Product NDC", label.productNdc],
    ["Company on label", label.labeler],
  ];

  return (
    <>
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <ol>
          <li>
            <Link to="/guided-search">Find my drug</Link>
          </li>
          {siblings.length > 1 && (
            <li>
              <Link to={`/labels/${encodeURIComponent(documentId)}`}>All {siblings.length} products in this label</Link>
            </li>
          )}
          <li aria-current="page">{label.productNdc ?? ndc}</li>
        </ol>
      </nav>

      <header className="label-header">
        <p className="eyebrow">Drug label</p>
        <h1>{titleCase(label.name)}</h1>
        <p className="lede">
          {[label.dose, titleCase(label.form)].filter(Boolean).join(" ")} · {label.labeler}
        </p>
        <p className="label-header__badges">
          {repack && <span className="badge tone-neutral">Repackager</span>}
          {label.authorizedGeneric && <span className="badge tone-neutral">Authorized generic</span>}
        </p>
      </header>

      {repack && (
        <aside className="note note--caution" aria-label="Repackaged drug">
          <p>
            <strong>{SEARCH_COPY.repackaged}</strong> {label.labeler} repackages or relabels drugs made elsewhere.
          </p>
          {repackNdcs.length > 0 && (
            <p>
              Original product NDC:{" "}
              {repackNdcs.map((n) => (
                <code key={n}>{n}</code>
              ))}
            </p>
          )}
        </aside>
      )}

      <div className="label-layout">
        <section className="label-facts card" aria-labelledby="facts-heading">
          <h2 id="facts-heading">Drug facts</h2>
          <dl className="facts-list">
            {facts
              .filter(([, value]) => value)
              .map(([term, value]) => (
                <div key={term}>
                  <dt>{term}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
          </dl>
          <h3>Package NDCs</h3>
          <p className="muted">Check if your packaging has a number that matches one of the NDCs below.</p>
          <ul className="ndc-list">
            {packageNdcs.map((n) => (
              <li key={n}>
                <code>{n}</code>
              </li>
            ))}
          </ul>
          <p>
            <a href={dailyMedUrl(documentId)} rel="noopener" target="_blank">
              View the full label on DailyMed<span className="visually-hidden"> (opens in a new tab)</span>
            </a>
          </p>
        </section>

        <section className="label-facilities" aria-labelledby="facilities-heading">
          <h2 id="facilities-heading">Facilities that make this drug</h2>
          {feis.length === 0 ? (
            <p className="note">{SEARCH_COPY.noFacility}</p>
          ) : (
            <>
              <p className="muted">
                According to ProPublica’s records, this drug is linked to {feis.length === 1 ? "one facility" : `${feis.length} facilities`}. Each card shows
                the most recent FDA action.
              </p>
              <div className="facility-card-list">
                {feis.map((fei) => {
                  const facility = byFei.get(fei);
                  return facility ? (
                    <FacilityCard key={fei} facility={facility} />
                  ) : (
                    <article key={fei} className="facility-card card" aria-label={`Facility ${fei}`}>
                      <h3 className="facility-card__name">FEI {fei}</h3>
                      <p className="muted">No inspection details are available for this facility in the snapshot.</p>
                    </article>
                  );
                })}
              </div>
            </>
          )}
          <p className="medical-note">{SEARCH_COPY.medicalNote}</p>
        </section>
      </div>
    </>
  );
}
