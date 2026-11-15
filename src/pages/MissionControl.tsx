import { useEffect, useMemo, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { BarChart } from "../components/charts/BarChart";
import { Globe } from "../components/globe/Globe";
import { AsciiBanner, AsciiRadar } from "../components/mission/AsciiDecor";
import { FlaggedTicker } from "../components/mission/FlaggedTicker";
import { KpiTiles } from "../components/mission/KpiTiles";
import { recentFlagged } from "../components/mission/metrics";
import { QuickSearch } from "../components/mission/QuickSearch";
import { StatusBoard } from "../components/mission/StatusBoard";
import "../components/mission/mission.css";
import { formatDate } from "../components/ui/format";
import { ResourceView } from "../components/ui/States";
import { loadFacilities, loadInsights, loadMeta } from "../data/api";
import { useResource } from "../data/useResource";
import { useTheme } from "../theme/ThemeContext";
import { useReducedMotion } from "../theme/useReducedMotion";

export default function MissionControl() {
  const { theme } = useTheme();
  const [params] = useSearchParams();
  const focusFei = params.get("fei");
  const meta = useResource(loadMeta);
  const facilities = useResource(loadFacilities);
  const insights = useResource(loadInsights);
  const flagged = useMemo(() => (facilities.status === "ready" ? recentFlagged(facilities.data, 14) : []), [facilities]);
  const ascii = theme === "ascii";
  const reduced = useReducedMotion();
  const globeRef = useRef<HTMLElement>(null);
  const firstFocus = useRef(true);

  useEffect(() => {
    if (firstFocus.current) {
      firstFocus.current = false;
      return;
    }
    if (focusFei) globeRef.current?.scrollIntoView?.({ behavior: reduced ? "auto" : "smooth", block: "start" });
  }, [focusFei, reduced]);

  return (
    <div className="container page mission">
      <header className="mission__header">
        {ascii && <AsciiBanner text="RX MISSION CONTROL" />}
        <p className="mission__kicker">
          <span className="mission__live" aria-hidden="true" />
          Generic drug supply chain monitor
        </p>
        <h1 className="mission__title">Where your generic drugs are made, and what FDA inspectors found there</h1>
        <p className="mission__dek">
          Every dot is a factory linked to generic drug labels sold in the U.S., colored by the most recent FDA action.
          {meta.status === "ready" && <> Data as of {formatDate(meta.data.crawledAt)}.</>}
        </p>
      </header>

      <section ref={globeRef} className="mission__globe" aria-labelledby="globe-heading">
        <h2 id="globe-heading" className="visually-hidden">
          Facility globe
        </h2>
        <ResourceView resource={facilities} label="Loading facilities">
          {(data) => <Globe facilities={data} focusFei={focusFei} />}
        </ResourceView>
      </section>

      <section aria-labelledby="totals-heading" className="mission__section">
        <h2 id="totals-heading" className="mission__section-title">
          By the numbers
        </h2>
        <ResourceView resource={meta} label="Loading totals">
          {(m) => (
            <KpiTiles
              meta={m}
              trends={
                insights.status === "ready"
                  ? {
                      inspections: {
                        values: insights.data.inspectionsByYear.map((y) => y.NAI + y.VAI + y.OAI),
                        labels: insights.data.inspectionsByYear.map((y) => String(y.year)),
                      },
                      warningLetters: {
                        values: insights.data.warningLettersByYear.map((y) => y.count),
                        labels: insights.data.warningLettersByYear.map((y) => String(y.year)),
                      },
                    }
                  : {}
              }
            />
          )}
        </ResourceView>
      </section>

      <div className="mission__grid">
        <section className="card mission__panel" aria-labelledby="status-heading">
          <div className="mission__panel-head">
            <h2 id="status-heading" className="mission__section-title">
              Status board
            </h2>
            {ascii && <AsciiRadar />}
          </div>
          <p className="muted mission__panel-dek">Facilities by their most recent FDA action.</p>
          <ResourceView resource={insights} label="Loading status board">
            {(data) => <StatusBoard statusCounts={data.statusCounts} />}
          </ResourceView>
        </section>

        <div className="mission__stack">
          <section className="card mission__panel" aria-labelledby="search-heading">
            <h2 id="search-heading" className="mission__section-title">
              Check your medicine
            </h2>
            <QuickSearch />
          </section>
          <section className="card mission__panel" aria-labelledby="countries-heading">
            <h2 id="countries-heading" className="visually-hidden">
              Top countries
            </h2>
            <ResourceView resource={insights} label="Loading countries">
              {(data) => {
                const top = [...data.byCountry].sort((a, b) => b.facilities - a.facilities).slice(0, 6);
                return (
                  <BarChart
                    title="Top countries by facilities"
                    takeaway={top[0] ? `${top[0].name} hosts more of these factories than any other country.` : "No country data."}
                    data={top.map((c) => ({ key: c.code, label: c.name, value: c.facilities }))}
                    valueLabel="Facilities"
                    headingLevel={3}
                  />
                );
              }}
            </ResourceView>
            <Link to="/insights" className="mission__more">
              Explore all insights <span aria-hidden="true">→</span>
            </Link>
          </section>
        </div>
      </div>

      <section className="mission__section" aria-labelledby="ticker-heading">
        <h2 id="ticker-heading" className="mission__section-title">
          Flagged facilities
        </h2>
        <p className="muted">Most recent warning letters, import alerts and official actions. Select one to find it on the globe.</p>
        <ResourceView resource={facilities} label="Loading flagged facilities">
          {() => <FlaggedTicker facilities={flagged} />}
        </ResourceView>
      </section>
    </div>
  );
}
