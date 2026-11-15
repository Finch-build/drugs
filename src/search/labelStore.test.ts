import { clearDataCache } from "../data/api";
import { mockFetchData } from "../test-utils";
import { fixtureLabels } from "./fixtures";
import { loadLabelIndex, loadLabelsById } from "./labelStore";

describe("labelStore", () => {
  beforeEach(() => clearDataCache());

  it("builds the label index once per loaded dataset", async () => {
    const fetchMock = mockFetchData({ "labels.json": fixtureLabels });
    const first = await loadLabelIndex();
    const second = await loadLabelIndex();
    expect(first).toBe(second);
    expect(first.index).toHaveLength(fixtureLabels.length);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("looks labels up by id", async () => {
    mockFetchData({ "labels.json": fixtureLabels });
    const byId = await loadLabelsById();
    expect(byId.get(3)?.labeler).toBe("Bryant Ranch Prepack");
  });
});
