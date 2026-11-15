import { formatDate, formatNumber, plural, titleCase } from "./format";

describe("format helpers", () => {
  it("formats numbers with separators", () => expect(formatNumber(39250)).toBe("39,250"));
  it("formats ISO dates without timezone drift", () => expect(formatDate("2025-02-26")).toBe("Feb 26, 2025"));
  it("renders a dash for missing dates", () => expect(formatDate(null)).toBe("—"));
  it("title-cases shouting text", () => expect(titleCase("METFORMIN HYDROCHLORIDE")).toBe("Metformin Hydrochloride"));
  it("pluralises", () => {
    expect(plural(1, "facility", "facilities")).toBe("1 facility");
    expect(plural(2, "facility", "facilities")).toBe("2 facilities");
  });
});
