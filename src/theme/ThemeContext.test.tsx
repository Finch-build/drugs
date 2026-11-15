import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider, useTheme } from "./ThemeContext";

function Probe() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button type="button" onClick={toggleTheme}>
      {theme}
    </button>
  );
}

describe("ThemeProvider", () => {
  beforeEach(() => localStorage.clear());

  it("defaults to the standard theme and reflects it on the document", () => {
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    expect(screen.getByRole("button")).toHaveTextContent("standard");
    expect(document.documentElement.dataset.theme).toBe("standard");
  });

  it("toggles to ascii and persists the choice", async () => {
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    await userEvent.click(screen.getByRole("button"));
    expect(document.documentElement.dataset.theme).toBe("ascii");
    expect(localStorage.getItem("rx-theme")).toBe("ascii");
  });

  it("restores a saved theme", () => {
    localStorage.setItem("rx-theme", "ascii");
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    expect(screen.getByRole("button")).toHaveTextContent("ascii");
  });
});
