import { describe, it, expect } from "vitest";
import {
  TrendBadge,
  WowDelta,
  formatDelta,
  trendConfig,
} from "../trend-badge";

// ---------------------------------------------------------------------------
// Smoke tests — components are valid React function components
// ---------------------------------------------------------------------------
describe("TrendBadge component", () => {
  it("is a function (valid React component)", () => {
    expect(typeof TrendBadge).toBe("function");
  });
});

describe("WowDelta component", () => {
  it("is a function (valid React component)", () => {
    expect(typeof WowDelta).toBe("function");
  });
});

// ---------------------------------------------------------------------------
// trendConfig structure
// ---------------------------------------------------------------------------
describe("trendConfig", () => {
  it("contains entries for all three trends", () => {
    expect(Object.keys(trendConfig)).toEqual(
      expect.arrayContaining(["up", "down", "stable"]),
    );
  });

  it.each(["up", "down", "stable"] as const)(
    "trend '%s' has label, arrow, bg, and text",
    (trend) => {
      const entry = trendConfig[trend];
      expect(entry).toHaveProperty("label");
      expect(entry).toHaveProperty("arrow");
      expect(entry).toHaveProperty("bg");
      expect(entry).toHaveProperty("text");
      expect(typeof entry.label).toBe("string");
      expect(typeof entry.arrow).toBe("string");
    },
  );

  it("maps correct labels", () => {
    expect(trendConfig.up.label).toBe("Rising");
    expect(trendConfig.down.label).toBe("Falling");
    expect(trendConfig.stable.label).toBe("Stable");
  });
});

// ---------------------------------------------------------------------------
// formatDelta logic
// ---------------------------------------------------------------------------
describe("formatDelta", () => {
  it('prefixes "+" for trend "up"', () => {
    expect(formatDelta(1.3, "up")).toBe("+1.3%");
  });

  it('prefixes "-" for trend "down"', () => {
    expect(formatDelta(-0.8, "down")).toBe("-0.8%");
  });

  it('shows no sign prefix for trend "stable"', () => {
    expect(formatDelta(0.0, "stable")).toBe("0.0%");
  });

  it("rounds to one decimal place", () => {
    expect(formatDelta(0.05, "up")).toBe("+0.1%");
  });

  it("uses absolute value regardless of sign", () => {
    // Even if delta is negative but trend is "up", formatDelta uses Math.abs
    expect(formatDelta(-2.5, "up")).toBe("+2.5%");
  });
});
