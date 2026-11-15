import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes, useLocation } from "react-router-dom";
import { axe } from "vitest-axe";
import { renderAt } from "../../test-utils";
import { CountryComparison } from "./CountryComparison";
import { FACILITIES, INSIGHTS, META } from "./fixtures";
import { FlaggedTicker } from "./FlaggedTicker";
import { KpiTiles } from "./KpiTiles";
import { recentFlagged } from "./metrics";
import { QuickSearch } from "./QuickSearch";
import { StatusBoard } from "./StatusBoard";

function LocationProbe() {
  const location = useLocation();
  return <p data-testid="location">{location.pathname + location.search}</p>;
}

describe("KpiTiles", () => {
  it("exposes final totals to assistive tech", () => {
    renderAt(<KpiTiles meta={META} />);
    const list = screen.getByRole("list", { name: "Dataset totals" });
    expect(within(list).getAllByRole("listitem")).toHaveLength(7);
    expect(within(list).getByText("3,000", { selector: ".visually-hidden" })).toBeInTheDocument();
  });

  it("has no axe violations", async () => {
    const { container } = renderAt(<KpiTiles meta={META} trends={{ inspections: { values: [1, 2], labels: ["a", "b"] } }} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("StatusBoard", () => {
  it("lists every status with counts and shares", () => {
    renderAt(<StatusBoard statusCounts={INSIGHTS.statusCounts} />);
    const row = screen.getByRole("row", { name: /warning letter/i });
    expect(within(row).getByText("6")).toBeInTheDocument();
    expect(within(row).getByText("6%")).toBeInTheDocument();
  });

  it("has no axe violations", async () => {
    const { container } = renderAt(<StatusBoard statusCounts={INSIGHTS.statusCounts} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("FlaggedTicker", () => {
  it("renders a real list with a pause control", async () => {
    const user = userEvent.setup();
    renderAt(<FlaggedTicker facilities={recentFlagged(FACILITIES)} />);
    const list = screen.getByRole("list", { name: /recently flagged/i });
    expect(within(list).getAllByRole("link").map((a) => a.textContent)).toEqual(["Shanghai Pharma", "Sun Plant", "Pune Labs"]);
    const pause = screen.getByRole("button", { name: /pause ticker/i });
    await user.click(pause);
    expect(pause).toHaveAttribute("aria-pressed", "true");
  });

  it("has no axe violations", async () => {
    const { container } = renderAt(<FlaggedTicker facilities={recentFlagged(FACILITIES)} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("QuickSearch", () => {
  it("navigates to search results", async () => {
    const user = userEvent.setup();
    renderAt(
      <Routes>
        <Route path="/" element={<QuickSearch />} />
        <Route path="/search" element={<LocationProbe />} />
      </Routes>,
    );
    await user.type(screen.getByRole("textbox", { name: /look up a generic drug/i }), "metformin er");
    await user.click(screen.getByRole("button", { name: "Search" }));
    expect(screen.getByTestId("location")).toHaveTextContent("/search?name=metformin%20er");
  });

  it("links to guided search and has no axe violations", async () => {
    const { container } = renderAt(<QuickSearch />);
    expect(screen.getByRole("link", { name: /guided search/i })).toHaveAttribute("href", "/guided-search");
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("CountryComparison", () => {
  it("defaults to the top three countries and compares their metrics", () => {
    renderAt(<CountryComparison countries={INSIGHTS.byCountry} />);
    const table = screen.getByRole("table", { name: /side-by-side/i });
    expect(within(table).getAllByRole("columnheader").map((h) => h.textContent)).toEqual(["Metric", "India", "United States", "China"]);
    const oai = within(table).getByRole("row", { name: /oai rate/i });
    expect(within(oai).getAllByRole("cell").map((c) => c.textContent)).toEqual(["10%", "5%", "10%"]);
  });

  it("lets users change and remove countries", async () => {
    const user = userEvent.setup();
    renderAt(<CountryComparison countries={INSIGHTS.byCountry} />);
    await user.selectOptions(screen.getByRole("combobox", { name: "Third country" }), "");
    expect(screen.getAllByRole("columnheader")).toHaveLength(3);
    await user.selectOptions(screen.getByRole("combobox", { name: "Second country" }), "CN");
    expect(screen.getByRole("columnheader", { name: "China" })).toBeInTheDocument();
  });

  it("has no axe violations", async () => {
    const { container } = renderAt(<CountryComparison countries={INSIGHTS.byCountry} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
