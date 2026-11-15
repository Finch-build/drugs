import type { FacilityDetail, ImportAlert, Inspection, Label, Letter483, WarningLetter } from "../data/types";

export type TimelineEntry =
  | { kind: "inspection"; key: string; date: string; inspection: Inspection }
  | { kind: "letter483"; key: string; date: string; letter: Letter483 }
  | { kind: "warningLetter"; key: string; date: string; letter: WarningLetter }
  | { kind: "importAlert"; key: string; date: string; alert: ImportAlert };

export type TimelineKind = TimelineEntry["kind"];

const KIND_ORDER: Record<TimelineKind, number> = { inspection: 0, letter483: 1, warningLetter: 2, importAlert: 3 };

export function buildTimeline(detail: FacilityDetail): TimelineEntry[] {
  const entries: TimelineEntry[] = [
    ...detail.inspections.map((inspection): TimelineEntry => ({ kind: "inspection", key: `inspection-${inspection.id}`, date: inspection.date, inspection })),
    ...detail.letter483s.map((letter): TimelineEntry => ({ kind: "letter483", key: `483-${letter.id}`, date: letter.date, letter })),
    ...detail.warningLetters.map((letter): TimelineEntry => ({ kind: "warningLetter", key: `wl-${letter.id}`, date: letter.date, letter })),
    ...detail.importAlerts.map((alert): TimelineEntry => ({ kind: "importAlert", key: `ia-${alert.id}`, date: alert.startDate, alert })),
  ];
  return entries.sort((a, b) => b.date.localeCompare(a.date) || KIND_ORDER[a.kind] - KIND_ORDER[b.kind]);
}

export function isIssue(entry: TimelineEntry): boolean {
  return entry.kind !== "inspection" || entry.inspection.action !== "NAI";
}

export function cleanText(value: string | null | undefined): string {
  return (value ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export function isRepackaged(label: Pick<Label, "labelerRole">): boolean {
  return /repack|relabel/i.test(label.labelerRole ?? "");
}

export function productsFor(labels: Label[], documentId: string, productNdc?: string): Label[] {
  return labels.filter((l) => l.documentId === documentId && (productNdc === undefined || l.productNdc === productNdc));
}
