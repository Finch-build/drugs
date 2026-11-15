import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { clearDataCache } from "../data/api";
import { LocationProbe } from "../components/search/LocationProbe";
import { fixtureData, fixtureLabels, makeLabel } from "../search/fixtures";
import { mockFetchData, renderAt } from "../test-utils";
import SearchResults from "./SearchResults";

const setup = (route: string) =>
  renderAt(
    <>
      <SearchResults />
      <LocationProbe />
    </>,
    { route },
  );
const location = () => screen.getByTestId("location").textContent;
const results = () => within(screen.getByRole("list", { name: /search results/i })).getAllByRole("listitem");

describe("SearchResults", () => {
  beforeEach(() => {
    clearDataCache();
    mockFetchData(fixtureData);
  });

  it("shows a loading state, then announces and lists matches", async () => {
    setup("/search?name=metformin");
    expect(screen.getByRole("status")).toHaveTextContent(/loading/i);
    expect(await screen.findByText(/4 results for “metformin”/i)).toBeInTheDocument();
    expect(results()).toHaveLength(4);
    expect(screen.getByText(/your generic could be listed below/i)).toBeInTheDocument();
    expect(document.title).toBe("“metformin” · Rx Mission Control");
  });

  it("renders result cards that link to label pages", async () => {
    setup("/search?name=metformin");
    const link = await screen.findByRole("link", { name: /metformin hydrochloride 500mg.*bryant ranch/i });
    expect(link).toHaveAttribute("href", "/labels/doc-metformin-bryant/63629-8484");
    const bryant = link.closest("li")!;
    expect(within(bryant).getByText(/repackager/i)).toBeInTheDocument();
    expect(within(bryant).getByText("63629-8484")).toBeInTheDocument();
    expect(within(bryant).getByText(/1 facility/i)).toBeInTheDocument();
    const orphan = screen.getByRole("link", { name: /orphan labs/i }).closest("li")!;
    expect(within(orphan).getByText(/no facility found/i)).toBeInTheDocument();
    expect(within(orphan).getByText(/authorized generic/i)).toBeInTheDocument();
  });

  it("narrows results with facet checkboxes stored in the URL", async () => {
    setup("/search?name=metformin");
    const panel = await screen.findByRole("region", { name: /narrow your results/i });
    await userEvent.click(within(panel).getByRole("checkbox", { name: /1000mg \(1\)/i }));
    expect(location()).toBe("/search?name=metformin&doses=1000mg");
    expect(results()).toHaveLength(1);
    expect(screen.getByText(/1 result for/i)).toBeInTheDocument();
    await userEvent.click(within(panel).getByRole("button", { name: /clear filters/i }));
    expect(location()).toBe("/search?name=metformin");
    expect(results()).toHaveLength(4);
  });

  it("reads facet filters from the URL", async () => {
    setup("/search?name=metformin&colors=blue");
    expect(await screen.findByText(/1 result for/i)).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: /blue/i })).toBeChecked();
  });

  it("searches by NDC and notes when every result shares a factory", async () => {
    setup("/search?ndc=68382-028");
    expect(await screen.findByText(/2 results for ndc/i)).toBeInTheDocument();
    expect(screen.getByText(/same manufacturing facilities/i)).toBeInTheDocument();
  });

  it("shows tips when nothing matches", async () => {
    setup("/search?name=zzzz");
    expect(await screen.findByText(/no results\. please modify your search/i)).toBeInTheDocument();
    expect(screen.getByText(/try searching by ndc/i)).toBeInTheDocument();
  });

  it("paginates large result sets with links", async () => {
    const many = Array.from({ length: 30 }, (_, i) => makeLabel({ id: 100 + i, productNdc: `55555-${i}` }));
    mockFetchData({ ...fixtureData, "labels.json": [...fixtureLabels, ...many] });
    clearDataCache();
    setup("/search?name=metformin");
    expect(await screen.findByText(/34 results/i)).toBeInTheDocument();
    expect(screen.getByText(/we found a lot of results/i)).toBeInTheDocument();
    expect(results()).toHaveLength(24);
    const nav = screen.getByRole("navigation", { name: /results pages/i });
    await userEvent.click(within(nav).getByRole("link", { name: /next/i }));
    expect(location()).toBe("/search?name=metformin&page=2");
    expect(results()).toHaveLength(10);
    expect(within(nav).getByRole("link", { name: /page 2/i })).toHaveAttribute("aria-current", "page");
  });

  it("offers advanced search with the operator help table", async () => {
    setup("/search?advanced=true");
    const input = await screen.findByLabelText(/advanced search query/i);
    expect(screen.getByRole("table", { name: /search operators/i })).toBeInTheDocument();
    await userEvent.type(input, "metformin -bryant");
    await userEvent.click(screen.getByRole("button", { name: /^search$/i }));
    expect(location()).toBe("/search?q=metformin+-bryant&advanced=true");
    expect(await screen.findByText(/3 results/i)).toBeInTheDocument();
  });

  it("has no detectable accessibility violations", async () => {
    const { container } = setup("/search?name=metformin");
    await screen.findByText(/4 results/i);
    expect(await axe(container)).toHaveNoViolations();
  });
});
