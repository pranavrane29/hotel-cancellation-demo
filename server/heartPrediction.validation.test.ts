import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const context: TrpcContext = { user: null, req: { protocol: "http", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] };

describe("heart-risk API validation", () => {
  it("does not expose historic screening data to an unauthenticated visitor", async () => {
    const caller = appRouter.createCaller(context);
    await expect(caller.heartRisk.history({ limit: 1 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("rejects impossible physiological values before starting model inference", async () => {
    const caller = appRouter.createCaller(context);
    await expect(caller.heartRisk.predict({
      age: 45, sex: "M", chestPainType: "ATA", restingBP: -1, cholesterol: 200, fastingBS: 0,
      restingECG: "Normal", maxHR: 150, exerciseAngina: "N", oldpeak: 1, stSlope: "Up", consentAcknowledged: true,
    })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("requires acknowledgement before data is sent to the model", async () => {
    const caller = appRouter.createCaller(context);
    await expect(caller.heartRisk.predict({
      age: 45, sex: "M", chestPainType: "ATA", restingBP: 120, cholesterol: 200, fastingBS: 0,
      restingECG: "Normal", maxHR: 150, exerciseAngina: "N", oldpeak: 1, stSlope: "Up", consentAcknowledged: false,
    } as never)).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
