export type InspectionAction = "NAI" | "VAI" | "OAI";
export type GeoPrecision = "postal" | "city" | "region" | "country";
export type FacilityStatus = "ok" | "vai" | "letter_483" | "oai" | "warning_letter" | "import_alert" | "unknown";

export interface Label {
  id: number;
  documentId: string;
  labeler: string;
  labelerRole: string | null;
  name: string;
  ingredients: string;
  form: string | null;
  dose: string | null;
  route: string | null;
  package: string | null;
  packageAmount: string | null;
  anda: string | null;
  nda: string | null;
  bla: string | null;
  productNdc: string | null;
  ndcs: string[];
  repackNdc: string | null;
  feis: string[];
  colors: string[];
  colorsLong: string[];
  shapes: string[];
  flavors: string[];
  imprints: string[];
  authorizedGeneric: boolean;
}

export interface ActionCounts {
  NAI: number;
  VAI: number;
  OAI: number;
}

export interface FacilitySummary {
  fei: string;
  name: string;
  registrant: string | null;
  city: string | null;
  state: string | null;
  country: string;
  countryCode: string | null;
  lat: number | null;
  lon: number | null;
  precision: GeoPrecision | null;
  operations: string[];
  status: FacilityStatus;
  lastActionDate: string | null;
  lastActionOk: boolean | null;
  seriousHistory: boolean;
  lastInspectionDate: string | null;
  actions: ActionCounts;
  inspections: number;
  citations: number;
  warningLetters: number;
  letter483s: number;
  importAlerts: number;
  labels: number;
}

export interface Address {
  entity: string;
  registrant: string | null;
  line1: string | null;
  line2: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  zip: string | null;
  duns: string | null;
  operations: string[];
  expirationDate: string | null;
}

export interface Citation {
  id: number;
  cfr: string;
  short: string;
  long: string;
}

export interface Inspection {
  id: number;
  date: string;
  year: number;
  action: InspectionAction;
  citations: Citation[];
}

export interface WarningLetter {
  id: number;
  date: string;
  company: string;
  subject: string | null;
  issuingOffice: string | null;
  url: string;
  closeoutDate: string | null;
  closeoutUrl: string | null;
  responseUrl: string | null;
}

export interface Letter483 {
  id: number;
  date: string;
  url: string;
  linkedToInspection: boolean;
}

export interface ImportAlert {
  id: number;
  company: string | null;
  startDate: string;
  lastSeen: string | null;
  active: boolean;
  exemptedDrugs: string[];
}

export interface FacilityDetail {
  summary: FacilitySummary;
  addresses: Address[];
  inspections: Inspection[];
  warningLetters: WarningLetter[];
  letter483s: Letter483[];
  importAlerts: ImportAlert[];
  labelIds: number[];
}

export interface CountryStat {
  code: string;
  name: string;
  facilities: number;
  labels: number;
  inspections: number;
  oai: number;
  warningLetters: number;
  importAlerts: number;
  flagged: number;
}

export interface YearActions extends ActionCounts {
  year: number;
}

export interface CountItem {
  key: string;
  label: string;
  count: number;
}

export interface Insights {
  byCountry: CountryStat[];
  inspectionsByYear: YearActions[];
  warningLettersByYear: Array<{ year: number; count: number }>;
  statusCounts: Record<FacilityStatus, number>;
  topCitations: CountItem[];
  topLabelers: CountItem[];
  topIngredients: CountItem[];
  forms: CountItem[];
  routes: CountItem[];
}

export interface Meta {
  crawledAt: string;
  builtAt: string;
  source: string;
  counts: {
    labels: number;
    labelsWithFacility: number;
    facilities: number;
    countries: number;
    inspections: number;
    citations: number;
    warningLetters: number;
    letter483s: number;
    importAlerts: number;
  };
}
