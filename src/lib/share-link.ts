import { getCharacterById } from "@/config/characters";
import { MAX_SCRIPT_LENGTH } from "@/lib/validation";

export type SharedPerformance = {
  script: string;
  characterId: string;
};

export function encodeSharedPerformance(performance: SharedPerformance): string {
  const bytes = new TextEncoder().encode(JSON.stringify(performance));
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export function decodeSharedPerformance(token: string): SharedPerformance | null {
  try {
    const base64 = token.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const bytes = Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
    const parsed: unknown = JSON.parse(new TextDecoder().decode(bytes));
    if (!parsed || typeof parsed !== "object") return null;

    const performance = parsed as Record<string, unknown>;
    if (
      typeof performance.script !== "string" ||
      performance.script.trim().length === 0 ||
      performance.script.length > MAX_SCRIPT_LENGTH ||
      typeof performance.characterId !== "string" ||
      !getCharacterById(performance.characterId)
    ) {
      return null;
    }

    return { script: performance.script, characterId: performance.characterId };
  } catch {
    return null;
  }
}
