import { spawn } from "node:child_process";
import path from "node:path";

export type BookingInput = {
  hotel: "City Hotel" | "Resort Hotel";
  leadTime: number;
  arrivalYear: number;
  arrivalMonth: string;
  arrivalWeek: number;
  arrivalDay: number;
  weekendNights: number;
  weekNights: number;
  adults: number;
  children: number;
  babies: number;
  meal: "BB" | "HB" | "FB" | "SC" | "Undefined";
  country: string;
  marketSegment: "Direct" | "Corporate" | "Online TA" | "Offline TA/TO" | "Complementary" | "Groups" | "Aviation";
  distributionChannel: "Direct" | "Corporate" | "TA/TO" | "GDS";
  repeatedGuest: boolean;
  previousCancellations: number;
  previousBookingsNotCanceled: number;
  reservedRoomType: string;
  assignedRoomType: string;
  bookingChanges: number;
  depositType: "No Deposit" | "Non Refund" | "Refundable";
  customerType: "Transient" | "Transient-Party" | "Contract" | "Group";
  averageDailyRate: number;
  parkingSpaces: number;
  specialRequests: number;
  waitingListDays: number;
};

export type RiskLabel = "Low" | "Medium" | "High";

export type PredictionAssessment = {
  cancellationProbability: number;
  confidence: number;
  riskLabel: RiskLabel;
  recommendation: string;
};

export function classifyRisk(cancellationProbability: number): PredictionAssessment {
  const boundedProbability = Math.min(1, Math.max(0, cancellationProbability));
  const confidence = Math.max(boundedProbability, 1 - boundedProbability);
  if (boundedProbability < 0.35) {
    return { cancellationProbability: boundedProbability, confidence, riskLabel: "Low", recommendation: "Proceed with the standard confirmation journey. A light pre-arrival reminder is appropriate." };
  }
  if (boundedProbability < 0.65) {
    return { cancellationProbability: boundedProbability, confidence, riskLabel: "Medium", recommendation: "Send a timely confirmation prompt and consider a flexible incentive to secure the reservation." };
  }
  return { cancellationProbability: boundedProbability, confidence, riskLabel: "High", recommendation: "Prioritize confirmation outreach and review the deposit or overbooking strategy for this reservation." };
}

function toModelPayload(input: BookingInput) {
  return {
    hotel: input.hotel,
    lead_time: input.leadTime,
    arrival_date_year: input.arrivalYear,
    arrival_date_month: input.arrivalMonth,
    arrival_date_week_number: input.arrivalWeek,
    arrival_date_day_of_month: input.arrivalDay,
    stays_in_weekend_nights: input.weekendNights,
    stays_in_week_nights: input.weekNights,
    adults: input.adults,
    children: input.children,
    babies: input.babies,
    meal: input.meal,
    country: input.country,
    market_segment: input.marketSegment,
    distribution_channel: input.distributionChannel,
    is_repeated_guest: input.repeatedGuest ? 1 : 0,
    previous_cancellations: input.previousCancellations,
    previous_bookings_not_canceled: input.previousBookingsNotCanceled,
    reserved_room_type: input.reservedRoomType,
    assigned_room_type: input.assignedRoomType,
    booking_changes: input.bookingChanges,
    deposit_type: input.depositType,
    customer_type: input.customerType,
    adr: input.averageDailyRate,
    required_car_parking_spaces: input.parkingSpaces,
    total_of_special_requests: input.specialRequests,
    days_in_waiting_list: input.waitingListDays,
  };
}

function runPythonModel(payload: Record<string, unknown>): Promise<string> {
  const scriptPath = path.resolve(process.cwd(), "scripts", "predict.py");
  return new Promise((resolve, reject) => {
    const child = spawn("python3", [scriptPath], { stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    const timeout = setTimeout(() => {
      child.kill("SIGTERM");
      reject(new Error("The prediction service took too long to respond."));
    }, 20_000);
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", chunk => { stdout += chunk; });
    child.stderr.on("data", chunk => { stderr += chunk; });
    child.once("error", error => { clearTimeout(timeout); reject(error); });
    child.once("close", code => {
      clearTimeout(timeout);
      if (code !== 0) {
        reject(new Error(stderr || "The Python prediction service could not process this booking."));
        return;
      }
      resolve(stdout);
    });
    child.stdin.end(JSON.stringify(payload));
  });
}

export async function predictCancellation(input: BookingInput): Promise<PredictionAssessment> {
  const stdout = await runPythonModel(toModelPayload(input));
  const response = JSON.parse(stdout) as { cancellationProbability?: number; error?: string };
  if (response.error || typeof response.cancellationProbability !== "number") {
    throw new Error(response.error ?? "The prediction model returned an invalid response.");
  }
  return classifyRisk(response.cancellationProbability);
}
