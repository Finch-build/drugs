export type PatternKind = "solid" | "hatch" | "dots";

export interface BarDatum {
  key: string;
  label: string;
  value: number;
}

export interface SeriesDef {
  key: string;
  label: string;
  color: string;
  pattern?: PatternKind;
}

export interface MultiDatum {
  key: string;
  label: string;
  values: Partial<Record<string, number>>;
}

export type ValueFormatter = (value: number) => string;
