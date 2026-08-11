import { describe, expect, it } from "vitest";
import { predictCancellation, type BookingInput } from "./prediction";

const representativeBooking: BookingInput = {
  hotel: "City Hotel", leadTime: 30, arrivalYear: 2017, arrivalMonth: "June", arrivalWeek: 25, arrivalDay: 15,
  weekendNights: 1, weekNights: 2, adults: 2, children: 0, babies: 0, meal: "BB", country: "PRT",
  marketSegment: "Online TA", distributionChannel: "TA/TO", repeatedGuest: false, previousCancellations: 0,
  previousBookingsNotCanceled: 0, reservedRoomType: "A", assignedRoomType: "A", bookingChanges: 0,
  depositType: "No Deposit", customerType: "Transient", averageDailyRate: 100, parkingSpaces: 0,
  specialRequests: 1, waitingListDays: 0,
};

describe("pickle model inference bridge", () => {
  it("returns a bounded probability and an allowed cancellation risk label", async () => {
    const assessment = await predictCancellation(representativeBooking);

    expect(assessment.cancellationProbability).toBeGreaterThanOrEqual(0);
    expect(assessment.cancellationProbability).toBeLessThanOrEqual(1);
    expect(["Low", "Medium", "High"]).toContain(assessment.riskLabel);
    expect(assessment.recommendation.length).toBeGreaterThan(20);
  }, 30_000);
});
