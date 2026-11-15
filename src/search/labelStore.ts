import { loadLabels } from "../data/api";
import type { Label } from "../data/types";
import { createLabelIndex, type LabelIndex } from "./labels";

export interface LabelStore {
  labels: Label[];
  index: LabelIndex;
}

const stores = new WeakMap<Label[], LabelStore>();
const idMaps = new WeakMap<Label[], Map<number, Label>>();

export async function loadLabelIndex(): Promise<LabelStore> {
  const labels = await loadLabels();
  let store = stores.get(labels);
  if (!store) {
    store = { labels, index: createLabelIndex(labels) };
    stores.set(labels, store);
  }
  return store;
}

export async function loadLabelsById(): Promise<Map<number, Label>> {
  const labels = await loadLabels();
  let byId = idMaps.get(labels);
  if (!byId) {
    byId = new Map(labels.map((l) => [l.id, l]));
    idMaps.set(labels, byId);
  }
  return byId;
}
