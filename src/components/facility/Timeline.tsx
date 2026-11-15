import { useState } from "react";
import { ACTION_COPY, DOCUMENT_COPY } from "../../content/copy";
import { buildTimeline, cleanText, isIssue, type TimelineEntry } from "../../search/timeline";
import type { FacilityDetail } from "../../data/types";
import { Disclosure } from "../search/Disclosure";
import { ActionBadge } from "../ui/StatusBadge";
import { formatDate, plural } from "../ui/format";

export function FacilityTimeline({ detail }: { detail: FacilityDetail }) {
  const [onlyIssues, setOnlyIssues] = useState(false);
  const all = buildTimeline(detail);
  const entries = onlyIssues ? all.filter(isIssue) : all;
  return (
    <section className="timeline-section" aria-labelledby="timeline-heading">
      <div className="section-head">
        <h2 id="timeline-heading">FDA action history</h2>
        <label className="check check--switch">
          <input type="checkbox" checked={onlyIssues} onChange={(e) => setOnlyIssues(e.target.checked)} />
          <span>Only show issues</span>
        </label>
      </div>
      <p className="muted" role="status" aria-live="polite">
        {onlyIssues ? `${plural(entries.length, "action")} with issues out of ${all.length}` : `${plural(all.length, "action")}, newest first`}
      </p>
      {entries.length === 0 ? (
        <p className="card">{all.length ? "No issues documented in the available records." : "No FDA actions are recorded for this facility."}</p>
      ) : (
        <ol className="timeline" aria-label="FDA actions">
          {entries.map((entry, i) => (
            <TimelineItem key={entry.key} entry={entry} index={i} />
          ))}
        </ol>
      )}
    </section>
  );
}

const KIND_TONE: Record<TimelineEntry["kind"], string> = { inspection: "", letter483: "caution", warningLetter: "bad", importAlert: "bad" };

function entryTone(entry: TimelineEntry): string {
  if (entry.kind === "inspection") return { NAI: "good", VAI: "caution", OAI: "bad" }[entry.inspection.action];
  return KIND_TONE[entry.kind];
}

function TimelineItem({ entry, index }: { entry: TimelineEntry; index: number }) {
  const titleId = `${entry.key}-title`;
  const dateId = `${entry.key}-date`;
  return (
    <li className={`timeline__item tone-border-${entryTone(entry)}`} aria-labelledby={`${titleId} ${dateId}`} style={{ animationDelay: `${Math.min(index, 10) * 40}ms` }}>
      <span className="timeline__dot" aria-hidden="true" />
      <time id={dateId} className="timeline__date" dateTime={entry.date}>
        {formatDate(entry.date)}
      </time>
      <div className="timeline__body card">
        <EntryBody entry={entry} titleId={titleId} />
      </div>
    </li>
  );
}

