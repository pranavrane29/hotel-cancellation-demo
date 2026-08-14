import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";
import { createHeartRiskHistory, listHeartRiskHistory } from "./db";
import { predictHeartRisk, type HeartInput } from "./heartPrediction";

const heartInputSchema = z.object({
  age: z.number().int().min(18).max(120), sex: z.enum(["M", "F"]), chestPainType: z.enum(["ATA", "NAP", "ASY", "TA"]),
  restingBP: z.number().int().min(50).max(300), cholesterol: z.number().int().min(0).max(1_000), fastingBS: z.union([z.literal(0), z.literal(1)]),
  restingECG: z.enum(["Normal", "ST", "LVH"]), maxHR: z.number().int().min(30).max(260), exerciseAngina: z.enum(["Y", "N"]),
  oldpeak: z.number().min(-10).max(15), stSlope: z.enum(["Up", "Flat", "Down"]), consentAcknowledged: z.literal(true),
});

const requestWindows = new Map<string, { count: number; resetsAt: number }>();
function consumePredictionSlot(address: string) {
  const now = Date.now();
  const window = requestWindows.get(address);
  if (!window || window.resetsAt < now) {
    requestWindows.set(address, { count: 1, resetsAt: now + 60_000 });
    return;
  }
  if (window.count >= 10) throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Please wait a minute before submitting another screening request." });
  window.count += 1;
}

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  heartRisk: router({
    predict: publicProcedure.input(heartInputSchema).mutation(async ({ input, ctx }) => {
      const forwarded = ctx.req.headers["x-forwarded-for"];
      const clientAddress = (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(",")[0]?.trim() || ctx.req.socket?.remoteAddress || "anonymous";
      consumePredictionSlot(clientAddress);
      const assessment = await predictHeartRisk(input as HeartInput);
      const { consentAcknowledged, ...inputSummary } = input;
      const record = await createHeartRiskHistory({ inputSummary, heartDiseaseProbability: assessment.heartDiseaseProbability, confidence: assessment.confidence, signal: assessment.signal, consentAcknowledged });
      return { ...assessment, id: record?.id ?? null, createdAt: record?.createdAt ?? new Date() };
    }),
    history: adminProcedure.input(z.object({ limit: z.number().int().min(1).max(20) }).optional()).query(({ input }) => listHeartRiskHistory(input?.limit ?? 8)),
  }),
});

export type AppRouter = typeof appRouter;
