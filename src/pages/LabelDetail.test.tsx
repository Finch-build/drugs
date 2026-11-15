import { screen, within } from "@testing-library/react";
import { axe } from "vitest-axe";
import { clearDataCache } from "../data/api";
import { fixtureData } from "../search/fixtures";
import { mockFetchData, renderAt } from "../test-utils";
import LabelDetail from "./LabelDetail";
import LabelDocument from "./LabelDocument";

const detail = (route: string) => renderAt(<LabelDetail />, { route, path: "/labels/:documentId/:ndc" });

describe("LabelDetail", () => {
  beforeEach(() => {
    clearDataCache();
    mockFetchData(fixtureData);
  });

  it("shows drug facts, package NDCs and the DailyMed link", async () => {
    detail("/labels/doc-metformin-zydus/68382-028");
    expect(await screen.findByRole("heading", { level: 1, name: /metformin hydrochloride/i })).toBeInTheDocument();
    expect(document.title).toBe("Metformin Hydrochloride · Rx Mission Control");
    const facts = screen.getByRole("region", { name: /drug facts/i });
    expect(within(facts).getByText("500mg")).toBeInTheDocument();
    expect(within(facts).getByText("ANDA-090692")).toBeInTheDocument();
    expect(within(facts).getByText(/white to off-white/i)).toBeInTheDocument();
    expect(within(facts).getByText("Z 70")).toBeInTheDocument();
    expect(screen.getByText(/check if your packaging has a number that matches/i)).toBeInTheDocument();
    expect(screen.getByText("68382-028-10")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /dailymed/i })).toHaveAttribute("href", "https://dailymed.nlm.nih.gov/dailymed/lookup.cfm?setid=doc-metformin-zydus");
    expect(screen.getByText(/does not provide medical advice/i)).toBeInTheDocument();
  });

  it("lists the facilities that make it with status and links", async () => {
    detail("/labels/doc-metformin-zydus/68382-028");
    const section = await screen.findByRole("region", { name: /facilities that make this drug/i });
    const card = within(section).getByRole("article", { name: /sun pharmaceutical/i });
    expect(within(card).getByText(/last action: warning letter/i)).toBeInTheDocument();
    expect(within(card).getByText(/halol, gujarat, india/i)).toBeInTheDocument();
    expect(within(card).getByRole("link", { name: /^sun pharmaceutical industries limited$/i })).toHaveAttribute("href", "/facilities/3002809586");
    expect(within(card).getByRole("link", { name: /show on globe/i })).toHaveAttribute("href", "/?fei=3002809586");
    expect(within(card).getByText(/warning letters/i).closest("div")).toHaveTextContent("1");
  });

  it("explains repackaged drugs and shows the source NDC", async () => {
    detail("/labels/doc-metformin-bryant/63629-8484");
    expect(await screen.findByText(/may not have manufactured the drug/i)).toBeInTheDocument();
    expect(screen.getByText("68382-028-01")).toBeInTheDocument();
  });

  it("explains when no facility could be found", async () => {
    detail("/labels/doc-metformin-orphan/11111-222");
    expect(await screen.findByText(/wasn’t able to connect the dots/i)).toBeInTheDocument();
  });

  it("shows a not found message for unknown products", async () => {
    detail("/labels/nope/123");
    expect(await screen.findByRole("heading", { level: 1, name: /label not found/i })).toBeInTheDocument();
  });

  it("has no detectable accessibility violations", async () => {
    const { container } = detail("/labels/doc-metformin-bryant/63629-8484");
    await screen.findByRole("region", { name: /facilities that make this drug/i });
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("LabelDocument", () => {
  beforeEach(() => {
    clearDataCache();
    mockFetchData(fixtureData);
  });

  it("lists every product in the label document", async () => {
    renderAt(<LabelDocument />, { route: "/labels/doc-metformin-zydus", path: "/labels/:documentId" });
    expect(await screen.findByRole("heading", { level: 1, name: /metformin hydrochloride/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /500mg/i })).toHaveAttribute("href", "/labels/doc-metformin-zydus/68382-028");
    expect(screen.getByRole("link", { name: /1000mg/i })).toHaveAttribute("href", "/labels/doc-metformin-zydus/68382-030");
  });

  it("has no detectable accessibility violations", async () => {
    const { container } = renderAt(<LabelDocument />, { route: "/labels/doc-metformin-zydus", path: "/labels/:documentId" });
    await screen.findByRole("heading", { level: 1, name: /metformin/i });
    expect(await axe(container)).toHaveNoViolations();
  });
});
