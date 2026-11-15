import { Link } from "react-router-dom";
import { pageNumbers } from "../../search/pagination";

interface PaginationProps {
  page: number;
  pageCount: number;
  label: string;
  hrefFor: (page: number) => string;
}

export function Pagination({ page, pageCount, label, hrefFor }: PaginationProps) {
  if (pageCount <= 1) return null;
  const pages = pageNumbers(page, pageCount);
  return (
    <nav className="pagination" aria-label={label}>
      <ul>
        <li>
          {page > 1 ? (
            <Link className="pagination__link" to={hrefFor(page - 1)} rel="prev">
              <span aria-hidden="true">←</span> Previous<span className="visually-hidden"> page</span>
            </Link>
          ) : (
            <span className="pagination__link is-disabled" aria-disabled="true">
              <span aria-hidden="true">←</span> Previous
            </span>
          )}
        </li>
        {pages.map((n, i) =>
          n === "gap" ? (
            <li key={`gap-${i}`} className="pagination__gap" aria-hidden="true">
              …
            </li>
          ) : (
            <li key={n}>
              <Link className="pagination__link pagination__number" to={hrefFor(n)} aria-current={n === page ? "page" : undefined}>
                <span className="visually-hidden">Page </span>
                {n}
              </Link>
            </li>
          ),
        )}
        <li>
          {page < pageCount ? (
            <Link className="pagination__link" to={hrefFor(page + 1)} rel="next">
              Next<span className="visually-hidden"> page</span> <span aria-hidden="true">→</span>
            </Link>
          ) : (
            <span className="pagination__link is-disabled" aria-disabled="true">
              Next <span aria-hidden="true">→</span>
            </span>
          )}
        </li>
      </ul>
    </nav>
  );
}
