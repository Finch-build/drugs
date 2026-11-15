import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ThemeProvider, type ThemeName } from "./theme/ThemeContext";

export function renderAt(ui: ReactElement, { route = "/", path = "*", theme = "standard" as ThemeName } = {}) {
  return render(
    <ThemeProvider initial={theme}>
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route path={path} element={ui} />
        </Routes>
      </MemoryRouter>
    </ThemeProvider>,
  );
}

export function mockFetchData(files: Record<string, unknown>) {
  const fetchMock = vi.fn(async (url: string) => {
    const key = Object.keys(files).find((path) => String(url).endsWith(`data/${path}`));
    if (!key) return new Response("not found", { status: 404 });
    return new Response(JSON.stringify(files[key]), { status: 200, headers: { "content-type": "application/json" } });
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}
