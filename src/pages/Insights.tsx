import { BarChart } from "../components/charts/BarChart";
import { DonutChart, type DonutDatum } from "../components/charts/DonutChart";
import { StackedBarChart } from "../components/charts/MultiSeriesChart";
import { percent } from "../components/charts/scales";
import { CountryComparison } from "../components/mission/CountryComparison";
import { buildCallouts } from "../components/mission/metrics";
import "../components/mission/mission.css";
import { formatDate, formatNumber, titleCase } from "../components/ui/format";
import { ResourceView } from "../components/ui/States";
import { STATUS_COPY } from "../content/copy";
import { loadInsights, loadMeta } from "../data/api";
import type { CountItem, FacilityStatus, Insights as InsightsData, Meta } from "../data/types";
import { useResource } from "../data/useResource";

const STATUS_STYLE: Record<FacilityStatus, Pick<DonutDatum, "color" | "pattern">> = {
  ok: { color: "var(--good)" },
  vai: { color: "var(--caution)" },
  letter_483: { color: "var(--chart-2)", pattern: "dots" },
  oai: { color: "var(--bad)", pattern: "hatch" },
  warning_letter: { color: "var(--chart-3)" },
  import_alert: { color: "var(--accent-2)", pattern: "dots" },
  unknown: { color: "var(--neutral)" },
};

const ACTION_SERIES = [
  { key: "NAI", label: "No action (NAI)", color: "var(--good)" },
  { key: "VAI", label: "Voluntary action (VAI)", color: "var(--caution)", pattern: "dots" as const },
  { key: "OAI", label: "Official action (OAI)", color: "var(--bad)", pattern: "hatch" as const },
];

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

const toBars = (items: CountItem[], limit: number, clean = false) =>
  items.slice(0, limit).map((item) => ({ key: item.key, label: clean ? titleCase(item.label) : item.label.replace(/\s+/g, " "), value: item.count }));

export default function Insights() {
  const meta = useResource(loadMeta);
  const insights = useResource(loadInsights);
  return (
    <div className="container page insights">
      <header className="insights__header">
        <p className="mission__kicker">Insights</p>
        <h1>What the inspection records reveal</h1>
        <p className="mission__dek">
          Patterns across the factories behind America’s generic drugs: where they are, how inspections turned out and what inspectors cite most.
          {meta.status === "ready" && <> Data as of {formatDate(meta.data.crawledAt)}.</>}
        </p>
      </header>
      <ResourceView resource={insights} label="Loading insights">
        {(data) => <InsightsBody insights={data} meta={meta.status === "ready" ? meta.data : null} />}
      </ResourceView>
    </div>
  );
}

