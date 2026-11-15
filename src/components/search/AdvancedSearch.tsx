import { useId, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ADVANCED_SEARCH_HELP } from "../../content/copy";

export function AdvancedSearchForm({ initialQuery = "" }: { initialQuery?: string }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState(initialQuery);
  const [error, setError] = useState("");
  const id = useId();

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!query.trim()) {
      setError("Please enter a search query.");
      return;
    }
    setError("");
    navigate(`/search?${new URLSearchParams({ q: query.trim(), advanced: "true" }).toString()}`);
  }

  return (
    <form className="search-form search-form--advanced" onSubmit={submit} noValidate role="search" aria-label="Advanced label search">
      <div className="field">
        <label htmlFor={`${id}-q`}>Advanced search query</label>
        <input
          id={`${id}-q`}
          className="input mono"
          name="q"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder='"Teva Pharmaceuticals Usa" AND 20mg'
          autoComplete="off"
          aria-invalid={error ? true : undefined}
          aria-describedby={`${id}-hint${error ? ` ${id}-error` : ""}`}
        />
        <p className="hint" id={`${id}-hint`}>
          Searches every field: drug and ingredient names, company, dose, form, NDCs, imprints, colors, shapes and application numbers.
        </p>
      </div>
      {error && (
        <p className="form-error" id={`${id}-error`} role="alert">
          {error}
        </p>
      )}
      <button type="submit" className="btn">
        Search
      </button>
    </form>
  );
}

export function AdvancedSearchHelp() {
  return (
    <div className="table-scroll" tabIndex={0} role="region" aria-label="Search operators table">
      <table className="help-table">
        <caption>Search operators</caption>
        <thead>
          <tr>
            <th scope="col">Operator</th>
            <th scope="col">What it does</th>
            <th scope="col">Example</th>
          </tr>
        </thead>
        <tbody>
          {ADVANCED_SEARCH_HELP.map((row) => (
            <tr key={row.operator}>
              <td className="mono">{row.operator}</td>
              <td>{row.description}</td>
              <td>
                <code>{row.example}</code>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
