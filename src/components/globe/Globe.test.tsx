import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { renderAt } from "../../test-utils";
import { FACILITIES } from "../mission/fixtures";
import { countryRows, matchFacilities, plottable } from "./facilityIndex";
import { Globe } from "./Globe";

describe("facility index helpers", () => {
  it("only plots facilities with coordinates", () => {
    expect(plottable(FACILITIES).map((p) => p.facility.fei)).toEqual(["1", "2", "3", "4"]);
    expect(plottable(FACILITIES)[0]).toMatchObject({ tone: "bad", flagged: true });
  });

  it("groups facilities by country", () => {
    expect(countryRows(FACILITIES)[0]).toEqual({ country: "India", facilities: 3, mapped: 2, serious: 2, labels: 420 });
  });

  it("matches facilities by every search term", () => {
    expect(matchFacilities(FACILITIES, "pune india").map((f) => f.fei)).toEqual(["4"]);
    expect(matchFacilities(FACILITIES, "")).toHaveLength(5);
  });
});

describe("Globe", () => {
  it("summarises what it shows on the canvas", () => {
    renderAt(<Globe facilities={FACILITIES} />);
    expect(screen.getByRole("img", { name: /globe showing 4 facilities in 3 countries, 3 with a serious latest action\. auto-rotating/i })).toBeInTheDocument();
  });

  it("toggles rotation with a pressed-state button", async () => {
    const user = userEvent.setup();
    renderAt(<Globe facilities={FACILITIES} />);
    const pause = screen.getByRole("button", { name: /pause rotation/i });
    expect(pause).toHaveAttribute("aria-pressed", "false");
    await user.click(pause);
    expect(pause).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("img", { name: /rotation paused/i })).toBeInTheDocument();
  });

  it("filters statuses from the legend", async () => {
    const user = userEvent.setup();
    renderAt(<Globe facilities={FACILITIES} />);
    const serious = screen.getByRole("button", { name: /serious action/i });
    await user.click(serious);
    expect(serious).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("img", { name: /globe showing 1 facility in 1 country, 0 with/i })).toBeInTheDocument();
  });

  it("lets keyboard users pick a facility, shows details and announces it", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    renderAt(<Globe facilities={FACILITIES} onSelect={onSelect} />);
    await user.type(screen.getByRole("searchbox", { name: /browse facilities on the map/i }), "shanghai");
    await user.selectOptions(screen.getByRole("listbox", { name: /matching facilities/i }), "3");
    expect(onSelect).toHaveBeenCalledWith("3");
    const card = screen.getByRole("article", { name: "Shanghai Pharma" });
    expect(within(card).getByText("Shanghai, China")).toBeInTheDocument();
    expect(within(card).getByText("Last action: import alert")).toBeInTheDocument();
    expect(within(card).getByRole("link", { name: /facility record/i })).toHaveAttribute("href", "/facilities/3");
    expect(screen.getByRole("status", { name: /announcements/i })).toHaveTextContent("Selected Shanghai Pharma, Shanghai, China.");
    await user.click(within(card).getByRole("button", { name: /close details/i }));
    expect(screen.queryByRole("article")).not.toBeInTheDocument();
  });

  it("focuses a facility from the focusFei prop", () => {
    renderAt(<Globe facilities={FACILITIES} focusFei="4" />);
    expect(screen.getByRole("article", { name: "Pune Labs" })).toBeInTheDocument();
  });

  it("zooms with buttons and the keyboard without crashing when canvas is unavailable", async () => {
    const user = userEvent.setup();
    renderAt(<Globe facilities={FACILITIES} />);
    const zoomOut = screen.getByRole("button", { name: "Zoom out" });
    await user.click(zoomOut);
    expect(zoomOut).toBeDisabled();
    screen.getByRole("img", { name: /globe showing/i }).focus();
    await user.keyboard("{ArrowLeft}+{Escape}");
    expect(zoomOut).toBeEnabled();
  });

  it("shows a by-country data table on demand", async () => {
    const user = userEvent.setup();
    renderAt(<Globe facilities={FACILITIES} />);
    const toggle = screen.getByRole("button", { name: /facilities by country table/i });
    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("table", { name: /by country/i })).toBeInTheDocument();
    expect(screen.getByRole("rowheader", { name: "India" })).toBeInTheDocument();
  });

  it("renders in the ascii theme", () => {
    renderAt(<Globe facilities={FACILITIES} />, { theme: "ascii" });
    expect(screen.getByRole("img", { name: /globe showing/i })).toBeInTheDocument();
  });

  it("has no axe violations", async () => {
    const user = userEvent.setup();
    const { container } = renderAt(<Globe facilities={FACILITIES} focusFei="1" />);
    await user.click(screen.getByRole("button", { name: /facilities by country table/i }));
    expect(await axe(container)).toHaveNoViolations();
  });
});
