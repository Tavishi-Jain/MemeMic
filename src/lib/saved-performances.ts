import { getCharacterById } from "@/config/characters";
import { MAX_SCRIPT_LENGTH } from "@/lib/validation";

export const SAVED_PERFORMANCES_KEY = "mememic-saved-performances";
export const MAX_SAVED_PERFORMANCES = 25;

export type SavedPerformance = {
  id: string;
  script: string;
  characterId: string;
  savedAt: string;
};

export function parseSavedPerformances(raw: string | null): SavedPerformance[] {
  if (!raw) return [];

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(isSavedPerformance)
      .sort((first, second) => second.savedAt.localeCompare(first.savedAt))
      .slice(0, MAX_SAVED_PERFORMANCES);
  } catch {
    return [];
  }
}

function isSavedPerformance(value: unknown): value is SavedPerformance {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;

  return (
    typeof item.id === "string" &&
    item.id.length <= 80 &&
    typeof item.script === "string" &&
    item.script.trim().length > 0 &&
    item.script.length <= MAX_SCRIPT_LENGTH &&
    typeof item.characterId === "string" &&
    Boolean(getCharacterById(item.characterId)) &&
    typeof item.savedAt === "string" &&
    !Number.isNaN(Date.parse(item.savedAt))
  );
}
