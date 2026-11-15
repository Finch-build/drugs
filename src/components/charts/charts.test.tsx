import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { BarChart, DonutChart, GroupedBarChart, Sparkline, StackedBarChart } from ".";

const bars = [
  { key: "IN", label: "India", value: 151 },
  { key: "US", label: "United States", value: 89 },
  { key: "CN", label: "China", value: 21 },
];

const years = [
  { key: "2020", label: "2020", values: { NAI: 10, VAI: 5, OAI: 2 } },
  { key: "2021", label: "2021", values: { NAI: 8, VAI: 6, OAI: 1 } },
];

const actionSeries = [
  { key: "NAI", label: "No action", color: "var(--good)" },
  { key: "VAI", label: "Voluntary action", color: "var(--caution)", pattern: "dots" as const },
  { key: "OAI", label: "Official action", color: "var(--bad)", pattern: "hatch" as const },
];

describe("BarChart", () => {
  it("renders a captioned figure with an accessible svg and a focusable mark per bar", () => {
    render(<BarChart title="Facilities by country" takeaway="India leads." data={bars} valueLabel="Facilities" />);
    const figure = screen.getByRole("figure", { name: /facilities by country/i });
    expect(within(figure).getByText("India leads.")).toBeInTheDocument();
    expect(within(figure).getByRole("img", { name: /facilities by country/i })).toBeInTheDocument();
    expect(within(figure).getByRole("button", { name: "India: 151 facilities" })).toBeInTheDocument();
  });

  it("shows a tooltip on focus and moves between marks with arrow keys", async () => {
    const user = userEvent.setup();
    const { container } = render(<BarChart title="Facilities" takeaway="x" data={bars} valueLabel="Facilities" />);
    await user.tab();
    expect(screen.getByRole("button", { name: "India: 151 facilities" })).toHaveFocus();
    expect(container.querySelector(".chart-tooltip")).toHaveTextContent("India");
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("button", { name: "United States: 89 facilities" })).toHaveFocus();
    expect(container.querySelector(".chart-tooltip")).toHaveTextContent("United States");
  });

  it("toggles an accessible data table", async () => {
    const user = userEvent.setup();
    render(<BarChart title="Facilities" takeaway="x" data={bars} valueLabel="Facilities" orientation="vertical" />);
    const toggle = screen.getByRole("button", { name: /show data table/i });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    const table = screen.getByRole("table", { name: "Facilities" });
    expect(within(table).getByRole("rowheader", { name: "China" })).toBeInTheDocument();
    expect(within(table).getByRole("cell", { name: "21" })).toBeInTheDocument();
  });

  it("has no axe violations in both orientations", async () => {
    const { container } = render(
      <>
        <BarChart title="Horizontal" takeaway="x" data={bars} valueLabel="Facilities" />
        <BarChart title="Vertical" takeaway="x" data={bars} valueLabel="Facilities" orientation="vertical" />
      </>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("StackedBarChart and GroupedBarChart", () => {
  it("labels each group with every series value and a total", () => {
    render(<StackedBarChart title="Inspections by year" takeaway="x" data={years} series={actionSeries} valueLabel="Inspections" />);
    expect(screen.getByRole("button", { name: "2020: No action 10, Voluntary action 5, Official action 2, total 17" })).toBeInTheDocument();
    expect(screen.getByRole("list", { name: /legend/i })).toHaveTextContent("Official action");
  });

  it("renders a table with a total column for stacked data", async () => {
    const user = userEvent.setup();
    render(<StackedBarChart title="Inspections by year" takeaway="x" data={years} series={actionSeries} valueLabel="Inspections" categoryLabel="Year" />);
    await user.click(screen.getByRole("button", { name: /show data table/i }));
    expect(screen.getByRole("columnheader", { name: "Total" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "17" })).toBeInTheDocument();
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <>
        <StackedBarChart title="Stacked" takeaway="x" data={years} series={actionSeries} valueLabel="Inspections" />
        <GroupedBarChart title="Grouped" takeaway="x" data={years} series={actionSeries} valueLabel="Inspections" />
      </>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("DonutChart", () => {
  const slices = [
    { key: "ok", label: "Acceptable", value: 30, color: "var(--good)" },
    { key: "bad", label: "Flagged", value: 10, color: "var(--bad)", pattern: "hatch" as const },
  ];

  it("lists values with shares and summarises in the svg label", () => {
    render(<DonutChart title="Status" takeaway="Most are fine." data={slices} valueLabel="Facilities" />);
    expect(screen.getByRole("img", { name: /acceptable 75%/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Flagged: 10 facilities, 25%" })).toBeInTheDocument();
  });

  it("has no axe violations", async () => {
    const { container } = render(<DonutChart title="Status" takeaway="x" data={slices} valueLabel="Facilities" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("Sparkline", () => {
  it("describes its trend", () => {
    render(<Sparkline values={[1, 4, 2]} labels={["a", "b", "c"]} label="Warning letters" />);
    expect(screen.getByRole("img", { name: "Warning letters. From 1 in a to 2 in c, peaking at 4 in b." })).toBeInTheDocument();
  });

  it("can render as a full figure without axe violations", async () => {
    const { container } = render(<Sparkline values={[1, 4, 2]} labels={["a", "b", "c"]} label="Letters" title="Letters per year" />);
    expect(screen.getByRole("figure", { name: /letters per year/i })).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });
});
