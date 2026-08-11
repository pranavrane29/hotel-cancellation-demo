import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const context: TrpcContext = {
  user: null,
  req: { protocol: "http", headers: {} } as TrpcContext["req"],
  res: {} as TrpcContext["res"],
};

describe("booking input validation", () => {
  it("rejects malformed country codes before calling the model", async () => {
    const caller = appRouter.createCaller(context);

    await expect(caller.prediction.predict({
      hotel: "City Hotel", leadTime: 30, arrivalYear: 2017, arrivalMonth: "June", arrivalWeek: 25, arrivalDay: 15,
      weekendNights: 1, weekNights: 2, adults: 2, children: 0, babies: 0, meal: "BB", country: "INVALID",
      marketSegment: "Online TA", distributionChannel: "TA/TO", repeatedGuest: false, previousCancellations: 0,
      previousBookingsNotCanceled: 0, reservedRoomType: "A", assignedRoomType: "A", bookingChanges: 0,
      depositType: "No Deposit", customerType: "Transient", averageDailyRate: 100, parkingSpaces: 0,
      specialRequests: 1, waitingListDays: 0,
    })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
