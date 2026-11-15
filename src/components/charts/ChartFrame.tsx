import { useId, useState, type ReactNode } from "react";
import { useReducedMotion } from "../../theme/useReducedMotion";
import { useElementWidth } from "./useElementWidth";
import "./charts.css";

export type TableCell = string | number;

export interface ChartFrameProps {
  title: string;
  takeaway: string;
  columns: string[];
  rows: TableCell[][];
  legend?: ReactNode;
  headingLevel?: 2 | 3 | 4;
  className?: string;
  children: (width: number, animate: boolean) => ReactNode;
}

export function ChartFrame({ title, takeaway, columns, rows, legend, headingLevel = 3, className = "", children }: ChartFrameProps) {
  const [showTable, setShowTable] = useState(false);
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const reduced = useReducedMotion();
  const tableId = useId();
  const titleId = useId();
  const Heading = `h${headingLevel}` as const;

  return (
    <figure className={`chart ${className}`} aria-labelledby={titleId}>
      <figcaption className="chart__caption">
        <Heading id={titleId} className="chart__title">{title}</Heading>
        <p className="chart__takeaway">{takeaway}</p>
      </figcaption>
      {legend}
      <div ref={ref} className="chart__body">
        {children(width, !reduced)}
      </div>
      <button type="button" className="chart__table-toggle" aria-expanded={showTable} aria-controls={tableId} onClick={() => setShowTable((v) => !v)}>
        <span aria-hidden="true">{showTable ? "▾" : "▸"}</span> {showTable ? "Hide data table" : "Show data table"}
      </button>
      <div id={tableId} className="chart__table" hidden={!showTable} role="region" aria-label={`${title} data`} tabIndex={showTable ? 0 : -1}>
        {showTable && (
          <table>
            <caption className="visually-hidden">{title}</caption>
            <thead>
              <tr>
                {columns.map((column, index) => (
                  <th key={column} scope="col" className={index > 0 ? "num" : undefined}>
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={String(row[0])}>
                  {row.map((cell, index) =>
                    index === 0 ? (
                      <th key={index} scope="row">
                        {cell}
                      </th>
                    ) : (
                      <td key={index} className="num">
                        {cell}
                      </td>
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </figure>
  );
}
