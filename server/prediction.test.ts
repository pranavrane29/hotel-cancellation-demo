import { describe, expect, it } from "vitest";
import { classifyRisk } from "./prediction";

describe("cancellation risk classification", () => {
  it("uses exactly the Low, Medium, and High thresholds", () => {
    expect(classifyRisk(0.12).riskLabel).toBe("Low");
    expect(classifyRisk(0.35).riskLabel).toBe("Medium");
    expect(classifyRisk(0.88).riskLabel).toBe("High");
  });

  it("returns confidence from the stronger possible outcome", () => {
    expect(classifyRisk(0.18).confidence).toBeCloseTo(0.82);
    expect(classifyRisk(0.77).confidence).toBeCloseTo(0.77);
  });
});
