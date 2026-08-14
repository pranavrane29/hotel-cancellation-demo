import { spawn } from "node:child_process";
import path from "node:path";

export type HeartInput = {
  age: number;
  sex: "M" | "F";
  chestPainType: "ATA" | "NAP" | "ASY" | "TA";
  restingBP: number;
  cholesterol: number;
  fastingBS: 0 | 1;
  restingECG: "Normal" | "ST" | "LVH";
  maxHR: number;
  exerciseAngina: "Y" | "N";
  oldpeak: number;
  stSlope: "Up" | "Flat" | "Down";
  consentAcknowledged: true;
};

export type HeartSignal = "Lower" | "Elevated";

export type HeartAssessment = {
  heartDiseaseProbability: number;
  confidence: number;
  signal: HeartSignal;
  summary: string;
  nextStep: string;
};

export function assessHeartSignal(heartDiseaseProbability: number): HeartAssessment {
  const boundedProbability = Math.min(1, Math.max(0, heartDiseaseProbability));
  const confidence = Math.max(boundedProbability, 1 - boundedProbability);
  if (boundedProbability < 0.5) {
    return {
      heartDiseaseProbability: boundedProbability,
      confidence,
      signal: "Lower",
      summary: "This model did not identify a positive pattern in the submitted screening inputs.",
      nextStep: "This is not a diagnosis or a substitute for medical care. Discuss any symptoms, concerns, or screening needs with a qualified clinician.",
    };
  }
  return {
    heartDiseaseProbability: boundedProbability,
    confidence,
    signal: "Elevated",
    summary: "This model identified a positive pattern in the submitted screening inputs.",
    nextStep: "This is not a diagnosis. A qualified clinician should evaluate this result together with symptoms, history, examination, and appropriate testing.",
  };
}

function toModelPayload(input: HeartInput) {
  return {
    Age: input.age,
    Sex: input.sex,
    ChestPainType: input.chestPainType,
    RestingBP: input.restingBP,
    Cholesterol: input.cholesterol,
    FastingBS: input.fastingBS,
    RestingECG: input.restingECG,
    MaxHR: input.maxHR,
    ExerciseAngina: input.exerciseAngina,
    Oldpeak: input.oldpeak,
    ST_Slope: input.stSlope,
  };
}

function runPythonModel(payload: Record<string, unknown>): Promise<string> {
  const scriptPath = path.resolve(process.cwd(), "scripts", "predict_heart.py");
  return new Promise((resolve, reject) => {
    const child = spawn("python3", [scriptPath], { stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    let completed = false;
    const finish = (callback: () => void) => {
      if (completed) return;
      completed = true;
      clearTimeout(timeout);
      callback();
    };
    const timeout = setTimeout(() => {
      child.kill("SIGTERM");
      finish(() => reject(new Error("The heart-risk model took too long to respond.")));
    }, 15_000);

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", chunk => { stdout += chunk; });
    child.stderr.on("data", chunk => { stderr += chunk; });
    child.once("error", error => finish(() => reject(error)));
    child.once("close", code => finish(() => {
      if (code !== 0) {
        reject(new Error(stderr || "The heart-risk model could not process these inputs."));
        return;
      }
      resolve(stdout);
    }));
    child.stdin.end(JSON.stringify(payload));
  });
}

export async function predictHeartRisk(input: HeartInput): Promise<HeartAssessment> {
  const response = JSON.parse(await runPythonModel(toModelPayload(input))) as { heartDiseaseProbability?: number; error?: string };
  if (response.error || typeof response.heartDiseaseProbability !== "number") {
    throw new Error(response.error ?? "The heart-risk model returned an invalid response.");
  }
  return assessHeartSignal(response.heartDiseaseProbability);
}
