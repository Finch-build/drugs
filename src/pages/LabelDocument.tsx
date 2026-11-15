import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { loadLabels } from "../data/api";
import type { Label } from "../data/types";
import { useResource } from "../data/useResource";
import { labelHref } from "../components/search/ResultCard";
import { useDocumentTitle } from "../components/search/useDocumentTitle";
import { ResourceView } from "../components/ui/States";
import { plural, titleCase } from "../components/ui/format";
import { productsFor } from "../search/timeline";
import { dailyMedUrl, LabelNotFound } from "./LabelDetail";
import "../components/search/search.css";

export default function LabelDocument() {
  const { documentId = "" } = useParams();
  const resource = useResource(loadLabels, []);
  return (
    <div className="container page label-page">
      <ResourceView resource={resource} label="Loading drug label">
        {(labels) => <ProductList labels={labels} documentId={documentId} />}
      </ResourceView>
    </div>
  );
}

function ProductList({ labels, documentId }: { labels: Label[]; documentId: string }) {
  const products = useMemo(() => productsFor(labels, documentId), [labels, documentId]);
  const first = products[0];
  useDocumentTitle(first ? titleCase(first.name) : null);
  if (!first) return <LabelNotFound />;
  return (
    <>
      <header className="label-header">
        <p className="eyebrow">Drug label document</p>
        <h1>{titleCase(first.name)}</h1>
        <p className="lede">
          {first.labeler} · {plural(products.length, "product")} in this label
        </p>
      </header>
      <ul className="product-list">
        {products.map((p) => (
          <li key={p.id} className="card">
            <Link to={labelHref(p)}>
              {titleCase(p.name)} {p.dose} {titleCase(p.form)}
            </Link>
            <span className="muted mono"> NDC {p.productNdc}</span>
            <span className="muted"> · {p.feis.length ? plural(p.feis.length, "facility", "facilities") : "no facility found"}</span>
          </li>
        ))}
      </ul>
      <p>
        <a href={dailyMedUrl(documentId)} rel="noopener" target="_blank">
          View the full label on DailyMed<span className="visually-hidden"> (opens in a new tab)</span>
        </a>
      </p>
    </>
  );
}
