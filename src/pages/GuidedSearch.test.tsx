import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { LocationProbe } from "../components/search/LocationProbe";
import { renderAt } from "../test-utils";
import GuidedSearch from "./GuidedSearch";

const setup = () =>
  renderAt(
    <>
      <GuidedSearch />
      <LocationProbe />
    </>,
    { route: "/guided-search" },
  );

const location = () => screen.getByTestId("location").textContent;

describe("GuidedSearch", () => {
  it("shows both steps with help copy and sets the title", () => {
    setup();
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /gather your information/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /search for your drug/i })).toBeInTheDocument();
    expect(screen.getByText(/not the pharmacy/i)).toBeInTheDocument();
    expect(screen.getAllByText(/we don’t store your data/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/unique 10- or 11-digit identifier/i)).toBeInTheDocument();
    expect(document.title).toBe("Find my drug · Rx Mission Control");
  });

  it("submits drug name and company to the results page", async () => {
    setup();
    await userEvent.type(screen.getByLabelText(/^drug name$/i), "metformin");
    await userEvent.type(screen.getByLabelText(/^company/i), "zydus");
    await userEvent.click(screen.getByRole("button", { name: /^search$/i }));
    expect(location()).toBe("/search?name=metformin&labeler=zydus");
  });

  it("explains an empty submission accessibly", async () => {
    setup();
    await userEvent.click(screen.getByRole("button", { name: /^search$/i }));
    expect(screen.getByRole("alert")).toHaveTextContent(/enter a drug name or company/i);
    expect(screen.getByLabelText(/^drug name$/i)).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText(/^drug name$/i)).toHaveFocus();
    expect(location()).toBe("/guided-search");
  });

  it("searches by NDC", async () => {
    setup();
    await userEvent.type(screen.getByLabelText(/^ndc/i), "63629-8484-1");
    await userEvent.click(screen.getByRole("button", { name: /search by ndc/i }));
    expect(location()).toBe("/search?ndc=63629-8484-1");
  });

  it("validates an empty NDC", async () => {
    setup();
    await userEvent.click(screen.getByRole("button", { name: /search by ndc/i }));
    expect(screen.getByRole("alert")).toHaveTextContent(/enter an ndc/i);
  });

  it("links to example and advanced searches", () => {
    setup();
    expect(screen.getByRole("link", { name: "Bupropion" })).toHaveAttribute("href", "/search?name=Bupropion");
    expect(screen.getByRole("link", { name: "63629-8484-1" })).toHaveAttribute("href", "/search?ndc=63629-8484-1");
    expect(screen.getByRole("link", { name: /advanced search/i })).toHaveAttribute("href", "/search?advanced=true");
  });

  it("has no detectable accessibility violations", async () => {
    const { container } = setup();
    expect(await axe(container)).toHaveNoViolations();
  });
});
