import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { clearDataCache } from "../data/api";
import { fixtureData } from "../search/fixtures";
import { mockFetchData, renderAt } from "../test-utils";
import FacilityDetail from "./FacilityDetail";

const setup = (fei = "3002809586") => renderAt(<FacilityDetail />, { route: `/facilities/${fei}`, path: "/facilities/:fei" });
const timelineItems = () => within(screen.getByRole("list", { name: /fda actions/i })).getAllByRole("listitem", { name: /.+/ });

describe("FacilityDetail", () => {
  beforeEach(() => {
    clearDataCache();
    mockFetchData(fixtureData);
  });

  it("renders the facility header", async () => {
    setup();
    expect(await screen.findByRole("heading", { level: 1, name: "Sun Pharmaceutical Industries Limited" })).toBeInTheDocument();
    await waitFor(() => expect(document.title).toBe("Sun Pharmaceutical Industries Limited · Rx Mission Control"));
    const header = screen.getByRole("banner");
    expect(within(header).getByText(/FEI 3002809586/)).toBeInTheDocument();
    expect(within(header).getByText(/halol-baroda highway/i)).toBeInTheDocument();
    expect(within(header).getByText(/last action: warning letter/i)).toBeInTheDocument();
    expect(within(header).getByText(/serious finding in history/i)).toBeInTheDocument();
    expect(within(header).getByRole("link", { name: /show on globe/i })).toHaveAttribute("href", "/?fei=3002809586");
  });

  it("merges every FDA action into a newest-first timeline", async () => {
    setup();
    await screen.findByRole("heading", { level: 1 });
    const items = timelineItems();
    expect(items).toHaveLength(6);
    expect(items[0]).toHaveAccessibleName(/inspection.*jun 13, 2025/i);
    expect(within(items[0]).getByText(/unacceptable state of compliance/i)).toBeInTheDocument();
    expect(items[1]).toHaveAccessibleName(/form 483/i);
    expect(items[2]).toHaveAccessibleName(/warning letter/i);
    expect(items[3]).toHaveAccessibleName(/import alert/i);
    expect(within(items[4]).getByText(/not linked to an inspection/i)).toBeInTheDocument();
  });

  it("expands inspection citations", async () => {
    setup();
    await screen.findByRole("heading", { level: 1 });
    const toggle = screen.getByRole("button", { name: /2 citations/i });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("21 CFR 211.63")).toBeVisible();
    expect(screen.getByText(/failure to thoroughly review/i)).toBeVisible();
  });

  it("shows warning letter, close-out and import alert details", async () => {
    setup();
    await screen.findByRole("heading", { level: 1 });
    const [, , letter, alert] = timelineItems();
    expect(within(letter).getByText("CGMP/Active Pharmaceutical Ingredient (API)/Adulterated")).toBeInTheDocument();
    expect(within(letter).getByRole("link", { name: /read the warning letter/i })).toHaveAttribute("href", expect.stringContaining("sun.pdf"));
    expect(within(letter).getByRole("link", { name: /close-out letter/i })).toHaveAttribute("href", "https://www.fda.gov/closeout");
    expect(within(alert).getByText(/active/i)).toBeInTheDocument();
    await userEvent.click(within(alert).getByRole("button", { name: /2 exempted drugs/i }));
    expect(within(alert).getByText(/vecuronium injection/i)).toBeVisible();
  });

  it("can show only issues", async () => {
    setup();
    await screen.findByRole("heading", { level: 1 });
    await userEvent.click(screen.getByRole("checkbox", { name: /only show issues/i }));
    expect(timelineItems()).toHaveLength(5);
  });

  it("explains the terms in a glossary and lists registrations", async () => {
    setup();
    await screen.findByRole("heading", { level: 1 });
    const glossary = screen.getByRole("region", { name: /what these mean/i });
    expect(within(glossary).getAllByText(/official action indicated/i).length).toBeGreaterThan(0);
    expect(within(glossary).getByText(/disciplinary tool/i)).toBeInTheDocument();
    const table = screen.getByRole("table", { name: /registrations/i });
    expect(within(table).getByText("725959238")).toBeInTheDocument();
    expect(within(table).getByText("12/31/2025")).toBeInTheDocument();
  });

  it("lists and filters drugs linked to the facility", async () => {
    setup();
    const drugs = await screen.findByRole("region", { name: /drugs linked to this facility/i });
    expect(await within(drugs).findByText(/3 drugs/i)).toBeInTheDocument();
    expect(within(drugs).getByRole("link", { name: /metformin hydrochloride 1000mg/i })).toHaveAttribute("href", "/labels/doc-metformin-zydus/68382-030");
    await userEvent.type(within(drugs).getByLabelText(/filter drugs/i), "bryant");
    expect(within(drugs).getAllByRole("link")).toHaveLength(1);
  });

  it("shows a not found page for unknown facilities", async () => {
    setup("000");
    expect(await screen.findByRole("heading", { level: 1, name: /facility not found/i })).toBeInTheDocument();
  });

  it("has no detectable accessibility violations", async () => {
    const { container } = setup();
    const drugs = await screen.findByRole("region", { name: /drugs linked to this facility/i });
    await within(drugs).findByText(/3 drugs/i);
    expect(await axe(container)).toHaveNoViolations();
  });
});
