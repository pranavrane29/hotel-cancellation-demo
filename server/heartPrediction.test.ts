import { describe, expect, it } from "vitest";
import { assessHeartSignal, predictHeartRisk, type HeartInput } from "./heartPrediction";

const representativeInput: HeartInput = {
  age: 45, sex: "M", chestPainType: "ATA", restingBP: 120, cholesterol: 200, fastingBS: 0,
  restingECG: "Normal", maxHR: 150, exerciseAngina: "N", oldpeak: 1, stSlope: "Up", consentAcknowledged: true,
};

describe("heart-risk model service", () => {
  it("uses model probabilities to produce clinically responsible signal text", () => {
    expect(assessHeartSignal(0.49).signal).toBe("Lower");
    expect(assessHeartSignal(0.5).signal).toBe("Elevated");
    expect(assessHeartSignal(0.85).nextStep).toContain("not a diagnosis");
  });

  it("runs the supplied heart model and returns a bounded probability", async () => {
    const assessment = await predictHeartRisk(representativeInput);
    expect(assessment.heartDiseaseProbability).toBeGreaterThanOrEqual(0);
    expect(assessment.heartDiseaseProbability).toBeLessThanOrEqual(1);
    expect(["Lower", "Elevated"]).toContain(assessment.signal);
  }, 30_000);
});
