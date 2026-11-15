import { ACTION_COPY, STATUS_COPY } from "../../content/copy";
import type { FacilityStatus, InspectionAction } from "../../data/types";

const TONE_ICON = { good: "●", caution: "▲", bad: "■", neutral: "○" } as const;

export function StatusBadge({ status }: { status: FacilityStatus }) {
  const { label, tone } = STATUS_COPY[status];
  return (
    <span className={`badge tone-${tone}`}>
      <span aria-hidden="true">{TONE_ICON[tone]}</span>
      {label}
    </span>
  );
}

const ACTION_TONE: Record<InspectionAction, keyof typeof TONE_ICON> = { NAI: "good", VAI: "caution", OAI: "bad" };

export function ActionBadge({ action }: { action: InspectionAction }) {
  const tone = ACTION_TONE[action];
  return (
    <span className={`badge tone-${tone}`} title={ACTION_COPY[action].label}>
      <span aria-hidden="true">{TONE_ICON[tone]}</span>
      {action} <span className="visually-hidden">({ACTION_COPY[action].label})</span>
    </span>
  );
}
