import { screen, within } from "@testing-library/react";
import { axe } from "vitest-axe";
import { FACILITIES, INSIGHTS, META } from "../components/mission/fixtures";
import { clearDataCache } from "../data/api";
import { mockFetchData, renderAt } from "../test-utils";
import MissionControl from "./MissionControl";

class IntersectionObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}

const files = { "meta.json": META, "facilities.json": FACILITIES, "insights.json": INSIGHTS };

describe("MissionControl page", () => {
  beforeEach(() => clearDataCache());

  it("renders the dashboard from data", async () => {
    mockFetchData(files);
    renderAt(<MissionControl />);
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(await screen.findByRole("img", { name: /globe showing 4 facilities/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /pause rotation/i })).toBeInTheDocument();
    expect(screen.getByRole("searchbox", { name: /browse facilities on the map/i })).toBeInTheDocument();
    expect(await screen.findByRole("list", { name: "Dataset totals" })).toBeInTheDocument();
    expect(await screen.findByRole("table", { name: /latest fda action/i })).toBeInTheDocument();
    expect(screen.getByRole("search", { name: /quick drug search/i })).toBeInTheDocument();
    const ticker = screen.getByRole("list", { name: /recently flagged/i });
    expect(within(ticker).getAllByRole("listitem")).toHaveLength(3);
    expect(screen.getByRole("figure", { name: /top countries/i })).toBeInTheDocument();
    expect(screen.getByText(/data as of nov 15, 2026/i)).toBeInTheDocument();
  });

  it("focuses the facility named in the fei query parameter", async () => {
    mockFetchData(files);
    renderAt(<MissionControl />, { route: "/?fei=3" });
    expect(await screen.findByRole("article", { name: "Shanghai Pharma" })).toBeInTheDocument();
  });

  it("shows an error when data fails to load", async () => {
    mockFetchData({});
    renderAt(<MissionControl />);
    expect((await screen.findAllByRole("alert")).length).toBeGreaterThan(0);
  });

  it("adds ascii decorations in the ascii theme", async () => {
    vi.stubGlobal("IntersectionObserver", IntersectionObserverStub);
    mockFetchData(files);
    const { container } = renderAt(<MissionControl />, { theme: "ascii" });
    await screen.findByRole("list", { name: "Dataset totals" });
    expect(container.querySelector(".ascii-banner")).toHaveAttribute("aria-hidden", "true");
  });

  it("has no axe violations", async () => {
    mockFetchData(files);
    const { container } = renderAt(<MissionControl />);
    await screen.findByRole("img", { name: /globe showing/i });
    await screen.findByRole("table", { name: /latest fda action/i });
    await screen.findByRole("list", { name: "Dataset totals" });
    expect(await axe(container)).toHaveNoViolations();
  });
});
