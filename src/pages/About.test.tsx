import { screen, waitFor } from "@testing-library/react";
import { axe } from "vitest-axe";
import { clearDataCache } from "../data/api";
import { fixtureData } from "../search/fixtures";
import { mockFetchData, renderAt } from "../test-utils";
import About from "./About";
import NotFound from "./NotFound";

describe("About", () => {
  beforeEach(() => {
    clearDataCache();
    mockFetchData(fixtureData);
  });

  it("shows the snapshot date and counts from meta.json", async () => {
    renderAt(<About />, { route: "/about" });
    expect(await screen.findByText("37,353")).toBeInTheDocument();
    expect(screen.getByText("369")).toBeInTheDocument();
    expect(screen.getAllByText(/nov 15, 2026/i).length).toBeGreaterThan(0);
    await waitFor(() => expect(document.title).toBe("About · Rx Mission Control"));
  });

  it("covers methodology, accessibility and credits", async () => {
    renderAt(<About />, { route: "/about" });
    await screen.findByText("37,353");
    expect(screen.getByRole("link", { name: /methodology/i })).toHaveAttribute("href", expect.stringContaining("methodology"));
    expect(screen.getByRole("heading", { name: /accessibility/i })).toBeInTheDocument();
    expect(screen.getByText(/WCAG 2\.2 AA/)).toBeInTheDocument();
    expect(screen.getByText(/@bas3line/)).toBeInTheDocument();
    expect(screen.getByText(/geonames/i)).toBeInTheDocument();
    expect(screen.getByText(/natural earth/i)).toBeInTheDocument();
    expect(screen.getByText(/precision varies/i)).toBeInTheDocument();
  });

  it("credits ProPublica's public data release and its noncommercial license", async () => {
    renderAt(<About />, { route: "/about" });
    await screen.findByText("37,353");
    expect(screen.getByRole("link", { name: /rx-inspector-data/i })).toHaveAttribute("href", "https://github.com/propublica/rx-inspector-data");
    expect(screen.getByRole("link", { name: /CC BY-NC 4\.0/ })).toHaveAttribute("href", "https://creativecommons.org/licenses/by-nc/4.0/");
    expect(screen.getByText(/noncommercial/i)).toBeInTheDocument();
  });

  it("has no detectable accessibility violations", async () => {
    const { container } = renderAt(<About />, { route: "/about" });
    await screen.findByText("37,353");
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("NotFound", () => {
  it("links home and to search", async () => {
    const { container } = renderAt(<NotFound />, { route: "/nope" });
    expect(screen.getByRole("heading", { level: 1, name: /page not found/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /mission control/i })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: /find my drug/i })).toHaveAttribute("href", "/guided-search");
    expect(await axe(container)).toHaveNoViolations();
  });
});
