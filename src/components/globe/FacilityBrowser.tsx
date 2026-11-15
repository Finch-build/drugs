import { useId, useMemo, useState } from "react";
import type { FacilitySummary } from "../../data/types";
import { formatNumber } from "../ui/format";
import { formatLocation, matchFacilities } from "./facilityIndex";

const LIMIT = 250;

export interface FacilityBrowserProps {
  facilities: FacilitySummary[];
  selectedFei: string | null;
  onPick: (fei: string) => void;
}

export function FacilityBrowser({ facilities, selectedFei, onPick }: FacilityBrowserProps) {
  const [query, setQuery] = useState("");
  const searchId = useId();
  const listId = useId();
  const countId = useId();
  const matches = useMemo(() => matchFacilities(facilities, query), [facilities, query]);
  const shown = matches.slice(0, LIMIT);
  const value = selectedFei && shown.some((f) => f.fei === selectedFei) ? selectedFei : "";

  return (
    <div className="globe-browser">
      <label htmlFor={searchId} className="globe-browser__label">
        Browse facilities on the map
      </label>
      <input
        id={searchId}
        type="search"
        className="input"
        placeholder="Name, city or country"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-describedby={countId}
        autoComplete="off"
      />
      <p id={countId} className="globe-browser__count muted" aria-live="polite">
        {matches.length > LIMIT ? `Showing first ${LIMIT} of ${formatNumber(matches.length)} matches` : `${formatNumber(matches.length)} matching facilities`}
      </p>
      <label htmlFor={listId} className="visually-hidden">
        Matching facilities
      </label>
      <select id={listId} className="select globe-browser__list" size={6} value={value} onChange={(e) => e.target.value && onPick(e.target.value)}>
        {shown.map((f) => (
          <option key={f.fei} value={f.fei}>
            {f.name} — {formatLocation(f)}
            {f.lat == null ? " (not mapped)" : ""}
          </option>
        ))}
      </select>
    </div>
  );
}
