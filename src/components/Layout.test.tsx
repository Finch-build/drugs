import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { renderAt } from "../test-utils";
import { Layout } from "./Layout";

describe("Layout", () => {
  it("renders landmarks, skip link and primary navigation", () => {
    renderAt(<Layout><p>content</p></Layout>);
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /skip to main content/i })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: /primary/i })).toBeInTheDocument();
  });

  it("toggles ASCII mode with a pressed button", async () => {
    renderAt(<Layout><p>content</p></Layout>);
    const toggle = screen.getByRole("button", { name: /ascii mode/i });
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    expect(document.documentElement.dataset.theme).toBe("ascii");
  });

  it("exposes an expandable mobile menu", async () => {
    renderAt(<Layout><p>content</p></Layout>);
    const menu = screen.getByRole("button", { name: /menu/i });
    expect(menu).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(menu);
    expect(menu).toHaveAttribute("aria-expanded", "true");
  });

  it("has no detectable accessibility violations", async () => {
    const { container } = renderAt(<Layout><h1>Title</h1></Layout>);
    expect(await axe(container)).toHaveNoViolations();
  });
});
