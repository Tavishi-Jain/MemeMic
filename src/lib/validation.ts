export const MAX_RECORDING_SECONDS = 30;
export const MAX_AUDIO_SIZE_BYTES = 20 * 1024 * 1024;
export const MAX_SCRIPT_LENGTH = 5000;

export type ScriptLanguage = "hi" | "hinglish" | "en";
export type HumorIntensity = "low" | "medium" | "high";

export function normalizeStory(raw: string): string {
  return raw.replace(/\s+/g, " ").trim();
}

export function validateStory(raw: string): string {
  const cleaned = normalizeStory(raw);
  if (!cleaned) {
    throw new Error("Please add a story or recording before continuing.");
  }

  if (cleaned.length < 10) {
    throw new Error("Your story is too short. Add a few more details for a better comedy setup.");
  }

  if (cleaned.length > 2200) {
    throw new Error("Your story is a little long for this demo. Keep it under about 2200 characters.");
  }

  return cleaned;
}

export function validateCharacterId(value: string): string {
  if (!value || value.trim().length === 0) {
    throw new Error("Please choose a character before generating the performance.");
  }

  return value.trim();
}

export function validateScript(raw: string): string {
  const cleaned = normalizeStory(raw);
  if (!cleaned) {
    throw new Error("The script cannot be empty. Add a few lines or regenerate.");
  }

  if (cleaned.length > MAX_SCRIPT_LENGTH) {
    throw new Error(`Keep the script under ${MAX_SCRIPT_LENGTH} characters.`);
  }

  return cleaned;
}

export function validateScriptLanguage(value: unknown): ScriptLanguage {
  if (value === "hi" || value === "hinglish" || value === "en") {
    return value;
  }

  throw new Error("Choose Hindi, Hinglish, or English for the script.");
}

export function validateHumorIntensity(value: unknown): HumorIntensity {
  if (value === "low" || value === "medium" || value === "high") {
    return value;
  }

  throw new Error("Choose a humor intensity from the available options.");
}

export function validateRemixInstruction(value: unknown): string | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (typeof value !== "string" || value.length > 120) {
    throw new Error("Keep the style instruction under 120 characters.");
  }

  return value.trim() || undefined;
}

export function clampRecordingDuration(seconds: number): number {
  return Math.min(Math.max(seconds, 0), MAX_RECORDING_SECONDS);
}
