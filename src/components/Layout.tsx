import { useEffect, useRef, useState, type ReactNode } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { SOURCE } from "../content/copy";
import { useTheme } from "../theme/ThemeContext";
import "./Layout.css";

const NAV = [
  { to: "/", label: "Mission Control", end: true },
  { to: "/guided-search", label: "Find My Drug" },
  { to: "/facilities", label: "Facilities" },
  { to: "/insights", label: "Insights" },
  { to: "/about", label: "About" },
];

export function Layout({ children }: { children: ReactNode }) {
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const firstRender = useRef(true);

  useEffect(() => {
    setMenuOpen(false);
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    window.scrollTo({ top: 0 });
    mainRef.current?.focus({ preventScroll: true });
  }, [location.pathname]);

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main" onClick={(e) => (e.preventDefault(), mainRef.current?.focus())}>
        Skip to main content
      </a>
      <header className="site-header">
        <div className="container site-header__inner">
          <NavLink to="/" className="brand" aria-label="Rx Mission Control home">
            <span className="brand__mark" aria-hidden="true">
              Rx
            </span>
            <span className="brand__text">
              <span className="brand__name">Mission Control</span>
              <span className="brand__sub">ProPublica Rx Inspector data</span>
            </span>
          </NavLink>
          <button
            type="button"
            className="menu-toggle"
            aria-expanded={menuOpen}
            aria-controls="primary-nav"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span aria-hidden="true">{menuOpen ? "✕" : "☰"}</span>
            <span className="visually-hidden">Menu</span>
          </button>
          <nav id="primary-nav" aria-label="Primary" className={`primary-nav ${menuOpen ? "is-open" : ""}`}>
            <ul>
              {NAV.map((item) => (
                <li key={item.to}>
                  <NavLink to={item.to} end={item.end}>
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
            <button type="button" className="theme-toggle" onClick={toggleTheme} aria-pressed={theme === "ascii"}>
              <span aria-hidden="true">{theme === "ascii" ? "▓▒░" : "◐"}</span> ASCII mode
            </button>
          </nav>
        </div>
      </header>
      <main id="main" ref={mainRef} tabIndex={-1}>
        {children}
      </main>
      <footer className="site-footer">
        <div className="container">
          <p>
            Data from{" "}
            <a href={SOURCE.url} rel="noopener">
              {SOURCE.name}
            </a>{" "}
            by {SOURCE.authors}, part of ProPublica’s{" "}
            <a href={SOURCE.series} rel="noopener">
              Rx Roulette
            </a>{" "}
            series. Read the{" "}
            <a href={SOURCE.methodology} rel="noopener">
              methodology
            </a>
            . This independent visualization is not affiliated with ProPublica.
          </p>
          <p className="muted">ProPublica does not provide medical advice. Please consult your doctor before changing medication.</p>
        </div>
      </footer>
    </div>
  );
}
