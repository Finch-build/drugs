import type { Address } from "../../data/types";
import { titleCase } from "../ui/format";

export function formatAddress(a: Address): string {
  const cityLine = [a.city, [a.state, a.zip].filter(Boolean).join(" ")].filter(Boolean).join(", ");
  return [a.line1, a.line2, cityLine, a.country].filter(Boolean).join(", ");
}

export function Registrations({ addresses }: { addresses: Address[] }) {
  if (!addresses.length) return null;
  return (
    <section aria-labelledby="registrations-heading">
      <h2 id="registrations-heading">Registration details</h2>
      <div className="table-scroll" tabIndex={0} role="region" aria-label="Registrations table, scrollable">
        <table className="registrations-table">
          <caption className="visually-hidden">Registrations</caption>
          <thead>
            <tr>
              <th scope="col">Entity</th>
              <th scope="col">Address</th>
              <th scope="col">DUNS</th>
              <th scope="col">Operations</th>
              <th scope="col">Registration expires</th>
            </tr>
          </thead>
          <tbody>
            {addresses.map((a, i) => (
              <tr key={`${a.entity}-${i}`}>
                <th scope="row">{a.entity}</th>
                <td>{formatAddress(a)}</td>
                <td className="mono">{a.duns ?? "—"}</td>
                <td>{a.operations.map(titleCase).join(", ") || "—"}</td>
                <td>{a.expirationDate ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
