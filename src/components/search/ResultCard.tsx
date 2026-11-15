import { Link } from "react-router-dom";
import type { Label } from "../../data/types";
import { isRepackaged } from "../../search/timeline";
import { plural, titleCase } from "../ui/format";

export function labelHref(label: Pick<Label, "documentId" | "productNdc">): string {
  return `/labels/${encodeURIComponent(label.documentId)}/${encodeURIComponent(label.productNdc ?? "unknown")}`;
}

export function ResultCard({ label, index = 0 }: { label: Label; index?: number }) {
  const repack = isRepackaged(label);
  const appearance = [label.colors.map(titleCase).join(", "), label.shapes.map(titleCase).join(", ")].filter(Boolean).join(" · ");
  return (
    <li className="result-card card" style={{ animationDelay: `${Math.min(index, 12) * 30}ms` }}>
      <h3 className="result-card__title">
        <Link to={labelHref(label)} className="stretched-link">
          {titleCase(label.name)} {label.dose}
          <span className="visually-hidden">
            {" "}
            from {label.labeler}
            {label.productNdc ? `, NDC ${label.productNdc}` : ""}
          </span>
        </Link>
      </h3>
      <p className="result-card__labeler">{label.labeler}</p>
      {(repack || label.authorizedGeneric) && (
        <p className="result-card__badges">
          {repack && <span className="badge tone-neutral">Repackager</span>}
          {label.authorizedGeneric && <span className="badge tone-neutral">Authorized generic</span>}
        </p>
      )}
      <dl className="meta-list">
        {label.form && (
          <div>
            <dt>Form</dt>
            <dd>{titleCase(label.form)}</dd>
          </div>
        )}
        {label.productNdc && (
          <div>
            <dt>Product NDC</dt>
            <dd className="mono">{label.productNdc}</dd>
          </div>
        )}
        {label.imprints.length > 0 && (
          <div>
            <dt>Imprint</dt>
            <dd className="mono">{label.imprints.join(", ")}</dd>
          </div>
        )}
        {appearance && (
          <div>
            <dt>Appearance</dt>
            <dd>{appearance}</dd>
          </div>
        )}
      </dl>
      <p className={`result-card__facilities ${label.feis.length ? "" : "muted"}`}>
        <span aria-hidden="true">{label.feis.length ? "⌂ " : "○ "}</span>
        {label.feis.length ? `Made at ${plural(label.feis.length, "facility", "facilities")}` : "No facility found"}
      </p>
    </li>
  );
}
