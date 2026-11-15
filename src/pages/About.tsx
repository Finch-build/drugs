import { Link } from "react-router-dom";
import { ACTION_COPY, DOCUMENT_COPY, SOURCE, STATUS_COPY } from "../content/copy";
import { loadMeta } from "../data/api";
import type { Meta } from "../data/types";
import { useResource } from "../data/useResource";
import { useDocumentTitle } from "../components/search/useDocumentTitle";
import { ResourceView } from "../components/ui/States";
import { ActionBadge, StatusBadge } from "../components/ui/StatusBadge";
import { formatDate, formatNumber } from "../components/ui/format";
import "../components/search/search.css";

const COUNT_LABELS: Array<[keyof Meta["counts"], string]> = [
  ["labels", "Drug labels"],
  ["labelsWithFacility", "Labels linked to a facility"],
  ["facilities", "Manufacturing facilities"],
  ["countries", "Countries"],
  ["inspections", "FDA inspections"],
  ["citations", "Citations"],
  ["letter483s", "Form 483s"],
  ["warningLetters", "Warning letters"],
  ["importAlerts", "Import alerts"],
];

export default function About() {
  useDocumentTitle("About");
  const meta = useResource(loadMeta, []);
  return (
    <div className="container page about prose">
      <header>
        <p className="eyebrow">About</p>
        <h1>About Rx Mission Control</h1>
        <p className="lede">
          Rx Mission Control is an independent, open-source re-creation of ProPublica’s{" "}
          <a href={SOURCE.url} rel="noopener">
            {SOURCE.name}
          </a>
          , built on a static snapshot of its data. It connects generic drug labels to the factories that make them, and those factories to their FDA
          inspection history.
        </p>
      </header>

      <section aria-labelledby="snapshot-heading">
        <h2 id="snapshot-heading">The data snapshot</h2>
        <ResourceView resource={meta} label="Loading snapshot details">
          {(data) => (
            <>
              <p>
                Data collected on <strong>{formatDate(data.crawledAt)}</strong> and built on {formatDate(data.builtAt)}. Records may have changed since; check
                the original tool for the latest information.
              </p>
              <dl className="stat-strip">
                {COUNT_LABELS.map(([key, label]) => (
                  <div key={key} className="stat-strip__item">
                    <dt>{label}</dt>
                    <dd>{formatNumber(data.counts[key])}</dd>
                  </div>
                ))}
              </dl>
            </>
          )}
        </ResourceView>
      </section>

      <section aria-labelledby="method-heading">
        <h2 id="method-heading">Methodology</h2>
        <p>
          ProPublica matched drug labels from the National Library of Medicine’s DailyMed database to manufacturing facilities using FDA drug establishment
          registrations and application data, then attached each facility’s FDA Establishment Identifier (FEI) to inspection classifications from the FDA
          Data Dashboard, Form 483s obtained through public records requests, warning letters and drug-related import alerts.
        </p>
        <p>
          Links between a label and a facility are ProPublica’s best reconstruction from public records, not an official FDA list. Some labels could not be
          connected to any facility; others may list facilities that make only part of a product. This site does not add new matching; it presents
          ProPublica’s published results.
        </p>
        <p>
          Read ProPublica’s full{" "}
          <a href={SOURCE.methodology} rel="noopener">
            Rx Inspector methodology
          </a>{" "}
          and the{" "}
          <a href={SOURCE.series} rel="noopener">
            Rx Roulette series
          </a>
          .
        </p>
      </section>

      <section aria-labelledby="how-heading">
        <h2 id="how-heading">How to use it</h2>
        <ol>
          <li>
            Use <Link to="/guided-search">Find my drug</Link> with the drug name and company from your label, or search by NDC.
          </li>
          <li>Narrow the results with dosage, form, color, shape and imprint until you find your exact product.</li>
          <li>Open the product to see which facilities make it and their most recent FDA action.</li>
          <li>Open a facility for its full timeline of inspections, Form 483s, warning letters and import alerts.</li>
          <li>
            Explore every facility on the <Link to="/">Mission Control globe</Link> or browse the <Link to="/facilities">facility list</Link>.
          </li>
        </ol>
      </section>

      <section aria-labelledby="glossary-heading">
        <h2 id="glossary-heading">Glossary</h2>
        <dl className="glossary-list">
          {(["NAI", "VAI", "OAI"] as const).map((action) => (
            <div key={action}>
              <dt>
                <ActionBadge action={action} /> {ACTION_COPY[action].label}
              </dt>
              <dd>{ACTION_COPY[action].body}</dd>
            </div>
          ))}
          {(["letter483", "warningLetter", "importAlert"] as const).map((key) => (
            <div key={key}>
              <dt>{DOCUMENT_COPY[key].label}</dt>
              <dd>{DOCUMENT_COPY[key].body}</dd>
            </div>
          ))}
          <div>
            <dt>FEI</dt>
            <dd>The FDA Establishment Identifier, a unique number the FDA assigns to each facility it regulates.</dd>
          </div>
          <div>
            <dt>NDC</dt>
            <dd>The National Drug Code, a unique 10- or 11-digit identifier for a drug product and package.</dd>
          </div>
        </dl>
        <h3>Facility status badges</h3>
        <ul className="badge-list">
          {(Object.keys(STATUS_COPY) as Array<keyof typeof STATUS_COPY>).map((status) => (
            <li key={status}>
              <StatusBadge status={status} />
            </li>
          ))}
        </ul>
        <p>Badges always combine a shape and a text label, so meaning never relies on color alone.</p>
      </section>

      <section aria-labelledby="globe-heading">
        <h2 id="globe-heading">About the map locations</h2>
        <p>
          Facilities are placed on the globe by geocoding their registered address. Location precision varies: some points are exact to a postal code,
          others to a city, a region or only the country. Facility pages always show the full registered address.
        </p>
      </section>

      <section aria-labelledby="a11y-heading">
        <h2 id="a11y-heading">Accessibility</h2>
        <p>We aim to meet WCAG 2.2 AA. In particular:</p>
        <ul>
          <li>Every page works with a keyboard alone, with a skip link and visible focus indicators.</li>
          <li>Animations are subtle and switch off when your system asks for reduced motion.</li>
          <li>Charts and the globe have screen reader alternatives, including data tables and text lists.</li>
          <li>Search result counts and filter changes are announced to assistive technology.</li>
          <li>Two themes are available: a standard news-style theme and a high-contrast ASCII terminal theme, switchable from the header.</li>
          <li>Layouts adapt from small phones to large desktops without horizontal scrolling.</li>
        </ul>
        <p>
          Found a barrier? Please{" "}
          <a href="https://github.com/Finch-build/drugs/issues" rel="noopener">
            open an issue
          </a>
          .
        </p>
      </section>

      <section aria-labelledby="credits-heading">
        <h2 id="credits-heading">Credits</h2>
        <ul>
          <li>
            Data and reporting: <a href={SOURCE.url}>{SOURCE.name}</a> by {SOURCE.authors}, ProPublica.
          </li>
          <li>ASCII rendering: ascii.rest by @bas3line (MIT License).</li>
          <li>
            Geocoding: <a href="https://www.geonames.org/">GeoNames</a>, licensed under CC BY 4.0.
          </li>
          <li>Map shapes: Natural Earth, via the world-atlas package.</li>
        </ul>
        <p className="muted">
          This site is not affiliated with or endorsed by ProPublica or the FDA. It does not provide medical advice; please consult your doctor before
          changing medication.
        </p>
      </section>
    </div>
  );
}