function EntryBody({ entry, titleId }: { entry: TimelineEntry; titleId: string }) {
  switch (entry.kind) {
    case "inspection": {
      const { action, citations } = entry.inspection;
      return (
        <>
          <h3 id={titleId} className="timeline__title">
            Inspection: {ACTION_COPY[action].label}
          </h3>
          <p className="timeline__badges">
            <ActionBadge action={action} /> <span>{ACTION_COPY[action].short}</span>
          </p>
          {citations.length > 0 && (
            <Disclosure summary={plural(citations.length, "citation")}>
              <ul className="citations">
                {citations.map((c) => (
                  <li key={`${c.id}-${c.cfr}`}>
                    <p className="citations__head">
                      <code>{c.cfr}</code> <strong>{c.short}</strong>
                    </p>
                    <p>{c.long}</p>
                  </li>
                ))}
              </ul>
            </Disclosure>
          )}
        </>
      );
    }
    case "letter483":
      return (
        <>
          <h3 id={titleId} className="timeline__title">
            Form 483 issued
          </h3>
          <p className="muted">Inspectors documented issues observed during an inspection.</p>
          {!entry.letter.linkedToInspection && (
            <p className="note">This Form 483 is not linked to an inspection in the public inspection dashboard.</p>
          )}
          <p>
            <a href={entry.letter.url} rel="noopener" target="_blank">
              View Form 483 document<span className="visually-hidden"> from {formatDate(entry.date)} (PDF, opens in a new tab)</span>
            </a>
          </p>
        </>
      );
    case "warningLetter": {
      const letter = entry.letter;
      const subject = cleanText(letter.subject);
      return (
        <>
          <h3 id={titleId} className="timeline__title">
            {DOCUMENT_COPY.warningLetter.label}
          </h3>
          {subject && <p className="timeline__subject">{subject}</p>}
          <dl className="meta-list">
            <div>
              <dt>Addressed to</dt>
              <dd>{letter.company}</dd>
            </div>
            {letter.issuingOffice && (
              <div>
                <dt>Issuing office</dt>
                <dd>{letter.issuingOffice}</dd>
              </div>
            )}
          </dl>
          <ul className="link-row">
            <li>
              <a href={letter.url} rel="noopener" target="_blank">
                Read the warning letter<span className="visually-hidden"> (opens in a new tab)</span>
              </a>
            </li>
            {letter.closeoutUrl && (
              <li>
                <a href={letter.closeoutUrl} rel="noopener" target="_blank">
                  Close-out letter{letter.closeoutDate ? ` (${formatDate(letter.closeoutDate)})` : ""}
                  <span className="visually-hidden"> (opens in a new tab)</span>
                </a>
              </li>
            )}
            {!letter.closeoutUrl && letter.closeoutDate && <li>Closed out {formatDate(letter.closeoutDate)}</li>}
            {letter.responseUrl && (
              <li>
                <a href={letter.responseUrl} rel="noopener" target="_blank">
                  Company response<span className="visually-hidden"> (opens in a new tab)</span>
                </a>
              </li>
            )}
          </ul>
        </>
      );
    }
    case "importAlert": {
      const alert = entry.alert;
      return (
        <>
          <h3 id={titleId} className="timeline__title">
            {DOCUMENT_COPY.importAlert.label}
          </h3>
          <p className="timeline__badges">
            <span className={`badge ${alert.active ? "tone-bad" : "tone-good"}`}>
              <span aria-hidden="true">{alert.active ? "■" : "●"}</span>
              {alert.active ? "Active" : "Lifted"}
            </span>
          </p>
          <dl className="meta-list">
            <div>
              <dt>Started</dt>
              <dd>{formatDate(alert.startDate)}</dd>
            </div>
            <div>
              <dt>Last seen on list</dt>
              <dd>{formatDate(alert.lastSeen)}</dd>
            </div>
            {alert.company && (
              <div>
                <dt>Company</dt>
                <dd>{alert.company}</dd>
              </div>
            )}
          </dl>
          {alert.exemptedDrugs.length > 0 && (
            <Disclosure summary={plural(alert.exemptedDrugs.length, "exempted drug")}>
              <ul className="plain-list">
                {alert.exemptedDrugs.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            </Disclosure>
          )}
        </>
      );
    }
  }
}

export function Glossary() {
  return (
    <section className="glossary card" aria-labelledby="glossary-heading">
      <h2 id="glossary-heading">What these mean</h2>
      <dl>
        {(["NAI", "VAI", "OAI"] as const).map((action) => (
          <div key={action}>
            <dt>
              <ActionBadge action={action} /> {ACTION_COPY[action].label}
            </dt>
            <dd>{ACTION_COPY[action].body}</dd>
          </div>
        ))}
        {(["letter483", "warningLetter", "importAlert"] as const).map((key) => (
          <div key={key}>
            <dt>{DOCUMENT_COPY[key].label}</dt>
            <dd>{DOCUMENT_COPY[key].body}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
