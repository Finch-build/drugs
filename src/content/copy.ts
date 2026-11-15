import type { FacilityStatus, InspectionAction } from "../data/types";

export const ACTION_COPY: Record<InspectionAction, { label: string; short: string; body: string }> = {
  NAI: {
    label: "No action indicated",
    short: "Acceptable state",
    body: "This is common and the best possible outcome for an inspection. This means the FDA took no compliance action and ProPublica found no issues documented by inspectors. That doesn’t always mean no issues turned up. Sometimes, inspectors address concerns with management on site that they believe do not need to be documented on a 483.",
  },
  VAI: {
    label: "Voluntary action indicated",
    short: "Some issues found, but no further FDA action",
    body: "This is very common. It means the FDA found issues but determined the facility can correct them voluntarily. In some cases, inspectors may have recommended a different (potentially more serious) classification, but the agency declined to pursue further enforcement at the time.",
  },
  OAI: {
    label: "Official action indicated",
    short: "Unacceptable state of compliance",
    body: "This means inspectors found serious issues at the facility and the agency ultimately recommended official compliance action. In cases like this, the FDA typically pauses the facility’s pending drug approvals.",
  },
};

export const DOCUMENT_COPY = {
  warningLetter: {
    label: "Warning letter",
    body: "This is a disciplinary tool the FDA uses to lay out significant violations of federal requirements. The company has an opportunity to respond and/or provide its plans to correct the issues. The agency might later issue a “close-out letter” to say it has confirmed that issues raised in a previous warning letter were fixed. But that doesn’t always happen.",
  },
  importAlert: {
    label: "Import alert",
    body: "This is rare and means drugs from this facility were banned from coming into the U.S. Specifically we are including alerts relating to FDA manufacturing standards for drug products. The agency sometimes exempts certain drugs from import bans, ostensibly to prevent drug shortages.",
  },
  letter483: {
    label: "Inspector documented issues (Form 483)",
    body: "Inspectors can file notes summarizing deficiencies observed during an inspection using a 483 form. In some cases, we’re unable to connect a Form 483 to an FDA inspection designation, but we show that an inspector filed this form, perhaps as part of an inspection that was not included in the public inspection dashboard.",
  },
};

export const STATUS_COPY: Record<FacilityStatus, { label: string; tone: "good" | "caution" | "bad" | "neutral" }> = {
  ok: { label: "Last action: acceptable", tone: "good" },
  vai: { label: "Last action: issues found (VAI)", tone: "caution" },
  letter_483: { label: "Last action: Form 483 issued", tone: "caution" },
  oai: { label: "Last action: official action (OAI)", tone: "bad" },
  warning_letter: { label: "Last action: warning letter", tone: "bad" },
  import_alert: { label: "Last action: import alert", tone: "bad" },
  unknown: { label: "No recorded action", tone: "neutral" },
};

export const SEARCH_COPY = {
  guidedIntro:
    "Enter the drug name and company name from your label. If you're unsure about either, leave it blank. You'll be able to narrow the results on the next page. We don’t store your data.",
  companyHelp:
    "This is not the pharmacy but the company that packaged the drug to send to the pharmacy. You can find it if there is a logo on the front or after words like MFR, MFG, Distributed by or Manufactured for (not “Manufactured by”). The first word or two should be enough.",
  ndcHelp:
    "An NDC is a unique 10- or 11-digit identifier for medication that may appear on your label. It consists of three numerical parts and looks like: NDC 12345-6789-01.",
  resultsChatter:
    "Your generic could be listed below. Use the dosage and drug description to narrow the results. Drug labels often describe the pills including color, shape and form. You may see more than one drug that seems to match yours. Refer to information like pill markings or National Drug Code to find the exact match.",
  manyResults: "We found a lot of results for your search. Use the filters to narrow your options.",
  noResults: "No results. Please modify your search.",
  sameFactory:
    "All the drugs below have the same manufacturing facilities according to our records. This can occur when the same drug is labeled and distributed by multiple companies. Click on any drug to see facility information.",
  dosageNote:
    "Displayed dosage comes from what the company reports. It may appear in different forms on the package. For example, 10mg/ml may appear as 1%, or a multipart dosage might appear as a cumulative total.",
  repackaged: "The company you see on your label may not have manufactured the drug.",
  noFacility:
    "Unfortunately, ProPublica wasn’t able to connect the dots to a related facility using available databases. If you have two company names on the bottle, try the other one.",
  medicalNote:
    "Note: ProPublica does not provide medical advice. Stopping your medication, doctors warn, can be dangerous. Please consult your doctor first if you have concerns.",
  examples: ["Bupropion", "Hikma Pharmaceuticals Cefazolin", "63629-8484-1", "Quallent Atorvastatin", "Apotex"],
};

export const ADVANCED_SEARCH_HELP: Array<{ operator: string; description: string; example: string }> = [
  { operator: '" "', description: "Search for an exact word or phrase", example: '"Teva Pharmaceuticals Usa"' },
  { operator: "AND", description: "Return results that include both phrases", example: "atorvastatin AND 20mg" },
  { operator: "OR", description: "Return results that include one phrase or another", example: "500mg OR 250mg" },
  { operator: "-", description: "Return results that do not include a word", example: "amphetamine -dextroamphetamine" },
  { operator: "+", description: "Requires the following term for search", example: "+tablet metformin" },
  { operator: "( )", description: "Prioritize the enclosed operation if the query has multiple operators", example: "(bryant OR remedyrepack) AND teva" },
  { operator: '" "*', description: "Return results matching a prefix, denoted in double quotes.", example: '"0378-39"*' },
];

export const SOURCE = {
  name: "ProPublica Rx Inspector",
  url: "https://projects.propublica.org/rx-inspector/",
  series: "https://www.propublica.org/series/rx-roulette",
  methodology: "https://www.propublica.org/article/rx-inspector-fda-generic-drug-tool-methodology",
  authors: "Brandon Roberts, Ruth Talbot and Nick McMillan",
};