function InsightsBody({ insights, meta }: { insights: InsightsData; meta: Meta | null }) {
  const callouts = meta ? buildCallouts(insights, meta) : [];
  const countries = [...insights.byCountry].sort((a, b) => b.facilities - a.facilities);
  const years = insights.inspectionsByYear;
  const totalInspections = years.reduce((s, y) => s + y.NAI + y.VAI + y.OAI, 0);
  const totalOai = years.reduce((s, y) => s + y.OAI, 0);
  const peakLetters = [...insights.warningLettersByYear].sort((a, b) => b.count - a.count)[0];
  const statusTotal = Object.values(insights.statusCounts).reduce((s, n) => s + n, 0);
  const statusData: DonutDatum[] = (Object.keys(STATUS_COPY) as FacilityStatus[]).map((status) => ({
    key: status,
    label: capitalize(STATUS_COPY[status].label.replace("Last action: ", "")),
    value: insights.statusCounts[status] ?? 0,
    ...STATUS_STYLE[status],
  }));
  const topStatus = [...statusData].sort((a, b) => b.value - a.value)[0];
  const orals = insights.routes[0];
  const routeTotal = insights.routes.reduce((s, r) => s + r.count, 0);

  return (
    <>
      {callouts.length > 0 && (
        <section aria-labelledby="callouts-heading" className="insights__section">
          <h2 id="callouts-heading" className="visually-hidden">
            Quick insights
          </h2>
          <ul className="callouts">
            {callouts.map((c, i) => (
              <li key={c.key} className="callout" style={{ animationDelay: `${i * 80}ms` }}>
                <strong className="callout__value">{c.value}</strong> <span className="callout__text">{c.text}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="inspections-heading" className="insights__section">
        <h2 id="inspections-heading">Inspections</h2>
        <div className="insights__grid">
          <StackedBarChart
            className="insights__wide"
            title="FDA inspections by year and outcome"
            takeaway={`${percent(totalOai, totalInspections)} of ${formatNumber(totalInspections)} inspections since ${years[0]?.year ?? "the start"} ended in official action.`}
            data={years.map((y) => ({ key: String(y.year), label: String(y.year), values: { NAI: y.NAI, VAI: y.VAI, OAI: y.OAI } }))}
            series={ACTION_SERIES}
            valueLabel="Inspections"
            categoryLabel="Year"
          />
          <BarChart
            title="Warning letters by year"
            takeaway={peakLetters ? `${peakLetters.year} had the most warning letters, with ${formatNumber(peakLetters.count)}.` : "No warning letters recorded."}
            data={insights.warningLettersByYear.map((y) => ({ key: String(y.year), label: String(y.year), value: y.count }))}
            valueLabel="Warning letters"
            orientation="vertical"
            color="var(--bad)"
            highlightKey={peakLetters ? String(peakLetters.year) : undefined}
          />
          <DonutChart
            title="Facilities by latest action"
            takeaway={topStatus ? `The most common latest outcome is “${topStatus.label}”, at ${percent(topStatus.value, statusTotal)} of facilities.` : ""}
            data={statusData}
            valueLabel="Facilities"
            centerLabel="facilities"
          />
          <BarChart
            className="insights__wide"
            title="Most common FDA citations"
            takeaway={insights.topCitations[0] ? `${insights.topCitations[0].key} is cited most often: ${insights.topCitations[0].label.replace(/\s+/g, " ").toLowerCase()}.` : ""}
            data={insights.topCitations.slice(0, 10).map((c) => ({ key: c.key, label: `${c.key.replace("21 CFR ", "§")} ${c.label.replace(/\s+/g, " ")}`, value: c.count }))}
            valueLabel="Citations"
            color="var(--chart-3)"
          />
        </div>
      </section>

      <section aria-labelledby="geography-heading" className="insights__section">
        <h2 id="geography-heading">Geography</h2>
        <BarChart
          title="Facilities by country, top 15"
          takeaway={countries[0] ? `${countries[0].name} and ${countries[1]?.name ?? "others"} together host ${percent((countries[0].facilities + (countries[1]?.facilities ?? 0)), countries.reduce((s, c) => s + c.facilities, 0), 0)} of facilities.` : ""}
          data={countries.slice(0, 15).map((c) => ({ key: c.code, label: c.name, value: c.facilities }))}
          valueLabel="Facilities"
        />
        <div className="insights__compare card">
          <h3>Compare countries</h3>
          <p className="muted">Rates normalize for how many facilities and inspections each country has.</p>
          <CountryComparison countries={insights.byCountry} />
        </div>
      </section>

      <section aria-labelledby="products-heading" className="insights__section">
        <h2 id="products-heading">Products and labelers</h2>
        <div className="insights__grid">
          <BarChart
            title="Top labelers"
            takeaway={insights.topLabelers[0] ? `${insights.topLabelers[0].label} has the most labels; many top labelers repackage drugs made elsewhere.` : ""}
            data={toBars(insights.topLabelers, 10)}
            valueLabel="Labels"
            color="var(--chart-4)"
          />
          <BarChart
            title="Top ingredients"
            takeaway={insights.topIngredients[0] ? `${titleCase(insights.topIngredients[0].label)} appears on more labels than any other ingredient.` : ""}
            data={toBars(insights.topIngredients, 10, true)}
            valueLabel="Labels"
            color="var(--chart-5)"
          />
          <BarChart
            title="Dosage forms"
            takeaway={insights.forms[0] ? `${titleCase(insights.forms[0].label)} is the most common form.` : ""}
            data={toBars(insights.forms, 8, true)}
            valueLabel="Labels"
            color="var(--chart-1)"
          />
          <BarChart
            title="Routes of administration"
            takeaway={orals ? `${percent(orals.count, routeTotal, 0)} of labels are taken by the ${orals.label.toLowerCase()} route.` : ""}
            data={toBars(insights.routes, 8, true)}
            valueLabel="Labels"
            color="var(--chart-2)"
          />
        </div>
      </section>
    </>
  );
}
