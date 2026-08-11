import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";

const client = createTRPCProxyClient({
  links: [
    httpBatchLink({
      url: "http://127.0.0.1:3000/api/trpc",
      transformer: superjson,
    }),
  ],
});

const booking = {
  hotel: "City Hotel", leadTime: 30, arrivalYear: 2017, arrivalMonth: "June", arrivalWeek: 25, arrivalDay: 15,
  weekendNights: 1, weekNights: 2, adults: 2, children: 0, babies: 0, meal: "BB", country: "PRT",
  marketSegment: "Online TA", distributionChannel: "TA/TO", repeatedGuest: false, previousCancellations: 0,
  previousBookingsNotCanceled: 0, reservedRoomType: "A", assignedRoomType: "A", bookingChanges: 0,
  depositType: "No Deposit", customerType: "Transient", averageDailyRate: 100, parkingSpaces: 0,
  specialRequests: 1, waitingListDays: 0,
};

const prediction = await client.prediction.predict.mutate(booking);
const history = await client.prediction.history.query({ limit: 1 });
console.log(JSON.stringify({ prediction, newestHistoryRecord: history[0] }, null, 2));
