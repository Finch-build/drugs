import {
  angleDelta,
  centerOf,
  clampZoom,
  easeInOutCubic,
  interpolateRotation,
  isVisible,
  luminanceToChar,
  pickNearest,
  radiusScale,
  rotationFor,
  toneOf,
  wrapLongitude,
} from "./geometry";

describe("isVisible", () => {
  it("treats the point at the center of view as visible", () => {
    expect(isVisible(10, 20, [-10, -20])).toBe(true);
  });

  it("hides the antipode of the center", () => {
    expect(isVisible(170, -20, [-(-10), -20])).toBe(false);
    expect(isVisible(-170, -20, [-10, -20])).toBe(false);
  });

  it("shows points within 90 degrees and hides those beyond", () => {
    expect(isVisible(80, 0, [0, 0])).toBe(true);
    expect(isVisible(100, 0, [0, 0])).toBe(false);
  });

  it("accounts for latitude tilt", () => {
    expect(isVisible(0, 89, [0, -60])).toBe(true);
    expect(isVisible(0, -89, [0, -60])).toBe(false);
  });
});

describe("rotation helpers", () => {
  it("converts a location into the rotation that centers it", () => {
    expect(rotationFor(77.2, 28.6)).toEqual([-77.2, -28.6]);
    expect(centerOf([-77.2, -28.6])).toEqual([77.2, 28.6]);
  });

  it("wraps longitudes into [-180, 180)", () => {
    expect(wrapLongitude(190)).toBe(-170);
    expect(wrapLongitude(-190)).toBe(170);
    expect(wrapLongitude(45)).toBe(45);
  });

  it("finds the shortest signed angular delta", () => {
    expect(angleDelta(170, -170)).toBe(20);
    expect(angleDelta(-170, 170)).toBe(-20);
    expect(angleDelta(0, 90)).toBe(90);
  });

  it("interpolates longitude along the shortest path", () => {
    const [lambda] = interpolateRotation([170, 0], [-170, 0], 0.5);
    expect(Math.abs(wrapLongitude(lambda))).toBeCloseTo(180);
    expect(interpolateRotation([170, 0], [-170, 0], 0)).toEqual([170, 0]);
    expect(wrapLongitude(interpolateRotation([170, 0], [-170, 0], 1)[0])).toBeCloseTo(-170);
  });

  it("interpolates latitude linearly", () => {
    expect(interpolateRotation([0, -10], [0, 30], 0.25)[1]).toBeCloseTo(0);
  });

  it("eases between 0 and 1", () => {
    expect(easeInOutCubic(0)).toBe(0);
    expect(easeInOutCubic(1)).toBe(1);
    expect(easeInOutCubic(0.5)).toBeCloseTo(0.5);
    expect(easeInOutCubic(2)).toBe(1);
  });
});

describe("clampZoom", () => {
  it("keeps zoom within bounds", () => {
    expect(clampZoom(0.1)).toBe(0.8);
    expect(clampZoom(100)).toBe(8);
    expect(clampZoom(2)).toBe(2);
    expect(clampZoom(5, 1, 4)).toBe(4);
  });

  it("falls back to 1 for invalid numbers", () => {
    expect(clampZoom(Number.NaN)).toBe(1);
  });
});

describe("radiusScale", () => {
  it("scales radius by the square root of labels", () => {
    const scale = radiusScale(400, [2, 10]);
    expect(scale(0)).toBe(2);
    expect(scale(400)).toBe(10);
    expect(scale(100)).toBeCloseTo(6);
  });

  it("clamps values above the max and handles an empty domain", () => {
    expect(radiusScale(100, [2, 10])(1000)).toBe(10);
    expect(radiusScale(0, [2, 10])(5)).toBe(2);
  });
});

describe("pickNearest", () => {
  const points = [
    { id: "a", x: 10, y: 10 },
    { id: "b", x: 20, y: 10 },
    { id: "c", x: 100, y: 100 },
  ];

  it("returns the nearest point within the radius", () => {
    expect(pickNearest(points, 13, 10, 8)).toBe("a");
    expect(pickNearest(points, 18, 11, 8)).toBe("b");
  });

  it("returns null when nothing is close enough", () => {
    expect(pickNearest(points, 60, 60, 8)).toBeNull();
    expect(pickNearest([], 0, 0, 8)).toBeNull();
  });
});

describe("luminanceToChar", () => {
  it("maps luminance onto the ramp", () => {
    expect(luminanceToChar(0)).toBe(" ");
    expect(luminanceToChar(1)).toBe("@");
    expect(luminanceToChar(0.5, " .#")).toBe(".");
    expect(luminanceToChar(-1)).toBe(" ");
    expect(luminanceToChar(5)).toBe("@");
  });
});

describe("toneOf", () => {
  it("groups statuses into tones", () => {
    expect(toneOf("ok")).toBe("good");
    expect(toneOf("letter_483")).toBe("caution");
    expect(toneOf("import_alert")).toBe("bad");
    expect(toneOf("unknown")).toBe("neutral");
  });
});
