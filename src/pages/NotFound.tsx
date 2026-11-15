import { Link } from "react-router-dom";
import { useDocumentTitle } from "../components/search/useDocumentTitle";

export default function NotFound() {
  useDocumentTitle("Page not found");
  return (
    <div className="container page not-found">
      <p className="eyebrow">Error 404</p>
      <h1>Page not found</h1>
      <p>We couldn’t find that page. It may have moved, or the link may be mistyped.</p>
      <ul className="link-row">
        <li>
          <Link className="btn" to="/">
            Go to Mission Control
          </Link>
        </li>
        <li>
          <Link className="btn btn--ghost" to="/guided-search">
            Find my drug
          </Link>
        </li>
        <li>
          <Link className="btn btn--ghost" to="/facilities">
            Search facilities
          </Link>
        </li>
      </ul>
    </div>
  );
}
