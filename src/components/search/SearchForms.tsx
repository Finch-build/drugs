import { useId, useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { SEARCH_COPY } from "../../content/copy";
import { normalizeNdc } from "../../search/labels";
import { searchHref } from "./examples";

interface DrugSearchFormProps {
  initialName?: string;
  initialLabeler?: string;
  compact?: boolean;
}

export function DrugSearchForm({ initialName = "", initialLabeler = "", compact = false }: DrugSearchFormProps) {
  const navigate = useNavigate();
  const [name, setName] = useState(initialName);
  const [labeler, setLabeler] = useState(initialLabeler);
  const [error, setError] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);
  const id = useId();

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim() && !labeler.trim()) {
      setError("Please enter a drug name or company to search.");
      nameRef.current?.focus();
      return;
    }
    setError("");
    const params: Record<string, string> = {};
    if (name.trim()) params.name = name.trim();
    if (labeler.trim()) params.labeler = labeler.trim();
    navigate(searchHref(params));
  }

  const errorId = `${id}-error`;
  return (
    <form className={`search-form ${compact ? "search-form--compact" : ""}`} onSubmit={submit} noValidate role="search" aria-label="Search by drug name and company">
      <div className="search-form__fields">
        <div className="field">
          <label htmlFor={`${id}-name`}>Drug name</label>
          <input
            ref={nameRef}
            id={`${id}-name`}
            className="input"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Metformin"
            autoComplete="off"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
          />
        </div>
        <div className="field">
          <label htmlFor={`${id}-labeler`}>Company</label>
          <input
            id={`${id}-labeler`}
            className="input"
            name="labeler"
            value={labeler}
            onChange={(e) => setLabeler(e.target.value)}
            placeholder="e.g. Zydus"
            autoComplete="off"
            aria-describedby={compact ? undefined : `${id}-labeler-hint`}
          />
          {!compact && (
            <p className="hint" id={`${id}-labeler-hint`}>
              {SEARCH_COPY.companyHelp}
            </p>
          )}
        </div>
      </div>
      {error && (
        <p className="form-error" id={errorId} role="alert">
          {error}
        </p>
      )}
      <button type="submit" className="btn">
        Search
      </button>
    </form>
  );
}

export function NdcSearchForm({ initialNdc = "", compact = false }: { initialNdc?: string; compact?: boolean }) {
  const navigate = useNavigate();
  const [ndc, setNdc] = useState(initialNdc);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const id = useId();

  function submit(event: FormEvent) {
    event.preventDefault();
    const normalized = normalizeNdc(ndc);
    if (!normalized.replace(/-/g, "")) {
      setError("Please enter an NDC, for example 12345-6789-01.");
      inputRef.current?.focus();
      return;
    }
    setError("");
    navigate(searchHref({ ndc: normalized }));
  }

  const errorId = `${id}-error`;
  const describedBy = [compact ? "" : `${id}-hint`, error ? errorId : ""].filter(Boolean).join(" ") || undefined;
  return (
    <form className="search-form search-form--ndc" onSubmit={submit} noValidate role="search" aria-label="Search by NDC">
      <div className="field">
        <label htmlFor={`${id}-ndc`}>NDC (National Drug Code)</label>
        <input
          ref={inputRef}
          id={`${id}-ndc`}
          className="input"
          name="ndc"
          inputMode="numeric"
          value={ndc}
          onChange={(e) => setNdc(e.target.value)}
          placeholder="12345-6789-01"
          autoComplete="off"
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
        />
        {!compact && (
          <p className="hint" id={`${id}-hint`}>
            {SEARCH_COPY.ndcHelp}
          </p>
        )}
      </div>
      {error && (
        <p className="form-error" id={errorId} role="alert">
          {error}
        </p>
      )}
      <button type="submit" className="btn">
        Search by NDC
      </button>
    </form>
  );
}
