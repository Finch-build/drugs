import { useId, useMemo, useState } from "react";
import type { FacilitySummary } from "../../data/types";
import { formatNumber } from "../ui/format";
import { countryRows } from "./facilityIndex";

export function CountryTable({ facilities }: { facilities: FacilitySummary[] }) {
  const [open, setOpen] = useState(false);
  const regionId = useId();
  const rows = useMemo(() => countryRows(facilities), [facilities]);
  return (
    <div className="globe-table">
      <button type="button" className="btn btn--ghost" aria-expanded={open} aria-controls={regionId} onClick={() => setOpen((v) => !v)}>
        <span aria-hidden="true">{open ? "▾" : "▸"}</span> Facilities by country table
      </button>
      <div id={regionId} hidden={!open} className="globe-table__scroll" role="region" aria-label="Facilities by country" tabIndex={open ? 0 : -1}>
        {open && (
          <table>
            <caption>Facilities on the globe, by country</caption>
            <thead>
              <tr>
                <th scope="col">Country</th>
                <th scope="col" className="num">Facilities</th>
                <th scope="col" className="num">Mapped</th>
                <th scope="col" className="num">Serious action</th>
                <th scope="col" className="num">Drug labels</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.country}>
                  <th scope="row">{row.country}</th>
                  <td className="num">{formatNumber(row.facilities)}</td>
                  <td className="num">{formatNumber(row.mapped)}</td>
                  <td className="num">{formatNumber(row.serious)}</td>
                  <td className="num">{formatNumber(row.labels)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
