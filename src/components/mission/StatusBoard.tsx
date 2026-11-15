import type { FacilityStatus } from "../../data/types";
import { percent } from "../charts/scales";
import { formatNumber } from "../ui/format";
import { StatusBadge } from "../ui/StatusBadge";
import { STATUS_COPY } from "../../content/copy";

const ORDER: FacilityStatus[] = ["import_alert", "warning_letter", "oai", "letter_483", "vai", "ok", "unknown"];

export function StatusBoard({ statusCounts }: { statusCounts: Record<FacilityStatus, number> }) {
  const total = ORDER.reduce((sum, s) => sum + (statusCounts[s] ?? 0), 0);
  const top = Math.max(1, ...ORDER.map((s) => statusCounts[s] ?? 0));
  return (
    <table className="status-board">
      <caption className="visually-hidden">Facilities by latest FDA action</caption>
      <thead className="visually-hidden">
        <tr>
          <th scope="col">Latest action</th>
          <th scope="col">Facilities</th>
          <th scope="col">Share</th>
        </tr>
      </thead>
      <tbody>
        {ORDER.map((status, index) => {
          const count = statusCounts[status] ?? 0;
          return (
            <tr key={status}>
              <th scope="row">
                <StatusBadge status={status} />
              </th>
              <td>
                <div className="status-board__bar-cell">
                <span className="status-board__count">{formatNumber(count)}</span>
                <span className="status-board__track" aria-hidden="true">
                  <span
                    className={`status-board__bar tone-${STATUS_COPY[status].tone}`}
                    style={{ width: `${(count / top) * 100}%`, animationDelay: `${index * 70}ms` }}
                  />
                </span>
                </div>
              </td>
              <td className="num status-board__share">{percent(count, total)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
