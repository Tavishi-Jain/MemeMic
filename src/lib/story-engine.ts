import { getCharacterById } from "@/config/characters";
import { normalizeStory, validateStory } from "@/lib/validation";
import type { HumorIntensity, ScriptLanguage } from "@/lib/validation";

export type ScriptRequest = {
  story: string;
  characterId: string;
  remixInstruction?: string;
  humorIntensity?: HumorIntensity;
  language?: ScriptLanguage;
};

export function getDemoTranscript(story?: string): string {
  const seed = normalizeStory(story ?? "");

  if (seed) {
    return seed;
  }

  return "Demo transcript draft: Aaj college mein teacher ne poocha, aur maine socha, 'Bhai, ek hi sawal hai, answer kaun dega?'";
}

export function generateComedyScript({
  story,
  characterId,
  remixInstruction,
  humorIntensity = "medium",
  language = "hinglish",
}: ScriptRequest): { script: string; provider: "demo" } {
  const validStory = validateStory(story);
  const character = getCharacterById(characterId);

  const intro =
    character?.id === "harsh-gujraal"
      ? "Arre bhai, yeh toh full roast material hai."
      : character?.id === "aakaash-guptaa"
        ? "Picture this: ek normal din, jo ek full cinematic disaster bana."
        : character?.id === "zakir-khaan"
          ? "Dekho, yeh waise toh chhota incident tha, par dil se relatable hai."
          : character?.id === "veer-daas"
            ? "Log kahte hain life simple hoti hai. Yeh incident kuch aur hi proof hai."
            : character?.id === "anubhav-singh-baassi"
              ? "Yeh toh ek wohi sa incident hai jo har dost ne kabhi experience kiya hoga."
              : "Yeh incident toh bilkul normal lag raha tha, phir sequence hi ulta ho gaya.";

  const coreFacts = validStory.length > 180 ? `${validStory.slice(0, 180).trim()}...` : validStory;
  const punch =
    humorIntensity === "high"
      ? "Aur phir maine realize kiya: asli problem sirf ek aadmi nahi, poori situation thi."
      : humorIntensity === "low"
        ? "Bas ek chhota sa confusion tha, jo dil ko aur zyada confuse kar gaya."
        : "Aur phir sabko samajh aaya ki embarrassment ka asli problem hai expectation, nahi execution.";

  const remixText = remixInstruction ? ` ${remixInstruction} ` : "";
  const script = `${intro} ${coreFacts} ${remixText} ${punch} ${character?.label ?? "The comic persona"} ki tarah narration mein comedy ka punchline yeh hai: 'Main toh bas ek normal insaan tha, par life ne mujhe cleverly chhota villain bana diya.'`;

  if (language === "en") {
    return { script: script.replace(/\s+/g, " ").trim(), provider: "demo" };
  }

  return {
    script: script.replace(/\s+/g, " ").trim(),
    provider: "demo",
  };
}

export function generateRemixScript(
  originalStory: string,
  currentScript: string,
  characterId: string,
  remixInstruction: string,
): { script: string; provider: "demo" } {
  return generateComedyScript({
    story: `${originalStory} ${currentScript}`,
    characterId,
    remixInstruction,
    humorIntensity: "high",
    language: "hinglish",
  });
}
