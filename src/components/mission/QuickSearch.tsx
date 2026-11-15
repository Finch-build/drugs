import { useId, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

export function QuickSearch() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const inputId = useId();
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const query = name.trim();
    if (query) navigate(`/search?name=${encodeURIComponent(query)}`);
  };
  return (
    <form className="quick-search" role="search" aria-label="Quick drug search" onSubmit={submit}>
      <label htmlFor={inputId} className="quick-search__label">
        Look up a generic drug
      </label>
      <div className="quick-search__row">
        <input id={inputId} className="input" name="name" placeholder="e.g. metformin" value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" />
        <button type="submit" className="btn">
          Search
        </button>
      </div>
      <p className="quick-search__hint">
        Have the bottle in hand? <Link to="/guided-search">Use the guided search</Link> to match your exact label.
      </p>
    </form>
  );
}
