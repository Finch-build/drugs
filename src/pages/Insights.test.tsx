import { screen, within } from "@testing-library/react";
import { axe } from "vitest-axe";
import { INSIGHTS, META } from "../components/mission/fixtures";
import { clearDataCache } from "../data/api";
import { mockFetchData, renderAt } from "../test-utils";
import Insights from "./Insights";

const files = { "meta.json": META, "insights.json": INSIGHTS };

describe("Insights page", () => {
  beforeEach(() => clearDataCache());

  it("renders charts, callouts and the comparison tool", async () => {
    mockFetchData(files);
    renderAt(<Insights />);
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    for (const name of [
      /inspections by year/i,
      /warning letters by year/i,
      /facilities by latest action/i,
      /most common fda citations/i,
      /facilities by country, top 15/i,
      /top labelers/i,
      /top ingredients/i,
      /dosage forms/i,
      /routes of administration/i,
    ]) {
      expect(await screen.findByRole("figure", { name: name })).toBeInTheDocument();
    }
    expect(screen.getByRole("table", { name: /side-by-side/i })).toBeInTheDocument();
    expect(await screen.findByText(/data as of nov 15, 2026/i)).toBeInTheDocument();
    const callouts = await screen.findByRole("region", { name: /quick insights/i });
    expect(within(callouts).getByText("50%")).toBeInTheDocument();
  });

  it("has no axe violations", async () => {
    mockFetchData(files);
    const { container } = renderAt(<Insights />);
    await screen.findByRole("table", { name: /side-by-side/i });
    await screen.findByRole("region", { name: /quick insights/i });
    expect(await axe(container)).toHaveNoViolations();
  });
});
