import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { createPredictionHistory, listPredictionHistory } from "./db";
import { predictCancellation, type BookingInput } from "./prediction";

const bookingInputSchema = z.object({
  hotel: z.enum(["City Hotel", "Resort Hotel"]), leadTime: z.number().int().min(0).max(730), arrivalYear: z.number().int().min(2015).max(2017),
  arrivalMonth: z.enum(["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]),
  arrivalWeek: z.number().int().min(1).max(53), arrivalDay: z.number().int().min(1).max(31), weekendNights: z.number().int().min(0).max(60), weekNights: z.number().int().min(0).max(60),
  adults: z.number().int().min(1).max(20), children: z.number().int().min(0).max(20), babies: z.number().int().min(0).max(10), meal: z.enum(["BB", "HB", "FB", "SC", "Undefined"]),
  country: z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/), marketSegment: z.enum(["Direct", "Corporate", "Online TA", "Offline TA/TO", "Complementary", "Groups", "Aviation"]),
  distributionChannel: z.enum(["Direct", "Corporate", "TA/TO", "GDS"]), repeatedGuest: z.boolean(), previousCancellations: z.number().int().min(0).max(100),
  previousBookingsNotCanceled: z.number().int().min(0).max(1_000), reservedRoomType: z.string().regex(/^[A-L]$/), assignedRoomType: z.string().regex(/^[A-P]$/),
  bookingChanges: z.number().int().min(0).max(100), depositType: z.enum(["No Deposit", "Non Refund", "Refundable"]), customerType: z.enum(["Transient", "Transient-Party", "Contract", "Group"]),
  averageDailyRate: z.number().min(0).max(100_000), parkingSpaces: z.number().int().min(0).max(5), specialRequests: z.number().int().min(0).max(5), waitingListDays: z.number().int().min(0).max(1_000),
});

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
  prediction: router({
    predict: publicProcedure.input(bookingInputSchema).mutation(async ({ input }) => {
      const assessment = await predictCancellation(input as BookingInput);
      const record = await createPredictionHistory({ bookingDetails: input, cancellationProbability: assessment.cancellationProbability, confidence: assessment.confidence, riskLabel: assessment.riskLabel, recommendation: assessment.recommendation });
      return { ...assessment, id: record?.id ?? null, createdAt: record?.createdAt ?? new Date() };
    }),
    history: publicProcedure.input(z.object({ limit: z.number().int().min(1).max(50) }).optional()).query(({ input }) => listPredictionHistory(input?.limit ?? 10)),
  }),
});

export type AppRouter = typeof appRouter;
