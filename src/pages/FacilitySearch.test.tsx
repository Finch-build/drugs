import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { clearDataCache } from "../data/api";
import { LocationProbe } from "../components/search/LocationProbe";
import { fixtureData, makeSummary, fixtureFacilities } from "../search/fixtures";
import { mockFetchData, renderAt } from "../test-utils";
import FacilitySearch from "./FacilitySearch";

const setup = (route = "/facilities") =>
  renderAt(
    <>
      <FacilitySearch />
      <LocationProbe />
    </>,
    { route },
  );
const location = () => screen.getByTestId("location").textContent;
const rows = () => within(screen.getByRole("table")).getAllByRole("row").slice(1);

describe("FacilitySearch", () => {
  beforeEach(() => {
    clearDataCache();
    mockFetchData(fixtureData);
  });

  it("lists facilities sorted by name with a live count", async () => {
    setup();
    expect(await screen.findByText(/4 facilities/i)).toBeInTheDocument();
    expect(rows()[0]).toHaveTextContent("Acme Unknown Works");
    expect(within(rows()[3]).getByRole("link", { name: /^sun pharmaceutical industries limited$/i })).toHaveAttribute("href", "/facilities/3002809586");
    expect(document.title).toBe("Facilities · Rx Mission Control");
  });

  it("filters by text and keeps it in the URL", async () => {
    setup();
    await screen.findByText(/4 facilities/i);
    await userEvent.type(screen.getByLabelText(/search facilities/i), "tampa");
    expect(location()).toBe("/facilities?q=tampa");
    expect(screen.getByText(/1 facility/i)).toBeInTheDocument();
    expect(rows()).toHaveLength(1);
  });

  it("filters by country, status and operation and sorts", async () => {
    setup();
    await screen.findByText(/4 facilities/i);
    await userEvent.selectOptions(screen.getByLabelText(/country/i), "India");
    expect(location()).toBe("/facilities?country=India");
    expect(rows()).toHaveLength(2);
    await userEvent.selectOptions(screen.getByLabelText(/status/i), "vai");
    expect(rows()).toHaveLength(1);
    await userEvent.selectOptions(screen.getByLabelText(/status/i), "");
    await userEvent.selectOptions(screen.getByLabelText(/sort/i), "products");
    expect(location()).toBe("/facilities?country=India&sort=products");
    expect(rows()[0]).toHaveTextContent("Intas");
    await userEvent.selectOptions(screen.getByLabelText(/operation/i), "PACK");
    expect(rows()).toHaveLength(1);
  });

  it("reads filters from the URL and can reset them", async () => {
    setup("/facilities?status=ok");
    expect(await screen.findByText(/1 facility/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /reset/i }));
    expect(location()).toBe("/facilities");
  });

  it("paginates", async () => {
    const many = Array.from({ length: 30 }, (_, i) => makeSummary({ fei: `X${i}`, name: `Zeta Plant ${String(i).padStart(2, "0")}` }));
    mockFetchData({ ...fixtureData, "facilities.json": [...fixtureFacilities, ...many] });
    setup();
    expect(await screen.findByText(/34 facilities/i)).toBeInTheDocument();
    expect(rows()).toHaveLength(25);
    await userEvent.click(within(screen.getByRole("navigation", { name: /facility pages/i })).getByRole("link", { name: /next/i }));
    expect(location()).toBe("/facilities?page=2");
    expect(rows()).toHaveLength(9);
  });

  it("has no detectable accessibility violations", async () => {
    const { container } = setup();
    await screen.findByText(/4 facilities/i);
    expect(await axe(container)).toHaveNoViolations();
  });
});
