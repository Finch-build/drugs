import { Link } from "react-router-dom";
import { SEARCH_COPY } from "../content/copy";
import { EXAMPLE_SEARCHES, searchHref } from "../components/search/examples";
import { DrugSearchForm, NdcSearchForm } from "../components/search/SearchForms";
import { useDocumentTitle } from "../components/search/useDocumentTitle";
import "../components/search/search.css";

export default function GuidedSearch() {
  useDocumentTitle("Find my drug");
  return (
    <div className="container page guided">
      <header className="guided__intro">
        <p className="eyebrow">Guided search</p>
        <h1>Where was your generic drug made?</h1>
        <p className="lede">
          Look up the manufacturing facilities behind a generic drug label, and what FDA inspectors found there — inspections, Form 483s, warning letters
          and import alerts.
        </p>
      </header>

      <ol className="steps">
        <li className="step card">
          <span className="step__number" aria-hidden="true">
            1
          </span>
          <div>
            <h2>Gather your information</h2>
            <p>
              Get the container or packaging your medication came in — the bottle, box, blister pack or pharmacy bag. You will need the drug name, the company
              listed on the label and, if you can find it, the National Drug Code (NDC).
            </p>
            <ul className="tick-list">
              <li>The drug name and dose, such as “Metformin HCl 500 mg”.</li>
              <li>The company after “MFR”, “MFG”, “Distributed by” or “Manufactured for”.</li>
              <li>A number formatted like “NDC 12345-6789-01”.</li>
            </ul>
          </div>
        </li>

        <li className="step card">
          <span className="step__number" aria-hidden="true">
            2
          </span>
          <div className="step__body">
            <h2>Search for your drug</h2>
            <p>{SEARCH_COPY.guidedIntro}</p>
            <DrugSearchForm />

            <div className="divider" role="separator" aria-hidden="true">
              <span>or</span>
            </div>

            <h3>Search by NDC</h3>
            <NdcSearchForm />
            <p className="privacy-note">
              <span aria-hidden="true">🔒 </span>We don’t store your data. Searches run entirely in your browser.
            </p>
          </div>
        </li>
      </ol>

      <section className="examples" aria-labelledby="examples-heading">
        <h2 id="examples-heading">Try an example</h2>
        <ul className="chip-list">
          {EXAMPLE_SEARCHES.map((example) => (
            <li key={example.text}>
              <Link className="chip" to={searchHref(example.params)}>
                {example.text}
              </Link>
            </li>
          ))}
        </ul>
        <p>
          Know exactly what you are looking for? Use <Link to="/search?advanced=true">advanced search</Link> with exact phrases, AND, OR and exclusions.
        </p>
      </section>
    </div>
  );
}
